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
  height: 100px;
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
  transition: height 0.3s ease, padding 0.3s ease;
}

.left-section, .right-section {
  display: flex;
  align-items: center;
}

.datetime {
  display: flex;
  align-items: center;
  font-size: 26px;
  color: #666;
  gap: 8px;
  font-weight: 500;
  transition: font-size 0.3s ease;
}

.clock-icon {
  display: flex;
  align-items: center;
  color: #19a759;
}

.clock-icon .material-icons {
  font-size: 18px;
  transition: font-size 0.3s ease;
}

/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .top-bar {
    height: 85px;
    padding: 0 18px;
  }
  
  .datetime {
    font-size: 24px;
  }
  
  .clock-icon .material-icons {
    font-size: 16px;
  }
}

/* Compact layout for 14-inch laptops and lower resolutions */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .top-bar {
    height: 75px;
    padding: 0 16px;
  }
  
  .datetime {
    font-size: 20px;
    gap: 6px;
  }
  
  .clock-icon .material-icons {
    font-size: 15px;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .top-bar {
    height: 65px;
    padding: 0 14px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
  }
  
  .datetime {
    font-size: 18px;
    gap: 5px;
  }
  
  .clock-icon .material-icons {
    font-size: 14px;
  }
}

/* For tablet screens */
@media (max-width: 1024px) and (min-width: 769px) {
  .top-bar {
    height: 60px;
    padding: 0 12px;
  }
  
  .datetime {
    font-size: 16px;
    gap: 4px;
  }
  
  .clock-icon .material-icons {
    font-size: 13px;
  }
}

/* For mobile screens */
@media (max-width: 768px) {
  .top-bar {
    height: 50px;
    padding: 0 12px 0 56px; /* Add space for mobile menu button */
  }
  
  .datetime {
    font-size: 12px;
    gap: 3px;
  }
  
  .clock-icon .material-icons {
    font-size: 12px;
  }
}
</style> 