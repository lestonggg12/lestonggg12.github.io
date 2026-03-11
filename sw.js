const CACHE_NAME = "jorams-store-cache-v1";
const ASSETS_TO_CACHE = [
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./html/dashboard.html",
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
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch Event (Offline first)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
