<template>
  <div class="manage-subjects">
    <div class="header-container">
      <div class="header-content">
        <h1>Manage Subjects<span class="material-icons">book</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Create, edit and manage school subjects</p>
        </div>
      </div>
      <div class="header-background">SUBJECTS</div>
    </div>

    <!-- Search and Filter Section -->
    <div class="filters-section">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search subjects..."
          class="uppercase-input"
        />
      </div>
      <button @click="openSubjectModal()" class="add-btn">
        <span class="material-icons">add</span> Add Subject
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading subjects...</p>
    </div>

    <!-- Subjects List -->
    <div class="subjects-grid" v-if="!loading">
      <div v-for="subject in filteredSubjects" :key="subject.id" class="subject-card">
        <div class="subject-header">
          <div class="texture-layer"></div>
          <h2>{{ subject.name }}</h2>
          <div class="subject-meta">
            <span class="subject-meta-item">
              <span class="material-icons">code</span>
              {{ subject.code }}
            </span>
            <span v-if="subject.description" class="subject-meta-item">
              <span class="material-icons">description</span>
              {{ subject.description }}
            </span>
          </div>
        </div>

        <div class="subject-body">
          <div class="subject-info">
            <!-- Teachers Section -->
            <div class="info-item">
              <span class="material-icons-round">people</span>
              <div class="info-content">
                <span class="info-label">Teachers</span>
                <div class="teachers-list">
                  <div v-for="teacher in subject.teachers" :key="teacher.id" class="teacher-item">
                    {{ teacher.user.firstName }} {{ teacher.user.lastName }}
                    <button 
                      @click="removeTeacher(subject.id, teacher.user.id)" 
                      class="remove-btn"
                    >
                      <span class="material-icons">close</span>
                    </button>
                  </div>
                  <button 
                    @click="openAssignTeacherModal(subject)" 
                    class="assign-btn"
                  >
                    <span class="material-icons">add</span>
                    <span class="assign-text">Assign</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Sections Section -->
            <div class="info-item">
              <span class="material-icons-round">class</span>
              <div class="info-content">
                <span class="info-label">Sections</span>
                <div class="sections-list">
                  <div v-for="section in subject.sections" :key="section.id" class="section-item">
                    Grade {{ section.grade }} - {{ section.section }}
                    <button 
                      @click="removeSection(subject.id, section.grade, section.section)" 
                      class="remove-btn"
                    >
                      <span class="material-icons">close</span>
                    </button>
                  </div>
                  <button 
                    @click="openAssignSectionModal(subject)" 
                    class="assign-btn"
                  >
                    <span class="material-icons">add</span>
                    <span class="assign-text">Assign</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Schedule Section -->
            <div class="info-item">
              <span class="material-icons-round">schedule</span>
              <div class="info-content">
                <span class="info-label">Schedule</span>
                <div class="schedule-info">
                  <div v-if="subject.scheduleType" class="schedule-display">
                    <div class="schedule-type-badge" :class="subject.scheduleType.toLowerCase()">
                      {{ formatScheduleType(subject.scheduleType) }}
                    </div>
                    <div class="schedule-details">
                      <span class="schedule-value">
                        <span v-if="subject.scheduleType === 'SINGLE'">
                          {{ formatDays(subject.daysOfWeek) }}
                        </span>
                        <span v-else-if="subject.scheduleType === 'RANGE'">
                          {{ formatDayRange(subject.daysOfWeek) }}
                        </span>
                        <span v-else>
                          {{ formatMultipleDays(subject.daysOfWeek) }}
                        </span>
                        {{ subject.startTime }} - {{ subject.endTime }}
                      </span>
                    </div>
                  </div>
                  <div v-else class="no-schedule">
                    No schedule set
                  </div>
                  <button 
                    @click="openScheduleModal(subject)" 
                    class="schedule-btn"
                  >
                    <span class="material-icons">{{ subject.scheduleType ? 'edit' : 'add' }}</span>
                    <span class="schedule-text">{{ subject.scheduleType ? 'Edit' : 'Add' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="subject-actions">
          <button @click="openEditModal(subject)" class="action-btn edit-btn" title="Edit subject">
            <span class="material-icons">edit</span>
            Edit
          </button>
          <button @click="deleteSubject(subject.id)" class="action-btn delete-btn" title="Delete subject">
            <span class="material-icons">delete</span>
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Subject Modal (Add/Edit) -->
    <div v-if="showSubjectModal" class="modal-overlay" @click="showSubjectModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ currentSubject.id ? 'Edit' : 'Add' }} Subject</h2>
          <button class="close-btn" @click="showSubjectModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="saveSubject" class="subject-form">
          <div class="form-group">
            <label>Subject Name</label>
            <input 
              v-model="currentSubject.name" 
              type="text" 
              required
              class="uppercase-input"
            />
          </div>

          <div class="form-group">
            <label>Subject Code</label>
            <input 
              v-model="currentSubject.code" 
              type="text" 
              required
              class="uppercase-input"
            />
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea 
              v-model="currentSubject.description"
              rows="3"
              class="uppercase-input"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showSubjectModal = false">
              Cancel
            </button>
            <button type="submit" class="save-btn">
              {{ currentSubject.id ? 'Update' : 'Create' }} Subject
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Assign Teacher Modal -->
    <div v-if="showAssignTeacherModal" class="modal-overlay" @click="showAssignTeacherModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Assign Teacher to {{ selectedSubject?.name }}</h2>
          <button class="close-btn" @click="showAssignTeacherModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="assignTeacher" class="assign-form">
          <div class="form-group">
            <label>Select Teacher</label>
            <select v-model="selectedTeacherId" required>
              <option value="">Choose a teacher</option>
              <option 
                v-for="teacher in availableTeachers" 
                :key="teacher.id" 
                :value="teacher.id"
              >
                {{ teacher.firstName }} {{ teacher.lastName }}
              </option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showAssignTeacherModal = false">
              Cancel
            </button>
            <button type="submit" class="save-btn">
              Assign Teacher
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Assign Section Modal -->
    <div v-if="showAssignSectionModal" class="modal-overlay" @click="showAssignSectionModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Assign Section to {{ selectedSubject?.name }}</h2>
          <button class="close-btn" @click="showAssignSectionModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="assignSection" class="assign-form">
          <div class="form-group">
            <label>Grade Level</label>
            <select v-model="selectedGrade" required @change="loadSectionsForGrade">
              <option value="">Select Grade</option>
              <option v-for="grade in [7,8,9,10,11,12]" :key="grade" :value="grade">
                Grade {{ grade }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Section</label>
            <select v-model="selectedSection" required :disabled="!selectedGrade">
              <option value="">Select Section</option>
              <option 
                v-for="section in availableSections" 
                :key="section" 
                :value="section"
              >
                {{ section }}
              </option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showAssignSectionModal = false">
              Cancel
            </button>
            <button type="submit" class="save-btn">
              Assign Section
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Schedule Modal -->
    <div v-if="showScheduleModal" class="modal-overlay" @click="showScheduleModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Add Schedule for {{ selectedSubject?.name }}</h2>
          <button class="close-btn" @click="showScheduleModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="updateSchedule" class="schedule-form">
          <!-- Schedule Type Selection -->
          <div class="form-group">
            <label>Schedule Type</label>
            <select v-model="newSchedule.scheduleType" required>
              <option value="">Select Type</option>
              <option value="SINGLE">Single Day</option>
              <option value="RANGE">Day Range</option>
              <option value="MULTIPLE">Multiple Days</option>
            </select>
          </div>

          <!-- Single Day Selection -->
          <div v-if="newSchedule.scheduleType === 'SINGLE'" class="form-group">
            <label>Day of Week</label>
            <select v-model="newSchedule.dayOfWeek" required>
              <option value="">Select Day</option>
              <option v-for="day in daysOfWeek" :key="day" :value="day">
                {{ day }}
              </option>
            </select>
          </div>

          <!-- Day Range Selection -->
          <div v-if="newSchedule.scheduleType === 'RANGE'" class="form-row">
            <div class="form-group">
              <label>Start Day</label>
              <select v-model="newSchedule.startDay" required>
                <option value="">Select Start Day</option>
                <option v-for="day in daysOfWeek" :key="day" :value="day">
                  {{ day }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>End Day</label>
              <select 
                v-model="newSchedule.endDay" 
                required
                :disabled="!newSchedule.startDay"
              >
                <option value="">Select End Day</option>
                <option 
                  v-for="day in availableEndDays" 
                  :key="day" 
                  :value="day"
                >
                  {{ day }}
                </option>
              </select>
            </div>
          </div>

          <!-- Multiple Days Selection -->
          <div v-if="newSchedule.scheduleType === 'MULTIPLE'" class="form-group">
            <label>Select Days</label>
            <div class="days-checkboxes">
              <label v-for="day in daysOfWeek" :key="day" class="day-checkbox">
                <input 
                  type="checkbox" 
                  :value="day"
                  v-model="newSchedule.selectedDays"
                >
                {{ day }}
              </label>
            </div>
          </div>

          <!-- Time Selection -->
          <div class="form-row">
            <div class="form-group">
              <label>Start Time</label>
              <input 
                type="time" 
                v-model="newSchedule.startTime" 
                required
              />
            </div>

            <div class="form-group">
              <label>End Time</label>
              <input 
                type="time" 
                v-model="newSchedule.endTime" 
                required
              />
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showScheduleModal = false">
              Cancel
            </button>
            <button type="submit" class="save-btn">
              Update Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  createSubject,
  updateSubject,
  deleteSubject as deleteSubjectApi,
  getAllSubjects,
  assignTeacherToSubject,
  removeTeacherFromSubject,
  assignSubjectToSection,
  removeSubjectFromSection,
  fetchTeachers,
  getAllGradeSections,
  updateSubjectSchedule
} from '@/services/authService';
import Swal from 'sweetalert2';

// State
const subjects = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const showSubjectModal = ref(false);
const showAssignTeacherModal = ref(false);
const showAssignSectionModal = ref(false);
const showScheduleModal = ref(false);
const currentSubject = ref({ name: '', code: '', description: '' });
const selectedSubject = ref(null);
const selectedTeacherId = ref('');
const selectedGrade = ref('');
const selectedSection = ref('');
const teachers = ref([]);
const availableSections = ref([]);
const newSchedule = ref({
  scheduleType: '',
  dayOfWeek: '',
  startDay: '',
  endDay: '',
  selectedDays: [],
  startTime: '',
  endTime: ''
});

const daysOfWeek = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY'
];

// Computed
const filteredSubjects = computed(() => {
  return subjects.value.filter(subject => {
    const searchTerm = searchQuery.value.toLowerCase();
    return subject.name.toLowerCase().includes(searchTerm) ||
           subject.code.toLowerCase().includes(searchTerm) ||
           subject.description?.toLowerCase().includes(searchTerm);
  });
});

const availableTeachers = computed(() => {
  if (!selectedSubject.value) return teachers.value;
  
  // Filter out teachers already assigned to the subject
  const assignedTeacherIds = selectedSubject.value.teachers.map(t => t.user.id);
  return teachers.value.filter(teacher => !assignedTeacherIds.includes(teacher.id));
});

const availableEndDays = computed(() => {
  if (!newSchedule.value.startDay) return [];
  const startIndex = daysOfWeek.indexOf(newSchedule.value.startDay);
  return daysOfWeek.slice(startIndex + 1);
});

// Methods
const loadSubjects = async () => {
  try {
    loading.value = true;
    subjects.value = await getAllSubjects();
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  } finally {
    loading.value = false;
  }
};

const loadTeachers = async () => {
  try {
    teachers.value = await fetchTeachers();
  } catch (error) {
    console.error('Error loading teachers:', error);
  }
};

const loadSectionsForGrade = async () => {
  try {
    const response = await getAllGradeSections();
    availableSections.value = response.gradeSections
      .filter(gs => gs.grade === selectedGrade.value)
      .map(gs => gs.section);
  } catch (error) {
    console.error('Error loading sections:', error);
  }
};

const openSubjectModal = (subject = null) => {
  currentSubject.value = subject ? { ...subject } : { name: '', code: '', description: '' };
  showSubjectModal.value = true;
};

const openEditModal = (subject) => {
  openSubjectModal(subject);
};

const openAssignTeacherModal = (subject) => {
  selectedSubject.value = subject;
  selectedTeacherId.value = '';
  showAssignTeacherModal.value = true;
};

const openAssignSectionModal = (subject) => {
  selectedSubject.value = subject;
  selectedGrade.value = '';
  selectedSection.value = '';
  showAssignSectionModal.value = true;
};

const openScheduleModal = (subject) => {
  selectedSubject.value = subject;
  newSchedule.value = {
    scheduleType: '',
    dayOfWeek: '',
    startDay: '',
    endDay: '',
    selectedDays: [],
    startTime: '',
    endTime: ''
  };
  showScheduleModal.value = true;
};

const saveSubject = async () => {
  try {
    const subjectData = {
      name: currentSubject.value.name.toUpperCase(),
      code: currentSubject.value.code.toUpperCase(),
      description: currentSubject.value.description?.toUpperCase()
    };

    if (currentSubject.value.id) {
      await updateSubject(currentSubject.value.id, subjectData);
    } else {
      await createSubject(subjectData);
    }

    await loadSubjects();
    showSubjectModal.value = false;

    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: `Subject ${currentSubject.value.id ? 'updated' : 'created'} successfully`,
      timer: 1500
    });
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

const deleteSubject = async (id) => {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      await deleteSubjectApi(id);
      await loadSubjects();
      Swal.fire('Deleted!', 'Subject has been deleted.', 'success');
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

const assignTeacher = async () => {
  try {
    await assignTeacherToSubject(selectedTeacherId.value, selectedSubject.value.id);
    await loadSubjects();
    showAssignTeacherModal.value = false;
    
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Teacher assigned successfully',
      timer: 1500
    });
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

const removeTeacher = async (subjectId, teacherId) => {
  try {
    const result = await Swal.fire({
      title: 'Remove Teacher?',
      text: "Are you sure you want to remove this teacher from the subject?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove'
    });

    if (result.isConfirmed) {
      await removeTeacherFromSubject(teacherId, subjectId);
      await loadSubjects();
      Swal.fire('Removed!', 'Teacher has been removed from the subject.', 'success');
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

const assignSection = async () => {
  try {
    await assignSubjectToSection(
      selectedGrade.value,
      selectedSection.value,
      selectedSubject.value.id
    );
    await loadSubjects();
    showAssignSectionModal.value = false;
    
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Section assigned successfully',
      timer: 1500
    });
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

const removeSection = async (subjectId, grade, section) => {
  try {
    const result = await Swal.fire({
      title: 'Remove Section?',
      text: "Are you sure you want to remove this section from the subject?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove'
    });

    if (result.isConfirmed) {
      await removeSubjectFromSection(grade, section, subjectId);
      await loadSubjects();
      Swal.fire('Removed!', 'Section has been removed from the subject.', 'success');
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

const updateSchedule = async () => {
  try {
    // Validate time range
    const start = new Date(`2000-01-01T${newSchedule.value.startTime}`);
    const end = new Date(`2000-01-01T${newSchedule.value.endTime}`);
    
    if (end <= start) {
      throw new Error('End time must be after start time');
    }

    // Validate days selection based on schedule type
    if (newSchedule.value.scheduleType === 'MULTIPLE' && 
        newSchedule.value.selectedDays.length === 0) {
      throw new Error('Please select at least one day');
    }

    // Prepare schedule data based on type
    const scheduleData = {
      scheduleType: newSchedule.value.scheduleType,
      startTime: newSchedule.value.startTime,
      endTime: newSchedule.value.endTime
    };

    switch (newSchedule.value.scheduleType) {
      case 'SINGLE':
        scheduleData.dayOfWeek = newSchedule.value.dayOfWeek;
        break;
      case 'RANGE':
        scheduleData.startDay = newSchedule.value.startDay;
        scheduleData.endDay = newSchedule.value.endDay;
        break;
      case 'MULTIPLE':
        scheduleData.daysOfWeek = newSchedule.value.selectedDays;
        break;
    }

    await updateSubjectSchedule(selectedSubject.value.id, scheduleData);
    await loadSubjects();
    showScheduleModal.value = false;
    
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Schedule updated successfully',
      timer: 1500
    });
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

// Add the formatting functions directly in the component
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

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([
    loadSubjects(),
    loadTeachers()
  ]);
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

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 500px;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.search-box .material-icons {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #159750;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background: #107040;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Loading State */
.loading-state {
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

.loading-state .material-icons-round {
  font-size: 3rem;
  color: #159750;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .manage-subjects {
    padding: 10px 5px;
  }

  .header-background {
    position: absolute;
    top: 60%;
    right: 1rem;
    transform: translateY(-50%);
    font-size: 3rem;
    font-weight: 900;
  }

  .filters-section {
    flex-direction: column;
    gap: 1rem;
  }

  .search-box {
    width: 100%;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 500px;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.search-box .material-icons {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.subjects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.subject-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.subject-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.subject-header {
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
  color: white;
  min-height: 120px;
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
  margin: 0 0 10px 0;
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
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  background: rgba(0, 0, 0, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
}

.subject-body {
  padding: 20px;
  flex: 1;
}

.subject-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-size: 0.8rem;
  color: #9e9e9e;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.teachers-list,
.sections-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.teacher-item,
.section-item {
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.assign-btn,
.schedule-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 20px;
  border: none;
  background: #e8f5e9;
  color: #159750;
  cursor: pointer;
  transition: all 0.2s;
}

.assign-btn:hover,
.schedule-btn:hover {
  background: #c8e6c9;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.subject-actions {
  padding: 15px;
  background: #f9f9f9;
  border-top: 1px solid #eee;
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s;
  color: white;
}

.edit-btn {
  background-color: #159750;
}

.edit-btn:hover {
  background-color: #107040;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.delete-btn {
  background-color: #f44336;
}

.delete-btn:hover {
  background-color: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.subject-form,
.assign-form,
.schedule-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn,
.save-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
}

.save-btn {
  background: #159750;
  color: white;
}

.save-btn:hover {
  background: #107040;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .manage-subjects {
    padding: 1rem;
  }
  
  .subjects-grid {
    grid-template-columns: 1fr;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .add-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Add this to ensure uppercase input */
.uppercase-input {
  text-transform: uppercase;
}

.uppercase-input::placeholder {
  text-transform: none;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.days-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
}

.day-checkbox input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.day-checkbox:hover {
  background: #f5f5f5;
}

.schedule-info {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.no-schedule {
  color: #888;
  font-style: italic;
}

.schedule-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #e8f5e9;
  color: #159750;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.schedule-btn:hover {
  background: #c8e6c9;
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.schedule-type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  background: #e8f5e9;
  color: #159750;
  font-size: 0.9rem;
}

.schedule-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.schedule-label {
  font-weight: 500;
}

.schedule-value {
  font-weight: 400;
}

/* Enhance schedule type badges with different colors */
.schedule-type-badge.single {
  background-color: #e8f5e9;
  color: #159750;
}

.schedule-type-badge.range {
  background-color: #e3f2fd;
  color: #1976d2;
}

.schedule-type-badge.multiple {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

/* Add styles for the remove buttons */
.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.8rem;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #ffebee;
  color: #f44336;
}
</style>