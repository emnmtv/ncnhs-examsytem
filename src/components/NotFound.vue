<template>
  <div class="not-found">
    <div class="logo-container">
      <img src="@/assets/ncnhs-icon.png" alt="NCNHS Logo" class="logo">
    </div>
    <div class="error-code">404</div>
    <div class="error-title">Page Not Found</div>
    <div class="error-message">
      The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
    </div>
    <div class="actions">
      <button class="btn-primary" @click="goHome">Go to Homepage</button>
      <button class="btn-secondary" @click="goBack">Go Back</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
  methods: {
    goHome() {
      const userRole = localStorage.getItem('userRole');
      if (userRole === 'admin') {
        this.$router.push('/admin-dashboard');
      } else if (userRole === 'teacher') {
        this.$router.push('/teacher-dashboard');
      } else if (userRole === 'student') {
        this.$router.push('/dashboard');
      } else {
        this.$router.push('/');
      }
    },
    goBack() {
      this.$router.go(-1);
    }
  }
}
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #1a5d1a 0%, #116530 50%, #0d4226 100%);
  color: white;
  padding: 20px;
  text-align: center;
}

.logo-container {
  margin-bottom: 30px;
}

.logo {
  width: 120px;
  height: auto;
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
}

.error-code {
  font-size: 150px;
  font-weight: bold;
  color: white;
  line-height: 1;
  margin-bottom: 10px;
  text-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.error-title {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 20px;
  color: white;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.error-message {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 40px;
  line-height: 1.6;
  max-width: 600px;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.btn-primary, .btn-secondary {
  padding: 14px 28px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background-color: #4ade80;
  color: #064e3b;
}

.btn-primary:hover {
  background-color: #86efac;
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
  background-color: transparent;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.btn-secondary:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: white;
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .error-code {
    font-size: 120px;
  }
  
  .error-title {
    font-size: 28px;
  }
  
  .error-message {
    font-size: 16px;
    padding: 0 20px;
  }
  
  .actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .btn-primary, .btn-secondary {
    width: 200px;
  }
}
</style> 