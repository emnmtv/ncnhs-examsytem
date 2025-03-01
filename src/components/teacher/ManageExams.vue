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
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  fetchTeacherExams, 
  deleteExam, 
  startExam as startExamApi, 
  stopExam as stopExamApi,
  createExam
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

    // Initialize socket connection
    onMounted(() => {
      socket.value = socketManager.getSocket();
      loadExams();
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

    // Clean up socket listeners on component unmount
    onUnmounted(() => {
      if (socket.value) {
        // No need to disconnect, just remove any listeners if needed
        socket.value.off('examStatusUpdate');
      }
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
      exportExam
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
}
</style> 