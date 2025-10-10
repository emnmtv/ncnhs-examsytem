<template>
  <div class="subject-tasks">
    <div class="header-container">
      <div class="header-content">
        <div class="title-row">
          <button @click="goBack" class="back-btn">
            <span class="material-icons">arrow_back</span>
            Back
          </button>
          <h1>
            Subject Tasks
            <span class="material-icons">task</span>
          </h1>
        </div>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">View and manage tasks for {{ subject?.name }}</p>
        </div>
      </div>
      <div class="header-actions">
        <!-- View Toggle -->
        <div class="view-toggle">
          <button 
            @click="currentView = 'table'" 
            class="view-btn" 
            :class="{ active: currentView === 'table' }"
          >
            <span class="material-icons">table_chart</span>
          </button>
          <button 
            @click="currentView = 'card'" 
            class="view-btn" 
            :class="{ active: currentView === 'card' }"
          >
            <span class="material-icons">grid_view</span>
          </button>
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

    <!-- Tasks Header (Shared between views) -->
    <div v-else class="tasks-header">
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

    <!-- Card View -->
    <div v-if="currentView === 'card'" class="tasks-container">
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
    
    <!-- Table View -->
    <div v-if="currentView === 'table'" class="tasks-table-container">
      <table class="tasks-table">
        <thead>
          <tr>
            <th>Task Title</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Score</th>
            <th>Submissions</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in filteredTasks" :key="task.id">
            <td>
              <div class="task-title-cell">
                <span class="task-title">{{ task.title }}</span>
              </div>
            </td>
            <td>
              <span :class="['task-status-badge', getTaskStatus(task)]">
                {{ formatTaskStatus(task) }}
              </span>
            </td>
            <td>
              <div class="due-date-cell">
                <span class="due-date">{{ formatDate(task.dueDate) }}</span>
              </div>
            </td>
            <td>
              <div class="score-cell">
                <span class="score-badge">{{ task.totalScore }} pts</span>
              </div>
            </td>
            <td>
              <div class="submissions-cell">
                <span class="submissions-count">{{ task.submissions?.length || 0 }}</span>
              </div>
            </td>
            <td>
              <div class="description-cell">
                <span class="task-description">{{ task.description || 'No description' }}</span>
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <button 
                  class="action-btn view"
                  @click="viewSubmissions(task)"
                  title="View Submissions"
                >
                  <span class="material-icons">assignment_turned_in</span>
                </button>
                <button 
                  class="action-btn edit"
                  @click="editTask(task)"
                  title="Edit Task"
                >
                  <span class="material-icons">edit</span>
                </button>
                <button 
                  class="action-btn delete"
                  @click="deleteTask(task)"
                  title="Delete Task"
                >
                  <span class="material-icons">delete</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
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
const currentView = ref('table'); // Default to table view

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

// Go back function
const goBack = () => {
  router.go(-1);
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

.title-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 1rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #e0e0e0;
  color: #333;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.back-btn .material-icons {
  font-size: 1.2rem;
}

.header-content h1 {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
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
  border: 2px solid #159750;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  color: #159750;
  background: transparent;
  position: relative;
  overflow: hidden;
}

.action-btn:hover {
  background: #159750;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(21, 151, 80, 0.3);
}

.action-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(21, 151, 80, 0.4);
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.action-btn:hover::before {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.action-btn:active::before {
  background: rgba(255, 255, 255, 0.3);
}

.action-btn .material-icons {
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.action-btn:hover .material-icons {
  animation: pulse 0.6s ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
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

/* Header Actions */
.header-actions {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

/* View Toggle Styles */
.view-toggle {
  display: flex;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 15px;
}

.view-btn {
  background: white;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.view-btn.active {
  background: #f0f7ff;
  color: #1976D2;
}

.view-btn:hover:not(.active) {
  background: #f5f5f5;
}

.view-btn .material-icons {
  font-size: 20px;
}

/* Table Styles */
.tasks-table-container {
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0.7; }
  to { opacity: 1; }
}

.tasks-table {
  width: 100%;
  border-collapse: collapse;
}

.tasks-table th {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  font-weight: 600;
  text-align: left;
  padding: 16px 12px;
  border-bottom: none;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  position: relative;
  user-select: none;
}

.tasks-table th:first-child {
  border-top-left-radius: 12px;
}

.tasks-table th:last-child {
  border-top-right-radius: 12px;
}

.tasks-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  color: #444;
  vertical-align: middle;
}

.tasks-table tbody tr {
  transition: all 0.2s ease;
}

.tasks-table tbody tr:hover {
  background-color: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Table Cell Styles */
.task-title-cell,
.due-date-cell,
.score-cell,
.submissions-cell,
.description-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-title {
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.task-status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.task-status-badge.active {
  background-color: #e8f5e9;
  color: #159750;
}

.task-status-badge.due-soon {
  background-color: #fff8e1;
  color: #ff8f00;
}

.task-status-badge.overdue {
  background-color: #ffebee;
  color: #d32f2f;
}

.due-date {
  font-size: 0.85rem;
  color: #666;
}

.score-badge {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
}

.submissions-count {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.task-description {
  font-size: 0.85rem;
  color: #666;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Action buttons in table */
.action-buttons {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 2px solid #159750;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #159750;
  font-size: 0.9rem;
  background: transparent;
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.action-btn:hover {
  background: #159750;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(21, 151, 80, 0.3);
  text-decoration: none;
}

.action-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(21, 151, 80, 0.4);
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.action-btn:hover::before {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.action-btn:active::before {
  background: rgba(255, 255, 255, 0.3);
}

.action-btn .material-icons {
  font-size: 18px;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.action-btn:hover .material-icons {
  animation: pulse 0.6s ease-in-out;
}

/* 150% DPI and High Resolution Screens */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .subject-tasks {
    padding: 1.6rem;
  }

  .header-content h1 {
    font-size: 2rem;
  }

  .header-content h1 .material-icons {
    font-size: 2rem;
  }

  .header-background {
    font-size: 6rem;
    right: 4rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .divider {
    margin: 1.2rem 0;
  }

  .title-row {
    gap: 16px;
  }

  .back-btn {
    padding: 8px 14px;
    font-size: 0.85rem;
  }

  .back-btn .material-icons {
    font-size: 1.1rem;
  }

  .tasks-header {
    margin-bottom: 1.6rem;
  }

  .search-box {
    padding: 0.6rem 0.8rem;
  }

  .search-box input {
    font-size: 0.9rem;
    width: 280px;
  }

  .create-btn {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }

  .tasks-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.2rem;
  }

  .task-header {
    padding: 16px;
  }

  .task-header h3 {
    font-size: 1.2rem;
  }

  .task-body {
    padding: 20px;
  }

  .task-info {
    gap: 16px;
  }

  .info-item {
    gap: 12px;
  }

  .info-label {
    font-size: 0.8rem;
  }

  .task-meta {
    gap: 0.8rem;
  }

  .meta-item {
    font-size: 0.8rem;
    padding: 3px 8px;
  }

  .task-actions {
    padding: 12px;
    gap: 6px;
  }

  .action-btn {
    padding: 8px;
    font-size: 0.85rem;
  }

  /* Table responsive styles */
  .tasks-table th,
  .tasks-table td {
    padding: 12px 10px;
    font-size: 0.85rem;
  }

  .tasks-table th {
    font-size: 0.8rem;
    padding: 14px 10px;
  }

  .task-title {
    font-size: 0.9rem;
  }

  .task-status-badge {
    font-size: 0.75rem;
    padding: 3px 6px;
  }

  .due-date {
    font-size: 0.8rem;
  }

  .score-badge {
    font-size: 0.75rem;
    padding: 3px 6px;
  }

  .submissions-count {
    font-size: 0.85rem;
  }

  .task-description {
    font-size: 0.8rem;
    max-width: 150px;
  }

  .action-btn {
    width: 28px;
    height: 28px;
    border-width: 1.5px;
  }

  .action-btn .material-icons {
    font-size: 16px;
  }
}

@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .subject-tasks {
    padding: 1.4rem;
  }

  .header-content h1 {
    font-size: 1.8rem;
  }

  .header-content h1 .material-icons {
    font-size: 1.8rem;
  }

  .header-background {
    font-size: 5rem;
    right: 3rem;
  }

  .subtitle {
    font-size: 0.95rem;
  }

  .divider {
    margin: 1rem 0;
  }

  .title-row {
    gap: 14px;
  }

  .back-btn {
    padding: 7px 12px;
    font-size: 0.8rem;
  }

  .back-btn .material-icons {
    font-size: 1rem;
  }

  .tasks-header {
    margin-bottom: 1.4rem;
  }

  .search-box {
    padding: 0.5rem 0.7rem;
  }

  .search-box input {
    font-size: 0.85rem;
    width: 260px;
  }

  .create-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .tasks-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1rem;
  }

  .task-header {
    padding: 14px;
  }

  .task-header h3 {
    font-size: 1.1rem;
  }

  .task-body {
    padding: 18px;
  }

  .task-info {
    gap: 14px;
  }

  .info-item {
    gap: 10px;
  }

  .info-label {
    font-size: 0.75rem;
  }

  .task-meta {
    gap: 0.7rem;
  }

  .meta-item {
    font-size: 0.75rem;
    padding: 2px 6px;
  }

  .task-actions {
    padding: 10px;
    gap: 5px;
  }

  .action-btn {
    padding: 7px;
    font-size: 0.8rem;
  }
}

@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .subject-tasks {
    padding: 1.2rem;
  }

  .header-content h1 {
    font-size: 1.6rem;
  }

  .header-content h1 .material-icons {
    font-size: 1.6rem;
  }

  .header-background {
    font-size: 4rem;
    right: 2rem;
  }

  .subtitle {
    font-size: 0.9rem;
  }

  .divider {
    margin: 0.8rem 0;
  }

  .title-row {
    gap: 12px;
  }

  .back-btn {
    padding: 6px 10px;
    font-size: 0.75rem;
  }

  .back-btn .material-icons {
    font-size: 0.9rem;
  }

  .tasks-header {
    margin-bottom: 1.2rem;
  }

  .search-box {
    padding: 0.4rem 0.6rem;
  }

  .search-box input {
    font-size: 0.8rem;
    width: 240px;
  }

  .create-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }

  .tasks-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 0.8rem;
  }

  .task-header {
    padding: 12px;
  }

  .task-header h3 {
    font-size: 1rem;
  }

  .task-body {
    padding: 16px;
  }

  .task-info {
    gap: 12px;
  }

  .info-item {
    gap: 8px;
  }

  .info-label {
    font-size: 0.7rem;
  }

  .task-meta {
    gap: 0.6rem;
  }

  .meta-item {
    font-size: 0.7rem;
    padding: 2px 5px;
  }

  .task-actions {
    padding: 8px;
    gap: 4px;
  }

  .action-btn {
    padding: 6px;
    font-size: 0.75rem;
  }
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

  .title-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .back-btn {
    align-self: flex-start;
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

  /* Table responsive styles for mobile */
  .tasks-table-container {
    display: none !important;
  }
  
  .tasks-container {
    display: block !important;
  }
}

/* Desktop: Show both views based on currentView state */
@media (min-width: 769px) {
  .tasks-container {
    display: block !important;
  }
  
  .tasks-table-container {
    display: block !important;
  }
}
</style>