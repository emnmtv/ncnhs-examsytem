<template>
  <div class="admin-dashboard">
    <!-- Header Section -->
    <div class="dashboard-header">
      <h1>Admin Dashboard</h1>
      <div class="header-actions">
        <div class="date-filters">
          <input 
            type="date" 
            v-model="filters.startDate" 
            @change="fetchAnalytics"
            class="date-input"
          >
          <span>to</span>
          <input 
            type="date" 
            v-model="filters.endDate" 
            @change="fetchAnalytics"
            class="date-input"
          >
        </div>
        <button @click="fetchAnalytics" class="refresh-btn">
          <span class="material-icons">refresh</span>
          Refresh
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading analytics data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <span class="material-icons error-icon">error</span>
      <p>{{ error }}</p>
      <button @click="fetchAnalytics" class="retry-btn">Retry</button>
    </div>

    <!-- Dashboard Content -->
    <div v-else-if="analytics" class="dashboard-content">
      <!-- Overview Cards -->
      <div class="overview-section">
        <h2>System Overview</h2>
        <div class="overview-cards">
          <div class="overview-card students">
            <div class="card-icon">
              <span class="material-icons">school</span>
            </div>
            <div class="card-content">
              <h3>{{ analytics.overview.totalStudents }}</h3>
              <p>Total Students</p>
            </div>
          </div>
          
          <div class="overview-card teachers">
            <div class="card-icon">
              <span class="material-icons">person</span>
            </div>
            <div class="card-content">
              <h3>{{ analytics.overview.totalTeachers }}</h3>
              <p>Total Teachers</p>
            </div>
          </div>
          
          <div class="overview-card exams">
            <div class="card-icon">
              <span class="material-icons">quiz</span>
            </div>
            <div class="card-content">
              <h3>{{ analytics.overview.totalExams }}</h3>
              <p>Total Exams</p>
            </div>
          </div>
          
          <div class="overview-card subjects">
            <div class="card-icon">
              <span class="material-icons">book</span>
            </div>
            <div class="card-content">
              <h3>{{ analytics.overview.totalSubjects }}</h3>
              <p>Total Subjects</p>
            </div>
          </div>
          
          <div class="overview-card active">
            <div class="card-icon">
              <span class="material-icons">play_circle</span>
            </div>
            <div class="card-content">
              <h3>{{ analytics.overview.activeExams }}</h3>
              <p>Active Exams</p>
            </div>
          </div>
          
          <div class="overview-card completed">
            <div class="card-icon">
              <span class="material-icons">check_circle</span>
            </div>
            <div class="card-content">
              <h3>{{ analytics.overview.completedExams }}</h3>
              <p>Completed Exams</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Insights Summary -->
      <div class="insights-summary">
        <h2>Key Performance Insights</h2>
        <div class="insights-grid">
          <div class="insight-card">
            <div class="insight-content">
              <h4>Overall Performance</h4>
              <p v-if="analytics.studentPerformance.overallAverageScore >= 85">
                Students are performing exceptionally well with an average score of 
                <strong>{{ analytics.studentPerformance.overallAverageScore.toFixed(1) }}%</strong>
              </p>
              <p v-else-if="analytics.studentPerformance.overallAverageScore >= 75">
                Students are meeting expectations with an average score of 
                <strong>{{ analytics.studentPerformance.overallAverageScore.toFixed(1) }}%</strong>
              </p>
              <p v-else-if="analytics.studentPerformance.overallAverageScore >= 60">
                Students have an average score of 
                <strong>{{ analytics.studentPerformance.overallAverageScore.toFixed(1) }}%</strong> 
                and may need additional support.
              </p>
              <p v-else>
                Students have an average score of 
                <strong>{{ analytics.studentPerformance.overallAverageScore.toFixed(1) }}%</strong> 
                and require immediate intervention.
              </p>
            </div>
          </div>
          
          <div class="insight-card">
            <div class="insight-content">
              <h4>Top Performer</h4>
              <p>
                <strong>{{ analytics.studentPerformance.highestPerformingGrade.gradeLevel }}-{{ analytics.studentPerformance.highestPerformingSection.section }}</strong> 
                is the best performing section with an average score of 
                <strong>{{ analytics.studentPerformance.highestPerformingSection.averageScore.toFixed(1) }}%</strong>
              </p>
            </div>
          </div>
          
          <div class="insight-card">
            <div class="insight-content">
              <h4>Performance Trends</h4>
              <p>
                Based on recent data, the system shows 
                <strong>{{ analytics.studentPerformance.performanceTrends.length }}</strong> 
                performance tracking points with consistent monitoring.
              </p>
            </div>
          </div>
          
          <div class="insight-card">
            <div class="insight-content">
              <h4>Exam Activity</h4>
              <p>
                Students have taken a total of 
                <strong>{{ analytics.studentPerformance.totalExamsTaken }}</strong> 
                exams across all subjects and grade levels.
              </p>
            </div>
          </div>
        </div>
      </div>

        <!-- Student Performance Section -->
      <div class="performance-section">
        <h2>Student Performance</h2>
        
        <!-- Performance Overview Cards -->
        <div class="performance-overview">
          <div class="performance-card overall">
            <h3>Overall Performance</h3>
            <div class="performance-metrics">
              <div class="metric">
                <span class="metric-value">{{ analytics.studentPerformance.overallAverageScore.toFixed(1) }}%</span>
                <span class="metric-label">Average Score</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ analytics.studentPerformance.overallMaxScore.toFixed(1) }}%</span>
                <span class="metric-label">Highest Score</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ analytics.studentPerformance.overallMinScore.toFixed(1) }}%</span>
                <span class="metric-label">Lowest Score</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ analytics.studentPerformance.totalExamsTaken }}</span>
                <span class="metric-label">Total Exams</span>
              </div>
            </div>
          </div>
          
          <!-- Highest Performing Grade & Section -->
          <div class="performance-highlights">
            <div class="highlight-card">
              <h4>Best Performing Grade</h4>
              <div class="highlight-content">
                <span class="highlight-value">Grade {{ analytics.studentPerformance.highestPerformingGrade.gradeLevel }}</span>
                <span class="highlight-score">{{ analytics.studentPerformance.highestPerformingGrade.averageScore.toFixed(1) }}%</span>
                <span class="highlight-details">{{ analytics.studentPerformance.highestPerformingGrade.studentCount }} students</span>
              </div>
            </div>
            
            <div class="highlight-card">
              <h4>Best Performing Section</h4>
              <div class="highlight-content">
                <span class="highlight-value">{{ analytics.studentPerformance.highestPerformingSection.gradeLevel }}-{{ analytics.studentPerformance.highestPerformingSection.section }}</span>
                <span class="highlight-score">{{ analytics.studentPerformance.highestPerformingSection.averageScore.toFixed(1) }}%</span>
                <span class="highlight-details">{{ analytics.studentPerformance.highestPerformingSection.studentCount }} students</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Performance Charts -->
        <div class="performance-charts">
          <div class="chart-container">
            <h3>Grade Performance Overview</h3>
            <div class="chart-wrapper">
              <canvas ref="gradeChart" width="400" height="200"></canvas>
            </div>
          </div>
          
          <div class="chart-container">
            <h3>Section Performance Overview</h3>
            <div class="chart-wrapper">
              <canvas ref="sectionChart" width="400" height="200"></canvas>
            </div>
          </div>
          
          <div class="chart-container">
            <h3>Performance Trends Over Time</h3>
            <div class="chart-wrapper">
              <canvas ref="trendsChart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>
        
        <!-- Grade Distribution Table -->
        <div class="grade-distribution-table">
          <h3>Detailed Grade Performance</h3>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Grade</th>
                  <th>Students</th>
                  <th>Avg Score</th>
                  <th>Max Score</th>
                  <th>Min Score</th>
                  <th>Pass Rate</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="grade in analytics.studentPerformance.gradeDistribution" 
                  :key="grade.gradeLevel"
                  :class="getPerformanceClass(grade.performanceTrend)"
                >
                  <td><strong>Grade {{ grade.gradeLevel }}</strong></td>
                  <td>{{ grade.studentCount }}</td>
                  <td>{{ grade.averageScore.toFixed(1) }}%</td>
                  <td>{{ grade.maxScore.toFixed(1) }}%</td>
                  <td>{{ grade.minScore.toFixed(1) }}%</td>
                  <td>{{ grade.passRate.toFixed(1) }}%</td>
                  <td>
                    <span class="trend-badge" :class="grade.performanceTrend">
                      {{ getTrendLabel(grade.performanceTrend) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Top and Low Performers -->
        <div class="performers-section">
          <div class="performers-card top">
            <h3>Top Performers</h3>
            <div class="performers-list">
              <div 
                v-for="(student, index) in analytics.studentPerformance.topPerformers" 
                :key="student.id"
                class="performer-item"
              >
                <div class="rank">{{ index + 1 }}</div>
                <div class="student-info">
                  <div class="student-name">{{ student.firstName }} {{ student.lastName }}</div>
                  <div class="student-details">Grade {{ student.gradeLevel }}-{{ student.section }}</div>
                </div>
                <div class="performance-stats">
                  <span class="score">{{ student.averageScore.toFixed(1) }}%</span>
                  <span class="exams">{{ student.totalExamsTaken }} exams</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="performers-card low">
            <h3>Low Performers</h3>
            <div class="performers-list">
              <div 
                v-for="(student, index) in analytics.studentPerformance.lowPerformers" 
                :key="student.id"
                class="performer-item"
              >
                <div class="rank">{{ index + 1 }}</div>
                <div class="student-info">
                  <div class="student-name">{{ student.firstName }} {{ student.lastName }}</div>
                  <div class="student-details">Grade {{ student.gradeLevel }}-{{ student.section }}</div>
                </div>
                <div class="performance-stats">
                  <span class="score">{{ student.averageScore.toFixed(1) }}%</span>
                  <span class="exams">{{ student.totalExamsTaken }} exams</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Exam Analytics Section -->
      <div class="exam-analytics-section">
        <h2>Exam Analytics</h2>
        <div class="exam-stats-grid">
          <div 
            v-for="exam in analytics.examAnalytics.examStatistics" 
            :key="exam.id"
            class="exam-stat-card"
          >
            <div class="exam-header">
              <h4>{{ exam.examTitle }}</h4>
              <span class="exam-code">{{ exam.testCode }}</span>
            </div>
            <div class="exam-metrics">
              <div class="metric">
                <span class="metric-value">{{ exam.totalAttempts }}</span>
                <span class="metric-label">Attempts</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ exam.averageScore.toFixed(1) }}%</span>
                <span class="metric-label">Avg Score</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ exam.passRate.toFixed(1) }}%</span>
                <span class="metric-label">Pass Rate</span>
              </div>
            </div>
            <div class="exam-footer">
              <span class="created-by">by {{ exam.createdBy }}</span>
              <span class="created-date">{{ formatDate(exam.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance Analytics Section -->
      <div class="attendance-section">
        <h2>Attendance Analytics</h2>
        <div class="attendance-overview">
          <div class="attendance-card overall">
            <h3>Overall Attendance</h3>
            <div class="attendance-rate">
              <span class="rate-value">{{ analytics.attendanceAnalytics.overallAttendanceRate.toFixed(1) }}%</span>
              <span class="rate-label">Attendance Rate</span>
            </div>
          </div>
          
          <div class="attendance-card subjects">
            <h3>Subject-wise Attendance</h3>
            <div class="subject-attendance-list">
              <div 
                v-for="subject in analytics.attendanceAnalytics.subjectWiseAttendance" 
                :key="subject.subjectCode"
                class="subject-attendance-item"
              >
                <div class="subject-info">
                  <span class="subject-name">{{ subject.subjectName }}</span>
                  <span class="subject-code">{{ subject.subjectCode }}</span>
                </div>
                <div class="attendance-stats">
                  <span class="attendance-rate">{{ subject.averageAttendanceRate.toFixed(1) }}%</span>
                  <span class="session-count">{{ subject.totalSessions }} sessions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Task Analytics Section -->
      <div class="task-analytics-section">
        <h2>Task Analytics</h2>
        <div class="task-overview">
          <div class="task-summary">
            <div class="task-stat">
              <span class="stat-value">{{ analytics.taskAnalytics.totalTasks }}</span>
              <span class="stat-label">Total Tasks</span>
            </div>
            <div class="task-stat">
              <span class="stat-value">{{ analytics.taskAnalytics.completedTasks }}</span>
              <span class="stat-label">Completed</span>
            </div>
            <div class="task-stat">
              <span class="stat-value">{{ analytics.taskAnalytics.pendingTasks }}</span>
              <span class="stat-label">Pending</span>
            </div>
            <div class="task-stat">
              <span class="stat-value">{{ analytics.taskAnalytics.averageSubmissionRate.toFixed(1) }}%</span>
              <span class="stat-label">Submission Rate</span>
            </div>
          </div>
          
          <div class="subject-tasks">
            <h3>Subject-wise Task Performance</h3>
            <div class="subject-task-list">
              <div 
                v-for="subject in analytics.taskAnalytics.subjectWiseTasks" 
                :key="subject.subjectName"
                class="subject-task-item"
              >
                <div class="subject-info">
                  <span class="subject-name">{{ subject.subjectName }}</span>
                </div>
                <div class="task-stats">
                  <span class="task-count">{{ subject.totalTasks }} tasks</span>
                  <span class="submission-rate">{{ subject.submissionRate.toFixed(1) }}% submission</span>
                  <span class="avg-score">{{ subject.averageScore.toFixed(1) }} avg score</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Usage Section -->
      <div class="system-usage-section">
        <h2>System Usage</h2>
        <div class="usage-grid">
          <div class="usage-card">
            <h3>Active Users</h3>
            <div class="user-counts">
              <div class="user-count">
                <span class="count-value">{{ analytics.systemUsage.activeUsers.students }}</span>
                <span class="count-label">Students</span>
              </div>
              <div class="user-count">
                <span class="count-value">{{ analytics.systemUsage.activeUsers.teachers }}</span>
                <span class="count-label">Teachers</span>
              </div>
              <div class="user-count">
                <span class="count-value">{{ analytics.systemUsage.activeUsers.admins }}</span>
                <span class="count-label">Admins</span>
              </div>
            </div>
          </div>
          
          <div class="usage-card">
            <h3>Archived Users</h3>
            <div class="user-counts">
              <div class="user-count">
                <span class="count-value">{{ analytics.systemUsage.archivedUsers.students }}</span>
                <span class="count-label">Students</span>
              </div>
              <div class="user-count">
                <span class="count-value">{{ analytics.systemUsage.archivedUsers.teachers }}</span>
                <span class="count-label">Teachers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Survey Analytics Section -->
      <div class="survey-analytics-section">
        <h2>Survey Analytics</h2>
        <div class="survey-overview">
          <div class="survey-summary">
            <div class="survey-stat">
              <span class="stat-value">{{ analytics.surveyAnalytics.totalSurveys }}</span>
              <span class="stat-label">Total Surveys</span>
            </div>
            <div class="survey-stat">
              <span class="stat-value">{{ analytics.surveyAnalytics.activeSurveys }}</span>
              <span class="stat-label">Active Surveys</span>
            </div>
            <div class="survey-stat">
              <span class="stat-value">{{ analytics.surveyAnalytics.totalResponses }}</span>
              <span class="stat-label">Total Responses</span>
            </div>
            <div class="survey-stat">
              <span class="stat-value">{{ analytics.surveyAnalytics.averageResponseRate.toFixed(1) }}</span>
              <span class="stat-label">Avg Response Rate</span>
            </div>
          </div>
          
          <div class="recent-surveys">
            <h3>Recent Surveys</h3>
            <div class="survey-list">
              <div 
                v-for="survey in analytics.surveyAnalytics.recentSurveys" 
                :key="survey.id"
                class="survey-item"
              >
                <div class="survey-info">
                  <span class="survey-title">{{ survey.title }}</span>
                  <span class="survey-date">{{ formatDate(survey.createdAt) }}</span>
                </div>
                <div class="survey-stats">
                  <span class="response-count">{{ survey.responseCount }} responses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue';
import { getAdminAnalytics } from '@/services/authService';
import { renderBarChart, renderLineChart } from '@/utils/chartUtils';

export default {
  name: 'AdminDashboard',
  setup() {
    const analytics = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const filters = ref({
      startDate: '',
      endDate: ''
    });

    // Chart references
    const gradeChart = ref(null);
    const sectionChart = ref(null);
    const trendsChart = ref(null);

    const fetchAnalytics = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        const response = await getAdminAnalytics(filters.value);
        analytics.value = response.data;
        
        // Wait for DOM update then render charts
        await nextTick();
        renderCharts();
      } catch (err) {
        error.value = err.message || 'Failed to fetch analytics data';
        console.error('Error fetching analytics:', err);
      } finally {
        loading.value = false;
      }
    };

    const renderCharts = () => {
      if (!analytics.value?.chartData) return;
      
      // Render grade performance chart
      if (gradeChart.value && analytics.value.chartData.gradePerformanceChart) {
        renderChart(gradeChart.value, analytics.value.chartData.gradePerformanceChart, 'Grade Performance');
      }
      
      // Render section performance chart
      if (sectionChart.value && analytics.value.chartData.sectionPerformanceChart) {
        renderChart(sectionChart.value, analytics.value.chartData.sectionPerformanceChart, 'Section Performance');
      }
      
      // Render performance trends chart
      if (trendsChart.value && analytics.value.chartData.performanceTrendsChart) {
        renderLineChart(trendsChart.value, analytics.value.chartData.performanceTrendsChart, 'Performance Trends');
      }
    };

    const renderChart = (canvas, chartData, title) => {
      // Use our custom chart utility
      renderBarChart(canvas, chartData, { title });
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const getPerformanceClass = (trend) => {
      switch(trend) {
        case 'excellent': return 'performance-excellent';
        case 'good': return 'performance-good';
        case 'fair': return 'performance-fair';
        case 'needs_improvement': return 'performance-needs-improvement';
        default: return '';
      }
    };

    const getTrendLabel = (trend) => {
      switch(trend) {
        case 'excellent': return 'Excellent';
        case 'good': return 'Good';
        case 'fair': return 'Fair';
        case 'needs_improvement': return 'Needs Improvement';
        default: return 'Unknown';
      }
    };

    onMounted(() => {
      // Set default date range to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      filters.value.startDate = firstDay.toISOString().split('T')[0];
      filters.value.endDate = lastDay.toISOString().split('T')[0];
      
      fetchAnalytics();
    });

    return {
      analytics,
      loading,
      error,
      filters,
      gradeChart,
      sectionChart,
      trendsChart,
      fetchAnalytics,
      formatDate,
      getPerformanceClass,
      getTrendLabel
    };
  }
};
</script>

<style scoped>
.admin-dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dashboard-header h1 {
  margin: 0;
  color: #333;
  font-size: 2rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.date-filters {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}

.refresh-btn:hover {
  background: #1976D2;
}

.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  color: #d32f2f;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.retry-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.overview-section, .performance-section, .exam-analytics-section,
.attendance-section, .task-analytics-section, .system-usage-section,
.survey-analytics-section, .insights-summary {
  background: white;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.overview-section h2, .performance-section h2, .exam-analytics-section h2,
.attendance-section h2, .task-analytics-section h2, .system-usage-section h2,
.survey-analytics-section h2, .insights-summary h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
}

.insights-summary {
  margin-bottom: 30px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.insight-card {
  padding: 20px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: box-shadow 0.3s;
}

.insight-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.insight-content h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.1rem;
}

.insight-content p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.insight-content strong {
  color: #2196F3;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.overview-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  color: white;
  transition: transform 0.3s;
}

.overview-card:hover {
  transform: translateY(-2px);
}

.overview-card.students { background: linear-gradient(135deg, #4CAF50, #45a049); }
.overview-card.teachers { background: linear-gradient(135deg, #2196F3, #1976D2); }
.overview-card.exams { background: linear-gradient(135deg, #FF9800, #f57c00); }
.overview-card.subjects { background: linear-gradient(135deg, #9C27B0, #7b1fa2); }
.overview-card.active { background: linear-gradient(135deg, #4CAF50, #45a049); }
.overview-card.completed { background: linear-gradient(135deg, #607D8B, #455a64); }

.card-icon {
  margin-right: 15px;
}

.card-icon .material-icons {
  font-size: 2rem;
}

.card-content h3 {
  margin: 0 0 5px 0;
  font-size: 2rem;
  font-weight: bold;
}

.card-content p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.performance-overview {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

.performance-card {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.performance-card h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.performance-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.metric {
  text-align: center;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 6px;
}

.metric-value {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: #2196F3;
}

.metric-label {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.performance-highlights {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.highlight-card {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  color: #333;
}

.highlight-card h4 {
  margin: 0 0 15px 0;
  font-size: 1rem;
}

.highlight-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.highlight-value {
  font-size: 1.5rem;
  font-weight: bold;
}

.highlight-score {
  font-size: 2rem;
  font-weight: bold;
}

.highlight-details {
  font-size: 0.9rem;
  opacity: 0.9;
}

.performance-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 30px;
}

.chart-container {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.chart-container h3 {
  margin: 0 0 20px 0;
  color: #333;
  text-align: center;
}

.chart-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
}

.grade-distribution-table {
  margin-bottom: 30px;
}

.grade-distribution-table h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.table-container {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  background: #f5f5f5;
  font-weight: bold;
  color: #333;
}

td {
  color: #666;
}

.performance-excellent {
  background: rgba(76, 175, 80, 0.1);
}

.performance-good {
  background: rgba(33, 150, 243, 0.1);
}

.performance-fair {
  background: rgba(255, 152, 0, 0.1);
}

.performance-needs-improvement {
  background: rgba(244, 67, 54, 0.1);
}

.trend-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
}

.trend-badge.excellent {
  background: rgba(76, 175, 80, 0.2);
  color: #2e7d32;
}

.trend-badge.good {
  background: rgba(33, 150, 243, 0.2);
  color: #1565c0;
}

.trend-badge.fair {
  background: rgba(255, 152, 0, 0.2);
  color: #ef6c00;
}

.trend-badge.needs_improvement {
  background: rgba(244, 67, 54, 0.2);
  color: #c62828;
}

.performers-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.performers-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.performers-card h3 {
  margin: 0 0 15px 0;
  color: #333;
  text-align: center;
}

.performers-card.top h3 {
  color: #4CAF50;
}

.performers-card.low h3 {
  color: #f44336;
}

.performers-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.performer-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.rank {
  width: 30px;
  height: 30px;
  background: #2196F3;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
}

.student-info {
  flex: 1;
}

.student-name {
  font-weight: bold;
  color: #333;
}

.student-details {
  font-size: 12px;
  color: #666;
}

.performance-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.score {
  font-weight: bold;
  color: #2196F3;
}

.exams {
  font-size: 12px;
  color: #666;
}

.exam-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.exam-stat-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  transition: transform 0.3s;
}

.exam-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.exam-header {
  margin-bottom: 15px;
}

.exam-header h4 {
  margin: 0 0 5px 0;
  color: #333;
}

.exam-code {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
}

.exam-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.metric {
  text-align: center;
}

.metric-value {
  display: block;
  font-size: 1.5rem;
  font-weight: bold;
  color: #2196F3;
}

.metric-label {
  font-size: 12px;
  color: #666;
}

.exam-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  border-top: 1px solid #e0e0e0;
  padding-top: 10px;
}

.attendance-overview {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.attendance-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.attendance-card h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.attendance-rate {
  text-align: center;
}

.rate-value {
  display: block;
  font-size: 3rem;
  font-weight: bold;
  color: #4CAF50;
}

.rate-label {
  font-size: 14px;
  color: #666;
}

.subject-attendance-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.subject-attendance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.subject-info {
  display: flex;
  flex-direction: column;
}

.subject-name {
  font-weight: bold;
  color: #333;
}

.subject-code {
  font-size: 12px;
  color: #666;
}

.attendance-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.attendance-rate {
  font-weight: bold;
  color: #4CAF50;
}

.session-count {
  font-size: 12px;
  color: #666;
}

.task-overview {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.task-stat {
  text-align: center;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #2196F3;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.subject-tasks h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.subject-task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.subject-task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.subject-name {
  font-weight: bold;
  color: #333;
}

.task-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
}

.task-count, .submission-rate, .avg-score {
  color: #666;
}

.usage-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.usage-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.usage-card h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.user-counts {
  display: flex;
  justify-content: space-around;
}

.user-count {
  text-align: center;
}

.count-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #2196F3;
}

.count-label {
  font-size: 14px;
  color: #666;
}

.survey-overview {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.survey-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.survey-stat {
  text-align: center;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.recent-surveys h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.survey-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.survey-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.survey-info {
  display: flex;
  flex-direction: column;
}

.survey-title {
  font-weight: bold;
  color: #333;
}

.survey-date {
  font-size: 12px;
  color: #666;
}

.response-count {
  font-weight: bold;
  color: #1976D2;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .overview-cards {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .insights-grid {
    grid-template-columns: 1fr;
  }
  
  .performance-overview {
    grid-template-columns: 1fr;
  }
  
  .performance-metrics {
    grid-template-columns: 1fr;
  }
  
  .performance-charts {
    grid-template-columns: 1fr;
  }
  
  .chart-wrapper {
    height: 250px;
  }
  
  .performers-section,
  .attendance-overview,
  .usage-grid {
    grid-template-columns: 1fr;
  }
  
  .task-summary,
  .survey-summary {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .exam-stats-grid {
    grid-template-columns: 1fr;
  }
  
  .table-container {
    font-size: 12px;
  }
  
  th, td {
    padding: 8px 6px;
  }
}
</style> 