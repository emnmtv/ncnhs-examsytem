<template>
  <div class="student-answer-details">
    <div class="header">
      <div class="back-button" @click="handleBack">
        <span class="material-icons">arrow_back</span>
        Back to Results
      </div>
      
      <div v-if="details" class="student-info">
        <h2>{{ details.student.firstName }} {{ details.student.lastName }}</h2>
        <div class="sub-info">
          <span>Grade {{ details.student.gradeLevel }}-{{ details.student.section }}</span>
          <span>|</span>
          <span>LRN: {{ details.student.lrn }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading answers...
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadAnswers" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="details" class="content">
      <div class="exam-info">
        <h3>{{ details.exam.examTitle }}</h3>
        <p class="test-code">Test Code: {{ details.exam.testCode }}</p>
      </div>

      <div class="score-section">
        <div class="current-score">
          <h4>Current Score</h4>
          <div class="score-display">
            <span class="score-value">{{ details.score?.score || 0 }}</span>
            <span class="score-total">/{{ details.answers.length }}</span>
            <span class="score-percentage">({{ details.score?.percentage || 0 }}%)</span>
          </div>
        </div>

        <div class="manual-score">
          <h4>Update Score Manually</h4>
          <div class="score-input">
            <input 
              type="number" 
              v-model.number="manualScore"
              :min="0"
              :max="details.answers.length"
              @keyup.enter="updateManualScore"
            >
            <button 
              @click="updateManualScore"
              :disabled="!isManualScoreValid || isUpdating"
            >
              <span v-if="isUpdating">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
              <span v-else>Update Score</span>
            </button>
          </div>
          <p v-if="!isManualScoreValid" class="error-text">
            Score must be between 0 and {{ details.answers.length }}
          </p>
        </div>
      </div>

      <div class="answers-list">
        <div 
          v-for="answer in details.answers" 
          :key="answer.questionId"
          class="answer-item"
          :data-correct="answer.isCorrect"
        >
          <div class="question-section">
            <div class="question-header">
              <span class="question-number">Question {{ answer.questionId }}</span>
              <span 
                class="question-type"
                :class="answer.questionType.toLowerCase().replace('_', '-')"
              >
                {{ formatQuestionType(answer.questionType) }}
              </span>
            </div>
            
            <p class="question-text">{{ answer.questionText }}</p>
            
            <div v-if="answer.imageUrl" class="question-image">
              <img :src="answer.imageUrl" :alt="'Image for question ' + answer.questionId">
            </div>

            <div v-if="answer.options" class="options">
              <div 
                v-for="(option, index) in answer.options" 
                :key="index"
                class="option"
                :class="{
                  'correct-option': option === answer.correctAnswer,
                  'selected-option': option === answer.userAnswer
                }"
              >
                {{ option }}
              </div>
            </div>
          </div>

          <div class="answer-section">
            <div class="answer-details">
              <div class="answer-label">Student's Answer:</div>
              <div class="student-answer" 
                :class="{ 
                  'no-answer': !answer.userAnswer,
                  'correct': answer.isCorrect,
                  'incorrect': !answer.isCorrect && answer.userAnswer
                }"
              >
                {{ answer.userAnswer || 'No answer provided' }}
              </div>
              
              <div class="correct-answer">
                <span class="answer-label">Correct Answer:</span>
                <span>{{ answer.correctAnswer }}</span>
              </div>
            </div>

            <div class="answer-actions">
              <div class="correctness-toggle">
                <button 
                  class="toggle-btn correct"
                  :class="{ active: answer.isCorrect }"
                  @click="updateAnswerCorrectness(answer.answerId, true)"
                  :disabled="isUpdating"
                >
                  <span class="material-icons">check_circle</span>
                  Correct
                </button>
                <button 
                  class="toggle-btn incorrect"
                  :class="{ active: !answer.isCorrect }"
                  @click="updateAnswerCorrectness(answer.answerId, false)"
                  :disabled="isUpdating"
                >
                  <span class="material-icons">cancel</span>
                  Incorrect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getStudentExamAnswers, updateStudentExamAnswer, updateStudentExamScore } from '../../services/authService';

export default {
  name: 'StudentAnswerDetails',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const details = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const isUpdating = ref(false);
    const manualScore = ref(0);

    const isManualScoreValid = computed(() => {
      if (!details.value) return false;
      const score = manualScore.value;
      return score >= 0 && score <= details.value.answers.length;
    });

    const loadAnswers = async () => {
      try {
        loading.value = true;
        error.value = null;
        const response = await getStudentExamAnswers(
          parseInt(route.params.examId),
          parseInt(route.params.studentId)
        );
        details.value = response;
        manualScore.value = response.score?.score || 0;
      } catch (err) {
        error.value = err.message;
        console.error('Error loading answers:', err);
      } finally {
        loading.value = false;
      }
    };

    const handleBack = () => {
      router.back();
    };

    const updateAnswerCorrectness = async (answerId, isCorrect) => {
      if (!answerId) return; // Skip if no answerId (no answer provided)
      
      try {
        isUpdating.value = true;
        const result = await updateStudentExamAnswer(answerId, isCorrect);
        
        // Update the local state
        const answer = details.value.answers.find(a => a.answerId === answerId);
        if (answer) {
          answer.isCorrect = isCorrect;
        }
        details.value.score = result.score;
        manualScore.value = result.score.score;
      } catch (err) {
        console.error('Error updating answer:', err);
        // Show error notification
      } finally {
        isUpdating.value = false;
      }
    };

    const updateManualScore = async () => {
      if (!isManualScoreValid.value) return;
      
      try {
        isUpdating.value = true;
        const result = await updateStudentExamScore(
          parseInt(route.params.examId),
          parseInt(route.params.studentId),
          manualScore.value
        );
        details.value.score = result.score;
      } catch (err) {
        console.error('Error updating score:', err);
        // Show error notification
      } finally {
        isUpdating.value = false;
      }
    };

    const formatQuestionType = (type) => {
      return type
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    onMounted(loadAnswers);

    return {
      details,
      loading,
      error,
      isUpdating,
      manualScore,
      isManualScoreValid,
      loadAnswers,
      updateAnswerCorrectness,
      updateManualScore,
      formatQuestionType,
      handleBack
    };
  }
};
</script>

<style scoped>
.student-answer-details {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background: #e0e0e0;
}

.student-info {
  text-align: right;
}

.student-info h2 {
  margin: 0;
  color: #333;
}

.sub-info {
  color: #666;
  margin-top: 5px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.exam-info {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.exam-info h3 {
  margin: 0;
  color: #333;
}

.test-code {
  color: #666;
  margin: 5px 0 0;
}

.score-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.current-score, .manual-score {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-top: 10px;
}

.score-value {
  font-size: 2.5em;
  font-weight: 600;
  color: #2196f3;
}

.score-total {
  font-size: 1.5em;
  color: #666;
}

.score-percentage {
  color: #666;
  margin-left: 10px;
}

.score-input {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.score-input input {
  width: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
}

.score-input button {
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.score-input button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-text {
  color: #f44336;
  font-size: 0.9em;
  margin-top: 5px;
}

.answers-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.answer-item {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  border-left: 5px solid transparent;
}

.answer-item[data-correct="true"] {
  border-left-color: #4caf50;
  background: linear-gradient(to right, rgba(76, 175, 80, 0.05), white);
}

.answer-item[data-correct="false"] {
  border-left-color: #f44336;
  background: linear-gradient(to right, rgba(244, 67, 54, 0.05), white);
}

.question-section {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.question-number {
  font-weight: 600;
  color: #333;
}

.question-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 500;
}

.question-type.multiple-choice {
  background: #e3f2fd;
  color: #1976d2;
}

.question-type.true-false {
  background: #f3e5f5;
  color: #7b1fa2;
}

.question-type.short-answer {
  background: #e8f5e9;
  color: #2e7d32;
}

.question-text {
  margin: 10px 0;
  color: #333;
  line-height: 1.5;
}

.question-image {
  margin: 10px 0;
}

.question-image img {
  max-width: 100%;
  border-radius: 4px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.option {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  transition: all 0.2s;
}

.option.correct-option {
  border-color: #4caf50;
  background: #e8f5e9;
}

.option.selected-option {
  border-color: #2196f3;
  background: #e3f2fd;
}

.answer-section {
  padding: 20px;
}

.answer-details {
  margin-bottom: 20px;
}

.answer-label {
  font-weight: 500;
  color: #666;
  margin-bottom: 5px;
}

.student-answer {
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  margin: 5px 0;
  border: 1px solid transparent;
}

.student-answer.correct {
  background: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
}

.student-answer.incorrect {
  background: #ffebee;
  border-color: #f44336;
  color: #c62828;
}

.student-answer.no-answer {
  color: #999;
  font-style: italic;
}

.correct-answer {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.answer-actions {
  display: flex;
  justify-content: flex-end;
}

.correctness-toggle {
  display: flex;
  gap: 10px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.toggle-btn.correct {
  background: #e8f5e9;
  color: #2e7d32;
}

.toggle-btn.correct:hover {
  background: #c8e6c9;
}

.toggle-btn.correct.active {
  background: #4caf50;
  color: white;
}

.toggle-btn.incorrect {
  background: #ffebee;
  color: #c62828;
}

.toggle-btn.incorrect:hover {
  background: #ffcdd2;
}

.toggle-btn.incorrect.active {
  background: #f44336;
  color: white;
}

.toggle-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.error {
  text-align: center;
  padding: 40px;
  color: #f44336;
}

.retry-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

@media (max-width: 768px) {
  .student-answer-details {
    padding: 10px;
  }

  .header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .student-info {
    text-align: left;
  }

  .score-section {
    grid-template-columns: 1fr;
  }

  .answer-section {
    padding: 15px;
  }

  .correctness-toggle {
    width: 100%;
  }

  .toggle-btn {
    flex: 1;
    justify-content: center;
  }
}
</style> 