<template>
  <div class="task-visibility">
    <div class="header-container">
      <div class="header-content">
        <h1>
          Task Submissions
          <span class="material-icons">visibility</span>
        </h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Manage which students can see this task</p>
        </div>
      </div>
      <div class="header-background">ACCESS</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading student access...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadTaskVisibility" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <div v-else class="content-container">
      <div class="task-info-card">
        <div class="task-header">
          <div class="task-title-section">
            <h2>{{ task?.title }}</h2>
            <div class="task-meta-badges">
              <span class="meta-badge due-date">
                <span class="material-icons">event</span>
                Due: {{ formatDate(task?.dueDate) }}
                <span class="exact-date">({{ formatExactDate(task?.dueDate) }})</span>
              </span>
              <span class="meta-badge score">
                <span class="material-icons">stars</span>
                {{ task?.totalScore }} points
              </span>
            </div>
          </div>
        </div>
        
        <p class="task-description">{{ task?.description || 'No description provided' }}</p>
        
        <div v-if="task.files && task.files.length > 0" class="task-files-list">
          <div class="files-label">Attachments:</div>
          <div class="files-buttons">
            <div v-for="file in task.files" :key="file.id" class="file-button">
              <img :src="getFileIcon(file.fileName)" :alt="getFileType(file.fileName)" class="file-icon">
              <span class="file-name">{{ file.fileName }}</span>
              <div class="button-actions">
                <a :href="getFullFileUrl(file.fileUrl)" 
                   target="_blank" 
                   class="action-link view">
                  <span class="material-icons">visibility</span>
                </a>
                <a :href="getFullFileUrl(file.fileUrl)" 
                   download
                   class="action-link download">
                  <span class="material-icons">download</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="visibility-container">
        <div class="visibility-header">
          <div class="header-left">
            <h3>Students with Access</h3>
            <div class="view-toggle">
              <button 
                @click="viewMode = 'cards'" 
                :class="['toggle-btn', { active: viewMode === 'cards' }]"
              >
                <span class="material-icons">grid_view</span>
                Cards
              </button>
              <button 
                @click="viewMode = 'table'" 
                :class="['toggle-btn', { active: viewMode === 'table' }]"
              >
                <span class="material-icons">table_view</span>
                Table
              </button>
            </div>
          </div>
          <div class="visibility-actions">
            <button @click="showAddStudentsModal = true" class="action-btn add-btn">
              <span class="material-icons">person_add</span>
              Add Students
            </button>
            <button 
              @click="removeSelectedStudents" 
              class="action-btn remove-btn"
              :disabled="!selectedStudents.length"
            >
              <span class="material-icons">person_remove</span>
              Remove Selected
            </button>
          </div>
        </div>

        <!-- Search and Filter -->
        <div class="search-filter">
          <div class="search-box">
            <span class="material-icons">search</span>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search students..."
            >
          </div>
          <div class="filter-options">
            <label class="checkbox-label">
              <input type="checkbox" v-model="showBySection">
              Group by Section
            </label>
            <select v-model="statusFilter" class="status-filter">
              <option value="all">All Students</option>
              <option value="submitted">Submitted</option>
              <option value="no_submission">No Submission</option>
              <option value="late">Late Submission</option>
              <option value="on_time">On-time Submission</option>
            </select>
          </div>
        </div>

        <!-- Table View -->
        <div v-if="viewMode === 'table'" class="students-table">
          <table>
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    :checked="selectedStudents.length === filteredStudents.length"
                    @change="selectedStudents = $event.target.checked ? filteredStudents.map(s => s.lrn) : []"
                  >
                </th>
                <th>Name</th>
                <th>LRN</th>
                <th>Section</th>
                <th>Status</th>
                <th>Submission</th>
                <th>Score</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="student in filteredStudents" :key="student.id">
                <td>
                  <input 
                    type="checkbox" 
                    :value="student.lrn" 
                    v-model="selectedStudents"
                  >
                </td>
                <td>{{ student.lastName }}, {{ student.firstName }}</td>
                <td>{{ student.lrn }}</td>
                <td>Grade {{ student.gradeLevel }}-{{ student.section }}</td>
                <td>
                  <span :class="['status-badge', getSubmissionStatus(student).class]">
                    {{ getSubmissionStatus(student).text }}
                  </span>
                </td>
                <td>
                  <div class="submission-files">
                    <div v-if="student.submission">
                      <button v-if="student.submission.files.length > 1" 
                              @click="openFilesModal(student.submission)"
                              class="view-files-btn">
                        <span class="material-icons">folder_open</span>
                        View {{ student.submission.files.length }} Files
                      </button>
                      
                      <div v-else-if="student.submission.files.length === 1" class="file-item">
                        <img :src="getFileIcon(student.submission.files[0].fileName)" 
                             :alt="getFileType(student.submission.files[0].fileName)" 
                             class="file-icon">
                        <span class="file-name">{{ student.submission.files[0].fileName }}</span>
                        <div class="file-actions">
                          <a :href="getFullFileUrl(student.submission.files[0].fileUrl)" 
                             target="_blank" 
                             class="action-link view">
                            <span class="material-icons">visibility</span>
                            View
                          </a>
                          <a :href="getFullFileUrl(student.submission.files[0].fileUrl)" 
                             download
                             class="action-link download">
                            <span class="material-icons">download</span>
                          </a>
                        </div>
                      </div>
                      
                      <div v-else class="no-files">
                        <span class="material-icons">info</span>
                        No files submitted
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div v-if="hasSubmission(student)" class="table-score-input">
                    <input 
                      type="number" 
                      v-model="submissionScores[student.id]" 
                      :min="0" 
                      :max="task.totalScore"
                      class="score-input-field"
                    >
                    <span class="total-score">/ {{ task.totalScore }}</span>
                  </div>
                  <span v-else>-</span>
                </td>
                <td>
                  <div v-if="hasSubmission(student)" class="table-actions">
                    <textarea 
                      v-model="submissionComments[student.id]" 
                      placeholder="Add a comment..."
                      class="comment-input-field"
                    ></textarea>
                    <button 
                      @click="submitScore(student)" 
                      class="table-score-btn"
                    >
                      <span class="material-icons">save</span>
                      Save
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Cards View -->
        <div v-else class="cards-view">
          <div v-if="showBySection" class="sections-container">
            <div v-for="(students, section) in groupedStudents" :key="section" class="section-group">
              <div class="section-header">
                <h4>{{ section }}</h4>
                <span class="student-count">{{ students.length }} students</span>
              </div>
              <div class="students-grid">
                <div v-for="student in students" :key="student.id" class="student-card">
                  <div class="card-header">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        :value="student.lrn" 
                        v-model="selectedStudents"
                      >
                      <span class="student-name">
                        {{ student.lastName }}, {{ student.firstName }}
                      </span>
                    </label>
                    <span :class="['status-badge', getSubmissionStatus(student).class]">
                      {{ getSubmissionStatus(student).text }}
                    </span>
                  </div>
                  <div class="card-body">
                    <div class="student-info">
                      <p><strong>LRN:</strong> {{ student.lrn }}</p>
                      <p><strong>Section:</strong> Grade {{ student.gradeLevel }}-{{ student.section }}</p>
                      <p v-if="hasSubmission(student)">
                        <strong>Submitted:</strong> {{ formatSubmissionDate(getStudentSubmission(student)) }}
                      </p>
                      <p v-if="hasSubmission(student)">
                        <strong>Score:</strong> {{ getStudentScore(student) }}
                      </p>
                      <div class="submission-files">
                        <div v-if="student.submission">
                          <button v-if="student.submission.files.length > 1" 
                                  @click="openFilesModal(student.submission)"
                                  class="view-files-btn">
                            <span class="material-icons">folder_open</span>
                            View {{ student.submission.files.length }} Files
                          </button>
                          
                          <div v-else-if="student.submission.files.length === 1" class="file-item">
                            <img :src="getFileIcon(student.submission.files[0].fileName)" 
                                 :alt="getFileType(student.submission.files[0].fileName)" 
                                 class="file-icon">
                            <span class="file-name">{{ student.submission.files[0].fileName }}</span>
                            <div class="file-actions">
                              <a :href="getFullFileUrl(student.submission.files[0].fileUrl)" 
                                 target="_blank" 
                                 class="action-link view">
                                <span class="material-icons">visibility</span>
                                View
                              </a>
                              <a :href="getFullFileUrl(student.submission.files[0].fileUrl)" 
                                 download
                                 class="action-link download">
                                <span class="material-icons">download</span>
                              </a>
                            </div>
                          </div>
                          
                          <div v-else class="no-files">
                            <span class="material-icons">info</span>
                            No files submitted
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="card-actions">
                      <!-- Remove this button -->
                      <!-- <button 
                        v-if="hasSubmission(student)"
                        @click="viewSubmission(student)" 
                        class="action-btn view-btn"
                      >
                        <span class="material-icons">assignment</span>
                        View Submission
                      </button> -->
                    </div>
                    <div v-if="hasSubmission(student)" class="scoring-section">
                      <div class="score-input">
                        <label>Score:</label>
                        <input 
                          type="number" 
                          v-model="submissionScores[student.id]" 
                          :min="0" 
                          :max="task.totalScore"
                        >
                        <span class="total-score">/ {{ task.totalScore }}</span>
                      </div>
                      <div class="comment-input">
                        <label>Comment:</label>
                        <textarea 
                          v-model="submissionComments[student.id]" 
                          rows="2"
                          placeholder="Add a comment..."
                        ></textarea>
                      </div>
                      <button 
                        @click="submitScore(student)" 
                        class="score-btn"
                      >
                        <span class="material-icons">save</span>
                        Save Score
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Flat Cards Grid -->
          <div v-else class="students-grid">
            <div v-for="student in filteredStudents" :key="student.id" class="student-card">
              <div class="card-header">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    :value="student.lrn" 
                    v-model="selectedStudents"
                  >
                  <span class="student-name">
                    {{ student.lastName }}, {{ student.firstName }}
                  </span>
                </label>
                <span :class="['status-badge', getSubmissionStatus(student).class]">
                  {{ getSubmissionStatus(student).text }}
                </span>
              </div>
              <div class="card-body">
                <div class="student-info">
                  <p><strong>LRN:</strong> {{ student.lrn }}</p>
                  <p><strong>Section:</strong> Grade {{ student.gradeLevel }}-{{ student.section }}</p>
                  <p v-if="hasSubmission(student)">
                    <strong>Submitted:</strong> {{ formatSubmissionDate(getStudentSubmission(student)) }}
                  </p>
                  <p v-if="hasSubmission(student)">
                    <strong>Score:</strong> {{ getStudentScore(student) }}
                  </p>
                  <div class="submission-files">
                    <div v-if="student.submission">
                      <button v-if="student.submission.files.length > 1" 
                              @click="openFilesModal(student.submission)"
                              class="view-files-btn">
                        <span class="material-icons">folder_open</span>
                        View {{ student.submission.files.length }} Files
                      </button>
                      
                      <div v-else-if="student.submission.files.length === 1" class="file-item">
                        <img :src="getFileIcon(student.submission.files[0].fileName)" 
                             :alt="getFileType(student.submission.files[0].fileName)" 
                             class="file-icon">
                        <span class="file-name">{{ student.submission.files[0].fileName }}</span>
                        <div class="file-actions">
                          <a :href="getFullFileUrl(student.submission.files[0].fileUrl)" 
                             target="_blank" 
                             class="action-link view">
                            <span class="material-icons">visibility</span>
                            View
                          </a>
                          <a :href="getFullFileUrl(student.submission.files[0].fileUrl)" 
                             download
                             class="action-link download">
                            <span class="material-icons">download</span>
                          </a>
                        </div>
                      </div>
                      
                      <div v-else class="no-files">
                        <span class="material-icons">info</span>
                        No files submitted
                      </div>
                    </div>
                  </div>
                </div>
                <div class="card-actions">
                  <!-- Remove this button -->
                  <!-- <button 
                    v-if="hasSubmission(student)"
                    @click="viewSubmission(student)" 
                    class="action-btn view-btn"
                  >
                    <span class="material-icons">assignment</span>
                    View Submission
                  </button> -->
                </div>
                <div v-if="hasSubmission(student)" class="scoring-section">
                  <div class="score-input">
                    <label>Score:</label>
                    <input 
                      type="number" 
                      v-model="submissionScores[student.id]" 
                      :min="0" 
                      :max="task.totalScore"
                    >
                    <span class="total-score">/ {{ task.totalScore }}</span>
                  </div>
                  <div class="comment-input">
                    <label>Comment:</label>
                    <textarea 
                      v-model="submissionComments[student.id]" 
                      rows="2"
                      placeholder="Add a comment..."
                    ></textarea>
                  </div>
                  <button 
                    @click="submitScore(student)" 
                    class="score-btn"
                  >
                    <span class="material-icons">save</span>
                    Save Score
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Students Modal -->
    <div v-if="showAddStudentsModal" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>Add Students to Task</h3>
          <button @click="showAddStudentsModal = false" class="close-btn">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="loadingAvailableStudents" class="loading-state">
            <span class="material-icons-round rotating">sync</span>
            <p>Loading students...</p>
          </div>
          <div v-else-if="!availableStudents.length" class="empty-state">
            <span class="material-icons">school</span>
            <p>No additional students available</p>
          </div>
          <div v-else>
            <div class="search-box modal-search">
              <span class="material-icons">search</span>
              <input 
                type="text" 
                v-model="modalSearchQuery" 
                placeholder="Search students..."
              >
            </div>
            <div class="select-all">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  :checked="selectedAvailableStudents.length === availableStudents.length" 
                  @change="toggleSelectAllAvailable"
                >
                <strong>Select All Available Students</strong>
              </label>
            </div>
            <div class="students-list modal-students-list">
              <div v-for="student in filteredAvailableStudents" :key="student.id" class="student-item">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    :value="student.lrn" 
                    v-model="selectedAvailableStudents"
                  >
                  {{ student.firstName }} {{ student.lastName }}
                  <span class="student-info">
                    (LRN: {{ student.lrn }} | Grade {{ student.gradeLevel }}-{{ student.section }})
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAddStudentsModal = false" class="cancel-btn">
            Cancel
          </button>
          <button 
            @click="addSelectedStudents" 
            class="submit-btn"
            :disabled="!selectedAvailableStudents.length"
          >
            <span class="material-icons">person_add</span>
            Add {{ selectedAvailableStudents.length }} Students
          </button>
        </div>
      </div>
    </div>

    <!-- Add this modal for viewing multiple files -->
    <div v-if="showFilesModal" class="files-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Student Submission</h3>
          <button class="close-btn" @click="closeFilesModal">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="student-info-panel">
            <div class="student-avatar">
              <span class="avatar-text">{{ getInitials(selectedSubmission?.student) }}</span>
            </div>
            <div class="student-details">
              <h4>{{ selectedSubmission?.student?.lastName }}, {{ selectedSubmission?.student?.firstName }}</h4>
              <div class="student-meta">
                <div class="meta-item">
                  <span class="material-icons">badge</span>
                  <span>LRN: {{ selectedSubmission?.student?.lrn }}</span>
                </div>
                <div class="meta-item">
                  <span class="material-icons">school</span>
                  <span>Grade {{ selectedSubmission?.student?.gradeLevel }}-{{ selectedSubmission?.student?.section }}</span>
                </div>
                <div class="meta-item">
                  <span class="material-icons">event</span>
                  <span>Submitted: {{ formatSubmissionDate(selectedSubmission) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="files-header">
            <h4>Submitted Files ({{ selectedSubmission?.files?.length || 0 }})</h4>
          </div>
          
          <div class="files-grid">
            <div v-for="file in selectedSubmission.files" 
                 :key="file.id" 
                 class="file-item">
              <img :src="getFileIcon(file.fileName)" :alt="getFileType(file.fileName)" class="file-icon">
              <span class="file-name">{{ file.fileName }}</span>
              <div class="file-actions">
                <a :href="getFullFileUrl(file.fileUrl)" 
                   target="_blank" 
                   class="action-link view">
                  <span class="material-icons">visibility</span>
                  View
                </a>
                <a :href="getFullFileUrl(file.fileUrl)" 
                   download
                   class="action-link download">
                  <span class="material-icons">download</span>
                  Download
                </a>
              </div>
            </div>
          </div>
          
          <div class="scoring-section">
            <h4>Scoring</h4>
            <div class="score-form">
              <div class="score-input-group">
                <label for="modal-score">Score:</label>
                <div class="score-input-wrapper">
                  <input 
                    type="number" 
                    id="modal-score"
                    v-model="submissionScores[selectedSubmission?.student?.id]" 
                    :min="0" 
                    :max="task.totalScore"
                    class="score-input-field"
                  >
                  <span class="total-score">/ {{ task.totalScore }}</span>
                </div>
              </div>
              <div class="comment-input-group">
                <label for="modal-comment">Comment:</label>
                <textarea 
                  id="modal-comment"
                  v-model="submissionComments[selectedSubmission?.student?.id]" 
                  placeholder="Add feedback for the student..."
                  class="comment-input-field"
                  rows="3"
                ></textarea>
              </div>
              <button 
                @click="submitScoreFromModal()" 
                class="save-score-btn"
              >
                <span class="material-icons">save</span>
                Save Score
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { 
  getTaskVisibility, 
  getSubjectTasks, 
  getStudentsBySection,
  addTaskVisibility,
  removeTaskVisibility,
  getTaskSubmissions,
  scoreSubmission,
  getBaseApiUrl,
  getSectionsBySubject
} from '@/services/authService';
import { formatDistanceToNow } from 'date-fns';
// Import file icons
import csvIcon from '@/assets/FileIcons/csv.png';
import docIcon from '@/assets/FileIcons/doc.png';
import imgIcon from '@/assets/FileIcons/img.png';
import jpgIcon from '@/assets/FileIcons/jpg.png';
import pdfIcon from '@/assets/FileIcons/pdf.png';
import pngIcon from '@/assets/FileIcons/png.png';
import txtIcon from '@/assets/FileIcons/txt-file.png';
import videoIcon from '@/assets/FileIcons/video.png';
import xlsIcon from '@/assets/FileIcons/xls.png';
import zipIcon from '@/assets/FileIcons/zip.png';
import defaultIcon from '@/assets/FileIcons/doc.png';
import powerpointIcon from '@/assets/FileIcons/pptx.png';

const route = useRoute();

const subjectId = parseInt(route.params.subjectId);
const taskId = parseInt(route.params.taskId);
const task = ref(null);
const visibleStudents = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const selectedStudents = ref([]);
const showBySection = ref(false);

// Modal state
const showAddStudentsModal = ref(false);
const availableStudents = ref([]);
const loadingAvailableStudents = ref(false);
const selectedAvailableStudents = ref([]);
const modalSearchQuery = ref('');
const isSubmitting = ref(false);

const viewMode = ref('cards');
const statusFilter = ref('all');
const submissionScores = ref({});
const submissionComments = ref({});

// Add these new refs for the modal
const showFilesModal = ref(false);
const selectedSubmission = ref(null);

// Filter visible students based on search
const filteredStudents = computed(() => {
  let students = visibleStudents.value;
  
  // Apply search filter
  if (searchQuery.value) {
    const search = searchQuery.value.toLowerCase();
    students = students.filter(student => 
      student.firstName.toLowerCase().includes(search) || 
      student.lastName.toLowerCase().includes(search) || 
      student.lrn.toString().includes(search)
    );
  }
  
  // Apply status filter
  if (statusFilter.value !== 'all') {
    students = students.filter(student => {
      const status = getSubmissionStatus(student);
      switch (statusFilter.value) {
        case 'submitted':
          return hasSubmission(student);
        case 'no_submission':
          return !hasSubmission(student);
        case 'late':
          return status.class === 'late';
        case 'on_time':
          return status.class === 'submitted';
        case 'scored':
          return hasSubmission(student) && getStudentSubmission(student).score !== null;
        case 'unscored':
          return hasSubmission(student) && getStudentSubmission(student).score === null;
        default:
          return true;
      }
    });
  }
  
  return students;
});

// Group students by section
const groupedStudents = computed(() => {
  const groups = {};
  
  visibleStudents.value.forEach(student => {
    const sectionKey = `Grade ${student.gradeLevel}-${student.section}`;
    if (!groups[sectionKey]) {
      groups[sectionKey] = [];
    }
    groups[sectionKey].push(student);
  });
  
  return groups;
});

// Filter available students based on search
const filteredAvailableStudents = computed(() => {
  if (!modalSearchQuery.value) return availableStudents.value;
  
  const search = modalSearchQuery.value.toLowerCase();
  return availableStudents.value.filter(student => 
    student.firstName.toLowerCase().includes(search) || 
    student.lastName.toLowerCase().includes(search) || 
    student.lrn.toString().includes(search)
  );
});

// Format date for display
const formatDate = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Add this function to format the exact date and time
const formatExactDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Toggle select all available students
const toggleSelectAllAvailable = (event) => {
  if (event.target.checked) {
    selectedAvailableStudents.value = availableStudents.value.map(s => s.lrn);
  } else {
    selectedAvailableStudents.value = [];
  }
};

// Load task visibility data
const loadTaskVisibility = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // Get task details
    const taskData = await getSubjectTasks(subjectId);
    task.value = taskData.tasks.find(t => t.id === taskId);
    
    if (!task.value) {
      error.value = 'Task not found';
      return;
    }
    
    // Get visibility data
    const visibility = await getTaskVisibility(taskId);
    visibleStudents.value = visibility.map(v => v.student);
  } catch (err) {
    error.value = 'Failed to load task visibility. Please try again.';
    console.error('Error loading task visibility:', err);
  } finally {
    loading.value = false;
  }
};

// Load available students (not already in visibility)
const loadAvailableStudents = async () => {
  try {
    loadingAvailableStudents.value = true;
    
    // Get all students from the subject's sections
    const allStudents = [];
    
    // Get sections for this subject
    const sectionsData = await getSectionsBySubject(subjectId);
    const sections = sectionsData.sections || [];
    
    console.log('Subject sections:', sections);
    
    // Get students from each section
    for (const section of sections) {
      try {
        const sectionStudents = await getStudentsBySection(section.grade, section.section);
        allStudents.push(...sectionStudents);
      } catch (err) {
        console.error(`Error loading students for section ${section.grade}-${section.section}:`, err);
      }
    }
    
    console.log('All students from sections:', allStudents);
    
    // Filter out students who already have visibility
    const visibleLRNs = visibleStudents.value.map(s => s.lrn);
    availableStudents.value = allStudents.filter(s => !visibleLRNs.includes(s.lrn));
    
    console.log('Available students:', availableStudents.value);
    
  } catch (err) {
    console.error('Error loading available students:', err);
  } finally {
    loadingAvailableStudents.value = false;
  }
};

// Add selected students to task visibility
const addSelectedStudents = async () => {
  if (!selectedAvailableStudents.value.length) return;
  
  try {
    isSubmitting.value = true;
    await addTaskVisibility(taskId, selectedAvailableStudents.value);
    
    // Refresh the list and close modal
    await loadTaskData();
    showAddStudentsModal.value = false;
    selectedAvailableStudents.value = [];
  } catch (err) {
    console.error('Error adding students:', err);
    alert('Failed to add students. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

// Remove selected students from visibility
const removeSelectedStudents = async () => {
  if (!selectedStudents.value.length) return;
  
  try {
    isSubmitting.value = true;
    await removeTaskVisibility(taskId, selectedStudents.value);
    
    // Refresh the list
    await loadTaskVisibility();
    selectedStudents.value = [];
  } catch (err) {
    console.error('Error removing students:', err);
    alert('Failed to remove students. Please try again.');
  } finally {
    isSubmitting.value = false;
  }
};

// Watch for modal open to load available students
watch(showAddStudentsModal, (isOpen) => {
  if (isOpen) {
    loadAvailableStudents();
  }
});

// Get submission status for a student
const getSubmissionStatus = (student) => {
  const submission = getStudentSubmission(student);
  if (!submission) {
    return { text: 'No Submission', class: 'no-submission' };
  }
  
  const submittedDate = new Date(submission.submittedAt);
  const dueDate = new Date(task.value.dueDate);
  
  if (submittedDate > dueDate) {
    return { text: 'Late', class: 'late' };
  }
  
  if (submission.score !== null) {
    return { text: 'Scored', class: 'scored' };
  }
  
  return { text: 'Submitted', class: 'submitted' };
};

// Get student's submission
const getStudentSubmission = (student) => {
  return student.submission;
};

// Check if student has submitted
const hasSubmission = (student) => {
  return !!student.submission;
};

// Get student's score
const getStudentScore = (student) => {
  const submission = getStudentSubmission(student);
  if (!submission?.score) return 'Not Scored';
  return `${submission.score}/${task.value.totalScore}`;
};

// Format submission date
const formatSubmissionDate = (submission) => {
  if (!submission) return 'No Submission';
  return new Date(submission.submittedAt).toLocaleString();
};

// Load task data and submissions
const loadTaskData = async () => {
  try {
    loading.value = true;
    error.value = null;

    // Get task details
    const taskData = await getSubjectTasks(subjectId);
    task.value = taskData.tasks.find(t => t.id === taskId);

    if (!task.value) {
      error.value = 'Task not found';
      return;
    }

    // Get submissions
    const submissionsData = await getTaskSubmissions(taskId);
    const submissions = submissionsData.submissions || [];
    
    console.log('Submissions loaded:', submissions); // Debug log
    
    // Initialize scores and comments from existing submissions
    submissions.forEach(sub => {
      if (sub.score !== null) {
        submissionScores.value[sub.studentId] = sub.score;
      }
      if (sub.comment) {
        submissionComments.value[sub.studentId] = sub.comment;
      }
    });

    // Get task visibility if needed
    const visibility = await getTaskVisibility(taskId);
    
    // Map students with their submissions
    visibleStudents.value = visibility.map(v => {
      const studentSubmission = submissions.find(s => s.studentId === v.student.id);
      return {
        ...v.student,
        submission: studentSubmission
      };
    });

    console.log('Visible students with submissions:', visibleStudents.value); // Debug log

  } catch (err) {
    error.value = 'Failed to load task data. Please try again.';
    console.error('Error loading task data:', err);
  } finally {
    loading.value = false;
  }
};

// Helper functions
const getFullFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http')) return fileUrl;
  const cleanUrl = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
  return `${getBaseApiUrl()}/${cleanUrl}`;
};

// Submit score function
const submitScore = async (student) => {
  try {
    console.log('Submitting score for student:', student.id); // Debug log
    
    const submission = student.submission;
    if (!submission) {
      console.error('No submission found for student:', student.id);
      alert('No submission found for this student');
      return;
    }

    const score = submissionScores.value[student.id];
    const comment = submissionComments.value[student.id] || '';

    console.log('Score data:', { submissionId: submission.id, score, comment }); // Debug log

    await scoreSubmission(submission.id, { score, comment });

    // Update the local submission data
    submission.score = score;
    submission.comment = comment;

    alert('Score saved successfully');
  } catch (error) {
    console.error('Error saving score:', error);
    alert('Failed to save score. Please try again.');
  }
};

// Get file icon based on file name
const getFileIcon = (fileName) => {
  if (!fileName) return defaultIcon;
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return pdfIcon;
    case 'doc':
    case 'docx':
      return docIcon;
    case 'xls':
    case 'xlsx':
      return xlsIcon;
    case 'csv':
      return csvIcon;
    case 'txt':
      return txtIcon;
    case 'jpg':
    case 'jpeg':
      return jpgIcon;
    case 'png':
      return pngIcon;
    case 'gif':
    case 'bmp':
      return imgIcon;
    case 'mp4':
    case 'avi':
    case 'mov':
      return videoIcon;
    case 'zip':
    case 'rar':
      return zipIcon;
    case 'ppt':
    case 'pptx':
      return powerpointIcon;
    default:
      return defaultIcon;
  }
};

// Get file type based on file name
const getFileType = (fileName) => {
  if (!fileName) return 'Unknown';
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return 'PDF Document';
    case 'doc':
    case 'docx':
      return 'Word Document';
    case 'xls':
    case 'xlsx':
      return 'Excel Spreadsheet';
    case 'csv':
      return 'CSV File';
    case 'txt':
      return 'Text File';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
      return 'Image';
    case 'mp4':
    case 'avi':
    case 'mov':
      return 'Video';
    case 'zip':
    case 'rar':
      return 'Archive';
    default:
      return 'File';
  }
};

// Add these new functions for the modal
const openFilesModal = (submission) => {
  selectedSubmission.value = submission;
  showFilesModal.value = true;
};

const closeFilesModal = () => {
  showFilesModal.value = false;
  selectedSubmission.value = null;
};

// Get student initials for avatar
const getInitials = (student) => {
  if (!student) return '';
  return `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();
};

// Submit score from the modal
const submitScoreFromModal = () => {
  if (!selectedSubmission.value || !selectedSubmission.value.student) return;
  
  const student = {
    id: selectedSubmission.value.student.id,
    submission: selectedSubmission.value
  };
  
  submitScore(student);
  // Don't close the modal to allow for multiple score updates
};

onMounted(() => {
  loadTaskData();
});
</script>

<style scoped>
.task-visibility {
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
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  padding-left: 1%;
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

/* Task Info Card with gradient */
.task-info-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12),
              0 4px 16px -2px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.task-info-card h2 {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  padding: 20px;
  margin: 0;
  position: relative;
  overflow: hidden;
}

/* Add texture layers */
.task-info-card h2::after {
  content: '';
  position: absolute;
  top: 0;
  right: -10%;
  width: 50%;
  height: 100%;
  background: linear-gradient(45deg, 
    transparent 0%,
    rgba(255, 255, 255, 0.05) 30%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 70%,
    transparent 100%
  );
  transform: skewX(-20deg);
  pointer-events: none;
}

.task-info-card h2::before {
  content: '';
  position: absolute;
  top: -20%;
  right: 20%;
  width: 30%;
  height: 200%;
  background: linear-gradient(45deg,
    transparent 0%,
    rgba(255, 255, 255, 0.02) 30%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.02) 70%,
    transparent 100%
  );
  transform: skewX(-35deg);
  pointer-events: none;
}

/* Updated task meta */
.task-meta {
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  background: rgba(0, 0, 0, 0.03);
  padding: 8px 16px;
  border-radius: 20px;
  transition: all 0.3s;
}

.meta-item:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.task-description {
  padding: 0 20px 20px;
  color: #666;
  line-height: 1.6;
}

/* Updated status badges */
.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-badge.submitted {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.late {
  background: #fff3e0;
  color: #ef6c00;
}

.status-badge.no-submission {
  background: #ffebee;
  color: #c62828;
}

.status-badge.scored {
  background: #e3f2fd;
  color: #1565c0;
}

/* Student card hover effects */
.student-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12),
              0 4px 16px -2px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.student-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Rest of the existing styles remain unchanged */
.content-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin: 1rem 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: #666;
}

.task-description {
  color: #666;
  line-height: 1.5;
}

.visibility-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-toggle {
  display: flex;
  gap: 0.5rem;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.toggle-btn.active {
  background: #e3f2fd;
  color: #1565c0;
  border-color: #1565c0;
}

.status-filter {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.submitted {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.late {
  background: #fff3e0;
  color: #ef6c00;
}

.status-badge.no-submission {
  background: #ffebee;
  color: #c62828;
}

.visibility-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.add-btn {
  background: #e8f5e9;
  color: #2e7d32;
}

.remove-btn {
  background: #ffebee;
  color: #c62828;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ffffff;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  outline: none;
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
}

.sections-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-group {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.section-header h4 {
  margin: 0;
  font-size: 1rem;
}

.student-count {
  font-size: 0.75rem;
  color: #666;
  background: #e0e0e0;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.students-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
}

.student-item {
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.student-item:last-child {
  border-bottom: none;
}

.student-info {
  color: #666;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.select-all {
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.modal-search {
  margin-bottom: 1rem;
}

.modal-students-list {
  max-height: 300px;
}

.submit-btn,
.cancel-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn {
  background: #159750;
  color: white;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* States */
.loading-state,
.empty-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-state .material-icons-round,
.empty-state .material-icons,
.error-state .material-icons-round {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #9e9e9e;
}

.error-state .material-icons-round {
  color: #f44336;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
}

@media (max-width: 768px) {
  .task-visibility {
    padding: 1rem;
  }
  
  .visibility-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .visibility-actions {
    width: 100%;
  }
  
  .action-btn {
    flex: 1;
  }
  
  .search-filter {
    flex-direction: column;
    align-items: flex-start;
    /* border: 1px solid #000000; */
  }
  
  .search-box {
    width: 100%;
  }
}

/* Table Styles */
.students-table {
  margin-top: 1rem;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12),
              0 4px 16px -2px rgba(0, 0, 0, 0.08);
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
}

thead {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  position: relative;
  overflow: hidden;
}

thead::after {
  content: '';
  position: absolute;
  top: 0;
  right: -10%;
  width: 50%;
  height: 100%;
  background: linear-gradient(45deg, 
    transparent 0%,
    rgba(255, 255, 255, 0.05) 30%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 70%,
    transparent 100%
  );
  transform: skewX(-20deg);
  pointer-events: none;
}

th {
  color: white;
  font-weight: 500;
  text-align: left;
  padding: 1rem;
  position: relative;
  z-index: 1;
}

td {
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

tr:last-child td {
  border-bottom: none;
}

tbody tr {
  transition: all 0.3s;
}

tbody tr:hover {
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

/* Style the table checkboxes */
th input[type="checkbox"],
td input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 2px solid rgba(255, 255, 255, 0.7);
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
}

td input[type="checkbox"] {
  border-color: #ddd;
}

/* Table score input styles */
.table-score-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-input-field {
  width: 60px;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
}

.table-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.comment-input-field {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  width: 150px;
  resize: vertical;
  min-height: 32px;
}

.table-score-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.875rem;
}

.table-score-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Card Styles */
.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.student-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12),
              0 4px 16px -2px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.student-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.card-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Main paint swipe */
.card-header::after {
  content: '';
  position: absolute;
  top: 0;
  right: -10%;
  width: 50%;
  height: 100%;
  background: linear-gradient(45deg, 
    transparent 0%,
    rgba(255, 255, 255, 0.05) 30%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0.05) 70%,
    transparent 100%
  );
  transform: skewX(-20deg);
  pointer-events: none;
}

/* Secondary paint swipe */
.card-header::before {
  content: '';
  position: absolute;
  top: -20%;
  right: 20%;
  width: 30%;
  height: 200%;
  background: linear-gradient(45deg,
    transparent 0%,
    rgba(255, 255, 255, 0.02) 30%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.02) 70%,
    transparent 100%
  );
  transform: skewX(-35deg);
  pointer-events: none;
}

.checkbox-label {
  position: relative;
  z-index: 1;
  color: white;
}

.student-name {
  font-weight: 500;
  margin-left: 8px;
}

.status-badge {
  position: relative;
  z-index: 1;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.1);
}

.student-info {
  padding: 20px;
}

.student-info p {
  margin: 8px 0;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}

.student-info p strong {
  color: #333;
  min-width: 100px;
}

.scoring-section {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 12px;
  margin-top: 15px;
}

.score-input {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.score-input input {
  width: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.comment-input textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  resize: vertical;
  min-height: 80px;
  margin-bottom: 15px;
}

.score-btn {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  width: 100%;
  justify-content: center;
}

.score-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Add these styles */
.file-preview {
  flex: 1;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.file-icon {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.file-name {
  flex: 1;
  color: #202124;
  font-size: 14px;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #1a73e8;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.view-btn:hover {
  background-color: rgba(26, 115, 232, 0.1);
}

.download-btn {
  color: #5f6368;
  text-decoration: none;
  padding: 4px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.download-btn:hover {
  background-color: rgba(95, 99, 104, 0.1);
}

/* Update existing styles */
.submission-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 15px;
}

.task-header {
  margin-bottom: 1.5rem;
}

.task-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.task-meta-badges {
  display: flex;
  gap: 1rem;
}

.meta-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.meta-badge.due-date {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.meta-badge.score {
  background: #e3f2fd;
  color: #1565c0;
}

.task-files-list {
  margin-top: 1rem;
}

.files-label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
  padding-left: 1rem;
}

.files-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 1rem;
  padding-left: 1rem;
}

.file-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  font-size: 0.875rem;
  max-width: 300px;
  transition: all 0.2s;
}

.file-button:hover {
  background: #f1f3f4;
  border-color: #dadce0;
}

.file-button .file-icon {
  width: 30px;
  height: 30px;
  object-fit: contain;
}

.file-button .file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.button-actions {
  display: flex;
  gap: 0.25rem;
}

.action-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  color: #5f6368;
  text-decoration: none;
  transition: all 0.2s;
}

.action-link:hover {
  background: rgba(0, 0, 0, 0.05);
}

.action-link.view {
  color: #1a73e8;
}

.action-link.download {
  color: #5f6368;
}

.action-link .material-icons {
  font-size: 18px;
}

.exact-date {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-left: 0.25rem;
}

/* Add these styles for the modal */
.files-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #5f6368;
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.view-files-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f1f3f4;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  color: #1a73e8;
  cursor: pointer;
  transition: background-color 0.2s;
}

.view-files-btn:hover {
  background-color: #e8f0fe;
}

.no-files {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #5f6368;
  font-size: 14px;
}

.student-info-panel {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.student-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: #1a73e8;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 500;
  flex-shrink: 0;
}

.student-details {
  flex: 1;
}

.student-details h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #202124;
}

.student-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #5f6368;
  font-size: 14px;
}

.meta-item .material-icons {
  font-size: 16px;
}

.files-header {
  margin-bottom: 16px;
}

.files-header h4 {
  margin: 0;
  font-size: 16px;
  color: #202124;
}

.scoring-section {
  margin-top: 16px;
}

.scoring-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #202124;
}

.score-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.score-input-group, .comment-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.score-input-group label, .comment-input-group label {
  font-size: 14px;
  color: #5f6368;
}

.score-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-score-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #1a73e8;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  align-self: flex-start;
  transition: background-color 0.2s;
}

.save-score-btn:hover {
  background-color: #1765cc;
}
</style>