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
      <div class="filters">
        <div class="filter-group">
          <label for="section">Section:</label>
          <select id="section" v-model="filters.section">
            <option value="">All Sections</option>
            <option v-for="section in uniqueSections" :key="section" :value="section">
              {{ section }}
            </option>
          </select>
        </div>
        
        <div class="search-container">
          <div class="search-box">
            <span class="material-icons search-icon">search</span>
            <input 
              type="text"
              v-model="searchQuery"
              placeholder="Search by name or LRN..."
              class="search-input"
            >
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
              <th v-for="part in examParts" :key="part.id">
                {{ part.label }} ({{ part.totalPoints }})
              </th>
              <th>Total Score</th>
              <th>Percentage</th>
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
    const filters = ref({ section: '' });
    const searchQuery = ref('');
    const maxTotalScore = ref(0);
    
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

    const uniqueSections = computed(() => {
      return [...new Set(results.value.map(r => r.section))].sort();
    });

    const filteredResults = computed(() => {
      return results.value.filter(result => {
        const matchesSection = !filters.value.section || result.section === filters.value.section;
        const searchTerm = searchQuery.value.toLowerCase();
        const matchesSearch = !searchTerm || 
          result.studentName.toLowerCase().includes(searchTerm) ||
          result.lrn.toLowerCase().includes(searchTerm);
        return matchesSection && matchesSearch;
      });
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
      uniqueSections,
      filteredResults,
      paginatedResults,
      startIndex,
      resultsPage,
      resultsPageSize,
      showPagination,
      maxTotalScore,
      getTotalResultsPages,
      getResultsPageNumbers,
      getScoreClass,
      getTotalScoreClass,
      getPercentageClass,
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

/* Filters and search styles */
.filters {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
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

.filter-group select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 14px;
}

.search-container {
  flex: 1;
  max-width: 300px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #666;
  font-size: 20px;
}

.search-input {
  width: 100%;
  padding: 10px 10px 10px 40px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #673ab7;
  box-shadow: 0 0 0 2px rgba(103, 58, 183, 0.1);
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

/* Responsive design */
@media (max-width: 768px) {
  .part-results {
    padding: 10px;
  }

  .results-header {
    flex-direction: column;
    gap: 15px;
  }

  .filters {
    flex-direction: column;
    gap: 15px;
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
}
</style>
