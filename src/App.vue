<template>
  <div class="app-container" :class="{ 'nav-collapsed': isNavCollapsed }">
    <!-- Show sidebar only if not on login or register page -->
    <Sidenav v-if="showSidebar" @nav-toggle="handleNavToggle" />
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script>
import Sidenav from "./components/SideNav.vue";
import { useRoute } from "vue-router";
import { computed, ref } from "vue";

export default {
  components: {
    Sidenav,
  },
  setup() {
    const route = useRoute();
    const isNavCollapsed = ref(window.innerWidth <= 768);

    // Define routes where sidebar should NOT be shown
    const authRoutes = ["/"];

    // Show sidebar if NOT on auth routes (login & register)
    const showSidebar = computed(() => !authRoutes.includes(route.path));

    const handleNavToggle = (collapsed) => {
      isNavCollapsed.value = collapsed;
    };

    return {
      showSidebar,
      isNavCollapsed,
      handleNavToggle,
    };
  },
};
</script>

<style>
.app-container {
  display: flex;
  min-height: 100vh;
  background: #f1f5f9;
}

.content {
  flex-grow: 1;
  padding: 24px;
  transition: all 0.3s ease;
  max-width: 100%;
  overflow-x: hidden;
  margin-left: 280px;
}

/* Add class to handle collapsed state */
.app-container.nav-collapsed .content {
  margin-left: 80px;
}

/* Add some global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
}
</style>
