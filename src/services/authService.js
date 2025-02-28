// const BASE_URL = 'http://localhost:3300/auth';
const BASE_URL = 'http://192.168.0.110:3300/auth';
// Helper function to decode JWT token
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

    const {  token } = await response.json();
    console.log('AuthService: Login successful');

    // Store the token
    localStorage.setItem("jwtToken", token);

    // Decode and store user info from token
    const payload = decodeToken(token);
    console.log('AuthService: Decoded token payload:', payload); // Debug log

    if (payload) {
      localStorage.setItem("userId", payload.userId.toString());
      localStorage.setItem("userRole", payload.role);
      
      // //helloReturn both token and decoded info
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

    console.log('AuthService: Updating profile', profileData);

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

// Exam management functions with token-based auth
export const createExam = async (examData) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Creating exam', examData);

    const response = await fetch(`${BASE_URL}/exam`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        testCode: examData.testCode,
        classCode: examData.classCode,
        examTitle: examData.examTitle,
        isDraft: examData.isDraft,
        status: examData.status,
        questions: examData.questions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.questionType === 'enumeration' ? [] : (q.options || []),
          correctAnswer: q.correctAnswer
        })),
        userId: examData.userId
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
    // Clear all authentication-related items from localStorage
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('testCode');
    // Clear any other app-specific storage items
    localStorage.clear(); // This will clear everything
    
    console.log('AuthService: User logged out successfully');
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

    const { scores } = await response.json();
    console.log('AuthService: Student scores fetch successful', scores);
    return scores;
  } catch (error) {
    console.error("AuthService: Student scores fetch error:", error);
    throw error;
  }
};

/**
 * Fetch all exams created by the logged-in teacher
 */
export const fetchTeacherExams = async () => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    const response = await fetch(`${BASE_URL}/teacher-exams`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch teacher exams");
    }

    const { exams } = await response.json();
    return exams;
  } catch (error) {
    console.error("AuthService: Teacher exams fetch error:", error);
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
        questions: examData.questions.map(q => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.questionType === 'enumeration' ? [] : (q.options || []),
          correctAnswer: q.correctAnswer
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

    const { analysis } = await response.json();
    return analysis;
  } catch (error) {
    console.error("AuthService: Exam analysis fetch error:", error);
    throw error;
  }
};
