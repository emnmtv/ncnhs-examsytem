<template>
  <div class="questions-review-page">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <h1>Questions Needing Review</h1>
        <p class="subtitle">View all questions that may need review based on performance metrics</p>
      </div>
      <div class="header-actions">
        <div class="filter-controls">
          <select v-model="selectedSubject" @change="loadQuestions" class="filter-select">
            <option value="">All Subjects</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
          <input 
            v-model="dateRange.start" 
            type="date" 
            class="date-input"
            @change="loadQuestions"
          />
          <input 
            v-model="dateRange.end" 
            type="date" 
            class="date-input"
            @change="loadQuestions"
          />
        </div>
        <button @click="loadQuestions" class="refresh-btn" :disabled="loading">
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
      <p>Loading questions...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadQuestions" class="retry-btn">Retry</button>
    </div>

    <!-- Content -->
    <div v-else class="content">
      <div class="stats-summary">
        <div class="stat-item">
          <span class="stat-value">{{ questions.length }}</span>
          <span class="stat-label">Questions Needing Review</span>
        </div>
      </div>

      <div v-if="questions.length === 0" class="empty-state">
        <span class="material-icons">check_circle</span>
        <p>All questions are performing well!</p>
      </div>

      <div v-else class="questions-list">
        <div 
          v-for="question in questions" 
          :key="question.id" 
          class="question-item clickable"
          @click="viewQuestionReview(question.id)"
        >
          <div class="question-info">
            <div class="question-header">
              <h3>{{ question.examTitle }}</h3>
              <span class="status-badge review">Needs Review</span>
            </div>
            <p class="question-text">{{ question.questionText }}</p>
            
            <div class="question-metrics">
              <div class="metric-item">
                <span class="metric-label">Difficulty:</span>
                <span class="metric-value" :class="getDifficultyClass(question.difficulty)">
                  {{ Math.round(question.difficulty * 100) }}%
                </span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Easiness:</span>
                <span class="metric-value" :class="getEasinessClass(question.easiness)">
                  {{ Math.round(question.easiness * 100) }}%
                </span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Discrimination:</span>
                <span class="metric-value" :class="getDiscriminationClass(question.discrimination)">
                  {{ Math.round(question.discrimination * 100) }}%
                </span>
              </div>
            </div>

            <div class="question-details" v-if="question.examId || question.subjectName">
              <span v-if="question.subjectName" class="detail-tag">
                <span class="material-icons">menu_book</span>
                {{ question.subjectName }}
              </span>
              <span v-if="question.questionType" class="detail-tag">
                <span class="material-icons">category</span>
                {{ question.questionType }}
              </span>
            </div>
          </div>
          <div class="question-action">
            <span class="material-icons view-icon">visibility</span>
            <span class="action-text">View Details</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllQuestionsNeedingReview, getTeacherAssignedSubjects } from '@/services/authService'

const router = useRouter()

// Reactive data
const loading = ref(false)
const error = ref(null)
const questions = ref([])
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

// Load questions needing review
const loadQuestions = async () => {
  try {
    loading.value = true
    error.value = null
    
    const filters = {
      startDate: dateRange.value.start,
      endDate: dateRange.value.end,
      subjectId: selectedSubject.value || undefined
    }
    
    const response = await getAllQuestionsNeedingReview(filters)
    questions.value = Array.isArray(response) ? response : []
  } catch (err) {
    error.value = err.message || 'Failed to load questions'
    console.error('Error loading questions:', err)
  } finally {
    loading.value = false
  }
}

// Navigate to question review details
const viewQuestionReview = (questionId) => {
  router.push(`/question-review/${questionId}`)
}

// Get difficulty class for styling
const getDifficultyClass = (difficulty) => {
  if (difficulty > 0.7) return 'high-difficulty'
  if (difficulty > 0.4) return 'medium-difficulty'
  return 'low-difficulty'
}

// Get easiness class for styling
const getEasinessClass = (easiness) => {
  if (easiness > 0.7) return 'high-easiness'
  if (easiness > 0.4) return 'medium-easiness'
  return 'low-easiness'
}

// Get discrimination class for styling
const getDiscriminationClass = (discrimination) => {
  if (discrimination < 0.2) return 'low-discrimination'
  if (discrimination < 0.4) return 'medium-discrimination'
  return 'high-discrimination'
}

// Initialize
onMounted(async () => {
  await loadSubjects()
  await loadQuestions()
})
</script>

<style scoped>
.questions-review-page {
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
  color: #9c27b0;
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
  border-top: 4px solid #9c27b0;
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
  color: #9c27b0;
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
  color: #4CAF50;
  margin-bottom: 15px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.question-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.question-item.clickable {
  cursor: pointer;
}

.question-item.clickable:hover {
  background: #f8f9fa;
  border-color: #9c27b0;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.question-info {
  flex: 1;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.question-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  flex: 1;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.review {
  background: #fff3cd;
  color: #856404;
}

.question-text {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
}

.question-metrics {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.metric-label {
  font-size: 0.75rem;
  color: #666;
  font-weight: 500;
}

.metric-value {
  font-size: 1rem;
  font-weight: 700;
}

.metric-value.high-difficulty {
  color: #f44336;
}

.metric-value.medium-difficulty {
  color: #ff9800;
}

.metric-value.low-difficulty {
  color: #4CAF50;
}

.metric-value.high-easiness {
  color: #4CAF50;
}

.metric-value.medium-easiness {
  color: #ff9800;
}

.metric-value.low-easiness {
  color: #f44336;
}

.metric-value.high-discrimination {
  color: #4CAF50;
}

.metric-value.medium-discrimination {
  color: #ff9800;
}

.metric-value.low-discrimination {
  color: #f44336;
}

.question-details {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.detail-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #e9ecef;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #666;
}

.detail-tag .material-icons {
  font-size: 0.9rem;
}

.question-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 100px;
}

.view-icon {
  color: #9c27b0;
  font-size: 2rem;
  transition: transform 0.2s;
}

.question-item.clickable:hover .view-icon {
  transform: scale(1.2);
  color: #7b1fa2;
}

.action-text {
  font-size: 0.8rem;
  color: #666;
  font-weight: 500;
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
  
  .question-item {
    flex-direction: column;
  }
  
  .question-action {
    width: 100%;
    flex-direction: row;
    justify-content: center;
    margin-top: 15px;
  }
  
  .question-metrics {
    flex-direction: column;
    gap: 10px;
  }
}
</style>

