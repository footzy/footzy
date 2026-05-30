/* Footzy Service Worker — Push Notifications */
const CACHE = 'footzy-v1';

// ── Installation ──
self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// ── Push reçu (notification serveur) ──
self.addEventListener('push', e => {
  if (!e.data) return;

  let payload;
  try { payload = e.data.json(); }
  catch { payload = { title: 'Footzy', body: e.data.text() }; }

  const title   = payload.title || 'Footzy ⚽';
  const options = {
    body:    payload.body    || '',
    icon:    payload.icon    || '/icons/icon-192.png',
    badge:   '/icons/badge-72.png',
    tag:     payload.tag     || 'footzy-notif',
    renotify: true,
    data:    payload.data    || {},
    actions: payload.actions || [],
    vibrate: payload.vibrate || [100, 50, 100],
  };

  // Couleur de fond selon le type
  if (payload.type === 'goal')  options.icon = payload.icon || '/icons/icon-192.png';
  if (payload.type === 'card')  options.badge = '/icons/badge-72.png';

  e.waitUntil(self.registration.showNotification(title, options));
});

// ── Clic sur notification → ouvrir l'app ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/src/pages/accueil.html';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cls => {
      // Si l'app est déjà ouverte, focus + navigate
      for (const client of cls) {
        if (client.url.includes('footzy') && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
