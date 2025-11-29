<template>
  <div class="student-performance">
    <!-- Header Container -->
    <div class="header-container">
      <div class="header-content">
        <div class="title-row">
          <router-link :to="{ name: 'TeacherClassList' }" class="back-btn">
            <span class="material-icons">arrow_back</span>
          </router-link>
          <div class="title-content">
            <h1>{{ studentName || 'Student Performance' }}<span class="material-icons">person</span></h1>
            <div class="student-details">
              <p v-if="studentLRN" class="student-lrn">LRN: {{ studentLRN }}</p>
              <p v-if="studentGrade || studentSection" class="student-grade-section">
                <span v-if="studentGrade">Grade {{ studentGrade }}</span>
                <span v-if="studentSection"> • Section {{ studentSection }}</span>
              </p>
            </div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">View exam performance and analytics</p>
        </div>
      </div>
      <div class="header-background">PERFORMANCE</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading exam performance...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadStudentPerformance" class="retry-btn">Retry</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!examResults || examResults.length === 0" class="empty-state">
      <span class="material-icons">assessment</span>
      <p>No exam performance data available</p>
      <p class="subtitle">This student hasn't taken any exams yet</p>
    </div>

    <!-- Performance Analytics -->
    <div v-else class="performance-container">
      <!-- Performance Status Banner -->
      <div v-if="averageScore > 0" class="performance-status-banner" :class="getPerformanceStatusClass()">
        <div class="status-content">
          <span class="material-icons status-icon">{{ getPerformanceStatusIcon() }}</span>
          <div class="status-text">
            <h3>{{ getPerformanceStatusTitle() }}</h3>
            <p>{{ getPerformanceStatusMessage() }}</p>
          </div>
        </div>
      </div>

      <!-- Analytics Cards -->
      <div class="analytics-cards">
        <div class="analytics-card">
          <div class="card-icon">
            <span class="material-icons">assessment</span>
          </div>
          <div class="card-content">
            <h3>Total Exams</h3>
            <p class="card-value">{{ examResults.length }}</p>
          </div>
        </div>

        <div class="analytics-card">
          <div class="card-icon">
            <span class="material-icons">trending_up</span>
          </div>
          <div class="card-content">
            <h3>Average Score</h3>
            <p class="card-value">{{ averageScore.toFixed(2) }}%</p>
          </div>
        </div>

        <div class="analytics-card">
          <div class="card-icon">
            <span class="material-icons">check_circle</span>
          </div>
          <div class="card-content">
            <h3>Highest Score</h3>
            <p class="card-value">{{ highestScore }}%</p>
          </div>
        </div>

        <div class="analytics-card">
          <div class="card-icon">
            <span class="material-icons">trending_down</span>
          </div>
          <div class="card-content">
            <h3>Lowest Score</h3>
            <p class="card-value">{{ lowestScore }}%</p>
          </div>
        </div>
      </div>

      <!-- Exam Results Table -->
      <div class="results-section">
        <div class="section-header-bar">
          <h2>
            <span class="material-icons">assessment</span>
            Exam Results
          </h2>
        </div>
        <div class="table-container">
          <table class="results-table">
            <thead>
              <tr>
                <th>Exam Title</th>
                <th>Test Code</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Date Taken</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="result in sortedExamResults" :key="result.id" :class="getScoreClass(result.percentage)">
                <td class="exam-title">{{ result.exam?.examTitle || 'N/A' }}</td>
                <td class="test-code">{{ result.exam?.testCode || 'N/A' }}</td>
                <td class="score">{{ result.score }}/{{ result.total }}</td>
                <td class="percentage">
                  <span class="percentage-badge" :class="getScoreClass(result.percentage)">
                    {{ result.percentage.toFixed(2) }}%
                  </span>
                </td>
                <td class="date-taken">{{ formatDate(result.submittedAt) }}</td>
                <td class="actions">
                  <router-link 
                    :to="{ name: 'StudentAnswerDetails', params: { examId: result.exam?.id, studentId: route.params.studentId } }"
                    class="view-details-btn"
                    title="View detailed answers">
                    <span class="material-icons">visibility</span>
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Performance Chart -->
      <div class="chart-section">
        <div class="section-header-bar">
          <h2>
            <span class="material-icons">show_chart</span>
            Score Trend
          </h2>
        </div>
        <div class="chart-container">
          <canvas id="performanceChart"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { BASE_URL } from '@/services/authService';
import Chart from 'chart.js/auto';

const route = useRoute();

const loading = ref(true);
const error = ref(null);
const examResults = ref([]);
const studentName = ref('');
const studentLRN = ref('');
const studentGrade = ref('');
const studentSection = ref('');
let performanceChart = null;

// Computed properties for analytics
const averageScore = computed(() => {
  if (!examResults.value || examResults.value.length === 0) return 0;
  const sum = examResults.value.reduce((acc, result) => acc + result.percentage, 0);
  return sum / examResults.value.length;
});

const highestScore = computed(() => {
  if (!examResults.value || examResults.value.length === 0) return 0;
  return Math.max(...examResults.value.map(r => r.percentage)).toFixed(2);
});

const lowestScore = computed(() => {
  if (!examResults.value || examResults.value.length === 0) return 0;
  return Math.min(...examResults.value.map(r => r.percentage)).toFixed(2);
});

const sortedExamResults = computed(() => {
  return [...(examResults.value || [])].sort((a, b) => 
    new Date(b.submittedAt) - new Date(a.submittedAt)
  );
});

// Helper function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Helper function to get score CSS class
function getScoreClass(percentage) {
  if (percentage >= 80) return 'excellent';
  if (percentage >= 70) return 'good';
  if (percentage >= 60) return 'fair';
  return 'poor';
}

// Helper function to determine performance status class
function getPerformanceStatusClass() {
  const avg = averageScore.value;
  if (avg >= 85) return 'excellent';
  if (avg >= 75) return 'good';
  if (avg >= 60) return 'fair';
  return 'needs-attention';
}

// Helper function to get performance status icon
function getPerformanceStatusIcon() {
  const avg = averageScore.value;
  if (avg >= 75) return 'check_circle';
  if (avg >= 60) return 'info';
  return 'warning';
}

// Helper function to get performance status title
function getPerformanceStatusTitle() {
  const avg = averageScore.value;
  if (avg >= 85) return 'Excellent Performance!';
  if (avg >= 75) return 'Good Performance';
  if (avg >= 60) return 'Fair Performance';
  return 'Needs Attention';
}

// Helper function to get performance status message
function getPerformanceStatusMessage() {
  const avg = averageScore.value;
  if (avg >= 85) return `This student is performing excellently with an average score of ${avg.toFixed(2)}%. Keep up the great work!`;
  if (avg >= 75) return `This student is performing well with an average score of ${avg.toFixed(2)}%. Continue to monitor progress.`;
  if (avg >= 60) return `This student has a fair performance with an average score of ${avg.toFixed(2)}%. Consider providing additional support.`;
  return `This student needs attention with an average score of ${avg.toFixed(2)}%. Consider intervention strategies to improve performance.`;
}

// Fetch student exam performance from API
async function loadStudentPerformance() {
  try {
    loading.value = true;
    error.value = null;
    
    const studentId = route.params.studentId;
    const token = localStorage.getItem('jwtToken');

    const response = await fetch(`${BASE_URL}/teacher/student/${studentId}/exam-performance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch exam performance: ${response.statusText}`);
    }

    const data = await response.json();
    examResults.value = data.examResults || [];
    
    // Extract student info from response
    if (data.student) {
      studentName.value = `${data.student.firstName || ''} ${data.student.lastName || ''}`.trim();
      studentLRN.value = data.student.lrn || 'N/A';
      studentGrade.value = data.student.grade || '';
      studentSection.value = data.student.section || '';
    }

    // Initialize chart after data is loaded
    setTimeout(() => initializeChart(), 100);
  } catch (err) {
    console.error('Error loading exam performance:', err);
    error.value = err.message || 'Failed to load exam performance data';
  } finally {
    loading.value = false;
  }
}

// Initialize Chart.js for performance visualization
function initializeChart() {
  const ctx = document.getElementById('performanceChart');
  if (!ctx || !examResults.value || examResults.value.length === 0) return;

  // Destroy existing chart if it exists
  if (performanceChart) {
    performanceChart.destroy();
  }

  const sortedResults = sortedExamResults.value;
  
  performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedResults.map(r => r.exam?.examTitle?.substring(0, 15) || 'Exam'),
      datasets: [
        {
          label: 'Score (%)',
          data: sortedResults.map(r => r.percentage),
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#667eea',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      }
    }
  });
}

// Load data on component mount
onMounted(() => {
  loadStudentPerformance();
});
</script>

<style scoped>
.student-performance {
  min-height: 100vh;
 
  padding-bottom: 40px;
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Header Container */
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

.title-row {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  margin-bottom: 1rem;
}

.title-content {
  flex: 1;
}

.student-details {
  margin-top: 8px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background: #e8f5e9;
  border: 1px solid #159750;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #159750;
  text-decoration: none;
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

.student-lrn {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.student-grade-section {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: #999;
  font-weight: 400;
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
  margin: 0;
}

.header-text {
  margin: 0;
}

/* Loading State */
.loading-state,
.error-state,
.empty-state {
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

.error-state {
  background: white;
  margin: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.error-state p {
  margin: 10px 0;
  font-size: 16px;
  color: #333;
}

.empty-state {
  background: white;
  margin: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

.empty-state .material-icons {
  font-size: 64px;
  margin-bottom: 20px;
  color: #ddd;
}

.empty-state .subtitle {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 8px;
  color: #666;
}

/* Performance Status Banner */
.performance-status-banner {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border-left: 5px solid;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.performance-status-banner.excellent {
  border-left-color: #4caf50;
  background: linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%);
}

.performance-status-banner.good {
  border-left-color: #8bc34a;
  background: linear-gradient(135deg, #f1f8e9 0%, #ffffff 100%);
}

.performance-status-banner.fair {
  border-left-color: #ffc107;
  background: linear-gradient(135deg, #fff8e1 0%, #ffffff 100%);
}

.performance-status-banner.needs-attention {
  border-left-color: #f44336;
  background: linear-gradient(135deg, #ffebee 0%, #ffffff 100%);
}

.status-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.status-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.performance-status-banner.excellent .status-icon {
  color: #4caf50;
}

.performance-status-banner.good .status-icon {
  color: #8bc34a;
}

.performance-status-banner.fair .status-icon {
  color: #ffc107;
}

.performance-status-banner.needs-attention .status-icon {
  color: #f44336;
}

.status-text {
  flex: 1;
}

.status-text h3 {
  margin: 0 0 5px 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
}

.status-text p {
  margin: 0;
  font-size: 0.95rem;
  color: #666;
  line-height: 1.5;
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
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #d32f2f;
}

/* Performance Container */
.performance-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

/* Analytics Cards */
.analytics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.analytics-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid #159750;
}

.analytics-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background-color: #159750;
  color: white;
  border-radius: 8px;
  flex-shrink: 0;
}

.card-icon .material-icons {
  font-size: 32px;
}

.card-content {
  flex: 1;
}

.card-content h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-value {
  margin: 8px 0 0 0;
  font-size: 28px;
  font-weight: bold;
  color: #159750;
}

/* Results Section */
.results-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.section-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.section-header-bar h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-header-bar h2 .material-icons {
  color: #159750;
  font-size: 1.5rem;
}

.table-container {
  overflow-x: auto;
}

.results-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.results-table thead {
  background-color: #159750;
  color: white;
}

.results-table th {
  padding: 16px;
  text-align: left;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.results-table td {
  padding: 16px;
  border-bottom: 1px solid #eee;
  color: #333;
}

.results-table tr {
  transition: all 0.3s ease;
}

.results-table tbody tr:hover {
  background-color: #f5f5f5;
}

.results-table tr.excellent {
  border-left: 4px solid #4caf50;
}

.results-table tr.good {
  border-left: 4px solid #2196f3;
}

.results-table tr.fair {
  border-left: 4px solid #ff9800;
}

.results-table tr.poor {
  border-left: 4px solid #f44336;
}

.exam-title {
  font-weight: 600;
  max-width: 250px;
  word-break: break-word;
}

.test-code {
  font-family: 'Courier New', monospace;
  font-weight: 600;
  color: #159750;
}

.score {
  font-weight: 600;
}

.percentage-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
}

.percentage-badge.excellent {
  background: #4caf50;
  color: white;
}

.percentage-badge.good {
  background: #2196f3;
  color: white;
}

.percentage-badge.fair {
  background: #ff9800;
  color: white;
}

.percentage-badge.poor {
  background: #f44336;
  color: white;
}

.date-taken {
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.actions {
  text-align: center;
}

.view-details-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: #159750;
  color: white;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
}

.view-details-btn:hover {
  background-color: #117a3f;
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(21, 151, 80, 0.4);
}

.view-details-btn .material-icons {
  font-size: 20px;
}

/* Chart Section */
.chart-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}


.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
}

#performanceChart {
  max-height: 300px;
}

/* High DPI and Small Laptop Screens - 1536px and below */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .student-performance {
    padding: 1.6rem;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .header-content h1 .material-icons {
    font-size: 2rem;
  }

  .header-background {
    font-size: 6rem;
    right: 4rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .divider {
    margin: 1.2rem 0;
  }

  .title-row {
    gap: 12px;
  }

  .back-btn {
    width: 36px;
    height: 36px;
  }

  .back-btn .material-icons {
    font-size: 1.3rem;
  }

  .student-lrn {
    font-size: 0.85rem;
  }

  .student-grade-section {
    font-size: 0.8rem;
  }

  .analytics-cards {
    gap: 15px;
  }

  .analytics-card {
    padding: 20px;
  }

  .card-icon {
    width: 56px;
    height: 56px;
  }

  .card-icon .material-icons {
    font-size: 28px;
  }

  .card-value {
    font-size: 24px;
  }

  .results-section,
  .chart-section {
    padding: 24px;
  }

  .results-table th,
  .results-table td {
    padding: 12px;
    font-size: 0.85rem;
  }
}

/* 1280px to 1366px - Desktop */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .student-performance {
    padding: 1.4rem;
  }

  .header-content h1 {
    font-size: 1.8rem;
  }

  .header-content h1 .material-icons {
    font-size: 1.8rem;
  }

  .header-background {
    font-size: 5rem;
    right: 3rem;
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .divider {
    margin: 1rem 0;
  }

  .title-row {
    gap: 10px;
  }

  .back-btn {
    width: 32px;
    height: 32px;
  }

  .back-btn .material-icons {
    font-size: 1.2rem;
  }

  .student-lrn {
    font-size: 0.8rem;
  }

  .student-grade-section {
    font-size: 0.75rem;
  }

  .analytics-cards {
    gap: 15px;
  }

  .analytics-card {
    padding: 18px;
  }

  .card-icon {
    width: 52px;
    height: 52px;
  }

  .card-icon .material-icons {
    font-size: 26px;
  }

  .card-value {
    font-size: 22px;
  }

  .results-section,
  .chart-section {
    padding: 22px;
  }

  .results-table th,
  .results-table td {
    padding: 10px;
    font-size: 0.8rem;
  }
}

/* 1025px to 1280px - Large Tablet */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .student-performance {
    padding: 1.2rem;
  }

  .header-content h1 {
    font-size: 1.6rem;
  }

  .header-content h1 .material-icons {
    font-size: 1.6rem;
  }

  .header-background {
    font-size: 4rem;
    right: 2rem;
  }

  .subtitle {
    font-size: 0.9rem;
  }

  .divider {
    margin: 0.8rem 0;
  }

  .title-row {
    gap: 8px;
  }

  .back-btn {
    width: 32px;
    height: 32px;
  }

  .back-btn .material-icons {
    font-size: 1.1rem;
  }

  .student-lrn {
    font-size: 0.75rem;
  }

  .student-grade-section {
    font-size: 0.7rem;
  }

  .analytics-cards {
    gap: 12px;
  }

  .analytics-card {
    padding: 16px;
  }

  .card-icon {
    width: 48px;
    height: 48px;
  }

  .card-icon .material-icons {
    font-size: 24px;
  }

  .card-value {
    font-size: 20px;
  }

  .results-section,
  .chart-section {
    padding: 20px;
  }

  .results-table th,
  .results-table td {
    padding: 8px;
    font-size: 0.75rem;
  }
}

/* Tablet and Medium Screens - 768px to 1024px (720p and up) */
@media (max-width: 1024px) {
  .student-performance {
    padding: 10px;
  }

  .header-background {
    font-size: 3rem;
    top: 60%;
    right: 1rem;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .header-content h1 .material-icons {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .divider {
    margin: 1rem 0;
  }

  .title-row {
    gap: 10px;
    flex-wrap: wrap;
  }

  .student-details {
    width: 100%;
    margin-left: 0;
    margin-top: 10px;
  }

  .back-btn {
    width: 36px;
    height: 36px;
  }

  .back-btn .material-icons {
    font-size: 1.3rem;
  }

  .student-lrn {
    font-size: 0.85rem;
  }

  .student-grade-section {
    font-size: 0.8rem;
  }

  .analytics-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .analytics-card {
    padding: 16px;
  }

  .card-icon {
    width: 48px;
    height: 48px;
  }

  .card-icon .material-icons {
    font-size: 24px;
  }

  .card-value {
    font-size: 20px;
  }

  .results-section,
  .chart-section {
    padding: 20px;
  }

  .section-header-bar h2 {
    font-size: 1.3rem;
  }

  .results-table th,
  .results-table td {
    padding: 10px;
    font-size: 0.85rem;
  }

  .exam-title {
    max-width: 150px;
  }
}

/* Small Tablets and Phones - 480px to 768px */
@media (max-width: 768px) {
  .student-performance {
    padding: 12px;
  }

  .performance-status-banner {
    padding: 15px;
    margin-bottom: 20px;
  }

  .status-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .status-icon {
    font-size: 2.5rem;
  }

  .status-text h3 {
    font-size: 1.1rem;
  }

  .status-text p {
    font-size: 0.85rem;
  }

  .header-background {
    font-size: 2.5rem;
    right: 0.5rem;
  }

  .header-content h1 {
    font-size: 1.5rem;
  }

  .header-content h1 .material-icons {
    font-size: 1.5rem;
  }

  .subtitle {
    font-size: 0.85rem;
  }

  .divider {
    margin: 0.8rem 0;
  }

  .title-row {
    gap: 8px;
    flex-wrap: wrap;
  }

  .student-details {
    width: 100%;
    margin-left: 0;
    margin-top: 8px;
  }

  .back-btn {
    width: 32px;
    height: 32px;
  }

  .back-btn .material-icons {
    font-size: 1.2rem;
  }

  .student-lrn {
    font-size: 0.8rem;
  }

  .student-grade-section {
    font-size: 0.75rem;
  }

  .analytics-cards {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .analytics-card {
    padding: 14px;
  }

  .card-icon {
    width: 44px;
    height: 44px;
  }

  .card-icon .material-icons {
    font-size: 22px;
  }

  .card-value {
    font-size: 18px;
  }

  .card-content h3 {
    font-size: 12px;
  }

  .results-section,
  .chart-section {
    padding: 15px;
  }

  .section-header-bar h2 {
    font-size: 1.1rem;
  }

  .results-table {
    font-size: 0.8rem;
  }

  .results-table th,
  .results-table td {
    padding: 8px 6px;
  }

  .exam-title {
    max-width: 100px;
  }

  .percentage-badge {
    padding: 4px 8px;
    font-size: 12px;
  }
}

/* Very Small Phones - Below 480px */
@media (max-width: 480px) {
  .student-performance {
    padding: 10px;
  }

  .performance-status-banner {
    padding: 12px;
    margin-bottom: 15px;
  }

  .status-icon {
    font-size: 2rem;
  }

  .status-text h3 {
    font-size: 1rem;
  }

  .status-text p {
    font-size: 0.8rem;
  }

  .header-background {
    font-size: 2rem;
    right: 0.2rem;
  }

  .header-content h1 {
    font-size: 1.2rem;
  }

  .header-content h1 .material-icons {
    font-size: 1.2rem;
  }

  .subtitle {
    font-size: 0.75rem;
  }

  .divider {
    margin: 0.6rem 0;
  }

  .title-row {
    gap: 6px;
    flex-wrap: wrap;
  }

  .student-details {
    width: 100%;
    margin-left: 0;
    margin-top: 6px;
  }

  .back-btn {
    width: 28px;
    height: 28px;
  }

  .back-btn .material-icons {
    font-size: 1rem;
  }

  .student-lrn {
    font-size: 0.7rem;
  }

  .student-grade-section {
    font-size: 0.65rem;
  }

  .analytics-cards {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .analytics-card {
    padding: 12px;
    gap: 12px;
  }

  .card-icon {
    width: 40px;
    height: 40px;
  }

  .card-icon .material-icons {
    font-size: 20px;
  }

  .card-value {
    font-size: 16px;
  }

  .card-content h3 {
    font-size: 11px;
  }

  .results-section,
  .chart-section {
    padding: 12px;
  }

  .section-header-bar h2 {
    font-size: 1rem;
  }

  .results-table {
    font-size: 0.75rem;
  }

  .results-table th,
  .results-table td {
    padding: 6px 4px;
  }

  .exam-title {
    max-width: 80px;
    font-size: 0.7rem;
  }

  .percentage-badge {
    padding: 3px 6px;
    font-size: 11px;
  }

  .view-details-btn {
    width: 32px;
    height: 32px;
  }

  .view-details-btn .material-icons {
    font-size: 16px;
  }
}
</style>
