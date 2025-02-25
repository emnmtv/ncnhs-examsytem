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
    
    <!-- Score Results -->
    <div v-if="scoreResult" class="score-result">
      <div class="score-card">
        <h2>Your Score</h2>
        <div class="score-display">
          <div class="score-circle" :class="getScoreClass(scoreResult.percentage)">
            <span class="score-percentage">{{ scoreResult.percentage }}%</span>
          </div>
          <div class="score-details">
            <p>You got <strong>{{ scoreResult.score }}</strong> out of <strong>{{ scoreResult.total }}</strong> questions correct.</p>
            <p class="score-message">{{ getScoreMessage(scoreResult.percentage) }}</p>
          </div>
        </div>
        <button @click="quitExam" class="return-btn">Return to Exam Details</button>
      </div>
    </div>
    
    <!-- Question Display -->
    <div v-else-if="exam && exam.questions && currentQuestionIndex !== null && !scoreResult" class="question-container">
      <div class="question-card">
        <div class="question-text">
          <h3>{{ currentQuestionIndex + 1 }}. {{ currentQuestion.questionText }}</h3>
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
          
          <!-- Text Input for Short Answer -->
          <div v-else class="text-answer-container">
            <input 
              type="text" 
              v-model="answers[currentQuestion.questionId]" 
              placeholder="Type your answer here..."
              class="text-answer-input"
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
  </div>
</template>

<script>
import { fetchExamQuestions, submitExamAnswers } from '@/services/authService';
import Swal from 'sweetalert2';

export default {
  props: {
    testCode: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      exam: null,
      answers: {},
      error: null,
      loading: true,
      refreshInterval: null,
      scoreResult: null,
      currentQuestionIndex: null,
      shuffledQuestions: [],
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
  },
  beforeUnmount() {
    // Clean up the polling interval
    this.clearPolling();
  },
  watch: {
    'exam.questions': {
      handler(newQuestions) {
        if (newQuestions && newQuestions.length > 0) {
          this.initializeExam();
          
          // If we have questions now, we can stop polling
          this.clearPolling();
        }
      },
      immediate: true
    },
    
    'exam.status': {
      handler(newStatus) {
        // If exam is no longer pending, adjust polling frequency or stop it
        if (newStatus === 'started' && this.exam.questions && this.exam.questions.length > 0) {
          // We have questions and exam is started, so stop polling
          this.clearPolling();
        } else if (newStatus === 'stopped') {
          // Exam is stopped, no need to poll
          this.clearPolling();
        }
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
        // Create a shuffled copy of the questions
        this.shuffledQuestions = [...this.exam.questions].sort(() => Math.random() - 0.5);
        this.currentQuestionIndex = 0;
        
        // Initialize empty answers object
        this.answers = {};
      }
    },
    
    nextQuestion() {
      if (this.currentQuestionIndex < this.shuffledQuestions.length - 1) {
        this.currentQuestionIndex++;
      }
    },
    
    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
      }
    },
    
    goToQuestion(index) {
      if (index >= 0 && index < this.shuffledQuestions.length) {
        this.currentQuestionIndex = index;
      }
    },
    
    selectOption(questionId, option) {
      this.answers[questionId] = option;
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
      try {
        this.error = null;
        const answerData = {
          testCode: this.testCode,
          answers: Object.keys(this.answers).map(questionId => ({
            questionId: parseInt(questionId),
            userAnswer: this.answers[questionId],
          })),
        };
        
        const response = await submitExamAnswers(answerData);
        
        // Store the score result
        this.scoreResult = response.score;
        
        // Emit an event to notify parent component
        this.$emit('answers-submitted', this.scoreResult);
      } catch (err) {
        this.error = err.message;
      }
    },
    
    quitExam() {
      // Confirm before quitting if not on score screen
      if (!this.scoreResult) {
        Swal.fire({
          title: 'Are you sure?',
          text: "You'll lose your progress if you haven't submitted.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#4CAF50',
          cancelButtonColor: '#f44336',
          confirmButtonText: 'Yes, quit exam',
          cancelButtonText: 'Stay on exam'
        }).then((result) => {
          if (result.isConfirmed) {
            console.log('Quitting exam from ExamSession');
            this.$emit('quit-exam');
          }
        });
      } else {
        this.$emit('quit-exam');
      }
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
  }
};
</script>

<style scoped>
.exam-session {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', sans-serif;
}

.exam-header {
  text-align: center;
  margin-bottom: 24px;
}

.exam-header h2 {
  margin-top: 0;
  color: #333;
  font-size: 1.8rem;
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
  padding: 24px;
  margin-bottom: 20px;
}

.question-text h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.3rem;
  font-weight: 500;
  line-height: 1.5;
}

.answer-container {
  margin: 24px 0;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  margin-top: 24px;
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
  gap: 10px;
  margin-top: 24px;
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
  background-color: #f44336;
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
  background-color: #d32f2f;
}

@media (min-width: 768px) {
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
</style> 