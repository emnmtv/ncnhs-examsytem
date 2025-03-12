<template>
  <div class="create-survey-container">
    <div class="survey-header">
      <h1>Create New Survey</h1>
      <p class="subtitle">Design your survey with various question types</p>
    </div>

    <form @submit.prevent="handleSubmit" class="survey-form">
      <!-- Survey Details Card -->
      <div class="card details-card">
        <div class="card-header">
          <h2><span class="material-icons-round">info</span> Survey Details</h2>
        </div>
        <div class="card-body">
          <div class="form-group full-width">
            <label for="surveyTitle">Survey Title *</label>
            <input 
              v-model="surveyData.title" 
              type="text" 
              id="surveyTitle" 
              required
              placeholder="Enter survey title"
            />
          </div>
          
          <div class="form-group full-width">
            <label for="description">Description</label>
            <textarea 
              v-model="surveyData.description" 
              id="description" 
              placeholder="Enter survey description"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Questions Section -->
      <div class="card questions-card">
        <div class="card-header">
          <h2><span class="material-icons-round">quiz</span> Questions</h2>
          <span class="question-count">{{ questions.length }} questions</span>
        </div>

        <div class="card-body">
          <div v-if="questions.length === 0" class="no-questions">
            <div class="empty-state">
              <span class="material-icons-round">assignment</span>
              <p>No questions added yet</p>
              <p class="empty-subtext">Click the button below to add your first question</p>
            </div>
          </div>

          <transition-group name="question-transition" tag="div" class="questions-list">
            <div 
              v-for="(question, index) in questions" 
              :key="index" 
              class="question-item"
            >
              <div class="question-header">
                <span class="question-number">Question {{ index + 1 }}</span>
                <div class="question-actions">
                  <button 
                    type="button" 
                    class="action-btn duplicate-btn" 
                    @click="duplicateQuestion(index)"
                    title="Duplicate question"
                  >
                    <span class="material-icons-round">content_copy</span>
                  </button>
                  <button 
                    type="button" 
                    class="action-btn remove-btn" 
                    @click="removeQuestion(index)"
                    title="Remove question"
                  >
                    <span class="material-icons-round">delete</span>
                  </button>
                </div>
              </div>

              <div class="question-content">
                <div class="form-group">
                  <label>Question Text *</label>
                  <textarea 
                    v-model="question.questionText" 
                    required 
                    placeholder="Enter your question here"
                  ></textarea>
                </div>

                <div class="question-type-selector">
                  <label>Question Type *</label>
                  <div class="type-buttons">
                    <button 
                      type="button"
                      class="type-button"
                      :class="{ active: question.questionType === 'multiple_choice' }"
                      @click="setQuestionType(question, 'multiple_choice')"
                    >
                      <span class="material-icons-round">radio_button_checked</span>
                      Multiple Choice
                    </button>
                    
                    <button 
                      type="button"
                      class="type-button"
                      :class="{ active: question.questionType === 'checkbox' }"
                      @click="setQuestionType(question, 'checkbox')"
                    >
                      <span class="material-icons-round">check_box</span>
                      Checkbox (Multiple Select)
                    </button>
                    
                    <button 
                      type="button"
                      class="type-button"
                      :class="{ active: question.questionType === 'text' }"
                      @click="setQuestionType(question, 'text')"
                    >
                      <span class="material-icons-round">text_fields</span>
                      Text Answer
                    </button>
                  </div>
                </div>

                <!-- Multiple Choice Options -->
                <div v-if="['multiple_choice', 'checkbox'].includes(question.questionType)" class="options-section">
                  <div class="options-header">
                    <h4>Answer Options</h4>
                    <button 
                      type="button" 
                      class="add-option-btn"
                      @click="addOption(question)"
                    >
                      <span class="material-icons-round">add</span>
                      Add Option
                    </button>
                  </div>
                  
                  <div class="options-list">
                    <div 
                      v-for="(option, optIndex) in question.options" 
                      :key="optIndex" 
                      class="option-item"
                    >
                      <input 
                        v-model="question.options[optIndex]"
                        type="text" 
                        :placeholder="`Option ${optIndex + 1}`"
                        required
                      />
                      <button 
                        type="button" 
                        class="remove-option-btn"
                        @click="removeOption(question, optIndex)"
                        :disabled="question.options.length <= 2"
                      >
                        <span class="material-icons-round">close</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div class="question-settings">
                  <label class="required-toggle">
                    <input 
                      type="checkbox" 
                      v-model="question.required"
                    >
                    Required question
                  </label>
                </div>
              </div>
            </div>
          </transition-group>

          <button 
            type="button" 
            class="add-question-button"
            @click="addQuestion"
          >
            <span class="material-icons-round">add</span>
            Add New Question
          </button>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button 
          type="button" 
          class="reset-button" 
          @click="resetForm"
        >
          <span class="material-icons-round">refresh</span>
          Reset
        </button>
        
        <button 
          type="submit" 
          class="publish-button"
          :disabled="!questions.length"
        >
          <span class="material-icons-round">send</span>
          Create Survey
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createSurvey } from '@/services/authService';
import Swal from 'sweetalert2';

export default {
  name: 'CreateSurvey',
  
  setup() {
    const router = useRouter();
    const surveyData = ref({
      title: '',
      description: ''
    });
    const questions = ref([]);
    const error = ref(null);

    const addQuestion = () => {
      questions.value.push({
        questionText: '',
        questionType: 'multiple_choice',
        options: ['', ''],
        required: true,
        order: questions.value.length
      });
    };

    const removeQuestion = (index) => {
      Swal.fire({
        title: 'Remove Question?',
        text: 'Are you sure you want to remove this question?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, remove it'
      }).then((result) => {
        if (result.isConfirmed) {
          questions.value.splice(index, 1);
          // Update order of remaining questions
          questions.value.forEach((q, i) => q.order = i);
        }
      });
    };

    const duplicateQuestion = (index) => {
      const original = questions.value[index];
      const duplicate = JSON.parse(JSON.stringify(original));
      duplicate.order = questions.value.length;
      questions.value.splice(index + 1, 0, duplicate);
    };

    const setQuestionType = (question, type) => {
      question.questionType = type;
      if (type === 'multiple_choice' || type === 'checkbox') {
        question.options = ['', ''];
      } else {
        delete question.options;
      }
    };

    const addOption = (question) => {
      if (!Array.isArray(question.options)) {
        question.options = [];
      }
      question.options.push('');
    };

    const removeOption = (question, optionIndex) => {
      question.options.splice(optionIndex, 1);
    };

    const handleSubmit = async () => {
      try {
        if (!questions.value.length) {
          throw new Error('Please add at least one question');
        }

        const response = await createSurvey({
          title: surveyData.value.title,
          description: surveyData.value.description,
          questions: questions.value.map(q => ({
            questionText: q.questionText,
            questionType: q.questionType,
            options: ['multiple_choice', 'checkbox'].includes(q.questionType) ? 
              JSON.stringify(q.options.filter(opt => opt.trim())) : null,
            required: q.required,
            order: q.order
          }))
        });

        Swal.fire({
          title: 'Success!',
          text: `Survey created successfully. Access code: ${response.survey.code}`,
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          router.push('/my-surveys');
        });
      } catch (err) {
        Swal.fire({
          title: 'Error',
          text: err.message || 'Failed to create survey',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    };

    const resetForm = () => {
      Swal.fire({
        title: 'Reset Form?',
        text: 'This will clear all questions and survey details',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, reset it'
      }).then((result) => {
        if (result.isConfirmed) {
          surveyData.value = {
            title: '',
            description: ''
          };
          questions.value = [];
        }
      });
    };

    return {
      surveyData,
      questions,
      error,
      addQuestion,
      removeQuestion,
      duplicateQuestion,
      setQuestionType,
      addOption,
      removeOption,
      handleSubmit,
      resetForm
    };
  }
};
</script>

<style scoped>
.create-survey-container {
  max-width: 900px;
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

.survey-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.card-header {
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  font-size: 1.25rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.card-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-weight: 500;
  color: #333;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.question-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-number {
  font-weight: 600;
  color: #333;
}

.question-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.duplicate-btn {
  color: #2196F3;
}

.duplicate-btn:hover {
  background: rgba(33, 150, 243, 0.1);
}

.remove-btn {
  color: #f44336;
}

.remove-btn:hover {
  background: rgba(244, 67, 54, 0.1);
}

.question-type-selector {
  margin: 1.5rem 0;
}

.type-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.type-button {
  flex: 1;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.type-button:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.type-button.active {
  border-color: #4CAF50;
  background: #4CAF50;
  color: white;
}

.options-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1rem;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.options-header h4 {
  margin: 0;
  color: #333;
}

.add-option-btn {
  padding: 8px 16px;
  background: #e8f5e9;
  color: #4CAF50;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.add-option-btn:hover {
  background: #c8e6c9;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.option-item input {
  flex: 1;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
}

.remove-option-btn {
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: #ffebee;
  color: #f44336;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-option-btn:hover:not(:disabled) {
  background: #ffcdd2;
}

.remove-option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.question-settings {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.required-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.add-question-button {
  width: 100%;
  padding: 1rem;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  background: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.add-question-button:hover {
  border-color: #4CAF50;
  color: #4CAF50;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.reset-button,
.publish-button {
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

.reset-button {
  background: #f5f5f5;
  color: #666;
}

.reset-button:hover {
  background: #e0e0e0;
}

.publish-button {
  background: #4CAF50;
  color: white;
}

.publish-button:hover:not(:disabled) {
  background: #43A047;
  transform: translateY(-2px);
}

.publish-button:disabled {
  background: #9E9E9E;
  cursor: not-allowed;
  transform: none;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-state i {
  font-size: 3rem;
  color: #bdbdbd;
  margin-bottom: 1rem;
}

.empty-subtext {
  color: #757575;
  margin-top: 0.5rem;
}

.question-count {
  background: #e8f5e9;
  color: #4CAF50;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Transitions */
.question-transition-enter-active,
.question-transition-leave-active {
  transition: all 0.3s ease;
}

.question-transition-enter-from,
.question-transition-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 768px) {
  .type-buttons {
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column;
  }

  .reset-button,
  .publish-button {
    width: 100%;
    justify-content: center;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .question-count {
    align-self: flex-start;
  }
}
</style> 