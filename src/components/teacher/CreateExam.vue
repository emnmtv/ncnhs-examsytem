<template>
  <div class="create-exam-container">
    <div class="create-exam-header">
      <h1>{{ isEditing ? 'Edit Exam' : 'Create New Exam' }}</h1>
      <p class="subtitle">Design your exam with various question types</p>
    </div>

    <form @submit.prevent="handleSubmit" class="exam-form">
      <!-- Exam Details Card -->
      <div class="card exam-details-card">
        <div class="card-header">
          <h2><i class="fas fa-info-circle"></i> Exam Details</h2>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label for="testCode">Test Code</label>
              <input 
                v-model="examData.testCode" 
                type="text" 
                id="testCode" 
                placeholder="e.g., MATH101" 
                required 
              />
              <small>Unique code students will use to access this exam</small>
            </div>
            
            <div class="form-group">
              <label for="classCode">Class Code</label>
              <input 
                v-model="examData.classCode" 
                type="text" 
                id="classCode" 
                placeholder="e.g., 10A-MATH" 
                required 
              />
              <small>Identifier for the class taking this exam</small>
            </div>
          </div>
          
          <div class="form-group full-width">
            <label for="examTitle">Exam Title</label>
            <input 
              v-model="examData.title" 
              type="text" 
              id="examTitle" 
              placeholder="e.g., Midterm Examination in Mathematics" 
              required 
            />
            <small>Descriptive title that appears on the exam</small>
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
          <!-- Empty state when no questions exist -->
          <div v-if="questions.length === 0" class="no-questions">
            <div class="empty-state">
              <div class="empty-icon">
                <i class="fas fa-clipboard-list"></i>
              </div>
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
                <h3>Question {{ index + 1 }}</h3>
                <div class="question-actions">
                  <button 
                    type="button" 
                    class="icon-button duplicate-btn" 
                    @click="duplicateQuestion(index)" 
                    title="Duplicate this question"
                  >
                    <i class="fas fa-copy"></i>
                  </button>
                  <button 
                    type="button" 
                    class="icon-button delete-btn" 
                    @click="confirmRemoveQuestion(index)" 
                    title="Remove this question"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              
              <div class="question-content">
                <div class="form-group">
                  <label>Question Text</label>
                  <textarea 
                    v-model="question.text" 
                    placeholder="Enter your question here..." 
                    rows="2"
                    required
                  ></textarea>
                </div>
                
                <div class="form-row">
                  <div class="form-group question-type-selector">
                    <label>Question Type</label>
                    <div class="type-selector">
                      <button 
                        type="button" 
                        class="type-button" 
                        :class="{ active: question.type === 'multipleChoice' }"
                        @click="setQuestionType(question, 'multipleChoice')"
                      >
                        <i class="fas fa-list-ul"></i> Multiple Choice
                      </button>
                      <button 
                        type="button" 
                        class="type-button" 
                        :class="{ active: question.type === 'true_false' }"
                        @click="setQuestionType(question, 'true_false')"
                      >
                        <i class="fas fa-toggle-on"></i> True/False
                      </button>
                      <button 
                        type="button" 
                        class="type-button" 
                        :class="{ active: question.type === 'enumeration' }"
                        @click="setQuestionType(question, 'enumeration')"
                      >
                        <i class="fas fa-font"></i> Short Answer
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Multiple Choice Options -->
                <div v-if="question.type === 'multipleChoice'" class="options-section">
                  <div class="options-header">
                    <h4>Answer Options</h4>
                    <button 
                      type="button" 
                      class="add-option-button"
                      @click="addOption(question)"
                    >
                      <i class="fas fa-plus"></i> Add Option
                    </button>
                  </div>
                  
                  <transition-group name="option-transition" tag="div" class="options-list">
                    <div 
                      v-for="(option, optIndex) in question.options" 
                      :key="optIndex" 
                      class="option-item"
                      :class="{ 'correct-answer': option === question.correctAnswer }"
                    >
                      <div class="option-radio">
                        <input 
                          type="radio" 
                          :name="`question-${index}-correct`" 
                          :id="`question-${index}-option-${optIndex}`"
                          :value="option" 
                          v-model="question.correctAnswer"
                        />
                        <label :for="`question-${index}-option-${optIndex}`">
                          Correct
                        </label>
                      </div>
                      
                      <div class="option-input">
                        <input 
                          v-model="question.options[optIndex]"
                          type="text" 
                          :placeholder="`Option ${optIndex + 1}`"
                          required
                        />
                      </div>
                      
                      <button 
                        type="button" 
                        class="remove-option-button"
                        @click="removeOption(question, optIndex)"
                        title="Remove this option"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </transition-group>
                </div>
                
                <!-- True/False Options -->
                <div v-if="question.type === 'true_false'" class="true-false-section">
                  <h4>Correct Answer</h4>
                  <div class="true-false-options">
                    <div class="true-false-option">
                      <input 
                        type="radio" 
                        :id="`question-${index}-true`" 
                        value="true" 
                        v-model="question.correctAnswer"
                      />
                      <label :for="`question-${index}-true`">True</label>
                    </div>
                    <div class="true-false-option">
                      <input 
                        type="radio" 
                        :id="`question-${index}-false`" 
                        value="false" 
                        v-model="question.correctAnswer"
                      />
                      <label :for="`question-${index}-false`">False</label>
                    </div>
                  </div>
                </div>
                
                <!-- Short Answer/Enumeration -->
                <div v-if="question.type === 'enumeration'" class="short-answer-section">
                  <div class="form-group">
                    <label>Correct Answer</label>
                    <input 
                      v-model="question.correctAnswer" 
                      type="text" 
                      placeholder="Enter the correct answer" 
                      required 
                    />
                    <small>Case-insensitive, exact match required for grading</small>
                  </div>
                </div>
              </div>
            </div>
          </transition-group>
          
          <button 
            type="button" 
            class="add-question-button"
            @click="addQuestion"
          >
            <i class="fas fa-plus-circle"></i> Add New Question
          </button>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <div class="action-buttons">
          <button 
            type="button" 
            class="reset-button" 
            @click="resetForm"
          >
            <i class="fas fa-undo"></i> Reset
          </button>
          
          <button 
            type="button" 
            class="draft-button" 
            @click="saveAsDraft"
          >
            <i class="fas fa-save"></i> Save as Draft
          </button>
          
          <button 
            type="submit" 
            class="publish-button"
            :disabled="!questions.length"
          >
            <i class="fas fa-paper-plane"></i> 
            {{ isEditing ? 'Update' : 'Publish' }} Exam
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createExam, fetchTeacherExams, updateExam } from '../../services/authService';
import Swal from 'sweetalert2';

export default {
  name: 'CreateExam',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const isEditing = ref(false);
    const examData = ref({
      testCode: '',
      classCode: '',
      title: '',
      isDraft: false,
      userId: localStorage.getItem('userId')
    });
    const questions = ref([]);

    // Load exam data if editing
    onMounted(async () => {
      const examId = route.query.examId;
      if (examId) {
        isEditing.value = true;
        try {
          const exams = await fetchTeacherExams();
          const exam = exams.find(e => e.id === parseInt(examId));
          if (exam) {
            examData.value = {
              testCode: exam.testCode,
              classCode: exam.classCode,
              title: exam.examTitle,
              isDraft: exam.isDraft,
              userId: exam.userId
            };
            questions.value = exam.questions.map(q => ({
              text: q.questionText,
              type: q.questionType,
              options: Array.isArray(q.options) ? q.options : [],
              correctAnswer: q.correctAnswer
            }));
          }
        } catch (error) {
          console.error('Error loading exam:', error);
          Swal.fire('Error', 'Failed to load exam data', 'error');
        }
      }
    });

    const handleSubmit = async () => {
      await submitExam(false);
    };

    const saveAsDraft = async () => {
      await submitExam(true);
    };

    const isFormValid = computed(() => {
      if (!examData.value.testCode || !examData.value.classCode || !examData.value.title) {
        return false;
      }
      
      if (questions.value.length === 0) {
        return false;
      }
      
      // Check if all questions have text and correct answers
      return questions.value.every(q => 
        q.text && 
        q.correctAnswer && 
        (q.type !== 'multipleChoice' || (q.options && q.options.length >= 2))
      );
    });

    const addQuestion = () => {
      questions.value.push({
        text: '',
        type: 'multipleChoice',
        options: [
          'Option 1',
          'Option 2'
        ],
        correctAnswer: ''
      });
      
      // Scroll to the newly added question after a short delay
      setTimeout(() => {
        const lastQuestion = document.querySelector('.questions-list .question-item:last-child');
        if (lastQuestion) {
          lastQuestion.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    };
    
    const duplicateQuestion = (index) => {
      const original = questions.value[index];
      
      // Create a deep copy of the question
      const duplicate = JSON.parse(JSON.stringify(original));
      
      // Optionally modify the copy (e.g., add "Copy" to the question text)
      duplicate.text = `${original.text} (Copy)`;
      
      // Insert the copy after the original
      questions.value.splice(index + 1, 0, duplicate);
      
      // Show feedback
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      
      Toast.fire({
        icon: 'success',
        title: 'Question duplicated'
      });
    };

    const confirmRemoveQuestion = (index) => {
      Swal.fire({
        title: 'Remove Question?',
        text: "This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f44336',
        cancelButtonColor: '#9e9e9e',
        confirmButtonText: 'Yes, remove it',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          removeQuestion(index);
        }
      });
    };

    const removeQuestion = (index) => {
      questions.value.splice(index, 1);
    };

    const addOption = (question) => {
      question.options.push('');
    };

    const removeOption = (question, index) => {
      // Don't allow removing if there are only 2 options left
      if (question.options.length <= 2) {
        Swal.fire({
          title: 'Cannot Remove',
          text: 'Multiple choice questions must have at least two options.',
          icon: 'info',
          confirmButtonColor: '#4CAF50'
        });
        return;
      }
      
      // If we're removing the option that was set as correct, reset correctAnswer
      if (question.options[index] === question.correctAnswer) {
        question.correctAnswer = '';
      }
      
      question.options.splice(index, 1);
    };

    const setQuestionType = (question, type) => {
      if (question.type === type) return;
      
      question.type = type;
      question.correctAnswer = '';
      
      // Initialize options based on type
      if (type === 'multipleChoice') {
        question.options = ['Option 1', 'Option 2'];
      } else if (type === 'true_false') {
        question.correctAnswer = 'True';
      } else {
        question.options = [];
      }
    };
    
    const resetForm = () => {
      examData.value = {
        testCode: '',
        classCode: '',
        title: '',
        isDraft: false,
        userId: localStorage.getItem('userId')
      };
      questions.value = [];
    };

    const submitExam = async (isDraft) => {
      try {
        if (!questions.value.length) {
          Swal.fire('Error', 'Please add at least one question', 'error');
          return;
        }

        // Validate test code format (optional)
        const testCodeRegex = /^[A-Za-z0-9-_]+$/;
        if (!testCodeRegex.test(examData.value.testCode)) {
          await Swal.fire({
            icon: 'error',
            title: 'Invalid Test Code',
            text: 'Test code can only contain letters, numbers, hyphens, and underscores.',
            confirmButtonColor: '#3085d6'
          });
          return;
        }

        const examPayload = {
          testCode: examData.value.testCode,
          classCode: examData.value.classCode,
          examTitle: examData.value.title,
          isDraft: isDraft,
          status: isDraft ? 'draft' : 'pending',
          questions: questions.value.map(q => ({
            questionText: q.text,
            questionType: q.type,
            options: q.type === 'multipleChoice' ? q.options : 
                     q.type === 'true_false' ? ['true', 'false'] : [],
            correctAnswer: q.correctAnswer
          })),
          userId: examData.value.userId
        };

        if (isEditing.value) {
          await updateExam(route.query.examId, examPayload);
        } else {
          await createExam(examPayload);
        }
        
        await Swal.fire(
          'Success!',
          isDraft ? 'Exam saved as draft.' : 'Exam has been published.',
          'success'
        );

        router.push('/manage-exams');
      } catch (error) {
        console.error('Error creating/updating exam:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message === 'Test code already exists. Please choose a different one.' 
            ? 'This test code is already in use. Please choose a different one.'
            : (error.message || 'Failed to save exam'),
          confirmButtonColor: '#3085d6',
          showCancelButton: false
        });
        
        // Focus on test code input if it's a duplicate error
        if (error.message === 'Test code already exists. Please choose a different one.') {
          document.getElementById('testCode')?.focus();
        }
      }
    };

    return {
      examData,
      questions,
      isEditing,
      isFormValid,
      addQuestion,
      removeQuestion,
      duplicateQuestion,
      confirmRemoveQuestion,
      addOption,
      removeOption,
      setQuestionType,
      handleSubmit,
      saveAsDraft,
      resetForm
    };
  }
};
</script>

<style scoped>
.create-exam-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.create-exam-header {
  text-align: center;
  margin-bottom: 30px;
}

h1 {
  color: #333;
  margin-bottom: 10px;
  font-size: 2rem;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
}

.exam-form {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.card-header {
  background-color: #f5f5f5;
  padding: 15px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-body {
  padding: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  flex: 1;
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.full-width {
  width: 100%;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #444;
}

input[type="text"],
textarea {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-sizing: border-box;
}

input[type="text"]:focus,
textarea:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  outline: none;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

small {
  display: block;
  margin-top: 5px;
  color: #757575;
  font-size: 0.85rem;
}

/* Questions Styling */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.question-item {
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.question-item:hover {
  border-color: #bdbdbd;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.question-header {
  background-color: #e8f5e9;
  padding: 12px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #c8e6c9;
}

.question-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #2E7D32;
}

.question-actions {
  display: flex;
  gap: 8px;
}

.icon-button {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.duplicate-btn {
  color: #1976D2;
}

.duplicate-btn:hover {
  background-color: rgba(25, 118, 210, 0.1);
}

.delete-btn {
  color: #f44336;
}

.delete-btn:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

.question-content {
  padding: 20px;
}

/* Question Type Selector */
.question-type-selector {
  margin-bottom: 20px;
}

.type-selector {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.type-button {
  flex: 1;
  padding: 10px 15px;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
  color: #555;
}

.type-button:hover {
  background-color: #e8e8e8;
}

.type-button.active {
  background-color: #e8f5e9;
  border-color: #4CAF50;
  color: #2E7D32;
}

/* Options Styling */
.options-section {
  margin-top: 20px;
  border-top: 1px dashed #e0e0e0;
  padding-top: 20px;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.options-header h4 {
  margin: 0;
  font-size: 1rem;
  color: #444;
}

.add-option-button {
  padding: 6px 12px;
  background-color: #e8f5e9;
  border: 1px solid #c8e6c9;
  border-radius: 4px;
  color: #2E7D32;
  cursor: pointer;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.add-option-button:hover {
  background-color: #c8e6c9;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: all 0.2s;
}

.option-item:hover {
  border-color: #bdbdbd;
}

.option-item.correct-answer {
  border-color: #4CAF50;
  background-color: #f1f8e9;
}

.option-radio {
  display: flex;
  align-items: center;
  gap: 6px;
}

.option-input {
  flex: 1;
}

.remove-option-button {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
  padding: 5px;
  font-size: 1rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.remove-option-button:hover {
  opacity: 1;
}

/* True/False Styling */
.true-false-section {
  margin-top: 20px;
  border-top: 1px dashed #e0e0e0;
  padding-top: 20px;
}

.true-false-section h4 {
  margin: 0 0 15px 0;
  font-size: 1rem;
  color: #444;
}

.true-false-options {
  display: flex;
  gap: 20px;
}

.true-false-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Short Answer Styling */
.short-answer-section {
  margin-top: 20px;
  border-top: 1px dashed #e0e0e0;
  padding-top: 20px;
}

/* Badge */
.badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background-color: #e8f5e9;
  color: #2E7D32;
}

/* Add Question Button */
.add-question-button {
  width: 100%;
  padding: 15px;
  background-color: #e8f5e9;
  border: 2px dashed #4CAF50;
  border-radius: 8px;
  color: #2E7D32;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1.1rem;
  transition: all 0.3s;
}

.add-question-button:hover {
  background-color: #c8e6c9;
  transform: translateY(-2px);
}

.add-question-button i {
  font-size: 1.2rem;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.reset-button {
  padding: 12px 20px;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  color: #666;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.reset-button:hover {
  background-color: #f5f5f5;
  border-color: #bdbdbd;
}

.draft-button {
  padding: 12px 20px;
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 6px;
  color: #1976d2;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.draft-button:hover {
  background-color: #bbdefb;
}

.publish-button {
  padding: 12px 25px;
  background-color: #4CAF50;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  font-size: 1rem;
}

.publish-button:hover:not(:disabled) {
  background-color: #43a047;
  transform: translateY(-2px);
}

.publish-button:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
  transform: none;
}

/* Transitions */
.question-transition-enter-active,
.question-transition-leave-active,
.option-transition-enter-active,
.option-transition-leave-active {
  transition: all 0.4s ease;
}

.question-transition-enter-from,
.option-transition-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.question-transition-leave-to,
.option-transition-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* Loading spinner */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .type-selector {
    flex-direction: column;
  }
  
  .form-actions {
    flex-direction: column-reverse;
    gap: 15px;
    padding: 15px;
  }
  
  .action-buttons {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }
  
  .reset-button,
  .draft-button,
  .publish-button {
    width: 100%;
    justify-content: center;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .question-count {
    align-self: flex-start;
  }
  
  .true-false-options {
    flex-direction: column;
    gap: 10px;
  }
}
</style>