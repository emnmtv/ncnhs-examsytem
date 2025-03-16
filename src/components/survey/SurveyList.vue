<template>
  <div class="survey-list-container">
    <div class="header-container">
      <div class="header-content">
        <h1>My Surveys<span class="material-icons">poll</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">Create and manage your surveys</p>
        </div>
      </div>
      <div class="header-background">SURVEYS</div>
    </div>

    <div class="header-actions">
      <router-link to="/create-survey" class="create-btn">
        <span class="material-icons-round">add</span>
        Create New Survey
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading surveys...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadSurveys" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!surveys.length" class="empty-state">
      <span class="material-icons-round">description</span>
      <p>No surveys found</p>
      <p class="subtitle">Create your first survey to get started</p>
      <router-link to="/create-survey" class="create-btn">
        <span class="material-icons-round">add</span>
        Create Survey
      </router-link>
    </div>

    <!-- Survey List -->
    <div v-else class="surveys-grid">
      <div v-for="survey in surveys" :key="survey.id" class="survey-card">
        <div class="survey-header">
          <div class="texture-layer"></div>
          <h2>{{ survey.title }}</h2>
          <div class="survey-meta">
            <span class="survey-meta-item">
              <i class="fas fa-key"></i> {{ survey.code }}
            </span>
            <span class="survey-meta-item" :class="survey.isActive ? 'status-active' : 'status-inactive'">
              <i class="fas fa-circle"></i> {{ survey.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>

        <div class="survey-body">
          <p v-if="survey.description" class="description">{{ survey.description }}</p>
          <div class="survey-info">
            <div class="info-item">
              <span class="material-icons-round">question_answer</span>
              <div class="info-content">
                <span class="info-label">Questions</span>
                <span class="info-value">{{ survey.questions.length }} items</span>
              </div>
            </div>
            <div class="info-item">
              <span class="material-icons-round">people</span>
              <div class="info-content">
                <span class="info-label">Responses</span>
                <span class="info-value">{{ survey.responses.length }}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="material-icons-round">calendar_today</span>
              <div class="info-content">
                <span class="info-label">Created</span>
                <span class="info-value">{{ formatDate(survey.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="survey-actions">
          <button 
            class="action-btn view-btn" 
            @click="viewResults(survey)"
            title="View Results"
          >
            <span class="material-icons-round">analytics</span>
            Results
          </button>

          <button 
            class="action-btn share-btn" 
            @click="shareSurvey(survey)"
            title="Share Survey"
          >
            <span class="material-icons-round">share</span>
            Share
          </button>

          <button 
            class="action-btn toggle-btn"
            :class="{ 'inactive': !survey.isActive }"
            @click="toggleSurveyStatus(survey)"
            :title="survey.isActive ? 'Deactivate Survey' : 'Activate Survey'"
          >
            <span class="material-icons-round">
              {{ survey.isActive ? 'toggle_on' : 'toggle_off' }}
            </span>
            {{ survey.isActive ? 'Active' : 'Inactive' }}
          </button>

          <button 
            class="action-btn preview-btn" 
            @click="previewSurvey(survey)"
            title="Print Preview"
          >
            <span class="material-icons-round">description</span>
            Preview
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchUserSurveys } from '@/services/authService';
import Swal from 'sweetalert2';

export default {
  name: 'SurveyList',

  setup() {
    const router = useRouter();
    const surveys = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const loadSurveys = async () => {
      try {
        loading.value = true;
        error.value = null;
        surveys.value = await fetchUserSurveys();
      } catch (err) {
        error.value = err.message || 'Failed to load surveys';
      } finally {
        loading.value = false;
      }
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const viewResults = (survey) => {
      router.push(`/survey/${survey.code}/results`);
    };

    const shareSurvey = async (survey) => {
      const surveyUrl = `${window.location.origin}/answer-survey/${survey.code}`;
      
      await Swal.fire({
        title: 'Share Survey',
        html: `
          <div style="text-align: left;">
            <p><strong>Survey Code:</strong> ${survey.code}</p>
            <p><strong>Survey Link:</strong></p>
            <input 
              value="${surveyUrl}" 
              readonly 
              style="width: 100%; padding: 8px; margin-top: 8px;"
            >
          </div>
        `,
        confirmButtonText: 'Copy Link',
        showCancelButton: true,
        cancelButtonText: 'Close'
      }).then((result) => {
        if (result.isConfirmed) {
          navigator.clipboard.writeText(surveyUrl);
          Swal.fire({
            title: 'Copied!',
            text: 'Survey link copied to clipboard',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }
      });
    };

    const toggleSurveyStatus = async (survey) => {
      // TODO: Implement survey status toggle
      // This will require adding an endpoint to your API
      console.log('Toggle survey status:', survey.id);
    };

    const previewSurvey = (survey) => {
      router.push(`/survey/${survey.code}/preview`);
    };

    onMounted(loadSurveys);

    return {
      surveys,
      loading,
      error,
      loadSurveys,
      formatDate,
      viewResults,
      shareSurvey,
      toggleSurveyStatus,
      previewSurvey
    };
  }
};
</script>

<style scoped>
.survey-list-container {
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

.header-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 2rem;
}

.create-btn {
  padding: 12px 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: all 0.2s;
}

.create-btn:hover {
  background: #43A047;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.surveys-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.survey-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.survey-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.survey-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Main paint swipe */
.survey-header::after {
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
.survey-header::before {
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
.survey-header .texture-layer {
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

.survey-header h2 {
  margin: 0 0 10px 0;
  color: white;
  font-size: 1.5rem;
  position: relative;
  z-index: 1;
}

.survey-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.survey-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
}

.status-active {
  color: #4CAF50;
}

.status-inactive {
  color: #F44336;
}

.survey-body {
  padding: 20px;
  flex: 1;
}

.description {
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.survey-info {
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

.survey-actions {
  padding: 15px;
  background: #f5f5f5;
  border-top: 1px solid #eee;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.action-btn {
  flex: 1;
  min-width: calc(50% - 4px);
  padding: 8px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.view-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.view-btn:hover {
  background: #bbdefb;
}

.share-btn {
  background: #f3e5f5;
  color: #7b1fa2;
}

.share-btn:hover {
  background: #e1bee7;
}

.toggle-btn {
  background: #e8f5e9;
  color: #2e7d32;
}

.toggle-btn:hover {
  background: #c8e6c9;
}

.toggle-btn.inactive {
  background: #ffebee;
  color: #c62828;
}

.toggle-btn.inactive:hover {
  background: #ffcdd2;
}

.preview-btn {
  background: #f3e5f5;
  color: #7b1fa2;
}

.preview-btn:hover {
  background: #e1bee7;
}

/* Loading, Error, and Empty States */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-top: 2rem;
}

.loading-state .material-icons-round,
.error-state .material-icons-round,
.empty-state .material-icons-round {
  font-size: 3rem;
  color: #159750;
  margin-bottom: 1rem;
}

.error-state .retry-btn {
  margin-top: 1rem;
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.error-state .retry-btn:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.empty-state .subtitle {
  color: #666;
  margin-bottom: 1.5rem;
}

.rotating {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .survey-list-container {
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
  
  .header-actions {
    justify-content: center;
  }
  
  .create-btn {
    width: 100%;
    justify-content: center;
  }
  
  .surveys-grid {
    grid-template-columns: 1fr;
  }
  
  .survey-actions {
    padding: 10px;
    gap: 6px;
  }
  
  .action-btn {
    min-width: calc(50% - 3px);
    padding: 6px;
    font-size: 0.8rem;
  }
  
  .action-btn .material-icons-round {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .survey-actions {
    flex-direction: column;
    gap: 5px;
  }

  .action-btn {
    width: 100%;
    min-width: 100%;
    padding: 8px;
    font-size: 0.9rem;
    justify-content: flex-start;
  }
  
  .action-btn .material-icons-round {
    width: 24px;
  }

  .survey-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style> 
