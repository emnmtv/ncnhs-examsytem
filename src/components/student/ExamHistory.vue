<template>
  <div class="exam-history-container">
    <div class="header-container">
      <div class="header-content">
        <h1>Exam History<span class="material-icons">history</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">View and review your past exams</p>
        </div>
      </div>
      <div class="header-background">HISTORY</div>
    </div>

    <div class="controls-section">
      <div class="view-toggle">
        <button 
          @click="currentView = 'grid'" 
          class="toggle-btn" 
          :class="{ active: currentView === 'grid' }"
        >
          <span class="material-icons-round">grid_view</span>
          Grid
        </button>
        <button 
          @click="currentView = 'table'" 
          class="toggle-btn" 
          :class="{ active: currentView === 'table' }"
        >
          <span class="material-icons-round">table_rows</span>
          Table
        </button>
      </div>
      <button @click="refreshHistory" class="refresh-btn">
        <span class="material-icons-round">refresh</span>
        Refresh
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
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
          <div class="exam-header">
            <div class="texture-layer"></div>
            <h2>{{ exam.exam.examTitle }}</h2>
            <div class="exam-meta">
              <span class="exam-meta-item">
                <i class="fas fa-chalkboard"></i> {{ exam.exam.classCode }}
              </span>
              <span class="exam-meta-item">
                <i class="fas fa-key"></i> {{ exam.exam.testCode }}
              </span>
              <span class="exam-meta-item">
                <i class="fas fa-calendar-alt"></i> {{ formatDate(exam.score.submittedAt) }}
              </span>
            </div>
          </div>
          
          <div class="exam-body">
            <div class="score-display">
              <div class="score-circle" :class="getScoreClass(exam.score.percentage)">
                <span class="score-percentage">{{ exam.score.percentage }}%</span>
              </div>
              <div class="score-details">
                <p>You got <strong>{{ exam.score.score }}</strong> out of <strong>{{ exam.score.total }}</strong> questions correct.</p>
                <p class="score-message">{{ getScoreMessage(exam.score.percentage) }}</p>
              </div>
            </div>
          </div>
          
          <div class="exam-actions">
            <button class="view-details-btn" @click.stop="viewExamDetails(getOriginalIndex(index))">
              <i class="fas fa-eye"></i>
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
                  <i class="fas fa-eye"></i>
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
    
    // Load FontAwesome if not already loaded
    if (!document.getElementById('fontawesome-css')) {
      const link = document.createElement('link');
      link.id = 'fontawesome-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
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
    
    getScoreMessage(percentage) {
      if (percentage >= 90) return 'Excellent!';
      if (percentage >= 80) return 'Good job!';
      if (percentage >= 70) return 'Well done!';
      return 'Keep practicing!';
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

.controls-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.view-toggle {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.toggle-btn.active {
  background-color: #159750;
  color: white;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #f5f5f5;
  border: none;
  border-radius: 8px;
  color: #333;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}

/* Loading, Error, Empty States */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #f9f9f9;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  min-height: 300px;
}

.loading-state .material-icons-round,
.error-state .material-icons-round,
.empty-state .material-icons-round {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-state .material-icons-round {
  color: #159750;
}

.error-state {
  background: #fff3f3;
}

.error-state .material-icons-round {
  color: #f44336;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #e53935;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.hint {
  color: #757575;
  margin-top: 0.5rem;
}

/* Exams Grid */
.exams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.exam-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.exam-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.exam-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Main paint swipe */
.exam-header::after {
  content: '';
  position: absolute;
  top: 0;
  right: -10%;
  width: 50%;
  height: 100%;
  background: linear-gradient(45deg, 
    transparent 0%,
    rgba(255, 255, 255, 0.05) 30%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 70%,
    transparent 100%
  );
  transform: skewX(-20deg);
  pointer-events: none;
}

/* Secondary paint swipe */
.exam-header::before {
  content: '';
  position: absolute;
  top: -20%;
  right: 20%;
  width: 30%;
  height: 200%;
  background: linear-gradient(45deg,
    transparent 0%,
    rgba(255, 255, 255, 0.02) 30%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.02) 70%,
    transparent 100%
  );
  transform: skewX(-35deg);
  pointer-events: none;
}

/* Additional texture layers */
.exam-header .texture-layer {
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

/* Hover animations */
.exam-header:hover::after {
  transform: skewX(-20deg) translateX(10px);
  transition: transform 0.3s ease;
}

.exam-header:hover::before {
  transform: skewX(-35deg) translateX(-10px);
  transition: transform 0.3s ease;
}

.exam-header h2 {
  margin: 0 0 10px 0;
  color: #f1f1f1;
  font-size: 1.5rem;
}

.exam-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.exam-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
  color: #fafafa;
  font-weight: 600;
}

.exam-body {
  padding: 20px;
  flex: 1;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 20px;
}

.score-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
}

.score-details {
  flex: 1;
}

.score-message {
  font-weight: 600;
  margin-top: 8px;
  font-size: 1.1rem;
}

.exam-actions {
  padding: 15px 20px;
  background: #f5f5f5;
  border-top: 1px solid #eee;
}

.view-details-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  width: 100%;
}

.view-details-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Table View Styles */
.exams-table-container {
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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

.exam-status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
}

.action-btn {
  background: none;
  border: none;
  color: #4CAF50;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.15s;
}

.action-btn:hover {
  background-color: rgba(76, 175, 80, 0.1);
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
  background-color: #4CAF50;
}

.good {
  background-color: #2196F3;
}

.average {
  background-color: #FF9800;
}

.needs-improvement {
  background-color: #F44336;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .exam-history-container {
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
  
  .controls-section {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .exams-grid {
    grid-template-columns: 1fr;
  }
  
  .score-display {
    flex-direction: column;
    text-align: center;
  }
  
  .score-circle {
    margin: 0 auto 15px;
  }
  
  .exams-table th:nth-child(3),
  .exams-table td:nth-child(3),
  .exams-table th:nth-child(4),
  .exams-table td:nth-child(4) {
    display: none;
  }
}
</style> 