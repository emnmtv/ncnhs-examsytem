<template>
  <div class="exam-history-container">
    <div class="content-header">
      <div class="left-section">
        <h1><span class="material-icons-round">history</span> Exam History</h1>
        <p class="subtitle">View and review your past exams</p>
      </div>
      <div class="right-section">
        <div class="controls">
          <div class="view-toggle">
            <button 
              @click="currentView = 'grid'" 
              class="toggle-btn" 
              :class="{ active: currentView === 'grid' }"
            >
              <span class="material-icons-round">grid_view</span>
            </button>
            <button 
              @click="currentView = 'table'" 
              class="toggle-btn" 
              :class="{ active: currentView === 'table' }"
            >
              <span class="material-icons-round">table_rows</span>
            </button>
          </div>
          <button @click="refreshHistory" class="refresh-btn">
            <span class="material-icons-round">refresh</span>
            Refresh
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loader"></div>
      <p>Loading your exam history...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="refreshHistory" class="retry-btn">Try Again</button>
    </div>
    
    <div v-else-if="examHistory.length === 0" class="empty-state">
      <span class="material-icons-round">inbox</span>
      <h3>No Exam History</h3>
      <p>You haven't taken any exams yet.</p>
    </div>
    
    <div v-else class="main-content">
      <!-- Grid View -->
      <div v-if="currentView === 'grid'" class="exams-grid">
        <div 
          v-for="(exam, index) in paginatedExams" 
          :key="index"
          class="exam-card"
          @click="viewExamDetails(getOriginalIndex(index))"
        >
          <div class="card-header">
            <span class="exam-status-badge" :class="getScoreClass(exam.score.percentage)">
              {{ exam.score.percentage }}%
            </span>
            <span class="date-badge">{{ formatDate(exam.score.submittedAt) }}</span>
          </div>
          
          <h3 class="exam-title">{{ exam.exam.examTitle }}</h3>
          
          <div class="exam-meta">
            <div class="meta-item">
              <span class="material-icons-round">school</span>
              <span>{{ exam.exam.classCode }}</span>
            </div>
            <div class="meta-item">
              <span class="material-icons-round">person</span>
              <span>{{ exam.exam.user.firstName }} {{ exam.exam.user.lastName }}</span>
            </div>
            <div class="meta-item">
              <span class="material-icons-round">quiz</span>
              <span>{{ exam.score.score }}/{{ exam.score.total }} correct</span>
            </div>
          </div>
          
          <div class="card-actions">
            <button class="view-details-btn" @click.stop="viewExamDetails(getOriginalIndex(index))">
              <span class="material-icons-round">visibility</span>
              View Details
            </button>
          </div>
        </div>
      </div>
      
      <!-- Table View -->
      <div v-else class="exams-table-container">
        <table class="exams-table">
          <thead>
            <tr>
              <th>Score</th>
              <th>Title</th>
              <th>Class Code</th>
              <th>Teacher</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(exam, index) in paginatedExams" :key="index">
              <td>
                <span class="exam-status-badge" :class="getScoreClass(exam.score.percentage)">
                  {{ exam.score.percentage }}%
                </span>
              </td>
              <td>{{ exam.exam.examTitle }}</td>
              <td>{{ exam.exam.classCode }}</td>
              <td>{{ exam.exam.user.firstName }} {{ exam.exam.user.lastName }}</td>
              <td>{{ formatDate(exam.score.submittedAt) }}</td>
              <td>
                <button class="action-btn" @click="viewExamDetails(getOriginalIndex(index))">
                  <span class="material-icons-round">visibility</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
  </div>
</template>

<script>
import { getStudentExamHistory } from '@/services/authService';

export default {
  name: 'ExamHistory',
  data() {
    return {
      loading: true,
      error: null,
      examHistory: [],
      currentView: 'grid', // 'grid' or 'table'
      currentPage: 1,
      itemsPerPage: 8
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.examHistory.length / this.itemsPerPage);
    },
    paginatedExams() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.examHistory.slice(start, end);
    }
  },
  mounted() {
    this.fetchExamHistory();
    
    // Load Material Icons if not already loaded
    if (!document.getElementById('material-icons')) {
      const link = document.createElement('link');
      link.id = 'material-icons';
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons+Round';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  },
  methods: {
    async fetchExamHistory() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await getStudentExamHistory();
        this.examHistory = response.examHistory;
        // Reset to first page when data changes
        this.currentPage = 1;
      } catch (error) {
        console.error('Error fetching exam history:', error);
        this.error = error.message || 'Failed to load exam history. Please try again later.';
      } finally {
        this.loading = false;
      }
    },
    
    refreshHistory() {
      this.fetchExamHistory();
    },
    
    viewExamDetails(index) {
      this.$router.push(`/exam-history/${index}`);
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    getScoreClass(percentage) {
      if (percentage >= 90) return 'excellent';
      if (percentage >= 80) return 'good';
      if (percentage >= 70) return 'average';
      return 'needs-improvement';
    },
    
    // Convert paginated index back to original index in the full array
    getOriginalIndex(paginatedIndex) {
      return ((this.currentPage - 1) * this.itemsPerPage) + paginatedIndex;
    }
  },
  watch: {
    // Reset to first page when switching views
    currentView() {
      this.currentPage = 1;
    }
  }
};
</script>

<style scoped>
.exam-history-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  font-family: 'Roboto', sans-serif;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.left-section h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toggle {
  display: flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background-color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  background-color: #4f46e5;
  color: white;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: none;
  border-radius: 6px;
  color: #555;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background-color: #e0e0e0;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.loading-state .loader {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4f46e5;
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

.error-state p, .empty-state p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #111827;
  margin-bottom: 0.5rem;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Grid View Styles */
.exams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.exam-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #f3f4f6;
  min-height: 250px;
}

.exam-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.07), 0 4px 6px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.exam-status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
}

.date-badge {
  font-size: 0.75rem;
  color: #6b7280;
}

.exam-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.exam-meta {
  margin-bottom: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #4b5563;
  font-size: 0.875rem;
}

.meta-item .material-icons-round {
  font-size: 1.25rem;
  color: #6b7280;
}

.card-actions {
  margin-top: auto;
}

.view-details-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-details-btn:hover {
  background-color: #4338ca;
}

/* Table View Styles */
.exams-table-container {
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
}

.exams-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.exams-table th {
  background-color: #f9fafb;
  color: #4b5563;
  font-weight: 600;
  padding: 12px 16px;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.exams-table td {
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
  color: #1f2937;
}

.exams-table tbody tr:hover {
  background-color: #f9fafb;
}

.action-btn {
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.action-btn:hover {
  background-color: rgba(79, 70, 229, 0.1);
}

/* Pagination Styles */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 0.5rem;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e0e0e0;
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:not(:disabled):hover {
  background-color: #f5f5f5;
}

.page-info {
  padding: 0 1rem;
  font-size: 0.875rem;
  color: #4b5563;
}

/* Score Classes */
.excellent {
  background-color: #10b981;
}

.good {
  background-color: #3b82f6;
}

.average {
  background-color: #f59e0b;
}

.needs-improvement {
  background-color: #ef4444;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .exam-history-container {
    padding: 16px;
  }
  
  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .left-section h1 {
    font-size: 1.5rem;
  }
  
  .exams-grid {
    grid-template-columns: 1fr;
  }
  
  .exams-table th:nth-child(3),
  .exams-table td:nth-child(3) {
    display: none;
  }
  
  .exams-table th:nth-child(5),
  .exams-table td:nth-child(5) {
    display: none;
  }
}
</style> 