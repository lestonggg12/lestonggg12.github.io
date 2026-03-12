/**
 * settings.js — Enhanced with File System Access API Integration
 */

window.storeSettings = null;

async function initSettings() {
    try {
        let data = await DB.getSettings();

        if (!data) {
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

// ═══════════════════════════════════════════════════════════════════════════
// FILE SYSTEM OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

async function exportAppBackup() {
    try {
        const btn = document.getElementById('btnExportBackup');
        if (btn) btn.disabled = true;

        const jsonData = await window.FileSystem.exportAppData();
        const timestamp = new Date().toISOString().split('T')[0];
        const result = await window.FileSystem.saveFile(
            jsonData,
            `jorams-backup-${timestamp}.json`
        );

        if (result) {
            showSuccessDialog(
                `✅ Backup exported successfully!<br><br>
                <strong>File:</strong> ${result.name}<br>
                <strong>Size:</strong> ${(result.written / 1024).toFixed(2)} KB<br><br>
                <small>This backup includes all your settings, inventory, sales, and debtor records.</small>`,
                '💾'
            );
        }
    } catch (err) {
        console.error('Export error:', err);
        if (window.DialogSystem) {
            await DialogSystem.alert(`Failed to export backup: ${err.message}`, '❌');
        } else {
            alert(`❌ Failed to export backup: ${err.message}`);
        }
    } finally {
        const btn = document.getElementById('btnExportBackup');
        if (btn) btn.disabled = false;
    }
}

async function importAppBackup() {
    try {
        const btn = document.getElementById('btnImportBackup');
        if (btn) btn.disabled = true;

        const result = await window.FileSystem.openFile();
        if (!result) {
            if (btn) btn.disabled = false;
            return;
        }

        try {
            JSON.parse(result.content);
        } catch {
            if (window.DialogSystem) {
                await DialogSystem.alert('Invalid JSON file. Please select a valid backup file.', '⚠️');
            } else {
                alert('⚠️ Invalid JSON file.');
            }
            if (btn) btn.disabled = false;
            return;
        }

        const confirm = window.confirm(
            `Import backup from: ${result.name}?\n\n` +
            'This will merge settings and data. Existing products with the same ID will be skipped.\n\n' +
            'Continue?'
        );

        if (!confirm) {
            if (btn) btn.disabled = false;
            return;
        }

        const importResult = await window.FileSystem.importAppData(result.content);

        let message = `✅ Import successful!<br><br>
            <strong>File:</strong> ${result.name}<br>
            <strong>Imported:</strong> ${importResult.imported} records<br>
            <strong>Skipped:</strong> ${importResult.skipped} (duplicates)<br>`;

        if (importResult.errors.length > 0) {
            message += `<strong>Errors:</strong> ${importResult.errors.length}<br>
                <small>${importResult.errors.slice(0, 3).join('<br>')}</small>`;
        }

        showSuccessDialog(message, '📥');

        setTimeout(() => {
            if (typeof renderSettings === 'function') renderSettings();
        }, 2500);

    } catch (err) {
        console.error('Import error:', err);
        if (window.DialogSystem) {
            await DialogSystem.alert(`Failed to import backup: ${err.message}`, '❌');
        } else {
            alert(`❌ Failed to import backup: ${err.message}`);
        }
    } finally {
        const btn = document.getElementById('btnImportBackup');
        if (btn) btn.disabled = false;
    }
}

async function exportInventoryCSV() {
    try {
        const btn = document.getElementById('btnExportInventory');
        if (btn) btn.disabled = true;

        const csvData = await window.FileSystem.exportInventoryCSV();
        const timestamp = new Date().toISOString().split('T')[0];
        const result = await window.FileSystem.saveFile(
            csvData,
            `inventory-${timestamp}.csv`
        );

        if (result) {
            showSuccessDialog(
                `Inventory exported as CSV!<br><br>
                <strong>File:</strong> ${result.name}<br>
                <strong>Size:</strong> ${(result.written / 1024).toFixed(2)} KB`,
                '📊'
            );
        }
    } catch (err) {
        console.error('CSV export error:', err);
        if (window.DialogSystem) {
            await DialogSystem.alert(`Failed to export CSV: ${err.message}`, '❌');
        } else {
            alert(`❌ Failed to export CSV: ${err.message}`);
        }
    } finally {
        const btn = document.getElementById('btnExportInventory');
        if (btn) btn.disabled = false;
    }
}

async function exportSalesCSV() {
    try {
        const btn = document.getElementById('btnExportSales');
        if (btn) btn.disabled = true;

        const csvData = await window.FileSystem.exportSalesCSV();
        const timestamp = new Date().toISOString().split('T')[0];
        const result = await window.FileSystem.saveFile(
            csvData,
            `sales-${timestamp}.csv`
        );

        if (result) {
            showSuccessDialog(
                `Sales exported as CSV!<br><br>
                <strong>File:</strong> ${result.name}<br>
                <strong>Size:</strong> ${(result.written / 1024).toFixed(2)} KB`,
                '📈'
            );
        }
    } catch (err) {
        console.error('CSV export error:', err);
        if (window.DialogSystem) {
            await DialogSystem.alert(`Failed to export CSV: ${err.message}`, '❌');
        } else {
            alert(`❌ Failed to export CSV: ${err.message}`);
        }
    } finally {
        const btn = document.getElementById('btnExportSales');
        if (btn) btn.disabled = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS RENDER
// ═══════════════════════════════════════════════════════════════════════════

window.renderSettings = async function() {
    const container = document.getElementById('settingsContent');
    if (!container) return;

    if (!window.storeSettings) await initSettings();

    const isDark    = document.body.classList.contains('dark-mode');
    const surcharge = parseFloat(window.storeSettings.debtSurcharge || 0);
    const fsSupport = window.FileSystem?.isSupported ? '✅ Supported' : '⚠️ Using Fallback';

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
            .stylish-card.file-ops-card::before {
                background: linear-gradient(90deg, #3B82F6 0%, #06B6D4 50%, #10B981 100%);
            }
            .stylish-card.device-storage-card::before {
                background: linear-gradient(90deg, #87B382 0%, #5d9458 50%, #3e5235 100%);
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

            .label-text { font-weight:700; color:#5D534A; font-size:14px; text-transform:uppercase; letter-spacing:0.5px; }

            .stylish-input {
                width:120px; padding:12px 16px;
                border:2px solid rgba(93,83,74,0.2); border-radius:10px;
                font-size:16px; font-weight:700; color:#5D534A;
                text-align:center; transition:all 0.3s ease; background:white;
            }
            .stylish-input:focus { outline:none; border-color:#cbdfbd; box-shadow:0 0 0 4px rgba(203,223,189,0.2); transform:scale(1.05); }
            .stylish-input:hover { border-color:#cbdfbd; }

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

            .file-ops-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-top: 24px;
            }

            .file-op-btn {
                padding: 14px 18px;
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                color: white;
                border: none;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(16,185,129,0.3);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .file-op-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(16,185,129,0.4); background: linear-gradient(135deg, #059669 0%, #047857 100%); }
            .file-op-btn:active { transform: translateY(-1px); }
            .file-op-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            .file-op-btn.export { background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%); box-shadow: 0 4px 15px rgba(59,130,246,0.3); }
            .file-op-btn.export:hover { background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); box-shadow: 0 8px 20px rgba(59,130,246,0.4); }
            .file-op-btn.import { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); box-shadow: 0 4px 15px rgba(245,158,11,0.3); }
            .file-op-btn.import:hover { background: linear-gradient(135deg, #D97706 0%, #B45309 100%); box-shadow: 0 8px 20px rgba(245,158,11,0.4); }

            .sync-badge {
                display: inline-flex; align-items: center; gap: 8px;
                background: linear-gradient(135deg,rgba(203,223,189,0.2),rgba(168,201,156,0.15));
                padding: 8px 16px; border-radius: 20px; font-size: 13px;
                font-weight: 700; color: #3e5235;
                border: 1px solid rgba(203,223,189,0.4); margin-top: 10px;
            }

            .info-box { background:linear-gradient(135deg,rgba(203,223,189,0.15),rgba(203,223,189,0.08)); border-left:4px solid #cbdfbd; padding:20px; margin-top:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.05); }
            .info-box-content { display:flex; align-items:flex-start; gap:12px; }
            .info-icon { font-size:32px; flex-shrink:0; }
            .info-text { flex:1; }
            .info-text strong { color:#5D534A; font-size:16px; display:block; margin-bottom:5px; }
            .info-text p { color:#9E9382; margin:0; font-size:14px; line-height:1.6; }

            .surcharge-preview {
                margin-top:14px; padding:12px 16px;
                background:rgba(245,158,11,0.08);
                border:1px solid rgba(245,158,11,0.25);
                border-radius:10px; font-size:13px; color:#92400E; line-height:1.7;
            }

            .settings-footer { text-align:center; margin-top:40px; padding:20px; }

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

            body.dark-mode .stylish-card {
                background: linear-gradient(135deg, rgba(40,52,45,0.75) 0%, rgba(30,42,35,0.60) 50%, rgba(22,32,26,0.55) 100%) !important;
                border: 1px solid rgba(203,223,189,0.18) !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.20), inset 0 1.5px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.20) !important;
            }
            body.dark-mode .card-body h3 { color:#f9fafb; }
            body.dark-mode .card-body > p { color:#9ca3af; }
            body.dark-mode .label-text { color:#d1d5db; }
            body.dark-mode .stylish-input { background:rgba(255,255,255,0.1); color:#f9fafb; border-color:rgba(203,223,189,0.3); }
            body.dark-mode .control-group { background:rgba(203,223,189,0.05); border-color:rgba(203,223,189,0.15); }
            body.dark-mode .info-box { background:rgba(203,223,189,0.1); }
            body.dark-mode .info-text strong { color:#f9fafb; }
            body.dark-mode .info-text p { color:#9ca3af; }
            body.dark-mode .sync-badge { background:rgba(203,223,189,0.15); border-color:rgba(203,223,189,0.3); color:#cbdfbd; }

            @media (max-width: 768px) {
                .settings-grid-container { grid-template-columns:1fr; padding:15px; }
                .stylish-card { padding:25px; }
                .control-group { flex-direction:column; gap:15px; text-align:center; }
                .stylish-input { width:100%; }
                .file-ops-grid { grid-template-columns: 1fr; }
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
                    <div class="sync-badge">Saved to this device</div>
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
                    <div class="sync-badge">Changes tracked in notifications</div>
                </div>
            </div>

            <!-- ── Debtors card ── -->
            <div class="stylish-card">
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
                    <div class="sync-badge">Changes tracked in notifications</div>
                </div>
            </div>

            <!-- ── Data Backup card ── -->
            <div class="stylish-card file-ops-card">
                <div class="card-icon">💾</div>
                <div class="card-body">
                    <h3>Data Backup</h3>
                    <p>Export &amp; import all app data</p>
                    <div style="font-size: 12px; color: #9E9382; margin-bottom: 18px;">
                        <strong>${fsSupport}</strong> • Full device file access
                    </div>
                    <div class="file-ops-grid">
                        <button class="file-op-btn export" id="btnExportBackup" onclick="exportAppBackup()">📥 Full Backup</button>
                        <button class="file-op-btn import" id="btnImportBackup" onclick="importAppBackup()">📤 Restore</button>
                        <button class="file-op-btn export" id="btnExportInventory" onclick="exportInventoryCSV()">📊 Inventory</button>
                        <button class="file-op-btn export" id="btnExportSales" onclick="exportSalesCSV()">📈 Sales</button>
                    </div>
                    <div class="info-box" style="margin-top: 20px;">
                        <div class="info-box-content">
                            <span class="info-icon">💡</span>
                            <div class="info-text">
                                <strong>How to use</strong>
                                <p>
                                    <strong>Full Backup:</strong> Creates a complete JSON backup of everything (settings, inventory, sales, debtors). Use to restore after device reset.<br><br>
                                    <strong>CSV Exports:</strong> Export inventory or sales as CSV for use in Excel/Sheets.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── Device Storage card ── -->
            <div class="stylish-card device-storage-card">
                <div class="card-icon">📁</div>
                <div class="card-body">
                    <h3>Device Storage</h3>
                    <p>Save data directly to your device</p>
                    <div style="margin-bottom:16px; padding:14px; background:rgba(203,223,189,0.12); border-radius:12px; border:1px solid rgba(203,223,189,0.3); font-size:13px; color:#5D534A;">
                       <!-- ── Device Storage card ── -->
<div class="stylish-card device-storage-card">
    <div class="card-icon">📁</div>
    <div class="card-body">
        <h3>Device Storage</h3>
        <p>Save data directly to your device</p>
        <div style="margin-bottom:16px; padding:14px; background:rgba(203,223,189,0.12); border-radius:12px; border:1px solid rgba(203,223,189,0.3); font-size:13px; color:#5D534A;">
            ${!window.DB?.isSupported
              ? `ℹ️ <strong>Not available on iOS/Firefox</strong><br><small style="color:#9E9382;">Use the Data Backup card above to export and restore your data instead.</small>`
              : window.DB?.dirHandle
                ? `✅ <strong>Connected:</strong> ${window.DB.dirHandle.name}<br><small style="color:#9E9382;">All data saves to your device folder.</small>`
                : `⚠️ <strong>Using browser storage</strong><br><small style="color:#9E9382;">Limited space. Choose a folder to upgrade.</small>`}
        </div>
        ${window.DB?.isSupported ? `
        <button onclick="handleDeviceStorageBtn()" style="width:100%; padding:14px; background:linear-gradient(135deg,#87B382,#5d9458); color:white; border:none; border-radius:12px; font-size:15px; font-weight:800; cursor:pointer; box-shadow:0 4px 15px rgba(93,148,88,0.3); transition:all 0.3s ease;">
            📂 ${window.DB?.dirHandle ? 'Change Folder' : 'Connect Device Storage'}
        </button>` : `
        <div style="padding:12px 16px; background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.2); border-radius:12px; font-size:13px; color:#1e40af; text-align:center;">
            💡 To protect your data on iOS, use <strong>Full Backup</strong> in the Data Backup card to save a copy to your Files app regularly.
        </div>`}
        <div class="info-box" style="margin-top:16px;">
            <div class="info-box-content">
                <span class="info-icon">💡</span>
                <div class="info-text">
                    <strong>Why use device storage?</strong>
                    <p>Unlimited space, faster saves, and data survives browser cache clears.</p>
                </div>
            </div>
        </div>
    </div>
</div>
                    </div>
                    <button onclick="handleDeviceStorageBtn()" style="width:100%; padding:14px; background:linear-gradient(135deg,#87B382,#5d9458); color:white; border:none; border-radius:12px; font-size:15px; font-weight:800; cursor:pointer; box-shadow:0 4px 15px rgba(93,148,88,0.3); transition:all 0.3s ease;">
                        📂 ${window.DB?.dirHandle ? 'Change Folder' : 'Connect Device Storage'}
                    </button>
                    <div class="info-box" style="margin-top:16px;">
                        <div class="info-box-content">
                            <span class="info-icon">💡</span>
                            <div class="info-text">
                                <strong>Why use device storage?</strong>
                                <p>Unlimited space, faster saves, and data survives browser cache clears.</p>
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

    if (isNaN(marginValue) || marginValue < 0 || marginValue > 100) {
        alert('⚠️ Profit margin must be between 0% and 100%!');
        return;
    }

    if (isNaN(lowStockValue) || lowStockValue < 1 || lowStockValue > 100) {
        alert('⚠️ Low stock alert must be between 1 and 100!');
        return;
    }

    if (isNaN(surchargeValue) || surchargeValue < 0 || surchargeValue > 100) {
        alert('⚠️ Debt surcharge must be between 0% and 100%!');
        return;
    }

    const oldMargin    = parseFloat(window.storeSettings?.profitMargin  ?? 0);
    const oldLowStock  = parseInt(window.storeSettings?.lowStockLimit   ?? 0);
    const oldSurcharge = parseFloat(window.storeSettings?.debtSurcharge ?? 0) || 0;

    const changes = {};
    if (oldMargin    !== marginValue)    changes.profitMargin  = marginValue;
    if (oldLowStock  !== lowStockValue)  changes.lowStockLimit = lowStockValue;
    if (oldSurcharge !== surchargeValue) changes.debtSurcharge = surchargeValue;

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
        await DB.saveSettings(updatedData);
        window.storeSettings = updatedData;
        applyThemeFromSettings();

        if (Object.keys(changes).length > 0 && window.NotificationSystem) {
            const latestRecord = window.storeSettings.changeHistory[
                window.storeSettings.changeHistory.length - 1
            ];
            window.NotificationSystem.onSettingsSaved(latestRecord);
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
            `Settings saved successfully!${changesText}`,
            '✅'
        );

        console.log('✅ Settings saved:', window.storeSettings);

    } catch (error) {
        console.error("Failed to save settings:", error);
        alert('❌ Failed to save settings: ' + error.message);
    }
};

window.handleDeviceStorageBtn = async function () {
    const granted = await window.DB.requestDirectoryAccess();
    if (granted) {
        await window.renderSettings();
        showSuccessDialog(
            `Device storage connected!<br><br><strong>Folder:</strong> ${window.DB.dirHandle.name}<br><br><small>Your existing data has been copied to the device folder.</small>`,
            '📁'
        );
        var badge = document.querySelector('.offline-badge');
        if (badge) {
            badge.textContent = '✓ Device Storage: ' + window.DB.dirHandle.name;
            badge.style.background = 'linear-gradient(135deg,#15803d,#166534)';
        }
    }
};

window.applyThemeFromSettings = applyThemeFromSettings;

initSettings();