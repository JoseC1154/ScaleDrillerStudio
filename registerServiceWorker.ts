
export function register() {
  if ('serviceWorker' in navigator) {
    // The script is loaded as a module, which is deferred by default.
    // The DOM should be ready, so we can try to register the service worker directly.
    // This avoids potential issues with the 'load' event in some environments.
    const swUrl = './service-worker.js';
    navigator.serviceWorker.register(swUrl)
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  }
}