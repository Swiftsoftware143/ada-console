// Minimal service worker to prevent 404 errors
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Just let requests pass through
  event.respondWith(fetch(event.request));
});
