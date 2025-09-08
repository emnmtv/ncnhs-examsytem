<template>
  <div class="manage-exams">
    <div class="header-container">
      <div class="header-content">
        <h1>Manage Exams<span class="material-icons">assignment</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Create, edit and monitor your exams</p>
        </div>
      </div>
      <div class="header-background">EXAMS</div>
    </div>

    <!-- Add tab navigation -->
    <div class="exam-tabs">
      <button 
        :class="['tab-btn', { 'active': activeTab === 'active' }]" 
        @click="switchTab('active')"
      >
        <i class="fas fa-clipboard-list"></i> Active Exams
      </button>
      <button 
        :class="['tab-btn', { 'active': activeTab === 'archived' }]" 
        @click="switchTab('archived')"
      >
        <i class="fas fa-archive"></i> Archived Exams
      </button>
    </div>

      <div class="header-actions">
        <div class="search-container">
          <i class="fas fa-search search-icon"></i>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search exams by title, subject, or test code..." 
            class="search-input"
          />
          <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <button class="template-btn" @click="downloadTemplate">
          <i class="fas fa-file-download"></i> Download Template
        </button>
        <label class="import-btn">
          <i class="fas fa-file-upload"></i> Import Exam
          <input 
            type="file" 
            accept=".xlsx" 
            @change="handleImport" 
            style="display: none"
          >
        </label>
        <router-link to="/create-exam" class="create-btn">
          <i class="fas fa-plus"></i> Create New Exam
        </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading exams...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadExams" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!displayedExams.length" class="empty-state">
      <span class="material-icons-round">{{ activeTab === 'active' ? 'assignment' : 'archive' }}</span>
      <p>No {{ activeTab === 'active' ? 'active' : 'archived' }} exams found</p>
      
      <!-- Different messages based on active tab -->
      <template v-if="activeTab === 'active'">
      <p class="subtitle">Create your first exam to get started</p>
      <router-link to="/create-exam" class="create-btn">
        <i class="fas fa-plus"></i> Create Exam
      </router-link>
      </template>
      
      <template v-else>
        <p class="subtitle">Archive exams to see them here</p>
      </template>
    </div>

    <!-- Exams List -->
    <div v-else class="exams-grid">
      <div v-for="exam in displayedExams" :key="exam.id" class="exam-card" :class="exam.status">
        <div class="exam-header">
          <div class="texture-layer"></div>
          <h2>{{ exam.examTitle }}</h2>
          <div class="exam-meta-container">
            <div class="exam-meta">
              <span class="exam-meta-item">
                <i class="fas fa-chalkboard"></i> {{ exam.classCode || 'No Class' }}
              </span>
              <span class="exam-meta-item clickable" @click="copyTestCode(exam.testCode)" title="Click to copy test code">
                <i class="fas fa-key"></i> {{ exam.testCode }}
              </span>
              <span class="exam-meta-item" :class="'status-' + exam.status">
                <i class="fas fa-circle"></i> {{ formatStatus(exam.status) }}
              </span>
            </div>
            <div class="exam-actions-dropdown">
              <button class="dropdown-toggle" @click="toggleDropdown($event)">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <div class="dropdown-menu" @click.stop>
                <button 
                  v-if="!exam.scores.length"
                  @click="editExam(exam); closeAllDropdowns()" 
                  class="dropdown-item"
                  title="Edit exam"
                >
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button 
                  @click="previewExam(exam); closeAllDropdowns()" 
                  class="dropdown-item"
                  title="Preview exam"
                >
                  <i class="fas fa-eye"></i> Preview
                </button>
                <button 
                  @click="exportExam(exam); closeAllDropdowns()" 
                  class="dropdown-item"
                  title="Export exam"
                >
                  <i class="fas fa-file-export"></i> Export
                </button>
                <button 
                  @click="openAccessModal(exam); closeAllDropdowns()" 
                  class="dropdown-item"
                  title="Manage access"
                >
                  <span class="material-icons-round">security</span>
                  Access
                </button>
                <button 
                  @click="openSettingsModal(exam); closeAllDropdowns()" 
                  class="dropdown-item"
                  title="Update exam settings"
                >
                  <span class="material-icons-round">settings</span>
                  Settings
                </button>
                <button 
                  @click="viewPrintableExam(exam); closeAllDropdowns()" 
                  class="dropdown-item"
                  title="View printable exam"
                >
                  <i class="fas fa-file-alt"></i> Paper
                </button>
                <button 
                  v-if="activeTab === 'active' && exam.status !== 'started' && !exam.scores.length"
                  @click="confirmDelete(exam); closeAllDropdowns()" 
                  class="dropdown-item delete"
                  title="Delete exam"
                >
                  <i class="fas fa-trash"></i> Delete
                </button>
                <button 
                  v-if="activeTab === 'active'"
                  @click="confirmArchive(exam); closeAllDropdowns()" 
                  class="dropdown-item"
                  title="Archive exam"
                >
                  <i class="fas fa-archive"></i> Archive
                </button>
                <button 
                  v-if="activeTab === 'archived'"
                  @click="confirmUnarchive(exam); closeAllDropdowns()" 
                  class="dropdown-item"
                  title="Unarchive exam"
                >
                  <i class="fas fa-box-open"></i> Unarchive
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="exam-body">
          <div class="exam-info">
            <div class="info-item">
              <span class="material-icons-round">help_outline</span>
              <div class="info-content">
                <span class="info-label">Questions</span>
                <span class="info-value">{{ exam.questions.length }} items</span>
        </div>
          </div>
            <div class="info-item">
              <span class="material-icons-round">people</span>
              <div class="info-content">
                <span class="info-label">Submissions</span>
                <span class="info-value">{{ exam.scores.length }}</span>
              </div>
            </div>
            <div v-if="exam.scores.length" class="info-item">
              <span class="material-icons-round">analytics</span>
              <div class="info-content">
                <span class="info-label">Average Score</span>
                <span class="info-value">{{ calculateAverageScore(exam.scores) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <div class="exam-actions">
          <button 
            v-if="exam.status === 'pending' || exam.status === 'stopped'"
            @click="startExam(exam.testCode)" 
            class="action-btn start-btn"
            title="Start exam"
          >
            <i class="fas fa-play"></i> Start
          </button>

          <button 
            v-if="exam.status === 'started'"
            @click="stopExam(exam.testCode)" 
            class="action-btn stop-btn"
            title="Stop exam"
          >
            <i class="fas fa-stop"></i> Stop
          </button>

          <button 
            @click="viewResults(exam)" 
            class="action-btn results-btn"
            title="View results"
            :disabled="!exam.scores.length"
          >
            <i class="fas fa-chart-bar"></i> Results
          </button>

          <button 
            v-if="exam.scores.length > 0"
            @click="viewMPS(exam)" 
            class="action-btn mps-btn"
            title="View MPS Analysis"
          >
            <i class="fas fa-chart-line"></i> MPS
          </button>
        </div>
      </div>
    </div>

    <!-- Access Modal -->
    <div v-if="showAccessModal" class="modal-backdrop" @click.self="closeAccessModal">
      <div class="access-modal" :class="{ 'modal-closing': isClosing }">
        <div class="modal-handle"></div>
        
        <div class="modal-header">
          <h2>
            <span class="material-icons-round">security</span>
            Manage Exam Access
          </h2>
          <button @click="closeAccessModal" class="close-btn">
            <span class="material-icons-round">close</span>
          </button>
        </div>

        <div class="modal-body">
          <!-- Exam Info Card -->
          <div class="access-exam-info">
            <h3>{{ selectedExam.examTitle }}</h3>
            <div class="exam-meta">
              <span class="meta-item">
                <span class="material-icons-round">code</span>
                Test Code: {{ selectedExam.testCode }}
              </span>
              <span class="meta-item">
                <span class="material-icons-round">class</span>
                Class: {{ selectedExam.classCode }}
              </span>
            </div>
          </div>

          <!-- Access Control Toggle -->
          <div class="access-control-section">
            <div class="access-type-header">
              <h4>Access Control Mode</h4>
              <div class="toggle-wrapper">
                <label class="switch">
                  <input type="checkbox" v-model="restrictAccess" @change="toggleAccessRestriction">
                  <span class="slider round"></span>
                </label>
                <span class="toggle-state">{{ restrictAccess ? 'Restricted Access' : 'Open Access' }}</span>
              </div>
            </div>
            
            <div class="access-description">
              <div class="description-icon">
                <span class="material-icons-round">{{ restrictAccess ? 'lock' : 'public' }}</span>
              </div>
              <div class="description-text">
                <p>{{ restrictAccess ? 
                  'Only students from selected grade sections will be able to access this exam.' : 
                  'All students can access this exam regardless of their grade or section.' }}</p>
              </div>
            </div>
          </div>

          <!-- Grade Section Access (Only visible when restricted) -->
          <div v-if="restrictAccess" class="section-access-container">
            <div class="section-form-card">
              <h4>
                <span class="material-icons-round">add_circle</span>
                Add Grade Section Access
              </h4>
              
              <div class="section-form">
                <div class="form-row">
                  <div class="form-group">
                    <label for="gradeSelect">Grade Level</label>
                    <select 
                      id="gradeSelect"
                      v-model="newAccessGrade" 
                      @change="loadSectionsForGrade"
                      class="form-select"
                    >
                      <option value="">Select Grade</option>
                      <option 
                        v-for="grade in availableGrades" 
                        :key="grade" 
                        :value="grade"
                      >
                        Grade {{ grade }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="sectionSelect">Section</label>
                    <select 
                      id="sectionSelect"
                      v-model="newAccessSection" 
                      :disabled="!newAccessGrade"
                      class="form-select"
                    >
                      <option value="">Select Section</option>
                      <option 
                        v-for="section in availableSectionsForGrade" 
                        :key="section" 
                        :value="section"
                      >
                        {{ section }}
                      </option>
                    </select>
                  </div>
                  
                  <div class="form-action">
                    <button 
                      @click="addAccessSection" 
                      class="add-section-btn"
                      :disabled="!newAccessGrade || !newAccessSection"
                    >
                      <span class="material-icons-round">add</span>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Section Access List -->
            <div class="section-list-card">
              <div class="list-header">
                <h4>
                  <span class="material-icons-round">list</span>
                  Authorized Grade Sections
                </h4>
                <span class="section-count">{{ accessSections.length }} sections</span>
              </div>
              
              <div v-if="accessSections.length === 0" class="empty-sections">
                <span class="material-icons-round">info</span>
                <p>No sections have been added</p>
                <p class="empty-hint">Students won't be able to access this exam until you add at least one section.</p>
              </div>
              
              <div v-else class="sections-list">
                <div v-for="(section, index) in accessSections" :key="index" class="section-item">
                  <div class="section-info">
                    <span class="grade-badge">Grade {{ section.grade }}</span>
                    <span class="section-name">{{ section.section }}</span>
                  </div>
                  <button @click="removeAccessSection(index)" class="remove-section-btn">
                    <span class="material-icons-round">delete</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Specific Students Access -->
            <div class="section-list-card">
              <div class="list-header">
                <h4>
                  <span class="material-icons-round">person_add</span>
                  Specific Student Access
                </h4>
              </div>

              <!-- Search input -->
              <div class="form-row">
                <div class="form-group" style="flex:2;">
                  <label for="studentSearchInput">Search students (name or LRN)</label>
                  <input 
                    id="studentSearchInput"
                    v-model="studentSearch" 
                    @input="searchStudents" 
                    class="form-select" 
                    placeholder="Type to search..." 
                  />
                </div>
              </div>

              <!-- Search results -->
              <div v-if="studentSearch && studentSearchResults.length" class="section-list" style="max-height:200px;">
                <div v-for="student in studentSearchResults" :key="student.id" class="section-item">
                  <div class="section-info">
                    <span class="section-grade">{{ student.firstName }} {{ student.lastName }}</span>
                    <span class="section-name">LRN: {{ student.lrn || 'N/A' }}</span>
                    <span class="section-name">Grade {{ student.gradeLevel }} - {{ student.section }}</span>
                  </div>
                  <button @click="addSpecificStudent(student)" class="add-section-btn" style="background:#2196F3">Add</button>
                </div>
              </div>

              <!-- Selected specific students -->
              <div class="section-list" v-if="userAccessList.length">
                <div v-for="(u, idx) in userAccessList" :key="u.userId" class="section-item">
                  <div class="section-info">
                    <span class="section-grade">{{ u.name || ('User #' + u.userId) }}</span>
                    <span class="section-name">LRN: {{ u.lrn || 'N/A' }}</span>
                  </div>
                  <div style="display:flex; gap:8px; align-items:center;">
                    <label class="switch">
                      <input type="checkbox" :checked="u.isEnabled" @change="toggleSpecificStudent(idx)" />
                      <span class="slider round"></span>
                    </label>
                    <button @click="removeSpecificStudent(idx)" class="remove-section-btn">
                      <span class="material-icons-round">delete</span>
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="empty-sections">
                <span class="material-icons-round">info</span>
                <p>No specific students added</p>
                <p class="empty-hint">Use the search box above to add specific students.</p>
              </div>
            </div>

            <!-- Subject-Based Access -->
            <div class="section-list-card">
              <div class="list-header">
                <h4>
                  <span class="material-icons-round">school</span>
                  Subject-Based Access
                </h4>
                <div class="toggle-wrapper">
                  <label class="switch">
                    <input type="checkbox" v-model="enableSubjectAccess" @change="toggleSubjectAccess">
                    <span class="slider round"></span>
                  </label>
                  <span class="toggle-state">{{ enableSubjectAccess ? 'Enabled' : 'Disabled' }}</span>
                </div>
              </div>
              
              <div class="access-description">
                <div class="description-icon">
                  <span class="material-icons-round">{{ enableSubjectAccess ? 'school' : 'block' }}</span>
                </div>
                <div class="description-text">
                  <p>{{ enableSubjectAccess ? 
                    'Only students enrolled in selected subjects will be able to access this exam.' : 
                    'Subject-based access is disabled. Students can access based on grade/section or specific access only.' }}</p>
                </div>
              </div>

              <div class="subject-access-container">
                <div class="form-row">
                  <div class="form-group" style="flex:2;">
                    <label for="subjectSelect">Select Subject</label>
                    <select 
                      id="subjectSelect"
                      v-model="selectedSubjectId" 
                      class="form-select"
                    >
                      <option value="">Choose a subject...</option>
                      <option 
                        v-for="subject in availableSubjects" 
                        :key="subject.id" 
                        :value="subject.id"
                      >
                        {{ subject.subjectName || subject.name || subject.title || `Subject ${subject.id}` }}
                      </option>
                    </select>
                  </div>
                  <div class="form-action">
                    <button 
                      @click="addSubjectAccess" 
                      class="add-section-btn"
                      :disabled="!selectedSubjectId"
                    >
                      <span class="material-icons-round">add</span>
                      Add Subject
                    </button>
                  </div>
                </div>

                <!-- Subject Access List -->
                <div v-if="subjectAccessList.length > 0" class="section-list">
                  <div v-for="(subjectAccess, index) in subjectAccessList" :key="index" class="section-item">
                    <div class="section-info">
                      <span class="section-grade">{{ getSubjectName(subjectAccess.subjectId) }}</span>
                      <span class="section-name">Subject Access</span>
                    </div>
                    <div style="display:flex; gap:8px; align-items:center;">
                      <label class="switch">
                        <input type="checkbox" :checked="subjectAccess.isEnabled" @change="toggleSubjectAccessItem(index)" />
                        <span class="slider round"></span>
                      </label>
                      <button @click="removeSubjectAccess(index)" class="remove-section-btn">
                        <span class="material-icons-round">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div v-else class="empty-sections">
                  <span class="material-icons-round">info</span>
                  <p>No subjects added</p>
                  <p class="empty-hint">Select subjects above to control access based on student enrollment.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="closeAccessModal" class="cancel-btn">
            <span class="material-icons-round">close</span>
            Cancel
          </button>
          <button @click="saveAccessSettings" class="save-btn">
            <span class="material-icons-round">save</span>
            Save Access Settings
          </button>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettingsModal" class="modal-backdrop" @click.self="closeSettingsModal">
      <div class="settings-modal" :class="{ 'modal-closing': isSettingsClosing }">
        <div class="modal-handle"></div>
        
        <div class="modal-header">
          <h2>
            <span class="material-icons-round">settings</span>
            Update Exam Settings
          </h2>
          <button @click="closeSettingsModal" class="close-btn">
            <span class="material-icons-round">close</span>
          </button>
        </div>

        <div class="modal-body">
          <!-- Exam Info Card -->
          <div class="settings-exam-info">
            <h3>{{ selectedExamForSettings.examTitle }}</h3>
            <div class="exam-meta">
              <span class="meta-item">
                <span class="material-icons-round">code</span>
                Test Code: {{ selectedExamForSettings.testCode }}
              </span>
              <span class="meta-item">
                <span class="material-icons-round">class</span>
                Class: {{ selectedExamForSettings.classCode }}
              </span>
            </div>
          </div>

          <!-- Settings Form -->
          <form @submit.prevent="saveExamSettings" class="settings-form">
            <div class="form-section">
              <h4>Timer</h4>
              <div class="form-group">
                <label for="durationMinutes">Time Limit (minutes)</label>
                <input 
                  id="durationMinutes"
                  v-model="settingsForm.durationMinutes" 
                  type="number" 
                  class="form-input"
                  placeholder="e.g., 60 (leave empty for no limit)"
                  min="1"
                />
                <small class="form-help">Set a time limit for completing the exam. Leave empty for unlimited time.</small>
              </div>
            </div>

            <div class="form-section">
              <h4>Schedule</h4>
              <div class="form-row">
                <div class="form-group">
                  <label for="startDateTime">Start Date & Time</label>
                  <input 
                    id="startDateTime"
                    v-model="settingsForm.startDateTime" 
                    type="datetime-local" 
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label for="endDateTime">End Date & Time</label>
                  <input 
                    id="endDateTime"
                    v-model="settingsForm.endDateTime" 
                    type="datetime-local" 
                    class="form-input"
                  />
                </div>
              </div>
            </div>

            <div class="form-section">
              <h4>Attempts</h4>
              <div class="form-group">
                <label for="maxAttempts">Maximum Attempts</label>
                <input 
                  id="maxAttempts"
                  v-model="settingsForm.maxAttempts" 
                  type="number" 
                  class="form-input"
                  placeholder="Enter max attempts"
                  min="1"
                />
              </div>
            </div>

            <div class="form-section">
              <h4>History</h4>
              <div class="form-group">
                <div class="toggle-wrapper">
                  <label class="switch">
                    <input type="checkbox" v-model="settingsForm.studentExamHistory">
                    <span class="slider round"></span>
                  </label>
                  <span class="toggle-state">{{ settingsForm.studentExamHistory ? 'Enabled' : 'Disabled' }}</span>
                </div>
                <small class="form-help">Allow students to view their previous attempts</small>
              </div>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button @click="closeSettingsModal" class="cancel-btn">
            <span class="material-icons-round">close</span>
            Cancel
          </button>
          <button @click="saveExamSettings" class="save-btn" :disabled="isSaving">
            <span v-if="isSaving" class="material-icons-round rotating">sync</span>
            <span v-else class="material-icons-round">save</span>
            {{ isSaving ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { 
  fetchTeacherExams, 
  fetchArchivedTeacherExams,
  archiveExam as archiveExamApi,
  unarchiveExam as unarchiveExamApi,
  deleteExam, 
  startExam as startExamApi, 
  stopExam as stopExamApi,
  createExam,
  getAllGradeSections,
  setExamAccess,
  getExamAccess,
  setExamUserAccess,
  fetchStudents,
  updateExamSettings,
  setExamSubjectAccess,
  getExamSubjectAccess,
  getAllSubjects
} from '../../services/authService';
import Swal from 'sweetalert2';
import socketManager from '@/utils/socketManager';
import { generateExamTemplate, exportExamToExcel, parseExcelFile } from '@/utils/excelTemplates';

export default {
  name: 'ManageExams',
  
  setup() {
    const toggleDropdown = (event) => {
      event.stopPropagation();
      
      // Close all other open dropdowns first
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        const parentDropdown = menu.closest('.exam-actions-dropdown');
        const currentDropdown = event.target.closest('.exam-actions-dropdown');
        if (parentDropdown !== currentDropdown) {
          menu.classList.remove('show');
        }
      });
      
      // Toggle the clicked dropdown
      const dropdownContainer = event.target.closest('.exam-actions-dropdown');
      const dropdown = dropdownContainer.querySelector('.dropdown-menu');
      const isCurrentlyOpen = dropdown.classList.contains('show');
      
      if (isCurrentlyOpen) {
        dropdown.classList.remove('show');
        return;
      }
      
      dropdown.classList.add('show');
      
      // Reset any previous positioning styles
      dropdown.style.position = '';
      dropdown.style.top = '';
      dropdown.style.right = '';
      dropdown.style.left = '';
      
      // Check if dropdown would overflow and adjust position
      setTimeout(() => {
        const dropdownRect = dropdown.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        
        if (dropdownRect.right > viewportWidth - 10) {
          dropdown.style.left = '-150px';
          dropdown.style.right = 'auto';
        }
      }, 10);
      
      // Add click outside listener to close dropdown
      const closeDropdownHandler = (e) => {
        if (!dropdown.contains(e.target) && !dropdownContainer.contains(e.target)) {
          dropdown.classList.remove('show');
          document.removeEventListener('click', closeDropdownHandler);
        }
      };
      
      // Delay adding the event listener to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('click', closeDropdownHandler);
      }, 100);
    };
    
    const closeAllDropdowns = () => {
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
      });
    };
    
    const router = useRouter();
    const exams = ref([]);
    const archivedExams = ref([]);
    const activeTab = ref('active');
    const loading = ref(true);
    const error = ref(null);
    const searchQuery = ref('');
    const socket = ref(null);
    const showAccessModal = ref(false);
    const selectedExam = ref(null);
    const restrictAccess = ref(false);
    const newAccessGrade = ref('');
    const newAccessSection = ref('');
    const accessSections = ref([]);
    const availableGrades = ref([]);
    const availableSections = ref([]);
    // Specific user access list
    const userAccessList = ref([]);
    const studentSearch = ref('');
    const studentSearchResults = ref([]);
    const isSearchingStudents = ref(false);
    const isClosing = ref(false);
    
    // Subject-based access
    const availableSubjects = ref([]);
    const subjectAccessList = ref([]);
    const enableSubjectAccess = ref(false);
    const selectedSubjectId = ref('');
    
    // Settings modal variables
    const showSettingsModal = ref(false);
    const selectedExamForSettings = ref(null);
    const isSettingsClosing = ref(false);
    const isSaving = ref(false);
    const settingsForm = ref({
      durationMinutes: null,
      startDateTime: '',
      endDateTime: '',
      maxAttempts: null,
      studentExamHistory: false
    });

    // Initialize socket connection
    onMounted(() => {
      socket.value = socketManager.getSocket();
      loadExams();
      loadGradeSections();
      loadSubjects(); // Load subjects on component mount
    });

    // Computed property for currently displayed exams based on active tab and search
    const displayedExams = computed(() => {
      let examList = [];
      if (activeTab.value === 'active') {
        examList = exams.value || [];
      } else {
        examList = archivedExams.value || [];
      }

      // Apply search filter if search query exists
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim();
        return examList.filter(exam => 
          exam.examTitle.toLowerCase().includes(query) ||
          (exam.classCode && exam.classCode.toLowerCase().includes(query)) ||
          exam.testCode.toLowerCase().includes(query) ||
          (exam.subject && exam.subject.toLowerCase().includes(query))
        );
      }

      return examList;
    });

    // Switch between active and archived exams tabs
    const switchTab = async (tab) => {
      activeTab.value = tab;
      if (tab === 'active') {
        if (exams.value.length === 0) {
          await loadExams();
        }
      } else if (tab === 'archived') {
        await loadArchivedExams(); // Always reload archived exams when switching to that tab
      }
    };

    const loadExams = async () => {
      try {
        loading.value = true;
        error.value = null;
        const fetchedExams = await fetchTeacherExams();
        exams.value = fetchedExams || [];
      } catch (err) {
        error.value = err.message || 'Failed to load exams';
        console.error('Error loading exams:', err);
        exams.value = []; // Ensure exams is always an array
      } finally {
        loading.value = false;
      }
    };

    const loadArchivedExams = async () => {
      try {
        loading.value = true;
        error.value = null;
        const fetchedExams = await fetchArchivedTeacherExams();
        archivedExams.value = fetchedExams || [];
      } catch (err) {
        error.value = err.message || 'Failed to load archived exams';
        console.error('Error loading archived exams:', err);
        archivedExams.value = []; // Ensure archivedExams is always an array
      } finally {
        loading.value = false;
      }
    };

    const formatStatus = (status) => {
      const statusMap = {
        draft: 'Draft',
        pending: 'Ready',
        started: 'In Progress',
        stopped: 'Ready'
      };
      return statusMap[status] || status;
    };

    const calculateAverageScore = (scores) => {
      if (!scores.length) return 0;
      const total = scores.reduce((sum, score) => sum + score.percentage, 0);
      return (total / scores.length).toFixed(1);
    };

    const editExam = (exam) => {
      router.push({
        path: '/create-exam',
        query: { examId: exam.id }
      });
    };

    const confirmDelete = async (exam) => {
      const result = await Swal.fire({
        title: 'Delete Exam?',
        text: "This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        try {
          await deleteExam(exam.id);
          await loadExams(); // Refresh the list
          Swal.fire('Deleted!', 'The exam has been deleted.', 'success');
        } catch (error) {
          Swal.fire('Error!', error.message, 'error');
        }
      }
    };

    const startExam = async (testCode) => {
      try {
        await startExamApi(testCode);
        
        // Emit socket event for exam start
        socket.value.emit('examStatusChanged', { 
          testCode: testCode, 
          status: 'started' 
        });
        
        await loadExams(); // Refresh the list
        Swal.fire('Success!', 'Exam has been started.', 'success');
      } catch (error) {
        Swal.fire('Error!', error.message, 'error');
      }
    };

    const stopExam = async (testCode) => {
      try {
        await stopExamApi(testCode);
        
        // Emit socket event for exam stop
        socket.value.emit('examStatusChanged', { 
          testCode: testCode, 
          status: 'stopped' 
        });
        
        await loadExams(); // Refresh the list
        Swal.fire('Success!', 'Exam has been stopped.', 'success');
      } catch (error) {
        Swal.fire('Error!', error.message, 'error');
      }
    };

    const viewResults = (exam) => {
      router.push({
        path: `/exam-results/${exam.id}`,
        query: { 
          title: exam.examTitle,
          testCode: exam.testCode
        }
      });
    };

    const previewExam = (exam) => {
      router.push(`/preview-exam/${exam.id}`);
    };

    const downloadTemplate = () => {
      generateExamTemplate();
    };

    const handleImport = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const examData = await parseExcelFile(file);
        
        // Validate questions format
        if (!examData.questions || !Array.isArray(examData.questions)) {
          throw new Error('Invalid questions format');
        }

        // Validate that we have at least one question
        if (examData.questions.length === 0) {
          throw new Error('No questions found in the Excel file');
        }

        // Ensure all values are strings and convert to uppercase where needed
        const testCode = String(examData.testCode || '').toUpperCase();
        const classCode = String(examData.classCode || '').toUpperCase();
        const examTitle = String(examData.examTitle || '').toUpperCase();

        // Validate required fields
        if (!testCode || !classCode || !examTitle) {
          throw new Error('Test Code, Class Code, and Exam Title are required');
        }

        // Validate question structure
        const validatedQuestions = examData.questions.map((q, index) => {
          if (!q.questionText || !q.questionType || !q.correctAnswer) {
            throw new Error(`Invalid question format at question ${index + 1}`);
          }

          return {
            questionText: String(q.questionText).trim(),
            questionType: String(q.questionType).trim(),
            options: Array.isArray(q.options) ? q.options.map(opt => String(opt).trim()) : [],
            correctAnswer: String(q.correctAnswer).trim()
          };
        });

        // Create the exam with proper structure
        await createExam(
          testCode,
          classCode,
          examTitle,
          validatedQuestions,
          localStorage.getItem('userId'),
          true // isDraft
        );

        await loadExams();
        Swal.fire({
          title: 'Success',
          text: 'Exam imported successfully',
          icon: 'success',
          confirmButtonColor: '#4CAF50'
        });
      } catch (error) {
        console.error('Import error:', error);
        Swal.fire({
          title: 'Error',
          text: error.message || 'Failed to import exam',
          icon: 'error',
          confirmButtonColor: '#f44336'
        });
      } finally {
        // Reset file input
        event.target.value = '';
      }
    };

    const exportExam = (exam) => {
      exportExamToExcel(exam);
    };

    const openAccessModal = async (exam) => {
      selectedExam.value = exam;
      showAccessModal.value = true;
      
      // Reset form values
      newAccessGrade.value = '';
      newAccessSection.value = '';
      accessSections.value = [];
      userAccessList.value = [];
      subjectAccessList.value = [];
      enableSubjectAccess.value = false;
      selectedSubjectId.value = '';
      
      // Load grade sections if not already loaded
      if (availableGrades.value.length === 0) {
        await loadGradeSections();
      }
      
      // Load subjects if not already loaded
      if (availableSubjects.value.length === 0) {
        await loadSubjects();
      }
      
      // Load current access settings for this exam
      await loadExamAccess(exam.id);
    };

    const openSettingsModal = (exam) => {
      selectedExamForSettings.value = exam;
      
      // Populate form with current exam settings
      settingsForm.value = {
        durationMinutes: exam.durationMinutes || null,
        startDateTime: exam.startDateTime ? formatDateTimeForInput(exam.startDateTime) : '',
        endDateTime: exam.endDateTime ? formatDateTimeForInput(exam.endDateTime) : '',
        maxAttempts: exam.maxAttempts || null,
        studentExamHistory: exam.studentExamHistory || false
      };
      
      showSettingsModal.value = true;
    };

    const closeSettingsModal = () => {
      isSettingsClosing.value = true;
      setTimeout(() => {
        showSettingsModal.value = false;
        isSettingsClosing.value = false;
        // Reset form
        settingsForm.value = {
          durationMinutes: null,
          startDateTime: '',
          endDateTime: '',
          maxAttempts: null,
          studentExamHistory: false
        };
      }, 300);
    };

    const formatDateTimeForInput = (dateTimeString) => {
      if (!dateTimeString) return '';
      const date = new Date(dateTimeString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const saveExamSettings = async () => {
      try {
        isSaving.value = true;
        
        // Validate dates if both are provided
        if (settingsForm.value.startDateTime && settingsForm.value.endDateTime) {
          const startDate = new Date(settingsForm.value.startDateTime);
          const endDate = new Date(settingsForm.value.endDateTime);
          if (startDate >= endDate) {
            throw new Error('Start date must be before end date');
          }
        }

        // Validate numeric fields - allow null/empty for unlimited
        if (settingsForm.value.durationMinutes && settingsForm.value.durationMinutes < 1) {
          throw new Error('Duration must be at least 1 minute');
        }
        if (settingsForm.value.maxAttempts && settingsForm.value.maxAttempts !== null && settingsForm.value.maxAttempts < 1) {
          throw new Error('Maximum attempts must be at least 1');
        }

        // Prepare data for API
        const settingsData = {
          durationMinutes: settingsForm.value.durationMinutes || null,
          startDateTime: settingsForm.value.startDateTime ? new Date(settingsForm.value.startDateTime) : null,
          endDateTime: settingsForm.value.endDateTime ? new Date(settingsForm.value.endDateTime) : null,
          maxAttempts: settingsForm.value.maxAttempts || null,
          studentExamHistory: settingsForm.value.studentExamHistory
        };

        // Call API to update settings
        await updateExamSettings(selectedExamForSettings.value.id, settingsData);
        
        // Refresh exams list
        await loadExams();
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Settings Updated',
          text: 'Exam settings have been updated successfully'
        });
        
        closeSettingsModal();
      } catch (error) {
        console.error('Error updating exam settings:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to update exam settings'
        });
      } finally {
        isSaving.value = false;
      }
    };

    const closeAccessModal = () => {
      isClosing.value = true;
      setTimeout(() => {
        showAccessModal.value = false;
        isClosing.value = false;
      }, 300); // Match this with your animation duration
    };

    const toggleAccessRestriction = () => {
      if (!restrictAccess.value) {
        // When switching to open access, clear the sections list
        accessSections.value = [];
        userAccessList.value = [];
      }
    };

    const loadSectionsForGrade = () => {
      newAccessSection.value = '';
    };

    const addAccessSection = () => {
      if (!newAccessGrade.value || !newAccessSection.value) return;

      // Check if section already exists in access list
      const exists = accessSections.value.some(
        s => s.grade === newAccessGrade.value && s.section === newAccessSection.value
      );

      if (exists) {
        Swal.fire({
          icon: 'warning',
          title: 'Section Already Added',
          text: `Grade ${newAccessGrade.value} Section ${newAccessSection.value} is already in the list`
        });
        return;
      }

      // Add new section to access list
      accessSections.value.push({
        examId: selectedExam.value.id,
        grade: newAccessGrade.value,
        section: newAccessSection.value,
        isEnabled: true
      });

      // Reset section input only, keep grade for adding multiple sections
      newAccessSection.value = '';
    };

    const removeAccessSection = (index) => {
      accessSections.value.splice(index, 1);
    };

    // Specific student search and management
    const searchStudents = async () => {
      const q = studentSearch.value.trim().toLowerCase();
      if (!q) {
        studentSearchResults.value = [];
        return;
      }
      try {
        isSearchingStudents.value = true;
        const students = await fetchStudents();
        const existingIds = new Set(userAccessList.value.map(u => u.userId));
        studentSearchResults.value = (students || [])
          .filter(s =>
            !existingIds.has(s.id) && (
              `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
              (s.lrn || '').toString().toLowerCase().includes(q)
            )
          )
          .slice(0, 20);
      } catch (e) {
        console.error('Student search error:', e);
        studentSearchResults.value = [];
      } finally {
        isSearchingStudents.value = false;
      }
    };

    const addSpecificStudent = (student) => {
      if (!student || !student.id) return;
      const exists = userAccessList.value.some(u => u.userId === student.id);
      if (exists) return;
      userAccessList.value.push({
        userId: student.id,
        isEnabled: true,
        name: `${student.firstName} ${student.lastName}`,
        lrn: student.lrn
      });
      studentSearch.value = '';
      studentSearchResults.value = [];
    };

    const removeSpecificStudent = (index) => {
      userAccessList.value.splice(index, 1);
    };

    const toggleSpecificStudent = (index) => {
      const item = userAccessList.value[index];
      if (!item) return;
      item.isEnabled = !item.isEnabled;
    };

    // Subject access management functions
    const toggleSubjectAccess = () => {
      if (!enableSubjectAccess.value) {
        // When disabling, clear the subject access list
        subjectAccessList.value = [];
      }
    };

    const addSubjectAccess = () => {
      if (!selectedSubjectId.value) return;

      // Check if subject already exists in access list
      const exists = subjectAccessList.value.some(
        sa => sa.subjectId === parseInt(selectedSubjectId.value)
      );

      if (exists) {
        Swal.fire({
          icon: 'warning',
          title: 'Subject Already Added',
          text: 'This subject is already in the access list'
        });
        return;
      }

      // Add new subject to access list
      subjectAccessList.value.push({
        examId: selectedExam.value.id,
        subjectId: parseInt(selectedSubjectId.value),
        isEnabled: true
      });

      // Reset selection
      selectedSubjectId.value = '';
    };

    const removeSubjectAccess = (index) => {
      subjectAccessList.value.splice(index, 1);
    };

    const toggleSubjectAccessItem = (index) => {
      const item = subjectAccessList.value[index];
      if (!item) return;
      item.isEnabled = !item.isEnabled;
    };

    const getSubjectName = (subjectId) => {
      const subject = availableSubjects.value.find(s => s.id === subjectId);
      return subject ? (subject.subjectName || subject.name || subject.title || `Subject ${subject.id}`) : `Subject #${subjectId}`;
    };

    const saveAccessSettings = async () => {
      try {
        if (!restrictAccess.value) {
          // If not restricting access, remove all access settings
          await setExamAccess(selectedExam.value.id, []);
          await setExamUserAccess(selectedExam.value.id, []);
          await setExamSubjectAccess(selectedExam.value.id, []);
          Swal.fire({
            icon: 'success',
            title: 'Access Updated',
            text: 'Exam access is now open to all students'
          });
          closeAccessModal();
          return;
        }
        
        // If restricting but no access entries added
        if (accessSections.value.length === 0 && userAccessList.value.length === 0 && subjectAccessList.value.length === 0) {
          Swal.fire({
            icon: 'warning',
            title: 'No Access Entries Added',
            text: 'Please add at least one section, specific student, or subject, or disable access restriction'
          });
          return;
        }
        
        // Prepare data for the API
        const gradeAccess = accessSections.value.map(section => ({
          examId: selectedExam.value.id,
          grade: section.grade,
          section: section.section,
          isEnabled: true
        }));
        
        const userAccess = userAccessList.value.map(u => ({
          userId: u.userId,
          isEnabled: u.isEnabled !== false
        }));

        const subjectAccess = subjectAccessList.value.map(sa => ({
          examId: selectedExam.value.id,
          subjectId: sa.subjectId,
          isEnabled: sa.isEnabled !== false
        }));
        
        // Save all access settings
        await setExamAccess(selectedExam.value.id, gradeAccess);
        await setExamUserAccess(selectedExam.value.id, userAccess);
        await setExamSubjectAccess(selectedExam.value.id, subjectAccess);
        
        Swal.fire({
          icon: 'success',
          title: 'Access Updated',
          text: 'Exam access settings have been updated'
        });
        
        closeAccessModal();
      } catch (error) {
        console.error('Error saving exam access:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to save exam access settings'
        });
      }
    };

    const loadGradeSections = async () => {
      try {
        const { gradeSections } = await getAllGradeSections();
        console.log('Fetched grade sections:', gradeSections);

        if (gradeSections && gradeSections.length > 0) {
          // Get unique grades
          availableGrades.value = [...new Set(gradeSections.map(gs => gs.grade))]
            .sort((a, b) => a - b);

          // Store all sections with their grades
          availableSections.value = gradeSections.map(gs => ({
            id: gs.id,
            grade: gs.grade,
            section: gs.section
          }));

          console.log('Available grades:', availableGrades.value);
          console.log('Available sections:', availableSections.value);
        }
      } catch (error) {
        console.error('Error loading grade sections:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load grade sections'
        });
      }
    };

    const loadSubjects = async () => {
      try {
        const response = await getAllSubjects();
        console.log('Raw subjects response:', response);
        
        // Handle different response structures
        if (response && Array.isArray(response)) {
          availableSubjects.value = response;
        } else if (response && response.subjects && Array.isArray(response.subjects)) {
          availableSubjects.value = response.subjects;
        } else if (response && response.data && Array.isArray(response.data)) {
          availableSubjects.value = response.data;
        } else {
          availableSubjects.value = [];
        }
        
        console.log('Processed subjects:', availableSubjects.value);
      } catch (error) {
        console.error('Error loading subjects:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load subjects'
        });
      }
    };

    const loadExamAccess = async (examId) => {
      try {
        const response = await getExamAccess(examId);
        
        // Initialize access lists
        accessSections.value = [];
        userAccessList.value = [];
        subjectAccessList.value = [];
        
        // Load grade/section access
        if (response && response.access && response.access.length > 0) {
          accessSections.value = response.access.map(access => ({
            examId: access.examId,
            grade: access.grade,
            section: access.section,
            isEnabled: access.isEnabled
          }));
        }
        
        // Load user-specific access
        if (response && response.userAccess && response.userAccess.length > 0) {
          userAccessList.value = response.userAccess.map(ua => ({
            userId: ua.userId,
            isEnabled: ua.isEnabled,
            name: ua.user?.firstName && ua.user?.lastName ? `${ua.user.firstName} ${ua.user.lastName}` : undefined,
            lrn: ua.user?.lrn
          }));
        }
        
        // Load subject-based access
        await loadExamSubjectAccess(examId);
        
        // Determine restricted mode based on any access type having entries
        const hasGradeAccess = accessSections.value.length > 0;
        const hasUserAccess = userAccessList.value.length > 0;
        const hasSubjectAccess = subjectAccessList.value.length > 0;
        
        restrictAccess.value = hasGradeAccess || hasUserAccess || hasSubjectAccess;
        
        console.log('Access loading summary:', {
          hasGradeAccess,
          hasUserAccess,
          hasSubjectAccess,
          restrictAccess: restrictAccess.value,
          gradeSections: accessSections.value.length,
          userAccess: userAccessList.value.length,
          subjectAccess: subjectAccessList.value.length
        });
      } catch (error) {
        console.error('Error loading exam access settings:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load exam access settings'
        });
      }
    };

    const loadExamSubjectAccess = async (examId) => {
      try {
        const response = await getExamSubjectAccess(examId);
        console.log('Subject access response:', response);
        
        if (response && response.length > 0) {
          enableSubjectAccess.value = true;
          subjectAccessList.value = response.map(access => ({
            examId: access.examId,
            subjectId: access.subjectId,
            isEnabled: access.isEnabled
          }));
          console.log('Loaded subject access:', subjectAccessList.value);
        } else {
          enableSubjectAccess.value = false;
          subjectAccessList.value = [];
          console.log('No subject access found');
        }
      } catch (error) {
        console.error('Error loading subject access settings:', error);
        // Don't show error for this as it might not be set up yet
        enableSubjectAccess.value = false;
        subjectAccessList.value = [];
      }
    };

    const viewPrintableExam = (exam) => {
      router.push(`/exam-paper/${exam.id}`);
    };

    const viewMPS = (exam) => {
      router.push(`/exam-mps/${exam.id}`);
    };

    const copyTestCode = async (testCode) => {
      try {
        await navigator.clipboard.writeText(testCode);
        
        // Show success toast
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
          }
        });

        Toast.fire({
          icon: 'success',
          title: `Test code "${testCode}" copied to clipboard!`
        });
      } catch (err) {
        // Fallback for older browsers
        try {
          const textArea = document.createElement('textarea');
          textArea.value = testCode;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          Swal.fire({
            icon: 'success',
            title: 'Copied!',
            text: `Test code "${testCode}" copied to clipboard!`,
            timer: 2000,
            showConfirmButton: false
          });
        } catch (fallbackErr) {
          Swal.fire({
            icon: 'error',
            title: 'Copy Failed',
            text: 'Unable to copy test code to clipboard',
            confirmButtonColor: '#4CAF50'
          });
        }
      }
    };

    const clearSearch = () => {
      searchQuery.value = '';
    };

    const confirmArchive = async (exam) => {
      const result = await Swal.fire({
        title: 'Archive Exam?',
        text: "This exam will be moved to the archives. You can restore it later.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff9800',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, archive it!'
      });

      if (result.isConfirmed) {
        try {
          await archiveExamApi(exam.id);
          await loadExams(); // Refresh active exams
          // Reset archived exams list to force a refresh next time the tab is opened
          archivedExams.value = [];
          Swal.fire('Archived!', 'The exam has been archived.', 'success');
        } catch (error) {
          Swal.fire('Error!', error.message, 'error');
        }
      }
    };

    const confirmUnarchive = async (exam) => {
      const result = await Swal.fire({
        title: 'Unarchive Exam?',
        text: "This exam will be moved back to active exams.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4caf50',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, unarchive it!'
      });

      if (result.isConfirmed) {
        try {
          await unarchiveExamApi(exam.id);
          await loadArchivedExams(); // Refresh archived exams
          // Reset active exams list to force a refresh next time the tab is opened
          exams.value = [];
          Swal.fire('Unarchived!', 'The exam has been unarchived.', 'success');
        } catch (error) {
          Swal.fire('Error!', error.message, 'error');
      }
      }
    };

    // Computed property to filter sections based on selected grade
    const availableSectionsForGrade = computed(() => {
      if (!newAccessGrade.value) return [];
      
      // Filter sections for selected grade
      return availableSections.value
        .filter(gs => gs.grade === parseInt(newAccessGrade.value))
        .map(gs => gs.section);
    });

    return {
      toggleDropdown,
      closeAllDropdowns,
      exams,
      archivedExams,
      activeTab,
      displayedExams,
      loading,
      error,
      loadExams,
      loadArchivedExams,
      switchTab,
      formatStatus,
      calculateAverageScore,
      editExam,
      confirmDelete,
      confirmArchive,
      confirmUnarchive,
      startExam,
      stopExam,
      viewResults,
      previewExam,
      downloadTemplate,
      handleImport,
      exportExam,
      showAccessModal,
      selectedExam,
      restrictAccess,
      newAccessGrade,
      newAccessSection,
      accessSections,
      availableGrades,
      availableSections,
      availableSectionsForGrade,
      openAccessModal,
      closeAccessModal,
      toggleAccessRestriction,
      loadSectionsForGrade,
      addAccessSection,
      removeAccessSection,
      saveAccessSettings,
      isClosing,
      // specific students access
      userAccessList,
      studentSearch,
      studentSearchResults,
      isSearchingStudents,
      searchStudents,
      addSpecificStudent,
      removeSpecificStudent,
      toggleSpecificStudent,
      viewPrintableExam,
      viewMPS,
      // Settings modal
      showSettingsModal,
      selectedExamForSettings,
      isSettingsClosing,
      isSaving,
      settingsForm,
      openSettingsModal,
      closeSettingsModal,
      saveExamSettings,
      // Subject access
      availableSubjects,
      subjectAccessList,
      enableSubjectAccess,
      selectedSubjectId,
      toggleSubjectAccess,
      addSubjectAccess,
      removeSubjectAccess,
      toggleSubjectAccessItem,
      getSubjectName,
      copyTestCode,
      searchQuery,
      clearSearch
    };
  }
};
</script>

<style scoped>
.manage-exams {
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

/* Add styles for exam tabs */
.exam-tabs {
  display: flex;
  margin-bottom: 25px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-weight: 600;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.tab-btn::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 100%;
  height: 3px;
  background: transparent;
  transition: all 0.3s;
}

.tab-btn.active {
  color: #159750;
}

.tab-btn.active::after {
  background: #159750;
}

.tab-btn:hover {
  color: #159750;
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
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  align-items: center;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 300px;
  max-width: 500px;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 45px;
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
  transform: translateY(-1px);
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 0.9rem;
  pointer-events: none;
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.clear-search-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.template-btn, .import-btn, .create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-decoration: none;
}

.template-btn {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: none;
}

.template-btn:hover {
  background-color: #c8e6c9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.import-btn {
  background-color: #e3f2fd;
  color: #1565c0;
  border: none;
}

.import-btn:hover {
  background-color: #bbdefb;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.create-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.create-btn:hover {
  background-color: #43a047;
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

/* Exams Grid */
.exams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.exam-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12),
  0 4px 16px -2px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  position: relative;
}

.exam-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.exam-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 20px;
  position: relative;
  overflow: visible;
  border-radius: 16px 16px 0 0;
}

/* Main paint swipe */
.exam-header::after {
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
.exam-header::before {
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

/* Additional texture layers */
.exam-header .texture-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.05) 0%,
      transparent 50%
    ),
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.03) 25%,
      rgba(255, 255, 255, 0.03) 75%,
      transparent 100%
    );
  pointer-events: none;
}

.exam-header h2 {
  margin: 0 0 10px 0;
  color: white;
  font-size: 1.5rem;
  position: relative;
  z-index: 1;
}

.exam-meta-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 2;
}

.exam-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.exam-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
}

.exam-meta-item.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.exam-meta-item.clickable:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.exam-meta-item.clickable:active {
  transform: scale(0.98);
}

.status-started {
  color: #4CAF50;
}

.status-pending {
  color: #FF9800;
}

.status-stopped {
  color: #F44336;
}

.exam-body {
  padding: 20px;
  flex: 1;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  color: #666;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.8rem;
  color: #9e9e9e;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  color: #424242;
}

.info-item .material-icons-round {
  font-size: 1.25rem;
  color: #159750;
  margin-top: 0.25rem;
}

.exam-actions {
  padding: 15px;
  background: #f5f5f5;
  border-top: 1px solid #eee;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  flex: 1;
  min-width: calc(33.333% - 8px);
  padding: 8px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.edit-btn {
  background-color: #2196F3;
  color: white;
}

.edit-btn:hover {
  background-color: #1976D2;
}

.preview-btn {
  background-color: #673AB7;
  color: white;
}

.preview-btn:hover {
  background-color: #5E35B1;
}

.start-btn {
  background-color: #4CAF50;
  color: white;
}

.start-btn:hover {
  background-color: #43A047;
}

.stop-btn {
  background-color: #F44336;
  color: white;
}

.stop-btn:hover {
  background-color: #D32F2F;
}

.delete-btn {
  background-color: #FF5252;
  color: white;
}

.delete-btn:hover {
  background-color: #D50000;
}

.results-btn {
  background-color: #9C27B0;
  color: white;
}

.results-btn:hover {
  background-color: #7B1FA2;
}

.results-btn:disabled {
  background-color: #E1BEE7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.export-btn {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.export-btn:hover {
  background-color: #C8E6C9;
}

.access-btn {
  background-color: #FFF3E0;
  color: #E65100;
}

.access-btn:hover {
  background-color: #FFE0B2;
}

.paper-btn {
  background-color: #ECEFF1;
  color: #455A64;
}

.paper-btn:hover {
  background-color: #CFD8DC;
}

.archive-btn {
  background-color: #FFF3E0;
  color: #FF9800;
}

.archive-btn:hover {
  background-color: #FFE0B2;
}

.unarchive-btn {
  background-color: #E8F5E9;
  color: #4CAF50;
}

.unarchive-btn:hover {
  background-color: #C8E6C9;
}

/* Modal styles remain the same */

/* Settings Modal Styles */
.settings-modal {
  background: white;
  border-radius: 16px;
  max-width: 800px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  padding: 0;
  animation: modalFadeIn 0.3s ease;
  z-index: 1001;
}

.settings-exam-info {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
}

.settings-exam-info h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.2rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-section h4::before {
  content: '';
  width: 4px;
  height: 20px;
  background: #159750;
  border-radius: 2px;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #159750;
  box-shadow: 0 0 0 3px rgba(21, 151, 80, 0.1);
}

.form-input::placeholder {
  color: #999;
}

.form-help {
  display: block;
  margin-top: 5px;
  font-size: 0.85rem;
  color: #666;
  font-style: italic;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  font-weight: 500;
  color: #333;
  position: relative;
}

.form-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  height: 20px;
  width: 20px;
  background-color: #fff;
  border: 2px solid #ddd;
  border-radius: 4px;
  transition: all 0.3s;
  position: relative;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid #159750;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.form-checkbox:checked ~ .checkmark {
  background-color: #159750;
  border-color: #159750;
}

.form-checkbox:checked ~ .checkmark:after {
  display: block;
}

.rotating {
  animation: rotate 1s linear infinite;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.access-modal {
  background: white;
  border-radius: 16px;
  max-width: 1100px;
  width: 95%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  padding: 0;
  animation: modalFadeIn 0.3s ease;
  z-index: 1001;
}

.modal-closing {
  animation: modalFadeOut 0.3s ease forwards;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalFadeOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(20px);
  }
}

.modal-handle {
  width: 40px;
  height: 5px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  margin: 10px auto;
  display: none;
}

.modal-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 20px;
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(
      circle at 50% 50%,
      rgba(255, 255, 255, 0.05) 0%,
      transparent 50%
    ),
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.03) 25%,
      rgba(255, 255, 255, 0.03) 75%,
      transparent 100%
    );
  pointer-events: none;
}

.modal-header h2 {
  color: white;
  margin: 0;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.modal-body {
  padding: 20px;
}

.access-exam-info {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
}

.access-exam-info h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.2rem;
}

.exam-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #666;
}

.access-control-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.access-type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.access-type-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-state {
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #4CAF50;
}

input:focus + .slider {
  box-shadow: 0 0 1px #4CAF50;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.access-description {
  display: flex;
  gap: 15px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-top: 15px;
}

.description-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #e8f5e9;
  border-radius: 50%;
  color: #4CAF50;
}

.description-text p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.section-list-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-list-header h4 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.section-form-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-row {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.add-section-btn {
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
}

.add-section-btn:hover {
  background: #43A047;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  padding: 5px;
}

.section-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f5f5f5;
  border-radius: 8px;
  transition: all 0.2s;
}

.section-item:hover {
  background: #e8f5e9;
}

.section-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-grade {
  font-weight: 600;
  color: #333;
}

.section-name {
  color: #666;
}

.remove-section-btn {
  background: none;
  border: none;
  color: #f44336;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-section-btn:hover {
  color: #d32f2f;
  transform: scale(1.1);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  padding: 20px;
  border-top: 1px solid #eee;
}

.cancel-btn {
  padding: 10px 20px;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.save-btn {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #43A047;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Dropdown styles */
.exam-actions-dropdown {
  position: relative;
  z-index: 999;
  margin-left: 10px;
}

.dropdown-toggle {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

.dropdown-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  min-width: 160px;
  display: none;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  margin-top: 5px;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.dropdown-menu.show {
  display: flex;
}

.dropdown-item {
  padding: 9px 14px;
  display: flex;
  align-items: center;
  gap: 7px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
  font-size: 0.85rem;
  border-bottom: 1px solid #f0f0f0;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item.delete {
  color: #f44336;
}

.dropdown-item i,
.dropdown-item .material-icons-round {
  font-size: 0.95rem;
}

.dropdown-item.delete:hover {
  background: #ffebee;
}

/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .manage-exams {
    padding: 16px;
  }
  
  .header-content h1 {
    font-size: 2.2rem;
    margin-bottom: 0.8rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2.2rem;
  }
  
  .header-background {
    font-size: 6.5rem;
    right: 4rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .divider {
    margin: 1.2rem 0;
  }
  
  .exam-tabs {
    margin-bottom: 20px;
    padding-bottom: 8px;
  }
  
  .tab-btn {
    padding: 8px 16px;
    font-size: 0.95rem;
  }
  
  .header-actions {
    gap: 0.8rem;
    margin-bottom: 1.6rem;
  }
  
  .search-container {
    min-width: 250px;
    max-width: 400px;
  }
  
  .search-input {
    padding: 10px 14px 10px 40px;
    font-size: 0.9rem;
  }
  
  .search-icon {
    left: 14px;
    font-size: 0.85rem;
  }
  
  .template-btn, .import-btn, .create-btn {
    padding: 0.6rem 1rem;
    font-size: 0.9rem;
  }
  
  .exams-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.2rem;
  }
  
  .exam-card {
    border-radius: 14px;
  }
  
  .exam-header {
    padding: 16px;
    border-radius: 14px 14px 0 0;
  }
  
  .exam-header h2 {
    font-size: 1.3rem;
    margin-bottom: 8px;
  }
  
  .exam-meta-item {
    font-size: 0.85rem;
    padding: 3px 8px;
  }
  
  .exam-meta-item.clickable:hover {
    transform: scale(1.03);
  }
  
  .exam-body {
    padding: 16px;
  }
  
  .info-item {
    gap: 10px;
    padding: 6px 0;
  }
  
  .info-label {
    font-size: 0.75rem;
  }
  
  .info-value {
    font-size: 0.95rem;
  }
  
  .info-item .material-icons-round {
    font-size: 1.1rem;
  }
  
  .exam-actions {
    padding: 12px;
    gap: 6px;
  }
  
  .action-btn {
    padding: 6px;
    font-size: 0.85rem;
    gap: 4px;
  }
  
  .access-modal,
  .settings-modal {
    max-width: 900px;
    border-radius: 14px;
  }
  
  .modal-header {
    padding: 16px;
    border-radius: 14px 14px 0 0;
  }
  
  .modal-header h2 {
    font-size: 1.3rem;
    gap: 8px;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .access-exam-info,
  .settings-exam-info {
    padding: 12px;
    margin-bottom: 16px;
  }
  
  .access-exam-info h3,
  .settings-exam-info h3 {
    font-size: 1.1rem;
    margin-bottom: 8px;
  }
  
  .form-section {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .form-section h4 {
    font-size: 1rem;
    margin-bottom: 12px;
  }
  
  .form-input {
    padding: 10px;
    font-size: 0.9rem;
  }
  
  .form-help {
    font-size: 0.8rem;
  }
  
  .section-form-card,
  .section-list-card {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .form-row {
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .form-group select {
    padding: 8px;
    font-size: 0.9rem;
  }
  
  .add-section-btn {
    padding: 8px 14px;
    font-size: 0.9rem;
  }
  
  .section-item {
    padding: 8px 12px;
  }
  
  .modal-footer {
    padding: 16px;
    gap: 12px;
  }
  
  .cancel-btn,
  .save-btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
  
  .dropdown-menu {
    min-width: 140px;
    max-height: 240px;
  }
  
  .dropdown-item {
    padding: 7px 12px;
    font-size: 0.8rem;
    gap: 6px;
  }
}

/* Compact layout for 14-inch laptops and lower resolutions */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .manage-exams {
    padding: 14px;
  }
  
  .header-content h1 {
    font-size: 2rem;
    margin-bottom: 0.7rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-background {
    font-size: 6rem;
    right: 3rem;
  }
  
  .subtitle {
    font-size: 0.95rem;
  }
  
  .divider {
    margin: 1rem 0;
  }
  
  .exam-tabs {
    margin-bottom: 18px;
    padding-bottom: 6px;
  }
  
  .tab-btn {
    padding: 6px 14px;
    font-size: 0.9rem;
    gap: 6px;
  }
  
  .header-actions {
    gap: 0.7rem;
    margin-bottom: 1.4rem;
  }
  
  .search-container {
    min-width: 200px;
    max-width: 350px;
  }
  
  .search-input {
    padding: 8px 12px 8px 35px;
    font-size: 0.85rem;
  }
  
  .search-icon {
    left: 12px;
    font-size: 0.8rem;
  }
  
  .template-btn, .import-btn, .create-btn {
    padding: 0.5rem 0.9rem;
    font-size: 0.85rem;
    gap: 0.4rem;
  }
  
  .exams-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }
  
  .exam-card {
    border-radius: 12px;
  }
  
  .exam-header {
    padding: 14px;
    border-radius: 12px 12px 0 0;
  }
  
  .exam-header h2 {
    font-size: 1.2rem;
    margin-bottom: 6px;
  }
  
  .exam-meta {
    gap: 8px;
  }
  
  .exam-meta-item {
    font-size: 0.8rem;
    padding: 2px 6px;
    gap: 4px;
  }
  
  .exam-meta-item.clickable:hover {
    transform: scale(1.02);
  }
  
  .exam-body {
    padding: 14px;
  }
  
  .exam-info {
    gap: 10px;
  }
  
  .info-item {
    gap: 8px;
    padding: 4px 0;
  }
  
  .info-label {
    font-size: 0.7rem;
  }
  
  .info-value {
    font-size: 0.9rem;
  }
  
  .info-item .material-icons-round {
    font-size: 1rem;
  }
  
  .exam-actions {
    padding: 10px;
    gap: 5px;
  }
  
  .action-btn {
    padding: 5px;
    font-size: 0.8rem;
    gap: 3px;
    min-width: calc(33.333% - 5px);
  }
  
  .loading-state, .error-state, .empty-state {
    padding: 2rem;
    border-radius: 12px;
  }
  
  .loading-state .material-icons-round, 
  .error-state .material-icons-round, 
  .empty-state .material-icons-round {
    font-size: 2.5rem;
    margin-bottom: 0.8rem;
  }
  
  .retry-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
  
  .access-modal,
  .settings-modal {
    max-width: 800px;
    border-radius: 12px;
  }
  
  .modal-header {
    padding: 14px;
    border-radius: 12px 12px 0 0;
  }
  
  .modal-header h2 {
    font-size: 1.2rem;
    gap: 6px;
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
  }
  
  .modal-body {
    padding: 14px;
  }
  
  .access-exam-info,
  .settings-exam-info {
    padding: 10px;
    margin-bottom: 14px;
  }
  
  .access-exam-info h3,
  .settings-exam-info h3 {
    font-size: 1rem;
    margin-bottom: 6px;
  }
  
  .exam-meta {
    gap: 12px;
  }
  
  .meta-item {
    font-size: 0.85rem;
    gap: 4px;
  }
  
  .access-control-section {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .access-type-header h4 {
    font-size: 1rem;
  }
  
  .toggle-state {
    font-size: 0.85rem;
  }
  
  .switch {
    width: 45px;
    height: 22px;
  }
  
  .slider:before {
    height: 16px;
    width: 16px;
    left: 3px;
    bottom: 3px;
  }
  
  .input:checked + .slider:before {
    transform: translateX(23px);
  }
  
  .access-description {
    gap: 12px;
    padding: 12px;
    margin-top: 12px;
  }
  
  .description-icon {
    width: 36px;
    height: 36px;
  }
  
  .form-section {
    padding: 14px;
    margin-bottom: 14px;
  }
  
  .form-section h4 {
    font-size: 0.95rem;
    margin-bottom: 10px;
  }
  
  .form-input {
    padding: 8px;
    font-size: 0.85rem;
  }
  
  .form-help {
    font-size: 0.75rem;
    margin-top: 4px;
  }
  
  .section-form-card,
  .section-list-card {
    padding: 14px;
    margin-bottom: 14px;
  }
  
  .form-row {
    gap: 10px;
    margin-bottom: 10px;
  }
  
  .form-group label {
    margin-bottom: 6px;
    font-size: 0.9rem;
  }
  
  .form-group select {
    padding: 6px;
    font-size: 0.85rem;
  }
  
  .add-section-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
    gap: 6px;
  }
  
  .section-list {
    gap: 8px;
    max-height: 250px;
  }
  
  .section-item {
    padding: 6px 10px;
  }
  
  .section-grade {
    font-size: 0.9rem;
  }
  
  .section-name {
    font-size: 0.85rem;
  }
  
  .modal-footer {
    padding: 14px;
    gap: 10px;
  }
  
  .cancel-btn,
  .save-btn {
    padding: 6px 14px;
    font-size: 0.85rem;
  }
  
  .dropdown-toggle {
    width: 28px;
    height: 28px;
  }
  
  .dropdown-menu {
    min-width: 130px;
    max-height: 220px;
  }
  
  .dropdown-item {
    padding: 6px 10px;
    font-size: 0.75rem;
    gap: 5px;
  }
  
  .dropdown-item i,
  .dropdown-item .material-icons-round {
    font-size: 0.85rem;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .manage-exams {
    padding: 12px;
  }
  
  .header-content h1 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.8rem;
  }
  
  .header-background {
    font-size: 5rem;
    right: 2rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .divider {
    margin: 0.8rem 0;
  }
  
  .exam-tabs {
    margin-bottom: 16px;
    padding-bottom: 5px;
  }
  
  .tab-btn {
    padding: 5px 12px;
    font-size: 0.85rem;
    gap: 5px;
  }
  
  .tab-btn i {
    font-size: 0.9rem;
  }
  
  .header-actions {
    gap: 0.6rem;
    margin-bottom: 1.2rem;
  }
  
  .search-container {
    min-width: 180px;
    max-width: 300px;
  }
  
  .search-input {
    padding: 6px 10px 6px 30px;
    font-size: 0.8rem;
  }
  
  .search-icon {
    left: 10px;
    font-size: 0.75rem;
  }
  
  .template-btn, .import-btn, .create-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
    gap: 0.3rem;
  }
  
  .exams-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.8rem;
  }
  
  .exam-card {
    border-radius: 10px;
  }
  
  .exam-header {
    padding: 12px;
    border-radius: 10px 10px 0 0;
  }
  
  .exam-header h2 {
    font-size: 1.1rem;
    margin-bottom: 5px;
  }
  
  .exam-meta {
    gap: 6px;
  }
  
  .exam-meta-item {
    font-size: 0.75rem;
    padding: 1px 5px;
    gap: 3px;
  }
  
  .exam-meta-item.clickable:hover {
    transform: scale(1.01);
  }
  
  .exam-body {
    padding: 12px;
  }
  
  .exam-info {
    gap: 8px;
  }
  
  .info-item {
    gap: 6px;
    padding: 3px 0;
  }
  
  .info-label {
    font-size: 0.65rem;
  }
  
  .info-value {
    font-size: 0.85rem;
  }
  
  .info-item .material-icons-round {
    font-size: 0.9rem;
  }
  
  .exam-actions {
    padding: 8px;
    gap: 4px;
  }
  
  .action-btn {
    padding: 4px;
    font-size: 0.75rem;
    gap: 2px;
    min-width: calc(33.333% - 4px);
  }
  
  .loading-state, .error-state, .empty-state {
    padding: 1.5rem;
    border-radius: 10px;
  }
  
  .loading-state .material-icons-round, 
  .error-state .material-icons-round, 
  .empty-state .material-icons-round {
    font-size: 2rem;
    margin-bottom: 0.6rem;
  }
  
  .retry-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }
  
  .access-modal,
  .settings-modal {
    max-width: 650px;
    border-radius: 10px;
  }
  
  .modal-header {
    padding: 12px;
    border-radius: 10px 10px 0 0;
  }
  
  .modal-header h2 {
    font-size: 1.1rem;
    gap: 5px;
  }
  
  .close-btn {
    width: 28px;
    height: 28px;
  }
  
  .modal-body {
    padding: 12px;
  }
  
  .access-exam-info,
  .settings-exam-info {
    padding: 8px;
    margin-bottom: 12px;
  }
  
  .access-exam-info h3,
  .settings-exam-info h3 {
    font-size: 0.95rem;
    margin-bottom: 5px;
  }
  
  .exam-meta {
    gap: 10px;
  }
  
  .meta-item {
    font-size: 0.8rem;
    gap: 3px;
  }
  
  .access-control-section {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .access-type-header h4 {
    font-size: 0.95rem;
  }
  
  .toggle-state {
    font-size: 0.8rem;
  }
  
  .switch {
    width: 40px;
    height: 20px;
  }
  
  .slider:before {
    height: 14px;
    width: 14px;
    left: 3px;
    bottom: 3px;
  }
  
  .input:checked + .slider:before {
    transform: translateX(20px);
  }
  
  .access-description {
    gap: 10px;
    padding: 10px;
    margin-top: 10px;
  }
  
  .description-icon {
    width: 32px;
    height: 32px;
  }
  
  .form-section {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .form-section h4 {
    font-size: 0.9rem;
    margin-bottom: 8px;
  }
  
  .form-input {
    padding: 6px;
    font-size: 0.8rem;
  }
  
  .form-help {
    font-size: 0.7rem;
    margin-top: 3px;
  }
  
  .section-form-card,
  .section-list-card {
    padding: 12px;
    margin-bottom: 12px;
  }
  
  .list-header h4 {
    font-size: 0.95rem;
  }
  
  .section-count {
    font-size: 0.8rem;
  }
  
  .form-row {
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .form-group label {
    margin-bottom: 5px;
    font-size: 0.85rem;
  }
  
  .form-group select {
    padding: 5px;
    font-size: 0.8rem;
  }
  
  .add-section-btn {
    padding: 5px 10px;
    font-size: 0.8rem;
    gap: 5px;
  }
  
  .section-list {
    gap: 6px;
    max-height: 200px;
  }
  
  .section-item {
    padding: 5px 8px;
  }
  
  .section-grade {
    font-size: 0.85rem;
  }
  
  .section-name {
    font-size: 0.8rem;
  }
  
  .grade-badge {
    font-size: 0.75rem;
    padding: 2px 6px;
  }
  
  .modal-footer {
    padding: 12px;
    gap: 8px;
  }
  
  .cancel-btn,
  .save-btn {
    padding: 5px 12px;
    font-size: 0.8rem;
  }
  
  .dropdown-toggle {
    width: 26px;
    height: 26px;
  }
  
  .dropdown-menu {
    min-width: 120px;
    max-height: 200px;
  }
  
  .dropdown-item {
    padding: 5px 8px;
    font-size: 0.7rem;
    gap: 4px;
  }
  
  .dropdown-item i,
  .dropdown-item .material-icons-round {
    font-size: 0.8rem;
  }
}

/* Responsive styles for the modal */
@media (max-width: 768px) {
  .manage-exams {
    padding: 10px 5px; /* Further reduce padding on mobile */
  }
  .access-modal,
  .settings-modal {
    width: 95%;
    max-height: 90vh;
  }

  .form-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
    gap: 10px;
  }
  
  .cancel-btn, 
  .save-btn {
    width: 100%;
  }
  
  .access-type-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .header-actions {
    position: relative;
    flex-direction: column;
    gap: 0.8rem;
    align-items: stretch;
    padding-bottom: 50px; /* Space for absolutely positioned buttons */
  }
  
  .search-container {
    min-width: auto;
    max-width: none;
    order: 1;
    margin-bottom: 0.5rem;
  }
  
  .search-input {
    padding: 10px 14px 10px 40px;
    font-size: 0.85rem;
  }
  
  .search-icon {
    left: 14px;
    font-size: 0.8rem;
  }

  .template-btn, .import-btn, .create-btn {
    position: absolute;
    bottom: 0;
    width: calc(33.333% - 4px);
    padding: 8px 6px;
    font-size: 0.8rem;
    text-align: center;
    flex-direction: row;
    gap: 4px;
    min-height: 36px;
  }

  .template-btn {
    left: 0;
  }

  .import-btn {
    left: calc(33.333% + 2px);
  }

  .create-btn {
    right: 0;
  }

  .template-btn i, 
  .import-btn i, 
  .create-btn i {
    font-size: 0.9rem;
  }
  
  .header-background {
    position: absolute;
    top: 60%;
    right: 1rem;
    transform: translateY(-50%);
    font-size: 3rem;
    font-weight: 900;
    color: rgba(0, 0, 0, 0.03);
    z-index: 0;
    user-select: none;
    pointer-events: none;
    overflow: hidden;
    white-space: nowrap;
  }
  
  .toggle-wrapper {
    align-self: flex-start;
  }
}
</style> 