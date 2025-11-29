<template>
  <div class="top-performers-page">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <h1>Top Performers</h1>
        <p class="subtitle">View all high-performing students across your subjects</p>
      </div>
      <div class="header-actions">
        <div class="filter-controls">
          <select v-model="selectedSubject" @change="loadTopPerformers" class="filter-select">
            <option value="">All Subjects</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
          <input 
            v-model="dateRange.start" 
            type="date" 
            class="date-input"
            @change="loadTopPerformers"
          />
          <input 
            v-model="dateRange.end" 
            type="date" 
            class="date-input"
            @change="loadTopPerformers"
          />
        </div>
        <button @click="loadTopPerformers" class="refresh-btn" :disabled="loading">
          <span class="material-icons" :class="{ 'rotating': loading }">refresh</span>
          Refresh
        </button>
        <router-link to="/teacher-dashboard" class="back-btn">
          <span class="material-icons">arrow_back</span>
          Back to Dashboard
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading top performers...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadTopPerformers" class="retry-btn">Retry</button>
    </div>

    <!-- Content -->
    <div v-else class="content">
      <div class="stats-summary">
        <div class="stat-item">
          <span class="stat-value">{{ topPerformers.length }}</span>
          <span class="stat-label">Total Top Performers</span>
        </div>
      </div>

      <div v-if="topPerformers.length === 0" class="empty-state">
        <span class="material-icons">person_off</span>
        <p>No top performers found for the selected criteria</p>
      </div>

      <div v-else class="performers-list">
        <div 
          v-for="(student, index) in topPerformers" 
          :key="student.id" 
          class="performer-item clickable"
          @click="viewStudentPerformance(student.id)"
        >
          <div class="performer-rank">{{ index + 1 }}</div>
          <div class="performer-info">
            <h3>{{ student.firstName }} {{ student.lastName }}</h3>
            <p class="student-details">{{ student.gradeLevel }}-{{ student.section }}</p>
            
            <!-- Subject Performance -->
            <div class="student-subjects" v-if="student.topSubjects && student.topSubjects.length > 0">
              <div class="detail-label">
                <span class="material-icons">menu_book</span>
                <strong>Top Subjects ({{ student.subjectCount || 0 }} total):</strong>
              </div>
              <div class="subject-badges-list">
                <span 
                  class="subject-badge" 
                  v-for="subject in student.topSubjects" 
                  :key="subject.name || subject.subjectName"
                >
                  {{ subject.name || subject.subjectName }} ({{ Math.round(subject.score || subject.averageScore || 0) }}%)
                </span>
              </div>
            </div>
            
            <!-- Exam Details -->
            <div class="student-exams" v-if="student.recentExams && student.recentExams.length > 0">
              <div class="detail-label">
                <span class="material-icons">quiz</span>
                <strong>Recent Exams ({{ student.examCount || 0 }} total):</strong>
              </div>
              <div class="exam-list">
                <div 
                  class="exam-item" 
                  v-for="exam in student.recentExams.slice(0, 3)" 
                  :key="exam.id || exam.examId"
                >
                  <span class="exam-name">{{ exam.examTitle || exam.title }}</span>
                  <span class="exam-score">{{ Math.round(exam.score || exam.percentage || 0) }}%</span>
                </div>
              </div>
            </div>
            
            <!-- Overall Stats -->
            <div class="student-stats" v-if="student.examCount !== undefined || student.subjectCount !== undefined">
              <span class="stat-item" v-if="student.examCount !== undefined">
                <span class="material-icons">assignment</span>
                {{ student.examCount || 0 }} exams
              </span>
              <span class="stat-item" v-if="student.subjectCount !== undefined">
                <span class="material-icons">menu_book</span>
                {{ student.subjectCount || 0 }} subjects
              </span>
              <span class="stat-item" v-if="student.avgExamScore !== undefined">
                <span class="material-icons">trending_up</span>
                Avg: {{ Math.round(student.avgExamScore) }}%
              </span>
            </div>
          </div>
          <div class="performer-score">
            <span class="score">{{ Math.round(student.overallAvg) }}%</span>
            <div class="score-bar">
              <div class="score-fill" :style="{ width: student.overallAvg + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllTopPerformers, getTeacherAssignedSubjects } from '@/services/authService'

const router = useRouter()

// Reactive data
const loading = ref(false)
const error = ref(null)
const topPerformers = ref([])
const subjects = ref([])
const selectedSubject = ref('')
const dateRange = ref({
  start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
})

// Load teacher's subjects
const loadSubjects = async () => {
  try {
    const response = await getTeacherAssignedSubjects()
    subjects.value = response || []
  } catch (err) {
    console.error('Error loading subjects:', err)
  }
}

// Load top performers
const loadTopPerformers = async () => {
  try {
    loading.value = true
    error.value = null
    
    const filters = {
      startDate: dateRange.value.start,
      endDate: dateRange.value.end,
      subjectId: selectedSubject.value || undefined
    }
    
    const response = await getAllTopPerformers(filters)
    topPerformers.value = Array.isArray(response) ? response : []
  } catch (err) {
    error.value = err.message || 'Failed to load top performers'
    console.error('Error loading top performers:', err)
  } finally {
    loading.value = false
  }
}

// Navigate to student performance view
const viewStudentPerformance = (studentId) => {
  router.push({ name: 'StudentPerformance', params: { studentId } })
}

// Initialize
onMounted(async () => {
  await loadSubjects()
  await loadTopPerformers()
})
</script>

<style scoped>
.top-performers-page {
  padding: 20px;
  width: 100%;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
}

.header-content h1 {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 10px 0;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.filter-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-select, .date-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.refresh-btn, .back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px;
  background: #159750;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
  text-decoration: none;
}

.refresh-btn:hover:not(:disabled), .back-btn:hover {
  background: #0bcc4e;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #159750;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state .material-icons {
  font-size: 4rem;
  color: #f44336;
  margin-bottom: 20px;
}

.retry-btn {
  padding: 10px 20px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  margin-top: 15px;
}

.stats-summary {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  display: flex;
  gap: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #159750;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 5px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-state .material-icons {
  font-size: 4rem;
  color: #ddd;
  margin-bottom: 15px;
}

.performers-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.performer-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.performer-item.clickable {
  cursor: pointer;
}

.performer-item.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.performer-rank {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.performer-info {
  flex: 1;
}

.performer-info h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.2rem;
}

.student-details {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 0.9rem;
}

.student-subjects, .student-exams {
  margin-top: 10px;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 0.8rem;
  color: #555;
}

.detail-label .material-icons {
  font-size: 1rem;
  color: #159750;
}

.detail-label strong {
  font-weight: 600;
}

.subject-badges-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.subject-badge {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.exam-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.exam-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 0.8rem;
}

.exam-name {
  flex: 1;
  color: #333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
}

.exam-score {
  font-weight: 600;
  color: #159750;
  font-size: 0.85rem;
}

.student-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.student-stats .stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #666;
}

.student-stats .stat-item .material-icons {
  font-size: 0.9rem;
  color: #159750;
}

.performer-score {
  text-align: right;
  min-width: 120px;
}

.score {
  font-weight: 700;
  font-size: 1.5rem;
  color: #159750;
  display: block;
  margin-bottom: 5px;
}

.score-bar {
  width: 100px;
  height: 6px;
  background: #e9ecef;
  border-radius: 3px;
  overflow: hidden;
  margin: 0 auto;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-controls {
    flex-wrap: wrap;
  }
  
  .performer-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .performer-score {
    width: 100%;
    text-align: left;
  }
}
</style>

