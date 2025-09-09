<template>
  <div class="archived-exam-results">
    <div class="header-container">
      <div class="header-content">
        <h1>Archived Results<span class="material-icons">archive</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Manage and restore archived exam results</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="refreshData" class="refresh-btn" :disabled="loading">
          <span class="material-icons">refresh</span>
          Refresh
        </button>
      </div>
      <div class="header-background">ARCHIVE</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading archived exam results...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="fetchArchivedResults" class="retry-btn">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="archivedResults.length === 0" class="empty-state">
      <span class="material-icons-round">archive</span>
      <h3>No Archived Results</h3>
      <p>There are no archived exam results to display.</p>
    </div>

    <!-- Results List -->
    <div v-else class="results-container">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-icon">
            <span class="material-icons">archive</span>
          </div>
          <div class="summary-info">
            <h3>{{ archivedResults.length }}</h3>
            <p>Total Archived</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">
            <span class="material-icons">restore</span>
          </div>
          <div class="summary-info">
            <h3>{{ restoredCount }}</h3>
            <p>Restored Today</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">
            <span class="material-icons">pending</span>
          </div>
          <div class="summary-info">
            <h3>{{ pendingCount }}</h3>
            <p>Pending Review</p>
          </div>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="table-controls">
        <div class="search-container">
          <span class="material-icons search-icon">search</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search by student name, exam title, or class code..." 
            class="search-input"
          />
          <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="filter-container">
          <select v-model="selectedExam" class="exam-filter">
            <option value="">All Exams</option>
            <option v-for="exam in uniqueExams" :key="exam.id" :value="exam.id">
              {{ exam.examTitle }} ({{ exam.classCode }})
            </option>
          </select>
          <select v-model="selectedGrade" class="grade-filter">
            <option value="">All Grades</option>
            <option v-for="grade in uniqueGrades" :key="grade" :value="grade">
              Grade {{ grade }}
            </option>
          </select>
        </div>
      </div>

      <!-- Results Table -->
      <div class="table-container">
        <table class="archived-table">
          <thead>
            <tr>
              <th class="col-number">#</th>
              <th class="col-student">Student</th>
              <th class="col-exam">Exam</th>
              <th class="col-class">Class</th>
              <th class="col-score">Score</th>
              <th class="col-date">Archived Date</th>
              <th class="col-reason">Reason</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(result, index) in filteredResults" :key="result.id" class="result-row">
              <td class="col-number">{{ index + 1 }}</td>
              <td class="col-student">
                <div class="student-info">
                  <span class="name">{{ result.studentName }}</span>
                  <span class="lrn">LRN: {{ result.studentLRN }}</span>
                </div>
              </td>
              <td class="col-exam">
                <div class="exam-info">
                  <span class="exam-title">{{ result.examTitle }}</span>
                  <span class="exam-code">Code: {{ result.testCode }}</span>
                </div>
              </td>
              <td class="col-class">Grade {{ result.gradeLevel }} - {{ result.section }}</td>
              <td class="col-score">
                <div class="score-display">
                  <span class="score-percentage" :class="getScoreClass(result.score?.percentage || 0)">
                    {{ result.score?.percentage || 'N/A' }}%
                  </span>
                  <span class="score-details">{{ result.score?.score || 'N/A' }}/{{ result.score?.total || 'N/A' }}</span>
                </div>
              </td>
              <td class="col-date">
                <div class="date-info">
                  <span class="archive-date">{{ formatDate(result.archivedAt) }}</span>
                  <span class="archive-time">{{ formatTime(result.archivedAt) }}</span>
                </div>
              </td>
              <td class="col-reason">{{ result.archiveReason || 'No reason provided' }}</td>
              <td class="col-actions">
                <div class="action-buttons">
                  <button 
                    @click="viewDetails(result)" 
                    class="action-btn view-btn"
                    title="View Details"
                  >
                    <span class="material-icons">visibility</span>
                  </button>
                  <button 
                    @click="confirmRestore(result)" 
                    class="action-btn restore-btn"
                    title="Restore Result"
                    :disabled="isRestoring"
                  >
                    <span class="material-icons">restore</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer -->
      <div class="table-footer">
        <p class="results-count">
          Showing {{ filteredResults.length }} of {{ archivedResults.length }} archived results
        </p>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button 
          class="page-btn" 
          :disabled="currentPage === 1"
          @click="currentPage = 1"
        >
          <span class="material-icons-round">first_page</span>
        </button>
        <button 
          class="page-btn" 
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <span class="material-icons-round">chevron_left</span>
        </button>
        
        <div class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </div>
        
        <button 
          class="page-btn" 
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          <span class="material-icons-round">chevron_right</span>
        </button>
        <button 
          class="page-btn" 
          :disabled="currentPage === totalPages"
          @click="currentPage = totalPages"
        >
          <span class="material-icons-round">last_page</span>
        </button>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Archived Result Details</h3>
          <button @click="closeDetailsModal" class="close-btn">
            <span class="material-icons-round">close</span>
          </button>
        </div>
        
        <div class="modal-body" v-if="selectedResult">
          <div class="details-grid">
            <div class="detail-section">
              <h4>Student Information</h4>
              <div class="detail-item">
                <span class="label">Name:</span>
                <span class="value">{{ selectedResult.studentName }}</span>
              </div>
              <div class="detail-item">
                <span class="label">LRN:</span>
                <span class="value">{{ selectedResult.studentLRN }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Grade & Section:</span>
                <span class="value">Grade {{ selectedResult.gradeLevel }} - {{ selectedResult.section }}</span>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>Exam Information</h4>
              <div class="detail-item">
                <span class="label">Title:</span>
                <span class="value">{{ selectedResult.examTitle }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Test Code:</span>
                <span class="value">{{ selectedResult.testCode }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Class Code:</span>
                <span class="value">{{ selectedResult.classCode }}</span>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>Score Information</h4>
              <div class="detail-item">
                <span class="label">Score:</span>
                <span class="value">{{ selectedResult.score?.score || 'N/A' }}/{{ selectedResult.score?.total || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Percentage:</span>
                <span class="value" :class="getScoreClass(selectedResult.score?.percentage || 0)">
                  {{ selectedResult.score?.percentage || 'N/A' }}%
                </span>
              </div>
              <div class="detail-item">
                <span class="label">Submitted:</span>
                <span class="value">{{ selectedResult.score?.submittedAt ? formatDateTime(selectedResult.score.submittedAt) : 'N/A' }}</span>
              </div>
            </div>
            
            <div class="detail-section">
              <h4>Archive Information</h4>
              <div class="detail-item">
                <span class="label">Archived Date:</span>
                <span class="value">{{ formatDateTime(selectedResult.archivedAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Reason:</span>
                <span class="value">{{ selectedResult.archiveReason || 'No reason provided' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeDetailsModal" class="btn btn-secondary">Close</button>
          <button @click="confirmRestore(selectedResult)" class="btn btn-primary" :disabled="isRestoring">
            <span class="material-icons-round">restore</span>
            Restore Result
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getArchivedExamResults, restoreArchivedExamResult } from '@/services/authService';

export default {
  name: 'ArchivedExamResults',
  setup() {
    const loading = ref(true);
    const error = ref(null);
    const archivedResults = ref([]);
    const searchQuery = ref('');
    const selectedExam = ref('');
    const selectedGrade = ref('');
    const currentPage = ref(1);
    const itemsPerPage = ref(10);
    const isRestoring = ref(false);
    const showDetailsModal = ref(false);
    const selectedResult = ref(null);

    // Computed properties
    const uniqueExams = computed(() => {
      const exams = new Map();
      archivedResults.value.forEach(result => {
        const exam = {
          id: result.originalExamId,
          examTitle: result.examTitle,
          classCode: result.classCode
        };
        if (!exams.has(exam.id)) {
          exams.set(exam.id, exam);
        }
      });
      return Array.from(exams.values());
    });

    const uniqueGrades = computed(() => {
      const grades = new Set();
      archivedResults.value.forEach(result => {
        grades.add(result.gradeLevel);
      });
      return Array.from(grades).sort();
    });

    const filteredResults = computed(() => {
      let filtered = archivedResults.value;

      // Search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(result => 
          result.studentName.toLowerCase().includes(query) ||
          result.examTitle.toLowerCase().includes(query) ||
          result.classCode.toLowerCase().includes(query) ||
          result.studentLRN.toLowerCase().includes(query)
        );
      }

      // Exam filter
      if (selectedExam.value) {
        filtered = filtered.filter(result => result.originalExamId === selectedExam.value);
      }

      // Grade filter
      if (selectedGrade.value) {
        filtered = filtered.filter(result => result.gradeLevel === selectedGrade.value);
      }

      // Pagination
      const start = (currentPage.value - 1) * itemsPerPage.value;
      const end = start + itemsPerPage.value;
      return filtered.slice(start, end);
    });

    const totalPages = computed(() => {
      let filtered = archivedResults.value;

      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(result => 
          result.studentName.toLowerCase().includes(query) ||
          result.examTitle.toLowerCase().includes(query) ||
          result.classCode.toLowerCase().includes(query) ||
          result.studentLRN.toLowerCase().includes(query)
        );
      }

      if (selectedExam.value) {
        filtered = filtered.filter(result => result.originalExamId === selectedExam.value);
      }

      if (selectedGrade.value) {
        filtered = filtered.filter(result => result.gradeLevel === selectedGrade.value);
      }

      return Math.ceil(filtered.length / itemsPerPage.value);
    });

    // Methods
    const fetchArchivedResults = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        const response = await getArchivedExamResults();
        archivedResults.value = response || [];
        
        console.log('Fetched archived results:', archivedResults.value);
      } catch (err) {
        console.error('Error fetching archived results:', err);
        error.value = err.message || 'Failed to load archived exam results';
      } finally {
        loading.value = false;
      }
    };

    const refreshData = () => {
      fetchArchivedResults();
    };

    const clearFilters = () => {
      searchQuery.value = '';
      selectedExam.value = '';
      selectedGrade.value = '';
      currentPage.value = 1;
    };

    const clearSearch = () => {
      searchQuery.value = '';
    };

    // Computed properties for summary cards
    const restoredCount = computed(() => {
      const today = new Date().toDateString();
      return archivedResults.value.filter(result => {
        if (!result.restoredAt) return false;
        return new Date(result.restoredAt).toDateString() === today;
      }).length;
    });

    const pendingCount = computed(() => {
      return archivedResults.value.filter(result => !result.restoredAt).length;
    });

    const confirmRestore = async (result) => {
      const Swal = require('sweetalert2');
      
      const confirmed = await Swal.fire({
        title: 'Restore Exam Result?',
        html: `
          <p>Are you sure you want to restore this exam result?</p>
          <div style="text-align: left; margin: 1rem 0;">
            <strong>Student:</strong> ${result.studentName}<br>
            <strong>Exam:</strong> ${result.examTitle}<br>
            <strong>Score:</strong> ${result.score?.percentage || 'N/A'}%
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Restore',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#6b7280'
      });

      if (confirmed.isConfirmed) {
        await restoreResult(result.id);
      }
    };

    const restoreResult = async (archivedResultId) => {
      try {
        isRestoring.value = true;
        
        await restoreArchivedExamResult(archivedResultId);
        
        const Swal = require('sweetalert2');
        await Swal.fire({
          title: 'Success!',
          text: 'Exam result has been restored successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#10b981'
        });

        // Refresh the data
        await fetchArchivedResults();
        
        // Close modal if open
        if (showDetailsModal.value) {
          closeDetailsModal();
        }
        
      } catch (err) {
        console.error('Error restoring result:', err);
        
        const Swal = require('sweetalert2');
        await Swal.fire({
          title: 'Restore Failed',
          text: err.message || 'Failed to restore exam result. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#ef4444'
        });
      } finally {
        isRestoring.value = false;
      }
    };

    const viewDetails = (result) => {
      selectedResult.value = result;
      showDetailsModal.value = true;
    };

    const closeDetailsModal = () => {
      showDetailsModal.value = false;
      selectedResult.value = null;
    };

    const getScoreClass = (percentage) => {
      if (percentage >= 90) return 'excellent';
      if (percentage >= 80) return 'good';
      if (percentage >= 70) return 'average';
      return 'needs-improvement';
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const formatTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatDateTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Lifecycle
    onMounted(() => {
      fetchArchivedResults();
      
      // Check if we came from Exam Results page and apply exam filter
      const route = useRoute();
      if (route.query.examId) {
        selectedExam.value = parseInt(route.query.examId);
      }
      
      // Load Material Icons if not already loaded
      if (!document.getElementById('material-icons')) {
        const link = document.createElement('link');
        link.id = 'material-icons';
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    });

    return {
      loading,
      error,
      archivedResults,
      searchQuery,
      selectedExam,
      selectedGrade,
      currentPage,
      itemsPerPage,
      isRestoring,
      showDetailsModal,
      selectedResult,
      uniqueExams,
      uniqueGrades,
      filteredResults,
      totalPages,
      restoredCount,
      pendingCount,
      fetchArchivedResults,
      refreshData,
      clearFilters,
      clearSearch,
      confirmRestore,
      restoreResult,
      viewDetails,
      closeDetailsModal,
      getScoreClass,
      formatDate,
      formatTime,
      formatDateTime
    };
  }
};
</script>

<style scoped>
.archived-exam-results {
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
  gap: 10px;
}

.header-content h1 .material-icons {
  font-size: 2.5rem;
  color: #159750;
}

.divider {
  width: 60px;
  height: 4px;
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  border-radius: 2px;
  margin-bottom: 1rem;
}

.header-text .subtitle {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.header-actions {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(21, 151, 80, 0.3);
}

.refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(21, 151, 80, 0.4);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.header-background {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  font-size: 8rem;
  font-weight: 900;
  color: rgba(21, 151, 80, 0.05);
  z-index: 0;
  pointer-events: none;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loader {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #159750;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state .material-icons-round, 
.empty-state .material-icons-round {
  font-size: 48px;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
}

.results-container {
  background: transparent;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-icon {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-icon .material-icons {
  font-size: 1.5rem;
}

.summary-info h3 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #159750;
  margin: 0 0 4px 0;
}

.summary-info p {
  color: #666;
  margin: 0;
  font-size: 0.9rem;
}

/* Table Controls */
.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 40px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #159750;
  box-shadow: 0 0 0 3px rgba(21, 151, 80, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background: #f0f0f0;
  color: #666;
}

.filter-container {
  display: flex;
  gap: 12px;
}

.exam-filter, .grade-filter {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  min-width: 150px;
  transition: all 0.3s ease;
}

.exam-filter:focus, .grade-filter:focus {
  outline: none;
  border-color: #159750;
  box-shadow: 0 0 0 3px rgba(21, 151, 80, 0.1);
}

/* Table Container */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.archived-table {
  width: 100%;
  border-collapse: collapse;
}

.archived-table th {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.archived-table th:first-child {
  border-top-left-radius: 12px;
}

.archived-table th:last-child {
  border-top-right-radius: 12px;
}

.archived-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.result-row:hover {
  background: #f8f9fa;
}

.col-number {
  width: 60px;
  text-align: center;
  font-weight: 600;
  color: #666;
}

.col-student {
  min-width: 200px;
}

.student-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-info .name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.student-info .lrn {
  font-size: 0.8rem;
  color: #666;
}

.col-exam {
  min-width: 180px;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.exam-info .exam-title {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.exam-info .exam-code {
  font-size: 0.8rem;
  color: #666;
}

.col-class {
  font-weight: 500;
  color: #333;
}

.col-score {
  text-align: center;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.score-percentage {
  font-size: 1rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 12px;
  color: white;
  min-width: 60px;
  text-align: center;
}

.score-percentage.excellent {
  background: #10b981;
}

.score-percentage.good {
  background: #3b82f6;
}

.score-percentage.average {
  background: #f59e0b;
}

.score-percentage.needs-improvement {
  background: #ef4444;
}

.score-details {
  font-size: 0.8rem;
  color: #666;
}

.col-date {
  min-width: 120px;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.archive-date {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.archive-time {
  font-size: 0.8rem;
  color: #666;
}

.col-reason {
  color: #666;
  font-style: italic;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-actions {
  width: 100px;
}

.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.view-btn:hover {
  background: #bbdefb;
}

.restore-btn {
  background: #e8f5e8;
  color: #159750;
}

.restore-btn:hover:not(:disabled) {
  background: #c8e6c9;
}

.restore-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Table Footer */
.table-footer {
  background: #f8f9fa;
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}

.results-count {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  gap: 0.5rem;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:not(:disabled):hover {
  background: #f3f4f6;
}

.page-info {
  padding: 0 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.details-grid {
  display: grid;
  gap: 1.5rem;
}

.detail-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  font-weight: 500;
  color: #6b7280;
}

.detail-item .value {
  color: #1f2937;
  text-align: right;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #10b981;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #059669;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .summary-cards {
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .summary-card {
    padding: 16px;
    gap: 12px;
  }
  
  .summary-icon {
    width: 45px;
    height: 45px;
  }
  
  .summary-icon .material-icons {
    font-size: 1.3rem;
  }
  
  .summary-info h3 {
    font-size: 1.6rem;
  }
  
  .table-controls {
    margin-bottom: 16px;
    gap: 16px;
  }
  
  .search-input {
    padding: 10px 14px 10px 40px;
    font-size: 0.9rem;
  }
  
  .exam-filter, .grade-filter {
    padding: 10px 14px;
    font-size: 0.9rem;
    min-width: 140px;
  }
  
  .archived-table th {
    padding: 14px 10px;
    font-size: 0.85rem;
  }
  
  .archived-table td {
    padding: 14px 10px;
  }
  
  .student-info .name {
    font-size: 0.9rem;
  }
  
  .student-info .lrn {
    font-size: 0.75rem;
  }
  
  .exam-info .exam-title {
    font-size: 0.9rem;
  }
  
  .exam-info .exam-code {
    font-size: 0.75rem;
  }
}

@media (max-width: 768px) {
  .archived-exam-results {
    padding: 1rem;
  }
  
  .header-container {
    margin-bottom: 20px;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-background {
    font-size: 6rem;
  }
  
  .summary-cards {
    gap: 14px;
    margin-bottom: 20px;
  }
  
  .summary-card {
    padding: 14px;
    gap: 10px;
  }
  
  .summary-icon {
    width: 40px;
    height: 40px;
  }
  
  .summary-icon .material-icons {
    font-size: 1.2rem;
  }
  
  .summary-info h3 {
    font-size: 1.4rem;
  }
  
  .table-controls {
    margin-bottom: 14px;
    gap: 14px;
  }
  
  .search-input {
    padding: 9px 12px 9px 38px;
    font-size: 0.85rem;
  }
  
  .exam-filter, .grade-filter {
    padding: 9px 12px;
    font-size: 0.85rem;
    min-width: 120px;
  }
  
  .archived-table th {
    padding: 12px 8px;
    font-size: 0.8rem;
  }
  
  .archived-table td {
    padding: 12px 8px;
  }
  
  .student-info .name {
    font-size: 0.85rem;
  }
  
  .student-info .lrn {
    font-size: 0.7rem;
  }
  
  .exam-info .exam-title {
    font-size: 0.85rem;
  }
  
  .exam-info .exam-code {
    font-size: 0.7rem;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
  }
}

@media (max-width: 480px) {
  .summary-cards {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .summary-card {
    padding: 15px;
    gap: 12px;
  }

  .summary-icon {
    width: 40px;
    height: 40px;
  }

  .summary-icon .material-icons {
    font-size: 1.2rem;
  }

  .summary-info h3 {
    font-size: 1.4rem;
  }

  .table-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
  }

  .search-container {
    max-width: none;
  }

  .search-input {
    padding: 10px 12px 10px 40px;
    font-size: 0.9rem;
  }

  .filter-container {
    flex-direction: column;
    gap: 8px;
  }

  .exam-filter, .grade-filter {
    min-width: auto;
  }

  .table-container {
    overflow-x: auto;
    margin-bottom: 16px;
  }

  .archived-table {
    min-width: 600px;
  }

  .archived-table th,
  .archived-table td {
    padding: 12px 8px;
    font-size: 0.85rem;
  }

  .col-student {
    min-width: 150px;
  }

  .student-info .name {
    font-size: 0.9rem;
  }

  .student-info .lrn {
    font-size: 0.75rem;
  }

  .action-btn {
    width: 30px;
    height: 30px;
  }
}
</style>
