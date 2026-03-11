/**
 * pull-to-refresh.js
 * Adds two refresh methods:
 *  1. Pull-to-refresh (swipe down from top on mobile)
 *  2. Floating refresh button (bottom-left, mobile only)
 */

(function () {
    'use strict';

    // =========================================================================
    //  STYLES
    // =========================================================================
    const style = document.createElement('style');
    style.textContent = `
        /* ── Pull-to-refresh indicator ── */
        #ptr-indicator {
            position: fixed;
            top: 0; left: 0; right: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: linear-gradient(135deg, #87B382, #5d9458);
            color: white;
            font-size: 14px;
            font-weight: 700;
            height: 0;
            overflow: hidden;
            z-index: 99999;
            transition: height 0.2s ease;
            box-shadow: 0 4px 16px rgba(93,148,88,0.35);
        }
        #ptr-indicator.ptr-pulling  { height: 56px; }
        #ptr-indicator.ptr-ready    { height: 56px; background: linear-gradient(135deg, #4ade80, #22c55e); }
        #ptr-indicator.ptr-loading  { height: 56px; }

        #ptr-spinner {
            width: 22px; height: 22px;
            border: 3px solid rgba(255,255,255,0.4);
            border-top-color: white;
            border-radius: 50%;
            display: none;
        }
        #ptr-indicator.ptr-loading #ptr-spinner  { display: block; animation: ptr-spin 0.7s linear infinite; }
        #ptr-indicator.ptr-loading #ptr-arrow    { display: none; }

        #ptr-arrow {
            font-size: 20px;
            transition: transform 0.2s ease;
        }
        #ptr-indicator.ptr-ready #ptr-arrow { transform: rotate(180deg); }

        @keyframes ptr-spin { to { transform: rotate(360deg); } }

        /* ── Floating refresh button (mobile only) ── */
        #floatingRefreshBtn {
            display: none;
            position: fixed;
            bottom: 90px;
            left: 20px;
            z-index: 5000;
            width: 52px; height: 52px;
            border-radius: 50%;
            border: none;
            background: linear-gradient(135deg, #87B382, #5d9458);
            color: white;
            font-size: 22px;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(93,148,88,0.45);
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
        }
        #floatingRefreshBtn:active {
            transform: scale(0.9);
            box-shadow: 0 2px 8px rgba(93,148,88,0.3);
        }
        #floatingRefreshBtn.spinning {
            animation: ptr-spin 0.7s linear infinite;
        }

        /* Show only on mobile */
        @media (max-width: 900px) {
            #floatingRefreshBtn { display: flex; }
        }

        body.dark-mode #ptr-indicator {
            background: linear-gradient(135deg, #2e4d2e, #3a6b3a);
        }
        body.dark-mode #ptr-indicator.ptr-ready {
            background: linear-gradient(135deg, #166534, #15803d);
        }
        body.dark-mode #floatingRefreshBtn {
            background: linear-gradient(135deg, #2e4d2e, #3a6b3a);
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
    `;
    document.head.appendChild(style);

    // =========================================================================
    //  BUILD DOM
    // =========================================================================
    const indicator = document.createElement('div');
    indicator.id = 'ptr-indicator';
    indicator.innerHTML = `
        <div id="ptr-spinner"></div>
        <span id="ptr-arrow">↓</span>
        <span id="ptr-text">Pull down to refresh</span>
    `;
    document.body.prepend(indicator);

    const refreshBtn = document.createElement('button');
    refreshBtn.id = 'floatingRefreshBtn';
    refreshBtn.title = 'Refresh';
    refreshBtn.innerHTML = '↻';
    document.body.appendChild(refreshBtn);

    // =========================================================================
    //  CORE REFRESH FUNCTION
    // =========================================================================
    async function doRefresh() {
        console.log('🔄 Manual refresh triggered');

        // Notifications
        if (window.NotificationSystem?.refresh) {
            await window.NotificationSystem.refresh();
        }

        // Re-render whichever page is currently active
        const activePage = document.querySelector('.page.active-page');
        const pageId = activePage?.id;

        try {
            if (pageId === 'profitPage'    && typeof renderProfit        === 'function') await renderProfit();
            if (pageId === 'inventoryPage' && typeof window.renderInventory === 'function') await window.renderInventory();
            if (pageId === 'pricePage'     && typeof window.renderPriceList === 'function') await window.renderPriceList();
            if (pageId === 'calendarPage'  && typeof window.renderCalendar  === 'function') await window.renderCalendar();
            if (pageId === 'debtPage'      && typeof window.renderDebtors   === 'function') await window.renderDebtors();
            if (pageId === 'settingsPage'  && typeof window.renderSettings  === 'function') await window.renderSettings();
        } catch (e) {
            console.error('❌ Refresh error:', e);
        }

        console.log('✅ Refresh complete');
    }

    // =========================================================================
    //  FLOATING BUTTON
    // =========================================================================
    refreshBtn.addEventListener('click', async () => {
        if (refreshBtn.classList.contains('spinning')) return;
        refreshBtn.classList.add('spinning');
        await doRefresh();
        refreshBtn.classList.remove('spinning');
    });

    // =========================================================================
    //  PULL-TO-REFRESH (touch)
    // =========================================================================
    let startY      = 0;
    let currentY    = 0;
    let isPulling   = false;
    let isRefreshing = false;
    const THRESHOLD = 80; // px to trigger refresh

    document.addEventListener('touchstart', (e) => {
        // Only start if scrolled to top
        if (window.scrollY > 5) return;
        if (isRefreshing) return;
        startY   = e.touches[0].clientY;
        isPulling = true;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isPulling || isRefreshing) return;
        currentY = e.touches[0].clientY;
        const delta = currentY - startY;
        if (delta <= 0) return;

        const text = document.getElementById('ptr-text');
        if (delta > THRESHOLD) {
            indicator.className = 'ptr-ready';
            if (text) text.textContent = 'Release to refresh';
        } else {
            indicator.className = 'ptr-pulling';
            if (text) text.textContent = 'Pull down to refresh';
        }
    }, { passive: true });

    document.addEventListener('touchend', async () => {
        if (!isPulling || isRefreshing) return;
        isPulling = false;

        const delta = currentY - startY;
        if (delta > THRESHOLD) {
            isRefreshing = true;
            indicator.className = 'ptr-loading';
            const text = document.getElementById('ptr-text');
            if (text) text.textContent = 'Refreshing…';

            await doRefresh();

            indicator.className = '';
            isRefreshing = false;
            currentY = 0;
            startY   = 0;
        } else {
            indicator.className = '';
            currentY = 0;
            startY   = 0;
        }
    });

})();