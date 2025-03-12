<template>
  <div class="profile-card">
    <div class="profile-header">
      <div class="avatar" :style="{ backgroundColor: getAvatarColor() }">
        {{ getInitials() }}
      </div>
      <div class="header-info">
        <h2>{{ profile.firstName }} {{ profile.lastName }}</h2>
        <span class="role-badge" :class="profile.role">{{ profile.role }}</span>
      </div>
    </div>
    <div class="profile-stats">
      <div class="stat-item">
        <span class="material-icons-round">calendar_today</span>
        <div class="stat-info">
          <span class="stat-label">Member Since</span>
          <span class="stat-value">{{ formatDate(profile.createdAt) }}</span>
        </div>
      </div>
      <div class="stat-item">
        <span class="material-icons-round">email</span>
        <div class="stat-info">
          <span class="stat-label">Email</span>
          <span class="stat-value">{{ profile.email }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  profile: {
    type: Object,
    required: true
  }
});

const getInitials = () => {
  return `${props.profile.firstName[0]}${props.profile.lastName[0]}`;
};

const getAvatarColor = () => {
  const colors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800'];
  const hash = props.profile.firstName.length + props.profile.lastName.length;
  return colors[hash % colors.length];
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};
</script>

<style scoped>
.profile-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  overflow: hidden;
  margin-bottom: 2rem;
}

.profile-header {
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.header-info h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.role-badge {
  display: inline-block;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.role-badge.student {
  background: #e8f5e9;
  color: #2e7d32;
}

.role-badge.teacher {
  background: #e3f2fd;
  color: #1565c0;
}

.role-badge.admin {
  background: #fce4ec;
  color: #c2185b;
}

.profile-stats {
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
}

.stat-item .material-icons-round {
  color: #6c757d;
  font-size: 1.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.85rem;
  color: #6c757d;
}

.stat-value {
  font-weight: 500;
  color: #333;
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  .avatar {
    width: 100px;
    height: 100px;
    font-size: 2.2rem;
  }

  .profile-stats {
    grid-template-columns: 1fr;
    padding: 1rem;
  }
}
</style> 