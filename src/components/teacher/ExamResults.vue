<template>
  <div class="exam-results">
    <div class="results-header">
      <div class="header-content">
        <h1>{{ $route.query.title }}</h1>
        <p class="test-code">Test Code: {{ $route.query.testCode }}</p>
      </div>
      <button @click="$router.back()" class="back-btn">
        <i class="fas fa-arrow-left"></i> Back
      </button>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading results...
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadResults" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="!results.length" class="no-results">
      <i class="fas fa-clipboard-check"></i>
      <p>No submissions yet</p>
    </div>

    <div v-else class="results-content">
      <div class="filters">
        <div class="filter-group">
          <label for="gradeLevel">Grade Level:</label>
          <select v-model="filters.gradeLevel" id="gradeLevel">
            <option value="">All Grades</option>
            <option v-for="grade in uniqueGrades" :key="grade" :value="grade">
              Grade {{ grade }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="section">Section:</label>
          <select v-model="filters.section" id="section">
            <option value="">All Sections</option>
            <option v-for="section in uniqueSections" :key="section" :value="section">
              {{ section }}
            </option>
          </select>
        </div>
      </div>

      <div class="search-container">
        <div class="search-box">
          <span class="material-icons search-icon">search</span>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search by student name, LRN, or section..."
            class="search-input"
          />
        </div>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <h3>Average Score</h3>
          <p class="stat-value">{{ getAverageScore(filteredResults) }}</p>
        </div>
        <div class="stat-card">
          <h3>Total Submissions</h3>
          <p class="stat-value">{{ filteredResults.length }}</p>
        </div>
        <div class="stat-card">
          <h3>Highest Score</h3>
          <p class="stat-value">{{ getHighestScore(filteredResults) }}</p>
        </div>
        <div class="stat-card">
          <h3>Lowest Score</h3>
          <p class="stat-value">{{ getLowestScore(filteredResults) }}</p>
        </div>
      </div>

      <div class="table-wrapper" ref="resultsTableWrapper">
        <table>
          <thead>
            <tr>
              <th>Grade & Section</th>
              <th>Student</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in filteredResults" :key="result.id">
              <td>Grade {{ result.user.gradeLevel }}-{{ result.user.section }}</td>
              <td>{{ result.user.firstName }} {{ result.user.lastName }}</td>
              <td>{{ result.score }}/{{ result.total }}</td>
              <td>
                <span 
                  class="percentage-badge"
                  :class="{
                    'excellent': result.percentage >= 90,
                    'good': result.percentage >= 80 && result.percentage < 90,
                    'average': result.percentage >= 75 && result.percentage < 80,
                    'poor': result.percentage < 75
                  }"
                >
                  {{ result.percentage }}%
                </span>
              </td>
              <td>{{ formatDate(result.submittedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!loading && !error" class="item-analysis">
        <h2>Item Analysis</h2>
        <div class="analysis-filters">
          <div class="filter-group">
            <label for="difficultyLevel">Difficulty Level:</label>
            <select v-model="analysisFilters.difficulty" id="difficultyLevel">
              <option value="">All Levels</option>
              <option value="easy">Easy (70% or higher)</option>
              <option value="medium">Medium (40-69%)</option>
              <option value="hard">Hard (below 40%)</option>
            </select>
          </div>
          
          <div class="filter-group">
            <label for="successRate">Success Rate:</label>
            <select v-model="analysisFilters.successRate" id="successRate">
              <option value="">All</option>
              <option value="high">High (80% or higher)</option>
              <option value="moderate">Moderate (50-79%)</option>
              <option value="low">Low (below 50%)</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="analysisSearch">Search:</label>
            <div class="search-box">
              <span class="material-icons search-icon">search</span>
              <input 
                type="text" 
                v-model="analysisSearchQuery" 
                placeholder="Search by question #, text, answer, scores, or difficulty..."
                class="search-input"
                id="analysisSearch"
              />
            </div>
          </div>
        </div>

        <div class="table-wrapper" ref="analysisTableWrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Question</th>
                <th>Correct Answer</th>
                <th>Correct Responses</th>
                <th>Incorrect Responses</th>
                <th>Difficulty</th>
                <th>Success Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paginatedAnalysis" :key="item.questionId">
                <td>{{ item.questionNumber }}</td>
                <td>{{ item.questionText }}</td>
                <td>{{ item.correctAnswer }}</td>
                <td>{{ item.correctCount }}/{{ item.totalStudents }}</td>
                <td>{{ item.incorrectCount }}/{{ item.totalStudents }}</td>
                <td>
                  <span 
                    class="difficulty-badge"
                    :class="getDifficultyClass(item.percentageCorrect)"
                  >
                    {{ getDifficultyLabel(item.percentageCorrect) }}
                  </span>
                </td>
                <td>
                  <div class="progress-bar">
                    <div 
                      class="progress" 
                      :style="{ width: `${item.percentageCorrect}%` }"
                      :class="{ 
                        'good': item.percentageCorrect >= 70,
                        'medium': item.percentageCorrect >= 40 && item.percentageCorrect < 70,
                        'poor': item.percentageCorrect < 40
                      }"
                      :data-label="`${item.percentageCorrect}%`"
                    >
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="pagination" v-if="totalPages > 1">
            <button 
              class="pagination-btn" 
              :disabled="currentPage === 1"
              @click="prevPage"
            >
              <span class="material-icons">chevron_left</span>
            </button>

            <div class="page-numbers">
              <button 
                v-if="currentPage > 3"
                class="page-number"
                @click="goToPage(1)"
              >
                1
              </button>
              
              <span v-if="currentPage > 3" class="ellipsis">...</span>
              
              <button 
                v-for="page in displayedPages" 
                :key="page"
                class="page-number"
                :class="{ active: currentPage === page }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              
              <span v-if="currentPage < totalPages - 2" class="ellipsis">...</span>
              
              <button 
                v-if="currentPage < totalPages - 2"
                class="page-number"
                @click="goToPage(totalPages)"
              >
                {{ totalPages }}
              </button>
            </div>

            <button 
              class="pagination-btn" 
              :disabled="currentPage === totalPages"
              @click="nextPage"
            >
              <span class="material-icons">chevron_right</span>
            </button>

            <div class="page-info">
              Page {{ currentPage }} of {{ totalPages }}
            </div>
          </div>
        </div>

        <div class="analysis-summary">
          <h3>Summary</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <span class="label">Total Items:</span>
              <span class="value">{{ getTotalItems() }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Easy Questions:</span>
              <span class="value">{{ getDifficultyCount('easy') }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Medium Questions:</span>
              <span class="value">{{ getDifficultyCount('medium') }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Hard Questions:</span>
              <span class="value">{{ getDifficultyCount('hard') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fetchStudentScores, fetchExamAnalysis } from '../../services/authService';

export default {
  name: 'ExamResults',
  
  setup() {
    const route = useRoute();
    const results = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const filters = ref({
      gradeLevel: '',
      section: ''
    });
    const itemAnalysis = ref([]);
    const analysisFilters = ref({
      difficulty: '',
      successRate: ''
    });

    const resultsTableWrapper = ref(null);
    const analysisTableWrapper = ref(null);

    const itemsPerPage = ref(10);
    const currentPage = ref(1);

    const searchQuery = ref('');
    const analysisSearchQuery = ref('');

    const paginatedAnalysis = computed(() => {
      const startIndex = (currentPage.value - 1) * itemsPerPage.value;
      const endIndex = startIndex + itemsPerPage.value;
      return filteredAnalysis.value.slice(startIndex, endIndex);
    });

    const totalPages = computed(() => {
      return Math.ceil(filteredAnalysis.value.length / itemsPerPage.value);
    });

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    const goToPage = (page) => {
      currentPage.value = page;
    };

    const loadResults = async () => {
      try {
        loading.value = true;
        error.value = null;
        const [scores, analysis] = await Promise.all([
          fetchStudentScores(null, parseInt(route.params.examId)),
          fetchExamAnalysis(parseInt(route.params.examId))
        ]);
        results.value = scores;
        itemAnalysis.value = analysis;
      } catch (err) {
        error.value = err.message;
        console.error('Error loading results:', err);
      } finally {
        loading.value = false;
      }
    };

    const getAverageScore = (results) => {
      if (!results.length) return '0/0';
      const totalScore = results.reduce((sum, result) => sum + result.score, 0);
      const totalItems = results[0].total; // Assuming all have same total
      return `${Math.round(totalScore/results.length)}/${totalItems}`;
    };

    const getAverageScoreColor = (score) => {
      if (score >= 90) return '#4caf50';
      if (score >= 80) return '#2196f3';
      if (score >= 75) return '#ff9800';
      return '#f44336';
    };

    const uniqueGrades = computed(() => {
      const grades = new Set(results.value.map(r => r.user.gradeLevel));
      return Array.from(grades).sort((a, b) => a - b);
    });

    const uniqueSections = computed(() => {
      const sections = new Set(results.value.map(r => r.user.section));
      return Array.from(sections).sort();
    });

    const filteredResults = computed(() => {
      return results.value.filter(result => {
        const matchesGrade = !filters.value.gradeLevel || 
          result.user.gradeLevel === filters.value.gradeLevel;
        const matchesSection = !filters.value.section || 
          result.user.section === filters.value.section;
        
        // Add search filtering with type checking
        const searchLower = searchQuery.value.toLowerCase();
        const matchesSearch = searchLower === '' || 
          result.user.firstName.toLowerCase().includes(searchLower) ||
          result.user.lastName.toLowerCase().includes(searchLower) ||
          (result.user.lrn?.toString() || '').toLowerCase().includes(searchLower) ||
          result.user.section.toLowerCase().includes(searchLower);
        
        return matchesGrade && matchesSection && matchesSearch;
      });
    });

    const getDifficultyLabel = (percentage) => {
      if (percentage >= 70) return 'Easy';
      if (percentage >= 40) return 'Medium';
      return 'Hard';
    };

    const getDifficultyClass = (percentage) => {
      if (percentage >= 70) return 'easy';
      if (percentage >= 40) return 'medium';
      return 'hard';
    };

    const getDifficultyCount = (level) => {
      return itemAnalysis.value.filter(item => {
        const percentage = item.percentageCorrect;
        if (level === 'easy') return percentage >= 70;
        if (level === 'medium') return percentage >= 40 && percentage < 70;
        return percentage < 40;
      }).length;
    };

    const filteredAnalysis = computed(() => {
      return itemAnalysis.value.filter(item => {
        const percentage = item.percentageCorrect;
        
        // Filter by difficulty
        if (analysisFilters.value.difficulty) {
          if (analysisFilters.value.difficulty === 'easy' && percentage < 70) return false;
          if (analysisFilters.value.difficulty === 'medium' && (percentage < 40 || percentage >= 70)) return false;
          if (analysisFilters.value.difficulty === 'hard' && percentage >= 40) return false;
        }
        
        // Filter by success rate
        if (analysisFilters.value.successRate) {
          if (analysisFilters.value.successRate === 'high' && percentage < 80) return false;
          if (analysisFilters.value.successRate === 'moderate' && (percentage < 50 || percentage >= 80)) return false;
          if (analysisFilters.value.successRate === 'low' && percentage >= 50) return false;
        }

        // Enhanced search filtering
        const searchLower = analysisSearchQuery.value.toLowerCase();
        if (searchLower === '') return true;

        return (
          // Search by question number
          item.questionNumber.toString().includes(searchLower) ||
          // Search by question text
          item.questionText.toLowerCase().includes(searchLower) ||
          // Search by correct answer
          item.correctAnswer.toLowerCase().includes(searchLower) ||
          // Search by correct/incorrect counts
          `${item.correctCount}/${item.totalStudents}`.includes(searchLower) ||
          `${item.incorrectCount}/${item.totalStudents}`.includes(searchLower) ||
          // Search by percentage
          `${item.percentageCorrect}%`.includes(searchLower) ||
          // Search by difficulty level
          getDifficultyLabel(item.percentageCorrect).toLowerCase().includes(searchLower)
        );
      });
    });

    const formatDate = (date) => {
      return new Date(date).toLocaleString();
    };

    const checkTableScroll = () => {
      if (resultsTableWrapper.value) {
        resultsTableWrapper.value.classList.toggle(
          'scrollable',
          resultsTableWrapper.value.scrollWidth > resultsTableWrapper.value.clientWidth
        );
      }
      if (analysisTableWrapper.value) {
        analysisTableWrapper.value.classList.toggle(
          'scrollable',
          analysisTableWrapper.value.scrollWidth > analysisTableWrapper.value.clientWidth
        );
      }
    };

    const displayedPages = computed(() => {
      let pages = [];
      const start = Math.max(1, currentPage.value - 1);
      const end = Math.min(totalPages.value, currentPage.value + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    });

    const getHighestScore = (results) => {
      if (!results.length) return '0';
      const highest = results.reduce((max, result) => 
        result.score > max.score ? result : max
      , results[0]);
      return highest.score;
    };

    const getLowestScore = (results) => {
      if (!results.length) return '0';
      const lowest = results.reduce((min, result) => 
        result.score < min.score ? result : min
      , results[0]);
      return lowest.score;
    };

    const getTotalItems = () => {
      return filteredAnalysis.value.length;
    };

    watch([analysisFilters, analysisSearchQuery], () => {
      currentPage.value = 1;
    });

    onMounted(() => {
      loadResults();
      checkTableScroll();
      window.addEventListener('resize', checkTableScroll);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', checkTableScroll);
    });

    return {
      results,
      loading,
      error,
      filters,
      uniqueGrades,
      uniqueSections,
      filteredResults,
      getAverageScore,
      loadResults,
      formatDate,
      itemAnalysis,
      getAverageScoreColor,
      analysisFilters,
      filteredAnalysis,
      getDifficultyLabel,
      getDifficultyClass,
      getDifficultyCount,
      resultsTableWrapper,
      analysisTableWrapper,
      itemsPerPage,
      currentPage,
      paginatedAnalysis,
      totalPages,
      nextPage,
      prevPage,
      goToPage,
      displayedPages,
      searchQuery,
      analysisSearchQuery,
      getHighestScore,
      getLowestScore,
      getTotalItems
    };
  }
};
</script>

<style scoped>
.exam-results {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-content h1 {
  margin: 0 0 10px 0;
  color: #333;
}

.test-code {
  color: #666;
}

.back-btn {
  padding: 8px 16px;
  background: #f0f0f0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group label {
  font-weight: 500;
  color: #666;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  min-width: 150px;
}

.filter-group select:focus {
  outline: none;
  border-color: #2196f3;
}

.search-container {
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 20px;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

.search-input::placeholder {
  color: #999;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.stat-card:nth-child(1)::before {
  background-color: v-bind("getAverageScoreColor(getAverageScore(filteredResults))");
}

.stat-card:nth-child(2)::before {
  background-color: #2196f3;
}

.stat-card:nth-child(3)::before {
  background-color: #4caf50;
}

.stat-card:nth-child(4)::before {
  background-color: #f44336;
}

.stat-value {
  font-size: 2em;
  color: #2196f3;
  margin: 10px 0 0;
}

.results-table {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

table {
  width: 100%;
  min-width: 800px;
  border-collapse: collapse;
}

th, td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
  white-space: nowrap;
}

th {
  background: #f5f5f5;
  position: sticky;
  top: 0;
  z-index: 1;
}

th:nth-child(1), td:nth-child(1) { width: 5%; }
th:nth-child(2), td:nth-child(2) { width: 30%; }
th:nth-child(3), td:nth-child(3) { width: 15%; }
th:nth-child(4), td:nth-child(4) { width: 12%; }
th:nth-child(5), td:nth-child(5) { width: 12%; }
th:nth-child(6), td:nth-child(6) { width: 13%; }
th:nth-child(7), td:nth-child(7) { width: 13%; }

tr:hover {
  background: #f8f8f8;
}

.item-analysis {
  margin-top: 30px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 20px;
}

.item-analysis h2 {
  margin-bottom: 20px;
  color: #333;
}

.analysis-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.difficulty-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9em;
  display: inline-block;
  text-align: center;
}

.difficulty-badge.easy {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.difficulty-badge.medium {
  background-color: #fff3e0;
  color: #ef6c00;
}

.difficulty-badge.hard {
  background-color: #ffebee;
  color: #c62828;
}

.analysis-summary {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.analysis-summary h3 {
  margin-bottom: 15px;
  color: #333;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.summary-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item .label {
  color: #666;
  font-weight: 500;
}

.summary-item .value {
  font-size: 1.2em;
  font-weight: 600;
  color: #2196f3;
}

.analysis-table {
  overflow-x: auto;
}

.progress-bar {
  width: 100%;
  min-width: 100px;
  height: 24px;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
}

.progress {
  height: 100%;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 12px;
  font-weight: 600;
  color: white;
  transition: width 0.3s ease;
}

.progress::after {
  content: attr(data-label);
  position: absolute;
  right: 8px;
  color: white;
}

.progress.good {
  background-color: #4caf50;
}

.progress.medium {
  background-color: #ff9800;
}

.progress.poor {
  background-color: #f44336;
}

.analysis-table th:first-child,
.analysis-table td:first-child {
  width: 50px;
  text-align: center;
  font-weight: 600;
}

/* Percentage Badge Styles */
.percentage-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  display: inline-block;
  min-width: 60px;
  text-align: center;
}

.percentage-badge.excellent {
  background-color: #4caf50;
  color: white;
}

.percentage-badge.good {
  background-color: #2196f3;
  color: white;
}

.percentage-badge.average {
  background-color: #ff9800;
  color: white;
}

.percentage-badge.poor {
  background-color: #f44336;
  color: white;
}

/* Responsive Design */
@media (max-width: 768px) {
  .results-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .filters, .analysis-filters {
    flex-direction: column;
    gap: 15px;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group label {
    margin-bottom: 5px;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .results-table, .analysis-table {
    margin: 0 -20px;
    width: calc(100% + 40px);
  }

  .table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 0 20px;
    position: relative;
  }

  .table-wrapper::after {
    content: '→';
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    animation: bounce 1s infinite;
    display: none;
  }

  .table-wrapper.scrollable::after {
    display: block;
  }

  table {
    min-width: 800px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .exam-results {
    padding: 10px;
  }

  .item-analysis {
    padding: 15px;
  }

  .percentage-badge {
    min-width: 70px;
  }

  .search-box {
    max-width: 100%;
  }

  .analysis-filters {
    grid-template-columns: 1fr;
  }

  .search-input {
    font-size: 16px; /* Prevent zoom on mobile */
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(-50%) translateX(0); }
  50% { transform: translateY(-50%) translateX(5px); }
}

/* Update pagination styles */
.pagination {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  flex-wrap: wrap;
}

.pagination-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:not(:disabled):hover {
  background: #e0e0e0;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn .material-icons {
  font-size: 20px;
  color: #666;
}

.page-numbers {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.page-number {
  min-width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
}

.page-number.active {
  background: #2196f3;
  color: white;
}

.page-number:hover:not(.active) {
  background: #e0e0e0;
}

.ellipsis {
  color: #666;
  padding: 0 4px;
}

.page-info {
  color: #666;
  font-size: 14px;
  margin-left: 10px;
}

@media (min-width: 1200px) {
  .exam-results {
    padding: 30px;
  }

  .table-wrapper {
    margin: 30px 0;
  }

  table {
    font-size: 16px;
  }

  th, td {
    padding: 20px;
  }

  .summary-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 30px;
  }
}
</style> 