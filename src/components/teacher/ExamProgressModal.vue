<template>
  <div class="progress-modal">
    <div class="modal-header">
      <h2>Student Progress</h2>
      <div class="summary">
        <span>{{ activeStudents.length }} Students Active</span>
        <span>{{ completedStudents.length }} Completed</span>
      </div>
    </div>

    <div class="progress-list">
      <div v-for="student in studentProgressArray" :key="student.userId" class="progress-item">
        <div class="student-info">
          <div class="avatar" :style="{ backgroundColor: getAvatarColor(student.userName) }">
            {{ getInitials(student.userName) }}
          </div>
          <span class="student-name">{{ student.userName }}</span>
        </div>

        <div class="progress-details">
          <div class="progress-bar-container">
            <div 
              class="progress-bar" 
              :style="{ width: `${student.progressPercentage}%` }"
              :class="{ 'completed': student.progressPercentage === 100 }"
            ></div>
          </div>
          <div class="progress-stats">
            <span>{{ student.answeredQuestions }}/{{ student.totalQuestions }}</span>
            <span>{{ student.progressPercentage }}%</span>
          </div>
        </div>
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

    return {
      studentProgressArray,
      activeStudents,
      completedStudents,
      updateStudentProgress,
      getInitials,
      getAvatarColor
    };
  }
};
</script>

<style scoped>
.progress-modal {
  background: white;
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h2 {
  font-size: 1.5rem;
  color: #2c3e50;
  margin: 0;
}

.summary {
  display: flex;
  gap: 16px;
}

.summary span {
  padding: 6px 12px;
  border-radius: 20px;
  background: #f1f5f9;
  font-size: 0.9rem;
  color: #64748b;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1rem;
}

.student-name {
  font-weight: 500;
  color: #334155;
}

.progress-details {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.progress-bar-container {
  flex: 1;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.progress-bar.completed {
  background: #10b981;
}

.progress-stats {
  display: flex;
  gap: 12px;
  font-size: 0.9rem;
  color: #64748b;
}
</style> 