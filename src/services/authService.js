export const BASE_URL = 'https://emnmtv.shop/auth';
export const SOCKET_URL = 'https://emnmtv.shop';
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

// Authentication functions
export const loginUser = async (email, lrn, password) => {
  try {
    console.log('AuthService: Starting login request', { 
      hasEmail: !!email, 
      hasLRN: !!lrn 
    });

    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, lrn, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AuthService: Login failed', errorData);
      throw new Error(errorData.error || "Login failed");
    }

    const { token } = await response.json();
    console.log('AuthService: Login successful');

    // Store the token
    localStorage.setItem("jwtToken", token);

    // Decode and store user info from token
    const payload = decodeToken(token);
    console.log('AuthService: Decoded token payload:', payload);

    if (payload) {
      localStorage.setItem("userId", payload.userId.toString());
      localStorage.setItem("userRole", payload.role);

      // Immediately fetch and store component settings after successful login
      try {
        const settings = await getComponentSettings(payload.role);
        const storedSettings = {
          [payload.role]: settings.map(s => ({
            path: s.componentPath,
            enabled: s.isEnabled
          }))
        };
        localStorage.setItem('componentSettings', JSON.stringify(storedSettings));
      } catch (error) {
        console.error('Failed to fetch initial component settings:', error);
      }
      
      // Use synchronous require to avoid issues
      const socketManager = require('@/utils/socketManager').default;
      
      // Initialize socket and emit login event
      socketManager.emitUserLogin(payload.userId, payload.role);
      
      // Set up heartbeat interval
      const heartbeatInterval = setInterval(() => {
        socketManager.sendActivityHeartbeat(payload.userId);
      }, 60000); // Send heartbeat every minute
      
      // Store interval ID for cleanup on logout
      localStorage.setItem("heartbeatInterval", heartbeatInterval);
      
      // Return both token and decoded info
      return {
        token,
        userId: payload.userId,
        role: payload.role
      };
    }

    throw new Error("Failed to decode token payload");
  } catch (error) {
    console.error("AuthService: Login error:", error);
    throw error;
  }
};

export const registerStudent = async (studentData) => {
  const token = localStorage.getItem("jwtToken");
  if (!token) throw new Error("No token provided");

  const response = await fetch(`${BASE_URL}/register-student`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(studentData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('AuthService: Student registration failed', errorData);
    throw new Error(errorData.error || "Student registration failed");
  }

  const result = await response.json();
  return result;
};

export const registerTeacher = async (teacherData) => {
  const token = localStorage.getItem("jwtToken");
  if (!token) throw new Error("No token provided");

  const response = await fetch(`${BASE_URL}/register-teacher`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(teacherData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Teacher registration failed");
  }

  const result = await response.json();
  return result;
};

export const registerAdmin = async (adminData) => {
  const token = localStorage.getItem("jwtToken");
  if (!token) throw new Error("No token provided");

  const response = await fetch(`${BASE_URL}/register-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(adminData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Admin registration failed");
  }

  const result = await response.json();
  return result;
};

// Profile management with token-based auth
export const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    // If password is included, validate it
    if (profileData.password && profileData.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    console.log('AuthService: Updating profile', { 
      ...profileData, 
      password: profileData.password ? '********' : undefined 
    });

    const response = await fetch(`${BASE_URL}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AuthService: Profile update failed', errorData);
      throw new Error(errorData.error || "Failed to update profile");
    }

    const result = await response.json();
    console.log('AuthService: Profile update successful', result);
    return result;
  } catch (error) {
    console.error("AuthService: Profile update error:", error);
    throw error;
  }
};

/**
 * Update a student's LRN
 * @param {string} lrn - The new LRN value
 * @returns {Promise<Object>} - The API response
 */
export const updateStudentLRN = async (lrn) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    // Validate LRN format - must be 12 digits
    if (!lrn || !/^\d{12}$/.test(lrn)) {
      throw new Error('Invalid LRN format. LRN must be 12 digits');
    }

    console.log('AuthService: Updating student LRN');

    const response = await fetch(`${BASE_URL}/student/lrn`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ lrn })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AuthService: LRN update failed', errorData);
      throw new Error(errorData.error || "Failed to update LRN");
    }

    const result = await response.json();
    console.log('AuthService: LRN update successful', result);
    return result;
  } catch (error) {
    console.error("AuthService: LRN update error:", error);
    throw error;
  }
};

export const deleteProfilePicture = async () => {
  const token = localStorage.getItem("jwtToken");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/profile-picture`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete profile picture");
  }

  return await response.json();
};


// Exam management functions with token-based auth
export const createExam = async (testCode, classCode, examTitle, questions, userId, isDraft = false, durationMinutes, startDateTime, endDateTime, maxAttempts, attemptSpacing) => {
  try {
    console.log('AuthService: Creating exam', testCode);
    
    // Validate input parameters
    if (!testCode || !classCode || !examTitle || !questions || !userId) {
      throw new Error('Missing required parameters');
    }

    // Ensure questions is an array and has valid structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Questions must be a non-empty array');
    }

    // Validate each question
    const validatedQuestions = questions.map(q => {
      if (!q.questionText || !q.questionType || !q.correctAnswer) {
        throw new Error('Each question must have questionText, questionType, and correctAnswer');
      }

      // Ensure options is always an array
      const options = Array.isArray(q.options) ? q.options : [];

      return {
        questionText: q.questionText,
        questionType: q.questionType,
        options: options,
        correctAnswer: q.correctAnswer,
        imageUrl: q.imageUrl || null  // Include imageUrl in the question data
      };
    });

    const response = await fetch(`${BASE_URL}/exam`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`
      },
      body: JSON.stringify({
        testCode,
        classCode,
        examTitle,
        questions: validatedQuestions,
        userId,
        isDraft,
        durationMinutes,
        startDateTime,
        endDateTime,
        maxAttempts,
        attemptSpacing
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create exam");
    }

    return await response.json();
  } catch (error) {
    console.error("AuthService: Exam creation error:", error);
    throw error;
  }
};

export const fetchExamQuestions = async (testCode) => {
  const token = localStorage.getItem("jwtToken");
  if (!token) throw new Error("No token found");

  const response = await fetch(`${BASE_URL}/question`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ testCode }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch exam questions");
  }

  return await response.json();
};

export const submitExamAnswers = async (answerData) => {
  try {
    const response = await fetch(`${BASE_URL}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`
      },
      body: JSON.stringify(answerData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to submit answers");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to submit answers');
  }
};

// Exam control functions
export const startExam = async (testCode) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Starting exam', { testCode });

    const response = await fetch(`${BASE_URL}/startexam`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ testCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AuthService: Exam start failed', errorData);
      throw new Error(errorData.error || "Failed to start exam");
    }

    const result = await response.json();
    console.log('AuthService: Exam start successful', result);
    return result;
  } catch (error) {
    console.error("AuthService: Exam start error:", error);
    throw error;
  }
};

export const stopExam = async (testCode) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Stopping exam', { testCode });

    const response = await fetch(`${BASE_URL}/stopexam`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ testCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AuthService: Exam stop failed', errorData);
      throw new Error(errorData.error || "Failed to stop exam");
    }

    const result = await response.json();
    console.log('AuthService: Exam stop successful', result);
    return result;
  } catch (error) {
    console.error("AuthService: Exam stop error:", error);
    throw error;
  }
};

// Auth helper functions
export const logout = () => {
  try {
    // Get userId before clearing storage
    const userId = localStorage.getItem("userId");
    
    // Clear heartbeat interval
    const heartbeatInterval = localStorage.getItem("heartbeatInterval");
    if (heartbeatInterval) {
      clearInterval(Number(heartbeatInterval));
    }
    
    // Import the socket manager synchronously
    const socketManager = require('@/utils/socketManager').default;
    
    // Emit logout event if we have a userId
    if (userId) {
      console.log('Logging out user:', userId);
      socketManager.emitUserLogout(userId);
    }
    
    // Disconnect the socket
    socketManager.disconnect();
    
    // Add a small delay to ensure the socket events are sent
    setTimeout(() => {
      // Clear all authentication-related items from localStorage
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('testCode');
      localStorage.removeItem('heartbeatInterval');
      // Clear any other app-specific storage items
      localStorage.clear();
      
      console.log('AuthService: User logged out successfully');
    }, 500);
  } catch (error) {
    console.error('AuthService: Error during logout:', error);
    throw error;
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("jwtToken");
  if (!token) return false;
  
  // Check if token is expired
  const payload = decodeToken(token);
  if (!payload) return false;
  
  const currentTime = Date.now() / 1000;
  return payload.exp > currentTime;
};

export const getUserRole = () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      console.log('AuthService: No token found');
      return null;
    }
    
    const payload = decodeToken(token);
    console.log('AuthService: Decoded payload for role:', payload); // Debug log
    
    if (!payload || !payload.role) {
      console.log('AuthService: No role found in token');
      return null;
    }
    
    return payload.role;
  } catch (error) {
    console.error('AuthService: Error getting user role:', error);
    return null;
  }
};

// Fetch user profile with token-based auth
export const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching user profile');

    const response = await fetch(`${BASE_URL}/user-profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch profile");
    }

    const { userProfile } = await response.json();
    console.log('AuthService: Profile fetch successful', userProfile);
    return userProfile;
  } catch (error) {
    console.error("AuthService: Profile fetch error:", error);
    throw error;
  }
};

/**
 * Fetch all students
 */
export const fetchStudents = async () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching students list');

    const response = await fetch(`${BASE_URL}/students`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch students");
    }

    const { students } = await response.json();
    console.log('AuthService: Students fetch successful', students);
    return students;
  } catch (error) {
    console.error("AuthService: Students fetch error:", error);
    throw error;
  }
};

/**
 * Fetch all teachers
 */
export const fetchTeachers = async () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching teachers list');

    const response = await fetch(`${BASE_URL}/teachers`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch teachers");
    }

    const { teachers } = await response.json();
    console.log('AuthService: Teachers fetch successful', teachers);
    return teachers;
  } catch (error) {
    console.error("AuthService: Teachers fetch error:", error);
    throw error;
  }
};

/**
 * Fetch all admins
 */
export const fetchAdmins = async () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching admins list');

    const response = await fetch(`${BASE_URL}/admins`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch admins");
    }

    const { admins } = await response.json();
    console.log('AuthService: Admins fetch successful', admins);
    return admins;
  } catch (error) {
    console.error("AuthService: Admins fetch error:", error);
    throw error;
  }
};

/**
 * Fetch student scores with associated student and exam details
 * @param {number} studentId - Optional filter by student ID
 * @param {number} examId - Optional filter by exam ID
 */
export const fetchStudentScores = async (studentId, examId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching student scores');
    
    // Build query string based on provided filters
    let queryParams = new URLSearchParams();
    if (studentId) queryParams.append('studentId', studentId);
    if (examId) queryParams.append('examId', examId);
    
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/scores${queryString ? '?' + queryString : ''}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch student scores");
    }

    const data = await response.json();
    console.log('AuthService: Raw API Response for scores:', JSON.stringify(data));
    
    const { scores } = data;
    console.log('AuthService: Student scores fetch successful', scores);
    return scores;
  } catch (error) {
    console.error("AuthService: Student scores fetch error:", error);
    throw error;
  }
};

/**
 * Fetch the exams created by the current teacher
 */
export const fetchTeacherExams = async () => {
  try {
    const response = await fetch(`${BASE_URL}/teacher-exams`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch exams');
    }

    const data = await response.json();
    
    // Process the exam data to ensure options are parsed and image URLs are prepared
    const processedExams = data.exams.map(exam => {
      // Process questions to ensure options are properly formatted
      if (exam.questions) {
        exam.questions = exam.questions.map(question => {
          // Ensure options are parsed from JSON if needed
          if (question.options && typeof question.options === 'string') {
            try {
              question.options = JSON.parse(question.options);
            } catch (e) {
              console.error('Error parsing options for question:', question.id, e);
              question.options = [];
            }
          }
          
          // Ensure image URLs are properly formatted
          if (question.imageUrl) {
            question.imageUrl = getFullImageUrl(question.imageUrl);
          }
          
          return question;
        });
      }
      
      return exam;
    });
    
    return processedExams;
  } catch (error) {
    console.error('Error fetching teacher exams:', error);
    throw error;
  }
};

/**
 * Update an existing exam
 */
export const updateExam = async (examId, examData) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/exam/${examId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        testCode: examData.testCode,
        classCode: examData.classCode,
        examTitle: examData.examTitle,
        isDraft: examData.isDraft,
        status: examData.status,
        // Add the attempt and scheduling parameters
        durationMinutes: examData.durationMinutes,
        startDateTime: examData.startDateTime,
        endDateTime: examData.endDateTime,
        maxAttempts: examData.maxAttempts,
        attemptSpacing: examData.attemptSpacing,
        questions: examData.questions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.questionType === 'enumeration' ? [] : (q.options || []),
          correctAnswer: q.correctAnswer,
          imageUrl: q.imageUrl || null  // Include imageUrl in the question data
        }))
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update exam");
    }

    return await response.json();
  } catch (error) {
    console.error("AuthService: Exam update error:", error);
    throw error;
  }
};

/**
 * Delete an exam
 */
export const deleteExam = async (examId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/exam/${examId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete exam");
    }

    return await response.json();
  } catch (error) {
    console.error("AuthService: Exam deletion error:", error);
    throw error;
  }
};

/**
 * Fetch item analysis for an exam
 * @param {number} examId - The ID of the exam to analyze
 */
export const fetchExamAnalysis = async (examId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching exam analysis for exam ID:', examId);

    const response = await fetch(`${BASE_URL}/exam-analysis/${examId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch exam analysis");
    }

    const responseData = await response.json();
    console.log('AuthService: Raw API response for exam analysis:', JSON.stringify(responseData));

    const { analysis } = responseData;
    return analysis;
  } catch (error) {
    console.error("AuthService: Exam analysis fetch error:", error);
    throw error;
  }
};

// Create a new survey
export const createSurvey = async (surveyData) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/survey`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(surveyData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create survey');
    }

    return await response.json();
  } catch (error) {
    console.error('Survey creation error:', error);
    throw error;
  }
};

// Fetch user's surveys
export const fetchUserSurveys = async () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/my-surveys`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch surveys');
    }

    const { surveys } = await response.json();
    return surveys;
  } catch (error) {
    console.error('Surveys fetch error:', error);
    throw error;
  }
};

// Fetch survey by code
export const fetchSurvey = async (code) => {
  try {
    const response = await fetch(`${BASE_URL}/survey/${code}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch survey');
    }

    return await response.json();
  } catch (error) {
    console.error('Survey fetch error:', error);
    throw error;
  }
};

// Submit survey response
export const submitSurveyResponse = async (code, responseData) => {
  try {
    if (!code) {
      throw new Error('Survey code is required');
    }

    // Format answers before sending
    const formattedAnswers = responseData.answers.map(answer => ({
      questionId: answer.questionId,
      answer: Array.isArray(answer.answer)
        ? JSON.stringify(answer.answer.filter(Boolean)) // Remove empty values
        : answer.answer
    }));

    const response = await fetch(`${BASE_URL}/survey/${code}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: code.trim().toUpperCase(),
        respondent: responseData.respondent,
        answers: formattedAnswers
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit survey');
    }

    return await response.json();
  } catch (error) {
    console.error('Survey submission error:', error);
    throw error;
  }
};

// Fetch survey results
export const fetchSurveyResults = async (code) => {
  try {
    const response = await fetch(`${BASE_URL}/survey/${code}/results`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch survey results');
    }

    const data = await response.json();
    
    // Pre-process the data to ensure answers are properly parsed
    if (data.results && data.results.questions) {
      data.results.questions = data.results.questions.map(question => ({
        ...question,
        options: typeof question.options === 'string' 
          ? JSON.parse(question.options) 
          : question.options,
        answers: question.answers?.map(answer => ({
          ...answer,
          answer: (() => {
            try {
              if (question.questionType === 'checkbox' && typeof answer.answer === 'string') {
                return JSON.parse(answer.answer);
              }
              return answer.answer;
            } catch (e) {
              console.warn('Failed to parse answer:', answer.answer);
              return answer.answer;
            }
          })()
        }))
      }));
    }

    return data;
  } catch (error) {
    console.error('Survey results fetch error:', error);
    throw error;
  }
};

// Create a new grade section
export const createGradeSection = async (grade, section) => {
  try {
    const response = await fetch(`${BASE_URL}/grade-section`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify({ grade, section })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create grade section');
    }

    return await response.json();
  } catch (error) {
    console.error('Create grade section error:', error);
    throw error;
  }
};

// Get all grade sections
export const getAllGradeSections = async () => {
  try {
    const response = await fetch(`${BASE_URL}/grade-sections`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch grade sections');
    }

    return await response.json();
  } catch (error) {
    console.error('Get grade sections error:', error);
    throw error;
  }
};

// Update a grade section
export const updateGradeSection = async (id, grade, section) => {
  try {
    const response = await fetch(`${BASE_URL}/grade-section/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify({ grade, section })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update grade section');
    }

    return await response.json();
  } catch (error) {
    console.error('Update grade section error:', error);
    throw error;
  }
};

// Delete a grade section
export const deleteGradeSection = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/grade-section/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete grade section');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete grade section error:', error);
    throw error;
  }
};

export const updateUser = async (userId, updateData) => {
  try {
    // Validate password length on client side
    if (updateData.password && updateData.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    const response = await fetch(`${BASE_URL}/user/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user');
    }

    return await response.json();
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }

    return await response.json();
  } catch (error) {
    console.error('Delete user error:', error);
    throw error;
  }
};

// Add this service function
export const getUserDetails = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/user/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user details');
    }

    return await response.json();
  } catch (error) {
    console.error('Get user details error:', error);
    throw error;
  }
};

// Add these service functions
export const setExamAccess = async (examId, gradeAccess) => {
  try {
    const response = await fetch(`${BASE_URL}/exam/${examId}/access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify({ gradeAccess })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set exam access');
    }

    return await response.json();
  } catch (error) {
    console.error('Set exam access error:', error);
    throw error;
  }
};

export const getExamAccess = async (examId) => {
  try {
    const response = await fetch(`${BASE_URL}/exam/${examId}/access`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get exam access');
    }

    return await response.json();
  } catch (error) {
    console.error('Get exam access error:', error);
    throw error;
  }
};

export const checkExamAccess = async (examId, grade, section) => {
  try {
    const response = await fetch(
      `${BASE_URL}/exam/${examId}/check-access?grade=${grade}&section=${section}`, 
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to check exam access');
    }

    const { hasAccess } = await response.json();
    return hasAccess;
  } catch (error) {
    console.error('Check exam access error:', error);
    throw error;
  }
};

// Get all exams (for students to view available exams)
export const getAllExams = async () => {
  try {
    const response = await fetch(`${BASE_URL}/exams`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch exams');
    }

    return await response.json();
  } catch (error) {
    console.error('Get all exams error:', error);
    throw error;
  }
};

// Add this function to your authService.js
export const uploadImage = async (imageData) => {
  try {
    const response = await fetch(`${BASE_URL}/upload-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify({ image: imageData })
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    return await response.json();
  } catch (error) {
    console.error('Image upload error:', error);
    throw error;
  }
};

// Add this utility function
export const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  // Remove '/auth' from BASE_URL since image paths are relative to the server root
  const serverUrl = BASE_URL.replace('/auth', '');
  return `${serverUrl}${imageUrl}`;
};

// export const getFullImageUrl = (imageUrl) => {
//   if (!imageUrl) return '';
  
//   // Ensure it's using HTTPS and correct domain
//   return imageUrl.replace('http://192.168.0.111:3300', 'https://ncnhs.loophole.site');
// };

// Add this function to fetch available sections
export const getAvailableSections = async (grade) => {
  try {
    const url = grade 
      ? `${BASE_URL}/available-sections?grade=${grade}`
      : `${BASE_URL}/available-sections`;
      
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch available sections');
    }

    return await response.json();
  } catch (error) {
    console.error('Get available sections error:', error);
    throw error;
  }
};

// Update the fetch student exam history function to use fetch instead of axios
export const getStudentExamHistory = async () => {
  try {
    const response = await fetch(`${BASE_URL}/student-exam-history`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch exam history');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching student exam history:', error);
    throw error;
  }
};

// Add this function to fetch all exams for admin monitoring
export const getAllExamsForAdmin = async () => {
  try {
    const response = await fetch(`${BASE_URL}/admin/exams`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch exams for admin monitoring');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching exams for admin monitoring:', error);
    throw error;
  }
};

// Add this function to fetch Mean Percentage Score (MPS) data for an exam
export const getExamMPS = async (examId) => {
  try {
    const response = await fetch(`${BASE_URL}/exam/${examId}/mps`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch MPS data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching exam MPS data:', error);
    throw error;
  }
};

// Subject management functions

/**
 * Create a new subject
 */
export const createSubject = async (subjectData) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Creating subject', subjectData);

    const response = await fetch(`${BASE_URL}/subjects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(subjectData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create subject");
    }

    const result = await response.json();
    console.log('AuthService: Subject created successfully', result);
    return result;
  } catch (error) {
    console.error("AuthService: Subject creation error:", error);
    throw error;
  }
};

/**
 * Update an existing subject
 */
export const updateSubject = async (id, subjectData) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Updating subject', { id, ...subjectData });

    const response = await fetch(`${BASE_URL}/subjects/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(subjectData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update subject");
    }

    const result = await response.json();
    console.log('AuthService: Subject updated successfully', result);
    return result;
  } catch (error) {
    console.error("AuthService: Subject update error:", error);
    throw error;
  }
};

/**
 * Delete a subject
 */
export const deleteSubject = async (id) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Deleting subject', { id });

    const response = await fetch(`${BASE_URL}/subjects/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete subject");
    }

    const result = await response.json();
    console.log('AuthService: Subject deleted successfully', result);
    return result;
  } catch (error) {
    console.error("AuthService: Subject deletion error:", error);
    throw error;
  }
};

/**
 * Get all subjects
 */
export const getAllSubjects = async () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching all subjects');

    const response = await fetch(`${BASE_URL}/subjects`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch subjects");
    }

    const { subjects } = await response.json();
    console.log('AuthService: Subjects fetched successfully', subjects);
    return subjects;
  } catch (error) {
    console.error("AuthService: Subject fetching error:", error);
    throw error;
  }
};

/**
 * Get a subject by ID
 */
export const getSubjectById = async (id) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching subject', { id });

    const response = await fetch(`${BASE_URL}/subjects/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch subject");
    }

    const { subject } = await response.json();
    console.log('AuthService: Subject fetched successfully', subject);
    return subject;
  } catch (error) {
    console.error("AuthService: Subject fetching error:", error);
    throw error;
  }
};

/**
 * Assign a teacher to a subject
 */
export const assignTeacherToSubject = async (teacherId, subjectId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Assigning teacher to subject', { teacherId, subjectId });

    const response = await fetch(`${BASE_URL}/teacher-subject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ teacherId, subjectId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to assign teacher to subject");
    }

    const result = await response.json();
    console.log('AuthService: Teacher assigned to subject successfully', result);
    return result;
  } catch (error) {
    console.error("AuthService: Teacher assignment error:", error);
    throw error;
  }
};

/**
 * Remove a teacher from a subject
 */
export const removeTeacherFromSubject = async (teacherId, subjectId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Removing teacher from subject', { teacherId, subjectId });

    const response = await fetch(`${BASE_URL}/teacher-subject/${teacherId}/${subjectId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to remove teacher from subject");
    }

    const result = await response.json();
    console.log('AuthService: Teacher removed from subject successfully', result);
    return result;
  } catch (error) {
    console.error("AuthService: Teacher removal error:", error);
    throw error;
  }
};

/**
 * Get subjects assigned to a teacher
 */
export const getTeacherSubjects = async (teacherId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching teacher subjects', { teacherId });

    const response = await fetch(`${BASE_URL}/teacher/${teacherId}/subjects`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch teacher subjects");
    }

    const { subjects } = await response.json();
    console.log('AuthService: Teacher subjects fetched successfully', subjects);
    return subjects;
  } catch (error) {
    console.error("AuthService: Teacher subjects fetching error:", error);
    throw error;
  }
};

/**
 * Assign a subject to a grade section
 */
export const assignSubjectToSection = async (grade, section, subjectId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Assigning subject to section', { grade, section, subjectId });

    const response = await fetch(`${BASE_URL}/section-subject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ grade, section, subjectId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to assign subject to section");
    }

    const result = await response.json();
    console.log('AuthService: Subject assigned to section successfully', result);
    return result;
  } catch (error) {
    console.error("AuthService: Subject section assignment error:", error);
    throw error;
  }
};

/**
 * Remove a subject from a grade section
 */
export const removeSubjectFromSection = async (grade, section, subjectId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Removing subject from section', { grade, section, subjectId });

    const response = await fetch(`${BASE_URL}/section-subject/${grade}/${section}/${subjectId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to remove subject from section");
    }

    const result = await response.json();
    console.log('AuthService: Subject removed from section successfully', result);
    return result;
  } catch (error) {
    console.error("AuthService: Subject section removal error:", error);
    throw error;
  }
};

/**
 * Get subjects assigned to a grade section
 */
export const getSectionSubjects = async (grade, section) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching section subjects', { grade, section });

    const response = await fetch(`${BASE_URL}/section/${grade}/${section}/subjects`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch section subjects");
    }

    const { subjects } = await response.json();
    console.log('AuthService: Section subjects fetched successfully', subjects);
    return subjects;
  } catch (error) {
    console.error("AuthService: Section subjects fetching error:", error);
    throw error;
  }
};

/**
 * Update a subject's schedule
 */
export const updateSubjectSchedule = async (subjectId, scheduleData) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/subjects/${subjectId}/schedule`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(scheduleData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update schedule");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating schedule:", error);
    throw error;
  }
};

/**
 * Get subjects assigned to the logged-in teacher
 */
export const getTeacherAssignedSubjects = async () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/teacher/subjects/assigned`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch assigned subjects");
    }

    const { subjects } = await response.json();
    return subjects;
  } catch (error) {
    console.error("Error fetching assigned subjects:", error);
    throw error;
  }
};

/**
 * Get subjects for the logged-in student
 */
export const getStudentSubjects = async () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/student/subjects`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch student subjects");
    }

    const { subjects } = await response.json();
    return subjects;
  } catch (error) {
    console.error("Error fetching student subjects:", error);
    throw error;
  }
};

/**
 * Create a new task for a subject
 */
export const createSubjectTask = async (subjectId, formData) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/subjects/${subjectId}/tasks`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData  // FormData will automatically set the correct Content-Type
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create task");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating task:", error);
    throw error;
  }
};

/**
 * Get all tasks for a subject
 */
export const getSubjectTasks = async (subjectId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/subjects/${subjectId}/tasks`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch tasks");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

/**
 * Submit a task
 */
export const submitTask = async (taskId, formData) => {
  try {
    console.log('Submitting task with files:', formData.getAll('files').length);
    
    const response = await fetch(`${BASE_URL}/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        // Note: Do NOT set Content-Type header when sending FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit task');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting task:', error);
    throw error;
  }
};

/**
 * Add students to task visibility
 */
export const addTaskVisibility = async (taskId, studentLRNs) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/tasks/${taskId}/visibility`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ studentLRNs })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update task visibility");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating task visibility:", error);
    throw error;
  }
};

/**
 * Remove students from task visibility
 */
export const removeTaskVisibility = async (taskId, studentLRNs) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/tasks/${taskId}/visibility`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ studentLRNs })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to remove task visibility");
    }

    return await response.json();
  } catch (error) {
    console.error("Error removing task visibility:", error);
    throw error;
  }
};

/**
 * Get students who can see the task
 */
export const getTaskVisibility = async (taskId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/tasks/${taskId}/visibility`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch task visibility");
    }

    const { visibility } = await response.json();
    return visibility;
  } catch (error) {
    console.error("Error fetching task visibility:", error);
    throw error;
  }
};

/**
 * Get students by grade and section
 */
export const getStudentsBySection = async (grade, section) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/students/grade/${grade}/section/${section}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch students");
    }

    const { students } = await response.json();
    return students;
  } catch (error) {
    console.error("Error fetching students by section:", error);
    throw error;
  }
};

// Add this helper function to get the base API URL without the /auth part
export const getBaseApiUrl = () => {
  const baseUrl = BASE_URL.replace('/auth', '');
  return baseUrl;
};

/**
 * Delete a subject task
 */
export const deleteSubjectTask = async (taskId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete task");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

/**
 * Score a task submission
 */
export const scoreSubmission = async (submissionId, { score, comment }) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/submissions/${submissionId}/score`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ score, comment })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to score submission");
    }

    return await response.json();
  } catch (error) {
    console.error("Error scoring submission:", error);
    throw error;
  }
};

/**
 * Get submissions for a task
 */
export const getTaskSubmissions = async (taskId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/tasks/${taskId}/submissions`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch task submissions");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching task submissions:", error);
    throw error;
  }
};

/**
 * Get sections for a subject
 */
export const getSectionsBySubject = async (subjectId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/subjects/${subjectId}/sections`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch subject sections");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching subject sections:", error);
    throw error;
  }
};

/**
 * Get tasks for a student
 */
export const getStudentTasks = async () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/student/tasks`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch student tasks");
    }

    const { tasks } = await response.json();
    return tasks;
  } catch (error) {
    console.error("Error fetching student tasks:", error);
    throw error;
  }
};

/**
 * Get task details for a student
 */
export const getStudentTaskDetails = async (taskId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/student/tasks/${taskId}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch task details");
    }

    const { task } = await response.json();
    return task;
  } catch (error) {
    console.error("Error fetching task details:", error);
    throw error;
  }
};

// Add this function to edit submissions
export const editSubmission = async (submissionId, formData) => {
  try {
    console.log('Editing submission with files:', formData.getAll('files').length);
    
    const response = await fetch(`${BASE_URL}/submissions/${submissionId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        // Note: Do NOT set Content-Type header when sending FormData
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to edit submission');
    }

    return await response.json();
  } catch (error) {
    console.error('Error editing submission:', error);
    throw error;
  }
};

// Add this function to delete a file
export const deleteFile = async (fileId) => {
  try {
    const response = await fetch(`${BASE_URL}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete file');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Get student's exam answers with details
 */
export const getStudentExamAnswers = async (examId, studentId, attemptId = null) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching student exam answers', { examId, studentId, attemptId });

    // Build URL with query parameter for attemptId if provided
    let url = `${BASE_URL}/exam/${examId}/student/${studentId}/answers`;
    if (attemptId) {
      url += `?attemptId=${attemptId}`;
    }

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch exam answers");
    }

    const result = await response.json();
    console.log('AuthService: Exam answers fetched successfully', result);
    return result;
  } catch (error) {
    console.error("AuthService: Exam answers fetch error:", error);
    throw error;
  }
};

/**
 * Update an exam answer's correctness
 */
export const updateStudentExamAnswer = async (answerId, isCorrect) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Updating exam answer', { answerId, isCorrect });

    const response = await fetch(`${BASE_URL}/exam-answer/${answerId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ isCorrect })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update exam answer");
    }

    const result = await response.json();
    console.log('AuthService: Exam answer updated successfully', result);
    return result;
  } catch (error) {
    console.error("AuthService: Exam answer update error:", error);
    throw error;
  }
};

/**
 * Update student's exam score manually
 */
export const updateStudentExamScore = async (examId, studentId, score) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Updating student exam score', { examId, studentId, score });

    const response = await fetch(`${BASE_URL}/exam/${examId}/student/${studentId}/score`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ score })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update exam score");
    }

    const result = await response.json();
    console.log('AuthService: Exam score updated successfully', result);
    return result;
  } catch (error) {
    console.error("AuthService: Exam score update error:", error);
    throw error;
  }
};

/**
 * Create a new question in the question bank
 */
export const createQuestionBankItem = async (questionData) => {
  try {
    const response = await fetch(`${BASE_URL}/question-bank`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify(questionData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create question');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating question bank item:', error);
    throw error;
  }
};

/**
 * Get questions from the question bank with optional filters
 */
export const getQuestionBankItems = async (filters = {}) => {
  try {
    // Convert filters object to query string
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });

    const response = await fetch(`${BASE_URL}/question-bank?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch questions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching question bank items:', error);
    throw error;
  }
};

/**
 * Update a question in the question bank
 */
export const updateQuestionBankItem = async (questionId, updateData) => {
  try {
    const response = await fetch(`${BASE_URL}/question-bank/${questionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update question');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating question bank item:', error);
    throw error;
  }
};

/**
 * Delete a question from the question bank
 */
export const deleteQuestionBankItem = async (questionId) => {
  try {
    const response = await fetch(`${BASE_URL}/question-bank/${questionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete question');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting question bank item:', error);
    throw error;
  }
};

/**
 * Import questions from question bank to an exam
 */
export const importQuestionsFromBank = async (examId, questionIds) => {
  try {
    const response = await fetch(`${BASE_URL}/exam/${examId}/import-questions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify({ questionIds })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to import questions');
    }

    return await response.json();
  } catch (error) {
    console.error('Error importing questions:', error);
    throw error;
  }
};

export const createQuestionBankFolder = async (folderData) => {
  try {
    const response = await fetch(`${BASE_URL}/question-bank/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify(folderData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create folder');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

export const getQuestionBankFolders = async () => {
  try {
    const response = await fetch(`${BASE_URL}/question-bank/folders`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get folders');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting folders:', error);
    throw error;
  }
};

export const deleteQuestionBankFolder = async (folderId) => {
  try {
    const response = await fetch(`${BASE_URL}/question-bank/folders/${folderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete folder');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

/**
 * Get component settings for a role
 */
export const getComponentSettings = async (role) => {
  try {
    const response = await fetch(`${BASE_URL}/component-settings/${role}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch component settings');
    }

    const { settings } = await response.json();
    return settings;
  } catch (error) {
    console.error('Error fetching component settings:', error);
    throw error;
  }
};

/**
 * Update component settings
 */
export const updateComponentSetting = async (role, componentPath, isEnabled) => {
  try {
    const response = await fetch(`${BASE_URL}/component-settings/${role}/${encodeURIComponent(componentPath)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      body: JSON.stringify({ isEnabled })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update component setting');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating component setting:', error);
    throw error;
  }
};

/**
 * Initialize default component settings
 */
export const initializeComponentSettings = async () => {
  try {
    const response = await fetch(`${BASE_URL}/component-settings/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to initialize component settings');
    }

    return await response.json();
  } catch (error) {
    console.error('Error initializing component settings:', error);
    throw error;
  }
};

/**
 * Get profile edit permissions
 * @returns {Promise<Object>} Object with permission settings
 */
export const getProfileEditPermissions = async () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/profile-edit-permissions`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch profile edit permissions");
    }

    const data = await response.json();
    return data.permissions;
  } catch (error) {
    console.error("Error fetching profile edit permissions:", error);
    throw error;
  }
};

/**
 * Update profile edit permissions
 * @param {Object} permissions Object containing permission settings
 * @param {boolean} [permissions.canEditLRN] Whether students can edit their LRN
 * @param {boolean} [permissions.canEditGradeSection] Whether students can edit their grade and section
 * @returns {Promise<Object>} Updated permissions
 */
export const updateProfileEditPermissions = async (permissions) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/profile-edit-permissions`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(permissions)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update profile edit permissions");
    }

    const data = await response.json();
    return data.permissions;
  } catch (error) {
    console.error("Error updating profile edit permissions:", error);
    throw error;
  }
};

// Add these functions for exam attempts

/**
 * Create a new exam attempt
 * @param {number} examId - The ID of the exam
 * @returns {Promise<Object>} - The created attempt
 */
export const createExamAttempt = async (examId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Creating exam attempt', { examId });

    const response = await fetch(`${BASE_URL}/exam/${examId}/attempt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create exam attempt");
    }

    const { attempt } = await response.json();
    return attempt;
  } catch (error) {
    console.error("AuthService: Create exam attempt error:", error);
    throw error;
  }
};

/**
 * Complete an exam attempt
 * @param {number} attemptId - The ID of the attempt to complete
 * @returns {Promise<Object>} - The completed attempt
 */
export const completeExamAttempt = async (attemptId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Completing exam attempt', { attemptId });

    const response = await fetch(`${BASE_URL}/exam-attempt/${attemptId}/complete`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to complete exam attempt");
    }

    const { attempt } = await response.json();
    return attempt;
  } catch (error) {
    console.error("AuthService: Complete exam attempt error:", error);
    throw error;
  }
};

/**
 * Get all attempts for a specific exam by the current user
 * @param {number} examId - The ID of the exam
 * @returns {Promise<Array>} - The user's attempts for the exam
 */
export const getUserExamAttempts = async (examId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching user exam attempts', { examId });

    const response = await fetch(`${BASE_URL}/exam/${examId}/attempts`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch exam attempts");
    }

    const { attempts } = await response.json();
    return attempts;
  } catch (error) {
    console.error("AuthService: Fetch exam attempts error:", error);
    throw error;
  }
};

/**
 * Check if a user is eligible to take an exam
 * @param {string} testCode - The test code of the exam
 * @returns {Promise<Object>} - Eligibility information and any active attempt
 */
export const checkExamEligibility = async (testCode) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Checking exam eligibility', { testCode });

    const response = await fetch(`${BASE_URL}/exam/${testCode}/eligibility`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to check exam eligibility");
    }

    const data = await response.json();
    
    // Log the complete eligibility response for debugging
    console.log('AuthService: Raw eligibility response:', data);
    
    // Make sure totalAttempts is available even if not returned from backend
    if (data.totalAttempts === undefined) {
      console.log('AuthService: totalAttempts not present in response, calculating locally');
      // Calculate totalAttempts from attempts array if available
      if (data.attempts && Array.isArray(data.attempts)) {
        data.totalAttempts = data.attempts.length;
      } else {
        // If no attempts array, check for nextAttemptNumber (which is 1-indexed)
        data.totalAttempts = data.nextAttemptNumber ? data.nextAttemptNumber - 1 : 0;
      }
      console.log('AuthService: Calculated totalAttempts:', data.totalAttempts);
    }

    return data;
  } catch (error) {
    console.error("AuthService: Check exam eligibility error:", error);
    throw error;
  }
};

/**
 * Restore a previous attempt record as the current score and exam answers
 * @param {number} recordId - The ID of the attempt record to restore
 * @returns {Promise<Object>} - Result containing the restored score and answer information
 */
export const restoreAttemptScore = async (recordId) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Restoring attempt record', { recordId });

    const response = await fetch(`${BASE_URL}/attempt-record/${recordId}/restore`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to restore attempt record");
    }

    const result = await response.json();
    console.log('AuthService: Attempt record restored successfully', result);
    return result;
  } catch (error) {
    console.error("AuthService: Attempt restore error:", error);
    throw error;
  }
};
