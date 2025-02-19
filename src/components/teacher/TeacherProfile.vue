<template>
  <div class="teacher-profile">
    <div v-if="loading" class="loading">Loading profile...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="profile-container">
      <h2>Teacher Profile</h2>
      <div class="profile-details">
        <div class="profile-section">
          <h3>Personal Information</h3>
          <div class="info-group">
            <label>Name:</label>
            <span>{{ profile.firstName }} {{ profile.lastName }}</span>
          </div>
          <div class="info-group">
            <label>Email:</label>
            <span>{{ profile.email }}</span>
          </div>
          <div class="info-group">
            <label>Address:</label>
            <span>{{ profile.address || 'Not set' }}</span>
          </div>
          <div class="info-group">
            <label>Domain:</label>
            <span>{{ profile.domain || 'Not set' }}</span>
          </div>
          <div class="info-group">
            <label>Department:</label>
            <span>{{ profile.department || 'Not set' }}</span>
          </div>
        </div>

        <div class="profile-section">
          <h3>Account Information</h3>
          <div class="info-group">
            <label>Role:</label>
            <span>{{ profile.role }}</span>
          </div>
          <div class="info-group">
            <label>Member Since:</label>
            <span>{{ formatDate(profile.createdAt) }}</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="toggleEditMode" class="edit-button">
          {{ isEditing ? 'Cancel' : 'Edit Profile' }}
        </button>
        <button v-if="isEditing" @click="handleUpdate" class="save-button">Save Changes</button>
      </div>

      <!-- Edit Form -->
      <div v-if="isEditing" class="edit-form">
        <div class="form-group">
          <label>First Name:</label>
          <input v-model="profile.firstName" type="text" />
        </div>
        <div class="form-group">
          <label>Last Name:</label>
          <input v-model="profile.lastName" type="text" />
        </div>
        <div class="form-group">
          <label>Email:</label>
          <input v-model="profile.email" type="email" />
        </div>
        <div class="form-group">
          <label>Address:</label>
          <input v-model="profile.address" type="text" />
        </div>
        <div class="form-group">
          <label>Domain:</label>
          <input v-model="profile.domain" type="text" />
        </div>
        <div class="form-group">
          <label>Department:</label>
          <input v-model="profile.department" type="text" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { fetchUserProfile, updateProfile } from '../../services/authService';

const profile = ref({
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  domain: '',
  department: ''
});

const isEditing = ref(false);
const error = ref('');
const message = ref('');
const loading = ref(true);

onMounted(async () => {
  try {
    const data = await fetchUserProfile();
    profile.value = data;
  } catch (err) {
    error.value = 'Failed to load profile';
    console.error('Profile loading error:', err);
  } finally {
    loading.value = false;
  }
});

const handleUpdate = async () => {
  try {
    error.value = '';
    message.value = '';
    
    console.log('Updating profile with:', profile.value);
    await updateProfile(profile.value);
    
    message.value = 'Profile updated successfully';
    isEditing.value = false;
  } catch (err) {
    error.value = err.message || 'Failed to update profile';
    console.error('Profile update error:', err);
  }
};

const toggleEditMode = () => {
  isEditing.value = !isEditing.value;
};
  
// Format date function
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};
</script>

<style scoped>
.teacher-profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
}

.error {
  color: red;
}

.profile-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.profile-section {
  margin-bottom: 20px;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.info-group {
  margin: 10px 0;
  display: flex;
  gap: 10px;
}

.info-group label {
  font-weight: bold;
  min-width: 120px;
}

.actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
}

.edit-button {
  background: #4CAF50;
  color: white;
}

.save-button {
  background: #2196F3;
  color: white;
}

.edit-form {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.form-group {
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

input:focus {
  outline: none;
  border-color: #2196F3;
}

input[type="email"]:invalid {
  border-color: #f44336;
}
</style>
