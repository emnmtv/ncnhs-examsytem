import axios from 'axios';
import { OPENROUTER_API_KEY } from './aiService';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Generate AI analysis for Mean Percentage Score (MPS) data
 * @param {Object} data - MPS data structure with exam stats and section performance
 * @param {string} analysisType - Type of analysis to generate (summary, insights, recommendations, full)
 * @returns {Promise<Object>} - AI-generated analysis results
 */
const generateAIAnalysis = async (data, analysisType = 'full') => {
  try {
    // Prepare the MPS data in a format suitable for analysis
    const examSummary = {
      exam: {
        title: data.exam.title,
        testCode: data.exam.testCode
      },
      overallMPS: data.overallMPS,
      totalStudents: data.totalStudents,
      highestScore: data.overallStats.highestPercentage || 0,
      lowestScore: data.overallStats.lowestPercentage || 0,
      distribution: data.overallStats.scoreDistribution,
      sections: data.sectionMPS.map(section => ({
        name: section.section,
        mps: section.mps,
        studentCount: section.studentCount,
        highestScore: section.highestPercentage,
        lowestScore: section.lowestPercentage,
        distribution: section.distribution
      }))
    };
    
    // Create the appropriate prompt based on analysis type
    let prompt = '';
    
    switch (analysisType) {
      case 'summary':
        prompt = `Provide a concise summary (3-4 sentences) of this exam's performance data:
        ${JSON.stringify(examSummary)}`;
        break;
      
      case 'insights':
        prompt = `Analyze this exam data and provide 3-5 key insights about student performance:
        ${JSON.stringify(examSummary)}
        
        Format your response as a JSON array of insight objects with "title" and "description" fields.`;
        break;
        
      case 'recommendations':
        prompt = `Based on this exam performance data, provide 3-5 specific teaching recommendations:
        ${JSON.stringify(examSummary)}
        
        Format your response as a JSON array of recommendation objects with "title" and "description" fields.`;
        break;
        
      case 'sectionComparison':
        prompt = `Compare the performance across different sections in this exam data:
        ${JSON.stringify(examSummary)}
        
        Identify the best and worst performing sections, analyze possible reasons for these differences,
        and suggest targeted interventions for low-performing sections.
        Format your response as a JSON object with "topSection", "bottomSection", "analysis", and "interventions" fields.`;
        break;
        
      case 'full':
      default:
        prompt = `Perform a comprehensive analysis of this exam's Mean Percentage Score (MPS) data:
        ${JSON.stringify(examSummary)}
        
        Include:
        1. A brief summary of overall performance
        2. Key insights about student performance patterns
        3. Section performance comparison (identifying strongest/weakest sections)
        4. Specific recommendations for teachers
        5. Suggestions for future assessments
        
        Format your response as a JSON object with the following structure:
        {
          "summary": "Overall exam performance summary",
          "insights": [
            {"title": "Insight title", "description": "Insight details"}
          ],
          "sectionAnalysis": {
            "topSection": "Best performing section",
            "bottomSection": "Worst performing section",
            "analysis": "Analysis of section differences"
          },
          "recommendations": [
            {"title": "Recommendation title", "description": "Recommendation details"}
          ],
          "futureSuggestions": "Suggestions for future assessments"
        }`;
        break;
    }

    // Call the AI model through OpenRouter API
    const response = await axios.post(
      API_URL,
      {
        model: "meta-llama/llama-3-8b-instruct", // Start with a free tier model
        messages: [
          {
            role: "system",
            content: "You are an expert educational data analyst specializing in analyzing exam performance metrics. Provide clear, concise, and actionable analysis based on Mean Percentage Score data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 1000,
        response_format: { type: "json_object" } // Ensure JSON output format
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'NCNHS MPS Analysis'
        }
      }
    );

    // Process the response
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiResponse = response.data.choices[0].message.content;
      
      try {
        // Attempt to parse JSON response
        const parsedResponse = JSON.parse(aiResponse);
        return {
          success: true,
          data: parsedResponse
        };
      } catch (parseError) {
        console.error('Error parsing AI response as JSON:', parseError);
        // Return the raw text if JSON parsing fails
        return {
          success: true,
          data: { rawText: aiResponse },
          jsonError: true
        };
      }
    } else {
      throw new Error('Invalid response format from AI service');
    }
  } catch (error) {
    console.error('Error generating AI analysis:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate AI analysis'
    };
  }
};

/**
 * Generate AI recommendations for improvements based on weak areas in the exam
 * @param {Object} data - MPS data with low-performing areas
 * @returns {Promise<Object>} - AI-generated recommendations
 */
const generateImprovement = async (data) => {
  try {
    // Extract weak areas (sections or topics with low MPS)
    const weakAreas = data.sectionMPS
      .filter(section => section.mps < 70) // Consider sections below 70% as weak
      .map(section => ({
        section: section.section,
        mps: section.mps,
        studentCount: section.studentCount
      }));
    
    if (weakAreas.length === 0) {
      // If no weak areas, look at the distribution for areas with most "poor" scores
      const areasWithPoorScores = data.sectionMPS
        .sort((a, b) => (b.distribution.poor || 0) - (a.distribution.poor || 0))
        .slice(0, 2) // Take top 2 sections with most poor scores
        .map(section => ({
          section: section.section,
          mps: section.mps,
          poorCount: section.distribution.poor || 0,
          studentCount: section.studentCount
        }));
      
      if (areasWithPoorScores.length === 0) {
        return {
          success: true,
          data: {
            message: "No significant weak areas identified. Overall performance is good.",
            improvements: []
          }
        };
      }
      
      // Generate improvements for these sections
      const prompt = `For this exam, these sections have the most students with poor scores (below 60%):
      ${JSON.stringify(areasWithPoorScores)}
      
      Based on this data, provide 3-5 targeted teaching strategies to help improve student performance in these sections.
      For each strategy, include a specific implementation approach and expected outcome.
      Format your response as a JSON array of objects with "strategy", "implementation", and "expectedOutcome" fields.`;
      
      const response = await callAIService(prompt);
      return response;
    }
    
    // Generate improvement recommendations for weak areas
    const prompt = `These sections show weak performance in the exam:
    ${JSON.stringify(weakAreas)}
    
    Based on this data, provide 3-5 targeted teaching strategies to help improve student performance in these sections.
    For each strategy, include a specific implementation approach and expected outcome.
    Format your response as a JSON array of objects with "strategy", "implementation", and "expectedOutcome" fields.`;
    
    const response = await callAIService(prompt);
    return response;
  } catch (error) {
    console.error('Error generating improvement recommendations:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate improvement recommendations'
    };
  }
};

/**
 * Generate AI-powered next steps based on exam results
 * @param {Object} data - MPS data
 * @returns {Promise<Object>} - AI-generated next steps
 */
const generateNextSteps = async (data) => {
  try {
    const prompt = `Based on this exam performance data:
    ${JSON.stringify({
      examTitle: data.exam.title,
      overallMPS: data.overallMPS,
      distribution: data.overallStats.scoreDistribution
    })}
    
    Provide a prioritized list of 3 next steps for the teacher to take immediately after reviewing these results.
    Each step should be specific, actionable, and directly related to improving student learning based on these results.
    Format your response as a JSON array of objects with "title", "action", and "rationale" fields.`;
    
    const response = await callAIService(prompt);
    return response;
  } catch (error) {
    console.error('Error generating next steps:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate next steps'
    };
  }
};

/**
 * Helper function to make AI API calls
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<Object>} - Processed AI response
 */
const callAIService = async (prompt) => {
  try {
    const response = await axios.post(
      API_URL,
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
          {
            role: "system",
            content: "You are an expert educational data analyst specializing in analyzing exam performance metrics. Provide clear, concise, and actionable analysis based on Mean Percentage Score data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'X-Title': 'NCNHS MPS Analysis'
        }
      }
    );

    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiResponse = response.data.choices[0].message.content;
      
      try {
        const parsedResponse = JSON.parse(aiResponse);
        return {
          success: true,
          data: parsedResponse
        };
      } catch (parseError) {
        return {
          success: true,
          data: { rawText: aiResponse },
          jsonError: true
        };
      }
    } else {
      throw new Error('Invalid response format from AI service');
    }
  } catch (error) {
    console.error('Error calling AI service:', error);
    return {
      success: false,
      error: error.message || 'Failed to get AI response'
    };
  }
};

export default {
  generateAIAnalysis,
  generateImprovement,
  generateNextSteps
}; 