const CACHE_NAME = "jorams-store-cache-v3";
const ASSETS_TO_CACHE = [
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./index.html",
  "./css/reset.css",
  "./css/variables.css",
  "./css/badges.css",
  "./css/cards.css",
  "./css/darkmode.css",
  "./css/navigations.css",
  "./css/pages.css",
  "./css/calendar.css",
  "./css/product.css",
  "./css/cart-system.css",
  "./css/mobile-responsiveness.css",
  "./css/cash-payment-modal.css",
  "./css/glassmorphic-icons.css",
  "./css/nav-fix.css",
  "./js/emoji-to-svg.js",
  "./js/database.js",
  "./js/notifications.js",
  "./js/dark-mode.js",
  "./js/dialog-systems.js",
  "./js/cart.js",
  "./js/inventory.js",
  "./js/profit.js",
  "./js/calendar.js",
  "./js/settings.js",
  "./js/price_list.js",
  "./js/debtors.js",
  "./js/dashboard.js",
  "./js/loading.js",
  "./js/page-backgrounds.js"
];

// Install Event
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching all assets");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event (Cleanup old caches)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(), // Become available to all pages immediately
      caches.keys().then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      })
    ])
  );
});

// Fetch Event (Offline first)
self.addEventListener("fetch", (event) => {
  // Handle root requests by serving index.html
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin === location.origin && requestUrl.pathname === "/") {
    event.respondWith(caches.match("./index.html"));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      
      return fetch(event.request).catch(() => {
        // Fallback for navigation if both cache and network fail
        if (event.request.mode === 'navigate') {
          return caches.match("./index.html");
        }
      });
    })
  );
});
