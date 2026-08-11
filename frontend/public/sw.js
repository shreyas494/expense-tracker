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
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith((async () => {
      try {
        const formData = await event.request.formData();
        const title = formData.get('title') || '';
        const text = formData.get('text') || '';
        const sharedUrl = formData.get('url') || '';
        const media = formData.get('media') || formData.get('images');

        const combinedText = [title, text, sharedUrl].filter(Boolean).join(' ');

        const cache = await caches.open(SHARE_CACHE);

        if (combinedText) {
          await cache.put('/shared-text', new Response(combinedText));
        }

        if (media && media.size > 0) {
          await cache.put('/shared-image', new Response(media, {
            headers: { 'Content-Type': media.type || 'image/png' }
          }));
        }

        // Redirect client to app home page with shared flag
        return Response.redirect('/?shared=1', 303);
      } catch (err) {
        console.error("SW Share Target handling failed:", err);
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
