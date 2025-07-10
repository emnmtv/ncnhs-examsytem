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
            <router-link to="/attendance-records" class="attendance-records-btn">
              <span class="material-icons">fact_check</span>
              Attendance Records
            </router-link>
            <button @click="openRecentSessionsModal" class="recent-sessions-btn">
              <span class="material-icons">history</span>
              Recent Sessions
            </button>
            <button @click="openAttendanceModal" class="create-attendance-btn">
              <span class="material-icons">qr_code_scanner</span>
              Take Attendance
            </button>
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
        <label for="sourceFilter">Source:</label>
        <select id="sourceFilter" v-model="selectedSource" class="filter-select">
          <option value="all">All Students</option>
          <option value="section">Section Students</option>
          <option value="direct">Direct Students</option>
        </select>
      </div>
      
      <div class="search-box">
        <span class="material-icons">search</span>
        <input type="text" v-model="searchQuery" placeholder="Search students by name or LRN...">
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
      <!-- Today's Attendance Indicator -->
      <div class="today-indicator">
        <span class="material-icons">today</span>
        Marking attendance for today: {{ formatDate(new Date()) }}
      </div>
      
      <!-- Subject Cards -->
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
          <!-- Section Students -->
          <div v-if="showSectionStudents && subject.sectionStudents.length > 0" class="students-group">
            <h3 class="group-title">
              <span class="material-icons">groups</span>
              Section Students
            </h3>
            <div class="section-list">
              <div v-for="(students, section) in groupedSectionStudents(subject)" :key="section" class="section-group">
                <h4 class="section-title">{{ section }} <span class="student-count">({{ students.length }})</span></h4>
                <div class="students-table-container">
                  <table class="students-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>LRN</th>
                        <th>Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="student in students" :key="student.id">
                        <td>{{ student.lastName }}, {{ student.firstName }}</td>
                        <td>{{ student.lrn }}</td>
                        <td class="actions">
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
            </div>
          </div>

          <!-- Direct Students -->
          <div v-if="showDirectStudents && subject.directStudents.length > 0" class="students-group">
            <h3 class="group-title">
              <span class="material-icons">person</span>
              Direct Students <span class="student-count">({{ subject.directStudents.length }})</span>
            </h3>
            <div class="students-table-container">
              <table class="students-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>LRN</th>
                    <th class="hide-on-mobile">Section</th>
                    <th>Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="student in subject.directStudents" :key="student.id">
                    <td>{{ student.lastName }}, {{ student.firstName }}</td>
                    <td>{{ student.lrn }}</td>
                    <td class="hide-on-mobile">Grade {{ student.gradeLevel }}-{{ student.section }}</td>
                    <td class="actions">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getTeacherAssignedSubjects, getSubjectDirectStudents, getStudentsBySection, createAttendanceSession as createSession, getAttendanceSessions, markAttendance, getSessionAttendance } from '@/services/authService';

const router = useRouter();
const subjects = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');
const selectedSubjectId = ref('');
const selectedSource = ref('all');
const attendanceMarked = ref({});  // Track which students are marked present
const todaySessions = ref({}); // Track today's sessions by subjectId

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

// Determine if we should show section students based on filter
const showSectionStudents = computed(() => {
  return selectedSource.value === 'all' || selectedSource.value === 'section';
});

// Determine if we should show direct students based on filter
const showDirectStudents = computed(() => {
  return selectedSource.value === 'all' || selectedSource.value === 'direct';
});

// Check if there are any students to display
const hasStudents = computed(() => {
  return filteredSubjects.value.some(subject => hasStudentsInSubject(subject));
});

// Helper function to check if a subject has students based on current filters
const hasStudentsInSubject = (subject) => {
  if (showSectionStudents.value && subject.sectionStudents.some(s => matchesSearch(s))) {
    return true;
  }
  
  if (showDirectStudents.value && subject.directStudents.some(s => matchesSearch(s))) {
    return true;
  }
  
  return false;
};

// Helper function to check if a student matches the search query
const matchesSearch = (student) => {
  if (!searchQuery.value) return true;
  
  const query = searchQuery.value.toLowerCase();
  return student.firstName.toLowerCase().includes(query) ||
         student.lastName.toLowerCase().includes(query) ||
         student.lrn.toString().includes(query);
};

// Group section students by section
const groupedSectionStudents = (subject) => {
  const groups = {};
  
  if (!subject.sectionStudents) return groups;
  
  const filteredStudents = subject.sectionStudents.filter(s => matchesSearch(s));
  
  filteredStudents.forEach(student => {
    const sectionKey = `Grade ${student.gradeLevel}-${student.section}`;
    if (!groups[sectionKey]) {
      groups[sectionKey] = [];
    }
    groups[sectionKey].push(student);
  });
  
  return groups;
};

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
watch([selectedSubjectId, selectedSource, searchQuery], () => {
  // Filter is handled by computed properties, no need to reload data
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

onMounted(() => {
  // Just load classes - loadRecentSessions will be called after classes are loaded
  loadClasses();
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
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 25px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
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
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.search-box input {
  flex: 1;
  padding: 10px 0;
  border: none;
  outline: none;
  font-size: 1rem;
}

.search-box .material-icons {
  color: #aaa;
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
  background-color: #e8f5e9;
  color: #2e7d32;
}

.view-btn:hover {
  background-color: #c8e6c9;
  transform: translateY(-2px);
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
  background: #2196f3;
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
  background: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.recent-sessions-btn .material-icons {
  font-size: 1.2rem;
}

/* Create Attendance Button */
.create-attendance-btn {
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
  .create-attendance-btn {
    font-size: 0.8rem;
    padding: 8px 10px;
  }
  
  .attendance-btn {
    min-width: 100px;
    padding: 5px 10px;
  }
  
  .attendance-status {
    font-size: 0.8rem;
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
  
  /* Hide LRN column on mobile */
  .students-table th:nth-child(2),
  .students-table td:nth-child(2) {
    display: none;
  }
  
  /* Ensure attendance column is properly displayed */
  .students-table th:last-child,
  .students-table td:last-child {
    display: table-cell;
    width: 40%;
  }
  
  /* Adjust name column width since LRN is hidden */
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
  background: #673ab7;
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
  background: #5e35b1;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.attendance-records-btn .material-icons {
  font-size: 1.2rem;
}

/* Today's Attendance Indicator */
.today-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background-color: #e8f5e9;
  color: #2e7d32;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
}

.today-indicator .material-icons {
  font-size: 1.2rem;
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
    width: 50%;
  }
  
  .students-table th:last-child,
  .students-table td:last-child {
    width: 50%;
  }
}
</style> 