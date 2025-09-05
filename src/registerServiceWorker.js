import { register } from 'register-service-worker'

if (process.env.NODE_ENV === 'production') {
  // Ensure DOM is ready before registering service worker
  const initServiceWorker = () => {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.log('Service worker not supported')
      return
    }

    register(`${process.env.BASE_URL}service-worker.js`, {
      ready () {
        console.log('App is being served from cache by a service worker.')
      },
      registered (registration) {
        console.log('Service worker has been registered.')
        // Check for updates every 1 hour
        setInterval(() => {
          registration.update()
        }, 1000 * 60 * 60)
      },
      cached () {
        console.log('Content has been cached for offline use.')
      },
      updatefound () {
        console.log('New content is downloading.')
      },
      updated (registration) {
        console.log('New content is available; please refresh.')
        // Notify the app a new SW is waiting
        if (document && document.dispatchEvent) {
          document.dispatchEvent(new CustomEvent('swUpdated', { detail: registration }))
        }
      },
      offline () {
        console.log('No internet connection found. App is running in offline mode.')
      },
      error (error) {
        console.error('Error during service worker registration:', error)
      }
    })

    // Listen for user-accepted update to trigger skipWaiting on the waiting SW
    let refreshing = false
    if (navigator.serviceWorker && navigator.serviceWorker.addEventListener) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initServiceWorker)
  } else {
    initServiceWorker()
  }
}
