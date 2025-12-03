const CACHE_NAME = 'gallinas-kamikaze-v5';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/game.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch(err => console.log('Error al cachear:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Estrategia: Network First - siempre intenta obtener de la red primero
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si hay respuesta de la red, actualizar caché y devolver
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Si falla la red, usar caché
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Si no hay en caché y es un documento, devolver index.html
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

