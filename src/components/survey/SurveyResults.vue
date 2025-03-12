<template>
  <div class="survey-results-container">
    <div class="header">
      <div class="header-content">
        <h1>{{ survey?.title }}</h1>
        <div class="survey-meta">
          <span class="code">
            <span class="material-icons-round">code</span>
            Code: {{ survey?.code }}
          </span>
          <span class="responses">
            <span class="material-icons-round">people</span>
            {{ survey?.responses?.length || 0 }} Responses
          </span>
        </div>
      </div>
      <button @click="$router.back()" class="back-btn">
        <span class="material-icons-round">arrow_back</span>
        Back
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading survey results...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadResults" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <!-- No Responses State -->
    <div v-else-if="!survey?.responses?.length" class="empty-state">
      <span class="material-icons-round">inbox</span>
      <p>No responses yet</p>
      <p class="subtitle">Share your survey to start collecting responses</p>
      <button @click="shareSurvey" class="share-btn">
        <span class="material-icons-round">share</span>
        Share Survey
      </button>
    </div>

    <!-- Results Display -->
    <div v-else class="results-content">
      <!-- Questions Analysis -->
      <div v-for="question in survey.questions" :key="question.id" class="question-card">
        <div class="question-header">
          <div class="question-info">
            <h3>{{ question.questionText }}</h3>
            <span class="response-count">
              {{ getResponseCount(question) }} responses
            </span>
          </div>
          
          <!-- Chart Type Selector -->
          <div v-if="['multiple_choice', 'checkbox'].includes(question.questionType)" class="chart-controls">
            <button 
              v-for="type in chartTypes" 
              :key="type.id"
              class="chart-type-btn"
              :class="{ active: getChartType(question.id) === type.id }"
              @click="setChartType(question.id, type.id)"
              :title="type.label"
            >
              <span class="material-icons-round">{{ type.icon }}</span>
            </button>
          </div>
        </div>

        <!-- Multiple Choice Results -->
        <div v-if="question.questionType === 'multiple_choice'" class="chart-container">
          <!-- Bar Chart View -->
          <div v-if="getChartType(question.id) === 'bar'" class="options-chart">
            <div 
              v-for="(count, option, index) in getOptionCounts(question)" 
              :key="option" 
              class="option-bar"
            >
              <div class="bar-label">{{ option }}</div>
              <div class="bar-wrapper">
                <div 
                  class="bar" 
                  :style="[
                    { width: `${getPercentage(count, getResponseCount(question))}%` },
                    getBarStyle(index)
                  ]"
                >
                  {{ count }}
                </div>
              </div>
              <div class="percentage">
                {{ getPercentage(count, getResponseCount(question)) }}%
              </div>
            </div>
          </div>

          <!-- Pie Chart View -->
          <div v-else-if="getChartType(question.id) === 'pie'" class="pie-chart">
            <div class="chart-wrapper">
              <Pie
                v-if="getPieChartData(question)"
                :chart-data="getPieChartData(question)"
                :chart-options="pieChartOptions"
              />
            </div>
          </div>

          <!-- Doughnut Chart View -->
          <div v-else-if="getChartType(question.id) === 'doughnut'" class="doughnut-chart">
            <div class="chart-wrapper">
              <Doughnut
                v-if="getPieChartData(question)"
                :chart-data="getPieChartData(question)"
                :chart-options="doughnutChartOptions"
              />
            </div>
          </div>
        </div>

        <!-- Checkbox Results with similar chart options -->
        <div v-else-if="question.questionType === 'checkbox'" class="chart-container">
          <!-- Bar Chart View -->
          <div v-if="getChartType(question.id) === 'bar'" class="options-chart">
            <div 
              v-for="(count, option, index) in getCheckboxCounts(question)" 
              :key="option" 
              class="option-bar"
            >
              <div class="bar-label">{{ option }}</div>
              <div class="bar-wrapper">
                <div 
                  class="bar" 
                  :style="[
                    { width: `${getPercentage(count, getResponseCount(question))}%` },
                    getBarStyle(index)
                  ]"
                >
                  {{ count }}
                </div>
              </div>
              <div class="percentage">
                {{ getPercentage(count, getResponseCount(question)) }}%
              </div>
            </div>
          </div>

          <!-- Pie Chart View -->
          <div v-else-if="getChartType(question.id) === 'pie'" class="pie-chart">
            <div class="chart-wrapper">
              <Pie
                v-if="getPieChartData(question)"
                :chart-data="getPieChartData(question)"
                :chart-options="pieChartOptions"
              />
            </div>
          </div>

          <!-- Doughnut Chart View -->
          <div v-else-if="getChartType(question.id) === 'doughnut'" class="doughnut-chart">
            <div class="chart-wrapper">
              <Doughnut
                v-if="getPieChartData(question)"
                :chart-data="getPieChartData(question)"
                :chart-options="doughnutChartOptions"
              />
            </div>
          </div>
        </div>

        <!-- Text Responses -->
        <div v-else-if="question.questionType === 'text'" class="text-responses">
          <div 
            v-for="response in getTextResponses(question)" 
            :key="response.id" 
            class="text-response"
          >
            <div class="response-content">{{ response.answer }}</div>
            <div class="response-meta">
              <span class="respondent" v-if="response.respondent">
                {{ response.respondent }}
              </span>
              <span class="date">
                {{ formatDate(response.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { fetchSurveyResults } from '@/services/authService';
import { Pie, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Swal from 'sweetalert2';

ChartJS.register(
  CategoryScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

export default {
  name: 'SurveyResults',
  components: { Pie, Doughnut },

  setup() {
    const route = useRoute();
    const survey = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const questionChartTypes = ref({});

    const chartTypes = [
      { id: 'bar', label: 'Bar Chart', icon: 'bar_chart' },
      { id: 'pie', label: 'Pie Chart', icon: 'pie_chart' },
      { id: 'doughnut', label: 'Doughnut Chart', icon: 'donut_large' }
    ];

    const pieChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateScale: true,
        animateRotate: true
      },
      plugins: {
        title: {
          display: false
        },
        datalabels: {
          color: '#fff',
          font: {
            weight: 'bold',
            size: 12
          },
          formatter: (value, ctx) => {
            const total = ctx.dataset.data.reduce((acc, data) => acc + data, 0);
            const percentage = Math.round((value / total) * 100);
            return `${percentage}%`;
          }
        },
        legend: {
          position: 'right',
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12
            },
            boxWidth: 10,
            boxHeight: 10,
            generateLabels: (chart) => {
              const datasets = chart.data.datasets;
              if (datasets.length === 0) return [];
              
              const dataset = datasets[0];
              return dataset.data.map((value, i) => ({
                text: `${chart.data.labels[i]} (${value})`,
                fillStyle: dataset.backgroundColor[i],
                hidden: false,
                lineCap: 'butt',
                lineDash: [],
                lineDashOffset: 0,
                lineJoin: 'miter',
                lineWidth: 1,
                strokeStyle: dataset.backgroundColor[i],
                pointStyle: 'circle',
                index: i
              }));
            }
          }
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: (context) => {
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${context.chart.data.labels[context.dataIndex]}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    };

    const doughnutChartOptions = {
      ...pieChartOptions,
      cutout: '65%',
      plugins: {
        ...pieChartOptions.plugins,
        legend: {
          ...pieChartOptions.plugins.legend,
          position: 'right',
          display: true
        }
      }
    };

    const getChartType = (questionId) => {
      return questionChartTypes.value[questionId] || 'bar';
    };

    const setChartType = (questionId, type) => {
      questionChartTypes.value[questionId] = type;
    };

    // Define a consistent color palette
    const chartColors = {
      primary: [
        '#2196F3', // Blue
        '#4CAF50', // Green
        '#FFC107', // Amber
        '#9C27B0', // Purple
        '#F44336', // Red
        '#00BCD4', // Cyan
        '#FF9800', // Orange
        '#795548', // Brown
        '#607D8B', // Blue Grey
        '#E91E63', // Pink
        '#3F51B5', // Indigo
        '#009688'  // Teal
      ],
      getColor: (index) => chartColors.primary[index % chartColors.primary.length]
    };

    const getPieChartData = (question) => {
      const counts = question.questionType === 'checkbox' 
        ? getCheckboxCounts(question) 
        : getOptionCounts(question);

      if (!counts || !Object.keys(counts).length) {
        return null;
      }

      // Filter out empty or zero counts
      const labels = Object.keys(counts).filter(key => counts[key] > 0);
      const data = labels.map(label => counts[label]);

      if (!labels.length || !data.length) {
        return null;
      }

      // Calculate total responses for percentage
      const total = data.reduce((sum, value) => sum + value, 0);

      // Create labels with percentages
      const labelsWithPercentages = labels.map(label => {
        const value = counts[label];
        const percentage = Math.round((value / total) * 100);
        return `${label} (${percentage}%)`;
      });

      return {
        labels: labelsWithPercentages,
        datasets: [{
          data,
          label: 'Responses',
          backgroundColor: labels.map((_, index) => chartColors.getColor(index)),
          borderWidth: 1,
          borderColor: '#fff',
          datalabels: {
            anchor: 'center',
            align: 'center',
            offset: 0,
            clip: true
          }
        }]
      };
    };

    // Update bar styles for consistency
    const getBarStyle = (index) => {
      return { backgroundColor: chartColors.getColor(index) };
    };

    const loadResults = async () => {
      try {
        loading.value = true;
        error.value = null;
        const { results } = await fetchSurveyResults(route.params.code);
        survey.value = results;
      } catch (err) {
        error.value = err.message || 'Failed to load survey results';
      } finally {
        loading.value = false;
      }
    };

    const getResponseCount = (question) => {
      return question.answers?.length || 0;
    };

    const getOptionCounts = (question) => {
      const counts = {};
      let options = [];
      try {
        options = typeof question.options === 'string' 
          ? JSON.parse(question.options) 
          : Array.isArray(question.options) 
            ? question.options 
            : [];
      } catch (e) {
        console.error('Error parsing options:', e);
      }
      options.forEach(option => counts[option] = 0);

      question.answers?.forEach(answer => {
        try {
          const answerValue = answer.answer;
          if (typeof answerValue === 'string') {
            counts[answerValue] = (counts[answerValue] || 0) + 1;
          }
        } catch (e) {
          console.error('Error counting answer:', e);
        }
      });

      return counts;
    };

    const getCheckboxCounts = (question) => {
      const counts = {};
      let options = [];
      
      try {
        options = typeof question.options === 'string' 
          ? JSON.parse(question.options) 
          : Array.isArray(question.options) 
            ? question.options 
            : [];
      } catch (e) {
        console.error('Error parsing options:', e);
        return counts;
      }
      
      // Initialize counts for all options
      options.forEach(option => counts[option] = 0);

      question.answers?.forEach(answer => {
        try {
          // Convert answer to array of selected options
          let selectedOptions = [];
          
          const answerValue = answer.answer;
          
          if (typeof answerValue === 'string') {
            try {
              // Try to parse as JSON array
              const parsed = JSON.parse(answerValue);
              selectedOptions = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
              // If parsing fails, split by comma
              selectedOptions = answerValue.split(',').map(s => s.trim());
            }
          } else if (Array.isArray(answerValue)) {
            selectedOptions = answerValue;
          } else if (answerValue) {
            selectedOptions = [String(answerValue)];
          }

          // Only count valid options that exist in the question
          selectedOptions
            .filter(option => options.includes(option))
            .forEach(option => {
              counts[option]++;
            });
        } catch (e) {
          console.error('Error parsing answer:', e);
        }
      });

      return counts;
    };

    const getTextResponses = (question) => {
      return question.answers?.map(answer => ({
        id: answer.id,
        answer: answer.answer,
        respondent: answer.response.respondent,
        createdAt: answer.response.createdAt
      })) || [];
    };

    const getPercentage = (count, total) => {
      if (!total) return 0;
      return Math.round((count / total) * 100);
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const shareSurvey = async () => {
      const surveyUrl = `${window.location.origin}/answer-survey/${survey.value.code}`;
      
      await Swal.fire({
        title: 'Share Survey',
        html: `
          <div style="text-align: left;">
            <p><strong>Survey Code:</strong> ${survey.value.code}</p>
            <p><strong>Survey Link:</strong></p>
            <input 
              value="${surveyUrl}" 
              readonly 
              style="width: 100%; padding: 8px; margin-top: 8px;"
            >
          </div>
        `,
        confirmButtonText: 'Copy Link',
        showCancelButton: true,
        cancelButtonText: 'Close'
      }).then((result) => {
        if (result.isConfirmed) {
          navigator.clipboard.writeText(surveyUrl);
          Swal.fire({
            title: 'Copied!',
            text: 'Survey link copied to clipboard',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }
      });
    };

    onMounted(loadResults);

    return {
      survey,
      loading,
      error,
      loadResults,
      getResponseCount,
      getOptionCounts,
      getCheckboxCounts,
      getTextResponses,
      getPercentage,
      formatDate,
      shareSurvey,
      chartTypes,
      getChartType,
      setChartType,
      getPieChartData,
      pieChartOptions,
      doughnutChartOptions,
      getBarStyle,
      chartColors
    };
  }
};
</script>

<style scoped>
.survey-results-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header-content h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.survey-meta {
  display: flex;
  gap: 1rem;
  color: #666;
}

.survey-meta span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.back-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #e0e0e0;
}

.question-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.question-header {
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-header h3 {
  font-size: 1.25rem;
  color: #333;
  margin: 0;
}

.response-count {
  color: #666;
  font-size: 0.875rem;
}

.chart-container {
  padding: 1.5rem;
}

.options-chart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-bar {
  display: grid;
  grid-template-columns: 150px 1fr 60px;
  gap: 1rem;
  align-items: center;
}

.bar-label {
  color: #333;
  font-weight: 500;
}

.bar-wrapper {
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  color: white;
  padding: 8px 12px;
  min-width: 40px;
  text-align: right;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to right,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.2)
  );
  opacity: 0;
  transition: opacity 0.3s;
}

.bar:hover::after {
  opacity: 1;
}

.percentage {
  color: #666;
  font-size: 0.875rem;
  text-align: right;
}

.text-responses {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.text-response {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
}

.response-content {
  color: #333;
  margin-bottom: 0.5rem;
}

.response-meta {
  display: flex;
  justify-content: space-between;
  color: #666;
  font-size: 0.875rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.material-icons-round {
  font-size: 24px;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.share-btn {
  margin-top: 1rem;
  padding: 12px 24px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem auto;
}

.share-btn:hover {
  background: #1976D2;
}

.chart-controls {
  display: flex;
  gap: 0.5rem;
}

.chart-type-btn {
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: #f5f5f5;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-type-btn:hover {
  background: #e0e0e0;
}

.chart-type-btn.active {
  background: #2196F3;
  color: white;
}

.question-info {
  flex: 1;
}

.pie-chart,
.doughnut-chart {
  height: 300px;
  padding: 1.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.chart-wrapper {
  position: relative;
  width: 70%;
  height: 100%;
}

.chart-container {
  position: relative;
  width: 100%;
  min-height: 400px;
}

@media (min-width: 768px) {
  .chart-container {
    min-height: 450px;
  }

  .pie-chart,
  .doughnut-chart {
    height: 400px;
  }
}

@media (max-width: 1024px) {
  .chart-wrapper {
    width: 100%;
  }

  .pie-chart,
  .doughnut-chart {
    height: 500px;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
  }

  .back-btn {
    width: 100%;
    justify-content: center;
  }

  .survey-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .question-header {
    flex-direction: column;
    gap: 1rem;
  }

  .chart-controls {
    width: 100%;
    justify-content: center;
  }
}
</style> 