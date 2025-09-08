<template>
  <div class="question-bank-container">
    <div class="header-container">
      <div class="header-content">
        <h1>Question Bank<span class="material-icons">library_books</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Manage and organize your questions for future use</p>
        </div>
      </div>
      <div class="header-background">QUESTION BANK</div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-section">
      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search questions, exam titles, test codes..."
          @input="filterQuestions"
        >
        <span class="material-icons">search</span>
      </div>

      <div class="filter-group">
        <select v-model="selectedFolder" @change="filterQuestions">
          <option value="">All Folders</option>
          <option v-for="folder in uniqueFolders" :key="folder" :value="folder">
            {{ folder }}
          </option>
        </select>

        <select v-model="selectedSubject" @change="filterQuestions">
          <option value="">All Subjects</option>
          <option v-for="subject in uniqueSubjects" :key="subject" :value="subject">
            {{ subject }}
          </option>
        </select>

        <select v-model="selectedClassCode" @change="filterQuestions">
          <option value="">All Class Codes</option>
          <option v-for="code in uniqueClassCodes" :key="code" :value="code">
            {{ code }}
          </option>
        </select>

        <select v-model="selectedDifficulty" @change="filterQuestions">
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select v-model="selectedType" @change="filterQuestions">
          <option value="">All Types</option>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="true_false">True/False</option>
          <option value="enumeration">Enumeration</option>
        </select>
      </div>
    </div>

    <!-- Add this after the filters-section div -->
    <div class="actions-row">
      <!-- Remove Add New Question Button -->
      <!-- Add Manage Folders Button -->
      <button class="manage-folders-btn" @click="showFoldersModal = true">
        <span class="material-icons">create_new_folder</span>
        Manage Folders
      </button>
    </div>

    <!-- Questions Display -->
    <div class="questions-grid">
      <div v-for="question in filteredQuestions" :key="question.id" class="question-card">
        <div class="question-header">
          <span class="question-type">{{ formatQuestionType(question.questionType) }}</span>
          <div class="question-actions">
            <button @click="showQuestionInfo(question)" title="View Question Info" class="info-btn">
              <span class="material-icons">info</span>
            </button>
            <button @click="assignToFolder(question)" title="Assign to Folder">
              <span class="material-icons">folder_copy</span>
            </button>
            <button @click="deleteQuestion(question.id)" title="Delete from Bank">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>

        <div class="question-content">
          <p class="question-text">{{ question.questionText }}</p>
          
          <div v-if="question.imageUrl" class="question-image">
            <img :src="getImageUrl(question.imageUrl)" alt="Question image">
          </div>


          <div class="question-meta">
            <span class="folder" v-if="question.folder">
              <span class="material-icons">folder</span>
              {{ question.folder.name }}
            </span>
            <span class="subject" v-if="question.subject">
              <span class="material-icons">subject</span>
              {{ question.subject }}
            </span>
            <span :class="['difficulty', question.difficulty]">
              <span class="material-icons">
                {{ getDifficultyIcon(question.difficulty) }}
              </span>
              {{ question.difficulty }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Remove Add/Edit Question Modal -->

    <!-- Keep Folders Modal -->
    <div v-if="showFoldersModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Manage Folders</h2>
          <button class="close-btn" @click="closeFoldersModal">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="modal-body">
          <!-- Add New Folder Form -->
          <form @submit.prevent="createFolder" class="new-folder-form">
            <div class="form-group">
              <label>Create New Folder</label>
              <div class="folder-input-group">
                <input 
                  v-model="newFolderName" 
                  type="text" 
                  placeholder="Enter folder name"
                  required
                >
                <button type="submit" class="create-folder-btn">
                  <span class="material-icons">add</span>
                  Create
                </button>
              </div>
            </div>
          </form>

          <!-- Existing Folders List -->
          <div class="folders-list">
            <h3>Existing Folders</h3>
            <div v-if="uniqueFolders.length === 0" class="no-folders">
              No folders created yet
            </div>
            <div v-else class="folder-items">
              <div v-for="folder in uniqueFolders" :key="folder" class="folder-item">
                <div class="folder-info">
                  <span class="material-icons">folder</span>
                  <span class="folder-name">{{ folder }}</span>
                  <span class="question-count">
                    {{ getQuestionCountInFolder(folder) }} questions
                  </span>
                </div>
                <button 
                  @click="deleteFolder(folder)" 
                  class="delete-folder-btn"
                  :disabled="getQuestionCountInFolder(folder) > 0"
                  :title="getQuestionCountInFolder(folder) > 0 ? 'Cannot delete folder with questions' : 'Delete folder'"
                >
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Assign to Folder Modal -->
    <div v-if="showAssignFolderModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Assign to Folder</h2>
          <button class="close-btn" @click="closeAssignFolderModal">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Select Folder</label>
            <select v-model="selectedFolderForAssign" class="folder-select">
              <option value="">No Folder</option>
              <option v-for="folder in folders" :key="folder.id" :value="folder.id">
                {{ folder.name }}
              </option>
            </select>
          </div>

          <div class="modal-actions">
            <button class="cancel-btn" @click="closeAssignFolderModal">Cancel</button>
            <button class="save-btn" @click="saveAssignFolder">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Question Info Modal -->
    <div v-if="showQuestionInfoModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Question Information</h2>
          <button class="close-btn" @click="closeQuestionInfoModal">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="modal-body" v-if="selectedQuestionForInfo">
          <div class="question-info-content">
            <div class="info-section">
              <h3>Question Details</h3>
              <div class="info-item">
                <label>Question Text:</label>
                <p>{{ selectedQuestionForInfo.questionText }}</p>
              </div>
              <div class="info-item">
                <label>Question Type:</label>
                <span class="question-type-badge">{{ formatQuestionType(selectedQuestionForInfo.questionType) }}</span>
              </div>
              <div class="info-item">
                <label>Difficulty:</label>
                <span :class="['difficulty-badge', selectedQuestionForInfo.difficulty]">
                  <span class="material-icons">{{ getDifficultyIcon(selectedQuestionForInfo.difficulty) }}</span>
                  {{ selectedQuestionForInfo.difficulty }}
                </span>
              </div>
              <div class="info-item" v-if="selectedQuestionForInfo.subject">
                <label>Subject:</label>
                <span class="subject-badge">{{ selectedQuestionForInfo.subject }}</span>
              </div>
              <div class="info-item" v-if="selectedQuestionForInfo.folder">
                <label>Folder:</label>
                <span class="folder-badge">
                  <span class="material-icons">folder</span>
                  {{ selectedQuestionForInfo.folder.name }}
                </span>
              </div>
            </div>

            <div class="info-section" v-if="selectedQuestionForInfo.sourceTestCode || selectedQuestionForInfo.sourceClassCode || selectedQuestionForInfo.sourceExamTitle">
              <h3>Source Exam Information</h3>
              <div class="source-details">
                <div class="info-item" v-if="selectedQuestionForInfo.sourceExamTitle">
                  <label>Exam Title:</label>
                  <span class="exam-title-badge">
                    <span class="material-icons">title</span>
                    {{ selectedQuestionForInfo.sourceExamTitle }}
                  </span>
                </div>
                <div class="info-item" v-if="selectedQuestionForInfo.sourceTestCode">
                  <label>Test Code:</label>
                  <span class="test-code-badge">
                    <span class="material-icons">code</span>
                    {{ selectedQuestionForInfo.sourceTestCode }}
                  </span>
                </div>
                <div class="info-item" v-if="selectedQuestionForInfo.sourceClassCode">
                  <label>Class Code:</label>
                  <span class="class-code-badge">
                    <span class="material-icons">class</span>
                    {{ selectedQuestionForInfo.sourceClassCode }}
                  </span>
                </div>
              </div>
            </div>

            <div class="info-section" v-if="selectedQuestionForInfo.imageUrl">
              <h3>Question Image</h3>
              <div class="question-image-preview">
                <img :src="getImageUrl(selectedQuestionForInfo.imageUrl)" alt="Question image">
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="close-info-btn" @click="closeQuestionInfoModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { getQuestionBankItems, deleteQuestionBankItem, getFullImageUrl, createQuestionBankFolder, getQuestionBankFolders, deleteQuestionBankFolder, updateQuestionBankItem } from '../../services/authService';
import Swal from 'sweetalert2';

export default {
  name: 'QuestionBank',
  
  setup() {
    const questions = ref([]);
    const folders = ref([]);
    const searchQuery = ref('');
    const selectedFolder = ref('');
    const selectedSubject = ref('');
    const selectedDifficulty = ref('');
    const selectedType = ref('');
    const selectedClassCode = ref('');
    const showFoldersModal = ref(false);
    const newFolderName = ref('');
    const showAssignFolderModal = ref(false);
    const selectedFolderForAssign = ref('');
    const currentQuestion = ref(null);
    const showQuestionInfoModal = ref(false);
    const selectedQuestionForInfo = ref(null);

    const loadQuestions = async () => {
      try {
        const response = await getQuestionBankItems();
        questions.value = response.questions;
      } catch (error) {
        console.error('Error loading questions:', error);
        Swal.fire('Error', 'Failed to load questions', 'error');
      }
    };

    const loadFolders = async () => {
      try {
        const response = await getQuestionBankFolders();
        folders.value = response.folders;
      } catch (error) {
        console.error('Error loading folders:', error);
        Swal.fire('Error', 'Failed to load folders', 'error');
      }
    };

    onMounted(async () => {
      await Promise.all([loadQuestions(), loadFolders()]);
    });

    const uniqueFolders = computed(() => {
      return folders.value.map(f => f.name);
    });

    const uniqueSubjects = computed(() => {
      const subjects = new Set(questions.value.map(q => q.subject).filter(Boolean));
      return Array.from(subjects);
    });

    const uniqueClassCodes = computed(() => {
      const codes = new Set(questions.value.map(q => q.sourceClassCode).filter(Boolean));
      return Array.from(codes);
    });

    const filteredQuestions = computed(() => {
      return questions.value.filter(q => {
        const matchesSearch = !searchQuery.value || 
          q.questionText.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          (q.sourceExamTitle && q.sourceExamTitle.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
          (q.sourceTestCode && q.sourceTestCode.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
          (q.sourceClassCode && q.sourceClassCode.toLowerCase().includes(searchQuery.value.toLowerCase()));
        
        // Find folder by ID
        const folder = folders.value.find(f => f.id === q.folderId);
        const matchesFolder = !selectedFolder.value || (folder && folder.name === selectedFolder.value);
        
        const matchesSubject = !selectedSubject.value || q.subject === selectedSubject.value;
        const matchesClassCode = !selectedClassCode.value || q.sourceClassCode === selectedClassCode.value;
        const matchesDifficulty = !selectedDifficulty.value || q.difficulty === selectedDifficulty.value;
        const matchesType = !selectedType.value || q.questionType === selectedType.value;

        return matchesSearch && matchesFolder && matchesSubject && matchesClassCode && matchesDifficulty && matchesType;
      }).map(q => ({
        ...q,
        folder: folders.value.find(f => f.id === q.folderId)
      }));
    });

    const formatQuestionType = (type) => {
      const types = {
        multiple_choice: 'Multiple Choice',
        true_false: 'True/False',
        enumeration: 'Enumeration'
      };
      return types[type] || type;
    };

    const getDifficultyIcon = (difficulty) => {
      const icons = {
        easy: 'sentiment_satisfied',
        medium: 'sentiment_neutral',
        hard: 'sentiment_dissatisfied'
      };
      return icons[difficulty] || 'help';
    };

    const getImageUrl = (imageUrl) => {
      return getFullImageUrl(imageUrl);
    };

    const deleteQuestion = async (questionId) => {
      try {
        const result = await Swal.fire({
          title: 'Remove from Question Bank?',
          text: 'This will only remove the question from the bank, not from any exams.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, remove it'
        });

        if (result.isConfirmed) {
          await deleteQuestionBankItem(questionId);
          await loadQuestions();
          Swal.fire('Removed!', 'Question has been removed from the bank.', 'success');
        }
      } catch (error) {
        console.error('Error removing question:', error);
        Swal.fire('Error', 'Failed to remove question', 'error');
      }
    };

    const getQuestionCountInFolder = (folderName) => {
      const folder = folders.value.find(f => f.name === folderName);
      return folder ? folder._count.questions : 0;
    };

    const createFolder = async () => {
      const folderName = newFolderName.value.trim();
      if (!folderName) return;

      // Check if folder already exists
      if (uniqueFolders.value.includes(folderName)) {
        Swal.fire('Error', 'Folder already exists', 'error');
        return;
      }

      try {
        await createQuestionBankFolder({
          name: folderName
        });

        await loadFolders();
        newFolderName.value = '';
        Swal.fire('Success', 'Folder created successfully', 'success');
      } catch (error) {
        console.error('Error creating folder:', error);
        Swal.fire('Error', 'Failed to create folder', 'error');
      }
    };

    const deleteFolder = async (folderName) => {
      // Find folder by name
      const folder = folders.value.find(f => f.name === folderName);
      if (!folder) {
        Swal.fire('Error', 'Folder not found', 'error');
        return;
      }

      // Check if folder has questions
      if (folder._count.questions > 0) {
        Swal.fire('Error', 'Cannot delete folder that contains questions', 'error');
        return;
      }

      try {
        const result = await Swal.fire({
          title: 'Delete Folder?',
          text: 'This action cannot be undone',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
          await deleteQuestionBankFolder(folder.id);
          await loadFolders();
          Swal.fire('Deleted!', 'Folder has been deleted', 'success');
        }
      } catch (error) {
        console.error('Error deleting folder:', error);
        Swal.fire('Error', 'Failed to delete folder', 'error');
      }
    };

    const closeFoldersModal = () => {
      showFoldersModal.value = false;
      newFolderName.value = '';
    };

    const assignToFolder = (question) => {
      currentQuestion.value = question;
      selectedFolderForAssign.value = question.folderId || '';
      showAssignFolderModal.value = true;
    };

    const saveAssignFolder = async () => {
      try {
        if (!currentQuestion.value) return;

        await updateQuestionBankItem(currentQuestion.value.id, {
          folderId: selectedFolderForAssign.value || null
        });

        await loadQuestions();
        closeAssignFolderModal();
        Swal.fire('Success', 'Question assigned to folder successfully', 'success');
      } catch (error) {
        console.error('Error assigning question to folder:', error);
        Swal.fire('Error', 'Failed to assign question to folder', 'error');
      }
    };

    const closeAssignFolderModal = () => {
      showAssignFolderModal.value = false;
      selectedFolderForAssign.value = '';
      currentQuestion.value = null;
    };

    const showQuestionInfo = (question) => {
      selectedQuestionForInfo.value = question;
      showQuestionInfoModal.value = true;
    };

    const closeQuestionInfoModal = () => {
      showQuestionInfoModal.value = false;
      selectedQuestionForInfo.value = null;
    };

    return {
      questions,
      folders,
      searchQuery,
      selectedFolder,
      selectedSubject,
      selectedDifficulty,
      selectedType,
      selectedClassCode,
      uniqueFolders,
      uniqueSubjects,
      uniqueClassCodes,
      filteredQuestions,
      formatQuestionType,
      getDifficultyIcon,
      deleteQuestion,
      getImageUrl,
      showFoldersModal,
      newFolderName,
      getQuestionCountInFolder,
      createFolder,
      deleteFolder,
      closeFoldersModal,
      showAssignFolderModal,
      selectedFolderForAssign,
      assignToFolder,
      saveAssignFolder,
      closeAssignFolderModal,
      showQuestionInfoModal,
      selectedQuestionForInfo,
      showQuestionInfo,
      closeQuestionInfoModal
    };
  }
};
</script>

<style scoped>
.question-bank-container {
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

/* Update filters section */
.filters-section {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* Update search box */
.search-box {
  flex: 1;
  min-width: 200px;
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 12px 40px 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;
}

.search-box input:focus {
  border-color: #159750;
  outline: none;
  box-shadow: 0 0 0 2px rgba(21, 151, 80, 0.1);
}

.filter-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-group select {
  padding: 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 150px;
}

.actions-row {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.manage-folders-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.manage-folders-btn:hover {
  background-color: #388E3C;
}

.new-folder-form {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.folder-input-group {
  display: flex;
  gap: 10px;
}

.folder-input-group input {
  flex: 1;
}

.create-folder-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.create-folder-btn:hover {
  background-color: #388E3C;
}

.folders-list {
  margin-top: 20px;
}

.folders-list h3 {
  margin-bottom: 15px;
  color: #333;
}

.no-folders {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.folder-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.folder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  transition: all 0.3s;
}

.folder-item:hover {
  background: #e3f2fd;
}

.folder-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.folder-name {
  font-weight: 500;
}

.question-count {
  color: #666;
  font-size: 0.9rem;
}

.delete-folder-btn {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: all 0.3s;
}

.delete-folder-btn:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.1);
}

.delete-folder-btn:disabled {
  color: #bdbdbd;
  cursor: not-allowed;
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
  max-width: 1000px;
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

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
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
}

.option-item input[type="text"] {
  flex: 1;
}

.option-item button {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
}

.add-option-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #e3f2fd;
  color: #1976D2;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;
}

.true-false-options {
  display: flex;
  gap: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.cancel-btn {
  background: #f5f5f5;
  color: #333;
}

.save-btn {
  background: #2196F3;
  color: white;
}

/* Image upload styles */
.image-upload-container {
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  position: relative;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.file-input {
  display: none;
}

.upload-label {
  cursor: pointer;
  color: #2196F3;
}

.image-preview {
  position: relative;
}

.image-preview img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
}

.remove-image-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.source-info {
  margin: 15px 0;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.source-info h4 {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 0.9rem;
}

.source-details {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.source-details span {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.exam-title {
  background: #e8eaf6;
  color: #3f51b5;
}

.test-code {
  background: #f3e5f5;
  color: #9c27b0;
}

.class-code {
  background: #e0f2f1;
  color: #009688;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.question-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.folder {
  background: #e3f2fd;
  color: #1976d2;
}

.subject {
  background: #f1f8e9;
  color: #558b2f;
}

.difficulty {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.difficulty.easy {
  background: #e8f5e9;
  color: #2e7d32;
}

.difficulty.medium {
  background: #fff3e0;
  color: #f57c00;
}

.difficulty.hard {
  background: #fbe9e7;
  color: #d84315;
}

.questions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.question-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s;
}

.question-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.question-header {
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.question-type {
  font-size: 0.9rem;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
}

.question-actions {
  display: flex;
  gap: 8px;
}

.question-actions button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s;
}

.question-actions button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.question-actions .info-btn:hover {
  background: rgba(33, 150, 243, 0.3);
}

.question-content {
  padding: 15px;
}

.question-text {
  font-size: 1rem;
  color: #333;
  margin-bottom: 15px;
  line-height: 1.5;
}

.question-image {
  margin: 15px 0;
  text-align: center;
}

.question-image img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.source-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin: 15px 0;
}

.source-info h4 {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 8px 0;
}

.source-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.source-details span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.exam-title {
  background: #e8eaf6;
  color: #3f51b5;
}

.test-code {
  background: #f3e5f5;
  color: #9c27b0;
}

.class-code {
  background: #e0f2f1;
  color: #009688;
}

.question-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.question-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.folder {
  background: #e3f2fd;
  color: #1976d2;
}

.subject {
  background: #f1f8e9;
  color: #558b2f;
}

.difficulty {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.difficulty.easy {
  background: #e8f5e9;
  color: #2e7d32;
}

.difficulty.medium {
  background: #fff3e0;
  color: #f57c00;
}

.difficulty.hard {
  background: #fbe9e7;
  color: #d84315;
}

.folder-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 8px;
}

.folder-select:focus {
  border-color: #2196F3;
  outline: none;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

/* Question Info Modal Styles */
.question-info-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-section {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
}

.info-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1rem;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 8px;
}

.info-item {
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item label {
  display: block;
  font-weight: 600;
  color: #555;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.info-item p {
  margin: 0;
  color: #333;
  line-height: 1.5;
  background: white;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.question-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
}

.difficulty-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
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

.subject-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: #f1f8e9;
  color: #558b2f;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
}

.folder-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
}

.exam-title-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: #e8eaf6;
  color: #3f51b5;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
}

.test-code-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: #f3e5f5;
  color: #9c27b0;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
}

.class-code-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  background: #e0f2f1;
  color: #009688;
  border-radius: 15px;
  font-size: 0.85rem;
  font-weight: 500;
}

.question-image-preview {
  text-align: center;
  background: white;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e0e0e0;
}

.question-image-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.close-info-btn {
  padding: 10px 20px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.close-info-btn:hover {
  background: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .question-bank-container {
    padding: 16px;
  }
  
  .header-content h1 {
    font-size: 2.2rem;
    margin-bottom: 0.8rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2.2rem;
  }
  
  .header-background {
    font-size: 6.5rem;
    right: 4rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .divider {
    margin: 1.2rem 0;
  }
  
  .filters-section {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .search-box input {
    padding: 10px 35px 10px 12px;
    font-size: 0.95rem;
  }
  
  .filter-group {
    gap: 8px;
  }
  
  .filter-group select {
    padding: 8px 12px;
    font-size: 0.95rem;
    min-width: 130px;
  }
  
  .actions-row {
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .manage-folders-btn {
    padding: 10px 20px;
    font-size: 0.95rem;
  }
  
  .questions-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    margin-top: 16px;
  }
  
  .question-card {
    border-radius: 10px;
  }
  
  .question-header {
    padding: 12px;
  }
  
  .question-type {
    font-size: 0.85rem;
    padding: 3px 10px;
  }
  
  .question-actions button {
    width: 28px;
    height: 28px;
  }
  
  .question-content {
    padding: 12px;
  }
  
  .question-text {
    font-size: 0.95rem;
    margin-bottom: 12px;
  }
  
  .question-meta {
    gap: 6px;
    margin-top: 12px;
    padding-top: 12px;
  }
  
  .question-meta span {
    font-size: 0.8rem;
    padding: 3px 6px;
  }
  
  .source-info {
    margin: 12px 0;
    padding: 8px;
  }
  
  .source-info h4 {
    font-size: 0.85rem;
    margin-bottom: 6px;
  }
  
  .source-details {
    gap: 8px;
  }
  
  .source-details span {
    font-size: 0.8rem;
    padding: 3px 6px;
  }
  
  .modal-content {
    max-width: 900px;
    width: 95%;
    border-radius: 10px;
  }
  
  .modal-header {
    padding: 12px 16px;
    border-radius: 10px 10px 0 0;
  }
  
  .modal-header h2 {
    font-size: 1.1rem;
  }
  
  .modal-body {
    padding: 12px 16px;
  }
  
  .form-group label {
    margin-bottom: 4px;
    font-size: 0.8rem;
  }
  
  .form-group input,
  .form-group select {
    padding: 6px;
    font-size: 0.8rem;
  }
  
  .folder-input-group {
    gap: 6px;
  }
  
  .create-folder-btn {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
  
  .folder-item {
    padding: 8px;
  }
  
  .folder-name {
    font-size: 0.8rem;
  }
  
  .question-count {
    font-size: 0.75rem;
  }
  
  .modal-actions {
    gap: 6px;
    margin-top: 12px;
  }
  
  .cancel-btn,
  .save-btn {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
  
  .folder-select {
    padding: 6px;
    font-size: 0.8rem;
  }
  
  .question-info-content {
    gap: 12px;
  }
  
  .info-section {
    padding: 8px;
  }
  
  .info-section h3 {
    font-size: 0.85rem;
    margin-bottom: 8px;
  }
  
  .info-item {
    margin-bottom: 6px;
  }
  
  .info-item label {
    font-size: 0.75rem;
  }
  
  .info-item p {
    padding: 6px;
    font-size: 0.8rem;
  }
  
  .question-image-preview {
    padding: 8px;
  }
  
  .question-image-preview img {
    max-height: 200px;
  }
}

/* Compact layout for 14-inch laptops and lower resolutions */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .question-bank-container {
    padding: 14px;
  }
  
  .header-content h1 {
    font-size: 2rem;
    margin-bottom: 0.7rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-background {
    font-size: 6rem;
    right: 3rem;
  }
  
  .subtitle {
    font-size: 0.95rem;
  }
  
  .divider {
    margin: 1rem 0;
  }
  
  .filters-section {
    padding: 14px;
    margin-bottom: 14px;
  }
  
  .search-box input {
    padding: 8px 30px 8px 10px;
    font-size: 0.9rem;
  }
  
  .filter-group {
    gap: 6px;
  }
  
  .filter-group select {
    padding: 6px 10px;
    font-size: 0.9rem;
    min-width: 120px;
  }
  
  .actions-row {
    gap: 10px;
    margin-bottom: 14px;
  }
  
  .manage-folders-btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
  
  .questions-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 14px;
    margin-top: 14px;
  }
  
  .question-card {
    border-radius: 8px;
  }
  
  .question-header {
    padding: 10px;
  }
  
  .question-type {
    font-size: 0.8rem;
    padding: 2px 8px;
  }
  
  .question-actions button {
    width: 26px;
    height: 26px;
  }
  
  .question-content {
    padding: 10px;
  }
  
  .question-text {
    font-size: 0.9rem;
    margin-bottom: 10px;
  }
  
  .question-meta {
    gap: 5px;
    margin-top: 10px;
    padding-top: 10px;
  }
  
  .question-meta span {
    font-size: 0.75rem;
    padding: 2px 5px;
  }
  
  .source-info {
    margin: 10px 0;
    padding: 6px;
  }
  
  .source-info h4 {
    font-size: 0.8rem;
    margin-bottom: 5px;
  }
  
  .source-details {
    gap: 6px;
  }
  
  .source-details span {
    font-size: 0.75rem;
    padding: 2px 5px;
  }
  
  .modal-content {
    max-width: 800px;
    width: 95%;
    border-radius: 8px;
  }
  
  .modal-header {
    padding: 10px 12px;
    border-radius: 8px 8px 0 0;
  }
  
  .modal-header h2 {
    font-size: 1rem;
  }
  
  .modal-body {
    padding: 10px 12px;
  }
  
  .form-group label {
    margin-bottom: 4px;
    font-size: 0.75rem;
  }
  
  .form-group input,
  .form-group select {
    padding: 5px;
    font-size: 0.75rem;
  }
  
  .folder-input-group {
    gap: 5px;
  }
  
  .create-folder-btn {
    padding: 5px 10px;
    font-size: 0.75rem;
  }
  
  .folder-item {
    padding: 6px;
  }
  
  .folder-name {
    font-size: 0.75rem;
  }
  
  .question-count {
    font-size: 0.7rem;
  }
  
  .modal-actions {
    gap: 5px;
    margin-top: 10px;
  }
  
  .cancel-btn,
  .save-btn {
    padding: 5px 10px;
    font-size: 0.75rem;
  }
  
  .folder-select {
    padding: 5px;
    font-size: 0.75rem;
  }
  
  .question-info-content {
    gap: 10px;
  }
  
  .info-section {
    padding: 6px;
  }
  
  .info-section h3 {
    font-size: 0.8rem;
    margin-bottom: 6px;
  }
  
  .info-item {
    margin-bottom: 5px;
  }
  
  .info-item label {
    font-size: 0.7rem;
  }
  
  .info-item p {
    padding: 4px;
    font-size: 0.75rem;
  }
  
  .question-image-preview {
    padding: 6px;
  }
  
  .question-image-preview img {
    max-height: 150px;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .question-bank-container {
    padding: 12px;
  }
  
  .header-content h1 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.8rem;
  }
  
  .header-background {
    font-size: 5rem;
    right: 2rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .divider {
    margin: 0.8rem 0;
  }
  
  .filters-section {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .search-box input {
    padding: 6px 25px 6px 8px;
    font-size: 0.85rem;
  }
  
  .filter-group {
    gap: 5px;
  }
  
  .filter-group select {
    padding: 5px 8px;
    font-size: 0.85rem;
    min-width: 110px;
  }
  
  .actions-row {
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .manage-folders-btn {
    padding: 6px 14px;
    font-size: 0.85rem;
  }
  
  .questions-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }
  
  .question-card {
    border-radius: 6px;
  }
  
  .question-header {
    padding: 8px;
  }
  
  .question-type {
    font-size: 0.75rem;
    padding: 1px 6px;
  }
  
  .question-actions button {
    width: 24px;
    height: 24px;
  }
  
  .question-content {
    padding: 8px;
  }
  
  .question-text {
    font-size: 0.85rem;
    margin-bottom: 8px;
  }
  
  .question-meta {
    gap: 4px;
    margin-top: 8px;
    padding-top: 8px;
  }
  
  .question-meta span {
    font-size: 0.7rem;
    padding: 1px 4px;
  }
  
  .source-info {
    margin: 8px 0;
    padding: 4px;
  }
  
  .source-info h4 {
    font-size: 0.75rem;
    margin-bottom: 4px;
  }
  
  .source-details {
    gap: 4px;
  }
  
  .source-details span {
    font-size: 0.7rem;
    padding: 1px 4px;
  }
  
  .modal-content {
    max-width: 700px;
    width: 95%;
    border-radius: 6px;
  }
  
  .modal-header {
    padding: 8px 10px;
    border-radius: 6px 6px 0 0;
  }
  
  .modal-header h2 {
    font-size: 0.95rem;
  }
  
  .modal-body {
    padding: 8px 10px;
  }
  
  .form-group label {
    margin-bottom: 3px;
    font-size: 0.7rem;
  }
  
  .form-group input,
  .form-group select {
    padding: 3px;
    font-size: 0.7rem;
  }
  
  .folder-input-group {
    gap: 3px;
  }
  
  .create-folder-btn {
    padding: 3px 8px;
    font-size: 0.7rem;
  }
  
  .folder-item {
    padding: 4px;
  }
  
  .folder-name {
    font-size: 0.7rem;
  }
  
  .question-count {
    font-size: 0.65rem;
  }
  
  .modal-actions {
    gap: 3px;
    margin-top: 8px;
  }
  
  .cancel-btn,
  .save-btn {
    padding: 3px 8px;
    font-size: 0.7rem;
  }
  
  .folder-select {
    padding: 3px;
    font-size: 0.7rem;
  }
  
  .question-info-content {
    gap: 8px;
  }
  
  .info-section {
    padding: 4px;
  }
  
  .info-section h3 {
    font-size: 0.75rem;
    margin-bottom: 4px;
  }
  
  .info-item {
    margin-bottom: 3px;
  }
  
  .info-item label {
    font-size: 0.65rem;
  }
  
  .info-item p {
    padding: 3px;
    font-size: 0.7rem;
  }
  
  .question-image-preview {
    padding: 4px;
  }
  
  .question-image-preview img {
    max-height: 120px;
  }
}

@media (max-width: 768px) {
  .question-bank-container {
    padding: 10px 5px;
  }

  .header-background {
    position: absolute;
    top: 60%;
    right: 1rem;
    transform: translateY(-50%);
    font-size: 3rem;
    font-weight: 900;
    color: rgba(0, 0, 0, 0.03);
    z-index: 0;
    user-select: none;
    pointer-events: none;
    overflow: hidden;
    white-space: nowrap;
  }

  .filters-section {
    flex-direction: column;
    padding: 15px;
  }

  .filter-group {
    flex-direction: column;
  }

  .filter-group select {
    width: 100%;
  }
}
</style>