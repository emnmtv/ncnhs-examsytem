/* eslint-disable no-useless-escape */
import aiService from './aiService';

/**
 * Handles document file processing and extracts exam questions
 */
class FileProcessingService {
  /**
   * Process an uploaded document file (PDF or DOCX) and extract questions
   * @param {File} file - The uploaded document file
   * @param {string} modelId - Optional AI model ID to use
   * @returns {Promise<Array>} - Array of extracted questions
   */
  async processDocumentFile(file, modelId = null) {
    try {
      // Step 1: Convert the file to text
      const textContent = await this.extractTextFromFile(file);
      
      // Check if the extracted text is already formatted as JSON
      if (this.isJsonString(textContent)) {
        console.log('Detected JSON formatted content in file, processing directly');
        return await this.processJsonInput(textContent);
      }
      
      // Step 2: Use direct AI extraction for more reliable results
      return await this.directAIExtraction(textContent, modelId);
    } catch (error) {
      console.error('Error processing document file:', error);
      throw error;
    }
  }

  /**
   * Process raw text input and extract questions
   * @param {string} textContent - The raw text content
   * @param {string} modelId - Optional AI model ID to use
   * @returns {Promise<Array>} - Array of extracted questions
   */
  async processTextInput(textContent, modelId = null) {
    try {
      console.log('Processing text input with model:', modelId || 'default');
      
      // First check if the input is valid JSON
      if (this.isJsonString(textContent)) {
        try {
          console.log('Input appears to be valid JSON, attempting direct JSON processing');
          const result = await this.processJsonInput(textContent);
          
          // If we successfully processed JSON and got results, return them
          if (result && result.length > 0) {
            console.log(`Successfully processed input as JSON, found ${result.length} questions`);
            return result;
          }
        } catch (jsonError) {
          console.error('Failed to process as JSON, falling back to normal processing:', jsonError);
        }
      }
      
      // If not valid JSON, check for JSON-like structure for backward compatibility
      else if (textContent.trim().startsWith('[') && textContent.trim().endsWith(']')) {
        try {
          console.log('Input appears to be JSON formatted, attempting direct JSON processing');
          const result = await this.processJsonInput(textContent);
          
          // If we successfully processed JSON and got results, return them
          if (result && result.length > 0) {
            console.log(`Successfully processed input as JSON, found ${result.length} questions`);
            return result;
          }
        } catch (jsonError) {
          console.error('Failed to process as JSON, falling back to normal processing:', jsonError);
        }
      }
      
      // If not JSON or JSON processing failed, use direct AI extraction
      return await this.directAIExtraction(textContent, modelId);
    } catch (error) {
      console.error('Error processing text input:', error);
      throw error;
    }
  }

  /**
   * Extract text content from a file (PDF or DOCX)
   * @param {File} file - The document file
   * @returns {Promise<string>} - Extracted text content
   */
  async extractTextFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const fileType = file.type || '';
          const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
          
          // For PDF files
          if (fileType === 'application/pdf' || fileExtension === '.pdf') {
            const arrayBuffer = event.target.result;
            const pdfText = await this.extractTextFromPDF(arrayBuffer);
            resolve(pdfText);
          } 
          // For DOCX files
          else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                   fileExtension === '.docx') {
            // We're no longer using the arrayBuffer for DOCX extraction
            resolve(this.extractTextFromDOCX());
          } 
          // Fallback to treating it as plain text
          else {
            resolve(event.target.result);
          }
        } catch (error) {
          reject(new Error('Failed to extract text from file: ' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      // Read as array buffer for binary formats (PDF, DOCX)
      if (file.type === 'application/pdf' || 
          file.name.endsWith('.pdf') ||
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.name.endsWith('.docx')) {
        reader.readAsArrayBuffer(file);
      } else {
        // Read as text for other formats
        reader.readAsText(file);
      }
    });
  }

  /**
   * Extract text content from a PDF file
   * @param {ArrayBuffer} arrayBuffer - The PDF file as array buffer
   * @returns {Promise<string>} - Extracted text content
   */
  async extractTextFromPDF(arrayBuffer) {
    try {
      // Use a text extraction approach that doesn't require direct PDF.js import
      // We'll use a simple approach for now that extracts basic text
      return this.extractTextUsingPDFJS(arrayBuffer);
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return "Failed to extract text from PDF. Please try a different file format.";
    }
  }

  /**
   * Use the PDF.js library from CDN to extract text
   * @param {ArrayBuffer} arrayBuffer - The PDF file data
   * @returns {Promise<string>} - Extracted text
   */
  async extractTextUsingPDFJS(arrayBuffer) {
    // Check if PDF.js script is already loaded
    if (!window.pdfjsLib) {
      // Load PDF.js from CDN
      await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js');
    }
    
    // Now use the globally available pdfjsLib
    const pdfjsLib = window.pdfjsLib;
    
    try {
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Process each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('PDF.js extraction error:', error);
      // If PDF.js fails, try a fallback method
      return this.handlePDFExtractionFallback();
    }
  }

  /**
   * Load a script dynamically
   * @param {string} src - The script URL
   * @returns {Promise} - Resolves when script is loaded
   */
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Fallback method for PDF extraction when PDF.js fails
   * This could use a server-side API or another approach
   */
  async handlePDFExtractionFallback() {
    // Simple fallback that doesn't rely on any parameters
    return "PDF content extraction failed. Please try a different file format or enter questions manually.";
  }

  /**
   * Extract text content from a DOCX file
   * @returns {Promise<string>} - Extracted text content
   */
  async extractTextFromDOCX() {
    // For simplicity, we're using a static message instead of actual extraction
    // In a real implementation, we might use a server-side API or a different library
    return "DOCX extraction is not fully implemented. Please use PDF format or enter questions manually.";
  }

  /**
   * Convert array buffer to base64 string
   * @param {ArrayBuffer} buffer - The array buffer
   * @returns {string} - Base64 string
   */
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  }

  /**
   * Analyze text content and extract exam questions
   * @param {string} textContent - The text content to analyze
   * @param {string} modelId - Optional AI model ID to use
   * @returns {Promise<Array>} - Array of extracted questions
   */
  async analyzeTextAndExtractQuestions(textContent, modelId = null) {
    try {
      console.log('Starting text analysis with model:', modelId || 'default');
      
      // First try to check if the content is already in JSON format
      if (textContent.trim().startsWith('[') && textContent.trim().endsWith(']')) {
        try {
          const parsedJson = JSON.parse(textContent.trim());
          if (Array.isArray(parsedJson) && parsedJson.length > 0 && 
              parsedJson[0].text && (parsedJson[0].type || parsedJson[0].questionType)) {
            console.log(`Found ${parsedJson.length} questions in JSON format`);
            // Apply post-processing to questions
            return this.postProcessQuestions(parsedJson);
          }
        } catch (jsonError) {
          console.log('Failed to parse content as JSON, continuing with extraction');
        }
      }
      
      // First try to parse text by applying direct extraction using regex/pattern matching
      const formattedQuestions = this.parseFormattedExamQuestions(textContent);
      
      if (formattedQuestions && formattedQuestions.length > 0) {
        console.log(`Successfully parsed ${formattedQuestions.length} questions using direct extraction`);
        // Apply post-processing to improve questions
        return this.postProcessQuestions(formattedQuestions);
      }
      
      // If direct extraction fails, try to break the text into question blocks
      const questionBlocks = this.parseTextIntoQuestionBlocks(textContent);
      console.log(`Extracted ${questionBlocks.length} question blocks for AI processing`);
      
      if (questionBlocks.length === 0) {
        // If no clear question blocks are found, try AI-based extraction on the whole text
        console.log('No clear question blocks found, trying AI extraction on whole text');
        const aiResult = await this.processWithAI(textContent, modelId);
        
        // If we got a valid array of questions, return them
        if (Array.isArray(aiResult) && aiResult.length > 0) {
          console.log(`AI extraction completed. Found ${aiResult.length} questions`);
          
          // Display the first few questions for debugging
          if (aiResult.length > 0) {
            aiResult.slice(0, 3).forEach((q, i) => {
              console.log(`Question ${i+1}\n${q.type}\n${q.text && q.text.substring(0, 100)}\n${q.options ? 'Options: ' + q.options.join(', ') : ''}\nAnswer: ${q.correctAnswer}\n`);
            });
          }
          
          // Apply post-processing to improve questions
          return this.postProcessQuestions(aiResult);
        }
        
        // If AI extraction returned empty results, try fallback extraction
        console.log('AI extraction returned empty results, trying fallback extraction');
        const fallbackQuestions = await this.fallbackExtraction(textContent, modelId);
        return this.postProcessQuestions(fallbackQuestions);
      }
      
      // Process each question block
      const questions = [];
      
      // If there's only one block and it's large, treat it as potentially containing multiple questions
      if (questionBlocks.length === 1 && questionBlocks[0].length > 200) {
        try {
          console.log('Single large block found, processing as potentially containing multiple questions');
          const questionData = await this.extractQuestionFromBlock(questionBlocks[0], modelId);
          
          if (questionData && Array.isArray(questionData)) {
            // If we got an array of questions, add all of them
            questionData.forEach(q => {
              if (q) {
                this.cleanupExtractedQuestion(q);
                questions.push(q);
              }
            });
          } else if (questionData) {
            // If we got a single question
            this.cleanupExtractedQuestion(questionData);
            questions.push(questionData);
          }
        } catch (blockError) {
          console.error('Error processing single question block:', blockError);
        }
      } else {
        // Process multiple blocks
        for (const block of questionBlocks) {
          try {
            const questionData = await this.extractQuestionFromBlock(block, modelId);
            
            if (questionData && Array.isArray(questionData)) {
              // If we got an array of questions, add all of them
              questionData.forEach(q => {
                if (q) {
                  this.cleanupExtractedQuestion(q);
                  questions.push(q);
                }
              });
            } else if (questionData) {
              // If we got a single question
              this.cleanupExtractedQuestion(questionData);
              questions.push(questionData);
            }
          } catch (blockError) {
            console.error('Error processing question block:', blockError);
            // Continue with other blocks even if one fails
          }
        }
      }
      
      console.log(`Successfully extracted ${questions.length} questions from ${questionBlocks.length} blocks`);
      
      // If we didn't extract any questions, try fallback extraction
      if (questions.length === 0) {
        console.log('No questions extracted from blocks, trying fallback extraction');
        const fallbackQuestions = await this.fallbackExtraction(textContent, modelId);
        return this.postProcessQuestions(fallbackQuestions);
      }
      
      // Display the first few questions for debugging
      if (questions.length > 0) {
        questions.slice(0, 3).forEach((q, i) => {
          console.log(`Question ${i+1}\n${q.type}\n${q.text && q.text.substring(0, 100)}\n${q.options ? 'Options: ' + q.options.join(', ') : ''}\nAnswer: ${q.correctAnswer}\n`);
        });
      }
      
      // Apply post-processing to improve questions
      return this.postProcessQuestions(questions);
    } catch (error) {
      console.error('Error analyzing text:', error);
      
      // If an error occurs, try fallback extraction as a last resort
      console.log('Error in main extraction, trying fallback extraction');
      try {
        const fallbackQuestions = await this.fallbackExtraction(textContent, modelId);
        return this.postProcessQuestions(fallbackQuestions);
      } catch (fallbackError) {
        console.error('Error in fallback extraction:', fallbackError);
        throw new Error(`Failed to analyze text: ${error.message}`);
      }
    }
  }

  /**
   * Clean up extracted question data to remove duplicated answers
   * @param {Object} questionData - The extracted question data
   */
  cleanupExtractedQuestion(questionData) {
    if (!questionData) return;
    
    // Handle multiple choice questions with potential duplicated correct answers
    if (questionData.type === 'multipleChoice' && Array.isArray(questionData.options)) {
      // If the last option is a duplicate of the correct answer, remove it
      const lastOptionIndex = questionData.options.length - 1;
      
      if (lastOptionIndex >= 0 && 
          questionData.options[lastOptionIndex] === questionData.correctAnswer &&
          questionData.options.findIndex(opt => opt === questionData.correctAnswer) < lastOptionIndex) {
        // Remove the duplicate (last option)
        questionData.options.pop();
      }
      
      // Remove any empty options
      questionData.options = questionData.options.filter(option => option && option.trim() !== '');
      
      // Check if we still have the correct answer in the options
      const hasCorrectAnswer = questionData.options.includes(questionData.correctAnswer);
      
      // If not, add it to the options
      if (!hasCorrectAnswer && questionData.correctAnswer) {
        questionData.options.push(questionData.correctAnswer);
      }
    }
  }

  /**
   * Parse text content specifically looking for formatted exam questions with embedded answers
   * @param {string} text - The text content to parse
   * @returns {Array} - Array of parsed question objects
   */
  parseFormattedExamQuestions(text) {
    const questions = [];
    
    // Identify questions in various formats including answer-embedded numbers like A1, B2, etc.
    const questionPattern = /(?:Question\s+\d+|^\s*\d+\s*\.|^\s*[A-D]\d+\s*\.)/gm;
    const matches = Array.from(text.matchAll(questionPattern));
    
    console.log(`Question pattern matching found ${matches.length} potential questions:`, matches.map(m => m[0]));
    
    for (let i = 0; i < matches.length; i++) {
      const startPos = matches[i].index;
      const endPos = (i < matches.length - 1) ? matches[i + 1].index : text.length;
      const questionBlock = text.substring(startPos, endPos).trim();
      
      // Skip if too short
      if (questionBlock.length < 20) continue;
      
      try {
        // Determine question type
        let questionType = 'multipleChoice';
        if (questionBlock.includes('True/False') || 
            (questionBlock.match(/True\s*\n/) && questionBlock.match(/False\s*\n/) && 
             !questionBlock.match(/[A-D]\)\s+True/) && !questionBlock.match(/[A-D]\)\s+False/))) {
          questionType = 'true_false';
        } else if (questionBlock.includes('Enumeration')) {
          questionType = 'enumeration';
        }
        
        // Check if the answer is embedded in the question number (like A1, B2, etc.)
        let embeddedAnswerFromNumber = '';
        const questionNumberMatch = questionBlock.match(/(?:^|\s)([A-D])\d+[\.\)]/);
        if (questionNumberMatch) {
          embeddedAnswerFromNumber = questionNumberMatch[1];
          console.log(`Found embedded answer in question number: ${embeddedAnswerFromNumber}`);
        }
        
        // Extract question text and embedded A) B) C) D) options
        let questionLines = questionBlock.split('\n');
        let questionText = '';
        let embeddedOptions = [];
        let correctAnswer = '';
        
        // First try to find a clean question with embedded options
        // Look for lines containing question text with A) B) C) D) options and "Answer:" in the same line
        const fullQuestionWithOptions = questionLines.find(line => 
          line.includes('?') && 
          line.match(/[A-D]\)/) && 
          line.match(/Answer:/)
        );
        
        if (fullQuestionWithOptions) {
          // This is the format: "What is X? A) Y B) Z C) W D) V Answer: C) W"
          
          // Extract the question text before the options
          const questionPart = fullQuestionWithOptions.split(/[A-D]\)/)[0].trim();
          questionText = questionPart;
          
          // Extract the options
          const optionsText = fullQuestionWithOptions.replace(questionPart, '');
          const optionMatches = optionsText.match(/[A-D]\)[^A-D\n]+/g) || [];
          
          embeddedOptions = optionMatches.map(opt => 
            opt.replace(/^[A-D]\)/, '').replace(/Answer:.*$/, '').trim()
          ).filter(opt => opt);
          
          // Extract the correct answer
          const answerMatch = fullQuestionWithOptions.match(/Answer:\s*([A-D])\)?\s*([^\n]*)/i);
          if (answerMatch) {
            const answerLetter = answerMatch[1];
            const letterIndex = answerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
            
            // If there's text after the letter, use it directly
            if (answerMatch[2] && answerMatch[2].trim()) {
              correctAnswer = answerMatch[2].trim();
            } 
            // Otherwise map to the corresponding option
            else if (letterIndex >= 0 && letterIndex < embeddedOptions.length) {
              correctAnswer = embeddedOptions[letterIndex];
            }
          }
        } 
        // If no embedded options in a single line, try other approaches
        else {
          // Find the main question text including any scenario/context
          let contextLines = [];
          let foundQuestion = false;
          
          for (const line of questionLines) {
            // Skip the question number/header line
            if (line.match(/^Question\s+\d+|^\s*\d+\s*\./) && !questionText) continue;
            
            // Skip empty lines
            if (!line.trim()) continue;
            
            // Skip option lines (A), B), C), D))
            if (line.match(/^[A-D]\)/)) continue;
            
            // If we haven't found the question yet, collect context/scenario lines
            if (!foundQuestion) {
              // If line contains a question mark, it's the main question
              if (line.includes('?') && !line.match(/^\d+\./)) {
                // Add this line to context (it's the actual question)
                contextLines.push(line.trim());
                foundQuestion = true;
              } else {
                // This is scenario/context text, collect it
                contextLines.push(line.trim());
              }
            }
            // If we already found the question, stop collecting
            else {
              break;
            }
          }
          
          // Join all context lines to form the complete question text
          if (contextLines.length > 0) {
            questionText = contextLines.join(' ');
          }
          
          // Look for embedded A) B) C) D) options
          const optionPattern = /[A-D]\)\s*[^A-D\n]+/g;
          const optionMatches = questionBlock.match(optionPattern) || [];
          
          if (optionMatches.length > 0) {
            embeddedOptions = optionMatches.map(opt => 
              opt.replace(/^[A-D]\)/, '').trim()
            );
            
            // Look for "Answer: X)" pattern
            const answerMatch = questionBlock.match(/Answer:\s*([A-D])\)?\s*([^\n]*)/i);
            if (answerMatch) {
              const answerLetter = answerMatch[1];
              const letterIndex = answerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
              
              // If there's text after the letter, use it directly
              if (answerMatch[2] && answerMatch[2].trim()) {
                correctAnswer = answerMatch[2].trim();
              }
              // Otherwise map to the corresponding option
              else if (letterIndex >= 0 && letterIndex < embeddedOptions.length) {
                correctAnswer = embeddedOptions[letterIndex];
              }
            }
          }
        }
        
        // If we found embedded options, use those
        let options = embeddedOptions;
        
        // If no embedded options were found, look for numbered options (1., 2., etc.)
        if (options.length === 0) {
          const numberedOptions = [];
          
          // Process each line to find numbered options
          for (const line of questionLines) {
            const numberedMatch = line.match(/^\s*(\d+)\.\s*(.*)/);
            if (numberedMatch && numberedMatch[2].trim()) {
              numberedOptions.push(numberedMatch[2].trim());
            }
          }
          
          if (numberedOptions.length > 0) {
            options = numberedOptions;
            
            // If we found a correct answer letter but not the text
            if (!correctAnswer) {
              const answerMatch = questionBlock.match(/Answer:\s*([A-D])\)/i);
              if (answerMatch) {
                const answerLetter = answerMatch[1];
                // Map from letter to number (A=1, B=2, etc.)
                const optionIndex = answerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
                
                if (optionIndex >= 0 && optionIndex < options.length) {
                  correctAnswer = options[optionIndex];
                }
              }
            }
          }
        }
        
        // Handle true/false questions specifically
        if (questionType === 'true_false') {
          options = ['True', 'False'];
          
          // Try to determine correct answer for true/false
          if (!correctAnswer) {
            // First look for direct answer text
            if (questionBlock.match(/Answer:.*true/i)) {
              correctAnswer = 'True';
            } else if (questionBlock.match(/Answer:.*false/i)) {
              correctAnswer = 'False';
            } 
            // Then look for letter answers (A or T for True, B or F for False)
            else {
              const answerMatch = questionBlock.match(/Answer:\s*([A-FT])\)?/i);
              if (answerMatch) {
                const letter = answerMatch[1].toUpperCase();
                correctAnswer = (letter === 'A' || letter === 'T') ? 'True' : 'False';
              } else {
                correctAnswer = 'True'; // Default
              }
            }
          }
        }
        
        // If we still don't have a question text, try to extract from the block
        if (!questionText) {
          // Look for text ending with question mark
          const questionMarkMatch = questionBlock.match(/([^?]+\?)/);
          if (questionMarkMatch) {
            questionText = questionMarkMatch[1].trim();
          }
        }
        
        // Clean up and sanitize the question text
        if (questionText) {
          // Remove leading question number (including answer-embedded ones like A1, B2, etc.)
          questionText = questionText.replace(/^Question\s+\d+\s*[:.\-]?\s*/i, '');
          questionText = questionText.replace(/^\d+\s*[:.\-]?\s*/i, '');
          questionText = questionText.replace(/^(?:^|\s)[A-D]\d+[\.\)]\s*/i, '');
          
          // Remove any "Multiple Choice" or "True/False" labels
          questionText = questionText.replace(/^(Multiple Choice|True\/False)\s*[:.\-]?\s*/i, '');
          
          // Remove any option text from the question
          for (const option of options) {
            if (questionText.includes(option)) {
              questionText = questionText.replace(option, '').trim();
            }
          }
          
          // Remove any "Answer: X)" pattern from the question
          const answerPattern = /Answer:\s*[A-D]\)?\s*[^\n]*/i;
          questionText = questionText.replace(answerPattern, '').trim();
          
          // Sanitize to strip inline options and appended rationales
          questionText = this.sanitizeQuestionText(questionText, questionType);
        }
        
        // Only add if we have necessary content
        if (questionText && (options.length > 0 || questionType === 'true_false')) {
          // Make sure options don't contain the answer pattern
          options = options.map(opt => opt.replace(/Answer:.*$/i, '').trim());
          
          // If we found an embedded answer in the question number, prioritize it over any other answer
          if (embeddedAnswerFromNumber && questionType === 'multipleChoice') {
            const answerLetter = embeddedAnswerFromNumber;
            const letterIndex = answerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
            
            // If the answer letter corresponds to an option, use that option
            if (letterIndex >= 0 && letterIndex < options.length) {
              const embeddedAnswer = options[letterIndex];
              if (embeddedAnswer !== correctAnswer) {
                console.log(`Overriding answer with embedded answer from question number: ${embeddedAnswerFromNumber} -> ${embeddedAnswer} (was: ${correctAnswer})`);
              }
              correctAnswer = embeddedAnswer;
            }
          }
          
          const question = {
            text: questionText,
            type: questionType,
            options: options,
            correctAnswer: correctAnswer
          };
          
          // Mark questions with embedded answers to preserve them during post-processing
          if (embeddedAnswerFromNumber) {
            question.hasEmbeddedAnswer = true;
            question.embeddedAnswerLetter = embeddedAnswerFromNumber;
          }
          
          questions.push(question);
        }
      } catch (error) {
        console.error('Error parsing formatted question:', error);
        // Continue with next question
      }
    }
    
    return questions;
  }

  /**
   * Parse text content into blocks that likely contain individual questions
   * @param {string} text - The text content to parse
   * @returns {Array<string>} - Array of question blocks
   */
  parseTextIntoQuestionBlocks(text) {
    console.log('Parsing text into question blocks...');
    
    const questionBlocks = [];
    
    // Clean up the text first
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Primary method: Split by "Question X" pattern
    const questionPattern = /Question\s+(\d+)/gi;
    const questionMatches = [...cleanText.matchAll(questionPattern)];
    
    if (questionMatches.length > 1) {
      console.log(`Found ${questionMatches.length} questions using "Question X" pattern`);
      
      for (let i = 0; i < questionMatches.length; i++) {
        const currentMatch = questionMatches[i];
        const nextMatch = questionMatches[i + 1];
        
        const startIndex = currentMatch.index;
        const endIndex = nextMatch ? nextMatch.index : cleanText.length;
        
        const questionBlock = cleanText.substring(startIndex, endIndex).trim();
        if (questionBlock.length > 20) {
          questionBlocks.push(questionBlock);
        }
      }
      
      return questionBlocks;
    }
    
    // Secondary method: Split by numbered questions (1., 2., etc.)
    const numberedPattern = /(?:^|\n)\s*(\d+)[\.\)]\s*/g;
    const numberedMatches = [...cleanText.matchAll(numberedPattern)];
    
    if (numberedMatches.length > 1) {
      console.log(`Found ${numberedMatches.length} questions using numbered pattern`);
      
      for (let i = 0; i < numberedMatches.length; i++) {
        const currentMatch = numberedMatches[i];
        const nextMatch = numberedMatches[i + 1];
        
        const startIndex = currentMatch.index;
        const endIndex = nextMatch ? nextMatch.index : cleanText.length;
        
        const questionBlock = cleanText.substring(startIndex, endIndex).trim();
        if (questionBlock.length > 20) {
          questionBlocks.push(questionBlock);
        }
      }
      
      return questionBlocks;
    }
    
    // Tertiary method: Split by "Answer:" pattern and work backwards
    const answerPattern = /Answer:\s*[A-D]\)/gi;
    const answerMatches = [...cleanText.matchAll(answerPattern)];
    
    if (answerMatches.length > 1) {
      console.log(`Found ${answerMatches.length} questions using Answer pattern`);
      
      let lastEnd = 0;
      for (let i = 0; i < answerMatches.length; i++) {
        const currentMatch = answerMatches[i];
        const endIndex = currentMatch.index + currentMatch[0].length;
        
        const questionBlock = cleanText.substring(lastEnd, endIndex).trim();
        if (questionBlock.length > 20) {
          questionBlocks.push(questionBlock);
        }
        
        lastEnd = endIndex;
      }
      
      return questionBlocks;
    }
    
    // Final fallback: Split by common question indicators
    const lines = cleanText.split(/\n+/);
    let currentBlock = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this line starts a new question
      if (/^\d+[\.\)]\s+|^Question\s+\d+/i.test(trimmedLine)) {
        if (currentBlock.length > 20) {
          questionBlocks.push(currentBlock.trim());
        }
        currentBlock = trimmedLine;
      } else if (trimmedLine) {
        currentBlock += ' ' + trimmedLine;
      }
    }
    
    // Add the last block
    if (currentBlock.length > 20) {
      questionBlocks.push(currentBlock.trim());
    }
    
    console.log(`Final result: ${questionBlocks.length} question blocks found`);
    return questionBlocks;
  }

  /**
   * Extract a question from a single text block
   * @param {string} block - The question block text
   * @param {string} modelId - Optional AI model ID to use
   * @returns {Object|null} - Extracted question object or null if extraction fails
   */
  async extractQuestionFromBlock(block, modelId = null) {
    try {
      // Clean up the block
      const cleanedBlock = block.trim();
      
      // Skip if block is too short
      if (cleanedBlock.length < 15) {
        return null;
      }
      
      // Prepare prompt for AI
      const prompt = `Extract the exam question from this text block:
      
      "${cleanedBlock}"
      
      IMPORTANT: Include ALL context, scenario, and background information in the question text. 
      If there's a scenario or explanation before the actual question, include it all.
      
      SPECIAL NOTE: Sometimes the answer is embedded in the question number (like A1, B2, etc.).
      If you see a question number like A1, B2, C3, or D4, the letter (A, B, C, or D) might be the correct answer.
      
      Identify:
      1. Complete question text (including any scenario, context, or background information)
      2. Question type (multiple choice, true/false, enumeration)
      3. Options (if multiple choice)
      4. Correct answer (check if it's embedded in the question number)
      
      Format as JSON:
      {
        "text": "complete question text including scenario/context",
        "type": "multipleChoice|true_false|enumeration",
        "options": ["option1", "option2", ...] (for multiple choice only),
        "correctAnswer": "correct answer"
      }`;
      
      // Use AI to extract question data
      const result = await this.processWithAI(prompt, modelId);
      
      if (result && Array.isArray(result) && result.length > 0) {
        // Return all results instead of just the first one
        return result;
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting question from block:', error);
      return null;
    }
  }

  /**
   * Process text content with AI to extract questions
   * @param {string} prompt - The prompt for the AI
   * @param {string} modelId - Optional AI model ID to use
   * @returns {Promise<Array>} - Array of extracted questions
   */
  async processWithAI(prompt, modelId = null) {
    try {
      console.log('Sending prompt to AI service...');
      
      // Prepare the AI prompt - make it extremely clear and explicit
      const aiPrompt = `Extract exam questions from the following text. For each question:
      
      CRITICAL: Include ALL scenario, context, and background information in the question text.
      If a question has a scenario or explanation before the actual question, include it all.
      
      SPECIAL: Sometimes the answer is embedded in the question number (like A1, B2, etc.).
      If you see a question number like A1, B2, C3, or D4, the letter (A, B, C, or D) might be the correct answer.
      
      1. Extract the COMPLETE question text including any scenario/context/explanations
      2. Determine the question type:
         - "multipleChoice" for questions with options
         - "true_false" for true/false questions
         - "enumeration" for short answer questions
         - "essay" for open-ended questions requiring a written response
      3. For multiple choice, extract all options
      4. Identify the correct answer (including checking question numbers for embedded answers). For essay, leave correctAnswer empty and do not include options.
      
      Format your response as a valid JSON array like this:
      [
        {
          "text": "What is the capital of France?",
          "type": "multipleChoice",
          "options": ["London", "Berlin", "Paris", "Madrid"],
          "correctAnswer": "Paris"
        },
        {
          "text": "The Earth is flat.",
          "type": "true_false",
          "correctAnswer": "false"
        }
      ]
      
      IMPORTANT: Return ONLY the JSON array without any explanations or other text.
      IMPORTANT: If you can't extract any questions, return an array with at least one placeholder question.
      
      Text to analyze:
      ${prompt.substring(0, 15000)}`;
      
      // Use AI service to process the prompt with the specified model
      console.log('Using AI model:', modelId || 'default');
      const response = await aiService.generateExamQuestions(
        "General", 
        aiPrompt,
        0, 
        "medium", 
        "multiple_choice",
        "You are an expert exam extraction system. Output ONLY valid JSON without any additional text.",
        modelId
      );
      
      console.log('AI service returned response type:', typeof response);
      
      // If the response is already a valid array, return it
      if (Array.isArray(response)) {
        console.log('Response is already an array with', response.length, 'items');
        
        // If array is empty, return a placeholder question
        if (response.length === 0) {
          console.log('AI returned empty array, generating placeholder question');
          return this.generatePlaceholderQuestions(prompt);
        }
        
        // Process and standardize each question
        return this.standardizeQuestions(response);
      }
      
      // If response is not an array, try to extract JSON from it
      if (typeof response === 'string') {
        console.log('Response is string, length:', response.length);
        console.log('Response sample:', response.substring(0, 200));
        
        // Try to parse the response as JSON
        try {
          // First, try direct JSON parsing in case it's a clean JSON string
          try {
            const trimmedResponse = response.trim();
            if (trimmedResponse.startsWith('[') && trimmedResponse.endsWith(']')) {
              const directParse = JSON.parse(trimmedResponse);
              if (Array.isArray(directParse)) {
                console.log('Successfully parsed complete JSON response');
                
                // Check if array is empty
                if (directParse.length === 0) {
                  console.log('Parsed empty array, generating placeholder question');
                  return this.generatePlaceholderQuestions(prompt);
                }
                
                return this.standardizeQuestions(directParse);
              }
            }
          } catch (directError) {
            console.log('Direct JSON parsing failed, trying regex extraction');
          }
          
          // Look for JSON array in the response
          const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            console.log('Extracted JSON:', jsonStr.substring(0, 200));
            
            const questions = JSON.parse(jsonStr);
            
            if (Array.isArray(questions)) {
              console.log('Successfully parsed JSON array with', questions.length, 'questions');
              
              // Check if array is empty
              if (questions.length === 0) {
                console.log('Extracted empty array, generating placeholder question');
                return this.generatePlaceholderQuestions(prompt);
              }
              
              // Process and standardize the questions
              return this.standardizeQuestions(questions);
            }
          } else {
            console.error('No JSON array found in response');
          }
        } catch (jsonError) {
          console.error('Error parsing AI response as JSON:', jsonError);
        }
      }
      
      // If we get here, fallback to manual extraction
      console.log('Using fallback extraction method');
      return this.fallbackExtraction(prompt, modelId);
    } catch (error) {
      console.error('Error in AI processing:', error);
      return this.fallbackExtraction(prompt, modelId);
    }
  }
  
  /**
   * Generate placeholder questions when extraction fails
   * @param {string} text - The original text
   * @returns {Array} - Array with placeholder questions
   */
  generatePlaceholderQuestions(text) {
    console.log('Generating placeholder questions from text');
    
    // Create a basic placeholder question
    const placeholders = [{
      text: "What is the main topic discussed in the text?",
      type: "multipleChoice",
      options: [
        "Science",
        "History",
        "Mathematics",
        "Literature"
      ],
      correctAnswer: "Science"
    }];
    
    // Try to extract some text chunks to create additional questions
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length > 0) {
      // Take up to 2 sentences to create questions
      sentences.slice(0, 2).forEach(sentence => {
        const cleanSentence = sentence.trim();
        if (cleanSentence.length > 30) {
          placeholders.push({
            text: `What is the meaning of: "${cleanSentence.substring(0, 100)}..."?`,
            type: "multipleChoice",
            options: [
              "Option A",
              "Option B",
              "Option C",
              "Option D"
            ],
            correctAnswer: "Option A"
          });
        }
      });
    }
    
    console.log(`Generated ${placeholders.length} placeholder questions`);
    return placeholders;
  }

  /**
   * Standardize the format of extracted questions
   * @param {Array} questions - The questions to standardize
   * @returns {Array} - Standardized questions
   */
  standardizeQuestions(questions) {
    if (!Array.isArray(questions)) {
      console.error('Expected array of questions but got:', typeof questions);
      return [];
    }
    
    console.log(`Processing ${questions.length} extracted questions:`, JSON.stringify(questions.slice(0, 2)));
    
        // Process each question to ensure it has the correct format
        const standardizedQuestions = questions.map((q) => {
          // Skip if question is null or undefined
          if (!q) {
            console.log(`Question is null or undefined`);
            return null;
          }
          
          // Skip AI enhancement for questions with embedded answers
          if (q.hasEmbeddedAnswer) {
            console.log(`Preserving embedded answer for question: ${q.text.substring(0, 30)}...`);
            return q;
          }
      
      try {
        // Create a standardized question object with fallbacks for everything
        const standardizedQuestion = {
          text: (q.text || q.questionText || q.question || "").trim(),
          type: this.mapQuestionType(q.type || q.questionType || ""),
          options: Array.isArray(q.options) ? [...q.options] : [],
          correctAnswer: (q.correctAnswer || q.answer || "").toString().trim()
        };

        // Sanitize question text coming from AI to remove appended rationales/inline options
        standardizedQuestion.text = this.sanitizeQuestionText(standardizedQuestion.text, standardizedQuestion.type);
        
        // Ensure we have question text
        if (!standardizedQuestion.text || standardizedQuestion.text.length < 3) {
          console.log(`Question has invalid text:`, standardizedQuestion.text);
          return null;
        }
        
        // Handle true/false answers (ensure lowercase)
        if (standardizedQuestion.type === 'true_false') {
          standardizedQuestion.correctAnswer = standardizedQuestion.correctAnswer.toString().toLowerCase();
          // Ensure correctAnswer is either "true" or "false"
          if (standardizedQuestion.correctAnswer.toLowerCase().includes('true')) {
            standardizedQuestion.correctAnswer = 'true';
          } else {
            standardizedQuestion.correctAnswer = 'false';
          }
        }
        
        // Process options for multiple choice
        if (standardizedQuestion.type === 'multipleChoice') {
          // If no options provided, create defaults
          if (!Array.isArray(standardizedQuestion.options) || standardizedQuestion.options.length < 2) {
            standardizedQuestion.options = ['Option A', 'Option B', 'Option C', 'Option D'];
          }
          
          // Clean up the options and remove any empty options
          standardizedQuestion.options = standardizedQuestion.options
            .map(opt => opt ? opt.toString().trim() : '')
            .filter(opt => opt !== '');
          
          // Ensure we have at least 2 options
          if (standardizedQuestion.options.length < 2) {
            standardizedQuestion.options = ['Option A', 'Option B', 'Option C', 'Option D'];
          }
          
          // Make sure correctAnswer is one of the options
          if (standardizedQuestion.correctAnswer && 
              !standardizedQuestion.options.includes(standardizedQuestion.correctAnswer)) {
            // Try to find a matching option
            const matchingOption = standardizedQuestion.options.find(opt => 
              opt.toLowerCase() === standardizedQuestion.correctAnswer.toLowerCase()
            );
            
            if (matchingOption) {
              standardizedQuestion.correctAnswer = matchingOption;
            } else {
              // If no match, set it to the first option
              standardizedQuestion.correctAnswer = standardizedQuestion.options[0];
            }
          } else if (!standardizedQuestion.correctAnswer) {
            // If no correct answer, set to first option
            standardizedQuestion.correctAnswer = standardizedQuestion.options[0];
          }
        }
        
        // For enumeration, ensure we have a correctAnswer
        if (standardizedQuestion.type === 'enumeration' && !standardizedQuestion.correctAnswer) {
          standardizedQuestion.correctAnswer = "ANSWER REQUIRED";
        }
        
        console.log(`Standardized question:`, standardizedQuestion.type, standardizedQuestion.text.substring(0, 30));
        return standardizedQuestion;
    } catch (error) {
        console.error(`Error standardizing question:`, error);
      return null;
    }
    }).filter(q => q !== null);
    
    console.log(`Successfully standardized ${standardizedQuestions.length} questions`);
    return standardizedQuestions;
  }

  /**
   * Fallback extraction when primary AI method fails
   * @param {string} originalPrompt - The original prompt
   * @param {string} modelId - Optional AI model ID to use
   * @returns {Promise<Array>} - Array of extracted questions
   */
  async fallbackExtraction(originalPrompt, modelId = null) {
    try {
      console.log('Using fallback extraction method...');
      
      // Create a simpler prompt that might work better
      const fallbackPrompt = `I need to extract exam questions from this text. Extract each question with:
      
      1. Question text
      2. Question type (multiple choice, true/false, or enumeration)
      3. Options for multiple choice questions
      4. Correct answer
      
      Here's an example of the format I need:
      [
        {
          "text": "What is 2+2?",
          "type": "multipleChoice",
          "options": ["3", "4", "5", "6"],
          "correctAnswer": "4"
        }
      ]
      
      IMPORTANT: Return ONLY a valid JSON array with no other text.
      
      Text to analyze:
      ${originalPrompt.substring(0, 5000)}`;
      
      // Try with a different model if one is not specified
      const fallbackModelId = modelId || "meta-llama/llama-3-8b-instruct";
      
      console.log('Attempting fallback with model:', fallbackModelId);
      
      // Try a different API call approach
      try {
        const response = await aiService.callOpenRouterAPI(
          fallbackPrompt,
          "You are an expert at extracting structured data from text. Return only valid JSON.",
          fallbackModelId
        );
        
        if (response) {
          console.log('Fallback AI returned response of length:', response.length);
          
          // Try to parse the response as JSON
          try {
            // First try direct parsing
            try {
              const directParse = JSON.parse(response.trim());
              if (Array.isArray(directParse) && directParse.length > 0) {
                console.log('Successfully parsed fallback response directly');
                return this.standardizeQuestions(directParse);
              }
            } catch (directError) {
              console.log('Direct parsing of fallback response failed');
            }
            
            // Try regex extraction
            const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
            if (jsonMatch) {
              const questions = JSON.parse(jsonMatch[0]);
              
              if (Array.isArray(questions) && questions.length > 0) {
                console.log('Successfully extracted questions from fallback response');
                return this.standardizeQuestions(questions);
              }
            }
          } catch (jsonError) {
            console.error('Error parsing fallback response:', jsonError);
          }
        }
      } catch (apiError) {
        console.error('Error with fallback API call:', apiError);
      }
      
      // Last resort: try to create some basic questions from the text
      console.log('Creating basic questions as last resort');
      
      // Split the text into paragraphs and create basic questions
      const paragraphs = originalPrompt.split(/\n\s*\n/).filter(p => p.trim().length > 20);
      
      if (paragraphs.length > 0) {
        // Take up to 5 paragraphs to create questions
        const basicQuestions = paragraphs.slice(0, 5).map(paragraph => {
          // Clean up paragraph
          const cleanParagraph = paragraph.replace(/\s+/g, ' ').trim();
          
          // Create a simple question
          return {
            text: `Read and answer based on this text: "${cleanParagraph.substring(0, 100)}..."`,
            type: 'multipleChoice',
            options: [
              'Option A',
              'Option B',
              'Option C',
              'Option D'
            ],
            correctAnswer: 'Option A'
          };
        });
        
        console.log('Created', basicQuestions.length, 'basic questions as fallback');
        return basicQuestions;
      }
      
      // If all else fails, return a single placeholder question
      return [{
        text: "Failed to extract questions. Please try another text or format.",
        type: 'multipleChoice',
        options: ['Try different text', 'Use manual entry', 'Try different AI model', 'Contact support'],
        correctAnswer: 'Try different text'
      }];
    } catch (error) {
      console.error('Error in fallback extraction:', error);
      
      // Return placeholder question in case of error
      return [{
        text: "Error extracting questions. Please try again with different text.",
        type: 'multipleChoice',
        options: ['Try again', 'Manual entry', 'Different text', 'Contact support'],
        correctAnswer: 'Try again'
      }];
    }
  }

  /**
   * Maps various question type formats to standardized types
   * @param {string} type - The question type to map
   * @returns {string} - The standardized question type
   */
  mapQuestionType(type) {
    if (!type) return 'multipleChoice';
    
    const typeLower = type.toLowerCase();
    
    // Map multiple choice variations
    if (typeLower.includes('multiple') || typeLower.includes('choice') || typeLower === 'mcq') {
      return 'multipleChoice';
    }
    
    // Map true/false variations
    if (typeLower.includes('true') || typeLower.includes('false') || typeLower === 'tf' || typeLower === 'truefalse' || typeLower === 'true_false') {
      return 'true_false';
    }
    
    // Map enumeration variations
    if (typeLower.includes('enum') || typeLower.includes('list') || typeLower.includes('short') || typeLower.includes('answer')) {
      return 'enumeration';
    }

    // Map essay variations
    if (typeLower.includes('essay') || typeLower.includes('open') || typeLower.includes('constructed') || typeLower.includes('free')) {
      return 'essay';
    }
    
    // Default to multiple choice
    return 'multipleChoice';
  }

  /**
   * Post-process and refine extracted questions to improve quality
   * @param {Array} questions - The extracted questions to process
   * @returns {Promise<Array>} - Improved questions
   */
  async postProcessQuestions(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      return questions;
    }

    console.log(`Post-processing ${questions.length} questions for quality improvement`);
    
    try {
      // For each question, check if it needs improvement
      const improvedQuestions = [];
      
      for (const question of questions) {
        let improvedQuestion = { ...question };
        
        // Check if question text needs improvement
        if (improvedQuestion.text) {
          // Sanitize to keep scenario+stem only and strip rationales/inline options
          improvedQuestion.text = this.sanitizeQuestionText(improvedQuestion.text, improvedQuestion.type);
          // Fix merged words without spaces
          improvedQuestion.text = this.fixMergedWords(improvedQuestion.text);
            
          // Check for missing question marks
          if (!improvedQuestion.text.includes('?') && 
              !improvedQuestion.text.endsWith('.') && 
              improvedQuestion.text.length > 10 && 
              improvedQuestion.type !== 'true_false') {
            improvedQuestion.text = improvedQuestion.text + '?';
          }
          
          // Clean up any numbering at the beginning
          improvedQuestion.text = improvedQuestion.text.replace(/^(\d+[\.\)]\s*|Question\s+\d+[\.:]\s*|Multiple Choice\s*)/i, '');
          
          // Capitalize first letter
          if (improvedQuestion.text.length > 0) {
            improvedQuestion.text = improvedQuestion.text.charAt(0).toUpperCase() + improvedQuestion.text.slice(1);
          }
        }
        
        // Improve multiple choice options
        if (improvedQuestion.type === 'multipleChoice' && Array.isArray(improvedQuestion.options)) {
          // Fix formatting issues in options
          improvedQuestion.options = improvedQuestion.options.map(option => {
            if (!option) return '';
            
            // Fix merged words without spaces
            let fixed = this.fixMergedWords(option);
            
            // Clean up the option text
            return fixed
              .replace(/^[a-z0-9][\.\)]\s*/i, '')  // Remove prefixes like "1." or "a)"
              .trim();
          });
          
          // Check for generic placeholder options
          const hasGenericOptions = improvedQuestion.options.some(opt => 
            opt.match(/^Option [A-D]$/i)
          );
          
          // Flag for AI enhancement if we have generic options
          improvedQuestion.needsAIEnhancement = hasGenericOptions;
          
          // Remove empty options
          improvedQuestion.options = improvedQuestion.options.filter(opt => opt && opt.trim() !== '');
          
          // Remove duplicate options
          const uniqueOptions = [];
          const seenOptions = new Set();
          
          for (const option of improvedQuestion.options) {
            const normalizedOption = option.toLowerCase();
            if (!seenOptions.has(normalizedOption)) {
              seenOptions.add(normalizedOption);
              uniqueOptions.push(option);
            }
          }
          
          improvedQuestion.options = uniqueOptions;
          
          // Check if options are too short or incomplete
          improvedQuestion.options = improvedQuestion.options.filter(opt => 
            opt.length > 1 && !opt.match(/^(Law of|Marie|Strong)$/i)
          );
          
          // Ensure we have at least 2 options
          if (improvedQuestion.options.length < 2) {
            improvedQuestion.options = ['Option A', 'Option B', 'Option C', 'Option D'];
            improvedQuestion.needsAIEnhancement = true;
          }
          
          // Process the correct answer
          if (improvedQuestion.correctAnswer) {
            // Fix merged words in the correct answer
            improvedQuestion.correctAnswer = this.fixMergedWords(improvedQuestion.correctAnswer);
              
            // Make sure correctAnswer is one of the options
            if (!improvedQuestion.options.includes(improvedQuestion.correctAnswer)) {
              // Try different case matching
              const matchingOption = improvedQuestion.options.find(opt => 
                opt.toLowerCase() === improvedQuestion.correctAnswer.toLowerCase()
              );
              
              if (matchingOption) {
                improvedQuestion.correctAnswer = matchingOption;
              } else {
                // Try to find the most similar option based on string similarity
                let bestMatch = null;
                let bestScore = 0;
                
                for (const option of improvedQuestion.options) {
                  // Calculate simple similarity score (shared character sequences)
                  const correctAnswerLower = improvedQuestion.correctAnswer.toLowerCase();
                  const optionLower = option.toLowerCase();
                  
                  // If option contains the answer or vice versa
                  if (optionLower.includes(correctAnswerLower) || correctAnswerLower.includes(optionLower)) {
                    const score = Math.min(optionLower.length, correctAnswerLower.length) / 
                                 Math.max(optionLower.length, correctAnswerLower.length);
                    
                    if (score > bestScore) {
                      bestScore = score;
                      bestMatch = option;
                    }
                  }
                }
                
                // If we found a reasonable match
                if (bestMatch && bestScore > 0.5) {
                  improvedQuestion.correctAnswer = bestMatch;
                } else {
                  // If no match, flag for AI enhancement
                  improvedQuestion.needsAIEnhancement = true;
                  improvedQuestion.correctAnswer = improvedQuestion.options[0]; // Temporary
                }
              }
            }
          } else {
            // If no correct answer provided, flag for AI enhancement
            improvedQuestion.needsAIEnhancement = true;
            improvedQuestion.correctAnswer = improvedQuestion.options[0]; // Temporary
          }
        }
        
        // Handle true/false questions
        if (improvedQuestion.type === 'true_false') {
          // Ensure options are exactly "True" and "False"
          improvedQuestion.options = ['True', 'False'];
          
          // Ensure correctAnswer is lowercase true or false
          if (typeof improvedQuestion.correctAnswer === 'string') {
            if (improvedQuestion.correctAnswer.toLowerCase().includes('true')) {
              improvedQuestion.correctAnswer = 'true';
            } else {
              improvedQuestion.correctAnswer = 'false';
            }
          } else if (typeof improvedQuestion.correctAnswer === 'boolean') {
            improvedQuestion.correctAnswer = improvedQuestion.correctAnswer ? 'true' : 'false';
          } else {
            // If no answer, flag for AI enhancement
            improvedQuestion.needsAIEnhancement = true;
            improvedQuestion.correctAnswer = 'true'; // Temporary
          }
        }
        
        // Fix enumeration answers
        if (improvedQuestion.type === 'enumeration' && improvedQuestion.correctAnswer) {
          // Fix merged words without spaces
          improvedQuestion.correctAnswer = this.fixMergedWords(improvedQuestion.correctAnswer).toUpperCase();
            
          // Check if answer is too short or incomplete
          if (improvedQuestion.correctAnswer.length < 2 || 
              improvedQuestion.correctAnswer.match(/^(LAW OF|MARIE|STRONG)$/)) {
            improvedQuestion.needsAIEnhancement = true;
            improvedQuestion.correctAnswer = "ANSWER REQUIRED";
          }
        }
        
        // Skip questions with incomplete information
        if (improvedQuestion.text && 
            improvedQuestion.text.length > 5 && 
            ((improvedQuestion.type === 'multipleChoice' && improvedQuestion.options.length >= 2) || 
             improvedQuestion.type !== 'multipleChoice')) {
          improvedQuestions.push(improvedQuestion);
        }
      }
      
      // Use AI to enhance questions with missing or generic answers
      const enhancedQuestions = await this.enhanceIncompleteQuestions(improvedQuestions);
      
      // Use AI to validate and correct factual questions
      const validatedQuestions = await this.validateQuestionsWithAI(enhancedQuestions);
      
      console.log(`Post-processing complete. Improved ${validatedQuestions.length} questions`);
      return validatedQuestions;
      
    } catch (error) {
      console.error('Error in post-processing questions:', error);
      // Return original questions if post-processing fails
      return questions;
    }
  }
  
  /**
   * Fix merged words that are missing spaces
   * @param {string} text - The text to fix
   * @returns {string} - Text with spaces added between words
   */
  fixMergedWords(text) {
    if (!text) return '';
    
    // First normalize spaces
    let fixedText = text.replace(/\s+/g, ' ').trim();
    
    // Fix specific common typos that show up in the data
    fixedText = fixedText
      .replace(/bloo d/g, 'blood')
      .replace(/1 00/g, '100')
      .replace(/(\d+) (\d+)/g, '$1$2'); // Join split numbers like "1 00" -> "100"
    
    // Fix common merged word patterns
    
    // Pattern 1: Capital letter in the middle of a word indicates a new word
    fixedText = fixedText.replace(/([a-z])([A-Z])/g, '$1 $2');
    
    // Pattern 2: Number next to a letter
    fixedText = fixedText.replace(/([a-zA-Z])(\d)/g, '$1 $2');
    fixedText = fixedText.replace(/(\d)([a-zA-Z])/g, '$1 $2');
    
    // Pattern 3: Fix overly long words (likely merged)
    const words = fixedText.split(' ');
    const fixedWords = words.map(word => {
      // Skip short words, numbers, chemical formulas, etc.
      if (word.length < 12 || /^\d+([.,]\d+)?$/.test(word) || /^[A-Z][a-z]?[0-9]*$/.test(word)) {
        return word;
      }
      
      // Try to split long words at logical points, but be more conservative
      let fixedWord = word.replace(/([a-z])([A-Z])/g, '$1 $2');
      
      // Only split on vowel patterns if the word is very long and likely merged
      if (word.length > 20) {
        fixedWord = fixedWord.replace(/([^aeiou])([aeiou])/g, (match, p1, p2) => {
          // Only add space if not at the beginning and not following another vowel
          if (word.indexOf(match) > 3) {
            return `${p1} ${p2}`;
          }
          return match;
        });
      }
      
      return fixedWord;
    });
    
    return fixedWords.join(' ');
  }
  
  /**
   * Sanitize question text by removing explanations/rationales and inline options.
   * Keeps scenario/context and the main question stem only.
   * @param {string} text - Raw question text
   * @param {string} questionType - Question type
   * @returns {string}
   */
  sanitizeQuestionText(text, questionType) {
    if (!text) return '';
    let sanitized = text.replace(/\s+/g, ' ').trim();
    
    // If options appear inline like "A. ... B. ..." or "A) ... B) ...", cut before the first option marker
    const inlineOptionIdx = sanitized.search(/(?:^|\s)[A-D][\.\)]\s/);
    if (inlineOptionIdx > -1) {
      sanitized = sanitized.substring(0, inlineOptionIdx).trim();
    }
    
    // Prefer taking only up to the first question mark for MC/TF to avoid appended rationales.
    // If no question mark exists, trim to the first sentence period.
    if (questionType === 'multipleChoice' || questionType === 'true_false') {
      const qmIndex = sanitized.indexOf('?');
      if (qmIndex !== -1) {
        sanitized = sanitized.substring(0, qmIndex + 1).trim();
      } else {
        const periodIndex = sanitized.indexOf('.');
        if (periodIndex !== -1) {
          sanitized = sanitized.substring(0, periodIndex + 1).trim();
        }
      }
    }
    
    // Deduplicate repeated sentences possibly introduced by AI echoes
    const parts = sanitized.split(/([\.\?！!])\s+/); // keep delimiters
    const rebuilt = [];
    const seen = new Set();
    for (let i = 0; i < parts.length; i += 2) {
      const sentence = (parts[i] || '').trim();
      const delim = parts[i + 1] || '';
      if (!sentence) continue;
      const key = sentence.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        rebuilt.push(sentence + delim);
      }
    }
    sanitized = rebuilt.join(' ').replace(/\s+/g, ' ').trim();
    
    return sanitized;
  }
  
  /**
   * Enhance questions with missing or generic answers using AI
   * @param {Array} questions - The questions to enhance
   * @returns {Promise<Array>} - Enhanced questions
   */
  async enhanceIncompleteQuestions(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      return questions;
    }
    
    try {
      console.log('Enhancing incomplete questions with AI...');
      
      // Filter questions that need AI enhancement, but exclude those with embedded answers
      const questionsNeedingEnhancement = questions.filter(q => q.needsAIEnhancement && !q.hasEmbeddedAnswer);
      console.log(`Found ${questionsNeedingEnhancement.length} questions needing AI enhancement (excluding ${questions.filter(q => q.hasEmbeddedAnswer).length} with embedded answers)`);
      
      if (questionsNeedingEnhancement.length === 0) {
        return questions;
      }
      
      // Process in batches to avoid timeouts
      const batchSize = 5;
      const enhancedQuestions = [...questions]; // Create a copy to modify
      
      for (let i = 0; i < questionsNeedingEnhancement.length; i += batchSize) {
        const batch = questionsNeedingEnhancement.slice(i, i + batchSize);
        console.log(`Processing batch ${i/batchSize + 1}, questions ${i+1} to ${Math.min(i+batchSize, questionsNeedingEnhancement.length)}`);
        
        // Process each question in the batch
        await Promise.all(batch.map(async (question) => {
          try {
            const enhancedQuestion = await this.enhanceSingleQuestion(question);
            
            // Find the question in the original array and update it
            const index = enhancedQuestions.findIndex(q => 
              q.text === question.text && q.type === question.type
            );
            
            if (index !== -1) {
              enhancedQuestions[index] = enhancedQuestion;
            }
          } catch (error) {
            console.error('Error enhancing question:', error);
            // If enhancement fails, keep the original question
          }
        }));
      }
      
      return enhancedQuestions;
    } catch (error) {
      console.error('Error enhancing incomplete questions:', error);
      return questions; // Return original questions if enhancement fails
    }
  }
  
  /**
   * Enhance a single question with AI-generated options and correct answer
   * @param {Object} question - The question to enhance
   * @returns {Promise<Object>} - Enhanced question
   */
  async enhanceSingleQuestion(question) {
    try {
      console.log(`Enhancing question: "${question.text}"`);
      
      // Create a prompt for the AI to enhance the question
      const prompt = `You are an expert exam question creator. Please enhance this incomplete question:
      
      Question: ${question.text}
      Type: ${question.type}
      ${question.type === 'multipleChoice' ? `Current Options: ${question.options.join(' | ')}` : ''}
      ${question.correctAnswer ? `Current Answer: ${question.correctAnswer}` : 'No answer provided'}
      
      Please provide:
      1. Better options if the current ones are generic (like "Option A")
      2. The correct answer based on your knowledge
      
      Format your response as JSON:
      {
        "enhancedOptions": ["option1", "option2", ...],
        "correctAnswer": "the correct answer"
      }
      
      For multiple choice, ensure the correct answer is one of the options.
      For true/false, the answer should be "true" or "false".
      For enumeration, provide the correct answer in detail.
      
      Return ONLY the JSON.`;
      
      // Call AI to enhance
      const response = await aiService.callOpenRouterAPI(
        prompt,
        "You are an expert at creating high-quality exam questions with factually accurate answers.",
        "anthropic/claude-3-haiku-20240307"
      );
      
      if (!response) {
        console.log('No response from AI, returning original question');
        return question;
      }
      
      try {
        // Extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const enhancementData = JSON.parse(jsonMatch[0]);
          
          // Create enhanced question
          const enhancedQuestion = { ...question };
          
          // Remove the flag
          delete enhancedQuestion.needsAIEnhancement;
          
          // Apply enhancements for multiple choice
          if (question.type === 'multipleChoice' && 
              enhancementData.enhancedOptions && 
              Array.isArray(enhancementData.enhancedOptions)) {
            
            // Only use AI options if they're better than what we have
            const hasGenericOptions = question.options.some(opt => opt.match(/^Option [A-D]$/i));
            
            if (hasGenericOptions && enhancementData.enhancedOptions.length >= 2) {
              enhancedQuestion.options = enhancementData.enhancedOptions;
            }
            
            // If AI provided a correct answer
            if (enhancementData.correctAnswer) {
              // Ensure the correct answer is in the options
              if (!enhancedQuestion.options.includes(enhancementData.correctAnswer)) {
                // Look for case-insensitive match
                const matchingOption = enhancedQuestion.options.find(opt => 
                  opt.toLowerCase() === enhancementData.correctAnswer.toLowerCase()
                );
                
                if (matchingOption) {
                  enhancedQuestion.correctAnswer = matchingOption;
                } else {
                  // If not found, add it to the options
                  enhancedQuestion.options.push(enhancementData.correctAnswer);
                  enhancedQuestion.correctAnswer = enhancementData.correctAnswer;
                }
              } else {
                enhancedQuestion.correctAnswer = enhancementData.correctAnswer;
              }
            }
          }
          // Apply enhancements for true/false
          else if (question.type === 'true_false' && enhancementData.correctAnswer) {
            if (enhancementData.correctAnswer.toLowerCase().includes('true')) {
              enhancedQuestion.correctAnswer = 'true';
            } else {
              enhancedQuestion.correctAnswer = 'false';
            }
          }
          // Apply enhancements for enumeration
          else if (question.type === 'enumeration' && enhancementData.correctAnswer) {
            enhancedQuestion.correctAnswer = enhancementData.correctAnswer.toUpperCase();
          }
          
          console.log(`Enhanced question "${question.text.substring(0, 30)}..."`);
          return enhancedQuestion;
        }
      } catch (jsonError) {
        console.error('Error parsing enhancement response:', jsonError);
      }
      
      return question; // Return original if parsing fails
    } catch (error) {
      console.error('Error enhancing question:', error);
      return question; // Return original if enhancement fails
    }
  }

  /**
   * Validate and correct factual questions using AI
   * @param {Array} questions - The questions to validate
   * @returns {Promise<Array>} - Validated and corrected questions
   */
  async validateQuestionsWithAI(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      return questions;
    }
    
    try {
      console.log('Validating factual accuracy of questions with AI...');
      
      const validatedQuestions = [];
      const batchSize = 5; // Process questions in batches to avoid timeout
      
      // Process questions in batches
      for (let i = 0; i < questions.length; i += batchSize) {
        const batch = questions.slice(i, i + batchSize);
        console.log(`Processing batch ${i/batchSize + 1}, questions ${i+1} to ${Math.min(i+batchSize, questions.length)}`);
        
        try {
          // Process each question in the batch
          const processedBatch = await Promise.all(batch.map(async (question) => {
            // Skip validation for non-factual questions or questions with embedded answers
            if (!this.isFactualQuestion(question.text) || question.hasEmbeddedAnswer) {
              return question;
            }
            
            try {
              return await this.validateSingleQuestion(question);
            } catch (error) {
              console.error('Error validating question:', error);
              return question; // Return original if validation fails
            }
          }));
          
          validatedQuestions.push(...processedBatch);
        } catch (batchError) {
          console.error('Error processing batch:', batchError);
          // If batch processing fails, add original questions
          validatedQuestions.push(...batch);
        }
      }
      
      return validatedQuestions;
    } catch (error) {
      console.error('Error in AI validation:', error);
      return questions; // Return original questions if validation fails
    }
  }
  
  /**
   * Check if a question is likely factual and needs validation
   * @param {string} questionText - The question text
   * @returns {boolean} - Whether the question is factual
   */
  isFactualQuestion(questionText) {
    if (!questionText) return false;
    
    // Common patterns for factual questions
    const factualPatterns = [
      /what is the (chemical|element|symbol|formula|equation)/i,
      /which (element|planet|gas|organelle|scientist|cell|layer|type)/i,
      /what (type|is|are) the/i,
      /what is the (capital|largest|smallest|tallest|deepest|fastest)/i,
      /who (discovered|invented|wrote|composed|painted|created)/i,
      /when (was|did|were)/i,
      /where (is|are|was|were)/i,
      /how many/i
    ];
    
    // Check if the question matches any factual pattern
    return factualPatterns.some(pattern => pattern.test(questionText));
  }
  
  /**
   * Validate and correct a single question using AI
   * @param {Object} question - The question to validate
   * @returns {Promise<Object>} - Validated and corrected question
   */
  async validateSingleQuestion(question) {
    try {
      // Create a prompt for the AI to validate the question
      const prompt = `You're an expert academic fact-checker. Validate and correct this question if needed:
      
      Question: ${question.text}
      Type: ${question.type}
      ${question.type === 'multipleChoice' ? `Options: ${question.options.join(' | ')}` : ''}
      Given Answer: ${question.correctAnswer}
      
      If the question or answer is factually incorrect, provide the corrected version.
      Format your response as a valid JSON object with these fields:
      {
        "isCorrect": true/false,
        "correctedQuestion": "question text if needed",
        "correctedOptions": ["option1", "option2", ...] (if multiple choice),
        "correctedAnswer": "correct answer"
      }
      
      Respond ONLY with the JSON object, no explanations.`;
      
      // Call AI to validate
      const response = await aiService.callOpenRouterAPI(
        prompt,
        "You are an expert academic fact checker. Provide only the JSON with your validation.",
        "anthropic/claude-3-haiku-20240307" // Using a fast model for quick validation
      );
      
      // Process the AI response
      if (response) {
        try {
          // Extract JSON from the response
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const validationData = JSON.parse(jsonMatch[0]);
            
            // If the question needs correction
            if (validationData && validationData.isCorrect === false) {
              const correctedQuestion = { ...question };
              
              // Apply corrections
              if (validationData.correctedQuestion) {
                // Re-sanitize to strip any appended rationale/options that AI may add
                correctedQuestion.text = this.sanitizeQuestionText(validationData.correctedQuestion, correctedQuestion.type);
              }
              
              if (validationData.correctedOptions && Array.isArray(validationData.correctedOptions)) {
                correctedQuestion.options = validationData.correctedOptions.filter(opt => opt && opt.trim());
                
                // Ensure we have sufficient options
                if (correctedQuestion.options.length < 2 && correctedQuestion.type === 'multipleChoice') {
                  return question; // Keep original if correction doesn't provide enough options
                }
              }
              
              if (validationData.correctedAnswer) {
                correctedQuestion.correctAnswer = validationData.correctedAnswer;
                
                // For multiple choice, ensure the answer is in the options
                if (correctedQuestion.type === 'multipleChoice' && 
                    !correctedQuestion.options.includes(correctedQuestion.correctAnswer)) {
                  correctedQuestion.options.push(correctedQuestion.correctAnswer);
                }
              }
              
              console.log(`Corrected question: "${question.text}" → "${correctedQuestion.text}"`);
              return correctedQuestion;
            }
          }
        } catch (jsonError) {
          console.error('Error parsing validation response:', jsonError);
        }
      }
      
      // Return original question if validation fails or no correction needed
      return question;
    } catch (error) {
      console.error('Error validating question:', error);
      return question;
    }
  }

  /**
   * Directly use AI to extract questions from text without preprocessing
   * @param {string} textContent - The text content to extract from
   * @param {string} modelId - Optional AI model ID to use
   * @returns {Promise<Array>} - Array of extracted questions
   */
  async directAIExtraction(textContent, modelId = null) {
    try {
      console.log('Starting direct AI extraction with model:', modelId || 'default');
      
      // Check for JSON-like content with more robust detection
      if (textContent.trim().startsWith('[') && textContent.includes('"text"') && textContent.includes('"type"')) {
        try {
          console.log('Content appears to be JSON formatted, attempting direct JSON parsing');
          const result = await this.processJsonInput(textContent);
          
          // If we successfully processed JSON and got results, return them
          if (result && result.length > 0) {
            console.log(`Successfully processed content as JSON, found ${result.length} questions`);
            return result;
          }
        } catch (jsonError) {
          console.error('Failed to process as JSON, continuing with AI extraction:', jsonError);
        }
      }
      
      // First, try direct parsing to detect embedded answers
      console.log('Trying direct parsing first to detect embedded answers...');
      const directParsedQuestions = this.parseFormattedExamQuestions(textContent);
      
      if (directParsedQuestions && directParsedQuestions.length > 0) {
        console.log(`Direct parsing found ${directParsedQuestions.length} questions with embedded answers`);
        // Apply post-processing to improve questions while preserving embedded answers
        return this.postProcessQuestions(directParsedQuestions);
      }
      
      // If direct parsing didn't find questions, continue with AI extraction
      console.log('Direct parsing found no questions, falling back to AI extraction...');
      
      // First, try to extract answers that might be hidden in other parts of the document
      const potentialAnswers = this.extractPotentialAnswers(textContent);
      console.log('Found potential answers:', potentialAnswers);
      
      // Clean and preprocess the text
      const cleanText = textContent.replace(/\s+/g, ' ').trim();
      
      // Create a more detailed prompt that explains exactly what we want
      const prompt = `I need you to extract exam questions from this text. The text may contain poorly formatted content, merged words, or unclear structure.

CRITICAL INSTRUCTION: Include ALL scenario, context, and background information in the question text.
If a question has a scenario or explanation before the actual question, include it all in the question text.

SPECIAL: Sometimes the answer is embedded in the question number (like A1, B2, etc.).
If you see a question number like A1, B2, C3, or D4, the letter (A, B, C, or D) might be the correct answer.

Your task:
1. Identify all possible exam questions in the text
2. For each question:
   - Extract the COMPLETE question text including any scenario/context/explanations (fix any merged words or formatting issues)
   - Determine the question type (multiple choice, true/false, or enumeration)
   - Extract all options for multiple choice questions
   - Identify or determine the correct answer (including checking question numbers for embedded answers)

If you see placeholder questions (like "________________________________________?") or generic options ("Option A", etc.):
- Use the context and subject matter of other questions to create meaningful questions
- Replace generic options with subject-appropriate choices
- Ensure one option matches the correct answer from the answer key if available

I've found these potential answers in the document that might match some questions:
${JSON.stringify(potentialAnswers)}

      Format each question as a JSON object with these fields:
- text: The question text
      - type: "multipleChoice", "true_false", "enumeration", or "essay"
      - options: Array of options (for multiple choice only; omit for essay)
      - correctAnswer: The correct answer (omit or empty string for essay)

Return a JSON array of all extracted questions. Example:
[
  {
    "text": "What is the capital of France?",
    "type": "multipleChoice",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": "Paris"
  }
]

If you can't identify any clear questions, create at least 3 meaningful questions based on the content of the text.

Text to analyze:
${cleanText.substring(0, 15000)}`;

      // Use a more powerful model for direct extraction
      const extractionModel = modelId || "anthropic/claude-3-opus-20240229";
      
      // Call the AI directly
      const response = await aiService.callOpenRouterAPI(
        prompt,
        "You are an expert at extracting and generating high-quality exam questions from text. Return ONLY the valid JSON array.",
        extractionModel
      );
      
      if (!response) {
        console.log('No response from AI, falling back to standard extraction');
        return this.analyzeTextAndExtractQuestions(textContent, modelId);
      }
      
      // Process the AI response
      try {
        // First try direct JSON parsing (for clean JSON responses)
        try {
          const trimmedResponse = response.trim();
          if (trimmedResponse.startsWith('[') && trimmedResponse.endsWith(']')) {
            const directParse = JSON.parse(trimmedResponse);
            if (Array.isArray(directParse) && directParse.length > 0) {
              console.log(`Successfully parsed direct JSON response with ${directParse.length} questions`);
              return this.postProcessQuestions(directParse);
            }
          }
        } catch (directError) {
          console.log('Direct JSON parsing failed, trying regex extraction');
        }
        
        // If direct parsing fails, try regex extraction
        const jsonMatch = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          const extractedQuestions = JSON.parse(jsonMatch[0]);
          
          if (Array.isArray(extractedQuestions) && extractedQuestions.length > 0) {
            console.log(`Successfully extracted ${extractedQuestions.length} questions with direct AI approach`);
            
            // Display a sample of questions
            if (extractedQuestions.length > 0) {
              console.log('Sample extracted question:', JSON.stringify(extractedQuestions[0], null, 2));
            }
            
            // Apply post-processing to improve the extracted questions
            return this.postProcessQuestions(extractedQuestions);
          }
        }
        
        // Try parsing the entire response as JSON
        try {
          const parsedResponse = JSON.parse(response.trim());
          if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
            console.log(`Successfully parsed ${parsedResponse.length} questions from full response`);
            return this.postProcessQuestions(parsedResponse);
          }
        } catch (parseError) {
          console.log('Failed to parse full response as JSON');
        }
      } catch (error) {
        console.error('Error processing AI extraction response:', error);
      }
      
      // If direct extraction fails, try to manually process the document
      console.log('Direct AI extraction failed, trying manual processing with answer matching');
      return this.processDocumentWithAnswerMatching(textContent, potentialAnswers, modelId);
    } catch (error) {
      console.error('Error in direct AI extraction:', error);
      // Fall back to the standard approach
      return this.analyzeTextAndExtractQuestions(textContent, modelId);
    }
  }
  
  /**
   * Extract potential answers from the document text
   * @param {string} text - The document text
   * @returns {Object} - Map of question numbers to potential answers
   */
  extractPotentialAnswers(text) {
    const answers = {};
    
    try {
      // Look for answer key sections
      const answerKeyPatterns = [
        /PART\s+[IVX]+\s*-\s*(?:ANSWERS|ENUMERATION|ANSWER KEY)\s*:\s*(.*)/i,
        /(?:ANSWERS|ANSWER KEY|ENUMERATION)\s*:\s*(.*)/i,
        /\b(?:ANSWERS|ANSWER KEY)\b[\s\S]*?(\d+[\.\)]\s*[^0-9\n]+)/gi
      ];
      
      for (const pattern of answerKeyPatterns) {
        const matches = [...text.matchAll(pattern)];
        for (const match of matches) {
          if (match[1]) {
            const answerText = match[1].trim();
            
            // Try to extract numbered answers
            const numberedAnswers = answerText.match(/(\d+)[\.:\)]\s*([^0-9\n]+?)(?=\s*\d+[\.:\)]|$)/g);
            if (numberedAnswers) {
              for (const numbered of numberedAnswers) {
                const parts = numbered.match(/(\d+)[\.:\)]\s*(.*)/);
                if (parts && parts[1] && parts[2]) {
                  const questionNum = parseInt(parts[1]);
                  const answer = parts[2].trim();
                  if (questionNum && answer) {
                    answers[questionNum] = answer;
                  }
                }
              }
            }
            
            // If no numbered answers, look for sequential answers
            if (Object.keys(answers).length === 0) {
              const possibleAnswers = answerText.split(/\s*[,;]\s*/);
              possibleAnswers.forEach((answer, index) => {
                if (answer.trim()) {
                  answers[index + 1] = answer.trim();
                }
              });
            }
          }
        }
      }
      
      // Look for inline enumeration answers (like "6. Whale 7. Iron 8. Africa")
      const inlineEnumPattern = /(\d+)\s*\.\s*([A-Za-z]+)\s*/g;
      const inlineMatches = [...text.matchAll(inlineEnumPattern)];
      for (const match of inlineMatches) {
        if (match[1] && match[2]) {
          const questionNum = parseInt(match[1]);
          const answer = match[2].trim();
          if (questionNum && answer) {
            answers[questionNum] = answer;
          }
        }
      }
      
      // Extract single-word answers that might be in an enumeration section
      if (Object.keys(answers).length === 0) {
        const enumerationSection = text.match(/PART\s+[IVX]+\s*-\s*ENUMERATION\s*:?\s*([\s\S]*?)(?=PART|$)/i);
        if (enumerationSection && enumerationSection[1]) {
          const words = enumerationSection[1].split(/\s+/).filter(word => 
            word.length > 2 && 
            /^[A-Za-z]+$/.test(word) &&
            !['the', 'and', 'for', 'with', 'that', 'this', 'from'].includes(word.toLowerCase())
          );
          
          words.forEach((word, index) => {
            answers[index + 1] = word.trim();
          });
        }
      }
    } catch (error) {
      console.error('Error extracting potential answers:', error);
    }
    
    return answers;
  }
  
  /**
   * Process document by manually matching questions with extracted answers
   * @param {string} text - The document text
   * @param {Object} potentialAnswers - Extracted potential answers
   * @param {string} modelId - Optional AI model ID to use
   * @returns {Promise<Array>} - Array of processed questions
   */
  async processDocumentWithAnswerMatching(text, potentialAnswers, modelId = null) {
    try {
      console.log('Processing document with answer matching...');
      
      // Extract question blocks
      const questionBlocks = this.parseTextIntoQuestionBlocks(text);
      console.log(`Found ${questionBlocks.length} question blocks for manual processing`);
      
      if (questionBlocks.length === 0) {
        console.log('No question blocks found, falling back to standard approach');
        return this.analyzeTextAndExtractQuestions(text, modelId);
      }
      
      const processedQuestions = [];
      
      // Process each question block
      for (let i = 0; i < questionBlocks.length; i++) {
        const block = questionBlocks[i];
        const questionNumber = i + 1;
        
        // Check if this block contains a placeholder question or empty content
        const isPlaceholder = block.includes('_______') || 
                             !block.includes('?') || 
                             block.match(/option\s+[a-d]/i);
        
        if (isPlaceholder) {
          // This is a placeholder question, try to create a real question
          console.log(`Question ${questionNumber} appears to be a placeholder`);
          
          // Check if we have an answer for this question number
          const answer = potentialAnswers[questionNumber];
          
          if (answer) {
            console.log(`Found potential answer for question ${questionNumber}: ${answer}`);
            
            // Use AI to generate a good question based on the answer
            const generatedQuestion = await this.generateQuestionFromAnswer(answer, questionNumber, modelId);
            if (generatedQuestion) {
              processedQuestions.push(generatedQuestion);
              continue;
            }
          }
        }
        
        // Not a placeholder or couldn't generate a question, try normal extraction
        try {
          const questionData = await this.extractQuestionFromBlock(block, modelId);
          if (questionData) {
            // Check if we have a potential answer to improve this question
            if (questionData.options && questionData.options.some(opt => opt.match(/^Option [A-D]$/i))) {
              const answer = potentialAnswers[questionNumber];
              if (answer) {
                console.log(`Improving question ${questionNumber} with answer: ${answer}`);
                
                // Generate better options that include the correct answer
                const improvedQuestion = await this.improveQuestionWithAnswer(questionData, answer, modelId);
                if (improvedQuestion) {
                  processedQuestions.push(improvedQuestion);
                  continue;
                }
              }
            }
            
            // Clean up and add the question
            this.cleanupExtractedQuestion(questionData);
            processedQuestions.push(questionData);
          }
        } catch (error) {
          console.error(`Error processing question block ${questionNumber}:`, error);
        }
      }
      
      console.log(`Processed ${processedQuestions.length} questions with answer matching`);
      
      // If we couldn't process any questions, try the standard approach
      if (processedQuestions.length === 0) {
        console.log('Failed to process questions with answer matching, falling back to standard approach');
        return this.analyzeTextAndExtractQuestions(text, modelId);
      }
      
      // Apply post-processing to improve the questions
      return this.postProcessQuestions(processedQuestions);
    } catch (error) {
      console.error('Error in document processing with answer matching:', error);
      // Fall back to standard approach
      return this.analyzeTextAndExtractQuestions(text, modelId);
    }
  }
  
  /**
   * Generate a question based on a known answer
   * @param {string} answer - The known answer
   * @param {number} questionNumber - The question number
   * @param {string} modelId - Optional AI model ID to use
   * @returns {Promise<Object|null>} - Generated question or null if failed
   */
  async generateQuestionFromAnswer(answer, questionNumber, modelId = null) {
    try {
      console.log(`Generating question for answer: ${answer}`);
      
      // Create a prompt for the AI to generate a question
      const prompt = `You are an expert exam creator. Create a multiple-choice question where "${answer}" is the correct answer.

The question should:
1. Be clear and concise
2. Have 4 plausible answer options (including the correct answer)
3. Be appropriate for an academic exam

Return the question as JSON:
{
  "text": "Question text?",
  "type": "multipleChoice",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "${answer}"
}

The correct answer MUST be "${answer}" exactly as written. Return ONLY the JSON.`;
      
      // Use a smaller model for speed
      const generationModel = modelId || "anthropic/claude-3-haiku-20240307";
      
      // Call the AI
      const response = await aiService.callOpenRouterAPI(
        prompt,
        "You are an expert exam question creator. Return only the JSON object.",
        generationModel
      );
      
      if (!response) {
        console.log('No response from AI for question generation');
        return null;
      }
      
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const questionData = JSON.parse(jsonMatch[0]);
        
        // Verify we have a valid question
        if (questionData && questionData.text && questionData.options && 
            Array.isArray(questionData.options) && questionData.options.length >= 2) {
          
          console.log(`Successfully generated question: ${questionData.text}`);
          return questionData;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error generating question from answer:', error);
      return null;
    }
  }
  
  /**
   * Improve a question with a known answer
   * @param {Object} question - The original question
   * @param {string} answer - The known answer
   * @param {string} modelId - Optional AI model ID to use
   * @returns {Promise<Object|null>} - Improved question or null if failed
   */
  async improveQuestionWithAnswer(question, answer, modelId = null) {
    try {
      console.log(`Improving question with answer: ${answer}`);
      
      // Create a prompt for the AI to improve the question
      const prompt = `You are an expert exam editor. Improve this question:

Question: ${question.text}
Current options: ${JSON.stringify(question.options)}
Correct answer should be: ${answer}

Please provide improved options that:
1. Include "${answer}" as the correct answer
2. Have 3 other plausible but incorrect options
3. Are specific and well-formatted

Return as JSON:
{
  "improvedOptions": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "${answer}"
}

Return ONLY the JSON.`;
      
      // Use a smaller model for speed
      const improvementModel = modelId || "anthropic/claude-3-haiku-20240307";
      
      // Call the AI
      const response = await aiService.callOpenRouterAPI(
        prompt,
        "You are an expert exam editor. Return only the JSON object.",
        improvementModel
      );
      
      if (!response) {
        console.log('No response from AI for question improvement');
        return null;
      }
      
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const improvementData = JSON.parse(jsonMatch[0]);
        
        // Verify we have valid improvement data
        if (improvementData && improvementData.improvedOptions && 
            Array.isArray(improvementData.improvedOptions) && 
            improvementData.improvedOptions.length >= 2) {
          
          // Create improved question
          const improvedQuestion = { ...question };
          improvedQuestion.options = improvementData.improvedOptions;
          improvedQuestion.correctAnswer = answer;
          
          console.log(`Successfully improved question: ${question.text}`);
          return improvedQuestion;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error improving question with answer:', error);
      return null;
    }
  }
  
  /**
   * Check if a string is valid JSON
   * @param {string} str - The string to check
   * @returns {boolean} - Whether the string is valid JSON
   */
  isJsonString(str) {
    if (typeof str !== 'string') return false;
    
    // Trim the string to remove whitespace
    const trimmed = str.trim();
    
    // Check if it starts with [ or { (array or object)
    if (!(trimmed.startsWith('[') || trimmed.startsWith('{'))) return false;
    
    try {
      const parsed = JSON.parse(trimmed);
      
      // Additional validation for our expected question format
      if (Array.isArray(parsed)) {
        // Check if array contains valid question objects
        return parsed.length > 0 && parsed.some(item => 
          item && typeof item === 'object' && 
          (item.text || item.questionText || item.question) && 
          (item.type || item.questionType)
        );
      }
      
      // Single question object
      return parsed && typeof parsed === 'object' && 
             (parsed.text || parsed.questionText || parsed.question) && 
             (parsed.type || parsed.questionType);
    } catch (e) {
      return false;
    }
  }
  
  /**
   * Process input that's already in JSON format
   * @param {string} jsonText - The JSON text to process
   * @returns {Promise<Array>} - Array of processed questions
   */
  async processJsonInput(jsonText) {
    try {
      console.log('Processing pre-formatted JSON input');
      
      // Parse the JSON
      const parsedData = JSON.parse(jsonText.trim());
      
      // Handle both array and single object formats
      const questionsArray = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      if (questionsArray.length === 0) {
        console.log('Empty questions array in JSON input');
        return [];
      }
      
      console.log(`Found ${questionsArray.length} questions in JSON input`);
      
      // Map the questions to our standard format if needed
      const standardizedQuestions = questionsArray.map(q => {
        // Skip if question is null or undefined
        if (!q) return null;
        
        // Fix any space issues in text fields
        let questionText = (q.text || q.questionText || q.question || "").trim();
        questionText = questionText.replace(/\s+/g, ' '); // Replace multiple spaces with single space
        
        // Create a standardized question object
        const standardized = {
          text: questionText,
          type: this.mapQuestionType(q.type || q.questionType || ""),
          options: Array.isArray(q.options) ? [...q.options].map(opt => opt.replace(/\s+/g, ' ').trim()) : [],
          correctAnswer: (q.correctAnswer || q.answer || "").toString().replace(/\s+/g, ' ').trim()
        };
        
        // For true/false questions with T/F answers, convert to true/false
        if (standardized.type === 'true_false') {
          if (standardized.correctAnswer === 'T' || 
              standardized.correctAnswer === 't' || 
              standardized.correctAnswer.toLowerCase() === 'true') {
            standardized.correctAnswer = 'true';
          } else {
            standardized.correctAnswer = 'false';
          }
        }
        
        return standardized;
      }).filter(q => q !== null && q.text);
      
      console.log(`Standardized ${standardizedQuestions.length} JSON questions`);
      
      // Apply post-processing to improve the questions
      return this.postProcessQuestions(standardizedQuestions);
    } catch (error) {
      console.error('Error processing JSON input:', error);
      throw error;
    }
  }
}

export default new FileProcessingService();