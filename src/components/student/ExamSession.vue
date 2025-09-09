<template>
  <div class="exam-session">
    <!-- Exam Header -->
    <div class="exam-header">
      <h2 v-if="exam">{{ exam.examTitle }}</h2>
      <div v-if="exam && exam.questions && currentQuestionIndex !== null" class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
        </div>
        <div class="progress-text">
          Question {{ currentQuestionIndex + 1 }} of {{ shuffledQuestions.length }}
        </div>
      </div>
      
      <!-- Timer Display -->
      <div v-if="timerEnabled" class="timer-container" :class="{ 'warning': remainingTime <= 300 }">
        <i class="fas fa-clock"></i> Time Remaining: {{ formatTime(remainingTime) }}
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loader"></div>
      <p>Loading exam questions...</p>
    </div>
    
    <!-- Waiting for Exam to Start -->
    <div v-else-if="exam && !exam.questions" class="waiting-container">
      <div class="waiting-icon">
        <i class="fas fa-hourglass-half"></i>
      </div>
      <p>Waiting for the exam to start...</p>
      <p class="waiting-subtext">The teacher will start the exam shortly.</p>
    </div>
    
    <!-- Error Message -->
    <div v-if="error" class="error-container">
      <div class="error-icon">
        <i class="fas fa-exclamation-circle"></i>
      </div>
      <p class="error-message">{{ error }}</p>
    </div>
    
    <!-- Score Results - only show if user chose to view them -->
    <div v-if="scoreResult && showResults" class="score-result">
      <div class="score-card">
        <h2>Your Score</h2>
        <div class="score-display">
          <div class="score-circle" :class="getScoreClass(scoreResult.percentage)">
            <span class="score-percentage">{{ scoreResult.percentage }}%</span>
          </div>
          <div class="score-details">
            <p>You earned <strong>{{ scoreResult.score }}</strong> out of <strong>{{ scoreResult.total }}</strong> points.</p>
            <p class="score-message">{{ getScoreMessage(scoreResult.percentage) }}</p>
          </div>
        </div>
        <button @click="quitExam" class="return-btn">Return to Exam Details</button>
      </div>
    </div>
    
    <!-- Submitted but not viewing results message -->
    <div v-else-if="examSubmitted && !showResults" class="waiting-container">
      <div class="waiting-icon">
        <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
      </div>
      <p>Your exam has been submitted successfully.</p>
      <div class="action-buttons">
        <button @click="showResults = true" class="view-results-btn">View Results</button>
        <button @click="quitExam" class="return-btn">Return to Exam Details</button>
      </div>
    </div>
    
    <!-- Question Display -->
    <div v-else-if="exam && exam.questions && currentQuestionIndex !== null && !scoreResult" class="question-container">
      <div class="question-card">
        <div class="question-text">
          <h3>{{ currentQuestionIndex + 1 }}. {{ currentQuestion.questionText }}</h3>
        </div>
        
        <!-- Update the question image section with a clickable image and fullscreen modal -->
        <div v-if="currentQuestion.imageUrl" class="question-image">
          <img 
            :src="getImageUrl(currentQuestion.imageUrl)" 
            alt="Question image" 
            @click="openFullscreenImage(currentQuestion.imageUrl)"
            class="clickable-image"
          />
        </div>
        
        <div class="answer-container">
          <!-- Multiple Choice Options -->
          <div v-if="currentQuestion.options && currentQuestion.options.length > 0" class="options-container">
            <div 
              v-for="(option, i) in currentQuestion.options" 
              :key="i"
              class="option-item"
              :class="{ 'selected': answers[currentQuestion.questionId] === option }"
              @click="selectOption(currentQuestion.questionId, option)"
            >
              <div class="option-radio">
                <div class="radio-inner" v-if="answers[currentQuestion.questionId] === option"></div>
              </div>
              <div class="option-text">{{ option }}</div>
            </div>
          </div>
          
          <!-- Essay Question -->
          <div v-else-if="currentQuestion.questionType === 'essay'" class="essay-answer-container">
            <div class="essay-info">
              <div class="essay-notice">
                <span class="material-icons-round">description</span>
                <div>
                  <p><strong>Essay Question</strong></p>
                  <p>Provide a detailed written response. This will be manually graded by your teacher.</p>
                  <p v-if="currentQuestion.wordLimit" class="word-limit-notice">
                    <span class="material-icons-round">text_fields</span>
                    Word limit: {{ currentQuestion.wordLimit }} words
                  </p>
                </div>
              </div>
            </div>
            <textarea 
              v-model="answers[currentQuestion.questionId]" 
              placeholder="Write your essay response here..."
              class="essay-answer-input"
              :class="{ 'word-limit-exceeded': isWordLimitExceeded(currentQuestion.questionId) }"
              rows="10"
              @input="handleEssayInput(currentQuestion.questionId)"
            ></textarea>
            <div class="essay-meta">
              <span class="word-count" :class="{ 'word-limit-exceeded': isWordLimitExceeded(currentQuestion.questionId) }">
                Words: {{ getWordCount(answers[currentQuestion.questionId] || '') }}
                <span v-if="currentQuestion.wordLimit">/ {{ currentQuestion.wordLimit }}</span>
              </span>
              <span class="points-info" v-if="currentQuestion.points">
                Worth {{ currentQuestion.points }} point{{ currentQuestion.points !== 1 ? 's' : '' }}
              </span>
            </div>
            <div v-if="isWordLimitExceeded(currentQuestion.questionId)" class="word-limit-warning">
              <span class="material-icons-round">warning</span>
              <span>You have exceeded the word limit. Please reduce your response to {{ currentQuestion.wordLimit }} words or less.</span>
            </div>
          </div>
          
          <!-- Text Input for Short Answer/Enumeration -->
          <div v-else class="text-answer-container">
            <input 
              type="text" 
              v-model="answers[currentQuestion.questionId]" 
              placeholder="Type your answer here..."
              class="text-answer-input uppercase-input"
              @input="handleAnswerInput(currentQuestion.questionId)"
            />
          </div>
        </div>
        
        <!-- Navigation Buttons -->
        <div class="navigation-buttons">
          <button 
            @click="prevQuestion" 
            class="nav-btn prev-btn"
            :disabled="currentQuestionIndex === 0"
          >
            <i class="fas fa-arrow-left"></i> Previous
          </button>
          
          <button 
            v-if="currentQuestionIndex < shuffledQuestions.length - 1" 
            @click="nextQuestion" 
            class="nav-btn next-btn"
          >
            Next <i class="fas fa-arrow-right"></i>
          </button>
          
          <button 
            v-else 
            @click="confirmSubmit" 
            class="nav-btn submit-btn"
          >
            Submit All <i class="fas fa-check-circle"></i>
          </button>
        </div>
      </div>
      
      <!-- Question Navigation Bubbles -->
      <div class="question-bubbles">
        <div 
          v-for="(question, index) in shuffledQuestions" 
          :key="question.questionId"
          class="question-bubble"
          :class="{
            'current': index === currentQuestionIndex,
            'answered': answers[question.questionId],
            'unanswered': !answers[question.questionId]
          }"
          @click="goToQuestion(index)"
        >
          {{ index + 1 }}
        </div>
      </div>
    </div>

    <!-- Add this fullscreen image modal at the end of the template, before the closing div -->
    <div v-if="fullscreenImage" class="fullscreen-image-modal" @click="closeFullscreenImage">
      <div class="fullscreen-image-container" @click.stop>
        <img :src="getImageUrl(fullscreenImage)" alt="Fullscreen image" />
        <button class="close-fullscreen-btn" @click="closeFullscreenImage">
          <span class="material-icons">close</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { fetchExamQuestions, submitExamAnswers, getFullImageUrl, completeExamAttempt } from '@/services/authService';
import socketManager from '@/utils/socketManager';
import Swal from 'sweetalert2';

export default {
  props: {
    testCode: {
      type: String,
      required: true
    },
    attemptId: {
      type: Number,
      default: null
    },
    durationMinutes: {
      type: Number,
      default: null
    },
    attemptNumber: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      exam: null,
      answers: this.loadAnswers() || {},
      error: null,
      loading: true,
      refreshInterval: null,
      scoreResult: null,
      currentQuestionIndex: this.loadCurrentIndex() || null,
      shuffledQuestions: this.loadShuffledQuestions() || [],
      socket: null,
      examSubmitted: false,
      showResults: false,
      isSubmitting: false,
      fullscreenImage: null,
      timerEnabled: false,
      timerInterval: null,
      remainingTime: 0, // in seconds
    };
  },
  computed: {
    currentQuestion() {
      if (this.currentQuestionIndex === null || !this.shuffledQuestions.length) {
        return null;
      }
      return this.shuffledQuestions[this.currentQuestionIndex];
    },
    progressPercentage() {
      if (!this.shuffledQuestions.length) return 0;
      return Math.round(((this.currentQuestionIndex + 1) / this.shuffledQuestions.length) * 100);
    },
    allQuestionsAnswered() {
      if (!this.shuffledQuestions.length) return false;
      return this.shuffledQuestions.every(q => !!this.answers[q.questionId]);
    }
  },
  created() {
    this.fetchExam();
    this.setupPolling();
    this.initializeSocket();
    
    // Only set up polling if exam is pending or questions aren't available yet
    this.setupPolling();
    
    // Load FontAwesome if not already loaded
    if (!document.getElementById('fontawesome-css')) {
      const link = document.createElement('link');
      link.id = 'fontawesome-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
      document.head.appendChild(link);
    }
    
    // Load Material Icons if not already loaded
    if (!document.getElementById('material-icons-css')) {
      const link = document.createElement('link');
      link.id = 'material-icons-css';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
      document.head.appendChild(link);
    }
  },
  beforeUnmount() {
    // Clean up the polling interval
    this.clearPolling();
    // Clean up the timer interval
    this.stopTimer();
    if (this.socket) {
      this.socket.off('examStatusUpdate');
      this.socket.off('examStopped');
    }
  },
  watch: {
    'exam.questions': {
      handler(newQuestions) {
        if (newQuestions && newQuestions.length > 0) {
          this.initializeExam();
          
          // If we have questions now, we can stop polling
          this.clearPolling();
          
          // Initialize timer if duration is specified
          this.initializeTimer();
        }
      },
      immediate: true
    },
    
    'exam.status': {
      handler(newStatus) {
        if (newStatus === 'stopped') {
          // Clear saved state if exam is stopped
          this.clearExamState();
          this.clearPolling();
        }
      }
    },
    remainingTime(newValue) {
      // Auto-submit when time runs out
      if (newValue <= 0 && this.timerEnabled) {
        this.stopTimer();
        this.handleTimeUp();
      }
      
      // Warning at 5 minutes and 1 minute
      if (newValue === 300 || newValue === 60) {
        this.showTimeWarning(newValue);
      }
    }
  },
  methods: {
    // Set up polling with appropriate interval
    setupPolling() {
      // Clear any existing interval first
      this.clearPolling();
      
      // Set up a new polling interval - longer interval of 30 seconds to reduce server load
      this.refreshInterval = setInterval(() => {
        // Only fetch if we're still waiting for questions or exam status change
        if (!this.exam || !this.exam.questions || this.exam.status === 'pending') {
          console.log('Polling for exam updates...');
          this.fetchExam();
        } else {
          // If we have questions and exam is started, stop polling
          this.clearPolling();
        }
      }, 30000); // Poll every 30 seconds instead of 10
    },
    
    // Helper method to clear polling
    clearPolling() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
        this.refreshInterval = null;
      }
    },
    
    async fetchExam() {
      try {
        // Don't fetch if we're displaying score results
        if (this.scoreResult) {
          return;
        }
        
        this.loading = true;
        this.error = null;
        const response = await fetchExamQuestions(this.testCode);
        
        // Update the exam data
        this.exam = response.exam;
        this.loading = false;
        
        // If the exam status has changed to 'started' and we have questions, stop polling
        if (this.exam.status === 'started' && this.exam.questions && this.exam.questions.length > 0) {
          this.clearPolling();
        }
      } catch (err) {
        this.error = err.message;
        this.loading = false;
      }
    },
    
    initializeExam() {
      if (this.exam && this.exam.questions && this.exam.questions.length > 0) {
        const savedState = this.loadExamState();
        
        if (savedState && savedState.testCode === this.testCode) {
          // Restore saved state
          this.shuffledQuestions = savedState.shuffledQuestions;
          this.currentQuestionIndex = savedState.currentQuestionIndex;
          this.answers = savedState.answers;
        } else {
          // Create new shuffled questions if no saved state
          this.shuffledQuestions = [...this.exam.questions].sort(() => Math.random() - 0.5);
          this.currentQuestionIndex = 0;
          this.answers = {};
          // Save the initial state
          this.saveExamState();
        }
      }
    },
    
    nextQuestion() {
      if (this.currentQuestionIndex < this.shuffledQuestions.length - 1) {
        this.currentQuestionIndex++;
        this.saveExamState();
        this.emitProgress();
      }
    },
    
    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
        this.saveExamState();
      }
    },
    
    goToQuestion(index) {
      if (index >= 0 && index < this.shuffledQuestions.length) {
        this.currentQuestionIndex = index;
        this.saveExamState();
      }
    },
    
    selectOption(questionId, option) {
      this.answers[questionId] = option;
      this.saveExamState();
      this.emitProgress();
    },
    
    confirmSubmit() {
      const unansweredCount = this.shuffledQuestions.filter(q => !this.answers[q.questionId]).length;
      
      if (unansweredCount > 0) {
        Swal.fire({
          title: 'Warning',
          text: `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#4CAF50',
          cancelButtonColor: '#f44336',
          confirmButtonText: 'Yes, submit now',
          cancelButtonText: 'No, I\'ll finish answering'
        }).then((result) => {
          if (result.isConfirmed) {
            this.submitAnswers();
          }
        });
      } else {
        this.submitAnswers();
      }
    },
    
    async submitAnswers() {
      // Prevent multiple simultaneous submissions
      if (this.isSubmitting || this.examSubmitted) {
        console.log('Submission already in progress or already submitted, ignoring duplicate request');
        return;
      }
      
      this.isSubmitting = true;
      
      try {
        this.error = null;
        const answerData = {
          testCode: this.testCode,
          answers: Object.keys(this.answers).map(questionId => ({
            questionId: parseInt(questionId),
            userAnswer: this.answers[questionId],
          })),
          attemptId: this.attemptId // Include the attempt ID if available
        };
        
        console.log('Submitting exam answers...');
        const response = await submitExamAnswers(answerData);
        
        // Complete the attempt if we have an attempt ID
        if (this.attemptId) {
          try {
            await completeExamAttempt(this.attemptId);
            console.log('Exam attempt completed successfully');
          } catch (err) {
            console.error('Error completing exam attempt:', err);
            // Continue with submission even if completing the attempt fails
          }
        }
        
        // Stop the timer if it's running
        this.stopTimer();
        this.clearTimerState();
        
        // Store the score result but don't show it yet
        this.scoreResult = response.score;
        this.examSubmitted = true;
        this.showResults = false; // Explicitly set to not show results
        
        // Clear saved exam state after successful submission
        this.clearExamState();
        
        // Make sure we only close any existing alerts
        if (Swal.isVisible()) {
          console.log('Closing any existing alerts');
          Swal.close();
        }
        
        // Add a small delay before showing the options alert
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Show the score options dialog
        const result = await Swal.fire({
          title: 'Exam Submitted!',
          text: 'Your exam has been submitted successfully.',
          icon: 'success',
          showCancelButton: true,
          confirmButtonColor: '#4CAF50',
          cancelButtonColor: '#2196F3',
          confirmButtonText: 'View Results',
          cancelButtonText: 'Return to Exam Details'
        });
        
        // Emit an event to notify parent component about the submission
        this.$emit('answers-submitted', this.scoreResult);
        
        // Set showResults based on user choice
        if (result.isConfirmed) {
          console.log('User chose to view detailed results');
          this.showResults = true;
        } else {
          console.log('User chose to return to exam details');
          this.quitExam();
        }
        
        console.log('Exam submitted successfully.');
      } catch (err) {
        console.error('Error submitting exam:', err);
        this.error = err.message;
        
        // Make sure we only close the loading alert if it's still open
        if (Swal.isVisible()) {
          console.log('Closing submission loading alert due to error');
          Swal.close();
        }
        
        // Add a small delay before showing the error alert
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Show a more specific error message for the auto-submit case
        Swal.fire({
          title: 'Submission Error',
          text: 'There was a problem submitting your exam. Your responses have been saved locally. Please try manually submitting again or contact your teacher.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        // Always reset the submission flag when done
        this.isSubmitting = false;
      }
    },
    
    quitExam() {
      // Stop timer if it's running
      this.stopTimer();
      this.clearTimerState();
      
      // Only leave the socket room if we're quitting before submission
      // If the exam is already submitted, we don't need to quit the socket
      if (this.socket && !this.examSubmitted) {
        this.socket.emit('quitExam', { testCode: this.testCode });
      }
      
      // Clear saved state
      this.clearExamState();
      
      // Emit event to parent component
      this.$emit('quit-exam');
    },
    
    getScoreClass(percentage) {
      if (percentage >= 90) return 'excellent';
      if (percentage >= 75) return 'good';
      if (percentage >= 60) return 'average';
      return 'needs-improvement';
    },
    
    getScoreMessage(percentage) {
      if (percentage >= 90) return 'Excellent work!';
      if (percentage >= 75) return 'Good job!';
      if (percentage >= 60) return 'Not bad, keep practicing!';
      return 'You might need more review on this topic.';
    },

    // Add these new methods for persistence
    saveExamState() {
      const examState = {
        answers: this.answers,
        currentQuestionIndex: this.currentQuestionIndex,
        shuffledQuestions: this.shuffledQuestions,
        testCode: this.testCode
      };
      localStorage.setItem('examState', JSON.stringify(examState));
    },

    loadExamState() {
      const savedState = localStorage.getItem('examState');
      if (savedState) {
        const state = JSON.parse(savedState);
        // Only load if it's the same exam
        if (state.testCode === this.testCode) {
          return state;
        }
      }
      return null;
    },

    loadAnswers() {
      const state = this.loadExamState();
      return state ? state.answers : {};
    },

    loadCurrentIndex() {
      const state = this.loadExamState();
      return state ? state.currentQuestionIndex : null;
    },

    loadShuffledQuestions() {
      const state = this.loadExamState();
      return state ? state.shuffledQuestions : [];
    },

    clearExamState() {
      localStorage.removeItem('examState');
    },

    initializeSocket() {
      if (!this.socket) {
        this.socket = socketManager.getSocket();
        console.log('Socket connected in ExamSession');

        // Join the exam room
        this.socket.emit('joinExam', {
          testCode: this.testCode,
          userId: localStorage.getItem('userId')
        });

        // Listen for exam status updates
        this.socket.on('examStatusUpdate', ({ status }) => {
          console.log('Exam status update received:', status);
          if (this.exam) {
            this.exam.status = status;
          }
        });

        // Listen for exam stopped event
        this.socket.on('examStopped', () => {
          console.log('Exam stopped event received');
          if (this.exam) {
            this.exam.status = 'stopped';
          }

          // Replace the blocking SweetAlert with a non-blocking toast notification
          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 10000, // Show for 10 seconds
            timerProgressBar: true
          });
          
          Toast.fire({
            icon: 'warning',
            title: 'Exam has been stopped by the teacher',
            text: 'You can review your answers before submitting.'
          });
          
          // Only set up auto-submit if not already submitted
          if (!this.examSubmitted && !this.isSubmitting) {
            // Auto-submit after 60 seconds with a countdown toast
            let remainingTime = 60;
            
            // Create a countdown toast that doesn't block interaction
            const countdownToast = Swal.mixin({
              toast: true,
              position: 'top-end', // Changed to top-end
              showConfirmButton: false,
              timer: 60000, // 60 seconds
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
                
                // Update the countdown every second
                const countdownInterval = setInterval(() => {
                  // Check if already submitted before updating countdown
                  if (this.examSubmitted || this.isSubmitting) {
                    clearInterval(countdownInterval);
                    Swal.close();
                    return;
                  }
                  
                  remainingTime--;
                  if (remainingTime <= 0) {
                    clearInterval(countdownInterval);
                  } else {
                    const countdownEl = toast.querySelector('.countdown-text');
                    if (countdownEl) {
                      countdownEl.textContent = `Auto-submitting in ${remainingTime} seconds`;
                    }
                  }
                }, 1000);
              }
            });
            
            countdownToast.fire({
              icon: 'info',
              title: `Auto-submitting in ${remainingTime} seconds`,
              html: `<div class="countdown-text">Auto-submitting in ${remainingTime} seconds</div>
                     <button id="submit-now-btn" class="swal2-confirm swal2-styled" style="display: inline-block; margin-top: 10px;">Submit Now</button>`,
              didOpen: (toast) => {
                // Add click handler for the submit now button
                const submitBtn = toast.querySelector('#submit-now-btn');
                if (submitBtn) {
                  submitBtn.addEventListener('click', () => {
                    if (!this.examSubmitted && !this.isSubmitting) {
                      Swal.close();
                      this.submitAnswers();
                    }
                  });
                }
              }
            });
            
            // Set a timeout to auto-submit
            setTimeout(() => {
              // Only submit if not already submitted and not currently submitting
              if (!this.examSubmitted && !this.isSubmitting) {
                console.log('Auto-submitting exam after timeout...');
                this.submitAnswers();
              } else {
                console.log('Skipping auto-submit: exam already submitted or submission in progress');
              }
            }, 60000);
          }
        });
      }
    },

    emitProgress() {
      if (!this.socket) {
        this.initializeSocket();
      }
      
      const answeredCount = Object.keys(this.answers).length;
      const progress = {
        answeredCount,
        currentQuestion: this.currentQuestionIndex + 1
      };
      
      this.socket.emit('updateExamProgress', {
        testCode: this.testCode,
        userId: localStorage.getItem('userId'),
        progress
      });
    },

    // Replace the getImageUrl method
    getImageUrl(imageUrl) {
      return getFullImageUrl(imageUrl);
    },

    handleAnswerInput(questionId) {
      // Check if the answer exists and convert it to uppercase
      if (this.answers[questionId]) {
        this.answers[questionId] = this.answers[questionId].toUpperCase();
        this.saveExamState();
        this.emitProgress();
      }
    },

    handleEssayInput(questionId) {
      // Save essay answer without uppercase transformation
      // Ensure the answer exists in our answers object
      if (this.answers[questionId] !== undefined) {
        this.saveExamState();
        this.emitProgress();
      }
    },

    getWordCount(text) {
      if (!text || typeof text !== 'string') return 0;
      // Remove extra whitespace and count words
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    },

    isWordLimitExceeded(questionId) {
      const question = this.shuffledQuestions.find(q => q.questionId === questionId);
      if (!question || !question.wordLimit) return false;
      
      const answer = this.answers[questionId] || '';
      const wordCount = this.getWordCount(answer);
      return wordCount > question.wordLimit;
    },

    openFullscreenImage(imageUrl) {
      this.fullscreenImage = imageUrl;
      // Prevent scrolling when modal is open
      document.body.style.overflow = 'hidden';
    },

    closeFullscreenImage() {
      this.fullscreenImage = null;
      // Restore scrolling
      document.body.style.overflow = '';
    },

    initializeTimer() {
      // Only initialize timer if duration is specified and not already submitted
      if (this.durationMinutes && !this.examSubmitted) {
        // Check if we have a saved timer state
        const savedTimerState = this.loadTimerState();
        
        if (savedTimerState && savedTimerState.testCode === this.testCode) {
          // Restore timer from saved state
          this.remainingTime = savedTimerState.remainingTime;
        } else {
          // Set new timer based on duration
          this.remainingTime = this.durationMinutes * 60;
        }
        
        // Start the timer
        this.startTimer();
      }
    },
    
    startTimer() {
      if (this.remainingTime > 0) {
        this.timerEnabled = true;
        this.timerInterval = setInterval(() => {
          this.remainingTime--;
          this.saveTimerState();
        }, 1000);
      }
    },
    
    stopTimer() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },
    
    saveTimerState() {
      const timerState = {
        testCode: this.testCode,
        remainingTime: this.remainingTime
      };
      localStorage.setItem('examTimerState', JSON.stringify(timerState));
    },
    
    loadTimerState() {
      const savedState = localStorage.getItem('examTimerState');
      if (savedState) {
        try {
          return JSON.parse(savedState);
        } catch (e) {
          console.error('Error parsing saved timer state:', e);
        }
      }
      return null;
    },
    
    clearTimerState() {
      localStorage.removeItem('examTimerState');
    },
    
    formatTime(seconds) {
      if (seconds <= 0) return '00:00';
      
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    handleTimeUp() {
      // Show alert
      Swal.fire({
        title: 'Time\'s Up!',
        text: 'Your exam time has ended. Your answers will be submitted automatically.',
        icon: 'warning',
        showConfirmButton: false,
        timer: 3000
      });
      
      // Submit answers after a brief delay to let user see the message
      setTimeout(() => {
        this.submitAnswers();
      }, 3000);
    },
    
    showTimeWarning(seconds) {
      const minutes = Math.floor(seconds / 60);
      
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true
      });
      
      Toast.fire({
        icon: 'warning',
        title: `${minutes} minute${minutes > 1 ? 's' : ''} remaining!`
      });
    },
  }
};
</script>

<style scoped>
.exam-session {
  max-width: 1000px;
  margin: 0 auto;
  padding: 16px;
  font-family: 'Roboto', sans-serif;
}

.exam-header {
  text-align: center;
  margin-bottom: 20px;
}

.exam-header h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.6rem;
  font-weight: 600;
}

.progress-container {
  margin-top: 20px;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: right;
  font-size: 0.9rem;
  color: #757575;
}

.loading-container, .waiting-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.loader {
  border: 5px solid #f3f3f3;
  border-radius: 50%;
  border-top: 5px solid #4CAF50;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.waiting-icon {
  font-size: 3rem;
  color: #FF9800;
  margin-bottom: 20px;
}

.waiting-subtext {
  color: #757575;
  font-size: 0.9rem;
}

.error-container {
  background-color: #ffebee;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  margin: 20px 0;
}

.error-icon {
  color: #f44336;
  font-size: 1.5rem;
  margin-right: 16px;
}

.error-message {
  color: #d32f2f;
  margin: 0;
}

.question-container {
  margin: 20px 0;
}

.question-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 16px;
}

.question-text h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 500;
  line-height: 1.4;
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

.answer-container {
  margin: 20px 0;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:hover {
  background-color: #f5f5f5;
  border-color: #bdbdbd;
}

.option-item.selected {
  background-color: #e8f5e9;
  border-color: #4CAF50;
}

.option-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #9e9e9e;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-item.selected .option-radio {
  border-color: #4CAF50;
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #4CAF50;
}

.option-text {
  font-size: 1rem;
  color: #333;
}

.text-answer-container {
  margin-top: 12px;
}

.text-answer-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  transition: border-color 0.2s;
}

.text-answer-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.navigation-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.nav-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.prev-btn {
  background-color: #f5f5f5;
  color: #333;
}

.prev-btn:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.next-btn {
  background-color: #2196F3;
  color: white;
}

.next-btn:hover:not(:disabled) {
  background-color: #1976D2;
}

.submit-btn {
  background-color: #4CAF50;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background-color: #43A047;
}

.question-bubbles {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}

.question-bubble {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.question-bubble.current {
  border-color: #2196F3;
  color: #2196F3;
  transform: scale(1.1);
}

.question-bubble.answered {
  background-color: #e8f5e9;
  color: #4CAF50;
}

.question-bubble.unanswered {
  background-color: #f5f5f5;
  color: #757575;
}

.question-bubble:hover {
  border-color: #bdbdbd;
}

/* Score Result Styles */
.score-result {
  margin: 30px auto;
  max-width: 600px;
}

.score-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
  padding: 30px;
  text-align: center;
}

.score-card h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.8rem;
  margin-bottom: 24px;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: white;
  font-weight: bold;
  font-size: 2rem;
}

.excellent {
  background-color: #4CAF50;
}

.good {
  background-color: #8BC34A;
}

.average {
  background-color: #FFC107;
}

.needs-improvement {
  background-color: #F44336;
}

.score-details {
  text-align: center;
}

.score-message {
  font-size: 1.2rem;
  font-weight: 500;
  margin-top: 16px;
  color: #333;
}

.return-btn {
  padding: 12px 24px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  margin-top: 16px;
  transition: background-color 0.2s;
}

.return-btn:hover {
  background-color: #1976D2;
}

@media (min-width: 768px) {
.exam-session {
    padding: 0rem;
  }
  .score-display {
    flex-direction: row;
    align-items: center;
    text-align: left;
  }
  
  .score-circle {
    margin-right: 30px;
    margin-bottom: 0;
  }
  
  .score-details {
    text-align: left;
  }
}

@media (max-width: 600px) {
  .exam-session {
    padding: 0rem;
  } 
  .question-card {
    padding: 16px;
  }
  
  .navigation-buttons {
    flex-direction: column;
    gap: 12px;
  }
  
  .nav-btn {
    width: 100%;
    justify-content: center;
  }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1.5rem;
}

.view-results-btn {
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.view-results-btn:hover {
  background-color: #43A047;
}

/* Fullscreen Image Modal Styles */
.fullscreen-image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.fullscreen-image-container {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.fullscreen-image-container img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.5);
}

.close-fullscreen-btn {
  position: absolute;
  top: -20px;
  right: -20px;
  background-color: white;
  color: #333;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
}

.close-fullscreen-btn:hover {
  background-color: #f44336;
  color: white;
}

.clickable-image {
  cursor: zoom-in;
  transition: transform 0.2s;
}

.clickable-image:hover {
  transform: scale(1.02);
}

.timer-container {
  margin-top: 15px;
  padding: 10px 15px;
  background-color: #e8f5e9;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #4CAF50;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.timer-container.warning {
  background-color: #fff3e0;
  color: #ff9800;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* Essay Answer Styles */
.essay-answer-container {
  margin-top: 12px;
}

.essay-info {
  background-color: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.essay-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.essay-notice .material-icons-round {
  color: #666;
  font-size: 20px;
  margin-top: 2px;
}

.essay-notice div p {
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.essay-notice div p:first-child {
  font-weight: 600;
  color: #444;
  font-size: 1rem;
}

.essay-notice div p:last-child {
  color: #666;
  font-size: 0.9rem;
}

.essay-answer-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  color: #333;
  font-family: inherit;
  line-height: 1.5;
  resize: vertical;
  min-height: 200px;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.essay-answer-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.essay-answer-input::placeholder {
  color: #aaa;
  font-style: italic;
}

.essay-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 0.9rem;
  color: #666;
}

.word-count {
  font-weight: 500;
}

.word-count.word-limit-exceeded {
  color: #f44336;
  font-weight: 600;
}

.points-info {
  color: #4CAF50;
  font-weight: 600;
}

.word-limit-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0 0;
  font-size: 0.9rem;
  color: #1976d2;
  font-weight: 500;
}

.word-limit-notice .material-icons-round {
  font-size: 16px;
}

.essay-answer-input.word-limit-exceeded {
  border-color: #f44336;
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.1);
}

.word-limit-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  color: #c62828;
  font-size: 0.9rem;
  font-weight: 500;
}

.word-limit-warning .material-icons-round {
  font-size: 18px;
  color: #f44336;
}

/* Mobile responsiveness for essay components */
@media (max-width: 600px) {
  .essay-info {
    padding: 12px;
  }
  
  .essay-notice {
    gap: 10px;
  }
  
  .essay-notice .material-icons-round {
    font-size: 18px;
  }
  
  .essay-notice div p:first-child {
    font-size: 0.95rem;
  }
  
  .essay-notice div p:last-child {
    font-size: 0.85rem;
  }
  
  .essay-answer-input {
    padding: 12px;
    font-size: 16px; /* Prevent zoom on iOS */
    min-height: 150px;
  }
  
  .essay-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .exam-session {
    max-width: 900px;
    padding: 12px;
  }
  
  .exam-header h2 {
    font-size: 1.4rem;
    margin-bottom: 12px;
  }
  
  .progress-container {
    margin-top: 12px;
  }
  
  .progress-bar {
    height: 5px;
  }
  
  .progress-text {
    font-size: 0.8rem;
  }
  
  .timer-container {
    margin-top: 8px;
    padding: 6px 10px;
    font-size: 0.9rem;
  }
  
  .question-card {
    padding: 16px;
    margin-bottom: 12px;
  }
  
  .question-text h3 {
    font-size: 1.1rem;
    line-height: 1.3;
  }
  
  .question-image {
    margin: 10px 0;
  }
  
  .question-image img {
    max-height: 200px;
  }
  
  .answer-container {
    margin: 16px 0;
  }
  
  .options-container {
    gap: 8px;
  }
  
  .option-item {
    padding: 8px 12px;
  }
  
  .option-text {
    font-size: 0.9rem;
  }
  
  .text-answer-input {
    padding: 8px;
    font-size: 0.9rem;
  }
  
  .essay-answer-input {
    padding: 10px;
    font-size: 0.9rem;
    min-height: 160px;
  }
  
  .navigation-buttons {
    margin-top: 16px;
  }
  
  .nav-btn {
    padding: 6px 14px;
    font-size: 0.85rem;
    gap: 4px;
  }
  
  .question-bubbles {
    gap: 6px;
    margin-top: 16px;
  }
  
  .question-bubble {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
  
  .score-result {
    margin: 20px auto;
    max-width: 450px;
  }
  
  .score-card {
    padding: 18px;
  }
  
  .score-card h2 {
    font-size: 1.4rem;
    margin-bottom: 16px;
  }
  
  .score-display {
    margin-bottom: 20px;
  }
  
  .score-circle {
    width: 90px;
    height: 90px;
    font-size: 1.6rem;
    margin-bottom: 16px;
  }
  
  .score-message {
    font-size: 1rem;
    margin-top: 10px;
  }
  
  .return-btn, .view-results-btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
  
  .action-buttons {
    gap: 0.6rem;
    margin-top: 1rem;
  }
}

/* Compact layout for 14-inch laptops and lower resolutions */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .exam-session {
    max-width: 800px;
    padding: 10px;
  }
  
  .exam-header h2 {
    font-size: 1.3rem;
    margin-bottom: 10px;
  }
  
  .progress-container {
    margin-top: 10px;
  }
  
  .progress-bar {
    height: 4px;
  }
  
  .progress-text {
    font-size: 0.75rem;
  }
  
  .timer-container {
    margin-top: 6px;
    padding: 5px 8px;
    font-size: 0.85rem;
    gap: 4px;
  }
  
  .question-card {
    padding: 14px;
    margin-bottom: 10px;
  }
  
  .question-text h3 {
    font-size: 1rem;
    line-height: 1.2;
  }
  
  .question-image {
    margin: 8px 0;
  }
  
  .question-image img {
    max-height: 180px;
  }
  
  .answer-container {
    margin: 14px 0;
  }
  
  .options-container {
    gap: 6px;
  }
  
  .option-item {
    padding: 6px 10px;
  }
  
  .option-radio {
    width: 16px;
    height: 16px;
    margin-right: 8px;
  }
  
  .radio-inner {
    width: 8px;
    height: 8px;
  }
  
  .option-text {
    font-size: 0.85rem;
  }
  
  .text-answer-input {
    padding: 6px;
    font-size: 0.85rem;
  }
  
  .essay-answer-input {
    padding: 8px;
    font-size: 0.85rem;
    min-height: 140px;
  }
  
  .essay-info {
    padding: 10px;
    margin-bottom: 10px;
  }
  
  .essay-notice {
    gap: 6px;
  }
  
  .essay-notice .material-icons-round {
    font-size: 16px;
  }
  
  .essay-notice div p:first-child {
    font-size: 0.85rem;
  }
  
  .essay-notice div p:last-child {
    font-size: 0.75rem;
  }
  
  .essay-meta {
    margin-top: 5px;
    font-size: 0.75rem;
  }
  
  .navigation-buttons {
    margin-top: 14px;
  }
  
  .nav-btn {
    padding: 5px 12px;
    font-size: 0.8rem;
    gap: 3px;
  }
  
  .question-bubbles {
    gap: 5px;
    margin-top: 14px;
  }
  
  .question-bubble {
    width: 26px;
    height: 26px;
    font-size: 0.75rem;
  }
  
  .score-result {
    margin: 16px auto;
    max-width: 400px;
  }
  
  .score-card {
    padding: 16px;
  }
  
  .score-card h2 {
    font-size: 1.3rem;
    margin-bottom: 14px;
  }
  
  .score-display {
    margin-bottom: 16px;
  }
  
  .score-circle {
    width: 80px;
    height: 80px;
    font-size: 1.4rem;
    margin-bottom: 14px;
  }
  
  .score-message {
    font-size: 0.9rem;
    margin-top: 8px;
  }
  
  .return-btn, .view-results-btn {
    padding: 6px 14px;
    font-size: 0.85rem;
  }
  
  .action-buttons {
    gap: 0.5rem;
    margin-top: 1rem;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .exam-session {
    max-width: 700px;
    padding: 8px;
  }
  
  .exam-header h2 {
    font-size: 1.2rem;
    margin-bottom: 8px;
  }
  
  .progress-container {
    margin-top: 8px;
  }
  
  .progress-bar {
    height: 3px;
  }
  
  .progress-text {
    font-size: 0.7rem;
  }
  
  .timer-container {
    margin-top: 5px;
    padding: 4px 6px;
    font-size: 0.8rem;
    gap: 3px;
  }
  
  .question-card {
    padding: 12px;
    margin-bottom: 8px;
  }
  
  .question-text h3 {
    font-size: 0.9rem;
    line-height: 1.2;
    margin-top: 0;
  }
  
  .question-image {
    margin: 6px 0;
  }
  
  .question-image img {
    max-height: 160px;
  }
  
  .answer-container {
    margin: 12px 0;
  }
  
  .options-container {
    gap: 4px;
  }
  
  .option-item {
    padding: 5px 8px;
  }
  
  .option-radio {
    width: 14px;
    height: 14px;
    margin-right: 6px;
  }
  
  .radio-inner {
    width: 6px;
    height: 6px;
  }
  
  .option-text {
    font-size: 0.8rem;
  }
  
  .text-answer-input {
    padding: 5px;
    font-size: 0.8rem;
  }
  
  .essay-answer-input {
    padding: 6px;
    font-size: 0.8rem;
    min-height: 120px;
  }
  
  .essay-info {
    padding: 8px;
    margin-bottom: 8px;
  }
  
  .essay-notice {
    gap: 4px;
  }
  
  .essay-notice .material-icons-round {
    font-size: 14px;
  }
  
  .essay-notice div p:first-child {
    font-size: 0.8rem;
  }
  
  .essay-notice div p:last-child {
    font-size: 0.7rem;
  }
  
  .essay-meta {
    margin-top: 4px;
    font-size: 0.7rem;
  }
  
  .navigation-buttons {
    margin-top: 12px;
  }
  
  .nav-btn {
    padding: 4px 10px;
    font-size: 0.75rem;
    gap: 2px;
  }
  
  .question-bubbles {
    gap: 4px;
    margin-top: 12px;
  }
  
  .question-bubble {
    width: 24px;
    height: 24px;
    font-size: 0.7rem;
  }
  
  .score-result {
    margin: 16px auto;
    max-width: 350px;
  }
  
  .score-card {
    padding: 14px;
  }
  
  .score-card h2 {
    font-size: 1.2rem;
    margin-bottom: 12px;
  }
  
  .score-display {
    margin-bottom: 16px;
  }
  
  .score-circle {
    width: 70px;
    height: 70px;
    font-size: 1.2rem;
    margin-bottom: 12px;
  }
  
  .score-message {
    font-size: 0.85rem;
    margin-top: 6px;
  }
  
  .return-btn, .view-results-btn {
    padding: 5px 12px;
    font-size: 0.8rem;
    margin-top: 10px;
  }
  
  .action-buttons {
    gap: 0.4rem;
    margin-top: 0.8rem;
  }
  
  .waiting-container, .loading-container {
    min-height: 200px;
  }
  
  .loader {
    width: 35px;
    height: 35px;
    border-width: 3px;
    margin-bottom: 12px;
  }
  
  .waiting-icon {
    font-size: 2rem;
    margin-bottom: 12px;
  }
  
  .error-container {
    padding: 10px;
    margin: 12px 0;
  }
  
  .error-icon {
    font-size: 1.2rem;
    margin-right: 10px;
  }
  
  .fullscreen-image-modal {
    padding: 12px;
  }
  
  .close-fullscreen-btn {
    width: 32px;
    height: 32px;
    top: -16px;
    right: -16px;
  }
}
</style> 