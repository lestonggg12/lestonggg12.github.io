/**
 * inventory.js — Inventory management page — NEO-GLASSMORPHIC EDITION
 */

console.log('📦 Loading inventory module...');

// ─── Inject global neo-glass styles ──────────────────────────────────────────
(function injectInventoryGlassStyles() {
    if (document.getElementById('inventory-neo-styles')) return;
    const s = document.createElement('style');
    s.id = 'inventory-neo-styles';
    s.textContent = `
        /* ── CSS Variables ── */
        #inventoryContent {
            --neo-float:
                0 8px 32px rgba(80,140,75,0.22),
                0 2px 8px  rgba(80,140,75,0.12),
                0 -2px 0   rgba(255,255,255,0.9) inset,
                0 1px 0    rgba(80,140,75,0.15)  inset;
            --neo-float-hover:
                0 18px 50px rgba(80,140,75,0.30),
                0 4px 16px  rgba(80,140,75,0.18),
                0 -2px 0    rgba(255,255,255,0.95) inset;
        }

        /* ════════ SUMMARY STAT CARDS ════════ */
        #inventoryContent .gl-inv-stat {
            display: flex;
            align-items: center;
            gap: 16px;
            border-radius: 20px;
            padding: 20px 24px;
            position: relative;
            overflow: hidden;
            cursor: default;
            backdrop-filter: blur(18px) saturate(1.6);
            -webkit-backdrop-filter: blur(18px) saturate(1.6);
            border: 1.5px solid rgba(255,255,255,0.55);
            box-shadow: var(--neo-float);
            transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
        }
        #inventoryContent .gl-inv-stat::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 20px;
            background: linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 40%, transparent 70%);
            pointer-events: none;
        }
        #inventoryContent .gl-inv-stat::after {
            content: '';
            position: absolute;
            top: 0; left: 20px; right: 20px;
            height: 2px;
            border-radius: 0 0 4px 4px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
        }
        #inventoryContent .gl-inv-stat:hover {
            transform: translateY(-6px) scale(1.01);
            box-shadow: var(--neo-float-hover);
        }
        #inventoryContent .gl-inv-stat .si-icon {
            font-size: 2rem;
            flex-shrink: 0;
            position: relative;
            z-index: 1;
            width: 52px; height: 52px;
            border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 14px rgba(0,0,0,0.18), 0 -1px 0 rgba(255,255,255,0.5) inset;
        }
        #inventoryContent .gl-inv-stat .si-body {
            flex: 1; min-width: 0;
            position: relative; z-index: 1;
            display: flex; flex-direction: column; gap: 3px;
        }
        #inventoryContent .gl-inv-stat .si-label {
            font-size: 0.64rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.7px; opacity: 0.72;
        }
        #inventoryContent .gl-inv-stat .si-value {
            font-size: 1.7rem; font-weight: 900;
            line-height: 1.1; letter-spacing: -0.5px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.08);
        }
        /* Colour variants */
        #inventoryContent .gl-inv-stat.si-beige  { background: linear-gradient(135deg,#f5ede0,#eee4d5); border-color:#e8dac8; }
        #inventoryContent .gl-inv-stat.si-beige  .si-label,
        #inventoryContent .gl-inv-stat.si-beige  .si-value { color: #5D534A; }
        #inventoryContent .gl-inv-stat.si-amber  { background: linear-gradient(135deg,#f6f4d2,#eee9c4); border-color:#e5e0ba; }
        #inventoryContent .gl-inv-stat.si-amber  .si-label { color: #6b6438; }
        #inventoryContent .gl-inv-stat.si-amber  .si-value { color: #5a5230; }
        #inventoryContent .gl-inv-stat.si-green  { background: linear-gradient(135deg,#cbdfbd,#bdd4ae); border-color:#b5cca8; }
        #inventoryContent .gl-inv-stat.si-green  .si-label { color: #3e5235; }
        #inventoryContent .gl-inv-stat.si-green  .si-value { color: #32422b; }
        #inventoryContent .gl-inv-stat.si-mint   { background: linear-gradient(135deg,#d4e09b,#c5d68d); border-color:#c0cf88; }
        #inventoryContent .gl-inv-stat.si-mint   .si-label { color: #4a5a2a; }
        #inventoryContent .gl-inv-stat.si-mint   .si-value { color: #3d4a23; }

        /* ════════ CATEGORY CARDS ════════ */
        #inventoryContent .gl-cat-card {
            border-radius: 20px;
            padding: 20px 22px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(16px) saturate(1.5);
            -webkit-backdrop-filter: blur(16px) saturate(1.5);
            border: 1.5px solid rgba(255,255,255,0.55);
            box-shadow: var(--neo-float);
            transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
            background: linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.15));
        }
        #inventoryContent .gl-cat-card::before {
            content: '';
            position: absolute; inset: 0; border-radius: 20px;
            background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 50%, transparent 75%);
            pointer-events: none;
        }
        #inventoryContent .gl-cat-card::after {
            content: '';
            position: absolute; top: 0; left: 20px; right: 20px; height: 2px;
            border-radius: 0 0 4px 4px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
        }
        #inventoryContent .gl-cat-card:hover {
            transform: translateY(-7px) scale(1.01);
            box-shadow: var(--neo-float-hover);
        }
        #inventoryContent .gl-cat-card:active { transform: translateY(-3px) scale(1.005); }

        #inventoryContent .gl-cat-inner {
            display: flex; align-items: center; gap: 16px;
            position: relative; z-index: 1;
        }
        #inventoryContent .gl-cat-icon-box {
            width: 54px; height: 54px; border-radius: 16px;
            display: flex; align-items: center; justify-content: center;
            font-size: 28px; flex-shrink: 0;
            box-shadow: 0 4px 14px rgba(0,0,0,0.18), 0 -1px 0 rgba(255,255,255,0.5) inset;
            border: 1px solid rgba(255,255,255,0.4);
        }
        #inventoryContent .gl-cat-text { flex: 1; }
        #inventoryContent .gl-cat-name  { font-size: 16px; font-weight: 800; color: #2d3a2d; margin-bottom: 3px; }
        #inventoryContent .gl-cat-count { font-size: 13px; color: #7a9070; font-weight: 600; }
        #inventoryContent .gl-cat-arrow {
            font-size: 18px; color: rgba(80,120,75,0.4);
            transition: all .3s ease; flex-shrink: 0;
        }
        #inventoryContent .gl-cat-card:hover .gl-cat-arrow {
            color: rgba(80,120,75,0.9); transform: translateX(5px);
        }

        /* Edit/Delete buttons on cat card */
        #inventoryContent .cat-manage-btns {
            position: absolute; top: 10px; right: 10px;
            display: flex; gap: 4px; opacity: 0;
            transition: opacity 0.2s ease; z-index: 10;
        }
        #inventoryContent .gl-cat-card:hover .cat-manage-btns { opacity: 1; }
        @media(max-width:768px){ #inventoryContent .cat-manage-btns { opacity: 1; } }
        #inventoryContent .cat-btn-edit,
        #inventoryContent .cat-btn-delete {
            width: 30px; height: 30px; border: none; border-radius: 8px;
            cursor: pointer; font-size: 14px; display: flex;
            align-items: center; justify-content: center;
            transition: all .2s ease;
            backdrop-filter: blur(8px);
        }
        #inventoryContent .cat-btn-edit   { background: var(--btn-green-bg); border: none; color: var(--btn-green-text); }
        #inventoryContent .cat-btn-edit:hover   { background: var(--btn-green-hover); transform: scale(1.12); }
        #inventoryContent .cat-btn-delete { background: var(--btn-red-bg); border: none; color: var(--btn-red-text); }
        #inventoryContent .cat-btn-delete:hover { background: var(--btn-red-hover); transform: scale(1.12); }

        /* Add category card */
        #inventoryContent .gl-cat-add {
            border-radius: 20px; padding: 28px 20px;
            cursor: pointer; display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            text-align: center; min-height: 100px;
            border: 2px dashed rgba(135,179,130,0.35);
            background: rgba(255,255,255,0.25);
            backdrop-filter: blur(10px);
            transition: all .35s cubic-bezier(.22,1,.36,1);
            position: relative; overflow: hidden;
        }
        #inventoryContent .gl-cat-add:hover {
            background: rgba(203,223,189,0.25);
            border-color: rgba(135,179,130,0.7);
            transform: translateY(-5px);
            box-shadow: 0 12px 32px rgba(80,140,75,0.18);
        }
        #inventoryContent .gl-cat-add-label { font-weight: 800; font-size: 15px; color: #3e5235; margin-top: 6px; }
        #inventoryContent .gl-cat-add-sub   { font-size: 12px; color: #7a9070; margin-top: 4px; font-weight: 600; }

        /* ════════ INNER STAT PILLS (category view) ════════ */
        #inventoryContent .gl-mini-stat {
            display: flex; align-items: center; gap: 12px;
            border-radius: 16px; padding: 16px 18px; flex: 1; min-width: 180px;
            position: relative; overflow: hidden;
            backdrop-filter: blur(14px) saturate(1.5);
            -webkit-backdrop-filter: blur(14px) saturate(1.5);
            border: 1.5px solid rgba(255,255,255,0.55);
            box-shadow: var(--neo-float);
            transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
        }
        #inventoryContent .gl-mini-stat::before {
            content: ''; position: absolute; inset: 0; border-radius: 16px;
            background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%);
            pointer-events: none;
        }
        #inventoryContent .gl-mini-stat:hover { transform: translateY(-5px); box-shadow: var(--neo-float-hover); }
        #inventoryContent .gl-mini-stat .ms-icon { font-size: 1.5rem; position: relative; z-index:1; flex-shrink:0; }
        #inventoryContent .gl-mini-stat .ms-body  { position: relative; z-index:1; }
        #inventoryContent .gl-mini-stat .ms-label { font-size: 10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; opacity:0.7; margin-bottom:3px; }
        #inventoryContent .gl-mini-stat .ms-value { font-size: 1.4rem; font-weight: 900; }
        #inventoryContent .gl-mini-stat.ms-beige { background: linear-gradient(135deg,#f5ede0,#eee4d5); }
        #inventoryContent .gl-mini-stat.ms-beige .ms-label, #inventoryContent .gl-mini-stat.ms-beige .ms-value { color:#5D534A; }
        #inventoryContent .gl-mini-stat.ms-amber { background: linear-gradient(135deg,#f6f4d2,#eee9c4); }
        #inventoryContent .gl-mini-stat.ms-amber .ms-label { color:#6b6438; } #inventoryContent .gl-mini-stat.ms-amber .ms-value { color:#5a5230; }
        #inventoryContent .gl-mini-stat.ms-red   { background: linear-gradient(135deg,#f6e4e4,#f0d4d4); }
        #inventoryContent .gl-mini-stat.ms-red   .ms-label { color:#7a2820; } #inventoryContent .gl-mini-stat.ms-red   .ms-value { color:#6a2018; }
        #inventoryContent .gl-mini-stat.ms-green { background: linear-gradient(135deg,#cbdfbd,#bdd4ae); }
        #inventoryContent .gl-mini-stat.ms-green .ms-label { color:#3e5235; } #inventoryContent .gl-mini-stat.ms-green .ms-value { color:#32422b; }

        /* ════════ ADD PRODUCT FORM ════════ */
        #inventoryContent .gl-form-wrap {
            border-radius: 20px; padding: 22px 24px; margin-bottom: 20px;
            backdrop-filter: blur(16px) saturate(1.5);
            -webkit-backdrop-filter: blur(16px) saturate(1.5);
            background: linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.2));
            border: 1.5px solid rgba(255,255,255,0.6);
            box-shadow: var(--neo-float);
            position: relative; overflow: hidden;
        }
        #inventoryContent .gl-form-wrap::before {
            content: ''; position: absolute; inset: 0; border-radius: 20px;
            background: linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 55%);
            pointer-events: none;
        }
        #inventoryContent .gl-form-title {
            font-size: 15px; font-weight: 800; color: #2d3a2d;
            margin: 0 0 16px; position: relative; z-index: 1;
        }
        #inventoryContent .add-product-fields {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr auto;
            gap: 12px; align-items: end;
            position: relative; z-index: 1;
        }
        #inventoryContent .add-product-field { display: flex; flex-direction: column; gap: 6px; }
        #inventoryContent .add-product-field label {
            font-weight: 700; font-size: 11px; text-transform: uppercase;
            letter-spacing: 0.5px; color: #3e5235;
        }
        #inventoryContent .add-product-field input {
            width: 100%; padding: 10px 14px; height: 42px; box-sizing: border-box;
            border: 1.5px solid rgba(135,179,130,0.4); border-radius: 10px;
            font-size: 14px; font-weight: 600;
            background: rgba(255,255,255,0.6); backdrop-filter: blur(6px);
            color: #2d3a2d; transition: all .3s ease;
        }
        #inventoryContent .add-product-field input:focus {
            outline: none; border-color: #87B382;
            background: rgba(255,255,255,0.85);
            box-shadow: 0 0 0 4px rgba(135,179,130,0.2);
        }
        #inventoryContent #btnAddProduct {
            padding: 10px 22px; height: 42px; white-space: nowrap;
            background: var(--btn-green-bg);
            color: var(--btn-green-text); border: none;
            border-radius: 10px; cursor: pointer; font-weight: 800;
            font-size: 13px; align-self: end;
            box-shadow: var(--btn-green-shadow);
            transition: all .3s cubic-bezier(.22,1,.36,1);
        }
        #inventoryContent #btnAddProduct:hover { transform: translateY(-2px); box-shadow: var(--btn-green-shadow-hover); background: var(--btn-green-hover); }

        /* ════════ PRO TIP BANNER ════════ */
        #inventoryContent .gl-tip-banner {
            display: flex; align-items: center; gap: 14px; padding: 14px 20px;
            margin-bottom: 20px; border-radius: 14px;
            backdrop-filter: blur(14px) saturate(1.4);
            background: linear-gradient(135deg, rgba(203,223,189,0.35), rgba(168,201,156,0.2));
            border: 1.5px solid rgba(255,255,255,0.55);
            border-left: 4px solid #87B382;
            box-shadow: 0 4px 16px rgba(80,140,75,0.12);
            font-size: 13px; color: #3e5235;
            position: relative; z-index: 1;
        }
        #inventoryContent .gl-tip-banner strong { color: #2d4a22; font-size: 14px; }

        /* ════════ INVENTORY TABLE ════════ */
        #inventoryContent .gl-table-wrap {
            border-radius: 20px; overflow: hidden;
            backdrop-filter: blur(16px) saturate(1.5);
            -webkit-backdrop-filter: blur(16px) saturate(1.5);
            border: 1.5px solid rgba(255,255,255,0.55);
            box-shadow: var(--neo-float);
            background: rgba(255,255,255,0.5);
        }
        #inventoryContent .gl-inv-table { width: 100%; border-collapse: collapse; }
        #inventoryContent .gl-inv-table thead th {
            background: linear-gradient(135deg, rgba(203,223,189,0.7), rgba(168,201,156,0.55));
            color: #3e5235; padding: 18px 15px; text-align: center;
            font-weight: 800; font-size: 11px; letter-spacing: 1.2px; text-transform: uppercase;
            border-bottom: 1px solid rgba(255,255,255,0.6);
        }
        #inventoryContent .gl-inv-table thead th:first-child { text-align: left; }
        #inventoryContent .gl-inv-table tbody td {
            padding: 18px 15px; text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.5);
            transition: background .2s ease;
        }
        #inventoryContent .gl-inv-table tbody td:first-child { text-align: left; }
        #inventoryContent .gl-inv-table tbody tr:last-child td { border-bottom: none; }
        #inventoryContent .gl-inv-table tbody tr:hover td { background: rgba(203,223,189,0.18); }
        #inventoryContent .gl-inv-table .low-stock-row td   { background: rgba(246,244,210,0.5) !important; border-left: 4px solid #d4a726; }
        #inventoryContent .gl-inv-table .out-stock-row td   { background: rgba(241,156,121,0.15) !important; border-left: 4px solid #a44a3f; }

        /* ════════ QTY CONTROLS ════════ */
        #inventoryContent .btn-qty-modern {
            width: 36px; height: 36px;
            background: var(--btn-green-bg);
            color: var(--btn-green-text); border: none;
            border-radius: 8px; cursor: pointer; font-weight: 800;
            font-size: 18px; transition: all .2s ease;
            box-shadow: var(--btn-green-shadow);
        }
        #inventoryContent .btn-qty-modern:hover { transform: scale(1.12); box-shadow: var(--btn-green-shadow-hover); background: var(--btn-green-hover); }
        #inventoryContent .qty-input-modern {
            padding: 10px; text-align: center;
            border: 1.5px solid rgba(135,179,130,0.4); border-radius: 8px;
            font-weight: 800; font-size: 16px;
            background: rgba(255,255,255,0.55); backdrop-filter: blur(6px);
            transition: all .3s ease;
        }
        #inventoryContent .qty-input-modern:focus {
            outline: none; border-color: #87B382 !important;
            box-shadow: 0 0 0 4px rgba(135,179,130,0.2);
        }

        /* ════════ DELETE BUTTON ════════ */
        #inventoryContent .btn-delete-modern {
            padding: 10px 16px; background: var(--btn-red-bg);
            color: var(--btn-red-text); border: none;
            border-radius: 8px; cursor: pointer; font-size: 16px;
            transition: all .2s ease;
            box-shadow: var(--btn-red-shadow);
        }
        #inventoryContent .btn-delete-modern:hover { transform: translateY(-2px); box-shadow: var(--btn-red-shadow-hover); background: var(--btn-red-hover); }

        /* ════════ BACK BUTTON ════════ */
        #inventoryContent #btnBackToCategories {
            padding: 12px 24px;
            background: linear-gradient(135deg, rgba(203,223,189,0.6), rgba(168,201,156,0.45));
            color: #2d5238; border: 1.5px solid rgba(255,255,255,0.65);
            border-radius: 14px; cursor: pointer; font-weight: 800; font-size: 14px;
            transition: all .3s cubic-bezier(.22,1,.36,1); backdrop-filter: blur(10px);
            box-shadow: 0 4px 14px rgba(80,140,75,0.18), 0 -1px 0 rgba(255,255,255,0.8) inset;
        }
        #inventoryContent #btnBackToCategories:hover {
            transform: translateY(-3px) scale(1.01);
            box-shadow: 0 8px 24px rgba(80,140,75,0.28), 0 -1px 0 rgba(255,255,255,0.9) inset;
        }

        /* ════════ MOBILE CARDS ════════ */
        #inventoryContent .gl-inv-card {
            border-radius: 18px; padding: 16px 18px; margin-bottom: 14px;
            backdrop-filter: blur(16px) saturate(1.5);
            -webkit-backdrop-filter: blur(16px) saturate(1.5);
            border: 1.5px solid rgba(255,255,255,0.55);
            box-shadow: var(--neo-float);
            background: rgba(255,255,255,0.45);
            position: relative; overflow: hidden;
            transition: transform .3s ease, box-shadow .3s ease;
        }
        #inventoryContent .gl-inv-card::before {
            content: ''; position: absolute; inset: 0; border-radius: 18px;
            background: linear-gradient(135deg, rgba(255,255,255,0.38) 0%, transparent 55%);
            pointer-events: none;
        }
        #inventoryContent .gl-inv-card:hover { transform: translateY(-4px); box-shadow: var(--neo-float-hover); }
        #inventoryContent .gl-inv-card.is-out { border-left: 4px solid #a44a3f !important; background: rgba(241,156,121,0.12) !important; }
        #inventoryContent .gl-inv-card.is-low { border-left: 4px solid #d4a726 !important; background: rgba(246,244,210,0.3) !important; }
        #inventoryContent .gl-card-name {
            font-weight: 800; font-size: 16px; color: #2d3a2d;
            margin-bottom: 12px; padding-bottom: 10px;
            border-bottom: 1px solid rgba(255,255,255,0.7);
            position: relative; z-index: 1;
        }
        #inventoryContent .gl-card-prices {
            display: grid; grid-template-columns: 1fr 1fr 1fr;
            gap: 0; margin-bottom: 12px; border-radius: 12px;
            overflow: hidden; border: 1px solid rgba(255,255,255,0.6);
            position: relative; z-index: 1;
            backdrop-filter: blur(6px);
        }
        #inventoryContent .gl-price-cell {
            padding: 9px 8px; text-align: center;
            border-right: 1px solid rgba(255,255,255,0.6);
        }
        #inventoryContent .gl-price-cell:last-child { border-right: none; }
        #inventoryContent .gl-price-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #7a9070; margin-bottom: 3px; }
        #inventoryContent .gl-price-value { font-size: 14px; font-weight: 800; }
        #inventoryContent .gl-card-qty {
            display: flex; align-items: center; justify-content: center; gap: 10px;
            position: relative; z-index: 1;
        }

        /* ════════ EMPTY STATE ════════ */
        #inventoryContent .gl-empty-state {
            border-radius: 20px; padding: 60px;
            text-align: center;
            backdrop-filter: blur(16px) saturate(1.4);
            background: rgba(255,255,255,0.4);
            border: 1.5px solid rgba(255,255,255,0.55);
            box-shadow: var(--neo-float);
        }
        #inventoryContent .gl-empty-title { color: #7a9070; font-size: 1.4rem; margin-bottom: 8px; font-weight: 800; }
        #inventoryContent .gl-empty-sub   { color: #a0b8a0; font-size: 15px; margin: 0; }
        /* ════════ PREVENT STYLE TAG LEAKAGE ════════ */
        #inventoryContent style,
        #mainContent style {
            display: none !important;
        }

        /* ════════ MOBILE RESPONSIVE ════════ */
        @media(max-width:768px) {
            #inventoryContent .add-product-fields { display: flex !important; flex-direction: column !important; gap:14px !important; }
            #inventoryContent .add-product-field { width: 100% !important; }
            #inventoryContent .add-product-field input { height: 52px !important; font-size: 16px !important; }
            #inventoryContent #btnAddProduct { width: 100% !important; height: 52px !important; font-size: 15px !important; }
            #inventoryContent .gl-inv-stat { max-width: 100%; }
        }

        /* ════════ DARK MODE ════════ */
        body.dark-mode #inventoryContent {
            --neo-float:
                0 8px 32px rgba(0,0,0,0.5),
                0 2px 8px  rgba(0,0,0,0.3),
                0 -1px 0   rgba(255,255,255,0.06) inset,
                0 1px 0    rgba(0,0,0,0.3) inset;
            --neo-float-hover:
                0 16px 48px rgba(0,0,0,0.6),
                0 4px 16px  rgba(0,0,0,0.35),
                0 -1px 0    rgba(255,255,255,0.06) inset;
        }
        body.dark-mode #inventoryContent .gl-inv-stat.si-beige { background: rgba(52,44,32,0.75) !important; border-color: rgba(200,180,140,0.18) !important; }
        body.dark-mode #inventoryContent .gl-inv-stat.si-amber  { background: rgba(50,42,18,0.72) !important; border-color: rgba(200,170,80,0.18) !important; }
        body.dark-mode #inventoryContent .gl-inv-stat.si-green  { background: rgba(35,55,32,0.72) !important; border-color: rgba(135,179,130,0.2) !important; }
        body.dark-mode #inventoryContent .gl-inv-stat.si-mint   { background: rgba(40,52,25,0.72) !important; border-color: rgba(180,200,100,0.18) !important; }
        body.dark-mode #inventoryContent .gl-inv-stat .si-label,
        body.dark-mode #inventoryContent .gl-inv-stat .si-value { color: #d8ecd4 !important; }
        body.dark-mode #inventoryContent .gl-cat-card { background: rgba(28,40,26,0.72) !important; border-color: rgba(135,179,130,0.18) !important; }
        body.dark-mode #inventoryContent .gl-cat-name  { color: #d8ecd4 !important; }
        body.dark-mode #inventoryContent .gl-cat-count { color: #6a8a66 !important; }
        body.dark-mode #inventoryContent .gl-cat-add { background: rgba(22,34,20,0.5) !important; border-color: rgba(135,179,130,0.2) !important; }
        body.dark-mode #inventoryContent .gl-cat-add:hover { background: rgba(35,55,32,0.6) !important; }
        body.dark-mode #inventoryContent .gl-cat-add-label,
        body.dark-mode #inventoryContent .gl-cat-add-sub { color: #87B382 !important; }
        body.dark-mode #inventoryContent .gl-mini-stat.ms-beige { background: rgba(52,44,32,0.7) !important; }
        body.dark-mode #inventoryContent .gl-mini-stat.ms-amber  { background: rgba(50,42,18,0.7) !important; }
        body.dark-mode #inventoryContent .gl-mini-stat.ms-red    { background: rgba(60,20,18,0.7) !important; }
        body.dark-mode #inventoryContent .gl-mini-stat.ms-green  { background: rgba(35,55,32,0.7) !important; }
        body.dark-mode #inventoryContent .gl-mini-stat .ms-label,
        body.dark-mode #inventoryContent .gl-mini-stat .ms-value { color: #d8ecd4 !important; }
        body.dark-mode #inventoryContent .gl-form-wrap { background: rgba(22,34,20,0.7) !important; border-color: rgba(135,179,130,0.15) !important; }
        body.dark-mode #inventoryContent .gl-form-title { color: #d8ecd4 !important; }
        body.dark-mode #inventoryContent .add-product-field label { color: #87B382 !important; }
        body.dark-mode #inventoryContent .add-product-field input { background: rgba(255,255,255,0.07) !important; color: #d8ecd4 !important; border-color: rgba(135,179,130,0.25) !important; caret-color: #a8c99c; }
        body.dark-mode #inventoryContent .add-product-field input::placeholder { color: #8aab85 !important; opacity: 0.85 !important; }
        body.dark-mode #inventoryContent #btnAddProduct { background: var(--btn-green-bg) !important; color: var(--btn-green-text) !important; border: none !important; }
        body.dark-mode #inventoryContent .gl-tip-banner { background: rgba(22,34,20,0.6) !important; border-color: rgba(135,179,130,0.2) !important; color: #87B382 !important; }
        body.dark-mode #inventoryContent .gl-table-wrap { background: rgba(22,34,20,0.7) !important; border-color: rgba(135,179,130,0.15) !important; }
        body.dark-mode #inventoryContent .gl-inv-table thead th { background: rgba(40,60,35,0.8) !important; color: #a8c99c !important; border-color: rgba(135,179,130,0.15) !important; }
        body.dark-mode #inventoryContent .gl-inv-table tbody td { border-color: rgba(135,179,130,0.1) !important; color: #d8ecd4 !important; }        body.dark-mode #inventoryContent .gl-inv-table tbody tr:hover td { background: rgba(80,120,75,0.15) !important; }
        body.dark-mode #inventoryContent .gl-inv-table tbody td strong { color: #e8fce4 !important; }
        body.dark-mode #inventoryContent .btn-delete-modern { background: var(--btn-red-bg) !important; color: var(--btn-red-text) !important; border: none !important; }
        body.dark-mode #inventoryContent #btnBackToCategories { background: rgba(35,55,32,0.7) !important; color: #87B382 !important; border-color: rgba(135,179,130,0.2) !important; }
        body.dark-mode #inventoryContent .qty-input-modern { background: rgba(255,255,255,0.06) !important; color: #d8ecd4 !important; border-color: rgba(135,179,130,0.2) !important; }
        body.dark-mode #inventoryContent .gl-inv-card { background: rgba(25,40,23,0.7) !important; border-color: rgba(135,179,130,0.15) !important; }
        body.dark-mode #inventoryContent .gl-inv-card.is-out { background: rgba(80,20,15,0.5) !important; }
        body.dark-mode #inventoryContent .gl-inv-card.is-low { background: rgba(80,60,5,0.4)  !important; }
        body.dark-mode #inventoryContent .gl-card-name  { color: #d8ecd4 !important; border-color: rgba(135,179,130,0.15) !important; }
        body.dark-mode #inventoryContent .gl-price-label { color: #6a8a66 !important; }
        body.dark-mode #inventoryContent .gl-card-prices { border-color: rgba(135,179,130,0.12) !important; }
        body.dark-mode #inventoryContent .gl-price-cell  { background: rgba(255,255,255,0.04) !important; border-color: rgba(135,179,130,0.12) !important; }
        body.dark-mode #inventoryContent .gl-empty-state { background: rgba(22,34,20,0.6) !important; border-color: rgba(135,179,130,0.15) !important; }
        body.dark-mode #inventoryContent .gl-empty-title { color: #6a8a66 !important; }
        body.dark-mode #inventoryContent .gl-empty-sub   { color: #4a6050 !important; }
        body.dark-mode #inventoryContent .cat-btn-edit   { background: var(--btn-green-bg) !important; color: var(--btn-green-text) !important; border: none !important; }
        body.dark-mode #inventoryContent .cat-btn-delete { background: var(--btn-red-bg) !important; color: var(--btn-red-text) !important; border: none !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(s);
})();

// ─── Dialog styles ────────────────────────────────────────────────────────────
(function injectModernDialogStyles() {
    if (document.getElementById('modern-dialog-override-styles')) return;
    const style = document.createElement('style');
    style.id = 'modern-dialog-override-styles';
    style.textContent = `
        #customDialogOverlay{position:fixed!important;top:0!important;left:0!important;right:0!important;bottom:0!important;background:rgba(0,0,0,0.5)!important;backdrop-filter:blur(12px)!important;display:none!important;justify-content:center!important;align-items:center!important;z-index:20000!important;}
        #customDialogOverlay.active{display:flex!important;}
        #customDialogOverlay .dialog-box{background:linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,255,255,0.9))!important;border-radius:28px!important;padding:45px 40px 40px!important;width:90%!important;max-width:450px!important;box-shadow:0 30px 80px rgba(0,0,0,0.25)!important;text-align:center!important;position:relative!important;overflow:hidden!important;}
        #customDialogOverlay .dialog-btn{width:100%!important;padding:18px 28px!important;border:none!important;border-radius:16px!important;font-weight:800!important;font-size:16px!important;cursor:pointer!important;}
        #customDialogOverlay .dialog-btn-primary{background:var(--btn-green-bg)!important;color:var(--btn-green-text)!important;}
    `;
    document.head.appendChild(style);
})();

// =============================================================================
let selectedCategory = null;

if (typeof window.CATEGORIES === 'undefined') {
    window.CATEGORIES = [
        { id:'beverages',           name:'Beverages',                    icon:'🥤', color:'linear-gradient(135deg,#e3b04b 0%,#d19a3d 100%)' },
        { id:'school',              name:'School Supplies',               icon:'📚', color:'linear-gradient(135deg,#d48c2e 0%,#ba7a26 100%)' },
        { id:'snacks',              name:'Snacks',                        icon:'🍿', color:'linear-gradient(135deg,#a44a3f 0%,#934635 100%)' },
        { id:'foods',               name:'Whole Foods',                   icon:'🍚', color:'linear-gradient(135deg,#967751 0%,#92784f 100%)' },
        { id:'bath',                name:'Bath, Hygiene & Laundry Soaps', icon:'🧼', color:'linear-gradient(135deg,#f3c291 0%,#e5b382 100%)' },
        { id:'wholesale_beverages', name:'Wholesale Beverages',           icon:'📦', color:'linear-gradient(135deg,#cc8451 0%,#b87545 100%)' },
        { id:'liquor',              name:'Hard Liquors',                  icon:'🍺', color:'linear-gradient(135deg,#e2e8b0 0%,#ced49d 100%)' },
    ];
}
var CATEGORIES = window.CATEGORIES;

function calculateMargin(cost, price) { return cost === 0 ? 0 : ((price - cost) / cost) * 100; }

function calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase(), s2 = str2.toLowerCase();
    if (s1 === s2) return 100;
    if (s1.includes(s2) || s2.includes(s1)) return 85;
    const longer  = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 100;
    return ((longer.length - getEditDistance(shorter, longer)) / longer.length) * 100;
}

function getEditDistance(s1, s2) {
    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0) { costs[j] = j; }
            else if (j > 0) {
                let newValue = costs[j - 1];
                if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                    newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                costs[j - 1] = lastValue;
                lastValue = newValue;
            }
        }
        if (i > 0) costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

// =============================================================================
window.renderInventory = async function () {
    const content = document.getElementById('inventoryContent');
    if (!content) { console.error('❌ inventoryContent not found!'); return; }

    // Allow external navigation (e.g. from notifications) to set the category
    if (window._navToCategory) {
        selectedCategory = window._navToCategory;
        window._navToCategory = null;
    }

    content.innerHTML = `
        <div style="text-align:center;padding:40px;">
            <div style="font-size:48px;animation:spin 1s linear infinite;">⏳</div>
            <p style="color:#666;margin-top:10px;">Loading inventory...</p>
        </div>
    `;

    try {
        if (typeof DB.getCategories === 'function') {
            const freshCats = await DB.getCategories();
            if (freshCats && freshCats.length) { window.CATEGORIES = freshCats; CATEGORIES = freshCats; }
        }
        if (!selectedCategory) {
            await renderCategorySelection(content);
        } else {
            await renderCategoryInventory(content, selectedCategory);
        }
    } catch (error) {
        console.error('❌ Error rendering inventory:', error);
        content.innerHTML = `
            <div style="text-align:center;padding:40px;border-radius:20px;backdrop-filter:blur(16px);background:rgba(255,255,255,0.45);border:1.5px solid rgba(255,255,255,0.55);box-shadow:0 8px 32px rgba(80,140,75,0.18);">
                <h2 style="color:#7a2820;">⚠️ Error Loading Inventory</h2>
                <p style="color:#9E9382;">${error.message || 'An unexpected error occurred'}</p>
                <button onclick="window.renderInventory()" style="margin-top:20px;padding:12px 28px;background:linear-gradient(135deg,#cbdfbd,#a8c99c);color:#2d5238;border:none;border-radius:12px;cursor:pointer;font-weight:800;">Retry</button>
            </div>
        `;
    }
};

// =============================================================================
async function renderCategorySelection(content) {
    const products = await DB.getProducts();
    if (!Array.isArray(products)) throw new Error('Products data is not available');

    const lowStockLimit   = window.storeSettings?.lowStockLimit || 10;
    const totalProducts   = products.length;
    const totalLowStock   = products.filter(p => { const q=parseFloat(p.quantity||0); return q<lowStockLimit && q>0; }).length;
    const totalOutOfStock = products.filter(p => parseFloat(p.quantity||0) === 0).length;

    let html = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;margin-bottom:36px;">
            <div class="gl-inv-stat si-beige">
                <div class="si-icon" style="background:linear-gradient(135deg,#d4a373,#bc8c5b);">📦</div>
                <div class="si-body"><div class="si-label">Total Products</div><div class="si-value">${totalProducts}</div></div>
            </div>
            <div class="gl-inv-stat si-amber">
                <div class="si-icon" style="background:linear-gradient(135deg,#e6c86e,#d4b85c);">⚠️</div>
                <div class="si-body"><div class="si-label">Low Stock</div><div class="si-value">${totalLowStock}</div></div>
            </div>
            <div class="gl-inv-stat si-green">
                <div class="si-icon" style="background:linear-gradient(135deg,#5a9e6f,#4a8c5f);">🚫</div>
                <div class="si-body"><div class="si-label">Out of Stock</div><div class="si-value">${totalOutOfStock}</div></div>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;margin-bottom:30px;">
    `;

    CATEGORIES.forEach(cat => {
        const count = products.filter(p => (p.category||p.category_id) === cat.id).length;
        html += `
            <div class="gl-cat-card" data-category="${cat.id}">
                <div class="cat-manage-btns" onclick="event.stopPropagation()">
                    <button class="cat-btn-edit"   data-cat-pk="${cat.pk||''}" title="Edit">✏️</button>
                    <button class="cat-btn-delete" data-cat-pk="${cat.pk||''}" data-cat-id="${cat.id}" data-cat-name="${encodeURIComponent(cat.name)}" title="Delete">🗑️</button>
                </div>
                <div class="gl-cat-inner">
                    <div class="gl-cat-icon-box" style="background:${cat.color};">${cat.icon}</div>
                    <div class="gl-cat-text">
                        <div class="gl-cat-name">${cat.name}</div>
                        <div class="gl-cat-count">${count} product${count===1?'':'s'}</div>
                    </div>
                    <div class="gl-cat-arrow">→</div>
                </div>
            </div>
        `;
    });

    html += `
            <div class="gl-cat-add" id="btnAddCategory">
                <div style="font-size:36px;">➕</div>
                <div class="gl-cat-add-label">Add Category</div>
                <div class="gl-cat-add-sub">Create a custom category</div>
            </div>
        </div>
    `;

    content.innerHTML = html;

    content.querySelectorAll('.gl-cat-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.cat-manage-btns')) return;
            selectedCategory = this.getAttribute('data-category');
            window.renderInventory();
        });
    });
    content.querySelectorAll('.cat-btn-edit').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const pk  = this.getAttribute('data-cat-pk');
            const cat = CATEGORIES.find(c => String(c.pk) === String(pk));
            if (cat) showEditCategoryModal(cat);
        });
    });
    content.querySelectorAll('.cat-btn-delete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            showDeleteCategoryModal(this.getAttribute('data-cat-pk'), this.getAttribute('data-cat-id'), decodeURIComponent(this.getAttribute('data-cat-name')));
        });
    });
    document.getElementById('btnAddCategory')?.addEventListener('click', () => showAddCategoryModal());
}

// =============================================================================
async function renderCategoryInventory(content, categoryId) {
    const isMobile = window.matchMedia('(max-width: 768px)').matches || window.innerWidth <= 768;
    const category = CATEGORIES.find(c => c.id === categoryId);
    if (!category) { selectedCategory = null; await window.renderInventory(); return; }

    const allProducts = await DB.getProducts();
    if (!Array.isArray(allProducts)) throw new Error('Products data is not available');

    const products      = allProducts.filter(p => (p.category||p.category_id) === categoryId);
    const lowStockLimit = window.storeSettings?.lowStockLimit || 10;
    const totalItems    = products.length;
    const lowStock      = products.filter(p => { const q=parseFloat(p.quantity||0); return q<lowStockLimit&&q>0; }).length;
    const outOfStock    = products.filter(p => parseFloat(p.quantity||0) === 0).length;
    const totalValue    = products.reduce((s,p) => s+(parseFloat(p.cost||0)*parseFloat(p.quantity||0)), 0);

   let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px;flex-wrap:wrap;gap:15px;">
            <div>
                <h2 style="color:#2d3a2d;margin:0;font-size:1.8rem;font-weight:900;">${category.icon} ${category.name}</h2>
                <p style="color:#7a9070;margin:5px 0 0;font-size:14px;font-weight:600;">Manage products in this category</p>
            </div>
            <button id="btnBackToCategories">← Back to Categories</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px;">
            <div class="gl-mini-stat ms-beige"><span class="ms-icon">📦</span><div class="ms-body"><div class="ms-label">Total Items</div><div class="ms-value">${totalItems}</div></div></div>
            <div class="gl-mini-stat ms-amber"><span class="ms-icon">⚠️</span><div class="ms-body"><div class="ms-label">Low Stock</div><div class="ms-value">${lowStock}</div></div></div>
            <div class="gl-mini-stat ms-red"  ><span class="ms-icon">🚫</span><div class="ms-body"><div class="ms-label">Out of Stock</div><div class="ms-value">${outOfStock}</div></div></div>
            <div class="gl-mini-stat ms-green"><span class="ms-icon">💰</span><div class="ms-body"><div class="ms-label">Stock Value</div><div class="ms-value">₱${totalValue.toFixed(2)}</div></div></div>
        </div>

        <div class="gl-form-wrap">
            <div class="gl-form-title">➕ Add New Product</div>
            <div class="add-product-fields" ${isMobile?'style="display:flex;flex-direction:column;gap:14px;"':''}>
                <div class="add-product-field"><label>Product Name</label><input type="text" id="newProductName" placeholder="e.g. Surf Powder 50g"></div>
                <div class="add-product-field"><label>Cost (₱)</label><input type="number" id="newProductCost" placeholder="0.00" step="0.01"></div>
                <div class="add-product-field"><label>Price (₱)</label><input type="number" id="newProductPrice" placeholder="0.00" step="0.01"></div>
                <div class="add-product-field"><label>Qty</label><input type="number" id="newProductQty" placeholder="0"></div>
                <button id="btnAddProduct">➕ Add</button>
            </div>
        </div>

        <div class="gl-tip-banner">
            <span style="font-size:26px;">💡</span>
            <div><strong>Pro Tip:</strong> Use the +/- buttons for quick adjustments or type directly into the quantity field. Changes save automatically!</div>
        </div>

        <div id="inventoryProductsContainer">
    `;

    if (!products || products.length === 0) {
        html += `
            <div class="gl-empty-state">
                <div style="font-size:72px;margin-bottom:18px;opacity:0.3;">${category.icon}</div>
                <h3 class="gl-empty-title">No products yet</h3>
                <p class="gl-empty-sub">Add your first product using the form above!</p>
            </div>
        `;
    } else {
        const sorted = [...products].sort((a,b) => (a.name||'').toLowerCase().localeCompare((b.name||'').toLowerCase()));

        if (isMobile) {
            html += '<div>';
            sorted.forEach(p => {
                if (!p) return;
                const cost=parseFloat(p.cost||0), price=parseFloat(p.price||0), qty=parseFloat(p.quantity||0);
                const isOut=qty===0, isLow=!isOut&&qty<lowStockLimit;
                html += `
                    <div class="gl-inv-card ${isOut?'is-out':isLow?'is-low':''}" data-product-id="${p.id}">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:8px;position:relative;z-index:1;">
                            <span class="gl-card-name" style="margin-bottom:0;padding-bottom:0;border-bottom:none;flex:1;">${p.name||'Unnamed Product'}</span>
                            <button class="btn-delete-modern" data-product-id="${p.id}" style="flex-shrink:0;">🗑️</button>
                        </div>
                        <div class="gl-card-prices" style="margin-bottom:12px;">
                            <div class="gl-price-cell" style="background:rgba(241,156,121,0.2);">
                                <div class="gl-price-label">Cost</div>
                                <div class="gl-price-value" style="color:#a44a3f;">₱${cost.toFixed(2)}</div>
                            </div>
                            <div class="gl-price-cell" style="background:rgba(90,122,94,0.12);">
                                <div class="gl-price-label">Price</div>
                                <div class="gl-price-value" style="color:#3e6e48;">₱${price.toFixed(2)}</div>
                            </div>
                            <div class="gl-price-cell" style="background:rgba(90,122,94,0.07);">
                                <div class="gl-price-label">Value</div>
                                <div class="gl-price-value" style="color:#3e6e48;">₱${(cost*qty).toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="gl-card-qty">
                            <button class="btn-qty-modern" data-product-id="${p.id}" data-action="decrease">−</button>
                            <input type="number" class="qty-input-modern" value="${qty}" data-product-id="${p.id}" style="width:72px;">
                            <button class="btn-qty-modern" data-product-id="${p.id}" data-action="increase">+</button>
                            ${isOut?'<span style="font-size:11px;font-weight:700;color:#a44a3f;background:rgba(164,74,63,0.15);padding:3px 8px;border-radius:20px;border:1px solid rgba(164,74,63,0.2);">OUT</span>':''}
                            ${isLow&&!isOut?'<span style="font-size:11px;font-weight:700;color:#d4a726;background:rgba(212,167,38,0.15);padding:3px 8px;border-radius:20px;border:1px solid rgba(212,167,38,0.2);">LOW</span>':''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += `<div class="gl-table-wrap"><table class="gl-inv-table"><thead><tr>
                <th>PRODUCT NAME</th><th>COST PRICE</th><th>SELLING PRICE</th>
                <th>QUANTITY</th><th>STOCK VALUE</th><th>ACTIONS</th>
            </tr></thead><tbody>`;
            sorted.forEach(p => {
                if (!p) return;
                const cost=parseFloat(p.cost||0), price=parseFloat(p.price||0), qty=parseFloat(p.quantity||0);
                const rowCls = qty===0?'out-stock-row':qty<lowStockLimit?'low-stock-row':'';
                html += `
                    <tr class="${rowCls}" data-product-id="${p.id}">
                        <td><strong style="font-size:15px;font-weight:700;color:#2d3a2d;">${p.name||'Unnamed Product'}</strong></td>
                        <td><span style="font-size:15px;font-weight:700;color:#a44a3f;">₱${cost.toFixed(2)}</span></td>
                        <td><span style="font-size:15px;font-weight:700;color:#3e6e48;">₱${price.toFixed(2)}</span></td>
                        <td>
                            <div style="display:flex;align-items:center;justify-content:center;gap:8px;">
                                <button class="btn-qty-modern" data-product-id="${p.id}" data-action="decrease">−</button>
                                <input type="number" class="qty-input-modern" value="${qty}" data-product-id="${p.id}" style="width:80px;">
                                <button class="btn-qty-modern" data-product-id="${p.id}" data-action="increase">+</button>
                            </div>
                        </td>
                        <td><span style="font-size:15px;font-weight:700;color:#3e6e48;">₱${(cost*qty).toFixed(2)}</span></td>
                        <td><button class="btn-delete-modern" data-product-id="${p.id}">🗑️</button></td>
                    </tr>
                `;
            });
            html += '</tbody></table></div>';
        }
    }

    html += '</div>';
    content.innerHTML = html;
    setupInventoryEventListeners(categoryId);
}

// =============================================================================
function setupInventoryEventListeners(categoryId) {
    document.getElementById('btnBackToCategories')?.addEventListener('click', () => {
        selectedCategory = null; window.renderInventory();
    });
    document.getElementById('btnAddProduct')?.addEventListener('click', () => addNewProduct(categoryId));
    document.getElementById('newProductName')?.addEventListener('input', function() {
        const btn = document.getElementById('btnAddProduct');
        if (btn) { btn.textContent = '➕ Add'; btn.setAttribute('data-edit-mode','false'); }
        window.editingProductId = null;
    });
    document.querySelectorAll('.qty-input-modern').forEach(input => {
        input.addEventListener('change', function() { updateQuantity(String(this.getAttribute('data-product-id')), this.value); });
    });
    document.querySelectorAll('.btn-qty-modern').forEach(btn => {
        btn.addEventListener('click', async function() {
            const productId = String(this.getAttribute('data-product-id'));
            const action    = this.getAttribute('data-action');
            const products  = await DB.getProducts();
            const product   = products.find(p => p.id === productId);
            if (product) {
                const qty = parseFloat(product.quantity||0);
                if (action==='decrease'&&qty>0) await updateQuantity(productId, qty-1);
                else if (action==='increase')   await updateQuantity(productId, qty+1);
            }
        });
    });
    document.querySelectorAll('.btn-delete-modern').forEach(btn => {
        btn.addEventListener('click', function() { deleteProduct(String(this.getAttribute('data-product-id'))); });
    });
    ['newProductName','newProductCost','newProductPrice','newProductQty'].forEach(id => {
        document.getElementById(id)?.addEventListener('keypress', e => { if (e.key==='Enter') addNewProduct(categoryId); });
    });
}

window.handleSearchResultSelect = function(productId, productName, cost, price, quantity) {
    document.getElementById('newProductName').value  = productName;
    document.getElementById('newProductCost').value  = cost;
    document.getElementById('newProductPrice').value = price;
    document.getElementById('newProductQty').value   = quantity;
    const btn = document.getElementById('btnAddProduct');
    if (btn) { btn.textContent = `✎ Update "${productName}"`; btn.setAttribute('data-edit-mode','true'); }
    window.editingProductId = productId;
    ['inventorySearchInput','inventorySearchDropdown','clearInventorySearch'].forEach(id => {
        const el = document.getElementById(id); if (el) { if (id==='inventorySearchInput') el.value=''; else el.style.display='none'; }
    });
    document.getElementById('newProductName').focus();
    document.getElementById('newProductName').scrollIntoView({ behavior:'smooth', block:'center' });
};

// =============================================================================
async function addNewProduct(categoryId) {
    const name     = document.getElementById('newProductName').value.trim();
    const cost     = parseFloat(document.getElementById('newProductCost').value);
    const price    = parseFloat(document.getElementById('newProductPrice').value);
    const quantity = parseInt(document.getElementById('newProductQty').value);
    const btn      = document.getElementById('btnAddProduct');
    const editMode = btn.getAttribute('data-edit-mode') === 'true';
    const editingProductId = window.editingProductId;

    if (!name)                           { showModernAlert('Please enter a product name!',         '📝'); document.getElementById('newProductName').focus();  return; }
    // ── Duplicate name check (case-insensitive, within same category) ──
try {
    const allExisting = await DB.getProducts();
    const duplicate = allExisting.find(p => {
        if ((p.category || p.category_id) !== categoryId) return false;
        if (editMode && editingProductId && String(p.id) === String(editingProductId)) return false;
        return (p.name || '').trim().toLowerCase() === name.toLowerCase();
    });
    if (duplicate) {
        showModernAlert(`"${duplicate.name}" already exists in this category!`, '⚠️');
        const nameInput = document.getElementById('newProductName');
        nameInput.focus();
        nameInput.select();
        nameInput.style.borderColor = '#EF4444';
        nameInput.style.boxShadow   = '0 0 0 4px rgba(239,68,68,0.2)';
        setTimeout(() => {
            nameInput.style.borderColor = '';
            nameInput.style.boxShadow   = '';
        }, 2500);
        return;
    }
} catch (dupErr) {
    console.warn('Duplicate check failed:', dupErr);
}

    if (isNaN(cost)   || cost < 0)       { showModernAlert('Please enter a valid cost price!',     '💰'); document.getElementById('newProductCost').focus();  return; }
    if (isNaN(price)  || price < 0)      { showModernAlert('Please enter a valid selling price!',  '🏷️'); document.getElementById('newProductPrice').focus(); return; }
    if (isNaN(quantity) || quantity < 0) { showModernAlert('Please enter a valid quantity!',       '📦'); document.getElementById('newProductQty').focus();   return; }

    if (price < cost) {
        const ok = window.DialogSystem
            ? await DialogSystem.confirm('⚠️ Selling price is below cost — you will lose money on each sale. Continue anyway?','⚠️')
            : confirm('⚠️ Selling price is below cost. Continue?');
        if (!ok) return;
    } else {
        const margin    = calculateMargin(cost, price);
        const minMargin = window.storeSettings?.profitMargin || 20;
        if (margin < minMargin) {
            const recommended = (cost * (1 + minMargin / 100)).toFixed(2);
            await showModernWarningDialog({
                title: 'Profit Margin Too Low!', icon: '⚠️',
                details: [
                    { label:'Current margin',    value:`${margin.toFixed(1)}%`,        color:'#DC2626' },
                    { label:'Profit per unit',   value:`₱${(price-cost).toFixed(2)}`,  color:'#DC2626' },
                    { label:'Required margin',   value:`${minMargin}%`,                 color:'#059669' },
                    { label:'Recommended price', value:`₱${recommended}`,              color:'#059669' },
                ],
                message:`Your store requires a minimum ${minMargin}% profit margin. Please adjust the price to at least ₱${recommended}.`
            });
            document.getElementById('newProductPrice').focus();
            document.getElementById('newProductPrice').select();
            return;
        }
    }

    try {
        if (editMode && editingProductId) {
            await DB.updateProduct(editingProductId, { name, cost, price, quantity });
            showModernAlert(`✅ "${name}" updated!`, '✅');
        } else {
            await DB.addProduct({ name, cost, price, quantity, category: categoryId });
            showModernAlert(`✅ "${name}" added!`, '✅');
        }
        ['newProductName','newProductCost','newProductPrice','newProductQty'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        if (btn) { btn.textContent = '➕ Add'; btn.setAttribute('data-edit-mode','false'); }
        window.editingProductId = null;
        document.getElementById('newProductName')?.focus();
        await window.renderInventory();
        if (typeof window.renderPriceList === 'function') await window.renderPriceList();
    } catch (error) {
        console.error('❌ Error adding product:', error);
        showModernAlert('Failed to add product. Please try again.', '❌');
    }
}

async function updateQuantity(id, newQty) {
    const quantity = parseInt(newQty);
    if (isNaN(quantity) || quantity < 0) { alert('⚠️ Invalid quantity!'); await window.renderInventory(); return; }
    try {
        const products = await DB.getProducts();
        const product  = products.find(p => String(p.id) === String(id));
        if (!product) { alert('⚠️ Product not found!'); return; }
        if (quantity === 0) {
            const ok = confirm(`⚠️ Set "${product.name}" to 0 units?\nThis marks it as out of stock.`);
            if (!ok) { await window.renderInventory(); return; }
        }
        await DB.updateProduct(id, { name:product.name, category:product.category||product.category_id, cost:product.cost, price:product.price, quantity });
        await window.renderInventory();
        if (typeof window.renderPriceList === 'function') await window.renderPriceList();
    } catch (error) {
        console.error('❌ Error updating quantity:', error);
        alert('❌ Failed to update quantity. Please try again.');
    }
}

async function deleteProduct(id) {
    try {
        const products = await DB.getProducts();
        const product  = products.find(p => String(p.id) === String(id));
        if (!product) { showModernAlert('Product not found!', '🔍'); return; }
        const qty    = parseFloat(product.quantity||0);
        const isDark = document.body.classList.contains('dark-mode');

        const cancelStyle = isDark
            ? 'flex:1;padding:14px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;background:rgba(50,30,28,0.9);color:#d08070;border:1px solid rgba(120,50,40,0.5);'
            : 'flex:1;padding:14px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;background:linear-gradient(135deg,#FEE2E2,#FECACA);color:#DC2626;border:1px solid #fca5a5;';

        const confirmDelete = await new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,${isDark?'0.75':'0.6'});backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:25000;`;
            overlay.innerHTML = `
                <div style="background:${isDark?'linear-gradient(135deg,#1c2120,#151a19)':'linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,248,243,0.96))'};border-radius:28px;padding:50px 40px;max-width:480px;width:90%;box-shadow:0 30px 80px rgba(0,0,0,0.3);animation:dlgSU 0.4s cubic-bezier(0.34,1.56,0.64,1);position:relative;overflow:hidden;">
                    <div style="position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#EF4444,#DC2626,#EF4444);"></div>
                    <div style="text-align:center;margin-bottom:24px;"><div style="width:90px;height:90px;margin:0 auto;border-radius:50%;background:linear-gradient(135deg,#FEE2E2,#FCA5A5);display:flex;align-items:center;justify-content:center;font-size:44px;">🗑️</div></div>
                    <h3 style="text-align:center;font-size:22px;font-weight:800;margin:0 0 14px 0;background:linear-gradient(135deg,#DC2626,#991B1B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Delete "${product.name}"?</h3>
                    <p style="text-align:center;font-size:14px;color:${isDark?'#888':'#9E9382'};margin:0 0 24px 0;">⚠️ This action cannot be undone.</p>
                    <div style="display:flex;gap:12px;">
                        <button id="cancelDelBtn" style="${cancelStyle}">Cancel</button>
                        <button id="confirmDelBtn" style="flex:1;padding:14px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;background:linear-gradient(135deg,#EF4444,#DC2626);color:white;border:none;box-shadow:0 6px 20px rgba(239,68,68,0.4);">Delete</button>
                    </div>
                    <style>@keyframes dlgSU{from{transform:translateY(40px) scale(0.9);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}</style>
                </div>`;
            document.body.appendChild(overlay);
            document.getElementById('cancelDelBtn').addEventListener('click',  () => { overlay.remove(); resolve(false); });
            document.getElementById('confirmDelBtn').addEventListener('click', () => { overlay.remove(); resolve(true);  });
            overlay.addEventListener('click', e => { if (e.target===overlay) { overlay.remove(); resolve(false); } });
        });
        if (!confirmDelete) return;

        if (qty > 0) {
            const confirmStock = await new Promise(resolve => {
                const overlay = document.createElement('div');
                overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,${isDark?'0.8':'0.65'});backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:25000;`;
                overlay.innerHTML = `
                    <div style="background:${isDark?'linear-gradient(135deg,#1c2120,#151a19)':'linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,248,243,0.96))'};border-radius:28px;padding:50px 40px;max-width:480px;width:90%;box-shadow:0 30px 80px rgba(0,0,0,0.3);animation:dlgSU2 0.4s cubic-bezier(0.34,1.56,0.64,1);position:relative;overflow:hidden;">
                        <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#DC2626,#EF4444,#DC2626);"></div>
                        <div style="text-align:center;margin-bottom:24px;"><div style="font-size:56px;">⚠️</div></div>
                        <h3 style="text-align:center;font-size:24px;font-weight:900;margin:0 0 14px 0;color:${isDark?'#ff6b6b':'#7F1D1D'};">FINAL WARNING!</h3>
                        <p style="text-align:center;font-size:15px;font-weight:600;color:#DC2626;margin:0 0 24px 0;">"${product.name}" still has <strong>${qty} units</strong> in stock.</p>
                        <div style="display:flex;gap:12px;">
                            <button id="cancelDelStk" style="${cancelStyle}">Go Back</button>
                            <button id="confirmDelStk" style="flex:1;padding:14px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;background:linear-gradient(135deg,#DC2626,#991B1B);color:white;border:none;">Delete Anyway</button>
                        </div>
                        <style>@keyframes dlgSU2{from{transform:translateY(40px) scale(0.9);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}</style>
                    </div>`;
                document.body.appendChild(overlay);
                document.getElementById('cancelDelStk').addEventListener('click',  () => { overlay.remove(); resolve(false); });
                document.getElementById('confirmDelStk').addEventListener('click', () => { overlay.remove(); resolve(true);  });
                overlay.addEventListener('click', e => { if (e.target===overlay) { overlay.remove(); resolve(false); } });
            });
            if (!confirmStock) return;
        }

        await DB.deleteProduct(id);
        showModernAlert(`"${product.name}" has been deleted.`, '✅');
        await window.renderInventory();
        if (typeof window.renderPriceList === 'function') await window.renderPriceList();
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        showModernAlert('Failed to delete product. Please try again.', '❌');
    }
}

// =============================================================================
//  CATEGORY MANAGEMENT MODALS
// =============================================================================

const EMOJI_LIST = [
    '🥤','🧃','☕','🍵','🍺','🍻','🥛','🍶','🍹','🧊',
    '🍚','🍞','🥚','🧈','🥩','🥦','🌽','🥕','🧄','🍅',
    '🍿','🍪','🍫','🍬','🍭','🍩','🧁','🎂','🍎','🍌',
    '🧼','🧴','🪥','🧻','🧹','💊','🩺','🪒','🧽','🫧',
    '📚','✏️','📐','📏','✂️','📎','📌','🖊️','📓','🎒',
    '📦','🛒','🏪','🏬','💰','🪙','💵','💳','🏷️','🧾',
    '🍾','🥃','🍷','🥂','🍸','🍴','🥄','🍽️','🫙','🥫',
    '🌿','🍃','🌱','🌾','🌸','🌻','🎋','🍀','🪴','🌵',
];

const PRESET_COLORS = [
    { label:'Gold',   value:'linear-gradient(135deg,#e3b04b 0%,#d19a3d 100%)' },
    { label:'Brown',  value:'linear-gradient(135deg,#d48c2e 0%,#ba7a26 100%)' },
    { label:'Red',    value:'linear-gradient(135deg,#a44a3f 0%,#934635 100%)' },
    { label:'Tan',    value:'linear-gradient(135deg,#967751 0%,#92784f 100%)' },
    { label:'Peach',  value:'linear-gradient(135deg,#f3c291 0%,#e5b382 100%)' },
    { label:'Copper', value:'linear-gradient(135deg,#cc8451 0%,#b87545 100%)' },
    { label:'Olive',  value:'linear-gradient(135deg,#e2e8b0 0%,#ced49d 100%)' },
    { label:'Green',  value:'linear-gradient(135deg,#a8c99c 0%,#8ab88a 100%)' },
    { label:'Teal',   value:'linear-gradient(135deg,#7bc4be 0%,#5da8a2 100%)' },
    { label:'Blue',   value:'linear-gradient(135deg,#7ba8c9 0%,#5d8aab 100%)' },
    { label:'Purple', value:'linear-gradient(135deg,#9a7bc4 0%,#7c5da8 100%)' },
    { label:'Pink',   value:'linear-gradient(135deg,#c97ba8 0%,#ab5d8a 100%)' },
];

function showCategoryModal({ title, icon='📦', name='', color='', submitLabel, onSubmit, editingName='' }) {
    const isDark = document.body.classList.contains('dark-mode');
    const _svg = typeof window.emojiToSVG === 'function' ? window.emojiToSVG : (e => e);
    const emojiButtons  = EMOJI_LIST.map(e => `<button type="button" data-emoji="${e}" class="ep-btn" style="padding:4px;border:none;cursor:pointer;border-radius:6px;font-size:20px;background:transparent;transition:all 0.15s ease;display:flex;align-items:center;justify-content:center;width:36px;height:36px;">${_svg(e)}</button>`).join('');
    const colorSwatches = PRESET_COLORS.map(c => `<button type="button" onclick="(function(b){document.getElementById('catColorInput').value='${encodeURIComponent(c.value)}';document.querySelectorAll('.cp-swatch').forEach(x=>{x.style.outline='none';x.style.transform='scale(1)'});b.style.outline='3px solid #3e5235';b.style.transform='scale(1.15)';})(this)" class="cp-swatch" title="${c.label}" style="height:30px;border-radius:8px;border:none;cursor:pointer;background:${c.value};transition:all 0.2s ease;${color===c.value?'outline:3px solid #3e5235;transform:scale(1.15);':''}"></button>`).join('');

    const overlay = document.createElement('div');
    overlay.id = 'catModalOverlay';
    overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,${isDark?'0.75':'0.62'});backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:30000;padding:16px;overflow-y:auto;`;
    overlay.innerHTML = `
        <div style="background:${isDark?'linear-gradient(135deg,#1e2420,#151a18)':'linear-gradient(135deg,rgba(255,255,255,0.98),rgba(250,252,248,0.96))'};border:${isDark?'1px solid #2e3d30':'none'};border-radius:24px;padding:32px;max-width:520px;width:100%;max-height:92vh;overflow-y:auto;box-shadow:0 30px 80px rgba(0,0,0,0.3);animation:cmIn 0.4s cubic-bezier(0.34,1.56,0.64,1);position:relative;">
            <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,#cbdfbd,#a8c99c,#d4e09b,#f3c291,#cbdfbd);border-radius:24px 24px 0 0;"></div>
            <h2 style="font-size:20px;font-weight:800;margin:0 0 22px 0;color:${isDark?'#e0f0e0':'#3e5235'};">${title}</h2>
            <div style="margin-bottom:18px;">
                <label style="display:block;margin-bottom:6px;font-weight:700;color:${isDark?'#b0c0b0':'#5D534A'};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Category Name *</label>
                <input id="catNameInput" type="text" value="${name}" placeholder="e.g. Frozen Goods" maxlength="80" autofocus style="width:100%;padding:12px 14px;border:2px solid ${isDark?'#3a4a40':'rgba(93,83,74,0.2)'};border-radius:10px;font-size:16px;font-weight:600;box-sizing:border-box;background:${isDark?'#1a2420':'white'};color:${isDark?'#e0e0e0':'#5D534A'};transition:all 0.3s ease;" onfocus="this.style.borderColor='#a8c99c'" onblur="this.style.borderColor='${isDark?'#3a4a40':'rgba(93,83,74,0.2)'}'">
            </div>
            <div style="margin-bottom:18px;">
                <label style="display:block;margin-bottom:8px;font-weight:700;color:${isDark?'#b0c0b0':'#5D534A'};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Icon</label>
                <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px;">
                    <div id="emojiPreview" data-no-emoji-svg="1" style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#cbdfbd,#a8c99c);display:flex;align-items:center;justify-content:center;font-size:32px;box-shadow:0 4px 12px rgba(0,0,0,0.12);">${_svg(icon)}</div>
                    <input id="catEmojiInput" type="hidden" value="${icon}">
                    <span style="font-size:12px;color:${isDark?'#888':'#9E9382'};">Pick an icon ↓</span>
                </div>
                <div data-no-emoji-svg="1" style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;padding:8px;border:1px solid ${isDark?'#2e3d38':'rgba(93,83,74,0.1)'};border-radius:12px;background:${isDark?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.5)'};max-height:160px;overflow-y:auto;">${emojiButtons}</div>
            </div>
            <div style="margin-bottom:22px;">
                <label style="display:block;margin-bottom:8px;font-weight:700;color:${isDark?'#b0c0b0':'#5D534A'};font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Card Color</label>
                <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-bottom:8px;">${colorSwatches}</div>
                <input type="hidden" id="catColorInput" value="${color?encodeURIComponent(color):''}">
                <button type="button" onclick="document.getElementById('catColorInput').value='';document.querySelectorAll('.cp-swatch').forEach(b=>{b.style.outline='none';b.style.transform='scale(1)'});" style="padding:5px 12px;border:none;background:${isDark?'rgba(255,255,255,0.07)':'rgba(93,83,74,0.08)'};border-radius:8px;cursor:pointer;font-size:12px;color:${isDark?'#a0a0a0':'#9E9382'};font-weight:600;">✕ Auto-assign color</button>
            </div>
            <div style="display:flex;gap:12px;">
                <button id="catModalCancel" style="flex:1;padding:14px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;background:${isDark?'rgba(50,30,28,0.9)':'linear-gradient(135deg,#FEE2E2,#FECACA)'};color:${isDark?'#d08070':'#DC2626'};border:1px solid ${isDark?'rgba(120,50,40,0.5)':'#fca5a5'};transition:all 0.2s ease;">Cancel</button>
                <button id="catModalSubmit" style="flex:2;padding:14px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;background:linear-gradient(135deg,${isDark?'#2e7d32':'#cbdfbd'},${isDark?'#388e3c':'#a8c99c'});color:${isDark?'#e8f5e9':'#3e5235'};border:${isDark?'1.5px solid #4caf50':'none'};box-shadow:0 4px 15px ${isDark?'rgba(46,125,50,0.4)':'rgba(203,223,189,0.4)'};transition:all 0.2s ease;">${submitLabel}</button>
            </div>
        </div>
        <style>
            @keyframes cmIn{from{transform:scale(0.88) translateY(30px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
            #catModalSubmit:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(203,223,189,0.5);}
            #catModalCancel:hover{filter:brightness(1.06);}
        </style>
    `;
    document.body.appendChild(overlay);
    document.getElementById('catModalCancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target===overlay) overlay.remove(); });

    // Wire emoji picker buttons — show SVG preview, store raw emoji
    const _svgFn = typeof window.emojiToSVG === 'function' ? window.emojiToSVG : (e => e);
    overlay.querySelectorAll('.ep-btn[data-emoji]').forEach(btn => {
        btn.addEventListener('click', function() {
            const emoji = this.getAttribute('data-emoji');
            document.getElementById('catEmojiInput').value = emoji;
            document.getElementById('emojiPreview').innerHTML = _svgFn(emoji);
            overlay.querySelectorAll('.ep-btn').forEach(x => x.style.background = 'transparent');
            this.style.background = 'rgba(203,223,189,0.45)';
        });
    });

    document.getElementById('catModalSubmit').addEventListener('click', async () => {
        const catName  = document.getElementById('catNameInput').value.trim();
        const catEmoji = document.getElementById('catEmojiInput').value.trim() || '📦';
        const rawColor = document.getElementById('catColorInput').value;
        const catColor = rawColor ? decodeURIComponent(rawColor) : 'linear-gradient(135deg,#e3b04b 0%,#d19a3d 100%)';

        if (!catName) { document.getElementById('catNameInput').style.borderColor='#EF4444'; document.getElementById('catNameInput').focus(); return; }
        const nameExists = CATEGORIES.some(c => c.name.trim().toLowerCase() === catName.toLowerCase() && c.name.trim().toLowerCase() !== editingName.trim().toLowerCase());
        if (nameExists) { document.getElementById('catNameInput').style.borderColor='#EF4444'; showModernAlert('A category with this name already exists.','⚠️'); return; }

        const submitBtn = document.getElementById('catModalSubmit');
        submitBtn.textContent = '⏳ Saving…'; submitBtn.disabled = true;
        try {
            await onSubmit({ name: catName, icon: catEmoji, color: catColor });
            overlay.remove();
            await window.renderInventory();
            if (typeof window.renderPriceList === 'function') await window.renderPriceList();
        } catch (err) {
            submitBtn.textContent = submitLabel; submitBtn.disabled = false;
            showModernAlert(`Error: ${err.message}`, '❌');
        }
    });
}

function showAddCategoryModal() {
    showCategoryModal({ title:'➕ New Category', icon:'📦', submitLabel:'➕ Add Category', onSubmit:({name,icon,color}) => DB.addCategory({name,icon,color}) });
}
function showEditCategoryModal(cat) {
    showCategoryModal({ title:`✏️ Edit "${cat.name}"`, icon:cat.icon, name:cat.name, color:cat.color, editingName:cat.name, submitLabel:'💾 Save Changes', onSubmit:({name,icon,color}) => DB.updateCategory(cat.pk,{name,icon,color}) });
}

async function showDeleteCategoryModal(pk, id, name) {
    const isDark       = document.body.classList.contains('dark-mode');
    const allProducts  = await DB.getProducts();
    const productCount = allProducts.filter(p => (p.category||p.category_id) === id).length;
    const otherCats    = CATEGORIES.filter(c => c.id !== id);

    const overlay = document.createElement('div');
    overlay.id = 'catDelOverlay';
    overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,${isDark?'0.78':'0.65'});backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;z-index:30000;padding:16px;`;

    let productHTML = '';
    if (productCount > 0) {
        const opts = otherCats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
        productHTML = `
            <div style="background:${isDark?'rgba(239,68,68,0.1)':'rgba(239,68,68,0.07)'};border:1px solid rgba(239,68,68,0.3);border-radius:14px;padding:16px;margin-bottom:20px;">
                <div style="font-size:14px;font-weight:700;color:${isDark?'#f87171':'#DC2626'};margin-bottom:14px;">⚠️ This category has <strong>${productCount} product${productCount!==1?'s':''}</strong>. What happens to them?</div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
                        <input type="radio" name="delAction" value="reassign" id="radioReassign" checked style="margin-top:3px;width:16px;height:16px;accent-color:#5a9e6f;">
                        <span style="font-size:14px;font-weight:600;color:${isDark?'#d0d0d0':'#5D534A'};">Move products to another category</span>
                    </label>
                    <div id="reassignSection" style="padding-left:26px;">
                        <select id="reassignTarget" style="width:100%;padding:9px;border:2px solid ${isDark?'#3a4a40':'rgba(93,83,74,0.2)'};border-radius:10px;font-size:14px;font-weight:600;background:${isDark?'#1a2420':'white'};color:${isDark?'#e0e0e0':'#5D534A'};">${opts}</select>
                    </div>
                    <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;">
                        <input type="radio" name="delAction" value="delete" id="radioDeleteProds" style="margin-top:3px;width:16px;height:16px;accent-color:#DC2626;">
                        <span style="font-size:14px;font-weight:600;color:${isDark?'#d0d0d0':'#5D534A'};">Permanently delete all products in this category</span>
                    </label>
                </div>
            </div>`;
    }

    const cancelStyle = isDark
        ? 'flex:1;padding:14px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;background:rgba(50,30,28,0.9);color:#d08070;border:1px solid rgba(120,50,40,0.5);'
        : 'flex:1;padding:14px;border-radius:12px;font-weight:700;font-size:14px;cursor:pointer;background:linear-gradient(135deg,#FEE2E2,#FECACA);color:#DC2626;border:1px solid #fca5a5;';

    overlay.innerHTML = `
        <div style="background:${isDark?'linear-gradient(135deg,#1c2120,#151a19)':'linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,248,243,0.96))'};border:${isDark?'1px solid #2e3d38':'none'};border-radius:24px;padding:32px;max-width:480px;width:100%;box-shadow:0 30px 80px rgba(0,0,0,0.3);animation:cdIn 0.4s cubic-bezier(0.34,1.56,0.64,1);position:relative;overflow:hidden;">
            <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,#EF4444,#DC2626,#EF4444);border-radius:24px 24px 0 0;"></div>
            <div style="text-align:center;margin-bottom:20px;">
                <div style="font-size:52px;margin-bottom:10px;">🗑️</div>
                <h3 style="font-size:20px;font-weight:800;margin:0 0 6px 0;background:linear-gradient(135deg,#DC2626,#991B1B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Delete "${name}"?</h3>
                <p style="font-size:13px;color:${isDark?'#888':'#9E9382'};margin:0;">This action cannot be undone.</p>
            </div>
            ${productHTML}
            <div style="display:flex;gap:12px;">
                <button id="catDelCancel" style="${cancelStyle}">Cancel</button>
                <button id="catDelConfirm" style="flex:2;padding:14px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;background:linear-gradient(135deg,#EF4444,#DC2626);color:white;border:none;box-shadow:0 4px 15px rgba(239,68,68,0.4);">🗑️ Delete Category</button>
            </div>
        </div>
        <style>@keyframes cdIn{from{transform:scale(0.88) translateY(30px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}</style>
    `;
    document.body.appendChild(overlay);

    if (productCount > 0) {
        document.querySelectorAll('input[name="delAction"]').forEach(r => {
            r.addEventListener('change', () => {
                const rs = document.getElementById('reassignSection');
                if (rs) rs.style.display = r.value==='reassign' ? 'block' : 'none';
            });
        });
    }
    document.getElementById('catDelCancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target===overlay) overlay.remove(); });

    document.getElementById('catDelConfirm').addEventListener('click', async () => {
        const btn = document.getElementById('catDelConfirm');
        btn.textContent = '⏳ Deleting…'; btn.disabled = true;
        try {
            let reassignTo=null, deleteProds=false;
            if (productCount > 0) {
                const action = document.querySelector('input[name="delAction"]:checked')?.value;
                if (action==='reassign') reassignTo = document.getElementById('reassignTarget')?.value||null;
                else deleteProds = true;
            }
            await DB.deleteCategory(pk, reassignTo, deleteProds);
            overlay.remove();
            if (selectedCategory===id) selectedCategory=null;
            await window.renderInventory();
            if (typeof window.renderPriceList==='function') await window.renderPriceList();
            showModernAlert(`Category "${name}" deleted.`, '✅');
        } catch (err) {
            btn.textContent='🗑️ Delete Category'; btn.disabled=false;
            showModernAlert(`Error: ${err.message}`, '❌');
        }
    });
}

// =============================================================================
function showModernAlert(message, icon='✅') {
    document.getElementById('modernAlertOverlay')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'modernAlertOverlay';
    overlay.innerHTML = `
        <div class="modern-alert-box">
            <div class="modern-alert-shimmer"></div>
            <div class="modern-alert-icon-wrapper"><span>${icon}</span></div>
            <h3 class="modern-alert-title">Notice</h3>
            <div class="modern-alert-message">${message}</div>
            <button class="modern-alert-btn" onclick="document.getElementById('modernAlertOverlay').remove()">Got it!</button>
        </div>
        <style>
            #modernAlertOverlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(12px);display:flex;justify-content:center;align-items:center;z-index:99999;animation:maFadeIn 0.3s ease;}
            .modern-alert-box{background:linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,255,255,0.9));border-radius:28px;padding:45px 40px 40px;width:90%;max-width:450px;box-shadow:0 30px 80px rgba(0,0,0,0.25);animation:maSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1);text-align:center;position:relative;overflow:hidden;}
            .modern-alert-shimmer{position:absolute;top:0;left:0;right:0;height:8px;background:linear-gradient(90deg,#cbdfbd,#a8c99c,#d4e09b,#f3c291,#cbdfbd);animation:maShimmer 3s linear infinite;}
            @keyframes maShimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
            .modern-alert-icon-wrapper{width:90px;height:90px;margin:0 auto 28px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:linear-gradient(135deg,#cbdfbd,#a8c99c);box-shadow:0 12px 35px rgba(203,223,189,0.5);font-size:52px;}
            .modern-alert-title{font-size:26px;font-weight:900;background:linear-gradient(135deg,#2d3748,#5D534A);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin:0 0 14px 0;}
            .modern-alert-message{font-size:16px;line-height:1.7;color:#718096;font-weight:500;margin-bottom:35px;}
            .modern-alert-btn{width:100%;padding:18px 28px;background:linear-gradient(135deg,#cbdfbd,#a8c99c);color:#2d5a3b;border:none;border-radius:16px;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 6px 20px rgba(203,223,189,0.5);transition:all 0.3s ease;}
            .modern-alert-btn:hover{transform:translateY(-3px);}
            @keyframes maFadeIn{from{opacity:0}to{opacity:1}}
            @keyframes maSlideIn{from{transform:scale(0.8) translateY(30px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
        </style>
    `;
    document.body.appendChild(overlay);
    setTimeout(() => { document.getElementById('modernAlertOverlay')?.remove(); }, 3000);
}
// REPLACE THIS FUNCTION ONLY in your inventory.js
// Find the broken showModernWarningDialog function and swap it with this one

function showModernWarningDialog({ title, icon='⚠️', details=[], message }) {
    return new Promise(resolve => {
        document.getElementById('modernWarningOverlay')?.remove();
        const isDark = document.body.classList.contains('dark-mode');
        let detailsHTML = '';
        if (details.length) {
            detailsHTML = '<div class="warning-details-grid">';
            details.forEach((d, i) => {
                const cls = d.color==='#DC2626'?'detail-card-negative':d.color==='#059669'?'detail-card-positive':'detail-card-neutral';
                detailsHTML += `<div class="${cls}" style="animation-delay:${0.4+i*0.05}s;"><div class="detail-label">${d.label}</div><div class="detail-value" style="color:${d.color||'#111'};">${d.value}</div></div>`;
            });
            detailsHTML += '</div>';
        }
        const overlay = document.createElement('div');
        overlay.id = 'modernWarningOverlay';
        overlay.innerHTML = `
            <div class="modern-warning-box">
                <div class="modern-warning-accent"></div>
                <div style="width:85px;height:85px;margin:20px auto 18px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:linear-gradient(135deg,#FBBF24,#F59E0B,#EF4444);box-shadow:0 10px 30px rgba(251,191,36,0.4);font-size:48px;">${icon}</div>
                <h3 class="modern-warning-title">${title}</h3>
                ${detailsHTML}
                <div class="modern-warning-message">${message}</div>
                <button class="modern-warning-btn" id="modernWarningOkBtn">Got it! ✓</button>
            </div>
            <style>
                #modernWarningOverlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.75); backdrop-filter: blur(15px);
                    display: flex; justify-content: center; align-items: center;
                    z-index: 99999; animation: wFadeIn 0.4s ease; padding: 16px;
                }
                @keyframes wFadeIn { from { opacity: 0; } to { opacity: 1; } }
                
                .modern-warning-box {
                    background: linear-gradient(145deg, rgba(255,255,255,0.98), rgba(255,251,247,0.96));
                    border-radius: 24px; padding: 45px 40px; max-width: 480px; width: 100%;
                    box-shadow: 0 30px 80px rgba(0,0,0,0.3);
                    animation: wSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
                    position: relative; overflow: hidden; text-align: center;
                }
                @keyframes wSlideIn { from { transform: scale(0.85) translateY(50px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
                
                .modern-warning-accent {
                    position: absolute; top: 0; left: 0; right: 0; height: 5px;
                    background: linear-gradient(90deg, #FEF3C7, #FBBF24, #F59E0B, #DC2626, #F59E0B, #FBBF24);
                    background-size: 200% 100%; animation: wAccent 3s linear infinite;
                }
                @keyframes wAccent { 0% { background-position: 0%; } 100% { background-position: 200%; } }
                
                .modern-warning-title {
                    font-size: 22px; font-weight: 800;
                    background: linear-gradient(135deg, #DC2626, #EF4444);
                    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
                    margin: 0 0 18px 0; position: relative; z-index: 1;
                }
                
                .warning-details-grid {
                    display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
                    margin-bottom: 20px; position: relative; z-index: 1;
                }
                
                .detail-card-negative, .detail-card-positive, .detail-card-neutral {
                    padding: 14px 12px; border-radius: 14px; text-align: center;
                    animation: dcSlideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
                    opacity: 0;
                }
                @keyframes dcSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                
                .detail-card-negative {
                    background: linear-gradient(135deg, rgba(254,226,226,0.95), rgba(252,165,165,0.8));
                    border: 2px solid rgba(220,38,38,0.4);
                }
                
                .detail-card-positive {
                    background: linear-gradient(135deg, rgba(209,250,229,0.95), rgba(167,243,208,0.8));
                    border: 2px solid rgba(5,150,105,0.4);
                }
                
                .detail-card-neutral {
                    background: linear-gradient(135deg, rgba(249,250,251,0.95), rgba(243,244,246,0.8));
                    border: 2px solid rgba(17,24,39,0.15);
                }
                
                .detail-label {
                    font-size: 9px; font-weight: 700; text-transform: uppercase;
                    letter-spacing: 0.6px; color: #6B7280; margin-bottom: 5px;
                }
                
                .detail-value {
                    font-size: 16px; font-weight: 900; line-height: 1.2;
                }
                
                .modern-warning-message {
                    font-size: 15px; line-height: 1.7; color: #4B5563;
                    font-weight: 500; margin-bottom: 24px; position: relative; z-index: 1;
                }
                
                .modern-warning-btn {
                    width: 100%; padding: 16px 28px;
                    background: linear-gradient(135deg, #3B82F6, #2563EB);
                    color: white; border: none; border-radius: 14px;
                    font-weight: 800; font-size: 15px; cursor: pointer;
                    box-shadow: 0 8px 24px rgba(59,130,246,0.4);
                    transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
                    position: relative; z-index: 1;
                }
                
                .modern-warning-btn:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 32px rgba(59,130,246,0.5);
                }
                
                .modern-warning-btn:active {
                    transform: translateY(-1px);
                }
            </style>
        `;
        document.body.appendChild(overlay);
        document.getElementById('modernWarningOkBtn').addEventListener('click', () => {
            overlay.style.opacity='0'; overlay.style.transition='opacity 0.3s ease';
            setTimeout(() => { overlay.remove(); resolve(); }, 300);
        });
    });
}

console.log('📦 Inventory module loaded!');