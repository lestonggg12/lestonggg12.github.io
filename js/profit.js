console.log('💰 Loading profit module (GLASS-NEO VERSION)...');

// ─── Inject styles ────────────────────────────────────────────────────────────
(function injectProfitStyles() {
  if (document.getElementById('profit-neo-styles')) return;
  const s = document.createElement('style');
  s.id = 'profit-neo-styles';
  s.textContent = `

    /* ════════════════════════════════════════════════════
       PROFIT PAGE CSS VARIABLES
    ════════════════════════════════════════════════════ */
    #profitContent {
      --ptext:   #1e2d1e;
      --pbody:   #3a4a3a;
      --pmuted:  #7a9070;
      --pprofit: #059669;

      --neo-float:
        0 8px 32px rgba(80,140,75,0.22),
        0 2px 8px  rgba(80,140,75,0.12),
        0 -2px 0   rgba(255,255,255,0.9) inset,
        0 1px 0    rgba(80,140,75,0.15)  inset;

      --neo-float-gold:
        0 8px 32px rgba(180,150,30,0.25),
        0 2px 8px  rgba(180,150,30,0.12),
        0 -2px 0   rgba(255,255,255,0.85) inset,
        0 1px 0    rgba(180,150,30,0.15)  inset;

      --neo-float-hover:
        0 18px 50px rgba(80,140,75,0.3),
        0 4px 16px  rgba(80,140,75,0.18),
        0 -2px 0    rgba(255,255,255,0.95) inset;

      --btn-neo:
        5px 5px 14px rgba(80,140,75,0.22),
       -5px -5px 14px rgba(255,255,255,0.85);

      --btn-neo-inset:
        inset 4px 4px 10px rgba(80,140,75,0.18),
        inset -4px -4px 10px rgba(255,255,255,0.7);
    }

    /* ════════════════════════════════════════════════════
       GLASSMORPHISM PAGE BACKGROUND
    ════════════════════════════════════════════════════ */
    #profitPage {
      position: relative;
      background: linear-gradient(145deg, #dff0da 0%, #eaf5e8 40%, #f0f8ee 70%, #e4f0e0 100%);
    }
    #profitPage::before {
      content: '';
      position: fixed;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
      width: 520px; height: 520px;
      top: -120px; left: -140px;
      background: radial-gradient(circle, rgba(135,179,130,0.48) 0%, rgba(93,148,86,0.26) 55%, transparent 80%);
      animation: profit-blob-a 18s ease-in-out infinite alternate;
    }
    #profitPage::after {
      content: '';
      position: fixed;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
      width: 480px; height: 480px;
      bottom: -80px; right: -100px;
      background: radial-gradient(circle, rgba(245,222,130,0.42) 0%, rgba(200,165,60,0.22) 55%, transparent 80%);
      animation: profit-blob-b 22s ease-in-out infinite alternate;
    }
    .profit-blob {
      position: fixed; border-radius: 50%;
      filter: blur(90px); pointer-events: none; z-index: 0; will-change: transform;
    }
    .profit-blob-1 {
      width: 360px; height: 360px; top: 35%; left: 48%;
      background: radial-gradient(circle, rgba(152,214,148,0.36) 0%, transparent 70%);
      animation: profit-blob-c 25s ease-in-out infinite alternate;
    }
    .profit-blob-2 {
      width: 280px; height: 280px; top: 8%; right: 18%;
      background: radial-gradient(circle, rgba(100,190,170,0.3) 0%, transparent 70%);
      animation: profit-blob-d 20s ease-in-out infinite alternate;
    }
    .profit-blob-3 {
      width: 220px; height: 220px; bottom: 22%; left: 12%;
      background: radial-gradient(circle, rgba(220,200,120,0.32) 0%, transparent 70%);
      animation: profit-blob-a 28s ease-in-out infinite alternate-reverse;
    }
    #profitContent { position: relative; z-index: 1; }

    @keyframes profit-blob-a {
      0%   { transform: translate(0px,   0px)   scale(1);    }
      33%  { transform: translate(30px, -40px)  scale(1.06); }
      66%  { transform: translate(-20px, 25px)  scale(0.96); }
      100% { transform: translate(15px, -15px)  scale(1.03); }
    }
    @keyframes profit-blob-b {
      0%   { transform: translate(0px,   0px)    scale(1);    }
      33%  { transform: translate(-35px, 30px)   scale(1.08); }
      66%  { transform: translate(20px, -20px)   scale(0.94); }
      100% { transform: translate(-10px, 18px)   scale(1.04); }
    }
    @keyframes profit-blob-c {
      0%   { transform: translate(0px,   0px)    scale(1);    }
      50%  { transform: translate(-40px, -30px)  scale(1.10); }
      100% { transform: translate(25px,  20px)   scale(0.95); }
    }
    @keyframes profit-blob-d {
      0%   { transform: translate(0px,   0px)    scale(1);    }
      50%  { transform: translate(30px,  35px)   scale(1.07); }
      100% { transform: translate(-15px, -25px)  scale(0.97); }
    }

    /* ════════════════════════════════════════════════════
       DARK MODE — page background
    ════════════════════════════════════════════════════ */
    body.dark-mode #profitPage {
      background: linear-gradient(145deg, #0d1f0d 0%, #0f2310 40%, #0a1a0a 70%, #111e10 100%);
    }
    body.dark-mode #profitPage::before {
      background: radial-gradient(circle, rgba(55,110,50,0.52) 0%, rgba(35,75,32,0.3) 55%, transparent 80%);
    }
    body.dark-mode #profitPage::after {
      background: radial-gradient(circle, rgba(120,90,10,0.42) 0%, rgba(80,60,5,0.22) 55%, transparent 80%);
    }
    body.dark-mode .profit-blob-1 {
      background: radial-gradient(circle, rgba(40,100,38,0.38) 0%, transparent 70%);
    }
    body.dark-mode .profit-blob-2 {
      background: radial-gradient(circle, rgba(20,90,80,0.3) 0%, transparent 70%);
    }
    body.dark-mode .profit-blob-3 {
      background: radial-gradient(circle, rgba(100,75,10,0.32) 0%, transparent 70%);
    }

    /* ── Section title ── */
    #profitContent .p-section-title {
      font-size: 17px; font-weight: 800; color: var(--ptext);
      margin: 36px 0 20px; display: flex; align-items: center; gap: 10px;
    }
    #profitContent .p-section-title::before {
      content: ''; width: 4px; height: 22px;
      background: linear-gradient(180deg, #87B382, #5D9456);
      border-radius: 4px; flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(93,148,86,0.4);
    }
    #profitContent .p-page-sub {
      text-align: center; color: var(--pmuted);
      font-size: 13px; margin: -8px 0 32px;
    }

    /* ── Grid ── */
    #profitContent .p-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px; margin-bottom: 8px;
    }

    /* ════════════════════════════════════════════════════
       GLASS-NEO CARD
    ════════════════════════════════════════════════════ */
    #profitContent .p-card {
      border-radius: 22px; padding: 26px 24px;
      position: relative; overflow: hidden; cursor: default;
      transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
      backdrop-filter: blur(18px) saturate(1.6);
      -webkit-backdrop-filter: blur(18px) saturate(1.6);
      border: 1.5px solid rgba(255,255,255,0.55);
      box-shadow: var(--neo-float);
    }
    #profitContent .p-card::before {
      content: ''; position: absolute; inset: 0; border-radius: 22px;
      background: linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 40%, transparent 70%);
      pointer-events: none;
    }
    #profitContent .p-card::after {
      content: ''; position: absolute;
      top: 0; left: 20px; right: 20px; height: 2px;
      border-radius: 0 0 4px 4px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
    }
    #profitContent .p-card:hover {
      transform: translateY(-7px) scale(1.01);
      box-shadow: var(--neo-float-hover);
    }
    #profitContent .p-card:active { transform: translateY(-3px); }

    /* ── Color variants (light mode) ── */
    #profitContent .p-card.c-today    { background: linear-gradient(135deg,#b8e986,#a5d975); border-color:#9ad06e; }
    #profitContent .p-card.c-yesterday{ background: linear-gradient(135deg,#fce588,#f5d76e); border-color:#eece5a; }
    #profitContent .p-card.c-week     { background: linear-gradient(135deg,#a8e6cf,#8edbb5); border-color:#7dd3a8; }
    #profitContent .p-card.c-month    { background: linear-gradient(135deg,#a3d5f7,#82c4f0); border-color:#6bb8ea; }
    #profitContent .p-card.c-year     { background: linear-gradient(135deg,#d5b8f0,#c4a0e8); border-color:#b48ee0; }
    #profitContent .p-card.c-neutral  { background: linear-gradient(135deg,#f6e4d8,#f0d9cc); border-color:#e8d0c0; }
    #profitContent .p-card.c-gold     { background: linear-gradient(135deg,#f5e8d4,#efdcc0); border-color:#e8dcc8; box-shadow:var(--neo-float-gold); }
    #profitContent .p-card.c-gold:hover {
      box-shadow: 0 20px 54px rgba(180,150,30,0.35), 0 4px 16px rgba(180,150,30,0.2), 0 -2px 0 rgba(255,255,255,0.95) inset;
    }

    /* Light mode text per variant */
    #profitContent .p-card.c-today .p-card-eyebrow,
    #profitContent .p-card.c-today .p-card-section-label { color: #3a5a1a; }
    #profitContent .p-card.c-today .p-card-value         { color: #2d4a12; }
    #profitContent .p-card.c-yesterday .p-card-eyebrow,
    #profitContent .p-card.c-yesterday .p-card-section-label { color: #7a6420; }
    #profitContent .p-card.c-yesterday .p-card-value     { color: #6a5418; }
    #profitContent .p-card.c-week .p-card-eyebrow,
    #profitContent .p-card.c-week .p-card-section-label  { color: #2a6048; }
    #profitContent .p-card.c-week .p-card-value          { color: #1e4e38; }
    #profitContent .p-card.c-month .p-card-eyebrow,
    #profitContent .p-card.c-month .p-card-section-label { color: #1a5580; }
    #profitContent .p-card.c-month .p-card-value         { color: #144568; }
    #profitContent .p-card.c-year .p-card-eyebrow,
    #profitContent .p-card.c-year .p-card-section-label  { color: #5a3580; }
    #profitContent .p-card.c-year .p-card-value          { color: #482870; }
    #profitContent .p-card.c-neutral .p-card-eyebrow,
    #profitContent .p-card.c-neutral .p-card-section-label { color: #8a6a55; }
    #profitContent .p-card.c-neutral .p-card-value       { color: #6b5245; }
    #profitContent .p-card.c-gold .p-card-eyebrow,
    #profitContent .p-card.c-gold .p-card-section-label  { color: #8a7050; }
    #profitContent .p-card.c-gold .p-card-value          { color: #6a5840; }

    /* ── Card typography ── */
    #profitContent .p-card-eyebrow {
      font-size: 10px; font-weight: 800; letter-spacing: 1.6px;
      text-transform: uppercase; color: var(--pbody);
      margin-bottom: 16px; display: flex; align-items: center; gap: 6px; opacity: 0.75;
    }
    #profitContent .p-card-section-label {
      font-size: 10px; font-weight: 700; letter-spacing: 1.3px;
      text-transform: uppercase; color: var(--pbody);
      margin-bottom: 2px; opacity: 0.65; text-align: center;
    }
    #profitContent .p-card-value {
      font-size: 30px; font-weight: 900; color: var(--ptext);
      letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 4px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.08); text-align: center;
    }
    #profitContent .p-card-value.profit-color {
      color: #1a6b3c; text-shadow: 0 1px 3px rgba(26,107,60,0.15);
    }
    #profitContent .p-card-value.gold-color {
      color: #7a5500; text-shadow: 0 1px 3px rgba(122,85,0,0.15);
    }
    #profitContent .p-card-value.muted-val {
      font-size: 18px; color: var(--pmuted); font-weight: 700; text-shadow: none;
    }
    #profitContent .p-card-sub {
      font-size: 12px; color: var(--pmuted); margin-bottom: 14px; text-align: center;
    }
    #profitContent .p-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7) 30%, rgba(140,180,135,0.4) 60%, transparent);
      margin: 14px 0;
    }
    #profitContent .p-empty-msg {
      font-size: 15px; color: var(--pbody); text-align: center;
      padding: 16px 0 6px; font-weight: 700; opacity: 0.7;
    }

    /* ── Timing strip ── */
    #profitContent .p-timing {
      margin-top: 14px; padding: 10px 14px;
      background: rgba(255,255,255,0.35); border: 1px solid rgba(255,255,255,0.5);
      border-radius: 12px; backdrop-filter: blur(8px);
      font-size: 11px; color: var(--pbody); font-weight: 600; line-height: 1;
      display: flex; flex-direction: column; gap: 7px;
      width: 100%; box-sizing: border-box;
    }
    #profitContent .p-timing-row {
      display: flex; align-items: center; gap: 5px;
      flex-wrap: nowrap; white-space: nowrap;
    }

    /* ── Timer badge ── */
    #profitContent .p-timer-badge {
      display: flex; flex-direction: column; gap: 5px;
      margin-top: 14px; padding: 10px 14px; border-radius: 12px;
      font-size: 11px; font-weight: 700;
      background: rgba(255,255,255,0.45); border: 1px solid rgba(255,255,255,0.6);
      backdrop-filter: blur(8px); color: #5D9456;
      box-shadow: 0 2px 8px rgba(93,148,86,0.12);
      width: 100%; box-sizing: border-box;
    }
    #profitContent .p-timer-row {
      display: flex; align-items: center; gap: 6px;
      font-size: 11px; font-weight: 700; color: #5D9456;
    }
    #profitContent .p-timer-row strong { color: #3a7032; }

    /* ════════════════════════════════════════════════════
       RECENT SALES
    ════════════════════════════════════════════════════ */
    #profitContent .p-recent-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 18px; flex-wrap: wrap; gap: 12px;
    }
    #profitContent .p-recent-actions {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    #profitContent #btnToggleRecent {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 10px 20px; border: none;
      border-radius: 14px; font-size: 12px; font-weight: 700;
      cursor: pointer; color: var(--btn-green-text); letter-spacing: 0.3px;
      transition: all .25s ease;
      background: var(--btn-green-bg);
      box-shadow: var(--btn-green-shadow);
    }
    #profitContent #btnToggleRecent:hover {
      background: var(--btn-green-hover); box-shadow: var(--btn-green-shadow-hover); transform: translateY(-2px);
    }
    #profitContent .toggle-arrow {
      display: inline-block; transition: transform .35s cubic-bezier(.4,0,.2,1);
      font-size: 10px; margin-right: 6px;
    }
    #profitContent .btn-label { display: inline-block; }
    #profitContent #btnClearHistory {
      display: inline-flex; align-items: center; gap: 7px;
      padding: 10px 20px; border: none;
      border-radius: 14px; font-size: 12px; font-weight: 700;
      cursor: pointer; color: var(--btn-red-text); letter-spacing: 0.3px;
      transition: all .25s ease;
      background: var(--btn-red-bg);
      box-shadow: var(--btn-red-shadow);
    }
    #profitContent #btnClearHistory:hover {
      background: var(--btn-red-hover); box-shadow: var(--btn-red-shadow-hover);
      transform: translateY(-2px);
    }
    #recentSalesContainer {
      overflow: hidden;
      transition: max-height .5s cubic-bezier(.4,0,.2,1), opacity .4s ease;
      max-height: 99999px; opacity: 1;
    }
    #recentSalesContainer.rs-collapsed { max-height: 0 !important; opacity: 0; }

    /* ── Sale card ── */
    #profitContent .p-sale-card {
      border-radius: 18px; padding: 20px 18px;
      backdrop-filter: blur(16px) saturate(1.5);
      -webkit-backdrop-filter: blur(16px) saturate(1.5);
      background: rgba(210,235,207,0.5); border: 1.5px solid rgba(255,255,255,0.55);
      box-shadow: 0 6px 24px rgba(80,140,75,0.16), 0 2px 6px rgba(80,140,75,0.08), 0 -1px 0 rgba(255,255,255,0.8) inset;
      transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
      position: relative; overflow: hidden;
    }
    #profitContent .p-sale-card::before {
      content: ''; position: absolute; inset: 0; border-radius: 18px;
      background: linear-gradient(135deg, rgba(255,255,255,0.32) 0%, transparent 55%);
      pointer-events: none;
    }
    #profitContent .p-sale-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 14px 40px rgba(80,140,75,0.24), 0 4px 12px rgba(80,140,75,0.12), 0 -1px 0 rgba(255,255,255,0.9) inset;
    }
    #profitContent .p-sale-header {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;
    }
    #profitContent .p-sale-date   { font-size: 13px; font-weight: 700; color: var(--ptext); }
    #profitContent .p-sale-time   { font-size: 11px; color: var(--pmuted); margin-top: 2px; }
    #profitContent .p-sale-customer { font-size: 11px; color: var(--pmuted); margin-top: 4px; }
    #profitContent .p-sale-items-label {
      font-size: 10px; font-weight: 700; letter-spacing: 1.2px;
      text-transform: uppercase; color: var(--pmuted); margin-bottom: 4px; opacity: 0.7;
    }
    #profitContent .p-sale-items { font-size: 12px; color: var(--pbody); line-height: 1.6; margin-bottom: 12px; }
    #profitContent .p-sale-footer {
      display: flex; justify-content: space-between; align-items: flex-end;
      border-top: 1px solid rgba(255,255,255,0.55); padding-top: 10px;
    }
    #profitContent .p-sale-stat-label {
      font-size: 10px; font-weight: 700; letter-spacing: 1.1px;
      text-transform: uppercase; color: var(--pmuted); margin-bottom: 3px; opacity: 0.7;
    }
    #profitContent .p-sale-total  { font-size: 18px; font-weight: 900; color: var(--ptext); }
    #profitContent .p-sale-profit { font-size: 18px; font-weight: 900; color: #1a6b3c; text-align: right; }

    /* ── Payment badge contrast ── */
    #profitContent .p-sale-card .payment-badge {
      box-shadow: 0 3px 10px rgba(0,0,0,0.18), 0 1px 3px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.4);
    }
    #profitContent .p-sale-card .payment-badge.cash {
      background: linear-gradient(135deg,#3a7d35,#2d6128) !important;
      color: #fff !important; text-shadow: 0 1px 3px rgba(0,0,0,0.35);
      border-color: rgba(255,255,255,0.35) !important;
    }
    #profitContent .p-sale-card .payment-badge.gcash {
      background: linear-gradient(135deg,#1565c0,#0d47a1) !important;
      color: #fff !important; text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    #profitContent .p-sale-card .payment-badge.credit,
    #profitContent .p-sale-card .payment-badge.credit-paid {
      background: linear-gradient(135deg,#5c35b5,#3d1f8c) !important;
      color: #fff !important; text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    /* ── Empty state ── */
    #profitContent .p-empty-state {
      text-align: center; padding: 56px 24px; border-radius: 22px;
      backdrop-filter: blur(16px) saturate(1.4);
      background: rgba(210,235,207,0.45); border: 1.5px solid rgba(255,255,255,0.55);
      box-shadow: 0 6px 24px rgba(80,140,75,0.12);
    }
    #profitContent .p-empty-icon { font-size: 44px; margin-bottom: 12px; display: block; opacity: .5; }

    /* ════════════════════════════════════════════════════
       DARK MODE — variables
    ════════════════════════════════════════════════════ */
    body.dark-mode #profitContent {
      --ptext:  #d8ecd4;
      --pbody:  #a8c4a4;
      --pmuted: #6a8a66;
      --neo-float:
        0 8px 32px rgba(0,0,0,0.5),
        0 2px 8px  rgba(0,0,0,0.3),
        0 -1px 0   rgba(255,255,255,0.06) inset,
        0 1px 0    rgba(0,0,0,0.3) inset;
      --neo-float-gold:
        0 8px 32px rgba(0,0,0,0.5),
        0 2px 8px  rgba(140,100,0,0.3),
        0 -1px 0   rgba(255,255,255,0.06) inset;
      --neo-float-hover:
        0 16px 48px rgba(0,0,0,0.6),
        0 4px 16px  rgba(0,0,0,0.35),
        0 -1px 0    rgba(255,255,255,0.06) inset;
      --btn-neo:
        5px 5px 14px rgba(0,0,0,0.4),
       -5px -5px 14px rgba(60,80,55,0.2);
      --btn-neo-inset:
        inset 4px 4px 10px rgba(0,0,0,0.35),
        inset -4px -4px 10px rgba(60,80,55,0.15);
    }

    /* ── Dark card backgrounds — each card has a unique hue ── */
    body.dark-mode #profitContent .p-card.c-today {
      background: linear-gradient(135deg, rgba(30,70,20,0.90), rgba(25,58,18,0.92)) !important;
      border-color: rgba(120,200,90,0.28) !important;
    }
    body.dark-mode #profitContent .p-card.c-yesterday {
      background: linear-gradient(135deg, rgba(70,58,12,0.90), rgba(60,48,8,0.92)) !important;
      border-color: rgba(230,190,60,0.28) !important;
    }
    body.dark-mode #profitContent .p-card.c-week {
      background: linear-gradient(135deg, rgba(18,60,50,0.90), rgba(14,50,42,0.92)) !important;
      border-color: rgba(100,210,170,0.28) !important;
    }
    body.dark-mode #profitContent .p-card.c-month {
      background: linear-gradient(135deg, rgba(15,42,72,0.90), rgba(12,35,62,0.92)) !important;
      border-color: rgba(90,170,230,0.28) !important;
    }
    body.dark-mode #profitContent .p-card.c-year {
      background: linear-gradient(135deg, rgba(48,28,72,0.90), rgba(40,22,62,0.92)) !important;
      border-color: rgba(170,120,220,0.28) !important;
    }
    body.dark-mode #profitContent .p-card.c-neutral {
      background: linear-gradient(135deg, rgba(42,52,40,0.88), rgba(35,44,34,0.90)) !important;
      border-color: rgba(140,160,130,0.28) !important;
    }
    body.dark-mode #profitContent .p-card.c-gold {
      background: linear-gradient(135deg, rgba(62,48,10,0.90), rgba(52,40,8,0.92)) !important;
      border-color: rgba(210,175,60,0.32) !important;
    }
    body.dark-mode #profitContent .p-card::before {
      background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%);
    }

    /* ── Dark eyebrow & section labels — per-card hue ── */
    body.dark-mode #profitContent .p-card-eyebrow {
      opacity: 1 !important;
      text-shadow: 0 1px 3px rgba(0,0,0,0.5);
    }
    body.dark-mode #profitContent .p-card-section-label {
      opacity: 1 !important;
    }
    /* Today — bright green */
    body.dark-mode #profitContent .p-card.c-today .p-card-eyebrow,
    body.dark-mode #profitContent .p-card.c-today .p-card-section-label { color: #a8e090 !important; }
    body.dark-mode #profitContent .p-card.c-today .p-card-value        { color: #d8f8c8 !important; }
    body.dark-mode #profitContent .p-card.c-today .p-card-sub          { color: #7abf65 !important; }
    /* Yesterday — warm gold */
    body.dark-mode #profitContent .p-card.c-yesterday .p-card-eyebrow,
    body.dark-mode #profitContent .p-card.c-yesterday .p-card-section-label { color: #e8d080 !important; }
    body.dark-mode #profitContent .p-card.c-yesterday .p-card-value        { color: #f8eecc !important; }
    body.dark-mode #profitContent .p-card.c-yesterday .p-card-sub          { color: #c4a850 !important; }
    /* Week — teal/mint */
    body.dark-mode #profitContent .p-card.c-week .p-card-eyebrow,
    body.dark-mode #profitContent .p-card.c-week .p-card-section-label { color: #80d8b8 !important; }
    body.dark-mode #profitContent .p-card.c-week .p-card-value         { color: #c8f8e8 !important; }
    body.dark-mode #profitContent .p-card.c-week .p-card-sub           { color: #5ab890 !important; }
    /* Month — cool blue */
    body.dark-mode #profitContent .p-card.c-month .p-card-eyebrow,
    body.dark-mode #profitContent .p-card.c-month .p-card-section-label { color: #80c0e8 !important; }
    body.dark-mode #profitContent .p-card.c-month .p-card-value         { color: #c8e8f8 !important; }
    body.dark-mode #profitContent .p-card.c-month .p-card-sub           { color: #5aa0c8 !important; }
    /* Year — lavender/purple */
    body.dark-mode #profitContent .p-card.c-year .p-card-eyebrow,
    body.dark-mode #profitContent .p-card.c-year .p-card-section-label { color: #c8a0e8 !important; }
    body.dark-mode #profitContent .p-card.c-year .p-card-value         { color: #e8d8f8 !important; }
    body.dark-mode #profitContent .p-card.c-year .p-card-sub           { color: #a078c0 !important; }
    /* Neutral — muted sage */
    body.dark-mode #profitContent .p-card.c-neutral .p-card-eyebrow,
    body.dark-mode #profitContent .p-card.c-neutral .p-card-section-label { color: #a0c898 !important; }
    body.dark-mode #profitContent .p-card.c-neutral .p-card-value         { color: #eaf6e4 !important; }
    body.dark-mode #profitContent .p-card.c-neutral .p-card-sub           { color: #8aaa84 !important; }
    /* Gold — amber */
    body.dark-mode #profitContent .p-card.c-gold .p-card-eyebrow,
    body.dark-mode #profitContent .p-card.c-gold .p-card-section-label { color: #e0c060 !important; }
    body.dark-mode #profitContent .p-card.c-gold .p-card-value         { color: #f8ecc8 !important; }
    body.dark-mode #profitContent .p-card.c-gold .p-card-sub           { color: #b89840 !important; }

    /* ── Dark main value overrides (profit & gold stay universal) ── */
    body.dark-mode #profitContent .p-card-value {
      text-shadow: 0 1px 6px rgba(0,0,0,0.4);
    }
    body.dark-mode #profitContent .p-card-value.profit-color {
      color: #5edc8a !important;
      text-shadow: 0 0 14px rgba(74,222,128,0.3), 0 1px 4px rgba(0,0,0,0.4) !important;
    }
    body.dark-mode #profitContent .p-card-value.gold-color {
      color: #f0cc55 !important;
      text-shadow: 0 0 14px rgba(240,204,85,0.3), 0 1px 4px rgba(0,0,0,0.4) !important;
    }
    body.dark-mode #profitContent .p-card-value.muted-val {
      color: #8aaa84 !important;
    }

    /* ── Dark sub-text & empty msg ── */
    body.dark-mode #profitContent .p-empty-msg {
      color: #8aaa84 !important; opacity: 1 !important;
    }

    /* ── Dark section title & page sub ── */
    body.dark-mode #profitContent .p-section-title { color: #d0eac8 !important; }
    body.dark-mode #profitContent .p-page-sub      { color: #7a9a74 !important; }

    /* ── Dark divider — per-card hue ── */
    body.dark-mode #profitContent .p-divider {
      background: linear-gradient(90deg, transparent, rgba(135,179,130,0.3), transparent) !important;
    }
    body.dark-mode #profitContent .p-card.c-yesterday .p-divider {
      background: linear-gradient(90deg, transparent, rgba(210,180,80,0.3), transparent) !important;
    }
    body.dark-mode #profitContent .p-card.c-week .p-divider {
      background: linear-gradient(90deg, transparent, rgba(100,210,170,0.3), transparent) !important;
    }
    body.dark-mode #profitContent .p-card.c-month .p-divider {
      background: linear-gradient(90deg, transparent, rgba(90,170,230,0.3), transparent) !important;
    }
    body.dark-mode #profitContent .p-card.c-year .p-divider {
      background: linear-gradient(90deg, transparent, rgba(170,120,220,0.3), transparent) !important;
    }
    body.dark-mode #profitContent .p-card.c-gold .p-divider {
      background: linear-gradient(90deg, transparent, rgba(210,175,60,0.3), transparent) !important;
    }

    /* ── Dark timing strip — per-card hue ── */
    body.dark-mode #profitContent .p-timing {
      background: rgba(255,255,255,0.07) !important;
      border-color: rgba(255,255,255,0.12) !important;
      color: #90b88a !important;
    }
    body.dark-mode #profitContent .p-card.c-month .p-timing  { color: #6aa0c0 !important; }
    body.dark-mode #profitContent .p-card.c-month .p-timing strong { color: #a0d0f0 !important; }
    body.dark-mode #profitContent .p-card.c-year .p-timing   { color: #9078b0 !important; }
    body.dark-mode #profitContent .p-card.c-year .p-timing strong  { color: #c8a8e8 !important; }
    body.dark-mode #profitContent .p-timing strong { color: #c8e6c0 !important; }
    body.dark-mode #profitContent .p-timing-row    { color: #90b88a !important; }

    /* ── Dark timer badge ── */
    body.dark-mode #profitContent .p-timer-badge {
      background: rgba(30,55,28,0.75) !important;
      border-color: rgba(135,179,130,0.28) !important;
      color: #87B382 !important;
    }
    body.dark-mode #profitContent .p-timer-row        { color: #87B382 !important; }
    body.dark-mode #profitContent .p-timer-row strong { color: #b8e090 !important; }

    /* ── Dark buttons ── */
    body.dark-mode #profitContent #btnToggleRecent {
      background: var(--btn-green-bg);
      color: var(--btn-green-text); border: none;
    }
    body.dark-mode #profitContent #btnClearHistory {
      background: var(--btn-red-bg);
      color: var(--btn-red-text); border: none;
      box-shadow: var(--btn-red-shadow);
    }

    /* ── Dark sale cards ── */
    body.dark-mode #profitContent .p-sale-card {
      background: rgba(30,50,28,0.70) !important;
      border-color: rgba(135,179,130,0.2) !important;
    }
    body.dark-mode #profitContent .p-sale-card::before {
      background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%);
    }
    body.dark-mode #profitContent .p-sale-footer   { border-top-color: rgba(135,179,130,0.18); }
    body.dark-mode #profitContent .p-sale-date     { color: #d0eac8 !important; }
    body.dark-mode #profitContent .p-sale-time,
    body.dark-mode #profitContent .p-sale-customer { color: #7a9a74 !important; }
    body.dark-mode #profitContent .p-sale-items-label,
    body.dark-mode #profitContent .p-sale-stat-label {
      color: #7a9a74 !important; opacity: 1 !important;
    }
    body.dark-mode #profitContent .p-sale-items  { color: #a8c4a0 !important; }
    body.dark-mode #profitContent .p-sale-total  { color: #d8ecd4 !important; }
    body.dark-mode #profitContent .p-sale-profit { color: #5edc8a !important; }

    /* ── Dark payment badges ── */
    body.dark-mode #profitContent .p-sale-card .payment-badge.cash {
      background: linear-gradient(135deg,#4a9e44,#3a7d35) !important;
    }
    body.dark-mode #profitContent .p-sale-card .payment-badge.gcash {
      background: linear-gradient(135deg,#1e88e5,#1565c0) !important;
    }
    body.dark-mode #profitContent .p-sale-card .payment-badge.credit,
    body.dark-mode #profitContent .p-sale-card .payment-badge.credit-paid {
      background: linear-gradient(135deg,#7c55d4,#5c35b5) !important;
    }

    /* ── Dark empty state ── */
    body.dark-mode #profitContent .p-empty-state {
      background: rgba(30,50,28,0.6) !important;
      border-color: rgba(135,179,130,0.18) !important;
    }

    /* ════════════════════════════════════════════════════
       MOBILE
    ════════════════════════════════════════════════════ */
    @media (max-width: 768px) {
      #profitContent .p-grid { grid-template-columns: 1fr; gap: 14px; }
      #profitContent .p-section-title { font-size: 15px; margin: 26px 0 14px; }
      #profitContent .p-card { padding: 20px 18px; border-radius: 18px; }
      #profitContent .p-card-value { font-size: 26px; }
      #profitContent .p-recent-header { flex-direction: column; align-items: flex-start; gap: 10px; }
      #profitContent .p-recent-actions { width: 100%; }
      #profitContent #btnToggleRecent,
      #profitContent #btnClearHistory { flex:1; justify-content:center; padding:13px 14px; min-height:46px; font-size:13px; }
      #profitContent .p-sale-card { padding: 18px 16px; }
      #profitContent .p-sale-total,
      #profitContent .p-sale-profit { font-size: 16px; }
    }
    @media (max-width: 480px) {
      #profitContent .p-grid { gap: 12px; }
      #profitContent .p-card { padding: 18px 15px; border-radius: 16px; }
      #profitContent .p-card-value { font-size: 24px; }
    }
  `;
  document.head.appendChild(s);
})();

// ─── Inject background blob divs ─────────────────────────────────────────────
function _injectProfitBlobs() {
  const page = document.getElementById('profitPage');
  if (!page || page.querySelector('.profit-blob')) return;
  ['profit-blob profit-blob-1','profit-blob profit-blob-2','profit-blob profit-blob-3'].forEach(cls => {
    const div = document.createElement('div');
    div.className = cls;
    page.insertBefore(div, page.firstChild);
  });
}

// ─── renderProfit ─────────────────────────────────────────────────────────────
async function renderProfit() {
  _injectProfitBlobs();

  const content = document.getElementById('profitContent');
  content.innerHTML = `
    <div class="p-grid" id="profit-grid-main"></div>
    <div class="p-grid" id="profit-grid-sub" style="margin-top:20px;"></div>
<h3 class="p-section-title">🕑 Recent Sales
  <span style="
    display:inline-flex; align-items:center; gap:5px;
    font-size:11px; font-weight:700; letter-spacing:0.3px;
    background:linear-gradient(135deg,rgba(239,68,68,0.15),rgba(220,38,38,0.1));
    color:#b91c1c; border:1.5px solid rgba(239,68,68,0.35);
    border-radius:20px; padding:4px 12px;
    backdrop-filter:blur(8px);
    box-shadow:0 2px 8px rgba(239,68,68,0.12);
    animation:pulse-warn 2.5s ease-in-out infinite;
  ">🧹 Clear recent transactions to avoid lagging — do this daily!</span>
</h3>
<style>
  @keyframes pulse-warn {
    0%,100%{ box-shadow:0 2px 8px rgba(239,68,68,0.12); }
    50%    { box-shadow:0 2px 16px rgba(239,68,68,0.28); }
  }
  body.dark-mode #profitContent .p-section-title span {
    background:linear-gradient(135deg,rgba(239,68,68,0.22),rgba(220,38,38,0.15)) !important;
    color:#f87171 !important;
    border-color:rgba(239,68,68,0.3) !important;
  }
</style>
    <div class="p-recent-header">
      <div class="p-recent-actions">
        <button id="btnToggleRecent">
          <span class="toggle-arrow">▼</span><span class="btn-label">Hide Sales</span>
        </button>
        <button id="btnClearHistory">🗑️ Clear Transaction History</button>
      </div>
    </div>
    <div id="recentSalesContainer"></div>
  `;

  _wireToggle();

  try {
    const [periods, products, sales] = await Promise.all([
      DB.getPeriodTotals(),
      DB.getProducts(),
      DB.getSales(),
    ]);

    document.getElementById('profit-grid-main').innerHTML =
      renderPeriodCard('today',     periods.today)     +
      renderPeriodCard('yesterday', periods.yesterday) +
      renderPeriodCard('week',      periods.last_week) +
      renderPeriodCard('month',     periods.last_month);

    document.getElementById('profit-grid-sub').innerHTML =
      renderPeriodCard('year', periods.last_year) +
      renderPotentialProfitCard(products);

    document.getElementById('recentSalesContainer').innerHTML = renderRecentSales(sales);
    document.getElementById('btnClearHistory')?.addEventListener('click', clearTransactionHistory);

    setupMidnightRefresh();

  } catch (error) {
    const g = document.getElementById('profit-grid-main');
    if (g) g.innerHTML = `
      <div class="p-card c-neutral" style="text-align:center;padding:40px 24px;grid-column:1/-1;">
        <div style="font-size:38px;margin-bottom:10px;">⚠️</div>
        <h3 style="color:#dc2626;margin-bottom:8px;font-size:1.1rem;">Error Loading Data</h3>
        <p style="color:var(--pmuted);font-size:13px;margin-bottom:18px;">${error.message}</p>
        <button onclick="renderProfit()"
          style="padding:11px 24px;background:linear-gradient(135deg,#87B382,#5D9456);
                 color:#fff;border:none;border-radius:12px;cursor:pointer;
                 font-weight:700;font-size:13px;box-shadow:0 4px 14px rgba(93,148,86,.35);">
          ↺ Retry
        </button>
      </div>`;
  }
}

// ─── Toggle wiring ────────────────────────────────────────────────────────────
function _wireToggle() {
  const btn       = document.getElementById('btnToggleRecent');
  const container = document.getElementById('recentSalesContainer');
  if (!btn || !container) return;
  btn.addEventListener('click', () => {
    const hidden = container.classList.toggle('rs-collapsed');
    const arrow  = btn.querySelector('.toggle-arrow');
    if (arrow) arrow.style.transform = hidden ? 'rotate(-90deg)' : 'rotate(0)';
    const label = btn.querySelector('.btn-label');
    if (label) label.textContent = hidden ? 'Show Sales' : 'Hide Sales';
  });
}

// ─── Number formatter ─────────────────────────────────────────────────────────
function fmt(n) {
  return Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── renderPeriodCard ─────────────────────────────────────────────────────────
function renderPeriodCard(type, data = {}) {
  const meta = {
    today:     { label:"TODAY'S PERFORMANCE",      icon:'📅', cls:'c-today'     },
    yesterday: { label:"YESTERDAY'S PERFORMANCE",  icon:'📆', cls:'c-yesterday' },
    week:      { label:"LAST WEEK'S PERFORMANCE",  icon:'🌿', cls:'c-week'      },
    month:     { label:"LAST MONTH'S PERFORMANCE", icon:'📋', cls:'c-month'     },
    year:      { label:"LAST YEAR'S PERFORMANCE",  icon:'📈', cls:'c-year'      },
  }[type] || { label:'', icon:'', cls:'c-neutral' };

  if (!data || !data.has_data) {
    let timingHtml = '';
    if (data?.visibility_start && data?.visibility_end) {
      timingHtml = `
        <div class="p-timing">
          <div class="p-timing-row">📅 <span style="font-weight:500">Visible from:</span>&nbsp;
            <strong>${new Date(data.visibility_start).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})} at 12am</strong>
          </div>
          <div class="p-timing-row">🔚 <span style="font-weight:500">Until:</span>&nbsp;
            <strong>${new Date(data.visibility_end).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})} at 12am</strong>
          </div>
        </div>`;
    }
    return `
      <div class="p-card ${meta.cls}">
        <div class="p-card-eyebrow">${meta.icon}&nbsp;${meta.label}</div>
        <div class="p-empty-msg">No sales recorded${type==='month'||type==='year'?' for this period':''}</div>
        <div class="p-divider"></div>
        <div class="p-card-sub" style="padding-top:4px;">
          ${type==='month'||type==='year'?'Check back during visibility window':'Check back later for data'}
        </div>
        ${timingHtml}
      </div>`;
  }

  let rangeHtml = '';
  if (data.period_start && data.period_end) {
    rangeHtml = `
      <div class="p-card-sub" style="margin-bottom:14px;">
        📅 ${new Date(data.period_start).toLocaleDateString('en-PH',{month:'short',day:'numeric'})} –
        ${new Date(data.period_end).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}
      </div>`;
  }

  let timerHtml = '';
  if (data.visibility_end) {
    const days     = Math.ceil((new Date(data.visibility_end) - new Date()) / 86400000);
    const untilDate = new Date(data.visibility_end).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
    timerHtml = `
      <div class="p-timer-badge">
        <div class="p-timer-row">⏰ Visible for&nbsp;<strong>${days} more day${days===1?'':'s'}</strong></div>
        <div class="p-timer-row">📅 Until&nbsp;<strong>${untilDate}</strong></div>
      </div>`;
  }

  return `
    <div class="p-card ${meta.cls}">
      <div class="p-card-eyebrow">${meta.icon}&nbsp;${meta.label}</div>
      ${rangeHtml}
      <div class="p-card-section-label">REVENUE</div>
      <div class="p-card-value">₱${fmt(data.revenue)}</div>
      <div class="p-card-sub">${data.sales_count} ${data.sales_count===1?'sale':'sales'}</div>
      <div class="p-divider"></div>
      <div class="p-card-section-label">PROFIT EARNED</div>
      <div class="p-card-value profit-color">₱${fmt(data.profit)}</div>
      ${timerHtml}
    </div>`;
}

// ─── renderPotentialProfitCard ────────────────────────────────────────────────
function renderPotentialProfitCard(products = []) {
  let potential = 0;
  products.forEach(p => {
    const price = parseFloat(p.price || p.selling_price) || 0;
    const cost  = parseFloat(p.cost  || p.cost_price)   || 0;
    const qty   = parseFloat(p.quantity || p.stock)     || 0;
    potential  += (price - cost) * qty;
  });
  return `
    <div class="p-card c-gold">
      <div class="p-card-eyebrow">💎&nbsp;INVENTORY VALUE</div>
      <div class="p-card-section-label">Potential Profit from Current Stock</div>
      <div class="p-card-value gold-color">₱${fmt(potential)}</div>
      <div class="p-divider"></div>
      <div style="font-size:12px;color:var(--pmuted);opacity:0.85;text-align:center;">if all inventory sells at current prices</div>
    </div>`;
}

// ─── renderRecentSales ────────────────────────────────────────────────────────

function renderRecentSales(recentSales) {
  if (!Array.isArray(recentSales) || recentSales.length === 0) {
    return `
      <div class="p-empty-state">
        <span class="p-empty-icon">📭</span>
        <p style="font-size:16px;font-weight:700;color:var(--ptext);margin-bottom:6px;">No Sales Yet</p>
        <p style="color:var(--pmuted);">Start making sales to see them here!</p>
      </div>`;
  }

  let html = '<div class="p-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));margin-bottom:24px;">';
  const reversedSales = [...recentSales].reverse();
  reversedSales.forEach(sale => {
    const date  = new Date(sale.date || sale.created_at);
    const fDate = date.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'});
    const fTime = date.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'});

    let itemsList = 'N/A';
    try {
      const items = Array.isArray(sale.items)
        ? sale.items
        : typeof sale.items === 'string' ? JSON.parse(sale.items) : [];
      itemsList = items.map(i => `${i.product_name||i.name||'Item'} (×${i.quantity})`).join(', ');
    } catch(e) {}

    const total        = parseFloat(sale.total) || 0;
    const profit       = parseFloat(sale.profit || sale.total_profit) || 0;
    
    const pmRaw        = (sale.paymentType || sale.payment_method || 'cash').toLowerCase().trim();
    const customerName = (sale.customer_name || sale.customerName || '').trim();
    const displayName  = customerName
      ? customerName
      : (pmRaw === 'cash' ? 'N/A' : (pmRaw.startsWith('credit') ? 'Missing Debtor Name' : 'Walk-in Customer'));

    const pmClass      = pmRaw.replace(/\s+/g,'-');
    const pmLabel      = pmRaw.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());

    html += `
      <div class="p-sale-card">
        <div class="p-sale-header">
          <div>
            <div class="p-sale-date">${fDate}</div>
            <div class="p-sale-time">${fTime}</div>
            <div class="p-sale-customer">👤 ${displayName}</div>
          </div>
          <span class="payment-badge ${pmClass}">${pmLabel}</span>
        </div>
        <div class="p-sale-items-label">ITEMS PURCHASED</div>
        <div class="p-sale-items">${itemsList}</div>
        <div class="p-sale-footer">
          <div>
            <div class="p-sale-stat-label">TOTAL</div>
            <div class="p-sale-total">₱${fmt(total)}</div>
          </div>
          <div>
            <div class="p-sale-stat-label" style="text-align:right;">PROFIT</div>
            <div class="p-sale-profit">₱${fmt(profit)}</div>
          </div>
        </div>
      </div>`;
  });
  html += '</div>';
  return html;
}
// ─── clearTransactionHistory ──────────────────────────────────────────────────
async function clearTransactionHistory() {
  try {
    const sales = await DB.getSales();
    if (!Array.isArray(sales) || sales.length === 0) {
      showModernAlert('No transactions to clear.','ℹ️'); return;
    }
    const ok1 = await showModernConfirm(
      `Delete all ${sales.length} recent transaction record${sales.length===1?'':'s'}?<br><br>⚠️ <strong>WILL BE DELETED:</strong><br>• All ${sales.length} visible transaction(s)<br><br>✅ <strong>PRESERVED:</strong><br>• Today, Yesterday, Week, Month &amp; Year performance<br>• All profit summaries &amp; totals<br><br>Only the visible transaction list is cleared.`,
      '🗑️'
    );
    if (!ok1) return;
    const ok2 = await showModernConfirm(
      `<strong>FINAL CONFIRMATION</strong><br><br>🗑️ <strong>WILL BE DELETED:</strong><br>• All ${sales.length} recent transaction record(s)<br><br>✅ <strong>PRESERVED:</strong><br>• All period totals &amp; summaries<br><br>This cannot be undone!`,
      '🚨'
    );
    if (!ok2) return;
    await DB.updatePeriods();
    await DB.cleanupOldTransactions(0);
    showModernAlert(`✅ Done!<br><br>• All ${sales.length} recent transaction(s) cleared<br>• Today, Yesterday, Week, Month &amp; Year totals preserved`,'✅'); await renderProfit();
  } catch (error) {
    console.error('Error clearing transaction history:', error);
    showModernAlert('An error occurred while clearing transaction history.','❌');
  }
}

// ─── setupMidnightRefresh ─────────────────────────────────────────────────────
// Robust midnight detection: setTimeout (precision) + interval (backup for
// browser throttling / sleep-wake) + visibilitychange (tab reactivation).
function setupMidnightRefresh() {
  window._lastKnownDate = new Date().toDateString();

  const now      = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const msLeft   = tomorrow - now;

  // Clear previous timers
  if (window._midnightTimeout)    clearTimeout(window._midnightTimeout);
  if (window._dateCheckInterval)  clearInterval(window._dateCheckInterval);

  // 1) Primary: fire ~1 s after midnight
  window._midnightTimeout = setTimeout(() => _onMidnightCrossed(), msLeft + 1000);

  // 2) Backup: poll every 30 s (catches throttled tabs, sleep/wake)
  window._dateCheckInterval = setInterval(() => {
    if (new Date().toDateString() !== window._lastKnownDate) _onMidnightCrossed();
  }, 30000);

  // 3) Tab reactivation: check immediately when user returns
  if (!window._visibilityListenerAdded) {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && new Date().toDateString() !== window._lastKnownDate) {
        _onMidnightCrossed();
      }
    });
    window._visibilityListenerAdded = true;
  }

  console.log(`⏰ Midnight refresh in ${Math.round(msLeft / 60000)} min`);
}

async function _onMidnightCrossed() {
  // Guard against multiple rapid fires
  const today = new Date().toDateString();
  if (today === window._lastKnownDate) return;
  window._lastKnownDate = today;

  console.log('🕛 Midnight crossed — refreshing period cards…');
  try {
    await DB.updatePeriods();
    const pg = document.getElementById('profitPage');
    if (pg && pg.classList.contains('active-page')) await renderProfit();
  } catch (e) { console.error('❌ Midnight refresh error:', e); }

  // Re-arm timers for the next midnight
  setupMidnightRefresh();
}

// ─── showModernAlert ──────────────────────────────────────────────────────────
function showModernAlert(message, icon = '✅') {
  document.getElementById('modernAlertOverlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'modernAlertOverlay';
  overlay.innerHTML = `
    <div class="mda-box">
      <div class="mda-stripe"></div>
      <div class="mda-icon-wrap"><span>${icon}</span></div>
      <h3 class="mda-title">Notice</h3>
      <div class="mda-msg">${message.replace(/\n/g,'<br>')}</div>
      <button class="mda-btn" onclick="document.getElementById('modernAlertOverlay').remove()">Got it!</button>
    </div>
    <style>
      #modernAlertOverlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(14px);display:flex;justify-content:center;align-items:center;z-index:99999;animation:mda_in .3s ease}
      .mda-box{background:rgba(220,240,215,0.78);backdrop-filter:blur(24px) saturate(1.6);-webkit-backdrop-filter:blur(24px) saturate(1.6);border:1.5px solid rgba(255,255,255,0.62);border-radius:28px;padding:44px 38px;width:90%;max-width:420px;box-shadow:0 24px 60px rgba(80,140,75,.25),0 8px 24px rgba(0,0,0,.1);animation:mda_pop .4s cubic-bezier(.34,1.56,.64,1);text-align:center;position:relative;overflow:hidden}
      .mda-box::before{content:'';position:absolute;inset:0;border-radius:28px;background:linear-gradient(135deg,rgba(255,255,255,.4) 0%,transparent 55%);pointer-events:none}
      body.dark-mode .mda-box{background:rgba(28,42,26,0.82);border-color:rgba(135,179,130,.22)}
      .mda-stripe{position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#87B382,#5D9456,#87B382);animation:mda_sl 3s linear infinite}
      .mda-icon-wrap{width:80px;height:80px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,0.55);border:1.5px solid rgba(255,255,255,0.7);backdrop-filter:blur(8px);box-shadow:0 6px 20px rgba(80,140,75,.2);font-size:44px}
      .mda-title{font-size:20px;font-weight:900;color:#1e2d1e;margin:0 0 10px}
      body.dark-mode .mda-title{color:#d8ecd4}
      .mda-msg{font-size:13px;line-height:1.8;color:#3a4a3a;font-weight:500;margin-bottom:26px}
      body.dark-mode .mda-msg{color:#a8c4a4}
      .mda-btn{width:100%;padding:14px;background:linear-gradient(135deg,#87B382,#5D9456);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:14px;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 5px 16px rgba(93,148,86,.4);transition:all .25s}
      .mda-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(93,148,86,.5)}
      @keyframes mda_in{from{opacity:0}to{opacity:1}}
      @keyframes mda_pop{from{transform:scale(.82) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
      @keyframes mda_sl{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
    </style>`;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('modernAlertOverlay')?.remove(), 3500);
}

// ─── showModernConfirm ────────────────────────────────────────────────────────
function showModernConfirm(message, icon = '⚠️') {
  return new Promise(resolve => {
    document.getElementById('modernConfirmOverlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'modernConfirmOverlay';
    overlay.innerHTML = `
      <div class="mdc-box">
        <div class="mdc-stripe"></div>
        <div class="mdc-icon-wrap"><span>${icon}</span></div>
        <h3 class="mdc-title">Confirm Action</h3>
        <div class="mdc-msg">${message.replace(/\n/g,'<br>')}</div>
        <div class="mdc-btns">
          <button class="mdc-btn mdc-yes mdc-yes-green" id="confirmYesBtn">Confirm</button>
          <button class="mdc-btn mdc-no"  id="confirmNoBtn">Cancel</button>
        </div>
      </div>
      <style>
        #modernConfirmOverlay{position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(14px);display:flex;justify-content:center;align-items:center;z-index:99999;animation:mdc_in .3s ease}
        .mdc-box{background:rgba(220,240,215,0.78);backdrop-filter:blur(24px) saturate(1.6);-webkit-backdrop-filter:blur(24px) saturate(1.6);border:1.5px solid rgba(255,255,255,0.62);border-radius:28px;padding:44px 38px;width:90%;max-width:420px;box-shadow:0 24px 60px rgba(80,140,75,.2),0 8px 24px rgba(0,0,0,.1);animation:mdc_pop .4s cubic-bezier(.34,1.56,.64,1);text-align:center;position:relative;overflow:hidden}
        .mdc-box::before{content:'';position:absolute;inset:0;border-radius:28px;background:linear-gradient(135deg,rgba(255,255,255,.38) 0%,transparent 55%);pointer-events:none}
        body.dark-mode .mdc-box{background:rgba(28,42,26,0.82);border-color:rgba(135,179,130,.2)}
        .mdc-stripe{position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#EF4444,#DC2626,#EF4444);animation:mdc_sl 3s linear infinite}
        .mdc-icon-wrap{width:80px;height:80px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(254,226,226,0.62);border:1.5px solid rgba(255,255,255,.65);backdrop-filter:blur(8px);box-shadow:0 6px 20px rgba(239,68,68,.2);font-size:44px}
        .mdc-title{font-size:20px;font-weight:900;color:#1e2d1e;margin:0 0 10px}
        body.dark-mode .mdc-title{color:#d8ecd4}
        .mdc-msg{font-size:13px;line-height:1.8;color:#3a4a3a;font-weight:500;margin-bottom:26px}
        body.dark-mode .mdc-msg{color:#a8c4a4}
        .mdc-btns{display:flex;flex-direction:column;gap:10px}
        .mdc-btn{width:100%;padding:14px;border:none;border-radius:14px;font-weight:800;font-size:14px;cursor:pointer;transition:all .25s}
        .mdc-yes-green{background:linear-gradient(135deg,#e4f9d6,#b8e994) !important;color:#1e3a1e !important;border:1.5px solid #c6e6b3 !important;box-shadow:0 6px 24px 0 rgba(184,233,148,0.35);font-weight:900}
        .mdc-yes-green:hover{background:linear-gradient(135deg,#b8e994,#87b382) !important;color:#fff !important;transform:translateY(-2px) scale(1.03);}
        body.dark-mode .mdc-yes-green{background:linear-gradient(135deg,#203420,#2e4d2e) !important;color:#eaffea !important;border:1.5px solid #4a7a45 !important;}
        body.dark-mode .mdc-yes-green:hover{background:linear-gradient(135deg,#2e4d2e,#3a6b3a) !important;color:#fff !important;transform:translateY(-2px) scale(1.03);}
        .mdc-no{background:rgba(255,255,255,0.55);backdrop-filter:blur(8px);color:#3a4a3a;border:1.5px solid rgba(255,255,255,.65);box-shadow:0 3px 10px rgba(0,0,0,.08)}
        .mdc-no:hover{background:rgba(255,255,255,0.72);transform:translateY(-1px)}
        body.dark-mode .mdc-no{background:rgba(40,55,38,0.6);color:#a8c4a4;border-color:rgba(135,179,130,.2)}
        @keyframes mdc_in{from{opacity:0}to{opacity:1}}
        @keyframes mdc_pop{from{transform:scale(.82) translateY(20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        @keyframes mdc_sl{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
      </style>`;
    document.body.appendChild(overlay);
    document.getElementById('confirmYesBtn').onclick = () => { overlay.remove(); resolve(true);  };
    document.getElementById('confirmNoBtn').onclick  = () => { overlay.remove(); resolve(false); };
  });
}

console.log('💰 Profit module loaded!');