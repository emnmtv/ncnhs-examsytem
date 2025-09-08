<template>
  <div class="student-answer-details">
    <div class="header">
      <div class="header-left">
        <div class="back-button" @click="handleBack">
          <span class="material-icons">arrow_back</span>
          Back to Results
        </div>
        
        <!-- Filter and Search Controls -->
        <div class="controls-row">
          <div class="filter-controls">
            <button 
              class="filter-btn"
              :class="{ active: showEssayOnly }"
              @click="toggleEssayFilter"
            >
              <span class="material-icons">description</span>
              Essay Only
            </button>
          </div>
          
          <div class="search-control">
            <div class="search-box">
              <span class="material-icons">search</span>
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Search questions..."
                class="search-input"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div class="header-center">
        <!-- Student Navigation -->
        <div class="student-navigation">
          <button 
            class="nav-btn prev-student"
            @click="navigateStudent('prev')"
            :disabled="!canNavigatePrev"
          >
            <span class="material-icons">chevron_left</span>
            Previous
          </button>
          
          <div class="student-counter">
            {{ currentStudentIndex + 1 }} of {{ totalStudents }}
          </div>
          
          <button 
            class="nav-btn next-student"
            @click="navigateStudent('next')"
            :disabled="!canNavigateNext"
          >
            Next
            <span class="material-icons">chevron_right</span>
          </button>
        </div>
      </div>
      
      <div v-if="details" class="student-info">
        <h2>{{ details.student.firstName }} {{ details.student.lastName }}</h2>
        <div class="sub-info">
          <span>Grade {{ details.student.gradeLevel }}-{{ details.student.section }}</span>
          <span>|</span>
          <span>LRN: {{ details.student.lrn }}</span>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading answers...
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadAnswers" class="retry-btn">Retry</button>
    </div>

    <div v-else-if="details" class="content">
      <!-- Consolidated Header Card -->
      <div class="header-card">
        <div class="header-card-top">
          <div class="exam-info">
            <h3>{{ details.exam.examTitle }}</h3>
            <p class="test-code">Test Code: {{ details.exam.testCode }}</p>
          </div>
          
          <div class="score-display-container">
            <div class="current-score">
              <div v-if="isPreviewingAttempt" class="preview-indicator">
                <span class="material-icons">visibility</span>
                PREVIEW MODE
              </div>
              <div class="score-value-container">
                <span class="score-value">{{ details.score?.score || 0 }}</span>
                <span class="score-total">/{{ details.answers.length }}</span>
                <span class="score-percentage">({{ details.score?.percentage || 0 }}%)</span>
              </div>
              
              <!-- Add attempt badge -->
              <div v-if="details.score && details.attempts && !isPreviewingAttempt" class="attempt-badge">
                Latest Attempt (#{{ getLastAttemptNumber() }})
              </div>
              <div v-else-if="isPreviewingAttempt && selectedAttemptRecord" class="attempt-preview-badge">
                Previewing Attempt
              </div>
            </div>
            
            <div class="manual-score">
              <div class="score-input">
                <input 
                  type="number" 
                  v-model.number="manualScore"
                  :min="0"
                  :max="details.answers.length"
                  @keyup.enter="updateManualScore"
                  placeholder="Update score"
                >
                <button 
                  @click="updateManualScore"
                  :disabled="!isManualScoreValid || isUpdating"
                >
                  <span v-if="isUpdating">
                    <i class="fas fa-spinner fa-spin"></i>
                  </span>
                  <span v-else>Update</span>
                </button>
              </div>
              <p v-if="!isManualScoreValid" class="error-text">
                Score must be between 0 and {{ details.answers.length }}
              </p>
            </div>
          </div>
        </div>
        
        <div class="header-card-content">
        
          <!-- <div class="info-section exam-settings">
            <h4>Exam Settings</h4>
            <div class="info-grid">
              <div v-if="details.exam.durationMinutes" class="setting-item">
                <span class="material-icons">timer</span>
                <span>{{ details.exam.durationMinutes }} min duration</span>
              </div>
              <div v-if="details.exam.maxAttempts" class="setting-item">
                <span class="material-icons">repeat</span>
                <span>{{ details.exam.maxAttempts }} max attempts</span>
              </div>
              <div v-if="details.exam.startDateTime" class="setting-item">
                <span class="material-icons">event</span>
                <span>From: {{ formatDateTime(details.exam.startDateTime) }}</span>
              </div>
              <div v-if="details.exam.endDateTime" class="setting-item">
                <span class="material-icons">event_busy</span>
                <span>Until: {{ formatDateTime(details.exam.endDateTime) }}</span>
              </div>
            </div>
          </div> -->
          
          <!-- Second row: Latest attempt info -->
          <div v-if="latestAttempt" class="info-section attempt-info">
            <h4>Latest Attempt</h4>
            <div class="latest-attempt-card">
              <div class="latest-attempt-details">
                <div class="attempt-detail">
                  <span class="material-icons">play_circle</span>
                  <span>Started: {{ formatDateTime(latestAttempt.startedAt) }}</span>
                </div>
                
                <div v-if="latestAttempt.completedAt" class="attempt-detail">
                  <span class="material-icons">stop_circle</span>
                  <span>Completed: {{ formatDateTime(latestAttempt.completedAt) }}</span>
                </div>
                
                <div v-if="latestAttempt.timeSpent" class="attempt-detail">
                  <span class="material-icons">timelapse</span>
                  <span>Time Spent: {{ formatTimeSpent(latestAttempt.timeSpent) }}</span>
                </div>
              </div>
              
              <div class="attempt-status" :class="{ 'completed': latestAttempt.isCompleted }">
                {{ latestAttempt.isCompleted ? 'Completed' : 'In Progress' }}
              </div>
            </div>
          </div>

          <!-- Add historical attempts section -->
          <div v-if="hasAttemptRecords" class="info-section attempt-history">
            <div class="attempt-history-header" @click="toggleAttemptHistory">
              <h4>
                <span class="material-icons">{{ isAttemptHistoryOpen ? 'expand_less' : 'expand_more' }}</span>
                Attempt History
              </h4>
            </div>
            <div class="attempt-records-list" :class="{ 'collapsed': !isAttemptHistoryOpen }">
              <div v-for="record in attemptRecords" :key="record.id" class="attempt-record-item">
                <div class="attempt-record-info">
                  <div class="attempt-record-header">
                    <span class="attempt-number">Attempt #{{ record.attemptNumber }}</span>
                    <span class="attempt-score">{{ record.score }}/{{ record.total }} ({{ record.percentage }}%)</span>
                  </div>
                  <div class="attempt-record-details">
                    <div class="attempt-record-detail">
                      <span class="material-icons">event</span>
                      <span>{{ formatDateTime(record.completedAt) }}</span>
                    </div>
                    <div class="attempt-record-detail">
                      <span class="material-icons">timelapse</span>
                      <span>{{ formatTimeSpent(record.timeSpent) }}</span>
                    </div>
                  </div>
                </div>
                <div class="attempt-record-actions">
                  <button 
                    @click="restoreAttemptRecord(record.id)"
                    class="restore-attempt-btn"
                    :disabled="isUpdating"
                    :title="'Restore attempt #' + record.attemptNumber + ' as current score'"
                  >
                    <span v-if="isRestoringRecord === record.id" class="material-icons spinning">sync</span>
                    <span v-else class="material-icons">restore</span>
                    Restore
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Add this dropdown for attempt records in the header-card section -->
          <div class="info-section attempt-selector">
            <h4>Attempt History</h4>
            <div v-if="hasAttemptRecords" class="attempt-preview-container">
              <select 
                v-model="selectedAttemptRecord" 
                class="attempt-dropdown"
                @change="previewAttemptRecord"
              >
                <option value="">Current Score</option>
                <option 
                  v-for="record in attemptRecords" 
                  :key="record.id" 
                  :value="record.id"
                >
                  Attempt #{{ record.attemptNumber }} - {{ record.score }}/{{ record.total }} ({{ record.percentage }}%)
                </option>
              </select>
              
              <button 
                v-if="selectedAttemptRecord"
                @click="restoreAttemptRecord(selectedAttemptRecord)"
                class="restore-attempt-btn"
                :disabled="isUpdating"
              >
                <span v-if="isRestoringRecord === selectedAttemptRecord" class="material-icons spinning">sync</span>
                <span v-else class="material-icons">restore</span>
                Restore This Attempt
              </button>

              <button 
                v-if="isPreviewingAttempt"
                @click="clearAttemptPreview"
                class="clear-preview-btn"
              >
                <span class="material-icons">close</span>
                Clear Preview
              </button>
            </div>
            <div v-else class="no-attempt-records">
              <span class="material-icons">history_toggle_off</span>
              <span>No attempt history found for this student.</span>
              <span class="records-debug">Records found: {{ attemptRecords.length }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="answers-list">
        <div v-if="!details.answers || details.answers.length === 0" class="no-answers">
          <i class="fas fa-exclamation-circle"></i>
          <p>No answers found for this exam</p>
        </div>
        
        <div 
          v-else
          v-for="answer in filteredAnswers" 
          :key="answer.id || answer.questionId"
          class="answer-item"
          :class="{ 'essay-question': isEssayQuestion(answer) }"
          :data-correct="answer.isCorrect"
        >
          <div class="question-section">
            <div class="question-header">
              <span class="question-number">Question {{ getQuestionNumber(answer) }}</span>
              <span 
                class="question-type"
                :class="(getQuestionType(answer) || '').toLowerCase().replace('_', '-')"
              >
                {{ formatQuestionType(getQuestionType(answer)) }}
              </span>
            </div>
            
            <p class="question-text">{{ answer.question?.questionText || answer.questionText }}</p>
            
            <div v-if="answer.question?.imageUrl || answer.imageUrl" class="question-image">
              <img :src="getImageUrl(answer.question?.imageUrl || answer.imageUrl)" :alt="'Image for question ' + answer.questionId">
            </div>

            <div v-if="hasOptions(answer)" class="options">
              <div 
                v-for="(option, index) in getOptions(answer)" 
                :key="index"
                class="option"
                :class="{
                  'correct-option': option === getCorrectAnswer(answer),
                  'selected-option': option === answer.userAnswer
                }"
              >
                {{ option }}
              </div>
            </div>
          </div>

          <div class="answer-section">
            <!-- Essay Question Handling -->
            <div v-if="isEssayQuestion(answer)" class="essay-answer-section">
              <div class="essay-response">
                <div class="answer-label">Student's Essay Response:</div>
                <div class="essay-text" :class="{ 'no-answer': !answer.userAnswer }">
                  {{ answer.userAnswer || 'No response provided' }}
                </div>
                <div v-if="answer.userAnswer" class="essay-meta">
                  <span class="word-count">Words: {{ getWordCount(answer.userAnswer) }}</span>
                  <span class="char-count">Characters: {{ answer.userAnswer.length }}</span>
                </div>
              </div>
              
                              <!-- Essay Scoring -->
                <div class="essay-scoring">
                  <div class="essay-score-input">
                    <label>Score:</label>
                    <input 
                      type="number" 
                      v-model.number="answer.essayScore"
                      :min="0"
                      :max="getQuestionPoints(answer)"
                      class="score-input-field"
                    />
                    <span class="max-points">/ {{ getQuestionPoints(answer) }} points</span>
                  </div>
                  
                  <!-- Teacher Feedback -->
                  <div class="essay-feedback">
                    <label>Teacher Feedback:</label>
                    <textarea 
                      v-model="answer.teacherFeedback"
                      placeholder="Provide feedback for the student's response..."
                      class="feedback-textarea"
                      rows="3"
                    ></textarea>
                  </div>
                  
                  <!-- Grade Button -->
                  <div class="essay-actions">
                    <button 
                      @click="saveEssayGrade(answer)"
                      :disabled="isUpdating"
                      class="grade-btn"
                      :class="{ 'graded': answer.isGraded }"
                    >
                      <span v-if="isUpdating" class="material-icons spinning">sync</span>
                      <span v-else class="material-icons">{{ answer.isGraded ? 'check_circle' : 'grade' }}</span>
                      {{ answer.isGraded ? 'Update Grade' : 'Save Grade' }}
                    </button>
                    
                    <div v-if="answer.isGraded" class="grade-status">
                      <span class="material-icons">check_circle</span>
                      Graded
                    </div>
                  </div>
                </div>
            </div>
            
            <!-- Regular Question Handling -->
            <div v-else class="regular-answer-section">
              <div class="answer-details">
                <div class="answer-label">Student's Answer:</div>
                <div class="student-answer" 
                  :class="{ 
                    'no-answer': !answer.userAnswer,
                    'correct': answer.isCorrect,
                    'incorrect': !answer.isCorrect && answer.userAnswer
                  }"
                >
                  {{ answer.userAnswer || 'No answer provided' }}
                </div>
                
                <div class="correct-answer">
                  <span class="answer-label">Correct Answer:</span>
                  <span>{{ getCorrectAnswer(answer) }}</span>
                </div>
              </div>

              <div class="answer-actions">
                <div class="correctness-toggle">
                  <button 
                    class="toggle-btn correct"
                    :class="{ active: answer.isCorrect }"
                    @click="updateAnswerCorrectness(answer.id, true)"
                    :disabled="isUpdating"
                  >
                    <span class="material-icons">check_circle</span>
                    Correct
                  </button>
                  <button 
                    class="toggle-btn incorrect"
                    :class="{ active: !answer.isCorrect }"
                    @click="updateAnswerCorrectness(answer.id, false)"
                    :disabled="isUpdating"
                  >
                    <span class="material-icons">cancel</span>
                    Incorrect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getStudentExamAnswers, updateStudentExamAnswer, updateStudentExamScore, getFullImageUrl, restoreAttemptScore, scoreEssayQuestion, getEssayScores } from '../../services/authService';

export default {
  name: 'StudentAnswerDetails',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const details = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const isUpdating = ref(false);
    const manualScore = ref(0);
    const latestAttempt = ref(null);
    const isRestoringRecord = ref(null);
    const selectedAttemptRecord = ref(null);
    const isPreviewingAttempt = ref(false);
    const originalScore = ref(null);
    const originalAnswers = ref(null);
    const isAttemptHistoryOpen = ref(true);
    
    // New properties for enhanced functionality
    const showEssayOnly = ref(false);
    const searchQuery = ref('');
    const currentStudentIndex = ref(0);
    const totalStudents = ref(1);
    const studentList = ref([]);

    const isManualScoreValid = computed(() => {
      if (!details.value) return false;
      const score = manualScore.value;
      return score >= 0 && score <= details.value.answers?.length || 0;
    });

    const attemptRecords = computed(() => {
      if (!details.value) return [];
      
      console.log('Debug - details value structure:', JSON.stringify(details.value));
      
      // Extract records from various possible structures
      const records = [];
      
      // Check for the nested structure in exam.attempts
      if (details.value.exam && details.value.exam.attempts) {
        console.log('Found exam.attempts:', details.value.exam.attempts);
        details.value.exam.attempts.forEach(attempt => {
          if (attempt.records && Array.isArray(attempt.records)) {
            console.log(`Found ${attempt.records.length} records in attempt #${attempt.attemptNumber}`);
            attempt.records.forEach(record => {
              records.push({
                ...record,
                attemptNumber: attempt.attemptNumber,
                attemptId: attempt.id
              });
            });
          }
        });
      }
      
      // Check for direct records on the attempts
      if (details.value.attempts) {
        console.log('Found attempts:', details.value.attempts);
        details.value.attempts.forEach(attempt => {
          if (attempt.records && Array.isArray(attempt.records)) {
            console.log(`Found ${attempt.records.length} records in attempt #${attempt.attemptNumber}`);
            attempt.records.forEach(record => {
              records.push({
                ...record,
                attemptNumber: attempt.attemptNumber,
                attemptId: attempt.id
              });
            });
          }
        });
      }
      
      // Check for attemptRecords directly on the details
      if (details.value.attemptRecords && Array.isArray(details.value.attemptRecords)) {
        console.log(`Found ${details.value.attemptRecords.length} direct attemptRecords`);
        records.push(...details.value.attemptRecords);
      }
      
      // Check for records directly on the details
      if (details.value.records && Array.isArray(details.value.records)) {
        console.log(`Found ${details.value.records.length} direct records`);
        records.push(...details.value.records);
      }
      
      console.log('Total records found:', records.length);
      return records;
    });

    const hasAttemptRecords = computed(() => {
      return attemptRecords.value.length > 0;
    });

    const filteredAnswers = computed(() => {
      if (!details.value?.answers) return [];
      
      let answers = details.value.answers;
      
      // Filter by essay only
      if (showEssayOnly.value) {
        answers = answers.filter(answer => isEssayQuestion(answer));
      }
      
      // Filter by search query
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        answers = answers.filter(answer => {
          const questionText = (answer.question?.questionText || answer.questionText || '').toLowerCase();
          const userAnswer = (answer.userAnswer || '').toLowerCase();
          return questionText.includes(query) || userAnswer.includes(query);
        });
      }
      
      return answers;
    });

    const canNavigatePrev = computed(() => {
      return currentStudentIndex.value > 0;
    });

    const canNavigateNext = computed(() => {
      return currentStudentIndex.value < totalStudents.value - 1;
    });

    const loadAnswers = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        console.log('Fetching exam answers:', {
          examId: parseInt(route.params.examId),
          studentId: parseInt(route.params.studentId)
        });
        
        const response = await getStudentExamAnswers(
          parseInt(route.params.examId),
          parseInt(route.params.studentId)
        );
        
        console.log('Student answers full response:', JSON.stringify(response));
        
        if (response) {
          // Ensure answers is always at least an empty array
          if (!response.answers) response.answers = [];
          
          details.value = response;
          manualScore.value = response.score?.score || 0;
          
          // Initialize essay grading status for each answer (after details is set)
          details.value.answers.forEach(answer => {
            const questionType = getQuestionType(answer);
            if (questionType === 'essay') {
              // Initialize essay scoring data
              answer.essayScore = answer.essayScore || 0;
              answer.teacherFeedback = answer.teacherFeedback || '';
              answer.isGraded = !!(answer.essayScore > 0 || answer.teacherFeedback);
            }
          });
          
          // Load existing essay scores from the backend
          await loadEssayScores();
          
          // Update total score display after loading essay scores
          updateTotalScoreDisplay();
          
          // Find the latest attempt with answers (most likely the last attempt)
          if (response.attempts && response.attempts.length > 0) {
            // Sort attempts by attemptNumber in descending order
            const sortedAttempts = [...response.attempts].sort((a, b) => 
              b.attemptNumber - a.attemptNumber
            );
            
            console.log('Sorted attempts:', sortedAttempts);
            
            // Set the latest attempt
            latestAttempt.value = sortedAttempts[0];
            
            // Check for records in each attempt
            let foundRecords = false;
            sortedAttempts.forEach(attempt => {
              if (attempt.records && attempt.records.length > 0) {
                console.log(`Found ${attempt.records.length} records in attempt #${attempt.attemptNumber}`);
                foundRecords = true;
              }
            });
            
            if (!foundRecords) {
              console.log('No attempt records found in attempts array, will try to fetch directly');
            }
          } else {
            console.log('No attempts found in response');
          }
          
          // Debug any attempt records that might be present
          if (response.attemptRecords) {
            console.log(`Found ${response.attemptRecords.length} attempt records directly on response`);
          }
          
          // Check the computed array to make sure it's finding records
          console.log('Computed attemptRecords length:', attemptRecords.value.length);
        } else {
          error.value = "Failed to load answers";
        }
      } catch (err) {
        error.value = err.message || "Failed to load answers";
        console.error('Error loading answers:', err);
      } finally {
        loading.value = false;
      }
    };

    const handleBack = () => {
      router.back();
    };

    const updateAnswerCorrectness = async (answerId, isCorrect) => {
      if (!answerId) return;
      
      try {
        isUpdating.value = true;
        const result = await updateStudentExamAnswer(answerId, isCorrect);
        
        // Update the local state
        const answer = details.value.answers.find(a => a.id === answerId);
        if (answer) {
          answer.isCorrect = isCorrect;
        }
        
        if (result && result.score) {
          details.value.score = result.score;
          manualScore.value = result.score.score;
        }
      } catch (err) {
        console.error('Error updating answer:', err);
        alert('Failed to update answer: ' + (err.message || 'Unknown error'));
      } finally {
        isUpdating.value = false;
      }
    };

    const updateManualScore = async () => {
      if (!isManualScoreValid.value) return;
      
      try {
        isUpdating.value = true;
        const result = await updateStudentExamScore(
          parseInt(route.params.examId),
          parseInt(route.params.studentId),
          manualScore.value
        );
        details.value.score = result.score;
      } catch (err) {
        console.error('Error updating score:', err);
      } finally {
        isUpdating.value = false;
      }
    };

    const formatQuestionType = (type) => {
      if (!type) return 'Unknown Type';
      
      return type
        .toLowerCase()
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    const formatDateTime = (dateTime) => {
      const date = new Date(dateTime);
      return date.toLocaleString();
    };

    const formatTimeSpent = (timeSpent) => {
      if (!timeSpent) return '--';
      
      const hours = Math.floor(timeSpent / 3600);
      const minutes = Math.floor((timeSpent % 3600) / 60);
      const seconds = timeSpent % 60;
      
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

    const getLastAttemptNumber = () => {
      if (!details.value?.attempts || details.value.attempts.length === 0) return '';
      
      const sortedAttempts = [...details.value.attempts].sort((a, b) => 
        b.attemptNumber - a.attemptNumber
      );
      
      return sortedAttempts[0].attemptNumber;
    };

    const getQuestionType = (answer) => {
      // Try to get question type from nested question object first
      if (answer.question && answer.question.questionType) {
        return answer.question.questionType;
      }
      // Fall back to direct property if available
      return answer.questionType || '';
    };

    const getOptions = (answer) => {
      // Try to get options from nested question object first
      if (answer.question && answer.question.options) {
        try {
          // Options may be stored as JSON string
          const options = typeof answer.question.options === 'string' 
            ? JSON.parse(answer.question.options)
            : answer.question.options;
          
          // Handle array or object format
          return Array.isArray(options) ? options : 
            (options && typeof options === 'object' ? Object.values(options) : []);
        } catch (e) {
          console.error('Error parsing options:', e);
          return [];
        }
      }
      
      // Fall back to direct property if available
      if (answer.options) {
        try {
          const options = typeof answer.options === 'string'
            ? JSON.parse(answer.options)
            : answer.options;
          
          return Array.isArray(options) ? options : 
            (options && typeof options === 'object' ? Object.values(options) : []);
        } catch (e) {
          console.error('Error parsing options:', e);
          return [];
        }
      }
      
      return [];
    };

    const hasOptions = (answer) => {
      return getOptions(answer).length > 0;
    };

    const getCorrectAnswer = (answer) => {
      // Try to get correct answer from nested question object first
      if (answer.question && answer.question.correctAnswer) {
        return answer.question.correctAnswer;
      }
      // Fall back to direct property if available
      return answer.correctAnswer || '';
    };

    const getImageUrl = (url) => {
      if (!url) return '';
      return getFullImageUrl(url);
    };

    const restoreAttemptRecord = async (recordId) => {
      try {
        console.log('Attempting to restore attempt record with ID:', recordId);
        isRestoringRecord.value = recordId;
        isUpdating.value = true;
        
        const result = await restoreAttemptScore(recordId);
        console.log('Restore API result:', result);
        
        if (result) {
          // Reload the data to get updated information
          await loadAnswers();
          
          // Show success message (you can implement a toast notification here)
          alert('Attempt record restored successfully.');
        }
      } catch (err) {
        console.error('Error restoring attempt record:', err);
        alert('Failed to restore attempt record: ' + (err.message || 'Unknown error'));
      } finally {
        isRestoringRecord.value = null;
        isUpdating.value = false;
      }
    };

    const previewAttemptRecord = async () => {
      if (!selectedAttemptRecord.value) {
        // If no record selected, clear preview and show current score
        isPreviewingAttempt.value = false;
        return;
      }
      
      try {
        isPreviewingAttempt.value = true;
        
        // Find the record in the existing records array
        const recordToPreview = attemptRecords.value.find(r => r.id === parseInt(selectedAttemptRecord.value));
        if (!recordToPreview) {
          console.error('Selected record not found:', selectedAttemptRecord.value);
          return;
        }
        
        console.log('Previewing attempt record:', recordToPreview);
        
        // If the record contains answersData, use it to show the answers
        if (recordToPreview.answersData) {
          // Display the record's score as a temporary preview
          const previewScore = {
            score: recordToPreview.score,
            total: recordToPreview.total,
            percentage: recordToPreview.percentage
          };
          
          // Store the original score to be able to restore it when clearing the preview
          if (!originalScore.value) {
            originalScore.value = { ...details.value.score };
          }
          
          // Update the displayed score with the preview data
          details.value.score = previewScore;
          
          // If answers data is available, update the answers display too
          try {
            const recordAnswers = typeof recordToPreview.answersData === 'string' 
              ? JSON.parse(recordToPreview.answersData) 
              : recordToPreview.answersData;
              
            if (Array.isArray(recordAnswers)) {
              // Store original answers for restoring later
              if (!originalAnswers.value) {
                originalAnswers.value = [...details.value.answers];
              }
              
              // Replace the current answers with the record's answers for preview
              details.value.answers = recordAnswers;
            }
          } catch (err) {
            console.error('Error parsing answers data:', err);
          }
        }
      } catch (err) {
        console.error('Error previewing attempt record:', err);
      }
    };

    const clearAttemptPreview = () => {
      selectedAttemptRecord.value = null;
      isPreviewingAttempt.value = false;
      
      // Restore original score and answers if they were saved
      if (originalScore.value) {
        details.value.score = originalScore.value;
        originalScore.value = null;
      }
      
      if (originalAnswers.value) {
        details.value.answers = originalAnswers.value;
        originalAnswers.value = null;
      }
    };

    const toggleAttemptHistory = () => {
      isAttemptHistoryOpen.value = !isAttemptHistoryOpen.value;
    };

    // New methods for enhanced functionality
    const isEssayQuestion = (answer) => {
      const questionType = getQuestionType(answer);
      return questionType === 'essay';
    };

    const getWordCount = (text) => {
      if (!text || typeof text !== 'string') return 0;
      return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const getQuestionPoints = (answer) => {
      return answer.question?.points || answer.points || 1;
    };

    const toggleEssayFilter = () => {
      showEssayOnly.value = !showEssayOnly.value;
    };

    const navigateStudent = (direction) => {
      if (direction === 'prev' && canNavigatePrev.value) {
        const prevStudentId = studentList.value[currentStudentIndex.value - 1];
        currentStudentIndex.value--;
        router.push({
          name: 'StudentAnswerDetails',
          params: {
            examId: route.params.examId,
            studentId: prevStudentId
          }
        });
      } else if (direction === 'next' && canNavigateNext.value) {
        const nextStudentId = studentList.value[currentStudentIndex.value + 1];
        currentStudentIndex.value++;
        router.push({
          name: 'StudentAnswerDetails',
          params: {
            examId: route.params.examId,
            studentId: nextStudentId
          }
        });
      }
    };

    const saveEssayGrade = async (answer) => {
      try {
        isUpdating.value = true;
        const userId = parseInt(route.params.studentId);
        const examId = parseInt(route.params.examId);
        const questionId = answer.questionId;
        const score = answer.essayScore || 0;
        const maxScore = getQuestionPoints(answer);
        const feedback = answer.teacherFeedback || '';

        // Validate score
        if (score < 0 || score > maxScore) {
          const Swal = require('sweetalert2');
          Swal.fire({
            icon: 'error',
            title: 'Invalid Score',
            text: `Score must be between 0 and ${maxScore} points.`,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            toast: true
          });
          return;
        }

        // Get attempt ID if available
        const attemptId = latestAttempt.value?.id || null;
        
        const result = await scoreEssayQuestion(userId, examId, questionId, score, maxScore, feedback, attemptId);
        
        // Mark as graded
        answer.isGraded = true;
        
        // Show success message with Sweet Alert
        const Swal = require('sweetalert2');
        Swal.fire({
          icon: 'success',
          title: 'Essay Graded!',
          text: `Score: ${score}/${maxScore} points`,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          toast: true
        });
        
        console.log('Essay scoring result:', result);
        
        // Reload essay scores to ensure UI is updated
        await loadEssayScores();
        
        // Reload the main answers to get updated score
        await loadAnswers();
      } catch (err) {
        console.error('Error saving essay grade:', err);
        const Swal = require('sweetalert2');
        Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text: 'Failed to save essay grade: ' + (err.message || 'Unknown error'),
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000,
          timerProgressBar: true,
          toast: true
        });
      } finally {
        isUpdating.value = false;
      }
    };

    const loadEssayScores = async () => {
      try {
        const examId = parseInt(route.params.examId);
        const userId = parseInt(route.params.studentId);
        
        // Get essay scores for this specific user and exam
        const essayScores = await getEssayScores(examId, userId);
        
        if (essayScores && Array.isArray(essayScores)) {
          // Update answer objects with essay score data
          details.value.answers.forEach(answer => {
            if (getQuestionType(answer) === 'essay') {
              const essayScore = essayScores.find(score => 
                score.questionId === answer.questionId && score.userId === userId
              );
              
              if (essayScore) {
                answer.essayScore = essayScore.score;
                answer.teacherFeedback = essayScore.feedback || '';
                answer.isGraded = true;
                console.log(`Loaded essay score for question ${answer.questionId}:`, essayScore);
              }
            }
          });
          
          // Calculate and update the total score display
          updateTotalScoreDisplay();
        }
      } catch (err) {
        console.error('Error loading essay scores:', err);
        // Don't show error to user for this background operation
      }
    };

    const updateTotalScoreDisplay = () => {
      if (!details.value?.answers) return;
      
      // Calculate regular question points (non-essay)
      const regularQuestions = details.value.answers.filter(answer => 
        getQuestionType(answer) !== 'essay'
      );
      const regularPointsEarned = regularQuestions.filter(answer => answer.isCorrect).length;
      const regularPointsPossible = regularQuestions.length;
      
      // Calculate essay points
      const essayQuestions = details.value.answers.filter(answer => 
        getQuestionType(answer) === 'essay'
      );
      const essayPointsEarned = essayQuestions.reduce((total, answer) => 
        total + (answer.essayScore || 0), 0
      );
      const essayPointsPossible = essayQuestions.reduce((total, answer) => 
        total + getQuestionPoints(answer), 0
      );
      
      // Calculate combined totals
      const totalPointsEarned = regularPointsEarned + essayPointsEarned;
      const totalPointsPossible = regularPointsPossible + essayPointsPossible;
      const totalPercentage = totalPointsPossible > 0 
        ? Math.round((totalPointsEarned / totalPointsPossible) * 100 * 10) / 10 
        : 0;
      
      // Update the score display
      if (details.value.score) {
        details.value.score.score = totalPointsEarned;
        details.value.score.total = totalPointsPossible;
        details.value.score.percentage = totalPercentage;
      }
      
      // Update manual score input
      manualScore.value = totalPointsEarned;
      
      console.log(`Updated total score display: ${totalPointsEarned}/${totalPointsPossible} (${totalPercentage}%)`);
    };

    const getQuestionNumber = (answer) => {
      if (!details.value?.answers) return answer.questionId;
      
      // Find the index of this answer in the answers array and add 1 for human-readable numbering
      const index = details.value.answers.findIndex(a => a.questionId === answer.questionId);
      return index >= 0 ? index + 1 : answer.questionId;
    };

    const initializeNavigation = () => {
      // Get student list from route state or localStorage
      const state = router.currentRoute.value.state;
      if (state && state.studentList) {
        studentList.value = state.studentList;
        totalStudents.value = state.studentList.length;
        const currentStudentId = parseInt(route.params.studentId);
        currentStudentIndex.value = state.studentList.findIndex(id => id === currentStudentId);
      } else {
        // Fallback: try to get from localStorage or set defaults
        const savedStudentList = localStorage.getItem('examStudentList');
        if (savedStudentList) {
          try {
            studentList.value = JSON.parse(savedStudentList);
            totalStudents.value = studentList.value.length;
            const currentStudentId = parseInt(route.params.studentId);
            currentStudentIndex.value = studentList.value.findIndex(id => id === currentStudentId);
          } catch (e) {
            console.error('Error parsing saved student list:', e);
          }
        }
      }
    };

    // Add watcher to help with debugging
    watch(details, (newVal) => {
      console.log('Details updated:', {
        hasDetails: !!newVal,
        hasAnswers: newVal?.answers?.length > 0,
        answersCount: newVal?.answers?.length || 0
      });
    });

    onMounted(() => {
      console.log('Component mounted, loading initial answers');
      initializeNavigation();
      loadAnswers();
    });

    return {
      details,
      loading,
      error,
      isUpdating,
      manualScore,
      isManualScoreValid,
      loadAnswers,
      updateAnswerCorrectness,
      updateManualScore,
      formatQuestionType,
      handleBack,
      formatDateTime,
      formatTimeSpent,
      latestAttempt,
      getLastAttemptNumber,
      getQuestionType,
      getOptions,
      hasOptions,
      getCorrectAnswer,
      getImageUrl,
      restoreAttemptRecord,
      isRestoringRecord,
      attemptRecords,
      hasAttemptRecords,
      selectedAttemptRecord,
      isPreviewingAttempt,
      previewAttemptRecord,
      clearAttemptPreview,
      originalScore,
      originalAnswers,
      isAttemptHistoryOpen,
      toggleAttemptHistory,
      // New properties and methods
      showEssayOnly,
      searchQuery,
      currentStudentIndex,
      totalStudents,
      studentList,
      filteredAnswers,
      canNavigatePrev,
      canNavigateNext,
      isEssayQuestion,
      getWordCount,
      getQuestionPoints,
      toggleEssayFilter,
      navigateStudent,
      saveEssayGrade,
      loadEssayScores,
      updateTotalScoreDisplay,
      initializeNavigation,
      getQuestionNumber,
    };
  }
};
</script>

<style scoped>
.student-answer-details {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
  background: #f5f7fa;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
  gap: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 1;
}

.header-center {
  display: flex;
  justify-content: center;
  flex: 1;
}

.controls-row {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-controls {
  display: flex;
  gap: 10px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.filter-btn:hover {
  background: #e8f5e9;
  border-color: #4CAF50;
  color: #2e7d32;
}

.filter-btn.active {
  background: #e8f5e9;
  border-color: #4CAF50;
  color: #2e7d32;
}

.search-control {
  flex: 1;
  min-width: 200px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box .material-icons {
  position: absolute;
  left: 12px;
  color: #666;
  font-size: 20px;
}

.search-input {
  width: 100%;
  padding: 10px 16px 10px 45px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #4CAF50;
}

.student-navigation {
  display: flex;
  align-items: center;
  gap: 15px;
  background: white;
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.nav-btn:hover:not(:disabled) {
  background: #388E3C;
  transform: translateY(-2px);
}

.nav-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
}

.student-counter {
  font-weight: 600;
  color: #159750;
  font-size: 1.1rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #e8f5e9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #159750;
  font-weight: 600;
  box-shadow: 0 2px 5px rgba(21, 151, 80, 0.1);
}

.back-button:hover {
  background: #c8e6c9;
  transform: translateX(-5px);
  box-shadow: 0 4px 8px rgba(21, 151, 80, 0.2);
}

.back-button .material-icons {
  font-size: 20px;
}

.student-info {
  text-align: right;
}

.student-info h2 {
  margin: 0;
  color: #159750;
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.sub-info {
  color: #666;
  margin-top: 5px;
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 0.9rem;
}

.exam-info {
  background: white;
  margin-bottom: 20px;
}

.exam-info h3 {
  margin: 0;
  color: #159750;
  font-size: 1.5rem;
  font-weight: 700;
}

.test-code {
  color: #666;
  margin: 8px 0 0;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Header Card */
.header-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.1);
  margin-bottom: 30px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(0,0,0,0.05);
}

.header-card:hover {
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.header-card-top {
  padding: 25px;
  background: linear-gradient(to right, rgba(21, 151, 80, 0.05), rgba(255, 255, 255, 0));
  border-bottom: 1px solid #f0f0f0;
}

.header-card-content {
  padding: 25px;
}

.info-section {
  margin-top: 20px;
}

.info-section h4 {
  margin: 0 0 15px 0;
  color: #159750;
  font-size: 1.1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  padding-left: 15px;
}

.info-section h4::before {
  content: '';
  display: block;
  width: 4px;
  height: 18px;
  background: #159750;
  border-radius: 2px;
  position: absolute;
  left: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

/* Score Display */
.score-display-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 30px;
  justify-content: space-between;
  width: 100%;
  margin-top: 15px;
}

.current-score {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.score-value-container {
  display: flex;
  align-items: baseline;
  white-space: nowrap;
  background: #f8f9fa;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);
}

.score-value {
  font-size: 2.5em;
  font-weight: 700;
  color: #159750;
  text-shadow: 0 1px 1px rgba(0,0,0,0.1);
}

.score-total {
  font-size: 1.5em;
  color: #666;
}

.score-percentage {
  color: #159750;
  margin-left: 10px;
  font-weight: 600;
  font-size: 1.2em;
}

.manual-score {
  position: relative;
}

.score-input {
  display: flex;
  gap: 10px;
  align-items: center;
}

.score-input input {
  width: 80px;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1em;
  transition: all 0.3s ease;
  text-align: center;
  font-weight: 600;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

.score-input input:focus {
  border-color: #159750;
  box-shadow: 0 0 0 3px rgba(21, 151, 80, 0.1);
  outline: none;
}

.score-input button {
  padding: 12px 20px;
  background: linear-gradient(135deg, #159750 0%, #0d6b38 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(21, 151, 80, 0.2);
}

.score-input button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(21, 151, 80, 0.3);
}

.score-input button:disabled {
  background: #e2e8f0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.error-text {
  color: #f44336;
  font-size: 0.8em;
  margin-top: 5px;
  position: absolute;
  right: 0;
}

/* Exam settings styling */
.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  border: 1px solid rgba(0,0,0,0.03);
}

.setting-item:hover {
  background: #f1f5f9;
  border-color: rgba(0,0,0,0.08);
}

.setting-item .material-icons {
  color: #159750;
  font-size: 1.3em;
  opacity: 0.9;
}

/* Latest attempt info styling */
.latest-attempt-card {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-left: 4px solid #159750;
  box-shadow: 0 3px 10px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.latest-attempt-card:hover {
  background: #f1f5f9;
  box-shadow: 0 5px 15px rgba(0,0,0,0.08);
}

.latest-attempt-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.attempt-detail {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attempt-detail .material-icons {
  color: #159750;
  font-size: 1.2em;
}

.attempt-status {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.8em;
  font-weight: 600;
  background: #ffebee;
  color: #dc2626;
  text-align: center;
  box-shadow: 0 2px 5px rgba(220, 38, 38, 0.1);
}

.attempt-status.completed {
  background: #e8f5e9;
  color: #159750;
  box-shadow: 0 2px 5px rgba(21, 151, 80, 0.1);
}

/* Answers list - update margin to work with new design */
.answers-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.answer-item {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 25px rgba(0,0,0,0.08);
  overflow: hidden;
  border-left: 5px solid transparent;
  transition: all 0.3s ease;
}

.answer-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.12);
}

.answer-item[data-correct="true"] {
  border-left-color: #159750;
  background: linear-gradient(to right, rgba(21, 151, 80, 0.05), white);
}

.answer-item[data-correct="false"] {
  border-left-color: #dc2626;
  background: linear-gradient(to right, rgba(220, 38, 38, 0.05), white);
}

.question-section {
  padding: 25px;
  border-bottom: 1px solid #e2e8f0;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-number {
  font-weight: 700;
  color: #159750;
  font-size: 1.1rem;
}

.question-type {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.85em;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.question-type.multiple-choice {
  background: #e8f5e9;
  color: #159750;
  box-shadow: 0 2px 5px rgba(21, 151, 80, 0.1);
}

.question-type.true-false {
  background: #e3f2fd;
  color: #1976d2;
  box-shadow: 0 2px 5px rgba(25, 118, 210, 0.1);
}

.question-type.short-answer {
  background: #f3e5f5;
  color: #7b1fa2;
  box-shadow: 0 2px 5px rgba(123, 31, 162, 0.1);
}

.question-type.essay {
  background: #fff3e0;
  color: #ef6c00;
  box-shadow: 0 2px 5px rgba(239, 108, 0, 0.1);
}

.question-text {
  margin: 16px 0;
  color: #333;
  line-height: 1.6;
  font-size: 1.05rem;
}

.question-image {
  margin: 20px 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  text-align: center;
}

.question-image img {
  max-width: 100%;
  max-height: 400px;
  width: auto;
  height: auto;
  border-radius: 8px;
  display: inline-block;
  transition: all 0.3s ease;
  object-fit: contain;
}

.question-image img:hover {
  transform: scale(1.02);
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
}

.option {
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;
  background: #f8f9fa;
}

.option:hover {
  background: #f1f5f9;
}

.option.correct-option {
  border-color: #4caf50;
  background: #e8f5e9;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
}

.option.selected-option {
  border-color: #2196f3;
  background: #e3f2fd;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.1);
}

.answer-section {
  padding: 25px;
}

/* Essay-specific styles */
.answer-item.essay-question {
  border-left-color: #ef6c00;
  background: linear-gradient(to right, rgba(239, 108, 0, 0.05), white);
}

.essay-answer-section {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.essay-response {
  background: #fafafa;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e0e0e0;
}

.essay-text {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  min-height: 100px;
  white-space: pre-wrap;
  line-height: 1.6;
  font-family: 'Inter', sans-serif;
}

.essay-text.no-answer {
  color: #999;
  font-style: italic;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.essay-meta {
  display: flex;
  gap: 20px;
  margin-top: 10px;
  font-size: 0.9rem;
  color: #666;
}

.word-count, .char-count {
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
}

.essay-scoring {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e0e0e0;
}

.essay-score-input {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.essay-score-input label {
  font-weight: 600;
  color: #444;
  min-width: 60px;
}

.score-input-field {
  width: 80px;
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
  font-size: 1rem;
}

.score-input-field:focus {
  outline: none;
  border-color: #4CAF50;
}

.max-points {
  color: #666;
  font-weight: 500;
}

.essay-feedback {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.essay-feedback label {
  font-weight: 600;
  color: #444;
}

.feedback-textarea {
  width: 100%;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
}

.feedback-textarea:focus {
  outline: none;
  border-color: #4CAF50;
}

.feedback-textarea::placeholder {
  color: #999;
}

.essay-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.grade-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.grade-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #388E3C 0%, #2E7D32 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(76, 175, 80, 0.4);
}

.grade-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.grade-btn.graded {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

.grade-btn.graded:hover:not(:disabled) {
  background: linear-gradient(135deg, #F57C00 0%, #E65100 100%);
  box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
}

.grade-status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4CAF50;
  font-weight: 600;
  font-size: 0.9rem;
}

.grade-status .material-icons {
  font-size: 18px;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.answer-details {
  margin-bottom: 25px;
}

.answer-label {
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.student-answer {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 8px 0;
  border: 1px solid transparent;
  font-size: 1rem;
  box-shadow: inset 0 2px 5px rgba(0,0,0,0.03);
}

.student-answer.correct {
  background: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.1);
}

.student-answer.incorrect {
  background: #ffebee;
  border-color: #f44336;
  color: #c62828;
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.1);
}

.student-answer.no-answer {
  color: #999;
  font-style: italic;
}

.correct-answer {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: #f1f5f9;
  padding: 15px;
  border-radius: 8px;
  border-left: 3px solid #159750;
}

.answer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.correctness-toggle {
  display: flex;
  gap: 15px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.toggle-btn.correct {
  background: #e8f5e9;
  color: #159750;
}

.toggle-btn.correct:hover {
  background: #c8e6c9;
  box-shadow: 0 6px 15px rgba(76, 175, 80, 0.2);
  transform: translateY(-2px);
}

.toggle-btn.correct.active {
  background: #159750;
  color: white;
  box-shadow: 0 6px 15px rgba(21, 151, 80, 0.25);
}

.toggle-btn.incorrect {
  background: #ffebee;
  color: #dc2626;
}

.toggle-btn.incorrect:hover {
  background: #ffcdd2;
  box-shadow: 0 6px 15px rgba(220, 38, 38, 0.2);
  transform: translateY(-2px);
}

.toggle-btn.incorrect.active {
  background: #dc2626;
  color: white;
  box-shadow: 0 6px 15px rgba(220, 38, 38, 0.25);
}

.toggle-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05) !important;
}

.loading {
  text-align: center;
  padding: 60px;
  color: #666;
  font-size: 1.2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.1);
  margin: 40px auto;
}

.error {
  text-align: center;
  padding: 60px;
  color: #dc2626;
  background: #ffebee;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.1);
  margin: 40px auto;
  border-left: 5px solid #dc2626;
}

.retry-btn {
  margin-top: 20px;
  padding: 12px 30px;
  background: #159750;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(21, 151, 80, 0.2);
}

.retry-btn:hover {
  background: #0d6b38;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(21, 151, 80, 0.3);
}

.attempt-badge {
  background: #e8f5e9;
  color: #159750;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  margin-top: 10px;
  font-weight: 600;
  display: inline-block;
  box-shadow: 0 2px 5px rgba(21, 151, 80, 0.1);
}

/* Add new styles for attempt history */
.attempt-history {
  margin-top: 20px;
}

.attempt-history-header {
  cursor: pointer;
  user-select: none;
}

.attempt-history-header h4 {
  display: flex;
  align-items: center;
  gap: 8px;
}

.attempt-history-header:hover h4 {
  color: #0d6b38;
}

.attempt-records-list {
  max-height: 1000px;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
}

.attempt-records-list.collapsed {
  max-height: 0;
}

.attempt-records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}

.attempt-record-item {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid #2196f3;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
}

.attempt-record-item:hover {
  background: #f1f5f9;
  box-shadow: 0 4px 8px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.attempt-record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.attempt-number {
  font-weight: 600;
  color: #2196f3;
  font-size: 0.95rem;
}

.attempt-score {
  background: #e8f5e9;
  color: #159750;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.attempt-record-details {
  display: flex;
  gap: 16px;
}

.attempt-record-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #555;
}

.attempt-record-detail .material-icons {
  font-size: 16px;
  color: #777;
}

.attempt-record-actions {
  display: flex;
  gap: 10px;
}

.restore-attempt-btn {
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

.restore-attempt-btn:hover:not(:disabled) {
  background: #1976d2;
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3);
  transform: translateY(-1px);
}

.restore-attempt-btn:disabled {
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

/* Add styles for attempt selection dropdown and preview buttons */
.attempt-selector {
  margin-bottom: 20px;
}

.attempt-preview-container {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.attempt-dropdown {
  flex-grow: 1;
  max-width: 400px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: white;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.attempt-dropdown:focus {
  outline: none;
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.clear-preview-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
  box-shadow: 0 2px 5px rgba(244, 67, 54, 0.2);
}

.clear-preview-btn:hover {
  background: #d32f2f;
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
  transform: translateY(-1px);
}

/* Add preview indicator in the score display container */
.preview-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #ff9800;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 10px;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
  animation: pulse 1.5s infinite alternate ease-in-out;
}

.preview-indicator .material-icons {
  font-size: 18px;
}

.attempt-preview-badge {
  background: #ff9800;
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  margin-top: 10px;
  font-weight: 600;
  display: inline-block;
  box-shadow: 0 2px 5px rgba(255, 152, 0, 0.3);
}

@keyframes pulse {
  0% { opacity: 0.8; transform: scale(1); }
  100% { opacity: 1; transform: scale(1.05); }
}

/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .student-answer-details {
    padding: 16px;
  }
  
  .header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    gap: 16px;
  }
  
  .header-left {
    gap: 12px;
  }
  
  .controls-row {
    gap: 16px;
  }
  
  .filter-btn {
    padding: 8px 14px;
    font-size: 0.9rem;
    gap: 6px;
  }
  
  .search-input {
    padding: 8px 14px 8px 40px;
    font-size: 0.9rem;
  }
  
  .search-box .material-icons {
    left: 10px;
    font-size: 18px;
  }
  
  .student-navigation {
    padding: 10px 16px;
    gap: 12px;
  }
  
  .nav-btn {
    padding: 8px 14px;
    font-size: 0.9rem;
    gap: 6px;
  }
  
  .student-counter {
    font-size: 1rem;
  }
  
  .back-button {
    padding: 8px 16px;
    font-size: 0.9rem;
    gap: 6px;
  }
  
  .back-button .material-icons {
    font-size: 18px;
  }
  
  .student-info h2 {
    font-size: 1.6rem;
  }
  
  .sub-info {
    font-size: 0.85rem;
    gap: 8px;
  }
  
  .header-card {
    border-radius: 14px;
    margin-bottom: 24px;
  }
  
  .header-card-top {
    padding: 20px;
  }
  
  .header-card-content {
    padding: 20px;
  }
  
  .info-section h4 {
    font-size: 1rem;
    margin-bottom: 12px;
  }
  
  .info-grid {
    gap: 12px;
  }
  
  .setting-item {
    padding: 12px;
    font-size: 0.9rem;
    gap: 10px;
  }
  
  .setting-item .material-icons {
    font-size: 1.2em;
  }
  
  .latest-attempt-card {
    padding: 14px;
  }
  
  .attempt-detail {
    gap: 6px;
  }
  
  .attempt-detail .material-icons {
    font-size: 1.1em;
  }
  
  .score-display-container {
    gap: 24px;
  }
  
  .score-value {
    font-size: 2.2em;
  }
  
  .score-total {
    font-size: 1.3em;
  }
  
  .score-percentage {
    font-size: 1.1em;
    margin-left: 8px;
  }
  
  .score-input input {
    width: 70px;
    padding: 10px;
    font-size: 0.9em;
  }
  
  .score-input button {
    padding: 10px 16px;
    font-size: 0.85rem;
  }
  
  .answers-list {
    gap: 20px;
  }
  
  .answer-item {
    border-radius: 14px;
  }
  
  .question-section,
  .answer-section {
    padding: 20px;
  }
  
  .question-header {
    margin-bottom: 12px;
  }
  
  .question-number {
    font-size: 1rem;
  }
  
  .question-type {
    padding: 5px 14px;
    font-size: 0.8em;
  }
  
  .question-text {
    font-size: 1rem;
    margin: 14px 0;
  }
  
  .question-image img {
    max-height: 350px;
  }
  
  .options {
    gap: 8px;
    margin-top: 14px;
  }
  
  .option {
    padding: 10px 14px;
  }
  
  .answer-label {
    font-size: 0.9rem;
    margin-bottom: 6px;
  }
  
  .student-answer {
    padding: 12px;
    font-size: 0.95rem;
  }
  
  .correct-answer {
    padding: 12px;
    margin-top: 14px;
  }
  
  .toggle-btn {
    padding: 10px 20px;
    font-size: 0.9rem;
    gap: 8px;
  }
  
  .toggle-btn .material-icons {
    font-size: 1.1rem;
  }
  
  /* Essay styles for 1536px */
  .essay-answer-section {
    gap: 20px;
  }
  
  .essay-response {
    padding: 16px;
  }
  
  .essay-text {
    padding: 12px;
    min-height: 90px;
    font-size: 0.95rem;
  }
  
  .essay-meta {
    gap: 16px;
    font-size: 0.85rem;
  }
  
  .essay-scoring {
    padding: 16px;
  }
  
  .essay-score-input {
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .essay-score-input label {
    font-size: 0.9rem;
    min-width: 55px;
  }
  
  .score-input-field {
    width: 70px;
    padding: 6px 10px;
    font-size: 0.9rem;
  }
  
  .max-points {
    font-size: 0.9rem;
  }
  
  .essay-feedback label {
    font-size: 0.9rem;
  }
  
  .feedback-textarea {
    padding: 12px;
    font-size: 0.9rem;
    min-height: 70px;
  }
  
  .essay-actions {
    margin-top: 16px;
    padding-top: 12px;
  }
  
  .grade-btn {
    padding: 10px 20px;
    font-size: 0.9rem;
    gap: 6px;
  }
  
  .grade-status {
    font-size: 0.85rem;
  }
  
  .grade-status .material-icons {
    font-size: 16px;
  }
  
  /* Attempt history styles */
  .attempt-record-item {
    padding: 12px;
  }
  
  .attempt-record-header {
    margin-bottom: 6px;
  }
  
  .attempt-number {
    font-size: 0.9rem;
  }
  
  .attempt-score {
    font-size: 0.8rem;
    padding: 3px 6px;
  }
  
  .attempt-record-details {
    gap: 12px;
  }
  
  .attempt-record-detail {
    font-size: 0.8rem;
    gap: 5px;
  }
  
  .attempt-record-detail .material-icons {
    font-size: 14px;
  }
  
  .restore-attempt-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    gap: 5px;
  }
  
  .attempt-preview-container {
    gap: 12px;
  }
  
  .attempt-dropdown {
    padding: 10px;
    font-size: 0.9rem;
  }
  
  .clear-preview-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    gap: 5px;
  }
  
  .preview-indicator {
    padding: 6px 14px;
    font-size: 0.85rem;
    margin-bottom: 8px;
  }
  
  .preview-indicator .material-icons {
    font-size: 16px;
  }
  
  .attempt-preview-badge {
    padding: 5px 12px;
    font-size: 0.8rem;
    margin-top: 8px;
  }
}

/* Compact layout for 14-inch laptops and lower resolutions */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .student-answer-details {
    padding: 14px;
  }
  
  .header {
    margin-bottom: 20px;
    padding-bottom: 14px;
    gap: 14px;
  }
  
  .header-left {
    gap: 10px;
  }
  
  .controls-row {
    gap: 14px;
  }
  
  .filter-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    gap: 5px;
  }
  
  .search-input {
    padding: 6px 12px 6px 35px;
    font-size: 0.85rem;
  }
  
  .search-box .material-icons {
    left: 8px;
    font-size: 16px;
  }
  
  .student-navigation {
    padding: 8px 14px;
    gap: 10px;
  }
  
  .nav-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    gap: 5px;
  }
  
  .student-counter {
    font-size: 0.95rem;
  }
  
  .back-button {
    padding: 6px 14px;
    font-size: 0.85rem;
    gap: 5px;
  }
  
  .back-button .material-icons {
    font-size: 16px;
  }
  
  .student-info h2 {
    font-size: 1.4rem;
  }
  
  .sub-info {
    font-size: 0.8rem;
    gap: 6px;
  }
  
  .header-card {
    border-radius: 12px;
    margin-bottom: 20px;
  }
  
  .header-card-top {
    padding: 16px;
  }
  
  .header-card-content {
    padding: 16px;
  }
  
  .info-section h4 {
    font-size: 0.95rem;
    margin-bottom: 10px;
  }
  
  .info-grid {
    gap: 10px;
  }
  
  .setting-item {
    padding: 10px;
    font-size: 0.85rem;
    gap: 8px;
  }
  
  .setting-item .material-icons {
    font-size: 1.1em;
  }
  
  .latest-attempt-card {
    padding: 12px;
  }
  
  .attempt-detail {
    gap: 5px;
  }
  
  .attempt-detail .material-icons {
    font-size: 1em;
  }
  
  .score-display-container {
    gap: 20px;
  }
  
  .score-value {
    font-size: 2em;
  }
  
  .score-total {
    font-size: 1.2em;
  }
  
  .score-percentage {
    font-size: 1em;
    margin-left: 6px;
  }
  
  .score-input input {
    width: 60px;
    padding: 8px;
    font-size: 0.85em;
  }
  
  .score-input button {
    padding: 8px 14px;
    font-size: 0.8rem;
  }
  
  .answers-list {
    gap: 18px;
  }
  
  .answer-item {
    border-radius: 12px;
  }
  
  .question-section,
  .answer-section {
    padding: 16px;
  }
  
  .question-header {
    margin-bottom: 10px;
  }
  
  .question-number {
    font-size: 0.95rem;
  }
  
  .question-type {
    padding: 4px 12px;
    font-size: 0.75em;
  }
  
  .question-text {
    font-size: 0.95rem;
    margin: 12px 0;
  }
  
  .question-image img {
    max-height: 300px;
  }
  
  .options {
    gap: 6px;
    margin-top: 12px;
  }
  
  .option {
    padding: 8px 12px;
  }
  
  .answer-label {
    font-size: 0.85rem;
    margin-bottom: 5px;
  }
  
  .student-answer {
    padding: 10px;
    font-size: 0.9rem;
  }
  
  .correct-answer {
    padding: 10px;
    margin-top: 12px;
  }
  
  .toggle-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
    gap: 6px;
  }
  
  .toggle-btn .material-icons {
    font-size: 1rem;
  }
  
  /* Essay styles for 1366px */
  .essay-answer-section {
    gap: 18px;
  }
  
  .essay-response {
    padding: 14px;
  }
  
  .essay-text {
    padding: 10px;
    min-height: 80px;
    font-size: 0.9rem;
  }
  
  .essay-meta {
    gap: 14px;
    font-size: 0.8rem;
  }
  
  .essay-scoring {
    padding: 14px;
  }
  
  .essay-score-input {
    gap: 10px;
    margin-bottom: 14px;
  }
  
  .essay-score-input label {
    font-size: 0.85rem;
    min-width: 50px;
  }
  
  .score-input-field {
    width: 60px;
    padding: 5px 8px;
    font-size: 0.85rem;
  }
  
  .max-points {
    font-size: 0.85rem;
  }
  
  .essay-feedback label {
    font-size: 0.85rem;
  }
  
  .feedback-textarea {
    padding: 10px;
    font-size: 0.85rem;
    min-height: 60px;
  }
  
  .essay-actions {
    margin-top: 14px;
    padding-top: 10px;
  }
  
  .grade-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
    gap: 5px;
  }
  
  .grade-status {
    font-size: 0.8rem;
  }
  
  .grade-status .material-icons {
    font-size: 14px;
  }
  
  /* Attempt history styles */
  .attempt-record-item {
    padding: 10px;
  }
  
  .attempt-record-header {
    margin-bottom: 5px;
  }
  
  .attempt-number {
    font-size: 0.85rem;
  }
  
  .attempt-score {
    font-size: 0.75rem;
    padding: 2px 5px;
  }
  
  .attempt-record-details {
    gap: 10px;
  }
  
  .attempt-record-detail {
    font-size: 0.75rem;
    gap: 4px;
  }
  
  .attempt-record-detail .material-icons {
    font-size: 12px;
  }
  
  .restore-attempt-btn {
    padding: 5px 10px;
    font-size: 0.8rem;
    gap: 4px;
  }
  
  .attempt-preview-container {
    gap: 10px;
  }
  
  .attempt-dropdown {
    padding: 8px;
    font-size: 0.85rem;
  }
  
  .clear-preview-btn {
    padding: 5px 10px;
    font-size: 0.8rem;
    gap: 4px;
  }
  
  .preview-indicator {
    padding: 5px 12px;
    font-size: 0.8rem;
    margin-bottom: 6px;
  }
  
  .preview-indicator .material-icons {
    font-size: 14px;
  }
  
  .attempt-preview-badge {
    padding: 4px 10px;
    font-size: 0.75rem;
    margin-top: 6px;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .student-answer-details {
    padding: 12px;
  }
  
  .header {
    margin-bottom: 18px;
    padding-bottom: 12px;
    gap: 12px;
  }
  
  .header-left {
    gap: 8px;
  }
  
  .controls-row {
    gap: 12px;
  }
  
  .filter-btn {
    padding: 5px 10px;
    font-size: 0.8rem;
    gap: 4px;
  }
  
  .search-input {
    padding: 5px 10px 5px 30px;
    font-size: 0.8rem;
  }
  
  .search-box .material-icons {
    left: 6px;
    font-size: 14px;
  }
  
  .student-navigation {
    padding: 6px 12px;
    gap: 8px;
  }
  
  .nav-btn {
    padding: 5px 10px;
    font-size: 0.8rem;
    gap: 4px;
  }
  
  .student-counter {
    font-size: 0.9rem;
  }
  
  .back-button {
    padding: 5px 12px;
    font-size: 0.8rem;
    gap: 4px;
  }
  
  .back-button .material-icons {
    font-size: 14px;
  }
  
  .student-info h2 {
    font-size: 1.2rem;
  }
  
  .sub-info {
    font-size: 0.75rem;
    gap: 5px;
  }
  
  .header-card {
    border-radius: 10px;
    margin-bottom: 18px;
  }
  
  .header-card-top {
    padding: 14px;
  }
  
  .header-card-content {
    padding: 14px;
  }
  
  .info-section h4 {
    font-size: 0.9rem;
    margin-bottom: 8px;
  }
  
  .info-grid {
    gap: 8px;
  }
  
  .setting-item {
    padding: 8px;
    font-size: 0.8rem;
    gap: 6px;
  }
  
  .setting-item .material-icons {
    font-size: 1em;
  }
  
  .latest-attempt-card {
    padding: 10px;
  }
  
  .attempt-detail {
    gap: 4px;
  }
  
  .attempt-detail .material-icons {
    font-size: 0.9em;
  }
  
  .score-display-container {
    gap: 18px;
  }
  
  .score-value {
    font-size: 1.8em;
  }
  
  .score-total {
    font-size: 1.1em;
  }
  
  .score-percentage {
    font-size: 0.95em;
    margin-left: 5px;
  }
  
  .score-input input {
    width: 50px;
    padding: 6px;
    font-size: 0.8em;
  }
  
  .score-input button {
    padding: 6px 12px;
    font-size: 0.75rem;
  }
  
  .answers-list {
    gap: 16px;
  }
  
  .answer-item {
    border-radius: 10px;
  }
  
  .question-section,
  .answer-section {
    padding: 14px;
  }
  
  .question-header {
    margin-bottom: 8px;
  }
  
  .question-number {
    font-size: 0.9rem;
  }
  
  .question-type {
    padding: 3px 10px;
    font-size: 0.7em;
  }
  
  .question-text {
    font-size: 0.9rem;
    margin: 10px 0;
  }
  
  .question-image img {
    max-height: 250px;
  }
  
  .options {
    gap: 5px;
    margin-top: 10px;
  }
  
  .option {
    padding: 6px 10px;
  }
  
  .answer-label {
    font-size: 0.8rem;
    margin-bottom: 4px;
  }
  
  .student-answer {
    padding: 8px;
    font-size: 0.85rem;
  }
  
  .correct-answer {
    padding: 8px;
    margin-top: 10px;
  }
  
  .toggle-btn {
    padding: 6px 14px;
    font-size: 0.8rem;
    gap: 5px;
  }
  
  .toggle-btn .material-icons {
    font-size: 0.9rem;
  }
  
  /* Essay styles for 1280px */
  .essay-answer-section {
    gap: 16px;
  }
  
  .essay-response {
    padding: 12px;
  }
  
  .essay-text {
    padding: 8px;
    min-height: 70px;
    font-size: 0.85rem;
  }
  
  .essay-meta {
    gap: 12px;
    font-size: 0.75rem;
  }
  
  .essay-scoring {
    padding: 12px;
  }
  
  .essay-score-input {
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .essay-score-input label {
    font-size: 0.8rem;
    min-width: 45px;
  }
  
  .score-input-field {
    width: 50px;
    padding: 4px 6px;
    font-size: 0.8rem;
  }
  
  .max-points {
    font-size: 0.8rem;
  }
  
  .essay-feedback label {
    font-size: 0.8rem;
  }
  
  .feedback-textarea {
    padding: 8px;
    font-size: 0.8rem;
    min-height: 50px;
  }
  
  .essay-actions {
    margin-top: 12px;
    padding-top: 8px;
  }
  
  .grade-btn {
    padding: 6px 14px;
    font-size: 0.8rem;
    gap: 4px;
  }
  
  .grade-status {
    font-size: 0.75rem;
  }
  
  .grade-status .material-icons {
    font-size: 12px;
  }
  
  /* Attempt history styles */
  .attempt-record-item {
    padding: 8px;
  }
  
  .attempt-record-header {
    margin-bottom: 4px;
  }
  
  .attempt-number {
    font-size: 0.8rem;
  }
  
  .attempt-score {
    font-size: 0.7rem;
    padding: 1px 4px;
  }
  
  .attempt-record-details {
    gap: 8px;
  }
  
  .attempt-record-detail {
    font-size: 0.7rem;
    gap: 3px;
  }
  
  .attempt-record-detail .material-icons {
    font-size: 10px;
  }
  
  .restore-attempt-btn {
    padding: 4px 8px;
    font-size: 0.75rem;
    gap: 3px;
  }
  
  .attempt-preview-container {
    gap: 8px;
  }
  
  .attempt-dropdown {
    padding: 6px;
    font-size: 0.8rem;
  }
  
  .clear-preview-btn {
    padding: 4px 8px;
    font-size: 0.75rem;
    gap: 3px;
  }
  
  .preview-indicator {
    padding: 4px 10px;
    font-size: 0.75rem;
    margin-bottom: 5px;
  }
  
  .preview-indicator .material-icons {
    font-size: 12px;
  }
  
  .attempt-preview-badge {
    padding: 3px 8px;
    font-size: 0.7rem;
    margin-top: 5px;
  }
}

@media (max-width: 768px) {
  .student-answer-details {
    padding: 0rem;
    background: #f5f7fa;
  }

  .header {
    padding: 15px;
    margin-bottom: 15px;
    flex-direction: column;
    gap: 15px;
  }
  
  .header-left {
    order: 1;
  }
  
  .header-center {
    order: 2;
    margin: 10px 0;
  }
  
  .student-info {
    order: 3;
    text-align: center;
    width: 100%;
  }
  
  .controls-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .filter-controls {
    width: 100%;
    justify-content: center;
  }
  
  .search-control {
    width: 100%;
    min-width: auto;
  }
  
  .student-navigation {
    flex-direction: row;
    padding: 10px 15px;
    gap: 10px;
  }
  
  .nav-btn {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
  
  .student-counter {
    font-size: 1rem;
  }
  
  .back-button {
    padding: 8px 12px;
    font-size: 0.9rem;
    width: 100%;
    justify-content: center;
  }
  
  .back-button .material-icons {
    font-size: 18px;
  }
  
  .student-info {
    text-align: center;
    width: 100%;
  }
  
  .student-info h2 {
    font-size: 1.4rem;
  }
  
  .sub-info {
    font-size: 0.8rem;
    gap: 5px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .header-card {
    border-radius: 12px;
    margin-bottom: 20px;
    box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  }

  .header-card-top {
    padding: 20px;
  }

  .header-card-content {
    padding: 20px;
  }
  
  .score-display-container {
    flex-direction: column;
    gap: 20px;
  }
  
  .score-value {
    font-size: 2.2em;
  }
  
  .score-total {
    font-size: 1.3em;
  }
  
  .score-percentage {
    font-size: 1.1em;
    margin-left: 8px;
  }

  .manual-score {
    width: 100%;
  }
  
  .score-input {
    width: 100%;
  }
  
  .score-input input {
    flex-grow: 1;
    width: auto;
  }

  .error-text {
    position: static;
    margin-top: 8px;
    text-align: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .info-section {
    margin-top: 20px;
  }
  
  .info-section h4 {
    font-size: 1rem;
    margin-bottom: 12px;
  }
  
  .setting-item {
    padding: 12px;
    font-size: 0.9rem;
  }
  
  .answer-item {
    margin-bottom: 0;
    border-radius: 12px;
  }

  .answers-list {
    gap: 20px;
  }

  .question-section,
  .answer-section {
    padding: 20px;
  }

  .correctness-toggle {
    width: 100%;
  }

  .toggle-btn {
    flex: 1;
    justify-content: center;
    padding: 10px;
    font-size: 0.9rem;
  }
  
  .toggle-btn .material-icons {
    font-size: 1.1rem;
  }
  
  .loading, .error {
    padding: 40px 20px;
    margin: 20px auto;
  }
  
  .question-text {
    font-size: 1rem;
  }

  .attempt-record-item {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }
  
  .attempt-record-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .attempt-record-details {
    flex-direction: column;
    gap: 8px;
  }

  .attempt-preview-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .attempt-dropdown {
    max-width: none;
  }
  
  /* Essay mobile styles */
  .essay-answer-section {
    gap: 20px;
  }
  
  .essay-response {
    padding: 15px;
  }
  
  .essay-text {
    padding: 12px;
    min-height: 80px;
  }
  
  .essay-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .essay-scoring {
    padding: 15px;
  }
  
  .essay-score-input {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .essay-score-input label {
    min-width: auto;
  }
  
  .score-input-field {
    width: 100%;
    max-width: 120px;
    align-self: center;
  }
  
  .feedback-textarea {
    padding: 12px;
    min-height: 60px;
  }
  
  .essay-actions {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
    margin-top: 15px;
    padding-top: 15px;
  }
  
  .grade-btn {
    padding: 14px 20px;
    font-size: 1rem;
    justify-content: center;
  }
  
  .grade-status {
    justify-content: center;
  }
}

/* Style for no attempt records message */
.no-attempt-records {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  color: #666;
  font-style: italic;
}

.no-attempt-records .material-icons {
  color: #999;
}

.records-debug {
  margin-left: auto;
  background: #e0e0e0;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>