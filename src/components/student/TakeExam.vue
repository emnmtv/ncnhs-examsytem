<template>
  <div class="take-exam-container" :key="componentKey">
    <!-- Exam Session View -->
    <exam-session 
      v-if="showExamSession" 
      :test-code="testCode"
      @quit-exam="handleQuitExam"
      @answers-submitted="handleAnswersSubmitted"
    />
    
    <!-- Exam Setup View -->
    <div v-else class="exam-setup">
      <div class="header-container">
        <div class="header-content">
          <h1>Join Exam<span class="material-icons">computer</span></h1>
         
          <div class="divider"></div> <!-- Add this line -->
          
          <div class="header-text">
            
            
          </div>
        </div>
        <div class="header-background">EXAMS</div>
      </div>
      
      <!-- Test Code Input Section -->
      <div class="test-code-section" :class="{ 'with-exam': exam }">
        <div class="input-group">
          <input 
            v-model="testCode" 
            placeholder="Enter Test Code" 
            :disabled="exam"
            class="test-code-input uppercase-input"
          />
          <button 
            v-if="!exam" 
            @click="fetchExamQuestions"
            class="primary-btn"
          >
            Join Exam
          </button>
          <button 
            v-else 
            @click="quitExam"
            class="danger-btn"
          >
            Leave Exam
          </button>
        </div>
      </div>
      
      <!-- Error Message -->
      <div v-if="error" class="error-container">
        <div class="error-message">{{ error }}</div>
      </div>
      
      <!-- Exam Details Section -->
      <div v-if="exam" class="exam-details-container">
        <div class="exam-header">
          <div class="texture-layer"></div>
          <h2>{{ exam.examTitle }}</h2>
          <div class="exam-meta">
            <span class="exam-meta-item">
              <i class="fas fa-chalkboard"></i> {{ exam.classCode }}
            </span>
            <span class="exam-meta-item">
              <i class="fas fa-key"></i> {{ exam.testCode }}
            </span>
            <span class="exam-meta-item" :class="'status-' + exam.status">
              <i class="fas fa-circle"></i> {{ formatStatus(exam.status) }}
            </span>
          </div>
        </div>
        
        <div class="action-buttons">
          <button 
            @click="startExamSession" 
            class="primary-btn large"
          >
            <i class="fas" :class="hasExamInProgress ? 'fa-redo' : 'fa-play-circle'"></i>
            {{ hasExamInProgress ? 'Continue Exam' : 'Start Exam Session' }}
          </button>
        </div>
        
        <!-- Students Section -->
        <div class="students-container">
          <div class="section-header">
            <h3><i class="fas fa-users"></i> Students Waiting Room</h3>
            <span class="student-count">{{ students.length }} joined</span>
          </div>
          
          <div v-if="students.length === 0" class="no-students">
            <p>No students have joined yet...</p>
          </div>
          
          <div v-else class="students-grid">
            <div 
              v-for="student in students" 
              :key="student.userId" 
              class="student-card"
            >
              <div v-if="student.profilePicture" class="avatar-container">
                <img :src="getImageUrl(student.profilePicture)" class="avatar-image" alt="Profile" />
              </div>
              <div v-else class="avatar" :style="{ backgroundColor: getAvatarColor(student.userName) }">
                {{ getInitials(student.userName) }}
              </div>
              <div class="student-name">{{ student.userName }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { fetchExamQuestions, getFullImageUrl } from '@/services/authService';
import socketManager from '@/utils/socketManager';
import ExamSession from './ExamSession.vue';
import Swal from 'sweetalert2';

export default {
  components: {
    ExamSession
  },
  data() {
    return {
      testCode: '',
      exam: null,
      error: null,
      students: [],
      socket: null,
      showExamSession: false,
      currentTestCode: null,
      colors: [
        '#4CAF50', '#2196F3', '#FF9800', '#E91E63', 
        '#9C27B0', '#009688', '#673AB7', '#F44336'
      ],
      hasExamInProgress: false,
      examScore: null,
      componentKey: 0
    };
  },
  watch: {
    testCode(newValue) {
      if (newValue) {
        this.testCode = newValue.toUpperCase();
      }
    },
    '$route.query.testCode': {
      immediate: true,
      handler(newTestCode) {
        if (newTestCode) {
          console.log('Test code from route:', newTestCode);
          this.testCode = newTestCode.toUpperCase();
          this.fetchExamQuestions();
        }
      }
    }
  },
  mounted() {
    this.initializeSocket();
    
    // Check for saved test code if none in URL
    if (!this.$route.query.testCode) {
      const savedTestCode = localStorage.getItem("testCode");
      if (savedTestCode) {
        this.testCode = savedTestCode;
        this.fetchExamQuestions();
      }
    }
    
    // Load FontAwesome if not already loaded
    if (!document.getElementById('fontawesome-css')) {
      const link = document.createElement('link');
      link.id = 'fontawesome-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
      document.head.appendChild(link);
    }
    
    // Add window focus/blur handlers
    window.addEventListener('focus', this.handleWindowFocus);
    window.addEventListener('blur', this.handleWindowBlur);
  },
  created() {
    // Check for exam in progress when component is created
    this.checkExamInProgress();
  },
  methods: {
    initializeSocket() {
      if (!this.socket) {
        this.socket = socketManager.getSocket();
        
        if (this.socket) {
          // Set up reconnection handler
          this.socket.on('connect', () => {
            console.log('Socket reconnected - restoring exam state');
            if (this.testCode) {
              this.fetchExamQuestions();
            }
          });

          // Add exam status update listener
          this.socket.on('examStatusUpdate', ({ status }) => {
            if (this.exam) {
              this.exam.status = status;
              
              // Update UI based on status
              if (status === 'started') {
                Swal.fire({
                  title: 'Exam Started',
                  text: 'The exam has begun. Good luck!',
                  icon: 'info',
                  timer: 2000,
                  showConfirmButton: false
                });
              }
            }
          });

          this.socket.on('studentJoined', (students) => {
            console.log('Students joined:', students);
            this.students = students;
          });

          this.socket.on('studentLeft', (students) => {
            console.log('Students left:', students);
            this.students = students;
          });
        }
      }
    },
    
    checkExamInProgress() {
      const examState = localStorage.getItem('examState');
      if (examState) {
        const state = JSON.parse(examState);
        if (state.testCode === this.testCode) {
          this.hasExamInProgress = true;
        }
      }
    },
    
    async fetchExamQuestions() {
      if (!this.testCode.trim()) {
        this.error = "Please enter a test code";
        return;
      }
      
      try {
        this.error = null;
        const response = await fetchExamQuestions(this.testCode);
        this.exam = response.exam;

        // Check if there's an exam in progress
        this.checkExamInProgress();

        console.log('Exam data received:', this.exam);
        
        if (!this.exam.status) {
          console.warn('Exam status is missing from the response - using default');
          this.exam.status = 'unknown';
        }

        localStorage.setItem("testCode", this.testCode);

        const userId = localStorage.getItem("userId");
        
        if (userId) {
          if (this.currentTestCode) {
            this.socket.emit('quitExam', { testCode: this.currentTestCode });
          }
          
          this.currentTestCode = this.testCode;
          this.socket.emit('joinExam', { testCode: this.testCode, userId });
          console.log(`Joined exam room: ${this.testCode} with user ID: ${userId}`);
        } else {
          this.error = "User ID not found. Please log in again.";
        }
      } catch (err) {
        this.error = err.message;
      }
    },
    
    startExamSession() {
      if (!this.exam) {
        Swal.fire({
          title: 'Error',
          text: 'No exam data available. Please fetch the exam first.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      console.log('Current exam status:', this.exam.status);

      if (this.exam.status === "started" || this.hasExamInProgress) {
        this.showExamSession = true;
      } 
      else if (this.exam.status === "pending") {
        Swal.fire({
          title: 'Exam Not Started',
          text: 'Please wait for the teacher to start the exam.',
          icon: 'info',
          confirmButtonText: 'OK'
        });
      } 
      else if (this.exam.status === "stopped") {
        Swal.fire({
          title: 'Exam Ended',
          text: 'This exam has already ended.',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
      }
      else {
        Swal.fire({
          title: 'Cannot Start Exam',
          text: `Exam status: ${this.exam.status || 'undefined'}`,
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    },
    
    quitExam() {
      Swal.fire({
        title: 'Leave Exam?',
        text: 'Are you sure you want to leave this exam? Any saved progress will be lost.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, leave',
        cancelButtonText: 'No, stay'
      }).then((result) => {
        if (result.isConfirmed) {
          // Clear exam state from localStorage
          localStorage.removeItem('examState');
          
          if (this.socket) {
            this.socket.emit('quitExam', { testCode: this.testCode });
          }

          localStorage.removeItem("testCode");
          
          this.exam = null;
          this.students = [];
          this.showExamSession = false;
          this.testCode = '';
          this.currentTestCode = null;
          this.hasExamInProgress = false;
          
          Swal.fire(
            'Left Exam',
            'You have successfully left the exam.',
            'success'
          );
        }
      });
    },
    
    handleAnswersSubmitted(scoreResult) {
      console.log('Answers submitted successfully, score:', scoreResult);
      
      // Store the score for reference
      this.examScore = scoreResult;
      
      // DON'T reset anything here - let the user view their results
      // The user will explicitly call quitExam when they're ready
      
      // Just show a small notification that submission was successful
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
      
      Toast.fire({
        icon: 'success',
        title: `Answers submitted! Score: ${scoreResult.percentage}%`
      });
    },
    
    getInitials(name) {
      if (!name) return '?';
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    },
    
    getAvatarColor(name) {
      if (!name) return this.colors[0];
      
      // Generate a consistent index based on the name
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const index = Math.abs(hash) % this.colors.length;
      return this.colors[index];
    },
    
    formatStatus(status) {
      if (!status) return 'Unknown';
      
      // Capitalize first letter
      return status.charAt(0).toUpperCase() + status.slice(1);
    },
    
    getImageUrl(imageUrl) {
      return getFullImageUrl(imageUrl);
    },
    
    handleQuitExam() {
      console.log('User quit exam session, refreshing component...');
      
      // Show loading SweetAlert
      Swal.fire({
        title: 'Reconnecting...',
        text: 'Please wait while your session refreshes',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      // First, mark exam session as not showing
      this.showExamSession = false;
      
      // Force component to re-render by changing the key
      this.componentKey += 1;
      
      // Clean up current socket event listeners
      if (this.socket) {
        this.socket.off('examStatusUpdate');
        this.socket.off('studentJoined');
        this.socket.off('studentLeft');
        
        // Disconnect and reconnect the socket completely
        socketManager.disconnect();
        setTimeout(() => {
          this.socket = null;
          this.initializeSocket();
          
          // If we have an exam, re-join the room after a short delay
          if (this.exam && this.testCode) {
            setTimeout(() => {
              const userId = localStorage.getItem("userId");
              if (userId) {
                console.log(`Re-joining exam room: ${this.testCode} with user ID: ${userId}`);
                this.socket.emit('joinExam', { testCode: this.testCode, userId });
              }
              
              // Re-fetch exam details to ensure everything is up to date
              this.fetchExamQuestions();
              
              // Close the loading SweetAlert after everything is done
              setTimeout(() => {
                Swal.close();
              }, 500);
            }, 500);
          } else {
            // Close the loading alert if we don't have an exam to rejoin
            Swal.close();
          }
        }, 500);
      } else {
        // Close the loading alert if there's no socket
        Swal.close();
      }
      
      // Reset exam progress flag
      this.hasExamInProgress = false;
      
      // Also reset the students array to ensure it's freshly populated
      this.students = [];
    },
    
    handleWindowFocus() {
      console.log('Window focused - checking connection');
      if (!this.socket?.connected) {
        console.log('Socket disconnected - attempting to reconnect');
        this.initializeSocket();
        
        // Re-fetch exam data if we were in an exam
        if (this.testCode) {
          this.fetchExamQuestions();
        }
      }
    },

    handleWindowBlur() {
      // Optionally handle window blur
      console.log('Window blurred');
    }
  },
  beforeUnmount() {
    // Remove window event listeners
    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('blur', this.handleWindowBlur);
    
    // Remove only the listeners, don't disconnect the socket
    if (this.socket) {
      this.socket.off('examStatusUpdate');
      this.socket.off('studentJoined');
      this.socket.off('studentLeft');
    }
  }
};
</script>

<style scoped>
.take-exam-container {
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-y: hidden;
  overflow-x: hidden;
  
}

.exam-setup {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}

.header {
  text-align: left;
  margin-bottom: 10px;
}

.header h1 {
  color: #333;
  margin-bottom: 5px;
}
.header-content h1 {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  padding-left: 1%;
  

}
.subtitle {
  color: #666;
  font-size: 1rem;
}

.header-background {
  position: absolute;
  top: 20%;
  right: 5rem;
  transform: translateY(-50%);
  font-size: 8rem;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.03);
  z-index: 0;
  user-select: none;
  pointer-events: none;
  overflow: hidden;
  white-space: nowrap;
}

.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 1.5rem 0;
  width: 100%;
  max-width: auto; 
}

.test-code-section {
  background-color: #f8f9fa;
  border-radius: 10px;
  /* padding: 20px; */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.test-code-section.with-exam {
  background-color: #e8f5e9;
}

.input-group {
  display: flex;
  gap: 10px;
}

.test-code-input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s;
}

.test-code-input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.primary-btn, .danger-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.primary-btn {
  background-color: #4CAF50;
  color: white;
}

.primary-btn:hover {
  background-color: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.danger-btn {
  background-color: #f44336;
  color: white;
}

.danger-btn:hover {
  background-color: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.primary-btn.large {
  padding: 15px 25px;
  font-size: 1.1rem;
}

.error-container {
  padding: 10px;
  background-color: #ffebee;
  border-radius: 6px;
  margin-bottom: 10px;
}

.error-message {
  color: #c62828;
  font-size: 0.9rem;
}

.exam-details-container {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  position: relative;
}

.exam-header {
  padding: 20px;
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
/* Main paint swipe */
.exam-header::after {
  content: '';
  position: absolute;
  top: 0;
  right: -10%;
  width: 50%;
  height: 100%;
  background: linear-gradient(45deg, 
    transparent 0%,
    rgba(255, 255, 255, 0.05) 30%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 70%,
    transparent 100%
  );
  transform: skewX(-20deg);
  pointer-events: none;
}

/* Secondary paint swipe */
.exam-header::before {
  content: '';
  position: absolute;
  top: -20%;
  right: 20%;
  width: 30%;
  height: 200%;
  background: linear-gradient(45deg,
    transparent 0%,
    rgba(255, 255, 255, 0.02) 30%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.02) 70%,
    transparent 100%
  );
  transform: skewX(-35deg);
  pointer-events: none;
}

/* Additional texture layers */
.exam-header .texture-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.05) 0%,
      transparent 50%
    ),
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.03) 25%,
      rgba(255, 255, 255, 0.03) 75%,
      transparent 100%
    );
  pointer-events: none;
}

/* Hover animations */
.exam-header:hover::after {
  transform: skewX(-20deg) translateX(10px);
  transition: transform 0.3s ease;
}

.exam-header:hover::before {
  transform: skewX(-35deg) translateX(-10px);
  transition: transform 0.3s ease;
}

.exam-header h2 {
  margin: 0 0 10px 0;
  color: #f1f1f1;
  font-size: 1.5rem;
}

.exam-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.exam-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
  color: #fafafa;
  font-weight: 600;
}

.status-started {
  color: #4CAF50;
}

.status-pending {
  color: #FF9800;
}

.status-stopped {
  color: #F44336;
}

.action-buttons {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.students-container {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.student-count {
  background-color: #e8f5e9;
  color: #4CAF50;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.no-students {
  text-align: center;
  padding: 30px;
  color: #757575;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
}

.student-card {
  background-color: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  text-align: center;
  transition: all 0.2s;
  border: 1px solid #eee;
}

.student-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0 auto 10px;
}

.student-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .input-group {
    flex-direction: column;
  }
  .take-exam-container {
  padding: 5px; 
}
  .header-background {
  position: absolute;
  top: 27%;
  right: 0.3rem;

  font-size: 4rem;
  font-weight: 900;

}
.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 0.5rem;
  width: 100%;
  max-width: auto; 
}
.header-content h1 {
  color: #159750;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
 .material-icons {
  color: #159750;
  font-size: 2rem;
  font-weight: 700;
  padding-left: 1%;
  

}
.exam-header h2 {
  margin: 0 0 10px 0;
  color: #f1f1f1;
  font-size: 1.2rem;
}
  .exam-meta {
    flex-direction: row;
    gap: 5px;
    
  }
  
.exam-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;

  font-weight: 600;
}
  
  .students-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}

.primary-btn i {
  margin-right: 8px;
}

.primary-btn.large i {
  font-size: 1.2rem;
}

.uppercase-input {
  text-transform: uppercase;
}

.uppercase-input::placeholder {
  text-transform: none;
}

.question-image {
  margin: 15px 0;
  text-align: center;
}

.question-image img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.avatar-container {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin: 0 auto 10px;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 768px) {
  /* ... existing media queries ... */
  .avatar-container {
    width: 40px;
    height: 40px;
  }
}
</style> 