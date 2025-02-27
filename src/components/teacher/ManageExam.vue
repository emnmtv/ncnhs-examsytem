<template>
    <div class="manage-exam-container">
      <div class="header">
        <h1>Manage Exam</h1>
        <p class="subtitle">Enter a test code to manage the exam session</p>
      </div>
  
      <div class="test-code-section" :class="{ 'with-exam': showExamControls }">
        <div class="input-group">
          <input 
            v-model="testCode" 
            placeholder="Enter Test Code" 
            class="test-code-input"
          />
          <button 
            @click="joinExam"
            class="primary-btn"
          >
            Join Exam
          </button>
        </div>
      </div>
  
      <div v-if="error" class="error-container">
        <div class="error-message">{{ error }}</div>
      </div>
  
      <div v-if="students.length > 0" class="students-container">
        <h3>Students in Exam</h3>
        <div class="students-grid">
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
  
      <div v-if="showExamControls" class="progress-section">
        <ExamProgressModal 
          :test-code="testCode"
          ref="progressModal"
        />
      </div>
  
      <div class="action-buttons" v-if="showExamControls">
        <button 
          @click="startExam"
          class="primary-btn"
        >
          Start Exam
        </button>
        <button 
          @click="stopExam"
          class="danger-btn"
        >
          Stop Exam
        </button>
        <button 
          @click="quitExam"
          class="danger-btn"
        >
          Quit Exam
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { startExam, stopExam } from '@/services/authService';
  import { io } from 'socket.io-client';
  import Swal from 'sweetalert2';
  import ExamProgressModal from './ExamProgressModal.vue';
  
  export default {
    components: {
      ExamProgressModal
    },
    data() {
      return {
        testCode: localStorage.getItem("testCode") || '',
        error: null,
        students: [],
        socket: null,
        showExamControls: false,
        colors: [
          '#4CAF50', '#2196F3', '#FF9800', '#E91E63', 
          '#9C27B0', '#009688', '#673AB7', '#F44336'
        ]
      };
    },
    mounted() {
      this.initializeSocket();
      if (this.testCode) {
        this.joinExam();
      }
    },
    methods: {
      initializeSocket() {
        this.socket = io('http://localhost:3300');
        this.socket.on('studentJoined', (students) => {
          this.students = students;
        });
        this.socket.on('studentLeft', (students) => {
          this.students = students;
        });
        this.socket.on('examProgressUpdate', (progressData) => {
          if (this.$refs.progressModal) {
            this.$refs.progressModal.updateStudentProgress(progressData);
          }
        });
      },
      async joinExam() {
        if (!this.testCode.trim()) {
          this.error = "Please enter a test code";
          return;
        }
  
        this.error = null;
        const userId = localStorage.getItem("userId");
  
        if (userId) {
          this.socket.emit('joinExam', { testCode: this.testCode, userId });
          this.showExamControls = true;
          localStorage.setItem("testCode", this.testCode);
        } else {
          this.error = "User ID not found. Please log in again.";
        }
      },
      async startExam() {
        try {
          await startExam(this.testCode);
          // Emit socket event for real-time update
          this.socket.emit('examStatusChanged', { 
            testCode: this.testCode, 
            status: 'started' 
          });
          
          Swal.fire({
            title: 'Success!',
            text: 'Exam started successfully.',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } catch (error) {
          this.error = error.message;
        }
      },
      async stopExam() {
        try {
          console.log('Stopping exam:', this.testCode);
          
          // First update the backend
          await stopExam(this.testCode);
          
          // Make sure socket is connected
          if (!this.socket.connected) {
            await new Promise(resolve => this.socket.connect(resolve));
          }
          
          // Join the exam room before emitting
          this.socket.emit('joinExam', {
            testCode: this.testCode,
            userId: localStorage.getItem('userId')
          });
          
          // Emit the stop event
          this.socket.emit('examStatusChanged', { 
            testCode: this.testCode, 
            status: 'stopped' 
          });
          
          console.log('Stop exam signal emitted');
          
          Swal.fire({
            title: 'Success!',
            text: 'Exam stopped successfully.',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } catch (error) {
          console.error('Error stopping exam:', error);
          this.error = error.message;
          Swal.fire({
            title: 'Error',
            text: error.message || 'Failed to stop exam',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      },
      async quitExam() {
        const userId = localStorage.getItem("userId");
        if (userId) {
          this.socket.emit('quitExam', { testCode: this.testCode });
          this.showExamControls = false;
          this.students = [];
          this.testCode = '';
          localStorage.removeItem("testCode");
          Swal.fire({
            title: 'Success!',
            text: 'You have quit the exam.',
            icon: 'info',
            confirmButtonText: 'OK'
          });
        } else {
          this.error = "User ID not found. Please log in again.";
        }
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
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % this.colors.length;
        return this.colors[index];
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
  .manage-exam-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  .header {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .header h1 {
    font-size: 2.5rem;
    color: #2c3e50;
    margin-bottom: 10px;
  }
  
  .subtitle {
    color: #666;
    font-size: 1.1rem;
  }
  
  .test-code-section {
    background-color: #ffffff;
    border-radius: 15px;
    padding: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    margin-bottom: 30px;
  }
  
  .test-code-section.with-exam {
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
  }
  
  .input-group {
    display: flex;
    gap: 15px;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .test-code-input {
    flex: 1;
    padding: 15px 20px;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    font-size: 1.1rem;
    outline: none;
    transition: all 0.3s;
  }
  
  .test-code-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .primary-btn, .danger-btn {
    padding: 15px 30px;
    border: none;
    border-radius: 10px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  
  .primary-btn {
    background-color: #3b82f6;
    color: white;
  }
  
  .primary-btn:hover {
    background-color: #2563eb;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  }
  
  .danger-btn {
    background-color: #ef4444;
    color: white;
  }
  
  .danger-btn:hover {
    background-color: #dc2626;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
  }
  
  .students-container {
    background-color: #ffffff;
    border-radius: 15px;
    padding: 30px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 30px;
  }
  
  .students-container h3 {
    color: #2c3e50;
    font-size: 1.5rem;
    margin-bottom: 20px;
  }
  
  .students-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 20px;
  }
  
  .student-card {
    background-color: #f8fafc;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    text-align: center;
    transition: all 0.2s;
  }
  
  .student-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    font-weight: bold;
    margin: 0 auto 15px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .student-name {
    font-size: 1rem;
    font-weight: 500;
    color: #334155;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .action-buttons {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-top: 30px;
  }
  
  .error-container {
    background-color: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 15px 20px;
    margin: 20px 0;
  }
  
  .error-message {
    color: #dc2626;
    font-size: 0.95rem;
    text-align: center;
  }
  
  .progress-section {
    margin-top: 30px;
  }
  </style>