<template>
  <div class="app-container" :class="{ 'nav-collapsed': isNavCollapsed, 'no-nav': !showSidebar }" @click="handleClick" @mousemove="handleMouseMove">
    <!-- Show sidebar only if not on login or register page -->
    <Sidenav v-if="showSidebar" @nav-toggle="handleNavToggle" />
    <TopBar v-if="showSidebar" />
    <div class="content" :class="{ 'full-width': !showSidebar, 'with-topbar': showSidebar }">
      <router-view />
    </div>
  </div>
</template>

<script>
import Sidenav from "./components/SideNav.vue";
import TopBar from "./components/TopBar.vue";
import { useRoute } from "vue-router";
import { computed, ref, provide } from "vue";

export default {
  components: {
    Sidenav,
    TopBar
  },
  setup() {
    const route = useRoute();
    const isNavCollapsed = ref(window.innerWidth <= 768);
    const clickEffectType = ref('none');

    // Define routes where sidebar should NOT be shown
    const authRoutes = ["/"];

    // Show sidebar if NOT on auth routes (login & register)
    const showSidebar = computed(() => !authRoutes.includes(route.path));

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

    return {
      showSidebar,
      isNavCollapsed,
      handleNavToggle,
      handleClick,
      handleMouseMove,
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
  margin-top: 90px; /* Update to match the 100px height of the top bar */
  padding-top: 20px; /* Slightly increased padding for better spacing */
  
}
}
</style>
