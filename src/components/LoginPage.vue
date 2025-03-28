<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { loginUser } from "../services/authService";
import Swal from 'sweetalert2';

const router = useRouter();
const credentials = reactive({
  identifier: '',
  password: ''
});
const error = ref('');
const loading = ref(false);
const showPassword = ref(false);
const pageLoaded = ref(false);

onMounted(() => {
  // Trigger animation after component is mounted
  setTimeout(() => {
    pageLoaded.value = true;
  }, 100);
});

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = '';

    const loginData = {
      password: credentials.password
    };

    const isNumeric = !isNaN(credentials.identifier) && !isNaN(parseFloat(credentials.identifier));
    
    if (isNumeric) {
      loginData.lrn = parseInt(credentials.identifier);
    } else {
      loginData.email = credentials.identifier;
    }

    const response = await loginUser(loginData.email, loginData.lrn, loginData.password);
    
    if (response.token) {
      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Login Successful!',
        text: `Welcome back${response.firstName ? ', ' + response.firstName : ''}!`,
        timer: 1500,
        showConfirmButton: false
      });

      // Redirect based on role
      switch (response.role) {
        case 'admin':
          router.push('/admin-dashboard');
          break;
        case 'teacher':
          router.push('/teacher-dashboard');
          break;
        case 'student':
          router.push('/dashboard');
          break;
      }
    }
  } catch (err) {
    error.value = err.message || 'Login failed. Please try again.';
    
    // Show error toast
    Swal.fire({
      icon: 'error',
      title: 'Login Failed',
      text: error.value,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
  } finally {
    loading.value = false;
  }
};

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="login-container" :class="{ 'loaded': pageLoaded }">
    <div class="login-content">
      <!-- Left side - Welcome Banner with new school branding -->
      <div class="welcome-banner">
        <div class="banner-content" :class="{ 'appear': pageLoaded }">
          <h1 class="school-name">New Cabalan National High School</h1>
          
          <div class="logo-container">
            <img src="@/assets/DepED-Logo.png" alt="DepEd Logo" class="deped-logo" />
            <img src="@/assets/ncnhs-icon.png" alt="NCNHS Logo" class="ncnhs-logo" />
          </div>
          
          <h2 class="system-name">Examination Portal</h2>
          <p class="tagline">Empowering Education Through Technology</p>
        </div>
      </div>

      <!-- Right side - Login Form -->
      <div class="login-form-container" :class="{ 'slide-in': pageLoaded }">
        <div class="login-header">
          <img src="@/assets/ncnhs-icon.png" alt="NCNHS Logo" class="logo" />
          <h2>User Login</h2>
          <p class="subtitle">Sign in to continue to your account</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label>
              <span class="material-icons">person</span>
              Email or LRN
            </label>
            <input 
              v-model="credentials.identifier" 
              type="text" 
              required
              placeholder="Enter your email or LRN number"
              :disabled="loading"
              class="animated-input"
            />
          </div>
          
          <div class="form-group">
            <label>
              <span class="material-icons">lock</span>
              Password
            </label>
            <div class="password-input">
              <input 
                v-model="credentials.password" 
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Enter your password"
                :disabled="loading"
                class="animated-input"
              />
              <button 
                type="button" 
                class="toggle-password"
                @click="togglePassword"
              >
                <span class="material-icons">
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="login-button"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner"></span>
            <span v-else class="material-icons">login</span>
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <div class="login-footer">
          <p>Need help? Contact your system administrator</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add these global styles at the top */
:root {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Container styles */
.login-container {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  padding: 0;
  margin: 0;
  overflow: hidden;
  position: relative;
}

.login-content {
  display: flex;
  background: white;
  border-radius: 0;
  overflow: hidden;
  width: 100%;
  height: 100vh;
  box-shadow: none;
  position: relative;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s ease-out;
}

.login-container.loaded .login-content {
  opacity: 1;
  transform: translateY(0);
}

/* Welcome Banner Styles - Left Side */
.welcome-banner {
  flex: 1.5;
  background: linear-gradient(135deg, #19a759 0%, #0e6e3a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: white;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.05)"/></svg>');
  background-size: 120px 120px;
  opacity: 0.3;
}

.banner-content {
  position: relative;
  z-index: 1;
  opacity: 0;
  transform: translateY(30px);
  transition: all 1s ease-out 0.3s;
}

.banner-content.appear {
  opacity: 1;
  transform: translateY(0);
}

.school-name {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.logo-container {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin: 2rem 0;
}

.deped-logo, .ncnhs-logo {
  height: 120px;
  width: auto;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
  transition: transform 0.3s ease;
}

.deped-logo:hover, .ncnhs-logo:hover {
  transform: scale(1.05);
}

.system-name {
  font-size: 2rem;
  margin: 1.5rem 0;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.tagline {
  font-size: 1.2rem;
  opacity: 0.9;
  font-style: italic;
  margin-top: 2rem;
}

/* Login Form Styles - Right Side */
.login-form-container {
  flex: 1;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: 0;
  transform: translateX(30px);
  transition: all 0.8s ease-out 0.5s;
}

.login-form-container.slide-in {
  opacity: 1;
  transform: translateX(0);
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo {
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin-bottom: 1.5rem;
  animation: pulse 2s infinite alternate ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.05); }
}

h2 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #34495e;
  font-weight: 500;
  font-size: 1.1rem;
}

.material-icons {
  font-size: 1.2rem;
  color: #19a759;
}

.animated-input {
  padding: 1.2rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.animated-input:focus {
  border-color: #19a759;
  box-shadow: 0 0 0 4px rgba(25, 167, 89, 0.1);
  outline: none;
  background-color: white;
  transform: translateY(-2px);
}

.password-input {
  position: relative;
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
}

.toggle-password:hover {
  color: #19a759;
}

.login-button {
  padding: 1.2rem;
  background: #19a759;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(25, 167, 89, 0.3);
  margin-top: 1rem;
}

.login-button:hover:not(:disabled) {
  background: #0e6e3a;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(25, 167, 89, 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(-1px);
}

.login-button:disabled {
  background: #a5d6a7;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  color: #7f8c8d;
}

/* Loading Spinner */
.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive styles */
@media (max-width: 1024px) {
  .school-name {
    font-size: 2rem;
  }
  
  .system-name {
    font-size: 1.6rem;
  }
  
  .deped-logo, .ncnhs-logo {
    height: 90px;
  }
}

@media (max-width: 768px) {
  .login-container {
    background: #fff;
  }
  
  .login-content {
    flex-direction: column;
    height: 100vh;
    min-height: 100vh;
    width: 100%;
  }
  
  .welcome-banner {
    position: relative;
    padding: 2rem 2rem 2rem;
    border-radius: 0;
    min-height: 180px;
    height: auto;
    z-index: 2;
  }
  
  .welcome-banner::after {
    content: none;
  }
  
  .login-form-container {
    padding: 2rem;
    padding-top: 3.5rem;
    flex: 1;
    z-index: 1;
    background: white;
    position: relative;
    margin-top: -50px;
  }
  
  .login-form-container::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 50px;
    background: white;
    border-radius: 50% 50% 0 0 / 100% 100% 0 0;
    transform: translateY(-50%);
    z-index: 2;
  }
  
  .logo {
    display: none; /* Hide logo on mobile */
  }
  
  .login-header {
    margin-top: 1rem;
  }
}

@media (max-width: 576px) {
  .welcome-banner {
    padding: 1.5rem 1.5rem 2rem;
    min-height: 160px;
  }
  
  .login-form-container {
    padding: 1.5rem;
    padding-top: 3rem;
    margin-top: -30px;
  }
  
  .login-form-container::before {
    height: 30px;
  }
  
  .school-name {
    font-size: 1.3rem;
  }
  
  .logo-container {
    gap: 1rem;
    margin: 0.5rem 0;
  }
  
  .deped-logo, .ncnhs-logo {
    height: 50px;
  }
  
  .system-name {
    font-size: 1.1rem;
    margin: 0.5rem 0;
  }
  
  .tagline {
    font-size: 0.9rem;
    margin-top: 0.5rem;
  }
  
  .login-form-container {
    padding: 1.5rem;
    margin-top: 1rem;
  }
  
  .animated-input {
    padding: 0.9rem;
  }
  
  .login-button {
    padding: 0.9rem;
  }
}
</style>
