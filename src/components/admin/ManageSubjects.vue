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
              <span class="material-icons-round">person</span>
              <div class="info-content">
                <span class="info-label">Teachers</span>
                <div class="teachers-list">
                  <div v-for="teacher in subject.teachers" :key="teacher.teacherId" class="teacher-item">
                    {{ teacher.user.firstName }} {{ teacher.user.lastName }}
                    <button 
                      @click="removeTeacher(subject.id, teacher.teacherId)" 
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
                    <span>Assign</span>
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
                    <span>Assign</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- Direct Students Section -->
            <div class="info-item">
              <span class="material-icons-round">person</span>
              <div class="info-content">
                <span class="info-label">Direct Students</span>
                <div class="students-list">
                  <div v-if="subject.directStudents && subject.directStudents.length > 0" class="student-summary">
                    <span class="student-count">{{ subject.directStudents.length }} student(s)</span>
                    <button @click="openViewStudentsModal(subject)" class="view-all-btn">
                      <span class="material-icons">visibility</span>
                      <span>View All</span>
                    </button>
                  </div>
                  <div v-else class="empty-list">No direct students assigned</div>
                  <button 
                    @click="openAssignStudentModal(subject)" 
                    class="assign-btn"
                  >
                    <span class="material-icons">add</span>
                    <span class="assign-text">Assign Students</span>
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

    <!-- Assign Student Modal -->
    <div v-if="showAssignStudentModal" class="modal-overlay" @click="showAssignStudentModal = false">
      <div class="modal-content wider-modal" @click.stop>
        <div class="modal-header">
          <h2>Assign Students to {{ selectedSubject?.name }}</h2>
          <button class="close-btn" @click="showAssignStudentModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="bulkAssignStudents" class="assign-form">
          <div class="form-group">
            <div class="filters-container">
              <div class="search-filter">
                <input 
                  v-model="studentSearchQuery" 
                  type="text" 
                  placeholder="Search students..." 
                  class="search-input"
                />
                <span class="material-icons search-icon">search</span>
              </div>
              
              <div class="filter-options">
                <div class="filter-option">
                  <select v-model="gradeFilter" class="filter-select">
                    <option value="">All Grades</option>
                    <option v-for="grade in [7,8,9,10,11,12]" :key="grade" :value="grade">
                      Grade {{ grade }}
                    </option>
                  </select>
                </div>
                
                <div class="filter-option">
                  <select v-model="sectionFilter" class="filter-select">
                    <option value="">All Sections</option>
                    <option v-for="section in availableSectionOptions" :key="section" :value="section">
                      {{ section }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <div class="selection-header">
              <label>Select Students</label>
              <div class="selection-actions">
                <button type="button" class="select-btn" @click="selectAllFilteredStudents">Select All</button>
                <button type="button" class="select-btn" @click="deselectAllStudents">Deselect All</button>
              </div>
            </div>
            
            <div class="students-selection-list">
              <div 
                v-for="student in filteredAvailableStudents" 
                :key="student.id" 
                class="student-selection-item"
                :class="{ selected: selectedStudentIds.includes(student.id) }"
                @click="toggleStudentSelection(student.id)"
              >
                <div class="student-info">
                  <div class="student-name">{{ student.firstName }} {{ student.lastName }}</div>
                  <div class="student-details">Grade {{ student.gradeLevel }}-{{ student.section }} | {{ student.lrn || 'No LRN' }}</div>
                </div>
                <div class="checkbox-container">
                  <input 
                    type="checkbox" 
                    :checked="selectedStudentIds.includes(student.id)"
                    @click.stop
                    @change="toggleStudentSelection(student.id)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="selected-count">
            {{ selectedStudentIds.length }} student(s) selected
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showAssignStudentModal = false">
              Cancel
            </button>
            <button 
              type="submit" 
              class="save-btn"
              :disabled="selectedStudentIds.length === 0"
            >
              Assign Students
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- View Assigned Students Modal -->
    <div v-if="showViewStudentsModal" class="modal-overlay" @click="showViewStudentsModal = false">
      <div class="modal-content wider-modal view-students-modal" @click.stop>
        <div class="modal-header">
          <h2>Students in {{ selectedSubject?.name }}</h2>
          <button class="close-btn" @click="showViewStudentsModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>
        
        <div class="form-group">
          <div class="search-filter">
            <input 
              v-model="assignedStudentSearchQuery" 
              type="text" 
              placeholder="Search assigned students..." 
              class="search-input"
            />
            <span class="material-icons search-icon">search</span>
          </div>
        </div>
        
        <div class="students-list-container">
          <div v-if="filteredAssignedStudents.length > 0" class="assigned-students-list">
            <div 
              v-for="studentRel in filteredAssignedStudents" 
              :key="(studentRel.student && studentRel.student.id) || studentRel.studentId || studentRel.id" 
              class="student-selection-item"
            >
              <div class="student-info">
                <div class="student-name">
                  {{ (studentRel.student && studentRel.student.firstName) || studentRel.firstName }} 
                  {{ (studentRel.student && studentRel.student.lastName) || studentRel.lastName }}
                </div>
                <div class="student-details">
                  Grade {{ (studentRel.student && studentRel.student.gradeLevel) || studentRel.gradeLevel }}-{{ (studentRel.student && studentRel.student.section) || studentRel.section }} | 
                  {{ (studentRel.student && studentRel.student.lrn) || studentRel.lrn || 'No LRN' }}
                </div>
              </div>
              <button 
                @click="removeStudentFromSubjectHandler(
                  (studentRel.student && studentRel.student.id) || studentRel.studentId || studentRel.id, 
                  selectedSubject?.id || studentRel.subjectId
                )" 
                class="remove-student-btn"
              >
                <span class="material-icons">close</span>
                <span class="btn-text">Remove</span>
              </button>
            </div>
          </div>
          <div v-else class="empty-list-message">
            No students assigned directly to this subject
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="showViewStudentsModal = false">Close</button>
        </div>
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
  fetchStudents,
  getAllGradeSections,
  updateSubjectSchedule,
  getSubjectDirectStudents,
  removeStudentFromSubject,
  bulkAssignStudentsToSubject
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
const showAssignStudentModal = ref(false);
const showViewStudentsModal = ref(false);
const currentSubject = ref({ name: '', code: '', description: '' });
const selectedSubject = ref(null);
const selectedTeacherId = ref('');
const selectedGrade = ref('');
const selectedSection = ref('');
const selectedStudentIds = ref([]);
const teachers = ref([]);
const students = ref([]);
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
const studentSearchQuery = ref('');
const assignedStudentSearchQuery = ref('');
const gradeFilter = ref('');
const sectionFilter = ref('');
// const selectedStudentId = ref(''); // Remove this line

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

const availableStudents = computed(() => {
  if (!selectedSubject.value) return students.value;
  
  // Ensure directStudents is an array before processing
  const directStudents = selectedSubject.value.directStudents || [];
  
  // Extract student IDs from the directStudents array, handling different data structures
  const assignedStudentIds = directStudents.map(studentRel => {
    if (studentRel.student) {
      // If student data is nested in a 'student' property
      return studentRel.student.id;
    } else if (studentRel.studentId) {
      // If there's a studentId property
      return studentRel.studentId;
    } else {
      // Fall back to the id property
      return studentRel.id;
    }
  }).filter(id => id !== undefined);
  
  // Filter out students that are already assigned
  return students.value.filter(student => !assignedStudentIds.includes(student.id));
});

const availableSectionOptions = computed(() => {
  // Get unique sections from all students
  const uniqueSections = new Set();
  
  if (students.value && students.value.length > 0) {
    students.value.forEach(student => {
      if (student.section) {
        uniqueSections.add(student.section);
      }
    });
  }
  
  return Array.from(uniqueSections).sort();
});

const filteredAvailableStudents = computed(() => {
  if (!availableStudents.value) return [];
  
  return availableStudents.value.filter(student => {
    // Apply search filter
    const query = studentSearchQuery.value.toLowerCase();
    const matchesSearch = !query || 
      student.firstName.toLowerCase().includes(query) || 
      student.lastName.toLowerCase().includes(query) || 
      (student.lrn && student.lrn.toLowerCase().includes(query)) ||
      `${student.gradeLevel}-${student.section}`.toLowerCase().includes(query);
    
    // Apply grade filter
    const matchesGrade = !gradeFilter.value || 
      student.gradeLevel === parseInt(gradeFilter.value);
    
    // Apply section filter
    const matchesSection = !sectionFilter.value || 
      student.section === sectionFilter.value;
    
    // Return true only if all filters match
    return matchesSearch && matchesGrade && matchesSection;
  });
});

const filteredAssignedStudents = computed(() => {
  if (!selectedSubject.value || !selectedSubject.value.directStudents) return [];
  
  const query = assignedStudentSearchQuery.value.toLowerCase();
  const directStudents = selectedSubject.value.directStudents;
  
  if (!query) return directStudents;
  
  return directStudents.filter(studentRel => {
    // Get the student object, which might be nested in different ways
    const student = studentRel.student || studentRel;
    
    // Extract student properties, with fallbacks
    const firstName = student.firstName || '';
    const lastName = student.lastName || '';
    const lrn = student.lrn || '';
    const gradeLevel = student.gradeLevel || '';
    const section = student.section || '';
    const gradeSection = `${gradeLevel}-${section}`;
    
    // Perform the search
    return firstName.toLowerCase().includes(query) || 
           lastName.toLowerCase().includes(query) || 
           lrn.toLowerCase().includes(query) ||
           gradeSection.toLowerCase().includes(query);
  });
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
    const allSubjects = await getAllSubjects();
    
    // For each subject, fetch directly assigned students
    for (const subject of allSubjects) {
      try {
        const response = await getSubjectDirectStudents(subject.id);
        console.log(`Direct students for subject ${subject.id}:`, response);
        
        // Extract the actual data from the API response
        const directStudents = response.data || [];
        
        // Ensure directStudents is properly initialized as an array
        subject.directStudents = Array.isArray(directStudents) ? directStudents : [];
        
        // Log the processed data for debugging
        console.log(`Processed direct students for subject ${subject.id}:`, subject.directStudents);
      } catch (error) {
        console.error(`Error fetching direct students for subject ${subject.id}:`, error);
        subject.directStudents = [];
      }
    }
    
    subjects.value = allSubjects;
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

const loadStudents = async () => {
  try {
    students.value = await fetchStudents();
  } catch (error) {
    console.error('Error loading students:', error);
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

const openAssignStudentModal = (subject) => {
  selectedSubject.value = subject;
  selectedStudentIds.value = [];
  studentSearchQuery.value = '';
  gradeFilter.value = '';
  sectionFilter.value = '';
  showAssignStudentModal.value = true;
};

const openViewStudentsModal = (subject) => {
  selectedSubject.value = subject;
  assignedStudentSearchQuery.value = '';
  showViewStudentsModal.value = true;
};

const toggleStudentSelection = (studentId) => {
  const index = selectedStudentIds.value.indexOf(studentId);
  if (index === -1) {
    selectedStudentIds.value.push(studentId);
  } else {
    selectedStudentIds.value.splice(index, 1);
  }
};

const selectAllFilteredStudents = () => {
  filteredAvailableStudents.value.forEach(student => {
    if (!selectedStudentIds.value.includes(student.id)) {
      selectedStudentIds.value.push(student.id);
    }
  });
};

const deselectAllStudents = () => {
  selectedStudentIds.value = [];
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

const bulkAssignStudents = async () => {
  try {
    if (selectedStudentIds.value.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Students Selected',
        text: 'Please select at least one student to assign'
      });
      return;
    }
    
    console.log('Bulk assigning students to subject:', { 
      studentIds: selectedStudentIds.value, 
      subjectId: selectedSubject.value.id 
    });
    
    await bulkAssignStudentsToSubject(selectedStudentIds.value, selectedSubject.value.id);
    await loadSubjects();
    showAssignStudentModal.value = false;
    
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: `${selectedStudentIds.value.length} student(s) assigned successfully`,
      timer: 1500
    });
  } catch (error) {
    console.error('Error bulk assigning students to subject:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'Failed to assign students to subject'
    });
  }
};

const removeStudentFromSubjectHandler = async (studentId, subjectId) => {
  try {
    // Safety check for required parameters
    if (!studentId || !subjectId) {
      console.error('Missing required parameters:', { studentId, subjectId });
      
      // Try to get subjectId from selectedSubject if it's still available
      if (!subjectId && selectedSubject.value?.id) {
        subjectId = selectedSubject.value.id;
        console.log('Using subjectId from selectedSubject:', subjectId);
      }
      
      // If we still don't have subjectId, show error
      if (!subjectId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Unable to identify the subject. Please try again.'
        });
        return;
      }
    }
    
    console.log('Attempting to remove student from subject:', { studentId, subjectId });
    
    const result = await Swal.fire({
      title: 'Remove Student?',
      text: "Are you sure you want to remove this student from the subject?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove'
    });

    if (result.isConfirmed) {
      await removeStudentFromSubject(studentId, subjectId);
      console.log('Student removed successfully');
      
      // Reload the subject data to refresh the UI
      await loadSubjects();
      
      // If we're in the view students modal, we need to refresh the selected subject
      if (showViewStudentsModal.value && selectedSubject.value) {
        const updatedSubject = subjects.value.find(s => s.id === selectedSubject.value.id);
        if (updatedSubject) {
          selectedSubject.value = updatedSubject;
        }
      }
      
      Swal.fire('Removed!', 'Student has been removed from the subject.', 'success');
    }
  } catch (error) {
    console.error('Error removing student from subject:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'Failed to remove student from subject'
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
    loadTeachers(),
    loadStudents()
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

/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .manage-subjects {
    padding: 1.6rem;
  }
  
  .header-container {
    margin-bottom: 1.6rem;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-background {
    font-size: 6.4rem;
    right: 4rem;
  }
  
  .divider {
    margin: 1.2rem 0;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .filters-section {
    padding: 1.2rem;
    margin-bottom: 1.6rem;
  }
  
  .search-box input {
    padding: 0.6rem 0.8rem 0.6rem 2rem;
    font-size: 0.9rem;
  }
  
  .search-box .material-icons {
    left: 0.8rem;
    font-size: 1.1rem;
  }
  
  .add-btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
  
  .subjects-grid {
    gap: 1rem;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  .subject-card {
    margin-bottom: 1rem;
  }
  
  .subject-header {
    padding: 0.8rem;
    min-height: 80px;
  }
  
  .subject-header h2 {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }
  
  .subject-meta {
    gap: 0.5rem;
  }
  
  .subject-meta-item {
    font-size: 0.7rem;
    padding: 2px 6px;
  }
  
  .subject-body {
    padding: 0.8rem;
  }
  
  .subject-info {
    gap: 0.8rem;
  }
  
  .info-item {
    margin-bottom: 0.4rem;
  }
  
  .info-content {
    margin-left: 0.4rem;
  }
  
  .info-label {
    font-size: 0.7rem;
    margin-bottom: 0.2rem;
  }
  
  .info-item .material-icons-round {
    font-size: 0.8rem;
  }
  
  .teachers-list,
  .sections-list,
  .students-list {
    gap: 0.25rem;
  }
  
  .section-item, .student-item, .teacher-item {
    padding: 1px 4px;
    font-size: 0.6rem;
  }
  
  .assign-btn,
  .schedule-btn {
    padding: 1px 6px;
    font-size: 0.6rem;
  }
  
  .subject-actions {
    padding: 0.6rem;
    gap: 0.4rem;
  }
  
  .action-btn {
    padding: 0.5rem;
    font-size: 0.7rem;
  }
  
  .modal-content {
    width: 450px;
  }
  
  .modal-header {
    padding: 1.2rem 1.6rem;
  }
  
  .modal-header h2 {
    font-size: 1.3rem;
  }
  
  .subject-form,
  .assign-form,
  .schedule-form {
    padding: 1.2rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
    padding: 0 1.6rem;
  }
  
  .form-group label {
    font-size: 0.9rem;
    margin-bottom: 0.4rem;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.8rem;
    font-size: 0.9rem;
  }
  
  .form-actions {
    padding: 1.2rem 1.6rem;
    gap: 0.8rem;
  }
  
  .cancel-btn,
  .save-btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }
  
  .search-input {
    padding: 0.8rem 1.2rem 0.8rem 2.8rem;
    font-size: 0.9rem;
  }
  
  .search-icon {
    left: 0.8rem;
    font-size: 1.1rem;
  }
  
  .filter-select {
    padding: 0.6rem;
    font-size: 0.9rem;
    width: 130px;
  }
  
  .student-selection-item {
    padding: 0.8rem 1.2rem;
  }
  
  .student-name {
    font-size: 0.9rem;
  }
  
  .student-details {
    font-size: 0.8rem;
  }
  
  .select-btn {
    padding: 4px 8px;
    font-size: 0.8rem;
  }
  
  .selected-count {
    padding: 0.8rem;
    font-size: 0.9rem;
  }
  
  .student-summary {
    gap: 6px;
  }
  
  .student-count {
    font-size: 0.7rem;
  }
  
  .view-all-btn {
    padding: 2px 6px;
    font-size: 0.6rem;
    gap: 3px;
  }
  
  .view-all-btn .material-icons {
    font-size: 12px;
  }
  
  .empty-list {
    font-size: 0.7rem;
  }
}

/* Compact layout for 14-inch laptops and lower resolutions */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .manage-subjects {
    padding: 1.4rem;
  }
  
  .header-container {
    margin-bottom: 1.4rem;
  }
  
  .header-content h1 {
    font-size: 1.8rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.8rem;
  }
  
  .header-background {
    font-size: 5.6rem;
    right: 3.5rem;
  }
  
  .divider {
    margin: 1rem 0;
  }
  
  .subtitle {
    font-size: 0.95rem;
  }
  
  .filters-section {
    padding: 1rem;
    margin-bottom: 1.4rem;
  }
  
  .search-box input {
    padding: 0.5rem 0.7rem 0.5rem 1.8rem;
    font-size: 0.85rem;
  }
  
  .search-box .material-icons {
    left: 0.7rem;
    font-size: 1rem;
  }
  
  .add-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
  
  .subjects-grid {
    gap: 0.8rem;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
  
  .subject-card {
    margin-bottom: 0.8rem;
  }
  
  .subject-header {
    padding: 0.6rem;
    min-height: 70px;
  }
  
  .subject-header h2 {
    font-size: 1rem;
    margin-bottom: 0.4rem;
  }
  
  .subject-meta {
    gap: 0.4rem;
  }
  
  .subject-meta-item {
    font-size: 0.65rem;
    padding: 1px 5px;
  }
  
  .subject-body {
    padding: 0.6rem;
  }
  
  .subject-info {
    gap: 0.6rem;
  }
  
  .info-item {
    margin-bottom: 0.3rem;
  }
  
  .info-content {
    margin-left: 0.3rem;
  }
  
  .info-label {
    font-size: 0.65rem;
    margin-bottom: 0.15rem;
  }
  
  .info-item .material-icons-round {
    font-size: 0.7rem;
  }
  
  .teachers-list,
  .sections-list,
  .students-list {
    gap: 0.2rem;
  }
  
  .section-item, .student-item, .teacher-item {
    padding: 1px 3px;
    font-size: 0.55rem;
  }
  
  .assign-btn,
  .schedule-btn {
    padding: 1px 4px;
    font-size: 0.55rem;
  }
  
  .subject-actions {
    padding: 0.5rem;
    gap: 0.3rem;
  }
  
  .action-btn {
    padding: 0.4rem;
    font-size: 0.65rem;
  }
  
  .modal-content {
    width: 400px;
  }
  
  .modal-header {
    padding: 1rem 1.4rem;
  }
  
  .modal-header h2 {
    font-size: 1.2rem;
  }
  
  .subject-form,
  .assign-form,
  .schedule-form {
    padding: 1rem;
  }
  
  .form-group {
    margin-bottom: 0.8rem;
    padding: 0 1.4rem;
  }
  
  .form-group label {
    font-size: 0.85rem;
    margin-bottom: 0.3rem;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.6rem;
    font-size: 0.85rem;
  }
  
  .form-actions {
    padding: 1rem 1.4rem;
    gap: 0.6rem;
  }
  
  .cancel-btn,
  .save-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
  
  .search-input {
    padding: 0.6rem 1rem 0.6rem 2.4rem;
    font-size: 0.85rem;
  }
  
  .search-icon {
    left: 0.7rem;
    font-size: 1rem;
  }
  
  .filter-select {
    padding: 0.5rem;
    font-size: 0.85rem;
    width: 120px;
  }
  
  .student-selection-item {
    padding: 0.6rem 1rem;
  }
  
  .student-name {
    font-size: 0.85rem;
  }
  
  .student-details {
    font-size: 0.75rem;
  }
  
  .select-btn {
    padding: 3px 6px;
    font-size: 0.75rem;
  }
  
  .selected-count {
    padding: 0.6rem;
    font-size: 0.85rem;
  }
  
  .student-summary {
    gap: 4px;
  }
  
  .student-count {
    font-size: 0.65rem;
  }
  
  .view-all-btn {
    padding: 1px 4px;
    font-size: 0.55rem;
    gap: 2px;
  }
  
  .view-all-btn .material-icons {
    font-size: 10px;
  }
  
  .empty-list {
    font-size: 0.65rem;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .manage-subjects {
    padding: 1.2rem;
  }
  
  .header-container {
    margin-bottom: 1.2rem;
  }
  
  .header-content h1 {
    font-size: 1.6rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.6rem;
  }
  
  .header-background {
    font-size: 4.8rem;
    right: 3rem;
  }
  
  .divider {
    margin: 0.8rem 0;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .filters-section {
    padding: 0.8rem;
    margin-bottom: 1.2rem;
  }
  
  .search-box input {
    padding: 0.4rem 0.6rem 0.4rem 1.6rem;
    font-size: 0.8rem;
  }
  
  .search-box .material-icons {
    left: 0.6rem;
    font-size: 0.9rem;
  }
  
  .add-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
  
  .subjects-grid {
    gap: 0.6rem;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
  
  .subject-card {
    margin-bottom: 0.6rem;
  }
  
  .subject-header {
    padding: 0.5rem;
    min-height: 60px;
  }
  
  .subject-header h2 {
    font-size: 0.9rem;
    margin-bottom: 0.3rem;
  }
  
  .subject-meta {
    gap: 0.3rem;
  }
  
  .subject-meta-item {
    font-size: 0.6rem;
    padding: 1px 4px;
  }
  
  .subject-body {
    padding: 0.5rem;
  }
  
  .subject-info {
    gap: 0.5rem;
  }
  
  .info-item {
    margin-bottom: 0.25rem;
  }
  
  .info-content {
    margin-left: 0.25rem;
  }
  
  .info-label {
    font-size: 0.6rem;
    margin-bottom: 0.1rem;
  }
  
  .info-item .material-icons-round {
    font-size: 0.65rem;
  }
  
  .teachers-list,
  .sections-list,
  .students-list {
    gap: 0.15rem;
  }
  
  .section-item, .student-item, .teacher-item {
    padding: 1px 2px;
    font-size: 0.5rem;
  }
  
  .assign-btn,
  .schedule-btn {
    padding: 1px 3px;
    font-size: 0.5rem;
  }
  
  .subject-actions {
    padding: 0.4rem;
    gap: 0.25rem;
  }
  
  .action-btn {
    padding: 0.3rem;
    font-size: 0.6rem;
  }
  
  .modal-content {
    width: 350px;
  }
  
  .modal-header {
    padding: 0.8rem 1.2rem;
  }
  
  .modal-header h2 {
    font-size: 1.1rem;
  }
  
  .subject-form,
  .assign-form,
  .schedule-form {
    padding: 0.8rem;
  }
  
  .form-group {
    margin-bottom: 0.6rem;
    padding: 0 1.2rem;
  }
  
  .form-group label {
    font-size: 0.8rem;
    margin-bottom: 0.25rem;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 0.5rem;
    font-size: 0.8rem;
  }
  
  .form-actions {
    padding: 0.8rem 1.2rem;
    gap: 0.5rem;
  }
  
  .cancel-btn,
  .save-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
  
  .search-input {
    padding: 0.5rem 0.8rem 0.5rem 2rem;
    font-size: 0.8rem;
  }
  
  .search-icon {
    left: 0.6rem;
    font-size: 0.9rem;
  }
  
  .filter-select {
    padding: 0.4rem;
    font-size: 0.8rem;
    width: 110px;
  }
  
  .student-selection-item {
    padding: 0.5rem 0.8rem;
  }
  
  .student-name {
    font-size: 0.8rem;
  }
  
  .student-details {
    font-size: 0.7rem;
  }
  
  .select-btn {
    padding: 2px 5px;
    font-size: 0.7rem;
  }
  
  .selected-count {
    padding: 0.5rem;
    font-size: 0.8rem;
  }
  
  .student-summary {
    gap: 3px;
  }
  
  .student-count {
    font-size: 0.6rem;
  }
  
  .view-all-btn {
    padding: 1px 3px;
    font-size: 0.5rem;
    gap: 1px;
  }
  
  .view-all-btn .material-icons {
    font-size: 8px;
  }
  
  .empty-list {
    font-size: 0.6rem;
  }
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
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

@media (max-width: 768px) {
  .subjects-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
}

.subject-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Make the card more compact on mobile */
@media (max-width: 768px) {
  .subject-card {
    margin-bottom: 12px;
  }
  
  .card-header {
    padding: 8px 12px;
  }
  
  .card-header h3 {
    margin-bottom: 5px;
    font-size: 1.1rem;
  }
  
  .card-body {
    padding: 10px 12px;
  }
  
  .info-item {
    margin-bottom: 8px;
  }
  
  .info-content {
    margin-left: 8px;
  }
  
  .info-label {
    font-size: 0.85rem;
    margin-bottom: 2px;
  }
}

/* Even more compact for very small screens */
@media (max-width: 480px) {
  .subject-card {
    margin-bottom: 10px;
  }
  
  .card-header h3 {
    font-size: 1rem;
  }
  
  .card-body {
    padding: 8px 10px;
  }
  
  .info-item {
    margin-bottom: 6px;
  }
  
  .info-label {
    font-size: 0.8rem;
  }
  
  .section-item, .student-item, .teacher-item {
    padding: 2px 6px;
    font-size: 0.75rem;
    border-radius: 10px;
  }
}

.card-header {
  background-color: #19a463;
  padding: 15px 20px;
  border-bottom: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  color: white;
}

.card-header h3 {
  margin: 0;
  font-weight: 600;
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.header-icons {
  display: flex;
  gap: 15px;
}

.header-icon-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: white;
  font-size: 0.9rem;
}

.header-icon-item .material-icons {
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .card-header {
    padding: 12px 15px;
  }
  
  .card-header h3 {
    font-size: 1.3rem;
    margin-bottom: 8px;
  }
  
  .header-icons {
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .card-header {
    padding: 10px 12px;
  }
  
  .card-header h3 {
    font-size: 1.2rem;
    margin-bottom: 6px;
  }
  
  .header-icons {
    gap: 10px;
  }
  
  .header-icon-item {
    font-size: 0.8rem;
  }
  
  .header-icon-item .material-icons {
    font-size: 1rem;
  }
}

.subject-code {
  font-size: 0.8rem;
  opacity: 0.8;
}

.subject-card {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
  border: none;
}

@media (max-width: 768px) {
  .card-header {
    padding: 10px 15px;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .card-header h3 {
    margin-bottom: 8px;
    font-size: 1.2rem;
  }
}

.card-body {
  padding: 20px;
}

@media (max-width: 768px) {
  .card-body {
    padding: 15px;
  }
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
  margin-bottom: 15px;
  align-items: flex-start;
}

@media (max-width: 768px) {
  .info-item {
    margin-bottom: 12px;
  }
}

.info-content {
  margin-left: 15px;
  flex: 1;
}

@media (max-width: 768px) {
  .info-content {
    margin-left: 10px;
  }
}

.info-label {
  font-weight: 600;
  margin-bottom: 5px;
  display: block;
  color: #19a463;
}

@media (max-width: 768px) {
  .info-label {
    font-size: 0.9rem;
    margin-bottom: 3px;
  }
  
  .info-item .material-icons-round {
    font-size: 1.1rem;
  }
}

.teachers-list,
.sections-list,
.students-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

@media (max-width: 768px) {
  .sections-list, .students-list, .teachers-list {
    gap: 5px;
  }
}

.section-item, .student-item, .teacher-item {
  background-color: #e8f5e9;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  color: #2e7d32;
}

@media (max-width: 768px) {
  .section-item, .student-item, .teacher-item {
    padding: 3px 8px;
    font-size: 0.8rem;
    border-radius: 12px;
  }
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

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.modal-content {
  background-color: #fff;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.wider-modal {
  width: 700px;
}

@media (max-width: 768px) {
  .modal-content, .wider-modal {
    width: 100%;
    max-width: 100%;
    border-radius: 8px;
  }
  
  .modal-overlay {
    padding: 10px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #e9ecef;
}

@media (max-width: 768px) {
  .modal-header {
    padding: 10px 15px;
  }
  
  .modal-header h2 {
    font-size: 1.2rem;
  }
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
}

.close-btn:hover {
  color: #343a40;
}

.subject-form,
.assign-form,
.schedule-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 15px;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .form-group {
    margin-bottom: 10px;
    padding: 0 15px;
  }
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: 500;
}

@media (max-width: 768px) {
  .form-label {
    font-size: 0.9rem;
  }
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .form-input {
    padding: 8px;
    font-size: 0.9rem;
  }
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #e9ecef;
}

@media (max-width: 768px) {
  .form-actions {
    padding: 10px 15px;
  }
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

.save-btn:disabled {
  background-color: #b0c4de;
  cursor: not-allowed;
}

.search-input {
  width: 100%;
  padding: 10px 15px 10px 35px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .search-input {
    padding: 8px 15px 8px 30px;
    font-size: 0.9rem;
  }
}

.search-filter {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .search-icon {
    font-size: 1rem;
    left: 8px;
  }
}

.filters-container {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
    gap: 0.5rem;
  }
}

.filter-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .filter-options {
    width: 100%;
    justify-content: space-between;
  }
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .filter-option {
    flex: 1;
  }
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  width: 150px;
}

@media (max-width: 768px) {
  .filter-select {
    padding: 0.5rem;
    font-size: 0.9rem;
    width: 100%;
  }
}

.students-selection-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .students-selection-list {
    max-height: 250px;
  }
}

.student-selection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
}

@media (max-width: 768px) {
  .student-selection-item {
    padding: 8px 10px;
  }
}

.student-selection-item:last-child {
  border-bottom: none;
}

.student-selection-item:hover {
  background-color: #f8f9fa;
}

.student-selection-item.selected {
  background-color: #e7f5ff;
}

.student-info {
  flex: 1;
}

.student-name {
  font-weight: 500;
}

@media (max-width: 768px) {
  .student-name {
    font-size: 0.9rem;
  }
}

.student-details {
  font-size: 0.85rem;
  color: #6c757d;
}

@media (max-width: 768px) {
  .student-details {
    font-size: 0.75rem;
  }
}

.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

@media (max-width: 768px) {
  .selection-header {
    margin-bottom: 8px;
  }
}

.selection-actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 768px) {
  .selection-actions {
    gap: 5px;
  }
}

.select-btn {
  background-color: transparent;
  border: 1px solid #007bff;
  color: #007bff;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

@media (max-width: 768px) {
  .select-btn {
    padding: 3px 8px;
    font-size: 0.75rem;
  }
}

.select-btn:hover {
  background-color: #f0f7ff;
}

.selected-count {
  text-align: center;
  padding: 10px;
  font-weight: 500;
  color: #495057;
}

@media (max-width: 768px) {
  .selected-count {
    padding: 8px;
    font-size: 0.9rem;
  }
}

.student-summary {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 768px) {
  .student-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}

.student-count {
  font-weight: 500;
  color: #2e7d32;
}

.view-students-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #e9ecef;
  border: none;
  padding: 5px 10px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #495057;
  transition: background-color 0.2s;
}

.view-students-btn:hover {
  background-color: #dee2e6;
}

.view-students-btn .material-icons {
  font-size: 16px;
}

@media (max-width: 768px) {
  .view-students-btn {
    padding: 3px 8px;
    font-size: 0.75rem;
    border-radius: 12px;
  }
  
  .view-students-btn .material-icons {
    font-size: 14px;
  }
}

.view-students-modal .students-list {
  max-height: 400px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .view-students-modal .students-list {
    max-height: 300px;
  }
}

.empty-list {
  color: #6c757d;
  font-style: italic;
  padding: 5px 0;
}

.remove-student-btn {
  background-color: transparent;
  color: #e57373;
  border: 1px solid #e57373;
  border-radius: 15px;
  padding: 2px 8px;
  margin-left: 5px;
  cursor: pointer;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.remove-student-btn:hover {
  background-color: #ffebee;
}

@media (max-width: 768px) {
  .remove-student-btn {
    padding: 1px 6px;
  }
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

.remove-btn .material-icons {
  font-size: 16px;
}

@media (max-width: 768px) {
  .remove-btn .material-icons {
    font-size: 14px;
  }
}

.empty-list {
  color: #888;
  font-style: italic;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.wider-modal {
  width: 700px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.students-list-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .students-list-container {
    max-height: 300px;
    padding: 0 15px;
  }
}

.assigned-students-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.empty-list-message {
  padding: 20px;
  text-align: center;
  color: #6c757d;
  font-style: italic;
}

@media (max-width: 768px) {
  .empty-list-message {
    padding: 15px;
    font-size: 0.9rem;
  }
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .modal-footer {
    padding: 10px 15px;
  }
}

.btn-text {
  display: inline-block;
  margin-left: 3px;
}

@media (max-width: 480px) {
  .btn-text {
    display: none;
  }
  
  .remove-student-btn {
    padding: 3px;
    border-radius: 50%;
  }
}

/* General responsive improvements */
.manage-subjects {
  padding: 20px;
}

@media (max-width: 768px) {
  .manage-subjects {
    padding: 10px;
  }
}

.page-header {
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .page-header {
    margin-bottom: 15px;
  }
  
  .page-header h1 {
    font-size: 1.5rem;
  }
}

/* Restore View All button design */
.view-all-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #e9ecef;
  border: none;
  padding: 5px 10px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #495057;
  transition: background-color 0.2s;
}

.view-all-btn:hover {
  background-color: #dee2e6;
}

.view-all-btn .material-icons {
  font-size: 16px;
}

@media (max-width: 768px) {
  .view-all-btn {
    padding: 3px 8px;
    font-size: 0.75rem;
    border-radius: 12px;
  }
  
  .view-all-btn .material-icons {
    font-size: 14px;
  }
}

.assign-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #e8f5e9;
  border: none;
  padding: 5px 10px;
  border-radius: 15px;
  cursor: pointer;
  font-size: 0.85rem;
  color: #2e7d32;
  transition: background-color 0.2s;
  margin-top: 5px;
}

.assign-btn:hover {
  background-color: #c8e6c9;
}

.assign-btn .material-icons {
  font-size: 16px;
}

@media (max-width: 768px) {
  .assign-btn {
    padding: 3px 8px;
    font-size: 0.75rem;
    border-radius: 12px;
  }
  
  .assign-btn .material-icons {
    font-size: 14px;
  }
}

.student-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 480px) {
  .student-summary {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .section-item, .student-item, .teacher-item, .view-all-btn, .assign-btn {
    font-size: 0.7rem;
    padding: 2px 5px;
  }
  
  .view-all-btn .material-icons, .assign-btn .material-icons {
    font-size: 12px;
  }
}

.info-item .material-icons-round {
  color: #19a463;
  font-size: 1.2rem;
}
</style>