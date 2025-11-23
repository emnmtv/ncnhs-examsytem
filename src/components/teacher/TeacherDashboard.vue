<template>
  <div class="teacher-dashboard">
    <!-- Header Section -->
    <div class="dashboard-header">
      <div class="header-content">
      <h1>Teacher Dashboard</h1>
        <p class="welcome-text">Welcome back! Here's your teaching overview and analytics.</p>
      </div>
      <div class="header-actions">
        <div class="filter-controls">
          <select v-model="selectedSubject" @change="loadAnalytics" class="filter-select">
            <option value="">All Subjects</option>
            <option v-for="subject in subjects" :key="subject.id" :value="subject.id">
              {{ subject.name }}
            </option>
          </select>
          <input 
            v-model="dateRange.start" 
            type="date" 
            class="date-input"
            @change="loadAnalytics"
          />
          <input 
            v-model="dateRange.end" 
            type="date" 
            class="date-input"
            @change="loadAnalytics"
          />
        </div>
        <button @click="loadAnalytics" class="refresh-btn" :disabled="loading">
          <span class="material-icons" :class="{ 'rotating': loading }">refresh</span>
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading analytics...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadAnalytics" class="retry-btn">Retry</button>
    </div>
    
    <!-- Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Overview Statistics -->
      <div class="stats-grid">
        <div class="stat-card students">
          <div class="stat-icon">
            <span class="material-icons">people</span>
          </div>
          <div class="stat-content">
            <h3>{{ analytics?.overview?.totalStudents || 0 }}</h3>
            <p>Total Students</p>
          </div>
        </div>
        
        <div class="stat-card exams">
          <div class="stat-icon">
            <span class="material-icons">quiz</span>
          </div>
          <div class="stat-content">
            <h3>{{ analytics?.overview?.totalExams || 0 }}</h3>
            <p>Total Exams</p>
          </div>
        </div>
        
        <div class="stat-card tasks">
          <div class="stat-icon">
            <span class="material-icons">assignment</span>
          </div>
          <div class="stat-content">
            <h3>{{ analytics?.overview?.totalTasks || 0 }}</h3>
            <p>Total Tasks</p>
          </div>
        </div>
        
        <!-- <div class="stat-card grading">
          <div class="stat-icon">
            <span class="material-icons">grading</span>
          </div>
          <div class="stat-content">
            <h3>{{ analytics?.overview?.gradingProgress || 0 }}%</h3>
            <p>Grading Progress</p>
          </div>
        </div> -->
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <!-- Performance Overview Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Student Performance Overview</h3>
            <div class="chart-legend">
              <div class="legend-item">
                <span class="legend-color excellent"></span>
                <span>Excellent (85%+)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color good"></span>
                <span>Good (75-84%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color fair"></span>
                <span>Fair (60-74%)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color needs-improvement"></span>
                <span>Needs Improvement (&lt;60%)</span>
              </div>
            </div>
          </div>
          <div class="chart-content">
            <canvas ref="performanceChart"></canvas>
          </div>
        </div>

        <!-- Subject Performance Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Subject Performance</h3>
          </div>
          <div class="chart-content">
            <canvas ref="subjectChart"></canvas>
          </div>
        </div>
      </div>
        
      <!-- Analytics Tables -->
      <div class="analytics-tables">
        <!-- Top Performers -->
        <div class="table-card">
          <div class="table-header">
            <h3>Top Performers</h3>
            <span class="badge success">{{ analytics?.studentPerformance?.topPerformers?.length || 0 }}</span>
          </div>
          <div class="table-content">
            <div v-if="analytics?.studentPerformance?.topPerformers?.length === 0" class="empty-state">
              <span class="material-icons">person_off</span>
              <p>No performance data available</p>
            </div>
            <div v-else class="student-list">
              <div 
                v-for="(student, index) in analytics?.studentPerformance?.topPerformers?.slice(0, 5)" 
                :key="student.id" 
                class="student-item"
              >
                <div class="student-rank">{{ index + 1 }}</div>
                <div class="student-info">
                  <h4>{{ student.firstName }} {{ student.lastName }}</h4>
                  <p>{{ student.gradeLevel }}-{{ student.section }}</p>
                  
                  <!-- Subject Performance -->
                  <div class="student-subjects" v-if="student.topSubjects && student.topSubjects.length > 0">
                    <div class="detail-label">
                      <span class="material-icons">menu_book</span>
                      <strong>Top Subjects ({{ student.subjectCount || 0 }} total):</strong>
                    </div>
                    <div class="subject-badges-list">
                      <span class="subject-badge" v-for="subject in student.topSubjects.slice(0, 3)" :key="subject.name || subject.subjectName">
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
                      <div class="exam-item" v-for="exam in student.recentExams.slice(0, 2)" :key="exam.id || exam.examId">
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
                <div class="student-score">
                  <span class="score">{{ Math.round(student.overallAvg) }}%</span>
                  <div class="score-bar">
                    <div class="score-fill" :style="{ width: student.overallAvg + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Students Needing Attention -->
        <div class="table-card">
          <div class="table-header">
            <h3>Students Needing Attention</h3>
            <span class="badge warning">{{ analytics?.studentPerformance?.studentsNeedingAttention?.length || 0 }}</span>
          </div>
          <div class="table-content">
            <div v-if="analytics?.studentPerformance?.studentsNeedingAttention?.length === 0" class="empty-state">
              <span class="material-icons">check_circle</span>
              <p>All students are performing well!</p>
            </div>
            <div v-else class="student-list">
              <div 
                v-for="student in analytics?.studentPerformance?.studentsNeedingAttention?.slice(0, 5)" 
                :key="student.id" 
                class="student-item attention"
              >
                <div class="student-info">
                  <h4>{{ student.firstName }} {{ student.lastName }}</h4>
                  <p>{{ student.gradeLevel }}-{{ student.section }}</p>
                  
                  <!-- Attention Reasons -->
                  <div class="attention-reasons">
                    <span v-if="student.overallAvg < 60" class="reason">Low Score</span>
                    <span v-if="student.overTimeExams > 2" class="reason">Time Issues</span>
                    <span v-if="student.examCount > 0 && student.avgExamScore < 50" class="reason">Poor Exam Performance</span>
                  </div>
                  
                  <!-- Struggling Subjects -->
                  <div class="student-subjects struggling" v-if="student.strugglingSubjects && student.strugglingSubjects.length > 0">
                    <div class="detail-label">
                      <span class="material-icons">warning</span>
                      <strong>Struggling Subjects ({{ student.subjectCount || 0 }} total):</strong>
                    </div>
                    <div class="subject-badges-list">
                      <span class="subject-badge struggling-badge" v-for="subject in student.strugglingSubjects.slice(0, 3)" :key="subject.name || subject.subjectName">
                        {{ subject.name || subject.subjectName }} ({{ Math.round(subject.score || subject.averageScore || 0) }}%)
                      </span>
                    </div>
                  </div>
                  
                  <!-- Recent Exam Performance -->
                  <div class="student-exams" v-if="student.recentExams && student.recentExams.length > 0">
                    <div class="detail-label">
                      <span class="material-icons">quiz</span>
                      <strong>Recent Exams ({{ student.examCount || 0 }} total):</strong>
                    </div>
                    <div class="exam-list">
                      <div class="exam-item struggling-exam" v-for="exam in student.recentExams.slice(0, 2)" :key="exam.id || exam.examId">
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
                      <span class="material-icons">trending_down</span>
                      Avg: {{ Math.round(student.avgExamScore) }}%
                    </span>
                  </div>
                </div>
                <div class="student-score">
                  <span class="score">{{ Math.round(student.overallAvg) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Student Performance by Subject -->
      <div class="subject-performance-section">
        <div class="section-header">
          <h3>Student Performance by Subject</h3>
          <p>Detailed breakdown of student performance across all subjects</p>
        </div>
        
        <div v-if="!analytics?.subjectPerformance || analytics?.subjectPerformance.length === 0" class="empty-state">
          <span class="material-icons">menu_book</span>
          <p>No subject performance data available</p>
        </div>
        
        <div v-else class="subject-performance-grid">
          <div 
            v-for="subject in analytics.subjectPerformance" 
            :key="subject.subjectId || subject.subjectName"
            class="subject-performance-card"
          >
            <div class="subject-card-header">
              <div class="subject-title">
                <span class="material-icons">menu_book</span>
                <h4>{{ subject.subjectName || 'Unknown Subject' }}</h4>
              </div>
              <div class="subject-stats">
                <span class="subject-avg-score" :class="getPerformanceClass(subject.averageScore)">
                  {{ Math.round(subject.averageScore || 0) }}%
                </span>
                <span class="subject-students">{{ subject.studentCount || 0 }} students</span>
              </div>
            </div>
            
            <div class="subject-performance-breakdown">
              <div class="performance-distribution">
                <div class="dist-item">
                  <span class="dist-label">Excellent (85%+)</span>
                  <span class="dist-count excellent">{{ subject.excellentCount || 0 }}</span>
                </div>
                <div class="dist-item">
                  <span class="dist-label">Good (75-84%)</span>
                  <span class="dist-count good">{{ subject.goodCount || 0 }}</span>
                </div>
                <div class="dist-item">
                  <span class="dist-label">Fair (60-74%)</span>
                  <span class="dist-count fair">{{ subject.fairCount || 0 }}</span>
                </div>
                <div class="dist-item">
                  <span class="dist-label">Needs Improvement (&lt;60%)</span>
                  <span class="dist-count needs-improvement">{{ subject.needsImprovementCount || 0 }}</span>
                </div>
              </div>
              
              <div class="subject-top-students" v-if="subject.topStudents && subject.topStudents.length > 0">
                <h5>Top Performers in this Subject</h5>
                <div class="top-students-list">
                  <div 
                    v-for="(student, idx) in subject.topStudents.slice(0, 3)" 
                    :key="student.id || idx"
                    class="top-student-item"
                  >
                    <span class="student-rank-small">{{ idx + 1 }}</span>
                    <span class="student-name">{{ student.firstName }} {{ student.lastName }}</span>
                    <span class="student-score-small">{{ Math.round(student.score || 0) }}%</span>
                  </div>
                </div>
              </div>
              
              <div class="subject-struggling-students" v-if="subject.strugglingStudents && subject.strugglingStudents.length > 0">
                <h5>Students Needing Support</h5>
                <div class="struggling-students-list">
                  <div 
                    v-for="(student, idx) in subject.strugglingStudents.slice(0, 3)" 
                    :key="student.id || idx"
                    class="struggling-student-item"
                  >
                    <span class="material-icons">warning</span>
                    <span class="student-name">{{ student.firstName }} {{ student.lastName }}</span>
                    <span class="student-score-small">{{ Math.round(student.score || 0) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
        
      <!-- Question Analysis -->
      <div class="question-analysis">
        <div class="analysis-card">
          <div class="analysis-header">
            <h3>Question Analysis</h3>
            <p>Questions that may need review</p>
          </div>
          <div class="analysis-content">
            <div v-if="analytics?.examItemAnalysis?.questionsNeedingReview?.length === 0" class="empty-state">
              <span class="material-icons">check_circle</span>
              <p>All questions are performing well!</p>
            </div>
            <div v-else class="question-list">
              <div 
                v-for="question in analytics?.examItemAnalysis?.questionsNeedingReview?.slice(0, 5)" 
                :key="question.id" 
                class="question-item"
              >
                <div class="question-info">
                  <h4>{{ question.examTitle }}</h4>
                  <p>{{ question.questionText }}</p>
                  <div class="question-metrics">
                    <span class="metric">Difficulty: {{ Math.round(question.difficulty * 100) }}%</span>
                    <span class="metric">Easiness: {{ Math.round(question.easiness * 100) }}%</span>
                    <span class="metric">Discrimination: {{ Math.round(question.discrimination * 100) }}%</span>
                  </div>
                </div>
                <div class="question-status">
                  <span class="status-badge review">Needs Review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h3>Quick Actions</h3>
        <div class="action-grid">
          <router-link to="/create-exam" class="action-card">
            <span class="material-icons">add</span>
            <h4>Create Exam</h4>
            <p>Create a new exam for your students</p>
          </router-link>
          
          <router-link to="/create-task" class="action-card">
            <span class="material-icons">assignment</span>
            <h4>Create Task</h4>
            <p>Assign a new task to students</p>
          </router-link>
          
          <router-link to="/class-list" class="action-card">
            <span class="material-icons">people</span>
            <h4>View Class List</h4>
            <p>Manage your class and attendance</p>
          </router-link>
          
          <router-link to="/teacher-subjects" class="action-card">
            <span class="material-icons">menu_book</span>
            <h4>My Subjects</h4>
            <p>View and manage your subjects</p>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { getTeacherAnalytics, getTeacherAssignedSubjects } from '@/services/authService'
import Chart from 'chart.js/auto'

// Reactive data
const loading = ref(false)
const error = ref(null)
const analytics = ref(null)
const subjects = ref([])
const selectedSubject = ref('')
const dateRange = ref({
  start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
})

// Chart references
const performanceChart = ref(null)
const subjectChart = ref(null)

// Chart instances
let performanceChartInstance = null
let subjectChartInstance = null

// Load teacher's subjects
const loadSubjects = async () => {
  try {
    const response = await getTeacherAssignedSubjects()
    subjects.value = response || []
  } catch (err) {
    console.error('Error loading subjects:', err)
  }
}

// Load analytics data
const loadAnalytics = async () => {
  try {
    loading.value = true
    error.value = null
    
    const filters = {
      startDate: dateRange.value.start,
      endDate: dateRange.value.end,
      subjectId: selectedSubject.value || undefined
    }
    
    const response = await getTeacherAnalytics(filters)
    analytics.value = response.data
    
    // Debug: Log the analytics data structure
    console.log('Analytics Data:', analytics.value)
    console.log('Student Performance:', analytics.value?.studentPerformance)
    console.log('Subject Performance:', analytics.value?.subjectPerformance)
    
    // Render charts after data is loaded
    await nextTick()
    // Add a small delay to ensure canvas elements are fully rendered
    setTimeout(() => {
      renderCharts()
    }, 100)
  } catch (err) {
    error.value = err.message || 'Failed to load analytics'
    console.error('Error loading analytics:', err)
  } finally {
    loading.value = false
  }
}

// Render performance overview chart
const renderPerformanceChart = () => {
  console.log('Rendering performance chart...')
  console.log('Analytics data:', analytics.value)
  
  if (!analytics.value?.studentPerformance?.overallStats) {
    console.log('No overall stats available')
    return
  }
  
  const canvas = performanceChart.value
  if (!canvas) {
    console.log('Canvas not found')
    return
  }
  
  console.log('Canvas found:', canvas)
  
  // Destroy existing chart if it exists
  if (performanceChartInstance) {
    performanceChartInstance.destroy()
  }
  
  // Calculate performance distribution based on actual student data
  const allStudents = analytics.value.studentPerformance.topPerformers?.concat(
    analytics.value.studentPerformance.lowPerformers || []
  ) || []
  
  if (allStudents.length === 0) {
    // Show "No Data" message
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#666'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('No Performance Data Available', canvas.width / 2, canvas.height / 2)
    return
  }
  
  // Count students in each performance category
  const excellent = allStudents.filter(s => s.overallAvg >= 85).length
  const good = allStudents.filter(s => s.overallAvg >= 75 && s.overallAvg < 85).length
  const fair = allStudents.filter(s => s.overallAvg >= 60 && s.overallAvg < 75).length
  const needsImprovement = allStudents.filter(s => s.overallAvg < 60).length
  
  const data = [excellent, good, fair, needsImprovement]
  const labels = ['Excellent (85%+)', 'Good (75-84%)', 'Fair (60-74%)', 'Needs Improvement (<60%)']
  const colors = ['#4CAF50', '#8BC34A', '#FFC107', '#F44336']
  
  // Create Chart.js pie chart
  const ctx = canvas.getContext('2d')
  performanceChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || ''
              const value = context.parsed
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
              return `${label}: ${value} students (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

// Render subject performance chart
const renderSubjectChart = () => {
  if (!analytics.value?.subjectPerformance) return
  
  const canvas = subjectChart.value
  if (!canvas) return
  
  // Destroy existing chart if it exists
  if (subjectChartInstance) {
    subjectChartInstance.destroy()
  }
  
  const subjects = analytics.value.subjectPerformance
  
  if (!subjects || subjects.length === 0) {
    // Show "No Data" message
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#666'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('No Subject Data Available', canvas.width / 2, canvas.height / 2)
    return
  }
  
  // Prepare data for Chart.js
  const labels = subjects.map(s => s.subjectName || 'Unknown')
  const data = subjects.map(s => Math.round(s.averageScore || 0))
  const colors = subjects.map(s => {
    switch (s.performanceTrend) {
      case 'excellent': return '#4CAF50'
      case 'good': return '#8BC34A'
      case 'fair': return '#FFC107'
      default: return '#F44336'
    }
  })
  
  // Create Chart.js bar chart
  const ctx = canvas.getContext('2d')
  subjectChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Average Score (%)',
        data: data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const subject = subjects[context.dataIndex]
              return `${subject.subjectName}: ${context.parsed.y}% (${subject.studentCount} students)`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%'
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 0
          }
        }
      }
    }
  })
}

// Render all charts
const renderCharts = () => {
  console.log('renderCharts called')
  console.log('performanceChart.value:', performanceChart.value)
  console.log('subjectChart.value:', subjectChart.value)
  
  if (!performanceChart.value || !subjectChart.value) {
    console.log('Canvas elements not ready, retrying in 100ms...')
    setTimeout(() => {
      renderCharts()
    }, 100)
    return
  }
  
  try {
    renderPerformanceChart()
    renderSubjectChart()
  } catch (error) {
    console.error('Error rendering charts:', error)
  }
}

// Initialize dashboard
onMounted(async () => {
  await loadSubjects()
  await loadAnalytics()
})

// Get performance class based on score
const getPerformanceClass = (score) => {
  if (score >= 85) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'fair'
  return 'needs-improvement'
}

// Cleanup charts on unmount
onUnmounted(() => {
  if (performanceChartInstance) {
    performanceChartInstance.destroy()
  }
  if (subjectChartInstance) {
    subjectChartInstance.destroy()
  }
})
</script>

<style scoped>
.teacher-dashboard {
  padding: 20px;
  width: 100%;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Header Styles */
.dashboard-header {
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

.welcome-text {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
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

.refresh-btn {
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
}

.refresh-btn:hover:not(:disabled) {
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

/* Loading and Error States */
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
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
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

.students .stat-icon { background: linear-gradient(135deg, #2196f3, #03a9f4); }
.exams .stat-icon { background: linear-gradient(135deg, #ff9800, #ff5722); }
.tasks .stat-icon { background: linear-gradient(135deg, #4caf50, #8bc34a); }
.grading .stat-icon { background: linear-gradient(135deg, #9c27b0, #673ab7); }

/* Charts Section */
.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.chart-legend {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.excellent { background: #4CAF50; }
.legend-color.good { background: #8BC34A; }
.legend-color.fair { background: #FFC107; }
.legend-color.needs-improvement { background: #F44336; }

.chart-content {
  position: relative;
  height: 300px;
  width: 100%;
}

.chart-content canvas {
  width: 100% !important;
  height: 100% !important;
}

/* Analytics Tables */
.analytics-tables {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.table-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.table-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge.success {
  background: #d4edda;
  color: #155724;
}

.badge.warning {
  background: #fff3cd;
  color: #856404;
}

.table-content {
  padding: 20px;
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

.student-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: background 0.2s;
}

.student-item:hover {
  background: #e9ecef;
}

.student-item.attention {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.student-rank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #159750;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.student-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1rem;
}

.student-info p {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 0.8rem;
}

.student-subjects {
  margin-top: 10px;
}

.student-subjects.struggling {
  margin-top: 8px;
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

.student-subjects.struggling .detail-label .material-icons {
  color: #ff9800;
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

.subject-badge.struggling-badge {
  background: #ffebee;
  color: #c62828;
}

.student-exams {
  margin-top: 10px;
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

.exam-item.struggling-exam {
  background: #fff3e0;
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

.exam-item.struggling-exam .exam-score {
  color: #f44336;
}

.student-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #666;
}

.stat-item .material-icons {
  font-size: 0.9rem;
  color: #159750;
}

.student-item.attention .stat-item .material-icons {
  color: #ff9800;
}

.attention-reasons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.reason {
  background: #ffc107;
  color: #856404;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.7rem;
}

.student-score {
  margin-left: auto;
  text-align: right;
}

.score {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
}

.score-bar {
  width: 100px;
  height: 4px;
  background: #e9ecef;
  border-radius: 2px;
  margin-top: 5px;
  overflow: hidden;
}

.score-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s;
}

/* Student Performance by Subject */
.subject-performance-section {
  margin-bottom: 30px;
}

.section-header {
  margin-bottom: 20px;
}

.section-header h3 {
  color: #333;
  font-size: 1.3rem;
  margin: 0 0 5px 0;
}

.section-header p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.subject-performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.subject-performance-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.subject-performance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.subject-card-header {
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 2px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subject-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.subject-title .material-icons {
  color: #159750;
  font-size: 1.5rem;
}

.subject-title h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.subject-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.subject-avg-score {
  font-size: 1.5rem;
  font-weight: 700;
}

.subject-avg-score.excellent {
  color: #4CAF50;
}

.subject-avg-score.good {
  color: #8BC34A;
}

.subject-avg-score.fair {
  color: #FFC107;
}

.subject-avg-score.needs-improvement {
  color: #F44336;
}

.subject-students {
  font-size: 0.8rem;
  color: #666;
}

.subject-performance-breakdown {
  padding: 20px;
}

.performance-distribution {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.dist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
}

.dist-label {
  font-size: 0.85rem;
  color: #666;
}

.dist-count {
  font-weight: 600;
  font-size: 0.9rem;
  padding: 4px 8px;
  border-radius: 12px;
}

.dist-count.excellent {
  background: #d4edda;
  color: #155724;
}

.dist-count.good {
  background: #d1ecf1;
  color: #0c5460;
}

.dist-count.fair {
  background: #fff3cd;
  color: #856404;
}

.dist-count.needs-improvement {
  background: #f8d7da;
  color: #721c24;
}

.subject-top-students,
.subject-struggling-students {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.subject-top-students h5,
.subject-struggling-students h5 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 0.95rem;
  font-weight: 600;
}

.top-students-list,
.struggling-students-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.top-student-item,
.struggling-student-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 6px;
}

.struggling-student-item {
  background: #fff3cd;
}

.student-rank-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #159750;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.student-name {
  flex: 1;
  font-size: 0.9rem;
  color: #333;
}

.student-score-small {
  font-weight: 600;
  font-size: 0.9rem;
  color: #159750;
}

.struggling-student-item .student-score-small {
  color: #F44336;
}

.struggling-student-item .material-icons {
  font-size: 1rem;
  color: #ffc107;
  flex-shrink: 0;
}

/* Question Analysis */
.question-analysis {
  margin-bottom: 30px;
}

.analysis-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.analysis-header {
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.analysis-header h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.2rem;
}

.analysis-header p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.analysis-content {
  padding: 20px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.question-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background: #f8f9fa;
}

.question-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1rem;
}

.question-info p {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 0.9rem;
}

.question-metrics {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.metric {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  color: #666;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.review {
  background: #fff3cd;
  color: #856404;
}

/* Quick Actions */
.quick-actions h3 {
  color: #333;
  font-size: 1.3rem;
  margin-bottom: 20px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.action-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s, box-shadow 0.2s;
  text-align: center;
}

.action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.action-card .material-icons {
  font-size: 3rem;
  color: #159750;
  margin-bottom: 15px;
}

.action-card h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.action-card p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 20px;
  }
  
  .header-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .filter-controls {
    flex-wrap: wrap;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .analytics-tables {
    grid-template-columns: 1fr;
  }
  
  .subject-performance-grid {
    grid-template-columns: 1fr;
  }
  
  .performance-distribution {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .action-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .teacher-dashboard {
    padding: 10px;
  }
  
  .dashboard-header h1 {
    font-size: 2rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .student-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .student-score {
    margin-left: 0;
    width: 100%;
  }
  
  .subject-badges-list {
    flex-direction: column;
    gap: 4px;
  }
  
  .exam-list {
    gap: 4px;
  }
  
  .student-stats {
    flex-direction: column;
    gap: 6px;
  }
  
  .subject-performance-grid {
    grid-template-columns: 1fr;
  }
  
  .subject-card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .subject-stats {
    align-items: flex-start;
  }
  
  .performance-distribution {
    grid-template-columns: 1fr;
  }
}
</style> 