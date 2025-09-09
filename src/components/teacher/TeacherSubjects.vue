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

    <!-- Subjects Grid -->
    <div v-else class="subjects-grid">
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
}
</style>