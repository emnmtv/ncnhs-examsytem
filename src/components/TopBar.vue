<template>
  <div class="top-bar">
    <div class="left-section">
      <!-- Left section - could add breadcrumbs or page title here -->
    </div>
    <div class="right-section">
      <div class="datetime">
        <div class="clock-icon">
          <span class="material-icons">schedule</span>
        </div>
        <span>{{ formattedDateTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const currentDateTime = ref(new Date());
const formattedDateTime = ref('');
let timerInterval = null;

// Format date and time
const updateDateTime = () => {
  const date = currentDateTime.value;
  
  // Options for date formatting
  const dateOptions = { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  };
  
  // Options for time formatting
  const timeOptions = { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  };
  
  const dateStr = date.toLocaleDateString('en-US', dateOptions);
  const timeStr = date.toLocaleTimeString('en-US', timeOptions);
  
  formattedDateTime.value = `${dateStr}, ${timeStr}`;
};

onMounted(() => {
  // Initial update
  updateDateTime();
  
  // Update every minute
  timerInterval = setInterval(() => {
    currentDateTime.value = new Date();
    updateDateTime();
  }, 60000); // 60 seconds
});

onBeforeUnmount(() => {
  // Clean up interval when component is unmounted
  if (timerInterval) clearInterval(timerInterval);
});
</script>

<style scoped>
.top-bar {
  height: 80px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 99;
}

.left-section, .right-section {
  display: flex;
  align-items: center;
}

.datetime {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
  gap: 8px;
}

.clock-icon {
  display: flex;
  align-items: center;
  color: #19a759;
}

.clock-icon .material-icons {
  font-size: 18px;
}

/* For mobile screens */
@media (max-width: 768px) {
  .top-bar {
    padding: 0 12px 0 56px; /* Add space for mobile menu button */
  }
  
  .datetime {
    font-size: 12px;
  }
}
</style> 