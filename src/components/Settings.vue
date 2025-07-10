<template>
  <div class="settings">
    <h1>Settings</h1>
    <div class="theme-selection">
      <label for="theme">Select SideNav Theme:</label>
      <select id="theme" v-model="selectedTheme" @change="changeTheme">
        <option value="default">Default</option>
        <option value="dark">Dark</option>
        <option value="yellow">Yellow</option>
        <option value="blue">Blue</option>
        <option value="real-fire">Real Fire</option>
        <option value="real-smoke">Real Smoke</option>
      </select>
    </div>
    <div class="effect-selection">
      <label for="effect">Select NavLink Active Effect:</label>
      <select id="effect" v-model="selectedEffect" @change="changeEffect">
        <option value="none">None</option>
        <option value="fire">Fire</option>
        <option value="smoke">Smoke</option>
      </select>
    </div>
    <div class="click-effect-selection">
      <label for="click-effect">Select Click Effect:</label>
      <select id="click-effect" v-model="clickEffectType" @change="changeClickEffect">
        <option value="none">None</option>
        <option value="fire">Fire</option>
        <option value="line">Line</option>
      </select>
    </div>
    
    <!-- PWA Installation Section -->
    <div class="pwa-installation-section">
      <h2>App Installation</h2>
      <p>Install the NCNHS Assessment Portal as an app on your device for offline access.</p>
      
      <div class="pwa-status">
        <div v-if="isPwaInstalled" class="status installed">
          <span class="material-icons">check_circle</span>
          <span>App is installed</span>
        </div>
        <div v-else class="status not-installed">
          <span class="material-icons">info</span>
          <span>App is not installed</span>
        </div>
      </div>
      
      <!-- Standard install button for desktop browsers that support beforeinstallprompt -->
      <button 
        v-if="deferredPrompt && !isPwaInstalled" 
        @click="installPWA" 
        class="install-button"
      >
        <span class="material-icons">get_app</span>
        Install Assessment Portal
      </button>
      
      <!-- Mobile install buttons - always shown on mobile devices when not installed -->
      <div v-if="!isPwaInstalled && isMobile" class="mobile-install-buttons">
        <h3>Install on Mobile</h3>
        
        <!-- Android Install Button -->
        <button 
          v-if="isAndroid"
          @click="showAndroidInstallInstructions = !showAndroidInstallInstructions" 
          class="mobile-install-button android"
        >
          <span class="material-icons">android</span>
          Install on Android
        </button>
        
        <!-- Android Installation Instructions -->
        <div v-if="isAndroid && showAndroidInstallInstructions" class="install-instructions android">
          <h4>To install on Android:</h4>
          <ol>
            <li>Tap the menu button <span class="material-icons">more_vert</span> in your browser</li>
            <li>Select "Add to Home screen" or "Install app"</li>
            <li>Follow the on-screen instructions</li>
          </ol>
          <img src="https://via.placeholder.com/300x150?text=Android+Install+Guide" alt="Android Installation Guide" class="install-guide-img">
        </div>
        
        <!-- iOS Install Button -->
        <button 
          v-if="isIOS"
          @click="showIOSInstallInstructions = !showIOSInstallInstructions" 
          class="mobile-install-button ios"
        >
          <span class="material-icons">phone_iphone</span>
          Install on iOS
        </button>
        
        <!-- iOS Installation Instructions -->
        <div v-if="isIOS && showIOSInstallInstructions" class="install-instructions ios">
          <h4>To install on iOS:</h4>
          <ol>
            <li>Tap the Share button <span class="material-icons">ios_share</span> at the bottom of your screen</li>
            <li>Scroll down and select "Add to Home Screen"</li>
            <li>Tap "Add" in the top-right corner</li>
          </ol>
          <img src="https://via.placeholder.com/300x150?text=iOS+Install+Guide" alt="iOS Installation Guide" class="install-guide-img">
        </div>
      </div>
      
      <!-- Default instructions for non-mobile or when deferredPrompt is not available -->
      <div v-else-if="!deferredPrompt && !isPwaInstalled && !isMobile" class="install-instructions">
        <p>To install this app:</p>
        <ul>
          <li>On Chrome (Desktop): Click the install icon <span class="material-icons">add_box</span> in the address bar</li>
          <li>On Edge: Click the menu button and select "Apps" > "Install this site as an app"</li>
          <li>On Firefox: This browser does not fully support PWA installation</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, inject, onMounted, onUnmounted } from 'vue';

export default {
  name: 'Settings',
  setup() {
    const selectedTheme = ref('default');
    const selectedEffect = ref('none');
    const clickEffectType = ref('none');
    const setClickEffectType = inject('setClickEffectType');
    
    // PWA installation refs
    const deferredPrompt = ref(null);
    const isPwaInstalled = ref(false);
    const isMobile = ref(false);
    const isAndroid = ref(false);
    const isIOS = ref(false);
    const showAndroidInstallInstructions = ref(false);
    const showIOSInstallInstructions = ref(false);

    const changeTheme = () => {
      document.documentElement.setAttribute('data-theme', selectedTheme.value);
    };

    const changeEffect = () => {
      document.documentElement.setAttribute('data-effect', selectedEffect.value);
    };

    const changeClickEffect = () => {
      setClickEffectType(clickEffectType.value);
    };
    
    // Detect device type
    const detectDevice = () => {
      // Check if mobile
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      isMobile.value = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      
      // Check specific platforms
      isAndroid.value = /android/i.test(userAgent.toLowerCase());
      isIOS.value = /iphone|ipad|ipod/i.test(userAgent.toLowerCase());
    };
    
    // Check if the app is already installed
    const checkPwaInstalled = () => {
      isPwaInstalled.value = window.matchMedia('(display-mode: standalone)').matches || 
                           window.navigator.standalone || 
                           document.referrer.includes('android-app://');
      
      console.log("PWA installed check:", isPwaInstalled.value);
    };
    
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt.value = e;
      console.log('PWA installation prompt available');
    };
    
    // Install the PWA
    const installPWA = async () => {
      if (!deferredPrompt.value) {
        console.log('No installation prompt available');
        return;
      }

      // Show the installation prompt
      deferredPrompt.value.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.value.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA installation');
        isPwaInstalled.value = true;
      } else {
        console.log('User dismissed the PWA installation');
      }
      
      // Clear the saved prompt since it can't be used again
      deferredPrompt.value = null;
    };
    
    // Listen for display mode changes (when the app gets installed)
    const handleDisplayModeChange = (e) => {
      if (e.matches) {
        console.log('App is now running in standalone mode');
        isPwaInstalled.value = true;
      }
    };

    onMounted(() => {
      // Detect device type
      detectDevice();
      
      // Check if the app is already installed
      checkPwaInstalled();
      
      // Add event listener for beforeinstallprompt event
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      // Add listener for display mode changes
      const mediaQuery = window.matchMedia('(display-mode: standalone)');
      mediaQuery.addEventListener('change', handleDisplayModeChange);
    });

    onUnmounted(() => {
      // Clean up the event listeners
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      
      const mediaQuery = window.matchMedia('(display-mode: standalone)');
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    });

    return {
      selectedTheme,
      selectedEffect,
      clickEffectType,
      changeTheme,
      changeEffect,
      changeClickEffect,
      deferredPrompt,
      isPwaInstalled,
      isMobile,
      isAndroid,
      isIOS,
      showAndroidInstallInstructions,
      showIOSInstallInstructions,
      installPWA
    };
  }
};
</script>

<style scoped>
.settings {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.theme-selection,
.effect-selection,
.click-effect-selection {
  margin-top: 20px;
}

.theme-selection label,
.effect-selection label,
.click-effect-selection label {
  margin-right: 10px;
}

/* PWA Installation Section Styles */
.pwa-installation-section {
  margin-top: 40px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 10px;
  border-left: 4px solid #19a759;
}

.pwa-installation-section h2 {
  color: #333;
  font-size: 1.5rem;
  margin-bottom: 10px;
}

.pwa-installation-section p {
  color: #666;
  margin-bottom: 20px;
}

.pwa-status {
  margin-bottom: 20px;
}

.status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  border-radius: 6px;
  font-weight: 500;
}

.status.installed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status.not-installed {
  background-color: #fff8e1;
  color: #ff8f00;
}

.install-button {
  background-color: #19a759;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.install-button:hover {
  background-color: #0e6e3a;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.install-button:active {
  transform: translateY(0);
}

/* Mobile install buttons */
.mobile-install-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 15px;
}

.mobile-install-buttons h3 {
  font-size: 1.2rem;
  margin-bottom: 10px;
  color: #333;
}

.mobile-install-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 20px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.mobile-install-button.android {
  background-color: #3ddc84;
  color: #fff;
}

.mobile-install-button.ios {
  background-color: #007aff;
  color: #fff;
}

.mobile-install-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.mobile-install-button:active {
  transform: translateY(0);
}

.install-instructions {
  background-color: #e3f2fd;
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
}

.install-instructions.android {
  background-color: rgba(61, 220, 132, 0.1);
  border-left: 4px solid #3ddc84;
}

.install-instructions.ios {
  background-color: rgba(0, 122, 255, 0.1);
  border-left: 4px solid #007aff;
}

.install-instructions h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.install-instructions p {
  margin-top: 0;
  margin-bottom: 10px;
  font-weight: 500;
  color: #0d47a1;
}

.install-instructions ul, .install-instructions ol {
  margin: 0;
  padding-left: 20px;
}

.install-instructions li {
  margin-bottom: 12px;
  color: #333;
}

.install-guide-img {
  display: block;
  max-width: 100%;
  margin: 15px auto 0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Material icons */
.material-icons {
  vertical-align: middle;
}

/* Responsive styles */
@media (max-width: 600px) {
  .pwa-installation-section {
    padding: 15px;
    margin-top: 30px;
  }
  
  .install-button, .mobile-install-button {
    width: 100%;
    justify-content: center;
  }
  
  .status {
    padding: 8px 12px;
  }
  
  .install-instructions {
    padding: 12px;
  }
  
  .install-guide-img {
    margin-top: 10px;
  }
}
</style>