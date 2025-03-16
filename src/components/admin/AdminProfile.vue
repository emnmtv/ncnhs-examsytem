<template>
  <div class="profile-page">
    <div class="header-container">
      <div class="header-content">
        <h1>Admin Profile<span class="material-icons">admin_panel_settings</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">View and manage your administrator information</p>
        </div>
      </div>
      <div class="header-background">PROFILE</div>
    </div>
    
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
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
            <div 
              class="password-header" 
              @click="showPasswordFields = !showPasswordFields"
            >
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
                <div class="input-wrapper">
                  <span class="material-icons-round">vpn_key</span>
                  <input 
                    v-model="passwordData.password" 
                    :type="showPassword ? 'text' : 'password'" 
                    placeholder="Enter new password"
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
                <div class="input-wrapper">
                  <span class="material-icons-round">vpn_key</span>
                  <input 
                    v-model="passwordData.confirmPassword" 
                    :type="showConfirmPassword ? 'text' : 'password'" 
                    placeholder="Confirm new password"
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
  department: '',
  role: 'admin',
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
      confirmButtonColor: '#4CAF50'
    });
  } finally {
    loading.value = false;
  }
};

const toggleEditMode = () => {
  if (isEditing.value) {
    // Reset form if canceling edit
    loadProfile();
    passwordData.value = {
      password: '',
      confirmPassword: ''
    };
    showPasswordFields.value = false;
  }
  isEditing.value = !isEditing.value;
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
    }
    
    // Prepare update data
    const updateData = {
      firstName: profile.value.firstName,
      lastName: profile.value.lastName,
      email: profile.value.email,
      address: profile.value.address,
      department: profile.value.department
    };
    
    // Add password if it's being changed
    if (showPasswordFields.value && passwordData.value.password) {
      updateData.password = passwordData.value.password;
    }
    
    // Call API to update profile
    await updateProfile(updateData);
    
    // Show success message
    Swal.fire({
      icon: 'success',
      title: 'Profile Updated',
      text: 'Your profile has been updated successfully.',
      confirmButtonColor: '#4CAF50'
    });
    
    // Exit edit mode
    isEditing.value = false;
    
    // Reload profile data
    await loadProfile();
    
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      text: err.message || 'Failed to update profile.',
      confirmButtonColor: '#F44336'
    });
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

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.edit-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
  font-size: 1.5rem;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #e8f5e9;
  color: #2e7d32;
}

.edit-btn:hover {
  background: #c8e6c9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.edit-btn.cancel {
  background: #ffebee;
  color: #c62828;
}

.edit-btn.cancel:hover {
  background: #ffcdd2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 0 1rem;
  transition: all 0.3s;
  position: relative;
}

.input-wrapper .material-icons-round {
  color: #9e9e9e;
}

.input-wrapper input {
  flex: 1;
  padding: 1rem 0;
  border: none;
  outline: none;
  font-size: 1rem;
  background: transparent;
  color: #333;
}

.input-wrapper input:read-only {
  cursor: default;
  color: #757575;
}

.input-wrapper input.editable {
  color: #333;
}

.input-wrapper input.editable:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76,175,80,0.1);
  outline: none;
}

.toggle-password-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #9e9e9e;
  transition: color 0.3s;
}

.toggle-password-btn:hover {
  color: #4CAF50;
}

.password-section {
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
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover {
  background: #43A047;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.rotating {
  animation: rotate 2s linear infinite;
  font-size: 3rem;
  color: #159750;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .profile-page {
    padding: 10px;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-background {
    font-size: 4rem;
    top: 30%;
    right: 0.3rem;
  }
  
  .divider {
    margin: 0.5rem 0;
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