<template>
  <div class="profile-card">
    <div class="profile-header">
      <div class="texture-layer"></div>
      <div class="avatar-container">
        <!-- Use profile picture if available, otherwise show initials -->
        <div v-if="profileImageUrl" class="avatar with-image">
          <img :src="profileImageUrl" alt="Profile picture" class="profile-image" />
        </div>
        <div v-else class="avatar" :style="{ backgroundColor: getAvatarColor() }">
          {{ getInitials() }}
        </div>
      </div>
      <div class="profile-info">
        <h2>{{ profile.firstName }} {{ profile.lastName }}</h2>
        <div class="profile-meta">
          <span class="profile-meta-item">
            <i class="fas fa-user"></i> {{ formatRole(profile.role) }}
          </span>
          <span v-if="profile.role === 'student'" class="profile-meta-item">
            <i class="fas fa-graduation-cap"></i> Grade {{ profile.gradeLevel || 'N/A' }}
          </span>
          <span v-if="profile.role === 'student'" class="profile-meta-item">
            <i class="fas fa-users"></i> {{ profile.section || 'No Section' }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="profile-body">
      <div class="detail-item">
        <span class="detail-icon"><i class="fas fa-envelope"></i></span>
        <div class="detail-content">
          <span class="detail-label">Email</span>
          <span class="detail-value">{{ profile.email }}</span>
        </div>
      </div>
      
      <div class="detail-item" v-if="profile.lrn">
        <span class="detail-icon"><i class="fas fa-id-card"></i></span>
        <div class="detail-content">
          <span class="detail-label">LRN</span>
          <span class="detail-value">{{ profile.lrn }}</span>
        </div>
      </div>
      
      <div class="detail-item" v-if="profile.address">
        <span class="detail-icon"><i class="fas fa-home"></i></span>
        <div class="detail-content">
          <span class="detail-label">Address</span>
          <span class="detail-value">{{ profile.address || 'Not provided' }}</span>
        </div>
      </div>
      
      <div class="detail-item">
        <span class="detail-icon"><i class="fas fa-calendar-alt"></i></span>
        <div class="detail-content">
          <span class="detail-label">Joined</span>
          <span class="detail-value">{{ formatDate(profile.createdAt) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { getFullImageUrl } from '@/services/authService';

export default {
  name: 'ProfileCard',
  props: {
    profile: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    // Computed property for profile image URL
    const profileImageUrl = computed(() => {
      if (props.profile.profilePicture) {
        return getFullImageUrl(props.profile.profilePicture);
      }
      return null;
    });

    return {
      profileImageUrl
    };
  },
  mounted() {
    // Load FontAwesome if not already loaded
    if (!document.getElementById('fontawesome-css')) {
      const link = document.createElement('link');
      link.id = 'fontawesome-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css';
      document.head.appendChild(link);
    }
  },
  methods: {
    getInitials() {
      if (!this.profile.firstName || !this.profile.lastName) return '?';
      return `${this.profile.firstName[0]}${this.profile.lastName[0]}`;
    },
    getAvatarColor() {
      const colors = [
        '#4CAF50', '#2196F3', '#FF9800', '#E91E63', 
        '#9C27B0', '#009688', '#673AB7', '#F44336'
      ];
      
      // Simple hash function to get consistent color for a user
      const name = `${this.profile.firstName}${this.profile.lastName}`;
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      const index = Math.abs(hash) % colors.length;
      return colors[index];
    },
    formatDate(dateString) {
      if (!dateString) return 'Unknown';
      
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },
    formatRole(role) {
      if (!role) return 'User';
      
      // Capitalize first letter
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
  }
};
</script>

<style scoped>
.profile-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.profile-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.profile-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 30px 20px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Main paint swipe */
.profile-header::after {
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
.profile-header::before {
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
.profile-header .texture-layer {
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

.avatar-container {
  position: relative;
  z-index: 1;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #4CAF50;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  border: 4px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.avatar.with-image {
  padding: 0;
  overflow: hidden;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  flex: 1;
  position: relative;
  z-index: 1;
}

.profile-info h2 {
  margin: 0 0 10px 0;
  color: white;
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.profile-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  background: rgba(0, 0, 0, 0.1);
  padding: 5px 12px;
  border-radius: 20px;
}

.profile-meta-item i {
  font-size: 0.9rem;
}

.profile-body {
  padding: 20px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background-color: #e8f5e9;
  color: #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.8rem;
  color: #9e9e9e;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 1rem;
  color: #424242;
}

/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .profile-card {
    border-radius: 14px;
  }
  
  .profile-header {
    padding: 26px 18px;
    gap: 18px;
  }
  
  .avatar {
    width: 90px;
    height: 90px;
    font-size: 2.3rem;
    border: 3px solid rgba(255, 255, 255, 0.2);
  }
  
  .profile-info h2 {
    font-size: 1.6rem;
    margin-bottom: 8px;
  }
  
  .profile-meta {
    gap: 12px;
  }
  
  .profile-meta-item {
    font-size: 0.95rem;
    padding: 4px 10px;
  }
  
  .profile-meta-item i {
    font-size: 0.85rem;
  }
  
  .profile-body {
    padding: 18px;
  }
  
  .detail-item {
    padding: 13px 0;
    gap: 13px;
  }
  
  .detail-icon {
    width: 38px;
    height: 38px;
    font-size: 1.1rem;
  }
  
  .detail-label {
    font-size: 0.75rem;
    margin-bottom: 3px;
  }
  
  .detail-value {
    font-size: 0.95rem;
  }
}

/* Medium laptops and smaller screens (1366px) */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .profile-card {
    border-radius: 12px;
  }
  
  .profile-header {
    padding: 24px 16px;
    gap: 16px;
  }
  
  .avatar {
    width: 85px;
    height: 85px;
    font-size: 2.1rem;
    border: 3px solid rgba(255, 255, 255, 0.2);
  }
  
  .profile-info h2 {
    font-size: 1.5rem;
    margin-bottom: 7px;
  }
  
  .profile-meta {
    gap: 10px;
  }
  
  .profile-meta-item {
    font-size: 0.9rem;
    padding: 4px 9px;
  }
  
  .profile-meta-item i {
    font-size: 0.8rem;
  }
  
  .profile-body {
    padding: 16px;
  }
  
  .detail-item {
    padding: 12px 0;
    gap: 12px;
  }
  
  .detail-icon {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
  
  .detail-label {
    font-size: 0.7rem;
    margin-bottom: 3px;
  }
  
  .detail-value {
    font-size: 0.9rem;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .profile-card {
    border-radius: 10px;
  }
  
  .profile-header {
    padding: 22px 14px;
    gap: 14px;
  }
  
  .avatar {
    width: 80px;
    height: 80px;
    font-size: 1.9rem;
    border: 2px solid rgba(255, 255, 255, 0.2);
  }
  
  .profile-info h2 {
    font-size: 1.4rem;
    margin-bottom: 6px;
  }
  
  .profile-meta {
    gap: 8px;
  }
  
  .profile-meta-item {
    font-size: 0.85rem;
    padding: 3px 8px;
  }
  
  .profile-meta-item i {
    font-size: 0.75rem;
  }
  
  .profile-body {
    padding: 14px;
  }
  
  .detail-item {
    padding: 11px 0;
    gap: 11px;
  }
  
  .detail-icon {
    width: 34px;
    height: 34px;
    font-size: 0.9rem;
  }
  
  .detail-label {
    font-size: 0.65rem;
    margin-bottom: 2px;
  }
  
  .detail-value {
    font-size: 0.85rem;
  }
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  
  .avatar {
    width: 80px;
    height: 80px;
    font-size: 2rem;
    margin: 0 auto;
  }
  
  .profile-info h2 {
    font-size: 1.5rem;
  }
  
  .profile-meta {
    justify-content: center;
  }
  
  .profile-meta-item {
    font-size: 0.9rem;
  }
  
  .detail-item {
    padding: 12px 0;
  }
  
  .detail-icon {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }
}
</style> 