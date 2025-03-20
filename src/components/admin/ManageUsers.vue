<template>
  <div class="manage-users">
    <div class="page-header">
      <h1>Manage Users</h1>
      <div class="header-actions">
        <button @click="openModal('student')" class="add-btn student">
          <span class="material-icons">school</span> Add Student
        </button>
        <button @click="openModal('teacher')" class="add-btn teacher">
          <span class="material-icons">person_add</span> Add Teacher
        </button>
        <button @click="openModal('admin')" class="add-btn admin">
          <span class="material-icons">admin_panel_settings</span> Add Admin
        </button>
        <button @click="openGradeSectionModal()" class="add-btn grade-section">
          <span class="material-icons">class</span> Add Grade Section
        </button>
      </div>
    </div>

    <div class="filters-section">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search users..."
          class="uppercase-input"
        />
      </div>

      <div class="tabs">
        <button 
          v-for="tab in ['students', 'teachers', 'admins', 'sections']"
          :key="tab"
          :class="['tab-btn', { active: activeTab === tab }]"
          @click="activeTab = tab"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>

      <!-- Dynamic Filters -->
      <div v-if="activeTab === 'students'" class="filter-group">
        <select v-model="filters.gradeLevel">
          <option value="">All Grades</option>
          <option v-for="grade in filterOptions.grades" :key="grade" :value="grade">
            Grade {{ grade }}
          </option>
        </select>
        <select v-model="filters.section">
          <option value="">All Sections</option>
          <option v-for="section in filterOptions.sections" :key="section" :value="section">
            {{ section }}
          </option>
        </select>
      </div>

      <div v-if="activeTab === 'teachers'" class="filter-group">
        <select v-model="filters.department">
          <option value="">All Departments</option>
          <option v-for="dept in filterOptions.departments" :key="dept" :value="dept">
            {{ dept }}
          </option>
        </select>
        <select v-model="filters.domain">
          <option value="">All Domains</option>
          <option v-for="domain in filterOptions.domains" :key="domain" :value="domain">
            {{ domain }}
          </option>
        </select>
      </div>
    </div>

    <!-- Add view toggle button -->
    <div class="view-controls">
      <button 
        class="view-toggle-btn" 
        :class="{ active: viewMode === 'grid' }"
        @click="viewMode = 'grid'"
      >
        <span class="material-icons">grid_view</span>
        Grid View
      </button>
      <button 
        class="view-toggle-btn" 
        :class="{ active: viewMode === 'table' }"
        @click="viewMode = 'table'"
      >
        <span class="material-icons">table_rows</span>
        Table View
      </button>
    </div>

    <!-- Grade Section List -->
    <div v-if="activeTab === 'sections'" class="list-section">
      <h2>Grade Sections</h2>
      <div v-if="gradeSectionsLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading grade sections...</p>
      </div>

      <div v-else-if="gradeSections.length === 0" class="empty-state">
        <span class="material-icons">class</span>
        <p>No grade sections found</p>
      </div>

      <div v-else class="grade-sections-grid">
        <div v-for="gs in gradeSections" :key="gs.id" class="grade-section-card">
          <div class="grade-section-header">
            <h3>Grade {{ gs.grade }} - Section {{ gs.section }}</h3>
          </div>
          <div class="grade-section-actions">
            <button @click="openGradeSectionModal(gs)" class="action-btn edit">
              <span class="material-icons">edit</span>
            </button>
            <button @click="deleteGrade(gs.id)" class="action-btn delete">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Users List -->
    <div class="users-list" v-if="!loading && activeTab !== 'sections'">
      <div v-if="filteredUsers.length === 0" class="empty-state">
        <span class="material-icons">group_off</span>
        <p>No users found</p>
      </div>

      <!-- Grid View -->
      <div v-if="viewMode === 'grid'" class="users-grid">
        <div v-for="user in filteredUsers" :key="user.id" class="user-card">
          <div class="user-avatar">
            {{ user.firstName[0] }}{{ user.lastName[0] }}
          </div>
          <div class="user-info">
            <h3>{{ user.firstName }} {{ user.lastName }}</h3>
            <p class="email">{{ user.email }}</p>
            <div class="details">
              <template v-if="activeTab === 'students'">
                <span class="detail-item">
                  <span class="material-icons">school</span>
                  Grade {{ user.gradeLevel || 'N/A' }}
                </span>
                <span class="detail-item">
                  <span class="material-icons">groups</span>
                  {{ user.section || 'N/A' }}
                </span>
              </template>
              <template v-if="activeTab === 'teachers'">
                <span class="detail-item">
                  <span class="material-icons">business</span>
                  {{ user.department || 'N/A' }}
                </span>
                <span class="detail-item">
                  <span class="material-icons">book</span>
                  {{ user.domain || 'N/A' }}
                </span>
              </template>
            </div>
          </div>
          <div class="user-actions">
            <button class="action-btn view" @click="viewUserDetails(user)">
              <span class="material-icons">visibility</span>
            </button>
            <button class="action-btn edit" @click="openEditModal(user)">
              <span class="material-icons">edit</span>
            </button>
            <button class="action-btn delete" @click="handleDeleteUser(user.id)">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th v-if="activeTab === 'students'">LRN</th>
              <th v-if="activeTab === 'students'">Grade</th>
              <th v-if="activeTab === 'students'">Section</th>
              <th v-if="activeTab === 'teachers'">Department</th>
              <th v-if="activeTab === 'teachers'">Domain</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.firstName }} {{ user.lastName }}</td>
              <td>{{ user.email }}</td>
              <td v-if="activeTab === 'students'">{{ user.lrn || 'N/A' }}</td>
              <td v-if="activeTab === 'students'">{{ user.gradeLevel || 'N/A' }}</td>
              <td v-if="activeTab === 'students'">{{ user.section || 'N/A' }}</td>
              <td v-if="activeTab === 'teachers'">{{ user.department || 'N/A' }}</td>
              <td v-if="activeTab === 'teachers'">{{ user.domain || 'N/A' }}</td>
              <td>
                <div class="user-actions">
                  <button class="action-btn view" @click="viewUserDetails(user)">
                    <span class="material-icons">visibility</span>
                  </button>
                  <button class="action-btn edit" @click="openEditModal(user)">
                    <span class="material-icons">edit</span>
                  </button>
                  <button class="action-btn delete" @click="handleDeleteUser(user.id)">
                    <span class="material-icons">delete</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Registration Modal -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Add {{ modalType.charAt(0).toUpperCase() + modalType.slice(1) }}</h2>
          <button class="close-btn" @click="showModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="registration-form">
          <div class="form-row">
            <div class="form-group">
              <label>First Name</label>
              <input v-model="formData.firstName" type="text" required class="uppercase-input" />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input 
                v-model="formData.lastName" 
                type="text" 
                required 
                @input="updateCredentials"
                class="uppercase-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Email (auto-generated)</label>
            <input 
              v-model="formData.email" 
              type="email" 
              required 
              readonly 
              class="generated-input"
            />
          </div>
          <div class="form-group">
            <label>Password (auto-generated)</label>
            <input 
              v-model="formData.password" 
              type="text" 
              required 
              readonly 
              class="generated-input"
            />
          </div>

          <div class="form-group">
            <label>Address</label>
            <input v-model="formData.address" type="text" class="uppercase-input" />
          </div>

          <!-- Student-specific fields -->
          <template v-if="modalType === 'student'">
            <div class="form-row">
              <div class="form-group">
                <label>LRN</label>
                <input v-model.number="formData.lrn" type="number" class="uppercase-input" />
              </div>
              <div class="form-group">
                <label>Grade</label>
                <select 
                  v-model="formData.gradeLevel" 
                  required
                  class="uppercase-input"
                >
                  <option v-for="grade in [7,8,9,10,11,12]" :key="grade" :value="grade">
                    Grade {{ grade }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Section</label>
              <select 
                v-model="formData.section" 
                required
                class="uppercase-input"
              >
                <option value="">Select Section</option>
                <option v-for="section in availableSections" :key="section" :value="section">
                  {{ section }}
                </option>
              </select>
            </div>
          </template>

          <!-- Teacher-specific fields -->
          <template v-if="modalType === 'teacher'">
            <div class="form-row">
              <div class="form-group">
                <label>Department</label>
                <input v-model="formData.department" type="text" class="uppercase-input" />
              </div>
              <div class="form-group">
                <label>Domain</label>
                <input v-model="formData.domain" type="text" class="uppercase-input" />
              </div>
            </div>
          </template>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showModal = false">
              Cancel
            </button>
            <button type="submit" class="submit-btn">
              Create {{ modalType.charAt(0).toUpperCase() + modalType.slice(1) }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Grade Section Modal -->
    <div v-if="showGradeSectionModal" class="modal-overlay" @click="showGradeSectionModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ currentGradeSection.id ? 'Edit' : 'Add' }} Grade Section</h2>
          <button class="close-btn" @click="showGradeSectionModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="saveGradeSection">
          <div class="form-group">
            <label>Grade</label>
            <select 
              v-model.number="currentGradeSection.grade" 
              required
              class="uppercase-input"
            >
              <option v-for="grade in [7,8,9,10,11,12]" :key="grade" :value="grade">
                Grade {{ grade }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Section</label>
            <input 
              v-model="currentGradeSection.section" 
              type="text" 
              required
              class="uppercase-input"
            />
          </div>
          <div class="form-actions">
            <button type="button" @click="showGradeSectionModal = false" class="cancel-btn">
              Cancel
            </button>
            <button type="submit" class="save-btn">
              {{ currentGradeSection.id ? 'Update' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- User Details Modal -->
    <div v-if="showUserDetailsModal" class="modal-overlay" @click="showUserDetailsModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>User Details</h2>
          <button class="close-btn" @click="showUserDetailsModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="user-details">
          <div v-for="(value, key) in selectedUser" :key="key" class="detail-item">
            <span class="label">{{ formatLabel(key) }}:</span>
            <span class="value">{{ formatValue(key, value) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="showEditModal" class="modal-overlay">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Edit {{ editFormData.role?.charAt(0).toUpperCase() + editFormData.role?.slice(1) }}</h2>
          <button class="close-btn" @click="showEditModal = false">
            <span class="material-icons">close</span>
          </button>
        </div>

        <form @submit.prevent="handleUpdateUser" class="registration-form">
          <!-- Common fields -->
          <div class="form-group">
            <label>First Name</label>
            <input v-model="editFormData.firstName" type="text" required class="uppercase-input" />
          </div>

          <div class="form-group">
            <label>Last Name</label>
            <input v-model="editFormData.lastName" type="text" required class="uppercase-input" />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input v-model="editFormData.email" type="email" required class="uppercase-input" />
          </div>

          <div class="form-group">
            <label>Address</label>
            <input v-model="editFormData.address" type="text" class="uppercase-input" />
          </div>

          <!-- Student-specific fields -->
          <div v-if="editFormData.role === 'student'">
            <div class="form-group">
              <label>LRN</label>
              <input v-model.number="editFormData.lrn" type="number" required class="uppercase-input" />
            </div>

            <div class="form-group">
              <label>Grade Level</label>
              <select v-model.number="editFormData.gradeLevel" required @change="editFormData.section = ''" class="uppercase-input">
                <option v-for="grade in [7,8,9,10,11,12]" :key="grade" :value="grade">
                  Grade {{ grade }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Section</label>
              <select v-model="editFormData.section" required :disabled="!editFormData.gradeLevel" class="uppercase-input">
                <option value="">Select Section</option>
                <option v-for="section in availableSectionsForGrade" :key="section" :value="section">
                  {{ section }}
                </option>
              </select>
            </div>
          </div>

          <!-- Password field -->
          <div class="form-group">
            <label>New Password</label>
            <input 
              v-model="editFormData.password" 
              type="password" 
              placeholder="Leave blank to keep current password"
              class="uppercase-input"
            />
            <small class="form-hint">Minimum 8 characters</small>
          </div>

          <!-- Created At info -->
          <div class="form-group">
            <label>Created At</label>
            <input 
              :value="formatDate(editFormData.createdAt)" 
              type="text" 
              readonly 
              class="generated-input"
            />
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="showEditModal = false">
              Cancel
            </button>
            <button type="submit" class="save-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { 
  registerStudent, 
  registerTeacher, 
  registerAdmin,
  fetchStudents,
  fetchTeachers,
  fetchAdmins,
  createGradeSection,
  getAllGradeSections,
  updateGradeSection,
  deleteGradeSection,
  updateUser,
  deleteUser,
  getUserDetails
} from '@/services/authService';
import Swal from 'sweetalert2';

// Data for user lists
const students = ref([]);
const teachers = ref([]);
const admins = ref([]);
const loading = ref(true);

// Active tab tracking
const activeTab = ref('students');

// Search and filter states
const searchQuery = ref('');
const filters = ref({
  gradeLevel: '',
  section: '',
  department: '',
  domain: ''
});

// Modal states
const showModal = ref(false);
const modalType = ref('');
const formData = ref({
  gradeLevel: 7,
  section: ''
});

// Add grade section state
const gradeSections = ref([]);
const gradeSectionsLoading = ref(false);
const showGradeSectionModal = ref(false);
const currentGradeSection = ref({
  id: null,
  grade: 7,
  section: ''
});

// Add these computed properties for dynamic filter options
const filterOptions = computed(() => ({
  grades: [...new Set(students.value
    .map(student => student.gradeLevel)
    .filter(Boolean)
    .sort((a, b) => a - b))],
    
  sections: [...new Set(students.value
    .map(student => student.section)
    .filter(Boolean)
    .sort())],
    
  departments: [...new Set(teachers.value
    .map(teacher => teacher.department)
    .filter(Boolean)
    .sort())],
    
  domains: [...new Set(teachers.value
    .map(teacher => teacher.domain)
    .filter(Boolean)
    .sort())]
}));

const availableSections = ref([]);

// Add view mode state
const viewMode = ref('grid'); // 'grid' or 'table'

// Add this computed property to filter sections based on grade level
const availableSectionsForGrade = computed(() => {
  if (!editFormData.value.gradeLevel) return [];
  return gradeSections.value
    .filter(gs => gs.grade === editFormData.value.gradeLevel)
    .map(gs => gs.section);
});

// Initial data loading
onMounted(async () => {
  await loadAllUsers();
  await loadGradeSections();
  await loadSections();
  availableSections.value = gradeSections.value
    .filter(gs => gs.grade === formData.value.gradeLevel)
    .map(gs => gs.section);
});

const loadAllUsers = async () => {
  try {
    loading.value = true;
    const [fetchedStudents, fetchedTeachers, fetchedAdmins] = await Promise.all([
      fetchStudents(),
      fetchTeachers(),
      fetchAdmins()
    ]);
    
    students.value = fetchedStudents;
    teachers.value = fetchedTeachers;
    admins.value = fetchedAdmins;
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Failed to Load Users',
      text: err.message
    });
  } finally {
    loading.value = false;
  }
};

const generateCredentials = (firstName, lastName) => {
  if (!firstName || !lastName) return { email: '', password: '' };
  
  const sanitizedFirstName = firstName.toLowerCase().trim().replace(/\s+/g, '');
  const sanitizedLastName = lastName.toLowerCase().trim().replace(/\s+/g, '');
  return {
    email: `${sanitizedFirstName}${sanitizedLastName}@ncnhs.edu.ph`,
    password: `${sanitizedLastName}2025`
  };
};

// Update the updateCredentials function to use both first and last name
const updateCredentials = () => {
  if (formData.value.firstName && formData.value.lastName) {
    const { email, password } = generateCredentials(formData.value.firstName, formData.value.lastName);
    formData.value.email = email;
    formData.value.password = password;
  }
};

const openModal = (type) => {
  modalType.value = type;
  formData.value = getInitialFormData(type);
  showModal.value = true;
};

const getInitialFormData = (type) => {
  const baseData = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    address: ''
  };

  switch (type) {
    case 'student':
      return {
        ...baseData,
        lrn: null,
        gradeLevel: 7,
        section: ''
      };
    case 'teacher':
      return {
        ...baseData,
        domain: '',
        department: ''
      };
    default:
      return baseData;
  }
};

const handleSubmit = async () => {
  try {
    let registrationData = {
      firstName: formData.value.firstName.toUpperCase(),
      lastName: formData.value.lastName.toUpperCase(),
      email: formData.value.email,
      password: formData.value.password,
      address: formData.value.address ? formData.value.address.toUpperCase() : '',
      role: modalType.value
    };

    // Add student-specific fields
    if (modalType.value === 'student') {
      registrationData = {
        ...registrationData,
        lrn: formData.value.lrn,
        gradeLevel: formData.value.gradeLevel,
        section: formData.value.section.toUpperCase()
      };
    }

    // Add teacher-specific fields
    if (modalType.value === 'teacher') {
      registrationData = {
        ...registrationData,
        department: formData.value.department ? formData.value.department.toUpperCase() : '',
        domain: formData.value.domain ? formData.value.domain.toUpperCase() : ''
      };
    }

    // Call the appropriate registration function
    let response;
    switch (modalType.value) {
      case 'student':
        response = await registerStudent(registrationData);
        break;
      case 'teacher':
        response = await registerTeacher(registrationData);
        break;
      case 'admin':
        response = await registerAdmin(registrationData);
        break;
      default:
        throw new Error('Invalid user type');
    }

    // Handle successful registration
    if (response) {
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful',
        text: `${modalType.value} account created successfully`
      });
      await loadAllUsers();
      showModal.value = false;
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Registration Failed',
      text: error.message
    });
  }
};

const filteredUsers = computed(() => {
  let users = [];
  
  switch (activeTab.value) {
    case 'students':
      users = students.value;
      break;
    case 'teachers':
      users = teachers.value;
      break;
    case 'admins':
      users = admins.value;
      break;
  }

  return users.filter(user => {
    const searchMatch = !searchQuery.value || 
      user.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase());

    let filterMatch = true;
    
    if (activeTab.value === 'students') {
      if (filters.value.gradeLevel && user.gradeLevel !== filters.value.gradeLevel) {
        filterMatch = false;
      }
      if (filters.value.section && user.section !== filters.value.section) {
        filterMatch = false;
      }
    }
    
    if (activeTab.value === 'teachers') {
      if (filters.value.department && user.department !== filters.value.department) {
        filterMatch = false;
      }
      if (filters.value.domain && user.domain !== filters.value.domain) {
        filterMatch = false;
      }
    }

    return searchMatch && filterMatch;
  });
});

// Load grade sections
const loadGradeSections = async () => {
  gradeSectionsLoading.value = true;
  try {
    const response = await getAllGradeSections();
    gradeSections.value = response.gradeSections;
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Failed to load grade sections',
      text: error.message
    });
  } finally {
    gradeSectionsLoading.value = false;
  }
};

// Open grade section modal
const openGradeSectionModal = (gradeSection = null) => {
  currentGradeSection.value = gradeSection ? { ...gradeSection } : {
    id: null,
    grade: 7,
    section: ''
  };
  showGradeSectionModal.value = true;
};

// Save grade section
const saveGradeSection = async () => {
  try {
    const grade = parseInt(currentGradeSection.value.grade);
    if (grade < 7 || grade > 12) {
      throw new Error('Grade must be between 7 and 12');
    }
    
    // Convert section to uppercase before saving
    const uppercaseSection = currentGradeSection.value.section.toUpperCase();
    
    if (currentGradeSection.value.id) {
      // Update existing grade section
      await updateGradeSection(
        currentGradeSection.value.id,
        grade,
        uppercaseSection
      );
      Swal.fire({
        icon: 'success',
        title: 'Grade section updated!',
        showConfirmButton: false,
        timer: 1500
      });
    } else {
      // Create new grade section
      await createGradeSection(
        grade,
        uppercaseSection
      );
      Swal.fire({
        icon: 'success',
        title: 'Grade section created!',
        showConfirmButton: false,
        timer: 1500
      });
    }
    await loadGradeSections();
    showGradeSectionModal.value = false;
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid Grade',
      text: error.message
    });
  }
};

// Delete grade section
const deleteGrade = async (id) => {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      await deleteGradeSection(id);
      await loadGradeSections();
      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Grade section has been deleted.',
        showConfirmButton: false,
        timer: 1500
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

// Watch grade level changes to update sections
watch(() => formData.value.gradeLevel, async (newGrade) => {
  const response = await getAllGradeSections();
  availableSections.value = response.gradeSections
    .filter(gs => gs.grade === newGrade)
    .map(gs => gs.section);
  formData.value.section = availableSections.value[0] || '';
});

// Add user details modal
const showUserDetailsModal = ref(false);
const selectedUser = ref(null);

// Add view user details function
const viewUserDetails = (user) => {
  selectedUser.value = user;
  showUserDetailsModal.value = true;
};

// Add utility functions
const formatLabel = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

const formatValue = (key, value) => {
  if (!value && value !== 0) return 'N/A';
  
  // Format dates
  if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
    return new Date(value).toLocaleString();
  }
  
  // Format boolean values
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  // Format arrays
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }
  
  // Format objects
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  
  return value;
};

// Update the edit form data
const editFormData = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  address: '',
  lrn: null,
  gradeLevel: null,
  section: '',
  department: '',
  domain: '',
  role: '',
  createdAt: ''
});

// Update user function
const handleUpdateUser = async () => {
  try {
    const updateData = { 
      ...editFormData.value,
      firstName: editFormData.value.firstName.toUpperCase(),
      lastName: editFormData.value.lastName.toUpperCase(),
      address: editFormData.value.address ? editFormData.value.address.toUpperCase() : '',
    };

    // Handle role-specific fields
    if (updateData.role === 'student') {
      updateData.section = updateData.section ? updateData.section.toUpperCase() : '';
    }
    
    if (updateData.role === 'teacher') {
      updateData.department = updateData.department ? updateData.department.toUpperCase() : '';
      updateData.domain = updateData.domain ? updateData.domain.toUpperCase() : '';
    }

    if (!updateData.password) {
      delete updateData.password;
    }

    await updateUser(editFormData.value.id, updateData);
    
    Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'User updated successfully'
    });
    
    await loadAllUsers(); // Refresh the users list
    showEditModal.value = false;
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

// Show edit modal
const showEditModal = ref(false);

// Update openEditModal to use the service
const openEditModal = async (user) => {
  try {
    const userDetails = await getUserDetails(user.id);
    editFormData.value = {
      id: userDetails.id,
      firstName: userDetails.firstName,
      lastName: userDetails.lastName,
      email: userDetails.email,
      address: userDetails.address || '',
      role: userDetails.role,
      password: '',
      createdAt: userDetails.createdAt,
      lrn: userDetails.lrn || null,
      gradeLevel: userDetails.gradeLevel || null,
      section: userDetails.section || '',
      department: userDetails.department || '',
      domain: userDetails.domain || ''
    };

    // Load grade sections if editing a student
    if (userDetails.role === 'student') {
      await loadGradeSections();
    }

    showEditModal.value = true;
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

// Add date formatting function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

const handleDeleteUser = async (userId) => {
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
      await deleteUser(userId);
      await loadAllUsers(); // Refresh the users list
      Swal.fire(
        'Deleted!',
        'User has been deleted.',
        'success'
      );
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message
    });
  }
};

// Add this function to load sections
const loadSections = async () => {
  try {
    const response = await getAllGradeSections();
    // Extract unique section names from grade sections
    availableSections.value = [...new Set(response.gradeSections.map(gs => gs.section))];
  } catch (error) {
    console.error('Error loading sections:', error);
  }
};
</script>

<style scoped>
.manage-users {
  padding: 2rem;
  max-width: auto;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.add-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  color: white;
}

.add-btn.student { background-color: #4CAF50; }
.add-btn.teacher { background-color: #2196F3; }
.add-btn.admin { background-color: #9C27B0; }
.add-btn.grade-section { background-color: #9C27B0; }

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
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

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: #f5f5f5;
  color: #666;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #2196F3;
  color: white;
}

.filter-group {
  display: flex;
  gap: 1rem;
}

.filter-group select {
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  min-width: 150px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #333;
  transition: all 0.3s ease;
}

.filter-group select:hover {
  border-color: #2196F3;
}

.filter-group select:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 3px rgba(33,150,243,0.1);
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #666;
}

.user-info {
  flex: 1;
}

.user-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.email {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.details {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #666;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.edit {
  background: #e3f2fd;
  color: #2196F3;
}

.action-btn.delete {
  background: #ffebee;
  color: #f44336;
}

.action-btn:hover {
  transform: scale(1.1);
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
  max-width: 600px;
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

.registration-form {
  padding: 1.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  flex: 1;
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-group select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.cancel-btn,
.save-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.save-btn {
  background: #4CAF50;
  color: white;
}

.save-btn:hover {
  background: #43A047;
}

.save-btn:disabled {
  background: #a5d6a7;
  cursor: not-allowed;
}

/* Form error states */
.form-group.error input,
.form-group.error select {
  border-color: #F44336;
}

.form-group.error input:focus,
.form-group.error select:focus {
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
}

.error-message {
  color: #F44336;
  font-size: 0.8rem;
  margin-top: 0.25rem;
}

/* Form animations */
.form-transition-enter-active,
.form-transition-leave-active {
  transition: all 0.3s ease;
}

.form-transition-enter-from,
.form-transition-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive form styles */
@media (max-width: 768px) {
  .form-group {
    margin-bottom: 1rem;
  }

  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
  }

  .cancel-btn,
  .save-btn {
    width: 100%;
    justify-content: center;
  }
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state .material-icons {
  font-size: 48px;
  margin-bottom: 1rem;
  color: #ccc;
}

/* Responsive Design */
@media (max-width: 768px) {
  .manage-users {
    padding: 1rem;
  }
  
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .users-grid {
    grid-template-columns: 1fr;
  }
}

/* Update icon-related styles */
.material-icons {
  font-size: 20px;
  line-height: 1;
}

.detail-item .material-icons {
  font-size: 16px;
  margin-right: 4px;
}

.action-btn .material-icons {
  font-size: 18px;
}

/* Add these styles */
.generated-input {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.generated-input:focus {
  outline: none;
  border-color: #e0e0e0;
}

/* Grade Section Management Styles */
.grade-sections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.grade-section-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.grade-section-card:hover {
  transform: translateY(-2px);
}

.grade-section-header {
  margin-bottom: 1rem;
}

.grade-section-header h3 {
  font-size: 1.1rem;
  color: #333;
}

.grade-section-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.add-btn.grade-section {
  background: #9C27B0;
}

.add-btn.grade-section:hover {
  background: #7B1FA2;
}

/* Add tab styling for sections */
.tab-btn[data-tab="sections"] {
  background: #9C27B0;
}

.tab-btn[data-tab="sections"]:hover {
  background: #7B1FA2;
}

/* Add view button styling */
.action-btn.view {
  color: #2196F3;
}

.action-btn.view:hover {
  background: rgba(33, 150, 243, 0.1);
}

/* Add user details modal styling */
.user-details {
  padding: 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: 400;
}

/* Add view controls styling */
.view-controls {
  display: flex;
  gap: 0.5rem;
  margin: 1rem 0;
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-toggle-btn:hover {
  background: #f5f5f5;
}

.view-toggle-btn.active {
  background: #2196F3;
  color: white;
  border-color: #2196F3;
}

/* Add table styling */
.users-table {
  width: 100%;
  overflow-x: auto;
  margin-top: 1rem;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background: #f5f5f5;
  font-weight: 500;
}

.users-table tr:hover {
  background: #fafafa;
}

/* Responsive table */
@media (max-width: 768px) {
  .users-table {
    display: block;
  }
  
  .users-table table {
    min-width: 600px;
  }
}

/* Add this to your existing styles */
.uppercase-input {
  text-transform: uppercase;
}

.uppercase-input::placeholder {
  text-transform: none; /* Keep placeholders in normal case */
}
</style> 