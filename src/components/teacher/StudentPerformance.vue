<template>
  <div class="student-performance">
    <!-- Header Container -->
    <div class="header-container">
      <div class="header-background">Performance</div>
      <div class="header-content">
        <div class="title-row">
          <router-link to="/teacher-classlist" class="back-btn">
            <span class="material-icons">arrow_back</span>
          </router-link>
          <h1>{{ studentName }}<span class="material-icons">person</span></h1>
          <div class="student-details">
            <p v-if="studentLRN" class="student-lrn">LRN: {{ studentLRN }}</p>
            <p v-if="studentGrade || studentSection" class="student-grade-section">
              <span v-if="studentGrade">Grade {{ studentGrade }}</span>
              <span v-if="studentSection"> • Section {{ studentSection }}</span>
            </p>
          </div>
        </div>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">View exam performance and analytics</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons rotating">sync</span>
      <p>Loading exam performance...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadStudentPerformance" class="retry-btn">
        <span class="material-icons">refresh</span>
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!examResults || examResults.length === 0" class="empty-state">
      <span class="material-icons">assessment</span>
      <p>No exam performance data available</p>
      <p class="subtitle">This student hasn't taken any exams yet</p>
    </div>

    <!-- Performance Analytics -->
    <div v-else class="performance-container">
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
        <h2>Exam Results</h2>
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
        <h2>Score Trend</h2>
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
  background-color: #f5f5f5;
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
  margin-bottom: 1rem;
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
  align-items: center;
  gap: 15px;
}

.student-details {
  margin-left: auto;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e8f5e9;
  color: #159750;
  text-decoration: none;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.back-btn:hover {
  background: #c8e6c9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
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
  min-height: 400px;
  color: #159750;
  text-align: center;
}

.loading-state .material-icons,
.error-state .material-icons,
.empty-state .material-icons {
  font-size: 64px;
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

.empty-state .subtitle {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 8px;
  color: #666;
}

.retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #159750;
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  margin-top: 20px;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #117a3f;
  transform: scale(1.05);
}

.retry-btn .material-icons {
  font-size: 18px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotating {
  animation: rotate 2s linear infinite;
}

/* Performance Container */
.performance-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Analytics Cards */
.analytics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 40px 0;
}

.analytics-card {
  display: flex;
  align-items: center;
  gap: 20px;
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #159750;
}

.analytics-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
  padding: 32px;
  border-radius: 8px;
  margin: 40px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.results-section h2 {
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: bold;
  color: #159750;
  display: flex;
  align-items: center;
  gap: 12px;
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
  padding: 32px;
  border-radius: 8px;
  margin: 40px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-section h2 {
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: bold;
  color: #159750;
  display: flex;
  align-items: center;
  gap: 12px;
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
    margin: 20px 0;
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
    margin: 30px 0;
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
    margin: 20px 0;
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
    margin: 25px 0;
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
    margin: 15px 0;
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
    margin: 20px 0;
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
    margin: 20px 0;
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
    margin: 20px 0;
  }

  .results-section h2,
  .chart-section h2 {
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
    margin: 15px 0;
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
    margin: 15px 0;
  }

  .results-section h2,
  .chart-section h2 {
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
    margin: 12px 0;
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
    margin: 12px 0;
  }

  .results-section h2,
  .chart-section h2 {
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
