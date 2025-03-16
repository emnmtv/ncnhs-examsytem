<template>
  <div class="create-survey-container">
    <div class="header-container">
      <div class="header-content">
        <h1>Create New Survey<span class="material-icons">poll</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Design your survey with various question types</p>
        </div>
      </div>
      <div class="header-background">CREATE</div>
    </div>

    <form @submit.prevent="handleSubmit" class="survey-form">
      <!-- Survey Details Card -->
      <div class="card details-card">
        <div class="card-header">
          <h2><i class="fas fa-info-circle"></i> Survey Details</h2>
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
          <h2><i class="fas fa-question-circle"></i> Questions</h2>
          <span class="question-count badge">{{ questions.length }} questions</span>
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
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-y: hidden;
  overflow-x: hidden;
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
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  padding-left: 1%;
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

.survey-form {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.card {
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 20px;
  border-bottom: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

/* Add texture layer to card headers */
.card-header::before {
  content: '';
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

.card-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.card-header .question-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  position: relative;
  z-index: 1;
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
  background-color: white;
  border: none;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 1.5rem;
}

.question-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.question-header {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: none;
  color: white;
  position: relative;
  overflow: hidden;
}

/* Add texture layer to question headers */
.question-header::before {
  content: '';
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

.question-number {
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.question-actions {
  display: flex;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.question-actions button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.question-actions button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.question-content {
  padding: 1.5rem;
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
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.type-button.active {
  border-color: #4CAF50;
  background: #4CAF50;
  color: white;
}

.options-section {
  background: #f9f9f9;
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
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
  transform: translateY(-2px);
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 20px;
  background-color: #f5f5f5;
  border: 2px dashed #ccc;
  border-radius: 16px;
  color: #666;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.add-question-button:hover {
  background-color: #e0e0e0;
  border-color: #999;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.reset-button,
.publish-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-button {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.reset-button:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.publish-button {
  background-color: #4CAF50;
  color: white;
}

.publish-button:hover:not(:disabled) {
  background-color: #43A047;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.publish-button:disabled {
  background-color: #9E9E9E;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-state .material-icons-round {
  font-size: 3rem;
  color: #bdbdbd;
  margin-bottom: 1rem;
}

.empty-subtext {
  color: #757575;
  margin-top: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background-color: #e8f5e9;
  color: #2E7D32;
}

/* Transitions */
.question-transition-enter-active,
.question-transition-leave-active {
  transition: all 0.4s ease;
}

.question-transition-enter-from,
.question-transition-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

@media (max-width: 768px) {
  .create-survey-container {
    padding: 10px;
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
  
  .type-buttons {
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 15px;
    padding: 15px;
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