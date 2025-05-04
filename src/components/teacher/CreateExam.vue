<template>
  <div class="create-exam-container">
    <div class="header-container">
      <div class="header-content">
        <h1>{{ isEditing ? 'Edit Exam' : 'Create New Exam' }}<span class="material-icons">assignment_add</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Design your exam with various question types</p>
        </div>
      </div>
      <div class="header-background">{{ isEditing ? 'EDIT' : 'CREATE' }}</div>
    </div>

    <!-- Add validation feedback -->
    <div v-if="error" class="error-message">
      {{ error }}
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
              <label for="testCode">Test Code *</label>
              <div class="input-with-button">
                <input 
                  v-model="examData.testCode" 
                  type="text" 
                  id="testCode" 
                  required
                  :class="{ 'error': error && !examData.testCode }"
                />
                <button 
                  type="button" 
                  class="generate-button"
                  @click="generateTestCode"
                  title="Generate random test code"
                >
                  <span class="material-icons">autorenew</span>
                </button>
              </div>
              <small v-if="error && !examData.testCode" class="error-text">
                Test code is required
              </small>
            </div>
            
            <div class="form-group">
              <label for="classCode">Class Code</label>
              <input 
                v-model="examData.classCode" 
                type="text" 
                id="classCode" 
                placeholder="e.g., 10A-MATH" 
                required 
                class="uppercase-input"
              />
              <small>Identifier for the class taking this exam (automatically uppercase)</small>
            </div>
          </div>
          
          <div class="form-group full-width">
            <label for="examTitle">Exam Title</label>
            <input 
              v-model="examData.title" 
              type="text" 
              id="examTitle" 
              placeholder="e.g., MIDTERM EXAMINATION IN MATHEMATICS" 
              required 
              class="uppercase-input"
            />
            <small>Descriptive title that appears on the exam (automatically uppercase)</small>
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
                    @click="confirmRemoveQuestion(index)"
                    title="Remove question"
                  >
                    <span class="material-icons-round">delete</span>
                  </button>
                </div>
              </div>
              
              <div class="question-content">
                <div class="form-group">
                  <label>Question Text</label>
                  <textarea 
                    v-model="question.text" 
                    required 
                    placeholder="Enter your question here"
                  ></textarea>
                </div>
                
                <!-- Add image upload section -->
                <div class="form-group image-upload-section">
                  <label>Question Image (Optional)</label>
                  <div class="image-upload-container">
                    <div v-if="question.imageUrl" class="image-preview">
                      <img :src="getImageUrl(question.imageUrl)" alt="Question image" />
                      <button 
                        type="button" 
                        class="remove-image-btn" 
                        @click="removeImage(question)"
                        title="Remove image"
                      >
                        <span class="material-icons-round">close</span>
                      </button>
                    </div>
                    <div v-else class="upload-placeholder">
                      <input 
                        type="file" 
                        :id="`question-${index}-image`" 
                        @change="(e) => handleImageUpload(e, question)"
                        accept="image/*"
                        class="file-input"
                      />
                      <label :for="`question-${index}-image`" class="upload-label">
                        <span class="material-icons-round">add_photo_alternate</span>
                        <span>Upload Image</span>
                      </label>
                    </div>
                  </div>
                  <small>Supported formats: JPG, PNG, GIF (max 5MB)</small>
                </div>
                
                <div class="question-type-selector">
                  <label>Question Type</label>
                  <div class="type-buttons">
                    <button 
                      type="button"
                      class="type-button"
                      :class="{ active: question.type === 'multipleChoice' }"
                      @click="setQuestionType(question, 'multipleChoice')"
                    >
                      <span class="material-icons-round">radio_button_checked</span>
                      Multiple Choice
                    </button>
                    
                    <button 
                      type="button"
                      class="type-button"
                      :class="{ active: question.type === 'true_false' }"
                      @click="setQuestionType(question, 'true_false')"
                    >
                      <span class="material-icons-round">rule</span>
                      True/False
                    </button>
                    
                    <button 
                      type="button"
                      class="type-button"
                      :class="{ active: question.type === 'enumeration' }"
                      @click="setQuestionType(question, 'enumeration')"
                    >
                      <span class="material-icons-round">format_list_numbered</span>
                      Enumeration
                    </button>
                  </div>
                </div>
                
                <!-- Multiple Choice Options -->
                <div v-if="question.type === 'multipleChoice'" class="options-section">
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
                        type="radio" 
                        :name="`question-${index}-correct`" 
                        :id="`question-${index}-option-${optIndex}`"
                        :value="option" 
                        v-model="question.correctAnswer"
                        :disabled="!option.trim()"
                      />
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
                        title="Remove option"
                        :disabled="question.options.length <= 2"
                      >
                        <span class="material-icons-round">close</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- True/False Options -->
                <div v-if="question.type === 'true_false'" class="true-false-section">
                  <div class="true-false-options">
                    <div class="true-false-option">
                      <input 
                        type="radio" 
                        :id="`question-${index}-true`" 
                        :name="`question-${index}-answer`"
                        value="true" 
                        v-model="question.correctAnswer"
                      />
                      <label :for="`question-${index}-true`">True</label>
                    </div>
                    <div class="true-false-option">
                      <input 
                        type="radio" 
                        :id="`question-${index}-false`" 
                        :name="`question-${index}-answer`"
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
                      class="uppercase-input"
                    />
                    <small>Case-insensitive, exact match required for grading (automatically uppercase)</small>
                  </div>
                </div>
              </div>
            </div>
          </transition-group>
          
          <div class="questions-actions">
            <button 
              type="button" 
              class="add-question-button"
              @click="addQuestion"
            >
              <span class="material-icons-round">add_circle</span>
              Add New Question
            </button>

            <button 
              type="button" 
              class="import-question-button"
              @click="showQuestionBankModal = true"
            >
              <span class="material-icons">library_books</span>
              Import from Bank
            </button>
          </div>
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
            <span class="material-icons-round">refresh</span>
            Reset
          </button>
          
          <button 
            type="button" 
            class="draft-button" 
            @click="saveAsDraft"
          >
            <span class="material-icons-round">save</span>
            Save as Draft
          </button>
          
          <button 
            type="submit" 
            class="publish-button"
            :disabled="!questions.length"
          >
            <span class="material-icons-round">publish</span>
            {{ isEditing ? 'Update' : 'Publish' }} Exam
          </button>
        </div>
      </div>
    </form>

    <!-- Replace Question Bank Modal with Side Panel -->
    <div 
      class="side-panel"
      :class="{ 'is-open': showQuestionBankModal }"
    >
      <div class="side-panel-header">
        <h2>
          <span class="material-icons">library_books</span>
          Question Bank
        </h2>
        <button class="close-btn" @click="closeQuestionBankModal">
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="side-panel-content">
        <!-- Filters -->
        <div class="filters-section">
          <div class="search-box">
            <input 
              v-model="bankSearchQuery" 
              type="text" 
              placeholder="Search questions..."
            >
            <span class="material-icons">search</span>
          </div>

          <div class="filter-group">
            <select v-model="selectedBankFolder">
              <option value="">All Folders</option>
              <option v-for="folder in bankFolders" :key="folder.id" :value="folder.id">
                {{ folder.name }}
              </option>
            </select>

            <select v-model="selectedBankSubject">
              <option value="">All Subjects</option>
              <option v-for="subject in bankSubjects" :key="subject" :value="subject">
                {{ subject }}
              </option>
            </select>

            <select v-model="selectedBankDifficulty">
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <!-- Questions List -->
        <div class="bank-questions-list">
          <div 
            v-for="question in filteredBankQuestions" 
            :key="question.id" 
            class="bank-question-card"
            :class="{ selected: selectedBankQuestions.includes(question.id) }"
            @click="toggleQuestionSelection(question)"
          >
            <div class="question-header">
              <span class="question-type">{{ formatQuestionType(question.questionType) }}</span>
              <span class="difficulty-badge" :class="question.difficulty">
                {{ question.difficulty }}
              </span>
            </div>

            <div class="question-content">
              <p class="question-text">{{ question.questionText }}</p>
              
              <div v-if="question.imageUrl" class="question-image">
                <img :src="getImageUrl(question.imageUrl)" alt="Question image">
              </div>

              <div class="question-meta">
                <span v-if="question.folder" class="folder">
                  <span class="material-icons">folder</span>
                  {{ question.folder.name }}
                </span>
                <span v-if="question.subject" class="subject">
                  <span class="material-icons">subject</span>
                  {{ question.subject }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="side-panel-footer">
        <div class="selection-info">
          {{ selectedBankQuestions.length }} questions selected
        </div>
        <button 
          class="import-btn" 
          @click="importSelectedQuestions"
          :disabled="selectedBankQuestions.length === 0"
        >
          <span class="material-icons">add_circle</span>
          Import Selected
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createExam, fetchTeacherExams, updateExam, uploadImage, getFullImageUrl, getQuestionBankItems } from '../../services/authService';
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
    const loading = ref(false);
    const error = ref(null);
    const showQuestionBankModal = ref(false);
    const bankQuestions = ref([]);
    const selectedBankQuestions = ref([]);
    const bankSearchQuery = ref('');
    const selectedBankFolder = ref('');
    const selectedBankSubject = ref('');
    const selectedBankDifficulty = ref('');
    const STORAGE_KEY = 'exam_creation_progress'; // Key for local storage

    // Add watchers to convert inputs to uppercase
    watch(() => examData.value.testCode, (newValue) => {
      if (newValue) {
        examData.value.testCode = newValue.toUpperCase();
      }
      saveProgressToLocalStorage();
    });

    watch(() => examData.value.classCode, (newValue) => {
      if (newValue) {
        examData.value.classCode = newValue.toUpperCase();
      }
      saveProgressToLocalStorage();
    });

    watch(() => examData.value.title, (newValue) => {
      if (newValue) {
        examData.value.title = newValue.toUpperCase();
      }
      saveProgressToLocalStorage();
    });

    // Watch for changes in questions array to save progress
    watch(questions, () => {
      saveProgressToLocalStorage();
    }, { deep: true });

    // Save exam creation progress to local storage
    const saveProgressToLocalStorage = () => {
      if (isEditing.value) return; // Don't save if editing an existing exam
      
      // Only save if there's meaningful data entered
      const hasExamData = examData.value.testCode || examData.value.classCode || examData.value.title;
      const hasQuestions = questions.value.length > 0;
      
      if (!hasExamData && !hasQuestions) return; // Don't save empty forms
      
      const progress = {
        examData: examData.value,
        questions: questions.value
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    };

    // Load exam progress from local storage
    const loadProgressFromLocalStorage = () => {
      const savedProgress = localStorage.getItem(STORAGE_KEY);
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress);
          examData.value = progress.examData;
          questions.value = progress.questions;
          return true;
        } catch (e) {
          console.error('Error parsing saved progress:', e);
        }
      }
      return false;
    };

    // Clear progress from local storage
    const clearLocalStorageProgress = () => {
      localStorage.removeItem(STORAGE_KEY);
    };

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
              correctAnswer: q.correctAnswer,
              imageUrl: q.imageUrl ? '/uploads/' + q.imageUrl.split('/').pop() : null // Fix image URL format
            }));
          }
        } catch (error) {
          console.error('Error loading exam:', error);
          Swal.fire('Error', 'Failed to load exam data', 'error');
        }
      } else {
        // Try to load saved progress if not editing
        const hasSavedProgress = loadProgressFromLocalStorage();
        if (hasSavedProgress) {
          Swal.fire({
            title: 'Saved Progress Found',
            text: 'Would you like to continue where you left off?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, continue',
            cancelButtonText: 'No, start fresh'
          }).then((result) => {
            if (!result.isConfirmed) {
              resetForm();
            }
          });
        }
      }
      loadBankQuestions();
    });

    // Handle image upload
    const handleImageUpload = async (event, question) => {
      const file = event.target.files[0];
      if (!file) return;
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Error', 'Image size should not exceed 5MB', 'error');
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        Swal.fire('Error', 'Only JPG, PNG, and GIF images are supported', 'error');
        return;
      }
      
      try {
        // Show loading indicator
        Swal.fire({
          title: 'Uploading...',
          text: 'Please wait while we upload your image',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Create an image element to resize the image
        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = async () => {
          try {
            // Create a canvas to resize the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Calculate new dimensions (max width/height of 800px)
            const MAX_SIZE = 800;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
              if (width > MAX_SIZE) {
                height = Math.round(height * (MAX_SIZE / width));
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width = Math.round(width * (MAX_SIZE / height));
                height = MAX_SIZE;
              }
            }
            
            // Resize the image
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);
            
            // Get the resized image as base64 with reduced quality
            const resizedImage = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
            
            // Use the service to upload the image
            const data = await uploadImage(resizedImage);
            // Store the image URL with /uploads/ prefix
            question.imageUrl = '/uploads/' + data.imageUrl.split('/').pop();
            Swal.close();
          } catch (error) {
            console.error('Image upload error:', error);
            Swal.fire('Error', 'Failed to upload image', 'error');
          }
        };
        
        img.onerror = () => {
          Swal.fire('Error', 'Failed to process image', 'error');
        };
      } catch (error) {
        console.error('Image upload error:', error);
        Swal.fire('Error', 'Failed to upload image', 'error');
      }
    };
    
    // Remove image from question
    const removeImage = (question) => {
      question.imageUrl = null;
    };

    const handleSubmit = async () => {
      await submitExam(false);
    };

    const saveAsDraft = async () => {
      await submitExam(true);
    };

    const submitExam = async (isDraft = false) => {
      try {
        loading.value = true;
        error.value = null;

        // Validate required fields
        if (!examData.value.testCode || !examData.value.classCode || !examData.value.title) {
          throw new Error('Please fill in all required fields');
        }

        // Validate questions
        if (!questions.value.length) {
          throw new Error('Please add at least one question');
        }

        // Format questions
        const formattedQuestions = questions.value.map(q => ({
          questionText: q.text,
          questionType: q.type,
          options: q.type === 'true_false' ? ['true', 'false'] : 
                   q.type === 'enumeration' ? [] : 
                   q.options,
          correctAnswer: q.correctAnswer,
          imageUrl: q.imageUrl // Include imageUrl in formatted questions
        }));

        if (isEditing.value) {
          await updateExam(route.query.examId, {
            testCode: examData.value.testCode,
            classCode: examData.value.classCode,
            examTitle: examData.value.title,
            questions: formattedQuestions,
            isDraft: isDraft,
            status: isDraft ? 'draft' : 'pending'
          });
        } else {
          await createExam(
            examData.value.testCode,
            examData.value.classCode,
            examData.value.title,
            formattedQuestions,
            localStorage.getItem('userId'),
            isDraft
          );
        }

        // Clear saved progress after successful submission
        clearLocalStorageProgress();

        // Show success message
        Swal.fire({
          title: 'Success!',
          text: `Exam ${isEditing.value ? 'updated' : 'created'} successfully`,
          icon: 'success',
          confirmButtonColor: '#4CAF50'
        });

        // Redirect to manage exams page
        router.push('/manage-exams');
      } catch (err) {
        console.error('Error creating/updating exam:', err);
        error.value = err.message;
        Swal.fire({
          title: 'Error',
          text: err.message || 'Failed to create/update exam',
          icon: 'error',
          confirmButtonColor: '#f44336'
        });
      } finally {
        loading.value = false;
      }
    };

    const validateExam = () => {
      if (!examData.value.testCode || !examData.value.classCode || !examData.value.title) {
        return false;
      }
      if (!questions.value.length) {
        return false;
      }
      return questions.value.every(validateQuestion);
    };

    const validateQuestion = (question) => {
      if (!question.text || !question.type || !question.correctAnswer) {
        return false;
      }
      if (question.type === 'multipleChoice' && (!question.options || question.options.length < 2)) {
        return false;
      }
      return true;
    };

    const isFormValid = computed(() => {
      return validateExam();
    });

    const handleQuestionTypeChange = (question) => {
      if (!question) return;

      // Only reset options if the type has actually changed
      if (question.type === 'true_false') {
        question.options = ['true', 'false'];
        question.correctAnswer = '';
      } else if (question.type === 'enumeration') {
        question.options = [];
        question.correctAnswer = '';
      } else if (question.type === 'multipleChoice' && 
                 (!Array.isArray(question.options) || question.options.join(',') === 'true,false')) {
        // Only reset multiple choice options if coming from true/false or if options are invalid
        question.options = ['', '', '', ''];
        question.correctAnswer = '';
      }
    };

    const addQuestion = () => {
      const newQuestion = {
        text: '',
        type: 'multipleChoice',
        options: ['', '', '', ''], // Initialize with empty options
        correctAnswer: '',
        imageUrl: null // Initialize with no image
      };
      questions.value.push(newQuestion);
    };

    // Watch all questions to ensure enumeration answers are uppercase
    watch(questions, (newQuestions) => {
      newQuestions.forEach(question => {
        if (question.type === 'enumeration' && question.correctAnswer) {
          question.correctAnswer = question.correctAnswer.toUpperCase();
        }
      });
    }, { deep: true });

    const setQuestionType = (question, type) => {
      if (question.type === type) return;
      
      const oldType = question.type;
      question.type = type;
      
      // Only handle options reset if type actually changed
      if (oldType !== type) {
        handleQuestionTypeChange(question);
      }
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
        text: 'This action cannot be undone',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f44336',
        cancelButtonColor: '#9e9e9e',
        confirmButtonText: 'Yes, remove it'
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
      if (!Array.isArray(question.options)) {
        question.options = [];
      }
      question.options.push('');
    };

    const removeOption = (question, optionIndex) => {
      question.options.splice(optionIndex, 1);
      if (question.correctAnswer === question.options[optionIndex]) {
        question.correctAnswer = '';
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
      
      // Clear saved progress when form is reset
      clearLocalStorageProgress();
    };

    const getImageUrl = (imageUrl) => {
      return getFullImageUrl(imageUrl);
    };

    const loadBankQuestions = async () => {
      try {
        const response = await getQuestionBankItems();
        bankQuestions.value = response.questions;
      } catch (error) {
        console.error('Error loading bank questions:', error);
        Swal.fire('Error', 'Failed to load questions from bank', 'error');
      }
    };

    const bankFolders = computed(() => {
      // Create a map to store unique folders by ID
      const folderMap = new Map();
      
      // Process each question with a folder
      bankQuestions.value
        .filter(q => q.folder && q.folder.id)
        .forEach(q => {
          // Only add each folder once by using its ID as the map key
          if (!folderMap.has(q.folder.id)) {
            folderMap.set(q.folder.id, { 
              id: q.folder.id, 
              name: q.folder.name 
            });
          }
        });
      
      // Convert the map values to an array
      return Array.from(folderMap.values());
    });

    const bankSubjects = computed(() => {
      const subjects = new Set(bankQuestions.value
        .filter(q => q.subject)
        .map(q => q.subject));
      return Array.from(subjects);
    });

    const filteredBankQuestions = computed(() => {
      return bankQuestions.value.filter(q => {
        const matchesSearch = !bankSearchQuery.value || 
          q.questionText.toLowerCase().includes(bankSearchQuery.value.toLowerCase());
        
        const matchesFolder = !selectedBankFolder.value || 
          (q.folder && q.folder.id === selectedBankFolder.value);
        
        const matchesSubject = !selectedBankSubject.value || 
          q.subject === selectedBankSubject.value;
        
        const matchesDifficulty = !selectedBankDifficulty.value || 
          q.difficulty === selectedBankDifficulty.value;

        return matchesSearch && matchesFolder && matchesSubject && matchesDifficulty;
      });
    });

    const toggleQuestionSelection = (question) => {
      const index = selectedBankQuestions.value.indexOf(question.id);
      if (index === -1) {
        selectedBankQuestions.value.push(question.id);
      } else {
        selectedBankQuestions.value.splice(index, 1);
      }
    };

    const importSelectedQuestions = () => {
      const selectedQuestions = bankQuestions.value.filter(q => 
        selectedBankQuestions.value.includes(q.id)
      );

      // Add selected questions to the exam
      selectedQuestions.forEach(q => {
        questions.value.push({
          text: q.questionText,
          type: q.questionType,
          options: q.options,
          correctAnswer: q.correctAnswer,
          imageUrl: q.imageUrl
        });
      });

      closeQuestionBankModal();
      Swal.fire('Success', `${selectedQuestions.length} questions imported`, 'success');
    };

    const closeQuestionBankModal = () => {
      showQuestionBankModal.value = false;
      selectedBankQuestions.value = [];
      bankSearchQuery.value = '';
      selectedBankFolder.value = '';
      selectedBankSubject.value = '';
      selectedBankDifficulty.value = '';
    };

    const formatQuestionType = (type) => {
      const types = {
        multiple_choice: 'Multiple Choice',
        multipleChoice: 'Multiple Choice',
        true_false: 'True/False',
        enumeration: 'Enumeration'
      };
      return types[type] || type;
    };

    const generateTestCode = () => {
      // Generate a simple numeric code like Quizizz (6-8 digits)
      const codeLength = Math.floor(Math.random() * 3) + 6; // Random length between 6-8 digits
      let code = '';
      
      // First digit shouldn't be 0
      code += Math.floor(Math.random() * 9) + 1;
      
      // Generate the rest of the digits
      for (let i = 1; i < codeLength; i++) {
        code += Math.floor(Math.random() * 10);
      }
      
      examData.value.testCode = code;
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
      resetForm,
      handleQuestionTypeChange,
      handleImageUpload,
      removeImage,
      getImageUrl,
      showQuestionBankModal,
      bankQuestions,
      selectedBankQuestions,
      bankSearchQuery,
      selectedBankFolder,
      selectedBankSubject,
      selectedBankDifficulty,
      bankFolders,
      bankSubjects,
      filteredBankQuestions,
      toggleQuestionSelection,
      importSelectedQuestions,
      closeQuestionBankModal,
      formatQuestionType,
      saveProgressToLocalStorage,
      loadProgressFromLocalStorage,
      clearLocalStorageProgress,
      generateTestCode
    };
  }
};
</script>

<style scoped>
/* Update the container width */
.create-exam-container {
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-y: hidden;
  overflow-x: hidden;
}

/* Keep the form width constrained for better readability */
.exam-form {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* Fix the header background */
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
  right: 10%;
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

/* Update card styling to match other components */
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
  background-color: white;
  border: none;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
  padding: 20px;
}

/* Question Type Selector */
.question-type-selector {
  margin: 20px 0;
}

.type-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.type-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f5f5f5;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  color: #666;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-button:hover {
  background-color: #e8f5e9;
  border-color: #81c784;
  color: #2e7d32;
}

.type-button.active {
  background-color: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
}

.type-button .material-icons-round {
  font-size: 20px;
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

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.action-buttons {
  display: flex;
  gap: 15px;
}

.reset-button,
.draft-button,
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

.draft-button {
  background-color: #e3f2fd;
  color: #1976d2;
}

.draft-button:hover {
  background-color: #bbdefb;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.publish-button {
  background-color: #4CAF50;
  color: white;
}

.publish-button:hover {
  background-color: #43A047;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
 .create-exam-container {
    padding: 0rem;
  }
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .type-buttons {
    flex-direction: column;
  }
  
  .type-button {
    width: 100%;
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

  /* Question form adjustments */
  .question-item {
    margin: 0;
    border-radius: 0;
    box-shadow: none;
    border-bottom: 1px solid #e0e0e0;
  }

  .question-content {
    padding: 15px;
  }

  /* Make textarea bigger on mobile */
  .question-content textarea {
    min-height: 120px;
    font-size: 16px; /* Prevent zoom on iOS */
    padding: 12px;
  }

  /* Adjust question type buttons */
  .type-buttons {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .type-button {
    flex: 1;
    min-width: 150px;
    padding: 10px;
    font-size: 0.9rem;
  }

  /* Options adjustments */
  .options-section {
    margin-top: 15px;
    padding-top: 15px;
  }

  .option-item {
    padding: 8px;
    gap: 8px;
  }

  .option-item input[type="text"] {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  /* Image upload section */
  .image-upload-container {
    min-height: 120px;
  }

  .upload-label .material-icons-round {
    font-size: 2rem;
  }

  /* True/False section */
  .true-false-options {
    flex-direction: row;
    gap: 20px;
    justify-content: center;
  }

  .true-false-option {
    flex: 1;
    max-width: 150px;
  }

  /* Enumeration section */
  .short-answer-section input {
    font-size: 16px; /* Prevent zoom on iOS */
  }

  /* Question actions */
  .question-header {
    padding: 12px;
    flex-direction: row;
    align-items: center;
  }

  .question-actions {
    gap: 6px;
  }

  .action-btn {
    width: 36px;
    height: 36px;
  }

  /* Card body spacing */
  .card-body {
    padding: 10px;
  }

  /* Questions list spacing */
  .questions-list {
    gap: 10px;
    margin: 0;
    padding: 0;
  }

  /* Form elements size adjustments */
  input[type="text"],
  textarea,
  select {
    padding: 8px;
    font-size: 14px;
    height: 38px;
  }

  textarea {
    min-height: 80px;
    height: auto;
  }

  .form-group {
    margin-bottom: 8px;
  }

  label {
    font-size: 0.85rem;
    margin-bottom: 4px;
  }

  /* Button adjustments */
  button {
    height: 38px;
    min-height: 38px;
    padding: 0 12px;
  }

  .add-question-button,
  .import-question-button {
    padding: 10px;
    font-size: 0.9rem;
  }

  .generate-button {
    height: 38px;
    width: 38px;
    padding: 0;
  }

  /* Options adjustments */
  .option-item {
    min-height: 38px;
  }

  .option-item input[type="radio"] {
    width: 18px;
    height: 18px;
  }

  .remove-option-btn {
    width: 24px;
    height: 24px;
  }

  /* Action buttons */
  .action-buttons button {
    height: 42px;
    padding: 0 16px;
  }

  /* Card adjustments */
  .card-body {
    padding: 8px;
  }

  .form-row {
    gap: 8px;
    margin-bottom: 8px;
  }

  /* Question type buttons */
  .type-button {
    height: 38px;
    padding: 0 10px;
    font-size: 0.85rem;
  }

  .type-button .material-icons-round {
    font-size: 18px;
  }

  /* Icons size */
  .material-icons,
  .material-icons-round {
    font-size: 20px;
  }
}

/* Add iOS-specific fixes */
@supports (-webkit-touch-callout: none) {
  input, 
  textarea, 
  select {
    font-size: 16px !important;
  }
}

/* Add this to your existing styles */
.uppercase-input {
  text-transform: uppercase;
}

.uppercase-input::placeholder {
  text-transform: none;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.error {
  border-color: #f44336;
}

.error-text {
  color: #f44336;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Add to your existing styles */
.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn .material-icons-round {
  font-size: 20px;
}

.add-question-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  background-color: #f5f5f5;
  border: 2px dashed #ccc;
  border-radius: 8px;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.add-question-button .material-icons-round {
  font-size: 24px;
}

.add-question-button:hover {
  background-color: #e0e0e0;
  border-color: #999;
}

.add-option-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: #e8f5e9;
  color: #2e7d32;
  cursor: pointer;
  transition: all 0.3s;
}

.add-option-btn .material-icons-round {
  font-size: 20px;
}

.remove-option-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background-color: #ffebee;
  color: #c62828;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.remove-option-btn .material-icons-round {
  font-size: 18px;
}

.action-buttons button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s;
}

.action-buttons .material-icons-round {
  font-size: 20px;
}

/* Make sure icons are vertically aligned */
.material-icons-round {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Add these new styles for image upload */
.image-upload-section {
  margin-bottom: 20px;
}

.image-upload-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 150px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background-color: #f9f9f9;
  transition: all 0.3s;
}

.image-upload-container:hover {
  border-color: #4CAF50;
  background-color: #f0f9f0;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 20px;
}

.file-input {
  position: absolute;
  width: 0.1px;
  height: 0.1px;
  opacity: 0;
  overflow: hidden;
  z-index: -1;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 15px;
  color: #4CAF50;
  font-weight: 500;
  transition: all 0.3s;
}

.upload-label:hover {
  color: #2E7D32;
}

.upload-label .material-icons-round {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.image-preview {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.remove-image-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.remove-image-btn:hover {
  background-color: rgba(244, 67, 54, 0.8);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 20px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.import-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.wide-modal .modal-content {
  max-width: 900px;
}

.bank-questions-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.bank-question-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  padding: 15px;
}

.bank-question-card .question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bank-question-card .question-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #333;
  margin-bottom: 12px;
}

.bank-question-card .question-image {
  position: relative;
  width: 100%;
  margin: 10px 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
}

.bank-question-card .question-image img {
  width: 100%;
  height: 150px;
  object-fit: contain;
  display: block;
  background: #f5f5f5;
}

.bank-question-card .question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.bank-question-card:hover {
  border-color: #2196F3;
  transform: translateX(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bank-question-card.selected {
  border-color: #4CAF50;
  background: #f1f8e9;
}

.difficulty-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.difficulty-badge.easy {
  background: #e8f5e9;
  color: #2e7d32;
}

.difficulty-badge.medium {
  background: #fff3e0;
  color: #f57c00;
}

.difficulty-badge.hard {
  background: #fbe9e7;
  color: #d84315;
}

.selection-info {
  color: #666;
  font-size: 0.9rem;
}

.filters-section {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  margin-bottom: 15px;
}

.search-box input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.search-box .material-icons {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.filter-group {
  display: flex;
  gap: 10px;
}

.filter-group select {
  flex: 1;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
}

/* Side Panel Styles */
.side-panel {
  position: fixed;
  top: 0;
  right: -500px;
  width: 500px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: right 0.3s ease;
  z-index: 1000;
}

.side-panel.is-open {
  right: 0;
}

.side-panel-header {
  padding: 20px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.side-panel-header h2 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.25rem;
}

.side-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.side-panel-footer {
  padding: 15px 20px;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bank-questions-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.bank-question-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  padding: 15px;
}

.bank-question-card .question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bank-question-card .question-text {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #333;
  margin-bottom: 12px;
}

.bank-question-card .question-image {
  position: relative;
  width: 100%;
  margin: 10px 0;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
}

.bank-question-card .question-image img {
  width: 100%;
  height: 150px;
  object-fit: contain;
  display: block;
  background: #f5f5f5;
}

.bank-question-card .question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.bank-question-card:hover {
  border-color: #2196F3;
  transform: translateX(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bank-question-card.selected {
  border-color: #4CAF50;
  background: #f1f8e9;
}

.difficulty-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.difficulty-badge.easy {
  background: #e8f5e9;
  color: #2e7d32;
}

.difficulty-badge.medium {
  background: #fff3e0;
  color: #f57c00;
}

.difficulty-badge.hard {
  background: #fbe9e7;
  color: #d84315;
}

.selection-info {
  color: #666;
  font-size: 0.9rem;
}

.filters-section {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
}

.import-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.import-btn:hover:not(:disabled) {
  background: #388E3C;
}

.import-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.selection-info {
  color: #666;
  font-size: 0.9rem;
}

/* Remove the modal styles */
.modal,
.modal-content,
.wide-modal,
.bank-questions-grid {
  display: none;
}

.questions-actions {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
}

.import-question-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 16px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.import-question-button {
  background-color: #e3f2fd;
  border: 2px dashed #2196F3;
  color: #1976D2;
}

.import-question-button:hover {
  background-color: #bbdefb;
  border-color: #1976D2;
  transform: translateY(-2px);
}

.material-icons,
.material-icons-round {
  font-size: 24px;
}

/* Add styles for the input with button */
.input-with-button {
  display: flex;
  align-items: center;
}

.input-with-button input {
  flex: 1;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.generate-button {
  height: 42px;
  padding: 0 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.generate-button:hover {
  background: #388E3C;
}

.generate-button .material-icons {
  font-size: 20px;
}

/* Update Side Panel Styles */
.side-panel {
  position: fixed;
  top: 0;
  right: -100%;
  width: 500px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: right 0.3s ease;
  z-index: 1000;
}

/* Add responsive adjustments */
@media (max-width: 768px) {
  .side-panel {
    width: 100%;
    right: -100%;
  }

  .side-panel-content {
    padding: 10px;
  }

  .bank-question-card {
    padding: 10px;
  }

  .bank-question-card:hover {
    transform: none;
  }

  .filters-section {
    padding: 10px;
  }

  .filter-group {
    flex-direction: column;
  }

  .filter-group select {
    width: 100%;
  }

  .side-panel-footer {
    padding: 10px;
  }

  .import-btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }

  .selection-info {
    font-size: 0.8rem;
  }
}
</style>