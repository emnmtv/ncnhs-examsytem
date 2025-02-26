<template>
  <div class="sidenav" :class="{ 'collapsed': isCollapsed }">
    <div class="toggle-btn" @click="toggleNav">
      <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
    </div>

    <div class="nav-links">
      <template v-if="userRole && navigationItems[userRole]">
        <router-link 
          v-for="item in navigationItems[userRole]" 
          :key="item.path"
          :to="item.path"
          class="nav-link"
        >
          <i class="fas" :class="item.icon"></i>
          <span v-show="!isCollapsed">{{ item.name }}</span>
        </router-link>
      </template>
    </div>

    <button @click="handleLogout" class="logout-btn">
      <i class="fas fa-sign-out-alt"></i>
      <span v-show="!isCollapsed">Logout</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getUserRole, logout } from '../services/authService';

const router = useRouter();
const userRole = ref('');

onMounted(() => {
  userRole.value = getUserRole();
});

const navigationItems = {
  admin: [
    { name: 'Dashboard', path: '/admin-dashboard', icon: 'fa-home' },
    { name: 'Manage Users', path: '/manage-users', icon: 'fa-users' },
    { name: 'Settings', path: '/settings', icon: 'fa-cog' },
    { name: 'Profile', path: '/profile', icon: 'fa-user' },
    { name: 'Student Scores', path: '/scores', icon: 'fa-chart-line' },
    { name: 'Users List', path: '/users-list', icon: 'fa-list' },
  ],
  teacher: [
    { name: 'Dashboard', path: '/teacher-dashboard', icon: 'fa-home' },
    { name: 'Create Exam', path: '/create-exam', icon: 'fa-file-alt' },
    { name: 'View Results', path: '/view-results', icon: 'fa-chart-bar' },
    { name: 'Settings', path: '/settings', icon: 'fa-cog' },
    { name: 'Profile', path: '/teacher-profile', icon: 'fa-user' },
    {name: 'Student Scores', path: '/scores', icon: 'fa-chart-line'},
    {name: 'Manage Exam', path: '/manage-exam', icon: 'fa-chart-line'}
    
  ],
  student: [
    { name: 'Dashboard', path: '/dashboard', icon: 'fa-home' },
    { name: 'Take Exam', path: '/take-exam', icon: 'fa-pen' },
    { name: 'View Grades', path: '/grades', icon: 'fa-chart-line' },
    { name: 'Settings', path: '/settings', icon: 'fa-cog' },
    { name: 'Profile', path: '/student-profile', icon: 'fa-user' },

  ]
};

const handleLogout = () => {
  logout();
  router.push('/');
};
</script>

<style scoped>
.sidenav {
  width: 250px;
  height: 100vh;
  background: #333;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 20px;
  position: relative;
  transition: all 0.3s ease;
}

.sidenav.collapsed {
  width: 70px;
  padding: 20px 10px;
}

.toggle-btn {
  position: absolute;
  right: -12px;
  top: 20px;
  background: #4CAF50;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  transition: transform 0.3s ease;
}

.toggle-btn:hover {
  transform: scale(1.1);
}

.nav-links {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.sidenav a {
  color: white;
  text-decoration: none;
  padding: 12px 15px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.sidenav.collapsed a {
  padding: 12px;
  justify-content: center;
}

.sidenav a:hover {
  background: #555;
}

.sidenav a.router-link-active {
  background: #444;
  border-left: 4px solid #4CAF50;
}

.sidenav i {
  width: 20px;
  text-align: center;
}

.logout-btn {
  margin-top: auto;
  padding: 12px;
  border: none;
  background: #dc3545;
  color: white;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.sidenav.collapsed .logout-btn {
  justify-content: center;
}

.logout-btn:hover {
  background: #c82333;
}

/* Add tooltip for collapsed state */
.sidenav.collapsed a, 
.sidenav.collapsed .logout-btn {
  position: relative;
}

.sidenav.collapsed a:hover::after,
.sidenav.collapsed .logout-btn:hover::after {
  content: attr(to);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background: #555;
  padding: 5px 10px;
  border-radius: 4px;
  margin-left: 10px;
  font-size: 14px;
  white-space: nowrap;
  z-index: 1000;
}
</style>
  