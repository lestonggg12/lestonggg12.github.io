/**
 * sw.js — Service Worker for Joram's Sari-Sari Store PWA
 * 
 * FEATURES:
 *  - Cache static assets (CSS, JS, fonts)
 *  - Network-first strategy for dynamic content
 *  - Offline fallback support
 *  - Uses device-storage.js for data persistence (NOT database.js)
 * 
 * DEPENDENCIES:
 *  - device-storage.js (loaded in index.html BEFORE this SW registers)
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `jorams-store-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
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
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// ═══════════════════════════════════════════════════════════════════════════
// INSTALL EVENT — Cache static assets
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`[SW] Caching ${STATIC_ASSETS.length} static assets`);
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Some assets failed to cache (non-critical):', err);
          // Don't fail installation if some assets fail
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((err) => {
        console.error('[SW] Installation failed:', err);
      })
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// ACTIVATE EVENT — Clean up old caches
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log(`[SW] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim(); // Take control of all pages
      })
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// FETCH EVENT — Network-first strategy with offline fallback
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external domains (except CDNs we might use)
  if (url.origin !== location.origin && !url.hostname.includes('cdnjs')) {
    return;
  }

  // STRATEGY: Network-first for API/dynamic, Cache-first for static
  if (isStaticAsset(url.pathname)) {
    // Static assets: cache-first
    event.respondWith(cacheFirst(request));
  } else {
    // Dynamic content: network-first
    event.respondWith(networkFirst(request));
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Determine if a pathname is a static asset
 */
function isStaticAsset(pathname) {
  const staticExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

/**
 * Cache-first strategy: use cache, fall back to network
 */
async function cacheFirst(request) {
  try {
    // Check cache first
    const cached = await caches.match(request);
    if (cached) {
      console.log(`[SW] Cache hit: ${request.url}`);
      return cached;
    }

    // Fetch from network
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn(`[SW] Cache-first failed: ${request.url}`, err);
    // Return offline fallback if available
    return getOfflineFallback(request);
  }
}

/**
 * Network-first strategy: try network, fall back to cache
 */
async function networkFirst(request) {
  try {
    // Try network first
    const response = await fetch(request);
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    console.warn(`[SW] Network failed, trying cache: ${request.url}`);
    
    // Fall back to cache
    const cached = await caches.match(request);
    if (cached) {
      console.log(`[SW] Using cached response: ${request.url}`);
      return cached;
    }

    // No cache available, return offline fallback
    return getOfflineFallback(request);
  }
}

/**
 * Return offline fallback page
 */
async function getOfflineFallback(request) {
  console.log(`[SW] Returning offline fallback for: ${request.url}`);
  
  // For HTML requests, return the main index.html
  if (request.headers.get('accept').includes('text/html')) {
    const cached = await caches.match('./index.html');
    if (cached) {
      return cached;
    }
  }

  // For other requests, return a generic offline response
  return new Response('Offline - Unable to load resource', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({ 'Content-Type': 'text/plain' })
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE HANDLER — Receive messages from clients
// ═══════════════════════════════════════════════════════════════════════════

self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received, activating immediately');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing cache...');
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
      event.ports[0].postMessage({ success: true });
    });
  }
});

console.log('[SW] Service Worker file loaded (device-storage.js compatible)');