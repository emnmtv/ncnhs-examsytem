<script setup>
import { ref, onMounted } from 'vue';
import { fetchUserProfile, updateProfile } from '@/services/authService';
import Swal from 'sweetalert2';

const profile = ref({
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  lrn: null,
  gradeLevel: null,
  section: '',
  role: '',
  createdAt: ''
});

const loading = ref(true);
const isEditing = ref(false);

onMounted(async () => {
  await loadProfile();
});

const loadProfile = async () => {
  try {
    loading.value = true;
    const data = await fetchUserProfile();
    profile.value = data;
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Failed to Load Profile',
      text: 'There was an error loading your profile data.',
      confirmButtonColor: '#4CAF50'
    });
  } finally {
    loading.value = false;
  }
};

const handleUpdate = async () => {
  try {
    // Show loading state
    Swal.fire({
      title: 'Updating Profile',
      text: 'Please wait...',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });
    
    await updateProfile(profile.value);
    
    // Show success message
    await Swal.fire({
      icon: 'success',
      title: 'Profile Updated!',
      text: 'Your profile has been updated successfully.',
      confirmButtonColor: '#4CAF50'
    });
    
    isEditing.value = false;
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      text: err.message || 'Failed to update profile',
      confirmButtonColor: '#4CAF50'
    });
  }
};

const toggleEditMode = () => {
  if (isEditing.value) {
    // Confirm before canceling edit
    Swal.fire({
      title: 'Cancel Editing?',
      text: 'Any unsaved changes will be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4CAF50',
      cancelButtonColor: '#f44336',
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'Continue editing'
    }).then((result) => {
      if (result.isConfirmed) {
        isEditing.value = false;
        loadProfile(); // Reload original data
      }
    });
  } else {
    isEditing.value = true;
  }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<template>
  <div class="profile-page">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading your profile...</p>
    </div>
    
    <div v-else class="profile-container" :class="{ 'editing': isEditing }">
      <div class="profile-header">
        <div class="avatar">
          {{ profile.firstName?.[0]?.toUpperCase() }}{{ profile.lastName?.[0]?.toUpperCase() }}
        </div>
        <h2>{{ profile.firstName }} {{ profile.lastName }}</h2>
        <span class="role-badge">{{ profile.role }}</span>
      </div>

      <div class="profile-content">
        <div class="profile-section">
          <h3><i class="fas fa-user"></i> Personal Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>First Name</label>
              <input v-if="isEditing" v-model="profile.firstName" type="text" />
              <span v-else>{{ profile.firstName }}</span>
            </div>
            <div class="info-item">
              <label>Last Name</label>
              <input v-if="isEditing" v-model="profile.lastName" type="text" />
              <span v-else>{{ profile.lastName }}</span>
            </div>
            <div class="info-item">
              <label>Email</label>
              <input v-if="isEditing" v-model="profile.email" type="email" />
              <span v-else>{{ profile.email }}</span>
            </div>
            <div class="info-item">
              <label>Address</label>
              <input v-if="isEditing" v-model="profile.address" type="text" />
              <span v-else>{{ profile.address || 'Not set' }}</span>
            </div>
          </div>
        </div>

        <div class="profile-section">
          <h3><i class="fas fa-graduation-cap"></i> Academic Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>LRN</label>
              <input v-if="isEditing" v-model="profile.lrn" type="text" />
              <span v-else>{{ profile.lrn || 'Not set' }}</span>
            </div>
            <div class="info-item">
              <label>Grade Level</label>
              <input v-if="isEditing" v-model.number="profile.gradeLevel" type="number" />
              <span v-else>{{ profile.gradeLevel || 'Not set' }}</span>
            </div>
            <div class="info-item">
              <label>Section</label>
              <input v-if="isEditing" v-model="profile.section" type="text" />
              <span v-else>{{ profile.section || 'Not set' }}</span>
            </div>
          </div>
        </div>

        <div class="profile-section">
          <h3><i class="fas fa-clock"></i> Account Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Member Since</label>
              <span>{{ formatDate(profile.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="profile-actions">
        <button 
          @click="toggleEditMode" 
          :class="['action-button', isEditing ? 'cancel' : 'edit']"
        >
          <i :class="['fas', isEditing ? 'fa-times' : 'fa-edit']"></i>
          {{ isEditing ? 'Cancel' : 'Edit Profile' }}
        </button>
        <button 
          v-if="isEditing" 
          @click="handleUpdate" 
          class="action-button save"
        >
          <i class="fas fa-save"></i>
          Save Changes
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #f3f3f3;
  border-radius: 50%;
  border-top: 3px solid #4CAF50;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.profile-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

.profile-container.editing {
  box-shadow: 0 6px 30px rgba(76,175,80,0.15);
}

.profile-header {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  padding: 2rem;
  text-align: center;
  color: white;
}

.avatar {
  width: 100px;
  height: 100px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 2rem;
  font-weight: bold;
  color: #4CAF50;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.role-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: rgba(255,255,255,0.2);
  border-radius: 20px;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.profile-content {
  padding: 2rem;
}

.profile-section {
  margin-bottom: 2rem;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.profile-section h3 {
  color: #333;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item label {
  color: #666;
  font-size: 0.9rem;
}

.info-item span {
  color: #333;
  font-size: 1rem;
}

.info-item input {
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.info-item input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76,175,80,0.1);
  outline: none;
}

.profile-actions {
  padding: 1.5rem 2rem;
  background: #f9f9f9;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.action-button.edit {
  background: #4CAF50;
  color: white;
}

.action-button.edit:hover {
  background: #45a049;
  transform: translateY(-2px);
}

.action-button.cancel {
  background: #f44336;
  color: white;
}

.action-button.cancel:hover {
  background: #e53935;
  transform: translateY(-2px);
}

.action-button.save {
  background: #2196F3;
  color: white;
}

.action-button.save:hover {
  background: #1976D2;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .profile-page {
    padding: 1rem;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .profile-actions {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
