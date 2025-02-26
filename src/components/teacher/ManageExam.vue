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
  
  export default {
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
          await stopExam(this.testCode);
          Swal.fire({
            title: 'Success!',
            text: 'Exam stopped successfully.',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } catch (error) {
          this.error = error.message;
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
    max-width: 900px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  .header {
    text-align: center;
    margin-bottom: 20px;
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
  
  .students-container {
    padding: 20px;
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
  </style>