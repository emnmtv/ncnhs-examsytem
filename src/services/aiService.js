import axios from 'axios';

export const OPENROUTER_API_KEY = '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';
export const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Define available models in order of preference
const AVAILABLE_MODELS = [
  "meta-llama/llama-3-8b-instruct", // Free tier model
  "deepseek/deepseek-coder-lite",   // Deepseek Coder Lite model
  "deepseek/deepseek-lite",         // Deepseek Lite model
  "mistralai/mistral-7b-instruct",  // Mistral 7B model
  "cohere/command-r-lite",          // Cohere Command-R Lite
  "perplexity/pplx-7b-online",      // Perplexity 7B with online search
  "nousresearch/nous-hermes-2-vision", // Nous Hermes with vision
  "openai/gpt-3.5-turbo",           // Fallback if available
  "anthropic/claude-instant-1.2",   // Another option
  "google/gemini-pro"               // Another fallback
];

// Function to get the current preferred model or use the default
const getCurrentModel = () => {
  const savedModel = localStorage.getItem('preferred_ai_model');
  return savedModel || AVAILABLE_MODELS[0];
};

// Function to set preferred model
export const setPreferredModel = (modelId) => {
  if (AVAILABLE_MODELS.includes(modelId)) {
    localStorage.setItem('preferred_ai_model', modelId);
    return true;
  }
  return false;
};

// Function to get all available models
export const getAvailableModels = () => {
  return AVAILABLE_MODELS.map(model => {
    const [provider, name] = model.split('/');
    return {
      id: model,
      provider,
      name
    };
  });
};

/**
 * Makes a request to the OpenRouter API with the selected model
 * @param {string} prompt - The prompt to send to the API
 * @param {string} systemPrompt - Optional system prompt to guide the model
 * @param {string} modelId - Optional model ID to use (defaults to preferred model)
 * @returns {Promise<Object>} - The API response data
 */
const callOpenRouterAPI = async (prompt, systemPrompt = "", modelId = null) => {
  // Get the preferred model or use the provided one
  const preferredModel = modelId || getCurrentModel();
  
  // Create a list of models to try, starting with the preferred model
  const modelsToTry = [preferredModel];
  
  // Add all other models as fallbacks but skip the preferred one
  AVAILABLE_MODELS.forEach(model => {
    if (model !== preferredModel) {
      modelsToTry.push(model);
    }
  });
  
  let lastError = null;
  
  for (const modelId of modelsToTry) {
    try {
      console.log(`Attempting to use model: ${modelId}`);
      console.log('Sending request to OpenRouter API with prompt:', prompt.substring(0, 100) + '...');
      
      const payload = {
        model: modelId,
        messages: [
          {
            role: "system",
            content: systemPrompt || "You are an AI assistant for an educational exam system."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1024
      };
      
      console.log('Request payload:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(
        API_URL,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin || 'http://localhost',
            'X-Title': 'NCNHS Exam System'
          }
        }
      );
      
      console.log('OpenRouter API response status:', response.status);
      
      if (!response.data || !response.data.choices || !response.data.choices[0]) {
        console.error('Invalid response format:', response.data);
        continue; // Try next model
      }
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error(`Error with model ${modelId}:`, error);
      lastError = error;
      
      // If this is a specific model error, try the next model
      if (error.response && error.response.data && 
          error.response.data.error && 
          error.response.data.error.message.includes("not a valid model ID")) {
        console.log(`Model ${modelId} not available, trying next model...`);
        continue;
      }
      
      // For other types of errors, also try the next model
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    }
  }
  
  // If we've tried all models and none worked
  if (lastError && lastError.response) {
    throw new Error(`API Error: ${lastError.response.status} - ${JSON.stringify(lastError.response.data)}`);
  } else if (lastError && lastError.request) {
    throw new Error('No response received from API after trying all available models');
  } else if (lastError) {
    throw new Error(`Request Error: ${lastError.message}`);
  } else {
    throw new Error('Failed to connect to AI service');
  }
};

/**
 * Generates exam questions based on a topic
 * @param {string} subject - The subject of the exam
 * @param {string} topic - The specific topic to generate questions about
 * @param {number} count - Number of questions to generate (default: 3)
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @param {string} questionType - Type of questions to generate (multiple_choice, true_false, enumeration)
 * @param {string} customSystemPrompt - Optional custom system prompt to override the default
 * @param {string} modelId - Optional model ID to use
 * @returns {Promise<Array>} - Array of generated questions
 */
export const generateExamQuestions = async (
  subject, 
  topic, 
  count = 3, 
  difficulty = 'medium', 
  questionType = 'multiple_choice',
  customSystemPrompt = null,
  modelId = null
) => {
  const systemPrompt = customSystemPrompt || 
    `You are an expert educator in ${subject}. You create accurate, clear, and engaging exam questions.`;
  
  const prompt = `Generate ${count} ${difficulty} ${questionType} questions about "${topic}" in ${subject}.
  
  For each question, provide:
  1. The question text
  2. ${questionType === 'multiple_choice' ? 'Four possible options (without A, B, C, D labels)' : 
     questionType === 'true_false' ? 'Whether True or False is correct' : 
     'The correct answer for enumeration'}
  3. The correct answer exactly matching one of the options text (without any label like A, B, C, etc.)
  
  Format your response as a JSON array like this:
  [
    {
      "text": "Question text here",
      "type": "${questionType === 'multiple_choice' ? 'multipleChoice' : 
                questionType === 'true_false' ? 'true_false' : 'enumeration'}",
      ${questionType === 'multiple_choice' ? 
      '"options": ["First option text", "Second option text", "Third option text", "Fourth option text"],' : ''}
      "correctAnswer": "Exact text of the correct answer"
    }
  ]
  
  VERY IMPORTANT: Return ONLY the JSON array with no additional text. Do not include backticks, code blocks, or any other formatting.`;
  
  try {
    const response = await callOpenRouterAPI(prompt, systemPrompt, modelId);
    console.log('Raw AI response:', response);
    
    // First check if the response is already a valid JSON array
    try {
      const trimmedResponse = response.trim();
      if (trimmedResponse.startsWith('[') && trimmedResponse.endsWith(']')) {
        const directParse = JSON.parse(trimmedResponse);
        if (Array.isArray(directParse) && directParse.length > 0) {
          console.log('Successfully parsed direct JSON response:', directParse.length, 'questions');
          
          // Process the questions to ensure correct answer matches an option
          if (questionType === 'multiple_choice') {
            return directParse.map(question => cleanupMultipleChoiceQuestion(question));
          }
          
          return directParse;
        }
      }
    } catch (directParseError) {
      console.log('Direct JSON parsing failed, trying JSON extraction:', directParseError);
    }
    
    // If direct parsing fails, try to extract JSON from the response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      console.log('Extracted JSON:', jsonStr);
      try {
        const questions = JSON.parse(jsonStr);
        
        // Process the questions to ensure correct answer matches an option
        if (questions && Array.isArray(questions) && questionType === 'multiple_choice') {
          return questions.map(question => cleanupMultipleChoiceQuestion(question));
        }
        
        return questions;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Attempting fallback parsing...');
        return processFallbackQuestions(fallbackToTextParsing(response), questionType);
      }
    } else {
      console.error('No JSON found in response:', response);
      console.log('Attempting fallback parsing...');
      return processFallbackQuestions(fallbackToTextParsing(response), questionType);
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
};

// Helper function to clean up multiple choice questions
function cleanupMultipleChoiceQuestion(question) {
  // If the correct answer has a letter prefix (like "a. Option"), clean it
  if (question.correctAnswer && typeof question.correctAnswer === 'string') {
    // Remove letter prefixes like "a.", "b.", etc.
    const cleanAnswer = question.correctAnswer.replace(/^[a-d]\.\s*/i, '');
    
    // Find the matching option from the options array
    if (Array.isArray(question.options)) {
      const matchingOption = question.options.find(option => 
        option.toLowerCase().trim() === cleanAnswer.toLowerCase().trim()
      );
      
      if (matchingOption) {
        question.correctAnswer = matchingOption;
      } else {
        // If no exact match, try to find the closest match
        const bestMatch = question.options.reduce((best, current) => {
          const currentSimilarity = stringSimilarity(cleanAnswer, current);
          const bestSimilarity = stringSimilarity(cleanAnswer, best);
          return currentSimilarity > bestSimilarity ? current : best;
        }, question.options[0]);
        
        question.correctAnswer = bestMatch;
      }
    }
  }
  
  // Clean up text fields with extraneous spaces
  if (question.text) {
    question.text = question.text.replace(/\s+/g, ' ').trim();
  }
  
  return question;
}

// Helper function to calculate string similarity (for finding best matches)
function stringSimilarity(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create a matrix to store the costs of operations
  const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
  
  // Initialize the matrix
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  
  // Calculate the costs
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1].toLowerCase() === str2[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,           // deletion
        matrix[i][j - 1] + 1,           // insertion
        matrix[i - 1][j - 1] + cost     // substitution
      );
    }
  }
  
  // Normalize the distance
  const maxLen = Math.max(len1, len2);
  if (maxLen === 0) return 1.0; // Both strings are empty
  
  // Return similarity (1 - normalized distance)
  return 1 - (matrix[len1][len2] / maxLen);
}

// Process and clean up fallback questions
function processFallbackQuestions(questions, questionType) {
  if (!Array.isArray(questions)) return questions;
  
  return questions.map(question => {
    // If it's multiple choice, check that the correct answer matches one of the options
    if (questionType === 'multiple_choice' && Array.isArray(question.options)) {
      // Clean the correct answer from any letter prefixes
      if (question.correctAnswer) {
        const cleanAnswer = question.correctAnswer.replace(/^[a-d]\.\s*/i, '');
        
        // Try to find a matching option
        const matchingOption = question.options.find(option => 
          option.toLowerCase().trim() === cleanAnswer.toLowerCase().trim()
        );
        
        if (matchingOption) {
          question.correctAnswer = matchingOption;
        } else if (question.options.length > 0) {
          // If no match found, use the first option as default
          question.correctAnswer = question.options[0];
        }
      }
    }
    
    return question;
  });
}

/**
 * Improves the wording of an existing question
 * @param {string} questionText - The original question text
 * @param {string} subject - The subject of the exam
 * @returns {Promise<string>} - Improved question text
 */
export const improveQuestionWording = async (questionText, subject) => {
  const systemPrompt = `You are an expert in creating clear and effective exam questions for ${subject}.`;
  
  const prompt = `Improve this ${subject} exam question while maintaining its meaning and difficulty:
  
  Original: "${questionText}"
  
  Provide only the improved version without any explanations or additional text.`;
  
  try {
    return await callOpenRouterAPI(prompt, systemPrompt);
  } catch (error) {
    console.error('Error improving question:', error);
    throw error;
  }
};

/**
 * Generates multiple choice options for a question
 * @param {string} questionText - The question text
 * @param {string} correctAnswer - The correct answer
 * @param {number} optionCount - Number of options to generate (default: 4)
 * @returns {Promise<Array>} - Array of options with the correct answer included
 */
export const generateMultipleChoiceOptions = async (questionText, correctAnswer, optionCount = 4) => {
  const systemPrompt = "You are an educational expert who creates plausible multiple choice options.";
  
  const prompt = `For the following question, generate ${optionCount - 1} plausible but incorrect options.
  
  Question: "${questionText}"
  Correct Answer: "${correctAnswer}"
  
  The incorrect options should be plausible enough to be distractors but clearly wrong to someone who knows the material.
  Format your response as a JSON array of strings containing ONLY the incorrect options.
  Do not include the correct answer in your list.`;
  
  try {
    const response = await callOpenRouterAPI(prompt, systemPrompt);
    console.log('Raw options response:', response);
    
    // Parse the JSON response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      console.log('Extracted options JSON:', jsonStr);
      
      try {
        const incorrectOptions = JSON.parse(jsonStr);
        
        // Ensure we have the correct number of options
        const options = incorrectOptions.slice(0, optionCount - 1);
        
        // Add the correct answer at a random position
        const randomPosition = Math.floor(Math.random() * (options.length + 1));
        options.splice(randomPosition, 0, correctAnswer);
        
        return options;
      } catch (parseError) {
        console.error('Options JSON parse error:', parseError);
        console.log('Attempting fallback parsing for options...');
        return fallbackToTextParsing(response, true);
      }
    } else {
      console.error('No JSON found in options response:', response);
      console.log('Attempting fallback parsing for options...');
      return fallbackToTextParsing(response, true);
    }
  } catch (error) {
    console.error('Error generating options:', error);
    throw error;
  }
};

/**
 * Detects question type and automatically generates options
 * @param {string} questionText - The question text to analyze
 * @param {number} optionCount - Number of options to generate (default: 4)
 * @param {string} modelId - Optional model ID to use
 * @returns {Promise<Object>} - Object with options array and suggested correct answer
 */
export const detectAndGenerateOptions = async (questionText, optionCount = 4, modelId = null) => {
  const systemPrompt = "You are an educational expert who analyzes questions and creates appropriate answer options.";
  
  const prompt = `Analyze this question and generate ${optionCount} plausible multiple choice options including the correct answer:
  
  Question: "${questionText}"
  
  First determine what the correct answer should be based on the question. Then create ${optionCount-1} plausible but incorrect options.
  
  Format your response as a JSON object with this structure:
  {
    "correctAnswer": "The objectively correct answer to the question",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"]
  }
  
  Place the correct answer randomly within the options array. Make sure all options are in the same format and style.`;
  
  try {
    const response = await callOpenRouterAPI(prompt, systemPrompt, modelId);
    console.log('Raw detect & generate response:', response);
    
    // Parse the JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      console.log('Extracted JSON:', jsonStr);
      
      try {
        const result = JSON.parse(jsonStr);
        return {
          correctAnswer: result.correctAnswer,
          options: result.options || []
        };
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        
        // Fallback: try to extract options and correct answer from text
        const options = fallbackToTextParsing(response, true);
        return {
          correctAnswer: options[0], // Default to first option as correct
          options: options
        };
      }
    } else {
      console.error('No JSON found in response:', response);
      
      // Fallback: generate random options
      const options = ['Option A', 'Option B', 'Option C', 'Option D'].slice(0, optionCount);
      return {
        correctAnswer: options[0],
        options: options
      };
    }
  } catch (error) {
    console.error('Error detecting and generating options:', error);
    throw error;
  }
};

/**
 * Detects question type and generates options based on question text
 * @param {string} questionText - The question text to analyze
 * @param {string} questionType - Optional predefined question type ('multipleChoice', 'true_false', 'enumeration')
 * @param {string} modelId - Optional model ID to use
 * @returns {Promise<Object>} - Question type and appropriate answer data
 */
export const detectQuestionTypeAndAnswer = async (questionText, questionType = null, modelId = null) => {
  const systemPrompt = "You are an educational expert who analyzes exam questions and provides the most appropriate answers.";
  
  let prompt;
  
  // If question type is already specified
  if (questionType) {
    if (questionType === 'multipleChoice') {
      return detectAndGenerateOptions(questionText, 4, modelId);
    } else if (questionType === 'true_false') {
      prompt = `Analyze this true/false question and determine if the statement is true or false:
      
      Question: "${questionText}"
      
      Respond with ONLY "true" or "false" based on factual correctness of the statement.`;
    } else if (questionType === 'enumeration') {
      prompt = `For this enumeration question, list the items that should be enumerated as the answer:
      
      Question: "${questionText}"
      
      Provide ONLY a comma-separated list of brief terms or short phrases (1-5 words each) that directly answer the question.
      Do NOT provide full sentences, explanations, or definitions.
      Format as: "term1, term2, term3, ..."`;
    }
  } else {
    // Detect question type and generate appropriate response
    prompt = `Analyze this exam question and determine:
    1. The most appropriate question type (multiple_choice, true_false, or enumeration)
    2. The correct answer based on the question type
    
    Question: "${questionText}"
    
    Respond in JSON format:
    {
      "detectedType": "multiple_choice|true_false|enumeration",
      "answer": ANSWER_BASED_ON_TYPE
    }
    
    For multiple_choice: "answer" should be an object with "correctAnswer" and "options" array
    For true_false: "answer" should be either "true" or "false" 
    For enumeration: "answer" should be a comma-separated string of brief terms (NOT full sentences)`;
  }
  
  try {
    const response = await callOpenRouterAPI(prompt, systemPrompt, modelId);
    console.log('Raw response for question analysis:', response);
    
    // If question type was specified, process accordingly
    if (questionType === 'true_false') {
      // Extract true or false (case insensitive)
      const answer = response.toLowerCase().includes('true') ? 'true' : 'false';
      return {
        questionType: 'true_false',
        answer: answer
      };
    } else if (questionType === 'enumeration') {
      // Clean up response to extract just the comma-separated list
      let answer = response;
      
      // Remove any explanations or other text, keeping only comma-separated terms
      if (response.includes(',')) {
        // If there are commas, try to extract just the list
        const commaList = response.match(/[\w\s-,]+(?:,\s*[\w\s-]+)+/);
        if (commaList) {
          answer = commaList[0];
        }
      }
      
      // Clean up and convert to uppercase
      answer = answer.trim().toUpperCase();
      
      return {
        questionType: 'enumeration',
        answer: answer
      };
    }
    
    // If question type wasn't specified, try to parse JSON response
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const result = JSON.parse(jsonStr);
        
        if (result.detectedType === 'multiple_choice') {
          // For multiple choice, ensure we have options and correctAnswer
          return {
            questionType: 'multipleChoice',
            options: result.answer.options || [],
            correctAnswer: result.answer.correctAnswer || ''
          };
        } else if (result.detectedType === 'true_false') {
          return {
            questionType: 'true_false',
            answer: result.answer.toLowerCase()
          };
        } else if (result.detectedType === 'enumeration') {
          return {
            questionType: 'enumeration',
            answer: result.answer.toUpperCase()
          };
        }
      }
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      
      // Fallback: try to determine from text response
      if (response.toLowerCase().includes('true') || response.toLowerCase().includes('false')) {
        return {
          questionType: 'true_false',
          answer: response.toLowerCase().includes('true') ? 'true' : 'false'
        };
      } else if (response.includes(',')) {
        return {
          questionType: 'enumeration',
          answer: response.trim().toUpperCase()
        };
      } else {
        // Default to multiple choice
        return await detectAndGenerateOptions(questionText, 4, modelId);
      }
    }
    
    // If all else fails, default to multiple choice
    return await detectAndGenerateOptions(questionText, 4, modelId);
    
  } catch (error) {
    console.error('Error detecting question type:', error);
    throw error;
  }
};

// Fallback function to handle cases where the model can't generate proper JSON
const fallbackToTextParsing = (text, isOptions = false) => {
  console.log('Attempting fallback text parsing for:', text);
  
  // First, check if text is already valid JSON
  try {
    if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('Successfully parsed valid JSON in fallback function:', parsed.length, 'items');
        return parsed;
      }
    }
  } catch (jsonError) {
    console.log('JSON parsing failed in fallback function, continuing with text parsing');
  }
  
  if (isOptions) {
    // Extract options from text format
    const options = text.split(/\n+/)
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[A-D][.)]s*/i, '').trim())
      .filter(line => line.length > 0);
    
    return options.length > 0 ? options : ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
  } else {
    // Extract questions from text format
    const questions = [];
    let currentQuestion = null;
    
    text.split('\n').forEach(line => {
      line = line.trim();
      if (line.match(/^Q(\d+)?\. /i) || line.match(/^Questions+\d+/i)) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          questionText: line.replace(/^Q(\d+)?\. /i, '').replace(/^Questions+\d+[:.s]*/i, ''),
          options: [],
          correctAnswer: ''
        };
      } else if (currentQuestion && line.match(/^[A-D][.)]/i)) {
        currentQuestion.options.push(line.replace(/^[A-D][.)]s*/i, ''));
      } else if (currentQuestion && line.match(/^Correct answer/i)) {
        currentQuestion.correctAnswer = line.replace(/^Correct answer[:]*/i, '');
      } else if (currentQuestion && line) {
        if (currentQuestion.options.length > 0) {
          currentQuestion.options[currentQuestion.options.length - 1] += ' ' + line;
        } else {
          currentQuestion.questionText += ' ' + line;
        }
      }
    });
    
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
    
    return questions.length > 0 ? questions : [{
      questionText: 'Sample question',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswer: 'Option 1'
    }];
  }
};

/**
 * Parses user input (CSV, list, or plain text) and generates structured user data for batch creation
 * @param {string} inputText - Raw input text containing user information
 * @param {string} userType - Type of users to create (student, teacher)
 * @param {Object} defaultValues - Default values to fill in when data is missing
 * @returns {Promise<Array>} - Array of parsed user objects ready for creation
 */
export const parseAndGenerateUsers = async (inputText, userType = 'student', defaultValues = {}) => {
  const systemPrompt = `You are an expert data processor for an educational system. Your job is to extract and structure user information from raw input.`;
  
  const prompt = `Parse the following list of users and convert it to structured data for a school system.
  The users are of type: ${userType}.
  
  Input text:
  ${inputText}
  
  Extract first name, last name, and other relevant information depending on the user type:
  - For students: grade level, section, LRN (if available)
  - For teachers: department, domain/subject specialization
  
  Apply these defaults for missing values:
  ${Object.entries(defaultValues).map(([key, value]) => `- ${key}: ${value}`).join('\n')}
  
  Format your response as a valid JSON array with NO additional text before or after the JSON array.
  Each object represents a user with these properties:
  - firstName (string)
  - lastName (string)
  ${userType === 'student' ? 
    '- gradeLevel (number)\n- section (string)\n- lrn (number, optional)' : 
    '- department (string)\n- domain (string)'}
  
  Example of correct response format:
  [
    {
      "firstName": "JOHN",
      "lastName": "DOE",
      ${userType === 'student' ? 
        '"gradeLevel": 10,\n      "section": "EINSTEIN",\n      "lrn": 12345678901' : 
        '"department": "SCIENCE",\n      "domain": "BIOLOGY"'}
    }
  ]
  
  Important:
  1. First and last names should be UPPERCASE
  2. All text values should be UPPERCASE except numbers
  3. If grade levels are in words ("Grade Ten"), convert to numbers (10)
  4. For missing data, use the provided defaults
  5. For LRN, ensure it's a numeric value (integer), not a string
  6. If no LRN is found, omit the field entirely (don't include it with an empty string)
  7. Provide your response ONLY as a valid JSON array with no additional explanation text`;
  
  try {
    const response = await callOpenRouterAPI(prompt, systemPrompt);
    console.log('Raw AI response for user parsing:', response);
    
    // Attempt multiple JSON extraction approaches
    let users = [];
    let parseSuccess = false;
    
    // 1. Try direct JSON parse first in case response is already clean JSON
    try {
      const trimmedResponse = response.trim();
      if (trimmedResponse.startsWith('[') && trimmedResponse.endsWith(']')) {
        users = JSON.parse(trimmedResponse);
        parseSuccess = true;
        console.log('Successfully parsed complete JSON response');
      }
    } catch (directParseError) {
      console.log('Direct JSON parse failed, trying regex extraction:', directParseError);
    }
    
    // 2. If direct parse failed, try regex extraction
    if (!parseSuccess) {
      // Try to extract JSON array using regex - look for anything between [ and ]
      const jsonMatch = response.match(/\[([\s\S]*)\]/);
      if (jsonMatch) {
        try {
          // Reconstruct the array with proper brackets
          const jsonStr = `[${jsonMatch[1]}]`;
          users = JSON.parse(jsonStr);
          parseSuccess = true;
          console.log('Successfully parsed JSON using regex extraction');
        } catch (parseError) {
          console.error('JSON regex extraction failed:', parseError);
        }
      }
    }
    
    // 3. Fallback to more aggressive cleaning
    if (!parseSuccess) {
      console.log('Attempting aggressive JSON cleaning');
      // Try to find any JSON-like content and clean it
      let possibleJson = response;
      
      // Find opening bracket
      const startIdx = possibleJson.indexOf('[');
      // Find closing bracket (from the end to handle nested brackets)
      const endIdx = possibleJson.lastIndexOf(']');
      
      if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
        possibleJson = possibleJson.substring(startIdx, endIdx + 1);
        
        try {
          users = JSON.parse(possibleJson);
          parseSuccess = true;
          console.log('Successfully parsed JSON using aggressive cleaning');
        } catch (cleaningError) {
          console.error('Aggressive JSON cleaning failed:', cleaningError);
          
          // Last resort: manually extract user data
          if (userType === 'student') {
            users = extractStudentsFromText(response);
          } else if (userType === 'teacher') {
            users = extractTeachersFromText(response);
          }
          
          parseSuccess = users.length > 0;
          console.log('Extracted users using text pattern matching:', users.length > 0);
        }
      }
    }
    
    // If we couldn't parse the JSON in any way, throw an error
    if (!parseSuccess || !users || !Array.isArray(users) || users.length === 0) {
      console.error('All JSON parsing methods failed for:', response);
      throw new Error('Could not extract valid user data from AI response');
    }
    
    // Track already used LRNs to avoid duplicates
    const usedLRNs = new Set();
    
    // Function to generate a unique LRN
    const generateUniqueLRN = (user, index) => {
      // Create a timestamp-based LRN with exactly 12 digits
      // Format: GYMDSSSSSSA where:
      // G = First digit of grade (7-9 as is, 10 as 0, 11 as 1, 12 as 2)
      // Y = Last digit of year (single digit)
      // M = Month (1-12)
      // D = Day (1-31)
      // SSSSS = Seconds since midnight (up to 86400, padded)
      // A = Attempt number (0-9)
      
      // Add slight delay to ensure uniqueness even with multiple calls
      const now = new Date();
      // Add a slight delay based on index to ensure timestamps are unique
      now.setMilliseconds(now.getMilliseconds() + index);
      
      // Map grade level to a single digit prefix
      let gradePrefix = user.gradeLevel || 7;
      if (gradePrefix === 10) gradePrefix = 0;
      else if (gradePrefix === 11) gradePrefix = 1;
      else if (gradePrefix === 12) gradePrefix = 2;
      
      // Format components for 12-digit LRN
      const year = now.getFullYear().toString().slice(-1); // Last digit of year
      const month = (now.getMonth() + 1).toString(); // 1-12
      const day = now.getDate().toString(); // 1-31
      
      // Calculate seconds since midnight for uniqueness
      const secondsSinceMidnight = Math.floor(
        (now.getHours() * 3600) + 
        (now.getMinutes() * 60) + 
        now.getSeconds() +
        (now.getMilliseconds() / 1000)
      );
      const secondsStr = secondsSinceMidnight.toString().padStart(5, '0');
      
      // Add attempt number for additional uniqueness (single digit 0-9)
      const attemptDigit = (index % 10).toString();
      
      // Create the LRN string with exactly 12 digits
      let lrn = `${gradePrefix}${year}${month}${day}${secondsStr}${attemptDigit}`;
      
      // Ensure it's exactly 12 digits (pad with zeros if needed)
      while (lrn.length < 12) {
        lrn = lrn + '0';
      }
      
      // If somehow longer than 12 digits, truncate
      if (lrn.length > 12) {
        lrn = lrn.substring(0, 12);
      }
      
      return lrn;
    };
    
    // Process and validate the user data
    return users.map((user, index) => {
      // Ensure names are uppercase
      if (user.firstName) user.firstName = user.firstName.toUpperCase();
      if (user.lastName) user.lastName = user.lastName.toUpperCase();
      
      // For students, validate grade levels
      if (userType === 'student') {
        // Convert string grade levels to numbers if needed
        if (typeof user.gradeLevel === 'string') {
          const gradeNumber = parseInt(user.gradeLevel.replace(/\D/g, ''));
          user.gradeLevel = !isNaN(gradeNumber) ? gradeNumber : defaultValues.gradeLevel || 7;
        }
        
        // Ensure grade level is within valid range (7-12 for high school)
        if (!user.gradeLevel || user.gradeLevel < 7 || user.gradeLevel > 12) {
          user.gradeLevel = defaultValues.gradeLevel || 7;
        }
        
        // Process LRN field - ensure it's a string or null, never an empty string
        if (user.lrn) {
          if (typeof user.lrn !== 'string') {
            // If it's not a string (e.g., number), convert to string
            user.lrn = user.lrn.toString();
          }
          // If lrn is empty string, set to null
          if (user.lrn === '') {
            user.lrn = null;
          }
          
          // Check if this LRN is already used
          if (user.lrn && usedLRNs.has(user.lrn)) {
            // Generate a new unique LRN
            user.lrn = generateUniqueLRN(user, index);
          }
          
          // Add the LRN to used set if it's not null
          if (user.lrn) {
            usedLRNs.add(user.lrn);
          }
        } else {
          // If lrn is undefined or falsy, generate a new one
          user.lrn = generateUniqueLRN(user, index);
          usedLRNs.add(user.lrn);
        }
        
        // Uppercase section name
        if (user.section) user.section = user.section.toUpperCase();
      }
      
      // For teachers, ensure department and domain are uppercase
      if (userType === 'teacher') {
        if (user.department) user.department = user.department.toUpperCase();
        if (user.domain) user.domain = user.domain.toUpperCase();
      }
      
      return user;
    });
  } catch (error) {
    console.error('Error parsing user data:', error);
    throw error;
  }
};

// Helper function to extract student data from text when JSON parsing fails
function extractStudentsFromText(text) {
  const students = [];
  // Split by clear delimiters like newlines or numbers at the start of lines
  const lines = text.split(/\n+/);
  
  let currentStudent = null;
  
  for (const line of lines) {
    // Skip empty lines or lines that look like headers/codes
    if (!line.trim() || line.includes('```') || line.includes('```')) continue;
    
    // Look for lines that likely start a new student entry
    if (line.match(/^\d+[.):;]|^[A-Z][a-z]+ [A-Z][a-z]+|^Name:/) || !currentStudent) {
      // Save previous student if exists
      if (currentStudent && currentStudent.firstName && currentStudent.lastName) {
        students.push(currentStudent);
      }
      
      // Start a new student
      currentStudent = {
        firstName: '',
        lastName: '',
        gradeLevel: null,
        section: '',
        lrn: null
      };
      
      // Try to extract name
      const nameParts = line.match(/([A-Za-z]+)[,\s]+([A-Za-z]+)/);
      if (nameParts) {
        currentStudent.firstName = nameParts[1];
        currentStudent.lastName = nameParts[2];
      }
    }
    
    // Extract grade level
    if (line.toLowerCase().includes('grade')) {
      const gradeMatch = line.match(/grade\s+(\d+)/i);
      if (gradeMatch && currentStudent) {
        currentStudent.gradeLevel = parseInt(gradeMatch[1]);
      }
    }
    
    // Extract section
    if (line.toLowerCase().includes('section')) {
      const sectionMatch = line.match(/section\s+([A-Za-z]+)/i);
      if (sectionMatch && currentStudent) {
        currentStudent.section = sectionMatch[1];
      }
    }
    
    // Extract LRN
    if (line.toLowerCase().includes('lrn')) {
      const lrnMatch = line.match(/lrn\s*[: -]?\s*(\d+)/i);
      if (lrnMatch && currentStudent) {
        currentStudent.lrn = parseInt(lrnMatch[1]);
      }
    }
  }
  
  // Add the last student if exists
  if (currentStudent && currentStudent.firstName && currentStudent.lastName) {
    students.push(currentStudent);
  }
  
  return students;
}

// Helper function to extract teacher data from text when JSON parsing fails
function extractTeachersFromText(text) {
  const teachers = [];
  // Split by clear delimiters like newlines or numbers at the start of lines
  const lines = text.split(/\n+/);
  
  let currentTeacher = null;
  
  for (const line of lines) {
    // Skip empty lines or lines that look like headers/codes
    if (!line.trim() || line.includes('```') || line.includes('```')) continue;
    
    // Look for lines that likely start a new teacher entry
    if (line.match(/^\d+[.):;]|^[A-Z][a-z]+ [A-Z][a-z]+|^Name:/) || !currentTeacher) {
      // Save previous teacher if exists
      if (currentTeacher && currentTeacher.firstName && currentTeacher.lastName) {
        teachers.push(currentTeacher);
      }
      
      // Start a new teacher
      currentTeacher = {
        firstName: '',
        lastName: '',
        department: '',
        domain: ''
      };
      
      // Try to extract name
      const nameParts = line.match(/([A-Za-z]+)[,\s]+([A-Za-z]+)/);
      if (nameParts) {
        currentTeacher.firstName = nameParts[1];
        currentTeacher.lastName = nameParts[2];
      }
    }
    
    // Extract department
    if (line.toLowerCase().includes('department')) {
      const deptMatch = line.match(/department\s*[: -]?\s*([A-Za-z]+)/i);
      if (deptMatch && currentTeacher) {
        currentTeacher.department = deptMatch[1];
      }
    }
    
    // Extract domain/subject
    if (line.toLowerCase().includes('domain') || line.toLowerCase().includes('subject')) {
      const domainMatch = line.match(/(domain|subject)\s*[: -]?\s*([A-Za-z]+)/i);
      if (domainMatch && currentTeacher) {
        currentTeacher.domain = domainMatch[2];
      }
    }
  }
  
  // Add the last teacher if exists
  if (currentTeacher && currentTeacher.firstName && currentTeacher.lastName) {
    teachers.push(currentTeacher);
  }
  
  return teachers;
}

/**
 * Analyzes and creates grade sections from raw input
 * @param {string} inputText - Raw input text containing grade section information
 * @returns {Promise<Array>} - Array of parsed grade section objects
 */
export const parseAndGenerateGradeSections = async (inputText) => {
  const systemPrompt = `You are an expert data processor for an educational system. Your job is to extract and structure grade-section information from raw input.`;
  
  const prompt = `Parse the following list of grade sections and convert it to structured data for a school system.
  
  Input text:
  ${inputText}
  
  Extract grade level (as a number) and section name from the input.
  
  Format your response as a valid JSON array with NO additional text before or after the JSON array.
  Each object represents a grade section with these properties:
  - grade (number between 7-12)
  - section (string)
  
  Example of correct response format:
  [
    {
      "grade": 7,
      "section": "EINSTEIN"
    },
    {
      "grade": 8,
      "section": "NEWTON"
    }
  ]
  
  Important:
  1. Section names should be UPPERCASE
  2. Grade levels should be numbers (7, 8, 9, 10, 11, 12)
  3. If grade levels are in words ("Grade Seven"), convert to numbers (7)
  4. Only include valid high school grades (7-12)
  5. Provide your response ONLY as a valid JSON array with no additional explanation text`;
  
  try {
    const response = await callOpenRouterAPI(prompt, systemPrompt);
    console.log('Raw AI response for grade section parsing:', response);
    
    // Attempt multiple JSON extraction approaches
    let sections = [];
    let parseSuccess = false;
    
    // 1. Try direct JSON parse first in case response is already clean JSON
    try {
      const trimmedResponse = response.trim();
      if (trimmedResponse.startsWith('[') && trimmedResponse.endsWith(']')) {
        sections = JSON.parse(trimmedResponse);
        parseSuccess = true;
        console.log('Successfully parsed complete JSON response for sections');
      }
    } catch (directParseError) {
      console.log('Direct JSON parse failed for sections, trying regex extraction:', directParseError);
    }
    
    // 2. If direct parse failed, try regex extraction
    if (!parseSuccess) {
      // Try to extract JSON array using regex - look for anything between [ and ]
      const jsonMatch = response.match(/\[([\s\S]*)\]/);
      if (jsonMatch) {
        try {
          // Reconstruct the array with proper brackets
          const jsonStr = `[${jsonMatch[1]}]`;
          sections = JSON.parse(jsonStr);
          parseSuccess = true;
          console.log('Successfully parsed JSON for sections using regex extraction');
        } catch (parseError) {
          console.error('JSON regex extraction failed for sections:', parseError);
        }
      }
    }
    
    // 3. Fallback to more aggressive cleaning
    if (!parseSuccess) {
      console.log('Attempting aggressive JSON cleaning for sections');
      // Try to find any JSON-like content and clean it
      let possibleJson = response;
      
      // Find opening bracket
      const startIdx = possibleJson.indexOf('[');
      // Find closing bracket (from the end to handle nested brackets)
      const endIdx = possibleJson.lastIndexOf(']');
      
      if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
        possibleJson = possibleJson.substring(startIdx, endIdx + 1);
        
        try {
          sections = JSON.parse(possibleJson);
          parseSuccess = true;
          console.log('Successfully parsed JSON for sections using aggressive cleaning');
        } catch (cleaningError) {
          console.error('Aggressive JSON cleaning failed for sections:', cleaningError);
          
          // Last resort: manually extract section data from text
          sections = extractSectionsFromText(response);
          parseSuccess = sections.length > 0;
        }
      }
    }
    
    // If we couldn't parse the JSON in any way, throw an error
    if (!parseSuccess || !sections || !Array.isArray(sections) || sections.length === 0) {
      console.error('All JSON parsing methods failed for sections:', response);
      throw new Error('Could not extract valid section data from AI response');
    }
    
    // Process and validate the section data
    return sections.map(section => {
      // Ensure section names are uppercase
      if (section.section) section.section = section.section.toUpperCase();
      
      // Convert string grade levels to numbers if needed
      if (typeof section.grade === 'string') {
        const gradeNumber = parseInt(section.grade.replace(/\D/g, ''));
        section.grade = !isNaN(gradeNumber) ? gradeNumber : 7;
      }
      
      // Ensure grade level is within valid range (7-12 for high school)
      if (!section.grade || section.grade < 7 || section.grade > 12) {
        section.grade = 7;
      }
      
      return section;
    });
  } catch (error) {
    console.error('Error parsing grade section data:', error);
    throw error;
  }
};

// Helper function to extract section data from text when JSON parsing fails
function extractSectionsFromText(text) {
  const sections = [];
  // Split by clear delimiters like newlines
  const lines = text.split(/\n+/);
  
  for (const line of lines) {
    // Skip empty lines or lines that look like headers/codes
    if (!line.trim() || line.includes('```') || line.includes('```')) continue;
    
    // Look for grade and section patterns
    const gradeMatch = line.match(/grade\s*(\d+)|(\d+)(st|nd|rd|th)?\s*grade/i);
    const sectionMatch = line.match(/section\s*[: -]?\s*([A-Za-z]+)|([A-Za-z]+)\s*section/i);
    
    // Alternative pattern: "Grade 7 - Einstein" or "7-Einstein"
    const combinedMatch = line.match(/grade\s*(\d+)\s*[: -]\s*([A-Za-z]+)|(\d+)\s*[: -]\s*([A-Za-z]+)/i);
    
    if (combinedMatch) {
      // Extract from combined pattern
      const grade = parseInt(combinedMatch[1] || combinedMatch[3]);
      const section = combinedMatch[2] || combinedMatch[4];
      
      if (grade && section) {
        sections.push({
          grade,
          section
        });
      }
    } else if (gradeMatch && sectionMatch) {
      // Extract from separate patterns
      const grade = parseInt(gradeMatch[1] || gradeMatch[2]);
      const section = sectionMatch[1] || sectionMatch[2];
      
      if (grade && section) {
        sections.push({
          grade,
          section
        });
      }
    }
  }
  
  return sections;
}

export default {
  generateExamQuestions,
  improveQuestionWording,
  generateMultipleChoiceOptions,
  detectAndGenerateOptions,
  detectQuestionTypeAndAnswer,
  parseAndGenerateUsers,
  parseAndGenerateGradeSections,
  getAvailableModels,
  setPreferredModel
}