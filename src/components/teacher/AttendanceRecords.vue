<template>
  <div class="attendance-records">
    <div class="header-container">
      <div class="header-content">
        <div class="title-row">
          <router-link :to="{ name: 'TeacherClassList' }" class="back-btn">
            <span class="material-icons">arrow_back</span>
          </router-link>
          <h1>Attendance Records<span class="material-icons">fact_check</span></h1>
        </div>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">View and manage student attendance records</p>
        </div>
      </div>
      <div class="header-background">ATTENDANCE</div>
    </div>

    <!-- Filter Controls -->
    <div class="filter-controls">
      <div class="filter-section">
        <label for="subjectFilter">Subject:</label>
        <select id="subjectFilter" v-model="selectedSubjectId" class="filter-select" @change="loadAttendanceSessions">
          <option value="" disabled>Select a subject</option>
          <option v-for="subject in subjects" :key="subject.subject.id" :value="subject.subject.id">
            {{ subject.subject.name }} ({{ subject.subject.code }})
          </option>
        </select>
      </div>
      
      <div class="filter-section">
        <label for="dateRangeStart">Date Range:</label>
        <div class="date-range">
          <input type="date" id="dateRangeStart" v-model="dateRange.start" class="date-input" @change="loadAttendanceSessions">
          <span class="date-separator">to</span>
          <input type="date" id="dateRangeEnd" v-model="dateRange.end" class="date-input" @change="loadAttendanceSessions">
        </div>
      </div>
      
      <div class="search-box">
        <span class="material-icons">search</span>
        <input type="text" v-model="searchQuery" placeholder="Search students by name or LRN...">
      </div>
    </div>

    <!-- Today's Attendance Indicator -->
    <div v-if="isViewingToday" class="today-indicator">
      <span class="material-icons">today</span>
      Showing attendance records for today
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading attendance records...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadAttendanceSessions" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <!-- No Subject Selected -->
    <div v-else-if="!selectedSubjectId" class="empty-state">
      <span class="material-icons">menu_book</span>
      <p>Please select a subject to view attendance records</p>
    </div>

    <!-- No Records Found -->
    <div v-else-if="!loading && !error && attendanceSessions.length === 0" class="empty-state">
      <span class="material-icons">event_busy</span>
      <p>No attendance records found for the selected period</p>
      <p class="subtitle">Try selecting a different date range or subject</p>
    </div>

    <!-- Attendance Statistics -->
    <div v-else-if="selectedSubjectId && !loading && !error" class="statistics-container">
      <div class="statistics-card">
        <h3>Attendance Statistics</h3>
        <div class="statistics-grid">
          <div class="statistic">
            <div class="statistic-value">{{ statistics.totalSessions }}</div>
            <div class="statistic-label">Sessions</div>
          </div>
          <div class="statistic">
            <div class="statistic-value">{{ statistics.averageAttendanceRate }}%</div>
            <div class="statistic-label">Avg. Attendance</div>
          </div>
          <div class="statistic">
            <div class="statistic-value">{{ statistics.totalStudents }}</div>
            <div class="statistic-label">Students</div>
          </div>
          <div class="statistic">
            <div class="statistic-value">{{ statistics.perfectAttendance }}</div>
            <div class="statistic-label">Perfect Attendance</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Attendance Records -->
    <div v-if="selectedSubjectId && !loading && !error && attendanceSessions.length > 0" class="attendance-container">
      <!-- Sessions Accordion -->
      <div v-for="session in attendanceSessions" :key="session.id" class="session-accordion">
        <div class="session-header" @click="toggleSession(session.id)">
          <div class="session-info">
            <div class="session-title">{{ session.title || 'Untitled Session' }}</div>
            <div class="session-date">{{ formatDate(session.date) }}</div>
          </div>
          <div class="session-stats">
            <div class="stat present">
              <span class="material-icons">check_circle</span>
              {{ getSessionStats(session).present }}
            </div>
            <div class="stat absent">
              <span class="material-icons">cancel</span>
              {{ getSessionStats(session).absent }}
            </div>
            <div class="stat late">
              <span class="material-icons">schedule</span>
              {{ getSessionStats(session).late }}
            </div>
          </div>
          <span class="material-icons expand-icon">
            {{ expandedSessions.includes(session.id) ? 'expand_less' : 'expand_more' }}
          </span>
        </div>
        
        <div v-if="expandedSessions.includes(session.id)" class="session-content">
          <div v-if="loadingSessionDetails[session.id]" class="loading-details">
            <span class="material-icons-round rotating">sync</span>
            <span>Loading attendance details...</span>
          </div>
          <div v-else class="attendance-table-container">
            <table class="attendance-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>LRN</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="record in filteredSessionRecords(session)" :key="record.id">
                  <td>{{ record.student.lastName }}, {{ record.student.firstName }}</td>
                  <td>{{ record.student.lrn }}</td>
                  <td>
                    <span class="status-badge" :class="record.status">
                      {{ record.status.charAt(0).toUpperCase() + record.status.slice(1) }}
                    </span>
                  </td>
                  <td>{{ record.timestamp ? formatTime(record.timestamp) : (record.checkInTime ? formatTime(record.checkInTime) : 'N/A') }}</td>
                  <td class="actions">
                    <div class="status-buttons">
                      <button 
                        class="status-btn present" 
                        :class="{ active: record.status === 'present' }"
                        @click="updateAttendanceStatus(record.id, 'present')">
                        <span class="material-icons">check_circle</span>
                      </button>
                      <button 
                        class="status-btn late" 
                        :class="{ active: record.status === 'late' }"
                        @click="updateAttendanceStatus(record.id, 'late')">
                        <span class="material-icons">schedule</span>
                      </button>
                      <button 
                        class="status-btn absent" 
                        :class="{ active: record.status === 'absent' }"
                        @click="updateAttendanceStatus(record.id, 'absent')">
                        <span class="material-icons">cancel</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { getTeacherAssignedSubjects, getAttendanceSessions, getSessionAttendance, markAttendance, getAttendanceStatistics } from '@/services/authService';

// State
const subjects = ref([]);
const selectedSubjectId = ref('');
const attendanceSessions = ref([]);
const sessionRecords = ref({});  // Map of sessionId -> records
const expandedSessions = ref([]);
const loading = ref(true);
const loadingSessionDetails = ref({});
const error = ref(null);
const searchQuery = ref('');
const statistics = ref({
  totalSessions: 0,
  totalStudents: 0,
  averageAttendanceRate: 0,
  perfectAttendance: 0
});

// Get current date and first day of current month
const today = new Date();
const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

// Date range filter with default to current month
const dateRange = ref({
  start: firstDayOfMonth.toISOString().split('T')[0],
  end: today.toISOString().split('T')[0]
});

// Check if viewing today's attendance
const isViewingToday = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return dateRange.value.start <= today && dateRange.value.end >= today;
});

// Toggle session expansion
const toggleSession = async (sessionId) => {
  const index = expandedSessions.value.indexOf(sessionId);
  
  if (index === -1) {
    // Expand the session
    expandedSessions.value.push(sessionId);
    
    // Load session details if not already loaded
    if (!sessionRecords.value[sessionId]) {
      await loadSessionAttendance(sessionId);
    }
  } else {
    // Collapse the session
    expandedSessions.value.splice(index, 1);
  }
};

// Load attendance records for a session
const loadSessionAttendance = async (sessionId) => {
  try {
    loadingSessionDetails.value[sessionId] = true;
    
    const records = await getSessionAttendance(sessionId);
    
    // Process and store the records
    sessionRecords.value[sessionId] = Array.isArray(records) ? records : [];
    
  } catch (err) {
    console.error(`Failed to load attendance details for session ${sessionId}:`, err);
    // Show error notification
    showNotification('error', `Failed to load attendance details: ${err.message}`);
  } finally {
    loadingSessionDetails.value[sessionId] = false;
  }
};

// Update a student's attendance status
const updateAttendanceStatus = async (recordId, status) => {
  try {
    // Find the record to update
    let sessionId = null;
    let record = null;
    
    // Search through all sessions to find the record
    for (const [sid, records] of Object.entries(sessionRecords.value)) {
      const foundRecord = records.find(r => r.id === recordId);
      if (foundRecord) {
        sessionId = parseInt(sid);
        record = foundRecord;
        break;
      }
    }
    
    if (!record) {
      throw new Error('Attendance record not found');
    }
    
    // Update the record through the API
    await markAttendance(sessionId, record.student.id, status);
    
    // Update local state
    record.status = status;
    
    // Show success notification
    showNotification('success', `Attendance updated for ${record.student.firstName} ${record.student.lastName}`);
    
  } catch (err) {
    console.error('Failed to update attendance status:', err);
    showNotification('error', `Failed to update attendance: ${err.message}`);
  }
};

// Load attendance sessions for the selected subject and date range
const loadAttendanceSessions = async () => {
  if (!selectedSubjectId.value) {
    attendanceSessions.value = [];
    return;
  }
  
  try {
    loading.value = true;
    error.value = null;
    
    // Load sessions
    const sessions = await getAttendanceSessions(selectedSubjectId.value);
    
    // Filter by date range
    const filteredSessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      const startDate = new Date(dateRange.value.start);
      const endDate = new Date(dateRange.value.end);
      
      // Reset time components for accurate date comparison
      sessionDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return sessionDate >= startDate && sessionDate <= endDate;
    });
    
    // Sort by date (newest first)
    attendanceSessions.value = filteredSessions.sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    // Load statistics
    await loadAttendanceStatistics();
    
  } catch (err) {
    console.error('Failed to load attendance sessions:', err);
    error.value = err.message || 'Failed to load attendance sessions';
    attendanceSessions.value = [];
  } finally {
    loading.value = false;
  }
};

// Load attendance statistics
const loadAttendanceStatistics = async () => {
  if (!selectedSubjectId.value) return;
  
  try {
    const stats = await getAttendanceStatistics(
      selectedSubjectId.value,
      dateRange.value.start,
      dateRange.value.end
    );
    
    statistics.value = {
      totalSessions: stats.totalSessions || 0,
      totalStudents: stats.totalStudents || 0,
      averageAttendanceRate: stats.averageAttendanceRate ? Math.round(stats.averageAttendanceRate) : 0,
      perfectAttendance: stats.perfectAttendance || 0
    };
    
  } catch (err) {
    console.error('Failed to load attendance statistics:', err);
    // Set default values
    statistics.value = {
      totalSessions: attendanceSessions.value.length,
      totalStudents: 0,
      averageAttendanceRate: 0,
      perfectAttendance: 0
    };
  }
};

// Get statistics for a specific session
const getSessionStats = (session) => {
  const records = sessionRecords.value[session.id] || [];
  
  return {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    late: records.filter(r => r.status === 'late').length
  };
};

// Filter session records based on search query
const filteredSessionRecords = (session) => {
  const records = sessionRecords.value[session.id] || [];
  
  if (!searchQuery.value) return records;
  
  const query = searchQuery.value.toLowerCase();
  return records.filter(record => {
    const student = record.student;
    return student.firstName.toLowerCase().includes(query) ||
           student.lastName.toLowerCase().includes(query) ||
           student.lrn.toString().includes(query);
  });
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
};

// Format time for display
const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  try {
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Time';
    
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (err) {
    console.error('Error formatting time:', err);
    return 'Error';
  }
};

// Show notification
const showNotification = (type, message) => {
  // This is a placeholder - you would implement a notification system
  console.log(`[${type}] ${message}`);
  // You could use a toast notification library or custom implementation
};

// Load subjects
const loadSubjects = async () => {
  try {
    loading.value = true;
    
    const teacherSubjects = await getTeacherAssignedSubjects();
    subjects.value = teacherSubjects;
    
    // If there's only one subject, select it automatically
    if (teacherSubjects.length === 1) {
      selectedSubjectId.value = teacherSubjects[0].subject.id;
      await loadAttendanceSessions();
    }
    
  } catch (err) {
    console.error('Failed to load subjects:', err);
    error.value = err.message || 'Failed to load subjects';
  } finally {
    loading.value = false;
  }
};

// Watch for search query changes
watch(searchQuery, () => {
  // No need to reload data, filtering is done in computed property
});

// Watch for subject selection changes
watch(selectedSubjectId, (newSubjectId) => {
  if (newSubjectId) {
    loadAttendanceSessions();
  } else {
    attendanceSessions.value = [];
    statistics.value = {
      totalSessions: 0,
      totalStudents: 0,
      averageAttendanceRate: 0,
      perfectAttendance: 0
    };
  }
});

// Watch for date range changes
watch([() => dateRange.value.start, () => dateRange.value.end], () => {
  if (selectedSubjectId.value) {
    loadAttendanceSessions();
  }
});

// Initialize component
onMounted(() => {
  loadSubjects();
});
</script>

<style scoped>
.attendance-records {
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

.title-row {
  display: flex;
  align-items: center;
  gap: 15px;
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

.date-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.date-input {
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
}

.date-separator {
  color: #666;
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

/* Loading and Error States */
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

.error-state .material-icons-round {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #f44336;
}

.empty-state .material-icons {
  font-size: 3rem;
  margin-bottom: 1rem;
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

/* Statistics */
.statistics-container {
  margin-bottom: 25px;
}

.statistics-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.statistics-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.2rem;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.statistic {
  text-align: center;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.statistic-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: #159750;
  margin-bottom: 5px;
}

.statistic-label {
  font-size: 0.9rem;
  color: #666;
}

/* Attendance Sessions */
.attendance-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.session-accordion {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f9f9f9;
  cursor: pointer;
  transition: background 0.2s;
}

.session-header:hover {
  background: #f0f0f0;
}

.session-info {
  flex: 1;
}

.session-title {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
}

.session-date {
  font-size: 0.9rem;
  color: #666;
  margin-top: 5px;
}

.session-stats {
  display: flex;
  gap: 15px;
  margin-right: 20px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  font-weight: 500;
}

.stat.present {
  color: #2e7d32;
}

.stat.absent {
  color: #d32f2f;
}

.stat.late {
  color: #f57c00;
}

.stat .material-icons {
  font-size: 1.2rem;
}

.expand-icon {
  color: #666;
  transition: transform 0.3s;
}

.session-content {
  padding: 20px;
  border-top: 1px solid #eee;
}

.loading-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
  color: #666;
}

/* Attendance Table */
.attendance-table-container {
  overflow-x: auto;
}

.attendance-table {
  width: 100%;
  border-collapse: collapse;
}

.attendance-table th {
  text-align: left;
  padding: 12px 15px;
  background: #f5f5f5;
  color: #333;
  font-weight: 600;
  border-bottom: 2px solid #eee;
}

.attendance-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
}

.status-badge {
  display: inline-block;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.present {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.absent {
  background: #ffebee;
  color: #d32f2f;
}

.status-badge.late {
  background: #fff3e0;
  color: #f57c00;
}

.status-buttons {
  display: flex;
  gap: 5px;
}

.status-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s;
}

.status-btn .material-icons {
  font-size: 1.1rem;
}

.status-btn.present {
  background: #f5f5f5;
  color: #aaa;
}

.status-btn.present.active,
.status-btn.present:hover {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-btn.absent {
  background: #f5f5f5;
  color: #aaa;
}

.status-btn.absent.active,
.status-btn.absent:hover {
  background: #ffebee;
  color: #d32f2f;
}

.status-btn.late {
  background: #f5f5f5;
  color: #aaa;
}

.status-btn.late.active,
.status-btn.late:hover {
  background: #fff3e0;
  color: #f57c00;
}

/* Responsive design */
@media (max-width: 768px) {
  .attendance-records {
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
  
  .filter-select,
  .date-input {
    min-width: 100%;
    width: 100%;
  }
  
  .date-range {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    gap: 10px;
  }
  
  .search-box {
    width: 100%;
  }
  
  .session-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    position: relative;
    padding-right: 40px; /* Make space for expand icon */
  }
  
  .session-stats {
    margin-right: 0;
    width: 100%;
    justify-content: flex-start;
  }
  
  .expand-icon {
    position: absolute;
    top: 15px;
    right: 15px;
  }
  
  .status-buttons {
    display: flex;
    flex-direction: row;
    gap: 5px;
  }
  
  .statistics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  /* Make table more mobile-friendly */
  .attendance-table th,
  .attendance-table td {
    padding: 8px 10px;
    font-size: 0.9rem;
  }
}

/* Additional styles for very small screens */
@media (max-width: 480px) {
  .title-row {
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  
  .back-btn {
    margin-bottom: 10px;
  }
  
  .header-content h1 {
    font-size: 1.5rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.5rem;
  }
  
  .statistics-grid {
    grid-template-columns: 1fr;
  }
  
  /* Hide certain columns on very small screens */
  .attendance-table th:nth-child(2), 
  .attendance-table td:nth-child(2) {
    display: none; /* Hide LRN column */
  }
  
  .attendance-table th:nth-child(4), 
  .attendance-table td:nth-child(4) {
    display: none; /* Hide Time column */
  }
  
  /* Make action buttons more touch friendly */
  .status-btn {
    width: 36px;
    height: 36px;
  }
  
  .status-btn .material-icons {
    font-size: 1.2rem;
  }
  
  /* Fix status badge display */
  .status-badge {
    padding: 4px 8px;
    font-size: 0.75rem;
  }
  
  /* Fix session stats display */
  .session-stats {
    gap: 10px;
    flex-wrap: wrap;
  }
  
  .stat {
    font-size: 0.8rem;
  }
  
  .stat .material-icons {
    font-size: 1rem;
  }
  
  /* Make session content padding smaller */
  .session-content {
    padding: 10px;
  }
  
  .attendance-table {
    font-size: 0.85rem;
  }
}

/* Hide specific columns on mobile */
@media (max-width: 600px) {
  .attendance-table th:nth-child(2),
  .attendance-table td:nth-child(2) {
    display: none; /* Hide LRN column */
  }
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
</style> 