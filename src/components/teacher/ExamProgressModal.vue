<template>
  <div class="progress-modal">
    <div class="stats-cards">
      <div class="stat-card">
        <span class="material-icons-round">people</span>
        <div class="stat-content">
          <h3>Active Students</h3>
          <p class="stat-value">{{ activeStudents.length }}</p>
        </div>
      </div>
      <div class="stat-card">
        <span class="material-icons-round">task_alt</span>
        <div class="stat-content">
          <h3>Completed</h3>
          <p class="stat-value">{{ completedStudents.length }}</p>
        </div>
      </div>
    </div>

    <div class="progress-list">
      <div v-for="student in studentProgressArray" :key="student.userId" class="progress-item">
        <div class="student-info">
          <div class="avatar" :style="{ backgroundColor: getAvatarColor(student.userName) }">
            {{ getInitials(student.userName) }}
          </div>
          <div class="student-details">
            <span class="student-name">{{ student.userName }}</span>
            <div class="progress-stats">
              <span class="questions-count">
                <span class="material-icons-round">quiz</span>
                {{ student.answeredQuestions }}/{{ student.totalQuestions }}
              </span>
              <span class="percentage" :class="getProgressClass(student.progressPercentage)">
                {{ student.progressPercentage }}%
              </span>
            </div>
          </div>
        </div>

        <div class="progress-bar-wrapper">
          <div class="progress-track">
            <div 
              class="progress-fill" 
              :style="{ width: `${student.progressPercentage}%` }"
              :class="getProgressClass(student.progressPercentage)"
            ></div>
          </div>
        </div>
      </div>

      <div v-if="!studentProgressArray.length" class="no-students">
        <span class="material-icons-round">person_off</span>
        <p>No students have started the exam yet</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  props: {
    testCode: {
      type: String,
      required: true
    }
  },

  setup() {
    const studentProgress = ref({});
    const colors = [
      '#4CAF50', '#2196F3', '#FF9800', '#E91E63', 
      '#9C27B0', '#009688', '#673AB7', '#F44336'
    ];

    const studentProgressArray = computed(() => Object.values(studentProgress.value));

    const activeStudents = computed(() => 
      studentProgressArray.value.filter(s => s.progressPercentage < 100)
    );

    const completedStudents = computed(() => 
      studentProgressArray.value.filter(s => s.progressPercentage === 100)
    );

    const updateStudentProgress = (progressData) => {
      studentProgress.value = {
        ...studentProgress.value,
        [progressData.userId]: progressData
      };
    };

    const getInitials = (name) => {
      if (!name) return '?';
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    };

    const getAvatarColor = (name) => {
      if (!name) return colors[0];
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % colors.length;
      return colors[index];
    };

    const getProgressClass = (percentage) => {
      if (percentage === 100) return 'completed';
      if (percentage >= 75) return 'good';
      if (percentage >= 50) return 'medium';
      return 'low';
    };

    return {
      studentProgressArray,
      activeStudents,
      completedStudents,
      updateStudentProgress,
      getInitials,
      getAvatarColor,
      getProgressClass
    };
  }
};
</script>

<style scoped>
.progress-modal {
  background: #fff;
  border-radius: 16px;
  padding: 1.5rem;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.stat-card .material-icons-round {
  font-size: 2rem;
  color: #4f46e5;
  background: #eef2ff;
  padding: 12px;
  border-radius: 12px;
}

.stat-content h3 {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-item {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
}

.progress-item:hover {
  background: #f1f5f9;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 250px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.student-details {
  flex: 1;
}

.student-name {
  font-weight: 600;
  color: #1e293b;
  display: block;
  margin-bottom: 0.25rem;
}

.progress-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
}

.questions-count {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #64748b;
}

.questions-count .material-icons-round {
  font-size: 1rem;
}

.percentage {
  font-weight: 600;
}

.percentage.completed { color: #059669; }
.percentage.good { color: #0891b2; }
.percentage.medium { color: #d97706; }
.percentage.low { color: #dc2626; }

.progress-bar-wrapper {
  flex: 1;
}

.progress-track {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.completed { background: #059669; }
.progress-fill.good { background: #0891b2; }
.progress-fill.medium { background: #d97706; }
.progress-fill.low { background: #dc2626; }

.no-students {
  text-align: center;
  padding: 3rem 1rem;
  color: #64748b;
}

.no-students .material-icons-round {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .progress-modal {
    padding: 1rem;
  }

  .progress-item {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .student-info {
    min-width: unset;
  }

  .progress-stats {
    margin-top: 0.5rem;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }

  .student-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .progress-stats {
    justify-content: center;
  }
}
</style> 