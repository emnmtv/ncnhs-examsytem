<template>
  <div class="profile-page">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your profile...</p>
    </div>
    
    <div v-else class="profile-content">
      <!-- Profile Card -->
      <ProfileCard :profile="profile" />
      
      <!-- Edit Profile Form -->
      <div class="edit-section" :class="{ 'editing': isEditing }">
        <div class="section-header">
          <h2>
            <span class="material-icons-round">person</span>
            Profile Information
          </h2>
          <button 
            @click="toggleEditMode" 
            :class="['edit-btn', isEditing ? 'cancel' : '']"
          >
            <span class="material-icons-round">{{ isEditing ? 'close' : 'edit' }}</span>
            {{ isEditing ? 'Cancel' : 'Edit Profile' }}
          </button>
        </div>

        <form @submit.prevent="handleUpdate" class="profile-form">
          <div class="form-grid">
            <div class="form-group">
              <label>First Name</label>
              <div class="input-wrapper">
                <span class="material-icons-round">badge</span>
                <input 
                  v-model="profile.firstName" 
                  type="text" 
                  :readonly="!isEditing"
                  :class="{ 'editable': isEditing }"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Last Name</label>
              <div class="input-wrapper">
                <span class="material-icons-round">badge</span>
                <input 
                  v-model="profile.lastName" 
                  type="text" 
                  :readonly="!isEditing"
                  :class="{ 'editable': isEditing }"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Email</label>
              <div class="input-wrapper">
                <span class="material-icons-round">email</span>
                <input 
                  v-model="profile.email" 
                  type="email" 
                  :readonly="!isEditing"
                  :class="{ 'editable': isEditing }"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Department</label>
              <div class="input-wrapper">
                <span class="material-icons-round">business</span>
                <input 
                  v-model="profile.department" 
                  type="text" 
                  :readonly="!isEditing"
                  :class="{ 'editable': isEditing }"
                  placeholder="Enter your department"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Domain</label>
              <div class="input-wrapper">
                <span class="material-icons-round">school</span>
                <input 
                  v-model="profile.domain" 
                  type="text" 
                  :readonly="!isEditing"
                  :class="{ 'editable': isEditing }"
                  placeholder="Enter your teaching domain"
                />
              </div>
            </div>

            <div class="form-group full-width">
              <label>Address</label>
              <div class="input-wrapper">
                <span class="material-icons-round">home</span>
                <input 
                  v-model="profile.address" 
                  type="text" 
                  :readonly="!isEditing"
                  :class="{ 'editable': isEditing }"
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </div>

          <!-- Password Change Section -->
          <div v-if="isEditing" class="password-section">
            <div class="password-header" @click="togglePasswordFields">
              <h3>
                <span class="material-icons-round">lock</span>
                Change Password
              </h3>
              <span class="material-icons-round toggle-icon">
                {{ showPasswordFields ? 'expand_less' : 'expand_more' }}
              </span>
            </div>
            
            <div v-if="showPasswordFields" class="password-fields">
              <div class="form-group">
                <label>New Password</label>
                <div class="input-wrapper password-input">
                  <span class="material-icons-round">lock</span>
                  <input 
                    v-model="passwordData.password" 
                    :type="showPassword ? 'text' : 'password'" 
                    placeholder="Enter new password"
                    class="editable"
                  />
                  <button 
                    type="button" 
                    class="toggle-password-btn" 
                    @click="togglePasswordVisibility('password')"
                  >
                    <span class="material-icons-round">
                      {{ showPassword ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
                <p class="password-hint">Password must be at least 8 characters long</p>
              </div>
              
              <div class="form-group">
                <label>Confirm Password</label>
                <div class="input-wrapper password-input">
                  <span class="material-icons-round">lock_clock</span>
                  <input 
                    v-model="passwordData.confirmPassword" 
                    :type="showConfirmPassword ? 'text' : 'password'" 
                    placeholder="Confirm new password"
                    class="editable"
                  />
                  <button 
                    type="button" 
                    class="toggle-password-btn" 
                    @click="togglePasswordVisibility('confirmPassword')"
                  >
                    <span class="material-icons-round">
                      {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="isEditing" class="form-actions">
            <button type="submit" class="save-btn">
              <span class="material-icons-round">save</span>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { fetchUserProfile, updateProfile } from '@/services/authService';
import ProfileCard from '../shared/ProfileCard.vue';
import Swal from 'sweetalert2';

const profile = ref({
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  domain: '',
  department: '',
  role: '',
  createdAt: ''
});

// Add password fields
const passwordData = ref({
  password: '',
  confirmPassword: ''
});

// Add show password toggles
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const loading = ref(true);
const isEditing = ref(false);
const showPasswordFields = ref(false);

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
      confirmButtonColor: '#2196F3'
    });
  } finally {
    loading.value = false;
  }
};

const handleUpdate = async () => {
  try {
    // Validate password if user is changing it
    if (showPasswordFields.value) {
      if (!passwordData.value.password) {
        throw new Error('Please enter a new password');
      }
      
      if (passwordData.value.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      
      if (passwordData.value.password !== passwordData.value.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      
      // Add password to profile data for update
      profile.value.password = passwordData.value.password;
    }
    
    // Show loading state
    const loadingAlert = Swal.fire({
      title: 'Updating Profile',
      html: 'Please wait while we update your profile...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
      showConfirmButton: false
    });
    
    await updateProfile(profile.value);
    
    // Close loading alert
    loadingAlert.close();
    
    // Reset password fields
    passwordData.value.password = '';
    passwordData.value.confirmPassword = '';
    showPasswordFields.value = false;
    showPassword.value = false;
    showConfirmPassword.value = false;
    
    // Show success message
    Swal.fire({
      icon: 'success',
      title: 'Profile Updated!',
      text: 'Your profile has been updated successfully.',
      confirmButtonColor: '#2196F3',
      timer: 2000,
      timerProgressBar: true
    });
    
    isEditing.value = false;
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      text: err.message || 'Failed to update profile',
      confirmButtonColor: '#2196F3'
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
      confirmButtonColor: '#2196F3',
      cancelButtonColor: '#f44336',
      confirmButtonText: 'Yes, cancel',
      cancelButtonText: 'Continue editing'
    }).then((result) => {
      if (result.isConfirmed) {
        isEditing.value = false;
        showPasswordFields.value = false;
        passwordData.value.password = '';
        passwordData.value.confirmPassword = '';
        showPassword.value = false;
        showConfirmPassword.value = false;
        loadProfile(); // Reload original data
      }
    });
  } else {
    isEditing.value = true;
  }
};

const togglePasswordFields = () => {
  showPasswordFields.value = !showPasswordFields.value;
  if (!showPasswordFields.value) {
    passwordData.value.password = '';
    passwordData.value.confirmPassword = '';
    showPassword.value = false;
    showConfirmPassword.value = false;
  }
};

// Toggle password visibility
const togglePasswordVisibility = (field) => {
  if (field === 'password') {
    showPassword.value = !showPassword.value;
  } else if (field === 'confirmPassword') {
    showConfirmPassword.value = !showConfirmPassword.value;
  }
};
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.edit-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  padding: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.section-header h2 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  color: #333;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #e3f2fd;
  color: #1976d2;
}

.edit-btn:hover {
  background: #bbdefb;
}

.edit-btn.cancel {
  background: #ffebee;
  color: #c62828;
}

.edit-btn.cancel:hover {
  background: #ffcdd2;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper .material-icons-round {
  position: absolute;
  left: 1rem;
  color: #666;
}

.input-wrapper input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.input-wrapper.password-input input {
  padding-right: 3rem; /* Make room for the toggle button */
}

.toggle-password-btn {
  position: absolute;
  right: 0.75rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
}

.toggle-password-btn:hover {
  color: #2196f3;
}

.input-wrapper input.editable {
  background: white;
  cursor: text;
}

.input-wrapper input:not(.editable) {
  cursor: default;
}

.input-wrapper input.editable:focus {
  border-color: #2196f3;
  box-shadow: 0 0 0 3px rgba(33,150,243,0.1);
  outline: none;
}

/* Password section styles */
.password-section {
  margin-top: 2rem;
  border-top: 1px solid #e0e0e0;
  padding-top: 1.5rem;
}

.password-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.password-header:hover {
  background-color: #f5f5f5;
}

.password-header h3 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.toggle-icon {
  color: #666;
}

.password-fields {
  margin-top: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.password-hint {
  font-size: 0.8rem;
  color: #666;
  margin: 0.25rem 0 0 0;
}

.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover {
  background: #43a047;
  transform: translateY(-2px);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .profile-page {
    padding: 1rem;
  }

  .edit-section {
    padding: 1.5rem;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .edit-btn {
    width: 100%;
    justify-content: center;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .password-fields {
    grid-template-columns: 1fr;
  }

  .save-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
