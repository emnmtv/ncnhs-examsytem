<template>
  <div class="mps-container">
    <div class="header-container">
      <div class="header-content">
        <div class="header-title">
          <h1>Mean Percentage Score<span class="material-icons">analytics</span></h1>
          <button @click="$router.back()" class="back-btn">
            <span class="material-icons">arrow_back</span> Back
          </button>
        </div>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Analyze student performance across sections</p>
        </div>
      </div>
      <div class="header-background">MPS</div>
    </div>

    <div class="header-actions">
      <button class="action-btn print-btn" @click="printReport">
        <i class="fas fa-print"></i> Print Report
      </button>
      <button class="action-btn export-btn" @click="exportData">
        <i class="fas fa-file-export"></i> Export Data
      </button>
      <button class="action-btn pdf-btn" @click="downloadPDF">
        <i class="fas fa-file-pdf"></i> Download PDF
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading MPS data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadMPSData" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!mpsData" class="empty-state">
      <span class="material-icons-round">analytics</span>
      <p>No MPS data available</p>
      <p class="empty-subtext">There are no scores recorded for this exam yet.</p>
    </div>

    <!-- MPS Data Display -->
    <div v-else class="mps-data">
      <!-- Exam Summary Card -->
      <div class="exam-info-card">
        <div class="exam-title">{{ mpsData.exam.title }}</div>
        <div class="exam-code">Test Code: {{ mpsData.exam.testCode }}</div>
        <div class="exam-stats">
          <div class="stat-item">
            <div class="stat-label">Overall MPS</div>
            <div class="stat-value" :class="getScoreClass(mpsData.overallMPS)">
              {{ mpsData.overallMPS.toFixed(1) }}%
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Total Students</div>
            <div class="stat-value">{{ mpsData.totalStudents }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Highest Score</div>
            <div class="stat-value excellent">
              {{ mpsData.overallStats.highestScoreRaw || 0 }}/{{ mpsData.overallStats.totalPossible || 0 }}
              ({{ mpsData.overallStats.highestPercentage?.toFixed(1) || 0 }}%)
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Lowest Score</div>
            <div class="stat-value needs-improvement">
              {{ mpsData.overallStats.lowestScoreRaw || 0 }}/{{ mpsData.overallStats.totalPossible || 0 }}
              ({{ mpsData.overallStats.lowestPercentage?.toFixed(1) || 0 }}%)
            </div>
          </div>
        </div>
      </div>

      <!-- Score Distribution Card -->
      <div class="distribution-card">
        <h2>Score Distribution</h2>
        <div class="distribution-grid">
          <div class="dist-category excellent">
            <div class="dist-info">
              <span class="dist-label">Excellent (90-100%)</span>
              <span class="dist-count">{{ mpsData.overallStats.scoreDistribution.excellent }}</span>
            </div>
            <div class="dist-bar-container">
              <div class="dist-bar" 
                :style="{width: getDistributionPercentage('excellent') + '%'}">
              </div>
            </div>
          </div>
          
          <div class="dist-category good">
            <div class="dist-info">
              <span class="dist-label">Good (80-89%)</span>
              <span class="dist-count">{{ mpsData.overallStats.scoreDistribution.good }}</span>
            </div>
            <div class="dist-bar-container">
              <div class="dist-bar" 
                :style="{width: getDistributionPercentage('good') + '%'}">
              </div>
            </div>
          </div>
          
          <div class="dist-category satisfactory">
            <div class="dist-info">
              <span class="dist-label">Satisfactory (70-79%)</span>
              <span class="dist-count">{{ mpsData.overallStats.scoreDistribution.satisfactory }}</span>
            </div>
            <div class="dist-bar-container">
              <div class="dist-bar" 
                :style="{width: getDistributionPercentage('satisfactory') + '%'}">
              </div>
            </div>
          </div>
          
          <div class="dist-category fair">
            <div class="dist-info">
              <span class="dist-label">Fair (60-69%)</span>
              <span class="dist-count">{{ mpsData.overallStats.scoreDistribution.fair }}</span>
            </div>
            <div class="dist-bar-container">
              <div class="dist-bar" 
                :style="{width: getDistributionPercentage('fair') + '%'}">
              </div>
            </div>
          </div>
          
          <div class="dist-category needs-improvement">
            <div class="dist-info">
              <span class="dist-label">Poor (Below 60%)</span>
              <span class="dist-count">{{ mpsData.overallStats.scoreDistribution.poor }}</span>
            </div>
            <div class="dist-bar-container">
              <div class="dist-bar" 
                :style="{width: getDistributionPercentage('poor') + '%'}">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- View Controls -->
      <div class="view-controls">
        <button 
          class="view-toggle-btn" 
          :class="{ active: viewMode === 'chart' }"
          @click="switchView('chart')"
        >
          <span class="material-icons">bar_chart</span>
          Chart View
        </button>
        <button 
          class="view-toggle-btn" 
          :class="{ active: viewMode === 'table' }"
          @click="switchView('table')"
        >
          <span class="material-icons">table_rows</span>
          Table View
        </button>
      </div>

      <!-- Add this after the View Controls buttons and before the chart container -->
      <div v-if="viewMode === 'chart'" class="settings-card">
        <div class="card-header">
          <h2>
            <span class="material-icons">tune</span>
            Chart Settings
          </h2>
        </div>
        
        <div class="settings-content">
          <div class="settings-section">
            <h3>Chart Type</h3>
            <div class="chart-type-buttons">
              <button 
                v-for="option in chartTypeOptions" 
                :key="option.value"
                @click="chartType = option.value"
                :class="['chart-type-btn', { active: chartType === option.value }]"
                :title="option.label"
              >
                <span class="material-icons">{{ option.icon }}</span>
                <span class="btn-label">{{ option.label }}</span>
              </button>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="settings-section">
            <h3>Appearance</h3>
            <div class="appearance-options">
              <div class="theme-selector">
                <label for="themeSelect">Color Theme</label>
                <select id="themeSelect" v-model="colorTheme" class="theme-select">
                  <option v-for="option in colorThemeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
              
              <div class="options-grid">
                <div class="toggle-option">
                  <label>
                    <input type="checkbox" v-model="showStudentLine">
                    <span>Student Count Line</span>
                  </label>
                </div>
                
                <div class="toggle-option">
                  <label>
                    <input type="checkbox" v-model="chartSettings.showLegend">
                    <span>Show Legend</span>
                  </label>
                </div>
                
                <div class="toggle-option">
                  <label>
                    <input type="checkbox" v-model="chartSettings.showGridLines">
                    <span>Grid Lines</span>
                  </label>
                </div>
                
                <div class="toggle-option">
                  <label>
                    <input type="checkbox" v-model="chartSettings.enableAnimations">
                    <span>Animations</span>
                  </label>
                </div>
                
                <div class="toggle-option">
                  <label>
                    <input type="checkbox" v-model="chartSettings.rounded">
                    <span>Rounded Bars</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-section">
            <h3>Data Display</h3>
            <div class="toggle-option">
              <label>
                <input type="checkbox" v-model="showRawScores">
                <span>Emphasize Raw Scores</span>
              </label>
              <div class="option-help">When enabled, raw scores (e.g., 18/20) will be emphasized in charts</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart View -->
      <div v-if="viewMode === 'chart'" class="chart-container">
        <h2>Section Performance</h2>
        <div class="chart-wrapper">
          <canvas ref="mpsChart" width="400" height="200"></canvas>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="table-view">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Section</th>
                <th>MPS</th>
                <th>Students</th>
                <th>Highest</th>
                <th>Lowest</th>
                <th>
                  Score Distribution
                  <div class="distribution-legend">
                    <span class="legend-item excellent">E</span>
                    <span class="legend-item good">G</span>
                    <span class="legend-item satisfactory">S</span>
                    <span class="legend-item fair">F</span>
                    <span class="legend-item needs-improvement">P</span>
                  </div>
                </th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(section, index) in mpsData.sectionMPS" :key="index">
                <td class="section-cell">{{ section.section }}</td>
                <td class="mps-cell" :class="getScoreClass(section.mps)">
                  <strong>{{ section.mps.toFixed(1) }}%</strong>
                </td>
                <td>{{ section.studentCount }}</td>
                <td class="excellent">
                  {{ section.highestScoreRaw || 0 }}/{{ section.totalPossible || 0 }}
                  ({{ section.highestPercentage?.toFixed(1) || 0 }}%)
                </td>
                <td class="needs-improvement">
                  {{ section.lowestScoreRaw || 0 }}/{{ section.totalPossible || 0 }}
                  ({{ section.lowestPercentage?.toFixed(1) || 0 }}%)
                </td>
                <td>
                  <div class="distribution-badges">
                    <span class="badge excellent">{{ section.distribution.excellent }}</span>
                    <span class="badge good">{{ section.distribution.good }}</span>
                    <span class="badge satisfactory">{{ section.distribution.satisfactory }}</span>
                    <span class="badge fair">{{ section.distribution.fair }}</span>
                    <span class="badge needs-improvement">{{ section.distribution.poor }}</span>
                  </div>
                </td>
                <td>
                  <div class="performance-bar-container">
                    <div 
                      class="performance-bar" 
                      :class="getScoreClass(section.mps)"
                      :style="{ width: `${section.mps}%` }"
                    ></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add this template for print that shows only when printing -->
    <div v-if="mpsData" class="print-only">
      <div class="print-header">
        <img :src="NcnhsLogo" alt="NCNHS Logo" class="print-logo">
        <div class="print-title">
          <h1>New Cabalan National High School</h1>
          <h2>Exam Mean Percentage Score Report</h2>
          <div class="print-exam-info">
            <p><strong>Exam:</strong> {{ mpsData.exam.title }}</p>
            <p><strong>Test Code:</strong> {{ mpsData.exam.testCode }}</p>
            <p><strong>Date:</strong> {{ new Date().toLocaleDateString() }}</p>
          </div>
        </div>
      </div>

      <div class="print-summary">
        <div class="summary-title">Summary Statistics</div>
        <table class="summary-table" key="summary-stats">
          <thead>
            <tr>
              <th>Overall MPS</th>
              <th>Total Students</th>
              <th>Highest Score</th>
              <th>Lowest Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="center">{{ mpsData.overallMPS.toFixed(1) }}%</td>
              <td class="center">{{ mpsData.totalStudents }}</td>
              <td class="center">
                {{ mpsData.overallStats.highestScoreRaw || 0 }}/{{ mpsData.overallStats.totalPossible || 0 }}
                ({{ mpsData.overallStats.highestPercentage?.toFixed(1) || 0 }}%)
              </td>
              <td class="center">
                {{ mpsData.overallStats.lowestScoreRaw || 0 }}/{{ mpsData.overallStats.totalPossible || 0 }}
                ({{ mpsData.overallStats.lowestPercentage?.toFixed(1) || 0 }}%)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="print-distribution">
        <div class="summary-title">Score Distribution</div>
        <table class="summary-table" key="distribution">
          <thead>
            <tr>
              <th>Excellent (90-100%)</th>
              <th>Good (80-89%)</th>
              <th>Satisfactory (70-79%)</th>
              <th>Fair (60-69%)</th>
              <th>Poor (Below 60%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="center">{{ mpsData.overallStats.scoreDistribution.excellent }}</td>
              <td class="center">{{ mpsData.overallStats.scoreDistribution.good }}</td>
              <td class="center">{{ mpsData.overallStats.scoreDistribution.satisfactory }}</td>
              <td class="center">{{ mpsData.overallStats.scoreDistribution.fair }}</td>
              <td class="center">{{ mpsData.overallStats.scoreDistribution.poor }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="print-details">
        <div class="summary-title">Section Performance</div>
        <table class="details-table" key="section-performance">
          <thead>
            <tr>
              <th>Section</th>
              <th>MPS</th>
              <th>Students</th>
              <th>Highest</th>
              <th>Lowest</th>
              <th>Excellent</th>
              <th>Good</th>
              <th>Satisfactory</th>
              <th>Fair</th>
              <th>Poor</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(section, index) in mpsData.sectionMPS" :key="index">
              <td>{{ section.section }}</td>
              <td class="center">{{ section.mps.toFixed(1) }}%</td>
              <td class="center">{{ section.studentCount }}</td>
              <td class="center">
                {{ section.highestScoreRaw || 0 }}/{{ section.totalPossible || 0 }}
                ({{ section.highestPercentage?.toFixed(1) || 0 }}%)
              </td>
              <td class="center">
                {{ section.lowestScoreRaw || 0 }}/{{ section.totalPossible || 0 }}
                ({{ section.lowestPercentage?.toFixed(1) || 0 }}%)
              </td>
              <td class="center">{{ section.distribution.excellent }}</td>
              <td class="center">{{ section.distribution.good }}</td>
              <td class="center">{{ section.distribution.satisfactory }}</td>
              <td class="center">{{ section.distribution.fair }}</td>
              <td class="center">{{ section.distribution.poor }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="print-footer">
        <p>Report Generated: {{ new Date().toLocaleString() }}</p>
        <p>New Cabalan National High School - Examination Analysis System</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getExamMPS } from '@/services/authService';
import Chart from 'chart.js/auto';
import NcnhsLogo from '@/assets/ncnhs-icon.png';
import html2pdf from 'html2pdf.js';

const route = useRoute();
const loading = ref(true);
const error = ref(null);
const mpsData = ref(null);
const mpsChart = ref(null);
let chartInstance = null;
const viewMode = ref('chart');

// Get exam ID from route params
const examId = ref(route.params.examId);

// Compute total students for percentage calculations
const totalStudents = computed(() => {
  if (!mpsData.value) return 0;
  return mpsData.value.totalStudents;
});

// Calculate distribution percentage for progress bars
const getDistributionPercentage = (category) => {
  if (!mpsData.value) return 0;
  
  const count = mpsData.value.overallStats.scoreDistribution[category] || 0;
  return (count / totalStudents.value) * 100;
};

// Add these new refs after the existing ones
const chartType = ref('bar'); // Default chart type
const showStudentLine = ref(true); // Toggle for student count line
const colorTheme = ref('default'); // Color theme for charts
const chartSettings = ref({
  showLegend: true,
  showGridLines: true,
  enableAnimations: true,
  rounded: true
});
const showRawScores = ref(false);

// Add chart type options
const chartTypeOptions = [
  { value: 'bar', label: 'Bar Chart', icon: 'bar_chart' },
  { value: 'horizontalBar', label: 'Horizontal Bar', icon: 'stacked_bar_chart' },
  { value: 'line', label: 'Line Chart', icon: 'show_chart' },
  { value: 'radar', label: 'Radar Chart', icon: 'radar' },
  { value: 'pie', label: 'Pie Chart', icon: 'pie_chart' }
];

// Color theme options
const colorThemeOptions = [
  { value: 'default', label: 'Default Theme' },
  { value: 'pastel', label: 'Pastel Colors' },
  { value: 'bright', label: 'Bright Colors' },
  { value: 'cool', label: 'Cool Tones' },
  { value: 'warm', label: 'Warm Tones' }
];

// Get colors based on selected theme
const getChartColors = (scores, theme) => {
  if (theme === 'pastel') {
    return {
      background: scores.map(() => 'rgba(171, 217, 233, 0.7)'),
      border: scores.map(() => 'rgba(87, 160, 211, 1)')
    };
  } else if (theme === 'bright') {
    return {
      background: scores.map(() => 'rgba(255, 99, 132, 0.7)'),
      border: scores.map(() => 'rgba(255, 99, 132, 1)')
    };
  } else if (theme === 'cool') {
    return {
      background: scores.map(() => 'rgba(103, 71, 183, 0.7)'),
      border: scores.map(() => 'rgba(103, 71, 183, 1)')
    };
  } else if (theme === 'warm') {
    return {
      background: scores.map(() => 'rgba(255, 159, 64, 0.7)'),
      border: scores.map(() => 'rgba(255, 159, 64, 1)')
    };
  } else {
    // Default theme - score-based colors
    return {
      background: scores.map(score => {
        if (score >= 90) return 'rgba(76, 175, 80, 0.7)';
        if (score >= 80) return 'rgba(33, 150, 243, 0.7)';
        if (score >= 70) return 'rgba(255, 193, 7, 0.7)';
        if (score >= 60) return 'rgba(255, 152, 0, 0.7)';
        return 'rgba(244, 67, 54, 0.7)';
      }),
      border: scores.map(score => {
        if (score >= 90) return 'rgb(76, 175, 80)';
        if (score >= 80) return 'rgb(33, 150, 243)';
        if (score >= 70) return 'rgb(255, 193, 7)';
        if (score >= 60) return 'rgb(255, 152, 0)';
        return 'rgb(244, 67, 54)';
      })
    };
  }
};

// Load MPS data
const loadMPSData = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const data = await getExamMPS(examId.value);
    mpsData.value = data;
    
    // Use double nextTick to ensure DOM is fully updated
    nextTick(() => {
      nextTick(() => {
        console.log('Data loaded, attempting to render chart');
        renderChart();
      });
    });
  } catch (err) {
    console.error('Error loading MPS data:', err);
    error.value = err.message || 'Failed to load MPS data';
  } finally {
    loading.value = false;
  }
};

// Switch between chart and table views
const switchView = (view) => {
  viewMode.value = view;
  
  if (view === 'chart') {
    // Give DOM time to update before rendering chart
    nextTick(() => {
      nextTick(() => {
        console.log('Switched to chart view, re-rendering chart');
        renderChart();
      });
    });
  }
};

// Update the renderChart function
const renderChart = () => {
  console.log('Rendering chart, chart element exists:', !!mpsChart.value);
  
  if (!mpsData.value || !mpsData.value.sectionMPS.length) {
    console.log('No data available to render chart');
    return;
  }
  
  if (!mpsChart.value) {
    console.log('Chart canvas not available yet');
    return;
  }
  
  try {
    // Destroy existing chart if it exists
    if (chartInstance) {
      console.log('Destroying previous chart instance');
      chartInstance.destroy();
    }
    
    const ctx = mpsChart.value.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context');
      return;
    }
    
    console.log('Creating new chart with type:', chartType.value);
    
    // Prepare data for chart
    const sections = mpsData.value.sectionMPS.map(s => s.section);
    const scores = mpsData.value.sectionMPS.map(s => s.mps);
    const studentCounts = mpsData.value.sectionMPS.map(s => s.studentCount);
    
    // Calculate raw score percentages for display
    const rawScoreData = mpsData.value.sectionMPS.map(s => {
      const total = s.totalPossible || 1; // Avoid division by zero
      
      return {
        section: s.section,
        avgRawScore: (s.mps * total / 100).toFixed(1),
        highRaw: s.highestScoreRaw || 0,
        lowRaw: s.lowestScoreRaw || 0,
        total: total
      };
    });
    
    // Get colors based on theme
    const colors = getChartColors(scores, colorTheme.value);
    
    // Create datasets based on chart type
    let datasets = [];
    
    // Main dataset (MPS scores)
    const mainDataset = {
      label: 'Mean Percentage Score',
      data: scores,
      backgroundColor: colors.background,
      borderColor: colors.border,
      borderWidth: 2
    };
    
    // Apply chart-specific settings
    if (['bar', 'horizontalBar'].includes(chartType.value)) {
      if (chartSettings.value.rounded) {
        mainDataset.borderRadius = 8;
        mainDataset.borderSkipped = false;
      }
      mainDataset.barPercentage = 0.6;
      mainDataset.categoryPercentage = 0.8;
    }
    
    datasets.push(mainDataset);
    
    // Add student count line if enabled and chart type is appropriate
    if (showStudentLine.value && ['bar', 'line'].includes(chartType.value)) {
      datasets.push({
        label: 'Number of Students',
        data: studentCounts,
        type: 'line',
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: 'rgba(153, 102, 255, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
        yAxisID: 'y1'
      });
    }
    
    // Chart options
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: chartSettings.value.enableAnimations ? 1000 : 0
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: chartSettings.value.showLegend,
          position: 'top',
          align: 'center',
          labels: {
            boxWidth: 15,
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          titleColor: '#333',
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyColor: '#666',
          bodyFont: {
            size: 13
          },
          borderColor: 'rgba(0, 0, 0, 0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const datasetLabel = context.dataset.label || '';
              const value = context.parsed.y || context.parsed || 0;
              const index = context.dataIndex;
              
              if (datasetLabel === 'Mean Percentage Score') {
                if (showRawScores.value && index >= 0 && index < rawScoreData.length) {
                  const rawData = rawScoreData[index];
                  return `${datasetLabel}: ${rawData.avgRawScore}/${rawData.total} (${value.toFixed(1)}%)`;
                }
                return `${datasetLabel}: ${typeof value === 'number' ? value.toFixed(1) : value}%`;
              } else if (datasetLabel === 'Number of Students') {
                return `${datasetLabel}: ${value}`;
              }
              
              return `${datasetLabel}: ${value}`;
            },
            // Add footer to display raw scores
            footer: function(tooltipItems) {
              const idx = tooltipItems[0].dataIndex;
              if (idx >= 0 && idx < mpsData.value.sectionMPS.length) {
                const section = mpsData.value.sectionMPS[idx];
                const rawHigh = section.highestScoreRaw || 0;
                const rawLow = section.lowestScoreRaw || 0;
                const total = section.totalPossible || 0;
                return [
                  `High Score: ${rawHigh}/${total} (${section.highestPercentage?.toFixed(1) || 0}%)`,
                  `Low Score: ${rawLow}/${total} (${section.lowestPercentage?.toFixed(1) || 0}%)`
                ];
              }
              return [];
            }
          }
        }
      }
    };
    
    // Add scales for appropriate chart types
    if (!['pie', 'doughnut', 'radar'].includes(chartType.value)) {
      chartOptions.scales = {
        y: {
          beginAtZero: true,
          max: chartType.value !== 'horizontalBar' ? 100 : undefined,
          grid: {
            display: chartSettings.value.showGridLines,
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            callback: value => `${value}%`,
            font: {
              size: 12
            }
          },
          title: {
            display: true,
            text: 'Mean Percentage Score (%)',
            color: '#666',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        },
        x: {
          grid: {
            display: chartSettings.value.showGridLines && chartType.value !== 'bar',
            color: 'rgba(0, 0, 0, 0.05)',
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            }
          }
        }
      };
      
      // Add secondary y-axis for student count if needed
      if (showStudentLine.value && ['bar', 'line'].includes(chartType.value)) {
        chartOptions.scales.y1 = {
          beginAtZero: true,
          position: 'right',
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            font: {
              size: 12
            }
          },
          title: {
            display: true,
            text: 'Number of Students',
            color: '#666',
            font: {
              size: 14,
              weight: 'bold'
            }
          }
        };
      }
    }
    
    // Handle horizontal bar chart
    let actualChartType = chartType.value;
    if (chartType.value === 'horizontalBar') {
      actualChartType = 'bar';
      chartOptions.indexAxis = 'y';
    }
    
    // Create the chart
    chartInstance = new Chart(ctx, {
      type: actualChartType,
      data: {
        labels: sections,
        datasets: datasets
      },
      options: chartOptions
    });
  } catch (err) {
    console.error('Error rendering chart:', err);
  }
};

// Get CSS class based on score
const getScoreClass = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'satisfactory';
  if (score >= 60) return 'fair';
  return 'needs-improvement';
};

// Export data as CSV
const exportData = () => {
  if (!mpsData.value) return;
  
  // Create HTML for a styled table export
  const htmlTable = `
    <html>
      <head>
        <style>
          body { 
            font-family: Arial, sans-serif;
            color: #333;
            line-height: 1.4;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 20px;
            border: 1px solid #ddd;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: center;
          }
          th { 
            background-color: #f8f8f8; 
            font-weight: bold;
            text-align: center;
            border-bottom: 2px solid #ddd;
          }
          .center { text-align: center; }
          .header { 
            display: flex; 
            align-items: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #ddd;
            padding-bottom: 15px;
          }
          .header img { height: 80px; margin-right: 20px; }
          .title { 
            font-size: 22px; 
            font-weight: bold; 
            color: #333;
            margin: 0;
          }
          .subtitle { 
            font-size: 16px; 
            margin: 5px 0 15px 0;
            color: #555;
          }
          .info { margin-bottom: 20px; }
          .section-title { 
            background-color: #f8f8f8; 
            padding: 8px; 
            font-weight: bold; 
            margin-top: 20px; 
            margin-bottom: 10px;
            border-left: 4px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .footer {
            margin-top: 20px; 
            font-size: 12px; 
            color: #666; 
            text-align: center; 
            border-top: 1px solid #ddd; 
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${NcnhsLogo}" alt="School Logo" style="height: 80px; margin-right: 20px;">
          <div>
            <div class="title">New Cabalan National High School</div>
            <div class="subtitle">Exam Mean Percentage Score Report</div>
            <div class="info">
              <p><strong>Exam:</strong> ${mpsData.value.exam.title}</p>
              <p><strong>Test Code:</strong> ${mpsData.value.exam.testCode}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <div class="section-title">Summary Statistics</div>
        <table>
          <thead>
            <tr>
              <th>Overall MPS</th>
              <th>Total Students</th>
              <th>Highest Score</th>
              <th>Lowest Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="center">${mpsData.value.overallMPS.toFixed(1)}%</td>
              <td class="center">${mpsData.value.totalStudents}</td>
              <td class="center">${mpsData.value.overallStats.highestScoreRaw || 0}/${mpsData.value.overallStats.totalPossible || 0} (${mpsData.value.overallStats.highestPercentage?.toFixed(1) || 0}%)</td>
              <td class="center">${mpsData.value.overallStats.lowestScoreRaw || 0}/${mpsData.value.overallStats.totalPossible || 0} (${mpsData.value.overallStats.lowestPercentage?.toFixed(1) || 0}%)</td>
            </tr>
          </tbody>
        </table>
        
        <div class="section-title">Score Distribution</div>
        <table>
          <thead>
            <tr>
              <th>Excellent (90-100%)</th>
              <th>Good (80-89%)</th>
              <th>Satisfactory (70-79%)</th>
              <th>Fair (60-69%)</th>
              <th>Poor (Below 60%)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="center">${mpsData.value.overallStats.scoreDistribution.excellent}</td>
              <td class="center">${mpsData.value.overallStats.scoreDistribution.good}</td>
              <td class="center">${mpsData.value.overallStats.scoreDistribution.satisfactory}</td>
              <td class="center">${mpsData.value.overallStats.scoreDistribution.fair}</td>
              <td class="center">${mpsData.value.overallStats.scoreDistribution.poor}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="section-title">Section Performance</div>
        <table>
          <thead>
            <tr>
              <th>Section</th>
              <th>MPS (%)</th>
              <th>Students</th>
              <th>Highest Score</th>
              <th>Lowest Score</th>
              <th>Excellent</th>
              <th>Good</th>
              <th>Satisfactory</th>
              <th>Fair</th>
              <th>Poor</th>
            </tr>
          </thead>
          <tbody>
            ${mpsData.value.sectionMPS.map(section => {
              return `
                <tr>
                  <td>${section.section}</td>
                  <td class="center">${section.mps.toFixed(1)}%</td>
                  <td class="center">${section.studentCount}</td>
                  <td class="center">${section.highestScoreRaw || 0}/${section.totalPossible || 0} (${section.highestPercentage?.toFixed(1) || 0}%)</td>
                  <td class="center">${section.lowestScoreRaw || 0}/${section.totalPossible || 0} (${section.lowestPercentage?.toFixed(1) || 0}%)</td>
                  <td class="center">${section.distribution.excellent}</td>
                  <td class="center">${section.distribution.good}</td>
                  <td class="center">${section.distribution.satisfactory}</td>
                  <td class="center">${section.distribution.fair}</td>
                  <td class="center">${section.distribution.poor}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Report Generated: ${new Date().toLocaleString()}</p>
          <p>New Cabalan National High School - Examination Analysis System</p>
        </div>
      </body>
    </html>
  `;
  
  // Create a Blob with the HTML content
  const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `MPS_${mpsData.value.exam.testCode}.xls`);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Print the report
const printReport = () => {
  // Switch to table view for printing
  const originalView = viewMode.value;
  viewMode.value = 'table';
  
  // Wait for DOM to update
  nextTick(() => {
    // Use a small delay to ensure styles are applied
    setTimeout(() => {
  window.print();
      
      // Reset to original view after printing dialog closes
      setTimeout(() => {
        viewMode.value = originalView;
      }, 500);
    }, 100);
  });
};

// Watch for changes in exam ID
watch(examId, () => {
  loadMPSData();
});

// Watch for view mode changes
watch(viewMode, (newMode) => {
  if (newMode === 'chart') {
    nextTick(() => {
      renderChart();
    });
  }
});

// Watch for changes in chart settings
watch([chartType, showStudentLine, colorTheme, showRawScores], () => {
  if (viewMode.value === 'chart') {
    console.log('Chart settings changed, re-rendering');
    nextTick(() => {
      renderChart();
    });
  }
}, { immediate: false });

// Add a separate deep watcher for the chartSettings object
watch(() => chartSettings.value, () => {
  if (viewMode.value === 'chart') {
    console.log('Chart settings object changed, re-rendering');
    nextTick(() => {
      renderChart();
    });
  }
}, { deep: true, immediate: false });

// Add ref for the school logo in base64 format
const schoolLogoBase64 = ref('');

// Function to convert image to base64
const getBase64Image = () => {
  return new Promise((resolve) => {
    // Since we're importing the image directly, we can use it as is
    resolve(NcnhsLogo);
  });
};

// In onMounted, load the school logo
onMounted(async () => {
  console.log('Component mounted, loading data');
  loadMPSData();
  
  // Load school logo
  try {
    schoolLogoBase64.value = await getBase64Image();
  } catch (err) {
    console.error('Failed to load school logo:', err);
  }
  
  // Add window resize handler to redraw chart when window is resized
  window.addEventListener('resize', () => {
    if (viewMode.value === 'chart' && mpsChart.value && mpsData.value) {
      nextTick(() => {
        renderChart();
      });
    }
  });
});

// Improve the downloadPDF function to ensure proper HTML structure
const downloadPDF = () => {
  if (!mpsData.value) return;

  // First switch to table view for better PDF output
  const originalView = viewMode.value;
  viewMode.value = 'table';
  
  // Wait for DOM to update
  nextTick(() => {
    // Use a small delay to ensure styles are applied
    setTimeout(() => {
      try {
        // Create a clone of the print view to work with
        const element = document.createElement('div');
        element.innerHTML = document.querySelector('.print-only').innerHTML;
        element.classList.add('pdf-container');
        
        // Fix potential HTML issues - ensure all tables have proper structure
        const tables = element.querySelectorAll('table');
        tables.forEach(table => {
          // Check if table already has thead and tbody
          if (!table.querySelector('thead')) {
            const thead = document.createElement('thead');
            const firstRow = table.querySelector('tr');
            if (firstRow) {
              thead.appendChild(firstRow.cloneNode(true));
              firstRow.parentNode.replaceChild(thead, firstRow);
            }
          }
          
          // Check if table has tbody
          if (!table.querySelector('tbody')) {
            const tbody = document.createElement('tbody');
            const rows = Array.from(table.querySelectorAll('tr')).slice(1); // Skip first row (header)
            rows.forEach(row => {
              tbody.appendChild(row.cloneNode(true));
              if (row.parentNode) {
                row.parentNode.removeChild(row);
              }
            });
            table.appendChild(tbody);
          }
        });
        
        document.body.appendChild(element);
      
        // Setup PDF options
        const options = {
          margin: 10,
          filename: `MPS_${mpsData.value.exam.testCode}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: false
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait'
          }
        };
        
        // Generate PDF
        html2pdf()
          .set(options)
          .from(element)
          .save()
          .then(() => {
            // Cleanup - remove the cloned element
            document.body.removeChild(element);
            // Reset view mode
            viewMode.value = originalView;
          })
          .catch(error => {
            console.error('PDF generation failed:', error);
            // Cleanup even on error
            if (document.body.contains(element)) {
              document.body.removeChild(element);
            }
            viewMode.value = originalView;
          });
      } catch (error) {
        console.error('Error preparing PDF:', error);
        viewMode.value = originalView;
      }
    }, 100);
  });
};
</script>

<style scoped>
.mps-container {
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
  overflow: hidden;
}

.header-content {
  position: relative;
  z-index: 1;
}

.header-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-content h1 {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  margin: 0;
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  padding-left: 1%;
}

.header-background {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  font-size: 8rem;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.03);
  z-index: 0;
  user-select: none;
  pointer-events: none;
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

.header-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 20px;
}

.action-btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.print-btn {
  background-color: #e8f5e9;
  color: #2E7D32;
}

.print-btn:hover {
  background-color: #c8e6c9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.export-btn {
  background-color: #fff3e0;
  color: #E65100;
}

.export-btn:hover {
  background-color: #ffe0b2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Loading, Error, Empty States */
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

.empty-subtext {
  font-size: 0.9rem;
  color: #757575;
  margin-top: 0.5rem;
}

/* MPS Data Display */
.mps-data {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Exam Info Card */
.exam-info-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.exam-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.exam-code {
  display: inline-block;
  padding: 6px 12px;
  background-color: #e8f5e9;
  color: #2e7d32;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 20px;
  margin-bottom: 20px;
}

.exam-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-item {
  background: #f9f9f9;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.stat-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.3;
}

/* Distribution Card */
.distribution-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.distribution-card h2 {
  margin: 0 0 24px 0;
  font-size: 1.3rem;
  color: #333;
}

.distribution-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dist-category {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dist-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dist-label {
  font-size: 0.95rem;
  color: #555;
}

.dist-count {
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
}

.dist-bar-container {
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}

.dist-bar {
  height: 100%;
  border-radius: 5px;
  transition: width 1s ease-out;
}

/* View Controls */
.view-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 0;
  background: white;
  border-radius: 16px 16px 0 0;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  background: none;
  font-weight: 500;
  cursor: pointer;
  color: #666;
  border-radius: 8px;
  transition: all 0.2s;
}

.view-toggle-btn:hover {
  background-color: #f5f5f5;
}

.view-toggle-btn.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

/* Chart Container */
.chart-container {
  background: white;
  border-radius: 0 0 16px 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-top: 0;
}

.chart-container h2 {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 1rem;
}

.chart-wrapper {
  height: 400px;
  position: relative;
}

/* Table View */
.table-view {
  background: white;
  border-radius: 0 0 16px 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-top: -12px;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
}

th, td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

th {
  font-weight: 600;
  color: #333;
  background-color: #f9f9f9;
  position: sticky;
  top: 0;
  z-index: 1;
}

.section-cell {
  font-weight: 600;
  min-width: 100px;
}

.mps-cell {
  font-size: 1.1rem;
}

.distribution-badges {
  display: flex;
  gap: 8px;
}

.badge {
  display: inline-block;
  min-width: 24px;
  padding: 2px 4px;
  text-align: center;
  font-weight: 600;
  font-size: 0.85rem;
  border-radius: 4px;
}

.performance-bar-container {
  width: 100%;
  background-color: #f0f0f0;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
}

.performance-bar {
  height: 100%;
  border-radius: 5px;
}

.distribution-legend {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.legend-item {
  display: inline-block;
  width: 20px;
  height: 20px;
  text-align: center;
  line-height: 20px;
  font-size: 0.7rem;
  font-weight: 600;
  border-radius: 4px;
}

/* Color Classes */
.excellent {
  color: #2E7D32;
}
.good {
  color: #1565C0;
}
.satisfactory {
  color: #FFA000;
}
.fair {
  color: #F57C00;
}
.needs-improvement {
  color: #D32F2F;
}

.excellent .dist-count, .badge.excellent, .legend-item.excellent {
  background-color: rgba(46, 125, 50, 0.1);
  color: #2E7D32;
}
.good .dist-count, .badge.good, .legend-item.good {
  background-color: rgba(21, 101, 192, 0.1);
  color: #1565C0;
}
.satisfactory .dist-count, .badge.satisfactory, .legend-item.satisfactory {
  background-color: rgba(255, 160, 0, 0.1);
  color: #FFA000;
}
.fair .dist-count, .badge.fair, .legend-item.fair {
  background-color: rgba(245, 124, 0, 0.1);
  color: #F57C00;
}
.needs-improvement .dist-count, .badge.needs-improvement, .legend-item.needs-improvement {
  background-color: rgba(211, 47, 47, 0.1);
  color: #D32F2F;
}

.excellent .dist-bar {
  background-color: #4CAF50;
}
.good .dist-bar {
  background-color: #2196F3;
}
.satisfactory .dist-bar {
  background-color: #FFC107;
}
.fair .dist-bar {
  background-color: #FF9800;
}
.needs-improvement .dist-bar {
  background-color: #F44336;
}

/* Back button */
.back-btn {
  background-color: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.back-btn:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.back-btn .material-icons {
  font-size: 18px;
}

/* Print Styles */
@media print {
  /* Hide non-printable elements */
  .header-container, .header-actions, .view-controls, 
  .settings-card, .chart-container, .table-view,
  .exam-info-card, .distribution-card, .back-btn {
    display: none !important;
  }
  
  /* Show print-only elements */
  .print-only {
    display: block !important;
    width: 100%;
    max-width: 100%;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: Arial, sans-serif;
    background: white;
    color: black;
  }
  
  .print-header {
    display: flex;
    align-items: center;
    margin-bottom: 30px;
    padding: 10px 0;
    border-bottom: 2px solid #333;
  }
  
  .print-logo {
    height: 80px;
    margin-right: 20px;
  }
  
  .print-title {
    flex: 1;
  }
  
  .print-title h1 {
    font-size: 22px;
    margin: 0 0 5px 0;
    color: #333;
  }
  
  .print-title h2 {
    font-size: 16px;
    margin: 0 0 10px 0;
    font-weight: normal;
    color: #555;
  }
  
  .print-exam-info {
    display: flex;
    font-size: 12px;
    gap: 20px;
  }
  
  .print-exam-info p {
    margin: 0;
  }
  
  .print-summary, .print-distribution, .print-details {
    margin-bottom: 20px;
  }
  
  .summary-title {
    font-size: 14px;
    font-weight: bold;
    background-color: #f8f8f8;
    padding: 8px;
    margin-bottom: 8px;
    border-left: 4px solid #ddd;
  }
  
  .summary-table, .details-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    margin-bottom: 20px;
    box-shadow: none;
    border: 1px solid #ddd;
  }
  
  .summary-table th, .summary-table td,
  .details-table th, .details-table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }
  
  .summary-table th, .details-table th {
    background-color: #f8f8f8 !important;
    font-weight: bold;
    border-bottom: 2px solid #ddd;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .summary-table thead, .details-table thead {
    display: table-header-group;
  }
  
  .summary-table tbody, .details-table tbody {
    display: table-row-group;
  }
  
  .summary-table tr:nth-child(even), 
  .details-table tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  .center {
    text-align: center;
  }
  
  .print-footer {
    margin-top: 30px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
    font-size: 10px;
    color: #666;
    text-align: center;
  }
  
  /* Add header and footer for each page */
  @page {
    size: landscape;
    margin: 0.5cm;
  }
  
  /* Ensure table headers repeat on page breaks */
  thead {
    display: table-header-group;
  }
  
  tbody {
    display: table-row-group;
  }
  
  tr {
    page-break-inside: avoid;
  }
  
  .print-details {
    page-break-before: auto;
  }
}

.print-only {
  display: none;
  padding: 20px;
}

/* Responsive Styles */
@media (max-width: 768px) {
  .mps-container {
    padding: 10px 5px;
  }
  
  .header-background {
    font-size: 4rem;
    top: 60%;
    right: 1rem;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .back-btn {
    align-self: flex-start;
  }
  
  .exam-stats {
    grid-template-columns: 1fr;
  }
  
  .view-controls {
    flex-wrap: wrap;
  }
  
  .chart-wrapper {
    height: 300px;
  }
  
  .distribution-badges {
    gap: 4px;
  }
  
  .badge {
    min-width: 20px;
    font-size: 0.75rem;
    padding: 2px;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

/* Chart Settings Card - replacing previous chart-settings-panel styles */
.settings-card {
  background: white;
  border-radius: 16px;
  margin: 20px 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.card-header {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #f9f9f9;
}

.card-header h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  color: #333;
  margin: 0;
}

.card-header .material-icons {
  color: #159750;
}

.settings-content {
  padding: 20px 24px;
}

.settings-section {
  margin-bottom: 20px;
}

.settings-section h3 {
  font-size: 1rem;
  color: #555;
  margin: 0 0 12px 0;
  font-weight: 500;
}

.chart-type-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.chart-type-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #555;
}

.chart-type-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.chart-type-btn.active {
  background-color: #e8f5e9;
  color: #2e7d32;
  font-weight: 500;
}

.btn-label {
  font-size: 0.9rem;
}

.divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 20px 0;
}

.appearance-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.theme-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.theme-selector label {
  font-size: 0.9rem;
  color: #666;
}

.theme-select {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: white;
  font-size: 0.95rem;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.toggle-option {
  display: flex;
  align-items: center;
}

.toggle-option label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #555;
}

.toggle-option input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #159750;
}

/* Responsive design adjustments */
@media (max-width: 768px) {
  .chart-type-buttons {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .options-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .toggle-option label {
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .chart-type-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .btn-label {
    font-size: 0.8rem;
  }
  
  .options-grid {
    grid-template-columns: 1fr;
  }
}

.option-help {
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
  margin-left: 26px;
  font-style: italic;
}

/* PDF Button and Container Styles */
.pdf-btn {
  background-color: #e8eaf6;
  color: #3f51b5;
}

.pdf-btn:hover {
  background-color: #c5cae9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.pdf-container {
  position: absolute;
  top: -9999px;
  left: -9999px;
  width: 297mm; /* A4 landscape width */
  padding: 20px;
  background-color: white;
}
</style> 