<template>
  <div class="classlist-container">
    <div class="header-container">
      <div class="header-content">
        <h1>Classlist<span class="material-icons">people</span></h1>
        <div class="divider"></div>
        <div class="header-text">
          <p class="subtitle">{{ subjectInfo.name }} ({{ subjectInfo.code }})</p>
        </div>
      </div>
      <div class="header-actions">
        <button @click="$router.go(-1)" class="back-btn">
          <span class="material-icons">arrow_back</span>
          Back
        </button>
      </div>
      <div class="header-background">CLASS</div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <span class="material-icons-round rotating">sync</span>
      <p>Loading classlist...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <span class="material-icons-round">error_outline</span>
      <p>{{ error }}</p>
      <button @click="loadClasslist" class="retry-btn">
        <span class="material-icons-round">refresh</span>
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!students.length" class="empty-state">
      <span class="material-icons">people_outline</span>
      <p>No students found</p>
      <p class="subtitle">No students are enrolled in this subject.</p>
    </div>

    <!-- Classlist Table -->
    <div v-else class="classlist-content">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-icon">
            <span class="material-icons">people</span>
          </div>
          <div class="summary-info">
            <h3>{{ classlistData.totalCount }}</h3>
            <p>Total Students</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">
            <span class="material-icons">person</span>
          </div>
          <div class="summary-info">
            <h3>{{ classlistData.directCount }}</h3>
            <p>Direct Assignments</p>
          </div>
        </div>
        <div class="summary-card">
          <div class="summary-icon">
            <span class="material-icons">group</span>
          </div>
          <div class="summary-info">
            <h3>{{ classlistData.sectionCount }}</h3>
            <p>Section Assignments</p>
          </div>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="table-controls">
        <div class="search-container">
          <span class="material-icons search-icon">search</span>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Search students by name or LRN..." 
            class="search-input"
          />
          <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="filter-container">
          <select v-model="assignmentFilter" @change="applyFilter" class="assignment-filter">
            <option value="">All Assignments</option>
            <option value="direct">Direct Assignment</option>
            <option value="section">Section Assignment</option>
          </select>
        </div>
      </div>

      <!-- Students Table -->
      <div class="table-container">
        <table class="students-table">
          <thead>
            <tr>
              <th class="col-number">#</th>
              <th class="col-name">Name</th>
              <th class="col-lrn">LRN</th>
              <th class="col-grade">Grade</th>
              <th class="col-section">Section</th>
              <th class="col-assignment">Assignment Type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(student, index) in filteredStudents" :key="student.id" class="student-row">
              <td class="col-number">{{ index + 1 }}</td>
              <td class="col-name">
                <div class="student-name">
                  <span class="name">{{ student.firstName }} {{ student.lastName }}</span>
                  <span class="email">{{ student.email }}</span>
                </div>
              </td>
              <td class="col-lrn">{{ student.lrn || 'N/A' }}</td>
              <td class="col-grade">Grade {{ student.gradeLevel }}</td>
              <td class="col-section">{{ student.section }}</td>
              <td class="col-assignment">
                <span class="assignment-badge" :class="student.assignmentType">
                  {{ formatAssignmentType(student.assignmentType) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer -->
      <div class="table-footer">
        <p class="results-count">
          Showing {{ filteredStudents.length }} of {{ students.length }} students
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { getSubjectClasslist } from '@/services/authService';

const route = useRoute();
const subjectId = route.params.subjectId;

const loading = ref(true);
const error = ref(null);
const classlistData = ref({});
const students = ref([]);
const searchQuery = ref('');
const assignmentFilter = ref('');

const subjectInfo = computed(() => classlistData.value.subject || {});

// Load classlist data
const loadClasslist = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const response = await getSubjectClasslist(subjectId);
    classlistData.value = response.data;
    students.value = response.data.students || [];
  } catch (err) {
    error.value = err.message;
    console.error('Failed to load classlist:', err);
  } finally {
    loading.value = false;
  }
};

// Filter students based on search and assignment type
const filteredStudents = computed(() => {
  let filtered = students.value;

  // Apply search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    filtered = filtered.filter(student => 
      student.firstName.toLowerCase().includes(query) ||
      student.lastName.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      (student.lrn && student.lrn.toLowerCase().includes(query))
    );
  }

  // Apply assignment type filter
  if (assignmentFilter.value) {
    filtered = filtered.filter(student => 
      student.assignmentType === assignmentFilter.value
    );
  }

  return filtered;
});

// Utility functions
const formatAssignmentType = (type) => {
  return type === 'direct' ? 'Direct' : 'Section';
};

const clearSearch = () => {
  searchQuery.value = '';
};

const applyFilter = () => {
  // Filter is applied automatically through computed property
};

onMounted(() => {
  loadClasslist();
});
</script>

<style scoped>
.classlist-container {
  max-width: auto;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow-y: hidden;
  overflow-x: hidden;
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
  gap: 10px;
}

.header-content h1 .material-icons {
  color: #159750;
  font-size: 2.5rem;
}

.header-actions {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  margin-top: 10px;
}

.back-btn {
  background: #f5f5f5;
  color: #333;
  padding: 8px 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: none;
  cursor: pointer;
}

.back-btn:hover {
  background: #e0e0e0;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.back-btn .material-icons {
  font-size: 1.2rem;
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

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-icon {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-icon .material-icons {
  font-size: 1.5rem;
}

.summary-info h3 {
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.summary-info p {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

/* Table Controls */
.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 1.2rem;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 45px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  font-size: 0.95rem;
  background: #fff;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.assignment-filter {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  font-size: 0.95rem;
  background: #fff;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 180px;
  cursor: pointer;
}

.assignment-filter:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.students-table {
  width: 100%;
  border-collapse: collapse;
}

.students-table th {
  background: linear-gradient(135deg, #0bcc4e 0%, #159750 100%);
  color: white;
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.students-table th:first-child {
  border-top-left-radius: 12px;
}

.students-table th:last-child {
  border-top-right-radius: 12px;
}

.students-table td {
  padding: 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.student-row:hover {
  background: #f8f9fa;
}

.col-number {
  width: 60px;
  text-align: center;
  font-weight: 600;
  color: #666;
}

.col-name {
  min-width: 200px;
}

.student-name {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-name .name {
  font-weight: 600;
  color: #333;
}

.student-name .email {
  font-size: 0.85rem;
  color: #666;
}

.col-lrn {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.col-grade,
.col-section {
  text-align: center;
  font-weight: 500;
}

.assignment-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.assignment-badge.direct {
  background: #e8f5e9;
  color: #2e7d32;
}

.assignment-badge.section {
  background: #e3f2fd;
  color: #1565c0;
}

/* Table Footer */
.table-footer {
  text-align: center;
  padding: 15px;
  color: #666;
  font-size: 0.9rem;
}

/* States */
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  text-align: center;
  margin-bottom: 2rem;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.error-state .material-icons-round,
.empty-state .material-icons {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #f44336;
}

.empty-state .material-icons {
  color: #9e9e9e;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.3s;
}

.retry-btn:hover {
  background: #d32f2f;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .classlist-container {
    padding: 16px;
  }
  
  .header-content h1 {
    font-size: 2.2rem;
    margin-bottom: 0.8rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2.2rem;
  }
  
  .header-background {
    font-size: 6.5rem;
    right: 4rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .divider {
    margin: 1.2rem 0;
  }
  
  .summary-cards {
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .summary-card {
    padding: 16px;
    gap: 12px;
  }
  
  .summary-icon {
    width: 45px;
    height: 45px;
  }
  
  .summary-icon .material-icons {
    font-size: 1.3rem;
  }
  
  .summary-info h3 {
    font-size: 1.6rem;
  }
  
  .summary-info p {
    font-size: 0.85rem;
  }
  
  .table-controls {
    margin-bottom: 16px;
    gap: 16px;
  }
  
  .search-input {
    padding: 10px 14px 10px 40px;
    font-size: 0.9rem;
  }
  
  .assignment-filter {
    padding: 10px 14px;
    font-size: 0.9rem;
    min-width: 160px;
  }
  
  .students-table th {
    padding: 14px 10px;
    font-size: 0.85rem;
  }
  
  .students-table td {
    padding: 14px 10px;
  }
  
  .student-name .name {
    font-size: 0.95rem;
  }
  
  .student-name .email {
    font-size: 0.8rem;
  }
  
  .col-lrn {
    font-size: 0.85rem;
  }
  
  .assignment-badge {
    padding: 3px 10px;
    font-size: 0.75rem;
  }
}

/* Compact layout for 14-inch laptops and lower resolutions */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .classlist-container {
    padding: 14px;
  }
  
  .header-content h1 {
    font-size: 2rem;
    margin-bottom: 0.7rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 2rem;
  }
  
  .header-background {
    font-size: 6rem;
    right: 3rem;
  }
  
  .subtitle {
    font-size: 0.95rem;
  }
  
  .divider {
    margin: 1rem 0;
  }
  
  .summary-cards {
    gap: 14px;
    margin-bottom: 20px;
  }
  
  .summary-card {
    padding: 14px;
    gap: 10px;
  }
  
  .summary-icon {
    width: 40px;
    height: 40px;
  }
  
  .summary-icon .material-icons {
    font-size: 1.2rem;
  }
  
  .summary-info h3 {
    font-size: 1.4rem;
  }
  
  .summary-info p {
    font-size: 0.8rem;
  }
  
  .table-controls {
    margin-bottom: 14px;
    gap: 14px;
  }
  
  .search-input {
    padding: 9px 12px 9px 38px;
    font-size: 0.85rem;
  }
  
  .assignment-filter {
    padding: 9px 12px;
    font-size: 0.85rem;
    min-width: 140px;
  }
  
  .students-table th {
    padding: 12px 8px;
    font-size: 0.8rem;
  }
  
  .students-table td {
    padding: 12px 8px;
  }
  
  .student-name .name {
    font-size: 0.9rem;
  }
  
  .student-name .email {
    font-size: 0.75rem;
  }
  
  .col-lrn {
    font-size: 0.8rem;
  }
  
  .assignment-badge {
    padding: 3px 8px;
    font-size: 0.7rem;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .classlist-container {
    padding: 12px;
  }
  
  .header-content h1 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }
  
  .header-content h1 .material-icons {
    font-size: 1.8rem;
  }
  
  .header-background {
    font-size: 5rem;
    right: 2rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .divider {
    margin: 0.8rem 0;
  }
  
  .summary-cards {
    gap: 12px;
    margin-bottom: 18px;
  }
  
  .summary-card {
    padding: 12px;
    gap: 8px;
  }
  
  .summary-icon {
    width: 35px;
    height: 35px;
  }
  
  .summary-icon .material-icons {
    font-size: 1.1rem;
  }
  
  .summary-info h3 {
    font-size: 1.2rem;
  }
  
  .summary-info p {
    font-size: 0.75rem;
  }
  
  .table-controls {
    margin-bottom: 12px;
    gap: 12px;
  }
  
  .search-input {
    padding: 8px 10px 8px 35px;
    font-size: 0.8rem;
  }
  
  .assignment-filter {
    padding: 8px 10px;
    font-size: 0.8rem;
    min-width: 120px;
  }
  
  .students-table th {
    padding: 10px 6px;
    font-size: 0.75rem;
  }
  
  .students-table td {
    padding: 10px 6px;
  }
  
  .student-name .name {
    font-size: 0.85rem;
  }
  
  .student-name .email {
    font-size: 0.7rem;
  }
  
  .col-lrn {
    font-size: 0.75rem;
  }
  
  .assignment-badge {
    padding: 2px 6px;
    font-size: 0.65rem;
  }
}

/* Mobile responsive design */
@media (max-width: 768px) {
  .classlist-container {
    padding: 10px 5px;
  }

  .header-content h1 {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
  }

  .header-content h1 .material-icons {
    font-size: 1.8rem;
  }

  .header-background {
    font-size: 3rem;
    top: 60%;
    right: 1rem;
  }

  .subtitle {
    font-size: 0.9rem;
  }

  .divider {
    margin: 0.8rem 0;
  }

  .header-actions {
    position: static;
    margin-top: 15px;
    width: 100%;
    justify-content: center;
  }

  .back-btn {
    width: 100%;
    justify-content: center;
    padding: 10px 15px;
    font-size: 0.9rem;
  }

  .summary-cards {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .summary-card {
    padding: 15px;
    gap: 12px;
  }

  .summary-icon {
    width: 40px;
    height: 40px;
  }

  .summary-icon .material-icons {
    font-size: 1.2rem;
  }

  .summary-info h3 {
    font-size: 1.4rem;
  }

  .summary-info p {
    font-size: 0.8rem;
  }

  .table-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-bottom: 16px;
  }

  .search-container {
    max-width: none;
  }

  .search-input {
    padding: 10px 12px 10px 40px;
    font-size: 0.9rem;
  }

  .assignment-filter {
    padding: 10px 12px;
    font-size: 0.9rem;
    min-width: 180px;
  }

  .table-container {
    overflow-x: auto;
    margin-bottom: 16px;
  }

  .students-table {
    min-width: 600px;
  }

  .students-table th,
  .students-table td {
    padding: 12px 8px;
    font-size: 0.85rem;
  }

  .col-name {
    min-width: 150px;
  }

  .student-name .name {
    font-size: 0.9rem;
  }

  .student-name .email {
    font-size: 0.75rem;
  }

  .assignment-badge {
    padding: 3px 8px;
    font-size: 0.7rem;
  }
}

/* Very small screens */
@media (max-width: 480px) {
  .classlist-container {
    padding: 8px 4px;
  }

  .header-content h1 {
    font-size: 1.6rem;
  }

  .header-content h1 .material-icons {
    font-size: 1.6rem;
  }

  .header-background {
    font-size: 2.5rem;
  }

  .subtitle {
    font-size: 0.85rem;
  }

  .back-btn {
    padding: 8px 12px;
    font-size: 0.85rem;
  }

  .summary-cards {
    gap: 10px;
    margin-bottom: 16px;
  }

  .summary-card {
    padding: 12px;
    gap: 10px;
  }

  .summary-icon {
    width: 35px;
    height: 35px;
  }

  .summary-icon .material-icons {
    font-size: 1.1rem;
  }

  .summary-info h3 {
    font-size: 1.2rem;
  }

  .summary-info p {
    font-size: 0.75rem;
  }

  .search-input {
    padding: 8px 10px 8px 35px;
    font-size: 0.85rem;
  }

  .assignment-filter {
    padding: 8px 10px;
    font-size: 0.85rem;
    min-width: 160px;
  }

  .students-table {
    min-width: 500px;
  }

  .students-table th,
  .students-table td {
    padding: 10px 6px;
    font-size: 0.8rem;
  }

  .student-name .name {
    font-size: 0.85rem;
  }

  .student-name .email {
    font-size: 0.7rem;
  }

  .assignment-badge {
    padding: 2px 6px;
    font-size: 0.65rem;
  }
}
</style>
