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
  font-family: 'Inter', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #e8f5e9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #159750;
  font-weight: 600;
}

.back-button:hover {
  background: #c8e6c9;
  transform: translateX(-5px);
}

.back-button .material-icons {
  font-size: 20px;
}

.student-info {
  text-align: right;
}

.student-info h2 {
  margin: 0;
  color: #159750;
  font-size: 1.8rem;
  font-weight: 700;
}

.sub-info {
  color: #666;
  margin-top: 5px;
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 0.9rem;
}

.exam-info {
  background: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  margin-bottom: 20px;
  border-left: 5px solid #159750;
}

.exam-info h3 {
  margin: 0;
  color: #159750;
  font-size: 1.5rem;
  font-weight: 700;
}

.test-code {
  color: #666;
  margin: 8px 0 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.current-score, .manual-score {
  background: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.current-score h4, .manual-score h4 {
  color: #159750;
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-top: 15px;
}

.score-value {
  font-size: 3em;
  font-weight: 700;
  color: #159750;
}

.score-total {
  font-size: 1.8em;
  color: #666;
}

.score-percentage {
  color: #159750;
  margin-left: 10px;
  font-weight: 600;
  font-size: 1.2em;
}

.score-input {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.score-input input {
  width: 100px;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1.1em;
  transition: all 0.3s ease;
  text-align: center;
  font-weight: 600;
}

.score-input input:focus {
  border-color: #159750;
  box-shadow: 0 0 0 3px rgba(21, 151, 80, 0.1);
  outline: none;
}

.score-input button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #159750 0%, #0d6b38 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
}

.score-input button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(21, 151, 80, 0.2);
}

.score-input button:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  overflow: hidden;
  border-left: 5px solid transparent;
  transition: all 0.3s ease;
}

.answer-item[data-correct="true"] {
  border-left-color: #159750;
  background: linear-gradient(to right, rgba(21, 151, 80, 0.05), white);
}

.answer-item[data-correct="false"] {
  border-left-color: #dc2626;
  background: linear-gradient(to right, rgba(220, 38, 38, 0.05), white);
}

.question-section {
  padding: 25px;
  border-bottom: 1px solid #e2e8f0;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-number {
  font-weight: 700;
  color: #159750;
  font-size: 1.1rem;
}

.question-type {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 600;
}

.question-type.multiple-choice {
  background: #e8f5e9;
  color: #159750;
}

.question-type.true-false {
  background: #e3f2fd;
  color: #1976d2;
}

.question-type.short-answer {
  background: #f3e5f5;
  color: #7b1fa2;
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
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 0.95rem;
}

.toggle-btn.correct {
  background: #e8f5e9;
  color: #159750;
}

.toggle-btn.correct:hover {
  background: #c8e6c9;
}

.toggle-btn.correct.active {
  background: #159750;
  color: white;
}

.toggle-btn.incorrect {
  background: #ffebee;
  color: #dc2626;
}

.toggle-btn.incorrect:hover {
  background: #ffcdd2;
}

.toggle-btn.incorrect.active {
  background: #dc2626;
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
  font-size: 1.1rem;
}

.error {
  text-align: center;
  padding: 40px;
  color: #dc2626;
}

.retry-btn {
  margin-top: 15px;
  padding: 10px 24px;
  background: #159750;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #0d6b38;
  transform: translateY(-2px);
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