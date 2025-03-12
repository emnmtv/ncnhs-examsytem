<template>
  <div class="survey-list-container">
    <div class="header">
      <h1>My Surveys</h1>
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
          <h3>{{ survey.title }}</h3>
          <div class="status-badge" :class="{ active: survey.isActive }">
            {{ survey.isActive ? 'Active' : 'Inactive' }}
          </div>
        </div>

        <div class="survey-details">
          <p v-if="survey.description" class="description">{{ survey.description }}</p>
          <div class="meta-info">
            <p>
              <span class="material-icons-round">code</span>
              Code: <strong>{{ survey.code }}</strong>
            </p>
            <p>
              <span class="material-icons-round">question_answer</span>
              Questions: {{ survey.questions.length }}
            </p>
            <p>
              <span class="material-icons-round">people</span>
              Responses: {{ survey.responses.length }}
            </p>
            <p>
              <span class="material-icons-round">calendar_today</span>
              Created: {{ formatDate(survey.createdAt) }}
            </p>
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  color: #333;
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
}

.surveys-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.survey-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.survey-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.15);
}

.survey-header {
  padding: 1.5rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.survey-header h3 {
  font-size: 1.25rem;
  color: #333;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge:not(.active) {
  background: #ffebee;
  color: #c62828;
}

.survey-details {
  padding: 1.5rem;
  flex: 1;
}

.description {
  color: #666;
  margin-bottom: 1rem;
}

.meta-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.meta-info p {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: #666;
}

.meta-info .material-icons-round {
  font-size: 20px;
  color: #9e9e9e;
}

.survey-actions {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #eee;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1 1 calc(50% - 0.375rem);
  padding: 8px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  min-width: 120px;
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
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.loading-state .material-icons-round,
.error-state .material-icons-round,
.empty-state .material-icons-round {
  font-size: 3rem;
  color: #9e9e9e;
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

@media (max-width: 1200px) {
  .surveys-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .create-btn {
    width: 100%;
    justify-content: center;
  }

  .surveys-grid {
    grid-template-columns: 1fr;
  }

  .survey-actions {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .action-btn {
    flex: 1 1 calc(50% - 0.25rem);
    min-width: 140px;
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .survey-actions {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    flex: 1 1 100%;
  }

  .meta-info {
    grid-template-columns: 1fr;
  }

  .survey-header {
    flex-direction: column;
    align-items: stretch;
  }

  .status-badge {
    align-self: flex-start;
  }
}
</style> 
