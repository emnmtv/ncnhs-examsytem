<template>
  <div class="student-exams-container">
    <div class="exams-header">
      <h1>Available Exams</h1>
      <p class="subtitle">Exams you can access based on your grade and section</p>
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
        <div class="exam-status">
          <span class="status-badge" :class="exam.status">
            {{ formatStatus(exam.status) }}
          </span>
        </div>
        
        <div class="exam-body">
          <h3 class="exam-title">{{ exam.examTitle }}</h3>
          <div class="exam-info">
            <div class="info-item">
              <span class="material-icons-round">code</span>
              <div class="info-content">
                <span class="info-label">Test Code:</span>
                <span class="info-value">{{ exam.testCode }}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="material-icons-round">subject</span>
              <div class="info-content">
                <span class="info-label">Subject/Class:</span>
                <span class="info-value">{{ exam.classCode || 'No subject' }}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="material-icons-round">person</span>
              <div class="info-content">
                <span class="info-label">Teacher:</span>
                <span class="info-value">{{ formatTeacherName(exam) }}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="material-icons-round">schedule</span>
              <div class="info-content">
                <span class="info-label">Duration:</span>
                <span class="info-value">{{ exam.duration || 'Not specified' }} {{ exam.duration ? 'minutes' : '' }}</span>
              </div>
            </div>
            <div class="info-item" v-if="exam.totalItems">
              <span class="material-icons-round">help_outline</span>
              <div class="info-content">
                <span class="info-label">Questions:</span>
                <span class="info-value">{{ exam.totalItems }} items</span>
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
            <span class="material-icons-round">play_arrow</span>
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
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.exams-header {
  margin-bottom: 2rem;
}

.exams-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #f9f9f9;
  border-radius: 8px;
  text-align: center;
}

.loading-state .material-icons-round {
  font-size: 3rem;
  color: #673ab7;
  margin-bottom: 1rem;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #fff3f3;
  border-radius: 8px;
  text-align: center;
}

.error-state .material-icons-round {
  font-size: 3rem;
  color: #f44336;
  margin-bottom: 1rem;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #e53935;
  transform: translateY(-2px);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: #f9f9f9;
  border-radius: 8px;
  text-align: center;
}

.empty-state .material-icons-round {
  font-size: 3rem;
  color: #9e9e9e;
  margin-bottom: 1rem;
}

.hint {
  color: #757575;
  margin-top: 0.5rem;
}

/* Exams Grid */
.exams-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.exam-card {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  position: relative;
  border-top: 4px solid #673ab7;
}

.exam-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.exam-card.started {
  border-top-color: #4caf50;
}

.exam-card.stopped {
  border-top-color: #f44336;
}

.exam-card.pending {
  border-top-color: #ff9800;
}

.exam-status {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.status-badge.started {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.stopped {
  background: #ffebee;
  color: #c62828;
}

.status-badge.pending {
  background: #fff3e0;
  color: #ef6c00;
}

.exam-body {
  padding: 1.5rem;
  flex: 1;
}

.exam-title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #333;
}

.exam-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem 0;
  color: #666;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  color: #9e9e9e;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 0.95rem;
  color: #424242;
}

.info-item .material-icons-round {
  font-size: 1.25rem;
  color: #673ab7;
  margin-top: 0.25rem;
}

.exam-actions {
  padding: 1rem 1.5rem;
  background: #f5f5f5;
  border-top: 1px solid #eee;
}

.take-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #673ab7;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  width: 100%;
}

.take-btn:hover:not(.disabled) {
  background: #5e35b1;
  transform: translateY(-2px);
}

.take-btn.disabled {
  background: #e0e0e0;
  color: #9e9e9e;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .student-exams-container {
    padding: 1rem;
  }
  
  .exams-grid {
    grid-template-columns: 1fr;
  }
}
</style> 