<template>
  <div class="manage-subjects">
    <div class="header-container">
      <div class="header-content">
        <h1>My Subjects<span class="material-icons">book</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">View and manage your assigned subjects</p>
        </div>
      </div>
      <div class="header-actions">
        <!-- View Toggle -->
        <div class="view-toggle">
          <button 
            @click="currentView = 'table'" 
            class="view-btn" 
            :class="{ active: currentView === 'table' }"
          >
            <span class="material-icons">table_chart</span>
          </button>
          <button 
            @click="currentView = 'card'" 
            class="view-btn" 
            :class="{ active: currentView === 'card' }"
          >
            <span class="material-icons">grid_view</span>
          </button>
        </div>
        
        <!-- Action Buttons Toggle -->
        <div class="action-toggle-container">
          <label class="action-toggle">
            <input type="checkbox" v-model="actionButtonsEnabled" @change="toggleActionButtons">
            <span class="action-toggle-slider"></span>
            <span class="action-toggle-label">Show Actions</span>
          </label>
        </div>
        
        <router-link v-if="actionButtonsEnabled" to="/attendance-records" class="header-btn attendance-btn">
          <span class="material-icons">fact_check</span>
          Attendance Records
        </router-link>
        <router-link v-if="actionButtonsEnabled" to="/class-list" class="header-btn class-list-btn">
          <span class="material-icons">people</span>
          Class List
        </router-link>
      </div>
      <div class="header-background">SUBJECTS</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading subjects...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadSubjects" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!subjects.length" class="empty-state">
      <span class="material-icons">book</span>
      <p>No subjects assigned yet</p>
      <p class="subtitle">Please contact your administrator to get subjects assigned.</p>
    </div>

    <!-- Card View -->
    <div v-if="currentView === 'card'" class="subjects-grid">
      <div v-for="subject in subjects" :key="subject.id" class="subject-card">
        <div class="subject-header">
          <div class="texture-layer"></div>
          <h2>{{ subject.subject.name }}</h2>
          <div class="subject-meta-container">
            <div class="subject-meta">
              <span class="subject-meta-item">
                <span class="material-icons">code</span>
                {{ subject.subject.code }}
              </span>
              <span v-if="subject.subject.description" class="subject-meta-item">
                <span class="material-icons">description</span>
                {{ subject.subject.description }}
              </span>
            </div>
            <div class="subject-actions-dropdown">
              <button class="dropdown-toggle" @click="toggleDropdown($event)">
                <span class="material-icons">more_vert</span>
              </button>
              <div class="dropdown-menu" @click.stop>
                <button 
                  class="dropdown-item details-btn"
                  @click="viewSubjectDetails(subject); closeAllDropdowns()"
                >
                  <span class="material-icons">info</span>
                  View Details
                </button>
                <router-link 
                  :to="`/subject/${subject.subject.id}/tasks`" 
                  class="dropdown-item"
                  @click="closeAllDropdowns()"
                >
                  <span class="material-icons">assignment</span>
                  View Tasks
                </router-link>
                <router-link 
                  :to="`/class-list?subject=${subject.subject.id}`" 
                  class="dropdown-item"
                  @click="closeAllDropdowns()"
                >
                  <span class="material-icons">people</span>
                  View Classlist
                </router-link>
                <router-link 
                  :to="`/create-task/${subject.subject.id}`" 
                  class="dropdown-item"
                  @click="closeAllDropdowns()"
                >
                  <span class="material-icons">add_task</span>
                  Create New Task
                </router-link>
                <router-link 
                  :to="`/manage-exams?subject=${subject.subject.id}`" 
                  class="dropdown-item"
                  @click="closeAllDropdowns()"
                >
                  <span class="material-icons">quiz</span>
                  View Exams
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <div class="subject-body">
          <div class="subject-info">
            <!-- Sections Info -->
            <div class="info-item">
              <span class="material-icons-round">groups</span>
              <div class="info-content">
                <span class="info-label">Assigned Sections</span>
                <div class="sections-list">
                  <div v-for="section in subject.subject.sections" :key="section.id" 
                       class="section-chip">
                    Grade {{ section.grade }} - {{ section.section }}
                  </div>
                  <div v-if="!subject.subject.sections.length" class="no-data">
                    No sections assigned
                  </div>
                </div>
              </div>
            </div>

            <!-- Direct Students Info -->
            <div class="info-item">
              <span class="material-icons-round">person</span>
              <div class="info-content">
                <span class="info-label">Direct Students</span>
                <div class="direct-students-info">
                  <div v-if="directStudentsCounts[subject.subject.id] > 0" class="students-count">
                    <span class="count-badge">{{ directStudentsCounts[subject.subject.id] }}</span>
                    <span>{{ directStudentsCounts[subject.subject.id] === 1 ? 'student' : 'students' }} directly assigned</span>
                  </div>
                  <div v-else class="no-data">
                    <span class="material-icons">person_off</span>
                    No direct student assignments
                  </div>
                </div>
              </div>
            </div>

            <!-- Schedule Info -->
            <div class="info-item">
              <span class="material-icons-round">schedule</span>
              <div class="info-content">
                <span class="info-label">Schedule</span>
                <div class="schedule-info">
                  <div v-if="subject.subject.scheduleType" class="schedule-display">
                    <div class="schedule-type-badge" :class="subject.subject.scheduleType.toLowerCase()">
                      {{ formatScheduleType(subject.subject.scheduleType) }}
                    </div>
                    <div class="schedule-details">
                      <span class="schedule-days">
                        <template v-if="subject.subject.scheduleType === 'SINGLE'">
                          {{ formatDays(subject.subject.daysOfWeek) }}
                        </template>
                        <template v-else-if="subject.subject.scheduleType === 'RANGE'">
                          {{ formatDayRange(subject.subject.daysOfWeek) }}
                        </template>
                        <template v-else>
                          {{ formatMultipleDays(subject.subject.daysOfWeek) }}
                        </template>
                      </span>
                      <span class="schedule-time">
                        {{ subject.subject.startTime }} - {{ subject.subject.endTime }}
                      </span>
                    </div>
                  </div>
                  <div v-else class="no-data">
                    <span class="material-icons">event_busy</span>
                    No schedule set
                  </div>
              
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
    
    <!-- Table View -->
    <div v-if="currentView === 'table'" class="subjects-table-container">
      <table class="subjects-table">
        <thead>
          <tr>
            <th>Subject Name</th>
            <th>Subject Code</th>
            <th>Assigned Sections</th>
            <th>Direct Students</th>
            <th>Schedule</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="subject in subjects" :key="subject.id">
            <td>
              <div class="subject-name-cell">
                <span class="subject-name">{{ subject.subject.name }}</span>
              </div>
            </td>
            <td>
              <div class="subject-code-cell">
                <span class="subject-code-badge">{{ subject.subject.code }}</span>
              </div>
            </td>
            <td>
              <div class="sections-cell">
                <div class="sections-list">
                  <span v-for="section in subject.subject.sections.slice(0, 2)" :key="section.id" class="section-chip">
                    G{{ section.grade }}-{{ section.section }}
                  </span>
                  <span v-if="subject.subject.sections.length > 2" class="section-chip more">
                    +{{ subject.subject.sections.length - 2 }}
                  </span>
                  <span v-if="subject.subject.sections.length === 0" class="no-data">
                    No sections
                  </span>
                </div>
              </div>
            </td>
            <td>
              <div class="students-cell">
                <div v-if="directStudentsCounts[subject.subject.id] > 0" class="students-count">
                  <span class="count-badge">{{ directStudentsCounts[subject.subject.id] }}</span>
                  <span>{{ directStudentsCounts[subject.subject.id] === 1 ? 'student' : 'students' }}</span>
                </div>
                <div v-else class="no-data">
                  <span class="material-icons">person_off</span>
                  No direct students
                </div>
              </div>
            </td>
            <td>
              <div class="schedule-cell">
                <div v-if="subject.subject.scheduleType" class="schedule-display">
                  <div class="schedule-type-badge" :class="subject.subject.scheduleType.toLowerCase()">
                    {{ formatScheduleType(subject.subject.scheduleType) }}
                  </div>
                  <div class="schedule-details">
                    <span class="schedule-days">
                      <template v-if="subject.subject.scheduleType === 'SINGLE'">
                        {{ formatDays(subject.subject.daysOfWeek) }}
                      </template>
                      <template v-else-if="subject.subject.scheduleType === 'RANGE'">
                        {{ formatDayRange(subject.subject.daysOfWeek) }}
                      </template>
                      <template v-else>
                        {{ formatMultipleDays(subject.subject.daysOfWeek) }}
                      </template>
                    </span>
                    <span class="schedule-time">
                      {{ subject.subject.startTime }} - {{ subject.subject.endTime }}
                    </span>
                  </div>
                </div>
                <div v-else class="no-data">
                  <span class="material-icons">event_busy</span>
                  No schedule
                </div>
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <button 
                  class="action-btn details"
                  @click="viewSubjectDetails(subject)"
                  title="View Details"
                >
                  <span class="material-icons">info</span>
                </button>
                <router-link 
                  :to="`/subject/${subject.subject.id}/tasks`" 
                  class="action-btn tasks"
                  title="View Tasks"
                >
                  <span class="material-icons">assignment</span>
                </router-link>
                <router-link 
                  :to="`/class-list?subject=${subject.subject.id}`" 
                  class="action-btn classlist"
                  title="View Classlist"
                >
                  <span class="material-icons">people</span>
                </router-link>
                <router-link 
                  :to="`/create-task/${subject.subject.id}`" 
                  class="action-btn create"
                  title="Create Task"
                >
                  <span class="material-icons">add_task</span>
                </router-link>
                <router-link 
                  :to="`/manage-exams?subject=${subject.subject.id}`" 
                  class="action-btn exams"
                  title="View Exams"
                >
                  <span class="material-icons">quiz</span>
                </router-link>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Subject Details Modal -->
    <div v-if="selectedSubject" class="modal-backdrop" @click="closeModal">
      <div class="subject-details-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedSubject.subject.name }}</h2>
          <button class="close-btn" @click="closeModal">
            <span class="material-icons">close</span>
          </button>
        </div>
        
        <div class="modal-body">
          <!-- Loading State -->
          <div v-if="modalLoading" class="modal-loading">
            <span class="material-icons-round rotating">sync</span>
            <p>Loading subject details...</p>
          </div>
          
          <!-- Subject Details Content -->
          <div v-else>
            <!-- Basic Information -->
            <div class="detail-section">
              <h3>Basic Information</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Subject Code</span>
                  <span class="detail-value">{{ selectedSubject.subject.code }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Description</span>
                  <span class="detail-value">{{ selectedSubject.subject.description || 'No description available' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Schedule Type</span>
                  <span class="detail-value" v-if="selectedSubject.subject.scheduleType">
                    {{ formatScheduleType(selectedSubject.subject.scheduleType) }}
                  </span>
                  <span class="detail-value" v-else>No schedule set</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Schedule Time</span>
                  <span class="detail-value" v-if="selectedSubject.subject.startTime && selectedSubject.subject.endTime">
                    {{ selectedSubject.subject.startTime }} - {{ selectedSubject.subject.endTime }}
                  </span>
                  <span class="detail-value" v-else>No time set</span>
                </div>
              </div>
            </div>
            
            <!-- Schedule Details -->
            <div class="detail-section" v-if="selectedSubject.subject.scheduleType">
              <h3>Schedule Details</h3>
              <div class="schedule-detail-content">
                <div class="schedule-type-badge" :class="selectedSubject.subject.scheduleType.toLowerCase()">
                  {{ formatScheduleType(selectedSubject.subject.scheduleType) }}
                </div>
                <div class="schedule-info">
                  <div class="schedule-days">
                    <strong>Days:</strong>
                    <template v-if="selectedSubject.subject.scheduleType === 'SINGLE'">
                      {{ formatDays(selectedSubject.subject.daysOfWeek) }}
                    </template>
                    <template v-else-if="selectedSubject.subject.scheduleType === 'RANGE'">
                      {{ formatDayRange(selectedSubject.subject.daysOfWeek) }}
                    </template>
                    <template v-else>
                      {{ formatMultipleDays(selectedSubject.subject.daysOfWeek) }}
                    </template>
                  </div>
                  <div class="schedule-time">
                    <strong>Time:</strong> {{ selectedSubject.subject.startTime }} - {{ selectedSubject.subject.endTime }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Assigned Sections -->
            <div class="detail-section">
              <h3>Assigned Sections</h3>
              <div v-if="selectedSubject.subject.sections.length" class="sections-grid">
                <div v-for="section in selectedSubject.subject.sections" :key="section.id" class="section-card">
                  <div class="section-header">
                    <span class="material-icons">school</span>
                    <span class="section-title">Grade {{ section.grade }} - {{ section.section }}</span>
                  </div>
                  <div class="section-info">
                    <div class="section-meta">
                      <span class="section-grade">Grade {{ section.grade }}</span>
                      <span class="section-name">{{ section.section }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="no-data-section">
                <span class="material-icons">school</span>
                <p>No sections assigned to this subject</p>
              </div>
            </div>
            
            <!-- Direct Students -->
            <div class="detail-section">
              <h3>Direct Students</h3>
              <div v-if="directStudentsCounts[selectedSubject.subject.id] > 0" class="students-section">
                <div class="students-summary">
                  <span class="material-icons">people</span>
                  <span class="students-count-text">
                    {{ directStudentsCounts[selectedSubject.subject.id] }} 
                    {{ directStudentsCounts[selectedSubject.subject.id] === 1 ? 'student' : 'students' }} 
                    directly assigned
                  </span>
                </div>
                <div class="students-note">
                  <span class="material-icons">info</span>
                  <p>These are students who are directly assigned to this subject, separate from section-based assignments.</p>
                </div>
              </div>
              <div v-else class="no-data-section">
                <span class="material-icons">person_off</span>
                <p>No direct student assignments</p>
                <p class="no-data-subtext">Students are typically assigned through sections rather than directly to subjects.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="modal-btn close" @click="closeModal">
            <span class="material-icons">close</span>
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted,} from 'vue';
import { getTeacherAssignedSubjects, getSubjectDirectStudents } from '@/services/authService';

const subjects = ref([]);
const loading = ref(true);
const error = ref(null);
const directStudentsCounts = ref({});
const actionButtonsEnabled = ref(false); // Toggle for showing action buttons
const currentView = ref('table'); // Default to table view
const selectedSubject = ref(null); // For modal details
const modalLoading = ref(false); // Loading state for modal data

// Formatting functions
const formatScheduleType = (type) => {
  switch (type) {
    case 'SINGLE':
      return 'Single Day';
    case 'RANGE':
      return 'Day Range';
    case 'MULTIPLE':
      return 'Multiple Days';
    default:
      return 'Unknown';
  }
};

const formatDays = (days) => {
  return days?.join(', ') || 'None';
};

const formatDayRange = (days) => {
  if (!days || days.length === 0) return 'None';
  return `${days[0]} to ${days[days.length - 1]}`;
};

const formatMultipleDays = (days) => {
  return days?.join(', ') || 'None';
};

// Get direct students count for a subject
const loadDirectStudentsCount = async (subjectId) => {
  try {
    const response = await getSubjectDirectStudents(subjectId);
    if (response && response.data) {
      directStudentsCounts.value[subjectId] = response.data.length;
    } else {
      directStudentsCounts.value[subjectId] = 0;
    }
  } catch (err) {
    console.error(`Failed to load direct students for subject ${subjectId}:`, err);
    directStudentsCounts.value[subjectId] = 0;
  }
};

// Load subjects
const loadSubjects = async () => {
  try {
    loading.value = true;
    error.value = null;
    subjects.value = await getTeacherAssignedSubjects();
    
    // Load direct students count for each subject
    for (const subject of subjects.value) {
      await loadDirectStudentsCount(subject.subject.id);
    }
  } catch (err) {
    error.value = err.message;
    console.error('Failed to load subjects:', err);
  } finally {
    loading.value = false;
  }
};

// Dropdown functionality
const toggleDropdown = (event) => {
  event.stopPropagation();
  
  // Close all other open dropdowns first
  document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
    const parentDropdown = menu.closest('.subject-actions-dropdown');
    const currentDropdown = event.target.closest('.subject-actions-dropdown');
    if (parentDropdown !== currentDropdown) {
      menu.classList.remove('show');
    }
  });
  
  // Toggle the clicked dropdown
  const dropdownContainer = event.target.closest('.subject-actions-dropdown');
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

// Toggle action buttons function
const toggleActionButtons = () => {
  // This function can be expanded if needed for additional logic
  console.log('Action buttons toggled:', actionButtonsEnabled.value);
};

// Modal functions
const viewSubjectDetails = async (subject) => {
  selectedSubject.value = subject;
  modalLoading.value = true;
  
  try {
    // Load detailed students data if not already loaded
    if (!directStudentsCounts.value[subject.subject.id]) {
      await loadDirectStudentsCount(subject.subject.id);
    }
  } catch (err) {
    console.error('Error loading subject details:', err);
  } finally {
    modalLoading.value = false;
  }
};

const closeModal = () => {
  selectedSubject.value = null;
};

onMounted(() => {
  loadSubjects();
});
</script>

<style scoped>
.manage-subjects {
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
  gap: 10px;
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
}

.header-actions {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.header-btn {
  background: #f5f5f5;
  color: #333;
  padding: 8px 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.header-btn .material-icons {
  font-size: 1.2rem;
}

/* Action Toggle Styles */
.action-toggle-container {
  display: flex;
  align-items: center;
  margin-right: 15px;
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

/* Grid Layout */
.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

/* Card Styling */
.subject-card {
  background: white;
  border-radius: 16px 16px 0 0;
  overflow: visible;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12),
               0 4px 16px -2px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.subject-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.subject-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 20px;
  position: relative;
  overflow: visible;
  color: white;
  min-height: 120px;
  border-radius: 16px 16px 0 0;
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

/* Additional texture layers */
.subject-header .texture-layer {
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

/* Hover animations */
.subject-header:hover::after {
  transform: skewX(-20deg) translateX(10px);
  transition: transform 0.3s ease;
}

.subject-header:hover::before {
  transform: skewX(-35deg) translateX(-10px);
  transition: transform 0.3s ease;
}

.subject-header h2 {
  margin: 0 0 15px 0;
  font-size: 1.3rem;
  position: relative;
  z-index: 1;
  line-height: 1.4;
  word-break: break-word; /* Allow words to break */
  max-width: 100%; /* Ensure text stays within container */
}

.subject-meta-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
  gap: 10px;
}

.subject-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.subject-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  background: rgba(0, 0, 0, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  max-width: calc(100% - 10px); /* Prevent overflow */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.subject-body {
  padding: 25px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.subject-info {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 0;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-label {
  font-size: 0.85rem;
  color: #757575;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

.sections-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.section-chip {
  background: #f5f5f5;
  padding: 6px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #424242;
}

.direct-students-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.students-count {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #e8f5e9;
  padding: 6px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #2e7d32;
  font-weight: 500;
}

.count-badge {
  background: #a5d6a7;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #2e7d32;
}

.schedule-info {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 15px;
}

.schedule-type-badge {
  display: inline-block;
  padding: 6px 15px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 10px;
}

.schedule-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.95rem;
  color: #424242;
  padding: 0 5px;
}

.no-data {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #9e9e9e;
  font-size: 0.95rem;
  font-style: italic;
  padding: 5px;
}

/* Material Icons Sizing */
.info-item .material-icons-round {
  font-size: 1.4rem;
  margin-top: 2px;
  color: #159750;
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
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* States */
.error-state,
.empty-state {
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
  transition: all 0.3s;
}

.retry-btn:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Schedule styling */
.schedule-type-badge {
  display: inline-block;
  padding: 0.3rem 0.7rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
}

.schedule-type-badge.single {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.schedule-type-badge.range {
  background-color: #e3f2fd;
  color: #1565c0;
}

.schedule-type-badge.multiple {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

/* Dropdown styles */
.subject-actions-dropdown {
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

.dropdown-toggle .material-icons {
  font-size: 18px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  display: none;
  flex-direction: column;
  min-width: 160px;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 5px;
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
  width: 100%;
  text-align: left;
  cursor: pointer;
  color: #333;
  font-size: 0.85rem;
  text-decoration: none;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: #f5f5f5;
  text-decoration: none;
  color: #333;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item .material-icons {
  font-size: 0.95rem;
  color: #159750;
}

.attendance-btn {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  margin-right: 10px;
}

.attendance-btn:hover {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
}

/* View Toggle Styles */
.view-toggle {
  display: flex;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 15px;
}

.view-btn {
  background: white;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn.active {
  background: #f0f7ff;
  color: #1976D2;
}

.view-btn:hover:not(.active) {
  background: #f5f5f5;
}

.view-btn .material-icons {
  font-size: 20px;
}

/* Table Styles */
.subjects-table-container {
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0.7; }
  to { opacity: 1; }
}

.subjects-table {
  width: 100%;
  border-collapse: collapse;
}

.subjects-table th {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  font-weight: 600;
  text-align: left;
  padding: 16px 12px;
  border-bottom: none;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  position: relative;
  user-select: none;
}

.subjects-table th:first-child {
  border-top-left-radius: 12px;
}

.subjects-table th:last-child {
  border-top-right-radius: 12px;
}

.subjects-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  color: #444;
  vertical-align: middle;
}

.subjects-table tbody tr {
  transition: all 0.2s ease;
}

.subjects-table tbody tr:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Table Cell Styles */
.subject-name-cell,
.subject-code-cell,
.subject-description-cell,
.sections-cell,
.students-cell,
.schedule-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.subject-name {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.subject-code-badge {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
}

.subject-description {
  font-size: 0.85rem;
  color: #666;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sections-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.section-chip {
  background: #f5f5f5;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #424242;
}

.section-chip.more {
  background: #e8f5e9;
  color: #388e3c;
}

.students-count {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #e8f5e9;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  color: #2e7d32;
  font-weight: 500;
}

.count-badge {
  background: #a5d6a7;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #2e7d32;
}

.schedule-display {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.schedule-type-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
}

.schedule-type-badge.single {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.schedule-type-badge.range {
  background-color: #e3f2fd;
  color: #1565c0;
}

.schedule-type-badge.multiple {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.schedule-details {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.8rem;
  color: #424242;
}

.schedule-days {
  font-weight: 500;
}

.schedule-time {
  font-size: 0.75rem;
  color: #666;
}

.no-data {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #9e9e9e;
  font-size: 0.8rem;
  font-style: italic;
}

.no-data .material-icons {
  font-size: 16px;
}

/* Action buttons in table */
.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 2px solid #159750;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #159750;
  font-size: 0.9rem;
  background: transparent;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.action-btn:hover {
  background: #159750;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(21, 151, 80, 0.3);
  text-decoration: none;
}

.action-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(21, 151, 80, 0.4);
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.action-btn:hover::before {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.action-btn:active::before {
  background: rgba(255, 255, 255, 0.3);
}

.action-btn .material-icons {
  font-size: 18px;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.action-btn:hover .material-icons {
  animation: pulse 0.6s ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Modal Styles */
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

.subject-details-modal {
  background: white;
  border-radius: 16px;
  max-width: 900px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  position: relative;
  padding: 0;
  animation: modalFadeIn 0.3s ease;
  z-index: 1001;
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

.modal-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 20px;
  border-radius: 16px 16px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  color: white;
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
  margin: 0;
  font-size: 1.5rem;
  position: relative;
  z-index: 1;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s;
  position: relative;
  z-index: 1;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.modal-body {
  padding: 25px;
  flex: 1;
  overflow-y: auto;
}

.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.modal-loading .material-icons-round {
  font-size: 3rem;
  color: #159750;
  animation: rotate 2s linear infinite;
}

.modal-loading p {
  margin-top: 1rem;
  color: #666;
  font-size: 1.1rem;
}

.detail-section {
  margin-bottom: 30px;
}

.detail-section h3 {
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-section h3::before {
  content: '';
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  border-radius: 2px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #159750;
}

.detail-label {
  font-size: 0.85rem;
  color: #757575;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1rem;
  color: #333;
  font-weight: 500;
}

/* Schedule Detail Content */
.schedule-detail-content {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #159750;
}

.schedule-info {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.schedule-days,
.schedule-time {
  font-size: 1rem;
  color: #333;
}

.schedule-days strong,
.schedule-time strong {
  color: #159750;
  margin-right: 8px;
}

/* Sections Grid */
.sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.section-card {
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.section-header .material-icons {
  color: #159750;
  font-size: 1.2rem;
}

.section-title {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.section-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.section-meta {
  display: flex;
  gap: 10px;
}

.section-grade {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.section-name {
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Students Section */
.students-section {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 20px;
  border-left: 4px solid #159750;
}

.students-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.students-summary .material-icons {
  color: #159750;
  font-size: 1.5rem;
}

.students-count-text {
  font-size: 1.1rem;
  color: #333;
  font-weight: 600;
}

.students-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #e8f5e9;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #4caf50;
}

.students-note .material-icons {
  color: #4caf50;
  font-size: 1.2rem;
  margin-top: 2px;
}

.students-note p {
  margin: 0;
  color: #2e7d32;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* No Data Sections */
.no-data-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background: #f9f9f9;
  border-radius: 12px;
  border: 2px dashed #e0e0e0;
}

.no-data-section .material-icons {
  font-size: 3rem;
  color: #9e9e9e;
  margin-bottom: 1rem;
}

.no-data-section p {
  margin: 0;
  color: #666;
  font-size: 1rem;
}

.no-data-subtext {
  margin-top: 0.5rem !important;
  font-size: 0.9rem !important;
  color: #999 !important;
}

.modal-footer {
  padding: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  border-radius: 0 0 16px 16px;
}

.modal-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.9rem;
}

.modal-btn.close {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #e0e0e0;
}

.modal-btn.close:hover {
  background: #e0e0e0;
  transform: translateY(-1px);
}

.modal-btn .material-icons {
  font-size: 1.1rem;
}

/* Dropdown Button Styling */
.details-btn {
  background: none !important;
  border: none !important;
  width: 100% !important;
  text-align: left !important;
  cursor: pointer !important;
  color: #333 !important;
  font-size: 0.85rem !important;
  text-decoration: none !important;
  border-bottom: 1px solid #f0f0f0 !important;
  transition: background-color 0.2s !important;
}

.details-btn:hover {
  background: #f5f5f5 !important;
  text-decoration: none !important;
  color: #333 !important;
}

.details-btn .material-icons {
  font-size: 0.95rem;
  color: #607D8B;
}

/* High DPI and Small Laptop Screens */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .manage-subjects {
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

  .header-actions {
    gap: 12px;
    margin-top: 8px;
  }

  .view-toggle {
    margin-right: 12px;
  }

  .view-btn {
    padding: 6px 10px;
  }

  .view-btn .material-icons {
    font-size: 18px;
  }

  .subjects-table th,
  .subjects-table td {
    padding: 12px 10px;
    font-size: 0.85rem;
  }

  .subjects-table th {
    font-size: 0.8rem;
    padding: 14px 10px;
  }

  .subject-name {
    font-size: 0.9rem;
  }

  .subject-code-badge {
    font-size: 0.75rem;
    padding: 3px 6px;
  }

  .subject-description {
    font-size: 0.8rem;
    max-width: 150px;
  }

  .section-chip {
    font-size: 0.7rem;
    padding: 2px 6px;
  }

  .students-count {
    font-size: 0.75rem;
    padding: 3px 8px;
  }

  .count-badge {
    font-size: 0.7rem;
    padding: 2px 5px;
  }

  .schedule-type-badge {
    font-size: 0.65rem;
    padding: 2px 6px;
  }

  .schedule-details {
    font-size: 0.75rem;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    border-width: 1.5px;
  }

  .action-btn .material-icons {
    font-size: 16px;
  }

  /* Modal responsive styles */
  .subject-details-modal {
    max-width: 800px;
    width: 95%;
  }

  .modal-header {
    padding: 1.6rem;
  }

  .modal-header h2 {
    font-size: 1.3rem;
  }

  .modal-body {
    padding: 1.6rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .detail-item {
    padding: 12px;
  }

  .detail-label {
    font-size: 0.8rem;
  }

  .detail-value {
    font-size: 0.9rem;
  }

  .sections-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }

  .section-card {
    padding: 12px;
  }

  .section-title {
    font-size: 0.9rem;
  }

  .students-section {
    padding: 1.6rem;
  }

  .students-count-text {
    font-size: 1rem;
  }

  .modal-footer {
    padding: 1.6rem;
  }

  .modal-btn {
    padding: 8px 16px;
    font-size: 0.85rem;
  }

  .action-toggle-container {
    margin-right: 12px;
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

  .header-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
  }

  .header-btn .material-icons {
    font-size: 1.1rem;
  }

  .subjects-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.6rem;
    margin-top: 1.6rem;
  }

  .subject-header {
    padding: 1.6rem;
    min-height: 100px;
  }

  .subject-header h2 {
    font-size: 1.2rem;
    margin-bottom: 12px;
  }

  .subject-meta-container {
    gap: 8px;
  }

  .subject-meta {
    gap: 6px;
  }

  .subject-meta-item {
    font-size: 0.8rem;
    padding: 3px 8px;
  }

  .subject-body {
    padding: 20px;
    gap: 20px;
  }

  .subject-info {
    gap: 20px;
  }

  .info-item {
    gap: 12px;
  }

  .info-content {
    gap: 10px;
  }

  .info-label {
    font-size: 0.8rem;
  }

  .info-item .material-icons-round {
    font-size: 1.2rem;
  }

  .section-chip {
    padding: 5px 12px;
    font-size: 0.85rem;
  }

  .students-count {
    padding: 5px 12px;
    font-size: 0.85rem;
  }

  .count-badge {
    padding: 3px 8px;
    font-size: 0.85rem;
  }

  .schedule-info {
    padding: 12px;
  }

  .schedule-type-badge {
    padding: 5px 12px;
    font-size: 0.8rem;
  }

  .schedule-details {
    font-size: 0.9rem;
  }

  .dropdown-toggle {
    width: 28px;
    height: 28px;
  }

  .dropdown-toggle .material-icons {
    font-size: 16px;
  }

  .dropdown-menu {
    min-width: 150px;
    max-height: 260px;
  }

  .dropdown-item {
    padding: 8px 12px;
    font-size: 0.8rem;
    gap: 6px;
  }

  .dropdown-item .material-icons {
    font-size: 0.9rem;
  }
}

@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .manage-subjects {
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

  .header-actions {
    gap: 10px;
    margin-top: 6px;
  }

  .view-toggle {
    margin-right: 10px;
  }

  .view-btn {
    padding: 5px 8px;
  }

  .view-btn .material-icons {
    font-size: 16px;
  }

  .subjects-table th,
  .subjects-table td {
    padding: 10px 8px;
    font-size: 0.8rem;
  }

  .subjects-table th {
    font-size: 0.75rem;
    padding: 12px 8px;
  }

  .subject-name {
    font-size: 0.85rem;
  }

  .subject-code-badge {
    font-size: 0.7rem;
    padding: 2px 5px;
  }

  .subject-description {
    font-size: 0.75rem;
    max-width: 120px;
  }

  .section-chip {
    font-size: 0.65rem;
    padding: 2px 5px;
  }

  .students-count {
    font-size: 0.7rem;
    padding: 2px 6px;
  }

  .count-badge {
    font-size: 0.65rem;
    padding: 1px 4px;
  }

  .schedule-type-badge {
    font-size: 0.6rem;
    padding: 2px 5px;
  }

  .schedule-details {
    font-size: 0.7rem;
  }

  .action-btn {
    width: 26px;
    height: 26px;
    border-width: 1.5px;
  }

  .action-btn .material-icons {
    font-size: 14px;
  }

  /* Modal responsive styles */
  .subject-details-modal {
    max-width: 700px;
    width: 95%;
  }

  .modal-header {
    padding: 1.4rem;
  }

  .modal-header h2 {
    font-size: 1.2rem;
  }

  .modal-body {
    padding: 1.4rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .detail-item {
    padding: 10px;
  }

  .detail-label {
    font-size: 0.75rem;
  }

  .detail-value {
    font-size: 0.85rem;
  }

  .sections-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }

  .section-card {
    padding: 10px;
  }

  .section-title {
    font-size: 0.85rem;
  }

  .students-section {
    padding: 1.4rem;
  }

  .students-count-text {
    font-size: 0.95rem;
  }

  .modal-footer {
    padding: 1.4rem;
  }

  .modal-btn {
    padding: 7px 14px;
    font-size: 0.8rem;
  }

  .action-toggle-container {
    margin-right: 10px;
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

  .header-btn {
    padding: 5px 10px;
    font-size: 0.8rem;
  }

  .header-btn .material-icons {
    font-size: 1rem;
  }

  .subjects-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.4rem;
    margin-top: 1.4rem;
  }

  .subject-header {
    padding: 1.4rem;
    min-height: 90px;
  }

  .subject-header h2 {
    font-size: 1.1rem;
    margin-bottom: 10px;
  }

  .subject-meta-container {
    gap: 6px;
  }

  .subject-meta {
    gap: 5px;
  }

  .subject-meta-item {
    font-size: 0.75rem;
    padding: 2px 6px;
  }

  .subject-body {
    padding: 18px;
    gap: 18px;
  }

  .subject-info {
    gap: 18px;
  }

  .info-item {
    gap: 10px;
  }

  .info-content {
    gap: 8px;
  }

  .info-label {
    font-size: 0.75rem;
  }

  .info-item .material-icons-round {
    font-size: 1.1rem;
  }

  .section-chip {
    padding: 4px 10px;
    font-size: 0.8rem;
  }

  .students-count {
    padding: 4px 10px;
    font-size: 0.8rem;
  }

  .count-badge {
    padding: 2px 6px;
    font-size: 0.8rem;
  }

  .schedule-info {
    padding: 10px;
  }

  .schedule-type-badge {
    padding: 4px 10px;
    font-size: 0.75rem;
  }

  .schedule-details {
    font-size: 0.85rem;
  }

  .dropdown-toggle {
    width: 26px;
    height: 26px;
  }

  .dropdown-toggle .material-icons {
    font-size: 15px;
  }

  .dropdown-menu {
    min-width: 140px;
    max-height: 240px;
  }

  .dropdown-item {
    padding: 7px 10px;
    font-size: 0.75rem;
    gap: 5px;
  }

  .dropdown-item .material-icons {
    font-size: 0.85rem;
  }
}

@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .manage-subjects {
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

  .header-actions {
    gap: 8px;
    margin-top: 4px;
  }

  .view-toggle {
    margin-right: 8px;
  }

  .view-btn {
    padding: 4px 6px;
  }

  .view-btn .material-icons {
    font-size: 14px;
  }

  .subjects-table th,
  .subjects-table td {
    padding: 8px 6px;
    font-size: 0.75rem;
  }

  .subjects-table th {
    font-size: 0.7rem;
    padding: 10px 6px;
  }

  .subject-name {
    font-size: 0.8rem;
  }

  .subject-code-badge {
    font-size: 0.65rem;
    padding: 2px 4px;
  }

  .subject-description {
    font-size: 0.7rem;
    max-width: 100px;
  }

  .section-chip {
    font-size: 0.6rem;
    padding: 1px 4px;
  }

  .students-count {
    font-size: 0.65rem;
    padding: 2px 5px;
  }

  .count-badge {
    font-size: 0.6rem;
    padding: 1px 3px;
  }

  .schedule-type-badge {
    font-size: 0.55rem;
    padding: 1px 4px;
  }

  .schedule-details {
    font-size: 0.65rem;
  }

  .action-btn {
    width: 24px;
    height: 24px;
    border-width: 1px;
  }

  .action-btn .material-icons {
    font-size: 12px;
  }

  .action-toggle-container {
    margin-right: 8px;
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

  .header-btn {
    padding: 4px 8px;
    font-size: 0.75rem;
  }

  .header-btn .material-icons {
    font-size: 0.9rem;
  }

  .subjects-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.2rem;
    margin-top: 1.2rem;
  }

  .subject-header {
    padding: 1.2rem;
    min-height: 80px;
  }

  .subject-header h2 {
    font-size: 1rem;
    margin-bottom: 8px;
  }

  .subject-meta-container {
    gap: 4px;
  }

  .subject-meta {
    gap: 4px;
  }

  .subject-meta-item {
    font-size: 0.7rem;
    padding: 2px 5px;
  }

  .subject-body {
    padding: 15px;
    gap: 15px;
  }

  .subject-info {
    gap: 15px;
  }

  .info-item {
    gap: 8px;
  }

  .info-content {
    gap: 6px;
  }

  .info-label {
    font-size: 0.7rem;
  }

  .info-item .material-icons-round {
    font-size: 1rem;
  }

  .section-chip {
    padding: 3px 8px;
    font-size: 0.75rem;
  }

  .students-count {
    padding: 3px 8px;
    font-size: 0.75rem;
  }

  .count-badge {
    padding: 2px 5px;
    font-size: 0.75rem;
  }

  .schedule-info {
    padding: 8px;
  }

  .schedule-type-badge {
    padding: 3px 8px;
    font-size: 0.7rem;
  }

  .schedule-details {
    font-size: 0.8rem;
  }

  .dropdown-toggle {
    width: 24px;
    height: 24px;
  }

  .dropdown-toggle .material-icons {
    font-size: 14px;
  }

  .dropdown-menu {
    min-width: 130px;
    max-height: 220px;
  }

  .dropdown-item {
    padding: 6px 8px;
    font-size: 0.7rem;
    gap: 4px;
  }

  .dropdown-item .material-icons {
    font-size: 0.8rem;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .manage-subjects {
    padding: 10px 5px;
  }

  .header-background {
    font-size: 3rem;
    top: 60%;
    right: 1rem;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .header-content h1 .material-icons {
    font-size: 2rem;
  }

  .header-actions {
    position: static;
    margin-top: 15px;
    width: 100%;
    justify-content: center;
    flex-direction: column;
    gap: 10px;
  }

  .view-toggle {
    margin-right: 0;
    margin-bottom: 10px;
    align-self: center;
  }

  .view-btn {
    padding: 6px 10px;
  }

  .view-btn .material-icons {
    font-size: 16px;
  }

  /* Force card view on mobile */
  .subjects-table-container {
    display: none !important;
  }
  
  .subjects-grid {
    display: grid !important;
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .action-toggle-container {
    margin-right: 0;
    margin-bottom: 10px;
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

  .header-btn {
    width: 100%;
    justify-content: center;
  }

  .subjects-grid {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .subject-header {
    padding: 1rem;
    min-height: 70px;
  }

  .subject-header h2 {
    font-size: 1rem;
    margin-bottom: 6px;
  }

  .subject-meta-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .subject-meta {
    gap: 4px;
  }

  .subject-meta-item {
    font-size: 0.7rem;
    padding: 2px 5px;
  }

  .subject-body {
    padding: 12px;
    gap: 12px;
  }

  .subject-info {
    gap: 12px;
  }

  .info-item {
    gap: 6px;
  }

  .info-content {
    gap: 5px;
  }

  .info-label {
    font-size: 0.7rem;
  }

  .info-item .material-icons-round {
    font-size: 0.9rem;
  }

  .section-chip {
    padding: 3px 6px;
    font-size: 0.7rem;
  }

  .students-count {
    padding: 3px 6px;
    font-size: 0.7rem;
  }

  .count-badge {
    padding: 2px 4px;
    font-size: 0.7rem;
  }

  .schedule-info {
    padding: 6px;
  }

  .schedule-type-badge {
    padding: 2px 6px;
    font-size: 0.65rem;
  }

  .schedule-details {
    font-size: 0.75rem;
  }

  .subject-actions-dropdown {
    margin-left: 0;
    align-self: flex-end;
  }

  .dropdown-toggle {
    width: 24px;
    height: 24px;
  }

  .dropdown-toggle .material-icons {
    font-size: 14px;
  }

  .dropdown-menu {
    min-width: 120px;
    max-height: 200px;
  }

  .dropdown-item {
    padding: 6px 8px;
    font-size: 0.7rem;
    gap: 4px;
  }

  .dropdown-item .material-icons {
    font-size: 0.8rem;
  }

  /* Modal responsive styles for mobile */
  .subject-details-modal {
    max-width: 95%;
    width: 95%;
    max-height: 90vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-header h2 {
    font-size: 1.1rem;
  }

  .modal-body {
    padding: 1rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .detail-item {
    padding: 8px;
  }

  .detail-label {
    font-size: 0.7rem;
  }

  .detail-value {
    font-size: 0.8rem;
  }

  .sections-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .section-card {
    padding: 8px;
  }

  .section-title {
    font-size: 0.8rem;
  }

  .students-section {
    padding: 1rem;
  }

  .students-count-text {
    font-size: 0.9rem;
  }

  .modal-footer {
    padding: 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .modal-btn {
    width: 100%;
    justify-content: center;
    padding: 8px 12px;
    font-size: 0.8rem;
  }
}

/* Desktop: Show both views based on currentView state */
@media (min-width: 769px) {
  .subjects-grid {
    display: grid !important;
  }
  
  .subjects-table-container {
    display: block !important;
  }
}
</style>