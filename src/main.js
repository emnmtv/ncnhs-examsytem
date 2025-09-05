import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

// Ensure DOM is ready before mounting
const initApp = () => {
  const app = createApp(App);
  app.use(router);
  app.mount("#app");
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Import service worker after app initialization
import './registerServiceWorker'
