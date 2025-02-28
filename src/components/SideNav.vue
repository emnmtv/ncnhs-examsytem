<template>
  <div class="sidenav" :class="{ 'collapsed': isCollapsed }">
    <div class="logo-section">
      <img src="../assets/logo.png" alt="Logo" class="logo" />
      <span v-show="!isCollapsed" class="logo-text">NCNHS</span>
    </div>

    <div class="toggle-btn" @click="toggleNav">
      <span class="material-icons">
        {{ isCollapsed ? 'chevron_right' : 'chevron_left' }}
      </span>
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

    <button @click="handleLogout" class="logout-btn" :title="isCollapsed ? 'Logout' : ''">
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
import { getUserRole, logout } from '../services/authService';
import Swal from 'sweetalert2';

const router = useRouter();
const userRole = ref('');
const isCollapsed = ref(window.innerWidth <= 768);

const emit = defineEmits(['nav-toggle']);

onMounted(() => {
  userRole.value = getUserRole();
  
  // Handle responsive collapse on window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
      isCollapsed.value = true;
    }
  });
});

const toggleNav = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('nav-toggle', isCollapsed.value);
};

const navigationItems = {
  admin: [
    { name: 'Dashboard', path: '/admin-dashboard', icon: 'dashboard' },
    { name: 'Manage Users', path: '/manage-users', icon: 'group' },
    { name: 'Student Scores', path: '/scores', icon: 'analytics' },
    { name: 'Users List', path: '/users-list', icon: 'list' },
    { name: 'Profile', path: '/profile', icon: 'person' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ],
  teacher: [
    { name: 'Dashboard', path: '/teacher-dashboard', icon: 'dashboard' },
    { name: 'Create Exam', path: '/create-exam', icon: 'note_add' },
    { name: 'Manage Exam', path: '/manage-exam', icon: 'assignment' },
    { name: 'View Results', path: '/view-results', icon: 'bar_chart' },
    { name: 'Student Scores', path: '/scores', icon: 'analytics' },
    { name: 'Profile', path: '/teacher-profile', icon: 'person' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
    { name: 'Manage Exams', path: '/manage-exams', icon: 'assignment' },
  ],
  student: [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Take Exam', path: '/take-exam', icon: 'edit' },
    { name: 'View Grades', path: '/grades', icon: 'analytics' },
    { name: 'Profile', path: '/student-profile', icon: 'person' },
    { name: 'Settings', path: '/settings', icon: 'settings' }
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
.sidenav {
  width: 280px;
  height: 100vh;
  background: #1e1e2d;
  color: #9899ac;
  display: flex;
  flex-direction: column;
  position: fixed;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  top: 0;
  left: 0;
  z-index: 100;
}

.sidenav.collapsed {
  width: 80px;
}

.logo-section {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;
}

.logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 600;
  color: white;
  transition: opacity 0.3s ease;
}

.sidenav.collapsed .logo-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.toggle-btn {
  position: absolute;
  right: -12px;
  top: 32px;
  background: #009ef7;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 158, 247, 0.3);
}

.toggle-btn:hover {
  transform: scale(1.1);
  background: #0095e8;
}

.toggle-btn .material-icons {
  font-size: 18px;
  color: white;
}

.nav-links {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 12px;
  overflow-y: auto;
  height: calc(100vh - 180px);
}

.nav-link {
  color: #9899ac;
  text-decoration: none;
  padding: 12px 16px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.router-link-active {
  background: rgba(0, 158, 247, 0.1);
  color: #009ef7;
}

.nav-link.router-link-active .material-icons {
  color: #009ef7;
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
  font-size: 22px;
}

.link-text {
  transition: opacity 0.3s ease;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
}

.sidenav.collapsed .link-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.logout-btn {
  margin: 16px 12px;
  padding: 12px 16px;
  border: none;
  background: #f1416c;
  color: white;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  width: calc(100% - 24px);
}

.logout-btn:hover {
  background: #e41146;
  transform: translateY(-1px);
}

/* Scrollbar Styling */
.nav-links::-webkit-scrollbar {
  width: 4px;
}

.nav-links::-webkit-scrollbar-track {
  background: transparent;
}

.nav-links::-webkit-scrollbar-thumb {
  background: #4a5568;
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
</style>
  