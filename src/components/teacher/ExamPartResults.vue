<template>
  <div class="part-results">
    <div class="results-header">
      <div class="header-content">
        <h1>Part Scores - {{ examTitle }}</h1>
        <span class="test-code">Test Code: {{ testCode }}</span>
      </div>
      <div class="header-actions">
        <button class="back-btn" @click="goBack">
          <span class="material-icons">arrow_back</span>
          Back to Results
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading part scores...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
    </div>

    <div v-else class="scores-content">
      <!-- Search and Filter -->
      <div class="table-controls">
        <div class="search-container">
          <span class="material-icons search-icon">search</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search students by name, LRN, or section..." 
            class="search-input"
          />
          <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="filter-container">
          <select v-model="filters.gradeLevel" @change="applyFilter" class="grade-filter">
            <option value="">All Grades</option>
            <option v-for="grade in uniqueGrades" :key="grade" :value="grade">
              Grade {{ grade }}
            </option>
          </select>
          <select v-model="filters.section" @change="applyFilter" class="section-filter">
            <option value="">All Sections</option>
            <option v-for="section in uniqueSections" :key="section" :value="section">
              {{ section }}
            </option>
          </select>
          <select v-model="filters.sortBy" @change="applyFilter" class="sort-filter">
            <option value="">Sort By</option>
            <option value="highest">Highest to Lowest</option>
            <option value="lowest">Lowest to Highest</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      <!-- Legend Toggle -->
      <div class="legend-toggle-wrapper">
        <div class="legend-toggle-container">
          <label class="legend-toggle">
            <input type="checkbox" v-model="showLegend">
            <span class="toggle-slider"></span>
            <span class="toggle-label">
              <span class="material-icons">info</span>
              Show Analysis & Legend
            </span>
          </label>
        </div>
      </div>

      <!-- Scoring Legend -->
      <div v-if="showLegend" class="legend-container">
        <div class="legend-section">
          <h3><span class="material-icons">palette</span> Score Legend</h3>
          <div class="legend-items">
            <div class="legend-item">
              <span class="legend-color score-excellent"></span>
              <span class="legend-label">Excellent (90-100%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color score-good"></span>
              <span class="legend-label">Good (80-89%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color score-passing"></span>
              <span class="legend-label">Passing (75-79%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color score-failing"></span>
              <span class="legend-label">Failing (Below 75%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color score-zero"></span>
              <span class="legend-label">No Score (0)</span>
            </div>
          </div>
        </div>

        <!-- Part Difficulty Analysis -->
        <div class="legend-section" v-if="partDifficultyAnalysis.length > 0">
          <h3><span class="material-icons">trending_up</span> Part Difficulty Analysis</h3>
          <div class="difficulty-items">
            <div v-for="part in partDifficultyAnalysis" :key="part.id" class="difficulty-item" :class="part.difficulty">
              <div class="difficulty-indicator">
                <span class="material-icons">{{ getDifficultyIcon(part.difficulty) }}</span>
              </div>
              <div class="difficulty-info">
                <div class="part-name">{{ part.label }}</div>
                <div class="difficulty-stats">
                  <span class="avg-score">Avg: {{ part.averageScore.toFixed(1) }}/{{ part.totalPoints }} ({{ part.averagePercentage.toFixed(1) }}%)</span>
                  <span class="difficulty-label">{{ part.difficultyText }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="table-wrapper" ref="resultsTableWrapper">
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Student Name</th>
              <th>LRN</th>
              <th>Section</th>
              <th v-for="part in examParts" :key="part.id" :class="getPartDifficultyClass(part.id)">
                <div class="part-header">
                  <div class="part-title">{{ part.label }} ({{ part.totalPoints }})</div>
                  <div class="part-difficulty" v-if="getPartDifficulty(part.id)">
                    <span class="material-icons">{{ getDifficultyIcon(getPartDifficulty(part.id).difficulty) }}</span>
                    <span class="difficulty-text">{{ getPartDifficulty(part.id).difficultyText }}</span>
                  </div>
                </div>
              </th>
              <th>Total Score</th>
              <th>Percentage</th>
              <th>Performance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(result, index) in paginatedResults" :key="result.userId">
              <td>{{ startIndex + index + 1 }}</td>
              <td>{{ result.studentName }}</td>
              <td>{{ result.lrn }}</td>
              <td>{{ result.section }}</td>
              <td v-for="part in examParts" :key="part.id" 
                  :class="getScoreClass(result.partScores[part.id]?.score, part.totalPoints)">
                {{ result.partScores[part.id]?.score || 0 }}
              </td>
              <td :class="getTotalScoreClass(result.totalScore, maxTotalScore)">
                {{ result.totalScore }}
              </td>
              <td :class="getPercentageClass(result.percentage)">
                {{ typeof result.percentage === 'number' ? result.percentage.toFixed(2) : 'N/A' }}%
              </td>
              <td :class="getPercentageClass(result.percentage)">
                <div class="legend-indicator">
                  <span class="legend-dot" :class="getPercentageClass(result.percentage)"></span>
                  <span class="legend-label">{{ getPerformanceLabel(result.percentage) }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="showPagination && filteredResults.length > resultsPageSize">
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
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getExamScoresPerPart } from '@/services/authService';

export default {
  name: 'ExamPartResults',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const examId = route.params.examId;
    const testCode = ref('');
    const examTitleFromQuery = route.query.title;
    
    const loading = ref(true);
    const error = ref(null);
    const examTitle = ref('');
    const examParts = ref([]);
    const results = ref([]);
    const filters = ref({ 
      gradeLevel: '',
      section: '',
      sortBy: ''
    });
    const searchQuery = ref('');
    const maxTotalScore = ref(0);
    const showLegend = ref(false); // Toggle for legend display
    
    // Pagination
    const resultsPage = ref(1);
    const resultsPageSize = ref(10);
    const showPagination = ref(true);

    const loadPartScores = async () => {
      try {
        loading.value = true;
        const data = await getExamScoresPerPart(examId);
        
        console.log('API Response:', data); // Debug log
        
        examTitle.value = data.exam?.examTitle || examTitleFromQuery || 'Exam';
        testCode.value = data.exam?.testCode || route.query.testCode || 'N/A';
        examParts.value = data.parts || [];
        
        // Calculate total points from parts
        const totalPoints = data.parts?.reduce((sum, part) => sum + (part.totalPoints || 0), 0) || 1;
        maxTotalScore.value = totalPoints;
        
        // Map student scores with proper data structure
        results.value = (data.studentScores || []).map(score => {
          console.log('Processing score:', score); // Debug log
          return {
            userId: score.student.id,
            studentName: `${score.student.firstName} ${score.student.lastName}`,
            lrn: score.student.lrn,
            gradeLevel: score.student.gradeLevel,
            section: score.student.section,
            totalScore: score.overallScore.total.points,
            percentage: score.overallScore.total.percentage,
            partScores: score.partScores.reduce((acc, part) => {
              acc[part.partId] = {
                score: part.total.points,
                maxScore: part.total.total
              };
              return acc;
            }, {})
          };
        });
        
        console.log('Processed results:', results.value); // Debug log
        console.log('First result sample:', results.value[0]); // Debug first result
        console.log('Exam parts:', examParts.value); // Debug parts
        
      } catch (err) {
        console.error('Error loading part scores:', err); // Debug log
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const uniqueGrades = computed(() => {
      const grades = new Set(results.value.map(r => r.gradeLevel).filter(g => g != null));
      return Array.from(grades).sort((a, b) => a - b);
    });

    const uniqueSections = computed(() => {
      return [...new Set(results.value.map(r => r.section))].sort();
    });

    // Part difficulty analysis
    const partDifficultyAnalysis = computed(() => {
      if (!results.value.length || !examParts.value.length) return [];
      
      return examParts.value.map(part => {
        const partScores = results.value
          .map(result => result.partScores[part.id])
          .filter(score => score && score.score !== undefined)
          .map(score => score.score);
        
        if (partScores.length === 0) {
          return {
            id: part.id,
            label: part.label,
            totalPoints: part.totalPoints,
            averageScore: 0,
            averagePercentage: 0,
            difficulty: 'unknown',
            difficultyText: 'No Data'
          };
        }
        
        const averageScore = partScores.reduce((sum, score) => sum + score, 0) / partScores.length;
        const averagePercentage = (averageScore / part.totalPoints) * 100;
        
        let difficulty, difficultyText;
        if (averagePercentage >= 80) {
          difficulty = 'easy';
          difficultyText = 'Easy';
        } else if (averagePercentage >= 60) {
          difficulty = 'medium';
          difficultyText = 'Medium';
        } else {
          difficulty = 'hard';
          difficultyText = 'Hard';
        }
        
        return {
          id: part.id,
          label: part.label,
          totalPoints: part.totalPoints,
          averageScore,
          averagePercentage,
          difficulty,
          difficultyText
        };
      }).sort((a, b) => a.averagePercentage - b.averagePercentage); // Sort by difficulty (hardest first)
    });

    const filteredResults = computed(() => {
      // First, get all matching results based on filters and search
      let matchingResults = results.value.filter(result => {
        const matchesGrade = !filters.value.gradeLevel || 
          result.gradeLevel === parseInt(filters.value.gradeLevel);
        const matchesSection = !filters.value.section || 
          result.section === filters.value.section;
        
        // Add search filtering with type checking
        const searchLower = searchQuery.value.toLowerCase();
        const matchesSearch = searchLower === '' || 
          result.studentName.toLowerCase().includes(searchLower) ||
          (result.lrn?.toString() || '').toLowerCase().includes(searchLower) ||
          (result.section || '').toLowerCase().includes(searchLower);
        
        return matchesGrade && matchesSection && matchesSearch;
      });
      
      // Apply sorting if a sort option is selected
      if (filters.value.sortBy) {
        matchingResults = [...matchingResults].sort((a, b) => {
          switch (filters.value.sortBy) {
            case 'highest': {
              // Sort by percentage (highest to lowest)
              return (b.percentage || 0) - (a.percentage || 0);
            }
            case 'lowest': {
              // Sort by percentage (lowest to highest)
              return (a.percentage || 0) - (b.percentage || 0);
            }
            case 'name-asc': {
              // Sort by name (A-Z)
              const nameA = a.studentName.toLowerCase();
              const nameB = b.studentName.toLowerCase();
              return nameA.localeCompare(nameB);
            }
            case 'name-desc': {
              // Sort by name (Z-A)
              const nameA2 = a.studentName.toLowerCase();
              const nameB2 = b.studentName.toLowerCase();
              return nameB2.localeCompare(nameA2);
            }
            default:
              return 0;
          }
        });
      }
      
      return matchingResults;
    });

    const startIndex = computed(() => (resultsPage.value - 1) * resultsPageSize.value);
    const endIndex = computed(() => startIndex.value + resultsPageSize.value);
    
    const paginatedResults = computed(() => {
      return filteredResults.value.slice(startIndex.value, endIndex.value);
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

    // Score styling helpers
    const getScoreClass = (score, maxScore) => {
      if (!score) return 'score-zero';
      const percentage = (score / maxScore) * 100;
      return getPercentageClass(percentage);
    };

    const getTotalScoreClass = (score, maxScore) => {
      const percentage = (score / maxScore) * 100;
      return getPercentageClass(percentage);
    };

    const getPercentageClass = (percentage) => {
      if (percentage >= 90) return 'score-excellent';
      if (percentage >= 80) return 'score-good';
      if (percentage >= 75) return 'score-passing';
      return 'score-failing';
    };

    const getPerformanceLabel = (percentage) => {
      if (typeof percentage !== 'number' || isNaN(percentage)) return 'N/A';
      if (percentage >= 90) return 'Excellent';
      if (percentage >= 80) return 'Good';
      if (percentage >= 75) return 'Passing';
      return 'Failing';
    };

    // Difficulty analysis helpers
    const getPartDifficulty = (partId) => {
      return partDifficultyAnalysis.value.find(part => part.id === partId);
    };

    const getPartDifficultyClass = (partId) => {
      const difficulty = getPartDifficulty(partId);
      if (!difficulty) return '';
      return `part-${difficulty.difficulty}`;
    };

    const getDifficultyIcon = (difficulty) => {
      switch (difficulty) {
        case 'easy': return 'check_circle';
        case 'medium': return 'warning';
        case 'hard': return 'error';
        default: return 'help';
      }
    };

    const clearSearch = () => {
      searchQuery.value = '';
    };

    const applyFilter = () => {
      // Filter is applied automatically through computed property
    };

    const goBack = () => {
      router.back();
    };

    onMounted(() => {
      loadPartScores();
    });

    return {
      examTitle,
      testCode: testCode.value,
      loading,
      error,
      examParts,
      results,
      filters,
      searchQuery,
      showLegend,
      uniqueGrades,
      uniqueSections,
      filteredResults,
      paginatedResults,
      startIndex,
      resultsPage,
      resultsPageSize,
      showPagination,
      maxTotalScore,
      partDifficultyAnalysis,
      getTotalResultsPages,
      getResultsPageNumbers,
      getScoreClass,
      getTotalScoreClass,
      getPercentageClass,
      getPartDifficulty,
      getPartDifficultyClass,
      getDifficultyIcon,
      getPerformanceLabel,
      clearSearch,
      applyFilter,
      goBack
    };
  }
};
</script>

<style scoped>
.part-results {
  width: 100%;
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
  background: #f5f7fa;
  min-height: 100vh;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.1);
}

.header-content h1 {
  margin: 0 0 10px 0;
  color: #673ab7;
  font-size: 1.8rem;
  font-weight: 700;
}

.test-code {
  color: #666;
  font-weight: 500;
}

.back-btn {
  padding: 10px 18px;
  background: #e8e3f5;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #673ab7;
  font-weight: 600;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #d1c4e9;
}

.table-wrapper {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

/* Score styling */
.score-excellent {
  color: #2e7d32;
  background: #e8f5e9;
  font-weight: 600;
}

.score-good {
  color: #1565c0;
  background: #e3f2fd;
  font-weight: 600;
}

.score-passing {
  color: #f57c00;
  background: #fff3e0;
  font-weight: 600;
}

.score-failing {
  color: #c62828;
  background: #ffebee;
  font-weight: 600;
}

.score-zero {
  color: #666;
  background: #f5f5f5;
}

/* Legend Indicator Column */
.legend-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-dot.score-excellent {
  background: #2e7d32;
}

.legend-dot.score-good {
  background: #1565c0;
}

.legend-dot.score-passing {
  background: #f57c00;
}

.legend-dot.score-failing {
  background: #c62828;
}

.legend-label {
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
}

/* Loading state */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #673ab7;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Pagination styles */
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

/* Table Controls - Search and Filter */
.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 20px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  font-size: 0.95rem;
  background: #fff;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.clear-search-btn:hover {
  color: #333;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grade-filter,
.section-filter {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  font-size: 0.95rem;
  background: #fff;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 120px;
  cursor: pointer;
}

.sort-filter {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  font-size: 0.95rem;
  background: #fff;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  cursor: pointer;
}

.grade-filter:focus,
.section-filter:focus,
.sort-filter:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
}

/* Legend Toggle Wrapper */
.legend-toggle-wrapper {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.legend-toggle-container {
  display: flex;
  align-items: center;
}

.legend-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  user-select: none;
}

.legend-toggle input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 50px;
  height: 24px;
  background-color: #ccc;
  border-radius: 12px;
  transition: background-color 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s;
}

.legend-toggle input[type="checkbox"]:checked + .toggle-slider {
  background-color: #673ab7;
}

.legend-toggle input[type="checkbox"]:checked + .toggle-slider::before {
  transform: translateX(26px);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.toggle-label .material-icons {
  font-size: 18px;
  color: #673ab7;
}


/* Error state */
.error {
  background: #ffebee;
  color: #c62828;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  margin: 20px 0;
}

/* Legend Container */
.legend-container {
  display: flex;
  gap: 30px;
  margin-bottom: 25px;
  flex-wrap: wrap;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.legend-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  flex: 1;
  min-width: 300px;
}

.legend-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.legend-section .material-icons {
  color: #673ab7;
  font-size: 20px;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* Difficulty Analysis */
.difficulty-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.difficulty-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.difficulty-item.easy {
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
}

.difficulty-item.medium {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
}

.difficulty-item.hard {
  background: #ffebee;
  border-left: 4px solid #f44336;
}

.difficulty-item.unknown {
  background: #f5f5f5;
  border-left: 4px solid #9e9e9e;
}

.difficulty-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.difficulty-item.easy .difficulty-indicator {
  background: #4caf50;
  color: white;
}

.difficulty-item.medium .difficulty-indicator {
  background: #ff9800;
  color: white;
}

.difficulty-item.hard .difficulty-indicator {
  background: #f44336;
  color: white;
}

.difficulty-item.unknown .difficulty-indicator {
  background: #9e9e9e;
  color: white;
}

.difficulty-indicator .material-icons {
  font-size: 18px;
}

.difficulty-info {
  flex: 1;
}

.part-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.difficulty-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}

.avg-score {
  font-weight: 500;
}

.difficulty-label {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Table Header Difficulty Styling */
.part-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  text-align: center;
}

.part-title {
  font-weight: 600;
  font-size: 14px;
}

.part-difficulty {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
}

.part-difficulty .material-icons {
  font-size: 14px;
}

.difficulty-text {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Part difficulty column styling */
th.part-easy {
  background: #e8f5e9 !important;
  border-left: 3px solid #4caf50;
}

th.part-medium {
  background: #fff3e0 !important;
  border-left: 3px solid #ff9800;
}

th.part-hard {
  background: #ffebee !important;
  border-left: 3px solid #f44336;
}

th.part-unknown {
  background: #f5f5f5 !important;
  border-left: 3px solid #9e9e9e;
}

/* Responsive design */
@media (max-width: 768px) {
  .part-results {
    padding: 10px;
  }

  .results-header {
    flex-direction: column;
    gap: 15px;
  }

  .table-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
  }

  .search-container {
    max-width: none;
  }

  .search-input {
    padding: 10px 12px 10px 40px;
    font-size: 0.9rem;
  }

  .grade-filter,
  .section-filter,
  .sort-filter {
    padding: 10px 12px;
    font-size: 0.9rem;
    min-width: 120px;
  }

  .legend-toggle-wrapper {
    margin-bottom: 15px;
    justify-content: flex-start;
  }

  .legend-toggle-container {
    margin-left: 0;
  }

  .toggle-label {
    font-size: 13px;
  }

  .toggle-label .material-icons {
    font-size: 16px;
  }

  .legend-container {
    flex-direction: column;
    gap: 20px;
  }

  .legend-section {
    min-width: auto;
  }

  .difficulty-stats {
    flex-direction: column;
    gap: 4px;
  }

  .part-header {
    gap: 2px;
  }

  .part-title {
    font-size: 12px;
  }

  .part-difficulty {
    font-size: 10px;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .pagination {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .page-size-selector {
    margin-left: 0;
    margin-top: 1rem;
  }

  .filter-container {
    flex-wrap: wrap;
    gap: 8px;
  }

  .grade-filter,
  .section-filter,
  .sort-filter {
    flex: 1;
    min-width: calc(50% - 4px);
  }
}
</style>
