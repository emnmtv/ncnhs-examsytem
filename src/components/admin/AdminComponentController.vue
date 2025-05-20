<template>
  <div class="component-controller">
    <div class="header-container">
      <div class="header-content">
        <h1>Component Controller<span class="material-icons">toggle_on</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Enable or disable components visibility for users</p>
        </div>
      </div>
      <div class="header-background">CONTROL</div>
    </div>

    <!-- Profile Edit Permissions Section -->
    <div class="permissions-section">
      <h2 class="section-title">
        <span class="material-icons">settings</span>
        Profile Edit Permissions
      </h2>
      <p class="section-description">Control which profile fields students can edit</p>

      <div class="permissions-grid">
        <div class="permission-card">
          <div class="permission-header">
            <span class="material-icons">badge</span>
            <h3>LRN Editing</h3>
          </div>
          <p class="permission-description">Allow students to edit their Learner Reference Number (LRN)</p>
          <div class="permission-controls">
            <label class="switch">
              <input 
                type="checkbox" 
                v-model="profilePermissions.canEditLRN"
                @change="updateProfilePermissions"
              >
              <span class="slider"></span>
            </label>
            <span class="status-text">{{ profilePermissions.canEditLRN ? 'Enabled' : 'Disabled' }}</span>
          </div>
        </div>

        <div class="permission-card">
          <div class="permission-header">
            <span class="material-icons">school</span>
            <h3>Grade & Section Editing</h3>
          </div>
          <p class="permission-description">Allow students to edit their grade level and section</p>
          <div class="permission-controls">
            <label class="switch">
              <input 
                type="checkbox" 
                v-model="profilePermissions.canEditGradeSection"
                @change="updateProfilePermissions"
              >
              <span class="slider"></span>
            </label>
            <span class="status-text">{{ profilePermissions.canEditGradeSection ? 'Enabled' : 'Disabled' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="controls-section">
      <div class="role-tabs">
        <button 
          v-for="role in ['student', 'teacher', 'admin']" 
          :key="role"
          :class="['tab-btn', { active: selectedRole === role }]"
          @click="selectedRole = role"
        >
          {{ role.charAt(0).toUpperCase() + role.slice(1) }} Components
        </button>
      </div>

      <div class="components-grid">
        <div v-for="(component, index) in getComponentsByRole" 
             :key="index" 
             class="component-card"
        >
          <div class="component-header">
            <span class="material-icons">{{ component.icon }}</span>
            <h3>{{ component.name }}</h3>
          </div>
          <div class="component-controls">
            <label class="switch">
              <input 
                type="checkbox" 
                v-model="component.enabled"
                @change="updateComponentStatus(component)"
              >
              <span class="slider"></span>
            </label>
            <span class="status-text">{{ component.enabled ? 'Enabled' : 'Disabled' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getComponentSettings, updateComponentSetting, initializeComponentSettings, getProfileEditPermissions, updateProfileEditPermissions } from '@/services/authService';
import Swal from 'sweetalert2';

const selectedRole = ref('student');
const componentSettings = ref({
  student: [],
  teacher: [],
  admin: []
});

// Add profile edit permissions state
const profilePermissions = ref({
  canEditLRN: false,
  canEditGradeSection: false
});

// Load component settings on mount
onMounted(async () => {
  await loadComponentSettings();
  await loadProfilePermissions();
});

const loadComponentSettings = async () => {
  try {
    // Initialize settings if needed
    await initializeComponentSettings();
    
    // Load settings for each role
    const roles = ['student', 'teacher', 'admin'];
    for (const role of roles) {
      const settings = await getComponentSettings(role);
      componentSettings.value[role] = settings.map(s => ({
        name: s.componentName,
        path: s.componentPath,
        icon: getIconForPath(s.componentPath),
        enabled: s.isEnabled
      }));
    }
  } catch (error) {
    console.error('Failed to load component settings:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load component settings'
    });
  }
};

// Load profile edit permissions
const loadProfilePermissions = async () => {
  try {
    const permissions = await getProfileEditPermissions();
    profilePermissions.value = permissions;
  } catch (error) {
    console.error('Failed to load profile edit permissions:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to load profile edit permissions'
    });
  }
};

// Update profile edit permissions
const updateProfilePermissions = async () => {
  try {
    await updateProfileEditPermissions({
      canEditLRN: profilePermissions.value.canEditLRN,
      canEditGradeSection: profilePermissions.value.canEditGradeSection
    });
    
    Swal.fire({
      icon: 'success',
      title: 'Updated Successfully',
      text: `Profile edit permissions have been updated`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  } catch (error) {
    console.error('Failed to update profile edit permissions:', error);
    Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      text: 'Failed to update profile edit permissions'
    });
    
    // Revert the toggle if the update failed
    await loadProfilePermissions();
  }
};

const getIconForPath = (path) => {
  const iconMap = {
    // Student paths
    '/student-subjects': 'subject',
    '/student/tasks': 'task',
    '/take-exam': 'edit',
    '/student-exams': 'assignment',
    '/exam-history': 'history',
    '/student-profile': 'person',
    '/answer-survey': 'assignment',
    // Teacher paths
    '/teacher-subjects': 'subject',
    '/create-exam': 'note_add',
    '/manage-exam': 'assignment',
    '/manage-exams': 'bar_chart',
    '/question-bank': 'question_answer',
    '/create-survey': 'addchart',
    '/my-surveys': 'assignment',
    '/teacher-profile': 'person',
    
    // Admin paths
    '/manage-users': 'group',
    '/scores': 'analytics',
    '/active-users': 'person_search',
    '/admin-exam-monitor': 'admin_panel_settings',
    '/manage-subjects': 'subject',
    '/admin-profile': 'person',
    '/admin-component-controller': 'pan_tool',
    
    // Common paths
    '/settings': 'settings'
  };
  
  return iconMap[path] || 'extension';
};

const updateComponentStatus = async (component) => {
  try {
    await updateComponentSetting(
      selectedRole.value,
      component.path,
      component.enabled
    );
    
    // Update local storage to reflect changes
    const storedSettings = JSON.parse(localStorage.getItem('componentSettings') || '{}');
    if (!storedSettings[selectedRole.value]) {
      storedSettings[selectedRole.value] = [];
    }
    
    const existingIndex = storedSettings[selectedRole.value].findIndex(
      c => c.path === component.path
    );
    
    if (existingIndex >= 0) {
      storedSettings[selectedRole.value][existingIndex].enabled = component.enabled;
    } else {
      storedSettings[selectedRole.value].push({
        path: component.path,
        enabled: component.enabled
      });
    }
    
    localStorage.setItem('componentSettings', JSON.stringify(storedSettings));
    
    await Swal.fire({
      icon: 'success',
      title: 'Updated Successfully',
      text: `${component.name} visibility has been ${component.enabled ? 'enabled' : 'disabled'}`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000
    });
  } catch (error) {
    console.error('Failed to update component status:', error);
    component.enabled = !component.enabled; // Revert the toggle
    await Swal.fire({
      icon: 'error',
      title: 'Update Failed',
      text: 'Failed to update component visibility'
    });
  }
};

const getComponentsByRole = computed(() => {
  return componentSettings.value[selectedRole.value] || [];
});
</script>

<style scoped>
.component-controller {
  padding: 20px;
}

.header-container {
  position: relative;
  margin-bottom: 30px;
}

.header-content h1 {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
}

.divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 1.5rem 0;
}

/* Permissions Section Styles */
.permissions-section {
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1.5rem;
  color: #159750;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.section-description {
  color: #666;
  margin-bottom: 20px;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.permission-card {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #e0e0e0;
}

.permission-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.permission-header h3 {
  font-size: 1.2rem;
  margin: 0;
}

.permission-header .material-icons {
  color: #159750;
}

.permission-description {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 15px;
}

.permission-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.role-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn.active {
  background: #159750;
  color: white;
}

.components-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.component-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.component-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.component-header .material-icons {
  color: #159750;
}

.switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #159750;
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.component-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-text {
  color: #666;
}

@media (max-width: 768px) {
  .component-controller {
    padding: 10px;
  }
  
  .header-content h1 {
    font-size: 1.8rem;
  }
  
  .components-grid {
    grid-template-columns: 1fr;
  }
  
  .permissions-grid {
    grid-template-columns: 1fr;
  }
  
  .role-tabs {
    flex-direction: column;
  }
  
  .tab-btn {
    width: 100%;
  }
}
</style>
