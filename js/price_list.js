// =============================================================================
//  PRICE LIST MODULE — NEO-GLASSMORPHIC EDITION
// =============================================================================

// =============================================================================
//  1. GLOBAL VARIABLES & CONSTANTS
// =============================================================================

let selectedPriceCategory = null;

async function getCategories() {
    try {
        if (typeof DB !== 'undefined' && typeof DB.getCategories === 'function') {
            const cats = await DB.getCategories();
            if (cats && cats.length) {
                window.CATEGORIES = cats;
                return cats;
            }
        }
    } catch (e) {
        console.warn('⚠️ DB.getCategories() failed, using window.CATEGORIES fallback:', e);
    }

    if (window.CATEGORIES && Array.isArray(window.CATEGORIES)) return window.CATEGORIES;

    console.warn('⚠️ No categories found, using hardcoded defaults');
    const defaults = [
        { id:'beverages',           name:'Beverages',                    icon:'🥤', color:'linear-gradient(135deg,#e3b04b 0%,#d19a3d 100%)' },
        { id:'school',              name:'School Supplies',               icon:'📚', color:'linear-gradient(135deg,#d48c2e 0%,#ba7a26 100%)' },
        { id:'snacks',              name:'Snacks',                        icon:'🍿', color:'linear-gradient(135deg,#a44a3f 0%,#934635 100%)' },
        { id:'foods',               name:'Whole Foods',                   icon:'🍚', color:'linear-gradient(135deg,#967751 0%,#92784f 100%)' },
        { id:'bath',                name:'Bath, Hygiene & Laundry Soaps', icon:'🧼', color:'linear-gradient(135deg,#f3c291 0%,#e5b382 100%)' },
        { id:'wholesale_beverages', name:'Wholesale Beverages',           icon:'📦', color:'linear-gradient(135deg,#cc8451 0%,#b87545 100%)' },
        { id:'liquor',              name:'Hard Liquors',                  icon:'🍺', color:'linear-gradient(135deg,#e2e8b0 0%,#ced49d 100%)' },
    ];
    window.CATEGORIES = defaults;
    return defaults;
}

// =============================================================================
//  2. INJECT GLOBAL GLASSMORPHIC STYLES
// =============================================================================

(function injectPriceStyles() {
    if (document.getElementById('price-neo-styles')) return;
    const s = document.createElement('style');
    s.id = 'price-neo-styles';
    s.textContent = `
        /* ── CSS Variables ── */
        #priceListContent {
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

        /* ── Summary stat cards ── */
        #priceListContent .gl-stat-card {
            display: flex;
            align-items: center;
            gap: 16px;
            border-radius: 20px;
            padding: 20px 24px;
            flex: 1;
            min-width: 180px;
            max-width: 280px;
            position: relative;
            overflow: hidden;
            cursor: default;
            backdrop-filter: blur(18px) saturate(1.6);
            -webkit-backdrop-filter: blur(18px) saturate(1.6);
            border: 1.5px solid rgba(255,255,255,0.55);
            box-shadow: var(--neo-float);
            transition: transform .35s cubic-bezier(.22,1,.36,1), box-shadow .35s ease;
        }
        #priceListContent .gl-stat-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 20px;
            background: linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 40%, transparent 70%);
            pointer-events: none;
        }
        #priceListContent .gl-stat-card::after {
            content: '';
            position: absolute;
            top: 0; left: 20px; right: 20px;
            height: 2px;
            border-radius: 0 0 4px 4px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
        }
        #priceListContent .gl-stat-card:hover {
            transform: translateY(-6px) scale(1.01);
            box-shadow: var(--neo-float-hover);
        }
        #priceListContent .gl-stat-card .stat-icon {
            font-size: 2rem;
            flex-shrink: 0;
            position: relative;
            z-index: 1;
            line-height: 1;
        }
        #priceListContent .gl-stat-card .stat-body {
            flex: 1;
            min-width: 0;
            position: relative;
            z-index: 1;
        }
        #priceListContent .gl-stat-card .stat-label {
            font-size: 0.64rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.7px;
            opacity: 0.72;
            margin-bottom: 4px;
        }
        #priceListContent .gl-stat-card .stat-value {
            font-size: 1.6rem;
            font-weight: 900;
            line-height: 1.1;
            letter-spacing: -0.5px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.08);
        }

        /* Colour variants */
        #priceListContent .gl-stat-card.sc-beige  { background: linear-gradient(135deg, #f5ede0 0%, #eee4d5 100%); border-color: #e8dac8; }
        #priceListContent .gl-stat-card.sc-beige  .stat-label, .sc-beige  .stat-value { color: #5D534A; }
        #priceListContent .gl-stat-card.sc-green  { background: linear-gradient(135deg, #cbdfbd 0%, #bdd4ae 100%); border-color: #b5cca8; }
        #priceListContent .gl-stat-card.sc-green  .stat-label { color: #3e5235; }
        #priceListContent .gl-stat-card.sc-green  .stat-value { color: #32422b; }
        #priceListContent .gl-stat-card.sc-amber  { background: linear-gradient(135deg, #f6f4d2 0%, #eee9c4 100%); border-color: #e5e0ba; }
        #priceListContent .gl-stat-card.sc-amber  .stat-label { color: #6b6438; }
        #priceListContent .gl-stat-card.sc-amber  .stat-value { color: #5a5230; }
        #priceListContent .gl-stat-card.sc-mint   { background: linear-gradient(135deg, #d4e09b 0%, #c5d68d 100%); border-color: #c0cf88; }
        #priceListContent .gl-stat-card.sc-mint   .stat-label { color: #4a5a2a; }
        #priceListContent .gl-stat-card.sc-mint   .stat-value { color: #3d4a23; }

        /* Hint subtitle under stat values */
        #priceListContent .stat-hint {
            font-size: 10px; font-weight: 600;
            opacity: 0.6; margin-top: 4px;
            letter-spacing: 0.2px;
        }

        /* ── Category cards ── */
        #priceListContent .gl-cat-card {
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
            background: linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 100%);
        }
        #priceListContent .gl-cat-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 20px;
            background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 50%, transparent 75%);
            pointer-events: none;
        }
        #priceListContent .gl-cat-card::after {
            content: '';
            position: absolute;
            top: 0; left: 20px; right: 20px;
            height: 2px;
            border-radius: 0 0 4px 4px;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
        }
        #priceListContent .gl-cat-card:hover {
            transform: translateY(-7px) scale(1.01);
            box-shadow: var(--neo-float-hover);
        }
        #priceListContent .gl-cat-card:active { transform: translateY(-3px) scale(1.005); }

        #priceListContent .gl-cat-inner {
            display: flex;
            align-items: center;
            gap: 16px;
            position: relative;
            z-index: 1;
        }
        #priceListContent .gl-cat-icon-box {
            width: 54px;
            height: 54px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            flex-shrink: 0;
            box-shadow: 0 4px 14px rgba(0,0,0,0.18), 0 -1px 0 rgba(255,255,255,0.5) inset;
            border: 1px solid rgba(255,255,255,0.4);
        }
        #priceListContent .gl-cat-text { flex: 1; }
        #priceListContent .gl-cat-name {
            font-size: 15px;
            font-weight: 800;
            color: #2d3a2d;
            margin-bottom: 3px;
        }
        #priceListContent .gl-cat-sub {
            font-size: 12px;
            color: #7a9070;
            font-weight: 600;
        }
        #priceListContent .gl-cat-arrow {
            font-size: 18px;
            color: rgba(80,120,75,0.4);
            transition: all .3s ease;
            flex-shrink: 0;
        }
        #priceListContent .gl-cat-card:hover .gl-cat-arrow {
            color: rgba(80,120,75,0.9);
            transform: translateX(5px);
        }

        /* ── Mini stat pills in category view ── */
        #priceListContent .gl-mini-stat {
            display: flex;
            align-items: center;
            gap: 10px;
            border-radius: 14px;
            padding: 14px 18px;
            flex: 1;
            min-width: 140px;
            position: relative;
            overflow: hidden;
            backdrop-filter: blur(14px) saturate(1.5);
            -webkit-backdrop-filter: blur(14px) saturate(1.5);
            border: 1.5px solid rgba(255,255,255,0.55);
            box-shadow: var(--neo-float);
            transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s ease;
        }
        #priceListContent .gl-mini-stat::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 14px;
            background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%);
            pointer-events: none;
        }
        #priceListContent .gl-mini-stat:hover {
            transform: translateY(-4px);
            box-shadow: var(--neo-float-hover);
        }
        #priceListContent .gl-mini-stat .ms-icon { font-size: 1.4rem; position: relative; z-index:1; }
        #priceListContent .gl-mini-stat .ms-body  { position: relative; z-index:1; }
        #priceListContent .gl-mini-stat .ms-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; margin-bottom: 3px; }
        #priceListContent .gl-mini-stat .ms-value { font-size: 1.2rem; font-weight: 900; }
        #priceListContent .gl-mini-stat .ms-hint  { font-size: 9px; font-weight: 600; opacity: 0.6; margin-top: 3px; letter-spacing: 0.2px; }

        #priceListContent .gl-mini-stat.ms-beige  { background: linear-gradient(135deg, #f5ede0, #eee4d5); }
        #priceListContent .gl-mini-stat.ms-beige  .ms-label, .ms-beige  .ms-value { color: #5D534A; }
        #priceListContent .gl-mini-stat.ms-green  { background: linear-gradient(135deg, #cbdfbd, #bdd4ae); }
        #priceListContent .gl-mini-stat.ms-green  .ms-label { color: #3e5235; }
        #priceListContent .gl-mini-stat.ms-green  .ms-value { color: #32422b; }
        #priceListContent .gl-mini-stat.ms-amber  { background: linear-gradient(135deg, #f6f4d2, #eee9c4); }
        #priceListContent .gl-mini-stat.ms-amber  .ms-label { color: #6b6438; }
        #priceListContent .gl-mini-stat.ms-amber  .ms-value { color: #5a5230; }
        #priceListContent .gl-mini-stat.ms-mint   { background: linear-gradient(135deg, #d4e09b, #c5d68d); }
        #priceListContent .gl-mini-stat.ms-mint   .ms-label { color: #4a5a2a; }
        #priceListContent .gl-mini-stat.ms-mint   .ms-value { color: #3d4a23; }

        /* ── Pro tip banner ── */
        #priceListContent .gl-tip-banner {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 20px;
            margin-bottom: 24px;
            border-radius: 14px;
            backdrop-filter: blur(14px) saturate(1.4);
            -webkit-backdrop-filter: blur(14px) saturate(1.4);
            background: linear-gradient(135deg, rgba(203,223,189,0.35), rgba(168,201,156,0.2));
            border: 1.5px solid rgba(255,255,255,0.55);
            border-left: 4px solid #87B382;
            box-shadow: 0 4px 16px rgba(80,140,75,0.12);
            font-size: 13px;
            color: #3e5235;
        }
        #priceListContent .gl-tip-banner strong { color: #2d4a22; }

        /* ── Table wrapper ── */
        #priceListContent .gl-table-wrap {
            border-radius: 20px;
            overflow: hidden;
            backdrop-filter: blur(16px) saturate(1.5);
            -webkit-backdrop-filter: blur(16px) saturate(1.5);
            border: 1.5px solid rgba(255,255,255,0.55);
            box-shadow: var(--neo-float);
            background: rgba(255,255,255,0.55);
        }
        #priceListContent .gl-table {
            width: 100%;
            border-collapse: collapse;
        }
        #priceListContent .gl-table thead th {
            background: linear-gradient(135deg, rgba(203,223,189,0.7), rgba(168,201,156,0.55));
            color: #3e5235;
            padding: 18px 15px;
            text-align: center;
            font-weight: 800;
            font-size: 11px;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            border-bottom: 1px solid rgba(255,255,255,0.6);
        }
        #priceListContent .gl-table thead th:first-child { text-align: left; }
        #priceListContent .gl-table tbody td {
            padding: 18px 15px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.5);
            transition: background .2s ease;
        }
        #priceListContent .gl-table tbody td:first-child { text-align: left; }
        #priceListContent .gl-table tbody tr:hover td {
            background: rgba(203,223,189,0.18);
        }
        #priceListContent .gl-table tbody tr:last-child td { border-bottom: none; }
        #priceListContent .gl-table .low-stock-row td  { background: rgba(246,244,210,0.5); border-left: 4px solid #d4a726; }
        #priceListContent .gl-table .out-of-stock-row td { background: rgba(241,156,121,0.15); border-left: 4px solid #a44a3f; }

        #priceListContent .product-name { font-size: 15px; font-weight: 700; color: #2d3a2d; }

        /* Inputs */
        #priceListContent .price-input {
            width: 110px;
            padding: 10px 14px;
            text-align: center;
            border-radius: 10px;
            font-weight: 700;
            font-size: 15px;
            transition: all 0.3s ease;
            backdrop-filter: blur(6px);
        }
        #priceListContent .price-input:focus {
            outline: none;
            transform: scale(1.06);
            box-shadow: 0 0 0 4px rgba(203,223,189,0.35);
        }
        #priceListContent .cost-input {
            background: rgba(241,156,121,0.2);
            border: 2px solid rgba(241,156,121,0.7);
            color: #5D534A;
        }
        #priceListContent .cost-input:hover { border-color: #e07a5f; }
        #priceListContent .sell-input {
            background: rgba(203,223,189,0.3);
            border: 2px solid rgba(168,201,156,0.8);
            color: #3e5235;
        }
        #priceListContent .sell-input:hover { border-color: #87B382; }

        /* Badges */
        #priceListContent .profit-badge {
            display: inline-block;
            padding: 7px 14px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 14px;
            backdrop-filter: blur(6px);
        }
        #priceListContent .profit-positive { background: rgba(203,223,189,0.4); color: #2d5238; border: 1px solid rgba(168,201,156,0.5); }
        #priceListContent .profit-negative  { background: rgba(241,156,121,0.3); color: #7a2820; border: 1px solid rgba(241,156,121,0.5); }

        #priceListContent .margin-badge {
            display: inline-block;
            padding: 7px 14px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 14px;
            min-width: 68px;
            backdrop-filter: blur(6px);
        }
        #priceListContent .margin-low    { background: rgba(232,220,200,0.7); color: #3d3822; border: 1px solid rgba(210,195,170,0.5); }
        #priceListContent .margin-normal { background: rgba(201,217,154,0.6); color: #2d3a1a; border: 1px solid rgba(180,198,134,0.5); }
        #priceListContent .margin-high   { background: rgba(184,201,153,0.6); color: #1f3a1f; border: 1px solid rgba(157,179,132,0.5); }

        #priceListContent .stock-text { font-size: 14px; font-weight: 700; color: #5a7a5e; }

        /* Back button */
        #priceListContent .gl-back-btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, rgba(203,223,189,0.6), rgba(168,201,156,0.45));
            color: #2d5238;
            border: 1.5px solid rgba(255,255,255,0.65);
            border-radius: 14px;
            cursor: pointer;
            font-weight: 800;
            font-size: 14px;
            transition: all .3s cubic-bezier(.22,1,.36,1);
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 14px rgba(80,140,75,0.18), 0 -1px 0 rgba(255,255,255,0.8) inset;
        }
        #priceListContent .gl-back-btn:hover {
            transform: translateY(-3px) scale(1.01);
            box-shadow: 0 8px 24px rgba(80,140,75,0.28), 0 -1px 0 rgba(255,255,255,0.9) inset;
        }

        /* Mobile cards */
        #priceListContent .price-mobile-cards .gl-mobile-card {
            border-radius: 18px;
            padding: 16px 18px;
            margin-bottom: 14px;
            backdrop-filter: blur(16px) saturate(1.5);
            -webkit-backdrop-filter: blur(16px) saturate(1.5);
            border: 1.5px solid rgba(255,255,255,0.55);
            box-shadow: var(--neo-float);
            background: rgba(255,255,255,0.45);
            position: relative;
            overflow: hidden;
            transition: transform .3s ease, box-shadow .3s ease;
        }
        #priceListContent .price-mobile-cards .gl-mobile-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 18px;
            background: linear-gradient(135deg, rgba(255,255,255,0.38) 0%, transparent 55%);
            pointer-events: none;
        }
        #priceListContent .price-mobile-cards .gl-mobile-card:hover {
            transform: translateY(-4px);
            box-shadow: var(--neo-float-hover);
        }
        #priceListContent .gl-mobile-card.out-of-stock { border-left: 4px solid #a44a3f !important; }
        #priceListContent .gl-mobile-card.low-stock    { border-left: 4px solid #d4a726 !important; }
        #priceListContent .gl-mobile-name {
            font-weight: 800;
            font-size: 15px;
            color: #2d3a2d;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255,255,255,0.7);
            position: relative;
            z-index: 1;
        }
        #priceListContent .gl-mobile-inputs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 10px;
            position: relative;
            z-index: 1;
        }
        #priceListContent .gl-mobile-input-wrap { text-align: center; }
        #priceListContent .gl-mobile-input-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #7a9070; margin-bottom: 5px; }
        #priceListContent .gl-mobile-input-wrap .price-input { width: 100%; box-sizing: border-box; }
        #priceListContent .gl-mobile-stats {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
            position: relative;
            z-index: 1;
        }
        #priceListContent .gl-mobile-stat-pill {
            padding: 8px 4px;
            border-radius: 10px;
            text-align: center;
            backdrop-filter: blur(6px);
            border: 1px solid rgba(255,255,255,0.5);
        }
        #priceListContent .gl-mobile-stat-pill .pill-label { font-size: 9px; font-weight: 700; text-transform: uppercase; opacity: 0.7; margin-bottom: 3px; }
        #priceListContent .gl-mobile-stat-pill .pill-value { font-weight: 800; font-size: 13px; }
        #priceListContent .pill-profit-pos { background: rgba(203,223,189,0.4); color: #2d5238; }
        #priceListContent .pill-profit-neg { background: rgba(241,156,121,0.3); color: #7a2820; }
        #priceListContent .pill-stock      { background: rgba(158,147,130,0.15); color: #5D534A; }

        /* ── Dark mode ── */
        body.dark-mode #priceListContent {
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
        body.dark-mode #priceListContent .gl-stat-card.sc-beige  { background: rgba(52,44,32,0.75) !important; border-color: rgba(200,180,140,0.18) !important; }
        body.dark-mode #priceListContent .gl-stat-card.sc-green  { background: rgba(35,55,32,0.72) !important; border-color: rgba(135,179,130,0.2) !important; }
        body.dark-mode #priceListContent .gl-stat-card.sc-amber  { background: rgba(50,42,18,0.72) !important; border-color: rgba(200,170,80,0.18) !important; }
        body.dark-mode #priceListContent .gl-stat-card.sc-mint   { background: rgba(40,52,25,0.72) !important; border-color: rgba(180,200,100,0.18) !important; }
        body.dark-mode #priceListContent .gl-stat-card .stat-label,
        body.dark-mode #priceListContent .gl-stat-card .stat-value { color: #d8ecd4 !important; }
        body.dark-mode #priceListContent .gl-cat-card {
            background: rgba(28,40,26,0.72) !important;
            border-color: rgba(135,179,130,0.18) !important;
        }
        body.dark-mode #priceListContent .gl-cat-name  { color: #d8ecd4 !important; }
        body.dark-mode #priceListContent .gl-cat-sub   { color: #6a8a66 !important; }
        body.dark-mode #priceListContent .gl-mini-stat { border-color: rgba(135,179,130,0.15) !important; }
        body.dark-mode #priceListContent .gl-mini-stat.ms-beige  { background: rgba(52,44,32,0.7) !important; }
        body.dark-mode #priceListContent .gl-mini-stat.ms-green  { background: rgba(35,55,32,0.7) !important; }
        body.dark-mode #priceListContent .gl-mini-stat.ms-amber  { background: rgba(50,42,18,0.7) !important; }
        body.dark-mode #priceListContent .gl-mini-stat.ms-mint   { background: rgba(40,52,25,0.7) !important; }
        body.dark-mode #priceListContent .gl-mini-stat .ms-label,
        body.dark-mode #priceListContent .gl-mini-stat .ms-value { color: #d8ecd4 !important; }
        body.dark-mode #priceListContent .gl-table-wrap { background: rgba(22,34,20,0.7) !important; border-color: rgba(135,179,130,0.15) !important; }
        body.dark-mode #priceListContent .gl-table thead th { background: rgba(40,60,35,0.8) !important; color: #a8c99c !important; border-color: rgba(135,179,130,0.15) !important; }
        body.dark-mode #priceListContent .gl-table tbody td { border-color: rgba(135,179,130,0.1) !important; }
        body.dark-mode #priceListContent .gl-table tbody tr:hover td { background: rgba(80,120,75,0.15) !important; }
        body.dark-mode #priceListContent .product-name { color: #d8ecd4 !important; }
        body.dark-mode #priceListContent .cost-input { background: rgba(241,156,121,0.12) !important; border-color: rgba(180,80,70,0.5) !important; color: #ffb399 !important; }
        body.dark-mode #priceListContent .sell-input { background: rgba(203,223,189,0.1)  !important; border-color: rgba(90,158,111,0.5)  !important; color: #b8e6aa !important; }
        body.dark-mode #priceListContent .profit-positive { background: rgba(80,140,90,0.25) !important; color: #7bc47f !important; }
        body.dark-mode #priceListContent .profit-negative  { background: rgba(164,74,63,0.25) !important; color: #ff8a7a !important; }
        body.dark-mode #priceListContent .margin-low    { background: rgba(80,70,40,0.5) !important; color: #e6c86e !important; }
        body.dark-mode #priceListContent .margin-normal { background: rgba(50,70,35,0.5) !important; color: #a8c99c !important; }
        body.dark-mode #priceListContent .margin-high   { background: rgba(35,60,30,0.5) !important; color: #7bc47f  !important; }
        body.dark-mode #priceListContent .stock-text    { color: #a0c4a4 !important; }
        body.dark-mode #priceListContent .gl-back-btn   { background: rgba(35,55,32,0.7) !important; color: #87B382 !important; border-color: rgba(135,179,130,0.2) !important; }
        body.dark-mode #priceListContent .gl-tip-banner { background: rgba(28,42,26,0.6) !important; border-color: rgba(135,179,130,0.2) !important; color: #87B382 !important; }
        body.dark-mode #priceListContent .gl-mobile-card { background: rgba(25,40,23,0.7) !important; border-color: rgba(135,179,130,0.15) !important; }
        body.dark-mode #priceListContent .gl-mobile-name { color: #d8ecd4 !important; border-color: rgba(135,179,130,0.15) !important; }
        #priceListContent .price-cat-heading { color: #2d3a2d; }
        body.dark-mode #priceListContent .price-cat-heading { color: #d8ecd4 !important; }
        @media (max-width: 768px) {
            #priceListContent .gl-stat-card { max-width: 100%; }
        }
    `;
    document.head.appendChild(s);
})();

// =============================================================================
//  3. INITIALIZATION
// =============================================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Price list module initializing...');
    loadPriceList();
});

// =============================================================================
//  4. MAIN LOADING FUNCTION
// =============================================================================

async function loadPriceList() {
    console.log('📋 Loading price list...');
    const content = document.getElementById('priceListContent');
    if (!content) { console.error('❌ priceListContent element not found!'); return; }

    content.innerHTML = `
        <div style="text-align:center;padding:40px;">
            <div style="font-size:48px;animation:spin 1s linear infinite;">⏳</div>
            <p style="color:#666;margin-top:10px;">Loading price list...</p>
        </div>
        <style>@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}</style>
    `;

    try {
        const products = await DB.getProducts();
        if (!products || products.length === 0) {
            content.innerHTML = `
                <div style="margin:40px auto;max-width:500px;border-radius:20px;padding:40px;text-align:center;backdrop-filter:blur(16px) saturate(1.5);background:rgba(255,255,255,0.5);border:1.5px solid rgba(255,255,255,0.55);box-shadow:0 8px 32px rgba(80,140,75,0.18);">
                    <div style="font-size:56px;margin-bottom:16px;">📭</div>
                    <h3 style="color:#7a2820;margin-bottom:12px;font-size:1.3rem;font-weight:800;">No products found</h3>
                    <p style="color:#9E9382;">Add products in the Inventory page first.</p>
                </div>
            `;
            return;
        }

        if (!selectedPriceCategory) {
            await renderPriceCategorySelection(content);
        } else {
            await renderCategoryPriceList(content, selectedPriceCategory);
        }
    } catch (error) {
        console.error('❌ Error loading price list:', error);
        content.innerHTML = `
            <div style="margin:40px auto;max-width:500px;border-radius:20px;padding:40px;text-align:center;backdrop-filter:blur(16px) saturate(1.5);background:rgba(255,255,255,0.5);border:1.5px solid rgba(255,255,255,0.55);box-shadow:0 8px 32px rgba(80,140,75,0.18);">
                <div style="font-size:56px;margin-bottom:16px;">⚠️</div>
                <h3 style="color:#7a2820;margin-bottom:12px;font-size:1.3rem;font-weight:800;">Error loading price list</h3>
                <p style="color:#9E9382;margin-bottom:20px;">${error.message || error}</p>
                <button onclick="location.reload()" style="padding:12px 28px;background:linear-gradient(135deg,#cbdfbd,#a8c99c);color:#2d5238;border:none;border-radius:12px;cursor:pointer;font-weight:800;box-shadow:0 4px 14px rgba(80,140,75,0.2);">Reload Page</button>
            </div>
        `;
    }
}

// =============================================================================
//  5. RENDER CATEGORY SELECTION GRID
// =============================================================================

async function renderPriceCategorySelection(content) {
    const categories  = await getCategories();
    if (!categories.length) {
        content.innerHTML = `<div style="text-align:center;padding:60px;"><h3 style="color:#7a2820;">No categories defined</h3></div>`;
        return;
    }

    const allProducts = await DB.getProducts();
    let totalProducts = 0, avgProfit = 0, lowMargin = 0, highMargin = 0;

    if (Array.isArray(allProducts) && allProducts.length > 0) {
        totalProducts = allProducts.length;
        avgProfit = allProducts.reduce((sum, p) =>
            sum + (parseFloat(p.price||p.selling_price||0) - parseFloat(p.cost||p.cost_price||0)), 0) / allProducts.length;

        lowMargin  = allProducts.filter(p => { const c=parseFloat(p.cost||p.cost_price||0),pr=parseFloat(p.price||p.selling_price||0); return c>0 && ((pr-c)/c*100)<20; }).length;
        highMargin = allProducts.filter(p => { const c=parseFloat(p.cost||p.cost_price||0),pr=parseFloat(p.price||p.selling_price||0); return c>0 && ((pr-c)/c*100)>50; }).length;
    }

    let html = `
        <div style="display:flex;gap:16px;margin-bottom:32px;flex-wrap:wrap;justify-content:center;">
            <div class="gl-stat-card sc-beige"><span class="stat-icon">📦</span><div class="stat-body"><div class="stat-label">Total Products</div><div class="stat-value">${totalProducts}</div></div></div>
            <div class="gl-stat-card sc-green"><span class="stat-icon">💰</span><div class="stat-body"><div class="stat-label">Avg Profit</div><div class="stat-value">₱${avgProfit.toFixed(2)}</div></div></div>
            <div class="gl-stat-card sc-amber" title="Products with less than 20% markup on cost price"><span class="stat-icon">⚠️</span><div class="stat-body"><div class="stat-label">Low Margin</div><div class="stat-value">${lowMargin}</div><div class="stat-hint">Below 20% markup</div></div></div>
            <div class="gl-stat-card sc-mint"  title="Products with more than 50% markup on cost price"><span class="stat-icon">✨</span><div class="stat-body"><div class="stat-label">High Margin</div><div class="stat-value">${highMargin}</div><div class="stat-hint">Above 50% markup</div></div></div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;margin-bottom:30px;">
    `;

    for (const cat of categories) {
        html += `
            <div class="gl-cat-card" data-category="${cat.id}">
                <div class="gl-cat-inner">
                    <div class="gl-cat-icon-box" style="background:${cat.color};">${cat.icon}</div>
                    <div class="gl-cat-text">
                        <div class="gl-cat-name">${cat.name}</div>
                        <div class="gl-cat-sub">Click to view prices</div>
                    </div>
                    <div class="gl-cat-arrow">→</div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    content.innerHTML = html;

    content.querySelectorAll('.gl-cat-card').forEach(card => {
        card.addEventListener('click', function() {
            selectedPriceCategory = this.getAttribute('data-category');
            loadPriceList();
        });
    });
}

// =============================================================================
//  6. RENDER CATEGORY PRICE LIST
// =============================================================================

async function renderCategoryPriceList(content, categoryId) {
    const categories = await getCategories();
    const category   = categories.find(c => c.id === categoryId);
    if (!category) { selectedPriceCategory = null; await loadPriceList(); return; }

    const allProducts = await DB.getProducts();
    if (!Array.isArray(allProducts)) throw new Error('Products data is not available');

    const products = allProducts.filter(p => (p.category||p.category_id) === categoryId);

    const totalItems = products.length;
    const avgProfit  = products.length ? products.reduce((s, p) =>
        s + (parseFloat(p.price||p.selling_price||0) - parseFloat(p.cost||p.cost_price||0)), 0) / products.length : 0;
    const lowMargin  = products.filter(p => { const c=parseFloat(p.cost||p.cost_price||0),pr=parseFloat(p.price||p.selling_price||0); return c>0&&((pr-c)/c*100)<20; }).length;
    const highMargin = products.filter(p => { const c=parseFloat(p.cost||p.cost_price||0),pr=parseFloat(p.price||p.selling_price||0); return c>0&&((pr-c)/c*100)>50; }).length;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:15px;">
            <div>
<h2 class="price-cat-heading" style="margin-bottom:6px;font-size:2rem;font-weight:900;">${category.icon} ${category.name}</h2>                <p style="color:#7a9070;font-size:15px;font-weight:600;">Manage prices in this category</p>
            </div>
            <button id="btnBackToPriceCategories" class="gl-back-btn">← Back to Categories</button>
        </div>

        <div style="display:flex;gap:14px;margin-bottom:24px;flex-wrap:wrap;">
            <div class="gl-mini-stat ms-beige"><span class="ms-icon">📦</span><div class="ms-body"><div class="ms-label">Products</div><div class="ms-value">${totalItems}</div></div></div>
            <div class="gl-mini-stat ms-green"><span class="ms-icon">💰</span><div class="ms-body"><div class="ms-label">Avg Profit</div><div class="ms-value">₱${avgProfit.toFixed(2)}</div></div></div>
            <div class="gl-mini-stat ms-amber" title="Products with less than 20% markup on cost price"><span class="ms-icon">⚠️</span><div class="ms-body"><div class="ms-label">Low Margin</div><div class="ms-value">${lowMargin}</div><div class="ms-hint">Below 20% markup</div></div></div>
            <div class="gl-mini-stat ms-mint"  title="Products with more than 50% markup on cost price"><span class="ms-icon">✨</span><div class="ms-body"><div class="ms-label">High Margin</div><div class="ms-value">${highMargin}</div><div class="ms-hint">Above 50% markup</div></div></div>
        </div>

        <div class="gl-tip-banner">
            <span style="font-size:22px;">💡</span>
            <span><strong>Pro Tip:</strong> Click on any price field to edit. Changes save automatically!</span>
        </div>
    `;

    if (products.length === 0) {
        html += `
            <div style="border-radius:20px;padding:60px;text-align:center;backdrop-filter:blur(16px) saturate(1.5);background:rgba(255,255,255,0.45);border:1.5px solid rgba(255,255,255,0.55);box-shadow:0 8px 32px rgba(80,140,75,0.14);">
                <div style="font-size:72px;margin-bottom:18px;opacity:0.3;">${category.icon}</div>
                <h3 style="color:#7a9070;margin-bottom:10px;font-size:1.4rem;font-weight:800;">No products in this category</h3>
                <p style="color:#9E9382;">Add products in the Inventory page first!</p>
            </div>
        `;
    } else {
        const sorted = [...products].sort((a, b) => (a.name||'').toLowerCase().localeCompare((b.name||'').toLowerCase()));

        if (isMobile) {
            html += '<div class="price-mobile-cards">';
            sorted.forEach(product => {
                const cost   = parseFloat(product.cost||product.cost_price||0);
                const price  = parseFloat(product.price||product.selling_price||0);
                const qty    = parseFloat(product.quantity||product.stock||0);
                const profit = price - cost;
                const margin = cost > 0 ? ((profit/cost)*100) : 0;
                const isOut  = qty === 0, isLow = !isOut && qty < 10;
                const cardCls  = isOut ? 'out-of-stock' : isLow ? 'low-stock' : '';
                const marginCls = margin < 20 ? 'margin-low' : margin > 50 ? 'margin-high' : 'margin-normal';

                html += `
                    <div class="gl-mobile-card ${cardCls}" data-product-id="${product.id}">
                        <div class="gl-mobile-name">${product.name}</div>
                        <div class="gl-mobile-inputs">
                            <div class="gl-mobile-input-wrap">
                                <div class="gl-mobile-input-label">Cost Price</div>
                                <input type="number" value="${cost.toFixed(2)}" class="price-input cost-input" data-product-id="${product.id}" step="0.01" min="0"/>
                            </div>
                            <div class="gl-mobile-input-wrap">
                                <div class="gl-mobile-input-label">Sell Price</div>
                                <input type="number" value="${price.toFixed(2)}" class="price-input sell-input" data-product-id="${product.id}" step="0.01" min="0"/>
                            </div>
                        </div>
                        <div class="gl-mobile-stats">
                            <div class="gl-mobile-stat-pill ${profit >= 0 ? 'pill-profit-pos' : 'pill-profit-neg'}">
                                <div class="pill-label">Profit</div>
                                <div class="pill-value">₱${profit.toFixed(2)}</div>
                            </div>
                            <div class="gl-mobile-stat-pill ${marginCls}" style="background:none;">
                                <div class="pill-label">Margin</div>
                                <div class="pill-value">${margin.toFixed(1)}%</div>
                            </div>
                            <div class="gl-mobile-stat-pill pill-stock">
                                <div class="pill-label">Stock</div>
                                <div class="pill-value">${qty}</div>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        } else {
            html += `<div class="gl-table-wrap"><table class="gl-table"><thead><tr>
                <th>PRODUCT NAME</th><th>COST PRICE</th><th>SELLING PRICE</th>
                <th>PROFIT/UNIT</th><th>MARGIN %</th><th>STOCK</th>
            </tr></thead><tbody>`;

            sorted.forEach(product => {
                const cost   = parseFloat(product.cost||product.cost_price||0);
                const price  = parseFloat(product.price||product.selling_price||0);
                const qty    = parseFloat(product.quantity||product.stock||0);
                const profit = price - cost;
                const margin = cost > 0 ? ((profit/cost)*100) : 0;
                const rowCls  = qty === 0 ? 'out-of-stock-row' : qty < 10 ? 'low-stock-row' : '';
                const mrgCls  = margin < 20 ? 'margin-low' : margin > 50 ? 'margin-high' : 'margin-normal';

                html += `
                    <tr class="${rowCls}" data-product-id="${product.id}">
                        <td><strong class="product-name">${product.name}</strong></td>
                        <td><input type="number" value="${cost.toFixed(2)}" class="price-input cost-input" data-product-id="${product.id}" step="0.01" min="0"/></td>
                        <td><input type="number" value="${price.toFixed(2)}" class="price-input sell-input" data-product-id="${product.id}" step="0.01" min="0"/></td>
                        <td><div class="profit-badge ${profit >= 0 ? 'profit-positive' : 'profit-negative'}">₱${profit.toFixed(2)}</div></td>
                        <td><div class="margin-badge ${mrgCls}">${margin.toFixed(1)}%</div></td>
                        <td><span class="stock-text">${qty} units</span></td>
                    </tr>
                `;
            });
            html += '</tbody></table></div>';
        }
    }

    content.innerHTML = html;

    content.getElementById?.('btnBackToPriceCategories')?.addEventListener('click', () => { selectedPriceCategory = null; loadPriceList(); });
    document.getElementById('btnBackToPriceCategories')?.addEventListener('click', () => { selectedPriceCategory = null; loadPriceList(); });

    content.querySelectorAll('.cost-input').forEach(input => {
        input.addEventListener('change', function() { updatePrice(String(this.dataset.productId), 'cost', this.value); });
        input.addEventListener('focus', function() { this.select(); });
    });
    content.querySelectorAll('.sell-input').forEach(input => {
        input.addEventListener('change', function() { updatePrice(String(this.dataset.productId), 'price', this.value); });
        input.addEventListener('focus', function() { this.select(); });
    });
}

// =============================================================================
//  7. UPDATE PRICE
// =============================================================================

async function updatePrice(id, field, newValue) {
    const value = parseFloat(newValue);
    if (isNaN(value) || value < 0) {
        if (typeof window.showModernAlert === 'function') window.showModernAlert('Price must be 0 or greater.', '⚠️');
        else alert('Price must be 0 or greater.');
        await loadPriceList(); return;
    }

    try {
        const products = await DB.getProducts();
        const product  = products.find(p => String(p.id) === String(id));
        if (!product) { alert('Product not found!'); return; }

        const cost     = parseFloat(product.cost||product.cost_price||0);
        const price    = parseFloat(product.price||product.selling_price||0);
        const newCost  = field === 'cost'  ? value : cost;
        const newPrice = field === 'price' ? value : price;

        if (newPrice < newCost) {
            const lossPerUnit = (newCost - newPrice).toFixed(2);
            const isDark = document.body.classList.contains('dark-mode');

            const confirmed = await new Promise(resolve => {
                const overlay = document.createElement('div');
                overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:10000;';
                overlay.innerHTML = `
                    <div style="background:${isDark?'linear-gradient(135deg,#2a2a2a,#1e1e1e)':'linear-gradient(135deg,#fff,#fef9f5)'};border-radius:24px;padding:0;max-width:480px;width:90%;box-shadow:0 25px 70px rgba(164,74,63,0.4);animation:lossIn 0.4s cubic-bezier(0.34,1.56,0.64,1);overflow:hidden;border:3px solid ${isDark?'#ff6b6b':'#a44a3f'};">
                        <div style="background:linear-gradient(135deg,#a44a3f,#8b3a31);padding:28px 32px;text-align:center;">
                            <div style="font-size:64px;margin-bottom:12px;">🚨</div>
                            <h2 style="color:#fff;margin:0;font-size:1.8rem;font-weight:900;">LOSS ALERT!</h2>
                        </div>
                        <div style="padding:28px 32px;">
                            <div style="background:${isDark?'rgba(241,156,121,0.1)':'rgba(241,156,121,0.15)'};border-left:4px solid #f19c79;border-radius:12px;padding:20px;margin-bottom:22px;">
                                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
                                    <div style="text-align:center;padding:10px;background:${isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.7)'};border-radius:8px;">
                                        <div style="font-size:11px;font-weight:700;color:${isDark?'#b0b0b0':'#9E9382'};text-transform:uppercase;margin-bottom:6px;">Cost Price</div>
                                        <div style="font-size:22px;font-weight:900;color:${isDark?'#ff8a7a':'#a44a3f'};">₱${newCost.toFixed(2)}</div>
                                    </div>
                                    <div style="text-align:center;padding:10px;background:${isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.7)'};border-radius:8px;">
                                        <div style="font-size:11px;font-weight:700;color:${isDark?'#b0b0b0':'#9E9382'};text-transform:uppercase;margin-bottom:6px;">Sell Price</div>
                                        <div style="font-size:22px;font-weight:900;color:${isDark?'#ff8a7a':'#a44a3f'};">₱${newPrice.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div style="text-align:center;padding:14px;background:linear-gradient(135deg,#a44a3f,#8b3a31);border-radius:10px;">
                                    <div style="font-size:11px;color:rgba(255,255,255,0.9);font-weight:700;text-transform:uppercase;margin-bottom:6px;">Loss Per Unit</div>
                                    <div style="font-size:30px;font-weight:900;color:#fff;">₱${lossPerUnit}</div>
                                </div>
                            </div>
                            <p style="text-align:center;font-size:15px;font-weight:600;color:${isDark?'#f0f0f0':'#5D534A'};margin:0 0 22px;">Are you sure you want to proceed?</p>
                            <div style="display:flex;gap:12px;">
                                <button id="lossCancel"  style="flex:1;padding:14px;border-radius:12px;font-weight:700;background:linear-gradient(135deg,${isDark?'#2d5a3d':'#7bc47f'},${isDark?'#1f3e2a':'#5a9e6f'});color:${isDark?'#a8e6aa':'white'};border:none;cursor:pointer;">✓ Cancel</button>
                                <button id="lossConfirm" style="flex:1;padding:14px;border-radius:12px;font-weight:700;background:linear-gradient(135deg,#a44a3f,#8b3a31);color:white;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(164,74,63,0.4);">⚠️ Proceed</button>
                            </div>
                        </div>
                        <style>@keyframes lossIn{from{transform:translateY(50px) scale(0.9);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}</style>
                    </div>
                `;
                document.body.appendChild(overlay);
                const cleanup = r => { overlay.remove(); resolve(r); };
                document.getElementById('lossConfirm').onclick = () => cleanup(true);
                document.getElementById('lossCancel').onclick  = () => cleanup(false);
                overlay.onclick = e => { if (e.target === overlay) cleanup(false); };
            });

            if (!confirmed) { await loadPriceList(); return; }

        } else {
            const margin    = ((newPrice - newCost) / newCost) * 100;
            const minMargin = window.storeSettings?.profitMargin || 20;

            if (newCost > 0 && margin < minMargin) {
                const recommended   = (newCost * (1 + minMargin / 100)).toFixed(2);
                const profitPerUnit = (newPrice - newCost).toFixed(2);
                const isDark = document.body.classList.contains('dark-mode');

                const choice = await new Promise(resolve => {
                    const overlay = document.createElement('div');
                    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:10000;';
                    overlay.innerHTML = `
                        <div style="background:${isDark?'linear-gradient(135deg,#2a2a2a,#1e1e1e)':'linear-gradient(135deg,#fff,#fef9f5)'};border-radius:24px;padding:0;max-width:480px;width:90%;overflow:hidden;border:3px solid ${isDark?'#e6c86e':'#d4a726'};animation:margIn2 0.4s cubic-bezier(0.34,1.56,0.64,1);box-shadow:0 25px 70px rgba(212,167,38,0.4);">
                            <div style="background:linear-gradient(135deg,#d4a726,#b8960e);padding:22px 28px;text-align:center;">
                                <div style="font-size:52px;margin-bottom:6px;">⚠️</div>
                                <h2 style="color:#fff;margin:0;font-size:1.5rem;font-weight:900;">LOW PROFIT MARGIN</h2>
                                <p style="color:rgba(255,255,255,0.85);margin:5px 0 0;font-size:13px;">Below your ${minMargin}% store requirement</p>
                            </div>
                            <div style="padding:22px 24px;">
                                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
                                    <div style="text-align:center;padding:10px 6px;background:${isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.8)'};border-radius:10px;">
                                        <div style="font-size:10px;font-weight:700;color:${isDark?'#b0b0b0':'#9E9382'};text-transform:uppercase;margin-bottom:5px;">Your Margin</div>
                                        <div style="font-size:19px;font-weight:900;color:${isDark?'#e6c86e':'#d4a726'};">${margin.toFixed(1)}%</div>
                                    </div>
                                    <div style="text-align:center;padding:10px 6px;background:${isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.8)'};border-radius:10px;">
                                        <div style="font-size:10px;font-weight:700;color:${isDark?'#b0b0b0':'#9E9382'};text-transform:uppercase;margin-bottom:5px;">Required</div>
                                        <div style="font-size:19px;font-weight:900;color:${isDark?'#7bc47f':'#5a9e6f'};">${minMargin}%</div>
                                    </div>
                                    <div style="text-align:center;padding:10px 6px;background:${isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.8)'};border-radius:10px;">
                                        <div style="font-size:10px;font-weight:700;color:${isDark?'#b0b0b0':'#9E9382'};text-transform:uppercase;margin-bottom:5px;">Profit/Unit</div>
                                        <div style="font-size:19px;font-weight:900;color:${isDark?'#f0f0f0':'#5D534A'};">₱${profitPerUnit}</div>
                                    </div>
                                </div>
                                <div style="text-align:center;padding:12px;background:linear-gradient(135deg,${isDark?'rgba(45,90,61,0.5)':'rgba(203,223,189,0.3)'},${isDark?'rgba(30,62,42,0.4)':'rgba(168,201,156,0.2)'});border:1px solid ${isDark?'rgba(90,158,111,0.3)':'rgba(168,201,156,0.5)'};border-radius:12px;margin-bottom:16px;">
                                    <div style="font-size:10px;font-weight:700;color:${isDark?'#7bc47f':'#3e5235'};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">💡 Recommended Price</div>
                                    <div style="font-size:24px;font-weight:900;color:${isDark?'#a8e6aa':'#2d5a3b'};">₱${recommended}</div>
                                    <div style="font-size:11px;color:${isDark?'#7bc47f':'#5a7a5e'};margin-top:3px;">achieves exactly ${minMargin}% margin</div>
                                </div>
                                <div style="display:flex;gap:8px;">
                                    <button id="margAdjust"  style="flex:1.3;padding:13px 8px;border-radius:11px;font-weight:800;font-size:13px;cursor:pointer;background:linear-gradient(135deg,${isDark?'#2e7d32':'#cbdfbd'},${isDark?'#388e3c':'#a8c99c'});color:${isDark?'#e8f5e9':'#2d5a3b'};border:${isDark?'1.5px solid #4caf50':'none'};box-shadow:0 4px 12px ${isDark?'rgba(46,125,50,0.4)':'rgba(203,223,189,0.4)'};">✓ Use ₱${recommended}</button>
                                    <button id="margProceed" style="flex:1;padding:13px 8px;border-radius:11px;font-weight:700;font-size:12px;cursor:pointer;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;box-shadow:0 4px 12px rgba(239,68,68,0.4);">Keep ₱${newPrice.toFixed(2)}</button>
                                </div>
                            </div>
                            <style>@keyframes margIn2{from{transform:translateY(50px) scale(0.9);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}</style>
                        </div>
                    `;
                    document.body.appendChild(overlay);
                    document.getElementById('margAdjust').onclick  = () => { overlay.remove(); resolve('adjust');  };
                    document.getElementById('margProceed').onclick = () => { overlay.remove(); resolve('proceed'); };
                    overlay.onclick = e => { if (e.target === overlay) { overlay.remove(); resolve('cancel'); } };
                });

                if (choice === 'adjust') {
                    await DB.updateProduct(id, { price: parseFloat(recommended) });
                    await loadPriceList();
                    if (typeof renderProfit === 'function') await renderProfit();
                    return;
                } else if (choice === 'cancel') {
                    await loadPriceList(); return;
                }
            }
        }

        await DB.updateProduct(id, { [field]: value });
        await loadPriceList();
        if (typeof renderProfit === 'function') await renderProfit();

    } catch (error) {
        console.error('❌ Error updating price:', error);
        const msg = 'Failed to update price. Please try again.';
        if (typeof window.showModernAlert === 'function') window.showModernAlert(msg, '❌');
        else alert(msg);
    }
}

// =============================================================================
//  8. EXPORTS
// =============================================================================

window.renderPriceList = loadPriceList;
window.updatePrice     = updatePrice;

// Allow external navigation (e.g. from notifications) to read/write the selected category
Object.defineProperty(window, 'selectedPriceCategory', {
    get() { return selectedPriceCategory; },
    set(v) { selectedPriceCategory = v; },
    configurable: true
});