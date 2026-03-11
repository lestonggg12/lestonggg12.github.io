// ================= MOBILE NAVIGATION =====================
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburgerBtn');
    const sidebar = document.getElementById('mobileSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    let sidebarOpen = false;
    function openSidebar() {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        sidebarOpen = true;
        document.body.style.overflow = 'hidden';
    }
    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        sidebarOpen = false;
        document.body.style.overflow = '';
    }
    if (hamburger && sidebar && sidebarOverlay && closeSidebarBtn) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            openSidebar();
        });
        closeSidebarBtn.addEventListener('click', function() {
            closeSidebar();
        });
        sidebarOverlay.addEventListener('click', function() {
            closeSidebar();
        });
        // Hide sidebar if window is resized to desktop
        window.addEventListener('resize', function() {
            if (window.innerWidth > 900) {
                closeSidebar();
            }
        });
    }
    // Mobile sidebar nav page switching
    const pageMap = {
        btnProfitMobile: 'profitPage',
        btnCalendarMobile: 'calendarPage',
        btnPriceMobile: 'pricePage',
        btnInventoryMobile: 'inventoryPage',
        btnDebtMobile: 'debtPage',
        btnSettingsMobile: 'settingsPage',
    };
    Object.keys(pageMap).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', function() {
                showPage(pageMap[btnId]);
                closeSidebar();
            });
        }
    });
});
/**
 * dashboard.js — SPA page switching, navigation, and bootstrap logic.
 *
 * Responsibilities:
 *  1. showPage()  — hides all .page elements, shows the target, triggers
 *     the page-specific render function (renderProfit, renderCalendar, etc.).
 *  2. updateNavHighlight() — keeps the sidebar / bottom-bar active state
 *     in sync with the visible page.
 *  3. Mobile zoom prevention — blocks double-tap and pinch-to-zoom so the
 *     app behaves like a native PWA.
 *  4. DOMContentLoaded bootstrap — wires nav buttons, loads the initial
 *     page (Profit), runs all cleanups on init, schedules midnight
 *     auto-cleanup, and injects the cleanup countdown indicator.
 *  5. Sticky-hover fix — blurs nav buttons on touchend so mobile users
 *     don't see a permanent :hover highlight.
 *
 * Dependencies: database.js (DB), profit.js, calendar.js, price_list.js,
 *               inventory.js, debtors.js, settings.js, cart.js
 */

// =============================================================================
//  1. PAGE SWITCHING
// =============================================================================

/**
 * Switch the active SPA page.
 * @param {string} pageId — DOM id of the target .page container
 */
function showPage(pageId) {
    // Hide all pages and show the selected one
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active-page');
    
    // Update navigation button styling
    updateNavHighlight(pageId);
    
    // Render appropriate content
    switch(pageId) {
        case 'profitPage':
            if (typeof renderProfit === 'function') renderProfit();
            break;
        case 'calendarPage':  // NEW!
            if (typeof renderCalendar === 'function') renderCalendar();
            break;
        case 'pricePage':
            if (typeof renderPriceList === 'function') renderPriceList();
            break;
        case 'inventoryPage':
            if (typeof renderInventory === 'function') renderInventory();
            break;
        case 'debtPage':
            if (typeof renderDebtors === 'function') renderDebtors();
            break;
        case 'settingsPage':
            if (typeof renderSettings === 'function') renderSettings();
            break;
    }
}

// =============================================================================
//  2. NAVIGATION HIGHLIGHT HELPER
// =============================================================================

/**
 * Toggle the `.active` class on sidebar / bottom-bar buttons so the
 * current page's button stays visually distinguished.
 */
function updateNavHighlight(pageId) {
    document.querySelectorAll('.nav-links button').forEach(btn => {
        btn.classList.remove('active');
    });

    const navMap = {
        'profitPage': 'btnProfit',
        'calendarPage': 'btnCalendar',  // NEW!
        'pricePage': 'btnPrice',
        'inventoryPage': 'btnInventory',
        'debtPage': 'btnDebt',
        'settingsPage': 'btnSettings'
    };

    const activeBtnId = navMap[pageId];
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) activeBtn.classList.add('active');
}

// =============================================================================
//  3. MOBILE ZOOM PREVENTION
//  Blocks double-tap-to-zoom and pinch-to-zoom so the web-app feels native.
// =============================================================================
(function preventDoubleTabZoom() {
    let lastTouchEnd = 0;
    
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
})();

// Block Safari gesture-based zoom events.
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
});

document.addEventListener('gestureend', function(e) {
    e.preventDefault();
});

console.log('✅ Mobile zoom prevention active!');

// =============================================================================
//  4. BOOTSTRAP — DOMContentLoaded
//  Wire all navigation buttons, load the default page,
//  start transaction auto-cleanup, inject countdown indicator.
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Dashboard initializing...');

    const navButtons = [
        { id: 'btnProfit', page: 'profitPage' },
        { id: 'btnCalendar', page: 'calendarPage' },  // NEW!
        { id: 'btnPrice', page: 'pricePage' },
        { id: 'btnInventory', page: 'inventoryPage' },
        { id: 'btnDebt', page: 'debtPage' },
        { id: 'btnSettings', page: 'settingsPage' }
    ];

    navButtons.forEach(nav => {
        const btn = document.getElementById(nav.id);
        if (btn) {
            btn.addEventListener('click', () => showPage(nav.page));
        }
    });

    // Prevent mobile keyboards from triggering zoom on <input> focus.
    const inputs = document.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
        input.addEventListener('touchstart', function(e) {
            e.stopPropagation();
        }, { passive: true });
    });
    
    // Load initial page
    showPage('profitPage');
    
    // ── Run all cleanups immediately on init ──────────────────────────
    if (typeof window.DB !== 'undefined') {
        // Run cleanups in background (don't block page load)
        (async () => {
            try {
                console.log('🧹 Running startup cleanups...');
                const results = await window.DB.runAllCleanups();
                console.log('✅ Startup cleanup complete:', results);
            } catch (e) { console.error('Startup cleanup error:', e); }
        })();

        // Schedule midnight auto-cleanup (recurring)
        if (typeof window.DB.scheduleAutoCleanup === 'function') {
            console.log('⏰ Initializing midnight auto-cleanup scheduler...');
            window.DB.scheduleAutoCleanup();
        }
    }
    
    // Add transaction cleanup indicator to the header/footer
    addTransactionCleanupIndicator();
    
    console.log('✓ Dashboard initialized successfully');
});

// =============================================================================
//  5. TRANSACTION CLEANUP COUNTDOWN INDICATOR
//  Renders a small pill next to the "Recent Sales" heading showing how
//  long until the midnight auto-cleanup fires.
// =============================================================================
function addTransactionCleanupIndicator() {
    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow - now;
    const hoursLeft = Math.floor(timeUntilMidnight / 1000 / 60 / 60);
    const minutesLeft = Math.floor((timeUntilMidnight / 1000 / 60) % 60);
    
    // Add clockPulse animation and dark mode styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes clockPulse {
            0%, 100% { transform: scale(1) rotate(0deg); }
            50% { transform: scale(1.1) rotate(10deg); }
        }
        
        #cleanupIndicatorInline:hover {
            background: linear-gradient(135deg, rgba(168,201,156,0.45), rgba(203,223,189,0.4)) !important;
        }
        
        body.dark-mode #cleanupIndicatorInline {
            background: linear-gradient(135deg, rgba(60,80,50,0.4), rgba(80,100,70,0.3)) !important;
            color: #c0d8b0 !important;
            border-color: rgba(90,120,80,0.4) !important;
        }
    `;
    document.head.appendChild(style);
    
    // Populate the inline indicator (the <span id="cleanupTimeInline">
    // rendered by profit.js inside the Recent Sales section header).
    function updateInlineIndicator() {
        const el = document.getElementById('cleanupTimeInline');
        if (el) {
            const n = new Date();
            const t = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
            const diff = t - n;
            const h = Math.floor(diff / 1000 / 60 / 60);
            const m = Math.floor((diff / 1000 / 60) % 60);
            el.textContent = `in ${h}h ${m}m`;
        }
    }
    
    // Run once immediately, then refresh every 60 s.
    updateInlineIndicator();
    setInterval(updateInlineIndicator, 60000);
    
    // MutationObserver: profit page renders lazily, so the target <span>
    // might not exist yet — watch for it, update once, then disconnect.
    const observer = new MutationObserver((mutations, obs) => {
        const el = document.getElementById('cleanupTimeInline');
        if (el) {
            updateInlineIndicator();
            obs.disconnect(); // Stop observing once element is found
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// =============================================================================
//  6. CART COUNT BADGE
// =============================================================================

/** Update the floating cart badge number from window.cart[]. */
function updateCartCount() {
    const cartCountBadge = document.getElementById('cartCount');
    if (cartCountBadge && typeof window.cart !== 'undefined') {
        const totalItems = window.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountBadge.textContent = totalItems;
        cartCountBadge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// =============================================================================
//  7. STICKY-HOVER FIX FOR MOBILE
//  On touch devices, :hover can stick after a tap. Blurring the button
//  immediately after click / touchend removes the stuck state.
// =============================================================================
document.addEventListener('DOMContentLoaded', function() {
    // Remove focus from navigation buttons after click
    const navButtons = document.querySelectorAll('.nav-links button');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove focus immediately after click
            setTimeout(() => {
                this.blur();
            }, 100);
        });
        
        // Also remove on touch end
        button.addEventListener('touchend', function() {
            this.blur();
        });
    });
});

// Expose helpers globally.
window.showPage = showPage;
window.updateCartCount = updateCartCount;

console.log('✅ Mobile touch state fix active!');
console.log('✓ Main script loaded successfully!');