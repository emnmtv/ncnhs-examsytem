<template>
  <div class="take-exam-container" :key="componentKey">
    <!-- Exam Session View -->
    <exam-session 
      v-if="showExamSession" 
      :test-code="testCode"
      :attempt-id="currentAttemptId"
      :duration-minutes="exam?.durationMinutes"
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
      <div v-if="error && error !== 'Maximum number of attempts (1) reached'" class="error-container">
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
            <span v-if="exam.durationMinutes" class="exam-meta-item">
              <i class="fas fa-clock"></i> {{ formatDuration(exam.durationMinutes) }}
            </span>
            <span class="exam-meta-item tooltip-container">
              <i class="fas fa-redo"></i> Attempts: {{ getAttemptCount() }}/{{ exam.maxAttempts || '∞' }}
              <div class="tooltip">
                <span v-if="!eligibilityInfo">Loading attempt information...</span>
                <span v-else-if="eligibilityInfo.isEligible">You are eligible to take this exam</span>
                <span v-else>{{ eligibilityInfo.message }}</span>
                <span v-if="eligibilityInfo && eligibilityInfo.nextAttemptTime">Next attempt: {{ formatDateTime(eligibilityInfo.nextAttemptTime) }}</span>
                <span v-if="eligibilityInfo && eligibilityInfo.totalAttempts">Total attempts: {{ eligibilityInfo.totalAttempts }}</span>
                <span v-if="eligibilityInfo && eligibilityInfo.nextAttemptNumber">Next attempt will be #{{ eligibilityInfo.nextAttemptNumber }}</span>
              </div>
            </span>
          </div>
        </div>
        
        <!-- Scheduling Information (if applicable) -->
        <div v-if="exam.startDateTime || exam.endDateTime" class="schedule-container">
          <div class="schedule-item" v-if="exam.startDateTime">
            <i class="fas fa-play"></i> 
            <span>Available from: <strong>{{ formatDateTime(exam.startDateTime) }}</strong></span>
          </div>
          <div class="schedule-item" v-if="exam.endDateTime">
            <i class="fas fa-stop"></i> 
            <span>Closes on: <strong>{{ formatDateTime(exam.endDateTime) }}</strong></span>
          </div>
        </div>
        
        <div class="action-buttons">
          <button 
            @click="startExamSession" 
            class="primary-btn large"
            :disabled="!canStartExam && !waitingForNextAttempt"
          >
            <i class="fas" :class="hasExamInProgress ? 'fa-redo' : waitingForNextAttempt ? 'fa-hourglass-half' : 'fa-play-circle'"></i>
            <span v-if="hasExamInProgress">Continue Exam</span>
            <span v-else-if="waitingForNextAttempt">Wait {{ formattedCountdown }}</span>
            <span v-else>Start Exam Session</span>
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
import { fetchExamQuestions, getFullImageUrl, checkExamEligibility, createExamAttempt, getUserExamAttempts } from '@/services/authService';
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
      componentKey: 0,
      eligibilityInfo: null,
      currentAttemptId: null,
      waitingForNextAttempt: false,
      nextAttemptCountdown: null,
      countdownInterval: null,
      scheduleCheckInterval: null
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
  computed: {
    canStartExam() {
      
      console.log('canStartExam',
       this.exam?.status,
        this.hasExamInProgress, 
        this.eligibilityInfo,
         this.waitingForNextAttempt);
      // Check if we need to force-refresh component key to trigger re-evaluation
      this.componentKey; // Reference the key to make this computed property reactive to it

      // Can't start if exam status isn't "started" unless we have an in-progress attempt
      if (this.exam?.status !== "started" && !this.hasExamInProgress) {
        return false;
      }
      
      // Can't start if not eligible and not waiting for next attempt
      if (this.eligibilityInfo && !this.eligibilityInfo.isEligible && !this.waitingForNextAttempt) {
        return false;
      }
      
      // If there's a scheduled start time and it's in the future
      if (this.exam?.startDateTime) {
        const startTime = new Date(this.exam.startDateTime);
        const now = new Date();
        if (startTime > now) {
          return false;
        }
      }
      
      // If there's a scheduled end time and it's in the past
      if (this.exam?.endDateTime) {
        const endTime = new Date(this.exam.endDateTime);
        const now = new Date();
        if (endTime < now) {
          return false;
        }
      }
      
      return true;
    },
    
    // Add a schedule status computed property
    scheduleStatus() {
      if (!this.exam) return null;
      
      const now = new Date();
      const startTime = this.exam.startDateTime ? new Date(this.exam.startDateTime) : null;
      const endTime = this.exam.endDateTime ? new Date(this.exam.endDateTime) : null;
      
      if (startTime && now < startTime) {
        return {
          status: 'waiting',
          message: `Exam will be available at ${this.formatDateTime(startTime)}`,
          timeUntil: startTime - now
        };
      } else if (endTime && now > endTime) {
        return {
          status: 'ended',
          message: `Exam ended at ${this.formatDateTime(endTime)}`
        };
      } else if (startTime && (!endTime || now <= endTime)) {
        return {
          status: 'active',
          message: endTime ? `Exam is active until ${this.formatDateTime(endTime)}` : 'Exam is active'
        };
      }
      
      return { status: 'unrestricted', message: 'No scheduling restrictions' };
    },
    
    formattedCountdown() {
      if (!this.nextAttemptCountdown) return '';
      
      // Format seconds into MM:SS
      const minutes = Math.floor(this.nextAttemptCountdown / 60);
      const seconds = this.nextAttemptCountdown % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
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
          this.socket.on('examStatusUpdate', async ({ status }) => {
            if (this.exam) {
              this.exam.status = status;
              await this.fetchExamQuestions();
              await this.checkEligibility();
              this.exam = { ...this.exam };
              this.eligibilityInfo = { ...this.eligibilityInfo };
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

        // Start schedule checking after getting exam data
        this.startScheduleCheck();

        // Check eligibility immediately after fetching exam
        await this.checkEligibility();

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
    
    async startExamSession() {
      if (!this.exam) {
        Swal.fire({
          title: 'Error',
          text: 'No exam data available. Please fetch the exam first.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      // If we don't have eligibility info yet, check it
      if (!this.eligibilityInfo) {
        this.checkEligibility();
        return;
      }

      // If not eligible and not waiting, show message and start countdown if there's a next attempt time
      if (this.eligibilityInfo && !this.eligibilityInfo.isEligible && !this.hasExamInProgress) {
        if (this.eligibilityInfo.nextAttemptTime) {
          this.startWaitingCountdown(this.eligibilityInfo.nextAttemptTime);
        } else {
          Swal.fire({
            title: 'Cannot Start Exam',
            text: this.eligibilityInfo.message || 'You are not eligible to take this exam.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
        return;
      }
      
      // If we don't have an active attempt already, create a new one
      if (!this.currentAttemptId && this.eligibilityInfo?.isEligible) {
        try {
          // Make sure we have the exam ID from eligibility response
          if (!this.exam.id && this.eligibilityInfo.exam && this.eligibilityInfo.exam.id) {
            this.exam.id = this.eligibilityInfo.exam.id;
          }
          
          // Check if we have a valid exam ID before proceeding
          if (!this.exam.id) {
            console.error('Missing exam ID, cannot create attempt');
            Swal.fire({
              title: 'Error',
              text: 'Unable to start exam: missing exam ID. Please try joining the exam again.',
              icon: 'error',
              confirmButtonText: 'OK'
            });
            return;
          }
          
          console.log('Creating exam attempt for exam ID:', this.exam.id);
          
          Swal.fire({
            title: 'Creating Exam Session',
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });
          
          createExamAttempt(this.exam.id).then(result => {
            this.currentAttemptId = result.id;
            console.log('Created new exam attempt:', result);
            console.log(`Attempt ID: ${result.id}, Attempt Number: ${result.attemptNumber}`);
            Swal.close();
            this.showExamSession = true;
          }).catch(err => {
            console.error('Failed to create exam attempt:', err);
            Swal.fire({
              title: 'Error',
              text: 'Failed to start exam: ' + err.message,
              icon: 'error',
              confirmButtonText: 'OK'
            });
          });
          return;
        } catch (err) {
          console.error('Failed to create exam attempt:', err);
          Swal.fire({
            title: 'Error',
            text: 'Failed to start exam: ' + err.message,
            icon: 'error',
            confirmButtonText: 'OK'
          });
          return;
        }
      }

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
          this.currentAttemptId = null;
          
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
      
      // Reset the attempt state since the exam is now completed
      this.currentAttemptId = null;
      this.hasExamInProgress = false;
      
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
      
      // Reset attempt state
      this.currentAttemptId = null;
      
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
    },
    
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return '';
      const date = new Date(dateTimeString);
      return date.toLocaleString();
    },
    
    formatDuration(minutes) {
      if (!minutes) return '';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      
      if (hours > 0) {
        const hourText = hours === 1 ? 'hour' : 'hours';
        const minText = mins === 1 ? 'minute' : 'minutes';
        return `${hours} ${hourText} ${mins} ${minText}`;
      } else {
        return mins === 1 ? `${mins} minute` : `${mins} minutes`;
      }
    },
    
    async checkEligibility() {
      if (!this.testCode) return;
      
      try {
        const response = await checkExamEligibility(this.testCode);
        console.log('Eligibility response:', response);
        
        // Map API response to our component's data model
        this.eligibilityInfo = {
          isEligible: response.eligible,
          message: response.message,
          attemptCount: response.nextAttemptNumber ? response.nextAttemptNumber - 1 : 0,
          nextAttemptTime: response.nextAttemptAvailableAt || null,
          attempts: response.attempts || [],
          exam: response.exam, // Store the entire exam object for reference
          // Set totalAttempts with fallback values in case it's not in the response
          totalAttempts: response.totalAttempts !== undefined ? response.totalAttempts : 
                        (response.attempts ? response.attempts.length : 0),
          nextAttemptNumber: response.nextAttemptNumber
        };
        
        console.log('Eligibility info mapped:', this.eligibilityInfo);
        console.log(`Next attempt number: ${this.eligibilityInfo.nextAttemptNumber}`);
        console.log(`Total attempts: ${this.eligibilityInfo.totalAttempts}`);
        
        // If exam is not active but has a valid ID, fetch attempts separately
        // This ensures we show correct attempt counts for inactive exams
        if (!response.eligible && response.exam && response.exam.id && 
            (response.attempts === undefined || response.attempts.length === 0)) {
          try {
            console.log('Fetching additional attempt data for inactive exam');
            const attemptsData = await getUserExamAttempts(response.exam.id);
            if (attemptsData && attemptsData.length > 0) {
              console.log('Found additional attempt data:', attemptsData);
              this.eligibilityInfo.attempts = attemptsData;
              this.eligibilityInfo.totalAttempts = attemptsData.length;
            }
          } catch (err) {
            console.warn('Failed to fetch additional attempt data:', err);
            // Continue without additional data
          }
        }
        
        // If not eligible and we have a next attempt time, start countdown
        if (!response.eligible && response.nextAttemptAvailableAt && !this.waitingForNextAttempt) {
          this.startWaitingCountdown(response.nextAttemptAvailableAt);
        }
        
        console.log('Eligibility info:', this.eligibilityInfo);
        
        // If there's an active attempt, store its ID
        if (response.incompleteAttempt) {
          this.currentAttemptId = response.incompleteAttempt.id;
          this.hasExamInProgress = true;
        }
        
        // Update exam info with additional details from eligibility check
        if (response.exam && this.exam) {
          // Store the exam ID (this is critical for creating attempts)
          this.exam.id = response.exam.id;
          console.log('Updated exam with ID:', this.exam.id);
          
          // Only update fields that exist in the response but not in our current exam object
          if (response.exam.maxAttempts && this.exam.maxAttempts === undefined) {
            this.exam.maxAttempts = response.exam.maxAttempts;
          }
          if (response.exam.durationMinutes && this.exam.durationMinutes === undefined) {
            this.exam.durationMinutes = response.exam.durationMinutes;
          }
          if (response.exam.startDateTime && this.exam.startDateTime === undefined) {
            this.exam.startDateTime = response.exam.startDateTime;
          }
          if (response.exam.endDateTime && this.exam.endDateTime === undefined) {
            this.exam.endDateTime = response.exam.endDateTime;
          }
        }
        
        return this.eligibilityInfo;
      } catch (err) {
        console.error('Failed to check eligibility:', err);
        this.error = 'Failed to check if you can take this exam: ' + err.message;
        throw err;
      }
    },
    getAttemptCount() {
      // First check for totalAttempts in eligibilityInfo, which now includes historical attempts
      if (this.eligibilityInfo && this.eligibilityInfo.totalAttempts !== undefined) {
        return this.eligibilityInfo.totalAttempts;
      }
      
      // If we have eligibility info with attempts array
      if (this.eligibilityInfo && this.eligibilityInfo.attempts && this.eligibilityInfo.attempts.length > 0) {
        return this.eligibilityInfo.attempts.length;
      }
      
      // If we have eligibility.attemptCount (may be set in our component)
      if (this.eligibilityInfo && this.eligibilityInfo.attemptCount !== undefined) {
        return this.eligibilityInfo.attemptCount;
      }
      
      // If we have nextAttemptNumber (1-indexed)
      if (this.eligibilityInfo && this.eligibilityInfo.nextAttemptNumber) {
        return this.eligibilityInfo.nextAttemptNumber - 1;
      }
      
      // If we just have eligibility status
      if (this.eligibilityInfo) {
        // If not eligible due to max attempts, we can assume they've used all attempts
        if (this.eligibilityInfo.message && this.eligibilityInfo.message.includes('Maximum number of attempts')) {
          return this.exam.maxAttempts || 1;
        }
      }
      
      // Default to 0 or 1 based on exam in progress
      return this.hasExamInProgress ? 1 : 0;
    },
    startWaitingCountdown(nextAttemptTime) {
      // Clear any existing interval
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      
      this.waitingForNextAttempt = true;
      
      // Convert nextAttemptTime to Date if it's a string
      const nextAttempt = typeof nextAttemptTime === 'string' 
        ? new Date(nextAttemptTime) 
        : nextAttemptTime;
      
      // Calculate seconds until next attempt
      const now = new Date();
      const diffInSeconds = Math.max(0, Math.floor((nextAttempt.getTime() - now.getTime()) / 1000));
      
      this.nextAttemptCountdown = diffInSeconds;
      
      // Show message with initial time
      Swal.fire({
        title: 'Waiting Period',
        text: `You can take the exam again in ${this.formattedCountdown}`,
        icon: 'info',
        confirmButtonText: 'OK'
      });
      
      // Set up interval to update countdown
      this.countdownInterval = setInterval(() => {
        this.nextAttemptCountdown--;
        
        // When countdown reaches zero, refresh eligibility
        if (this.nextAttemptCountdown <= 0) {
          clearInterval(this.countdownInterval);
          this.waitingForNextAttempt = false;
          this.nextAttemptCountdown = null;
          
          // Refresh eligibility
          this.checkEligibility().then(() => {
            if (this.eligibilityInfo && this.eligibilityInfo.isEligible) {
              Swal.fire({
                title: 'Ready to Start',
                text: 'You can now take the exam again!',
                icon: 'success',
                confirmButtonText: 'OK'
              });
            }
          });
        }
      }, 1000);
    },
    checkScheduleValidity() {
      if (!this.exam) return;

      // Get current schedule status
      const status = this.scheduleStatus;
      
      // If status is active, we should update the UI
      if (status?.status === 'active') {
        // Clear any existing error about scheduling
        if (this.error && (this.error.includes('available') || this.error.includes('ended'))) {
          this.error = null;
        }
        
        // Force component update
        this.componentKey += 1;
        
        // If exam status is 'started', we should be able to begin now
        if (this.exam.status === 'started') {
          // Refresh exam data to make sure we have latest info
          this.fetchExamQuestions();
          
          // Show notification that exam is now available
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true
          });
          
          Toast.fire({
            icon: 'info',
            title: 'Exam is now available'
          });
        }
      } else if (status?.status === 'ended') {
        // If exam has ended, update to show that
        this.error = "This exam has already ended.";
        this.componentKey += 1;
      } else if (status?.status === 'waiting' && status.timeUntil < 60000) {
        // If exam is about to start in less than a minute, check more frequently
        if (this.scheduleCheckInterval) {
          clearInterval(this.scheduleCheckInterval);
          this.scheduleCheckInterval = setInterval(() => {
            this.checkScheduleValidity();
          }, 5000); // Check every 5 seconds when we're close
        }
      }
    },

    startScheduleCheck() {
      // Clear any existing interval
      if (this.scheduleCheckInterval) {
        clearInterval(this.scheduleCheckInterval);
      }

      // Only start the check if we have an exam with scheduling
      if (this.exam && (this.exam.startDateTime || this.exam.endDateTime)) {
        const status = this.scheduleStatus;
        
        // Use more frequent checks when close to schedule transitions
        let checkInterval = 15000; // Default to 15 seconds
        
        if (status?.status === 'waiting' && status.timeUntil < 60000) {
          checkInterval = 5000; // Every 5 seconds when very close
        } else if (status?.status === 'waiting' && status.timeUntil < 300000) {
          checkInterval = 10000; // Every 10 seconds when within 5 minutes
        }
        
        this.scheduleCheckInterval = setInterval(() => {
          this.checkScheduleValidity();
        }, checkInterval);
        
        // Also check immediately
        this.checkScheduleValidity();
        
        // Add a one-time check very close to the scheduled time
        if (status?.status === 'waiting' && status.timeUntil > 0) {
          setTimeout(() => {
            this.checkScheduleValidity();
            // Refresh exam data too
            this.fetchExamQuestions();
          }, status.timeUntil + 1000); // 1 second after scheduled start
        }
      }
    }
  },
  beforeUnmount() {
    // Remove window event listeners
    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('blur', this.handleWindowBlur);
    
    // Clear countdown interval
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    // Clear schedule check interval
    if (this.scheduleCheckInterval) {
      clearInterval(this.scheduleCheckInterval);
    }
    
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
  margin-top: 10px;
}

.exam-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
}

.status-started {
  color: white;
  background-color: #4CAF50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
  animation: pulse-green 2s infinite;
}

.status-pending {
  color: #333;
  background-color: #FFC107;
  box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
}

.status-stopped {
  color: white;
  background-color: #F44336;
  box-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
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
  padding: 0rem; 
}
  .header-background {
  position: absolute;
  top: 17%;
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

.scheduling-info, .eligibility-info {
  padding: 15px;
  margin: 10px 0;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.schedule-container {
  background-color: #f5f9ff;
  border-radius: 8px;
  padding: 12px 16px;
 
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 5px 0;
  font-size: 0.95rem;
  color: #333;
}

.schedule-item i {
  color: #2196F3;
  width: 20px;
  text-align: center;
}

.schedule-item strong {
  font-weight: 600;
  color: #1976D2;
}

.eligibility-message {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 5px 0;
}

.eligibility-message i {
  width: 20px;
  text-align: center;
  color: #4CAF50;
}

.eligibility-message.error {
  color: #d32f2f;
  font-weight: 600;
  background-color: transparent;
  padding: 0;
  border-radius: 0;
}

.eligibility-message.error i {
  color: #f44336;
}

.eligibility-message.success {
  color: #4CAF50;
  background-color: #e8f5e9;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.eligibility-message.success i {
  color: #4CAF50;
}

.primary-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.primary-btn:disabled:hover {
  background-color: #cccccc;
  transform: none;
  box-shadow: none;
}

.error-box {
  background-color: #ffebee;
  border-left: 4px solid #f44336;
  margin: 15px 0;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.warning-box {
  background-color: #fff8e1;
  border-left: 4px solid #ffc107;
  margin: 15px 0;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
}

.eligibility-message.warning {
  color: #f57c00;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.eligibility-message.warning i {
  color: #ffa000;
}

/* Tooltip styles */
.tooltip-container {
  position: relative;
  cursor: pointer;
}

.tooltip-container:hover .tooltip {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
}

.tooltip {
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  padding: 10px;
  background-color: #333;
  color: white;
  border-radius: 6px;
  width: max-content;
  max-width: 250px;
  z-index: 100;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  visibility: hidden;
  opacity: 0;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  font-weight: normal;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

@media (max-width: 768px) {
  .tooltip {
    width: 200px;
    left: auto;
    right: 0;
    transform: translateY(10px);
  }
  
  .tooltip::after {
    left: auto;
    right: 10px;
  }
}

.primary-btn.large.waiting {
  background-color: #ff9800;
}

.primary-btn.large.waiting:hover {
  background-color: #f57c00;
}

.countdown {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ff9800;
  margin-top: 5px;
}
</style> 