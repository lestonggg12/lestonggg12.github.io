/**
 * page-backgrounds.js
 * Applies the same glassmorphic animated blob background AND styled
 * dark-green header banner to all pages (Calendar, Prices, Inventory,
 * Debtors, Settings) — matching the Sales Performance page exactly.
 *
 * Place in:  static/js/page-backgrounds.js
 * Already wired in dashboard.html — no other changes needed.
 */

(function injectPageBackgrounds() {
  if (document.getElementById('page-backgrounds-styles')) return;

  // ─── CSS ──────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.id = 'page-backgrounds-styles';
  style.textContent = `

    /* ══════════════════════════════════════════════════
       ALL PAGES — gradient blob background
    ══════════════════════════════════════════════════ */
    .page-bg-applied {
      position: relative;
      overflow: clip;
      background: linear-gradient(145deg, #dff0da 0%, #eaf5e8 40%, #f0f8ee 70%, #e4f0e0 100%) !important;
    }
    body.dark-mode .page-bg-applied {
      background: linear-gradient(145deg, #0d1f0d 0%, #0f2310 40%, #0a1a0a 70%, #111e10 100%) !important;
    }

    /* Content sits above blobs */
 .page-bg-applied > *:not(.page-bg-blob):not([class*="profit-blob"]) {
  position: relative;
  z-index: 1;
}

    /* ══════════════════════════════════════════════════
       MAIN PAGE HEADER BANNER
       Matches the dark-green banner on Sales Performance
    ══════════════════════════════════════════════════ */
    .main-page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 24px 0;
      padding: 22px 28px;
      border-radius: 18px;
      font-size: 1.55rem;
      font-weight: 900;
      letter-spacing: -0.3px;
      background: linear-gradient(135deg, rgba(55,85,50,0.84) 0%, rgba(36,62,32,0.90) 100%);
      color: #e8f5e4;
      border: 1.5px solid rgba(135,179,130,0.30);
      box-shadow:
        0 8px 32px rgba(20,50,18,0.20),
        0 2px 8px  rgba(20,50,18,0.12),
        inset 0 1px 0 rgba(255,255,255,0.10);
      backdrop-filter: blur(14px) saturate(1.4);
      -webkit-backdrop-filter: blur(14px) saturate(1.4);
      text-shadow: 0 1px 4px rgba(0,0,0,0.22);
    }

    body.dark-mode .main-page-header {
      background: linear-gradient(135deg, rgba(24,44,22,0.92) 0%, rgba(14,28,12,0.96) 100%);
      color: #c8ecc4;
      border-color: rgba(93,148,86,0.22);
      box-shadow:
        0 8px 32px rgba(0,0,0,0.48),
        0 2px 8px  rgba(0,0,0,0.28),
        inset 0 1px 0 rgba(255,255,255,0.05);
    }

    /* ══════════════════════════════════════════════════
       ANIMATED BLOBS
    ══════════════════════════════════════════════════ */
    .page-bg-blob {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      z-index: 0;
      will-change: transform;
    }

    /* Light mode blob colours */
    .page-bg-blob-1 {
      width: 520px; height: 520px;
      top: -120px; left: -140px;
      background: radial-gradient(circle, rgba(135,179,130,0.45) 0%, rgba(93,148,86,0.22) 55%, transparent 80%);
      filter: blur(80px);
      animation: bg-blob-a 18s ease-in-out infinite alternate;
    }
    .page-bg-blob-2 {
      width: 480px; height: 480px;
      bottom: 0; right: -100px;
      background: radial-gradient(circle, rgba(245,222,130,0.36) 0%, rgba(200,165,60,0.18) 55%, transparent 80%);
      filter: blur(80px);
      animation: bg-blob-b 22s ease-in-out infinite alternate;
    }
    .page-bg-blob-3 {
      width: 360px; height: 360px;
      top: 35%; left: 48%;
      background: radial-gradient(circle, rgba(152,214,148,0.30) 0%, transparent 70%);
      filter: blur(90px);
      animation: bg-blob-c 25s ease-in-out infinite alternate;
    }
    .page-bg-blob-4 {
      width: 280px; height: 280px;
      top: 8%; right: 18%;
      background: radial-gradient(circle, rgba(100,190,170,0.26) 0%, transparent 70%);
      filter: blur(90px);
      animation: bg-blob-d 20s ease-in-out infinite alternate;
    }
    .page-bg-blob-5 {
      width: 220px; height: 220px;
      bottom: 22%; left: 12%;
      background: radial-gradient(circle, rgba(220,200,120,0.26) 0%, transparent 70%);
      filter: blur(90px);
      animation: bg-blob-a 28s ease-in-out infinite alternate-reverse;
    }

    /* Dark mode blob colours */
    body.dark-mode .page-bg-blob-1 {
      background: radial-gradient(circle, rgba(55,110,50,0.52) 0%, rgba(35,75,32,0.28) 55%, transparent 80%);
    }
    body.dark-mode .page-bg-blob-2 {
      background: radial-gradient(circle, rgba(120,90,10,0.40) 0%, rgba(80,60,5,0.20) 55%, transparent 80%);
    }
    body.dark-mode .page-bg-blob-3 {
      background: radial-gradient(circle, rgba(40,100,38,0.36) 0%, transparent 70%);
    }
    body.dark-mode .page-bg-blob-4 {
      background: radial-gradient(circle, rgba(20,90,80,0.28) 0%, transparent 70%);
    }
    body.dark-mode .page-bg-blob-5 {
      background: radial-gradient(circle, rgba(100,75,10,0.30) 0%, transparent 70%);
    }

    /* Keyframes */
    @keyframes bg-blob-a {
      0%   { transform: translate(0,0)      scale(1);    }
      33%  { transform: translate(30px,-40px)  scale(1.06); }
      66%  { transform: translate(-20px,25px)  scale(0.96); }
      100% { transform: translate(15px,-15px)  scale(1.03); }
    }
    @keyframes bg-blob-b {
      0%   { transform: translate(0,0)       scale(1);    }
      33%  { transform: translate(-35px,30px)  scale(1.08); }
      66%  { transform: translate(20px,-20px)  scale(0.94); }
      100% { transform: translate(-10px,18px)  scale(1.04); }
    }
    @keyframes bg-blob-c {
      0%   { transform: translate(0,0)       scale(1);    }
      50%  { transform: translate(-40px,-30px) scale(1.10); }
      100% { transform: translate(25px,20px)   scale(0.95); }
    }
    @keyframes bg-blob-d {
      0%   { transform: translate(0,0)       scale(1);    }
      50%  { transform: translate(30px,35px)   scale(1.07); }
      100% { transform: translate(-15px,-25px) scale(0.97); }
    }
  `;
  document.head.appendChild(style);

  // ─── Target pages (IDs from dashboard.html) ───────────────────────────────
  const TARGET_PAGES = [
    'profitPage',
    'calendarPage',
    'pricePage',
    'inventoryPage',
    'debtPage',
    'settingsPage',
  ];

  // ─── Inject blobs into one page element ───────────────────────────────────
  function applyToPage(el) {
    if (el.dataset.bgApplied) return;
    el.dataset.bgApplied = '1';
    el.classList.add('page-bg-applied');
    for (let i = 1; i <= 5; i++) {
      const blob = document.createElement('div');
      blob.className = `page-bg-blob page-bg-blob-${i}`;
      el.insertBefore(blob, el.firstChild);
    }
  }

  function applyToExisting() {
    TARGET_PAGES.forEach(id => {
      const el = document.getElementById(id);
      if (el) applyToPage(el);
    });
  }

  // ─── Watch for dynamically shown pages (SPA tab switching) ────────────────
  const observer = new MutationObserver(() => {
    TARGET_PAGES.forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.bgApplied) applyToPage(el);
    });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      applyToExisting();
      observer.observe(document.body, { childList: true, subtree: true });
    });
  } else {
    applyToExisting();
    observer.observe(document.body, { childList: true, subtree: true });
  }

})();