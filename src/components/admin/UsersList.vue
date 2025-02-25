<template>
  <div class="users-list-container">
    <div class="list-header">
      <h2>{{ title }}</h2>
      <div class="actions">
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search users..." 
            @input="filterUsers"
          />
          <i class="fas fa-search"></i>
        </div>
        <button class="add-button" @click="$emit('add-user')">
          <i class="fas fa-user-plus"></i> Add {{ userType }}
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading {{ userType }} list...</p>
    </div>
    
    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-circle"></i>
      <p>{{ error }}</p>
      <button @click="fetchUsers" class="retry-button">Retry</button>
    </div>
    
    <div v-else-if="filteredUsers.length === 0" class="empty-state">
      <i class="fas fa-users-slash"></i>
      <p v-if="searchQuery">No {{ userType }} found matching "{{ searchQuery }}"</p>
      <p v-else>No {{ userType }} have been added yet</p>
    </div>
    
    <div v-else class="users-table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th @click="sort('id')" class="sortable">
              ID <i :class="getSortIcon('id')"></i>
            </th>
            <th @click="sort('lastName')" class="sortable">
              Name <i :class="getSortIcon('lastName')"></i>
            </th>
            <th @click="sort('email')" class="sortable">
              Email <i :class="getSortIcon('email')"></i>
            </th>
            <th v-if="userType === 'student'">LRN</th>
            <th v-if="userType === 'student'">Grade & Section</th>
            <th v-if="userType === 'teacher'">Department</th>
            <th @click="sort('createdAt')" class="sortable">
              Date Added <i :class="getSortIcon('createdAt')"></i>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in filteredUsers" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.firstName }} {{ user.lastName }}</td>
            <td>{{ user.email }}</td>
            <td v-if="userType === 'student'">{{ user.lrn || 'N/A' }}</td>
            <td v-if="userType === 'student'">
              {{ user.gradeLevel ? 'Grade ' + user.gradeLevel : 'N/A' }} 
              {{ user.section ? ' - ' + user.section : '' }}
            </td>
            <td v-if="userType === 'teacher'">
              {{ user.department || 'N/A' }}
              <span v-if="user.domain">({{ user.domain }})</span>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td class="actions-cell">
              <button class="action-btn edit-btn" @click="$emit('edit-user', user)">
                <i class="fas fa-edit"></i>
              </button>
              <button class="action-btn delete-btn" @click="$emit('delete-user', user)">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { fetchStudents, fetchTeachers, fetchAdmins } from '@/services/authService';

export default {
  props: {
    userType: {
      type: String,
      required: true,
      validator: (value) => ['student', 'teacher', 'admin'].includes(value)
    }
  },
  
  emits: ['add-user', 'edit-user', 'delete-user'],
  
  setup(props) {
    const users = ref([]);
    const filteredUsers = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const searchQuery = ref('');
    const sortKey = ref('lastName');
    const sortDirection = ref('asc');
    
    const title = computed(() => {
      return props.userType === 'student' 
        ? 'Students' 
        : props.userType === 'teacher' 
          ? 'Teachers' 
          : 'Administrators';
    });
    
    const fetchUsers = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        switch(props.userType) {
          case 'student':
            users.value = await fetchStudents();
            break;
          case 'teacher':
            users.value = await fetchTeachers();
            break;
          case 'admin':
            users.value = await fetchAdmins();
            break;
        }
        
        filterUsers();
        loading.value = false;
      } catch (err) {
        error.value = err.message;
        loading.value = false;
      }
    };
    
    const filterUsers = () => {
      if (!searchQuery.value) {
        filteredUsers.value = [...users.value];
      } else {
        const query = searchQuery.value.toLowerCase();
        filteredUsers.value = users.value.filter(user => 
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.lrn && user.lrn.toString().includes(query)) ||
          (user.section && user.section.toLowerCase().includes(query)) ||
          (user.department && user.department.toLowerCase().includes(query))
        );
      }
      
      // Apply sorting
      sortUsers();
    };
    
    const sort = (key) => {
      // If clicking the same key, toggle direction
      if (sortKey.value === key) {
        sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
      } else {
        // Otherwise, set new key and reset to ascending
        sortKey.value = key;
        sortDirection.value = 'asc';
      }
      
      sortUsers();
    };
    
    const sortUsers = () => {
      filteredUsers.value.sort((a, b) => {
        let valueA, valueB;
        
        // Handle special case for date
        if (sortKey.value === 'createdAt') {
          valueA = new Date(a[sortKey.value]).getTime();
          valueB = new Date(b[sortKey.value]).getTime();
        } else {
          valueA = typeof a[sortKey.value] === 'string' 
            ? a[sortKey.value].toLowerCase() 
            : a[sortKey.value];
          valueB = typeof b[sortKey.value] === 'string' 
            ? b[sortKey.value].toLowerCase() 
            : b[sortKey.value];
        }
        
        // Handle null values
        if (valueA === null || valueA === undefined) return 1;
        if (valueB === null || valueB === undefined) return -1;
        
        // Compare values based on sort direction
        if (sortDirection.value === 'asc') {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
          return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
      });
    };
    
    const getSortIcon = (key) => {
      if (sortKey.value !== key) return 'fas fa-sort';
      return sortDirection.value === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    onMounted(fetchUsers);
    
    return {
      users,
      filteredUsers,
      loading,
      error,
      searchQuery,
      title,
      fetchUsers,
      filterUsers,
      sort,
      getSortIcon,
      formatDate
    };
  }
}
</script>

<style scoped>
.users-list-container {
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  padding: 25px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.list-header h2 {
  font-size: 1.6rem;
  color: #333;
  margin: 0;
}

.actions {
  display: flex;
  gap: 15px;
}

.search-box {
  position: relative;
}

.search-box input {
  padding: 10px 15px 10px 35px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  width: 250px;
  transition: all 0.3s;
}

.search-box input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76,175,80,0.1);
  outline: none;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.add-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 15px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.add-button:hover {
  background-color: #43A047;
}

/* Loading, Error, and Empty states */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.loading-state i,
.error-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: 15px;
}

.loading-state i {
  color: #2196F3;
}

.error-state i {
  color: #F44336;
}

.empty-state i {
  color: #9E9E9E;
}

.loading-state p,
.error-state p,
.empty-state p {
  font-size: 1.1rem;
  color: #666;
  margin: 0 0 15px 0;
}

.retry-button {
  background-color: #F44336;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 15px;
  margin-top: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-button:hover {
  background-color: #E53935;
}

/* Table styles */
.users-table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.users-table th {
  background-color: #f5f5f5;
  color: #333;
  font-weight: 600;
  text-align: left;
  padding: 12px 15px;
  border-bottom: 2px solid #ddd;
}

.users-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.users-table th.sortable:hover {
  background-color: #eeeeee;
}

.users-table th i {
  margin-left: 5px;
  font-size: 0.9rem;
}

.users-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #eee;
  color: #444;
}

.users-table tbody tr:hover {
  background-color: #f9f9f9;
}

.actions-cell {
  white-space: nowrap;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px 8px;
  margin: 0 3px;
  border-radius: 4px;
  transition: all 0.2s;
}

.edit-btn {
  color: #2196F3;
}

.edit-btn:hover {
  background-color: rgba(33, 150, 243, 0.1);
}

.delete-btn {
  color: #F44336;
}

.delete-btn:hover {
  background-color: rgba(244, 67, 54, 0.1);
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .actions {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }
  
  .search-box,
  .search-box input,
  .add-button {
    width: 100%;
  }
  
  .users-table th,
  .users-table td {
    padding: 10px 8px;
    font-size: 0.85rem;
  }
}
</style> 