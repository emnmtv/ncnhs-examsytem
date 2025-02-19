<template>
  <div class="admin-dashboard">
    <h1>Admin Dashboard</h1>

    <div class="form-container">
      <h2>Create Student</h2>
      <form @submit.prevent="createStudent">
        <div class="form-group">
          <label>Email:</label>
          <input v-model="studentData.email" type="email" required />
        </div>
        <div class="form-group">
          <label>Password:</label>
          <input v-model="studentData.password" type="password" required />
        </div>
        <div class="form-group">
          <label>First Name:</label>
          <input v-model="studentData.firstName" type="text" required />
        </div>
        <div class="form-group">
          <label>Last Name:</label>
          <input v-model="studentData.lastName" type="text" required />
        </div>
        <div class="form-group">
          <label>Address:</label>
          <input v-model="studentData.address" type="text" />
        </div>
        <div class="form-group">
          <label>LRN:</label>
          <input v-model.number="studentData.lrn" type="number" />
        </div>
        <div class="form-group">
          <label>Grade Level:</label>
          <input v-model.number="studentData.gradeLevel" type="number" />
        </div>
        <div class="form-group">
          <label>Section:</label>
          <input v-model="studentData.section" type="text" />
        </div>
        <button type="submit">Create Student</button>
      </form>
    </div>

    <div class="form-container">
      <h2>Create Teacher</h2>
      <form @submit.prevent="createTeacher">
        <div class="form-group">
          <label>Email:</label>
          <input v-model="teacherData.email" type="email" required />
        </div>
        <div class="form-group">
          <label>Password:</label>
          <input v-model="teacherData.password" type="password" required />
        </div>
        <div class="form-group">
          <label>First Name:</label>
          <input v-model="teacherData.firstName" type="text" required />
        </div>
        <div class="form-group">
          <label>Last Name:</label>
          <input v-model="teacherData.lastName" type="text" required />
        </div>
        <div class="form-group">
          <label>Address:</label>
          <input v-model="teacherData.address" type="text" />
        </div>
        <div class="form-group">
          <label>Domain:</label>
          <input v-model="teacherData.domain" type="text" />
        </div>
        <div class="form-group">
          <label>Department:</label>
          <input v-model="teacherData.department" type="text" />
        </div>
        <button type="submit">Create Teacher</button>
      </form>
    </div>

    <div class="form-container">
      <h2>Create Admin</h2>
      <form @submit.prevent="createAdmin">
        <div class="form-group">
          <label>Email:</label>
          <input v-model="adminData.email" type="email" required />
        </div>
        <div class="form-group">
          <label>Password:</label>
          <input v-model="adminData.password" type="password" required />
        </div>
        <div class="form-group">
          <label>First Name:</label>
          <input v-model="adminData.firstName" type="text" required />
        </div>
        <div class="form-group">
          <label>Last Name:</label>
          <input v-model="adminData.lastName" type="text" required />
        </div>
        <div class="form-group">
          <label>Address:</label>
          <input v-model="adminData.address" type="text" />
        </div>
        <button type="submit">Create Admin</button>
      </form>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="success" class="success">{{ success }}</div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { registerStudent, registerTeacher, registerAdmin } from '@/services/authService';

export default {
  name: 'AdminDashboard',
  setup() {
    const studentData = ref({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      address: '',
      lrn: null,
      gradeLevel: null,
      section: ''
    });

    const teacherData = ref({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      address: '',
      domain: '',
      department: ''
    });

    const adminData = ref({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      address: ''
    });

    const error = ref(null);
    const success = ref(null);

    const createStudent = async () => {
      try {
        error.value = null;
        success.value = null;
        await registerStudent(studentData.value);
        success.value = 'Student created successfully!';
        // Reset form
        studentData.value = {
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          address: '',
          lrn: null,
          gradeLevel: null,
          section: ''
        };
      } catch (err) {
        error.value = err.message;
      }
    };

    const createTeacher = async () => {
      try {
        error.value = null;
        success.value = null;
        await registerTeacher(teacherData.value);
        success.value = 'Teacher created successfully!';
        // Reset form
        teacherData.value = {
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          address: '',
          domain: '',
          department: ''
        };
      } catch (err) {
        error.value = err.message;
      }
    };

    const createAdmin = async () => {
      try {
        error.value = null;
        success.value = null;
        await registerAdmin(adminData.value);
        success.value = 'Admin created successfully!';
        // Reset form
        adminData.value = {
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          address: ''
        };
      } catch (err) {
        error.value = err.message;
      }
    };

    return {
      studentData,
      teacherData,
      adminData,
      createStudent,
      createTeacher,
      createAdmin,
      error,
      success
    };
  }
};
</script>

<style scoped>
.admin-dashboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-container {
  margin-bottom: 20px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

.error {
  color: red;
}

.success {
  color: green;
}
</style> 