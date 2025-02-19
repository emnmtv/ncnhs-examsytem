<template>
  <div class="app-container">
    <!-- Show sidebar only if not on login or register page -->
    <Sidenav v-if="showSidebar" />
    <div class="content">
      <router-view />
    </div>
  </div>
</template>

<script>
import Sidenav from "./components/SideNav.vue";
import { useRoute } from "vue-router";
import { computed } from "vue";

export default {
  components: {
    Sidenav,
  },
  setup() {
    const route = useRoute();

    // Define routes where sidebar should NOT be shown
    const authRoutes = ["/"];

    // Show sidebar if NOT on auth routes (login & register)
    const showSidebar = computed(() => !authRoutes.includes(route.path));

    return {
      showSidebar,
    };
  },
};
</script>

<style>
.app-container {
  display: flex;
}

.content {
  flex-grow: 1;
  padding: 20px;
}
</style>
