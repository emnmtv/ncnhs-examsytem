<template>
  <div class="take-exam-container">
    <!-- Exam Session View -->
    <exam-session 
      v-if="showExamSession" 
      :test-code="testCode"
      @quit-exam="showExamSession = false"
      @answers-submitted="handleAnswersSubmitted"
    />
    
    <!-- Exam Setup View -->
    <div v-else class="exam-setup">
      <div class="header">
        <h1>Student Exam Portal</h1>
        <p class="subtitle">Enter a test code to join an exam session</p>
      </div>
      
      <!-- Test Code Input Section -->
      <div class="test-code-section" :class="{ 'with-exam': exam }">
        <div class="input-group">
          <input 
            v-model="testCode" 
            placeholder="Enter Test Code" 
            :disabled="exam"
            class="test-code-input"
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
              <div class="avatar" :style="{ backgroundColor: getAvatarColor(student.userName) }">
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
import { fetchExamQuestions } from '@/services/authService';
import { io } from 'socket.io-client';
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
      hasExamInProgress: false
    };
  },
  mounted() {
    this.initializeSocket();
    
    const savedTestCode = localStorage.getItem("testCode");
    if (savedTestCode) {
      this.testCode = savedTestCode;
      this.fetchExamQuestions();
    }
    
    // Load FontAwesome if not already loaded
    if (!document.getElementById('fontawesome-css')) {
      const link = document.createElement('link');
      link.id = 'fontawesome-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
      document.head.appendChild(link);
    }
  },
  created() {
    // Check for exam in progress when component is created
    this.checkExamInProgress();
  },
  methods: {
    initializeSocket() {
      if (!this.socket) {
        this.socket = io('http://localhost:3300');
        
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
      Swal.fire({
        title: 'Success!',
        text: `Your answers have been submitted successfully. You scored ${scoreResult.percentage}%`,
        icon: 'success',
        confirmButtonText: 'OK'
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
    }
  },
  beforeUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
};
</script>

<style scoped>
.take-exam-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.exam-setup {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header {
  text-align: center;
  margin-bottom: 10px;
}

.header h1 {
  color: #333;
  margin-bottom: 5px;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.test-code-section {
  background-color: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
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
}

.exam-header {
  padding: 20px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #eee;
}

.exam-header h2 {
  margin: 0 0 10px 0;
  color: #333;
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
  font-size: 0.9rem;
  color: #555;
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
  
  .exam-meta {
    flex-direction: column;
    gap: 10px;
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
</style> 