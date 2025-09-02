<template>
  <div class="exam-results">
    <div class="results-header">
      <div class="header-content">
        <h1>{{ $route.query.title }}</h1>
        <p class="test-code">Test Code: {{ $route.query.testCode }}</p>
      </div>
      <div class="header-actions">
        <button @click="$router.back()" class="back-btn">
          <i class="fas fa-arrow-left"></i> Back
        </button>
        
        <button @click="openBulkArchiveModal" class="bulk-archive-btn">
          <span class="material-icons">archive</span>
          Archive All Results
        </button>
        
        <button @click="viewPartResults" class="part-results-btn">
          <span class="material-icons">assessment</span>
          Part Results
        </button>
        
        <!-- Update export button with FontAwesome icons -->
        <div class="export-container">
          <button @click="toggleExportOptions" class="export-btn">
            <i class="fas fa-download"></i> Export
            <i class="fas fa-chevron-down dropdown-icon" :class="{ 'rotated': showExportOptions }"></i>
          </button>
          
          <!-- Fix export dropdown positioning -->
          <div v-if="showExportOptions" class="export-dropdown">
            <div class="export-options-header">
              <h3>Export Options</h3>
            </div>
            
            <div class="export-data-selection">
              <h4>Select data to export:</h4>
              <div class="export-checkboxes">
                <label>
                  <input type="checkbox" v-model="exportOptions.fields.studentName" checked>
                  Student Name
                </label>
                <label>
                  <input type="checkbox" v-model="exportOptions.fields.gradeSection">
                  Grade & Section
                </label>
                <label>
                  <input type="checkbox" v-model="exportOptions.fields.score">
                  Score
                </label>
                <label>
                  <input type="checkbox" v-model="exportOptions.fields.percentage">
                  Percentage
                </label>
                <label>
                  <input type="checkbox" v-model="exportOptions.fields.submittedAt">
                  Submission Date
                </label>
              </div>

              <div class="export-section-selector">
                <h4>Export Section:</h4>
                <div class="export-radio-options">
                  <label>
                    <input type="radio" v-model="exportOptions.section" value="results">
                    Student Results
                  </label>
                  <label>
                    <input type="radio" v-model="exportOptions.section" value="analysis">
                    Item Analysis
                  </label>
                </div>
              </div>
            </div>
            
            <div class="export-actions">
              <button @click="exportToExcel" class="export-action-btn excel">
                <i class="fas fa-file-excel"></i>
                Excel
              </button>
              <button @click="exportToPDF" class="export-action-btn pdf">
                <i class="fas fa-file-pdf"></i>
                PDF
              </button>
              <button @click="printData" class="export-action-btn print">
                <i class="fas fa-print"></i>
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
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
        <h3>Total Students</h3>
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
            
            <div class="detail-item">
              <span class="label">Submitted:</span>
              <span class="attempt-badge" v-if="getCurrentAttemptNumber(result)">
                Attempt #{{ getCurrentAttemptNumber(result) }}
              </span>
            </div>
          </div>
          <div class="result-actions">
            <button 
              class="view-answers-btn"
              @click="viewStudentAnswers(result)"
            >
              <span class="material-icons">assignment</span>
              View Answers
            </button>
            <button 
              class="archive-result-btn"
              @click="openArchiveModal(result)"
              title="Archive this result"
            >
              <span class="material-icons">archive</span>
              Archive Result
            </button>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="table-wrapper" ref="resultsTableWrapper">
        <table>
          <thead>
            <tr>
              <th class="mobile-hide">Grade & Section</th>
              <th>Student</th>
              <th>Score</th>
              <th class="mobile-hide">Percentage</th>
              <th>History</th>
              <th class="mobile-hide">Submitted At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="result in paginatedResults" :key="result.id">
              <td class="mobile-hide">Grade {{ result.user.gradeLevel }}-{{ result.user.section }}</td>
              <td>{{ result.user.firstName }} {{ result.user.lastName }}</td>
              <td>{{ result.score }}/{{ result.total }}</td>
              <td class="mobile-hide">
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
              <td>
                <!-- Improved attempt dropdown for table view -->
                <div class="attempt-controls-table">
                  <!-- Only keep the restore history button -->
                  <button 
                    v-if="result.exam && result.exam.attempts && result.exam.attempts.some(a => a.records && a.records.length)"
                    @click.stop="showAttemptRecordsModal(result.userId)"
                    class="restore-record-btn"
                    title="View and restore attempt history"
                  >
                    <span class="material-icons">history</span>
                    <span class="restore-text">History</span>
                  </button>
                  <span v-else>-</span>
                </div>
                <div class="attempt-date" v-if="result.submittedAt">
                  {{ formatShortDate(result.submittedAt) }}
                </div>
                              </td>
                <td class="mobile-hide">{{ formatDate(result.submittedAt) }}</td>
                <td>
                  <div class="action-buttons">
                    <button 
                      class="view-answers-btn"
                      @click="viewStudentAnswers(result)"
                    >
                      <span class="material-icons">assignment</span>
                      <span class="btn-text">View</span>
                    </button>
                    <button 
                      class="archive-result-btn"
                      @click="openArchiveModal(result)"
                      title="Archive this result"
                    >
                      <span class="material-icons">archive</span>
                      <span class="btn-text">Archive</span>
                    </button>
                  </div>
                </td>
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

    <!-- Add attempt records modal -->
    <div v-if="showAttemptModal" class="attempt-records-modal" @click.self="closeAttemptRecordsModal">
      <div class="attempt-records-modal-content">
        <h2 class="attempt-modal-title">
          <span>Attempt History</span>
          <button class="close-modal-btn" @click="closeAttemptRecordsModal">
            <span class="material-icons">close</span>
          </button>
        </h2>
        
        <div class="attempt-modal-body">
          <div v-if="!attemptRecordsModalData.records || attemptRecordsModalData.records.length === 0" class="no-records">
            No attempt records found.
          </div>
          <div v-else class="records-list">
            <div v-for="record in attemptRecordsModalData.records" :key="record.id" class="record-item">
              <div class="record-info">
                <div class="record-header">
                  <span class="record-number">Attempt #{{ record.attemptNumber }}</span>
                  <span class="record-score">{{ record.score }}/{{ record.total }} ({{ record.percentage }}%)</span>
                </div>
                
                <div class="record-details">
                  <div class="record-detail">
                    <span class="material-icons">event</span>
                    <span>{{ formatDate(record.completedAt) }}</span>
                  </div>
                  
                  <div class="record-detail">
                    <span class="material-icons">timelapse</span>
                    <span>{{ formatTimeSpent(record.timeSpent) }}</span>
                  </div>
                </div>
              </div>
              
              <div class="record-actions">
                <button 
                  @click="restoreRecord(record.id)" 
                  class="restore-record-action"
                  :disabled="isRestoringRecord === record.id"
                >
                  <span v-if="isRestoringRecord === record.id" class="material-icons spinning">sync</span>
                  <span v-else class="material-icons">restore</span>
                  Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Archive Result Modal -->
    <div v-if="showArchiveModal" class="archive-modal" @click.self="closeArchiveModal">
      <div class="archive-modal-content">
        <h2 class="archive-modal-title">
          <span>Archive Exam Result</span>
          <button class="close-modal-btn" @click="closeArchiveModal">
            <span class="material-icons">close</span>
          </button>
        </h2>
        
        <div class="archive-modal-body">
          <div class="archive-student-info">
            <p><strong>Student:</strong> {{ archiveModalData.studentName }}</p>
            <p><strong>Exam:</strong> {{ $route.query.title }}</p>
          </div>
          
          <div class="archive-reason-input">
            <label for="archiveReason"><strong>Reason for archiving:</strong></label>
            <textarea 
              id="archiveReason"
              v-model="archiveModalData.reason"
              placeholder="Enter the reason for archiving this exam result..."
              rows="4"
              maxlength="500"
            ></textarea>
            <small class="char-count">{{ archiveModalData.reason.length }}/500 characters</small>
          </div>
          
          <div class="archive-actions">
            <button 
              class="cancel-btn"
              @click="closeArchiveModal"
            >
              Cancel
            </button>
            <button 
              class="archive-confirm-btn"
              @click="archiveResult"
              :disabled="isArchivingResult || !archiveModalData.reason.trim()"
            >
              <span v-if="isArchivingResult" class="material-icons spinning">sync</span>
              <span class="material-icons">archive</span>
              {{ isArchivingResult ? 'Archiving...' : 'Archive Result' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bulk Archive Modal -->
    <div v-if="showBulkArchiveModal" class="archive-modal" @click.self="closeBulkArchiveModal">
      <div class="archive-modal-content">
        <h2 class="archive-modal-title">
          <span>Archive All Exam Results</span>
          <button class="close-modal-btn" @click="closeBulkArchiveModal">
            <span class="material-icons">close</span>
          </button>
        </h2>
        
        <div class="archive-modal-body">
          <div class="archive-student-info">
            <p><strong>Exam:</strong> {{ $route.query.title }}</p>
            <p><strong>Total Results:</strong> {{ filteredResults.length }} student(s)</p>
            <p><strong>Warning:</strong> This action will archive ALL exam results for this exam. This cannot be undone.</p>
          </div>
          
          <div class="archive-reason-input">
            <label for="bulkArchiveReason"><strong>Reason for bulk archiving:</strong></label>
            <textarea 
              id="bulkArchiveReason"
              v-model="bulkArchiveModalData.reason"
              placeholder="Enter the reason for archiving all exam results..."
              rows="4"
              maxlength="500"
            ></textarea>
            <small class="char-count">{{ bulkArchiveModalData.reason.length }}/500 characters</small>
          </div>
          
          <div class="archive-actions">
            <button 
              class="cancel-btn"
              @click="closeBulkArchiveModal"
            >
              Cancel
            </button>
            <button 
              class="archive-confirm-btn"
              @click="bulkArchiveResults"
              :disabled="isBulkArchiving || !bulkArchiveModalData.reason.trim()"
            >
              <span v-if="isBulkArchiving" class="material-icons spinning">sync</span>
              <span class="material-icons">archive</span>
              {{ isBulkArchiving ? 'Archiving...' : 'Archive All Results' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  fetchStudentScores, 
  fetchExamAnalysis, 
  restoreAttemptScore,
  archiveExamResult,
  archiveAllExamResults
} from '../../services/authService';
/* eslint-disable no-unused-vars */
// Import libraries for export functionality
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default {
  name: 'ExamResults',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
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

    // Add export-related states
    const showExportOptions = ref(false);
    const exportOptions = ref({
      section: 'results', // 'results' or 'analysis'
      fields: {
        studentName: true,
        gradeSection: false,
        score: true,
        percentage: true,
        submittedAt: false,
        // Analysis fields
        questionNumber: true,
        questionText: true,
        correctAnswer: true,
        correctCount: true,
        incorrectCount: false,
        difficulty: true,
        successRate: true
      }
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

    // Add state for tracking attempts
    const processedResults = ref([]);
    const allAttempts = ref({}); // userId -> array of attempts

    // Add attempt records modal state
    const showAttemptModal = ref(false);
    const attemptRecordsModalData = ref({
      studentId: null,
      student: null,
      records: []
    });
    const isRestoringRecord = ref(null);

    // Add archive modal state
    const showArchiveModal = ref(false);
    const archiveModalData = ref({
      resultId: null,
      studentId: null,
      examId: null,
      studentName: '',
      reason: ''
    });
    const isArchivingResult = ref(false);

    // Add bulk archive modal state
    const showBulkArchiveModal = ref(false);
    const bulkArchiveModalData = ref({
      examId: null,
      reason: ''
    });
    const isBulkArchiving = ref(false);

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
        
        // Log the structure to help with debugging
        console.log('API response structure:', {
          hasScores: !!scores,
          scoresLength: scores?.length,
          sampleScore: scores && scores.length > 0 ? {
            hasAttemptRecords: !!scores[0].attemptRecords,
            hasRecords: !!scores[0].records,
            records: scores[0].records || scores[0].attemptRecords
          } : null
        });
        
        // Validate that attempts are properly filtered by student
        if (scores && scores.length > 0) {
          console.log('Validating attempt data structure...');
          let hasMixedAttempts = false;
          
          scores.forEach((score, index) => {
            if (score.exam && score.exam.attempts) {
              console.log(`Score ${index}: Student ${score.user.id} has ${score.exam.attempts.length} attempts`);
              
              // Check if this student has attempts from other students
              const otherStudentAttempts = score.exam.attempts.filter(attempt => attempt.userId !== score.user.id);
              if (otherStudentAttempts.length > 0) {
                hasMixedAttempts = true;
                console.warn(`WARNING: Student ${score.user.id} has ${otherStudentAttempts.length} attempts from other students!`);
                otherStudentAttempts.forEach(attempt => {
                  console.warn(`  Foreign attempt: ${attempt.attemptNumber} belongs to user ${attempt.userId}`);
                });
              }
              
              score.exam.attempts.forEach(attempt => {
                console.log(`  Attempt ${attempt.attemptNumber}: userId=${attempt.userId}, hasRecords=${!!attempt.records}`);
              });
            }
          });
          
          if (hasMixedAttempts) {
            console.error('CRITICAL: Backend is returning mixed attempts! This needs to be fixed.');
          }
        }
        
        // Clean up the data to ensure attempts are properly filtered by student
        if (scores && scores.length > 0) {
          scores.forEach(score => {
            if (score.exam && score.exam.attempts) {
              // Filter attempts to only include those belonging to the current student
              score.exam.attempts = score.exam.attempts.filter(attempt => attempt.userId === score.user.id);
              console.log(`Cleaned up: Student ${score.user.id} now has ${score.exam.attempts.length} attempts`);
            }
          });
        }
        
        results.value = scores;
        
        // Process attempts by student
        processAttempts();
        
        // Process results to get only latest attempt per student
        processLatestAttempts();
        
        // Update item analysis with proper student counts using latest attempts
        updateItemAnalysis(analysis);
        
        itemAnalysis.value = analysis;
      } catch (err) {
        error.value = err.message;
        console.error('Error loading results:', err);
      } finally {
        loading.value = false;
      }
    };
    
    // Process all attempts and organize by student
    const processAttempts = () => {
      const attemptsByStudent = {};
      
      results.value.forEach(result => {
        const studentId = result.user.id;
        
        // Initialize the array if it doesn't exist yet
        if (!attemptsByStudent[studentId]) {
          attemptsByStudent[studentId] = [];
        }
        
        // Add attempt info from either the attempt object or attempts array
        if (result.attempt) {
          // Make sure we don't add duplicates
          if (!attemptsByStudent[studentId].some(a => a.id === result.attempt.id)) {
            attemptsByStudent[studentId].push({
              ...result.attempt,
              resultId: result.id,
              score: result.score,
              total: result.total,
              percentage: result.percentage
            });
          }
        } else if (result.attempts && Array.isArray(result.attempts) && result.attempts.length > 0) {
          result.attempts.forEach(attempt => {
            // Make sure we don't add duplicates
            if (!attemptsByStudent[studentId].some(a => a.id === attempt.id)) {
              attemptsByStudent[studentId].push({
                ...attempt,
                resultId: result.id,
                score: result.score,
                total: result.total,
                percentage: result.percentage
              });
            }
          });
        }
        
        // NEW STRUCTURE: Process nested attempt records from exam.attempts
        // IMPORTANT: Only process attempts that belong to the current student
        if (result.exam && result.exam.attempts && Array.isArray(result.exam.attempts)) {
          console.log(`Processing attempts for student ${studentId}:`, result.exam.attempts.length, 'total attempts');
          
          result.exam.attempts.forEach(attempt => {
            console.log(`Attempt ${attempt.attemptNumber} belongs to user ${attempt.userId}, current student: ${studentId}`);
            
            // Only process attempts that belong to the current student
            if (attempt.userId === studentId) {
              console.log(`Processing attempt ${attempt.attemptNumber} for student ${studentId}`);
              
              // Process records within each attempt
              if (attempt.records && Array.isArray(attempt.records)) {
                attempt.records.forEach(record => {
                  // Only add records that aren't duplicates
                  if (!attemptsByStudent[studentId].some(a => a.id === record.id)) {
                    attemptsByStudent[studentId].push({
                      id: record.id,
                      attemptId: attempt.id, // Link to parent attempt
                      attemptNumber: attempt.attemptNumber,
                      startedAt: record.startedAt || attempt.startedAt,
                      completedAt: record.completedAt || attempt.completedAt,
                      timeSpent: record.timeSpent || attempt.timeSpent,
                      resultId: result.id,
                      score: record.score || 0,
                      total: record.total || result.total,
                      percentage: record.percentage || 0,
                      isHistoricalRecord: true
                    });
                  }
                });
              }
            } else {
              console.log(`Skipping attempt ${attempt.attemptNumber} - belongs to different user (${attempt.userId})`);
            }
          });
        }
      });
      
      // Sort attempts by attemptNumber in descending order for each student
      Object.keys(attemptsByStudent).forEach(studentId => {
        attemptsByStudent[studentId].sort((a, b) => b.attemptNumber - a.attemptNumber);
      });
      
      // Log the processed attempt data for debugging
      console.log('Processed attempts by student:', attemptsByStudent);
      
      allAttempts.value = attemptsByStudent;
    };
    
    // Add new function to process latest attempts
    const processLatestAttempts = () => {
      const latestByStudent = new Map();
      
      results.value.forEach(result => {
        const studentId = result.user.id;
        const existingResult = latestByStudent.get(studentId);
        
        // If no existing result or current result is newer
        if (!existingResult || new Date(result.submittedAt) > new Date(existingResult.submittedAt)) {
          latestByStudent.set(studentId, result);
        }
      });
      
      // Store the processed results
      processedResults.value = Array.from(latestByStudent.values());
    };
    
    // Add method to get attempts for a specific student
    const getStudentAttempts = (studentId) => {
      return allAttempts.value[studentId] || [];
    };
    
    // Add method to get current attempt number for a result
    const getCurrentAttemptNumber = (result) => {
      if (result.attempt) {
        return result.attempt.attemptNumber;
      } else if (result.attempts && result.attempts.length > 0) {
        // Just return the first attempt number (latest attempt)
        return result.attempts[0].attemptNumber;
      }
      return null;
    };
    
    // Removed attempt selection dropdown and handleAttemptChange function
    
    // Add new function to update item analysis
    const updateItemAnalysis = (analysis) => {
      if (!analysis || !analysis.length || !processedResults.value.length) return;
      
      // Log the analysis data received from API
      console.log('Raw Analysis Data before processing:', JSON.stringify(analysis));
      
      // Get unique student count - this is the actual number of students who took the exam
      const uniqueStudentCount = processedResults.value.length;
      console.log('Unique student count:', uniqueStudentCount);
      
      // Create a map of the latest attempt answer data for each student
      const latestAnswersMap = new Map();
      
      // Check if we actually have answer data to update the analysis with
      let hasAnswerData = false;
      
      processedResults.value.forEach(result => {
        if (result.answers && Array.isArray(result.answers)) {
          latestAnswersMap.set(result.user.id, result.answers);
          hasAnswerData = true;
        }
      });
      
      console.log('Has student answer data to process?', hasAnswerData);
      
      // If we don't have any answer data, preserve the analysis data as-is
      if (!hasAnswerData) {
        console.log('No student answer data available, using API analysis data as-is');
        return;
      }
      
      // Only update the analysis if we have answer data from students
      analysis.forEach(item => {
        let correctCount = 0;
        
        // Count correct answers from latest attempts only
        latestAnswersMap.forEach(answers => {
          const answer = answers.find(a => a.questionId === item.questionId);
          if (answer && answer.isCorrect) {
            correctCount++;
          }
        });
        
        if (hasAnswerData) {
          // ONLY update if we have answer data
          // Update the analysis item with accurate counts
          item.totalStudents = uniqueStudentCount;
          item.correctCount = correctCount;
          item.incorrectCount = uniqueStudentCount - correctCount;
          item.percentageCorrect = Math.round((correctCount / uniqueStudentCount) * 100);
        }
      });
      
      console.log('Analysis data after processing:', JSON.stringify(analysis));
    };

    const getAverageScore = (results) => {
      if (!results.length) return '0/0';
      // Since we're already filtering to latest attempts by student in filteredResults,
      // this calculation is now correct for unique students
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
      // First, get all matching results based on filters and search
      const matchingResults = processedResults.value.filter(result => {
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
      
      return matchingResults;
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

    const formatTimeSpent = (timeInSeconds) => {
      if (!timeInSeconds) return '--';
      
      const hours = Math.floor(timeInSeconds / 3600);
      const minutes = Math.floor((timeInSeconds % 3600) / 60);
      const seconds = timeInSeconds % 60;
      
      let formattedTime = '';
      
      if (hours > 0) {
        formattedTime += `${hours}h `;
      }
      
      if (minutes > 0 || hours > 0) {
        formattedTime += `${minutes}m `;
      }
      
      formattedTime += `${seconds}s`;
      
      return formattedTime;
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

    const viewStudentAnswers = (result) => {
      router.push({
        name: 'StudentAnswerDetails',
        params: {
          examId: route.params.examId,
          studentId: result.user.id
        }
      });
    };

    const viewPartResults = () => {
      router.push({
        name: 'ExamPartResults',
        params: {
          examId: route.params.examId
        },
        query: {
          testCode: route.query.testCode,
          title: route.query.title
        }
      });
    };

    // Toggle export options dropdown
    const toggleExportOptions = () => {
      showExportOptions.value = !showExportOptions.value;
    };

    // Close export dropdown when clicking outside
    const closeExportOptionsOnClickOutside = (event) => {
      if (showExportOptions.value && !event.target.closest('.export-btn') && !event.target.closest('.export-dropdown')) {
        showExportOptions.value = false;
      }
    };

    // Prepare data for export based on selected options
    const getExportData = () => {
      let dataToExport = [];
      let headers = [];
      
      if (exportOptions.value.section === 'results') {
        const fields = exportOptions.value.fields;
        
        // Build headers array for results
        if (fields.studentName) headers.push('Student Name');
        if (fields.gradeSection) headers.push('Grade & Section');
        if (fields.score) headers.push('Score');
        if (fields.percentage) headers.push('Percentage');
        if (fields.submittedAt) headers.push('Submitted At');
        
        // Build rows for results
        dataToExport = filteredResults.value.map(result => {
          const row = {};
          if (fields.studentName) row['Student Name'] = `${result.user.firstName} ${result.user.lastName}`;
          if (fields.gradeSection) row['Grade & Section'] = `Grade ${result.user.gradeLevel}-${result.user.section}`;
          if (fields.score) row['Score'] = `${result.score}/${result.total}`;
          if (fields.percentage) row['Percentage'] = `${result.percentage}%`;
          if (fields.submittedAt) row['Submitted At'] = formatDate(result.submittedAt);
          return row;
        });
      } else {
        // Analysis data
        const fields = exportOptions.value.fields;
        
        // Build headers array for analysis
        if (fields.questionNumber) headers.push('Question #');
        if (fields.questionText) headers.push('Question');
        if (fields.correctAnswer) headers.push('Correct Answer');
        if (fields.correctCount) headers.push('Correct Responses');
        if (fields.incorrectCount) headers.push('Incorrect Responses');
        if (fields.difficulty) headers.push('Difficulty');
        if (fields.successRate) headers.push('Success Rate');
        
        // Build rows for analysis
        dataToExport = filteredAnalysis.value.map(item => {
          const row = {};
          if (fields.questionNumber) row['Question #'] = item.questionNumber;
          if (fields.questionText) row['Question'] = item.questionText;
          if (fields.correctAnswer) row['Correct Answer'] = item.correctAnswer;
          if (fields.correctCount) row['Correct Responses'] = `${item.correctCount}/${item.totalStudents}`;
          if (fields.incorrectCount) row['Incorrect Responses'] = `${item.incorrectCount}/${item.totalStudents}`;
          if (fields.difficulty) row['Difficulty'] = getDifficultyLabel(item.percentageCorrect);
          if (fields.successRate) row['Success Rate'] = `${item.percentageCorrect}%`;
          return row;
        });
      }
      
      return { headers, data: dataToExport };
    };

    // Export to Excel
    const exportToExcel = () => {
      try {
        const { headers, data } = getExportData();
        
        if (data.length === 0) {
          alert('No data to export');
          return;
        }
        
        // Create worksheet with custom headers
        const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
        
        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, exportOptions.value.section === 'results' ? 'Student Results' : 'Item Analysis');
        
        // Generate Excel file
        const fileName = `Exam_${exportOptions.value.section === 'results' ? 'Results' : 'Analysis'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        // Hide export options after export
        showExportOptions.value = false;
      } catch (error) {
        console.error('Export to Excel error:', error);
        alert('Failed to export data to Excel');
      }
    };

    // Export to PDF
    const exportToPDF = () => {
      try {
        const { headers, data } = getExportData();
        
        if (data.length === 0) {
          alert('No data to export');
          return;
        }
        
        // Create PDF document
        const doc = new jsPDF();
        
        // Add title
        const title = exportOptions.value.section === 'results' ? 'Exam Results' : 'Item Analysis';
        const examTitle = route.query.title || 'Exam';
        
        doc.setFontSize(16);
        doc.text(examTitle, 14, 15);
        
        doc.setFontSize(12);
        doc.text(title, 14, 25);
        
        // Add date
        const currentDate = new Date().toLocaleDateString();
        doc.setFontSize(10);
        doc.text(`Generated: ${currentDate}`, 14, 35);
        
        // Extract values for autoTable
        const tableData = data.map(item => Object.values(item));
        
        // Create table with autoTable
        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: 40,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
            lineColor: [200, 200, 200]
          },
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [240, 240, 240]
          }
        });
        
        // Generate PDF filename
        const fileName = `Exam_${exportOptions.value.section === 'results' ? 'Results' : 'Analysis'}_${new Date().toISOString().slice(0, 10)}.pdf`;
        
        // Save PDF
        doc.save(fileName);
        
        // Hide export options after export
        showExportOptions.value = false;
      } catch (error) {
        console.error('Export to PDF error:', error);
        alert('Failed to export data to PDF');
      }
    };

    // Print data
    const printData = () => {
      try {
        const { headers, data } = getExportData();
        
        if (data.length === 0) {
          alert('No data to print');
          return;
        }
        
        // Create a separate print-only div
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'fixed';
        printFrame.style.right = '0';
        printFrame.style.bottom = '0';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = '0';
        
        document.body.appendChild(printFrame);
        
        const title = exportOptions.value.section === 'results' ? 'Exam Results' : 'Item Analysis';
        const examTitle = route.query.title || 'Exam';
        
        printFrame.contentDocument.write(`
          <html>
            <head>
              <title>${examTitle} - ${title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #2980b9; font-size: 20px; margin-bottom: 5px; }
                h2 { color: #333; font-size: 16px; margin-top: 0; }
                .print-date { color: #555; font-size: 12px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th { background-color: #2980b9; color: white; font-weight: bold; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
                tr:nth-child(even) { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              <h1>${examTitle}</h1>
              <h2>${title}</h2>
              <div class="print-date">Generated: ${new Date().toLocaleDateString()}</div>
              <table>
                <thead>
                  <tr>
                    ${headers.map(header => `<th>${header}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${data.map(row => `
                    <tr>
                      ${Object.values(row).map(cell => `<td>${cell}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </body>
          </html>
        `);
        
        printFrame.contentDocument.close();
        
        // Wait for content to load
        setTimeout(() => {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
          // Remove the frame after printing
          setTimeout(() => {
            document.body.removeChild(printFrame);
          }, 500);
        }, 300);
        
        // Hide export options after print dialog is shown
        showExportOptions.value = false;
      } catch (error) {
        console.error('Print error:', error);
        alert('Failed to prepare data for printing');
      }
    };

    onMounted(() => {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      document.addEventListener('click', closeExportOptionsOnClickOutside);
      loadResults();
    });

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('click', closeExportOptionsOnClickOutside);
    });

    // Method to get selected attempt date for a student
    const getSelectedAttemptDate = (userId) => {
      // Get the first attempt for this student instead of using selectedAttempts
      const studentAttempts = allAttempts.value[userId] || [];
      if (studentAttempts.length > 0) {
        return studentAttempts[0].startedAt;
      }
      return null;
    };

    // Format date in a shorter way
    const formatShortDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString(undefined, { 
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Add function to check if student has attempt records
    const studentHasAttemptRecords = (userId) => {
      const student = results.value.find(r => r.user.id === userId);
      if (!student) return false;
      
      // Check for exam.attempts.records structure
      if (student.exam && student.exam.attempts) {
        // Check if any attempt has records for this specific student
        for (const attempt of student.exam.attempts) {
          if (attempt.userId === userId && attempt.records && attempt.records.length > 0) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    // Function to show attempt records modal
    const showAttemptRecordsModal = (userId) => {
      try {
        // Directly find the student result
        const student = processedResults.value.find(r => r.user.id === userId);
        if (!student) {
          console.log('Student not found in processed results:', userId);
          return;
        }
        
        // Get records from exam.attempts - IMPORTANT: Only get attempts for this specific student
        let records = [];
        
        if (student.exam && student.exam.attempts) {
          console.log(`Found ${student.exam.attempts.length} total attempts for exam, filtering for student ${userId}`);
          
          // Extract records from nested structure, but only for the current student
          student.exam.attempts.forEach(attempt => {
            console.log(`Checking attempt ${attempt.attemptNumber} - userId: ${attempt.userId}, target userId: ${userId}`);
            
            // Only process attempts that belong to the current student
            if (attempt.userId === userId) {
              console.log(`Processing attempt ${attempt.attemptNumber} for student ${userId}`);
              
              if (attempt.records && Array.isArray(attempt.records)) {
                console.log(`Found ${attempt.records.length} records in attempt ${attempt.attemptNumber}`);
                
                // Add all records with attempt number
                attempt.records.forEach(record => {
                  records.push({
                    ...record,
                    attemptNumber: attempt.attemptNumber
                  });
                });
              }
            } else {
              console.log(`Skipping attempt ${attempt.attemptNumber} - belongs to different user (${attempt.userId})`);
            }
          });
        }
        
        // Alternative: Use the processed attempts from allAttempts if available
        if (records.length === 0 && allAttempts.value[userId]) {
          console.log(`Using fallback: allAttempts for student ${userId}`);
          records = allAttempts.value[userId]
            .filter(attempt => attempt.isHistoricalRecord)
            .map(attempt => ({
              id: attempt.id,
              attemptNumber: attempt.attemptNumber,
              score: attempt.score,
              total: attempt.total,
              percentage: attempt.percentage,
              startedAt: attempt.startedAt,
              completedAt: attempt.completedAt,
              timeSpent: attempt.timeSpent
            }));
        }
        
        // Final fallback: Manually filter attempts from the exam data
        if (records.length === 0 && student.exam && student.exam.attempts) {
          console.log(`Using final fallback: manually filtering attempts for student ${userId}`);
          const filteredAttempts = student.exam.attempts.filter(attempt => attempt.userId === userId);
          console.log(`Filtered ${filteredAttempts.length} attempts for student ${userId} out of ${student.exam.attempts.length} total`);
          
          filteredAttempts.forEach(attempt => {
            if (attempt.records && Array.isArray(attempt.records)) {
              attempt.records.forEach(record => {
                records.push({
                  ...record,
                  attemptNumber: attempt.attemptNumber
                });
              });
            }
          });
        }
        
        if (records.length > 0) {
          // Sort records by attempt number and completion date
          records.sort((a, b) => {
            if (a.attemptNumber !== b.attemptNumber) {
              return a.attemptNumber - b.attemptNumber;
            }
            return new Date(b.completedAt) - new Date(a.completedAt);
          });
          
          attemptRecordsModalData.value = {
            studentId: userId,
            student: student.user,
            records: records
          };
          showAttemptModal.value = true;
          console.log(`Showing attempt records modal for student ${userId} with ${records.length} records:`, records);
        } else {
          console.log('No attempt records found for student ID:', userId);
        }
      } catch (err) {
        console.error('Error showing attempt records modal:', err);
      }
    };
    
    // Function to close attempt records modal
    const closeAttemptRecordsModal = () => {
      showAttemptModal.value = false;
    };
    
    // Function to restore an attempt record
    const restoreRecord = async (recordId) => {
      try {
        console.log('Attempting to restore record with ID:', recordId);
        isRestoringRecord.value = recordId;
        
        const result = await restoreAttemptScore(recordId);
        console.log('Restore API result:', result);
        
        if (result) {
          // Reload the data to get updated information
          await loadResults();
          
          // Show success message
          alert('Attempt record restored successfully.');
          
          // Close the modal
          closeAttemptRecordsModal();
        }
      } catch (err) {
        console.error('Error restoring attempt record:', err);
        alert('Failed to restore attempt record: ' + (err.message || 'Unknown error'));
      } finally {
        isRestoringRecord.value = null;
      }
    };

    // Archive modal functions
    const openArchiveModal = (result) => {
      archiveModalData.value = {
        resultId: result.id,
        studentId: result.user.id,
        examId: parseInt(route.params.examId),
        studentName: `${result.user.firstName} ${result.user.lastName}`,
        reason: ''
      };
      showArchiveModal.value = true;
    };

    const closeArchiveModal = () => {
      showArchiveModal.value = false;
      archiveModalData.value = {
        resultId: null,
        studentId: null,
        examId: null,
        studentName: '',
        reason: ''
      };
    };

    // Function to archive an exam result
    const archiveResult = async () => {
      try {
        if (!archiveModalData.value.reason.trim()) {
          alert('Please provide a reason for archiving this result.');
          return;
        }

        isArchivingResult.value = true;
        
        const result = await archiveExamResult(
          archiveModalData.value.examId,
          archiveModalData.value.studentId,
          archiveModalData.value.reason
        );
        
        if (result) {
          // Reload the data to get updated information
          await loadResults();
          
          // Show success message
          alert('Exam result archived successfully.');
          
          // Close the modal
          closeArchiveModal();
        }
      } catch (err) {
        console.error('Error archiving exam result:', err);
        alert('Failed to archive exam result: ' + (err.message || 'Unknown error'));
      } finally {
        isArchivingResult.value = false;
      }
    };



    // Bulk archive functions
    const openBulkArchiveModal = () => {
      bulkArchiveModalData.value = {
        examId: parseInt(route.params.examId),
        reason: ''
      };
      showBulkArchiveModal.value = true;
    };

    const closeBulkArchiveModal = () => {
      showBulkArchiveModal.value = false;
      bulkArchiveModalData.value = {
        examId: null,
        reason: ''
      };
    };

    const bulkArchiveResults = async () => {
      try {
        if (!bulkArchiveModalData.value.reason.trim()) {
          alert('Please provide a reason for bulk archiving.');
          return;
        }

        if (filteredResults.value.length === 0) {
          alert('No results to archive.');
          return;
        }

        // Confirm the action
        const confirmed = confirm(
          `Are you sure you want to archive ALL ${filteredResults.value.length} exam results for this exam? This action cannot be undone.`
        );

        if (!confirmed) {
          return;
        }

        isBulkArchiving.value = true;
        
        const result = await archiveAllExamResults(
          bulkArchiveModalData.value.examId,
          bulkArchiveModalData.value.reason
        );
        
        if (result) {
          // Show success message with details
          alert(`Successfully archived ${result.archivedCount} out of ${result.totalResults} exam results.`);
          
          // Close the modal
          closeBulkArchiveModal();
          
          // Reload the data to reflect the changes
          await loadResults();
        }
      } catch (err) {
        console.error('Error bulk archiving exam results:', err);
        alert('Failed to bulk archive exam results: ' + (err.message || 'Unknown error'));
      } finally {
        isBulkArchiving.value = false;
      }
    };

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
      formatTimeSpent,
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
      isMobile,
      viewStudentAnswers,
      viewPartResults,
      // Add export-related functionality to returned object
      showExportOptions,
      exportOptions,
      toggleExportOptions,
      exportToExcel,
      exportToPDF,
      printData,
      // Add new methods for attempt handling
      getStudentAttempts,
      getCurrentAttemptNumber,
      getSelectedAttemptDate,
      formatShortDate,
      // Add new attempt record related methods
      studentHasAttemptRecords,
      showAttemptRecordsModal,
      closeAttemptRecordsModal,
      showAttemptModal,
      attemptRecordsModalData,
      restoreRecord,
      isRestoringRecord,
      // Add new archive related methods
      showArchiveModal,
      openArchiveModal,
      closeArchiveModal,
      archiveResult,
      archiveModalData,
      isArchivingResult,
      // Add new bulk archive related methods
      showBulkArchiveModal,
      openBulkArchiveModal,
      closeBulkArchiveModal,
      bulkArchiveResults,
      bulkArchiveModalData,
      isBulkArchiving
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
  border: 1px solid rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.header-content h1 {
  margin: 0 0 10px 0;
  color: #159750;
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.test-code {
  color: #666;
  font-weight: 500;
}

.back-btn {
  padding: 10px 18px;
  background: #e8f5e9;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #159750;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(21, 151, 80, 0.1);
  transition: all 0.2s;
}

.bulk-archive-btn {
  padding: 10px 18px;
  background: #ff9800;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(255, 152, 0, 0.2);
  transition: all 0.2s;
}

.bulk-archive-btn:hover {
  background: #f57c00;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(255, 152, 0, 0.3);
}

.part-results-btn {
  padding: 10px 18px;
  background: #2196f3;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(33, 150, 243, 0.2);
  transition: all 0.2s;
}

.part-results-btn:hover {
  background: #1976d2;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
}

.header-actions {
  display: flex;
  gap: 10px;
  position: relative;
}

.export-container {
  position: relative;
  z-index: 100; /* Ensure dropdown displays above other content */
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.export-btn:hover {
  background: #43A047;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.dropdown-icon {
  transition: transform 0.3s ease;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
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
 .exam-results {
  padding: 0rem;
 }
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
  .pagination .page-number.active ~ button:first-of-type {
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

/* Attempt selection styling */
.attempt-selector {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.attempt-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.attempt-dropdown {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.attempt-dropdown:focus {
  outline: none;
  border-color: #159750;
  box-shadow: 0 0 0 3px rgba(21, 151, 80, 0.1);
}

.attempt-badge {
  background: #e8f5e9;
  color: #159750;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(21, 151, 80, 0.1);
}

.attempt-controls-table {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 80px;
}

.attempt-controls-table .attempt-dropdown {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
  font-size: 0.85rem;
}

.attempt-date {
  font-size: 0.8rem;
  color: #666;
  white-space: nowrap;
  margin-top: 2px;
}

.no-attempts {
  color: #666;
  font-style: italic;
  font-size: 0.9rem;
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

.view-answers-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s;
}

.view-answers-btn:hover {
  background: #1976d2;
}

.result-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

/* Export dropdown styles - improved styling */
.export-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 8px;
  width: 320px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 100;
  animation: fadeIn 0.2s ease;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.export-options-header {
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.export-options-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.export-data-selection {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.export-data-selection h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.export-checkboxes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.export-checkboxes label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.export-checkboxes input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #4CAF50;
}

.export-section-selector {
  margin-top: 20px;
  background: #f9f9f9;
  padding: 12px;
  border-radius: 6px;
}

.export-section-selector h4 {
  margin: 0 0 10px 0;
}

.export-radio-options {
  display: flex;
  gap: 20px;
}

.export-radio-options label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.export-radio-options input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #4CAF50;
}

.export-actions {
  display: flex;
  padding: 16px;
  gap: 10px;
  background: #f5f5f5;
}

.export-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.export-action-btn .material-icons {
  font-size: 18px;
}

.export-action-btn.excel {
  background: #1D6F42; /* Excel green */
}

.export-action-btn.excel:hover {
  background: #0E5A2F;
}

.export-action-btn.pdf {
  background: #E74C3C; /* PDF red */
}

.export-action-btn.pdf:hover {
  background: #C0392B;
}

.export-action-btn.print {
  background: #7F8C8D; /* Print gray */
}

.export-action-btn.print:hover {
  background: #5a6a6b;
}

/* Mobile responsiveness for export */
@media (max-width: 768px) {
  .exam-results {
    padding: 0rem;
  }
  .export-dropdown {
    width: 280px;
    right: 0;
    position: absolute;
  }
  
  .export-checkboxes {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .export-actions {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
  }
  
  .export-action-btn {
    width: 100%;
    flex-direction: row;
    justify-content: center;
  }
  
  .export-radio-options {
    flex-direction: column;
    gap: 8px;
  }
}

/* Attempt information styling */
.attempt-info {
  margin-top: 1rem;
  padding-top: 0.5rem;
  border-top: 1px solid #eee;
}

.attempt-info h4 {
  font-size: 1rem;
  color: #555;
  margin-bottom: 0.5rem;
}

.attempt-item {
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.attempt-number {
  font-weight: 600;
  color: #2196f3;
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.attempt-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.5rem;
  font-size: 0.85rem;
}

.attempt-detail {
  display: flex;
  flex-direction: column;
}

.attempt-detail .label {
  color: #666;
  font-size: 0.8rem;
}

.time-spent {
  color: #666;
  font-size: 0.85rem;
  padding-left: 0.25rem;
}

/* Make the table more responsive */
@media (max-width: 768px) {
  .table-wrapper table {
    min-width: 650px; /* Reduced minimum width */
  }
  
  table th,
  table td {
    padding: 8px;
    font-size: 0.9rem;
    vertical-align: top;
  }
  
  .attempt-controls-table {
    min-width: 60px;
  }
  
  .attempt-date {
    font-size: 0.75rem;
  }
}

/* Enhanced Mobile Styles */
@media (max-width: 768px) {
  .exam-results {
    padding: 10px;
  }

  .results-header {
    flex-direction: column;
    gap: 15px;
    padding: 15px;
    margin-bottom: 15px;
  }

  .header-content h1 {
    font-size: 1.4rem;
  }

  .header-actions {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .back-btn, .export-btn, .bulk-archive-btn, .part-results-btn {
    padding: 8px 12px;
    font-size: 0.9rem;
  }

  .filters {
    flex-direction: column;
    padding: 15px;
    gap: 10px;
  }

  .filter-group {
    flex-direction: row;
    align-items: center;
    width: 100%;
  }

  .filter-group label {
    width: 30%;
    margin-bottom: 0;
  }

  .filter-group select {
    flex-grow: 1;
    padding: 8px;
    font-size: 0.9rem;
  }

  .search-input {
    padding: 10px 10px 10px 40px;
    font-size: 0.9rem;
  }

  /* Table improvements */
  .table-wrapper {
    border-radius: 10px;
    overflow: hidden;
    margin: 0;
    width: 100%;
  }

  .table-wrapper.scrollable::after {
    font-size: 1.2rem;
    padding: 10px;
    background: rgba(255,255,255,0.8);
    border-radius: 50%;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    right: 15px;
  }

  table {
    min-width: auto;
    width: 100%;
  }

  /* Mobile Grid View */
  .results-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .result-card {
    padding: 15px;
  }

  /* Improved attempt display for mobile */
  .attempt-selector {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .attempt-controls {
    flex: 1;
  }

  /* Show more compact table on mobile */
  .table-wrapper table {
    display: block;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  table th,
  table td {
    padding: 10px 12px;
  }

  /* Hide less important columns on very small screens */
  @media (max-width: 480px) {
    .score-display-container {
      flex-direction: column;
      align-items: flex-start;
      gap: 15px;
    }

    .view-toggle-btn {
      padding: 6px 10px;
      font-size: 0.8rem;
    }

    .view-toggle-btn .material-icons {
      font-size: 16px;
    }

    .view-controls {
      gap: 5px;
      flex-wrap: wrap;
      justify-content: flex-start;
    }

    /* More compact cards */
    .result-card {
      padding: 12px;
      margin-bottom: 10px;
    }

    .result-header {
      margin-bottom: 10px;
      padding-bottom: 10px;
    }

    .student-info h3 {
      font-size: 1.1rem;
    }

    .score-badge {
      padding: 6px 10px;
      font-size: 1rem;
    }

    .detail-item {
      padding: 8px;
      font-size: 0.9rem;
    }

    .view-answers-btn {
      padding: 8px 12px;
      font-size: 0.85rem;
    }

    /* Ultra-compact table for tiny screens */
    .attempt-controls-table {
      width: 100%;
    }

    .attempt-dropdown {
      max-width: 100px;
    }
  }
}

/* Add this to your existing CSS */
/* Mobile responsive table columns */
.mobile-hide {
  display: table-cell;
}

@media (max-width: 600px) {
  .mobile-hide {
    display: none;
  }
  
  .table-wrapper table {
    min-width: 500px; /* Further reduced minimum width for very small screens */
  }
  
  /* Highlight the most important columns */
  table td:nth-child(2), /* Student name */
  table td:nth-child(3), /* Score */
  table td:nth-child(5), /* Attempts */
  table td:nth-child(7), /* Actions */
  table th:nth-child(2),
  table th:nth-child(3),
  table th:nth-child(5),
  table th:nth-child(7) {
    background-color: rgba(255, 255, 255, 0.8);
  }
}

@media (max-width: 600px) {
  .view-answers-btn {
    padding: 8px;
    min-width: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .view-answers-btn .material-icons {
    margin-right: 0;
    font-size: 20px;
  }
  
  .view-answers-btn .btn-text {
    display: none;
  }

  /* Show just the icon on smallest screens */
  table td:last-child {
    padding-right: 5px;
    padding-left: 5px;
    min-width: 50px;
    width: 50px;
    text-align: center;
  }
}

/* Add styles for restore button and modal */
.restore-record-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 8px;
  border-radius: 4px;
  border: 1px solid #2196f3;
  background: #e3f2fd;
  color: #1976d2;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 5px;
  font-size: 0.85rem;
}

.restore-record-btn:hover {
  background: #2196f3;
  color: white;
}

.restore-text {
  display: inline-block;
  font-weight: 500;
}

@media (max-width: 768px) {
  .restore-text {
    display: none;
  }
  
  .restore-record-btn {
    width: 30px;
    padding: 0;
  }
}

/* Attempt Records Modal */
.attempt-records-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.attempt-records-modal-content {
  background: white;
  width: 100%;
  max-width: 600px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.attempt-modal-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f5f5f5;
  margin: 0;
  border-bottom: 1px solid #e0e0e0;
  font-size: 18px;
}

.close-modal-btn {
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.close-modal-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.attempt-modal-body {
  padding: 20px;
  overflow-y: auto;
}

.no-records {
  text-align: center;
  padding: 30px;
  color: #666;
  font-style: italic;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.record-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid #2196f3;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.record-item:hover {
  background: #f1f5f9;
  box-shadow: 0 4px 8px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.record-number {
  font-weight: 600;
  color: #2196f3;
  font-size: 1rem;
}

.record-score {
  background: #e8f5e9;
  color: #159750;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.record-details {
  display: flex;
  gap: 16px;
}

.record-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #555;
}

.record-detail .material-icons {
  font-size: 16px;
  color: #777;
}

.restore-record-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(33, 150, 243, 0.2);
}

.restore-record-action:hover:not(:disabled) {
  background: #1976d2;
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
  transform: translateY(-1px);
}

.restore-record-action:disabled {
  background: #b0bec5;
  cursor: not-allowed;
}

.spinning {
  animation: spin 1.2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile responsiveness for modal */
@media (max-width: 768px) {
  .attempt-records-modal-content {
    max-width: 95%;
    max-height: 80vh;
  }

  .record-item {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }
  
  .record-actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
  
  .record-details {
    flex-direction: column;
    gap: 8px;
  }
}

/* Update the table styling for better mobile responsiveness */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 1.5rem;
  position: relative;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

/* Enhanced mobile table styles */
@media (max-width: 768px) {
  .table-wrapper table {
    width: 100%;
    font-size: 0.9rem;
  }
  
  .table-wrapper th,
  .table-wrapper td {
    padding: 8px 6px;
    font-size: 0.85rem;
  }
  
  /* Create a horizontal scroll indicator that's more visible */
  .table-wrapper.scrollable::after {
    content: '→';
    position: absolute;
    right: 5px;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(33, 150, 243, 0.2);
    color: #2196f3;
    padding: 5px 8px;
    border-radius: 50%;
    font-weight: bold;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    animation: bounce 1.5s infinite;
    z-index: 10;
  }
  
  /* Create a stacked card layout for table cells on extra small screens */
  @media (max-width: 480px) {
    /* Add data column header before cell content */
    .mobile-responsive-labels td::before {
      content: attr(data-label);
      font-weight: bold;
      display: block;
      margin-bottom: 3px;
      font-size: 0.7rem;
      color: #666;
      text-transform: uppercase;
    }
    
    /* More visible scroll indicator for very small screens */
    .table-wrapper.scrollable::after {
      padding: 8px 10px;
      font-size: 18px;
    }
  }
  
  /* Improve vertical spacing between table rows */
  .table-wrapper tr {
    border-bottom: 1px solid #f0f0f0;
  }
  
  /* Make sure all action buttons are visible and usable */
  .view-answers-btn {
    min-width: auto;
    white-space: nowrap;
    padding: 6px 10px;
  }
}

/* Ultra-compact mobile design for very small screens */
@media (max-width: 380px) {
  .exam-results {
    padding: 6px;
  }
  
  .results-header {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .filters, .analysis-filters {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  /* Make score badges more compact */
  .percentage-badge {
    padding: 3px 6px;
    font-size: 0.75rem;
    min-width: 45px;
  }
  
  .difficulty-badge {
    padding: 3px 6px;
    font-size: 0.75rem;
  }
  
  /* More compact progress bar */
  .progress-bar {
    height: 16px;
    min-width: 60px;
  }
  
  .progress::after {
    font-size: 10px;
  }
  
  /* Optimize table for the smallest screens */
  .table-wrapper th,
  .table-wrapper td {
    padding: 6px 4px;
    font-size: 0.75rem;
  }
  
  /* Fix padding on action buttons for better touch targets */
  .view-answers-btn {
    padding: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .view-answers-btn .btn-text {
    display: none;
  }
  
  .view-answers-btn .material-icons {
    margin: 0;
    font-size: 18px;
  }
}

/* Action Buttons Styling */
.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.archive-result-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  transition: all 0.2s;
}

.archive-result-btn:hover {
  background: #f57c00;
}

/* Result Actions for Grid View */
.result-actions {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

/* Archive Modal Styling */
.archive-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s;
}

.archive-modal-content {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.archive-modal-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f5f5f5;
  margin: 0;
  border-bottom: 1px solid #e0e0e0;
  font-size: 18px;
}

.archive-modal-body {
  padding: 20px;
  overflow-y: auto;
}

.archive-student-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.archive-student-info p {
  margin: 5px 0;
  color: #333;
}

.archive-reason-input {
  margin-bottom: 20px;
}

.archive-reason-input label {
  display: block;
  margin-bottom: 8px;
  color: #333;
}

.archive-reason-input textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.2s;
}

.archive-reason-input textarea:focus {
  outline: none;
  border-color: #ff9800;
  box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
}

.char-count {
  display: block;
  text-align: right;
  margin-top: 5px;
  color: #666;
  font-size: 12px;
}

.archive-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.cancel-btn {
  padding: 10px 20px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.archive-confirm-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(255, 152, 0, 0.2);
}

.archive-confirm-btn:hover:not(:disabled) {
  background: #f57c00;
  box-shadow: 0 4px 8px rgba(255, 152, 0, 0.3);
}

.archive-confirm-btn:disabled {
  background: #b0bec5;
  cursor: not-allowed;
}

/* Mobile responsiveness for archive modal */
@media (max-width: 768px) {
  .archive-modal-content {
    max-width: 95%;
    max-height: 85vh;
  }

  .archive-actions {
    flex-direction: column;
  }
  
  .cancel-btn,
  .archive-confirm-btn {
    width: 100%;
    justify-content: center;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 5px;
  }
  
  .archive-result-btn {
    font-size: 0.8rem;
    padding: 5px 10px;
  }
  
  .result-actions {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 600px) {
  .archive-result-btn {
    padding: 8px;
    min-width: 36px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .archive-result-btn .material-icons {
    margin-right: 0;
    font-size: 20px;
  }
  
  .archive-result-btn .btn-text {
    display: none;
  }
}

/* Create optimized data display for results table */
@media (max-width: 600px) {
  /* Hide less important columns on mobile */
  .mobile-hide {
    display: none;
  }
  
  /* Make sure essential columns stand out */
  table td:nth-child(2), /* Student name */
  table td:nth-child(3), /* Score */
  table td:nth-child(7) { /* Actions */
    font-weight: 500;
  }
  
  /* Adjust width for better viewing on mobile */
  .table-wrapper table {
    min-width: 450px; /* Slightly reduced minimum width */
  }
  
  /* Enhance layout of attempt controls on mobile */
  .attempt-controls-table {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

/* Fix for Export dropdown positioning on mobile */
@media (max-width: 768px) {  
  .export-dropdown {
    right: 0;
    width: 280px;
    max-width: 90vw;
  }
  
  .export-options-header, 
  .export-data-selection,
  .export-actions {
    padding: 12px;
  }
  
  .export-checkboxes {
    gap: 8px;
  }
}
</style> 