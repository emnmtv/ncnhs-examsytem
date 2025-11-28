<template>
  <div class="class-list">
    <div class="header-container">
      <div class="header-content">
        <div class="title-row">
          <router-link to="/teacher-subjects" class="back-btn">
            <span class="material-icons">arrow_back</span>
          </router-link>
          <h1>Class List<span class="material-icons">people</span></h1>
          <div class="action-buttons">
            <!-- Action Buttons Toggle -->
            <div class="action-toggle-container">
              <label class="action-toggle">
                <input type="checkbox" v-model="actionButtonsEnabled" @change="toggleActionButtons">
                <span class="action-toggle-slider"></span>
                <span class="action-toggle-label">Show Actions</span>
              </label>
            </div>
            
            <router-link v-if="actionButtonsEnabled" to="/attendance-records" class="attendance-records-btn">
              <span class="material-icons">fact_check</span>
              Attendance Records
            </router-link>
            <button v-if="actionButtonsEnabled" @click="openRecentSessionsModal" class="recent-sessions-btn">
              <span class="material-icons">history</span>
              Recent Sessions
            </button>
            <button v-if="actionButtonsEnabled" @click="openAttendanceModal" class="create-attendance-btn">
              <span class="material-icons">qr_code_scanner</span>
              Take Attendance
            </button>
            
            <!-- Export Controls -->
            <div class="export-controls">
              <button @click="toggleExportOptions" class="export-main-btn">
                <span class="material-icons">download</span>
                Export
                <span class="material-icons dropdown-icon" :class="{ 'rotated': showExportOptions }">expand_more</span>
              </button>
              
              <div v-if="showExportOptions" class="export-dropdown">
                <div class="export-options-header">
                  <h3>Export Options</h3>
                  <p class="export-note">Export class list data in various formats</p>
                </div>
                
                <div class="export-data-selection">
                  <h4>Select data to export:</h4>
                  <div class="export-checkboxes">
                    <label>
                      <input type="checkbox" v-model="exportOptions.fields.name" checked>
                      Student Name
                    </label>
                    <label>
                      <input type="checkbox" v-model="exportOptions.fields.lrn">
                      LRN
                    </label>
                    <label>
                      <input type="checkbox" v-model="exportOptions.fields.grade" checked>
                      Grade
                    </label>
                    <label>
                      <input type="checkbox" v-model="exportOptions.fields.section" checked>
                      Section
                    </label>
                    <label>
                      <input type="checkbox" v-model="exportOptions.fields.type" checked>
                      Student Type
                    </label>
                    <label v-if="actionButtonsEnabled">
                      <input type="checkbox" v-model="exportOptions.fields.attendance">
                      Attendance Status
                    </label>
                  </div>
                </div>
                
                <div class="export-actions">
                  <button @click="exportToCSV" class="export-btn csv">
                    <span class="material-icons">table_chart</span>
                    CSV
                  </button>
                  <button @click="exportToExcel" class="export-btn excel">
                    <span class="material-icons">description</span>
                    Excel
                  </button>
                  <button @click="exportToPDF" class="export-btn pdf">
                    <span class="material-icons">picture_as_pdf</span>
                    PDF
                  </button>
                  <button @click="printData" class="export-btn print">
                    <span class="material-icons">print</span>
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">View students in your classes</p>
        </div>
      </div>
      <div class="header-background">STUDENTS</div>
    </div>

    <!-- Recent Sessions Modal -->
    <div v-if="showRecentSessionsModal" class="modal-overlay" @click.self="closeRecentSessionsModal">
      <div class="modal-container recent-sessions-modal">
        <div class="modal-header">
          <h2>
            <span class="material-icons">history</span>
            Recent Attendance Sessions
          </h2>
          <button @click="closeRecentSessionsModal" class="close-btn">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="loadingRecentSessions" class="loading-sessions">
            <span class="material-icons-round rotating">sync</span>
            <span>Loading sessions...</span>
          </div>
          
          <div v-else-if="sessionsError" class="error-sessions">
            <span class="material-icons">error_outline</span>
            <p>{{ sessionsError }}</p>
            <button @click="loadRecentSessions" class="retry-sessions-btn">
              <span class="material-icons">refresh</span>
              Retry
            </button>
          </div>
          
          <div v-else-if="recentSessions.length === 0" class="no-sessions">
            <span class="material-icons">event_busy</span>
            <p>No recent attendance sessions</p>
          </div>
          
          <div v-else class="sessions-list">
            <div v-for="session in recentSessions" :key="session.id" class="session-card">
              <div class="session-info">
                <div class="session-title">{{ session.title || 'Untitled Session' }}</div>
                <div class="session-subject">{{ session.subjectName }} ({{ session.subjectCode }})</div>
                <div class="session-date">{{ formatDate(session.date) }}</div>
              </div>
              <button @click="goToScanner(session.id)" class="scanner-btn">
                <span class="material-icons">qr_code_scanner</span>
                Continue Scanning
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Attendance Session Modal -->
    <div v-if="showAttendanceModal" class="modal-overlay" @click.self="closeAttendanceModal">
      <div class="modal-container">
        <div class="modal-header">
          <h2>Create Attendance Session</h2>
          <button @click="closeAttendanceModal" class="close-btn">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="sessionSubject">Subject:</label>
            <select id="sessionSubject" v-model="attendanceSession.subjectId" class="form-input" required>
              <option value="" disabled>Select a subject</option>
              <option v-for="subject in subjects" :key="subject.subject.id" :value="subject.subject.id">
                {{ subject.subject.name }} ({{ subject.subject.code }})
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="sessionTitle">Session Title:</label>
            <input type="text" id="sessionTitle" v-model="attendanceSession.title" placeholder="e.g. Morning Class" class="form-input">
          </div>
          
          <div class="form-group">
            <label for="sessionDate">Date:</label>
            <input type="date" id="sessionDate" v-model="attendanceSession.date" class="form-input">
          </div>
          
          <div class="form-group">
            <label for="scheduleStartTime">Start Time (optional):</label>
            <input type="time" id="scheduleStartTime" v-model="attendanceSession.scheduleStartTime" class="form-input">
            <small class="form-help">Leave empty for no time restriction</small>
          </div>
          
          <div class="form-group">
            <label for="lateThresholdMinutes">Late Threshold (minutes):</label>
            <input type="number" id="lateThresholdMinutes" v-model="attendanceSession.lateThresholdMinutes" min="0" max="60" class="form-input">
            <small class="form-help">Students will be marked late if they arrive after this many minutes. Set to 0 for no late marking.</small>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeAttendanceModal" class="cancel-btn">Cancel</button>
          <button 
            @click="createAttendanceSession" 
            :disabled="!attendanceSession.subjectId || attendanceSessionLoading" 
            class="submit-btn"
          >
            <span class="material-icons-round rotating" v-if="attendanceSessionLoading">sync</span>
            <span v-else>Create & Start Scanning</span>
          </button>
        </div>
        <!-- Error message -->
        <div v-if="error" class="modal-error">
          <span class="material-icons">error_outline</span>
          <span>{{ error }}</span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading class lists...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadClasses" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <!-- Filter Controls -->
    <div v-else class="filter-controls">
      <!-- Pagination Toggle -->
      <div class="pagination-toggle">
        <label class="toggle-switch">
          <input type="checkbox" :checked="pagination.enabled" @change="togglePagination">
          <span class="toggle-slider"></span>
        </label>
        <span class="toggle-label">Pagination</span>
      </div>
      
      <!-- Filter Applied Indicator -->
      <div v-if="selectedSubjectId" class="filter-applied-indicator">
        <span class="material-icons">filter_alt</span>
        <span>Showing: {{ getSelectedSubjectName() }}</span>
        <button @click="clearSubjectFilter" class="clear-filter-btn">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <!-- Search Bar - First and Prominent -->
      <div class="search-section">
        <div class="search-box">
          <span class="material-icons">search</span>
          <input type="text" v-model="searchQuery" placeholder="Search students by name or LRN...">
        </div>
      </div>
      
      <!-- Filter Sections -->
      <div class="filters-row">
      <div class="filter-section">
        <label for="subjectFilter">Subject:</label>
        <select id="subjectFilter" v-model="selectedSubjectId" class="filter-select">
          <option value="">All Subjects</option>
          <option v-for="subject in subjects" :key="subject.subject.id" :value="subject.subject.id">
            {{ subject.subject.name }} ({{ subject.subject.code }})
          </option>
        </select>
      </div>
      
      <div class="filter-section">
          <label for="sourceFilter">Student Type:</label>
        <select id="sourceFilter" v-model="selectedSource" class="filter-select">
          <option value="all">All Students</option>
            <option value="section">Section Students Only</option>
            <option value="direct">Direct Students Only</option>
        </select>
      </div>
      
        <div class="filter-section">
          <label for="gradeFilter">Grade:</label>
          <select id="gradeFilter" v-model="selectedGrade" class="filter-select">
            <option value="">All Grades</option>
            <option v-for="grade in availableGrades" :key="grade" :value="grade">
              Grade {{ grade }}
            </option>
          </select>
        </div>
        
        <div class="filter-section">
          <label for="sectionFilter">Section:</label>
          <select id="sectionFilter" v-model="selectedSection" class="filter-select">
            <option value="">All Sections</option>
            <option v-for="section in availableSections" :key="section" :value="section">
              {{ section }}
            </option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="!loading && !error && !hasStudents" class="empty-state">
      <span class="material-icons">school</span>
      <p>No students found</p>
      <p class="subtitle">Try changing your filters or checking your subject assignments</p>
    </div>

    <!-- Class List -->
    <div v-if="!loading && !error && hasStudents" class="class-list-container">
      
      <!-- Paginated Students List -->
      <div v-if="pagination.enabled" class="paginated-students-container">
        <div class="students-group">
          <h3 class="group-title">
            <span class="material-icons">people</span>
            Students <span class="student-count">({{ getAllStudentsForPagination.length }})</span>
          </h3>
          <div class="students-table-container">
            <table class="students-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th class="hide-on-mobile">Grade & Section</th>
                  <th class="hide-on-mobile">Type</th>
                  <th class="hide-on-mobile">Subject</th>
                  <th v-if="actionButtonsEnabled">Attendance</th>
                   <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in paginatedStudents" :key="`${student.id}-${student.studentType || 'section'}`">
                  <td>{{ student.lastName || '' }}, {{ student.firstName || '' }}</td>
                  <td class="hide-on-mobile">Grade {{ student.gradeLevel || 'N/A' }}-{{ student.section || 'N/A' }}</td>
                  <td class="hide-on-mobile">
                    <span class="student-type-badge" :class="student.studentType || 'section'">
                      {{ student.studentType === 'direct' ? 'Direct' : 'Section' }}
                    </span>
                  </td>
                  <td class="hide-on-mobile">{{ student.subjectName || 'N/A' }}</td>
                  <td v-if="actionButtonsEnabled" class="actions">
                    <button 
                      class="attendance-btn" 
                      :class="{ 'present': isStudentPresent(student.id, student.subjectId) }"
                      @click="toggleAttendance(student.id, student.subjectId)"
                      :title="isStudentPresent(student.id, student.subjectId) ? 'Mark Absent' : 'Mark Present'">
                      <span class="material-icons">
                        {{ isStudentPresent(student.id, student.subjectId) ? 'check_circle' : 'radio_button_unchecked' }}
                      </span>
                      <span class="attendance-status">
                        {{ isStudentPresent(student.id, student.subjectId) ? 'Present' : 'Not marked' }}
                      </span>
                    </button>
                  </td>
                   <td>
                     <button class="view-btn" @click="viewStudentPerformance(student.id)">
                       <span class="material-icons">insights</span>
                       View Performance
                     </button>
                   </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Subject Cards (when pagination is disabled) -->
      <div v-else>
        <div v-for="subject in filteredSubjects" :key="subject.subject.id" class="subject-card">
          <div class="subject-header">
            <div class="texture-layer"></div>
            <h2>{{ subject.subject.name }}</h2>
            <div class="subject-meta">
              <span class="subject-meta-item">
                <span class="material-icons">code</span>
                {{ subject.subject.code }}
              </span>
            </div>
          </div>

          <div class="subject-body">
            <!-- Combined Students List -->
            <div v-if="hasStudentsInSubject(subject)" class="students-group">
              <h3 class="group-title">
                <span class="material-icons">people</span>
                Students <span class="student-count">({{ getTotalStudentsCount(subject) }})</span>
              </h3>
                  <div class="students-table-container">
                    <table class="students-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                      <th class="hide-on-mobile">Grade & Section</th>
                      <th class="hide-on-mobile">Type</th>
                      <th v-if="actionButtonsEnabled">Attendance</th>
                        </tr>
                      </thead>
                      <tbody>
                    <tr v-for="student in getAllStudents(subject)" :key="`${student.id}-${student.studentType || 'section'}`">
                      <td>{{ student.lastName || '' }}, {{ student.firstName || '' }}</td>
                      <td class="hide-on-mobile">Grade {{ student.gradeLevel || 'N/A' }}-{{ student.section || 'N/A' }}</td>
                      <td class="hide-on-mobile">
                        <span class="student-type-badge" :class="student.studentType || 'section'">
                          {{ student.studentType === 'direct' ? 'Direct' : 'Section' }}
                              </span>
                          </td>
                      <td v-if="actionButtonsEnabled" class="actions">
                        <button 
                          class="attendance-btn" 
                          :class="{ 'present': isStudentPresent(student.id, subject.subject.id) }"
                          @click="toggleAttendance(student.id, subject.subject.id)"
                          :title="isStudentPresent(student.id, subject.subject.id) ? 'Mark Absent' : 'Mark Present'">
                          <span class="material-icons">
                            {{ isStudentPresent(student.id, subject.subject.id) ? 'check_circle' : 'radio_button_unchecked' }}
                          </span>
                          <span class="attendance-status">
                            {{ isStudentPresent(student.id, subject.subject.id) ? 'Present' : 'Not marked' }}
                          </span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- No Students Message -->
            <div v-if="!hasStudentsInSubject(subject)" class="no-students-message">
              <span class="material-icons">sentiment_dissatisfied</span>
              <p>No students found for the selected filters</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pagination Controls -->
      <div v-if="pagination.enabled && (getAllStudentsForPagination.length > pagination.itemsPerPage)" class="pagination-controls">
        <div class="pagination-info">
          <span>{{ displayRange }}</span>
        </div>
        
        <div class="pagination-buttons">
          <button 
            @click="changePage(1)" 
            class="pagination-btn first" 
            :disabled="pagination.currentPage === 1"
          >
            <span class="material-icons">first_page</span>
          </button>
          
          <button 
            @click="changePage(pagination.currentPage - 1)" 
            class="pagination-btn prev" 
            :disabled="pagination.currentPage === 1"
          >
            <span class="material-icons">chevron_left</span>
          </button>
          
          <div class="pagination-pages">
            <button 
              v-for="page in totalPages" 
              :key="page" 
              @click="changePage(page)" 
              class="page-btn" 
              :class="{ active: pagination.currentPage === page }"
              v-show="Math.abs(page - pagination.currentPage) < 3 || page === 1 || page === totalPages"
            >
              {{ page }}
            </button>
            <span v-if="pagination.currentPage > 4 && totalPages > 6">...</span>
            <span v-if="pagination.currentPage < totalPages - 3 && totalPages > 6">...</span>
          </div>
          
          <button 
            @click="changePage(pagination.currentPage + 1)" 
            class="pagination-btn next" 
            :disabled="pagination.currentPage === totalPages"
          >
            <span class="material-icons">chevron_right</span>
          </button>
          
          <button 
            @click="changePage(totalPages)" 
            class="pagination-btn last" 
            :disabled="pagination.currentPage === totalPages"
          >
            <span class="material-icons">last_page</span>
          </button>
        </div>
        
        <div class="items-per-page">
          <label>Items per page:</label>
          <select :value="pagination.itemsPerPage" @change="changeItemsPerPage(parseInt($event.target.value))">
            <option v-for="n in [10, 20, 50, 100]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getTeacherAssignedSubjects, getSubjectDirectStudents, getStudentsBySection, createAttendanceSession as createSession, getAttendanceSessions, markAttendance, getSessionAttendance } from '@/services/authService';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const router = useRouter();
const route = useRoute();
const subjects = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const selectedSubjectId = ref('');
const selectedSource = ref('all');
const selectedGrade = ref('');
const selectedSection = ref('');
const actionButtonsEnabled = ref(false); // Toggle for showing action buttons
const attendanceMarked = ref({});  // Track which students are marked present
// Navigation to student performance view
function viewStudentPerformance(studentId) {
  router.push({ name: 'StudentPerformance', params: { studentId } });
}
const todaySessions = ref({}); // Track today's sessions by subjectId

// Pagination state
const pagination = ref({
  currentPage: 1,
  itemsPerPage: 20,
  enabled: true
});

// Export functionality
const showExportOptions = ref(false);
const exportOptions = ref({
  fields: {
    name: true,
    lrn: true,
    grade: true,
    section: true,
    type: true,
    attendance: false
  }
});

// Attendance modal state
const showAttendanceModal = ref(false);
const attendanceSessionLoading = ref(false);

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => {
  const now = new Date();
  // Format as YYYY-MM-DD
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const attendanceSession = ref({
  subjectId: '',
  title: '',
  date: getTodayDateString(), // Use the helper function to get today's date
  scheduleStartTime: '', // Will be populated if provided
  lateThresholdMinutes: 0 // Default to 0 minutes (no late threshold for no time restriction)
});

// Recent sessions modal state
const showRecentSessionsModal = ref(false);
const recentSessions = ref([]);
const loadingRecentSessions = ref(false);
const sessionsError = ref(null);

// Show the attendance modal
const openAttendanceModal = () => {
  error.value = null; // Clear any previous errors
  
  // Reset the date to today's date
  attendanceSession.value.date = getTodayDateString();
  console.log('Setting date to today:', attendanceSession.value.date);
  
  showAttendanceModal.value = true;
};

// Close the attendance modal
const closeAttendanceModal = () => {
  error.value = null; // Clear any errors
  showAttendanceModal.value = false;
};

// Show the recent sessions modal
const openRecentSessionsModal = () => {
  showRecentSessionsModal.value = true;
  loadRecentSessions();
};

// Close the recent sessions modal
const closeRecentSessionsModal = () => {
  showRecentSessionsModal.value = false;
};

// Toggle action buttons function
const toggleActionButtons = () => {
  // Close any open modals when disabling action buttons
  if (!actionButtonsEnabled.value) {
    if (showAttendanceModal.value) {
      closeAttendanceModal();
    }
    if (showRecentSessionsModal.value) {
      closeRecentSessionsModal();
    }
  }
};

// Check if a student is marked present
const isStudentPresent = (studentId, subjectId) => {
  const key = `${studentId}-${subjectId}`;
  return !!attendanceMarked.value[key];
};

// Get today's session ID for a subject
const getSessionIdForSubject = (subjectId) => {
  return todaySessions.value[subjectId] || null;
};

// Toggle student attendance status
const toggleAttendance = async (studentId, subjectId) => {
  try {
    const key = `${studentId}-${subjectId}`;
    const isPresent = !isStudentPresent(studentId, subjectId);
    
    // Create an attendance session if one doesn't exist for this subject today
    let sessionId = getSessionIdForSubject(subjectId);
    
    if (!sessionId) {
      // Create a new session for today
      const sessionResult = await createSession(
        subjectId,
        'Daily Attendance',
        new Date().toISOString().split('T')[0],
        null, // No manual start time
        0    // No late threshold
      );
      
      // Extract session ID from the response
      if (sessionResult && sessionResult.id) {
        sessionId = sessionResult.id;
        todaySessions.value[subjectId] = sessionId;
      } else if (sessionResult && sessionResult.session && sessionResult.session.id) {
        sessionId = sessionResult.session.id;
        todaySessions.value[subjectId] = sessionId;
      } else {
        throw new Error('Could not create attendance session');
      }
    }
    
    // Mark attendance
    await markAttendance(sessionId, studentId, isPresent ? 'present' : 'absent');
    
    // Update local state
    if (isPresent) {
      attendanceMarked.value[key] = true;
    } else {
      delete attendanceMarked.value[key];
    }
    
    // Show notification
    const studentName = findStudentName(studentId);
    showNotification(
      isPresent ? 'success' : 'info',
      `${studentName} marked ${isPresent ? 'present' : 'absent'}`
    );
    
  } catch (err) {
    console.error('Failed to mark attendance:', err);
    showNotification('error', 'Failed to mark attendance: ' + err.message);
  }
};

// Find student name by ID
const findStudentName = (studentId) => {
  let student = null;
  
  // Search in all subjects
  for (const subject of subjects.value) {
    // Search in section students
    const sectionStudent = subject.sectionStudents.find(s => s.id === studentId);
    if (sectionStudent) {
      student = sectionStudent;
      break;
    }
    
    // Search in direct students
    const directStudent = subject.directStudents.find(s => s.id === studentId);
    if (directStudent) {
      student = directStudent;
      break;
    }
  }
  
  return student ? `${student.firstName} ${student.lastName}` : 'Student';
};

// Show notification
const showNotification = (type, message) => {
  // This is a placeholder - you would implement a notification system
  console.log(`[${type}] ${message}`);
  // You could use a toast notification library or custom implementation
};

// Create an attendance session and navigate to the scanner
const createAttendanceSession = async () => {
  if (!attendanceSession.value.subjectId) {
    return; // Validate required field
  }

  try {
    attendanceSessionLoading.value = true;
    
    // Log the date for debugging
    console.log('Date from form:', attendanceSession.value.date);
    
    // Ensure we're using the correct date format (YYYY-MM-DD)
    // The date input should already be in this format, but let's make sure
    const dateToUse = attendanceSession.value.date;
    console.log('Date being sent to API:', dateToUse);
    
    // Create the session using the authService
    const result = await createSession(
      attendanceSession.value.subjectId,
      attendanceSession.value.title,
      dateToUse,
      attendanceSession.value.scheduleStartTime || null,
      attendanceSession.value.lateThresholdMinutes
    );
    
    // Log the entire response to inspect its structure
    console.log('Attendance session created response:', result);
    
    // Close the modal
    closeAttendanceModal();
    
    // Extract the session ID safely from different possible response formats
    let sessionId = null;
    
    // Case 1: If result is directly the session ID as a number
    if (typeof result === 'number') {
      sessionId = result;
    }
    // Case 2: If result has an id property directly
    else if (result && typeof result === 'object' && result.id) {
      sessionId = result.id;
    }
    // Case 3: If result has a session property with an id
    else if (result && typeof result === 'object' && result.session && result.session.id) {
      sessionId = result.session.id;
    }
    
    if (sessionId) {
      console.log('Extracted session ID:', sessionId);
      
      // Store the session ID for today if the date is today
      const today = new Date().toISOString().split('T')[0];
      if (attendanceSession.value.date === today) {
        todaySessions.value[attendanceSession.value.subjectId] = sessionId;
      }
      
      router.push({
        name: 'AttendanceScanner',
        params: { sessionId: sessionId.toString() }
      });
      return;
    }
    
    // If we reach here, we couldn't find a usable ID
    console.error('Session ID not found in response. Full response:', JSON.stringify(result));
    throw new Error('Could not get session ID from the created session');
  } catch (err) {
    console.error('Failed to create attendance session:', err);
    error.value = err.message || 'Failed to create attendance session';
  } finally {
    attendanceSessionLoading.value = false;
  }
};

// Load recent attendance sessions
const loadRecentSessions = async () => {
  try {
    loadingRecentSessions.value = true;
    sessionsError.value = null; // Clear previous errors
    
    // Get sessions for all subjects
    const allSessions = [];
    
    // Check if subjects are loaded
    if (!subjects.value || subjects.value.length === 0) {
      console.log('No subjects loaded yet, skipping session loading');
      recentSessions.value = [];
      return;
    }
    
    // Process each subject sequentially to avoid overwhelming the API
    for (const subject of subjects.value) {
      try {
        const subjectId = subject.subject.id;
        console.log(`Fetching sessions for subject ${subjectId}`);
        
        // Simple try-catch without Promise.race to avoid errors
        try {
          const sessions = await getAttendanceSessions(subjectId);
          
          if (sessions && Array.isArray(sessions) && sessions.length > 0) {
            // Add subject info to each session
            const sessionsWithSubject = sessions.map(session => ({
              ...session,
              subjectName: subject.subject.name,
              subjectCode: subject.subject.code
            }));
            
            allSessions.push(...sessionsWithSubject);
            
            // Check for today's sessions and store them
            const today = new Date().toISOString().split('T')[0];
            const todaySession = sessions.find(s => 
              new Date(s.date).toISOString().split('T')[0] === today
            );
            
            if (todaySession) {
              todaySessions.value[subjectId] = todaySession.id;
            }
          }
        } catch (apiErr) {
          console.error(`API error for subject ${subjectId}:`, apiErr);
        }
      } catch (err) {
        console.error(`Error processing subject ${subject.subject.id}:`, err);
        // Continue with other subjects even if one fails
      }
    }
    
    // Sort by date (newest first) and take most recent 5
    recentSessions.value = allSessions
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      })
      .slice(0, 5);
      
    console.log('Loaded recent sessions:', recentSessions.value);
  } catch (err) {
    console.error('Error loading recent sessions:', err);
    recentSessions.value = []; // Set to empty array on error
    sessionsError.value = 'Failed to load attendance sessions. Please try again.';
  } finally {
    loadingRecentSessions.value = false;
  }
};

// Load today's attendance records
const loadTodayAttendanceRecords = async () => {
  try {
    // For each subject with a today session, get the attendance records
    for (const [subjectId, sessionId] of Object.entries(todaySessions.value)) {
      try {
        const records = await getSessionAttendance(sessionId);
        
        // Update the attendance marked state
        if (Array.isArray(records)) {
          records.forEach(record => {
            if (record.status === 'present') {
              const key = `${record.student.id}-${subjectId}`;
              attendanceMarked.value[key] = true;
            }
          });
        }
      } catch (err) {
        console.error(`Error loading attendance records for session ${sessionId}:`, err);
      }
    }
  } catch (err) {
    console.error('Error loading today\'s attendance records:', err);
  }
};

// Navigate to scanner for existing session
const goToScanner = (sessionId) => {
  router.push({
    name: 'AttendanceScanner',
    params: { sessionId: sessionId.toString() }
  });
};

// Format date for display (more detailed format)
const formatDate = (dateInput) => {
  if (!dateInput) return 'N/A';
  
  try {
    // Convert to Date object if it's a string
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Log the date for debugging
    console.log('Formatting date:', dateInput, '→', date.toISOString());
    
    // Format with Philippine style (day first)
    return date.toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  } catch (err) {
    console.error('Error formatting date:', err);
    return 'Error';
  }
};

// Computed property to filter subjects based on selection
const filteredSubjects = computed(() => {
  let result = subjects.value;
  
  // Filter by subject
  if (selectedSubjectId.value) {
    result = result.filter(subject => subject.subject.id === parseInt(selectedSubjectId.value));
  }
  
  return result;
});


// Check if there are any students to display
const hasStudents = computed(() => {
  return filteredSubjects.value.some(subject => hasStudentsInSubject(subject));
});

// Get available grades from all students
const availableGrades = computed(() => {
  const grades = new Set();
  subjects.value.forEach(subject => {
    if (subject.sectionStudents) {
      subject.sectionStudents.forEach(student => {
        if (student.gradeLevel) {
          grades.add(student.gradeLevel);
        }
      });
    }
    if (subject.directStudents) {
      subject.directStudents.forEach(student => {
        if (student.gradeLevel) {
          grades.add(student.gradeLevel);
        }
      });
    }
  });
  return Array.from(grades).sort((a, b) => a - b);
});

// Get available sections from all students
const availableSections = computed(() => {
  const sections = new Set();
  subjects.value.forEach(subject => {
    if (subject.sectionStudents) {
      subject.sectionStudents.forEach(student => {
        if (student.section) {
          sections.add(student.section);
        }
      });
    }
    if (subject.directStudents) {
      subject.directStudents.forEach(student => {
        if (student.section) {
          sections.add(student.section);
        }
      });
    }
  });
  return Array.from(sections).sort();
});

// Helper function to check if a subject has students based on current filters
const hasStudentsInSubject = (subject) => {
  if (selectedSource.value === 'all' || selectedSource.value === 'section') {
    if (subject.sectionStudents && subject.sectionStudents.some(s => matchesSearch(s))) {
    return true;
    }
  }
  
  if (selectedSource.value === 'all' || selectedSource.value === 'direct') {
    if (subject.directStudents && subject.directStudents.some(s => matchesSearch(s))) {
    return true;
    }
  }
  
  return false;
};

// Helper function to check if a student matches the search query and filters
const matchesSearch = (student) => {
  // Check search query
  if (searchQuery.value) {
  const query = searchQuery.value.toLowerCase();
    const matchesQuery = student.firstName?.toLowerCase().includes(query) ||
                        student.lastName?.toLowerCase().includes(query) ||
                        (student.lrn ? student.lrn.toString().includes(query) : false);
    if (!matchesQuery) return false;
  }
  
  // Check grade filter - convert both to strings for comparison
  if (selectedGrade.value) {
    const studentGrade = student.gradeLevel?.toString() || '';
    const selectedGradeValue = selectedGrade.value.toString();
    if (studentGrade !== selectedGradeValue) {
      return false;
    }
  }
  
  // Check section filter
  if (selectedSection.value) {
    const studentSection = student.section || '';
    if (studentSection !== selectedSection.value) {
      return false;
    }
  }
  
  return true;
};

// Get all students (section + direct) as a flat list
const getAllStudents = (subject) => {
  const allStudents = [];
  
  // Process section students
  if (subject.sectionStudents && (selectedSource.value === 'all' || selectedSource.value === 'section')) {
    const filteredSectionStudents = subject.sectionStudents.filter(s => matchesSearch(s));
    filteredSectionStudents.forEach(student => {
      allStudents.push({ ...student, studentType: 'section' });
    });
  }
  
  // Process direct students
  if (subject.directStudents && (selectedSource.value === 'all' || selectedSource.value === 'direct')) {
    const filteredDirectStudents = subject.directStudents.filter(s => matchesSearch(s));
    filteredDirectStudents.forEach(student => {
      allStudents.push({ ...student, studentType: 'direct' });
    });
  }
  
  // Sort by grade, then section, then last name, then first name
  return allStudents.sort((a, b) => {
    // Handle null/undefined values for gradeLevel
    const gradeA = a.gradeLevel || 0;
    const gradeB = b.gradeLevel || 0;
    if (gradeA !== gradeB) {
      return gradeA - gradeB;
    }
    
    // Handle null/undefined values for section
    const sectionA = a.section || '';
    const sectionB = b.section || '';
    if (sectionA !== sectionB) {
      return sectionA.localeCompare(sectionB);
    }
    
    // Handle null/undefined values for lastName
    const lastNameA = a.lastName || '';
    const lastNameB = b.lastName || '';
    if (lastNameA !== lastNameB) {
      return lastNameA.localeCompare(lastNameB);
    }
    
    // Handle null/undefined values for firstName
    const firstNameA = a.firstName || '';
    const firstNameB = b.firstName || '';
    return firstNameA.localeCompare(firstNameB);
  });
};

// Get total students count for a subject
const getTotalStudentsCount = (subject) => {
  let count = 0;
  
  if (selectedSource.value === 'all' || selectedSource.value === 'section') {
    count += subject.sectionStudents ? subject.sectionStudents.filter(s => matchesSearch(s)).length : 0;
  }
  
  if (selectedSource.value === 'all' || selectedSource.value === 'direct') {
    count += subject.directStudents ? subject.directStudents.filter(s => matchesSearch(s)).length : 0;
  }
  
  return count;
};

// Pagination computed properties
const totalPages = computed(() => {
  if (!pagination.value.enabled) return 1;
  
  const totalItems = getAllStudentsForPagination.value.length;
  return Math.ceil(totalItems / pagination.value.itemsPerPage) || 1;
});

// Get all students for pagination (before pagination is applied)
const getAllStudentsForPagination = computed(() => {
  let allStudents = [];
  
  filteredSubjects.value.forEach(subject => {
    const students = getAllStudents(subject);
    // Add subject information to each student for paginated view
    const studentsWithSubject = students.map(student => ({
      ...student,
      subjectName: subject.subject.name,
      subjectCode: subject.subject.code,
      subjectId: subject.subject.id
    }));
    allStudents.push(...studentsWithSubject);
  });
  
  return allStudents;
});

// Paginated students
const paginatedStudents = computed(() => {
  if (!pagination.value.enabled) {
    return getAllStudentsForPagination.value;
  }
  
  const startIndex = (pagination.value.currentPage - 1) * pagination.value.itemsPerPage;
  const endIndex = startIndex + pagination.value.itemsPerPage;
  return getAllStudentsForPagination.value.slice(startIndex, endIndex);
});

// Display range for pagination
const displayRange = computed(() => {
  const total = getAllStudentsForPagination.value.length;
  if (total === 0) return "0-0 of 0";
  
  const start = (pagination.value.currentPage - 1) * pagination.value.itemsPerPage + 1;
  const end = Math.min(start + pagination.value.itemsPerPage - 1, total);
  return `${start}-${end} of ${total}`;
});

// Load classes
const loadClasses = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    // Get teacher's assigned subjects
    const teacherSubjects = await getTeacherAssignedSubjects();
    
    // For each subject, load both section students and direct students
    const subjectsWithStudents = [];
    
    for (const subjectData of teacherSubjects) {
      const subject = {
        subject: subjectData.subject,
        sectionStudents: [],
        directStudents: []
      };
      
      // Load section students
      if (subject.subject.sections && subject.subject.sections.length > 0) {
        for (const section of subject.subject.sections) {
          try {
            const sectionStudents = await getStudentsBySection(section.grade, section.section);
            subject.sectionStudents.push(...sectionStudents);
          } catch (err) {
            console.error(`Error loading students for section ${section.grade}-${section.section}:`, err);
          }
        }
      }
      
      // Load direct students
      try {
        const directStudentsResponse = await getSubjectDirectStudents(subject.subject.id);
        if (directStudentsResponse && directStudentsResponse.data) {
          subject.directStudents = directStudentsResponse.data.map(item => item.student);
        }
      } catch (err) {
        console.error(`Error loading direct students for subject ${subject.subject.id}:`, err);
      }
      
      subjectsWithStudents.push(subject);
    }
    
    subjects.value = subjectsWithStudents;
    
    // Load attendance sessions after subjects are loaded
    await loadRecentSessions();
    
    // Load today's attendance records to mark students who are already present
    await loadTodayAttendanceRecords();
    
  } catch (err) {
    error.value = err.message || 'Failed to load class lists';
    console.error('Failed to load classes:', err);
  } finally {
    loading.value = false;
  }
};

// Watch for filter changes to refresh student lists
watch([selectedSubjectId, selectedSource, selectedGrade, selectedSection, searchQuery], () => {
  // Filter is handled by computed properties, no need to reload data
  // Reset pagination when filters change
  pagination.value.currentPage = 1;
}, { deep: true });

// Watch for subjects to be loaded and then load sessions
watch(() => subjects.value.length, (newLength) => {
  if (newLength > 0) {
    // If subjects are loaded and we don't have any sessions yet, load them
    if (recentSessions.value.length === 0 && !loadingRecentSessions.value) {
      loadRecentSessions();
    }
  }
});

// Apply URL query parameters on mount
const applyUrlFilters = () => {
  // Apply subject filter from URL query parameter
  if (route.query.subject) {
    selectedSubjectId.value = route.query.subject;
  }
};

// Get selected subject name for display
const getSelectedSubjectName = () => {
  if (!selectedSubjectId.value) return '';
  
  const subject = subjects.value.find(s => s.subject.id === parseInt(selectedSubjectId.value));
  return subject ? `${subject.subject.name} (${subject.subject.code})` : 'Unknown Subject';
};

// Clear subject filter
const clearSubjectFilter = () => {
  selectedSubjectId.value = '';
  // Update URL to remove the subject query parameter
  router.replace({ query: { ...route.query, subject: undefined } });
};

// Pagination functions
const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  pagination.value.currentPage = page;
};

const changeItemsPerPage = (items) => {
  pagination.value.itemsPerPage = items;
  pagination.value.currentPage = 1; // Reset to first page when changing items per page
};

const togglePagination = () => {
  pagination.value.enabled = !pagination.value.enabled;
  pagination.value.currentPage = 1; // Reset to first page when toggling pagination
};

// Export functionality
const toggleExportOptions = () => {
  showExportOptions.value = !showExportOptions.value;
};

const closeExportOptionsOnClickOutside = (event) => {
  if (showExportOptions.value && !event.target.closest('.export-controls')) {
    showExportOptions.value = false;
  }
};

// Prepare data for export based on selected options
const getExportData = () => {
  let dataToExport = [];
  let headers = [];
  
  const fields = exportOptions.value.fields;
  
  // Build headers array
  if (fields.name) headers.push('firstName', 'lastName');
  if (fields.lrn) headers.push('lrn');
  if (fields.grade) headers.push('grade');
  if (fields.section) headers.push('section');
  if (fields.type) headers.push('type');
  if (fields.attendance && actionButtonsEnabled.value) headers.push('attendance');
  
  // Get all students from filtered subjects
  filteredSubjects.value.forEach(subject => {
    const students = getAllStudents(subject);
    students.forEach(student => {
      const row = {};
      
      if (fields.name) {
        row.firstName = student.firstName || '';
        row.lastName = student.lastName || '';
      }
      if (fields.lrn) {
        row.lrn = student.lrn || '';
      }
      if (fields.grade) {
        row.grade = student.gradeLevel || '';
      }
      if (fields.section) {
        row.section = student.section || '';
      }
      if (fields.type) {
        row.type = student.studentType === 'direct' ? 'Direct' : 'Section';
      }
      if (fields.attendance && actionButtonsEnabled.value) {
        const isPresent = isStudentPresent(student.id, subject.subject.id);
        row.attendance = isPresent ? 'Present' : 'Not marked';
      }
      
      // Add subject info
      row.subjectName = subject.subject.name;
      row.subjectCode = subject.subject.code;
      
      dataToExport.push(row);
    });
  });
  
  return { headers, data: dataToExport };
};

// Export to CSV
const exportToCSV = () => {
  try {
    const { headers, data } = getExportData();
    
    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'There is no data to export.'
      });
      return;
    }
    
    // Create CSV content
    const csvHeaders = [...headers, 'subjectName', 'subjectCode'];
    const csvContent = [
      csvHeaders.join(','),
      ...data.map(row => 
        csvHeaders.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in CSV
          return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const fileName = `class_list_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Hide export options after export
    showExportOptions.value = false;
    
    Swal.fire({
      icon: 'success',
      title: 'CSV Export Complete',
      text: `Class list exported to CSV as ${fileName}`,
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    console.error('Export to CSV error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Export Failed',
      text: 'Failed to export data to CSV. Please try again.'
    });
  }
};

// Export to Excel
const exportToExcel = () => {
  try {
    const { headers, data } = getExportData();
    
    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'There is no data to export.'
      });
      return;
    }
    
    // Prepare data for Excel
    const excelHeaders = [...headers, 'subjectName', 'subjectCode'];
    const excelData = [
      excelHeaders,
      ...data.map(row => excelHeaders.map(header => row[header] || ''))
    ];
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Class List');
    
    // Generate and download file
    const fileName = `class_list_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    // Hide export options after export
    showExportOptions.value = false;
    
    Swal.fire({
      icon: 'success',
      title: 'Export Complete',
      text: `Class list exported to Excel as ${fileName}`,
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    console.error('Export to Excel error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Export Failed',
      text: 'Failed to export data to Excel. Please try again.'
    });
  }
};

// Export to PDF
const exportToPDF = () => {
  try {
    const { headers, data } = getExportData();
    
    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'There is no data to export.'
      });
      return;
    }
    
    // Create PDF
    const doc = new jsPDF('landscape');
    
    // Add title
    doc.setFontSize(16);
    doc.text('Class List Report', 14, 22);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    
    // Prepare table data
    const tableHeaders = [...headers, 'Subject'];
    const tableData = data.map(row => {
      const rowData = [];
      headers.forEach(header => {
        rowData.push(row[header] || '');
      });
      rowData.push(`${row.subjectName} (${row.subjectCode})`);
      return rowData;
    });
    
    // Add table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableData,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [21, 151, 80] },
      alternateRowStyles: { fillColor: [248, 249, 250] }
    });
    
    // Save PDF
    const fileName = `class_list_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    // Hide export options after export
    showExportOptions.value = false;
    
    Swal.fire({
      icon: 'success',
      title: 'Export Complete',
      text: `Class list exported to PDF as ${fileName}`,
      timer: 2000,
      showConfirmButton: false
    });
  } catch (error) {
    console.error('Export to PDF error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Export Failed',
      text: 'Failed to export data to PDF. Please try again.'
    });
  }
};

// Print data
const printData = () => {
  try {
    const { headers, data } = getExportData();
    
    if (data.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'There is no data to print.'
      });
      return;
    }
    
    // Create print content
    let printContent = `
      <html>
        <head>
          <title>Class List Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #159750; margin-bottom: 10px; }
            .report-info { margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #159750; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .no-print { display: none; }
          </style>
        </head>
        <body>
          <h1>Class List Report</h1>
          <div class="report-info">
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Total Students:</strong> ${data.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map(header => `<th>${header.charAt(0).toUpperCase() + header.slice(1)}</th>`).join('')}
                <th>Subject</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
                  <td>${row.subjectName} (${row.subjectCode})</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
    
    // Hide export options after print dialog is shown
    showExportOptions.value = false;
  } catch (error) {
    console.error('Print error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Print Failed',
      text: 'Failed to prepare data for printing. Please try again.'
    });
  }
};

onMounted(() => {
  // Apply URL filters first
  applyUrlFilters();
  
  // Just load classes - loadRecentSessions will be called after classes are loaded
  loadClasses();
  
  // Add click outside listener for export dropdown
  document.addEventListener('click', closeExportOptionsOnClickOutside);
});
</script>

<style scoped>
.class-list {
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
  gap: 10px;
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
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

/* Filter Controls */
.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 25px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* Filter Applied Indicator */
.filter-applied-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 1px solid #4caf50;
  border-radius: 8px;
  color: #2e7d32;
  font-weight: 500;
  font-size: 0.9rem;
}

.filter-applied-indicator .material-icons {
  font-size: 1.1rem;
  color: #2e7d32;
}

.clear-filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(46, 125, 50, 0.1);
  border-radius: 50%;
  color: #2e7d32;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;
}

.clear-filter-btn:hover {
  background: rgba(46, 125, 50, 0.2);
  transform: scale(1.1);
}

.clear-filter-btn .material-icons {
  font-size: 1rem;
}

/* Search Section - Prominent */
.search-section {
  width: 100%;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: 2px solid #e9ecef;
  border-radius: 12px;
  background: white;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-box:focus-within {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1), 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.search-box .material-icons {
  color: #6c757d;
  font-size: 22px;
}

.search-box input {
  flex: 1;
  padding: 0;
  border: none;
  outline: none;
  font-size: 1rem;
  background: transparent;
  font-weight: 500;
}

.search-box input::placeholder {
  color: #adb5bd;
  font-weight: 400;
}

/* Filters Row */
.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: end;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.filter-section label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  min-width: 200px;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

/* Create Attendance Button */
.create-attendance-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #159750;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.create-attendance-btn:hover {
  background: #0bcc4e;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.create-attendance-btn .material-icons {
  font-size: 1.2rem;
}

/* Modal Styles */
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
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background-color: #f9f9f9;
}

.modal-header h2 {
  margin: 0;
  color: #159750;
  font-size: 1.5rem;
  font-weight: 600;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e0e0e0;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #444;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 15px 20px;
  border-top: 1px solid #eee;
  background-color: #f9f9f9;
}

.cancel-btn {
  padding: 10px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  color: #555;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f5f5f5;
}

.submit-btn {
  padding: 10px 16px;
  border: none;
  background: #159750;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.submit-btn:hover:not(:disabled) {
  background: #0bcc4e;
}

.submit-btn:disabled {
  background: #88d8a7;
  cursor: not-allowed;
}

/* Subject Cards */
.class-list-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-top: 20px;
}

.subject-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}

.subject-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
  color: white;
}

/* Main paint swipe */
.subject-header::after {
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
.subject-header::before {
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

.texture-layer {
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

.subject-header h2 {
  margin: 0 0 15px 0;
  font-size: 1.5rem;
  position: relative;
  z-index: 1;
}

.subject-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.subject-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  background: rgba(0, 0, 0, 0.1);
  padding: 5px 12px;
  border-radius: 20px;
}

.subject-body {
  padding: 25px;
}

.students-group {
  margin-bottom: 30px;
}

.group-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  color: #333;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.student-count {
  font-size: 0.9rem;
  color: #666;
  font-weight: normal;
}

.section-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.section-title {
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: #333;
  background: #f5f5f5;
  padding: 10px 15px;
  border-radius: 8px;
}

.students-table-container {
  overflow-x: auto;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.students-table th {
  text-align: left;
  padding: 12px 15px;
  border-bottom: 2px solid #eee;
  color: #444;
  font-weight: 600;
}

.students-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  color: #333;
}

.students-table tr:last-child td {
  border-bottom: none;
}

.students-table tr:hover td {
  background-color: #f9f9f9;
}

.actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

/* Separate styles for non-attendance action buttons */
.action-btn:not(.attendance-btn) {
  width: 32px;
  height: 32px;
}

.view-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.view-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.view-btn .material-icons {
  font-size: 18px;
}

.no-students-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  color: #888;
  background: #f9f9f9;
  border-radius: 12px;
  text-align: center;
}

.no-students-message .material-icons {
  font-size: 3rem;
  margin-bottom: 15px;
  color: #bbb;
}

/* States styling */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-state .material-icons-round,
.empty-state .material-icons {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #f44336;
}

.empty-state .material-icons {
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
}

.title-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.action-buttons {
  margin-left: auto;
  display: flex;
  gap: 10px;
  align-items: center;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e8f5e9;
  color: #159750;
  text-decoration: none;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.back-btn:hover {
  background: #c8e6c9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.back-btn .material-icons {
  font-size: 1.5rem;
}

/* Recent Sessions Button */
.recent-sessions-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.recent-sessions-btn:hover {
  background: #138496;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.recent-sessions-btn .material-icons {
  font-size: 1.2rem;
}

/* Create Attendance Button */
/* Recent Sessions Modal */
.recent-sessions-modal {
  max-width: 600px;
  width: 90%;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.session-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.session-info {
  flex: 1;
}

.session-title {
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.session-subject {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}

.session-date {
  font-size: 0.8rem;
  color: #999;
}

.scanner-btn {
  padding: 8px 12px;
  background: #159750;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.scanner-btn:hover {
  background: #0bcc4e;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.scanner-btn .material-icons {
  font-size: 1rem;
}

/* Modal content styles */
.loading-sessions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #666;
  font-size: 1rem;
}

.loading-sessions .material-icons-round {
  font-size: 2rem;
  margin-bottom: 10px;
}

.error-sessions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #888;
  font-size: 1rem;
}

.error-sessions .material-icons {
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #f44336;
}

.retry-sessions-btn {
  margin-top: 15px;
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.retry-sessions-btn:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.no-sessions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #888;
  font-size: 1rem;
}

.no-sessions .material-icons {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

/* Student Type Badge */
.student-type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.student-type-badge.section {
  background-color: #e3f2fd;
  color: #1565c0;
}

.student-type-badge.direct {
  background-color: #e8f5e9;
  color: #2e7d32;
}

/* Action Toggle Styles */
.action-toggle-container {
  display: flex;
  align-items: center;
}

.action-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.action-toggle input[type="checkbox"] {
  display: none;
}

.action-toggle-slider {
  position: relative;
  width: 50px;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.action-toggle-slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.action-toggle input[type="checkbox"]:checked + .action-toggle-slider {
  background: #4CAF50;
}

.action-toggle input[type="checkbox"]:checked + .action-toggle-slider::before {
  transform: translateX(26px);
}

.action-toggle-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

/* High DPI and Small Laptop Screens */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .class-list {
    padding: 1.6rem;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .header-content h1 .material-icons {
    font-size: 2rem;
  }

  .header-background {
    font-size: 6rem;
    right: 4rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .divider {
    margin: 1.2rem 0;
  }

  .title-row {
    gap: 12px;
  }

  .action-buttons {
    gap: 8px;
  }

  .back-btn {
    width: 36px;
    height: 36px;
  }

  .back-btn .material-icons {
    font-size: 1.3rem;
  }

  .attendance-records-btn,
  .recent-sessions-btn,
  .create-attendance-btn,
  .export-main-btn {
    padding: 8px 12px;
    font-size: 0.85rem;
  }

  .attendance-records-btn .material-icons,
  .recent-sessions-btn .material-icons,
  .create-attendance-btn .material-icons,
  .export-main-btn .material-icons {
    font-size: 1.1rem;
  }

  .export-dropdown {
    min-width: 280px;
  }

  .export-options-header {
    padding: 16px 16px 12px;
  }

  .export-options-header h3 {
    font-size: 1rem;
  }

  .export-data-selection {
    padding: 16px;
  }

  .export-checkboxes {
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 10px;
  }

  .export-checkboxes label {
    font-size: 0.85rem;
  }

  .export-actions {
    padding: 16px;
    gap: 10px;
  }

  .export-btn {
    padding: 10px 14px;
    font-size: 0.85rem;
  }

  .filter-controls {
    padding: 1.6rem;
    gap: 16px;
    margin-bottom: 20px;
  }

  .filter-applied-indicator {
    padding: 10px 14px;
    font-size: 0.85rem;
  }

  .filter-applied-indicator .material-icons {
    font-size: 1rem;
  }

  .clear-filter-btn {
    width: 22px;
    height: 22px;
  }

  .clear-filter-btn .material-icons {
    font-size: 0.9rem;
  }

  .search-box {
    padding: 12px 16px;
    max-width: 400px;
  }

  .search-box .material-icons {
    font-size: 20px;
  }

  .filters-row {
    gap: 16px;
  }

  .filter-section label {
    font-size: 0.85rem;
  }

  .filter-select {
    padding: 8px 12px;
    font-size: 0.9rem;
    min-width: 180px;
  }

  .search-box input {
    padding: 8px 0;
    font-size: 0.9rem;
  }

  .search-box .material-icons {
    font-size: 1.1rem;
  }

  .class-list-container {
    gap: 24px;
    margin-top: 16px;
  }

  .subject-card {
    border-radius: 12px;
  }

  .subject-header {
    padding: 1.6rem;
  }

  .subject-header h2 {
    font-size: 1.3rem;
    margin-bottom: 12px;
  }

  .subject-meta-item {
    font-size: 0.8rem;
    padding: 4px 10px;
  }

  .subject-body {
    padding: 20px;
  }

  .students-group {
    margin-bottom: 24px;
  }

  .group-title {
    font-size: 1.1rem;
    margin-bottom: 16px;
    gap: 8px;
  }

  .group-title .material-icons {
    font-size: 1.1rem;
  }

  .student-count {
    font-size: 0.8rem;
  }

  .section-list {
    gap: 20px;
  }

  .section-title {
    font-size: 1rem;
    padding: 8px 12px;
    margin-bottom: 12px;
  }

  .students-table {
    font-size: 0.9rem;
  }

  .students-table th,
  .students-table td {
    padding: 10px 12px;
  }

  .attendance-btn {
    padding: 5px 10px;
    min-width: 110px;
  }

  .attendance-btn .material-icons {
    font-size: 16px;
  }

  .attendance-status {
    font-size: 0.8rem;
  }

  .student-type-badge {
    padding: 2px 6px;
    font-size: 0.7rem;
  }


  .action-toggle-label {
    font-size: 0.85rem;
  }

  .action-toggle-slider {
    width: 45px;
    height: 22px;
  }

  .action-toggle-slider::before {
    width: 18px;
    height: 18px;
  }

  .action-toggle input[type="checkbox"]:checked + .action-toggle-slider::before {
    transform: translateX(23px);
  }
}

@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .class-list {
    padding: 1.4rem;
  }

  .header-content h1 {
    font-size: 1.8rem;
  }

  .header-content h1 .material-icons {
    font-size: 1.8rem;
  }

  .header-background {
    font-size: 5rem;
    right: 3rem;
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .divider {
    margin: 1rem 0;
  }

  .title-row {
    gap: 10px;
  }

  .action-buttons {
    gap: 6px;
  }

  .back-btn {
    width: 32px;
    height: 32px;
  }

  .back-btn .material-icons {
    font-size: 1.2rem;
  }

  .attendance-records-btn,
  .recent-sessions-btn,
  .create-attendance-btn,
  .export-main-btn {
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  .attendance-records-btn .material-icons,
  .recent-sessions-btn .material-icons,
  .create-attendance-btn .material-icons,
  .export-main-btn .material-icons {
    font-size: 1rem;
  }

  .export-dropdown {
    min-width: 260px;
  }

  .export-options-header {
    padding: 14px 14px 10px;
  }

  .export-options-header h3 {
    font-size: 0.95rem;
  }

  .export-data-selection {
    padding: 14px;
  }

  .export-checkboxes {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }

  .export-checkboxes label {
    font-size: 0.8rem;
  }

  .export-actions {
    padding: 14px;
    gap: 8px;
  }

  .export-btn {
    padding: 8px 12px;
    font-size: 0.8rem;
  }

  .filter-controls {
    padding: 1.4rem;
    gap: 14px;
    margin-bottom: 18px;
  }

  .filter-applied-indicator {
    padding: 8px 12px;
    font-size: 0.8rem;
  }

  .filter-applied-indicator .material-icons {
    font-size: 0.9rem;
  }

  .clear-filter-btn {
    width: 20px;
    height: 20px;
  }

  .clear-filter-btn .material-icons {
    font-size: 0.8rem;
  }

  .search-box {
    padding: 10px 14px;
    max-width: 350px;
  }

  .search-box .material-icons {
    font-size: 18px;
  }

  .filters-row {
    gap: 14px;
  }

  .filter-section label {
    font-size: 0.8rem;
  }

  .filter-select {
    padding: 6px 10px;
    font-size: 0.85rem;
    min-width: 160px;
  }

  .search-box input {
    padding: 6px 0;
    font-size: 0.85rem;
  }

  .search-box .material-icons {
    font-size: 1rem;
  }

  .class-list-container {
    gap: 20px;
    margin-top: 14px;
  }

  .subject-header {
    padding: 1.4rem;
  }

  .subject-header h2 {
    font-size: 1.2rem;
    margin-bottom: 10px;
  }

  .subject-meta-item {
    font-size: 0.75rem;
    padding: 3px 8px;
  }

  .subject-body {
    padding: 18px;
  }

  .students-group {
    margin-bottom: 20px;
  }

  .group-title {
    font-size: 1rem;
    margin-bottom: 14px;
    gap: 6px;
  }

  .group-title .material-icons {
    font-size: 1rem;
  }

  .student-count {
    font-size: 0.75rem;
  }

  .section-list {
    gap: 18px;
  }

  .section-title {
    font-size: 0.95rem;
    padding: 6px 10px;
    margin-bottom: 10px;
  }

  .students-table {
    font-size: 0.85rem;
  }

  .students-table th,
  .students-table td {
    padding: 8px 10px;
  }

  .attendance-btn {
    padding: 4px 8px;
    min-width: 100px;
  }

  .attendance-btn .material-icons {
    font-size: 15px;
  }

  .attendance-status {
    font-size: 0.75rem;
  }

  .student-type-badge {
    padding: 1px 5px;
    font-size: 0.65rem;
  }


  .action-toggle-label {
    font-size: 0.8rem;
  }

  .action-toggle-slider {
    width: 42px;
    height: 20px;
  }

  .action-toggle-slider::before {
    width: 16px;
    height: 16px;
  }

  .action-toggle input[type="checkbox"]:checked + .action-toggle-slider::before {
    transform: translateX(22px);
  }
}

@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .class-list {
    padding: 1.2rem;
  }

  .header-content h1 {
    font-size: 1.6rem;
  }

  .header-content h1 .material-icons {
    font-size: 1.6rem;
  }

  .header-background {
    font-size: 4rem;
    right: 2rem;
  }

  .subtitle {
    font-size: 0.9rem;
  }

  .divider {
    margin: 0.8rem 0;
  }

  .title-row {
    gap: 8px;
  }

  .action-buttons {
    gap: 4px;
  }

  .back-btn {
    width: 28px;
    height: 28px;
  }

  .back-btn .material-icons {
    font-size: 1.1rem;
  }

  .attendance-records-btn,
  .recent-sessions-btn,
  .create-attendance-btn,
  .export-main-btn {
    padding: 5px 8px;
    font-size: 0.75rem;
  }

  .attendance-records-btn .material-icons,
  .recent-sessions-btn .material-icons,
  .create-attendance-btn .material-icons,
  .export-main-btn .material-icons {
    font-size: 0.9rem;
  }

  .export-dropdown {
    min-width: 240px;
  }

  .export-options-header {
    padding: 12px 12px 8px;
  }

  .export-options-header h3 {
    font-size: 0.9rem;
  }

  .export-data-selection {
    padding: 12px;
  }

  .export-checkboxes {
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 6px;
  }

  .export-checkboxes label {
    font-size: 0.75rem;
  }

  .export-actions {
    padding: 12px;
    gap: 6px;
  }

  .export-btn {
    padding: 6px 10px;
    font-size: 0.75rem;
  }

  .filter-controls {
    padding: 1.2rem;
    gap: 12px;
    margin-bottom: 16px;
  }

  .filter-applied-indicator {
    padding: 6px 10px;
    font-size: 0.75rem;
  }

  .filter-applied-indicator .material-icons {
    font-size: 0.8rem;
  }

  .clear-filter-btn {
    width: 18px;
    height: 18px;
  }

  .clear-filter-btn .material-icons {
    font-size: 0.7rem;
  }

  .search-box {
    padding: 8px 12px;
    max-width: 300px;
  }

  .search-box .material-icons {
    font-size: 16px;
  }

  .filters-row {
    gap: 12px;
  }

  .filter-section label {
    font-size: 0.75rem;
  }

  .filter-select {
    padding: 5px 8px;
    font-size: 0.8rem;
    min-width: 140px;
  }

  .search-box input {
    padding: 5px 0;
    font-size: 0.8rem;
  }

  .search-box .material-icons {
    font-size: 0.9rem;
  }

  .class-list-container {
    gap: 16px;
    margin-top: 12px;
  }

  .subject-header {
    padding: 1.2rem;
  }

  .subject-header h2 {
    font-size: 1.1rem;
    margin-bottom: 8px;
  }

  .subject-meta-item {
    font-size: 0.7rem;
    padding: 2px 6px;
  }

  .subject-body {
    padding: 15px;
  }

  .students-group {
    margin-bottom: 16px;
  }

  .group-title {
    font-size: 0.95rem;
    margin-bottom: 12px;
    gap: 5px;
  }

  .group-title .material-icons {
    font-size: 0.95rem;
  }

  .student-count {
    font-size: 0.7rem;
  }

  .section-list {
    gap: 15px;
  }

  .section-title {
    font-size: 0.9rem;
    padding: 5px 8px;
    margin-bottom: 8px;
  }

  .students-table {
    font-size: 0.8rem;
  }

  .students-table th,
  .students-table td {
    padding: 6px 8px;
  }

  .attendance-btn {
    padding: 3px 6px;
    min-width: 90px;
  }

  .attendance-btn .material-icons {
    font-size: 14px;
  }

  .attendance-status {
    font-size: 0.7rem;
  }

  .student-type-badge {
    padding: 1px 4px;
    font-size: 0.6rem;
  }


  .action-toggle-label {
    font-size: 0.75rem;
  }

  .action-toggle-slider {
    width: 40px;
    height: 18px;
  }

  .action-toggle-slider::before {
    width: 14px;
    height: 14px;
  }

  .action-toggle input[type="checkbox"]:checked + .action-toggle-slider::before {
    transform: translateX(20px);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .class-list {
    padding: 10px;
  }
  
  .header-background {
    font-size: 3rem;
    top: 60%;
    right: 1rem;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .filter-controls {
    flex-direction: column;
    padding: 15px;
    gap: 15px;
  }

  .filter-applied-indicator {
    padding: 10px 12px;
    font-size: 0.85rem;
  }

  .filter-applied-indicator .material-icons {
    font-size: 1rem;
  }

  .clear-filter-btn {
    width: 22px;
    height: 22px;
  }

  .clear-filter-btn .material-icons {
    font-size: 0.9rem;
  }

  .search-box {
    max-width: 100%;
    padding: 12px 16px;
  }

  .filters-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .filter-select {
    min-width: 100%;
  }
  
  .students-table {
    font-size: 0.85rem;
  }
  
  .students-table th,
  .students-table td {
    padding: 10px;
  }
  
  .subject-body {
    padding: 15px;
  }
  
  .subject-header h2 {
    font-size: 1.3rem;
  }
  
  .group-title {
    font-size: 1.1rem;
  }
  
  .section-title {
    font-size: 1rem;
  }
  
  .create-attendance-btn {
    font-size: 0.85rem;
    padding: 8px 12px;
  }
  
  .create-attendance-btn .material-icons {
    font-size: 1rem;
  }
  
  .title-row {
    flex-wrap: wrap;
  }

  .recent-sessions-container {
    padding: 15px;
  }

  .recent-sessions-container .section-title {
    margin-bottom: 15px;
  }

  .session-card {
    padding: 12px 15px;
  }

  .session-title {
    font-size: 1rem;
  }

  .session-subject {
    font-size: 0.8rem;
  }

  .session-date {
    font-size: 0.7rem;
  }

  .scanner-btn {
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  .scanner-btn .material-icons {
    font-size: 0.9rem;
  }

  .action-buttons {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
    width: 100%;
  }
  
  .attendance-records-btn, 
  .recent-sessions-btn, 
  .create-attendance-btn,
  .export-main-btn {
    font-size: 0.8rem;
    padding: 8px 10px;
  }

  .export-dropdown {
    min-width: 280px;
    right: -50px;
  }

  .export-options-header {
    padding: 15px 15px 10px;
  }

  .export-options-header h3 {
    font-size: 1rem;
  }

  .export-data-selection {
    padding: 15px;
  }

  .export-checkboxes {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .export-checkboxes label {
    font-size: 0.85rem;
  }

  .export-actions {
    padding: 15px;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .export-btn {
    padding: 10px 12px;
    font-size: 0.85rem;
  }
  
  .attendance-btn {
    min-width: 100px;
    padding: 5px 10px;
  }
  
  .attendance-status {
    font-size: 0.8rem;
  }

  .student-type-badge {
    padding: 2px 6px;
    font-size: 0.7rem;
  }

  .action-toggle {
    gap: 8px;
  }

  .action-toggle-label {
    font-size: 0.85rem;
  }

  .action-toggle-slider {
    width: 42px;
    height: 22px;
  }

  .action-toggle-slider::before {
    width: 18px;
    height: 18px;
  }

  .action-toggle input[type="checkbox"]:checked + .action-toggle-slider::before {
    transform: translateX(20px);
  }
}

/* Extra adjustments for slim devices */
@media (max-width: 480px) {
  .class-list {
    padding: 8px;
  }
  
  .header-content h1 {
    font-size: 1.5rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.5rem;
  }
  
  .title-row {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    gap: 10px;
  }
  
  .back-btn {
    align-self: flex-start;
  }
  
  .action-buttons {
    width: 100%;
    flex-direction: column;
    gap: 8px;
    margin-top: 15px;
  }
  
  .attendance-records-btn, 
  .recent-sessions-btn, 
  .create-attendance-btn {
    width: 100%;
    justify-content: center;
    margin-left: 0;
    padding: 10px;
    font-size: 0.85rem;
  }
  
  .attendance-btn {
    min-width: auto;
    padding: 4px 8px;
  }
  
  .attendance-status {
    font-size: 0.75rem;
  }

  .student-type-badge {
    padding: 1px 4px;
    font-size: 0.6rem;
  }

  .action-toggle {
    gap: 6px;
  }

  .action-toggle-label {
    font-size: 0.8rem;
  }

  .action-toggle-slider {
    width: 40px;
    height: 20px;
  }

  .action-toggle-slider::before {
    width: 16px;
    height: 16px;
  }

  .action-toggle input[type="checkbox"]:checked + .action-toggle-slider::before {
    transform: translateX(18px);
  }
  
  .attendance-btn .material-icons {
    font-size: 16px;
  }
  
  .students-table {
    font-size: 0.75rem;
  }
  
  .students-table th,
  .students-table td {
    padding: 6px 8px;
  }
  
  /* Make tables more compact and scrollable on small screens */
  .students-table-container {
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Hide some table columns on mobile to save space */
  .students-table th:nth-child(3),
  .students-table td:nth-child(3) {
    display: none;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
  }
  
  .action-btn .material-icons {
    font-size: 0.9rem;
  }
  
  .subject-card {
    margin-bottom: 15px;
  }
  
  .subject-header {
    padding: 15px;
  }
  
  .subject-body {
    padding: 10px;
  }
  
  .students-group {
    margin-bottom: 20px;
  }
  
  .group-title {
    font-size: 1rem;
    margin-bottom: 15px;
  }
  
  .section-title {
    font-size: 0.9rem;
    padding: 8px 10px;
    margin-bottom: 10px;
  }
  
  .modal-container {
    width: 95%;
    max-width: 95%;
    margin: 0 10px;
  }
  
  .modal-header h2 {
    font-size: 1.2rem;
  }
  
  .form-input {
    font-size: 0.9rem;
  }

  .recent-sessions-container {
    padding: 10px;
  }

  .recent-sessions-container .section-title {
    margin-bottom: 10px;
  }

  .session-card {
    padding: 10px 12px;
  }

  .session-title {
    font-size: 0.9rem;
  }

  .session-subject {
    font-size: 0.7rem;
  }

  .session-date {
    font-size: 0.6rem;
  }

  .scanner-btn {
    padding: 5px 8px;
    font-size: 0.7rem;
  }

  .scanner-btn .material-icons {
    font-size: 0.8rem;
  }

  /* Improve table display on very small screens */
  .students-table {
    table-layout: fixed;
    width: 100%;
  }
  
  .students-table th:first-child,
  .students-table td:first-child {
    width: 35%;
  }
  
  .students-table th:nth-child(2),
  .students-table td:nth-child(2) {
    width: 25%;
  }
  
  .students-table th:last-child,
  .students-table td:last-child {
    width: 40%;
  }
}

/* Hide specific columns on mobile */
@media (max-width: 600px) {
  .hide-on-mobile {
    display: none;
  }
  
  /* Hide Grade & Section and Type columns on mobile */
  .students-table th:nth-child(2),
  .students-table td:nth-child(2),
  .students-table th:nth-child(3),
  .students-table td:nth-child(3) {
    display: none;
  }
  
  /* Ensure attendance column is properly displayed when enabled */
  .students-table th:last-child,
  .students-table td:last-child {
    display: table-cell;
    width: 40%;
  }
  
  /* Adjust name column width since other columns are hidden */
  .students-table th:first-child,
  .students-table td:first-child {
    width: 60%;
  }
}

/* Attendance button styles */
.attendance-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px !important; /* Override the action-btn border-radius */
  background-color: #f5f5f5;
  color: #999;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  width: auto;
  min-width: 120px;
}

.attendance-btn.present {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.attendance-btn:hover {
  background-color: #e0e0e0;
  transform: translateY(-2px);
}

.attendance-btn.present:hover {
  background-color: #c8e6c9;
}

.attendance-btn .material-icons {
  font-size: 18px;
}

.attendance-status {
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
}

/* Attendance Records Button */
.attendance-records-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.attendance-records-btn:hover {
  background: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.attendance-records-btn .material-icons {
  font-size: 1.2rem;
}

/* Export Controls */
.export-controls {
  position: relative;
  display: inline-block;
}

.export-main-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.export-main-btn:hover {
  background: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.export-main-btn .material-icons {
  font-size: 1.2rem;
}

.dropdown-icon {
  transition: transform 0.3s ease;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.export-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 300px;
  margin-top: 8px;
  overflow: hidden;
}

.export-options-header {
  padding: 20px 20px 15px;
  border-bottom: 1px solid #eee;
  background: #f9f9f9;
}

.export-options-header h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.export-note {
  margin: 0;
  color: #666;
  font-size: 0.85rem;
}

.export-data-selection {
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.export-data-selection h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1rem;
  font-weight: 500;
}

.export-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.export-checkboxes label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
  user-select: none;
}

.export-checkboxes input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #159750;
}

.export-actions {
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.export-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.export-btn .material-icons {
  font-size: 1.1rem;
}

.export-btn.csv {
  background: #28a745;
}

.export-btn.csv:hover {
  background: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.export-btn.excel {
  background: #1d6f42;
}

.export-btn.excel:hover {
  background: #155724;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.export-btn.pdf {
  background: #dc3545;
}

.export-btn.pdf:hover {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.export-btn.print {
  background: #6c757d;
}

.export-btn.print:hover {
  background: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}


.radio-group {
  display: flex;
  gap: 20px;
  margin: 5px 0;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 5px;
}

.form-help {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-top: 4px;
}

.modal-error {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.modal-error .material-icons {
  font-size: 18px;
}

/* Pagination Toggle Styles */
.pagination-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #159750;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.toggle-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
  user-select: none;
}

/* Pagination Controls */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  margin-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
  flex-wrap: wrap;
  gap: 15px;
}

.pagination-info {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;
  min-width: 40px;
  height: 40px;
}

.pagination-btn:hover:not(:disabled) {
  background: #159750;
  color: white;
  border-color: #159750;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
  color: #999;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.page-btn:hover {
  background: #f0f0f0;
  border-color: #159750;
}

.page-btn.active {
  background: #159750;
  color: white;
  border-color: #159750;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #666;
}

.items-per-page label {
  font-weight: 500;
  white-space: nowrap;
}

.items-per-page select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.items-per-page select:focus {
  outline: none;
  border-color: #159750;
  box-shadow: 0 0 0 2px rgba(21, 151, 80, 0.1);
}

/* Paginated Students Container */
.paginated-students-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.paginated-students-container .students-group {
  margin-bottom: 0;
}

.paginated-students-container .group-title {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  padding: 20px;
  margin: 0;
  border-radius: 0;
  border-bottom: none;
}

.paginated-students-container .group-title .material-icons {
  color: white;
}

.paginated-students-container .group-title .student-count {
  color: rgba(255, 255, 255, 0.8);
}

.paginated-students-container .students-table-container {
  padding: 0;
}

.paginated-students-container .students-table {
  margin: 0;
}

/* Responsive pagination */
@media (max-width: 768px) {
  .pagination-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .pagination-buttons {
    justify-content: center;
    order: 2;
  }
  
  .pagination-info {
    text-align: center;
    order: 1;
  }
  
  .items-per-page {
    justify-content: center;
    order: 3;
  }
  
  .pagination-btn {
    padding: 6px 10px;
    font-size: 0.85rem;
    min-width: 36px;
    height: 36px;
  }
  
  .page-btn {
    width: 36px;
    height: 36px;
    font-size: 0.85rem;
  }
}

@media (max-width: 480px) {
  .pagination-toggle {
    margin-right: 10px;
  }
  
  .toggle-switch {
    width: 42px;
    height: 22px;
  }
  
  .toggle-slider:before {
    height: 16px;
    width: 16px;
  }
  
  input:checked + .toggle-slider:before {
    transform: translateX(20px);
  }
  
  .toggle-label {
    font-size: 0.85rem;
  }
  
  .pagination-btn {
    padding: 5px 8px;
    font-size: 0.8rem;
    min-width: 32px;
    height: 32px;
  }
  
  .page-btn {
    width: 32px;
    height: 32px;
    font-size: 0.8rem;
  }
  
  .pagination-pages {
    gap: 2px;
  }
  
  .pagination-buttons {
    gap: 4px;
  }
}

/* Additional styles for very small screens */
@media (max-width: 400px) {
  .attendance-btn {
    min-width: auto;
    padding: 3px 6px;
    border-radius: 16px !important;
  }
  
  .attendance-status {
    max-width: 60px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.7rem;
  }
  
  /* Prevent horizontal scrolling in the table container */
  .students-table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    max-width: 100vw;
    margin: 0 -10px;
    padding: 0 10px;
  }
  
  /* Compact filter controls */
  .filter-controls {
    flex-direction: column;
    padding: 8px;
    gap: 12px;
  }

  .search-box {
    max-width: 100%;
    padding: 10px 12px;
  }

  .filters-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .filter-section, .search-box {
    width: 100%;
  }
  
  /* Fix modal size and positioning */
  .modal-container {
    width: 100%;
    max-width: 100%;
    margin: 0;
    border-radius: 0;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .modal-body {
    flex: 1;
    overflow-y: auto;
  }
  
  /* Further adjust column widths for very small screens */
  .students-table th:first-child,
  .students-table td:first-child {
    width: 60%;
  }
  
  .students-table th:last-child,
  .students-table td:last-child {
    width: 40%;
  }
}
</style> 