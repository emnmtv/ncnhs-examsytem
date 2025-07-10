<template>
  <div class="student-tasks">
    <div class="header-container">
      <div class="header-content">
        <h1>Task List <span class="material-icons">assignment</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">List of complete and pending activities</p>
        </div>
      </div>
      <div class="header-background">TASKS</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading tasks...</p>
    </div>

    <!-- Tasks List -->
    <div v-else class="tasks-list">
      <!-- Group tasks by subject -->
      <div v-for="(subjectTasks, subject) in groupedTasks" 
           :key="subject" 
           class="subject-section">
        <div class="subject-header">
          {{ subject }}
        </div>

        <div class="tasks">
          <router-link 
            v-for="task in subjectTasks" 
            :key="task.id" 
            :to="`/student/tasks/${task.id}`"
            class="task-item">
            <div class="task-status">
              <span class="material-icons-round" 
                    :class="getTaskStatus(task)">
                {{ getStatusIcon(task) }}
              </span>
            </div>
            
            <div class="task-content">
              <div class="task-title">{{ task.title }}</div>
              <div class="task-meta">
                <div class="meta-row">
                  <div class="meta-label">Due Date:</div>
                  <div class="meta-value">{{ formatDate(task.dueDate) }}</div>
                </div>
                <div class="meta-row" v-if="task.submission">
                  <div class="meta-label">Date Submitted:</div>
                  <div class="meta-value">{{ formatDate(task.submission.submittedAt) }}</div>
                </div>
                <!-- Add placeholder when no submission -->
                <div class="meta-row placeholder" v-if="!task.submission">
                  <div class="meta-value">&nbsp;</div>
                </div>
                <!-- Only show on-time status if there's a submission -->
                <div v-if="task.submission" class="status-badge" :class="getTimeStatus(task)">
                  {{ getTimeStatusText(task) }}
                </div>
              </div>
            </div>

            <div class="task-info">
              <div class="task-score">
                {{ task.submission?.score || 'Score Pending' }}
                <span v-if="task.submission?.score">/ {{ task.totalScore }}</span>
              </div>
            </div>

            <div class="task-actions">
              <span class="activity-btn">
                Activity
              </span>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getStudentTasks } from '@/services/authService';

const tasks = ref([]);
const loading = ref(true);

// Group tasks by subject
const groupedTasks = computed(() => {
  const groups = {};
  tasks.value.forEach(task => {
    const subjectName = task.subject.name;
    if (!groups[subjectName]) {
      groups[subjectName] = [];
    }
    groups[subjectName].push(task);
  });
  return groups;
});

onMounted(() => {
  loadTasks();
});

const loadTasks = async () => {
  try {
    loading.value = true;
    tasks.value = await getStudentTasks();
  } catch (err) {
    console.error('Error loading tasks:', err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getTaskStatus = (task) => {
  if (task.submission) return 'completed';
  if (new Date(task.dueDate) < new Date()) return 'overdue';
  return 'pending';
};

const getStatusIcon = (task) => {
  const status = getTaskStatus(task);
  return {
    completed: 'check_circle',
    overdue: 'error',
    pending: 'pending'
  }[status];
};

const getTimeStatus = (task) => {
  if (!task.submission) return '';
  const submitted = new Date(task.submission.submittedAt);
  const due = new Date(task.dueDate);
  return submitted <= due ? 'on-time' : 'late';
};

const getTimeStatusText = (task) => {
  if (!task.submission) return '';
  return getTimeStatus(task) === 'on-time' ? 'On Time' : 'Late';
};
</script>

<style scoped>
.student-tasks {
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
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.tasks-list {
  padding: 10px;  /* Reduced from 20px */
}

.subject-section {
  margin-bottom: 30px;
  background: white;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12),
              0 4px 16px -2px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.subject-section:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.subject-header {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  padding: 20px;
  font-weight: 500;
  font-size: 1.2rem;
  position: relative;
  overflow: hidden;
}

/* Main paint swipe */
.subject-header::after {
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
.subject-header::before {
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

.task-item {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  border-bottom: 1px solid #eee;
  transition: all 0.3s;
  position: relative;
  min-height: 80px; /* Add minimum height to task items */
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.task-item:hover {
  background: #f8f9fa;
}

.task-item:last-child {
  border-bottom: none;
}

.task-status {
  margin-right: 12px;
}

.task-status .material-icons-round {
  font-size: 24px;
  border-radius: 50%;
  padding: 4px;
  transition: all 0.3s;
}

.task-status .completed {
  color: #4caf50;
  background: #e8f5e9;
}

.task-status .overdue {
  color: #f44336;
  background: #ffebee;
}

.task-status .pending {
  color: #ffc107;
  background: #fff8e1;
}

.task-content {
  flex: 1;
  margin-right: 100px; /* Space for the score and actions */
}

.task-title {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 5px;
  color: #202124;
}

.task-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 0.9rem;
  color: #5f6368;
}

.meta-row {
  display: flex;
  align-items: center;
}

.meta-label {
  font-weight: 500;
  margin-right: 5px;
}

.meta-value {
  color: #666;
}

.status-badge {
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  align-self: flex-start;
  margin-top: 3px;
}

.status-badge.on-time {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.late {
  background: #ffebee;
  color: #d32f2f;
}

.task-info {
  position: absolute;
  right: 15px;
  top: 15px; /* Position at the top instead of middle */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.task-score {
  padding: 6px 12px;
  font-weight: 500;
  color: #202124;
  background: #e3f2fd;
  border-radius: 20px;
  min-width: 80px;
  text-align: center;
}

.activity-btn {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  pointer-events: none; /* Prevent clicks on the button itself */
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-state .material-icons-round {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #159750;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .student-tasks {
    padding: 0rem;
  }

  .tasks-list {
    padding: 5px;
  }

  .task-item {
    padding: 10px;
  }
  
  .task-content {
    margin-right: 85px; /* Adjusted for mobile */
  }
  
  .task-meta {
    gap: 2px;
    font-size: 0.8rem;
  }
  
  .status-badge {
    font-size: 0.8rem;
    padding: 1px 6px;
  }
  
  .task-score {
    padding: 3px 8px;
    font-size: 0.8rem;
    min-width: 70px;
  }
  
  .activity-btn {
    padding: 4px 10px;
    font-size: 0.9rem;
    margin-top: 5px;
  }

  .task-info {
    right: 10px;
    top: 10px;
  }

  .header-background {
    position: absolute;
    top: 30%;
    right: 0.3rem;
    font-size: 4rem;
    font-weight: 900;
  }

  .task-status {
    margin-right: 6px;
  }

  /* Adjust subject header padding */
  .subject-header {
    padding: 12px 15px;
  }

  /* Adjust subject section margin */
  .subject-section {
    margin-bottom: 15px;
  }
  
  .task-actions {
    right: 10px;
    bottom: 10px;
  }
}

/* Add styles for very small screens like iPhone SE */
@media (max-width: 375px) {
  .task-item {
    padding: 8px 6px;
    position: relative;
  }
  
  .task-content {
    margin-right: 70px; /* Even smaller margin for iPhone SE */
  }
  
  .task-title {
    font-size: 0.95rem;
  }
  
  .task-meta {
    gap: 0px;
    font-size: 0.75rem;
  }
  
  .meta-row {
    margin-bottom: 2px;
  }
  
  .task-score {
    padding: 2px 6px;
    font-size: 0.75rem;
    min-width: 60px;
  }
  
  .activity-btn {
    padding: 3px 8px;
    font-size: 0.8rem;
    border-radius: 4px;
  }
  
  .task-status .material-icons-round {
    font-size: 20px;
    padding: 3px;
  }
  
  .task-info {
    right: 6px;
    top: 6px;
  }
  
  .task-actions {
    right: 6px;
    bottom: 6px;
  }
  
  .status-badge {
    font-size: 0.7rem;
    padding: 1px 4px;
  }
}

/* Add medium-small screen styles (between iPhone SE and regular mobile) */
@media (min-width: 376px) and (max-width: 480px) {
  .task-item {
    padding: 8px;
    position: relative;
  }
  
  .task-content {
    margin-right: 75px;
  }
  
  .task-meta {
    font-size: 0.78rem;
  }
  
  .task-score {
    padding: 2px 8px;
    font-size: 0.78rem;
    min-width: 65px;
  }
  
  .activity-btn {
    padding: 3px 10px;
    font-size: 0.85rem;
    border-radius: 5px;
  }
  
  .task-status .material-icons-round {
    font-size: 22px;
    padding: 4px;
  }
  
  .task-info {
    right: 8px;
    top: 8px;
  }
  
  .task-actions {
    right: 8px;
    bottom: 8px;
  }
}

/* Add these new styles */
.exact-date {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-left: 0.25rem;
}

.task-actions {
  position: absolute;
  right: 15px;
  bottom: 15px;
}

.meta-row.placeholder {
  height: 24px; /* Increase placeholder height */
  margin-bottom: 5px;
}

/* Add active state for touch feedback */
.task-item:active {
  background-color: #e9f5ff;
  transform: scale(0.995);
}
</style>