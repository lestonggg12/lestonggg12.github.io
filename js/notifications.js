/**
 * notifications.js — Enhanced with Product Navigation
 *
 * DEVICE PERSISTENCE:
 * - Settings change history is read from window.storeSettings.changeHistory
 *   which is loaded FROM LOCAL STORAGE.
 * - This device's alerts are specific to this browser and machine.
 *
 * HOW IT WORKS:
 *   Device saves settings
 *     → settings.js appends to changeHistory, saves to local storage
 *   Notifications refresh (every 5 min, or on bell click)
 *     → refreshNotifications() reads latest from local storage
 *     → badge and dropdown update automatically
 *
 * FIXES APPLIED:
 * - Waits for DB.init() before first refresh (was firing too early → 0 products)
 * - Retries bell injection until #btnSettings exists in DOM
 * - Loads settings via DB.getSettings() not just cached_settings
 * - Uses lowStockLimit and profitMargin from actual settings (not hardcoded)
 * - Mobile view fills full screen correctly
 * - Bell appears to the RIGHT of SETTINGS button
 * - Bell colors blend correctly in dark mode
 */

console.log('🔔 Loading enhanced notifications module...');

// =============================================================================
//  GLOBAL STATE
// =============================================================================

let notificationDropdownOpen = false;
let notificationData = {
    lowStock: [],
    lowMargin: [],
    outOfStock: [],
    settingsChanges: [],
    lastUpdated: null
};

// =============================================================================
//  INITIALIZATION
// ✅ FIX: Wait for DB to be ready AND for #btnSettings to exist before running.
// =============================================================================

document.addEventListener('DOMContentLoaded', async function () {
    console.log('🔔 Initializing enhanced notification system...');

    // ── Step 1: Retry injecting the bell until #btnSettings exists ────────────
    // Hard refresh (Ctrl+Shift+R) can cause DOMContentLoaded to fire before
    // nav buttons are rendered, so injectNotificationBell() would fail silently.
    let injectAttempts = 0;
    const tryInjectBell = setInterval(() => {
        injectAttempts++;
        const settingsBtn = document.getElementById('btnSettings');
        if (settingsBtn && !document.getElementById('btnNotifications')) {
            clearInterval(tryInjectBell);
            injectNotificationBell();
            console.log(`✅ Bell injected after ${injectAttempts} attempt(s)`);
        } else if (document.getElementById('btnNotifications')) {
            clearInterval(tryInjectBell);
        } else if (injectAttempts > 50) {
            clearInterval(tryInjectBell);
            console.error('❌ Could not find #btnSettings after 5s — bell not injected');
        }
    }, 100);

    // ── Step 2: Wait for DB to be ready before first notification refresh ─────
    // dashboard.js calls DB.init() — we poll until getProducts() works.
    let dbAttempts = 0;
    const waitForDB = setInterval(async () => {
        dbAttempts++;
        const products = await DB.getProducts().catch(() => null);
        if (Array.isArray(products) || dbAttempts > 30) {
            clearInterval(waitForDB);
            await refreshNotifications();
        }
    }, 100);

    // Refresh every 5 minutes
    setInterval(refreshNotifications, 5 * 60 * 1000);

    console.log('✅ Enhanced notification system initialized');
});

// =============================================================================
//  INJECT NOTIFICATION BELL
// =============================================================================

function injectNotificationBell() {
    const settingsBtn = document.getElementById('btnSettings');

    if (!settingsBtn || !settingsBtn.parentElement) {
        console.error('❌ Could not find settings button');
        return;
    }

    const bellBtn = document.createElement('button');
    bellBtn.id    = 'btnNotifications';
    bellBtn.className = 'nav-button notification-bell-btn';
    bellBtn.innerHTML = `
        <span class="nav-icon">🔔</span>
        <span class="nav-label">ALERTS</span>
        <span id="notificationBadge" class="notification-badge" style="display: none;">0</span>
    `;

    // Insert AFTER settings button
    settingsBtn.parentElement.insertBefore(bellBtn, settingsBtn.nextSibling);

    injectNotificationStyles();

    bellBtn.addEventListener('click', toggleNotificationDropdown);

    document.addEventListener('click', function (e) {
        const dropdown = document.getElementById('notificationDropdown');
        const bell     = document.getElementById('btnNotifications');
        if (dropdown && bell &&
            !dropdown.contains(e.target) &&
            !bell.contains(e.target)) {
            closeNotificationDropdown();
        }
    });

    console.log('✅ Notification bell injected after settings button');
}

// =============================================================================
//  REFRESH NOTIFICATIONS
//  ✅ FIX: Load settings via DB.getSettings() first (not just cached_settings).
//  ✅ FIX: Use lowStockLimit and profitMargin from settings (not hardcoded).
// =============================================================================

async function refreshNotifications() {
    console.log('🔄 Refreshing notifications...');

    try {
        // ── Load settings ──────────────────────────────────────────────────────
        // Try DB first (source of truth), fall back to cached_settings in localStorage.
        let freshSettings = null;
        try {
            freshSettings = await DB.getSettings();
        } catch (e) {
            const raw = localStorage.getItem('cached_settings');
            freshSettings = raw ? JSON.parse(raw) : null;
        }

        if (freshSettings) {
            window.storeSettings = {
                ...window.storeSettings,
                ...freshSettings,
                debtSurcharge: parseFloat(freshSettings.debtSurcharge ?? 0) || 0,
                changeHistory: Array.isArray(freshSettings.changeHistory)
                    ? freshSettings.changeHistory
                    : []
            };
            console.log('💾 Settings loaded:', window.storeSettings);
        }

        // ── Load products ──────────────────────────────────────────────────────
        const products = await DB.getProducts();

        // ✅ Use settings values — never hardcode thresholds
        const lowStockLimit = (window.storeSettings?.lowStockLimit) ?? 5;
        const minMargin     = (window.storeSettings?.profitMargin)  ?? 20;

        console.log(`📦 ${products.length} products | lowStock < ${lowStockLimit} | margin < ${minMargin}%`);

        // ── Out of Stock ───────────────────────────────────────────────────────
        notificationData.outOfStock = products.filter(p => {
            const qty = parseFloat(p.quantity ?? p.stock ?? 0);
            return qty === 0;
        });

        // ── Low Stock ──────────────────────────────────────────────────────────
        notificationData.lowStock = products.filter(p => {
            const qty = parseFloat(p.quantity ?? p.stock ?? 0);
            return qty > 0 && qty < lowStockLimit;
        }).sort((a, b) =>
            parseFloat(a.quantity ?? a.stock ?? 0) - parseFloat(b.quantity ?? b.stock ?? 0)
        );

        // ── Low Margin ─────────────────────────────────────────────────────────
        notificationData.lowMargin = products.filter(p => {
            const cost  = parseFloat(p.cost  ?? p.cost_price    ?? 0);
            const price = parseFloat(p.price ?? p.selling_price ?? 0);
            if (cost <= 0) return false; // skip free/unpriced items
            const margin = ((price - cost) / cost) * 100;
            return margin < minMargin;
        }).sort((a, b) => {
            const marginOf = p => {
                const c  = parseFloat(p.cost  ?? p.cost_price    ?? 0);
                const pr = parseFloat(p.price ?? p.selling_price ?? 0);
                return c > 0 ? ((pr - c) / c) * 100 : 0;
            };
            return marginOf(a) - marginOf(b);
        });

        // ── Settings change history ────────────────────────────────────────────
        notificationData.settingsChanges = window.storeSettings?.changeHistory || [];

        notificationData.lastUpdated = new Date();

        console.log(
            `✅ Alerts — outOfStock: ${notificationData.outOfStock.length}, ` +
            `lowStock: ${notificationData.lowStock.length}, ` +
            `lowMargin: ${notificationData.lowMargin.length}, ` +
            `settingsChanges: ${notificationData.settingsChanges.length}`
        );

        updateNotificationBadge();

        if (notificationDropdownOpen) {
            renderNotificationDropdown();
        }

    } catch (error) {
        console.error('❌ Error refreshing notifications:', error);
    }
}

// =============================================================================
//  UPDATE NOTIFICATION BADGE
// =============================================================================

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;

    const total =
        notificationData.lowStock.length +
        notificationData.lowMargin.length +
        notificationData.outOfStock.length +
        notificationData.settingsChanges.length;

    if (total > 0) {
        badge.textContent = total > 99 ? '99+' : total;
        badge.style.display = 'flex';
        badge.style.animation = 'none';
        setTimeout(() => { badge.style.animation = 'notificationPulse 0.5s ease'; }, 10);
    } else {
        badge.style.display = 'none';
    }
}

// =============================================================================
//  TOGGLE DROPDOWN
// =============================================================================

function toggleNotificationDropdown(e) {
    e.stopPropagation();
    if (notificationDropdownOpen) {
        closeNotificationDropdown();
    } else {
        openNotificationDropdown();
    }
}

function openNotificationDropdown() {
    closeNotificationDropdown();

    const dropdown     = document.createElement('div');
    dropdown.id        = 'notificationDropdown';
    dropdown.className = 'notification-dropdown';

    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        dropdown.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100%; height: 100%;
            max-height: 100vh;
            border-radius: 0;
        `;
        document.body.style.overflow = 'hidden';
    } else {
        const bellBtn = document.getElementById('btnNotifications');
        const rect    = bellBtn.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top      = `${rect.bottom + 10}px`;
        dropdown.style.right    = `${window.innerWidth - rect.right}px`;
    }

    document.body.appendChild(dropdown);
    renderNotificationDropdown();

    setTimeout(() => { dropdown.classList.add('active'); }, 10);
    notificationDropdownOpen = true;
}

function closeNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
        setTimeout(() => {
            if (dropdown.parentElement) dropdown.parentElement.removeChild(dropdown);
        }, 300);
    }
    document.body.style.overflow = '';
    notificationDropdownOpen = false;
}

// =============================================================================
//  RENDER DROPDOWN
// =============================================================================

function renderNotificationDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (!dropdown) return;

    let html = `
        <div class="notification-header">
            <h3>📬 Notifications</h3>
            <button class="notification-close-btn" onclick="window.NotificationSystem.close()">✕</button>
        </div>
        <div class="notification-content-wrapper">
    `;

    // ── Settings Changes ───────────────────────────────────────────────────────
    if (notificationData.settingsChanges.length > 0) {
        html += `
            <div class="notification-section">
                <div class="section-header">
                    <span class="section-icon">⚙️</span>
                    <span class="section-title">Settings Changes</span>
                    <span class="section-count">${notificationData.settingsChanges.length}</span>
                </div>
                <div class="notification-list">
        `;

        const recentChanges = notificationData.settingsChanges.slice(-5).reverse();
        recentChanges.forEach(change => {
            const timeAgo = getTimeAgo(new Date(change.timestamp));
            const isDebtDeleted = change.changes && change.changes.debtDeleted;
            html += `
                <div class="notification-item settings-change">
                    <div class="item-icon">${isDebtDeleted ? '⛔' : '⚙️'}</div>
                    <div class="item-content">
                        <div class="item-title">${isDebtDeleted ? 'Debt Deleted' : 'Settings Updated'}</div>
                        <div class="item-meta">
                            <span class="time-badge">🕐 ${timeAgo}</span>
                        </div>
                        <div class="settings-change-details">
                            ${Object.entries(change.changes).map(([key, value]) =>
                                `<div class="change-item">
                                    <strong>${formatSettingName(key)}:</strong> ${formatSettingValue(key, value)}
                                </div>`
                            ).join('')}
                        </div>
                    </div>
                    <button class="item-action-btn clear-notification"
                            onclick="window.NotificationSystem.clearSettingsChange('${change.id}')">
                        ✕
                    </button>
                </div>
            `;
        });

        html += '</div>';

        if (notificationData.settingsChanges.length > 5) {
            html += `
                <div class="notification-footer">
                    <button class="view-all-btn" onclick="window.NotificationSystem.clearAllSettingsChanges()">
                        Clear all settings notifications
                    </button>
                </div>
            `;
        }

        html += '</div>';
    }

    // ── Out of Stock ───────────────────────────────────────────────────────────
    html += `
        <div class="notification-section">
            <div class="section-header">
                <span class="section-icon">⛔</span>
                <span class="section-title">Out of Stock Alerts</span>
                <span class="section-count">${notificationData.outOfStock.length}</span>
            </div>
    `;
    if (notificationData.outOfStock.length === 0) {
        html += `
            <div class="empty-state">
                <span class="empty-icon">✅</span>
                <p>No products are out of stock!</p>
            </div>
        `;
    } else {
        html += '<div class="notification-list">';
        notificationData.outOfStock.slice(0, 10).forEach(product => {
            const category     = window.CATEGORIES?.find(c => c.id === (product.category || product.category_id));
            const categoryIcon = category?.icon || '📦';
            html += `
                <div class="notification-item critical" data-product-id="${product.id}">
                    <div class="item-icon">${categoryIcon}</div>
                    <div class="item-content">
                        <div class="item-title">${product.name}</div>
                        <div class="item-meta">
                            <span class="urgency-badge">⛔ Out of stock</span>
                            <span class="category-badge">${category?.name || 'Uncategorized'}</span>
                        </div>
                    </div>
                    <button class="item-action-btn"
                            onclick="window.NotificationSystem.goToProduct('${product.id}', '${product.category || product.category_id}')">
                        <span>Restock</span> →
                    </button>
                </div>
            `;
        });
        html += '</div>';
        if (notificationData.outOfStock.length > 10) {
            html += `
                <div class="notification-footer">
                    <button class="view-all-btn" onclick="window.NotificationSystem.goToInventory()">
                        View all ${notificationData.outOfStock.length} out of stock items →
                    </button>
                </div>
            `;
        }
    }
    html += '</div>';

    // ── Low Stock ──────────────────────────────────────────────────────────────
    html += `
        <div class="notification-section">
            <div class="section-header">
                <span class="section-icon">⚠️</span>
                <span class="section-title">Low Stock Alerts</span>
                <span class="section-count">${notificationData.lowStock.length}</span>
            </div>
    `;
    if (notificationData.lowStock.length === 0) {
        html += `
            <div class="empty-state">
                <span class="empty-icon">✅</span>
                <p>All products are well stocked!</p>
            </div>
        `;
    } else {
        html += '<div class="notification-list">';
        notificationData.lowStock.slice(0, 10).forEach(product => {
            const qty          = parseFloat(product.quantity || product.stock || 0);
            const category     = window.CATEGORIES?.find(c => c.id === (product.category || product.category_id));
            const categoryIcon = category?.icon || '📦';
            let urgencyClass = 'low', urgencyIcon = '💡';
            if (qty <= 3)      { urgencyClass = 'high';   urgencyIcon = '⚠️'; }
            else if (qty <= 5) { urgencyClass = 'medium'; urgencyIcon = '⚡'; }
            html += `
                <div class="notification-item ${urgencyClass}" data-product-id="${product.id}">
                    <div class="item-icon">${categoryIcon}</div>
                    <div class="item-content">
                        <div class="item-title">${product.name}</div>
                        <div class="item-meta">
                            <span class="urgency-badge">${urgencyIcon} ${qty} left</span>
                            <span class="category-badge">${category?.name || 'Uncategorized'}</span>
                        </div>
                    </div>
                    <button class="item-action-btn"
                            onclick="window.NotificationSystem.goToProduct('${product.id}', '${product.category || product.category_id}')">
                        <span>Restock</span> →
                    </button>
                </div>
            `;
        });
        html += '</div>';
        if (notificationData.lowStock.length > 10) {
            html += `
                <div class="notification-footer">
                    <button class="view-all-btn" onclick="window.NotificationSystem.goToInventory()">
                        View all ${notificationData.lowStock.length} low stock items →
                    </button>
                </div>
            `;
        }
    }
    html += '</div>';

    // ── Low Margin ─────────────────────────────────────────────────────────────
    html += `
        <div class="notification-section">
            <div class="section-header">
                <span class="section-icon">📉</span>
                <span class="section-title">Low Margin Alerts</span>
                <span class="section-count">${notificationData.lowMargin.length}</span>
            </div>
    `;
    if (notificationData.lowMargin.length === 0) {
        html += `
            <div class="empty-state">
                <span class="empty-icon">✅</span>
                <p>All products have healthy margins!</p>
            </div>
        `;
    } else {
        html += '<div class="notification-list">';
        notificationData.lowMargin.slice(0, 10).forEach(product => {
            const cost         = parseFloat(product.cost  || product.cost_price    || 0);
            const price        = parseFloat(product.price || product.selling_price || 0);
            const margin       = cost > 0 ? ((price - cost) / cost * 100) : 0;
            const category     = window.CATEGORIES?.find(c => c.id === (product.category || product.category_id));
            const categoryIcon = category?.icon || '📦';
            let urgencyClass = 'low', urgencyIcon = '💡';
            if (margin <= 0)      { urgencyClass = 'critical'; urgencyIcon = '🚨'; }
            else if (margin < 5)  { urgencyClass = 'high';     urgencyIcon = '⚠️'; }
            else if (margin < 10) { urgencyClass = 'medium';   urgencyIcon = '⚡'; }
            html += `
                <div class="notification-item ${urgencyClass}" data-product-id="${product.id}">
                    <div class="item-icon">${categoryIcon}</div>
                    <div class="item-content">
                        <div class="item-title">${product.name}</div>
                        <div class="item-meta">
                            <span class="urgency-badge">${urgencyIcon} ${margin.toFixed(1)}% margin</span>
                            <span class="category-badge">${category?.name || 'Uncategorized'}</span>
                        </div>
                    </div>
                    <button class="item-action-btn"
                            onclick="window.NotificationSystem.goToPriceProduct('${product.id}', '${product.category || product.category_id}')">
                        <span>Adjust</span> →
                    </button>
                </div>
            `;
        });
        html += '</div>';
        if (notificationData.lowMargin.length > 10) {
            html += `
                <div class="notification-footer">
                    <button class="view-all-btn" onclick="window.NotificationSystem.goToPrices()">
                        View all ${notificationData.lowMargin.length} low margin items →
                    </button>
                </div>
            `;
        }
    }

    html += '</div></div>';

    if (notificationData.lastUpdated) {
        html += `
            <div class="notification-footer-info">
                <span class="update-time">🔄 Updated ${getTimeAgo(notificationData.lastUpdated)}</span>
            </div>
        `;
    }

    dropdown.innerHTML = html;
}

// =============================================================================
//  NAVIGATION HELPERS
// =============================================================================

function goToProduct(productId, categoryId) {
    console.log('📦 Navigating to product:', productId);
    closeNotificationDropdown();
    if (typeof showPage === 'function') showPage('inventoryPage');
    setTimeout(() => {
        if (categoryId) {
            window._navToCategory = categoryId;
            if (typeof window.renderInventory === 'function') {
                window.renderInventory();
                setTimeout(() => highlightAndScrollToProduct(productId), 300);
            }
        }
    }, 100);
}

function highlightAndScrollToProduct(productId) {
    let productEl = document.querySelector(`tr[data-product-id="${productId}"]`)
                 || document.querySelector(`div[data-product-id="${productId}"]`)
                 || document.querySelector(`[data-product-id="${productId}"]`);
    if (!productEl) {
        console.warn('⚠️ Product element not found:', productId);
        return;
    }

    const isRow = productEl.tagName === 'TR';
    productEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    productEl.style.transition   = 'all 0.3s ease';
    productEl.style.outline      = '3px solid #f59e0b';
    productEl.style.outlineOffset = '2px';
    productEl.style.boxShadow    = '0 0 20px rgba(245, 158, 11, 0.4)';
    if (!isRow) productEl.style.transform = 'scale(1.02)';

    let pulseCount = 0;
    const pulseInterval = setInterval(() => {
        if (pulseCount >= 5) {
            clearInterval(pulseInterval);
            setTimeout(() => {
                productEl.style.outline      = '';
                productEl.style.outlineOffset = '';
                productEl.style.boxShadow    = '';
                if (!isRow) productEl.style.transform = '';
            }, 1500);
            return;
        }
        if (!isRow) {
            productEl.style.transform = pulseCount % 2 === 0 ? 'scale(1.04)' : 'scale(1.02)';
        }
        productEl.style.boxShadow = pulseCount % 2 === 0
            ? '0 0 28px rgba(245, 158, 11, 0.5)'
            : '0 0 14px rgba(245, 158, 11, 0.3)';
        pulseCount++;
    }, 400);
}

function goToInventory(categoryId) {
    closeNotificationDropdown();
    if (typeof showPage === 'function') showPage('inventoryPage');
    if (categoryId) {
        setTimeout(() => {
            window._navToCategory = categoryId;
            if (typeof window.renderInventory === 'function') window.renderInventory();
        }, 100);
    }
}

function goToPriceProduct(productId, categoryId) {
    console.log('💲 Navigating to price product:', productId);
    closeNotificationDropdown();
    if (typeof showPage === 'function') showPage('pricePage');
    setTimeout(() => {
        if (categoryId && typeof window.selectedPriceCategory !== 'undefined') {
            window.selectedPriceCategory = categoryId;
        }
        if (typeof window.renderPriceList === 'function') {
            window.renderPriceList();
            setTimeout(() => highlightAndScrollToProduct(productId), 300);
        }
    }, 100);
}

function goToPrices(categoryId) {
    closeNotificationDropdown();
    if (typeof showPage === 'function') showPage('pricePage');
    if (categoryId) {
        setTimeout(() => {
            window.selectedPriceCategory = categoryId;
            if (typeof window.renderPriceList === 'function') window.renderPriceList();
        }, 100);
    }
}

// =============================================================================
//  SETTINGS CHANGE MANAGEMENT
// =============================================================================

function onSettingsSaved(latestRecord) {
    notificationData.settingsChanges = window.storeSettings?.changeHistory || [];
    updateNotificationBadge();
    if (notificationDropdownOpen) renderNotificationDropdown();
    console.log('✅ Notification UI refreshed after save:', latestRecord);
}

async function clearSettingsChange(changeId) {
    if (!window.storeSettings) return;
    const updated = (window.storeSettings.changeHistory || []).filter(c => c.id !== changeId);
    window.storeSettings.changeHistory = updated;
    await persistHistoryToServer(updated);
    notificationData.settingsChanges = updated;
    updateNotificationBadge();
    if (notificationDropdownOpen) renderNotificationDropdown();
    console.log('✅ Settings change cleared:', changeId);
}

async function clearAllSettingsChanges() {
    if (!window.storeSettings) return;
    window.storeSettings.changeHistory = [];
    await persistHistoryToServer([]);
    notificationData.settingsChanges = [];
    updateNotificationBadge();
    if (notificationDropdownOpen) renderNotificationDropdown();
    console.log('✅ All settings changes cleared');
}

async function persistHistoryToServer(history) {
    if (!window.storeSettings) return;
    try {
        await DB.saveSettings({
            ...window.storeSettings,
            changeHistory: history
        });
        console.log('💾 Change history persisted to device storage');
    } catch (err) {
        console.error('❌ Failed to persist change history:', err);
    }
}

// =============================================================================
//  HELPER FUNCTIONS
// =============================================================================

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60)     return 'just now';
    if (seconds < 120)    return '1 minute ago';
    if (seconds < 3600)   return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 7200)   return '1 hour ago';
    if (seconds < 86400)  return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 172800) return '1 day ago';
    return `${Math.floor(seconds / 86400)} days ago`;
}

function formatSettingName(key) {
    return {
        profitMargin:  'Profit Margin',
        lowStockLimit: 'Low Stock Alert',
        debtSurcharge: 'Debt Surcharge'
    }[key] || key;
}

function formatSettingValue(key, value) {
    if (key === 'lowStockLimit') return `${value} units`;
    return `${value}%`;
}

// =============================================================================
//  STYLES
// =============================================================================

function injectNotificationStyles() {
    const styleId = 'notification-system-styles';
    if (document.getElementById(styleId)) return;

    const style  = document.createElement('style');
    style.id     = styleId;
    style.textContent = `
        .notification-bell-btn { position: relative; }

        body.dark-mode #btnNotifications {
            background: rgba(203, 223, 189, 0.08);
            color: #a8c99c;
            border-color: rgba(203, 223, 189, 0.15);
        }
        body.dark-mode #btnNotifications:hover {
            background: rgba(203, 223, 189, 0.18);
            color: #cbdfbd;
            border-color: rgba(203, 223, 189, 0.3);
        }
        body.dark-mode #btnNotifications.active {
            background: rgba(203, 223, 189, 0.22);
            color: #d4e09b;
        }

        .notification-badge {
            position: absolute;
            top: 8px; right: 8px;
            background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
            color: white;
            border-radius: 12px;
            padding: 2px 6px;
            font-size: 11px;
            font-weight: 800;
            min-width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
            border: 2px solid var(--nav-bg, #2d5535);
        }
        body.dark-mode .notification-badge {
            border-color: #1a2a1f;
            box-shadow: 0 2px 10px rgba(239, 68, 68, 0.5);
        }
        @keyframes notificationPulse {
            0%   { transform: scale(1); }
            50%  { transform: scale(1.2); }
            100% { transform: scale(1); }
        }

        /* ── Dropdown ── */
        .notification-dropdown {
            background: white;
            border-radius: 20px;
            width: 420px;
            max-height: 600px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            z-index: 9999;
            border: 1px solid rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
        }
        .notification-dropdown.active {
            opacity: 1;
            transform: translateY(0);
        }

        .notification-header {
            background: linear-gradient(135deg, #cbdfbd 0%, #a8c99c 100%);
            padding: 20px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid rgba(255,255,255,0.3);
            flex-shrink: 0;
        }
        .notification-header h3 { margin: 0; font-size: 1.3rem; font-weight: 800; color: #2d5535; }

        .notification-close-btn {
            background: rgba(255,255,255,0.3); border: none;
            width: 32px; height: 32px; border-radius: 8px;
            cursor: pointer; font-size: 18px; color: #2d5535;
            transition: all 0.2s ease;
            display: flex; align-items: center; justify-content: center;
        }
        .notification-close-btn:hover { background: rgba(255,255,255,0.5); transform: rotate(90deg); }

        .notification-content-wrapper {
            overflow-y: auto; overflow-x: hidden;
            flex: 1;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
            scroll-behavior: smooth;
        }

        .notification-section { padding: 20px; border-bottom: 1px solid #F0F0F0; flex-shrink: 0; }
        .notification-section:last-of-type { border-bottom: none; }

        .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .section-icon { font-size: 20px; }
        .section-title { font-size: 15px; font-weight: 800; color: #5D534A; flex: 1; }
        .section-count {
            background: linear-gradient(135deg, #EF4444, #DC2626);
            color: white; padding: 4px 10px; border-radius: 12px;
            font-size: 12px; font-weight: 800;
        }

        .notification-list {
            max-height: 350px;
            overflow-y: auto; overflow-x: hidden;
            display: flex; flex-direction: column; gap: 10px;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain; scroll-behavior: smooth;
        }
        .notification-list::-webkit-scrollbar { width: 6px; }
        .notification-list::-webkit-scrollbar-track { background: #F0F0F0; border-radius: 3px; }
        .notification-list::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 3px; }
        .notification-list::-webkit-scrollbar-thumb:hover { background: #A0AEC0; }

        .notification-item {
            display: flex; align-items: center; gap: 12px;
            padding: 12px; border-radius: 12px;
            transition: all 0.2s ease; cursor: pointer;
            user-select: none; -webkit-user-select: none;
            touch-action: manipulation; -webkit-tap-highlight-color: transparent;
        }
        .notification-item:hover  { transform: translateX(4px); }
        .notification-item:active { opacity: 0.8; }
        .notification-item.critical { background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1));    border-left: 4px solid #EF4444; }
        .notification-item.high     { background: linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1));  border-left: 4px solid #F59E0B; }
        .notification-item.medium   { background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.1));   border-left: 4px solid #3B82F6; }
        .notification-item.low      { background: linear-gradient(135deg, rgba(168,201,156,0.15), rgba(203,223,189,0.1)); border-left: 4px solid #a8c99c; }
        .notification-item.settings-change { background: linear-gradient(135deg, rgba(147,197,253,0.15), rgba(59,130,246,0.1)); border-left: 4px solid #3B82F6; }

        .item-icon { font-size: 32px; flex-shrink: 0; }
        .item-content { flex: 1; min-width: 0; }
        .item-title { font-size: 14px; font-weight: 700; color: #2D3748; margin-bottom: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .item-meta { display: flex; gap: 8px; flex-wrap: wrap; }

        .urgency-badge, .category-badge, .time-badge { font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 600; }
        .urgency-badge  { background: rgba(0,0,0,0.1);       color: #5D534A; }
        .category-badge { background: rgba(203,223,189,0.3); color: #3e5235; }
        .time-badge     { background: rgba(147,197,253,0.3); color: #1e40af; }

        .settings-change-details { margin-top: 8px; font-size: 12px; color: #64748b; }
        .change-item { margin: 4px 0; padding: 4px 8px; background: rgba(255,255,255,0.5); border-radius: 6px; }
        .change-item strong { color: #334155; }

        .item-action-btn {
            background: linear-gradient(135deg, #cbdfbd, #a8c99c);
            color: #2d5535; border: none; padding: 8px 14px;
            border-radius: 8px; font-size: 13px; font-weight: 700;
            cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
            display: flex; align-items: center; gap: 4px;
        }
        .item-action-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(203,223,189,0.4); }
        .item-action-btn.clear-notification { background: linear-gradient(135deg, #fee2e2, #fecaca); color: #dc2626; padding: 6px 10px; }
        .item-action-btn.clear-notification:hover { background: linear-gradient(135deg, #fecaca, #fca5a5); }

        .empty-state { text-align: center; padding: 40px 20px; color: #9E9382; }
        .empty-icon  { font-size: 48px; display: block; margin-bottom: 12px; }
        .empty-state p { margin: 0; font-size: 15px; }

        .notification-footer { padding: 16px; border-top: 1px solid #F0F0F0; text-align: center; }
        .view-all-btn {
            background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
            color: #5D534A; border: none; padding: 12px 24px;
            border-radius: 10px; font-size: 14px; font-weight: 700;
            cursor: pointer; transition: all 0.2s ease; width: 100%;
        }
        .view-all-btn:hover { background: linear-gradient(135deg, #E5E7EB, #D1D5DB); transform: translateY(-2px); }

        .notification-footer-info {
            padding: 12px 20px; text-align: center;
            background: #F9FAFB; border-top: 1px solid #F0F0F0;
            flex-shrink: 0;
        }
        .update-time { font-size: 12px; color: #9E9382; }

        /* ══ DARK MODE ══ */
        body.dark-mode .notification-dropdown         { background: #1a2a1f; border-color: rgba(203,223,189,0.15); }
        body.dark-mode .notification-header           { background: linear-gradient(135deg, #2d3e2f, #1f2e22); border-bottom-color: rgba(203,223,189,0.15); }
        body.dark-mode .notification-header h3        { color: #a8c99c; }
        body.dark-mode .notification-close-btn        { background: rgba(203,223,189,0.12); color: #a8c99c; }
        body.dark-mode .notification-close-btn:hover  { background: rgba(203,223,189,0.22); }
        body.dark-mode .notification-section          { border-bottom-color: rgba(255,255,255,0.07); }
        body.dark-mode .section-title                 { color: #d1d5db; }
        body.dark-mode .notification-list::-webkit-scrollbar-track { background: #1f2e24; }
        body.dark-mode .notification-list::-webkit-scrollbar-thumb { background: #3a5040; }
        body.dark-mode .notification-item.settings-change { background: linear-gradient(135deg, rgba(96,165,250,0.12), rgba(59,130,246,0.08)); }
        body.dark-mode .item-title                    { color: #e8f0e8; }
        body.dark-mode .urgency-badge                 { background: rgba(255,255,255,0.08); color: #c0c8bc; }
        body.dark-mode .category-badge                { background: rgba(203,223,189,0.15); color: #a8c99c; }
        body.dark-mode .time-badge                    { background: rgba(147,197,253,0.15); color: #93c5fd; }
        body.dark-mode .settings-change-details       { color: #8a9fa8; }
        body.dark-mode .change-item                   { background: rgba(255,255,255,0.05); }
        body.dark-mode .change-item strong            { color: #b0c4b8; }
        body.dark-mode .item-action-btn               { background: linear-gradient(135deg, rgba(203,223,189,0.2), rgba(168,201,156,0.15)); color: #a8c99c; border: 1px solid rgba(168,201,156,0.25); }
        body.dark-mode .item-action-btn:hover         { background: linear-gradient(135deg, rgba(203,223,189,0.3), rgba(168,201,156,0.25)); color: #cbdfbd; }
        body.dark-mode .item-action-btn.clear-notification { background: linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1)); color: #f87171; border-color: rgba(239,68,68,0.2); }
        body.dark-mode .empty-state                   { color: #5a7060; }
        body.dark-mode .view-all-btn                  { background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.04)); color: #a0b8a0; border: 1px solid rgba(255,255,255,0.08); }
        body.dark-mode .view-all-btn:hover            { background: linear-gradient(135deg, rgba(203,223,189,0.12), rgba(168,201,156,0.08)); color: #cbdfbd; }
        body.dark-mode .notification-footer           { border-top-color: rgba(255,255,255,0.07); }
        body.dark-mode .notification-footer-info      { background: rgba(0,0,0,0.2); border-top-color: rgba(255,255,255,0.07); }
        body.dark-mode .update-time                   { color: #5a7060; }

        /* ══ MOBILE (≤ 768px) ══ */
        @media (max-width: 768px) {
            .notification-dropdown {
                width: 100vw  !important; max-width: 100vw !important;
                height: 100vh !important; max-height: 100vh !important;
                left: 0 !important; right: 0 !important;
                top: 0 !important; bottom: 0 !important;
                border-radius: 0 !important;
                padding-top:    env(safe-area-inset-top);
                padding-bottom: env(safe-area-inset-bottom);
            }
            .notification-header {
                padding: max(20px, calc(env(safe-area-inset-top) + 10px)) 20px 20px 20px;
            }
            .notification-content-wrapper {
                flex: 1 1 0;
                max-height: none;
                overflow-y: auto;
            }
            .notification-list {
                max-height: none;
                overflow-y: visible;
            }
            .notification-section { flex-shrink: 0; }
            .notification-item    { min-height: 60px; padding: 14px 12px; }
            .item-action-btn      { min-height: 44px; min-width: 80px; justify-content: center; }
            .notification-footer-info {
                padding-bottom: max(12px, env(safe-area-inset-bottom));
            }
        }
    `;

    document.head.appendChild(style);
    console.log('✅ Notification styles injected');
}

// =============================================================================
//  EXPORT TO WINDOW
// =============================================================================

window.NotificationSystem = {
    refresh:                 refreshNotifications,
    close:                   closeNotificationDropdown,
    goToInventory:           goToInventory,
    goToProduct:             goToProduct,
    goToPriceProduct:        goToPriceProduct,
    goToPrices:              goToPrices,
    onSettingsSaved:         onSettingsSaved,
    clearSettingsChange:     clearSettingsChange,
    clearAllSettingsChanges: clearAllSettingsChanges
};

console.log('✅ Enhanced notifications module loaded!');