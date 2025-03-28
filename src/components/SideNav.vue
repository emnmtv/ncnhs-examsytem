<template>
  <div class="sidenav" :class="{ 'collapsed': isCollapsed }">
    <div class="toggle-btn" @click="toggleNav">
      <span class="material-icons">
        {{ isCollapsed ? 'menu' : 'menu' }}
      </span>
    </div>
    
    <!-- User Profile Section -->
    <div class="user-profile" v-if="userProfile">
      <div class="avatar" v-if="!isCollapsed">
        <span class="material-icons">account_circle</span>
      </div>
      <div class="logo-avatar" v-else>
        <img src="../assets/logo.png" alt="Logo" class="logo" />
      </div>
      <div class="user-info">
        <div class="user-name">{{ userProfile.firstName }} {{ userProfile.lastName }}</div>
        <div class="user-role">{{ formatRole(userRole) }}</div>
      </div>
    </div>

    <div class="nav-links">
      <template v-if="userRole && navigationItems[userRole]">
        <router-link 
          v-for="item in navigationItems[userRole]" 
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :title="isCollapsed ? item.name : ''"
        >
          <div class="icon-container">
            <span class="material-icons">{{ item.icon }}</span>
          </div>
          <span class="link-text">{{ item.name }}</span>
        </router-link>
      </template>
    </div>

    <button @click="handleLogout" class="logout-btn" title="Logout">
      <div class="icon-container">
        <span class="material-icons">logout</span>
      </div>
      <span class="link-text">Logout</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import { getUserRole, logout, fetchUserProfile } from '../services/authService';
import Swal from 'sweetalert2';

const router = useRouter();
const userRole = ref('');
const isCollapsed = ref(window.innerWidth <= 768);
const userProfile = ref(null);

const emit = defineEmits(['nav-toggle']);

onMounted(async () => {
  userRole.value = getUserRole();
  
  // Fetch user profile
  try {
    const profileData = await fetchUserProfile();
    userProfile.value = profileData;
  } catch (error) {
    console.error('Failed to load user profile:', error);
  }
  
  // Handle responsive collapse on window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
      isCollapsed.value = true;
    }
  });
});

const formatRole = (role) => {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const toggleNav = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('nav-toggle', isCollapsed.value);
};

const navigationItems = {
  admin: [
    { name: 'Manage Users', path: '/manage-users', icon: 'group' },
    { name: 'Student Scores', path: '/scores', icon: 'analytics' },
    { name: 'Active Users', path: '/active-users', icon: 'person_search' },
    { name: 'Exam Monitor', path: '/admin-exam-monitor', icon: 'admin_panel_settings' },
    { name: 'Manage Subjects', path: '/manage-subjects', icon: 'subject' },
    // {name:'Game', path:'/game', icon:'controller'},
    { name: 'Profile', path: '/admin-profile', icon: 'person' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
    
  
  ],
  teacher: [
  { name: 'Classes', path: '/teacher-subjects', icon: 'subject' },
    { name: 'Create Exam', path: '/create-exam', icon: 'note_add' },
    { name: 'Monitor Exam', path: '/manage-exam', icon: 'assignment' },
    { name: 'Manage Exams', path: '/manage-exams', icon: 'bar_chart' },
    { name: 'Create Survey', path: '/create-survey', icon: 'addchart' },
    { name: 'Manage Surveys', path: '/my-surveys', icon: 'assignment' },
    
    // {name:'Game', path:'/game', icon:''},
    { name: 'Profile', path: '/teacher-profile', icon: 'person' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ],
  student: [
    { name: 'Classes', path: '/student-subjects', icon: 'subject' },
    {name:'My Task', path:'/student/tasks', icon:'task'},
    { name: 'Take Exam', path: '/take-exam', icon: 'edit' },
   
    { name: 'Exams', path: '/student-exams', icon: 'assignment' },
    { name: 'Exam History', path: '/exam-history', icon: 'history' },
    
    // {name:'Game', path:'/game', icon:'controller'},
    { name: 'Profile', path: '/student-profile', icon: 'person' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
    
  ]
};

const handleLogout = async () => {
  try {
    const result = await Swal.fire({
      title: 'Logout Confirmation',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f1416c',
      cancelButtonColor: '#b5b5c3',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      // Show loading state
      Swal.fire({
        title: 'Logging out...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Perform logout
      logout();

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Logged Out Successfully',
        text: 'Thank you for using NCNHS Exam System',
        timer: 1500,
        showConfirmButton: false
      });

      // Redirect to login page
      router.push('/');
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Logout Failed',
      text: 'There was an error logging out. Please try again.',
      confirmButtonColor: '#f1416c'
    });
  }
};
</script>

<style scoped>
/* Side Navigation Container */
.sidenav {
  width: 180px;
  height: 100vh;
  background: #159750; /* Default theme */
  color: white;
  display: flex;
  flex-direction: column;
  position: fixed;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  top: 0;
  left: 0;
  z-index: 100;
  border-top-right-radius: 20px;
  border-bottom-right-radius: 20px;
}

.sidenav.collapsed {
  width: 80px;
}

/* Dark Theme */
:root[data-theme='dark'] .sidenav {
  background: #333;
  color: #fff;
}

/* Yellow Theme */
:root[data-theme='yellow'] .sidenav {
  background: #f1c40f;
  color: #333;
}

:root[data-theme='yellow'] .toggle-btn {
  background: #f39c12;
}

:root[data-theme='yellow'] .toggle-btn:hover {
  background: #e67e22;
}

:root[data-theme='yellow'] .nav-link {
  color: #333;
}

:root[data-theme='yellow'] .nav-link:hover {
  background: rgba(0, 0, 0, 0.1);
  border-left: 3px solid #333;
}

:root[data-theme='yellow'] .nav-link.router-link-active {
  background: rgba(0, 0, 0, 0.2);
  font-weight: 600;
}

:root[data-theme='yellow'] .nav-link.router-link-active .material-icons {
  color: #333;
}

:root[data-theme='yellow'] .icon-container .material-icons {
  color: #333;
}

:root[data-theme='yellow'] .logout-btn {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

:root[data-theme='yellow'] .logout-btn:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* Blue Theme */
:root[data-theme='blue'] .sidenav {
  background: #1d6ea5;
  color: #fff;
}

:root[data-theme='blue'] .toggle-btn {
  background: #2980b9;
}

:root[data-theme='blue'] .toggle-btn:hover {
  background: #1abc9c;
}

:root[data-theme='blue'] .nav-link {
  color: #fff;
}

:root[data-theme='blue'] .nav-link:hover {
  background: rgba(0, 0, 0, 0.1);
  border-left: 3px solid #fff;
}

:root[data-theme='blue'] .nav-link.router-link-active {
  background: rgba(0, 0, 0, 0.2);
  font-weight: 600;
}

:root[data-theme='blue'] .nav-link.router-link-active .material-icons {
  color: #fff;
}

:root[data-theme='blue'] .icon-container .material-icons {
  color: #fff;
}

:root[data-theme='blue'] .logout-btn {
  background: rgba(0, 0, 0, 0.1);
  color: #fff;
}

:root[data-theme='blue'] .logout-btn:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* Fire Effect */
:root[data-effect='fire'] .nav-link.router-link-active {
  
  animation: fireEffect 1s infinite;
  position: relative;
  overflow: hidden;
}

:root[data-effect='fire'] .nav-link.router-link-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 40%;
  width: 100%;
  height: 100%;
  background: url('@/assets/fire.gif') center center / cover no-repeat;
  opacity: 0.7;
  pointer-events: none;
}

@keyframes fireEffect {
  0% { box-shadow: 0 0 10px rgba(255, 69, 0, 0.8); }
  50% { box-shadow: 0 0 20px rgba(255, 69, 0, 1); }
  100% { box-shadow: 0 0 10px rgba(255, 69, 0, 0.8); }
}

/* Smoke Effect */
:root[data-effect='smoke'] .nav-link.router-link-active {
 
  animation: smokeEffect 1s infinite;
  position: relative;
  overflow: hidden;
}

:root[data-effect='smoke'] .nav-link.router-link-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('@/assets/fire2.gif') center center / cover no-repeat;
  opacity: 0.7;
  pointer-events: none;
}

@keyframes smokeEffect {
  0% { box-shadow: 0 0 10px rgba(169, 169, 169, 0.8); }
  50% { box-shadow: 0 0 20px rgba(169, 169, 169, 1); }
  100% { box-shadow: 0 0 10px rgba(169, 169, 169, 0.8); }
}

/* Real Fire Effect */
:root[data-effect='real-fire'] .nav-link.router-link-active {
  background: rgba(255, 69, 0, 0.8);
  position: relative;
  overflow: hidden;
}

:root[data-effect='real-fire'] .nav-link.router-link-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('@/assets/fire.gif') center center / cover no-repeat;
  opacity: 0.7;
  pointer-events: none;
}

/* Real Smoke Effect */
:root[data-effect='real-smoke'] .nav-link.router-link-active {
  background: rgba(169, 169, 169, 0.8);
  position: relative;
  overflow: hidden;
}

:root[data-effect='real-smoke'] .nav-link.router-link-active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('@/assets/fire2.gif') center center / cover no-repeat;
  opacity: 0.7;
  pointer-events: none;
}

/* Toggle Button */
.toggle-btn {
  position: absolute;
  right: -55px;
  top: 30px;
  background: #f0f0f0;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.toggle-btn:hover {
  background: #e0e0e0;
}

.toggle-btn .material-icons {
  font-size: 24px;
  color: #333;
}

/* Navigation Links */
.nav-links {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  overflow-y: auto;
  height: calc(100vh - 180px);
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 14px 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  margin: 0;
  border-left: 3px solid transparent;
}

.nav-link:hover {
  background: rgba(0, 0, 0, 0.2);
  border-left: 3px solid white;
}

.nav-link.router-link-active {
  background: rgba(0, 0, 0, 0.30);
  
  font-weight: 600;
}

.nav-link.router-link-active .material-icons {
  color: white;
}

.icon-container {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-container .material-icons {
  font-size: 24px;
}

.link-text {
  transition: opacity 0.3s ease;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 500;
  color: white;
}

.sidenav.collapsed .link-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

/* Logout Button */
.logout-btn {
  margin: 50px auto;
  padding: 10px;
  border: none;
  background: rgba(0, 0, 0, 0.2);
  color: white;
  cursor: pointer;
  border-radius: 20%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.logout-btn:hover {
  background: rgba(0, 0, 0, 0.3);
}

.logout-btn .link-text {
  display: none;
}

.logout-btn .icon-container {
  margin: 0;
}

/* Scrollbar Styling */
.nav-links::-webkit-scrollbar {
  width: 4px;
}

.nav-links::-webkit-scrollbar-track {
  background: transparent;
}

.nav-links::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 4px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .sidenav {
    transform: translateX(0);
  }

  .sidenav.collapsed {
    transform: translateX(-100%);
    width: 280px;
  }

  .toggle-btn {
    right: -32px;
    width: 32px;
    height: 32px;
    border-radius: 0 6px 6px 0;
  }

  .sidenav.collapsed .toggle-btn {
    right: -32px;
  }

  .sidenav.collapsed .link-text,
  .sidenav.collapsed .logo-text {
    opacity: 1;
    width: auto;
  }
}

/* Add dividers between sections like in reference */
.nav-links:after {
  content: "";
  display: block;
  margin: 12px 24px;
  height: 2px;
  background: rgba(255, 255, 255, 0.8);
}

/* User Profile Styles */
.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 8px 16px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.8);
  margin-bottom: 16px;
  text-align: center;
  margin-top: 16px;
}

.avatar {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  flex-shrink: 0;
  border: 3px solid rgba(255, 255, 255, 0.4);
}

.avatar .material-icons {
  font-size: 54px;
  color: white;
}

.user-info {
  width: 100%;
}

.user-name {
  font-weight: 600;
  font-size: 16px;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-role {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
}

/* Even in collapsed state, keep avatar centered */
.sidenav.collapsed .user-profile {
  padding: 12px 0;
}

.sidenav.collapsed .user-info {
  display: none;
}

.logo-avatar {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
