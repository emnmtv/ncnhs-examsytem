<template>
  <div class="teacher-dashboard">
    <div class="dashboard-header">
      <h1>Teacher Dashboard</h1>
    </div>
    
    <div class="dashboard-content">
      <div class="feature-cards">
        <!-- Class List & Attendance Card -->
        <div class="feature-card attendance-card">
          <div class="card-icon">
            <span class="material-icons">people</span>
          </div>
          <div class="card-content">
            <h2>Class & Attendance</h2>
            <p>Manage your class lists and track student attendance</p>
            <div class="card-actions">
              <router-link to="/class-list" class="action-btn primary">
                <span class="material-icons">people</span>
                Class List
              </router-link>
              <router-link to="/attendance-records" class="action-btn secondary">
                <span class="material-icons">fact_check</span>
                Attendance Records
              </router-link>
            </div>
          </div>
        </div>
        
        <!-- Exams Card -->
        <div class="feature-card exams-card">
          <div class="card-icon">
            <span class="material-icons">quiz</span>
          </div>
          <div class="card-content">
            <h2>Exams</h2>
            <p>Create and manage your exams</p>
            <div class="card-actions">
              <router-link to="/create-exam" class="action-btn primary">
                <span class="material-icons">add</span>
                Create Exam
              </router-link>
              <router-link to="/manage-exams" class="action-btn secondary">
                <span class="material-icons">list</span>
                Manage Exams
              </router-link>
            </div>
          </div>
        </div>
        
        <!-- Subjects Card -->
        <div class="feature-card subjects-card">
          <div class="card-icon">
            <span class="material-icons">menu_book</span>
          </div>
          <div class="card-content">
            <h2>Subjects</h2>
            <p>View and manage your assigned subjects</p>
            <div class="card-actions">
              <router-link to="/teacher-subjects" class="action-btn primary">
                <span class="material-icons">menu_book</span>
                My Subjects
              </router-link>
            </div>
          </div>
        </div>
        
        <!-- Tasks Card -->
        <div class="feature-card tasks-card">
          <div class="card-icon">
            <span class="material-icons">assignment</span>
          </div>
          <div class="card-content">
            <h2>Tasks</h2>
            <p>Create and manage tasks for your students</p>
            <div class="card-actions">
              <router-link to="/create-task" class="action-btn primary">
                <span class="material-icons">add</span>
                Create Task
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Teacher dashboard logic will go here
</script>

<style scoped>
.teacher-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h1 {
  color: #159750;
  font-size: 2.5rem;
  font-weight: 700;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.feature-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.card-icon {
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-icon .material-icons {
  font-size: 3rem;
}

.card-content {
  padding: 20px;
  flex: 1;
}

.card-content h2 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.5rem;
  color: #333;
}

.card-content p {
  color: #666;
  margin-bottom: 20px;
}

.card-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.action-btn.primary {
  background: #159750;
  color: white;
}

.action-btn.secondary {
  background: #e8f5e9;
  color: #159750;
}

.action-btn.primary:hover {
  background: #0bcc4e;
}

.action-btn.secondary:hover {
  background: #c8e6c9;
}

/* Card specific styling */
.attendance-card .card-icon {
  background: linear-gradient(135deg, #673ab7 0%, #9c27b0 100%);
  color: white;
}

.exams-card .card-icon {
  background: linear-gradient(135deg, #2196f3 0%, #03a9f4 100%);
  color: white;
}

.subjects-card .card-icon {
  background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
  color: white;
}

.tasks-card .card-icon {
  background: linear-gradient(135deg, #4caf50 0%, #8bc34a 100%);
  color: white;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .dashboard-header h1 {
    font-size: 2rem;
  }
  
  .feature-cards {
    grid-template-columns: 1fr;
  }
}
</style> 