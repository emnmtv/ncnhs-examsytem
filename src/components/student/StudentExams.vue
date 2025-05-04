<template>
  <div class="student-exams-container">
    <div class="header-container">
      <div class="header-content">
        <h1>Available Exams<span class="material-icons">assignment</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Exams you can access based on your grade and section</p>
        </div>
      </div>
      <div class="header-background">EXAMS</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading available exams...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadExams" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="exams.length === 0" class="empty-state">
      <span class="material-icons-round">assignment</span>
      <p>No exams available</p>
      <p class="hint">There are no exams available for you at this time.</p>
    </div>

    <!-- Exams List -->
    <div v-else class="exams-grid">
      <div v-for="exam in exams" :key="exam.id" class="exam-card" :class="exam.status">
        <div class="exam-header">
          <div class="texture-layer"></div>
          <h2>{{ exam.examTitle }}</h2>
          <div class="exam-meta">
            <span class="exam-meta-item">
              <i class="fas fa-chalkboard"></i> {{ exam.classCode || 'No Class' }}
            </span>
            <span class="exam-meta-item">
              <i class="fas fa-key"></i> {{ exam.testCode }}
            </span>
            <span class="exam-meta-item" :class="'status-' + exam.status">
              <i class="fas fa-circle"></i> {{ formatStatus(exam.status) }}
            </span>
          </div>
        </div>
        
        <div class="exam-body">
          <div class="exam-info">
            <div class="info-item">
              <span class="material-icons-round">person</span>
              <div class="info-content">
                <span class="info-label">Teacher:</span>
                <span class="info-value">{{ formatTeacherName(exam) }}</span>
              </div>
            </div>
            <div class="info-item" v-if="exam.totalItems">
              <span class="material-icons-round">help_outline</span>
              <div class="info-content">
                <span class="info-label">Questions:</span>
                <span class="info-value">{{ exam.totalItems }} items</span>
              </div>
            </div>
            <div class="info-item">
              <span class="material-icons-round">schedule</span>
              <div class="info-content">
                <span class="info-label">Duration:</span>
                <span class="info-value">{{ exam.duration || 'Not specified' }} {{ exam.duration ? 'minutes' : '' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="exam-actions">
          <router-link 
            :to="{ path: '/take-exam', query: { testCode: exam.testCode }}" 
            class="take-btn"
            :class="{ 'disabled': exam.status !== 'started' }"
            :disabled="exam.status !== 'started'"
          >
            <i class="fas" :class="exam.status === 'started' ? 'fa-play-circle' : 'fa-clock'"></i>
            {{ exam.status === 'started' ? 'Take Exam' : 'Not Started' }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { 
  getAllExams, 
  checkExamAccess,
  getExamAccess,
  fetchUserProfile
} from '@/services/authService';
// eslint-disable-next-line no-unused-vars
import Swal from 'sweetalert2';

export default {
  name: 'StudentExams',
  
  setup() {
    const allExams = ref([]);
    const exams = ref([]);
    const loading = ref(true);
    const error = ref('');
    const userProfile = ref(null);
    
    // Load student profile
    const loadProfile = async () => {
      try {
        const response = await fetchUserProfile();
        console.log('User profile response:', response);
        
        // Make sure the profile data has the expected structure
        if (response && response.user) {
          userProfile.value = response.user;
        } else {
          userProfile.value = response; // Fallback
        }
        
        console.log('User profile loaded:', userProfile.value);
        console.log('Grade level:', userProfile.value.gradeLevel);
        console.log('Section:', userProfile.value.section);
      } catch (err) {
        console.error('Error loading profile:', err);
        error.value = 'Failed to load your profile';
      }
    };
    
    // Format exam status for display
    const formatStatus = (status) => {
      switch (status) {
        case 'started': return 'In Progress';
        case 'stopped': return 'Completed';
        case 'pending': return 'Not Started';
        default: return 'Unknown';
      }
    };
    
    // Check if student has access to an exam
    const checkAccess = async (exam) => {
      if (!userProfile.value) {
        console.log('No user profile available');
        return false;
      }
      
      // Ensure the profile has grade and section info
      if (userProfile.value.gradeLevel === undefined || !userProfile.value.section) {
        console.log('Missing grade or section info in profile', userProfile.value);
        return false;
      }
      
      try {
        // Check if the exam has access restrictions
        console.log(`Checking access for exam ${exam.id}`);
        const accessResponse = await getExamAccess(exam.id);
        console.log('Access response:', accessResponse);
        
        // If no access array in response, consider access denied
        if (!accessResponse.access) {
          console.log(`No access info for exam ${exam.id}, denying access`);
          return false;
        }
        
        // If access array is empty, the exam is restricted to nobody (this is different than open access)
        if (accessResponse.access.length === 0) {
          console.log(`Exam ${exam.id} has empty access list, denying access`);
          return false; 
        }
        
        // Check if there's an "all" access entry indicating this exam is open to everyone
        const hasAllAccess = accessResponse.access.some(access => 
          access.grade === 0 && access.section === "all" && access.isEnabled
        );
        
        if (hasAllAccess) {
          console.log(`Exam ${exam.id} is open to all students`);
          return true;
        }
        
        // Otherwise, check if student's grade/section matches any access entry
        const gradeLevel = Number(userProfile.value.gradeLevel);
        const section = userProfile.value.section;
        
        console.log(`User grade: ${gradeLevel}, section: ${section}`);
        
        // Manual check if any access entry matches the student's grade and section
        const hasMatchingAccess = accessResponse.access.some(access => 
          access.grade === gradeLevel && 
          access.section === section && 
          access.isEnabled
        );
        
        if (hasMatchingAccess) {
          console.log(`User has direct access to exam ${exam.id}`);
          return true;
        }
        
        // As a backup, also use the API endpoint
        const apiAccessCheck = await checkExamAccess(exam.id, gradeLevel, section);
        console.log(`API access check for exam ${exam.id}: ${apiAccessCheck}`);
        
        return apiAccessCheck;
      } catch (err) {
        console.error(`Error checking access for exam ${exam.id}:`, err);
        return false;
      }
    };
    
    // Load all exams and filter based on access
    const loadExams = async () => {
      loading.value = true;
      error.value = '';
      exams.value = [];
      
      try {
        // First load the user profile if not already loaded
        if (!userProfile.value) {
          await loadProfile();
        }
        
        if (!userProfile.value) {
          throw new Error('Failed to load user profile');
        }
        
        // Then load all exams
        console.log('Loading exams...');
        const response = await getAllExams();
        console.log('All exams response:', response);
        
        allExams.value = response.exams || [];
        console.log('All exams:', allExams.value);
        
        // Filter exams based on access
        const accessibleExams = [];
        
        console.log('Checking access for each exam...');
        for (const exam of allExams.value) {
          console.log(`Checking access for exam ${exam.id}: ${exam.examTitle}`);
          const hasAccess = await checkAccess(exam);
          console.log(`Access result for exam ${exam.id}: ${hasAccess}`);
          
          if (hasAccess) {
            console.log(`Adding exam ${exam.id} to accessible exams`);
            accessibleExams.push(exam);
          } else {
            console.log(`Exam ${exam.id} is not accessible`);
          }
        }
        
        console.log('Accessible exams count:', accessibleExams.length);
        exams.value = accessibleExams;
        loading.value = false;
      } catch (err) {
        console.error('Error loading exams:', err);
        error.value = err.message || 'Failed to load exams';
        loading.value = false;
      }
    };
    
    // Helper function to format teacher name
    const formatTeacherName = (exam) => {
      // Check if user property exists
      if (exam.user) {
        return `${exam.user.firstName} ${exam.user.lastName}`;
      }
      
      // Check for teacher property as fallback
      if (exam.teacher) {
        return `${exam.teacher.firstName} ${exam.teacher.lastName}`;
      }
      
      // If neither exists
      return 'Unknown Teacher';
    };
    
    // Load data when component mounts
    onMounted(async () => {
      await loadExams();
    });
    
    return {
      exams,
      loading,
      error,
      loadExams,
      formatStatus,
      formatTeacherName
    };
  }
};
</script>

<style scoped>
.student-exams-container {
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

/* Loading, Error, Empty States */
.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #f9f9f9;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.loading-state .material-icons-round,
.error-state .material-icons-round,
.empty-state .material-icons-round {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-state .material-icons-round {
  color: #159750;
}

.error-state {
  background: #fff3f3;
}

.error-state .material-icons-round {
  color: #f44336;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #e53935;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.hint {
  color: #757575;
  margin-top: 0.5rem;
}

/* Exams Grid */
.exams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.exam-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.exam-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.exam-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Main paint swipe */
.exam-header::after {
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
.exam-header::before {
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
.exam-header .texture-layer {
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

/* Hover animations */
.exam-header:hover::after {
  transform: skewX(-20deg) translateX(10px);
  transition: transform 0.3s ease;
}

.exam-header:hover::before {
  transform: skewX(-35deg) translateX(-10px);
  transition: transform 0.3s ease;
}

.exam-header h2 {
  margin: 0 0 10px 0;
  color: #f1f1f1;
  font-size: 1.5rem;
}

.exam-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.exam-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
  color: #fafafa;
  font-weight: 600;
}

.status-started {
  color: #4CAF50;
}

.status-pending {
  color: #FF9800;
}

.status-stopped {
  color: #F44336;
}

.exam-body {
  padding: 20px;
  flex: 1;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
  color: #666;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 0.8rem;
  color: #9e9e9e;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  color: #424242;
}

.info-item .material-icons-round {
  font-size: 1.25rem;
  color: #159750;
  margin-top: 0.25rem;
}

.exam-actions {
  padding: 15px 20px;
  background: #f5f5f5;
  border-top: 1px solid #eee;
}

.take-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  width: 100%;
}

.take-btn:hover:not(.disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.take-btn.disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
}

.take-btn i {
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .student-exams-container {
    padding: 0rem;
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
  
  .exams-grid {
    grid-template-columns: 1fr;
  }
  
  .exam-header h2 {
    font-size: 1.2rem;
  }
  
  .exam-meta-item {
    font-size: 0.8rem;
  }
}
</style> 