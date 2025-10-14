<template>
  <div class="answer-survey-container">
    <div class="survey-header">
      <h1>Survey Response</h1>
      <p class="subtitle">Please provide your feedback</p>
    </div>

    <!-- Survey Code Input -->
    <div v-if="!survey" class="code-input-section">
      <div class="input-group">
        <div class="input-wrapper">
          <span class="material-icons-round input-icon">qr_code_2</span>
          <input 
            v-model="surveyCode" 
            type="text" 
            placeholder="Enter survey code" 
            class="code-input"
          />
        </div>
        <button 
          @click="loadSurvey" 
          class="load-btn"
          :disabled="!surveyCode.trim()"
        >
          <span class="material-icons-round">arrow_forward</span>
          Access Survey
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading survey...</p>
    </div>

    <!-- Survey Form -->
    <form v-else-if="survey" @submit.prevent="handleSubmit" class="survey-form">
      <div class="survey-info">
        <div class="title-section">
          <span class="material-icons-round">description</span>
          <h2>{{ survey.title }}</h2>
        </div>
        <p v-if="survey.description" class="description">{{ survey.description }}</p>
        <!-- Question Progress -->
        <div class="question-progress">
          <span class="material-icons-round">quiz</span>
          Page {{ currentPage + 1 }} of {{ totalPages }} 
          (Questions {{ startQuestion + 1 }}-{{ endQuestion }} of {{ survey.questions.length }})
        </div>
      </div>

      <div class="questions-container" :key="currentPage">
        <div 
          v-for="question in currentPageQuestions" 
          :key="question.id"
          class="question-card"
        >
          <div class="question-text">
            {{ question.questionText }}
            <span v-if="question.required" class="required-marker">*</span>
          </div>

          <!-- Multiple Choice Question -->
          <div 
            v-if="question.questionType === 'multiple_choice'" 
            class="multiple-choice"
          >
            <div 
              v-for="(option, index) in getOptions(question.options)" 
              :key="index"
              class="option"
              @click="selectOption(question.id, option.text)"
            >
              <div 
                class="radio-button"
                :class="{ selected: answers[question.id] === option.text }"
              ></div>
              <img v-if="option.imageUrl" :src="option.imageUrl" alt="option image" class="option-image" @click.stop="openFullscreenImage(option.imageUrl)" />
              <span class="option-text">{{ option.text }}</span>
            </div>
          </div>

          <!-- Checkbox Question -->
          <div 
            v-else-if="question.questionType === 'checkbox'" 
            class="checkbox-options"
          >
            <div 
              v-for="(option, index) in getOptions(question.options)" 
              :key="index"
              class="option"
              @click="toggleCheckboxOption(question.id, option.text)"
            >
              <div 
                class="checkbox"
                :class="{ selected: isOptionSelected(question.id, option.text) }"
              >
                <span v-if="isOptionSelected(question.id, option.text)" 
                  class="material-icons-round check-icon">check</span>
              </div>
              <img v-if="option.imageUrl" :src="option.imageUrl" alt="option image" class="option-image" @click.stop="openFullscreenImage(option.imageUrl)" />
              <span class="option-text">{{ option.text }}</span>
            </div>
          </div>

          <!-- Text Answer Question -->
          <div v-else-if="question.questionType === 'text'" class="text-answer">
            <textarea 
              v-model="answers[question.id]"
              :placeholder="question.required ? 'Required' : 'Optional'"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="navigation-controls">
        <button 
          type="button"
          class="nav-btn back-btn"
          :disabled="currentPage === 0"
          @click="previousPage"
        >
          <span class="material-icons-round">arrow_back</span>
          Previous Page
        </button>

        <button 
          v-if="isLastPage"
          type="submit" 
          class="submit-btn"
          :disabled="!isPageValid"
        >
          <span class="material-icons-round">send</span>
          Submit
        </button>
        <button 
          v-else
          type="button"
          class="nav-btn next-btn"
          :disabled="!isPageValid"
          @click="nextPage"
        >
          Next Page
          <span class="material-icons-round">arrow_forward</span>
        </button>
      </div>

      <!-- Respondent Info (Optional) -->
      <div v-if="isLastPage" class="respondent-info">
        <div class="info-header">
          <span class="material-icons-round">person_outline</span>
          <h3>Your Information (Optional)</h3>
        </div>
        <div class="input-wrapper">
          <span class="material-icons-round input-icon">badge</span>
          <input 
            v-model="respondentName"
            type="text"
            placeholder="Your name (optional)"
            class="respondent-input"
          />
        </div>
      </div>
    </form>

    <!-- Thank You Message -->
    <div v-if="submitted" class="thank-you">
      <div class="thank-you-content">
        <span class="material-icons-round">check_circle</span>
        <h2>Thank You!</h2>
        <p>Your response has been recorded.</p>
        <button @click="resetForm" class="new-response-btn">
          Submit Another Response
        </button>
      </div>
    </div>
    <!-- Fullscreen image modal -->
    <div v-if="fullscreenImage" class="fullscreen-image-modal" @click="closeFullscreenImage">
      <div class="fullscreen-image-container" @click.stop>
        <img :src="fullscreenImage" alt="Fullscreen option image" />
        <button class="close-fullscreen-btn" @click="closeFullscreenImage">
          <span class="material-icons-round">close</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchSurvey, submitSurveyResponse } from '@/services/authService';
import Swal from 'sweetalert2';

export default {
  name: 'AnswerSurvey',
  
  setup() {
    const route = useRoute();
    const surveyCode = ref('');
    const survey = ref(null);
    const loading = ref(false);
    const answers = ref({});
    const respondentName = ref('');
    const submitted = ref(false);
    const currentPage = ref(0);
    const QUESTIONS_PER_PAGE = 5;
    const fullscreenImage = ref(null);

    const totalPages = computed(() => {
      if (!survey.value?.questions) return 0;
      return Math.ceil(survey.value.questions.length / QUESTIONS_PER_PAGE);
    });

    const startQuestion = computed(() => currentPage.value * QUESTIONS_PER_PAGE);

    const endQuestion = computed(() => {
      if (!survey.value?.questions) return 0;
      return Math.min(
        (currentPage.value + 1) * QUESTIONS_PER_PAGE,
        survey.value.questions.length
      );
    });

    const currentPageQuestions = computed(() => {
      if (!survey.value?.questions) return [];
      return survey.value.questions.slice(startQuestion.value, endQuestion.value);
    });

    const isLastPage = computed(() => {
      return currentPage.value === totalPages.value - 1;
    });

    const isPageValid = computed(() => {
      if (!currentPageQuestions.value) return false;
      return currentPageQuestions.value.every(question => {
        if (!question.required) return true;
        return !!answers.value[question.id];
      });
    });

    const currentQuestion = computed(() => {
      if (!survey.value?.questions) return null;
      return survey.value.questions[currentPage.value];
    });

    const isCurrentQuestionValid = computed(() => {
      if (!survey.value) return false;
      if (!currentQuestion.value) return true;
      if (!currentQuestion.value.required) return true;
      return !!answers.value[currentQuestion.value.id];
    });

    const loadSurvey = async () => {
      if (!surveyCode.value.trim()) return;

      try {
        loading.value = true;
        const response = await fetchSurvey(surveyCode.value);
        survey.value = response.survey;
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to load survey',
          icon: 'error'
        });
      } finally {
        loading.value = false;
      }
    };

    // Prefill survey code from route if available and auto-load
    onMounted(async () => {
      const codeFromRoute = route.params.code;
      if (typeof codeFromRoute === 'string' && codeFromRoute.trim().length > 0) {
        surveyCode.value = codeFromRoute;
        await loadSurvey();
      }
    });

    const selectOption = (questionId, optionText) => {
      answers.value[questionId] = optionText;
    };

    const toggleCheckboxOption = (questionId, optionText) => {
      // Initialize as array if not exists
      if (!answers.value[questionId]) {
        answers.value[questionId] = [];
      }
      
      // Ensure it's an array
      let currentAnswers = Array.isArray(answers.value[questionId])
        ? answers.value[questionId]
        : [];
      
      const index = currentAnswers.indexOf(optionText);
      if (index === -1) {
        // Add option if not selected
        currentAnswers.push(optionText);
      } else {
        // Remove option if already selected
        currentAnswers.splice(index, 1);
      }
      
      // Update the answers
      answers.value[questionId] = currentAnswers;
    };

    const isOptionSelected = (questionId, optionText) => {
      if (!answers.value[questionId]) return false;
      const currentAnswers = Array.isArray(answers.value[questionId]) 
        ? answers.value[questionId] 
        : [answers.value[questionId]];
      return currentAnswers.includes(optionText);
    };

    const getOptions = (options) => {
      if (!options) return [];
      let parsed = options;
      if (typeof options === 'string') {
        try { parsed = JSON.parse(options); } catch { parsed = []; }
      }
      if (!Array.isArray(parsed)) return [];
      return parsed.map(o => typeof o === 'string' ? { text: o, imageUrl: null } : { text: o.text, imageUrl: o.imageUrl });
    };

    const handleSubmit = async () => {
      try {
        if (!surveyCode.value) {
          throw new Error('Survey code is required');
        }

        const formattedAnswers = Object.entries(answers.value).map(([questionId, answer]) => ({
          questionId: parseInt(questionId),
          answer
        }));

        const response = await submitSurveyResponse(surveyCode.value, {
          respondent: respondentName.value,
          answers: formattedAnswers
        });

        Swal.fire({
          title: 'Success!',
          text: response.message || 'Your response has been recorded',
          icon: 'success'
        });

        submitted.value = true;
      } catch (error) {
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to submit response',
          icon: 'error'
        });
      }
    };

    const resetForm = () => {
      survey.value = null;
      answers.value = {};
      respondentName.value = '';
      surveyCode.value = '';
      submitted.value = false;
      currentPage.value = 0;
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value - 1) {
        currentPage.value++;
      }
    };

    const previousPage = () => {
      if (currentPage.value > 0) {
        currentPage.value--;
      }
    };

    const openFullscreenImage = (imageUrl) => {
      fullscreenImage.value = imageUrl;
      document.body.style.overflow = 'hidden';
    };

    const closeFullscreenImage = () => {
      fullscreenImage.value = null;
      document.body.style.overflow = '';
    };

    return {
      surveyCode,
      survey,
      loading,
      answers,
      respondentName,
      submitted,
      currentPage,
      totalPages,
      startQuestion,
      endQuestion,
      currentPageQuestions,
      isLastPage,
      isPageValid,
      currentQuestion,
      isCurrentQuestionValid,
      loadSurvey,
      selectOption,
      toggleCheckboxOption,
      isOptionSelected,
      getOptions,
      handleSubmit,
      resetForm,
      nextPage,
      previousPage,
      fullscreenImage,
      openFullscreenImage,
      closeFullscreenImage,
    };
  }
};
</script>

<style scoped>
.answer-survey-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.survey-header {
  text-align: center;
  margin-bottom: 2rem;
}

.survey-header h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
}

.code-input-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.input-group {
  display: flex;
  gap: 1rem;
}

.input-wrapper {
  position: relative;
  flex: 1;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #757575;
  font-size: 20px;
}

.code-input {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  text-transform: uppercase;
}

.code-input:focus {
  border-color: #4CAF50;
  outline: none;
}

.load-btn {
  padding: 0 1.5rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.load-btn:hover:not(:disabled) {
  background: #43A047;
}

.load-btn:disabled {
  background: #9E9E9E;
  cursor: not-allowed;
}

.survey-form {
  background: white;
  padding: 1.25rem;
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.06);
}

.survey-info {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.survey-info h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.description {
  color: #666;
}

.questions-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.question-card {
  background: transparent;
  padding: 0.5rem 0;
  border-radius: 0;
  border: none;
}

.question-text {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1rem;
}

.required-marker {
  color: #f44336;
  margin-left: 4px;
}

.multiple-choice {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option {
  display: grid;
  grid-template-columns: 28px 64px 1fr;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e6e8eb;
  box-shadow: 0 2px 8px rgba(0,0,0,0.035);
  cursor: pointer;
  transition: background 0.15s ease, box-shadow 0.2s ease, border-color 0.15s ease;
  min-height: 64px;
}

.option:hover {
  background: #f8fafc;
  border-color: #dbe1e8;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.option-image {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
}

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

.radio-button {
  width: 22px;
  height: 22px;
  border: 2px solid #b0b7c3;
  border-radius: 50%;
  position: relative;
}

.radio-button.selected::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  background: #4CAF50;
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.text-answer textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  resize: vertical;
  min-height: 100px;
}

.text-answer textarea:focus {
  border-color: #4CAF50;
  outline: none;
}

.respondent-info {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.respondent-info h3 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1rem;
}

.respondent-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-btn:not(:disabled):hover {
  background: #43A047;
  transform: translateY(-2px);
}

.thank-you {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.thank-you-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.thank-you-content i {
  font-size: 3rem;
  color: #4CAF50;
  margin-bottom: 1rem;
}

.thank-you-content h2 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.new-response-btn {
  margin-top: 1.5rem;
  padding: 12px 24px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.new-response-btn:hover {
  background: #1976D2;
}

@media (max-width: 768px) {
  .input-group {
    flex-direction: column;
  }

  .code-input-section {
    padding: 1.5rem;
    background: transparent;
    box-shadow: none;
  }

  .survey-form {
    padding: 0;
    border-radius: 0;
    box-shadow: none;
    background: transparent;
  }

  .question-card {
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
  }

  .answer-survey-container {
    padding: 0;
    max-width: 100%;
    width: 100%;
  }

  .survey-header h1 {
    font-size: 1.4rem;
  }

  .survey-header {
    margin-bottom: 0;
  }

  .description {
    font-size: 0.9rem;
  }

  .question-text {
    font-size: 1rem;
  }

  .navigation-controls {
    flex-direction: column;
  }

  .nav-btn,
  .submit-btn {
    width: 100%;
    justify-content: center;
  }

  .option-image {
    width: 100%;
    height: auto;
    max-height: none;
    border-radius: 0;
  }

  /* Make options full-width with stacked image and smaller caption */
  .option {
    flex-direction: row;
    align-items: center;
    gap: 0.6rem;
    padding: 8px 0;
    background: transparent;
    border-radius: 0;
  }

  .option-image {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .option-text {
    font-size: 0.95rem;
    line-height: 1.25rem;
    word-break: break-word;
  }

  .questions-container {
    gap: 4px;
  }
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Update icon styles */
.material-icons-round {
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Adjust button styles to align icons */
button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.checkbox-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #bdbdbd;
  border-radius: 4px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox.selected {
  border-color: #4CAF50;
  background: #4CAF50;
}

.check-icon {
  font-size: 16px !important;
  color: white;
}

.option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.option:hover {
  background: #f5f5f5;
}

.question-progress {
  text-align: center;
  color: #666;
  margin: 0.5rem 0 1rem;
  font-size: 0.9rem;
}

.navigation-controls {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  gap: 1rem;
}

.nav-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.back-btn {
  background: #f5f5f5;
  color: #666;
}

.next-btn {
  background: #2196F3;
  color: white;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.nav-btn:not(:disabled):hover {
  transform: translateY(-2px);
}

.back-btn:not(:disabled):hover {
  background: #e0e0e0;
}

.next-btn:not(:disabled):hover {
  background: #1976D2;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.code-input,
.respondent-input {
  padding-left: 40px !important;
}

.title-section .material-icons-round {
  font-size: 28px;
  color: #2196F3;
}

.info-header .material-icons-round {
  color: #757575;
}

.question-progress {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.question-progress .material-icons-round {
  color: #2196F3;
  font-size: 20px;
}

@media (max-width: 768px) {
  .title-section {
    justify-content: center;
  }

  .question-progress {
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style> 