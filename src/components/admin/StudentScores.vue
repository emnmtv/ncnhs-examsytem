<template>
  <div class="scores-container">
    <div class="scores-header">
      <h2>Student Exam Results</h2>
      
      <!-- Advanced Filters Section -->
      <div class="filter-toggle" @click="showAdvancedFilters = !showAdvancedFilters">
        {{ showAdvancedFilters ? 'Hide Filters' : 'Show Filters' }}
        <i :class="showAdvancedFilters ? 'fas fa-chevron-up' : 'fas fa-chevron-down'"></i>
      </div>
      
      <div class="filters" :class="{ 'expanded': showAdvancedFilters }">
        <!-- Basic Filters (Always visible) -->
        <div class="filter-row">
          <div class="filter-group">
            <label for="student-filter">Student:</label>
            <select id="student-filter" v-model="selectedStudentId" @change="applyFilters">
              <option value="">All Students</option>
              <option v-for="student in students" :key="student.id" :value="student.id">
                {{ student.firstName }} {{ student.lastName }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label for="exam-filter">Exam:</label>
            <select id="exam-filter" v-model="selectedExamId" @change="applyFilters">
              <option value="">All Exams</option>
              <option v-for="exam in uniqueExams" :key="exam.id" :value="exam.id">
                {{ exam.examTitle }}
              </option>
            </select>
          </div>
          
          <div class="filter-actions">
            <button class="reset-filter-btn" @click="resetFilters" title="Reset all filters">
              <i class="fas fa-undo"></i> Reset
            </button>
          </div>
        </div>
        
        <!-- Advanced Filters (Toggle visibility) -->
        <div v-if="showAdvancedFilters" class="advanced-filters">
          <div class="filter-row">
            <div class="filter-group">
              <label for="grade-filter">Grade Level:</label>
              <select id="grade-filter" v-model="selectedGrade" @change="applyFilters">
                <option value="">All Grades</option>
                <option v-for="grade in gradeOptions" :key="grade" :value="grade">
                  Grade {{ grade }}
                </option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="section-filter">Section:</label>
              <select id="section-filter" v-model="selectedSection" @change="applyFilters">
                <option value="">All Sections</option>
                <option v-for="section in sectionOptions" :key="section" :value="section">
                  {{ section }}
                </option>
              </select>
            </div>
            
            <div class="filter-group">
              <label for="testcode-filter">Test Code:</label>
              <select id="testcode-filter" v-model="selectedTestCode" @change="applyFilters">
                <option value="">All Test Codes</option>
                <option v-for="code in testCodeOptions" :key="code" :value="code">
                  {{ code }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="filter-row">
            <div class="filter-group search-filter">
              <label for="search-filter">Search:</label>
              <div class="search-input-wrapper">
                <input 
                  id="search-filter" 
                  v-model="searchQuery" 
                  type="text" 
                  placeholder="Search by student name, exam title..."
                  @input="applyFilters"
                />
                <i class="fas fa-search"></i>
              </div>
            </div>
            
            <div class="filter-group">
              <label for="score-filter">Minimum Score:</label>
              <div class="range-filter">
                <input 
                  id="score-filter" 
                  v-model="minScore" 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  @input="applyFilters"
                />
                <span class="range-value">{{ minScore }}%</span>
              </div>
            </div>
            
            <div class="filter-group">
              <label for="date-filter">Date Range:</label>
              <select id="date-filter" v-model="dateRange" @change="applyFilters">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Active Filters Display -->
      <div v-if="hasActiveFilters" class="active-filters">
        <span class="active-filter-label">Active Filters:</span>
        <div class="filter-tags">
          <div v-if="selectedStudentId" class="filter-tag">
            Student: {{ getStudentName(selectedStudentId) }}
            <button @click="selectedStudentId = ''" class="remove-tag"><i class="fas fa-times"></i></button>
          </div>
          <div v-if="selectedExamId" class="filter-tag">
            Exam: {{ getExamTitle(selectedExamId) }}
            <button @click="selectedExamId = ''" class="remove-tag"><i class="fas fa-times"></i></button>
          </div>
          <div v-if="selectedGrade" class="filter-tag">
            Grade: {{ selectedGrade }}
            <button @click="selectedGrade = ''" class="remove-tag"><i class="fas fa-times"></i></button>
          </div>
          <div v-if="selectedSection" class="filter-tag">
            Section: {{ selectedSection }}
            <button @click="selectedSection = ''" class="remove-tag"><i class="fas fa-times"></i></button>
          </div>
          <div v-if="selectedTestCode" class="filter-tag">
            Test Code: {{ selectedTestCode }}
            <button @click="selectedTestCode = ''" class="remove-tag"><i class="fas fa-times"></i></button>
          </div>
          <div v-if="searchQuery" class="filter-tag">
            Search: "{{ searchQuery }}"
            <button @click="searchQuery = ''" class="remove-tag"><i class="fas fa-times"></i></button>
          </div>
          <div v-if="minScore > 0" class="filter-tag">
            Min Score: {{ minScore }}%
            <button @click="minScore = 0" class="remove-tag"><i class="fas fa-times"></i></button>
          </div>
          <div v-if="dateRange !== 'all'" class="filter-tag">
            Date: {{ getDateRangeLabel(dateRange) }}
            <button @click="dateRange = 'all'" class="remove-tag"><i class="fas fa-times"></i></button>
          </div>
        </div>
      </div>
      
      <div class="results-summary" v-if="filteredScores.length">
        <span class="result-count">{{ filteredScores.length }} results</span>
        <div class="summary-stats">
          <div class="stat">
            <span class="stat-value">{{ averageScore }}%</span>
            <span class="stat-label">Average Score</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ passingRate }}%</span>
            <span class="stat-label">Passing Rate</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading exam results...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button @click="loadScores" class="retry-button">Retry</button>
    </div>

    <div v-else-if="!filteredScores.length" class="empty-state">
      <i class="fas fa-chart-pie"></i>
      <p>No exam results found</p>
      <p class="empty-subtext" v-if="hasActiveFilters">
        Try adjusting your filters to see more results
      </p>
    </div>

    <div v-else class="scores-table-container">
      <table class="scores-table">
        <thead>
          <tr>
            <th @click="sortBy('student')" class="sortable">
              Student <i :class="getSortIcon('student')"></i>
            </th>
            <th @click="sortBy('grade')" class="sortable">
              Grade & Section <i :class="getSortIcon('grade')"></i>
            </th>
            <th @click="sortBy('exam')" class="sortable">
              Exam <i :class="getSortIcon('exam')"></i>
            </th>
            <th @click="sortBy('testCode')" class="sortable">
              Test Code <i :class="getSortIcon('testCode')"></i>
            </th>
            <th @click="sortBy('score')" class="sortable">
              Score <i :class="getSortIcon('score')"></i>
            </th>
            <th @click="sortBy('percentage')" class="sortable">
              Percentage <i :class="getSortIcon('percentage')"></i>
            </th>
            <th @click="sortBy('submittedAt')" class="sortable">
              Submitted <i :class="getSortIcon('submittedAt')"></i>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="score in sortedScores" :key="`${score.userId}-${score.examId}`">
            <td>
              <div class="student-info">
                <span class="student-name">{{ score.user.firstName }} {{ score.user.lastName }}</span>
              </div>
            </td>
            <td>
              <div class="grade-info">
                <span>Grade {{ score.user.gradeLevel || 'N/A' }}</span>
                <span v-if="score.user.section">- {{ score.user.section }}</span>
              </div>
            </td>
            <td>
              <div class="exam-info">
                <span class="exam-title">{{ score.exam.examTitle }}</span>
                <span class="exam-class">{{ score.exam.classCode }}</span>
              </div>
            </td>
            <td>{{ score.exam.testCode }}</td>
            <td>{{ score.score }} / {{ score.total }}</td>
            <td>
              <div class="percentage-badge" :class="getScoreClass(score.percentage)">
                {{ score.percentage }}%
              </div>
            </td>
            <td>{{ formatDate(score.submittedAt) }}</td>
            <td class="actions-cell">
              <button class="action-btn view-btn" @click="viewScoreDetails(score)" title="View Details">
                <i class="fas fa-eye"></i>
              </button>
              <button class="action-btn export-btn" @click="exportScoreReport(score)" title="Export Report">
                <i class="fas fa-file-export"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { fetchStudentScores, fetchStudents } from '@/services/authService';

export default {
  setup() {
    const allScores = ref([]);
    const filteredScores = ref([]);
    const students = ref([]);
    const loading = ref(true);
    const error = ref(null);
    
    // Basic filters
    const selectedStudentId = ref('');
    const selectedExamId = ref('');
    
    // Advanced filters
    const selectedGrade = ref('');
    const selectedSection = ref('');
    const selectedTestCode = ref('');
    const searchQuery = ref('');
    const minScore = ref(0);
    const dateRange = ref('all');
    const showAdvancedFilters = ref(false);
    
    // Sorting
    const sortField = ref('submittedAt');
    const sortDirection = ref('desc');

    // Extract unique exams from scores
    const uniqueExams = computed(() => {
      const exams = [];
      const examIds = new Set();
      
      allScores.value.forEach(score => {
        if (!examIds.has(score.exam.id)) {
          examIds.add(score.exam.id);
          exams.push({
            id: score.exam.id,
            examTitle: score.exam.examTitle,
            testCode: score.exam.testCode
          });
        }
      });
      
      return exams.sort((a, b) => a.examTitle.localeCompare(b.examTitle));
    });
    
    // Extract unique grade options
    const gradeOptions = computed(() => {
      const grades = new Set();
      
      allScores.value.forEach(score => {
        if (score.user.gradeLevel) {
          grades.add(score.user.gradeLevel);
        }
      });
      
      return Array.from(grades).sort();
    });
    
    // Extract unique section options
    const sectionOptions = computed(() => {
      const sections = new Set();
      
      allScores.value.forEach(score => {
        if (score.user.section) {
          sections.add(score.user.section);
        }
      });
      
      return Array.from(sections).sort();
    });
    
    // Extract unique test code options
    const testCodeOptions = computed(() => {
      const codes = new Set();
      
      allScores.value.forEach(score => {
        if (score.exam.testCode) {
          codes.add(score.exam.testCode);
        }
      });
      
      return Array.from(codes).sort();
    });
    
    // Check if any filters are active
    const hasActiveFilters = computed(() => {
      return selectedStudentId.value || 
             selectedExamId.value || 
             selectedGrade.value || 
             selectedSection.value || 
             selectedTestCode.value ||
             searchQuery.value || 
             minScore.value > 0 || 
             dateRange.value !== 'all';
    });
    
    // Calculate average score and passing rate
    const averageScore = computed(() => {
      if (!filteredScores.value.length) return 0;
      
      const sum = filteredScores.value.reduce((acc, score) => acc + score.percentage, 0);
      return Math.round(sum / filteredScores.value.length);
    });
    
    const passingRate = computed(() => {
      if (!filteredScores.value.length) return 0;
      
      const passing = filteredScores.value.filter(score => score.percentage >= 75).length;
      return Math.round((passing / filteredScores.value.length) * 100);
    });

    // Sort scores based on current sort field and direction
    const sortedScores = computed(() => {
      return [...filteredScores.value].sort((a, b) => {
        let valueA, valueB;
        
        // Extract the values to compare based on sortField
        switch (sortField.value) {
          case 'student':
            valueA = `${a.user.lastName} ${a.user.firstName}`.toLowerCase();
            valueB = `${b.user.lastName} ${b.user.firstName}`.toLowerCase();
            break;
          case 'grade':
            valueA = a.user.gradeLevel || 0;
            valueB = b.user.gradeLevel || 0;
            if (valueA === valueB) { // If same grade, sort by section
              valueA = (a.user.section || '').toLowerCase();
              valueB = (b.user.section || '').toLowerCase();
            }
            break;
          case 'exam':
            valueA = a.exam.examTitle.toLowerCase();
            valueB = b.exam.examTitle.toLowerCase();
            break;
          case 'testCode':
            valueA = a.exam.testCode.toLowerCase();
            valueB = b.exam.testCode.toLowerCase();
            break;
          case 'score':
            valueA = a.score;
            valueB = b.score;
            break;
          case 'percentage':
            valueA = a.percentage;
            valueB = b.percentage;
            break;
          case 'submittedAt':
            valueA = new Date(a.submittedAt).getTime();
            valueB = new Date(b.submittedAt).getTime();
            break;
          default:
            valueA = a[sortField.value];
            valueB = b[sortField.value];
        }
        
        // Perform the comparison
        if (sortDirection.value === 'asc') {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
          return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
      });
    });

    // Load scores from the API
    const loadScores = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        // First load all students for the dropdown
        if (students.value.length === 0) {
          students.value = await fetchStudents();
        }
        
        // Then load all scores
        allScores.value = await fetchStudentScores();
        
        // Apply initial filtering
        applyFilters();
        
        loading.value = false;
      } catch (err) {
        error.value = err.message;
        loading.value = false;
      }
    };
    
    // Apply all filters to the scores
    const applyFilters = () => {
      let results = [...allScores.value];
      
      // Apply student filter
      if (selectedStudentId.value) {
        results = results.filter(score => score.userId == selectedStudentId.value);
      }
      
      // Apply exam filter
      if (selectedExamId.value) {
        results = results.filter(score => score.examId == selectedExamId.value);
      }
      
      // Apply grade filter
      if (selectedGrade.value) {
        results = results.filter(score => score.user.gradeLevel == selectedGrade.value);
      }
      
      // Apply section filter
      if (selectedSection.value) {
        results = results.filter(score => score.user.section === selectedSection.value);
      }
      
      // Apply testCode filter
      if (selectedTestCode.value) {
        results = results.filter(score => score.exam.testCode === selectedTestCode.value);
      }
      
      // Apply search query
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        results = results.filter(score => 
          `${score.user.firstName} ${score.user.lastName}`.toLowerCase().includes(query) ||
          score.exam.examTitle.toLowerCase().includes(query) ||
          score.exam.testCode.toLowerCase().includes(query) ||
          score.exam.classCode.toLowerCase().includes(query)
        );
      }
      
      // Apply minimum score filter
      if (minScore.value > 0) {
        results = results.filter(score => score.percentage >= minScore.value);
      }
      
      // Apply date range filter
      if (dateRange.value !== 'all') {
        const now = new Date();
        let startDate;
        
        switch (dateRange.value) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay());
            startDate.setHours(0, 0, 0, 0);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        }
        
        results = results.filter(score => new Date(score.submittedAt) >= startDate);
      }
      
      filteredScores.value = results;
    };
    
    // Reset all filters
    const resetFilters = () => {
      selectedStudentId.value = '';
      selectedExamId.value = '';
      selectedGrade.value = '';
      selectedSection.value = '';
      selectedTestCode.value = '';
      searchQuery.value = '';
      minScore.value = 0;
      dateRange.value = 'all';
      applyFilters();
    };
    
    // Sort by field
    const sortBy = (field) => {
      if (sortField.value === field) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortField.value = field;
        sortDirection.value = 'asc';
      }
    };
    
    // Get sort icon for headers
    const getSortIcon = (field) => {
      if (sortField.value !== field) return 'fas fa-sort';
      return sortDirection.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    };
    
    // Get score class based on percentage
    const getScoreClass = (percentage) => {
      if (percentage >= 90) return 'excellent';
      if (percentage >= 75) return 'good';
      if (percentage >= 60) return 'average';
      return 'needs-improvement';
    };
    
    // Format date in a readable format
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    };
    
    // Helper to get student name by ID
    const getStudentName = (id) => {
      const student = students.value.find(s => s.id == id);
      return student ? `${student.firstName} ${student.lastName}` : '';
    };
    
    // Helper to get exam title by ID
    const getExamTitle = (id) => {
      const exam = uniqueExams.value.find(e => e.id == id);
      return exam ? exam.examTitle : '';
    };
    
    // Get date range label
    const getDateRangeLabel = (range) => {
      switch (range) {
        case 'today': return 'Today';
        case 'week': return 'This Week';
        case 'month': return 'This Month';
        default: return 'All Time';
      }
    };
    
    // View score details
    const viewScoreDetails = (score) => {
      // Implement details view functionality
      console.log('View details for score:', score);
      // This could open a modal with detailed information
    };
    
    // Export score report
    const exportScoreReport = (score) => {
      // Implement export functionality
      console.log('Export report for score:', score);
      // This could generate a PDF or Excel export
    };
    
    // Watch for filter changes to reapply filters
    watch([selectedStudentId, selectedExamId, selectedGrade, selectedSection, 
           selectedTestCode, searchQuery, minScore, dateRange], 
           () => {
      applyFilters();
    });

    onMounted(() => {
      loadScores();
    });

    return {
      students,
      loading,
      error,
      selectedStudentId,
      selectedExamId,
      selectedGrade,
      selectedSection,
      selectedTestCode,
      searchQuery,
      minScore,
      dateRange,
      showAdvancedFilters,
      sortField,
      sortDirection,
      uniqueExams,
      gradeOptions,
      sectionOptions,
      testCodeOptions,
      filteredScores,
      sortedScores,
      hasActiveFilters,
      averageScore,
      passingRate,
      loadScores,
      applyFilters,
      resetFilters,
      sortBy,
      getSortIcon,
      getScoreClass,
      formatDate,
      getStudentName,
      getExamTitle,
      getDateRangeLabel,
      viewScoreDetails,
      exportScoreReport
    };
  }
};
</script>

<style scoped>
.scores-container {
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  margin-bottom: 20px;
}

.scores-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.scores-header h2 {
  margin: 0 0 15px 0;
  font-size: 1.5rem;
  color: #333;
}

/* Filters */
.filter-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  color: #4CAF50;
  font-weight: 500;
  margin-bottom: 15px;
  user-select: none;
}

.filter-toggle i {
  margin-left: 5px;
  font-size: 0.8rem;
  transition: transform 0.3s;
}

.filters {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s ease;
}

.filters.expanded {
  margin-bottom: 15px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
}

.filter-row:last-child {
  margin-bottom: 0;
}

.filter-group {
  flex: 1;
  min-width: 180px;
}

.filter-group label {
  display: block;
  margin-bottom: 5px;
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
}

.filter-group select,
.filter-group input[type="text"] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: white;
  font-size: 0.9rem;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  padding-bottom: 5px;
}

.reset-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 15px;
  border: none;
  border-radius: 6px;
  background-color: #f5f5f5;
  color: #555;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.reset-filter-btn:hover {
  background-color: #e0e0e0;
}

.search-input-wrapper {
  position: relative;
}

.search-input-wrapper input {
  padding-left: 35px;
}

.search-input-wrapper i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.range-filter {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-filter input {
  flex: 1;
}

.range-value {
  min-width: 40px;
  text-align: right;
  font-weight: 500;
  color: #444;
}

/* Active Filters */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #e0e0e0;
}

.active-filter-label {
  margin-right: 10px;
  font-size: 0.9rem;
  color: #666;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  background-color: #e3f2fd;
  color: #1976d2;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 0.85rem;
}

.remove-tag {
  background: none;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  margin-left: 5px;
  color: #1976d2;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.remove-tag:hover {
  opacity: 1;
}

/* Results Summary */
.results-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.result-count {
  font-size: 0.9rem;
  color: #666;
}

.summary-stats {
  display: flex;
  gap: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 0.8rem;
  color: #666;
}

/* Table styles */
.scores-table-container {
  overflow-x: auto;
}

.scores-table {
  width: 100%;
  border-collapse: collapse;
}

.scores-table th {
  background-color: #f5f5f5;
  color: #333;
  font-weight: 600;
  text-align: left;
  padding: 12px 15px;
  border-bottom: 2px solid #ddd;
}

.scores-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.scores-table th.sortable:hover {
  background-color: #eeeeee;
}

.scores-table th i {
  margin-left: 5px;
  font-size: 0.9rem;
}

.scores-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  color: #444;
}

.scores-table tbody tr:hover {
  background-color: #f9f9f9;
}

.student-info,
.exam-info,
.grade-info {
  display: flex;
  flex-direction: column;
}

.student-name,
.exam-title {
  font-weight: 500;
  color: #333;
}

.student-details,
.exam-class,
.exam-code {
  font-size: 0.85rem;
  color: #666;
  margin-top: 3px;
}

/* Score percentage badge */
.percentage-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 500;
  font-size: 0.9rem;
  text-align: center;
}

.excellent {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.good {
  background-color: #f1f8e9;
  color: #558b2f;
}

.average {
  background-color: #fff8e1;
  color: #ff8f00;
}

.needs-improvement {
  background-color: #ffebee;
  color: #c62828;
}

/* Action buttons */
.actions-cell {
  white-space: nowrap;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px 8px;
  margin: 0 3px;
  border-radius: 4px;
  transition: all 0.2s;
}

.view-btn {
  color: #2196F3;
}

.view-btn:hover {
  background-color: rgba(33, 150, 243, 0.1);
}

.export-btn {
  color: #4CAF50;
}

.export-btn:hover {
  background-color: rgba(76, 175, 80, 0.1);
}

/* Loading, Error, and Empty states */
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

.loading-state i,
.error-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: 15px;
}

.loading-state i {
  color: #2196F3;
}

.error-state i {
  color: #F44336;
}

.empty-state i {
  color: #9E9E9E;
}

.loading-state p,
.error-state p,
.empty-state p {
  font-size: 1.1rem;
  color: #666;
  margin: 0 0 5px 0;
}

.empty-subtext {
  font-size: 0.9rem;
  color: #888;
}

.retry-button {
  background-color: #F44336;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 15px;
  margin-top: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background-color: #E53935;
}

/* Responsive styles */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .filter-actions {
    width: 100%;
    justify-content: center;
    margin-top: 10px;
  }
  
  .reset-filter-btn {
    width: 100%;
    justify-content: center;
  }
  
  .results-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .summary-stats {
    width: 100%;
    justify-content: space-around;
  }
  
  .scores-table th,
  .scores-table td {
    padding: 10px 8px;
    font-size: 0.85rem;
  }
}
</style> 