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
          <div v-for="task in subjectTasks" 
               :key="task.id" 
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
                <div class="meta-item">
                  Due: {{ formatDate(task.dueDate) }}
                  <span class="exact-date">({{ formatExactDate(task.dueDate) }})</span>
                </div>
                <div class="meta-item" v-if="task.submission">
                  Submitted: {{ formatDate(task.submission.submittedAt) }}
                  <span class="exact-date">({{ formatExactDate(task.submission.submittedAt) }})</span>
                </div>
                <!-- Only show on-time status if there's a submission -->
                <div v-if="task.submission" class="status-badge" :class="getTimeStatus(task)">
                  {{ getTimeStatusText(task) }}
                </div>
              </div>
            </div>

            <div class="task-score">
              {{ task.submission?.score || 'Score Pending' }}
              <span v-if="task.submission?.score">/ {{ task.totalScore }}</span>
            </div>

            <div class="task-actions">
              <router-link 
                :to="`/student/tasks/${task.id}`"
                class="activity-btn"
              >
                Activity
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getStudentTasks } from '@/services/authService';
import { formatDistanceToNow } from 'date-fns';

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
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

const formatExactDate = (date) => {
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
  align-items: center;
  padding: 15px;  /* Reduced from 20px */
  border-bottom: 1px solid #eee;
  transition: all 0.3s;
  gap: 12px;  /* Added consistent gap */
}

.task-item:hover {
  background: #f8f9fa;
}

.task-item:last-child {
  border-bottom: none;
}

.task-status {
  margin-right: 12px;  /* Reduced from 20px */
}

.task-status .material-icons-round {
  font-size: 28px;
  border-radius: 50%;
  padding: 8px;
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
}

.task-title {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 8px;
  color: #202124;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  font-size: 0.9rem;
  color: #5f6368;
  margin-top: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
}

.status-badge {
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.status-badge.on-time {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.late {
  background: #ffebee;
  color: #d32f2f;
}

.due-date, .date-submitted {
  padding: 0;
  background: none;
  border-radius: 0;
}

.task-score {
  margin: 0 12px;  /* Reduced from 20px */
  padding: 6px 12px;  /* Reduced from 8px 16px */
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
  padding: 8px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
    padding: 5px;  /* Further reduced padding */
  }

  .task-item {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    padding: 10px;  /* Reduced padding */
    gap: 8px;
  }
  
  .task-status {
    margin-right: 6px;
  }

  .task-content {
    flex: 1;
    min-width: 0; 
  }
  
  .task-meta {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 2px;
    font-size: 0.8rem;
    
  }
  
  .meta-item {
    font-size: 0.8rem;
  }
  
  .status-badge {
    font-size: 0.8rem;
    padding: 1px 6px;
  }
  
  .due-date, .date-submitted {
    font-size: 0.8rem;
    padding: 2px 6px;  /* Reduced padding */
  }
  
  .task-score {
    white-space: nowrap;
    margin: 0 6px;
    padding: 2px 8px;
    font-size: 0.9rem;
  }
  
  .activity-btn {
    white-space: nowrap;
    padding: 4px 10px;
    min-width: 80px;  /* Added minimum width */
    justify-content: center;
    font-size: 0.9rem;
  }

  .header-background {
  position: absolute;
  top: 30%;
  right: 0.3rem;

  font-size: 4rem;
  font-weight: 900;

  }

  .exact-date {
    display: none; /* Hide exact dates on mobile */
  }

  /* Adjust subject header padding */
  .subject-header {
    padding: 12px 15px;  /* Reduced from 20px */
  }

  /* Adjust subject section margin */
  .subject-section {
    margin-bottom: 15px;  /* Reduced from 30px */
  }
}

@media (max-width: 480px) {
  .task-meta {
    font-size: 0.75rem;
  }

  .task-score {
    font-size: 0.8rem;
  }

  .task-item {
    padding: 8px;  /* Even smaller padding for very small screens */
  }
  
  .task-status .material-icons-round {
    font-size: 24px;  /* Slightly smaller icons */
    padding: 6px;
  }
}

/* Add these new styles */
.exact-date {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-left: 0.25rem;
}
</style>