<template>
  <div class="subject-tasks">
    <div class="header-container">
      <div class="header-content">
        <h1>
          Subject Tasks
          <span class="material-icons">task</span>
        </h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">View and manage tasks for {{ subject?.name }}</p>
        </div>
      </div>
      <div class="header-background">TASKS</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading tasks...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadTasks" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!tasks.length" class="empty-state">
      <span class="material-icons">assignment_late</span>
      <p>No tasks created yet</p>
      <router-link :to="`/create-task/${subjectId}`" class="create-btn">
        <span class="material-icons">add_task</span>
        Create New Task
      </router-link>
    </div>

    <!-- Tasks List -->
    <div v-else class="tasks-container">
      <div class="tasks-header">
        <div class="search-box">
          <span class="material-icons">search</span>
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Search tasks..."
          >
        </div>
        <router-link :to="`/create-task/${subjectId}`" class="create-btn">
          <span class="material-icons">add_task</span>
          Create New Task
        </router-link>
      </div>

      <div class="tasks-grid">
        <div v-for="task in filteredTasks" 
             :key="task.id" 
             class="task-card">
          <div class="task-header">
            <div class="texture-layer"></div>
            <h3>{{ task.title }}</h3>
            <span :class="['task-status', getTaskStatus(task)]">
              {{ formatTaskStatus(task) }}
            </span>
            <div class="task-meta">
              <div class="meta-item">
                <span class="material-icons">event</span>
                Due: {{ formatDate(task.dueDate) }}
              </div>
              <div class="meta-item">
                <span class="material-icons">stars</span>
                Score: {{ task.totalScore }} points
              </div>
              <div class="meta-item">
                <span class="material-icons">group</span>
                {{ task.submissions?.length || 0 }} submissions
              </div>
            </div>
          </div>

          <div class="task-body">
            <div class="task-info">
              <div class="info-item">
                <span class="material-icons-round">description</span>
                <div class="info-content">
                  <span class="info-label">Description</span>
                  <p>{{ task.description || 'No description provided' }}</p>
                </div>
              </div>

              <div v-if="task.fileUrl" class="info-item">
                <span class="material-icons-round">attachment</span>
                <div class="info-content">
                  <span class="info-label">Attachment</span>
                  <a :href="getFullFileUrl(task.fileUrl)" 
                     target="_blank" 
                     class="attachment-link">
                    {{ task.fileName || 'View Attachment' }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="task-actions">
            <button @click="viewSubmissions(task)" class="action-btn view-btn">
              <span class="material-icons">assignment_turned_in</span>
              View Submissions
            </button>
            <button @click="editTask(task)" class="action-btn edit-btn">
              <span class="material-icons">edit</span>
              Edit
            </button>
            <button @click="deleteTask(task)" class="action-btn delete-btn">
              <span class="material-icons">delete</span>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getSubjectTasks, getBaseApiUrl, deleteSubjectTask } from '@/services/authService';

const route = useRoute();
const router = useRouter();
const subjectId = parseInt(route.params.subjectId);
const subject = ref(null);
const tasks = ref([]);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref('');

// Filter tasks based on search
const filteredTasks = computed(() => {
  if (!searchQuery.value) return tasks.value;
  
  const search = searchQuery.value.toLowerCase();
  return tasks.value.filter(task => 
    task.title.toLowerCase().includes(search) || 
    (task.description && task.description.toLowerCase().includes(search))
  );
});

// Load tasks for the subject
const loadTasks = async () => {
  try {
    loading.value = true;
    error.value = null;
    const data = await getSubjectTasks(subjectId);
    tasks.value = data.tasks || [];
    subject.value = data.subject;
  } catch (err) {
    error.value = 'Failed to load tasks. Please try again.';
    console.error('Error loading tasks:', err);
  } finally {
    loading.value = false;
  }
};

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Get task status
const getTaskStatus = (task) => {
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  
  if (now > dueDate) return 'overdue';
  if (now.getTime() + (24 * 60 * 60 * 1000) > dueDate.getTime()) return 'due-soon';
  return 'active';
};

// Format task status for display
const formatTaskStatus = (task) => {
  const status = getTaskStatus(task);
  switch (status) {
    case 'overdue': return 'Overdue';
    case 'due-soon': return 'Due Soon';
    default: return 'Active';
  }
};

// Action handlers
const viewSubmissions = (task) => {
  router.push(`/subject/${subjectId}/task/${task.id}/submissions`);
};


const editTask = (task) => {
  router.push(`/edit-task/${task.id}`);
};

const deleteTask = async (task) => {
  if (!confirm(`Are you sure you want to delete the task "${task.title}"? This action cannot be undone.`)) {
    return;
  }
  
  try {
    loading.value = true;
    await deleteSubjectTask(task.id);
    
    // Remove the task from the list
    tasks.value = tasks.value.filter(t => t.id !== task.id);
    
    // Show success message
    alert('Task deleted successfully');
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Failed to delete task. Please try again.');
  } finally {
    loading.value = false;
  }
};

// Add this function to get the full file URL
const getFullFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  
  // If the URL already starts with http, return it as is
  if (fileUrl.startsWith('http')) {
    return fileUrl;
  }
  
  // Otherwise, prepend the base API URL
  // Remove the leading slash if it exists
  const cleanUrl = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
  return `${getBaseApiUrl()}/${cleanUrl}`;
};


onMounted(() => {
  loadTasks();
});
</script>

<style scoped>
.subject-tasks {
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
  gap: 12px;
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
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

.tasks-container {
  margin-top: 2rem;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid #f0f0f0;
}

.search-box input {
  border: none;
  outline: none;
  font-size: 1rem;
  width: 300px;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #159750;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.create-btn:hover {
  background: #107040;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.task-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(0,0,0,0.08);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.task-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.12);
}

.task-header {
  background: linear-gradient(135deg, #1aac5a 0%, #159750 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
  color: white;
}

/* Main paint swipe */
.task-header::after {
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
.task-header::before {
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

/* Hover animations */
.task-header:hover::after {
  transform: skewX(-20deg) translateX(10px);
  transition: transform 0.3s ease;
}

.task-header:hover::before {
  transform: skewX(-35deg) translateX(-10px);
  transition: transform 0.3s ease;
}

.texture-layer {
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

.task-header h3 {
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  position: relative;
  z-index: 1;
}

.task-body {
  padding: 25px;
  flex: 1;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 0.85rem;
  color: #757575;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  margin-bottom: 8px;
  display: block;
}

/* Status badges */
.task-status {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 10px;
}

.task-status.active {
  background-color: #e8f5e9;
  color: #159750;
}

.task-status.due-soon {
  background-color: #fff8e1;
  color: #ff8f00;
}

.task-status.overdue {
  background-color: #ffebee;
  color: #d32f2f;
}

.task-description {
  color: #666;
  margin-bottom: 1rem;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
}

.task-attachment {
  margin-top: 1rem;
}

.attachment-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #159750;
  background-color: #e8f5e9;
  padding: 8px 12px;
  border-radius: 6px;
  text-decoration: none;
  transition: all 0.2s;
  font-weight: 500;
}

.attachment-link:hover {
  background-color: #c8e6c9;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.task-actions {
  padding: 15px;
  background: #f9f9f9;
  display: flex;
  gap: 8px;
  border-top: 1px solid #eee;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s;
  color: white;
}

.view-btn {
  background: #159750;
  color: white;
}

.view-btn:hover {
  background: #107040;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.edit-btn {
  background: #2196F3;
  color: white;
}

.edit-btn:hover {
  background: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.delete-btn {
  background: #f44336;
  color: white;
}

.delete-btn:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

/* Loading, Error, and Empty States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  padding: 2rem;
}

.loading-state .material-icons-round,
.error-state .material-icons-round,
.empty-state .material-icons {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-state .material-icons-round {
  color: #159750;
  animation: rotate 2s linear infinite;
}

.error-state .material-icons-round {
  color: #f44336;
}

.empty-state .material-icons {
  color: #9e9e9e;
}

.retry-btn {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #159750;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.retry-btn:hover {
  background: #107040;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .subject-tasks {
    padding: 10px;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-background {
    font-size: 3rem;
    top: 60%;
    right: 1rem;
  }
  
  .divider {
    margin: 1rem 0;
  }
  
  .tasks-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .search-box {
    width: 100%;
  }
  
  .search-box input {
    width: 100%;
  }
  
  .create-btn {
    width: 100%;
    justify-content: center;
  }
  
  .tasks-grid {
    grid-template-columns: 1fr;
  }
  
  .task-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .task-meta {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>