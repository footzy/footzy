const CACHE_NAME = 'footzy-v15';
const STATIC_ASSETS = [
  '/',
  '/src/css/tokens.css',
  '/src/css/components.css',
  '/src/css/pages.css',
  '/src/pages/home.html',
  '/src/pages/match.html',
  '/src/pages/pronostic.html',
  '/src/pages/groupe.html',
  '/src/pages/profil.html',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Network first for API/Supabase calls
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok && response.type === 'basic') {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, toCache));
        }
        return response;
      });
    })
  );
});

// Push notifications
self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Footzy', {
      body: data.body || 'Nouveau défi disponible !',
      icon: '/public/icon-192.png',
      badge: '/public/icon-192.png',
      tag: data.tag || 'footzy-notif',
      data: { url: data.url || '/src/pages/home.html' }
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      const url = e.notification.data?.url || '/';
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
