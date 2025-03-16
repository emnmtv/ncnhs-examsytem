<template>
  <div class="active-users-monitor" :key="componentKey">
    <div class="page-header">
      <h1>Active Users Monitor</h1>
      <div class="header-actions">
        <!-- <button @click="refreshUsers" class="refresh-btn">
          <span class="material-icons">refresh</span> Refresh
        </button> -->
      </div>
    </div>

    <div class="filters-section">
      <div class="search-box">
        <span class="material-icons">search</span>
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search users..."
        />
      </div>

      <div class="tabs">
        <button 
          v-for="tab in ['all', 'students', 'teachers', 'admins']"
          :key="tab"
          :class="['tab-btn', { active: activeTab === tab }]"
          @click="activeTab = tab"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>

      <div class="filter-group" v-if="activeTab === 'students'">
        <select v-model="filters.gradeLevel">
          <option value="">All Grades</option>
          <option v-for="grade in filterOptions.grades" :key="grade" :value="grade">
            Grade {{ grade }}
          </option>
        </select>
        <select v-model="filters.section">
          <option value="">All Sections</option>
          <option v-for="section in filterOptions.sections" :key="section" :value="section">
            {{ section }}
          </option>
        </select>
      </div>
    </div>

    <div class="view-controls">
      <button 
        class="view-toggle-btn" 
        :class="{ active: viewMode === 'grid' }"
        @click="viewMode = 'grid'"
      >
        <span class="material-icons">grid_view</span>
        Grid View
      </button>
      <button 
        class="view-toggle-btn" 
        :class="{ active: viewMode === 'table' }"
        @click="viewMode = 'table'"
      >
        <span class="material-icons">table_rows</span>
        Table View
      </button>
    </div>

    <div class="users-list">
      <div v-if="filteredUsers.length === 0" class="empty-state">
        <span class="material-icons">person_off</span>
        <p>No active users found</p>
      </div>

      <!-- Grid View -->
      <div v-else-if="viewMode === 'grid'" class="users-grid">
        <div v-for="user in filteredUsers" :key="user.id" class="user-card">
          <div class="user-avatar" :class="user.role">
            {{ user.firstName[0] }}{{ user.lastName[0] }}
          </div>
          <div class="user-info">
            <h3>{{ user.firstName }} {{ user.lastName }}</h3>
            <p class="email">{{ user.email }}</p>
            <div class="details">
              <span class="role-badge" :class="user.role">
                {{ user.role.charAt(0).toUpperCase() + user.role.slice(1) }}
              </span>
              
              <template v-if="user.role === 'student'">
                <span class="detail-item">
                  <span class="material-icons">school</span>
                  Grade {{ user.gradeLevel || 'N/A' }}
                </span>
                <span class="detail-item">
                  <span class="material-icons">groups</span>
                  {{ user.section || 'N/A' }}
                </span>
              </template>
              
              <template v-if="user.role === 'teacher'">
                <span class="detail-item">
                  <span class="material-icons">business</span>
                  {{ user.department || 'N/A' }}
                </span>
                <span class="detail-item">
                  <span class="material-icons">book</span>
                  {{ user.domain || 'N/A' }}
                </span>
              </template>
            </div>
            <div class="activity-info">
              <span class="activity-indicator active"></span>
              <span class="last-active">
                Active {{ formatLastActive(user.lastActive) }}
              </span>
            </div>
            <div v-if="user.inExam" class="exam-indicator">
              <span class="material-icons">assignment</span>
              <span>In Exam: {{ user.examCode || 'Unknown' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div v-else class="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th v-if="activeTab === 'all' || activeTab === 'students'">Grade</th>
              <th v-if="activeTab === 'all' || activeTab === 'students'">Section</th>
              <th v-if="activeTab === 'all' || activeTab === 'teachers'">Department</th>
              <th v-if="activeTab === 'all' || activeTab === 'teachers'">Domain</th>
              <th>Last Active</th>
              <th>Exam Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td>{{ user.firstName }} {{ user.lastName }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="user.role">
                  {{ user.role.charAt(0).toUpperCase() + user.role.slice(1) }}
                </span>
              </td>
              <td v-if="activeTab === 'all' || activeTab === 'students'">
                {{ user.role === 'student' ? (user.gradeLevel || 'N/A') : '-' }}
              </td>
              <td v-if="activeTab === 'all' || activeTab === 'students'">
                {{ user.role === 'student' ? (user.section || 'N/A') : '-' }}
              </td>
              <td v-if="activeTab === 'all' || activeTab === 'teachers'">
                {{ user.role === 'teacher' ? (user.department || 'N/A') : '-' }}
              </td>
              <td v-if="activeTab === 'all' || activeTab === 'teachers'">
                {{ user.role === 'teacher' ? (user.domain || 'N/A') : '-' }}
              </td>
              <td>{{ formatLastActive(user.lastActive) }}</td>
              <td>
                <span v-if="user.inExam" class="exam-badge">
                  <span class="material-icons">assignment</span>
                  {{ user.examCode || 'Unknown' }}
                </span>
                <span v-else>-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import socketManager from '@/utils/socketManager';

// State
const activeUsers = ref([]);
const searchQuery = ref('');
const activeTab = ref('all');
const viewMode = ref('grid');
const filters = ref({
  gradeLevel: '',
  section: '',
});
const componentKey = ref(0);
const socket = ref(null);
const isConnected = ref(false);
const reconnectAttempts = ref(0);
const MAX_RECONNECT_ATTEMPTS = 5;
const reconnectTimer = ref(null);

// Add this function to handle user removal
const removeUser = (userId) => {
  console.log(`Removing user ${userId} from active users list`);
  activeUsers.value = activeUsers.value.filter(user => user.id !== userId);
};

// Initialize or reinitialize socket connection
const initializeSocket = () => {
  // Clean up existing socket if it exists
  cleanupSocket();
  
  console.log('ActiveUsersMonitor: Initializing socket connection...');
  
  // Get a fresh socket instance
  socket.value = socketManager.getSocket();
  
  if (!socket.value) {
    console.error('Failed to get socket instance');
    scheduleReconnect();
    return;
  }
  
  // Set up socket event listeners
  socket.value.on('connect', () => {
    console.log('ActiveUsersMonitor: Socket connected!', socket.value.id);
    isConnected.value = true;
    reconnectAttempts.value = 0;
    clearReconnectTimer();
    
    // Request active users immediately on connect
    requestActiveUsers();
  });
  
  socket.value.on('disconnect', (reason) => {
    console.log('ActiveUsersMonitor: Socket disconnected:', reason);
    isConnected.value = false;
    scheduleReconnect();
  });
  
  socket.value.on('connect_error', (error) => {
    console.error('ActiveUsersMonitor: Socket connection error:', error);
    isConnected.value = false;
    scheduleReconnect();
  });
  
  // Listen for active users updates
  socket.value.on('activeUsersUpdate', (users) => {
    console.log('ActiveUsersMonitor: Received active users update:', users.length);
    activeUsers.value = users;
  });
  
  // Add direct listener for user logout events
  socket.value.on('userLogout', (data) => {
    console.log('ActiveUsersMonitor: Received userLogout event:', data);
    if (data.userId) {
      removeUser(data.userId);
    }
  });
};

// Clean up socket connections and event listeners
const cleanupSocket = () => {
  if (socket.value) {
    console.log('ActiveUsersMonitor: Cleaning up socket event listeners');
    socket.value.off('connect');
    socket.value.off('disconnect');
    socket.value.off('connect_error');
    socket.value.off('activeUsersUpdate');
    socket.value.off('userLogout');
  }
};

// Schedule a reconnection attempt
const scheduleReconnect = () => {
  if (reconnectTimer.value) return; // Don't schedule if already scheduled
  
  if (reconnectAttempts.value < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts.value++;
    const delay = Math.min(reconnectAttempts.value * 1000, 5000); // Exponential backoff with max 5 seconds
    
    console.log(`ActiveUsersMonitor: Scheduling reconnect attempt ${reconnectAttempts.value} in ${delay}ms`);
    
    reconnectTimer.value = setTimeout(() => {
      console.log(`ActiveUsersMonitor: Attempting reconnect #${reconnectAttempts.value}`);
      initializeSocket();
      reconnectTimer.value = null;
    }, delay);
  } else {
    console.error('ActiveUsersMonitor: Max reconnect attempts reached. Please refresh the page.');
  }
};

// Clear reconnect timer
const clearReconnectTimer = () => {
  if (reconnectTimer.value) {
    clearTimeout(reconnectTimer.value);
    reconnectTimer.value = null;
  }
};

// Request active users list from the server
const requestActiveUsers = () => {
  if (!socket.value || !isConnected.value) {
    console.warn('ActiveUsersMonitor: Cannot request users - socket not connected');
    initializeSocket();
    return;
  }
  
  console.log('ActiveUsersMonitor: Requesting active users...');
  socket.value.emit('getActiveUsers', {});
};

// // Refresh users list manually
// const refreshUsers = () => {
//   console.log('ActiveUsersMonitor: Manual refresh requested');
  
//   // Force component re-render
//   componentKey.value++;
  
//   // Check if socket is connected, reinitialize if needed
//   if (!socket.value || !isConnected.value) {
//     initializeSocket();
//   } else {
//     requestActiveUsers();
//   }
// };

// Set up component lifecycle
onMounted(() => {
  console.log('ActiveUsersMonitor: Component mounted');
  initializeSocket();
  
  // Set up refresh interval (every 30 seconds)
  const refreshInterval = setInterval(() => {
    if (isConnected.value) {
      console.log('ActiveUsersMonitor: Auto-refreshing active users');
      requestActiveUsers();
    } else {
      console.warn('ActiveUsersMonitor: Auto-refresh skipped - socket disconnected');
      // Try to reconnect if disconnected
      initializeSocket();
    }
  }, 30000);
  
  // Add page visibility handler
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      console.log('ActiveUsersMonitor: Page became visible - checking connection');
      if (!socket.value?.connected) {
        console.log('ActiveUsersMonitor: Socket disconnected - reconnecting');
        initializeSocket();
      } else {
        // Even if connected, request latest data
        requestActiveUsers();
      }
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Clean up on unmount
  onUnmounted(() => {
    console.log('ActiveUsersMonitor: Component unmounting');
    clearInterval(refreshInterval);
    cleanupSocket();
    clearReconnectTimer();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });
});

// Add a watcher to log changes to the active users list
watch(activeUsers, (newUsers) => {
  console.log('Active users updated:', newUsers.length, 'users');
}, { deep: true });

// Watch for connection status changes
watch(isConnected, (connected) => {
  console.log('ActiveUsersMonitor: Connection status changed:', connected ? 'connected' : 'disconnected');
});

// Computed properties
const filterOptions = computed(() => ({
  grades: [...new Set(activeUsers.value
    .filter(user => user.role === 'student' && user.gradeLevel)
    .map(user => user.gradeLevel)
    .sort((a, b) => a - b))],
    
  sections: [...new Set(activeUsers.value
    .filter(user => user.role === 'student' && user.section)
    .map(user => user.section)
    .sort())],
}));

const filteredUsers = computed(() => {
  return activeUsers.value.filter(user => {
    // Filter by tab (user role)
    if (activeTab.value !== 'all' && user.role !== activeTab.value.slice(0, -1)) {
      return false;
    }
    
    // Filter by search query
    const searchMatch = !searchQuery.value || 
      user.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    if (!searchMatch) return false;
    
    // Apply student-specific filters
    if (user.role === 'student') {
      if (filters.value.gradeLevel && user.gradeLevel !== parseInt(filters.value.gradeLevel)) {
        return false;
      }
      if (filters.value.section && user.section !== filters.value.section) {
        return false;
      }
    }
    
    return true;
  });
});

// Format the last active timestamp
const formatLastActive = (timestamp) => {
  if (!timestamp) return 'just now';
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    
    // Convert to seconds
    const diffSec = Math.floor(diffMs / 1000);
    
    if (diffSec < 60) {
      return diffSec === 1 ? '1 second ago' : `${diffSec} seconds ago`;
    }
    
    // Convert to minutes
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
    }
    
    // Convert to hours
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) {
      return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
    }
    
    // Convert to days
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) {
      return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
    }
    
    // Format as date for older timestamps
    return date.toLocaleString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'unknown';
  }
};
</script>

<style scoped>
.active-users-monitor {
  padding: 2rem;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.refresh-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  background-color: #2196F3;
  color: white;
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.filters-section {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.search-box .material-icons {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: #2196f3;
  color: white;
}

.filter-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group select {
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
}

.view-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.view-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-toggle-btn.active {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.user-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
}

.user-avatar.student {
  background: #4CAF50;
}

.user-avatar.teacher {
  background: #2196F3;
}

.user-avatar.admin {
  background: #9C27B0;
}

.user-info {
  flex: 1;
}

.user-info h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
}

.email {
  color: #666;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.details {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #666;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
}

.role-badge.student {
  background: #4CAF50;
}

.role-badge.teacher {
  background: #2196F3;
}

.role-badge.admin {
  background: #9C27B0;
}

.activity-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.activity-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.activity-indicator.active {
  background: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.last-active {
  font-size: 0.8rem;
  color: #666;
}

.users-table {
  width: 100%;
  overflow-x: auto;
  margin-top: 1rem;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.users-table th {
  background: #f5f5f5;
  font-weight: 500;
}

.users-table tr:hover {
  background: #fafafa;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.empty-state .material-icons {
  font-size: 48px;
  margin-bottom: 1rem;
  color: #ccc;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .active-users-monitor {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .filters-section {
    flex-direction: column;
    gap: 1rem;
  }

  .search-box {
    width: 100%;
  }

  .tabs {
    width: 100%;
    justify-content: space-between;
  }

  .tab-btn {
    flex: 1;
    text-align: center;
    font-size: 0.9rem;
    padding: 0.5rem;
  }

  .filter-group {
    width: 100%;
  }

  .filter-group select {
    flex: 1;
  }

  .view-controls {
    width: 100%;
    justify-content: space-between;
  }

  .view-toggle-btn {
    flex: 1;
    justify-content: center;
  }

  .users-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .users-table {
    margin-top: 1rem;
    overflow-x: auto;
  }

  .users-table table {
    min-width: 600px;
  }

  /* Adjust table for mobile scroll */
  .users-table th,
  .users-table td {
    white-space: nowrap;
    padding: 0.75rem;
  }

  /* Make user cards more compact on mobile */
  .user-card {
    padding: 1rem;
  }

  .user-card .user-info {
    font-size: 0.9rem;
  }

  /* Adjust empty state for mobile */
  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-state .material-icons {
    font-size: 36px;
  }
}

/* Additional styles for very small screens */
@media (max-width: 480px) {
  .tab-btn {
    font-size: 0.8rem;
    padding: 0.4rem;
  }

  .view-toggle-btn {
    font-size: 0.9rem;
  }

  .view-toggle-btn .material-icons {
    font-size: 18px;
  }
}

.exam-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: #e3f2fd;
  border-radius: 4px;
  color: #1565c0;
  font-size: 0.8rem;
}

.exam-indicator .material-icons {
  font-size: 1rem;
}

.exam-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: #e3f2fd;
  border-radius: 4px;
  color: #1565c0;
  font-size: 0.8rem;
}

.exam-badge .material-icons {
  font-size: 1rem;
}
</style> 