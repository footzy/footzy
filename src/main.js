// PWA Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/public/service-worker.js')
      .catch(() => {});
  });
}
