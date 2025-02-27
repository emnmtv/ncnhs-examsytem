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
      </div>
    </div>

    <div class="filters-section">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search users..."
        />
      </div>

      <div class="tabs">
        <button 
          v-for="tab in ['students', 'teachers', 'admins']"
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

    <!-- Users List -->
    <div class="users-list" v-if="!loading">
      <div v-if="filteredUsers.length === 0" class="empty-state">
        <span class="material-icons">group_off</span>
        <p>No users found</p>
      </div>

      <div v-else class="users-grid">
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
            <button class="action-btn edit">
              <span class="material-icons">edit</span>
            </button>
            <button class="action-btn delete">
              <span class="material-icons">delete</span>
            </button>
          </div>
        </div>
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
              <input v-model="formData.firstName" type="text" required />
            </div>
            <div class="form-group">
              <label>Last Name</label>
              <input 
                v-model="formData.lastName" 
                type="text" 
                required 
                @input="updateCredentials"
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
            <input v-model="formData.address" type="text" />
          </div>

          <!-- Student-specific fields -->
          <template v-if="modalType === 'student'">
            <div class="form-row">
              <div class="form-group">
                <label>LRN</label>
                <input v-model.number="formData.lrn" type="number" />
              </div>
              <div class="form-group">
                <label>Grade Level</label>
                <select v-model.number="formData.gradeLevel" required>
                  <option value="">Select Grade</option>
                  <option v-for="grade in [7, 8, 9, 10]" :key="grade" :value="grade">
                    Grade {{ grade }}
                  </option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Section</label>
              <input v-model="formData.section" type="text" />
            </div>
          </template>

          <!-- Teacher-specific fields -->
          <template v-if="modalType === 'teacher'">
            <div class="form-row">
              <div class="form-group">
                <label>Department</label>
                <input v-model="formData.department" type="text" />
              </div>
              <div class="form-group">
                <label>Domain</label>
                <input v-model="formData.domain" type="text" />
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { 
  registerStudent, 
  registerTeacher, 
  registerAdmin,
  fetchStudents,
  fetchTeachers,
  fetchAdmins 
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
const formData = ref({});

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

// Initial data loading
onMounted(async () => {
  await loadAllUsers();
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

const generateCredentials = (lastName) => {
  if (!lastName) return { email: '', password: '' };
  
  const sanitizedLastName = lastName.toLowerCase().trim().replace(/\s+/g, '');
  return {
    email: `${sanitizedLastName}@ncnhs.edu.ph`,
    password: `${sanitizedLastName}2025`
  };
};

// Update the form data when lastName changes
const updateCredentials = () => {
  if (formData.value.lastName) {
    const { email, password } = generateCredentials(formData.value.lastName);
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
        gradeLevel: null,
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
    // Update credentials one final time before submission
    updateCredentials();
    
    if (!formData.value.lastName) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Last name is required to generate credentials'
      });
      return;
    }

    Swal.fire({
      title: 'Creating User',
      text: 'Please wait...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    switch (modalType.value) {
      case 'student':
        await registerStudent(formData.value);
        break;
      case 'teacher':
        await registerTeacher(formData.value);
        break;
      case 'admin':
        await registerAdmin(formData.value);
        break;
    }

    await loadAllUsers();
    showModal.value = false;

    // Show success message with credentials
    Swal.fire({
      icon: 'success',
      title: 'User Created Successfully!',
      html: `
        <div style="text-align: left; margin-top: 1rem;">
          <p><strong>Email:</strong> ${formData.value.email}</p>
          <p><strong>Password:</strong> ${formData.value.password}</p>
        </div>
      `,
      confirmButtonText: 'Copy & Close',
      showCancelButton: true,
      cancelButtonText: 'Just Close',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Copy credentials to clipboard
        const credentials = `Email: ${formData.value.email}\nPassword: ${formData.value.password}`;
        navigator.clipboard.writeText(credentials);
        
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });

        Toast.fire({
          icon: 'success',
          title: 'Credentials copied to clipboard!'
        });
      }
    });
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Registration Failed',
      text: err.message
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
</script>

<style scoped>
.manage-users {
  padding: 2rem;
  max-width: 1200px;
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn,
.submit-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.submit-btn {
  background: #4CAF50;
  color: white;
}

.submit-btn:hover {
  background: #43A047;
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
</style> 