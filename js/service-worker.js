/**
 * service-worker.js — PWA Service Worker for Sari-Sari Store
 *
 * Strategy:
 *  - Static assets (CSS, JS, icons): Cache as requested, serve cache-first
 *  - Dashboard page: Network-first, cache fallback (so it works offline)
 *  - API GET calls: Network-first, cache fallback (offline reads from cache)
 *  - POST/PUT/DELETE: Not intercepted (handled by offline queue in database.js)
 *
 * NOTE: No pre-caching — WhiteNoise uses hashed filenames in production,
 * so we cache assets at runtime as the browser actually requests them.
 * After one online visit, everything is cached for offline use.
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `sarisari-${CACHE_VERSION}`;

// ─── INSTALL ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2…');
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

// ─── ACTIVATE ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v2…');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => {
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
  const url = new URL(request.url);

  // Only handle GET requests — mutations go through database.js offline queue
  if (request.method !== 'GET') return;

  // Don't cache the login page, admin, or the SW itself
  if (url.pathname.startsWith('/admin/') ||
    url.pathname === '/service-worker.js') return;

   if (url.pathname === '/') {
  event.respondWith(networkFirst(request));
  return;
} 

  // API requests → network-first, cache-fallback
 if (url.pathname === '/') {
  event.respondWith(networkFirst(request));
  return;
}

  // Dashboard page → network-first, cache-fallback
  if (url.pathname === '/dashboard/' || url.pathname === '/dashboard') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets (CSS, JS, images, manifest) → cache-first, network-fallback
  if (url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }
});

// ─── STRATEGIES ──────────────────────────────────────────────────────────────

/**
 * Cache-first: Return from cache if available, otherwise fetch and cache.
 * Best for static assets that rarely change.
 */
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
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

/**
 * Network-first: Try network, fall back to cache.
 * Best for HTML pages and API data that should be fresh when possible.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline — try cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // No cache available
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For the dashboard page, show a friendly offline message
    if (request.destination === 'document') {
      return new Response(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>Offline</title></head>' +
        '<body style="font-family:sans-serif;text-align:center;padding:80px 20px;background:#f5f6fa;">' +
        '<div style="font-size:72px;margin-bottom:20px;">📴</div>' +
        '<h1 style="color:#303952;">Welcome!</h1>' +
        '<p style="color:#5D534A;margin:16px 0;">Open the app once while connected to load your data, then it works offline.</p>' +
        '<button onclick="location.reload()" style="padding:12px 32px;border:none;border-radius:12px;' +
        'background:#63cdda;color:white;font-size:1rem;font-weight:700;cursor:pointer;">Retry</button>' +
        '</body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    return new Response('', { status: 503 });
  }
}

// ─── OFFLINE QUEUE SYNC ─────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'replay-offline-queue') {
    event.waitUntil(replayOfflineQueue());
  }
});

async function replayOfflineQueue() {
  const db = await openOfflineDB();
  const tx = db.transaction('queue', 'readonly');
  const store = tx.objectStore('queue');
  const allRequests = await idbGetAll(store);

  for (const entry of allRequests) {
    try {
      const response = await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body,
        credentials: 'include',
      });
      if (response.ok || response.status < 500) {
        const delTx = db.transaction('queue', 'readwrite');
        delTx.objectStore('queue').delete(entry.id);
      }
    } catch {
      break; // Still offline
    }
  }
}

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('sarisari-offline', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// ─── MESSAGE HANDLER ─────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
