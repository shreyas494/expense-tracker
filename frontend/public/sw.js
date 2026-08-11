// TrackExpense PWA Service Worker for Web Share Target
const CACHE_NAME = 'trackexpense-v1';
const SHARE_CACHE = 'share-cache';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept incoming Share Target POST requests
  if (event.request.method === 'POST' && url.pathname.includes('share-target')) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const cache = await caches.open(SHARE_CACHE);

        let combinedText = '';
        let imageFile = null;

        for (const [key, value] of formData.entries()) {
          if (typeof value === 'string') {
            if (value.trim()) combinedText += ` ${value.trim()}`;
          } else if (value && typeof value === 'object' && value.size > 0) {
            imageFile = value;
          }
        }

        if (combinedText.trim()) {
          await cache.put('/shared-text', new Response(combinedText.trim()));
        }

        if (imageFile) {
          await cache.put('/shared-image', new Response(imageFile, {
            headers: { 'Content-Type': imageFile.type || 'image/png' }
          }));
        }

        return Response.redirect('/?shared=1', 303);
      } catch (err) {
        console.error("SW Share Target error:", err);
        return Response.redirect('/?shared=error', 303);
      }
    })());
    return;
  }

  // Default fetch handler
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
