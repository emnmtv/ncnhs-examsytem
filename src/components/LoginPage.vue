<script setup>
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { loginUser } from "../services/authService";

const router = useRouter();
const credentials = reactive({
  identifier: '',
  password: ''
});
const error = ref('');

const handleLogin = async () => {
  try {
    console.log('Login attempt started');
    console.log('Credentials:', {
      identifier: credentials.identifier,
      passwordLength: credentials.password.length
    });

    error.value = ''; // Clear any previous errors
    
    // Determine if the identifier is email or LRN based on the input value
    const loginData = {
      password: credentials.password
    };

    // Check if the identifier is a number (LRN) or email
    const isNumeric = !isNaN(credentials.identifier) && !isNaN(parseFloat(credentials.identifier));
    
    if (isNumeric) {
      loginData.lrn = parseInt(credentials.identifier);
      console.log('Detected LRN login with:', loginData.lrn);
    } else {
      loginData.email = credentials.identifier;
      console.log('Detected email login with:', loginData.email);
    }

    console.log('Sending login request with data:', {
      email: loginData.email,
      lrn: loginData.lrn,
      passwordLength: loginData.password.length
    });

    const response = await loginUser(loginData.email, loginData.lrn, loginData.password);
    console.log('Login response received:', response);
    
    // Handle successful login
    if (response.token) {
      console.log('Token received, redirecting based on role:', response.role);
      // Redirect based on user role
      switch (response.role) {
        case 'admin':
          console.log('Redirecting to admin dashboard');
          router.push('/admin-dashboard');
          break;
        case 'teacher':
          console.log('Redirecting to teacher dashboard');
          router.push('/teacher-dashboard');
          break;
        case 'student':
          console.log('Redirecting to student dashboard');
          router.push('/dashboard');
          break;
       
      }
    }
  } catch (err) {
    console.error('Login error:', {
      message: err.message,
      error: err
    });
    error.value = err.message || 'Login failed. Please try again.';
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-form">
      <h2>Login</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email or LRN:</label>
          <input 
            v-model="credentials.identifier" 
            type="text" 
            required
            placeholder="Enter email or LRN number"
            class="login-input"
          />
        </div>
        
        <div class="form-group">
          <label>Password:</label>
          <input 
            v-model="credentials.password" 
            type="password" 
            required
            placeholder="Enter password"
            class="login-input"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="login-button">Login</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
}

.login-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.login-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.error-message {
  color: #f44336;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.5rem;
  background-color: rgba(244, 67, 54, 0.1);
  border-radius: 4px;
}

.login-button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover {
  background-color: #45a049;
}

.login-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
