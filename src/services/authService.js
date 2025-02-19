const BASE_URL = 'http://localhost:3300/auth';

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
  try {
    console.log('AuthService: Starting student registration', studentData);

    const response = await fetch(`${BASE_URL}/register-student`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AuthService: Student registration failed', errorData);
      throw new Error(errorData.error || "Student registration failed");
    }

    const result = await response.json();
    console.log('AuthService: Student registration successful', result);
    return result;
  } catch (error) {
    console.error("AuthService: Registration error:", error);
    throw error;
  }
};

export const registerTeacher = async (teacherData) => {
  try {
    console.log('AuthService: Starting teacher registration', teacherData);

    const response = await fetch(`${BASE_URL}/register-teacher`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teacherData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AuthService: Teacher registration failed', errorData);
      throw new Error(errorData.error || "Teacher registration failed");
    }

    const result = await response.json();
    console.log('AuthService: Teacher registration successful', result);
    return result;
  } catch (error) {
    console.error("AuthService: Registration error:", error);
    throw error;
  }
};

export const registerAdmin = async (adminData) => {
  try {
    console.log('AuthService: Starting admin registration', adminData);

    const response = await fetch(`${BASE_URL}/register-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AuthService: Admin registration failed', errorData);
      throw new Error(errorData.error || "Admin registration failed");
    }

    const result = await response.json();
    console.log('AuthService: Admin registration successful', result);
    return result;
  } catch (error) {
    console.error("AuthService: Registration error:", error);
    throw error;
  }
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
        examTitle: examData.title,
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
      console.error('AuthService: Exam creation failed', errorData);
      throw new Error(errorData.error || "Failed to create exam");
    }

    const result = await response.json();
    console.log('AuthService: Exam creation successful', result);
    return result;
  } catch (error) {
    console.error("AuthService: Exam creation error:", error);
    throw error;
  }
};

export const fetchExamQuestions = async (testCode) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Fetching exam questions', { testCode });

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
      console.error('AuthService: Question fetch failed', errorData);
      throw new Error(errorData.error || "Failed to fetch exam questions");
    }

    const result = await response.json();
    console.log('AuthService: Question fetch successful', result);
    return result;
  } catch (error) {
    console.error("AuthService: Question fetch error:", error);
    throw error;
  }
};

export const submitExamAnswers = async (answerData) => {
  try {
    const token = localStorage.getItem("jwtToken");
    if (!token) throw new Error("No token found");

    console.log('AuthService: Submitting exam answers', answerData);

    const response = await fetch(`${BASE_URL}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(answerData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AuthService: Answer submission failed', errorData);
      throw new Error(errorData.error || "Failed to submit answers");
    }

    const result = await response.json();
    console.log('AuthService: Answer submission successful', result);
    return result;
  } catch (error) {
    console.error("AuthService: Answer submission error:", error);
    throw error;
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
  console.log('AuthService: Logging out user');
  localStorage.removeItem("jwtToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userId");
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
