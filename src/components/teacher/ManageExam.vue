<template>
    <div class="manage-exam-container" :key="componentKey">
     <!-- Update header section to match TakeExam -->
     <div class="header-container">
      <div class="header-content">
        <h1>Manage Exam<span class="material-icons">admin_panel_settings</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Monitor and control your exam session</p>
        </div>
      </div>
      <div class="header-background">MONITOR</div>
    </div>
  
      <div class="test-code-section" :class="{ 'with-exam': showExamControls }">
        <div class="input-wrapper">
          <label for="testCode">Test Code</label>
          <input 
            id="testCode"
            v-model="testCode" 
            placeholder="Enter your exam code here" 
            class="test-code-input uppercase-input"
            :disabled="showExamControls"
          />
          <button 
            v-if="!showExamControls"
            @click="joinExam"
            class="join-btn"
            :disabled="!testCode.trim()"
          >
            <span class="material-icons-round">login</span>
            Join Exam Session
          </button>
        </div>
      </div>
  
      <div v-if="error" class="error-container">
        <i class="fas fa-exclamation-circle"></i>
        <div class="error-message">{{ error }}</div>
      </div>
  
      <div v-if="showExamControls" class="control-panel">
        <div class="panel-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <span class="material-icons-round">groups</span>
            </div>
            <div class="stat-info">
              <h3>Students</h3>
              <div class="stat-value">{{ students.length }}</div>
              <p class="stat-label">Active Participants</p>
            </div>
          </div>
  
          <div class="stat-card">
            <div class="stat-icon">
              <span class="material-icons-round">schedule</span>
            </div>
            <div class="stat-info">
              <h3>Status</h3>
              <div class="stat-value status-badge" :class="exam?.status || 'pending'">
                {{ formatStatus(exam?.status || 'pending') }}
              </div>
            </div>
          </div>
  
          <div class="action-card">
            <button 
              @click="startExam"
              class="control-btn start-btn"
              :disabled="exam?.status === 'started'"
            >
              <span class="material-icons-round">play_arrow</span>
              Start Exam
            </button>
            <button 
              @click="stopExam"
              class="control-btn stop-btn"
              :disabled="exam?.status === 'stopped'"
            >
              <span class="material-icons-round">stop</span>
              Stop Exam
            </button>
            <button 
              @click="quitExam"
              class="control-btn quit-btn"
            >
              <span class="material-icons-round">logout</span>
              Exit Session
            </button>
          </div>
        </div>
  
        <div class="progress-section">
          <div class="section-header">
            <h2>
              <span class="material-icons-round">analytics</span>
              Student Progress
            </h2>
          </div>
          <ExamProgressModal 
            :test-code="testCode"
            ref="progressModal"
          />
        </div>
  
        <div v-if="students.length > 0" class="students-section">
          <div class="section-header">
            <h2>
              <span class="material-icons-round">school</span>
              Active Students
            </h2>
            <span class="student-count">{{ students.length }} Connected</span>
          </div>
          <div class="students-grid">
            <div 
              v-for="student in students" 
              :key="student.userId" 
              class="student-card"
              :class="{ 'teacher': student.role === 'teacher' }"
            >
              <div class="avatar" :style="{ backgroundColor: getAvatarColor(student.userName) }">
                {{ getInitials(student.userName) }}
              </div>
              <div class="student-info">
                <div class="student-name">{{ student.userName }}</div>
                <div class="student-status">
                  <span class="status-dot"></span>
                  Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { startExam, stopExam, fetchExamQuestions } from '@/services/authService';
  import socketManager from '@/utils/socketManager';
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
        exam: null,
        loading: false,
        colors: [
          '#4CAF50', '#2196F3', '#FF9800', '#E91E63', 
          '#9C27B0', '#009688', '#673AB7', '#F44336'
        ],
        componentKey: 0
      };
    },
    watch: {
      testCode(newValue) {
        if (newValue) {
          this.testCode = newValue.toUpperCase();
        }
      }
    },
    mounted() {
      this.initializeSocket();
      
      // Check for saved exam session
      const savedTestCode = localStorage.getItem("testCode");
      if (savedTestCode) {
        this.testCode = savedTestCode;
        this.joinExam();
      }
      
      // Add window focus/blur handlers
      window.addEventListener('focus', this.handleWindowFocus);
      window.addEventListener('blur', this.handleWindowBlur);
    },
    methods: {
      initializeSocket() {
        if (!this.socket) {
          this.socket = socketManager.getSocket();
          
          if (this.socket) {
            // Set up reconnection handler
            this.socket.on('connect', () => {
              console.log('Socket reconnected - restoring exam state');
              if (this.showExamControls && this.testCode) {
                this.joinExam();
              }
            });

            // Set up socket event listeners
            this.socket.on('studentJoined', (students) => {
              console.log('Students joined event received:', students);
              // Filter out the teacher from the students list
              this.students = students.filter(student => student.role !== 'teacher');
            });
            
            this.socket.on('studentLeft', (students) => {
              console.log('Students left event received:', students);
              // Filter out the teacher from the students list
              this.students = students.filter(student => student.role !== 'teacher');
            });
            
            this.socket.on('examProgressUpdate', (progressData) => {
              if (this.$refs.progressModal) {
                this.$refs.progressModal.updateStudentProgress(progressData);
              }
            });

            this.socket.on('examStatusUpdate', ({ status }) => {
              console.log('Exam status update received:', status);
              if (this.exam) {
                this.exam.status = status;
              }
            });
          }
        }
      },
      async joinExam() {
        if (!this.testCode.trim()) {
          this.error = "Please enter a test code";
          return;
        }
        
        // Show loading indicator
        this.loading = true;
        Swal.fire({
          title: 'Connecting...',
          text: 'Please wait while we connect to the exam session',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        this.error = null;
        
        try {
          // First fetch the exam details to ensure it exists
          const examDetails = await fetchExamQuestions(this.testCode);
          this.exam = examDetails.exam;
          
          const userId = localStorage.getItem("userId");
          
          if (userId) {
            // Ensure we have a clean socket connection
            if (this.socket) {
              // Clean up existing listeners
              this.socket.off('studentJoined');
              this.socket.off('studentLeft');
              this.socket.off('examProgressUpdate');
              this.socket.off('examStatusUpdate');
            }
            
            // Reinitialize socket to ensure fresh connection
            this.socket = null;
            this.initializeSocket();
            
            console.log('Joining exam as teacher:', this.testCode, userId);
            
            // Join the exam with a short delay to ensure socket is ready
            setTimeout(() => {
              this.socket.emit('joinExam', { 
                testCode: this.testCode, 
                userId,
                role: 'teacher' // Specify role as teacher
              });
              
              this.showExamControls = true;
              localStorage.setItem("testCode", this.testCode);
              
              // Close loading dialog
              Swal.close();
              this.loading = false;
              
              // Force component refresh
              this.componentKey += 1;
            }, 500);
          } else {
            this.error = "User ID not found. Please log in again.";
            Swal.close();
            this.loading = false;
          }
        } catch (error) {
          console.error('Error joining exam:', error);
          this.error = error.message || "Failed to join exam session";
          Swal.close();
          this.loading = false;
        }
      },
      async startExam() {
        try {
          await startExam(this.testCode);
          this.socket.emit('examStatusChanged', { 
            testCode: this.testCode, 
            status: 'started' 
          });
          
          this.exam = { ...this.exam, status: 'started' };
          
          Swal.fire({
            title: 'Success!',
            text: 'Exam started successfully.',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        } catch (error) {
          this.error = error.message;
          Swal.fire({
            title: 'Error',
            text: error.message || 'Failed to start exam',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      },
      async stopExam() {
        try {
          await stopExam(this.testCode);
          
          // Emit the stop event
          this.socket.emit('examStatusChanged', { 
            testCode: this.testCode, 
            status: 'stopped' 
          });
          
          this.exam = { ...this.exam, status: 'stopped' };
          
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
          this.exam = null;
          localStorage.removeItem("testCode");
          
          // Remove socket listeners
          this.socket.off('studentJoined');
          this.socket.off('studentLeft');
          this.socket.off('examProgressUpdate');
          this.socket.off('examStatusUpdate');
          
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
      },
      formatStatus(status) {
        switch (status) {
          case 'started':
            return 'Started';
          case 'stopped':
            return 'Stopped';
          default:
            return 'Pending';
        }
      },
      handleWindowFocus() {
        console.log('Window focused - checking connection');
        if (!this.socket?.connected) {
          console.log('Socket disconnected - attempting to reconnect');
          this.initializeSocket();
          
          // Re-join exam if we were in one
          if (this.showExamControls && this.testCode) {
            this.joinExam();
          }
        }
      },
      handleWindowBlur() {
        // Optionally handle window blur
        console.log('Window blurred');
      }
    },
    beforeUnmount() {
      if (this.socket) {
        // Remove all listeners before unmounting
        this.socket.off('studentJoined');
        this.socket.off('studentLeft');
        this.socket.off('examProgressUpdate');
        this.socket.off('examStatusUpdate');
      }
      
      // Remove window event listeners
      window.removeEventListener('focus', this.handleWindowFocus);
      window.removeEventListener('blur', this.handleWindowBlur);
    }
  };
  </script>
  
  <style scoped>
  .manage-exam-container {
      max-width: auto;
    margin: 0 auto;
    padding: 2rem;
    font-family: 'Inter', sans-serif;
  }
  .header-container {
  position: relative;
  margin-bottom: 30px;
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-content h1 {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
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

.subtitle {
  color: #666;
  font-size: 1.1rem;
}
  
  .test-code-section {
    background: #fff;
    border-radius: 16px;
    padding: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 2rem;
  }
  
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 500px;
    margin: 0 auto;
  }
  
  .input-wrapper label {
    font-weight: 600;
    color: #333;
    font-size: 1rem;
  }
  
  .test-code-input {
    width: 100%;
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 1.1rem;
    transition: all 0.3s ease;
  }
  
  .test-code-input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    outline: none;
  }
  
  .join-btn {
    width: 100%;
    padding: 1rem;
    background: #4f46e5;
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .join-btn:hover {
    background: #4338ca;
    transform: translateY(-1px);
  }
  
  .join-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
  
  .control-panel {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .panel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
  
  .stat-card {
    background: #fff;
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: #4f46e5;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-info h3 {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.5rem;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1a1a1a;
  }
  
  .stat-label {
    font-size: 0.9rem;
    color: #666;
    margin-top: 0.25rem;
  }
  
  .status-badge {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.9rem;
    font-weight: 600;
  }
  
  .status-badge.pending {
    background: #fef3c7;
    color: #92400e;
  }
  
  .status-badge.started {
    background: #dcfce7;
    color: #166534;
  }
  
  .status-badge.stopped {
    background: #fee2e2;
    color: #991b1b;
  }
  
  .action-card {
    background: #fff;
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  
  .control-btn {
    padding: 0.75rem;
    border-radius: 12px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .start-btn {
    background: #4f46e5;
    color: white;
  }
  
  .start-btn:hover {
    background: #4338ca;
  }
  
  .stop-btn {
    background: #ef4444;
    color: white;
  }
  
  .stop-btn:hover {
    background: #dc2626;
  }
  
  .quit-btn {
    background: #f3f4f6;
    color: #1f2937;
  }
  
  .quit-btn:hover {
    background: #e5e7eb;
  }
  
  .control-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .section-header h2 {
    font-size: 1.25rem;
    color: #1a1a1a;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .student-count {
    background: #4f46e5;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
  }
  
  .students-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .student-card {
    background: #fff;
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }
  
  .student-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
  
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }
  
  .student-info {
    flex: 1;
  }
  
  .student-name {
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 0.25rem;
  }
  
  .student-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #22c55e;
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
  }
  
  .error-container {
    background: #fee2e2;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #991b1b;
  }
  
  .error-container i {
    font-size: 1.25rem;
  }
  
  @media (max-width: 768px) {
    .manage-exam-container {
      padding: 0rem;
    }
  
    
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-background {
    font-size: 4rem;
    top: 30%;
    right: 0.3rem;
  }
  
  .divider {
    margin: 0.5rem 0;
  }
    .panel-grid {
      grid-template-columns: 1fr;
    }
  
    .students-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
  }
  
  .uppercase-input {
    text-transform: uppercase;
  }
  
  .uppercase-input::placeholder {
    text-transform: none;
  }
  </style>