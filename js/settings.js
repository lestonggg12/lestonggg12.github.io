// Dark mode: force Save Settings button styling via CSS variables (no hardcoded colors needed)
    if (document.body.classList.contains('dark-mode')) {
        // The CSS variables handle dark mode styling automatically now
        // Keep observer for any edge cases where inline styles override
        const observer = new MutationObserver(() => {
            document.querySelectorAll('button').forEach(btn => {
                if (btn.textContent && btn.textContent.trim().toUpperCase().includes('SAVE SETTINGS')) {
                    btn.style.background = 'var(--btn-green-bg)';
                    btn.style.color = 'var(--btn-green-text)';
                    btn.style.border = 'none';
                    btn.style.textShadow = 'none';
                    btn.style.boxShadow = '';
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        // Also run once immediately
        setTimeout(() => {
            document.querySelectorAll('button').forEach(btn => {
                if (btn.textContent && btn.textContent.trim().toUpperCase().includes('SAVE SETTINGS')) {
                    btn.style.background = perfectBtnStyle;
                    btn.style.color = perfectBtnText;
                    btn.style.border = perfectBtnBorder;
                    btn.style.textShadow = 'none';
                    btn.style.boxShadow = perfectBtnShadow;
                }
            });
        }, 100);
    }
/**
 * settings.js — Enhanced with Change Notifications
 *
 * FEATURES:
 * - Dark mode toggle (back in settings)
 * - Records changes to Profit Margin, Low Stock Alert, and Debt Surcharge
 * - Theme changes NOT tracked in notifications
 *
 * DEVICE PERSISTENCE:
 * - changeHistory is stored LOCALLY in this browser's database.
 *   Settings are specific to this device and browser.
 *
 * FIX: Surcharge change detection uses explicit numeric snapshots.
 */

window.storeSettings = null;

async function initSettings() {
    try {
        let data = await DB.getSettings();

        if (!data) {
            // Fallback to localStorage or defaults
            const raw = localStorage.getItem('cached_settings');
            data = raw ? JSON.parse(raw) : {
                profitMargin:  20,
                lowStockLimit: 5,
                theme:         'light',
                debtSurcharge: 0,
                changeHistory: []
            };
        }
        window.storeSettings = data;
        window.storeSettings.debtSurcharge =
            parseFloat(window.storeSettings.debtSurcharge ?? 0) || 0;
        if (!Array.isArray(window.storeSettings.changeHistory)) {
            window.storeSettings.changeHistory = [];
        }
        console.log("✅ Settings loaded:", window.storeSettings);
        applyThemeFromSettings();
    } catch (e) {
        console.error("❌ Failed to load settings, using defaults", e);
        window.storeSettings = {
            profitMargin:  20,
            lowStockLimit: 5,
            theme:         'light',
            debtSurcharge: 0,
            changeHistory: []
        };
        applyThemeFromSettings();
    }
}

function applyThemeFromSettings() {
    if (!window.storeSettings) return;

    const isDarkMode  = window.storeSettings.theme === 'dark';
    const bodyHasDark = document.body.classList.contains('dark-mode');

    if (isDarkMode && !bodyHasDark) {
        document.body.classList.add('dark-mode');
        console.log('🌙 Dark mode applied from local settings');
    } else if (!isDarkMode && bodyHasDark) {
        document.body.classList.remove('dark-mode');
        console.log('☀️ Light mode applied from local settings');
    }
}

function showSuccessDialog(message, icon = '✅') {
    const existing = document.getElementById('successDialogOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id    = 'successDialogOverlay';
    overlay.innerHTML = `
        <div class="success-dialog-box">
            <div class="success-shimmer"></div>
            <div class="success-icon-wrapper">
                <div class="success-icon-ring"></div>
                <span class="success-icon">${icon}</span>
            </div>
            <h3 class="success-title">Success!</h3>
            <div class="success-message">${message}</div>
            <button class="success-btn" onclick="document.getElementById('successDialogOverlay').remove()">
                Perfect! 🎉
            </button>
        </div>
        <style>
            body.dark-mode .success-btn,
            body.dark-mode .save-settings-btn {
                background: var(--btn-green-bg) !important;
                color: var(--btn-green-text) !important;
                border: none !important;
                text-shadow: none !important;
                box-shadow: var(--btn-green-shadow);
            }
            body.dark-mode .success-btn:hover,
            body.dark-mode .save-settings-btn:hover {
                background: var(--btn-green-hover) !important;
                color: var(--btn-green-text) !important;
            }
            body.dark-mode .success-btn {
                background: var(--btn-green-bg) !important;
                color: var(--btn-green-text) !important;
                border: none !important;
                text-shadow: none !important;
                box-shadow: var(--btn-green-shadow);
            }
            body.dark-mode .success-btn:hover {
                background: var(--btn-green-hover) !important;
                color: var(--btn-green-text) !important;
            }
            #successDialogOverlay {
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(15px);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 99999;
                animation: fadeIn 0.3s ease;
            }
            .success-dialog-box {
                background: linear-gradient(135deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95));
                backdrop-filter: blur(25px);
                border-radius: 32px;
                padding: 50px 45px 45px;
                width: 90%;
                max-width: 480px;
                box-shadow: 0 40px 100px rgba(0,0,0,0.3), 0 0 0 1px rgba(203,223,189,0.3) inset;
                animation: successSlideIn 0.5s cubic-bezier(0.34,1.56,0.64,1);
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .success-shimmer {
                position: absolute; top: 0; left: 0; right: 0; height: 10px;
                background: linear-gradient(90deg,#cbdfbd 0%,#a8c99c 15%,#d4e09b 30%,#f3c291 45%,#cbdfbd 60%,#a8c99c 75%,#d4e09b 90%,#cbdfbd 100%);
                background-size: 200% 100%;
                animation: shimmerMove 3s linear infinite;
            }
            @keyframes shimmerMove { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
            .success-icon-wrapper {
                width: 110px; height: 110px;
                margin: 0 auto 32px;
                display: flex; align-items: center; justify-content: center;
                border-radius: 50%;
                background: linear-gradient(135deg, #cbdfbd 0%, #a8c99c 100%);
                box-shadow: 0 15px 40px rgba(203,223,189,0.6), 0 0 0 10px rgba(203,223,189,0.15), 0 0 0 20px rgba(203,223,189,0.08);
                animation: successIconBounce 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s backwards;
                position: relative;
            }
            .success-icon-wrapper::before {
                content: ''; position: absolute; inset: -15px; border-radius: 50%;
                background: linear-gradient(135deg, rgba(203,223,189,0.4), rgba(168,201,156,0.4));
                animation: pulse 2s ease-in-out infinite; z-index: -1;
            }
            .success-icon-ring {
                position: absolute; inset: -12px; border-radius: 50%;
                border: 3px solid transparent;
                border-top-color: rgba(203,223,189,0.7);
                border-right-color: rgba(168,201,156,0.5);
                animation: rotate 3s linear infinite;
            }
            @keyframes rotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            @keyframes successIconBounce { 0%{transform:scale(0) rotate(-180deg);opacity:0} 60%{transform:scale(1.2) rotate(20deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
            @keyframes pulse { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.1);opacity:.8} }
            .success-icon { font-size:60px; filter:drop-shadow(0 4px 8px rgba(0,0,0,.2)); animation:iconFloat 3s ease-in-out infinite; }
            @keyframes iconFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
            .success-title {
                font-size:32px; font-weight:900;
                background:linear-gradient(135deg,#2d3748,#5D534A,#3e5235);
                -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
                margin:0 0 16px; letter-spacing:-1px;
                animation:slideDown 0.5s ease 0.3s backwards;
            }
            .success-message { font-size:18px; line-height:1.8; color:#718096; font-weight:500; margin-bottom:40px; animation:slideDown 0.5s ease 0.4s backwards; padding:0 10px; }
            .success-btn {
                width:100%; padding:20px 32px;
                background:var(--btn-green-bg);
                color:var(--btn-green-text); border:none; border-radius:18px;
                font-weight:900; font-size:18px; cursor:pointer;
                box-shadow:var(--btn-green-shadow);
                transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
                animation:slideDown 0.5s ease 0.45s backwards;
            }
            .success-btn:hover { transform:translateY(-4px); box-shadow:var(--btn-green-shadow-hover); background:var(--btn-green-hover); }
            .success-btn:active { transform:translateY(-2px); }
            @keyframes fadeIn { from{opacity:0} to{opacity:1} }
            @keyframes successSlideIn { from{transform:scale(0.7) translateY(50px);opacity:0} to{transform:scale(1) translateY(0);opacity:1} }
            @keyframes slideDown { from{opacity:0;transform:translateY(-30px)} to{opacity:1;transform:translateY(0)} }
            body.dark-mode .success-dialog-box { background:linear-gradient(135deg,rgba(45,55,72,0.98),rgba(30,40,55,0.95)); }
            body.dark-mode .success-title { background:linear-gradient(135deg,#f9fafb,#d1d5db,#cbdfbd); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
            body.dark-mode .success-message { color:#d1d5db; }
        </style>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
        if (document.getElementById('successDialogOverlay')) {
            overlay.style.animation = 'fadeIn 0.3s ease reverse';
            setTimeout(() => overlay.remove(), 300);
        }
    }, 4000);
}

window.renderSettings = async function() {
    const container = document.getElementById('settingsContent');
    if (!container) return;

    if (!window.storeSettings) await initSettings();

    const isDark    = document.body.classList.contains('dark-mode');
    const surcharge = parseFloat(window.storeSettings.debtSurcharge || 0);

    container.innerHTML = `
        <style>
            .settings-grid-container {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                gap: 30px;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }

            /* ══════════════════════════════════════════
               NEO-GLASSMORPHIC CARDS
            ══════════════════════════════════════════ */
            .stylish-card {
                background: linear-gradient(
                    135deg,
                    rgba(255, 255, 255, 0.72) 0%,
                    rgba(245, 250, 241, 0.55) 50%,
                    rgba(235, 245, 228, 0.42) 100%
                );
                backdrop-filter: blur(28px) saturate(1.8);
                -webkit-backdrop-filter: blur(28px) saturate(1.8);
                border-radius: 28px;
                padding: 38px;
                border: 1px solid rgba(255, 255, 255, 0.85);
                box-shadow:
                    0 8px 32px rgba(93, 83, 74, 0.10),
                    0 2px 8px rgba(203, 223, 189, 0.18),
                    inset 0 1.5px 0 rgba(255, 255, 255, 0.95),
                    inset 0 -1px 0 rgba(203, 223, 189, 0.20);
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
            }
            .stylish-card::before {
                content: '';
                position: absolute; top: 0; left: 0; right: 0; height: 6px;
                background: linear-gradient(90deg, #cbdfbd 0%, #d4e09b 50%, #f19c79 100%);
                border-radius: 28px 28px 0 0;
                z-index: 1;
            }
            /* Neo-glassmorphic shimmer overlay */
            .stylish-card::after {
                content: '';
                position: absolute; inset: 0;
                background: linear-gradient(
                    135deg,
                    rgba(255, 255, 255, 0.35) 0%,
                    rgba(255, 255, 255, 0.00) 40%,
                    rgba(203, 223, 189, 0.08) 100%
                );
                pointer-events: none;
                border-radius: 28px;
            }
            .stylish-card.debtors-card::before {
                background: linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #FDE68A 100%);
            }
            .stylish-card:hover {
                transform: translateY(-6px) scale(1.012);
                box-shadow:
                    0 20px 60px rgba(93, 83, 74, 0.15),
                    0 4px 16px rgba(203, 223, 189, 0.30),
                    inset 0 1.5px 0 rgba(255, 255, 255, 1),
                    inset 0 -1px 0 rgba(203, 223, 189, 0.30);
                border-color: rgba(255, 255, 255, 1);
                background: linear-gradient(
                    135deg,
                    rgba(255, 255, 255, 0.82) 0%,
                    rgba(245, 250, 241, 0.68) 50%,
                    rgba(235, 245, 228, 0.55) 100%
                );
            }
            .stylish-card.debtors-card:hover {
                box-shadow:
                    0 20px 60px rgba(245, 158, 11, 0.12),
                    0 4px 16px rgba(245, 158, 11, 0.20),
                    inset 0 1.5px 0 rgba(255, 255, 255, 1),
                    inset 0 -1px 0 rgba(245, 158, 11, 0.20);
            }
            /* ══════════════════════════════════════════ */

            .card-icon { font-size:56px; margin-bottom:20px; text-align:center; filter:drop-shadow(0 4px 10px rgba(0,0,0,0.1)); position: relative; z-index: 1; }
            .card-body { position: relative; z-index: 1; }
            .card-body h3 { color:#5D534A; font-size:1.5rem; font-weight:800; margin-bottom:8px; text-align:center; }
            .card-body > p { color:#9E9382; font-size:14px; text-align:center; margin-bottom:30px; }
            .control-group {
                display:flex; justify-content:space-between; align-items:center;
                margin-bottom:20px; padding:15px 20px;
                background:linear-gradient(135deg,rgba(203,223,189,0.08),rgba(212,224,155,0.05));
                border-radius:12px; border:1px solid rgba(203,223,189,0.2);
            }
            .debtors-card .control-group { background:linear-gradient(135deg,rgba(245,158,11,0.08),rgba(251,191,36,0.05)); border-color:rgba(245,158,11,0.2); }
            .label-text { font-weight:700; color:#5D534A; font-size:14px; text-transform:uppercase; letter-spacing:0.5px; }
            .stylish-input {
                width:120px; padding:12px 16px;
                border:2px solid rgba(93,83,74,0.2); border-radius:10px;
                font-size:16px; font-weight:700; color:#5D534A;
                text-align:center; transition:all 0.3s ease; background:white;
            }
            .stylish-input:focus { outline:none; border-color:#cbdfbd; box-shadow:0 0 0 4px rgba(203,223,189,0.2); transform:scale(1.05); }
            .debtors-card .stylish-input:focus { border-color:#F59E0B; box-shadow:0 0 0 4px rgba(245,158,11,0.15); }
            .stylish-input:hover { border-color:#cbdfbd; }
            .debtors-card .stylish-input:hover { border-color:#F59E0B; }
            .stylish-switch { position:relative; display:inline-block; width:70px; height:36px; }
            .stylish-switch input { opacity:0; width:0; height:0; }
            .stylish-slider {
                position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0;
                background:linear-gradient(135deg,#e0e0e0 0%,#c8c8c8 100%);
                transition:all 0.4s cubic-bezier(0.4,0,0.2,1);
                border-radius:34px; box-shadow:inset 0 2px 4px rgba(0,0,0,0.1);
            }
            .stylish-slider:before {
                position:absolute; content:""; height:28px; width:28px;
                left:4px; bottom:4px; background:white;
                transition:all 0.4s cubic-bezier(0.4,0,0.2,1);
                border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.2);
            }
            input:checked + .stylish-slider { background:linear-gradient(135deg,#cbdfbd 0%,#a8c99c 100%); box-shadow:0 0 15px rgba(203,223,189,0.4); }
            input:checked + .stylish-slider:before { transform:translateX(34px); box-shadow:0 2px 12px rgba(0,0,0,0.3); }
            .settings-footer { text-align:center; margin-top:40px; padding:20px; }

            /* ── SAVE SETTINGS button ── */
            .btn-save-modern {
                padding:18px 48px;
                background:var(--btn-green-bg);
                color:var(--btn-green-text); border:none; border-radius:16px;
                font-size:18px; font-weight:900; cursor:pointer;
                text-transform:uppercase; letter-spacing:1.5px;
                box-shadow:var(--btn-green-shadow);
                transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
            }
            .btn-save-modern:hover { transform:translateY(-4px); box-shadow:var(--btn-green-shadow-hover); background:var(--btn-green-hover); }
            .btn-save-modern:active { transform:translateY(-2px); }

            /* ── SAVE SETTINGS dark mode ── */
            body.dark-mode .btn-save-modern {
                background: var(--btn-green-bg) !important;
                color: var(--btn-green-text) !important;
                border: none !important;
                box-shadow: var(--btn-green-shadow) !important;
                text-shadow: none !important;
            }
            body.dark-mode .btn-save-modern:hover {
                background: var(--btn-green-hover) !important;
                color: var(--btn-green-text) !important;
                box-shadow: var(--btn-green-shadow-hover) !important;
                transform: translateY(-3px);
            }
            body.dark-mode .btn-save-modern:active {
                transform: translateY(-1px) !important;
                box-shadow: var(--btn-green-shadow) !important;
            }

            .info-box { background:linear-gradient(135deg,rgba(203,223,189,0.15),rgba(203,223,189,0.08)); border-left:4px solid #cbdfbd; padding:20px; margin-top:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.05); }
            .debtors-card .info-box { background:linear-gradient(135deg,rgba(245,158,11,0.1),rgba(251,191,36,0.05)); border-left-color:#F59E0B; }
            .info-box-content { display:flex; align-items:flex-start; gap:12px; }
            .info-icon { font-size:32px; flex-shrink:0; }
            .info-text { flex:1; }
            .info-text strong { color:#5D534A; font-size:16px; display:block; margin-bottom:5px; }
            .info-text p { color:#9E9382; margin:0; font-size:14px; line-height:1.6; }
            .sync-badge {
                display:inline-flex; align-items:center; gap:8px;
                background:linear-gradient(135deg,rgba(203,223,189,0.2),rgba(168,201,156,0.15));
                padding:8px 16px; border-radius:20px; font-size:13px;
                font-weight:700; color:#3e5235;
                border:1px solid rgba(203,223,189,0.4); margin-top:10px;
            }
            .sync-badge.amber { background:linear-gradient(135deg,rgba(245,158,11,0.15),rgba(251,191,36,0.1)); color:#92400E; border-color:rgba(245,158,11,0.3); }
            .sync-badge::before { content:'💾'; font-size:16px; }
            .surcharge-preview {
                margin-top:14px; padding:12px 16px;
                background:rgba(245,158,11,0.08);
                border:1px solid rgba(245,158,11,0.25);
                border-radius:10px; font-size:13px; color:#92400E; line-height:1.7;
            }
            body.dark-mode .surcharge-preview { background:rgba(245,158,11,0.08); color:#fcd34d; border-color:rgba(245,158,11,0.2); }

            /* ══════════════════════════════════════════
               NEO-GLASSMORPHIC DARK MODE CARDS
            ══════════════════════════════════════════ */
            body.dark-mode .stylish-card {
                background: linear-gradient(
                    135deg,
                    rgba(40, 52, 45, 0.75) 0%,
                    rgba(30, 42, 35, 0.60) 50%,
                    rgba(22, 32, 26, 0.55) 100%
                ) !important;
                border: 1px solid rgba(203, 223, 189, 0.18) !important;
                box-shadow:
                    0 8px 32px rgba(0, 0, 0, 0.35),
                    0 2px 8px rgba(0, 0, 0, 0.20),
                    inset 0 1.5px 0 rgba(255, 255, 255, 0.08),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.20) !important;
            }
            body.dark-mode .stylish-card::after {
                background: linear-gradient(
                    135deg,
                    rgba(255,255,255,0.06) 0%,
                    rgba(255,255,255,0.00) 40%,
                    rgba(203,223,189,0.04) 100%
                );
            }
            body.dark-mode .stylish-card:hover {
                background: linear-gradient(
                    135deg,
                    rgba(48, 62, 52, 0.85) 0%,
                    rgba(36, 50, 40, 0.72) 50%,
                    rgba(28, 40, 32, 0.68) 100%
                ) !important;
                border-color: rgba(203, 223, 189, 0.30) !important;
                box-shadow:
                    0 20px 60px rgba(0, 0, 0, 0.50),
                    0 4px 16px rgba(0, 0, 0, 0.30),
                    inset 0 1.5px 0 rgba(255, 255, 255, 0.12),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.20) !important;
            }
            body.dark-mode .stylish-card.debtors-card { border-color: rgba(245, 158, 11, 0.20) !important; }
            body.dark-mode .stylish-card.debtors-card:hover { border-color: rgba(245, 158, 11, 0.35) !important; }
            /* ══════════════════════════════════════════ */

            body.dark-mode .card-body h3 { color:#f9fafb; }
            body.dark-mode .card-body > p { color:#9ca3af; }
            body.dark-mode .label-text { color:#d1d5db; }
            body.dark-mode .stylish-input { background:rgba(255,255,255,0.1); color:#f9fafb; border-color:rgba(203,223,189,0.3); }
            body.dark-mode .debtors-card .stylish-input { border-color:rgba(245,158,11,0.3); }
            body.dark-mode .control-group { background:rgba(203,223,189,0.05); border-color:rgba(203,223,189,0.15); }
            body.dark-mode .debtors-card .control-group { background:rgba(245,158,11,0.05); border-color:rgba(245,158,11,0.15); }
            body.dark-mode .info-box { background:rgba(203,223,189,0.1); }
            body.dark-mode .debtors-card .info-box { background:rgba(245,158,11,0.08); }
            body.dark-mode .info-text strong { color:#f9fafb; }
            body.dark-mode .info-text p { color:#9ca3af; }
            body.dark-mode .sync-badge { background:rgba(203,223,189,0.15); border-color:rgba(203,223,189,0.3); color:#cbdfbd; }
            body.dark-mode .sync-badge.amber { background:rgba(245,158,11,0.12); color:#fbbf24; border-color:rgba(245,158,11,0.25); }

            /* ── Dark mode toggle switch — muted when dark ── */
            body.dark-mode .stylish-slider {
                background: linear-gradient(135deg, #2a3a2e 0%, #1e2e22 100%);
                box-shadow: inset 0 2px 6px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.06);
            }
            body.dark-mode input:checked + .stylish-slider {
                background: linear-gradient(135deg, #3a6b42 0%, #2d5235 100%);
                box-shadow: 0 0 12px rgba(74,122,66,0.35), inset 0 1px 2px rgba(0,0,0,0.2);
            }
            body.dark-mode .stylish-slider:before {
                background: #c8d8cc;
                box-shadow: 0 2px 6px rgba(0,0,0,0.5);
            }
            body.dark-mode input:checked + .stylish-slider:before {
                background: #e8f5ea;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            }

            @media (max-width: 768px) {
                .settings-grid-container { grid-template-columns:1fr; padding:15px; }
                .stylish-card { padding:25px; }
                .control-group { flex-direction:column; gap:15px; text-align:center; }
                .stylish-input { width:100%; }
            }
        </style>

        <div class="settings-grid-container">

            <!-- ── Appearance card ── -->
            <div class="stylish-card">
                <div class="card-icon">🎨</div>
                <div class="card-body">
                    <h3>Appearance</h3>
                    <p>Workspace theme preferences</p>
                    <div class="control-group">
                        <span class="label-text">Dark Mode</span>
                        <label class="stylish-switch">
                            <input type="checkbox" id="darkThemeSwitch" ${isDark ? 'checked' : ''}>
                            <span class="stylish-slider"></span>
                        </label>
                    </div>
                    <div class="sync-badge">Saved to this device (not tracked in notifications)</div>
                </div>
            </div>

            <!-- ── Inventory & Sales card ── -->
            <div class="stylish-card">
                <div class="card-icon">📈</div>
                <div class="card-body">
                    <h3>Inventory &amp; Sales</h3>
                    <p>Global business rules</p>
                    <div class="control-group">
                        <span class="label-text">Profit Margin (%)</span>
                        <input type="number" id="marginInput" value="${window.storeSettings.profitMargin}" class="stylish-input" min="0" max="100" step="1">
                    </div>
                    <div class="control-group">
                        <span class="label-text">Low Stock Alert</span>
                        <input type="number" id="lowStockInput" value="${window.storeSettings.lowStockLimit}" class="stylish-input" min="1" max="100" step="1">
                    </div>
                    <div class="sync-badge">Changes saved locally & tracked in alerts</div>
                    <div class="info-box">
                        <div class="info-box-content">
                            <span class="info-icon">💡</span>
                            <div class="info-text">
                                <strong>How These Settings Work</strong>
                                <p>
                                    <strong>Profit Margin:</strong> When adding or editing products, you'll receive warnings if the margin falls below this percentage.<br><br>
                                    <strong>Low Stock Alert:</strong> Products with quantities below this number will be highlighted in yellow in your inventory.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── Debtors card ── -->
            <div class="stylish-card debtors-card">
                <div class="card-icon">🧾</div>
                <div class="card-body">
                    <h3>Debtors</h3>
                    <p>Surcharge applied to new credit loans</p>
                    <div class="control-group">
                        <span class="label-text">Debt Surcharge (%)</span>
                        <input type="number" id="debtSurchargeInput"
                               value="${surcharge}"
                               class="stylish-input" min="0" max="100" step="0.01">
                    </div>
                    <div id="surchargePreview" style="display:${surcharge > 0 ? 'block' : 'none'};" class="surcharge-preview">
                        Example: ₱100 subtotal + ₱${surcharge.toFixed(2)} surcharge (${surcharge}%) = <strong>₱${(100 + surcharge).toFixed(2)} total</strong>
                    </div>
                    <div class="sync-badge amber">Changes saved locally & tracked in alerts</div>
                    <div class="info-box">
                        <div class="info-box-content">
                            <span class="info-icon">💡</span>
                            <div class="info-text">
                                <strong>How Debt Surcharge Works</strong>
                                <p>
                                    When a new debt is recorded, this percentage is added on top of the product subtotal.
                                    The debtor card shows a full breakdown: Subtotal → Surcharge → Total.<br><br>
                                    Set to <strong>0</strong> to disable surcharges entirely.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <div class="settings-footer">
            <button class="btn-save-modern" onclick="saveAllSettings()">💾 Save Settings</button>
        </div>
    `;

    // Dark mode toggle
    document.getElementById('darkThemeSwitch').onchange = function() {
        window.toggleDarkMode();
    };

    // Margin & low-stock clamping
    const marginInput   = document.getElementById('marginInput');
    const lowStockInput = document.getElementById('lowStockInput');

    if (marginInput) {
        marginInput.addEventListener('input', function() {
            if (this.value < 0)   this.value = 0;
            if (this.value > 100) this.value = 100;
        });
    }

    if (lowStockInput) {
        lowStockInput.addEventListener('input', function() {
            if (this.value < 1)   this.value = 1;
            if (this.value > 100) this.value = 100;
        });
    }

    // Live surcharge preview
    const surchargeInput = document.getElementById('debtSurchargeInput');
    const preview        = document.getElementById('surchargePreview');

    if (surchargeInput) {
        surchargeInput.addEventListener('input', function() {
            let pct = parseFloat(this.value) || 0;
            if (pct < 0)   { this.value = 0;   pct = 0; }
            if (pct > 100) { this.value = 100;  pct = 100; }

            if (pct > 0) {
                preview.style.display = 'block';
                preview.innerHTML = `Example: ₱100 subtotal + ₱<span id="surchargeAmt">${pct.toFixed(2)}</span> surcharge (${pct}%) = <strong>₱<span id="surchargeTotal">${(100 + pct).toFixed(2)}</span> total</strong>`;
            } else {
                preview.style.display = 'none';
            }
        });
    }
};

window.saveAllSettings = async function() {
    const marginValue    = parseFloat(document.getElementById('marginInput').value);
    const lowStockValue  = parseInt(document.getElementById('lowStockInput').value);
    const surchargeValue = parseFloat(
        parseFloat(document.getElementById('debtSurchargeInput').value || 0).toFixed(2)
    );

    // ── Validation ──────────────────────────────────────────────────────────
    if (isNaN(marginValue) || marginValue < 0 || marginValue > 100) {
        if (window.DialogSystem) {
            await DialogSystem.alert('Profit margin must be between 0% and 100%!', '⚠️');
        } else {
            alert('⚠️ Profit margin must be between 0% and 100%!');
        }
        return;
    }

    if (isNaN(lowStockValue) || lowStockValue < 1 || lowStockValue > 100) {
        if (window.DialogSystem) {
            await DialogSystem.alert('Low stock alert must be between 1 and 100!', '⚠️');
        } else {
            alert('⚠️ Low stock alert must be between 1 and 100!');
        }
        return;
    }

    if (isNaN(surchargeValue) || surchargeValue < 0 || surchargeValue > 100) {
        if (window.DialogSystem) {
            await DialogSystem.alert('Debt surcharge must be between 0% and 100%!', '⚠️');
        } else {
            alert('⚠️ Debt surcharge must be between 0% and 100%!');
        }
        return;
    }

    // ── Detect changes ───────────────────────────────────────────────────────
    const oldMargin    = parseFloat(window.storeSettings?.profitMargin  ?? 0);
    const oldLowStock  = parseInt(window.storeSettings?.lowStockLimit   ?? 0);
    const oldSurcharge = parseFloat(window.storeSettings?.debtSurcharge ?? 0) || 0;

    const changes = {};
    if (oldMargin    !== marginValue)    changes.profitMargin  = marginValue;
    if (oldLowStock  !== lowStockValue)  changes.lowStockLimit = lowStockValue;
    if (oldSurcharge !== surchargeValue) changes.debtSurcharge = surchargeValue;

    console.log('📊 Settings change detection:', {
        old: { margin: oldMargin, lowStock: oldLowStock, surcharge: oldSurcharge },
        new: { margin: marginValue, lowStock: lowStockValue, surcharge: surchargeValue },
        changes
    });

    // ── Build updated history ────────────────────────────────────────────────
    let updatedHistory = Array.isArray(window.storeSettings?.changeHistory)
        ? [...window.storeSettings.changeHistory]
        : [];

    if (Object.keys(changes).length > 0) {
        updatedHistory.push({
            id:        Date.now().toString(),
            timestamp: new Date().toISOString(),
            changes
        });
        if (updatedHistory.length > 10) updatedHistory = updatedHistory.slice(-10);
    }

    const updatedData = {
        profitMargin:  marginValue,
        lowStockLimit: lowStockValue,
        theme:         document.body.classList.contains('dark-mode') ? 'dark' : 'light',
        debtSurcharge: surchargeValue,
        changeHistory: updatedHistory
    };

    try {
        // ✅ FIXED: Use offline database instead of API
        await DB.saveSettings(updatedData);

        window.storeSettings = updatedData;
        applyThemeFromSettings();

        if (Object.keys(changes).length > 0 && window.NotificationSystem) {
            const latestRecord = window.storeSettings.changeHistory[
                window.storeSettings.changeHistory.length - 1
            ];
            window.NotificationSystem.onSettingsSaved(latestRecord);
            console.log('🔔 NotificationSystem updated with new change record');
        }

        const changesText = Object.keys(changes).length > 0
            ? `<br><br><strong>What changed:</strong><br>${Object.entries(changes).map(([key, value]) => {
                const name      = key === 'profitMargin'  ? 'Profit Margin'
                                : key === 'lowStockLimit' ? 'Low Stock Alert'
                                : 'Debt Surcharge';
                const formatted = key === 'lowStockLimit' ? `${value} units` : `${value}%`;
                return `• ${name}: ${formatted}`;
            }).join('<br>')}`
            : '';

        showSuccessDialog(
            `Settings saved successfully!${changesText}<br><br>
            <small style="color:#9ca3af;">${
                Object.keys(changes).length > 0
                    ? '💾 Saved to device storage — visible across all sessions.'
                    : 'Theme saved (not tracked in notifications).'
            }</small>`,
            '✅'
        );

        console.log('✅ Settings saved:', window.storeSettings);

    } catch (error) {
        console.error("Failed to save settings:", error);
        if (window.DialogSystem) {
            await DialogSystem.alert('Failed to save settings: ' + error.message, '❌');
        } else {
            alert('❌ Failed to save settings: ' + error.message);
        }
    }
};

window.applyThemeFromSettings = function() {
    if (!window.storeSettings) return;
    // ...existing code...
};

initSettings();