(function () {
    'use strict';

    const STORAGE_KEYS = [
        'jorams_sari_sari_products',
        'jorams_sari_sari_categories',
        'jorams_sari_sari_settings',
        'jorams_sari_sari_cached_settings'
    ];

    const DEBOUNCE_MS  = 600;   // wait 600ms after last change before refreshing
    const POLL_MS      = 10000; // fallback poll every 10s (catches iOS misses)

    let debounceTimer  = null;
    let lastSnapshot   = null;  // JSON snapshot of products for change detection
    let isRefreshing   = false;

    // =========================================================================
    //  CORE REFRESH
    // =========================================================================
    async function triggerRefresh(reason) {
        if (isRefreshing) return;
        isRefreshing = true;
        console.log(`🔄 Auto-refresh triggered: ${reason}`);

        try {
            if (window.NotificationSystem?.refresh) {
                await window.NotificationSystem.refresh();
            }
        } catch (e) {
            console.error('❌ Auto-refresh error:', e);
        }

        isRefreshing = false;
    }

    function scheduleRefresh(reason) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => triggerRefresh(reason), DEBOUNCE_MS);
    }

    // =========================================================================
    //  CHANGE DETECTION — snapshot comparison
    //  Compares qty, price, cost for every product.
    //  Returns true if anything alert-relevant changed.
    // =========================================================================
    function getSnapshot() {
        try {
            const raw = localStorage.getItem('jorams_sari_sari_products');
            if (!raw) return null;
            const products = JSON.parse(raw);
            // Only track fields that affect alerts
            return JSON.stringify(products.map(p => ({
                id:    p.id,
                qty:   parseFloat(p.quantity ?? p.stock ?? 0),
                price: parseFloat(p.price ?? p.selling_price ?? 0),
                cost:  parseFloat(p.cost  ?? p.cost_price   ?? 0)
            })));
        } catch (e) {
            return null;
        }
    }

    function checkForChanges(reason) {
        const current = getSnapshot();
        if (current && current !== lastSnapshot) {
            lastSnapshot = current;
            scheduleRefresh(reason);
        }
    }

    // =========================================================================
    //  TRIGGER 1: StorageEvent
    //  Fires when localStorage is written from ANY tab/page.
    //  Most reliable on Android Chrome. Also works on iOS Safari 14.5+.
    // =========================================================================
    window.addEventListener('storage', (e) => {
        if (STORAGE_KEYS.includes(e.key)) {
            console.log(`📦 Storage change detected: ${e.key}`);
            lastSnapshot = null; // force refresh
            scheduleRefresh(`storage:${e.key}`);
        }
    });

    // =========================================================================
    //  TRIGGER 2: Custom DOM events
    //  inventory.js, settings.js, cart.js should dispatch these after saving.
    //  Add this line wherever you save products:
    //    window.dispatchEvent(new CustomEvent('productsUpdated'));
    //    window.dispatchEvent(new CustomEvent('settingsUpdated'));
    // =========================================================================
    window.addEventListener('productsUpdated',  () => {
        console.log('📦 productsUpdated event received');
        lastSnapshot = null;
        scheduleRefresh('productsUpdated event');
    });

    window.addEventListener('settingsUpdated',  () => {
        console.log('⚙️ settingsUpdated event received');
        scheduleRefresh('settingsUpdated event');
    });

    window.addEventListener('saleCompleted', () => {
        console.log('🛒 saleCompleted event received');
        lastSnapshot = null;
        scheduleRefresh('saleCompleted event');
    });

    // =========================================================================
    //  TRIGGER 3: Page Visibility API
    //  When user switches back to the app (from another app or tab).
    //  Critical for mobile — iOS suspends JS when app is backgrounded.
    // =========================================================================
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('👁 App became visible — checking for changes');
            checkForChanges('visibilitychange');
        }
    });

    // iOS: also fires when user taps back to the browser
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) {
            // Page restored from bfcache (iOS Safari back/forward)
            console.log('📱 Page restored from bfcache — refreshing');
            lastSnapshot = null;
            scheduleRefresh('pageshow:persisted');
        }
    });

    // =========================================================================
    //  TRIGGER 4: Polling fallback (10s)
    //  Catches cases where StorageEvent doesn't fire (same-tab writes on iOS,
    //  or any browser that throttles storage events in background).
    // =========================================================================
    setInterval(() => {
        checkForChanges('poll');
    }, POLL_MS);

    // =========================================================================
    //  TRIGGER 5: Patch DB.saveProducts / DB.updateProduct
    //  Wraps the database write methods so alerts fire immediately on same tab.
    //  Safe — only patches if the methods exist.
    // =========================================================================
    function patchDB() {
        if (!window.DB) return;

        const methodsToPatch = [
            'addProduct',
            'updateProduct',
            'deleteProduct',
            'saveSales',
            'addSale',
            'saveSettings'
        ];

        methodsToPatch.forEach(method => {
            if (typeof window.DB[method] === 'function' && !window.DB[`_ptr_${method}`]) {
                window.DB[`_ptr_${method}`] = window.DB[method];
                window.DB[method] = async function (...args) {
                    const result = await window.DB[`_ptr_${method}`].apply(this, args);
                    lastSnapshot = null; // invalidate snapshot
                    scheduleRefresh(`DB.${method}`);
                    return result;
                };
                console.log(`✅ Patched DB.${method} for auto-detect`);
            }
        });
    }

    // =========================================================================
    //  INIT
    // =========================================================================
    function init() {
        lastSnapshot = getSnapshot(); // baseline — don't alert on load
        console.log('✅ Auto-detect refresh initialized');
        console.log(`   Polling every ${POLL_MS / 1000}s as fallback`);

        // Try patching DB immediately, or wait for it to load
        if (window.DB) {
            patchDB();
        } else {
            let attempts = 0;
            const waitForDB = setInterval(() => {
                attempts++;
                if (window.DB) {
                    clearInterval(waitForDB);
                    patchDB();
                } else if (attempts > 50) {
                    clearInterval(waitForDB);
                    console.warn('⚠️ DB not found — relying on storage events + polling');
                }
            }, 100);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();