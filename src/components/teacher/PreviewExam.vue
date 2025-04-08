<template>
  <div class="preview-exam">
    <div class="preview-header">
      <div class="header-content">
        <h1>{{ exam?.examTitle }}</h1>
        <div class="exam-meta">
          <span class="test-code">
            <i class="fas fa-code"></i> Test Code: {{ exam?.testCode }}
          </span>
          <span class="class-code">
            <i class="fas fa-chalkboard"></i> Class: {{ exam?.classCode }}
          </span>
        </div>
      </div>
      <div class="header-actions">
        <button 
          @click="storeSelectedQuestions" 
          class="store-btn" 
          :disabled="selectedQuestions.length === 0"
        >
          <i class="fas fa-save"></i> Store in Question Bank
        </button>
        <button @click="$router.back()" class="back-btn">
          <i class="fas fa-arrow-left"></i> Back
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading exam...</p>
    </div>

    <div v-else-if="error" class="error">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button @click="loadExam" class="retry-btn">
        <i class="fas fa-redo"></i> Retry
      </button>
    </div>

    <div v-else class="exam-content">
      <div class="questions-list">
        <div v-for="(question, index) in exam?.questions" :key="index" class="question-card">
          <div class="question-header">
            <div class="question-header-left">
              <input 
                type="checkbox" 
                :id="`question-${index}`"
                v-model="selectedQuestions"
                :value="question"
                class="question-checkbox"
              >
              <span class="question-number">Question {{ index + 1 }}</span>
            </div>
            <span class="question-type">{{ formatQuestionType(question.questionType) }}</span>
          </div>
          
          <div class="question-text">
            {{ question.questionText }}
          </div>
          
          <!-- Question Image -->
          <div v-if="question.imageUrl" class="question-image-container">
            <img :src="getImageUrl(question.imageUrl)" alt="Question image" class="question-image">
          </div>

          <div class="question-options" v-if="question.questionType === 'multiple_choice' || question.questionType === 'multipleChoice'">
            <div v-for="(option, optIndex) in parseOptions(question.options)" :key="optIndex" class="option">
              <input 
                type="radio" 
                :id="`q${index}-opt${optIndex}`" 
                :name="`question-${index}`" 
                :value="option"
                disabled
                :checked="option === question.correctAnswer"
              >
              <label :for="`q${index}-opt${optIndex}`">{{ option }}</label>
            </div>
          </div>

          <div class="question-options" v-else-if="question.questionType === 'true_false'">
            <div class="option">
              <input 
                type="radio" 
                :id="`q${index}-true`" 
                :name="`question-${index}`" 
                value="true"
                :checked="question.correctAnswer.toLowerCase() === 'true'"
                disabled
              >
              <label :for="`q${index}-true`">True</label>
            </div>
            <div class="option">
              <input 
                type="radio" 
                :id="`q${index}-false`" 
                :name="`question-${index}`" 
                value="false"
                :checked="question.correctAnswer.toLowerCase() === 'false'"
                disabled
              >
              <label :for="`q${index}-false`">False</label>
            </div>
          </div>

          <div class="answer-section">
            <div class="correct-answer">
              <span class="label">Correct Answer:</span>
              <span class="value">{{ formatAnswer(question) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Folder Selection Modal -->
    <div v-if="showFolderModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Select Folder</h2>
          <button class="close-btn" @click="closeFolderModal">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Choose a folder (optional)</label>
            <select v-model="selectedFolder" class="folder-select">
              <option value="">No Folder</option>
              <option v-for="folder in folders" :key="folder.id" :value="folder.id">
                {{ folder.name }}
              </option>
            </select>
          </div>

          <div class="modal-actions">
            <button class="cancel-btn" @click="closeFolderModal">Cancel</button>
            <button class="store-btn" @click="confirmStore">
              Store Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref,  onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchTeacherExams, getFullImageUrl, createQuestionBankItem, getQuestionBankFolders } from '../../services/authService';

export default {
  name: 'PreviewExam',
  
  setup() {
    const route = useRoute();
    const exam = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const selectedQuestions = ref([]);
    const folders = ref([]);
    const selectedFolder = ref('');
    const showFolderModal = ref(false);

    const loadExam = async () => {
      try {
        loading.value = true;
        error.value = null;
        const exams = await fetchTeacherExams();
        exam.value = exams.find(e => e.id === parseInt(route.params.examId));
        
        if (!exam.value) {
          throw new Error('Exam not found');
        }
      } catch (err) {
        error.value = err.message;
        console.error('Error loading exam:', err);
      } finally {
        loading.value = false;
      }
    };

    const loadFolders = async () => {
      try {
        const response = await getQuestionBankFolders();
        folders.value = response.folders;
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    };

    onMounted(async () => {
      await Promise.all([loadExam(), loadFolders()]);
    });

    const formatQuestionType = (type) => {
      const types = {
        multiple_choice: 'Multiple Choice',
        multipleChoice: 'Multiple Choice',
        true_false: 'True/False',
        enumeration: 'Short Answer'
      };
      return types[type] || type;
    };

    const parseOptions = (options) => {
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
    };

    const formatAnswer = (question) => {
      if (question.questionType === 'true_false') {
        return question.correctAnswer.charAt(0).toUpperCase() + question.correctAnswer.slice(1);
      }
      return question.correctAnswer;
    };
    
    const getImageUrl = (imageUrl) => {
      return getFullImageUrl(imageUrl);
    };

    const storeSelectedQuestions = async () => {
      try {
        loading.value = true;
        error.value = null;

        // Show folder selection modal
        showFolderModal.value = true;
      } catch (err) {
        error.value = err.message;
        console.error('Error storing questions:', err);
        alert('Failed to store questions in the bank. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const confirmStore = async () => {
      try {
        for (const question of selectedQuestions.value) {
          const questionData = {
            questionText: question.questionText,
            questionType: question.questionType,
            options: question.options,
            correctAnswer: question.correctAnswer,
            imageUrl: question.imageUrl,
            difficulty: 'medium', // Default difficulty
            subject: exam.value.classCode, // Using class code as subject
            folderId: selectedFolder.value || null, // Use selected folder or null
            sourceTestCode: exam.value.testCode,
            sourceClassCode: exam.value.classCode,
            sourceExamTitle: exam.value.examTitle
          };

          await createQuestionBankItem(questionData);
        }

        // Clear selection after successful storage
        selectedQuestions.value = [];
        closeFolderModal();
        alert('Questions successfully stored in the question bank!');
      } catch (error) {
        console.error('Error storing questions:', error);
        alert('Failed to store questions in the bank. Please try again.');
      }
    };

    const closeFolderModal = () => {
      showFolderModal.value = false;
      selectedFolder.value = '';
    };

    return {
      exam,
      loading,
      error,
      loadExam,
      formatQuestionType,
      parseOptions,
      formatAnswer,
      getImageUrl,
      selectedQuestions,
      storeSelectedQuestions,
      folders,
      selectedFolder,
      showFolderModal,
      confirmStore,
      closeFolderModal
    };
  }
};
</script>

<style scoped>
.preview-exam {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.header-content h1 {
  margin: 0 0 10px 0;
  color: #333;
}

.exam-meta {
  display: flex;
  gap: 20px;
  color: #666;
}

.exam-meta span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.back-btn, .store-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.back-btn {
  background: #f0f0f0;
}

.store-btn {
  background: #4caf50;
  color: white;
}

.store-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.back-btn:hover {
  background: #e0e0e0;
}

.store-btn:not(:disabled):hover {
  background: #45a049;
}

.question-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.question-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.question-number {
  font-weight: bold;
  color: #333;
}

.question-type {
  background: #e3f2fd;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.9em;
  color: #1976d2;
}

.question-text {
  font-size: 1.1em;
  margin-bottom: 20px;
  color: #333;
}

/* Add styles for the question image */
.question-image-container {
  margin: 15px 0;
  text-align: center;
}

.question-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.question-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
}

.answer-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.correct-answer {
  display: flex;
  gap: 10px;
  align-items: center;
}

.correct-answer .label {
  font-weight: bold;
  color: #4caf50;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.loading i, .error i {
  font-size: 2em;
  margin-bottom: 15px;
  color: #666;
}

.retry-btn {
  margin-top: 15px;
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 15px auto 0;
}

.retry-btn:hover {
  background: #1976d2;
}

/* Modal Styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.folder-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.folder-select:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn,
.store-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}

.store-btn {
  background: #4CAF50;
  color: white;
}

.store-btn:hover {
  background: #388E3C;
}
</style> 