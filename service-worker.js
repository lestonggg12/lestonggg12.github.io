/**
 * service-worker.js — PWA Service Worker for Joram's Sari-Sari Store
 * Static site version (GitHub Pages / local file server)
 *
 * Strategy:
 *  - On install: pre-cache all essential app shell files
 *  - All requests: cache-first, network-fallback
 *  - After one online visit, the entire app works offline
 */

const CACHE_VERSION = 'v5';
const CACHE_NAME    = `jorams-${CACHE_VERSION}`;

// ─── FILES TO PRE-CACHE ON INSTALL ───────────────────────────────────────────
// These are fetched and cached the moment the SW installs.
// After this, the app works fully offline.
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',

  // ── CSS ──
  './css/reset.css',
  './css/variables.css',
  './css/badges.css',
  './css/cards.css',
  './css/darkmode.css',
  './css/navigations.css',
  './css/pages.css',
  './css/calendar.css',
  './css/product.css',
  './css/cart-system.css',
  './css/mobile-responsiveness.css',
  './css/cash-payment-modal.css',
  './css/glassmorphic-icons.css',
  './css/nav-fix.css',

  // ── JS ──
  './js/device-storage.js',
  './js/file-system.js',
  './js/notifications.js',
  './js/dark-mode.js',
  './js/settings.js',
  './js/dashboard.js',
  './js/emoji-to-svg.js',
  './js/dialog-systems.js',
  './js/cart.js',
  './js/inventory.js',
  './js/profit.js',
  './js/calendar.js',
  './js/price_list.js',
  './js/debtors.js',
  './js/loading.js',
  './js/page-backgrounds.js',
  './js/pull-to-refresh.js',

  // ── Icons ──
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ─── INSTALL ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing ${CACHE_NAME}…`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching app shell…');
      // Use individual adds so one missing file doesn't block everything
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err =>
            console.warn(`[SW] Could not cache ${url}:`, err)
          )
        )
      );
    }).then(() => {
      console.log('[SW] Pre-cache complete');
      return self.skipWaiting();
    })
  );
});

// ─── ACTIVATE ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating ${CACHE_NAME}…`);
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ─── FETCH ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (CDNs, external APIs etc.)
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip the service worker file itself
  if (url.pathname.endsWith('service-worker.js')) return;

  event.respondWith(cacheFirst(request));
});

// ─── CACHE-FIRST STRATEGY ────────────────────────────────────────────────────
// Serve from cache if available.
// If not cached yet, fetch from network, cache it, then return it.
// If offline and not cached, return offline fallback.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and nothing in cache
    // Return the cached index.html as fallback for navigation requests
    if (request.destination === 'document') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

// ─── MESSAGE HANDLER ─────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});