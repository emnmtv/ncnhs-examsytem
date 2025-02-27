<script setup>
import { ref, reactive } from "vue";
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
  <div class="login-container">
    <div class="login-content">
      <!-- Left side - Login Form -->
      <div class="login-form-container">
        <div class="login-header">
          <img src="../assets/logo.png" alt="NCNHS Logo" class="logo" />
          <h1>Welcome Back!</h1>
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

      <!-- Right side - Welcome Banner -->
      <div class="welcome-banner">
        <div class="banner-content">
          <h2>NCNHS Examination System</h2>
          <p>Empowering education through technology</p>
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

/* Update the container styles */
.login-container {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 0;
  margin: 0;
  overflow: hidden;
}

.login-content {
  display: flex;
  background: white;
  border-radius: 0;
  overflow: hidden;
  width: 100%;
  height: 100vh;
  max-width: none;
  min-height: auto;
  box-shadow: none;
}

.login-form-container {
  flex: 1;
  padding: 2rem 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 600px;
  margin: 0 auto;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 100px;
  height: 100px;
  object-fit: contain;
  margin-bottom: 1.5rem;
}

h1 {
  font-size: 2rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1.1rem;
}

.login-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 400px;
  margin: 0 auto;
  width: 100%;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #34495e;
  font-weight: 500;
}

.material-icons {
  font-size: 1.2rem;
  color: #7f8c8d;
}

input {
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.1);
  outline: none;
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
}

.login-button {
  padding: 1rem;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.login-button:hover:not(:disabled) {
  background: #43A047;
  transform: translateY(-2px);
}

.login-button:disabled {
  background: #a5d6a7;
  cursor: not-allowed;
}

.welcome-banner {
  flex: 1.5;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: white;
  text-align: center;
}

.banner-content h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.banner-content p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  color: #7f8c8d;
}

/* Loading Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Update responsive styles */
@media (max-width: 768px) {
  .login-container {
    height: 100vh;
    padding: 0;
  }

  .login-content {
    height: 100vh;
    border-radius: 0;
  }

  .login-form-container {
    padding: 2rem;
    justify-content: center;
  }

  .welcome-banner {
    display: none;
  }

  .login-form {
    max-width: 100%;
  }
}
</style>
