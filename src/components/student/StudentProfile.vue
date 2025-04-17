<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { fetchUserProfile, updateProfile, getAvailableSections, getFullImageUrl ,deleteProfilePicture} from '@/services/authService';
import ProfileCard from '../shared/ProfileCard.vue';
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
  createdAt: '',
  profilePicture: null
});

// Add profile picture data
const imageFile = ref(null);
const imagePreview = ref(null);

// Computed property for profile image URL
const profileImageUrl = computed(() => {
  if (imagePreview.value) {
    return imagePreview.value;
  } else if (profile.value.profilePicture) {
    return getFullImageUrl(profile.value.profilePicture);
  }
  return null;
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
const availableSections = ref([]);
const showPasswordFields = ref(false);

onMounted(async () => {
  await loadProfile();
});

const loadProfile = async () => {
  try {
    loading.value = true;
    const data = await fetchUserProfile();
    profile.value = data;
    // Reset image preview when loading new profile data
    imagePreview.value = null;
    imageFile.value = null;
    if (data.gradeLevel) {
      const response = await getAvailableSections(data.gradeLevel);
      availableSections.value = response.sections;
    }
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

// Handle image selection
const handleImageChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({
      icon: 'error',
      title: 'File Too Large',
      text: 'Profile picture must be less than 5MB',
      confirmButtonColor: '#4CAF50'
    });
    event.target.value = null;
    return;
  }
  
  // Store the file for upload
  imageFile.value = file;
  
  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
};

// Remove profile picture
const removeProfilePicture = async () => {
  try {
    await deleteProfilePicture();
    imageFile.value = null;
    imagePreview.value = null;
    profile.value.profilePicture = null;
    Swal.fire({
      icon: 'success',
      title: 'Profile Picture Removed',
      text: 'Your profile picture has been removed successfully.',
      confirmButtonColor: '#2196F3'
    });
  } catch (err) {
    Swal.fire({
      icon: 'error',
      title: 'Failed to Remove Profile Picture',
      text: err.message || 'Failed to remove profile picture',
      confirmButtonColor: '#2196F3'
    });
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
    
    // Prepare form data if there's an image to upload
    let updatedProfile = { ...profile.value };
    
    if (imageFile.value) {
      // If uploading a new image, convert it to base64 for API
      const reader = new FileReader();
      const imagePromise = new Promise((resolve) => {
        reader.onload = () => {
          updatedProfile.profilePicture = reader.result;
          resolve();
        };
      });
      reader.readAsDataURL(imageFile.value);
      await imagePromise;
    }
    
    await updateProfile(updatedProfile);
    
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
      confirmButtonColor: '#4CAF50',
      timer: 2000,
      timerProgressBar: true
    });
    
    isEditing.value = false;
    
    // Reload profile to get updated data from server
    await loadProfile();
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
        showPasswordFields.value = false;
        passwordData.value.password = '';
        passwordData.value.confirmPassword = '';
        showPassword.value = false;
        showConfirmPassword.value = false;
        
        // Reset image preview and file
        imagePreview.value = null;
        imageFile.value = null;
        
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

// Load available sections when grade level changes
watch(() => profile.value.gradeLevel, async (newGrade) => {
  if (newGrade) {
    try {
      const response = await getAvailableSections(newGrade);
      availableSections.value = response.sections;
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  } else {
    availableSections.value = [];
  }
});
</script>

<template>
  <div class="profile-page">
    <div class="header-container">
      <div class="header-content">
        <h1>My Profile<span class="material-icons">person</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">View and manage your personal information</p>
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
          <!-- Profile Picture Section -->
          <div v-if="isEditing" class="profile-picture-section">
            <div class="picture-container">
              <div class="profile-img-wrapper">
                <img v-if="profileImageUrl" :src="profileImageUrl" alt="Profile picture" class="profile-img" />
                <div v-else class="profile-img-placeholder">
                  <span class="material-icons-round">account_circle</span>
                </div>
              </div>
              <div class="picture-actions">
                <label for="profile-picture-upload" class="upload-btn">
                  <span class="material-icons-round">add_a_photo</span>
                  Upload Photo
                </label>
                <input 
                  type="file" 
                  id="profile-picture-upload" 
                  @change="handleImageChange" 
                  accept="image/*" 
                  class="file-input"
                />
                <button v-if="profileImageUrl" type="button" class="remove-btn" @click="removeProfilePicture">
                  <span class="material-icons-round">delete</span>
                  Remove
                </button>
              </div>
            </div>
            <p class="picture-hint">Upload a square image for best results. Max size: 5MB.</p>
          </div>
          
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
              <label>LRN</label>
              <div class="input-wrapper">
                <span class="material-icons-round">badge</span>
                <input 
                  v-model="profile.lrn" 
                  type="number" 
                  readonly
                  placeholder="LRN cannot be changed"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Grade Level</label>
              <div class="input-wrapper">
                <span class="material-icons-round">school</span>
                <select 
                  v-model="profile.gradeLevel" 
                  :disabled="!isEditing"
                  :class="{ 'editable': isEditing }"
                >
                  <option value="">Select Grade</option>
                  <option v-for="grade in [7, 8, 9, 10, 11, 12]" :key="grade" :value="grade">
                    Grade {{ grade }}
                  </option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Section</label>
              <div class="input-wrapper">
                <span class="material-icons-round">groups</span>
                <select 
                  v-model="profile.section" 
                  :disabled="!isEditing"
                  :class="{ 'editable': isEditing }"
                >
                  <option value="">Select Section</option>
                  <option v-for="section in availableSections" :key="section.id" :value="section.section">
                    {{ section.section }}
                  </option>
                </select>
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
  color: #4CAF50;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
}

.header-content h1 .material-icons {
  color: #4CAF50;
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

/* Profile Picture Section */
.profile-picture-section {
  margin-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 2rem;
}

.picture-container {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.profile-img-wrapper {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #e0e0e0;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
  color: #9e9e9e;
}

.profile-img-placeholder .material-icons-round {
  font-size: 4rem;
}

.picture-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.upload-btn {
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

.upload-btn:hover {
  background: #388E3C;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.remove-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #e53935;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.file-input {
  display: none;
}

.picture-hint {
  font-size: 0.8rem;
  color: #666;
  margin: 0.5rem 0 0 0;
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

.input-wrapper input, .input-wrapper select {
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
  color: #4CAF50;
}

.input-wrapper input.editable, .input-wrapper select.editable {
  background: white;
  cursor: text;
}

.input-wrapper select.editable {
  cursor: pointer;
}

.input-wrapper input:not(.editable), .input-wrapper select:not(.editable) {
  cursor: default;
}

.input-wrapper input.editable:focus, .input-wrapper select.editable:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76,175,80,0.1);
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
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover {
  background: #388E3C;
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
  color: #4CAF50;
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
  
  /* Profile picture responsive styles */
  .picture-container {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }
  
  .profile-img-wrapper {
    width: 120px;
    height: 120px;
  }
  
  .picture-actions {
    width: 100%;
  }
}
</style>
