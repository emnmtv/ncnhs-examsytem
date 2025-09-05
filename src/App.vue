<template>
  <div class="app-container" :class="{ 'nav-collapsed': isNavCollapsed, 'no-nav': !showSidebar }" @click="handleClick" @mousemove="handleMouseMove">
    <!-- Show sidebar only if not on login or register page -->
    <Sidenav v-if="showSidebar" @nav-toggle="handleNavToggle" />
    <TopBar v-if="showSidebar" />
    <div class="content" :class="{ 'full-width': !showSidebar, 'with-topbar': showSidebar }">
      <router-view />
    </div>
    <div v-if="updateAvailable" class="update-banner">
      <span>New version available.</span>
      <button class="update-btn" @click="refreshApp">Update</button>
      <button class="dismiss-btn" @click="dismissUpdate">Dismiss</button>
    </div>
  </div>
</template>

<script>
import Sidenav from "./components/SideNav.vue";
import TopBar from "./components/TopBar.vue";
import { useRoute } from "vue-router";
import { computed, ref, provide, onMounted, onBeforeUnmount } from "vue";

export default {
  components: {
    Sidenav,
    TopBar
  },
  setup() {
    const route = useRoute();
    const isNavCollapsed = ref(window.innerWidth <= 768);
    const isAuthenticated = ref(!!localStorage.getItem('jwtToken'));
    const clickEffectType = ref('none');

    // Define routes where sidebar should NOT be shown
    const authRoutes = ["/", "/forbidden", "/404"];

    // Show sidebar only when user is authenticated and not on auth/error pages
    const showSidebar = computed(() => {
      return isAuthenticated.value && !authRoutes.includes(route.path) && !route.name?.includes('NotFound');
    });

    const handleNavToggle = (collapsed) => {
      isNavCollapsed.value = collapsed;
    };

    const handleClick = (event) => {
      if (clickEffectType.value !== 'none') {
        const clickEffect = document.createElement('div');
        clickEffect.className = 'click-effect';
        clickEffect.style.top = `${event.clientY}px`;
        clickEffect.style.left = `${event.clientX}px`;
        document.body.appendChild(clickEffect);
        setTimeout(() => {
          clickEffect.remove();
        }, 1500);
      }
    };

    const handleMouseMove = (event) => {
      if (clickEffectType.value === 'line') {
        const lineEffect = document.createElement('div');
        lineEffect.className = 'line-effect';
        lineEffect.style.top = `${event.clientY}px`;
        lineEffect.style.left = `${event.clientX}px`;
        document.body.appendChild(lineEffect);
        setTimeout(() => {
          lineEffect.remove();
        }, 500);
      }
    };

    const setClickEffectType = (type) => {
      clickEffectType.value = type;
    };

    provide('setClickEffectType', setClickEffectType);

    const handleAuthChanged = () => {
      isAuthenticated.value = !!localStorage.getItem('jwtToken');
    };

    onMounted(() => {
      // Add null checks for window and document
      if (window && window.addEventListener) {
        window.addEventListener('auth-changed', handleAuthChanged);
        window.addEventListener('storage', handleAuthChanged);
      }
      
      // Listen for service worker update events dispatched from registerServiceWorker.js
      if (document && document.addEventListener) {
        document.addEventListener('swUpdated', (event) => {
          swRegistration.value = event.detail;
          updateAvailable.value = true;
        });
      }
    });

    onBeforeUnmount(() => {
      // Add null checks for cleanup
      if (window && window.removeEventListener) {
        window.removeEventListener('auth-changed', handleAuthChanged);
        window.removeEventListener('storage', handleAuthChanged);
      }
      if (document && document.removeEventListener) {
        document.removeEventListener('swUpdated', () => {});
      }
    });

    // SW update handling
    const updateAvailable = ref(false);
    const swRegistration = ref(null);
    const refreshApp = () => {
      const registration = swRegistration.value;
      if (!registration || !registration.waiting) {
        window.location.reload();
        return;
      }
      const waitingSW = registration.waiting;
      // Reload when the new SW takes control
      if (navigator.serviceWorker && navigator.serviceWorker.addEventListener) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        }, { once: true });
      }
      waitingSW.postMessage({ type: 'SKIP_WAITING' });
      updateAvailable.value = false;
    };

    const dismissUpdate = () => {
      updateAvailable.value = false;
    };

    return {
      showSidebar,
      isNavCollapsed,
      handleNavToggle,
      handleClick,
      handleMouseMove,
      isAuthenticated,
      updateAvailable,
      refreshApp,
      dismissUpdate,
    };
  },
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app-container {
  display: flex;
  min-height: 100vh;
  background: #f1f5f9;
}

.app-container.no-nav {
  padding: 0;
  margin: 0;
  background: none;
}

.content {
  flex-grow: 1;
  padding: 24px;
  transition: all 0.3s ease;
  max-width: 100%;
  overflow-x: hidden;
  margin-left: 200px;
}

.content.with-topbar {
  margin-top: 100px; /* Update to match the 100px height of the top bar */
  padding-top: 60px; /* Slightly increased padding for better spacing */
}

.content.full-width {
  margin-left: 0;
  padding: 0;
}

/* Add class to handle collapsed state */
.app-container.nav-collapsed .content {
  margin-left: 80px;
}

.app-container.no-nav .content {
  margin-left: 0;
}

/* High DPI and Zoom levels (125%, 150%) for laptops */
@media screen and (max-width: 1536px) and (min-width: 1025px) {
  .content {
    padding: 20px;
    margin-left: 180px;
  }
  
  .content.with-topbar {
    margin-top: 85px;
    padding-top: 50px;
  }
  
  .app-container.nav-collapsed .content {
    margin-left: 70px;
  }
}

/* Compact layout for 14-inch laptops and lower resolutions */
@media screen and (max-width: 1366px) and (min-width: 1025px) {
  .content {
    padding: 18px;
    margin-left: 160px;
  }
  
  .content.with-topbar {
    margin-top: 75px;
    padding-top: 45px;
  }
  
  .app-container.nav-collapsed .content {
    margin-left: 65px;
  }
}

/* Very high zoom levels (150%+) or very compact displays */
@media screen and (max-width: 1280px) and (min-width: 1025px) {
  .content {
    padding: 16px;
    margin-left: 140px;
  }
  
  .content.with-topbar {
    margin-top: 65px;
    padding-top: 40px;
  }
  
  .app-container.nav-collapsed .content {
    margin-left: 60px;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .content {
    margin-left: 0;
    padding: 16px;
  }
  
  .app-container.nav-collapsed .content {
    margin-left: 0;
  }

  .content.full-width {
    padding: 0;
  }
}

/* Global Print Styles */
@media print {
  /* Hide sidenav and other navigation elements */
  .sidenav,
  .nav-links,
  .toggle-btn,
  .logo-section,
  .no-print {
    display: none !important;
  }

  /* Adjust main content area */
  .main-content {
    margin-left: 0 !important;
    padding: 0 !important;
    width: 100% !important;
  }

  /* Remove backgrounds and shadows */
  * {
    background: transparent !important;
    box-shadow: none !important;
  }

  /* Ensure full width for print */
  .survey-preview-container {
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* Break pages appropriately */
  .question-item {
    page-break-inside: avoid;
  }

  /* Remove unnecessary spacing */
  body {
    margin: 0;
    padding: 0;
  }
}

/* Click Effect Styles */
.click-effect {
  position: absolute;
  width: 50px;
  height: 50px;
  background: url('@/assets/fire.gif') center center / cover no-repeat;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 9999;
}

/* Line Effect Styles */
.line-effect {
  position: absolute;
  width: 5px;
  height: 5px;
  background: red;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);
  z-index: 9999;
}

/* For mobile screens */
@media (max-width: 768px) {
  .content.with-topbar {
    margin-top: 50px;
    padding-top: 20px;
  }
}

.update-banner {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  bottom: 16px;
  background: #111827;
  color: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 10px 15px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10000;
}

.update-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.dismiss-btn {
  background: transparent;
  color: #e5e7eb;
  border: 1px solid #4b5563;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}
</style>
