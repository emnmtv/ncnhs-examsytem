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

      <!-- Add view toggle buttons -->
      <div class="view-controls">
        <button 
          class="view-toggle-btn" 
          :class="{ active: viewMode === 'grid' }"
          @click="viewMode = 'grid'"
        >
          <span class="material-icons">grid_view</span>
          Grid View
        </button>
        <button 
          class="view-toggle-btn" 
          :class="{ active: viewMode === 'table' }"
          @click="viewMode = 'table'"
        >
          <span class="material-icons">table_rows</span>
          Table View
        </button>
        
        <!-- Add pagination toggle button -->
        <button 
          class="view-toggle-btn" 
          :class="{ active: showPagination }"
          @click="showPagination = !showPagination"
        >
          <span class="material-icons">{{ showPagination ? 'view_carousel' : 'view_agenda' }}</span>
          {{ showPagination ? 'Paginated' : 'Show All' }}
        </button>
      </div>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="results-grid">
        <div v-for="result in paginatedResults" :key="result.id" class="result-card">
          <div class="result-header">
            <div class="student-info">
              <h3>{{ result.user.firstName }} {{ result.user.lastName }}</h3>
              <p class="grade-section">Grade {{ result.user.gradeLevel }}-{{ result.user.section }}</p>
            </div>
            <div class="score-badge"
              :class="{
                'excellent': result.percentage >= 90,
                'good': result.percentage >= 80 && result.percentage < 90,
                'average': result.percentage >= 75 && result.percentage < 80,
                'poor': result.percentage < 75
              }"
            >
              {{ result.score }}/{{ result.total }}
            </div>
          </div>
          <div class="result-details">
            <div class="detail-item">
              <span class="label">Percentage:</span>
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
            </div>
            <div class="detail-item">
              <span class="label">Submitted:</span>
              <span class="value">{{ formatDate(result.submittedAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="table-wrapper" ref="resultsTableWrapper">
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
            <tr v-for="result in paginatedResults" :key="result.id">
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

      <!-- Add pagination controls for student results -->
      <div class="pagination" :class="{'compact-pagination': isMobile}">
        <template v-if="isMobile">
          <!-- Ultra compact mobile version -->
          <div class="mobile-pagination-controls">
            <button 
              class="mini-pagination-btn" 
              @click="resultsPage > 1 ? resultsPage-- : null"
              :disabled="resultsPage === 1"
            >
              <span class="material-icons">navigate_before</span>
            </button>
            
            <span class="page-indicator">
              <select v-model="resultsPage" class="page-select">
                <option v-for="n in getTotalResultsPages()" :key="n" :value="n">
                  {{ n }}
                </option>
              </select>
              <span class="page-count">/ {{ getTotalResultsPages() }}</span>
            </span>
            
            <button 
              class="mini-pagination-btn" 
              @click="resultsPage < getTotalResultsPages() ? resultsPage++ : null"
              :disabled="resultsPage === getTotalResultsPages()"
            >
              <span class="material-icons">navigate_next</span>
            </button>
          </div>
          
          <div class="mini-page-size">
            <select v-model="resultsPageSize" class="mini-select">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span class="mini-label">per page</span>
          </div>
        </template>
        
        <template v-else>
          <!-- Keep the existing pagination for desktop -->
          <button 
            class="pagination-btn" 
            @click="resultsPage = 1" 
            :disabled="resultsPage === 1"
          >
            <span class="material-icons">first_page</span>
          </button>
          <button 
            class="pagination-btn" 
            @click="resultsPage--" 
            :disabled="resultsPage === 1"
          >
            <span class="material-icons">chevron_left</span>
          </button>
          
          <div class="page-numbers">
            <template v-for="pageNum in getResultsPageNumbers()" :key="pageNum">
              <span v-if="pageNum === '...'" class="ellipsis">...</span>
              <button 
                v-else
                class="page-number" 
                :class="{ active: resultsPage === pageNum }"
                @click="resultsPage = pageNum"
              >
                {{ pageNum }}
              </button>
            </template>
          </div>
          
          <button 
            class="pagination-btn" 
            @click="resultsPage++" 
            :disabled="resultsPage === getTotalResultsPages()"
          >
            <span class="material-icons">chevron_right</span>
          </button>
          <button 
            class="pagination-btn" 
            @click="resultsPage = getTotalResultsPages()" 
            :disabled="resultsPage === getTotalResultsPages()"
          >
            <span class="material-icons">last_page</span>
          </button>
          
          <div class="page-size-selector">
            <label for="resultsPageSize">Items per page:</label>
            <select v-model="resultsPageSize" id="resultsPageSize">
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
        </template>
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

        <!-- Add view toggle buttons for item analysis -->
        <div class="view-controls">
          <button 
            class="view-toggle-btn" 
            :class="{ active: analysisViewMode === 'grid' }"
            @click="analysisViewMode = 'grid'"
          >
            <span class="material-icons">grid_view</span>
            Grid View
          </button>
          <button 
            class="view-toggle-btn" 
            :class="{ active: analysisViewMode === 'table' }"
            @click="analysisViewMode = 'table'"
          >
            <span class="material-icons">table_rows</span>
            Table View
          </button>
          
          <!-- Add pagination toggle button for analysis -->
          <button 
            class="view-toggle-btn" 
            :class="{ active: showAnalysisPagination }"
            @click="showAnalysisPagination = !showAnalysisPagination"
          >
            <span class="material-icons">{{ showAnalysisPagination ? 'view_carousel' : 'view_agenda' }}</span>
            {{ showAnalysisPagination ? 'Paginated' : 'Show All' }}
          </button>
        </div>

        <!-- Grid View for Analysis -->
        <div v-if="analysisViewMode === 'grid'" class="analysis-grid">
          <div v-for="item in paginatedAnalysis" :key="item.questionId" class="analysis-card">
            <div class="question-header">
              <span class="question-number">#{{ item.questionNumber }}</span>
              <span 
                class="difficulty-badge"
                :class="getDifficultyClass(item.percentageCorrect)"
              >
                {{ getDifficultyLabel(item.percentageCorrect) }}
              </span>
            </div>
            <div class="question-text">{{ item.questionText }}</div>
            <div class="answer-info">
              <div class="answer-label">Correct Answer:</div>
              <div class="correct-answer">{{ item.correctAnswer }}</div>
            </div>
            <div class="score-info">
              <div class="score-item">
                <span class="score-label">Correct:</span>
                <span class="score-value correct">{{ item.correctCount }}/{{ item.totalStudents }}</span>
              </div>
              <div class="score-item">
                <span class="score-label">Incorrect:</span>
                <span class="score-value incorrect">{{ item.incorrectCount }}/{{ item.totalStudents }}</span>
              </div>
            </div>
            <div class="success-rate">
              <div class="rate-label">Success Rate ({{ item.percentageCorrect }}%)</div>
              <div class="progress-bar">
                <div 
                  class="progress" 
                  :style="{ width: `${item.percentageCorrect}%` }"
                  :class="{ 
                    'good': item.percentageCorrect >= 70,
                    'medium': item.percentageCorrect >= 40 && item.percentageCorrect < 70,
                    'poor': item.percentageCorrect < 40
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Table View for Analysis -->
        <div v-else class="table-wrapper" ref="analysisTableWrapper">
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
        </div>

        <!-- Pagination for Analysis -->
        <div class="pagination" :class="{'compact-pagination': isMobile}">
          <template v-if="isMobile">
            <!-- Ultra compact mobile version for analysis -->
            <div class="mobile-pagination-controls">
              <button 
                class="mini-pagination-btn" 
                @click="analysisPage > 1 ? analysisPage-- : null"
                :disabled="analysisPage === 1"
              >
                <span class="material-icons">navigate_before</span>
              </button>
              
              <span class="page-indicator">
                <select v-model="analysisPage" class="page-select">
                  <option v-for="n in getTotalAnalysisPages()" :key="n" :value="n">
                    {{ n }}
                  </option>
                </select>
                <span class="page-count">/ {{ getTotalAnalysisPages() }}</span>
              </span>
              
              <button 
                class="mini-pagination-btn" 
                @click="analysisPage < getTotalAnalysisPages() ? analysisPage++ : null"
                :disabled="analysisPage === getTotalAnalysisPages()"
              >
                <span class="material-icons">navigate_next</span>
              </button>
            </div>
            
            <div class="mini-page-size">
              <select v-model="analysisPageSize" class="mini-select">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <span class="mini-label">per page</span>
            </div>
          </template>
          
          <template v-else>
            <!-- Keep the existing pagination for desktop -->
            <button 
              class="pagination-btn" 
              @click="analysisPage = 1" 
              :disabled="analysisPage === 1"
            >
              <span class="material-icons">first_page</span>
            </button>
            <button 
              class="pagination-btn" 
              @click="analysisPage--" 
              :disabled="analysisPage === 1"
            >
              <span class="material-icons">chevron_left</span>
            </button>
            
            <div class="page-numbers">
              <template v-for="pageNum in getAnalysisPageNumbers()" :key="pageNum">
                <span v-if="pageNum === '...'" class="ellipsis">...</span>
                <button 
                  v-else
                  class="page-number" 
                  :class="{ active: analysisPage === pageNum }"
                  @click="analysisPage = pageNum"
                >
                  {{ pageNum }}
                </button>
              </template>
            </div>
            
            <button 
              class="pagination-btn" 
              @click="analysisPage++" 
              :disabled="analysisPage === getTotalAnalysisPages()"
            >
              <span class="material-icons">chevron_right</span>
            </button>
            <button 
              class="pagination-btn" 
              @click="analysisPage = getTotalAnalysisPages()" 
              :disabled="analysisPage === getTotalAnalysisPages()"
            >
              <span class="material-icons">last_page</span>
            </button>
            
            <div class="page-size-selector">
              <label for="analysisPageSize">Items per page:</label>
              <select v-model="analysisPageSize" id="analysisPageSize">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
          </template>
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
import { ref, onMounted, computed, onUnmounted, watch, nextTick } from 'vue';
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

    const searchQuery = ref('');
    const analysisSearchQuery = ref('');

    const viewMode = ref('table');
    const analysisViewMode = ref('table');

    const resultsPage = ref(1);
    const resultsPageSize = ref(10);

    const analysisPage = ref(1);
    const analysisPageSize = ref(10);

    const showPagination = ref(true);
    const showAnalysisPagination = ref(true);

    const isMobile = ref(false);

    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768;
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
        
        // Add special class for very small screens
        resultsTableWrapper.value.classList.toggle(
          'extreme-compact',
          window.innerWidth <= 380
        );
      }
      if (analysisTableWrapper.value) {
        analysisTableWrapper.value.classList.toggle(
          'scrollable',
          analysisTableWrapper.value.scrollWidth > analysisTableWrapper.value.clientWidth
        );
        
        // Add special class for very small screens
        analysisTableWrapper.value.classList.toggle(
          'extreme-compact',
          window.innerWidth <= 380
        );
      }
    };

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

    const paginatedResults = computed(() => {
      if (!showPagination.value) {
        return filteredResults.value;
      }
      const startIndex = (resultsPage.value - 1) * resultsPageSize.value;
      const endIndex = startIndex + resultsPageSize.value;
      return filteredResults.value.slice(startIndex, endIndex);
    });

    const getTotalResultsPages = () => {
      return Math.ceil(filteredResults.value.length / resultsPageSize.value);
    };

    const getResultsPageNumbers = () => {
      const totalPages = getTotalResultsPages();
      if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      
      // Logic for handling many pages with ellipsis
      const pages = [];
      if (resultsPage.value <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (resultsPage.value >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = resultsPage.value - 1; i <= resultsPage.value + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
      return pages;
    };

    const paginatedAnalysis = computed(() => {
      if (!showAnalysisPagination.value) {
        return filteredAnalysis.value;
      }
      const startIndex = (analysisPage.value - 1) * analysisPageSize.value;
      const endIndex = startIndex + analysisPageSize.value;
      return filteredAnalysis.value.slice(startIndex, endIndex);
    });

    const getTotalAnalysisPages = () => {
      return Math.ceil(filteredAnalysis.value.length / analysisPageSize.value);
    };

    const getAnalysisPageNumbers = () => {
      const totalPages = getTotalAnalysisPages();
      if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      
      // Logic for handling many pages with ellipsis
      const pages = [];
      if (analysisPage.value <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (analysisPage.value >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = analysisPage.value - 1; i <= analysisPage.value + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
      return pages;
    };

    // Add watcher for results filters to reset pagination
    watch([filters, searchQuery], () => {
      resultsPage.value = 1;
    });

    // Add watcher for page size changes
    watch(resultsPageSize, () => {
      resultsPage.value = 1;
    });

    // Add a watcher to check scroll when view mode or filtered data changes
    watch([viewMode, analysisViewMode, filteredResults, filteredAnalysis], () => {
      // Use nextTick to ensure DOM is updated before checking
      nextTick(() => {
      checkTableScroll();
      });
    });

    onMounted(() => {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      loadResults();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile);
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
      searchQuery,
      analysisSearchQuery,
      getHighestScore,
      getLowestScore,
      getTotalItems,
      viewMode,
      analysisViewMode,
      resultsPage,
      resultsPageSize,
      analysisPage,
      analysisPageSize,
      paginatedResults,
      getTotalResultsPages,
      getResultsPageNumbers,
      paginatedAnalysis,
      getTotalAnalysisPages,
      getAnalysisPageNumbers,
      showPagination,
      showAnalysisPagination,
      isMobile
    };
  }
};
</script>

<style scoped>
.exam-results {
  width: 100%;
  max-width: auto;
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
  max-width: auto;
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

.view-controls {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-toggle-btn:hover {
  background: #f5f5f5;
}

.view-toggle-btn.active {
  background: #2196F3;
  color: white;
  border-color: #2196F3;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.result-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.result-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  position: relative;
}

.student-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.grade-section {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.score-badge {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  color: white;
  font-size: 1.1rem;
}

.score-badge.excellent {
  background-color: #4caf50;
}

.score-badge.good {
  background-color: #2196f3;
}

.score-badge.average {
  background-color: #ff9800;
}

.score-badge.poor {
  background-color: #f44336;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item .label {
  font-weight: 500;
  color: #666;
}

.detail-item .value {
  color: #333;
}

/* Analysis Grid View */
.analysis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.analysis-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.analysis-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-number {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
}

.question-text {
  font-size: 1rem;
  line-height: 1.5;
  color: #333;
  margin-bottom: 0.5rem;
}

.answer-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.answer-label {
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.correct-answer {
  font-weight: 600;
  color: #4caf50;
}

.score-info {
  display: flex;
  gap: 1rem;
}

.score-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.score-label {
  font-size: 0.85rem;
  color: #666;
}

.score-value {
  font-weight: 600;
}

.score-value.correct {
  color: #4caf50;
}

.score-value.incorrect {
  color: #f44336;
}

.success-rate {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.rate-label {
  font-size: 0.85rem;
  color: #666;
  display: flex;
  justify-content: space-between;
}

/* Pagination Styles */
.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.page-size-selector select {
  padding: 0.3rem 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background: white;
}

/* Responsive Styles for Analysis Grid */
@media (max-width: 768px) {
  .analysis-grid {
    grid-template-columns: 1fr;
  }
  
  .page-size-selector {
    margin-left: 0;
    margin-top: 1rem;
  }
  
  .pagination {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
}

/* Update the table-wrapper class to ensure consistent behavior for both tables */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 1.5rem;
  position: relative;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* Add a scroll indicator for mobile users */
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

/* Show the scroll indicator when table is wider than container */
.table-wrapper.scrollable::after {
  display: block;
}

/* Make table headers sticky so they stay visible while scrolling */
.table-wrapper thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f5f5f5;
  box-shadow: 0 1px 0 rgba(0,0,0,0.1);
}

/* Responsive adjustments for mobile devices */
@media (max-width: 768px) {
  .item-analysis .analysis-filters {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .item-analysis h2 {
    font-size: 1.5rem;
  }
  
  .question-text {
    font-size: 0.9rem;
  }
  
  .table-wrapper table {
    min-width: unset;
    width: 100%;
  }
  
  .analysis-summary .summary-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  /* Make pagination more mobile friendly */
  .pagination {
    padding: 8px;
    gap: 5px;
    flex-wrap: wrap;
    justify-content: center;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }
  
  /* Make buttons smaller but still touch-friendly */
  .pagination-btn,
  .page-number {
    width: 32px;
    height: 32px;
    min-width: unset;
  }
  
  /* Simplify page size selector */
  .page-size-selector {
    margin-top: 8px;
    order: 4;
    width: auto;
    border-top: 1px solid #f0f0f0;
    padding-top: 8px;
  }
  
  .page-size-selector label {
    font-size: 0.8rem;
  }
  
  .page-size-selector select {
    font-size: 0.8rem;
    padding: 3px;
  }
}

/* Extra small devices */
@media (max-width: 480px) {
  .analysis-summary .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .item-analysis {
    padding: 10px;
  }
  
  /* Ultra compact pagination */
  .pagination {
    padding: 5px;
    gap: 2px;
  }
  
  .pagination-btn,
  .page-number {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
  
  /* Show fewer page numbers */
  .pagination .page-numbers {
    display: flex;
    gap: 2px;
  }
  
  /* Only show current, first, last, and immediate adjacent pages */
  .pagination .page-number:not(.active):not(:first-child):not(:last-child) {
    display: none;
  }
  
  /* Always show the active page and its immediate neighbors */
  .pagination .page-number.active,
  .pagination .page-number.active + button,
  .pagination .page-number.active - button {
    display: flex;
  }
  
  /* Simplified controls for very small screens */
  .ellipsis {
    margin: 0 2px;
    font-size: 0.7rem;
  }
  
  /* Stack the page size selector and make it more compact */
  .page-size-selector {
    flex-direction: row;
    align-items: center;
    gap: 5px;
    width: 100%;
    justify-content: center;
  }
  
  /* Reduce vertical space */
  .pagination + .item-analysis,
  .pagination + .results-grid,
  .pagination + .table-wrapper {
    margin-top: 10px;
  }
}

/* Portrait phones */
@media (max-width: 380px) {
  /* Ultra compact mode */
  .pagination {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2px;
  }
  
  /* Smaller buttons but still touch-friendly */
  .pagination-btn,
  .page-number {
    width: 26px;
    height: 26px;
    font-size: 0.75rem;
    border-radius: 4px;
  }
  
  /* Hide page numbers except current */
  .pagination .page-number:not(.active) {
    display: none;
  }
  
  /* Simplify page info to save space */
  .page-size-selector label {
    font-size: 0.75rem;
  }
  
  .page-size-selector select {
    font-size: 0.75rem;
    padding: 2px;
  }
}

/* Update the table styling to allow better text wrapping and responsive behavior */
.table-wrapper table {
  width: 100%;
  border-collapse: collapse;
}

/* Enable text wrapping in table cells, especially for question text */
.table-wrapper td {
  white-space: normal;
  word-wrap: break-word;
  max-width: 200px; /* Limit width to force wrapping */
}

/* Make the question column more flexible */
.table-wrapper th:nth-child(2),
.table-wrapper td:nth-child(2) {
  min-width: 150px;
  max-width: 300px;
}

/* Adjust column widths for better mobile appearance */
@media (max-width: 768px) {
  .table-wrapper table {
    /* Remove fixed minimum width to allow more responsive behavior */
    min-width: unset;
    width: 100%;
  }
  
  /* Make text smaller on mobile */
  .table-wrapper {
    font-size: 0.9rem;
  }
  
  /* Reduce padding in cells to fit more content */
  .table-wrapper th,
  .table-wrapper td {
    padding: 10px 8px;
  }
  
  /* Make the badges more compact */
  .difficulty-badge,
  .percentage-badge {
    padding: 2px 4px;
    font-size: 0.8rem;
  }
  
  /* Reduce progress bar height */
  .progress-bar {
    height: 18px;
  }
  
  /* Make cells adapt better to content */
  .table-wrapper td {
    max-width: 120px;
  }
}

/* On very small screens, use a more compressed layout */
@media (max-width: 480px) {
  .table-wrapper th,
  .table-wrapper td {
    padding: 8px 4px;
    font-size: 0.85rem;
  }
  
  /* Further reduce cell max width */
  .table-wrapper td {
    max-width: 100px;
  }
  
  /* Modify table appearance for extremely small screens */
  @media (max-width: 380px) {
    /* Optional: Consider a card-based view alternative for very small screens */
    .table-wrapper.extreme-compact th:nth-child(3),
    .table-wrapper.extreme-compact td:nth-child(3),
    .table-wrapper.extreme-compact th:nth-child(4),
    .table-wrapper.extreme-compact td:nth-child(4) {
      display: none; /* Hide less important columns on extremely small screens */
    }
  }
}

/* Compact Pagination for Mobile */
.compact-pagination {
  padding: 8px 10px !important;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  margin: 15px 0;
}

.mobile-pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-pagination-btn {
  width: 36px;
  height: 36px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.mini-pagination-btn:active {
  transform: scale(0.95);
  background: #f0f0f0;
}

.mini-pagination-btn .material-icons {
  font-size: 18px;
}

.page-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
}

.page-select {
  width: 42px;
  height: 36px;
  padding: 0 4px;
  font-size: 0.9rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
  background: white;
  text-align: center;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 4px center;
  padding-right: 20px;
}

.page-count {
  font-size: 0.9rem;
  color: #555;
  min-width: 30px;
}

.mini-page-size {
  background: rgba(255,255,255,0.5);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #eee;
}

.mini-select {
  width: 48px;
  height: 30px;
  padding: 0 4px;
  font-size: 0.9rem;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%23666' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 4px center;
  padding-right: 20px;
  background-color: white;
}

.mini-label {
  font-size: 0.85rem;
  color: #555;
}

/* Add a subtle separator between controls */
.mobile-pagination-controls::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 60%;
  width: 1px;
  background: #e0e0e0;
  display: none;
}

/* Small mobile devices */
@media (max-width: 480px) {
  .compact-pagination {
    padding: 6px 8px !important;
    margin: 10px 0;
  }
  
  .mini-pagination-btn {
    width: 32px;
    height: 32px;
  }
  
  .page-select, .mini-select {
    font-size: 0.85rem;
    height: 32px;
  }
  
  .page-count, .mini-label {
    font-size: 0.8rem;
  }
  
  /* Make the mini buttons more visible */
  .mini-pagination-btn .material-icons {
    font-size: 20px;
    color: #444;
  }
  
  /* Add subtle animation for feedback */
  .mini-pagination-btn:active .material-icons {
    transform: scale(0.9);
  }
}

/* Very small devices */
@media (max-width: 380px) {
  .compact-pagination {
    padding: 5px 6px !important;
    flex-wrap: nowrap;
  }
  
  .mini-pagination-btn {
    width: 28px;
    height: 28px;
  }
  
  .mini-pagination-btn .material-icons {
    font-size: 18px;
  }
  
  .page-select, .mini-select {
    width: 36px;
    height: 28px;
  }
  
  .page-count, .mini-label {
    font-size: 0.75rem;
  }
  
  /* Compress the spacing */
  .mobile-pagination-controls {
    gap: 5px;
  }
  
  .mini-page-size {
    padding: 3px 5px;
    gap: 3px;
  }
}
</style> 