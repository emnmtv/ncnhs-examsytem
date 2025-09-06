<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { loginUser, getPublicRegistrationStatus } from "../services/authService";
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
const showPrivacyPolicy = ref(false); // Add ref for privacy policy modal
const registrationEnabled = ref(false); // Track if public registration is enabled

// PWA installation refs
const deferredPrompt = ref(null);
const showInstallPrompt = ref(false);

// Listen for the beforeinstallprompt event
const handleBeforeInstallPrompt = (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt.value = e;
  // Show the install button
  showInstallPrompt.value = true;
};

// Install the PWA
const installPWA = async () => {
  if (!deferredPrompt.value) {
    return;
  }

  // Show the installation prompt
  deferredPrompt.value.prompt();
  
  // Wait for the user to respond to the prompt
  const choiceResult = await deferredPrompt.value.userChoice;
  
  if (choiceResult.outcome === 'accepted') {
    console.log('User accepted the PWA installation');
    showInstallPrompt.value = false;
  } else {
    console.log('User dismissed the PWA installation');
  }
  
  // Clear the saved prompt since it can't be used again
  deferredPrompt.value = null;
};

// Dismiss the installation prompt
const dismissInstallPrompt = () => {
  showInstallPrompt.value = false;
  // Store a flag in localStorage to not show the prompt again for some time
  localStorage.setItem('pwaPromptDismissed', Date.now().toString());
};

// Toggle privacy policy modal
const togglePrivacyPolicy = () => {
  showPrivacyPolicy.value = !showPrivacyPolicy.value;
};

onMounted(() => {
  // Trigger animation after component is mounted
  setTimeout(() => {
    pageLoaded.value = true;
  }, 100);

  // Check registration status
  checkRegistrationStatus();

  // Check if we should show the install prompt (not shown in the last 3 days)
  const lastDismissed = localStorage.getItem('pwaPromptDismissed');
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
  const shouldShowPrompt = !lastDismissed || (Date.now() - parseInt(lastDismissed)) > threeDaysInMs;
  
  // Check if the app is already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone || 
                       document.referrer.includes('android-app://');
  
  if (shouldShowPrompt && !isStandalone) {
    // Add event listener for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }
});

onUnmounted(() => {
  // Clean up the event listener
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
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
          router.push('/manage-users');
          break;
        case 'teacher':
          router.push('/create-exam');
          break;
        case 'student':
          router.push('/take-exam');
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

const goToSurvey = () => {
  router.push('/answer-survey');
};

const goToRegistration = () => {
  router.push('/register');
};

const checkRegistrationStatus = async () => {
  try {
    const response = await getPublicRegistrationStatus();
    registrationEnabled.value = response.enabled;
  } catch (error) {
    console.error('Error checking registration status:', error);
    registrationEnabled.value = false; // Default to disabled on error
  }
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
            <!-- <img src="@/assets/DepED-Logo.png" alt="DepEd Logo" class="deped-logo" /> -->
            <img src="@/assets/ncnhs-icon.png" alt="NCNHS Logo" class="ncnhs-logo" />
          </div>
          
          <h2 class="system-name">Assessment Portal</h2>
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
          <div class="footer-links">
            <a href="#" @click.prevent="togglePrivacyPolicy" class="policy-link">Privacy Policy</a>
            <span class="divider-dot">•</span>
            <a href="#" @click.prevent="goToSurvey" class="policy-link">Take Survey</a>
            <span v-if="registrationEnabled" class="divider-dot">•</span>
            <a v-if="registrationEnabled" href="#" @click.prevent="goToRegistration" class="policy-link">Register</a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Survey Button -->
    <button @click="goToSurvey" class="survey-button" :class="{ 'button-visible': pageLoaded }">
      <span class="material-icons">poll</span>
      <span class="button-text">Answer Survey</span>
    </button>
    
    
    <!-- PWA Installation Notification -->
    <div v-if="showInstallPrompt" class="pwa-install-prompt" :class="{ 'show-prompt': showInstallPrompt }">
      <div class="prompt-content">
        <div class="prompt-icon">
          <span class="material-icons">get_app</span>
        </div>
        <div class="prompt-text">
          <h3>Install NCNHS Assessment Portal</h3>
          <p>Install this app on your device for quick and convenient access</p>
        </div>
        <div class="prompt-actions">
          <button class="install-button" @click="installPWA">
            <span class="material-icons">add_to_home_screen</span>
            Install
          </button>
          <button class="dismiss-button" @click="dismissInstallPrompt">
            <span class="material-icons">close</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Privacy Policy Modal -->
    <div v-if="showPrivacyPolicy" class="privacy-policy-modal">
      <div class="modal-overlay" @click="togglePrivacyPolicy"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Privacy Policy</h3>
          <button class="close-button" @click="togglePrivacyPolicy">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body">
          <h4>NCNHS Assessment Portal Privacy Policy</h4>
          <p class="last-updated">Last Updated: {{ new Date().toLocaleDateString() }}</p>
          
          <section class="policy-section">
            <h5>1. Information We Collect</h5>
            <p>The NCNHS Assessment Portal collects the following information:</p>
            <ul>
              <li>Student and teacher personal information (name, LRN, email)</li>
              <li>Examination responses and grades</li>
              <li>Attendance records</li>
              <li>System usage data</li>
            </ul>
          </section>
          
          <section class="policy-section">
            <h5>2. How We Use Your Information</h5>
            <p>Your information is used for:</p>
            <ul>
              <li>Authentication and account management</li>
              <li>Providing educational services</li>
              <li>Recording academic performance</li>
              <li>System improvement and optimization</li>
            </ul>
          </section>
          
          <section class="policy-section">
            <h5>3. Data Security</h5>
            <p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure. The system uses encrypted connections and secure credential storage practices.</p>
          </section>
          
          <section class="policy-section">
            <h5>4. Data Retention</h5>
            <p>Your information is retained in accordance with Department of Education guidelines and local regulations for educational records.</p>
          </section>
          
          <section class="policy-section">
            <h5>5. Contact Information</h5>
            <p>For questions about this privacy policy or your data, please contact the school administration.</p>
          </section>
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

/* Survey Button Styles */
.survey-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(25, 167, 89, 0.7);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 8px 15px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(20px);
  z-index: 1000;
  font-size: 0.9rem;
}

/* Compact survey button for high DPI displays */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .survey-button {
    padding: 6px 12px;
    font-size: 0.8rem;
    bottom: 15px;
    right: 15px;
  }
  
  .survey-button .material-icons {
    font-size: 16px;
  }
}

@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .survey-button {
    padding: 5px 10px;
    font-size: 0.75rem;
    bottom: 12px;
    right: 12px;
  }
  
  .survey-button .material-icons {
    font-size: 14px;
  }
}

.survey-button.button-visible {
  opacity: 0.8;
  transform: translateY(0);
  transition-delay: 1.2s;
}

.survey-button:hover {
  background: rgba(25, 167, 89, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 1;
}

.survey-button .material-icons {
  font-size: 18px;
}

.button-text {
  font-weight: 500;
}


/* PWA Installation Prompt Styles */
.pwa-install-prompt {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  width: 320px;
  max-width: 90vw;
  padding: 0;
  z-index: 2000;
  overflow: hidden;
  transform: translateY(-100px);
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

/* Compact PWA prompt for high DPI displays */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .pwa-install-prompt {
    width: 280px;
    top: 15px;
    right: 15px;
  }
  
  .prompt-content {
    padding: 12px;
    gap: 8px;
  }
  
  .prompt-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 6px;
  }
  
  .prompt-icon .material-icons {
    font-size: 22px;
  }
  
  .prompt-text h3 {
    font-size: 14px;
    margin: 0 0 3px;
  }
  
  .prompt-text p {
    font-size: 12px;
  }
  
  .install-button {
    padding: 6px 12px;
    font-size: 12px;
  }
}

@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .pwa-install-prompt {
    width: 260px;
    top: 12px;
    right: 12px;
  }
  
  .prompt-content {
    padding: 10px;
    gap: 6px;
  }
  
  .prompt-icon {
    width: 36px;
    height: 36px;
    margin-bottom: 4px;
  }
  
  .prompt-icon .material-icons {
    font-size: 20px;
  }
  
  .prompt-text h3 {
    font-size: 13px;
    margin: 0 0 2px;
  }
  
  .prompt-text p {
    font-size: 11px;
  }
  
  .install-button {
    padding: 5px 10px;
    font-size: 11px;
  }
}

.pwa-install-prompt.show-prompt {
  transform: translateY(0);
  opacity: 1;
}

.prompt-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
}

.prompt-icon {
  background: #159750;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.prompt-icon .material-icons {
  color: white;
  font-size: 28px;
}

.prompt-text h3 {
  margin: 0 0 5px;
  font-size: 16px;
  color: #333;
}

.prompt-text p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.4;
}

.prompt-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.install-button {
  background: #159750;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.3s ease;
}

.install-button:hover {
  background: #0c7a3d;
}

.dismiss-button {
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  border-radius: 50%;
  transition: background 0.3s ease;
}

.dismiss-button:hover {
  background: rgba(0, 0, 0, 0.05);
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
  width: 100%;
}

.password-input input {
  width: 100%;
  padding-right: 2.5rem; /* Space for the icon */
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

.footer-links {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 1rem;
  align-items: center;
}

.policy-link {
  color: #19a759;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.policy-link:hover {
  text-decoration: underline;
  color: #0e6e3a;
}

.divider-dot {
  color: #bbb;
  font-size: 1.2rem;
  line-height: 0.5;
}

/* PWA Install Button within the form */
.install-app-button {
  padding: 1rem;
  margin-top: 1rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
  width: 100%;
}

.install-app-button:hover {
  background: #1976d2;
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4);
}

.install-app-button:active {
  transform: translateY(-1px);
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

/* Privacy Policy Modal */
.privacy-policy-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
}

.modal-content {
  position: relative;
  background: white;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 2;
  display: flex;
  flex-direction: column;
  animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.4rem;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #f0f0f0;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.policy-section {
  margin-bottom: 20px;
}

.policy-section h5 {
  font-size: 1.1rem;
  color: #19a759;
  margin: 15px 0 10px;
}

.policy-section p, .policy-section li {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #555;
}

.policy-section ul {
  padding-left: 20px;
}

.last-updated {
  font-style: italic;
  color: #888;
  font-size: 0.8rem;
  margin-bottom: 20px;
}

/* Responsive modal styles for high DPI displays */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .modal-content {
    max-width: 500px;
    max-height: 75vh;
  }
  
  .modal-header {
    padding: 16px;
  }
  
  .modal-header h3 {
    font-size: 1.2rem;
  }
  
  .modal-body {
    padding: 16px;
  }
  
  .policy-section h5 {
    font-size: 1rem;
    margin: 12px 0 8px;
  }
  
  .policy-section p, .policy-section li {
    font-size: 0.85rem;
    line-height: 1.5;
  }
  
  .last-updated {
    font-size: 0.75rem;
    margin-bottom: 15px;
  }
}

@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .modal-content {
    max-width: 450px;
    max-height: 70vh;
  }
  
  .modal-header {
    padding: 14px;
  }
  
  .modal-header h3 {
    font-size: 1.1rem;
  }
  
  .modal-body {
    padding: 14px;
  }
  
  .policy-section {
    margin-bottom: 15px;
  }
  
  .policy-section h5 {
    font-size: 0.95rem;
    margin: 10px 0 6px;
  }
  
  .policy-section p, .policy-section li {
    font-size: 0.8rem;
    line-height: 1.4;
  }
  
  .last-updated {
    font-size: 0.7rem;
    margin-bottom: 12px;
  }
}

/* Responsive styles */

/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .login-content {
    height: 100vh;
  }
  
  .welcome-banner {
    padding: 2rem;
  }
  
  .school-name {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
  }
  
  .system-name {
    font-size: 1.4rem;
    margin: 1rem 0;
  }
  
  .tagline {
    font-size: 1rem;
    margin-top: 1rem;
  }
  
  .deped-logo, .ncnhs-logo {
    height: 80px;
  }
  
  .logo-container {
    margin: 1.5rem 0;
    gap: 2rem;
  }
  
  .login-form-container {
    padding: 2rem;
  }
  
  .logo {
    width: 70px;
    height: 70px;
    margin-bottom: 1rem;
  }
  
  h2 {
    font-size: 1.6rem;
    margin-bottom: 0.4rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .login-form {
    gap: 1.4rem;
    max-width: 350px;
  }
  
  .animated-input {
    padding: 1rem;
    font-size: 0.95rem;
  }
  
  .login-button {
    padding: 1rem;
    font-size: 1rem;
  }
  
  label {
    font-size: 1rem;
  }
}

/* Compact layout for 14-inch laptops and lower resolutions */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .welcome-banner {
    padding: 1.5rem;
  }
  
  .school-name {
    font-size: 1.6rem;
    margin-bottom: 1rem;
  }
  
  .system-name {
    font-size: 1.2rem;
    margin: 0.8rem 0;
    letter-spacing: 1px;
  }
  
  .tagline {
    font-size: 0.95rem;
    margin-top: 0.8rem;
  }
  
  .deped-logo, .ncnhs-logo {
    height: 70px;
  }
  
  .logo-container {
    margin: 1rem 0;
    gap: 1.5rem;
  }
  
  .login-form-container {
    padding: 1.8rem;
  }
  
  .login-header {
    margin-bottom: 2rem;
  }
  
  .logo {
    width: 60px;
    height: 60px;
    margin-bottom: 0.8rem;
  }
  
  h2 {
    font-size: 1.4rem;
  }
  
  .login-form {
    gap: 1.2rem;
    max-width: 320px;
  }
  
  .animated-input {
    padding: 0.9rem;
    font-size: 0.9rem;
  }
  
  .login-button {
    padding: 0.9rem;
    font-size: 0.95rem;
    margin-top: 0.8rem;
  }
  
  .login-footer {
    margin-top: 1.5rem;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .welcome-banner {
    padding: 1.2rem;
  }
  
  .school-name {
    font-size: 1.4rem;
    margin-bottom: 0.8rem;
  }
  
  .system-name {
    font-size: 1.1rem;
    margin: 0.6rem 0;
  }
  
  .tagline {
    font-size: 0.85rem;
    margin-top: 0.6rem;
  }
  
  .deped-logo, .ncnhs-logo {
    height: 60px;
  }
  
  .logo-container {
    margin: 0.8rem 0;
    gap: 1rem;
  }
  
  .login-form-container {
    padding: 1.5rem;
  }
  
  .login-header {
    margin-bottom: 1.5rem;
  }
  
  .logo {
    width: 50px;
    height: 50px;
    margin-bottom: 0.6rem;
  }
  
  h2 {
    font-size: 1.3rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .login-form {
    gap: 1rem;
    max-width: 300px;
  }
  
  .animated-input {
    padding: 0.8rem;
    font-size: 0.85rem;
  }
  
  .login-button {
    padding: 0.8rem;
    font-size: 0.9rem;
    margin-top: 0.6rem;
  }
  
  label {
    font-size: 0.9rem;
  }
  
  .material-icons {
    font-size: 1rem;
  }
  
  .login-footer {
    margin-top: 1.2rem;
  }
  
  .policy-link {
    font-size: 0.8rem;
  }
}

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
  
  /* Reposition survey button for mobile */
  .survey-button {
    bottom: auto;
    top: 60px;
    right: 15px;
    z-index: 10;
  }
  
  /* Hide text, show only icon on mobile */
  .survey-button .button-text {
    display: none;
  }
  
  /* Make the button smaller and circular for icon-only view */
  .survey-button {
    padding: 8px;
    border-radius: 50%;
    aspect-ratio: 1/1;
    display: flex;
    align-items: center;
    justify-content: center;
  }


  /* Adjust modal for mobile */
  .modal-content {
    width: 95%;
    max-height: 85vh;
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
  
  .survey-button {
    top: 50px;
    right: 10px;
    padding: 6px;
    font-size: 0.8rem;
  }
  
  .survey-button .material-icons {
    font-size: 16px;
  }


  .footer-links {
    flex-direction: column;
    gap: 5px;
  }
  
  .divider-dot {
    display: none;
  }
  
  /* Make the modal take full screen on very small devices */
  .modal-content {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
  
  .modal-body {
    padding: 15px;
  }
  
  .policy-section h5 {
    font-size: 1rem;
  }
  
  .policy-section p, .policy-section li {
    font-size: 0.9rem;
  }
  
  /* Adjust install button for mobile */
  .install-app-button {
    padding: 0.8rem;
    font-size: 0.9rem;
  }
}
</style>
