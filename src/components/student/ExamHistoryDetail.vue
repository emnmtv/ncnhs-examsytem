<template>
  <div class="exam-detail-container">
    <div class="content-header">
      <div class="left-section">
        <h1>
          <button @click="goBack" class="back-btn">
            <span class="material-icons-round">arrow_back</span>
          </button>
          Exam Review
        </h1>
        <p class="subtitle" v-if="exam">{{ exam.exam.examTitle }}</p>
      </div>
      <div class="right-section" v-if="exam">
        <div class="controls">
          <div class="view-toggle">
            <button 
              @click="currentView = 'detailed'" 
              class="toggle-btn" 
              :class="{ active: currentView === 'detailed' }"
            >
              <span class="material-icons-round">view_agenda</span>
            </button>
            <button 
              @click="currentView = 'table'" 
              class="toggle-btn" 
              :class="{ active: currentView === 'table' }"
            >
              <span class="material-icons-round">table_rows</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading exam details...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="fetchExamDetail" class="retry-btn">Try Again</button>
    </div>
    
    <div v-else-if="!exam" class="empty-state">
      <span class="material-icons-round">description</span>
      <h3>Exam Not Found</h3>
      <p>The requested exam could not be found.</p>
      <button @click="goBack" class="back-btn-large">
        <span class="material-icons-round">arrow_back</span>
        Back to Exam History
      </button>
    </div>
    
    <div v-else class="main-content">
      <div class="result-summary">
        <div class="result-card">
          <div class="score-display">
            <div class="score-circle" :class="getScoreClass(exam.score.percentage)">
              {{ exam.score.percentage }}%
            </div>
            <div class="score-info">
              <h3>{{ getScoreMessage(exam.score.percentage) }}</h3>
              <p>You got <strong>{{ exam.score.score }}</strong> out of <strong>{{ exam.score.total }}</strong> questions correct</p>
              <p class="taken-on">Taken on {{ formatDate(exam.score.submittedAt) }}</p>
            </div>
          </div>
          
          <div class="exam-meta">
            <div class="meta-row">
              <div class="meta-label">Class Code:</div>
              <div class="meta-value">{{ exam.exam.classCode }}</div>
            </div>
            <div class="meta-row">
              <div class="meta-label">Teacher:</div>
              <div class="meta-value">{{ exam.exam.user.firstName }} {{ exam.exam.user.lastName }}</div>
            </div>
            <div class="meta-row">
              <div class="meta-label">Test Code:</div>
              <div class="meta-value">{{ exam.exam.testCode }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="questions-review">
        <h3 class="section-title">
          <span class="material-icons-round">question_answer</span>
          Questions Review
        </h3>
        
        <!-- Detailed Questions View -->
        <div v-if="currentView === 'detailed'" class="questions-list">
          <div 
            v-for="(question, qIndex) in paginatedQuestions" 
            :key="qIndex"
            class="question-item"
            :class="getQuestionItemClass(question)"
          >
            <div class="question-header">
              <span class="question-number">Question {{ getActualQuestionNumber(qIndex) }}</span>
              <span class="question-status">
                <span class="material-icons-round">{{ getQuestionStatusIcon(question) }}</span>
                {{ getQuestionStatusText(question) }}
              </span>
            </div>
            
            <div class="question-content">
              <p>{{ question.questionText }}</p>
              
              <div v-if="question.imageUrl" class="question-image-container">
                <img :src="getImageUrl(question.imageUrl)" alt="Question image" class="question-image">
              </div>
            </div>
            
            <!-- Multiple Choice Question -->
            <div v-if="question.questionType === 'multiple_choice' || question.questionType === 'multipleChoice'" class="answer-section">
              <div 
                v-for="(option, oIndex) in parseOptions(question.options)" 
                :key="oIndex"
                class="answer-option"
                :class="{
                  'user-selected': option === question.userAnswer,
                  'correct-answer': option === question.correctAnswer
                }"
              >
                <span class="option-marker">
                  <span v-if="option === question.userAnswer && option === question.correctAnswer" 
                        class="material-icons-round correct-icon">check_circle</span>
                  <span v-else-if="option === question.userAnswer && option !== question.correctAnswer" 
                        class="material-icons-round incorrect-icon">cancel</span>
                  <span v-else-if="option === question.correctAnswer" 
                        class="material-icons-round correct-icon">check_circle</span>
                  <span v-else class="material-icons-round">radio_button_unchecked</span>
                </span>
                <span class="option-text">{{ option }}</span>
              </div>
            </div>
            
            <!-- True/False Question -->
            <div v-else-if="question.questionType === 'true_false'" class="answer-section tf-section">
              <div 
                class="tf-option"
                :class="{
                  'user-selected': isTrueSelected(question.userAnswer),
                  'correct-answer': isTrueCorrect(question.correctAnswer)
                }"
              >
                <span class="option-marker">
                  <span v-if="isTrueSelected(question.userAnswer) && isTrueCorrect(question.correctAnswer)" 
                        class="material-icons-round correct-icon">check_circle</span>
                  <span v-else-if="isTrueSelected(question.userAnswer) && !isTrueCorrect(question.correctAnswer)" 
                        class="material-icons-round incorrect-icon">cancel</span>
                  <span v-else-if="isTrueCorrect(question.correctAnswer)" 
                        class="material-icons-round correct-icon">check_circle</span>
                  <span v-else class="material-icons-round">radio_button_unchecked</span>
                </span>
                <span class="option-text">True</span>
              </div>
              
              <div 
                class="tf-option"
                :class="{
                  'user-selected': isFalseSelected(question.userAnswer),
                  'correct-answer': isFalseCorrect(question.correctAnswer)
                }"
              >
                <span class="option-marker">
                  <span v-if="isFalseSelected(question.userAnswer) && isFalseCorrect(question.correctAnswer)" 
                        class="material-icons-round correct-icon">check_circle</span>
                  <span v-else-if="isFalseSelected(question.userAnswer) && !isFalseCorrect(question.correctAnswer)" 
                        class="material-icons-round incorrect-icon">cancel</span>
                  <span v-else-if="isFalseCorrect(question.correctAnswer)" 
                        class="material-icons-round correct-icon">check_circle</span>
                  <span v-else class="material-icons-round">radio_button_unchecked</span>
                </span>
                <span class="option-text">False</span>
              </div>
            </div>
            
            <!-- Essay Question -->
            <div v-else-if="question.questionType === 'essay'" class="answer-section essay-answer">
              <div class="essay-response">
                <div class="essay-header">
                  <h4>Your Essay Response</h4>
                  <div v-if="question.userAnswer" class="essay-stats">
                    <span class="word-count">{{ getWordCount(question.userAnswer) }} words</span>
                    <span class="char-count">{{ question.userAnswer.length }} characters</span>
                    <span v-if="question.wordLimit" class="word-limit">/ {{ question.wordLimit }} limit</span>
                  </div>
                </div>
                
                <div class="essay-text" :class="{ 'no-answer': !question.userAnswer }">
                  {{ question.userAnswer || 'No essay response provided' }}
                </div>
                
                <div v-if="question.wordLimit && isWordLimitExceeded(question)" class="word-limit-warning">
                  <span class="material-icons-round">warning</span>
                  Response exceeds word limit
                </div>
              </div>
              
              <div v-if="question.essayScore !== undefined" class="essay-grading">
                <div class="grading-header">
                  <h4>Essay Grading</h4>
                </div>
                <div class="grade-info">
                  <div class="score-display">
                    <span class="score-label">Score:</span>
                    <span class="score-value">{{ question.essayScore }}/{{ question.points || 1 }} points</span>
                  </div>
                  <div v-if="question.teacherFeedback" class="feedback-display">
                    <span class="feedback-label">Teacher Feedback:</span>
                    <div class="feedback-text">{{ question.teacherFeedback }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Short Answer or Enumeration -->
            <div v-else class="answer-section text-answer">
              <div class="answer-row">
                <div class="answer-label">Your Answer:</div>
                <div class="answer-value" :class="{ 'correct': question.isCorrect, 'incorrect': !question.isCorrect }">
                  {{ question.userAnswer || 'No answer provided' }}
                </div>
              </div>
              
              <div class="answer-row">
                <div class="answer-label">Correct Answer:</div>
                <div class="answer-value correct">{{ question.correctAnswer }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Table Questions View -->
        <div v-else class="questions-table-container">
          <table class="questions-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Question</th>
                <th>Type</th>
                <th>Your Answer</th>
                <th>Correct Answer</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(question, qIndex) in paginatedQuestions" :key="qIndex" :class="{ 'correct-row': question.isCorrect, 'incorrect-row': !question.isCorrect }">
                <td>{{ getActualQuestionNumber(qIndex) }}</td>
                <td>
                  <div class="truncate-text">{{ question.questionText }}</div>
                  <img v-if="question.imageUrl" :src="getImageUrl(question.imageUrl)" class="table-question-image" />
                </td>
                <td>{{ formatQuestionType(question.questionType) }}</td>
                <td>{{ formatAnswer(question) }}</td>
                <td>{{ formatCorrectAnswer(question) }}</td>
                <td>
                  <span class="status-badge" :class="getQuestionStatusClass(question)">
                    <span class="material-icons-round">{{ getQuestionStatusIcon(question) }}</span>
                    {{ getQuestionStatusText(question) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button 
            class="page-btn" 
            :disabled="currentPage === 1"
            @click="currentPage = 1"
          >
            <span class="material-icons-round">first_page</span>
          </button>
          <button 
            class="page-btn" 
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <span class="material-icons-round">chevron_left</span>
          </button>
          
          <div class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
          </div>
          
          <button 
            class="page-btn" 
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <span class="material-icons-round">chevron_right</span>
          </button>
          <button 
            class="page-btn" 
            :disabled="currentPage === totalPages"
            @click="currentPage = totalPages"
          >
            <span class="material-icons-round">last_page</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getStudentExamHistory } from '@/services/authService';
import { getFullImageUrl } from '@/services/authService';

export default {
  name: 'ExamHistoryDetail',
  data() {
    return {
      loading: true,
      error: null,
      examHistory: [],
      exam: null,
      currentView: 'detailed', // 'detailed' or 'table'
      currentPage: 1,
      itemsPerPage: 5
    };
  },
  computed: {
    totalPages() {
      if (!this.exam) return 1;
      return Math.ceil(this.exam.questions.length / this.itemsPerPage);
    },
    paginatedQuestions() {
      if (!this.exam) return [];
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.exam.questions.slice(start, end);
    }
  },
  mounted() {
    this.fetchExamDetail();
    
    // Load Material Icons if not already loaded
    if (!document.getElementById('material-icons')) {
      const link = document.createElement('link');
      link.id = 'material-icons';
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  },
  methods: {
    async fetchExamDetail() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await getStudentExamHistory();
        this.examHistory = response.examHistory;
        
        // Get the exam ID from URL
        const examId = parseInt(this.$route.params.id);
        
        if (examId >= 0 && examId < this.examHistory.length) {
          this.exam = this.examHistory[examId];
        } else {
          throw new Error('Exam not found');
        }
      } catch (error) {
        console.error('Error fetching exam details:', error);
        this.error = error.message || 'Failed to load exam details. Please try again.';
      } finally {
        this.loading = false;
      }
    },
    
    goBack() {
      this.$router.push('/exam-history');
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    parseOptions(options) {
      console.log("Question options:", options);
      
      if (!options) return [];
      if (typeof options === 'string') {
        try {
          return JSON.parse(options);
        } catch (e) {
          console.error('Error parsing options:', e);
          return [];
        }
      }
      return options;
    },
    
    formatQuestionType(type) {
      const types = {
        'multiple_choice': 'Multiple Choice',
        'multipleChoice': 'Multiple Choice',
        'true_false': 'True/False',
        'enumeration': 'Short Answer',
        'essay': 'Essay'
      };
      return types[type] || type;
    },
    
    formatAnswer(question) {
      if (!question.userAnswer) return 'No answer provided';
      
      // Format true/false answers consistently
      if (question.questionType === 'true_false') {
        const answer = question.userAnswer.toString().toLowerCase();
        if (answer === 'true') return 'True';
        if (answer === 'false') return 'False';
      }
      
      // Format essay answers with word count
      if (question.questionType === 'essay') {
        const wordCount = this.getWordCount(question.userAnswer);
        const truncated = question.userAnswer.length > 100 
          ? question.userAnswer.substring(0, 100) + '...' 
          : question.userAnswer;
        return `${truncated} (${wordCount} words)`;
      }
      
      return question.userAnswer;
    },
    
    formatCorrectAnswer(question) {
      // Essay questions don't have a "correct" answer - they are graded by teachers
      if (question.questionType === 'essay') {
        return 'Teacher Graded';
      }
      
      if (!question.correctAnswer) return 'No correct answer';
      
      // Format true/false correct answers consistently
      if (question.questionType === 'true_false') {
        const answer = question.correctAnswer.toString().toLowerCase();
        if (answer === 'true') return 'True';
        if (answer === 'false') return 'False';
      }
      
      return question.correctAnswer;
    },
    
    getScoreClass(percentage) {
      if (percentage >= 90) return 'excellent';
      if (percentage >= 80) return 'good';
      if (percentage >= 70) return 'average';
      return 'needs-improvement';
    },
    
    getScoreMessage(percentage) {
      if (percentage >= 90) return 'Excellent!';
      if (percentage >= 80) return 'Good job!';
      if (percentage >= 70) return 'Well done!';
      return 'Needs improvement';
    },
    
    getImageUrl(imageUrl) {
      return getFullImageUrl(imageUrl);
    },
    
    getActualQuestionNumber(index) {
      return (this.currentPage - 1) * this.itemsPerPage + index + 1;
    },
    
    // Helper methods for True/False comparison (case-insensitive)
    isTrueSelected(userAnswer) {
      if (!userAnswer) return false;
      return userAnswer.toString().toLowerCase() === 'true';
    },
    
    isFalseSelected(userAnswer) {
      if (!userAnswer) return false;
      return userAnswer.toString().toLowerCase() === 'false';
    },
    
    isTrueCorrect(correctAnswer) {
      if (!correctAnswer) return false;
      return correctAnswer.toString().toLowerCase() === 'true';
    },
    
    isFalseCorrect(correctAnswer) {
      if (!correctAnswer) return false;
      return correctAnswer.toString().toLowerCase() === 'false';
    },
    
    // Helper methods for essay questions
    getWordCount(text) {
      if (!text) return 0;
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    },
    
    isWordLimitExceeded(question) {
      if (!question.userAnswer || !question.wordLimit) return false;
      return this.getWordCount(question.userAnswer) > question.wordLimit;
    },
    
    // Helper methods for question status
    getQuestionStatusIcon(question) {
      // For essay questions
      if (question.questionType === 'essay') {
        if (question.essayScore !== undefined && question.essayScore !== null) {
          return 'check_circle'; // Graded
        } else {
          return 'pending'; // To be checked
        }
      }
      
      // For other question types
      return question.isCorrect ? 'check_circle' : 'cancel';
    },
    
    getQuestionStatusText(question) {
      // For essay questions
      if (question.questionType === 'essay') {
        if (question.essayScore !== undefined && question.essayScore !== null) {
          return 'Graded';
        } else {
          return 'To be checked';
        }
      }
      
      // For other question types
      return question.isCorrect ? 'Correct' : 'Incorrect';
    },
    
    getQuestionItemClass(question) {
      // For essay questions
      if (question.questionType === 'essay') {
        if (question.essayScore !== undefined && question.essayScore !== null) {
          return 'graded';
        } else {
          return 'pending';
        }
      }
      
      // For other question types
      return question.isCorrect ? 'correct' : 'incorrect';
    },
    
    getQuestionStatusClass(question) {
      // For essay questions
      if (question.questionType === 'essay') {
        if (question.essayScore !== undefined && question.essayScore !== null) {
          return 'graded';
        } else {
          return 'pending';
        }
      }
      
      // For other question types
      return question.isCorrect ? 'correct' : 'incorrect';
    }
  },
  watch: {
    // Reset to first page when switching views
    currentView() {
      this.currentPage = 1;
    }
  }
};
</script>

<style scoped>
.exam-detail-container {
  max-width: auto;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Roboto', sans-serif;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.left-section h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
}

.back-btn:hover {
  background-color: rgba(79, 70, 229, 0.1);
}

.back-btn-large {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1.5rem;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toggle {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background-color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background-color: #4f46e5;
  color: white;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.loading-state .loader {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state .material-icons-round, 
.empty-state .material-icons-round {
  font-size: 48px;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.error-state p, .empty-state p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #111827;
  margin-bottom: 0.5rem;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Score and metadata styles */
.result-summary {
  margin-bottom: 2rem;
}

.result-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  padding: 1.5rem;
  border: 1px solid #f0f0f0;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.score-circle {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

.score-info {
  flex: 1;
}

.score-info h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: #111827;
}

.score-info p {
  color: #4b5563;
  margin-bottom: 0.25rem;
}

.taken-on {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.75rem;
}

.exam-meta {
  border-top: 1px solid #f0f0f0;
  padding-top: 1.5rem;
}

.meta-row {
  display: flex;
  margin-bottom: 0.75rem;
}

.meta-label {
  width: 120px;
  color: #6b7280;
  font-weight: 500;
}

.meta-value {
  flex: 1;
  color: #111827;
}

/* Questions section styles */
.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  color: #111827;
  margin-bottom: 1.5rem;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-item {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  padding: 1.5rem;
  border: 1px solid #f0f0f0;
}

.question-item.correct {
  border-left: 4px solid #10b981;
}

.question-item.incorrect {
  border-left: 4px solid #ef4444;
}

.question-item.pending {
  border-left: 4px solid #f59e0b;
}

.question-item.graded {
  border-left: 4px solid #10b981;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-number {
  font-weight: 500;
  color: #4b5563;
}

.question-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
}

.question-item.correct .question-status {
  color: #10b981;
}

.question-item.incorrect .question-status {
  color: #ef4444;
}

.question-item.pending .question-status {
  color: #f59e0b;
}

.question-item.graded .question-status {
  color: #10b981;
}

.question-content {
  margin-bottom: 1.5rem;
  color: #111827;
}

.question-content p {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.question-image-container {
  margin-top: 1rem;
  text-align: center;
}

.question-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.answer-section {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
}

.answer-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  background-color: white;
  border: 1px solid #e5e7eb;
}

.option-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.user-selected {
  background-color: #eff6ff;
  border-color: #3b82f6;
}

.correct-answer {
  background-color: #ecfdf5;
  border-color: #10b981;
}

.correct-icon {
  color: #10b981;
}

.incorrect-icon {
  color: #ef4444;
}

.tf-section {
  display: flex;
  gap: 1rem;
}

.tf-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 6px;
  background-color: white;
  border: 1px solid #e5e7eb;
}

.text-answer .answer-row {
  margin-bottom: 1rem;
}

.answer-label {
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.answer-value {
  padding: 1rem;
  border-radius: 6px;
  background-color: white;
  border: 1px solid #e5e7eb;
}

.answer-value.correct {
  background-color: #ecfdf5;
  border-color: #10b981;
  color: #065f46;
}

.answer-value.incorrect {
  background-color: #fef2f2;
  border-color: #ef4444;
  color: #991b1b;
}

/* Essay Question Styles */
.essay-answer {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 1.5rem;
}

.essay-response {
  margin-bottom: 1.5rem;
}

.essay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.essay-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.essay-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.word-count {
  font-weight: 500;
  color: #4b5563;
}

.char-count {
  color: #6b7280;
}

.word-limit {
  color: #f59e0b;
  font-weight: 500;
}

.essay-text {
  background-color: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  line-height: 1.7;
  font-size: 1rem;
  color: #1f2937;
  white-space: pre-wrap;
  word-wrap: break-word;
  min-height: 120px;
}

.essay-text.no-answer {
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.word-limit-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 500;
}

.word-limit-warning .material-icons-round {
  font-size: 18px;
}

.essay-grading {
  background-color: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  padding: 1.25rem;
}

.grading-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #0c4a6e;
  margin: 0 0 1rem 0;
}

.grade-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.score-label {
  font-weight: 500;
  color: #0c4a6e;
}

.score-value {
  background-color: #0ea5e9;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-weight: 600;
  font-size: 0.875rem;
}

.feedback-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.feedback-label {
  font-weight: 500;
  color: #0c4a6e;
  font-size: 0.875rem;
}

.feedback-text {
  background-color: white;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 0.75rem;
  color: #0c4a6e;
  line-height: 1.6;
  font-size: 0.875rem;
}

/* Table View Styles */
.questions-table-container {
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
}

.questions-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.questions-table th {
  background-color: #f9fafb;
  color: #4b5563;
  font-weight: 600;
  padding: 12px 16px;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: sticky;
  top: 0;
  z-index: 10;
}

.questions-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  color: #1f2937;
  vertical-align: middle;
}

.questions-table tr.correct-row {
  border-left: 4px solid #10b981;
}

.questions-table tr.incorrect-row {
  border-left: 4px solid #ef4444;
}

.truncate-text {
  max-width: 250px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.correct {
  background-color: #ecfdf5;
  color: #10b981;
}

.status-badge.incorrect {
  background-color: #fef2f2;
  color: #ef4444;
}

.status-badge.pending {
  background-color: #fef3c7;
  color: #f59e0b;
}

.status-badge.graded {
  background-color: #ecfdf5;
  color: #10b981;
}

.table-question-image {
  max-width: 120px;
  max-height: 80px;
  margin-top: 8px;
  border-radius: 4px;
}

/* Pagination Styles */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 0.5rem;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e0e0e0;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:not(:disabled):hover {
  background-color: #f5f5f5;
}

.page-info {
  padding: 0 1rem;
  font-size: 0.875rem;
  color: #4b5563;
}

/* Score classes */
.excellent {
  background-color: #10b981;
}

.good {
  background-color: #3b82f6;
}

.average {
  background-color: #f59e0b;
}

.needs-improvement {
  background-color: #ef4444;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .exam-detail-container {
    padding: 0rem;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .score-display {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .score-info {
    text-align: center;
  }
  
  .tf-section {
    flex-direction: column;
  }
  
  .meta-row {
    flex-direction: column;
  }
  
  .meta-label {
    width: 100%;
    margin-bottom: 0.25rem;
  }
  
  .questions-table th:nth-child(2),
  .questions-table td:nth-child(2) {
    max-width: 120px;
  }
  
  .questions-table th:nth-child(3),
  .questions-table td:nth-child(3) {
    display: none;
  }
  
  .truncate-text {
    max-width: 120px;
  }
  
  /* Essay question responsive adjustments */
  .essay-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .essay-stats {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .essay-text {
    padding: 1rem;
    min-height: 100px;
  }
  
  .grade-info {
    gap: 0.75rem;
  }
  
  .score-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style> 