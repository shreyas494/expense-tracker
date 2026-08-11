// TrackExpense PWA Service Worker
const CACHE_NAME = 'trackexpense-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple fetch handler to satisfy PWA criteria
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
