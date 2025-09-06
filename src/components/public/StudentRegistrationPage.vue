<template>
  <div class="student-registration-page" :class="{ 'loaded': pageLoaded }">
    <div class="registration-container">
      <!-- Header with Back Button -->
      <div class="registration-header">
        <button @click="goBack" class="back-button">
          <span class="material-icons">arrow_back</span>
          <span>Back to Login</span>
        </button>
        <h2>Student Registration</h2>
        <p class="subtitle">Create your student account</p>
      </div>
      
      <!-- Registration Status Check -->
      <div v-if="!registrationEnabled" class="registration-disabled">
        <div class="disabled-icon">
          <span class="material-icons">block</span>
        </div>
        <h3>Registration Disabled</h3>
        <p>Public student registration is currently disabled.</p>
        <p>Please contact the administrator for assistance.</p>
        <button @click="goBack" class="back-to-login-btn">
          <span class="material-icons">login</span>
          Back to Login
        </button>
      </div>

      <!-- Registration Form -->
      <form v-else @submit.prevent="handleRegistration" class="registration-form">
        <div class="form-group">
          <label for="firstName">
            <span class="material-icons">person</span>
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            v-model="formData.firstName"
            class="animated-input"
            required
            :disabled="isSubmitting"
            placeholder="Enter your first name"
            @input="capitalizeFirstName"
          />
        </div>

        <div class="form-group">
          <label for="lastName">
            <span class="material-icons">person</span>
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            v-model="formData.lastName"
            class="animated-input"
            required
            :disabled="isSubmitting"
            placeholder="Enter your last name"
            @input="capitalizeLastName"
          />
        </div>

        <div class="form-group">
          <label for="email">
            <span class="material-icons">email</span>
            Email *
          </label>
          <input
            type="email"
            id="email"
            v-model="formData.email"
            class="animated-input"
            required
            :disabled="isSubmitting"
            placeholder="Enter your email address"
          />
        </div>

        <div class="form-group">
          <label for="password">
            <span class="material-icons">lock</span>
            Password *
          </label>
          <div class="password-input">
            <input
              type="password"
              id="password"
              v-model="formData.password"
              class="animated-input"
              required
              :disabled="isSubmitting"
              placeholder="Enter your password"
            />
            <button
              type="button"
              class="toggle-password"
              @click="togglePassword"
              :disabled="isSubmitting"
            >
              <span class="material-icons">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="lrn">
            <span class="material-icons">badge</span>
            LRN (Optional)
          </label>
          <input
            type="text"
            id="lrn"
            v-model="formData.lrn"
            class="animated-input"
            :disabled="isSubmitting"
            placeholder="Enter your LRN (Learner Reference Number)"
          />
        </div>

        <div class="form-group">
          <label for="gradeLevel">
            <span class="material-icons">school</span>
            Grade Level (Optional)
          </label>
          <select
            id="gradeLevel"
            v-model="formData.gradeLevel"
            class="animated-input"
            :disabled="isSubmitting"
          >
            <option value="">Select Grade</option>
            <option v-for="grade in availableGrades" :key="grade" :value="grade">
              Grade {{ grade }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="section">
            <span class="material-icons">group</span>
            Section (Optional)
          </label>
          <select
            id="section"
            v-model="formData.section"
            class="animated-input"
            :disabled="isSubmitting"
          >
            <option value="">Select Section</option>
            <option v-for="section in availableSections" :key="section" :value="section">
              Section {{ section }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="profilePicture">
            <span class="material-icons">photo_camera</span>
            Profile Picture (Optional)
          </label>
          <div class="file-upload-container">
            <input
              type="file"
              id="profilePicture"
              @change="handleFileUpload"
              accept="image/*"
              :disabled="isSubmitting"
              class="file-input"
            />
            <label for="profilePicture" class="file-upload-label">
              <span class="material-icons">cloud_upload</span>
              <span>{{ formData.profilePicture ? 'Change Picture' : 'Choose Picture' }}</span>
            </label>
            <div v-if="formData.profilePicture" class="file-preview">
              <span class="material-icons">check_circle</span>
              <span>{{ formData.profilePicture.name }}</span>
            </div>
          </div>
        </div>

        <button type="submit" :disabled="isSubmitting" class="register-button">
          <span v-if="isSubmitting" class="spinner"></span>
          <span v-else class="material-icons">person_add</span>
          {{ isSubmitting ? 'Registering...' : 'Register Account' }}
        </button>
      </form>

      <!-- Success/Error Messages -->
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script>
import { 
  registerStudentPublic, 
  getAllGradeSectionsPublic,
  getPublicRegistrationStatus
} from '@/services/authService';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';

export default {
  name: 'StudentRegistrationPage',
  setup() {
    const router = useRouter();
    return { router };
  },
  data() {
    return {
      formData: {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        lrn: '',
        gradeLevel: '',
        section: '',
        profilePicture: null
      },
      gradeSections: [],
      registrationEnabled: false,
      isSubmitting: false,
      message: '',
      messageType: '',
      showPassword: false,
      pageLoaded: false
    };
  },
  computed: {
    availableGrades() {
      const grades = [...new Set(this.gradeSections.map(gs => gs.grade))];
      return grades.sort((a, b) => a - b);
    },
    availableSections() {
      if (!this.formData.gradeLevel) return [];
      return this.gradeSections
        .filter(gs => gs.grade === parseInt(this.formData.gradeLevel))
        .map(gs => gs.section)
        .sort();
    }
  },
  async mounted() {
    // Trigger animation after component is mounted
    setTimeout(() => {
      this.pageLoaded = true;
    }, 100);
    
    await this.checkRegistrationStatus();
    await this.loadGradeSections();
  },
  methods: {
    async checkRegistrationStatus() {
      try {
        const response = await getPublicRegistrationStatus();
        this.registrationEnabled = response.enabled;
      } catch (error) {
        console.error('Error checking registration status:', error);
        this.registrationEnabled = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error checking registration status',
          confirmButtonColor: '#dc3545'
        });
      }
    },

    async loadGradeSections() {
      try {
        const response = await getAllGradeSectionsPublic();
        this.gradeSections = response.gradeSections || [];
      } catch (error) {
        console.error('Error loading grade sections:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error loading grade sections',
          confirmButtonColor: '#dc3545'
        });
      }
    },
    
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          Swal.fire({
            icon: 'error',
            title: 'Invalid File Type',
            text: 'Please select an image file',
            confirmButtonColor: '#dc3545'
          });
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          Swal.fire({
            icon: 'error',
            title: 'File Too Large',
            text: 'File size must be less than 5MB',
            confirmButtonColor: '#dc3545'
          });
          return;
        }
        
        this.formData.profilePicture = file;
      }
    },

    togglePassword() {
      this.showPassword = !this.showPassword;
      const passwordInput = document.getElementById('password');
      if (passwordInput) {
        passwordInput.type = this.showPassword ? 'text' : 'password';
      }
    },

    goBack() {
      this.router.push('/');
    },

    capitalizeFirstName(event) {
      const value = event.target.value;
      this.formData.firstName = value.toUpperCase();
    },

    capitalizeLastName(event) {
      const value = event.target.value;
      this.formData.lastName = value.toUpperCase();
    },

    async handleRegistration() {
      this.isSubmitting = true;
      this.message = '';

      try {
        // Prepare form data
        const registrationData = {
          firstName: this.formData.firstName,
          lastName: this.formData.lastName,
          email: this.formData.email,
          password: this.formData.password,
          lrn: this.formData.lrn || undefined,
          gradeLevel: this.formData.gradeLevel ? parseInt(this.formData.gradeLevel) : undefined,
          section: this.formData.section || undefined
        };

        // Call the public registration API
        await registerStudentPublic(registrationData);
        
        // Show success alert with SweetAlert
        await Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'Your account has been created successfully. You can now log in.',
          confirmButtonText: 'Go to Login',
          confirmButtonColor: '#19a759',
          allowOutsideClick: false,
          allowEscapeKey: false
        });
        
        // Reset form
        this.resetForm();
        
        // Redirect to login page
        this.router.push('/');

      } catch (error) {
        console.error('Registration error:', error);
        
        // Show error alert with SweetAlert
        Swal.fire({
          icon: 'error',
          title: 'Registration Failed',
          text: error.message || 'Registration failed. Please try again.',
          confirmButtonText: 'Try Again',
          confirmButtonColor: '#dc3545'
        });
      } finally {
        this.isSubmitting = false;
      }
    },

    resetForm() {
      this.formData = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        lrn: '',
        gradeLevel: '',
        section: '',
        profilePicture: null
      };
    },

    showMessage(text, type) {
      this.message = text;
      this.messageType = type;
      setTimeout(() => {
        this.message = '';
        this.messageType = '';
      }, 5000);
    }
  }
};
</script>

<style scoped>
/* Main Container */
.student-registration-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #19a759 0%, #0e6e3a 100%);
  padding: 20px;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s ease-out;
}

.student-registration-page.loaded {
  opacity: 1;
  transform: translateY(0);
}

.registration-container {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 900px;
  position: relative;
  overflow: hidden;
}

.registration-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #19a759, #0e6e3a);
}

/* Header */
.registration-header {
  text-align: center;
  margin-bottom: 1.5rem;
  position: relative;
}

.back-button {
  position: absolute;
  left: 0;
  top: 0;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #34495e;
  font-weight: 500;
  font-size: 0.9rem;
}

.back-button:hover {
  background: #19a759;
  border-color: #19a759;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(25, 167, 89, 0.3);
}

.back-button .material-icons {
  font-size: 1rem;
}

h2 {
  font-size: 1.8rem;
  color: #2c3e50;
  margin-bottom: 0.3rem;
  font-weight: 600;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1rem;
  margin-bottom: 0;
}

/* Registration Disabled State */
.registration-disabled {
  text-align: center;
  padding: 2rem 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 2px solid #dee2e6;
  border-radius: 12px;
  color: #6c757d;
}

.disabled-icon {
  margin-bottom: 1.5rem;
}

.disabled-icon .material-icons {
  font-size: 4rem;
  color: #dc3545;
}

.registration-disabled h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #495057;
}

.registration-disabled p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

.back-to-login-btn {
  background: #19a759;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1.5rem auto 0;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.back-to-login-btn:hover {
  background: #0e6e3a;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(25, 167, 89, 0.4);
}

/* Form Styles */
.registration-form {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  margin-top: 0.5rem;
}

/* Desktop Landscape Layout */
@media (min-width: 1024px) {
  .registration-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.2rem 2rem;
    align-items: start;
  }
  
  .form-group:nth-child(1),
  .form-group:nth-child(2) {
    grid-column: span 1;
  }
  
  .form-group:nth-child(3),
  .form-group:nth-child(4) {
    grid-column: span 1;
  }
  
  .form-group:nth-child(5),
  .form-group:nth-child(6) {
    grid-column: span 1;
  }
  
  .form-group:nth-child(7),
  .form-group:nth-child(8) {
    grid-column: span 1;
  }
  
  .form-group:nth-child(9) {
    grid-column: span 2;
  }
  
  .register-button {
    grid-column: span 2;
    margin-top: 0.5rem;
  }
}

/* High DPI Display Optimization (150% scaling) */
@media (min-width: 1024px) and (max-height: 800px) {
  .student-registration-page {
    padding: 10px;
    align-items: flex-start;
    padding-top: 20px;
  }
  
  .registration-container {
    padding: 1.5rem;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }
  
  .registration-header {
    margin-bottom: 1rem;
  }
  
  h2 {
    font-size: 1.6rem;
    margin-bottom: 0.2rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .registration-form {
    gap: 1rem 1.5rem;
  }
  
  .animated-input {
    padding: 0.8rem;
    font-size: 0.9rem;
  }
  
  .register-button {
    padding: 0.8rem;
    font-size: 0.95rem;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #34495e;
  font-weight: 500;
  font-size: 1rem;
}

.material-icons {
  font-size: 1.1rem;
  color: #19a759;
}

.animated-input {
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
  width: 100%;
  box-sizing: border-box;
}

.animated-input:focus {
  border-color: #19a759;
  box-shadow: 0 0 0 4px rgba(25, 167, 89, 0.1);
  outline: none;
  background-color: white;
  transform: translateY(-2px);
}

.animated-input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Password Input */
.password-input {
  position: relative;
  width: 100%;
}

.password-input input {
  width: 100%;
  padding-right: 3rem;
  box-sizing: border-box;
}

.toggle-password {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: #7f8c8d;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toggle-password:hover {
  color: #19a759;
}

.toggle-password:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* File Upload */
.file-upload-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-input {
  display: none;
}

.file-upload-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px dashed #19a759;
  border-radius: 12px;
  background: rgba(25, 167, 89, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  color: #19a759;
  font-weight: 500;
  justify-content: center;
}

.file-upload-label:hover {
  background: rgba(25, 167, 89, 0.1);
  border-color: #0e6e3a;
}

.file-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  color: #155724;
  font-size: 0.9rem;
}

.file-preview .material-icons {
  color: #28a745;
}

/* Register Button */
.register-button {
  padding: 1rem;
  background: #19a759;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(25, 167, 89, 0.3);
  margin-top: 0.5rem;
}

.register-button:hover:not(:disabled) {
  background: #0e6e3a;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(25, 167, 89, 0.4);
}

.register-button:active:not(:disabled) {
  transform: translateY(-1px);
}

.register-button:disabled {
  background: #a5d6a7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Loading Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Messages */
.message {
  padding: 1rem;
  border-radius: 12px;
  margin-top: 1.5rem;
  text-align: center;
  font-weight: 500;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.success {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Responsive Design */
@media (max-width: 1023px) {
  .registration-form {
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
  }
  
  .form-group:nth-child(n) {
    grid-column: span 1;
  }
  
  .register-button {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .student-registration-page {
    padding: 15px;
  }
  
  .registration-container {
    padding: 1.5rem;
    border-radius: 12px;
    max-width: 450px;
  }
  
  h2 {
    font-size: 1.6rem;
  }
  
  .back-button {
    position: relative;
    margin-bottom: 0.8rem;
    align-self: flex-start;
    padding: 0.5rem 0.8rem;
    font-size: 0.85rem;
  }
  
  .registration-header {
    text-align: left;
  }
  
  .animated-input {
    padding: 0.9rem;
    font-size: 0.9rem;
  }
  
  .register-button {
    padding: 0.9rem;
    font-size: 0.95rem;
  }
  
  .registration-form {
    gap: 1.2rem;
  }
}

@media (max-width: 480px) {
  .student-registration-page {
    padding: 10px;
  }
  
  .registration-container {
    padding: 1.2rem;
    max-width: 100%;
  }
  
  h2 {
    font-size: 1.4rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .registration-form {
    gap: 1rem;
  }
  
  .animated-input {
    padding: 0.8rem;
    font-size: 0.85rem;
  }
  
  .register-button {
    padding: 0.8rem;
    font-size: 0.9rem;
  }
  
  .back-button {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }
}
</style>
