<template>
  <div class="student-dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <h1>My Academic Dashboard</h1>
      <p>Track your performance, progress, and achievements</p>
    </div>

    <!-- Filter Controls -->
    <div class="filter-controls">
      <div class="filter-group">
        <label>Date Range:</label>
        <input 
          type="date" 
          v-model="filters.startDate" 
          @change="loadAnalytics"
        />
        <span>to</span>
        <input 
          type="date" 
          v-model="filters.endDate" 
          @change="loadAnalytics"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your analytics...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadAnalytics" class="retry-btn">Retry</button>
    </div>

    <!-- Dashboard Content -->
    <div v-if="!loading && !error && analytics" class="dashboard-content">
      <!-- Overview Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <h3>{{ analytics.overview.totalExamsTaken }}</h3>
            <p>Exams Taken</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <h3>{{ analytics.overview.averageScore }}%</h3>
            <p>Average Score</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-content">
            <h3>{{ analytics.overview.totalSubjects }}</h3>
            <p>Subjects</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏱️</div>
          <div class="stat-content">
            <h3>{{ timeAnalysis.averageTimePerExam }}m</h3>
            <p>Avg Time/Exam</p>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container">
          <h3>Performance Distribution</h3>
          <div class="chart-wrapper">
            <canvas ref="performanceChart" width="400" height="200"></canvas>
          </div>
        </div>
        <div class="chart-container">
          <h3>Subject Performance</h3>
          <div class="chart-wrapper">
            <canvas ref="subjectChart" width="400" height="200"></canvas>
          </div>
        </div>
      </div>

      <!-- Performance Trends -->
      <div class="trends-section">
        <h3>Performance Trends</h3>
        <div class="chart-wrapper">
          <canvas ref="trendsChart" width="400" height="200"></canvas>
        </div>
      </div>

      <!-- Skills Analysis -->
      <div class="skills-section">
        <h3>Skills Analysis</h3>
        <div class="skills-grid">
          <div class="skill-card">
            <h4>Time Management</h4>
            <div class="skill-level" :class="skillsAnalysis.examTakingSkills.timeManagement">
              {{ skillsAnalysis.examTakingSkills.timeManagement.replace('_', ' ').toUpperCase() }}
            </div>
          </div>
          <div class="skill-card">
            <h4>Accuracy</h4>
            <div class="skill-level" :class="skillsAnalysis.examTakingSkills.accuracy">
              {{ skillsAnalysis.examTakingSkills.accuracy.replace('_', ' ').toUpperCase() }}
            </div>
          </div>
          <div class="skill-card">
            <h4>Consistency</h4>
            <div class="skill-level" :class="skillsAnalysis.examTakingSkills.consistency">
              {{ skillsAnalysis.examTakingSkills.consistency.replace('_', ' ').toUpperCase() }}
            </div>
          </div>
        </div>
      </div>

      <!-- Subject Analysis -->
      <div class="subject-analysis">
        <h3>Subject Performance</h3>
        <div class="subject-list">
          <div 
            v-for="subject in subjectAnalysis" 
            :key="subject.subjectId"
            class="subject-item"
          >
            <div class="subject-info">
              <h4>{{ subject.subjectName }}</h4>
              <p>{{ subject.subjectCode }}</p>
            </div>
            <div class="subject-stats">
              <div class="stat">
                <span class="label">Exams:</span>
                <span class="value">{{ subject.examCount }}</span>
              </div>
              <div class="stat">
                <span class="label">Tasks:</span>
                <span class="value">{{ subject.taskCount }}</span>
              </div>
              <div class="stat">
                <span class="label">Average:</span>
                <span class="value">{{ subject.overallAverage }}%</span>
              </div>
              <div class="performance-trend" :class="subject.performanceTrend">
                {{ subject.performanceTrend.replace('_', ' ').toUpperCase() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity">
        <h3>Recent Activity</h3>
        <div class="activity-list">
          <div 
            v-for="activity in recentActivity" 
            :key="activity.id"
            class="activity-item"
          >
            <div class="activity-icon">📝</div>
            <div class="activity-content">
              <h4>{{ activity.examTitle }}</h4>
              <p>{{ activity.testCode }} • {{ activity.timeSpent }} minutes</p>
            </div>
            <div class="activity-score" :class="getScoreClass(activity.score)">
              {{ activity.score }}%
            </div>
          </div>
        </div>
      </div>

      <!-- Achievements -->
      <div class="achievements-section">
        <h3>Achievements</h3>
        <div class="achievements-grid">
          <div 
            v-for="achievement in achievements" 
            :key="achievement"
            class="achievement-badge"
          >
            🏆 {{ achievement }}
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations-section">
        <h3>Recommendations</h3>
        <div class="recommendations-list">
          <div 
            v-for="recommendation in recommendations" 
            :key="recommendation"
            class="recommendation-item"
          >
            💡 {{ recommendation }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { getStudentAnalytics } from '@/services/authService'
import Chart from 'chart.js/auto'

export default {
  name: 'StudentDashboard',
  setup() {
    // Reactive data
    const loading = ref(false)
    const error = ref(null)
    const analytics = ref(null)
    const filters = ref({
      startDate: '',
      endDate: ''
    })

    // Chart references
    const performanceChart = ref(null)
    const subjectChart = ref(null)
    const trendsChart = ref(null)

    // Chart instances
    let performanceChartInstance = null
    let subjectChartInstance = null
    let trendsChartInstance = null

    // Computed properties
    const timeAnalysis = computed(() => analytics.value?.timeAnalysis || {})
    const skillsAnalysis = computed(() => analytics.value?.skillsAnalysis || {})
    const subjectAnalysis = computed(() => analytics.value?.subjectAnalysis || [])
    const recentActivity = computed(() => analytics.value?.recentActivity || [])
    const achievements = computed(() => analytics.value?.achievements || [])
    const recommendations = computed(() => analytics.value?.recommendations || [])

    // Load analytics data
    const loadAnalytics = async () => {
      try {
        loading.value = true
        error.value = null
        
        const response = await getStudentAnalytics(filters.value)
        analytics.value = response.data
        
        // Wait for DOM update then render charts
        await nextTick()
        // Add a small delay to ensure canvas elements are fully rendered
        setTimeout(() => {
          renderCharts()
        }, 100)
        
      } catch (err) {
        console.error('Error loading analytics:', err)
        error.value = err.message || 'Failed to load analytics'
      } finally {
        loading.value = false
      }
    }

    // Render performance distribution chart
    const renderPerformanceChart = () => {
      if (!performanceChart.value) return
      
      // Destroy existing chart
      if (performanceChartInstance) {
        performanceChartInstance.destroy()
      }
      
      let labels, data, backgroundColor;
      
      if (analytics.value?.performance?.recentExams && analytics.value.performance.recentExams.length > 0) {
        const exams = analytics.value.performance.recentExams
        const excellent = exams.filter(e => e.score >= 90).length
        const good = exams.filter(e => e.score >= 80 && e.score < 90).length
        const fair = exams.filter(e => e.score >= 70 && e.score < 80).length
        const needsImprovement = exams.filter(e => e.score < 70).length
        
        data = [excellent, good, fair, needsImprovement]
        labels = ['Excellent (90%+)', 'Good (80-89%)', 'Fair (70-79%)', 'Needs Improvement (<70%)']
        backgroundColor = ['rgba(76, 175, 80, 0.7)', 'rgba(139, 195, 74, 0.7)', 'rgba(255, 193, 7, 0.7)', 'rgba(244, 67, 54, 0.7)']
      } else {
        // Fallback data
        labels = ['Excellent', 'Good', 'Fair', 'Needs Improvement']
        data = [2, 3, 1, 1]
        backgroundColor = ['rgba(76, 175, 80, 0.7)', 'rgba(139, 195, 74, 0.7)', 'rgba(255, 193, 7, 0.7)', 'rgba(244, 67, 54, 0.7)']
      }
      
      const ctx = performanceChart.value.getContext('2d')
      performanceChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            label: 'Performance Distribution',
            data: data,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor.map(color => color.replace('0.7', '1')),
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      })
    }

    // Render subject performance chart
    const renderSubjectChart = () => {
      if (!subjectChart.value) return
      
      // Destroy existing chart
      if (subjectChartInstance) {
        subjectChartInstance.destroy()
      }
      
      let labels, data, backgroundColor;
      
      if (analytics.value?.subjectAnalysis && analytics.value.subjectAnalysis.length > 0) {
        const subjects = analytics.value.subjectAnalysis
        labels = subjects.map(s => s.subjectName)
        data = subjects.map(s => s.overallAverage)
        backgroundColor = subjects.map(s => 
          s.overallAverage >= 85 ? 'rgba(46, 125, 50, 0.7)' : 
          s.overallAverage >= 75 ? 'rgba(25, 118, 210, 0.7)' : 
          s.overallAverage >= 60 ? 'rgba(245, 124, 0, 0.7)' : 'rgba(211, 47, 54, 0.7)'
        )
      } else {
        // Fallback data
        labels = ['Math', 'Science', 'English', 'History']
        data = [75, 80, 85, 78]
        backgroundColor = ['rgba(245, 124, 0, 0.7)', 'rgba(25, 118, 210, 0.7)', 'rgba(46, 125, 50, 0.7)', 'rgba(25, 118, 210, 0.7)']
      }
      
      const ctx = subjectChart.value.getContext('2d')
      subjectChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Average Score (%)',
            data: data,
            backgroundColor: backgroundColor,
            borderColor: backgroundColor.map(color => color.replace('0.7', '1')),
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100
            }
          },
          plugins: {
            legend: {
              display: false
            }
          }
        }
      })
    }

    // Render trends chart
    const renderTrendsChart = () => {
      if (!trendsChart.value) return
      
      // Destroy existing chart
      if (trendsChartInstance) {
        trendsChartInstance.destroy()
      }
      
      let labels, scores, examCounts;
      
      if (analytics.value?.performance?.monthlyTrends && analytics.value.performance.monthlyTrends.length > 0) {
        const trends = analytics.value.performance.monthlyTrends
        labels = trends.map(t => t.month)
        scores = trends.map(t => t.averageScore)
        examCounts = trends.map(t => t.examCount)
      } else {
        // Fallback data
        labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
        scores = [75, 80, 85, 78, 82]
        examCounts = [3, 4, 2, 5, 3]
      }
      
      const ctx = trendsChart.value.getContext('2d')
      trendsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Average Score (%)',
            data: scores,
            borderColor: 'rgba(25, 118, 210, 1)',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            tension: 0.4,
            yAxisID: 'y',
            borderWidth: 3,
            pointBackgroundColor: 'rgba(25, 118, 210, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          }, {
            label: 'Exam Count',
            data: examCounts,
            borderColor: 'rgba(245, 124, 0, 1)',
            backgroundColor: 'rgba(245, 124, 0, 0.1)',
            tension: 0.4,
            yAxisID: 'y1',
            borderWidth: 3,
            pointBackgroundColor: 'rgba(245, 124, 0, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Average Score (%)'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              title: {
                display: true,
                text: 'Exam Count'
              },
              grid: {
                drawOnChartArea: false,
              },
            }
          },
          plugins: {
            legend: {
              position: 'top'
            }
          }
        }
      })
    }

    // Render all charts
    const renderCharts = () => {
      if (!analytics.value) {
        console.log('No analytics data available for charts')
        return
      }
      
      console.log('Rendering charts with data:', analytics.value)
      
      // Render performance distribution chart
      if (performanceChart.value) {
        renderPerformanceChart()
      }
      
      // Render subject performance chart
      if (subjectChart.value) {
        renderSubjectChart()
      }
      
      // Render trends chart
      if (trendsChart.value) {
        renderTrendsChart()
      }
    }

    // Get score class for styling
    const getScoreClass = (score) => {
      if (score >= 90) return 'excellent'
      if (score >= 80) return 'good'
      if (score >= 70) return 'fair'
      return 'needs-improvement'
    }

    // Initialize dashboard
    onMounted(async () => {
      await loadAnalytics()
    })

    // Cleanup charts on unmount
    onUnmounted(() => {
      if (performanceChartInstance) {
        performanceChartInstance.destroy()
      }
      if (subjectChartInstance) {
        subjectChartInstance.destroy()
      }
      if (trendsChartInstance) {
        trendsChartInstance.destroy()
      }
    })

    return {
      loading,
      error,
      analytics,
      filters,
      performanceChart,
      subjectChart,
      trendsChart,
      timeAnalysis,
      skillsAnalysis,
      subjectAnalysis,
      recentActivity,
      achievements,
      recommendations,
      loadAnalytics,
      getScoreClass
    }
  }
}
</script>

<style scoped>
.student-dashboard {
  width: 100%;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 30px;
}

.dashboard-header h1 {
  color: #333;
  margin-bottom: 10px;
}

.dashboard-header p {
  color: #666;
  font-size: 16px;
}

.filter-controls {
  background: white;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group label {
  font-weight: 600;
  color: #333;
}

.filter-group input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.loading-state, .error-state {
  text-align: center;
  padding: 50px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.retry-btn:hover {
  background: #2980b9;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content h3 {
  font-size: 2rem;
  margin: 0;
  color: #333;
}

.stat-content p {
  margin: 5px 0 0;
  color: #666;
  font-size: 14px;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.chart-container h3 {
  margin: 0 0 20px;
  color: #333;
}

.chart-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
}

.chart-wrapper canvas {
  width: 100% !important;
  height: 100% !important;
}

.trends-section {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.trends-section h3 {
  margin: 0 0 20px;
  color: #333;
}

.trends-section .chart-wrapper {
  height: 400px;
}

.skills-section {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.skills-section h3 {
  margin: 0 0 20px;
  color: #333;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.skill-card {
  text-align: center;
  padding: 20px;
  border: 2px solid #eee;
  border-radius: 10px;
}

.skill-card h4 {
  margin: 0 0 10px;
  color: #333;
}

.skill-level {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 12px;
}

.skill-level.excellent {
  background: #d4edda;
  color: #155724;
}

.skill-level.good {
  background: #d1ecf1;
  color: #0c5460;
}

.skill-level.fair {
  background: #fff3cd;
  color: #856404;
}

.skill-level.needs_improvement {
  background: #f8d7da;
  color: #721c24;
}

.skill-level.insufficient_data {
  background: #e2e3e5;
  color: #6c757d;
}

.subject-analysis {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.subject-analysis h3 {
  margin: 0 0 20px;
  color: #333;
}

.subject-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.subject-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.subject-info h4 {
  margin: 0 0 5px;
  color: #333;
}

.subject-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.subject-stats {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat {
  text-align: center;
}

.stat .label {
  display: block;
  font-size: 12px;
  color: #666;
}

.stat .value {
  display: block;
  font-weight: 600;
  color: #333;
}

.performance-trend {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.performance-trend.excellent {
  background: #d4edda;
  color: #155724;
}

.performance-trend.good {
  background: #d1ecf1;
  color: #0c5460;
}

.performance-trend.fair {
  background: #fff3cd;
  color: #856404;
}

.performance-trend.needs_improvement {
  background: #f8d7da;
  color: #721c24;
}

.recent-activity {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.recent-activity h3 {
  margin: 0 0 20px;
  color: #333;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.activity-icon {
  font-size: 1.5rem;
}

.activity-content {
  flex: 1;
}

.activity-content h4 {
  margin: 0 0 5px;
  color: #333;
}

.activity-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.activity-score {
  padding: 8px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.activity-score.excellent {
  background: #d4edda;
  color: #155724;
}

.activity-score.good {
  background: #d1ecf1;
  color: #0c5460;
}

.activity-score.fair {
  background: #fff3cd;
  color: #856404;
}

.activity-score.needs-improvement {
  background: #f8d7da;
  color: #721c24;
}

.achievements-section {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.achievements-section h3 {
  margin: 0 0 20px;
  color: #333;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
}

.achievement-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.recommendations-section {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.recommendations-section h3 {
  margin: 0 0 20px;
  color: #333;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recommendation-item {
  padding: 15px;
  background: #f8f9fa;
  border-left: 4px solid #3498db;
  border-radius: 0 8px 8px 0;
  color: #333;
}

/* Responsive Design */
@media (max-width: 768px) {
  .student-dashboard {
    padding: 10px;
  }
  
  .charts-section {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .subject-stats {
    flex-direction: column;
    gap: 10px;
  }
  
  .achievements-grid {
    grid-template-columns: 1fr;
  }
}
</style> 