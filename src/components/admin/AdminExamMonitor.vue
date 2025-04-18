<template>
  <div class="admin-exam-monitor">
    <div class="header-container">
      <div class="header-content">
        <h1>Exam Monitor<span class="material-icons">monitoring</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Monitor all exams across the school</p>
        </div>
      </div>
      <div class="header-background">MONITOR</div>
    </div>

    <!-- Controls Section -->
    <div class="controls-section">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input 
          :value="searchQuery"
          @input="debouncedSearch"
          type="text"
          placeholder="Search by title, code, teacher..."
        />
        <button 
          v-if="searchQuery" 
          @click="searchQuery = ''; handleSearch()" 
          class="clear-search"
        >
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="filter-controls">
        <select v-model="statusFilter">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="active">Active/In Progress</option>
          <option value="completed">Completed</option>
          <option value="stopped">Stopped</option>
        </select>
        
        <div class="view-toggle">
          <button 
            @click="currentView = 'table'" 
            class="view-btn" 
            :class="{ active: currentView === 'table' }"
          >
            <span class="material-icons">table_chart</span>
          </button>
          <button 
            @click="currentView = 'card'" 
            class="view-btn" 
            :class="{ active: currentView === 'card' }"
          >
            <span class="material-icons">grid_view</span>
          </button>
        </div>
        
        <button @click="refreshExams" class="refresh-btn">
          <span class="material-icons" :class="{ 'rotating': loading }">refresh</span>
          Refresh
        </button>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading exams data...</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="refreshExams" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>
    
    <!-- Empty State -->
    <div v-else-if="!exams.length" class="empty-state">
      <span class="material-icons-round">assignment</span>
      <p>No exams found</p>
      <p class="empty-subtext">There are no exams in the system yet.</p>
    </div>
    
    <!-- Card View -->
    <div v-else-if="currentView === 'card'" class="exams-card-grid">
      <div 
        v-for="exam in filteredSortedExams" 
        :key="exam.id" 
        class="exam-card"
      >
        <div class="exam-header" :class="exam.status">
          <h3 class="exam-title">{{ exam.examTitle }}</h3>
          <div class="test-code">{{ exam.testCode }}</div>
          <span class="status-indicator">{{ formatStatus(exam.status) }}</span>
        </div>
        
        <div class="exam-body">
          <div class="exam-teacher">
            <span class="material-icons">person</span>
            <span>{{ exam.teacher ? `${exam.teacher.firstName} ${exam.teacher.lastName}` : 'Unknown' }}</span>
          </div>
          
          <div class="exam-stats">
            <div class="stat-item">
              <span class="material-icons">help_outline</span>
              <div class="stat-content">
                <div class="stat-value">{{ exam.totalQuestions }}</div>
                <div class="stat-label">Questions</div>
              </div>
            </div>
            
            <div class="stat-item">
              <span class="material-icons">people</span>
              <div class="stat-content">
                <div class="stat-value">{{ exam.totalSubmissions }}</div>
                <div class="stat-label">Submissions</div>
              </div>
            </div>
            
            <div class="stat-item">
              <span class="material-icons">assessment</span>
              <div class="stat-content">
                <div class="stat-value">
                  <span v-if="exam.averageScore !== null">{{ exam.averageScore.toFixed(1) }}%</span>
                  <span v-else>-</span>
                </div>
                <div class="stat-label">Avg. Score</div>
              </div>
            </div>
          </div>
          
          <div class="access-section">
            <div class="section-label">Access:</div>
            <div class="access-chips">
              <span v-for="(access, i) in exam.accessSettings.slice(0, 3)" :key="i" class="access-chip">
                G{{ access.grade }}-{{ access.section }}
              </span>
              <span v-if="exam.accessSettings.length > 3" class="access-chip more">
                +{{ exam.accessSettings.length - 3 }}
              </span>
              <span v-if="exam.accessSettings.length === 0" class="access-chip none">
                No access set
              </span>
            </div>
          </div>
          
          <div class="card-date">
            <span class="material-icons">event</span>
            {{ formatDate(exam.createdAt) }}
          </div>
        </div>
        
        <div class="exam-footer">
          <button class="card-btn view" @click="viewResults(exam)">
            <span class="material-icons">assessment</span>
            Results
          </button>
          <button class="card-btn details" @click="viewDetails(exam)">
            <span class="material-icons">visibility</span>
            Details
          </button>
          <button 
            v-if="exam.status === 'active'" 
            class="card-btn stop" 
            @click="stopExam(exam)"
          >
            <span class="material-icons">stop_circle</span>
            Stop
          </button>
          <button class="card-btn mps" @click="viewMPS(exam)" v-if="exam.totalSubmissions > 0">
            <span class="material-icons">analytics</span>
            MPS
          </button>
        </div>
      </div>
    </div>
    
    <!-- Table View -->
    <div v-else class="exams-table-container">
      <table class="exams-table">
        <thead>
          <tr>
            <th @click="sortBy('testCode')">
              Test Code
              <span v-if="sortKey === 'testCode'" class="sort-icon material-icons">
                {{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
              </span>
            </th>
            <th @click="sortBy('examTitle')">
              Exam Title
              <span v-if="sortKey === 'examTitle'" class="sort-icon material-icons">
                {{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
              </span>
            </th>
            <th @click="sortBy('classCode')">
              Class Code
              <span v-if="sortKey === 'classCode'" class="sort-icon material-icons">
                {{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
              </span>
            </th>
            <th @click="sortBy('status')">
              Status
              <span v-if="sortKey === 'status'" class="sort-icon material-icons">
                {{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
              </span>
            </th>
            <th>Teacher</th>
            <th @click="sortBy('totalQuestions')">
              Questions
              <span v-if="sortKey === 'totalQuestions'" class="sort-icon material-icons">
                {{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
              </span>
            </th>
            <th @click="sortBy('totalSubmissions')">
              Submissions
              <span v-if="sortKey === 'totalSubmissions'" class="sort-icon material-icons">
                {{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
              </span>
            </th>
            <th @click="sortBy('averageScore')">
              Avg. Score
              <span v-if="sortKey === 'averageScore'" class="sort-icon material-icons">
                {{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
              </span>
            </th>
            <th @click="sortBy('createdAt')">
              Created
              <span v-if="sortKey === 'createdAt'" class="sort-icon material-icons">
                {{ sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
              </span>
            </th>
            <th>Access</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="exam in filteredSortedExams" :key="exam.id">
            <td>{{ exam.testCode }}</td>
            <td>{{ exam.examTitle }}</td>
            <td>{{ exam.classCode }}</td>
            <td>
              <span class="status-badge" :class="exam.status">
                {{ formatStatus(exam.status) }}
              </span>
            </td>
            <td>{{ exam.teacher ? `${exam.teacher.firstName} ${exam.teacher.lastName}` : 'Unknown' }}</td>
            <td>{{ exam.totalQuestions }}</td>
            <td>{{ exam.totalSubmissions }}</td>
            <td>
              <span v-if="exam.averageScore !== null" 
                    class="score-badge"
                    :class="getScoreClass(exam.averageScore)">
                {{ exam.averageScore.toFixed(1) }}%
              </span>
              <span v-else>-</span>
            </td>
            <td>{{ formatDate(exam.createdAt) }}</td>
            <td>
              <div class="access-chips">
                <span v-for="(access, i) in exam.accessSettings.slice(0, 2)" :key="i" class="access-chip">
                  G{{ access.grade }}-{{ access.section }}
                </span>
                <span v-if="exam.accessSettings.length > 2" class="access-chip more">
                  +{{ exam.accessSettings.length - 2 }}
                </span>
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <button class="action-btn" @click="viewResults(exam)">
                  <span class="material-icons">assessment</span>
                </button>
                <button class="action-btn" @click="viewDetails(exam)">
                  <span class="material-icons">visibility</span>
                </button>
                <button 
                  v-if="exam.status === 'active'" 
                  class="action-btn stop" 
                  @click="stopExam(exam)"
                >
                  <span class="material-icons">stop_circle</span>
                </button>
                <button class="action-btn" @click="viewMPS(exam)" v-if="exam.totalSubmissions > 0">
                  <span class="material-icons">analytics</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Exam Details Modal -->
    <div v-if="selectedExam" class="modal-backdrop" @click="closeModal">
      <div class="exam-details-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedExam.examTitle }}</h2>
          <button class="close-btn" @click="closeModal">
            <span class="material-icons">close</span>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="detail-section">
            <h3>Basic Information</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Test Code</span>
                <span class="detail-value">{{ selectedExam.testCode }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Class Code</span>
                <span class="detail-value">{{ selectedExam.classCode }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="detail-value status-badge" :class="selectedExam.status">
                  {{ formatStatus(selectedExam.status) }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Questions</span>
                <span class="detail-value">{{ selectedExam.totalQuestions }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Created</span>
                <span class="detail-value">{{ formatDate(selectedExam.createdAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Last Updated</span>
                <span class="detail-value">{{ formatDate(selectedExam.updatedAt) }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h3>Teacher Information</h3>
            <div class="teacher-info" v-if="selectedExam.teacher">
              <div class="teacher-name">
                {{ selectedExam.teacher.firstName }} {{ selectedExam.teacher.lastName }}
              </div>
              <div class="teacher-email">
                {{ selectedExam.teacher.email }}
              </div>
            </div>
            <div v-else>No teacher information available</div>
          </div>
          
          <div class="detail-section">
            <h3>Access Settings</h3>
            <div v-if="selectedExam.accessSettings.length" class="access-grid">
              <div v-for="(access, i) in selectedExam.accessSettings" :key="i" class="access-item">
                <span class="grade-section">Grade {{ access.grade }} - {{ access.section }}</span>
              </div>
            </div>
            <div v-else>No access settings configured</div>
          </div>
          
          <div class="detail-section">
            <h3>Submissions</h3>
            <div class="submissions-info">
              <div class="submission-stat">
                <span class="stat-label">Total Submissions</span>
                <span class="stat-value">{{ selectedExam.totalSubmissions }}</span>
              </div>
              <div class="submission-stat">
                <span class="stat-label">Average Score</span>
                <span class="stat-value" v-if="selectedExam.averageScore !== null">
                  {{ selectedExam.averageScore.toFixed(1) }}%
                </span>
                <span class="stat-value" v-else>No scores yet</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="modal-btn view-results" @click="viewResults(selectedExam)">
            <span class="material-icons">assessment</span>
            View Results
          </button>
          <button 
            v-if="selectedExam.status === 'active'" 
            class="modal-btn stop-exam" 
            @click="stopExam(selectedExam)"
          >
            <span class="material-icons">stop_circle</span>
            Stop Exam
          </button>
          <button class="modal-btn close" @click="closeModal">
            <span class="material-icons">close</span>
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAllExamsForAdmin } from '@/services/authService';
import Swal from 'sweetalert2';
import socketManager from '@/utils/socketManager';

const router = useRouter();
const exams = ref([]);
const loading = ref(true);
const error = ref('');
const searchQuery = ref('');
const statusFilter = ref('');
const sortKey = ref('createdAt');
const sortOrder = ref('desc');
const selectedExam = ref(null);
const currentView = ref('card'); // Default to card view

// Fetch all exams on component mount
onMounted(async () => {
  await refreshExams();
});

// Refresh exams data
const refreshExams = async () => {
  try {
    loading.value = true;
    error.value = '';
    const response = await getAllExamsForAdmin();
    exams.value = response.exams;
  } catch (err) {
    console.error('Error fetching exams:', err);
    error.value = 'Failed to load exams. Please try again later.';
  } finally {
    loading.value = false;
  }
};

// Filtered and sorted exams
const filteredSortedExams = computed(() => {
  // Apply search filter
  let result = exams.value.filter(exam => {
    const searchLower = searchQuery.value.toLowerCase();
    return (
      (exam.testCode && exam.testCode.toLowerCase().includes(searchLower)) ||
      (exam.examTitle && exam.examTitle.toLowerCase().includes(searchLower)) ||
      (exam.classCode && exam.classCode.toLowerCase().includes(searchLower)) ||
      (exam.teacher && 
        `${exam.teacher.firstName} ${exam.teacher.lastName}`.toLowerCase().includes(searchLower))
    );
  });
  
  // Apply status filter
  if (statusFilter.value) {
    // Handle the special case where 'active' in the UI maps to 'started' in the data
    if (statusFilter.value === 'active') {
      result = result.filter(exam => exam.status === 'started');
    } else {
    result = result.filter(exam => exam.status === statusFilter.value);
    }
  }
  
  // Apply sorting
  return result.sort((a, b) => {
    let valA = a[sortKey.value];
    let valB = b[sortKey.value];
    
    // Handle nested properties
    if (sortKey.value === 'teacher') {
      valA = a.teacher ? `${a.teacher.firstName} ${a.teacher.lastName}` : '';
      valB = b.teacher ? `${b.teacher.firstName} ${b.teacher.lastName}` : '';
    }
    
    // Handle dates
    if (sortKey.value === 'createdAt' || sortKey.value === 'updatedAt') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }
    
    // Handle potentially null values
    if (valA === null && valB === null) return 0;
    if (valA === null) return 1;
    if (valB === null) return -1;
    
    // Regular comparison
    if (typeof valA === 'string') {
      const compared = valA.localeCompare(valB);
      return sortOrder.value === 'asc' ? compared : -compared;
    } else {
      return sortOrder.value === 'asc' ? valA - valB : valB - valA;
    }
  });
});

// Sort by column
const sortBy = (key) => {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = 'asc';
  }
};

// Format exam status
const formatStatus = (status) => {
  if (!status) return 'Unknown';
  
  const statusMap = {
    'draft': 'Draft',
    'pending': 'Pending',
    'started': 'Active', // Map 'started' to 'Active' for display
    'active': 'Active',  // Keep for backward compatibility
    'completed': 'Completed',
    'stopped': 'Stopped'
  };
  
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get score CSS class based on percentage
const getScoreClass = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'satisfactory';
  if (score >= 60) return 'fair';
  return 'needs-improvement';
};

// View exam details
const viewDetails = (exam) => {
  selectedExam.value = exam;
};

// Close modal
const closeModal = () => {
  selectedExam.value = null;
};

// View exam results
const viewResults = (exam) => {
  router.push({
    path: `/exam-results/${exam.id}`,
    query: {
      testCode: exam.testCode,
      title: exam.examTitle
    }
  });
};

// Stop an active exam
const stopExam = async (exam) => {
  try {
    // Confirm action
    const result = await Swal.fire({
      title: 'Stop Exam?',
      text: `Are you sure you want to stop "${exam.examTitle}" (${exam.testCode})? Students will no longer be able to submit answers.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, stop it!',
      cancelButtonText: 'Cancel'
    });
    
    if (!result.isConfirmed) return;
    
    // Call socket event to stop exam
    socketManager.emitEvent('examStatusChanged', {
      testCode: exam.testCode,
      status: 'stopped'
    });
    
    // Update local state
    const examIndex = exams.value.findIndex(e => e.id === exam.id);
    if (examIndex !== -1) {
      exams.value[examIndex].status = 'stopped';
    }
    
    if (selectedExam.value && selectedExam.value.id === exam.id) {
      selectedExam.value.status = 'stopped';
    }
    
    // Show success message
    await Swal.fire({
      title: 'Exam Stopped',
      text: 'The exam has been stopped successfully.',
      icon: 'success',
      confirmButtonColor: '#4CAF50'
    });
  } catch (err) {
    console.error('Error stopping exam:', err);
    Swal.fire({
      title: 'Error',
      text: 'Failed to stop the exam. Please try again later.',
      icon: 'error',
      confirmButtonColor: '#4CAF50'
    });
  }
};

// Add this to the script section
const handleSearch = () => {
  // Reset the status filter when searching to show all matching results
  if (searchQuery.value.trim().length > 0) {
    // Only reset if we're actually searching for something
    statusFilter.value = '';
  }
};

// Add debounce functionality for smoother search experience
let searchTimeout = null;
const debouncedSearch = (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchQuery.value = e.target.value;
    handleSearch();
  }, 300); // 300ms debounce
};

// View MPS analysis
const viewMPS = (exam) => {
  router.push(`/exam-mps/${exam.id}`);
};
</script>

<style scoped>
.admin-exam-monitor {
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

/* Update the exam card styles to match ManageExams */
.exams-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0.7; }
  to { opacity: 1; }
}

.exam-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12),
  0 4px 16px -2px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.exam-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.exam-header {
  background: linear-gradient(135deg, #F44336 0%, #159750 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
  color: white;
}

.exam-header.active {
  background: linear-gradient(135deg, #F44336 0%, #C62828 100%);
}

.exam-header.stopped {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
}

.exam-header.completed {
  background: linear-gradient(135deg, #9C27B0 0%, #6A1B9A 100%);
}

.exam-header.draft {
  background: linear-gradient(135deg, #9E9E9E 0%, #616161 100%);
}

.exam-header.pending {
  background: linear-gradient(135deg, #FF9800 0%, #EF6C00 100%);
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
  transform: rotate(35deg);
  pointer-events: none;
}

.exam-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 5px;
  /* Allow for maximum of 2 lines of text */
  display: -webkit-box;
  
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.test-code {
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  display: inline-block;
  font-size: 12px;
  margin-bottom: 8px;
}

.status-indicator {
  position: absolute;
  top: 15px;
  right: 15px;
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.exam-body {
  padding: 20px;
  flex: 1;
}

.exam-teacher {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 15px;
  color: #555;
}

.exam-teacher .material-icons {
  font-size: 16px;
}

.exam-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-item .material-icons {
  color: #555;
  font-size: 20px;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #777;
}

.access-section {
  margin-bottom: 15px;
}

.section-label {
  font-size: 13px;
  color: #777;
  margin-bottom: 5px;
}

.access-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.access-chip {
  background: #e0f7fa;
  color: #0097a7;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.access-chip.more {
  background: #e8f5e9;
  color: #388e3c;
}

.access-chip.none {
  background: #f5f5f5;
  color: #757575;
}

.card-date {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #888;
}

.card-date .material-icons {
  font-size: 14px;
}

.exam-footer {
  display: flex;
  border-top: 1px solid #f0f0f0;
}

.card-btn {
  flex: 1;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background: none;
  border: none;
  color: #555;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.card-btn:not(:last-child) {
  border-right: 1px solid #f0f0f0;
}

.card-btn:hover {
  background: #f9f9f9;
}

.card-btn.view:hover {
  color: #1976D2;
}

.card-btn.details:hover {
  color: #7B1FA2;
}

.card-btn.stop:hover {
  color: #4CAF50;
}

.card-btn.mps:hover {
  color: #9C27B0;
}

.card-btn .material-icons {
  font-size: 16px;
}

/* Update controls section */
.controls-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 15px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 0 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.search-box:focus-within {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  border-color: #4CAF50;
}

.search-box input {
  flex: 1;
  border: none;
  padding: 12px;
  font-size: 16px;
  outline: none;
  background: transparent;
}

.search-box .material-icons {
  color: #666;
}

.clear-search {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  transition: all 0.2s;
}

.clear-search:hover {
  color: #F44336;
}

.filter-controls {
  display: flex;
  gap: 15px;
}

.filter-controls select {
  padding: 0 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  min-width: 150px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.refresh-btn:hover {
  background: #43A047;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Update loading, error, empty states */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  margin-bottom: 2rem;
}

.loading-state .material-icons-round, 
.error-state .material-icons-round, 
.empty-state .material-icons-round {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-state .material-icons-round {
  color: #159750;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state .material-icons-round {
  color: #f44336;
}

.empty-state .material-icons-round {
  color: #9e9e9e;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-btn:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Update modal styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.exam-details-modal {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  padding: 0;
  animation: modalFadeIn 0.3s ease;
  z-index: 1001;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 20px;
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  color: white;
}

.modal-header::before {
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

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  position: relative;
  z-index: 1;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h3 {
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.detail-label {
  font-size: 12px;
  color: #757575;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #333;
}

.teacher-info {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.teacher-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.teacher-email {
  font-size: 14px;
  color: #666;
}

.access-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.access-item {
  padding: 10px;
  background: #E8F5E9;
  border-radius: 8px;
  text-align: center;
}

.grade-section {
  font-size: 14px;
  color: #2E7D32;
  font-weight: 500;
}

.submissions-info {
  display: flex;
  gap: 20px;
}

.submission-stat {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #757575;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.modal-footer {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #f0f0f0;
}

.modal-btn {
  padding: 10px 15px;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.view-results {
  background: #4CAF50;
  color: white;
  border: none;
}

.modal-btn.view-results:hover {
  background: #43A047;
  transform: translateY(-2px);
}

.modal-btn.stop-exam {
  background: #4CAF50;
  color: white;
  border: none;
}

.modal-btn.stop-exam:hover {
  background: #43A047;
  transform: translateY(-2px);
}

.modal-btn.close {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
}

.modal-btn.close:hover {
  background: #e0e0e0;
}

/* View toggle styles */
.view-toggle {
  display: flex;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 10px;
}

.view-btn {
  background: white;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn.active {
  background: #f0f7ff;
  color: #1976D2;
}

.view-btn:hover:not(.active) {
  background: #f5f5f5;
}

.view-btn .material-icons {
  font-size: 20px;
}

/* Responsive styles */
@media (max-width: 768px) {
  .admin-exam-monitor {
    padding: 10px 5px;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
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
  
  .controls-section {
    flex-direction: column;
  }
  
  .filter-controls {
    width: 100%;
  }
  
  .filter-controls select {
    flex: 1;
  }
}

.status-badge.active {
  background: #F8D7DA;
  color: #721C24;
}

.status-badge.stopped {
  background: #D4EDDA;
  color: #155724;
}

/* Table styles */
.exams-table-container {
  overflow-x: auto;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12),
  0 4px 16px -2px rgba(0, 0, 0, 0.08);
  margin-top: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0.7; }
  to { opacity: 1; }
}

.exams-table {
  width: 100%;
  border-collapse: collapse;
}

.exams-table th,
.exams-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.exams-table th {
  background: #f9f9f9;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  user-select: none;
}

.exams-table th:hover {
  background: #f5f5f5;
}

.sort-icon {
  font-size: 16px;
  vertical-align: middle;
  margin-left: 5px;
}

.exams-table tbody tr:hover {
  background: #f9f9f9;
}

/* Status badges in table */
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.draft {
  background: #E0E0E0;
  color: #616161;
}

.status-badge.pending {
  background: #FFF3CD;
  color: #856404;
}

/* Action buttons in table */
.action-buttons {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.action-btn {
  background: none;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #757575;
}

.action-btn:hover {
  background: #f0f0f0;
  color: #4CAF50;
}

.action-btn.stop:hover {
  background: #E8F5E9;
  color: #4CAF50;
}

.action-btn .material-icons {
  font-size: 20px;
}

/* Score badges */
.score-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.score-badge.excellent {
  background: #D4EDDA;
  color: #155724;
}

.score-badge.good {
  background: #D1ECF1;
  color: #0C5460;
}

.score-badge.satisfactory {
  background: #E2E3E5;
  color: #383D41;
}

.score-badge.fair {
  background: #FFF3CD;
  color: #856404;
}

.score-badge.needs-improvement {
  background: #F8D7DA;
  color: #721C24;
}
</style> 