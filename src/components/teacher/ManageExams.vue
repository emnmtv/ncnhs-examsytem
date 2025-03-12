<template>
  <div class="manage-exams">
    <div class="header">
      <h1>Manage Exams</h1>
      <div class="header-actions">
        <button class="template-btn" @click="downloadTemplate">
          <i class="fas fa-file-download"></i> Download Template
        </button>
        <label class="import-btn">
          <i class="fas fa-file-upload"></i> Import Exam
          <input 
            type="file" 
            accept=".xlsx" 
            @change="handleImport" 
            style="display: none"
          >
        </label>
        <router-link to="/create-exam" class="create-btn">
          <i class="fas fa-plus"></i> Create New Exam
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading exams...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button @click="loadExams" class="retry-btn">
        <i class="fas fa-redo"></i> Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!exams.length" class="empty-state">
      <i class="fas fa-clipboard-list"></i>
      <p>No exams found</p>
      <p class="subtitle">Create your first exam to get started</p>
      <router-link to="/create-exam" class="create-btn">
        <i class="fas fa-plus"></i> Create Exam
      </router-link>
    </div>

    <!-- Exams List -->
    <div v-else class="exams-grid">
      <div v-for="exam in exams" :key="exam.id" class="exam-card" :class="exam.status">
        <div class="exam-header">
          <h3>{{ exam.examTitle }}</h3>
          <div class="status-badge" :class="exam.status">
            {{ formatStatus(exam.status) }}
          </div>
        </div>

        <div class="exam-details">
          <p><i class="fas fa-code"></i> Test Code: <strong>{{ exam.testCode }}</strong></p>
          <p><i class="fas fa-chalkboard"></i> Class: {{ exam.classCode }}</p>
          <p>
            <i class="fas fa-question-circle"></i> 
            Questions: {{ exam.questions.length }}
          </p>
          <p>
            <i class="fas fa-users"></i>
            Submissions: {{ exam._count.examAnswers }}
          </p>
        </div>

        <div class="exam-stats" v-if="exam.scores.length">
          <div class="stat">
            <span class="label">Average Score</span>
            <span class="value">
              {{ calculateAverageScore(exam.scores) }}%
            </span>
          </div>
          <div class="stat">
            <span class="label">Submissions</span>
            <span class="value">{{ exam.scores.length }}</span>
          </div>
        </div>

        <div class="exam-actions">
          <button 
            v-if="!exam.scores.length"
            @click="editExam(exam)" 
            class="edit-btn"
            title="Edit exam"
          >
            <i class="fas fa-edit"></i> Edit
          </button>

          <button 
            @click="previewExam(exam)" 
            class="preview-btn"
            title="Preview exam"
          >
            <i class="fas fa-eye"></i> Preview
          </button>

          <button 
            v-if="exam.status === 'pending' || exam.status === 'stopped'"
            @click="startExam(exam.testCode)" 
            class="start-btn"
            title="Start exam"
          >
            <i class="fas fa-play"></i> Start
          </button>

          <button 
            v-if="exam.status === 'started'"
            @click="stopExam(exam.testCode)" 
            class="stop-btn"
            title="Stop exam"
          >
            <i class="fas fa-stop"></i> Stop
          </button>

          <button 
            v-if="exam.status !== 'started' && !exam.scores.length"
            @click="confirmDelete(exam)" 
            class="delete-btn"
            title="Delete exam"
          >
            <i class="fas fa-trash"></i> Delete
          </button>

          <button 
            @click="viewResults(exam)" 
            class="results-btn"
            title="View results"
            :disabled="!exam.scores.length"
          >
            <i class="fas fa-chart-bar"></i> Results
          </button>

          <button 
            @click="exportExam(exam)" 
            class="export-btn"
            title="Export exam"
          >
            <i class="fas fa-file-export"></i> Export
          </button>

          <button class="action-btn access-btn" @click="openAccessModal(exam)">
            <span class="material-icons-round">security</span>
            Manage Access
          </button>
        </div>
      </div>
    </div>

    <!-- Access Modal -->
    <div v-if="showAccessModal" class="modal-backdrop" @click.self="closeAccessModal">
      <div class="access-modal" :class="{ 'modal-closing': isClosing }">
        <div class="modal-handle"></div>
        
        <div class="modal-header">
          <h2>
            <span class="material-icons-round">security</span>
            Manage Exam Access
          </h2>
          <button @click="closeAccessModal" class="close-btn">
            <span class="material-icons-round">close</span>
          </button>
        </div>

        <div class="modal-body">
          <!-- Exam Info Card -->
          <div class="access-exam-info">
            <h3>{{ selectedExam.examTitle }}</h3>
            <div class="exam-meta">
              <span class="meta-item">
                <span class="material-icons-round">code</span>
                Test Code: {{ selectedExam.testCode }}
              </span>
              <span class="meta-item">
                <span class="material-icons-round">class</span>
                Class: {{ selectedExam.classCode }}
              </span>
            </div>
          </div>

          <!-- Access Control Toggle -->
          <div class="access-control-section">
            <div class="access-type-header">
              <h4>Access Control Mode</h4>
              <div class="toggle-wrapper">
                <label class="switch">
                  <input type="checkbox" v-model="restrictAccess" @change="toggleAccessRestriction">
                  <span class="slider round"></span>
                </label>
                <span class="toggle-state">{{ restrictAccess ? 'Restricted Access' : 'Open Access' }}</span>
              </div>
            </div>
            
            <div class="access-description">
              <div class="description-icon">
                <span class="material-icons-round">{{ restrictAccess ? 'lock' : 'public' }}</span>
              </div>
              <div class="description-text">
                <p>{{ restrictAccess ? 
                  'Only students from selected grade sections will be able to access this exam.' : 
                  'All students can access this exam regardless of their grade or section.' }}</p>
              </div>
            </div>
          </div>

          <!-- Grade Section Access (Only visible when restricted) -->
          <div v-if="restrictAccess" class="section-access-container">
            <div class="section-form-card">
              <h4>
                <span class="material-icons-round">add_circle</span>
                Add Grade Section Access
              </h4>
              
              <div class="section-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="gradeSelect">Grade Level</label>
                    <select 
                      id="gradeSelect"
                      v-model="newAccessGrade" 
                      @change="loadSectionsForGrade"
                      class="form-select"
                    >
                      <option value="">Select Grade</option>
                      <option 
                        v-for="grade in availableGrades" 
                        :key="grade" 
                        :value="grade"
                      >
                        Grade {{ grade }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="sectionSelect">Section</label>
                    <select 
                      id="sectionSelect"
                      v-model="newAccessSection" 
                      :disabled="!newAccessGrade"
                      class="form-select"
                    >
                      <option value="">Select Section</option>
                      <option 
                        v-for="section in availableSectionsForGrade" 
                        :key="section" 
                        :value="section"
                      >
                        {{ section }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="form-action">
                    <button 
                      @click="addAccessSection" 
                      class="add-section-btn"
                      :disabled="!newAccessGrade || !newAccessSection"
                    >
                      <span class="material-icons-round">add</span>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section Access List -->
            <div class="section-list-card">
              <div class="list-header">
                <h4>
                  <span class="material-icons-round">list</span>
                  Authorized Grade Sections
                </h4>
                <span class="section-count">{{ accessSections.length }} sections</span>
              </div>
              
              <div v-if="accessSections.length === 0" class="empty-sections">
                <span class="material-icons-round">info</span>
                <p>No sections have been added</p>
                <p class="empty-hint">Students won't be able to access this exam until you add at least one section.</p>
              </div>
              
              <div v-else class="sections-list">
                <div v-for="(section, index) in accessSections" :key="index" class="section-item">
                  <div class="section-info">
                    <span class="grade-badge">Grade {{ section.grade }}</span>
                    <span class="section-name">{{ section.section }}</span>
                  </div>
                  <button @click="removeAccessSection(index)" class="remove-section-btn">
                    <span class="material-icons-round">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeAccessModal" class="cancel-btn">
            <span class="material-icons-round">close</span>
            Cancel
          </button>
          <button @click="saveAccessSettings" class="save-btn">
            <span class="material-icons-round">save</span>
            Save Access Settings
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  fetchTeacherExams, 
  deleteExam, 
  startExam as startExamApi, 
  stopExam as stopExamApi,
  createExam,
  getAllGradeSections,
  setExamAccess,
  getExamAccess
} from '../../services/authService';
import Swal from 'sweetalert2';
import socketManager from '@/utils/socketManager';
import { generateExamTemplate, exportExamToExcel, parseExcelFile } from '@/utils/excelTemplates';

export default {
  name: 'ManageExams',
  
  setup() {
    const router = useRouter();
    const exams = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const socket = ref(null);
    const showAccessModal = ref(false);
    const selectedExam = ref(null);
    const restrictAccess = ref(false);
    const newAccessGrade = ref('');
    const newAccessSection = ref('');
    const accessSections = ref([]);
    const availableGrades = ref([]);
    const availableSections = ref([]);
    const isClosing = ref(false);

    // Initialize socket connection
    onMounted(() => {
      socket.value = socketManager.getSocket();
      loadExams();
      loadGradeSections();
    });

    const loadExams = async () => {
      try {
        loading.value = true;
        error.value = null;
        exams.value = await fetchTeacherExams();
      } catch (err) {
        error.value = err.message || 'Failed to load exams';
        console.error('Error loading exams:', err);
      } finally {
        loading.value = false;
      }
    };

    const formatStatus = (status) => {
      const statusMap = {
        draft: 'Draft',
        pending: 'Ready',
        started: 'In Progress',
        stopped: 'Ready'
      };
      return statusMap[status] || status;
    };

    const calculateAverageScore = (scores) => {
      if (!scores.length) return 0;
      const total = scores.reduce((sum, score) => sum + score.percentage, 0);
      return (total / scores.length).toFixed(1);
    };

    const editExam = (exam) => {
      router.push({
        path: '/create-exam',
        query: { examId: exam.id }
      });
    };

    const confirmDelete = async (exam) => {
      const result = await Swal.fire({
        title: 'Delete Exam?',
        text: "This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        try {
          await deleteExam(exam.id);
          await loadExams(); // Refresh the list
          Swal.fire('Deleted!', 'The exam has been deleted.', 'success');
        } catch (error) {
          Swal.fire('Error!', error.message, 'error');
        }
      }
    };

    const startExam = async (testCode) => {
      try {
        await startExamApi(testCode);
        
        // Emit socket event for exam start
        socket.value.emit('examStatusChanged', { 
          testCode: testCode, 
          status: 'started' 
        });
        
        await loadExams(); // Refresh the list
        Swal.fire('Success!', 'Exam has been started.', 'success');
      } catch (error) {
        Swal.fire('Error!', error.message, 'error');
      }
    };

    const stopExam = async (testCode) => {
      try {
        await stopExamApi(testCode);
        
        // Emit socket event for exam stop
        socket.value.emit('examStatusChanged', { 
          testCode: testCode, 
          status: 'stopped' 
        });
        
        await loadExams(); // Refresh the list
        Swal.fire('Success!', 'Exam has been stopped.', 'success');
      } catch (error) {
        Swal.fire('Error!', error.message, 'error');
      }
    };

    const viewResults = (exam) => {
      router.push({
        path: `/exam-results/${exam.id}`,
        query: { 
          title: exam.examTitle,
          testCode: exam.testCode
        }
      });
    };

    const previewExam = (exam) => {
      router.push(`/preview-exam/${exam.id}`);
    };

    const downloadTemplate = () => {
      generateExamTemplate();
    };

    const handleImport = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const examData = await parseExcelFile(file);
        
        // Validate questions format
        if (!examData.questions || !Array.isArray(examData.questions)) {
          throw new Error('Invalid questions format');
        }

        // Validate that we have at least one question
        if (examData.questions.length === 0) {
          throw new Error('No questions found in the Excel file');
        }

        // Ensure all values are strings and convert to uppercase where needed
        const testCode = String(examData.testCode || '').toUpperCase();
        const classCode = String(examData.classCode || '').toUpperCase();
        const examTitle = String(examData.examTitle || '').toUpperCase();

        // Validate required fields
        if (!testCode || !classCode || !examTitle) {
          throw new Error('Test Code, Class Code, and Exam Title are required');
        }

        // Validate question structure
        const validatedQuestions = examData.questions.map((q, index) => {
          if (!q.questionText || !q.questionType || !q.correctAnswer) {
            throw new Error(`Invalid question format at question ${index + 1}`);
          }

          return {
            questionText: String(q.questionText).trim(),
            questionType: String(q.questionType).trim(),
            options: Array.isArray(q.options) ? q.options.map(opt => String(opt).trim()) : [],
            correctAnswer: String(q.correctAnswer).trim()
          };
        });

        // Create the exam with proper structure
        await createExam(
          testCode,
          classCode,
          examTitle,
          validatedQuestions,
          localStorage.getItem('userId'),
          true // isDraft
        );

        await loadExams();
        Swal.fire({
          title: 'Success',
          text: 'Exam imported successfully',
          icon: 'success',
          confirmButtonColor: '#4CAF50'
        });
      } catch (error) {
        console.error('Import error:', error);
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to import exam',
          icon: 'error',
          confirmButtonColor: '#f44336'
        });
      } finally {
        // Reset file input
        event.target.value = '';
      }
    };

    const exportExam = (exam) => {
      exportExamToExcel(exam);
    };

    const openAccessModal = async (exam) => {
      selectedExam.value = exam;
      showAccessModal.value = true;
      
      // Reset form values
      newAccessGrade.value = '';
      newAccessSection.value = '';
      accessSections.value = [];
      
      // Load grade sections if not already loaded
      if (availableGrades.value.length === 0) {
        await loadGradeSections();
      }
      
      // Load current access settings for this exam
      await loadExamAccess(exam.id);
    };

    const closeAccessModal = () => {
      isClosing.value = true;
      setTimeout(() => {
        showAccessModal.value = false;
        isClosing.value = false;
      }, 300); // Match this with your animation duration
    };

    const toggleAccessRestriction = () => {
      if (!restrictAccess.value) {
        // When switching to open access, clear the sections list
        accessSections.value = [];
      }
    };

    const loadSectionsForGrade = () => {
      newAccessSection.value = '';
    };

    const addAccessSection = () => {
      if (!newAccessGrade.value || !newAccessSection.value) return;

      // Check if section already exists in access list
      const exists = accessSections.value.some(
        s => s.grade === newAccessGrade.value && s.section === newAccessSection.value
      );

      if (exists) {
        Swal.fire({
          icon: 'warning',
          title: 'Section Already Added',
          text: `Grade ${newAccessGrade.value} Section ${newAccessSection.value} is already in the list`
        });
        return;
      }

      // Add new section to access list
      accessSections.value.push({
        examId: selectedExam.value.id,
        grade: newAccessGrade.value,
        section: newAccessSection.value,
        isEnabled: true
      });

      // Reset section input only, keep grade for adding multiple sections
      newAccessSection.value = '';
    };

    const removeAccessSection = (index) => {
      accessSections.value.splice(index, 1);
    };

    const saveAccessSettings = async () => {
      try {
        if (!restrictAccess.value) {
          // If not restricting access, remove all access settings
          await setExamAccess(selectedExam.value.id, []);
          Swal.fire({
            icon: 'success',
            title: 'Access Updated',
            text: 'Exam access is now open to all students'
          });
          closeAccessModal();
          return;
        }
        
        // If restricting but no sections added
        if (accessSections.value.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'No Sections Added',
            text: 'Please add at least one section or disable access restriction'
          });
          return;
        }
        
        // Prepare data for the API
        const gradeAccess = accessSections.value.map(section => ({
          examId: selectedExam.value.id,
          grade: section.grade,
          section: section.section,
          isEnabled: true
        }));
        
        // Save access settings
        await setExamAccess(selectedExam.value.id, gradeAccess);
        
        Swal.fire({
          icon: 'success',
          title: 'Access Updated',
          text: 'Exam access settings have been updated'
        });
        
        closeAccessModal();
      } catch (error) {
        console.error('Error saving exam access:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to save exam access settings'
        });
      }
    };

    const loadGradeSections = async () => {
      try {
        const { gradeSections } = await getAllGradeSections();
        console.log('Fetched grade sections:', gradeSections);

        if (gradeSections && gradeSections.length > 0) {
          // Get unique grades
          availableGrades.value = [...new Set(gradeSections.map(gs => gs.grade))]
            .sort((a, b) => a - b);

          // Store all sections with their grades
          availableSections.value = gradeSections.map(gs => ({
            id: gs.id,
            grade: gs.grade,
            section: gs.section
          }));

          console.log('Available grades:', availableGrades.value);
          console.log('Available sections:', availableSections.value);
        }
      } catch (error) {
        console.error('Error loading grade sections:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load grade sections'
        });
      }
    };

    const loadExamAccess = async (examId) => {
      try {
        const response = await getExamAccess(examId);
        
        if (response && response.access) {
          // If there are access settings, then the exam has restricted access
          if (response.access.length > 0) {
            restrictAccess.value = true;
            accessSections.value = response.access.map(access => ({
              examId: access.examId,
              grade: access.grade,
              section: access.section,
              isEnabled: access.isEnabled
            }));
          } else {
            // No access settings means open access
            restrictAccess.value = false;
            accessSections.value = [];
          }
        }
      } catch (error) {
        console.error('Error loading exam access settings:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load exam access settings'
        });
      }
    };

    // Clean up socket listeners on component unmount
    onUnmounted(() => {
      if (socket.value) {
        // No need to disconnect, just remove any listeners if needed
        socket.value.off('examStatusUpdate');
      }
    });

    // Computed property to filter sections based on selected grade
    const availableSectionsForGrade = computed(() => {
      if (!newAccessGrade.value) return [];
      
      // Filter sections for selected grade
      return availableSections.value
        .filter(gs => gs.grade === parseInt(newAccessGrade.value))
        .map(gs => gs.section);
    });

    return {
      exams,
      loading,
      error,
      loadExams,
      formatStatus,
      calculateAverageScore,
      editExam,
      confirmDelete,
      startExam,
      stopExam,
      viewResults,
      previewExam,
      downloadTemplate,
      handleImport,
      exportExam,
      showAccessModal,
      selectedExam,
      restrictAccess,
      newAccessGrade,
      newAccessSection,
      accessSections,
      availableGrades,
      availableSections,
      availableSectionsForGrade,
      openAccessModal,
      closeAccessModal,
      toggleAccessRestriction,
      loadSectionsForGrade,
      addAccessSection,
      removeAccessSection,
      saveAccessSettings,
      isClosing
    };
  }
};
</script>

<style scoped>
.manage-exams {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.template-btn,
.import-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.3s;
}

.template-btn {
  background-color: #e3f2fd;
  color: #1976d2;
  border: 1px solid #bbdefb;
}

.template-btn:hover {
  background-color: #bbdefb;
}

.import-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.import-btn:hover {
  background-color: #eeeeee;
}

.create-btn {
  background-color: #4CAF50;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s;
}

.create-btn:hover {
  background-color: #45a049;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading-state i,
.error-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #666;
}

.error-state {
  color: #d32f2f;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.exams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.exam-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.exam-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.exam-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.exam-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.draft {
  background-color: #e3f2fd;
  color: #1976d2;
}

.status-badge.pending {
  background-color: #fff3e0;
  color: #f57c00;
}

.status-badge.started {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.stopped {
  background-color: #fafafa;
  color: #616161;
}

.exam-details {
  margin: 1rem 0;
}

.exam-details p {
  margin: 0.5rem 0;
  color: #666;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.exam-details i {
  width: 20px;
  color: #999;
}

.exam-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1rem 0;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat {
  text-align: center;
}

.stat .label {
  display: block;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.stat .value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.exam-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.exam-actions button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: background-color 0.3s;
}

.edit-btn {
  background-color: #2196f3;
  color: white;
}

.edit-btn:hover {
  background-color: #1976d2;
}

.start-btn {
  background-color: #4caf50;
  color: white;
}

.start-btn:hover {
  background-color: #43a047;
}

.stop-btn {
  background-color: #f44336;
  color: white;
}

.stop-btn:hover {
  background-color: #d32f2f;
}

.delete-btn {
  background-color: #ff5252;
  color: white;
}

.delete-btn:hover {
  background-color: #d50000;
}

.results-btn {
  background-color: #9c27b0;
  color: white;
}

.results-btn:hover {
  background-color: #7b1fa2;
}

.results-btn:disabled {
  background-color: #e1bee7;
  cursor: not-allowed;
}

.preview-btn {
  background-color: #673ab7;
  color: white;
}

.preview-btn:hover {
  background-color: #5e35b1;
}

.export-btn {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: background-color 0.3s;
}

.export-btn:hover {
  background-color: #c8e6c9;
}

.action-btn {
  background-color: #9c27b0;
  color: white;
}

.action-btn:hover {
  background-color: #7b1fa2;
}

.modal-backdrop {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 100;
  height: 100vh;
}

.access-modal {
  width: 100%;
  max-width: 800px;
  max-height: 80vh;
  background: white;
  border-radius: 20px 20px 0 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-closing {
  animation: slideDown 0.3s ease-in;
}

@keyframes slideDown {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(100%);
  }
}

.modal-header {
  position: sticky;
  top: 0;
  background: white;
  padding: 1.25rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 20px 20px 0 0;
  z-index: 1;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modal-header .material-icons-round {
  color: #5e35b1;
}

.close-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #f5f5f5;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
  color: #333;
}

.modal-handle {
  width: 40px;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  margin: 0.5rem auto;
}

.modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  z-index: 1;
}

.access-exam-info {
  background-color: #fff;
  padding: 1.25rem;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  margin-bottom: 1rem;
}

.access-exam-info h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1.1rem;
  color: #333;
}

.exam-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #616161;
}

.meta-item .material-icons-round {
  font-size: 18px;
  color: #673ab7;
}

.access-control-section {
  background-color: #fff;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  padding: 1.25rem;
}

.access-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.access-type-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-state {
  font-weight: 500;
  font-size: 0.9rem;
  color: #673ab7;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #673ab7;
}

input:focus + .slider {
  box-shadow: 0 0 1px #673ab7;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.access-description {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
}

.description-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #e0e0e0;
  flex-shrink: 0;
}

.description-icon .material-icons-round {
  color: #555;
  font-size: 20px;
}

.description-text p {
  margin: 0;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.5;
}

.section-access-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-form-card, .section-list-card {
  background-color: #fff;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  padding: 1.25rem;
}

.section-form-card h4, .section-list-card h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-form-card h4 .material-icons-round {
  color: #4CAF50;
}

.section-list-card h4 .material-icons-round {
  color: #2196F3;
}

.form-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.85rem;
  color: #555;
  font-weight: 500;
}

.form-select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #333;
  background-color: #fff;
  transition: border-color 0.2s;
}

.form-select:focus {
  border-color: #673ab7;
  outline: none;
}

.form-select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-action {
  display: flex;
  align-items: flex-end;
}

.add-section-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  background-color: #4CAF50;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-section-btn:hover:not(:disabled) {
  background-color: #3d8b40;
  transform: translateY(-2px);
}

.add-section-btn:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-count {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.empty-sections {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background-color: #f5f5f5;
  border-radius: 8px;
  text-align: center;
}

.empty-sections .material-icons-round {
  font-size: 40px;
  color: #bdbdbd;
  margin-bottom: 0.75rem;
}

.empty-sections p {
  margin: 0;
  color: #757575;
}

.empty-hint {
  font-size: 0.85rem;
  margin-top: 0.5rem !important;
}

.sections-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.section-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.section-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.grade-badge {
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.section-name {
  font-weight: 500;
  color: #333;
}

.remove-section-btn {
  background: none;
  border: none;
  color: #f44336;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-section-btn:hover {
  background-color: #ffebee;
}

.cancel-btn, .save-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.cancel-btn:hover {
  background-color: #e0e0e0;
}

.save-btn {
  background-color: #673ab7;
  color: white;
}

.save-btn:hover {
  background-color: #5e35b1;
  transform: translateY(-2px);
}

.action-btn.access-btn {
  background: #673ab7;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.access-btn:hover {
  background: #5e35b1;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .manage-exams {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .template-btn,
  .import-btn,
  .create-btn {
    width: 100%;
    justify-content: center;
  }

  .exam-actions {
    flex-direction: column;
  }

  .exam-actions button {
    width: 100%;
  }

  .form-row {
    flex-direction: column;
    gap: 1rem;
  }
  
  .add-section-btn {
    width: 100%;
    justify-content: center;
  }
  
  .section-form-card, 
  .section-list-card {
    padding: 1rem;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
    gap: 0.75rem;
  }
  
  .save-btn, 
  .cancel-btn {
    width: 100%;
    justify-content: center;
  }
  
  .access-type-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .access-modal {
    max-height: 90vh;
  }

  .modal-footer {
    padding: 1rem;
  }
}
</style> 