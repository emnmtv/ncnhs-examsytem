<template>
  <div class="question-review-details">
    <!-- Header -->
    <div class="header-container">
      <div class="header-content">
        <div class="title-row">
          <button @click="goBack" class="back-btn">
            <span class="material-icons">arrow_back</span>
          </button>
          <h1>Question Review Details<span class="material-icons">quiz</span></h1>
        </div>
        <div class="divider"></div>
      </div>
      <div class="header-background">REVIEW</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading question details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadQuestionDetails" class="retry-btn">Retry</button>
    </div>

    <!-- Question Details -->
    <div v-else-if="questionData" class="review-content">
      <!-- Question Info Card -->
      <div class="question-info-card">
        <div class="question-header">
          <h2>
            <span class="material-icons">help_outline</span>
            Question Information
          </h2>
          <span class="status-badge review">Needs Review</span>
        </div>
        <div class="question-content">
          <div class="info-row">
            <span class="label">Exam:</span>
            <span class="value">{{ questionData.examTitle }}</span>
          </div>
          <div class="info-row">
            <span class="label">Question Text:</span>
            <span class="value question-text">{{ questionData.questionText }}</span>
          </div>
          <div class="info-row">
            <span class="label">Question Type:</span>
            <span class="value">{{ formatQuestionType(questionData.questionType) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Correct Answer:</span>
            <span class="value correct-answer">{{ questionData.correctAnswer }}</span>
          </div>
          <div class="metrics-row">
            <div class="metric-item">
              <span class="metric-label">Difficulty</span>
              <span class="metric-value">{{ Math.round(questionData.difficulty * 100) }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Easiness</span>
              <span class="metric-value">{{ Math.round(questionData.easiness * 100) }}%</span>
            </div>
            <!-- <div class="metric-item">
              <span class="metric-label">Discrimination</span>
              <span class="metric-value">{{ Math.round(questionData.discrimination * 100) }}%</span>
            </div> -->
          </div>
        </div>
      </div>

      <!-- Statistics Summary -->
      <div class="stats-summary">
        <div class="stat-card">
          <div class="stat-icon incorrect">
            <span class="material-icons">close</span>
          </div>
          <div class="stat-content">
            <h3>{{ questionData.incorrectCount || 0 }}</h3>
            <p>Incorrect Answers</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon correct">
            <span class="material-icons">check</span>
          </div>
          <div class="stat-content">
            <h3>{{ questionData.correctCount || 0 }}</h3>
            <p>Correct Answers</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon total">
            <span class="material-icons">people</span>
          </div>
          <div class="stat-content">
            <h3>{{ questionData.totalAnswers || 0 }}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon percentage">
            <span class="material-icons">percent</span>
          </div>
          <div class="stat-content">
            <h3>{{ questionData.accuracyPercentage || 0 }}%</h3>
            <p>Accuracy Rate</p>
          </div>
        </div>
      </div>

      <!-- Answer Frequency -->
      <div class="answer-frequency-section" v-if="questionData.answerFrequency && questionData.answerFrequency.length > 0">
        <div class="section-header-bar">
          <h3>
            <span class="material-icons">bar_chart</span>
            Most Common Answers
          </h3>
        </div>
        <div class="answer-frequency-list">
          <div 
            v-for="(answerFreq, index) in questionData.answerFrequency" 
            :key="index"
            class="answer-frequency-item"
            :class="{ 'correct-answer': answerFreq.isCorrect }"
          >
            <div class="frequency-rank">{{ index + 1 }}</div>
            <div class="frequency-content">
              <div class="frequency-header">
                <span class="answer-text">{{ answerFreq.answer || 'No answer' }}</span>
                <span class="frequency-badge" :class="{ 'correct': answerFreq.isCorrect, 'incorrect': !answerFreq.isCorrect }">
                  {{ answerFreq.isCorrect ? 'Correct' : 'Incorrect' }}
                </span>
              </div>
              <div class="frequency-stats">
                <span class="count-stat">
                  <span class="material-icons">people</span>
                  {{ answerFreq.count }} students
                </span>
                <span class="percentage-stat">
                  <span class="material-icons">percent</span>
                  {{ answerFreq.percentage }}%
                </span>
              </div>
              <div class="frequency-bar">
                <div 
                  class="frequency-fill" 
                  :style="{ width: answerFreq.percentage + '%' }"
                  :class="{ 'correct-fill': answerFreq.isCorrect, 'incorrect-fill': !answerFreq.isCorrect }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section Breakdown -->
      <div class="section-breakdown" v-if="questionData.sectionBreakdown && questionData.sectionBreakdown.length > 0">
        <div class="section-header-bar">
          <h3>
            <span class="material-icons">class</span>
            Performance by Section
          </h3>
        </div>
        <div class="section-list">
          <div 
            v-for="section in questionData.sectionBreakdown" 
            :key="`${section.gradeLevel}-${section.section}`"
            class="section-item"
          >
            <div class="section-header">
              <span class="material-icons">class</span>
              <span class="section-name">Grade {{ section.gradeLevel }} - {{ section.section }}</span>
              <span class="section-stats">
                {{ section.incorrectCount }}/{{ section.totalCount }} incorrect
              </span>
            </div>
            <div class="section-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: ((section.totalCount - section.incorrectCount) / section.totalCount * 100) + '%' }"
                ></div>
              </div>
              <span class="progress-text">
                {{ Math.round((section.totalCount - section.incorrectCount) / section.totalCount * 100) }}% correct
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Students with Incorrect Answers -->
      <div class="students-section">
        <div class="section-header-bar">
          <h3>
            <span class="material-icons">person_off</span>
            Students with Incorrect Answers
          </h3>
          <div class="filter-controls">
            <select v-model="selectedSection" @change="filterStudents" class="filter-select">
              <option value="">All Sections</option>
              <option 
                v-for="section in uniqueSections" 
                :key="section"
                :value="section"
              >
                {{ section }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="filteredStudents.length === 0" class="empty-state">
          <span class="material-icons">check_circle</span>
          <p>No students with incorrect answers found</p>
        </div>

        <div v-else class="students-list">
          <div 
            v-for="student in filteredStudents" 
            :key="student.id"
            class="student-card"
          >
            <div class="student-header">
              <div class="student-info">
                <h4>{{ student.firstName }} {{ student.lastName }}</h4>
                <p>Grade {{ student.gradeLevel }} - {{ student.section }}</p>
                <p v-if="student.lrn" class="lrn">LRN: {{ student.lrn }}</p>
              </div>
              <div class="student-status">
                <span class="status-badge incorrect">Incorrect</span>
              </div>
            </div>
            <div class="answer-section">
              <div class="answer-row">
                <span class="answer-label">Student's Answer:</span>
                <span class="student-answer">{{ student.userAnswer || 'No answer provided' }}</span>
              </div>
              <div class="answer-row">
                <span class="answer-label">Correct Answer:</span>
                <span class="correct-answer-value">{{ questionData.correctAnswer }}</span>
              </div>
              <div class="answer-row" v-if="student.submittedAt">
                <span class="answer-label">Submitted At:</span>
                <span class="submitted-time">{{ formatDate(student.submittedAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getQuestionReviewDetails } from '@/services/authService'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref(null)
const questionData = ref(null)
const selectedSection = ref('')

const loadQuestionDetails = async () => {
  try {
    loading.value = true
    error.value = null
    
    const questionId = route.params.questionId
    if (!questionId) {
      error.value = 'Question ID is required'
      return
    }
    
    const response = await getQuestionReviewDetails(questionId)
    questionData.value = response.data || response
    
    console.log('Question Review Data:', questionData.value)
  } catch (err) {
    error.value = err.message || 'Failed to load question details'
    console.error('Error loading question details:', err)
  } finally {
    loading.value = false
  }
}

const formatQuestionType = (type) => {
  const types = {
    multiple_choice: 'Multiple Choice',
    multipleChoice: 'Multiple Choice',
    true_false: 'True/False',
    enumeration: 'Enumeration',
    essay: 'Essay'
  }
  return types[type] || type
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleString()
}

const uniqueSections = computed(() => {
  if (!questionData.value?.students) return []
  const sections = new Set()
  questionData.value.students.forEach(student => {
    if (student.gradeLevel && student.section) {
      sections.add(`Grade ${student.gradeLevel} - ${student.section}`)
    }
  })
  return Array.from(sections).sort()
})

const filteredStudents = computed(() => {
  if (!questionData.value?.students) return []
  if (!selectedSection.value) return questionData.value.students
  
  return questionData.value.students.filter(student => {
    const sectionStr = `Grade ${student.gradeLevel} - ${student.section}`
    return sectionStr === selectedSection.value
  })
})

const filterStudents = () => {
  // Filter is handled by computed property
}

const goBack = () => {
  router.push('/teacher-dashboard')
}

onMounted(() => {
  loadQuestionDetails()
})
</script>

<style scoped>
.question-review-details {
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header-container {
  position: relative;
  margin-bottom: 30px;
}

.header-content {
  position: relative;
  z-index: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 1rem;
}

.header-content h1 {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
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
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.back-btn:hover {
  background: #159750;
  border-color: #159750;
  color: white;
  transform: translateX(-2px);
}

.back-btn .material-icons {
  font-size: 1.5rem;
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
  margin-top: 20px;
}

.review-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.question-info-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.question-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.question-header h2 .material-icons {
  color: #159750;
  font-size: 1.5rem;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.review {
  background: #fff3cd;
  color: #856404;
}

.status-badge.incorrect {
  background: #f8d7da;
  color: #721c24;
}

.question-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-row {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.label {
  font-weight: 600;
  color: #666;
  min-width: 150px;
}

.value {
  color: #333;
  flex: 1;
}

.question-text {
  font-size: 1.1rem;
  line-height: 1.6;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #159750;
}

.correct-answer {
  font-weight: 600;
  color: #2e7d32;
  padding: 8px 12px;
  background: #e8f5e9;
  border-radius: 6px;
  display: inline-block;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.metric-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 8px;
}

.metric-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon .material-icons {
  font-size: 2rem;
  color: white;
}

.stat-icon.incorrect {
  background: linear-gradient(135deg, #f44336, #d32f2f);
}

.stat-icon.correct {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
}

.stat-icon.total {
  background: linear-gradient(135deg, #2196f3, #1976d2);
}

.stat-icon.percentage {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.stat-content h3 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 5px 0;
  color: #333;
}

.stat-content p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* Answer Frequency Section */
.answer-frequency-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.answer-frequency-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.answer-frequency-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #159750;
  transition: all 0.2s;
}

.answer-frequency-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.answer-frequency-item.correct-answer {
  border-left-color: #4caf50;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.frequency-rank {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #159750;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.answer-frequency-item.correct-answer .frequency-rank {
  background: #4caf50;
}

.frequency-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.frequency-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.answer-text {
  flex: 1;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  word-break: break-word;
}

.frequency-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.frequency-badge.correct {
  background: #d4edda;
  color: #155724;
}

.frequency-badge.incorrect {
  background: #f8d7da;
  color: #721c24;
}

.frequency-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.count-stat, .percentage-stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #666;
}

.count-stat .material-icons,
.percentage-stat .material-icons {
  font-size: 1.1rem;
  color: #159750;
}

.frequency-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.frequency-fill {
  height: 100%;
  transition: width 0.3s;
  border-radius: 4px;
}

.frequency-fill.correct-fill {
  background: linear-gradient(90deg, #4caf50, #8bc34a);
}

.frequency-fill.incorrect-fill {
  background: linear-gradient(90deg, #f44336, #ff7043);
}

.section-breakdown {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.section-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.section-header-bar h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header-bar h3 .material-icons {
  color: #159750;
  font-size: 1.5rem;
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.section-item {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #159750;
  transition: all 0.2s;
}

.section-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.section-header .material-icons {
  color: #159750;
}

.section-name {
  flex: 1;
  font-weight: 600;
  color: #333;
}

.section-stats {
  color: #666;
  font-size: 0.9rem;
}

.section-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s;
}

.progress-text {
  font-size: 0.85rem;
  color: #666;
  min-width: 80px;
  text-align: right;
}

.students-section {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  min-width: 200px;
}

.filter-select:focus {
  outline: none;
  border-color: #159750;
  box-shadow: 0 0 0 3px rgba(21, 151, 80, 0.1);
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-state .material-icons {
  font-size: 3rem;
  color: #ddd;
  margin-bottom: 15px;
}

.students-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.student-card {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #f44336;
  transition: all 0.2s;
}

.student-card:hover {
  background: #e9ecef;
  transform: translateX(4px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.student-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.student-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.1rem;
}

.student-info p {
  margin: 5px 0;
  color: #666;
  font-size: 0.9rem;
}

.lrn {
  font-size: 0.85rem;
  color: #999;
}

.answer-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.answer-row {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.answer-label {
  font-weight: 600;
  color: #666;
  min-width: 140px;
}

.student-answer {
  flex: 1;
  padding: 10px 15px;
  background: #fff3e0;
  border-radius: 6px;
  color: #e65100;
  font-weight: 500;
}

.correct-answer-value {
  flex: 1;
  padding: 10px 15px;
  background: #e8f5e9;
  border-radius: 6px;
  color: #2e7d32;
  font-weight: 500;
}

.submitted-time {
  color: #666;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .question-review-details {
    padding: 10px;
  }
  
  .review-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stats-summary {
    grid-template-columns: 1fr;
  }
  
  .metrics-row {
    grid-template-columns: 1fr;
  }
  
  .section-header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .student-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .answer-row {
    flex-direction: column;
    gap: 5px;
  }
}
</style>

