/**
 * emoji-to-svg.js — Neo-Glassmorphic Emoji → SVG Replacement Engine
 *
 * Replaces every Unicode emoji in the DOM with a self-contained, inline SVG
 * that has a frosted-glass (neo-glassmorphic) background, subtle gradient,
 * highlight, and drop-shadow.  Custom vector icon paths are provided for
 * ~50 core UI emojis; all remaining emojis get the same glass treatment
 * with the original character rendered as <text> inside the SVG.
 *
 * Features:
 *   - Zero dependencies, pure vanilla JS
 *   - Shared <defs> block (gradients + filters) injected once
 *   - MutationObserver auto-replaces emojis in dynamically-added content
 *   - window.emojiToSVG(emoji) public API for use in template literals
 *   - Dark-mode aware via CSS classes
 *   - Fully self-contained inline SVGs (no external assets)
 *
 * LOAD ORDER:  Include AFTER the DOM is ready (end of <body> or defer).
 */

(function () {
    'use strict';

    // =========================================================================
    //  COLOUR PALETTE
    // =========================================================================

    const P = {
        indigo:  { bg: '#6366f1', fg: '#3730a3', fgD: '#a5b4fc' },
        cyan:    { bg: '#06b6d4', fg: '#155e75', fgD: '#67e8f9' },
        amber:   { bg: '#f59e0b', fg: '#92400e', fgD: '#fcd34d' },
        orange:  { bg: '#f97316', fg: '#9a3412', fgD: '#fdba74' },
        violet:  { bg: '#8b5cf6', fg: '#5b21b6', fgD: '#c4b5fd' },
        slate:   { bg: '#94a3b8', fg: '#334155', fgD: '#cbd5e1' },
        yellow:  { bg: '#eab308', fg: '#854d0e', fgD: '#fde047' },
        red:     { bg: '#ef4444', fg: '#991b1b', fgD: '#fca5a5' },
        green:   { bg: '#22c55e', fg: '#166534', fgD: '#86efac' },
        blue:    { bg: '#3b82f6', fg: '#1e40af', fgD: '#93c5fd' },
        rose:    { bg: '#fb7185', fg: '#9f1239', fgD: '#fda4af' },
        emerald: { bg: '#34d399', fg: '#065f46', fgD: '#6ee7b7' },
        teal:    { bg: '#2dd4bf', fg: '#115e59', fgD: '#5eead4' },
        pink:    { bg: '#f472b6', fg: '#9d174d', fgD: '#f9a8d4' },
        lime:    { bg: '#a3e635', fg: '#3f6212', fgD: '#bef264' },
        sky:     { bg: '#38bdf8', fg: '#075985', fgD: '#7dd3fc' },
        brown:   { bg: '#d97706', fg: '#78350f', fgD: '#e5a04a' },
        warmGray:{ bg: '#a8a29e', fg: '#44403c', fgD: '#d6d3d1' },
        stone:   { bg: '#a1887f', fg: '#4e342e', fgD: '#d7ccc8' },
        copper:  { bg: '#d4a574', fg: '#6d4c2e', fgD: '#e8c9a0' },
        coral:   { bg: '#ff8a80', fg: '#c62828', fgD: '#ffab91' },
        mint:    { bg: '#80cbc4', fg: '#00695c', fgD: '#b2dfdb' },
        lavender:{ bg: '#b39ddb', fg: '#4527a0', fgD: '#d1c4e9' },
        peach:   { bg: '#ffab91', fg: '#bf360c', fgD: '#ffccbc' },
        cream:   { bg: '#ffe0b2', fg: '#e65100', fgD: '#ffe8c8' },
    };

    // =========================================================================
    //  SVG ICON DEFINITIONS
    //  Each: { c: 'palette-key', i: 'SVG inner markup (uses FG for fill)' }
    //  If `i` is omitted the emoji character is rendered as <text>.
    // =========================================================================

    const ICONS = {

        // ── Navigation / Pages ──────────────────────────────────────────────
        '📊': { c: 'indigo', i:
            `<rect x="10" y="22" width="4.5" height="9" rx="1.5" fill="FG"/>
             <rect x="17.8" y="15" width="4.5" height="16" rx="1.5" fill="FG"/>
             <rect x="25.5" y="19" width="4.5" height="12" rx="1.5" fill="FG"/>` },

        '📅': { c: 'cyan', i:
            `<rect x="10" y="13" width="20" height="18" rx="3" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M10 19h20" stroke="FG" stroke-width="2"/>
             <path d="M16 10v5M24 10v5" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <circle cx="15" cy="24" r="1.3" fill="FG"/><circle cx="20" cy="24" r="1.3" fill="FG"/>
             <circle cx="25" cy="24" r="1.3" fill="FG"/><circle cx="15" cy="28" r="1.3" fill="FG"/>
             <circle cx="20" cy="28" r="1.3" fill="FG"/>` },

        '💰': { c: 'amber', i:
            `<circle cx="20" cy="20" r="10.5" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M17 16.5c0-1.7 1.3-2.5 3-2.5s3 .8 3 2.5c0 2-3 2.2-3 4 0 1.7-3 2-3 2.5 0 1.7 1.3 2.5 3 2.5s3-.8 3-2.5" fill="none" stroke="FG" stroke-width="1.6" stroke-linecap="round"/>
             <path d="M20 12v2m0 12v2" stroke="FG" stroke-width="1.6" stroke-linecap="round"/>` },

        '📦': { c: 'orange', i:
            `<path d="M20 8L32 14.5V26L20 32.5 8 26V14.5Z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M8 14.5L20 21l12-6.5M20 21v11.5" stroke="FG" stroke-width="2" stroke-linejoin="round"/>` },

        '🧾': { c: 'violet', i:
            `<path d="M12 9h16a2 2 0 0 1 2 2v18l-2.5-2-2.5 2-2.5-2-2.5 2-2.5-2-2.5 2-2.5-2L10 31V11a2 2 0 0 1 2-2z" fill="none" stroke="FG" stroke-width="1.8"/>
             <path d="M15 15h10M15 19h10M15 23h6" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },

        '⚙️': { c: 'slate', i:
            `<circle cx="20" cy="20" r="4" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 9v3m0 16v3M9 20h3m16 0h3M12.2 12.2l2.1 2.1m11.4 11.4l2.1 2.1M27.8 12.2l-2.1 2.1M14.3 25.7l-2.1 2.1" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '⚙': { c: 'slate', i:
            `<circle cx="20" cy="20" r="4" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 9v3m0 16v3M9 20h3m16 0h3M12.2 12.2l2.1 2.1m11.4 11.4l2.1 2.1M27.8 12.2l-2.1 2.1M14.3 25.7l-2.1 2.1" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '🔔': { c: 'yellow', i:
            `<path d="M20 9c-4.4 0-8 3.6-8 8v5l-2 3h20l-2-3v-5c0-4.4-3.6-8-8-8z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M17.5 28a2.5 2.5 0 0 0 5 0" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '🚪': { c: 'red', i:
            `<rect x="12" y="8" width="12" height="24" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="21" cy="20" r="1.2" fill="FG"/>
             <path d="M27 20h5m-3-3l3 3-3 3" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` },

        '🛒': { c: 'green', i:
            `<path d="M8 10h3l3.5 14h13l3-10H14" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <circle cx="17" cy="28" r="2" fill="FG"/><circle cx="26" cy="28" r="2" fill="FG"/>` },

        '🔍': { c: 'blue', i:
            `<circle cx="18" cy="18" r="8" fill="none" stroke="FG" stroke-width="2.2"/>
             <path d="M24 24l7 7" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>` },


        // ── Status Icons ────────────────────────────────────────────────────
        '✅': { c: 'green', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M13.5 20l4.5 4.5 9-9" fill="none" stroke="FG" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>` },

        '❌': { c: 'red', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M14.5 14.5l11 11M25.5 14.5l-11 11" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>` },

        '⚠️': { c: 'amber', i:
            `<path d="M20 8L6 32h28Z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M20 17v7" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>
             <circle cx="20" cy="28" r="1.5" fill="FG"/>` },

        '⚠': { c: 'amber', i:
            `<path d="M20 8L6 32h28Z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M20 17v7" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>
             <circle cx="20" cy="28" r="1.5" fill="FG"/>` },

        '🚫': { c: 'red', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2.5"/>
             <path d="M12.2 27.8L27.8 12.2" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>` },

        '🚨': { c: 'coral', i:
            `<path d="M14 28h12V18a6 6 0 0 0-12 0v10z" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="12" r="3.5" fill="FG" opacity="0.8"/>
             <path d="M12 28h16" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        'ℹ️': { c: 'blue', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="14" r="1.5" fill="FG"/>
             <path d="M20 18v10" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>` },

        'ℹ': { c: 'blue', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="14" r="1.5" fill="FG"/>
             <path d="M20 18v10" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>` },

        '❓': { c: 'violet', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M16 15c0-3 2.5-4 4-4s4 1.2 4 3.5c0 2.5-4 3-4 5" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <circle cx="20" cy="28" r="1.5" fill="FG"/>` },


        // ── Close / Check marks ─────────────────────────────────────────────
        '✕': { c: 'slate', i:
            `<path d="M13 13l14 14M27 13L13 27" stroke="FG" stroke-width="2.8" stroke-linecap="round"/>` },

        '✓': { c: 'green', i:
            `<path d="M11 20l6 6 12-12" fill="none" stroke="FG" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>` },

        '✎': { c: 'blue', i:
            `<path d="M10 30l2-8L26 8l4 4-14 14z" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M22 12l4 4" stroke="FG" stroke-width="2"/>` },


        // ── Action Icons ────────────────────────────────────────────────────
        '✨': { c: 'yellow', i:
            `<path d="M20 8l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="FG"/>
             <path d="M28 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" fill="FG" opacity="0.6"/>
             <path d="M12 24l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="FG" opacity="0.5"/>` },

        '🎉': { c: 'pink', i:
            `<path d="M8 32l4-16 12 12z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <circle cx="22" cy="10" r="1.5" fill="FG"/><circle cx="28" cy="14" r="1.5" fill="FG"/>
             <circle cx="26" cy="8" r="1" fill="FG"/><circle cx="30" cy="18" r="1" fill="FG"/>
             <path d="M16 12l-2-4M22 16l4-2" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },

        '➕': { c: 'green', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 13v14M13 20h14" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>` },

        '⚡': { c: 'yellow', i:
            `<path d="M22 8L12 22h7l-2 10 12-14h-7z" fill="FG"/>` },

        '🗑️': { c: 'red', i:
            `<path d="M13 13h14M16 13V11a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M14 13l1 17h10l1-17" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M18 17v9m4-9v9" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },

        '🗑': { c: 'red', i:
            `<path d="M13 13h14M16 13V11a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M14 13l1 17h10l1-17" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M18 17v9m4-9v9" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },

        '✏️': { c: 'blue', i:
            `<path d="M10 30l2-8L26 8l4 4-14 14z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M22 12l4 4" stroke="FG" stroke-width="2"/>` },

        '✏': { c: 'blue', i:
            `<path d="M10 30l2-8L26 8l4 4-14 14z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M22 12l4 4" stroke="FG" stroke-width="2"/>` },

        '🖊️': { c: 'indigo', i:
            `<path d="M10 30l2-8L26 8l4 4-14 14z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M22 12l4 4" stroke="FG" stroke-width="2"/>` },

        '💾': { c: 'indigo', i:
            `<rect x="9" y="9" width="22" height="22" rx="3" fill="none" stroke="FG" stroke-width="2"/>
             <rect x="14" y="9" width="10" height="8" rx="1" fill="none" stroke="FG" stroke-width="1.5"/>
             <rect x="13" y="22" width="14" height="9" rx="2" fill="none" stroke="FG" stroke-width="1.5"/>` },

        '🔄': { c: 'cyan', i:
            `<path d="M28 16A9 9 0 0 0 12.5 12M12 24a9 9 0 0 0 15.5 4" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M28 10v6h-6M12 30v-6h6" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` },

        '📝': { c: 'blue', i:
            `<rect x="10" y="8" width="16" height="24" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M14 14h8M14 18h8M14 22h5" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>
             <path d="M24 22l4-4 2 2-4 4h-2z" fill="FG"/>` },


        // ── Data / Business ─────────────────────────────────────────────────
        '📈': { c: 'emerald', i:
            `<path d="M8 30l8-8 5 4 11-14" fill="none" stroke="FG" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M26 12h6v6" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` },

        '📉': { c: 'red', i:
            `<path d="M8 12l8 8 5-4 11 14" fill="none" stroke="FG" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M26 30h6v-6" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` },

        '📋': { c: 'indigo', i:
            `<rect x="10" y="11" width="20" height="22" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <rect x="16" y="8" width="8" height="6" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M15 19h10M15 23h10M15 27h6" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },

        '💎': { c: 'cyan', i:
            `<path d="M20 32L6 18l5-8h18l5 8z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M6 18h28M14 10l-2 8 8 14 8-14-2-8" stroke="FG" stroke-width="1.5" stroke-linejoin="round"/>` },

        '🏆': { c: 'amber', i:
            `<path d="M14 10h12v8c0 4-3 7-6 7s-6-3-6-7z" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M14 14H9c0 4 2 6 5 6M26 14h5c0 4-2 6-5 6" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M17 28h6M20 25v3" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '💡': { c: 'yellow', i:
            `<path d="M20 8a8 8 0 0 0-5 14.2V26h10v-3.8A8 8 0 0 0 20 8z" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M16 29h8M17 32h6" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M20 14v4m-3-2h6" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },

        '💳': { c: 'indigo', i:
            `<rect x="7" y="12" width="26" height="16" rx="3" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M7 18h26" stroke="FG" stroke-width="2"/>
             <path d="M12 23h6" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>
             <path d="M12 26h3" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },

        '💵': { c: 'green', i:
            `<rect x="7" y="12" width="26" height="16" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="20" r="4" fill="none" stroke="FG" stroke-width="1.5"/>
             <path d="M20 17v6" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>
             <circle cx="10" cy="20" r="1.2" fill="FG"/><circle cx="30" cy="20" r="1.2" fill="FG"/>` },

        '💲': { c: 'green', i:
            `<path d="M16 14c0-2 2-3.5 4-3.5s4 1.2 4 3.5c0 2.5-4 3-4 4.5 0 2.5-4 2-4 3.5 0 2 2 3.5 4 3.5s4-1.5 4-3.5" fill="none" stroke="FG" stroke-width="2.2" stroke-linecap="round"/>
             <path d="M20 8v3m0 18v3" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '🪙': { c: 'amber', i:
            `<circle cx="20" cy="20" r="10" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="20" r="6" fill="none" stroke="FG" stroke-width="1.5"/>
             <path d="M20 16v8" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },


        // ── Time / Calendar ─────────────────────────────────────────────────
        '⏰': { c: 'violet', i:
            `<circle cx="20" cy="20" r="10" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 14v6l4 3" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M12 8l-3 3M28 8l3 3" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '⏱️': { c: 'violet', i:
            `<circle cx="20" cy="21" r="10" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 15v6l3 3" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M20 8v3M26 12l2-2" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '⏱': { c: 'violet', i:
            `<circle cx="20" cy="21" r="10" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 15v6l3 3" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M20 8v3M26 12l2-2" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '⏳': { c: 'amber', i:
            `<path d="M13 8h14M13 32h14" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M14 8v5c0 4 6 5 6 7s-6 3-6 7v5M26 8v5c0 4-6 5-6 7s6 3 6 7v5" fill="none" stroke="FG" stroke-width="2"/>` },

        '🕐': { c: 'slate', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 12v8l4 4" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` },

        '🕑': { c: 'slate', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 12v8h5" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` },

        '📆': { c: 'teal', i:
            `<rect x="10" y="13" width="20" height="18" rx="3" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M10 19h20" stroke="FG" stroke-width="2"/>
             <path d="M16 10v5M24 10v5" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <text x="20" y="28.5" font-size="9" font-weight="700" text-anchor="middle" fill="FG">17</text>` },

        '🔚': { c: 'slate', i:
            `<path d="M10 20h18M24 15l5 5-5 5" stroke="FG" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M32 13v14" stroke="FG" stroke-width="2.2" stroke-linecap="round"/>` },


        // ── People / Misc ───────────────────────────────────────────────────
        '👤': { c: 'slate', i:
            `<circle cx="20" cy="15" r="5" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M10 32c0-5.5 4.5-10 10-10s10 4.5 10 10" fill="none" stroke="FG" stroke-width="2"/>` },

        '👁️': { c: 'blue', i:
            `<path d="M6 20s6-8 14-8 14 8 14 8-6 8-14 8-14-8-14-8z" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="20" r="4" fill="FG"/>` },

        '👁': { c: 'blue', i:
            `<path d="M6 20s6-8 14-8 14 8 14 8-6 8-14 8-14-8-14-8z" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="20" r="4" fill="FG"/>` },

        '🙈': { c: 'warmGray', i:
            `<circle cx="20" cy="20" r="9" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M13 17c2-2 4.5-3 7-3s5 1 7 3" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M15 16v4M25 16v4" stroke="FG" stroke-width="3" stroke-linecap="round"/>` },

        '😔': { c: 'slate', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="16" cy="18" r="1.2" fill="FG"/><circle cx="24" cy="18" r="1.2" fill="FG"/>
             <path d="M16 26c2-2 6-2 8 0" fill="none" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },


        // ── Theme / Nature ──────────────────────────────────────────────────
        '🌙': { c: 'indigo', i:
            `<path d="M26 10A10 10 0 1 0 18 30a12 12 0 0 1 8-20z" fill="FG"/>` },

        '☀️': { c: 'amber', i:
            `<circle cx="20" cy="20" r="5" fill="FG"/>
             <path d="M20 9v3m0 16v3M9 20h3m16 0h3M12.5 12.5l2 2m11 11l2 2M27.5 12.5l-2 2M14.5 25.5l-2 2" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '☀': { c: 'amber', i:
            `<circle cx="20" cy="20" r="5" fill="FG"/>
             <path d="M20 9v3m0 16v3M9 20h3m16 0h3M12.5 12.5l2 2m11 11l2 2M27.5 12.5l-2 2M14.5 25.5l-2 2" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '🌓': { c: 'indigo', i:
            `<circle cx="20" cy="20" r="10" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 10a10 10 0 0 1 0 20z" fill="FG"/>` },

        '☁️': { c: 'sky', i:
            `<path d="M12 26a6 6 0 0 1-.5-12A8 8 0 0 1 26 12a6 6 0 0 1 2 11.6H12z" fill="none" stroke="FG" stroke-width="2"/>` },

        '☁': { c: 'sky', i:
            `<path d="M12 26a6 6 0 0 1-.5-12A8 8 0 0 1 26 12a6 6 0 0 1 2 11.6H12z" fill="none" stroke="FG" stroke-width="2"/>` },

        '🌐': { c: 'teal', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2"/>
             <ellipse cx="20" cy="20" rx="5" ry="11" fill="none" stroke="FG" stroke-width="1.5"/>
             <path d="M9 15h22M9 25h22" stroke="FG" stroke-width="1.5"/>` },


        // ── Objects ─────────────────────────────────────────────────────────
        '📬': { c: 'blue', i:
            `<rect x="8" y="16" width="24" height="14" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M8 16l12 8 12-8" stroke="FG" stroke-width="2"/>
             <path d="M28 10v6" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '📭': { c: 'slate', i:
            `<rect x="8" y="16" width="24" height="14" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M8 16l12 8 12-8" stroke="FG" stroke-width="2"/>` },

        '🛡️': { c: 'emerald', i:
            `<path d="M20 6l12 5v9c0 6-5 10-12 14C13 30 8 26 8 20v-9z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M16 20l3 3 6-6" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` },

        '🛡': { c: 'emerald', i:
            `<path d="M20 6l12 5v9c0 6-5 10-12 14C13 30 8 26 8 20v-9z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M16 20l3 3 6-6" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` },

        '🧹': { c: 'brown', i:
            `<path d="M22 8l-8 16" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>
             <path d="M10 24c0 0 2 8 10 8s10-8 10-8H10z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M14 26v4M20 26v4M26 26v4" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },

        '🚀': { c: 'violet', i:
            `<path d="M20 6c-4 4-6 10-6 16h12c0-6-2-12-6-16z" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="18" r="2.5" fill="FG"/>
             <path d="M14 26l-4 4M26 26l4 4M17 30h6" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '🎨': { c: 'pink', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="15" cy="16" r="2" fill="FG"/><circle cx="24" cy="14" r="1.8" fill="FG"/>
             <circle cx="14" cy="22" r="1.6" fill="FG"/><circle cx="25" cy="23" r="2.2" fill="FG"/>` },

        '💚': { c: 'green', i:
            `<path d="M20 30l-9-9a6 6 0 0 1 9-8 6 6 0 0 1 9 8z" fill="FG"/>` },

        '💊': { c: 'rose', i:
            `<rect x="11" y="11" width="18" height="18" rx="9" fill="none" stroke="FG" stroke-width="2" transform="rotate(45 20 20)"/>
             <path d="M14 14l12 12" stroke="FG" stroke-width="2"/>` },


        // ── Symbols / Arrows ────────────────────────────────────────────────
        '▼': { c: 'slate', i:
            `<path d="M12 16l8 8 8-8" fill="FG"/>` },

        '●': { c: 'green', i:
            `<circle cx="20" cy="20" r="6" fill="FG"/>` },

        '✂️': { c: 'slate', i:
            `<circle cx="14" cy="14" r="3.5" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="14" cy="26" r="3.5" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M17 16l13 12M17 24l13-12" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '✂': { c: 'slate', i:
            `<circle cx="14" cy="14" r="3.5" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="14" cy="26" r="3.5" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M17 16l13 12M17 24l13-12" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },


        // ── Office / School ─────────────────────────────────────────────────
        '📌': { c: 'red', i:
            `<path d="M20 22v10" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M13 12h14l-2 8H15z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <circle cx="20" cy="10" r="2.5" fill="FG"/>` },

        '📎': { c: 'slate', i:
            `<path d="M16 12v14a4 4 0 0 0 8 0V10a6 6 0 0 0-12 0v18" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '📏': { c: 'amber', i:
            `<rect x="8" y="14" width="24" height="12" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M12 14v4M16 14v6M20 14v4M24 14v6M28 14v4" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },

        '📐': { c: 'orange', i:
            `<path d="M8 32L8 8l24 24z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M8 22l10 10" stroke="FG" stroke-width="1.5"/>` },

        '📓': { c: 'blue', i:
            `<rect x="12" y="8" width="18" height="24" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M10 12h4M10 18h4M10 24h4M10 28h4" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M17 14h8M17 18h8" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },

        '📚': { c: 'indigo', i:
            `<rect x="8" y="10" width="8" height="20" rx="1" fill="none" stroke="FG" stroke-width="1.8"/>
             <rect x="16" y="8" width="8" height="22" rx="1" fill="none" stroke="FG" stroke-width="1.8"/>
             <rect x="24" y="12" width="8" height="18" rx="1" fill="none" stroke="FG" stroke-width="1.8"/>` },

        '🎒': { c: 'orange', i:
            `<rect x="12" y="14" width="16" height="18" rx="4" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M16 14V11a4 4 0 0 1 8 0v3" stroke="FG" stroke-width="2"/>
             <rect x="16" y="20" width="8" height="6" rx="1.5" fill="none" stroke="FG" stroke-width="1.5"/>` },


        // ── Store / Tags ────────────────────────────────────────────────────
        '🏷️': { c: 'emerald', i:
            `<path d="M10 10h10l10 10-8 8-10-10V12a2 2 0 0 1 0-2z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <circle cx="15" cy="15" r="2" fill="FG"/>` },

        '🏷': { c: 'emerald', i:
            `<path d="M10 10h10l10 10-8 8-10-10V12a2 2 0 0 1 0-2z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <circle cx="15" cy="15" r="2" fill="FG"/>` },

        '🏪': { c: 'teal', i:
            `<rect x="8" y="16" width="24" height="16" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M8 16L12 8h16l4 8" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <rect x="16" y="22" width="8" height="10" rx="1" fill="none" stroke="FG" stroke-width="1.5"/>` },

        '🏬': { c: 'blue', i:
            `<rect x="10" y="10" width="20" height="22" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <rect x="14" y="14" width="4" height="4" rx="1" fill="FG"/><rect x="22" y="14" width="4" height="4" rx="1" fill="FG"/>
             <rect x="14" y="21" width="4" height="4" rx="1" fill="FG"/><rect x="22" y="21" width="4" height="4" rx="1" fill="FG"/>
             <rect x="17" y="28" width="6" height="4" rx="1" fill="none" stroke="FG" stroke-width="1.5"/>` },

        '🩺': { c: 'rose', i:
            `<circle cx="20" cy="12" r="4" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 16v8a6 6 0 0 1-6 6 6 6 0 0 1-6-6" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="26" r="2" fill="FG"/>` },


        // ── Kitchen / Dining ────────────────────────────────────────────────
        '🍴': { c: 'warmGray', i:
            `<path d="M15 8v24M25 8v7a5 5 0 0 1-5 5v12" stroke="FG" stroke-width="2.2" stroke-linecap="round"/>
             <path d="M12 8v8a3 3 0 0 0 3 3M18 8v8a3 3 0 0 1-3 3" stroke="FG" stroke-width="1.8" stroke-linecap="round"/>` },

        '🍷': { c: 'rose', i:
            `<path d="M20 22v8M15 30h10" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M13 8h14l-2 10a5 5 0 0 1-10 0z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M14 14h12" stroke="FG" stroke-width="1.5"/>` },

        '🍸': { c: 'cyan', i:
            `<path d="M20 22v8M15 30h10" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M10 8l10 14L30 8" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` },

        '🍽️': { c: 'slate', i:
            `<circle cx="20" cy="20" r="10" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="20" r="6" fill="none" stroke="FG" stroke-width="1.2"/>
             <path d="M8 8v24M32 8v7a3 3 0 0 1-3 3h0v14" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '🍽': { c: 'slate', i:
            `<circle cx="20" cy="20" r="10" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="20" r="6" fill="none" stroke="FG" stroke-width="1.2"/>
             <path d="M8 8v24M32 8v7a3 3 0 0 1-3 3h0v14" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '🍾': { c: 'emerald', i:
            `<path d="M17 10h6l2 6v12a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V16z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M18 8h4" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>
             <path d="M24 10l4-4" stroke="FG" stroke-width="1.8" stroke-linecap="round"/>
             <circle cx="27" cy="7" r="1.5" fill="FG"/>` },

        '🥂': { c: 'amber', i:
            `<path d="M14 30l3-8 3-14M26 30l-3-8-3-14" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M12 30h6M22 30h6" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M17 12a4 4 0 0 0 6 0" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },

        '🥃': { c: 'brown', i:
            `<path d="M12 12h16l-2 16H14z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M14 20h12" stroke="FG" stroke-width="1.5"/>
             <path d="M12 12l1-4h14l1 4" stroke="FG" stroke-width="2" stroke-linejoin="round"/>` },

        '🥄': { c: 'warmGray', i:
            `<path d="M20 10a5 5 0 0 1 0 10" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 10a5 5 0 0 0 0 10" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 20v12" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>` },

        '🥫': { c: 'red', i:
            `<rect x="13" y="10" width="14" height="20" rx="3" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M14 16h12M14 24h12" stroke="FG" stroke-width="1.5"/>
             <rect x="15" y="8" width="10" height="4" rx="1.5" fill="none" stroke="FG" stroke-width="1.5"/>` },

        '🫙': { c: 'teal', i:
            `<rect x="12" y="12" width="16" height="18" rx="3" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M14 8h12M14 8v4M26 8v4" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M12 20h16" stroke="FG" stroke-width="1.5"/>` },

        // ── Beverages ───────────────────────────────────────────────────────
        '☕': { c: 'brown', i:
            `<path d="M10 14h14v10a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M24 16h3a3 3 0 0 1 0 6h-3" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M14 10c1-3 3-3 4 0M19 10c1-3 3-3 4 0" stroke="FG" stroke-width="1.5" stroke-linecap="round" fill="none"/>` },

        '🍵': { c: 'emerald', i:
            `<path d="M10 16h14v8a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M24 18h3a3 3 0 0 1 0 6h-3" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="17" cy="22" r="2" fill="none" stroke="FG" stroke-width="1.5"/>` },

        '🍶': { c: 'slate', i:
            `<path d="M16 10h8l-1 6h-6z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M15 16h10v12a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3z" fill="none" stroke="FG" stroke-width="2"/>` },

        '🍹': { c: 'pink', i:
            `<path d="M14 8l6 16 6-16" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M20 24v6M16 30h8" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M14 14h12" stroke="FG" stroke-width="1.5"/>
             <circle cx="26" cy="10" r="3" fill="FG" opacity="0.5"/>` },

        '🍺': { c: 'amber', i:
            `<path d="M10 12h12v14a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M22 14h4a3 3 0 0 1 0 6h-4" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M14 16v8M18 16v8" stroke="FG" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>` },

        '🍻': { c: 'amber', i:
            `<path d="M8 14h10v12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2z" fill="none" stroke="FG" stroke-width="1.8"/>
             <path d="M22 12h10v12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2z" fill="none" stroke="FG" stroke-width="1.8"/>
             <path d="M18 16h4" stroke="FG" stroke-width="1.5"/>
             <path d="M12 18v6M15 18v6M26 16v6M29 16v6" stroke="FG" stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>` },

        '🥛': { c: 'slate', i:
            `<path d="M13 8h14l-2 20a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M13 14h14" stroke="FG" stroke-width="1.8"/>` },

        '🧃': { c: 'orange', i:
            `<rect x="13" y="10" width="14" height="20" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M18 10v-3l3-2" stroke="FG" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M13 16h14" stroke="FG" stroke-width="1.5"/>
             <circle cx="20" cy="23" r="3" fill="none" stroke="FG" stroke-width="1.5"/>` },

        '🧊': { c: 'sky', i:
            `<path d="M12 14l8-6 8 6v10l-8 6-8-6z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M12 14l8 6 8-6M20 20v10" stroke="FG" stroke-width="1.5" stroke-linejoin="round"/>` },

        '🥤': { c: 'red', i:
            `<path d="M14 10h12l-2 18a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M14 16h12" stroke="FG" stroke-width="1.5"/>
             <path d="M22 10l3-5" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <circle cx="25" cy="5" r="1" fill="FG"/>` },

        // ── Grains / Staples ────────────────────────────────────────────────
        '🍚': { c: 'warmGray', i:
            `<path d="M10 18c0 6 4.5 12 10 12s10-6 10-12z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M10 18a10 4 0 0 1 20 0" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="16" cy="22" r="1.5" fill="FG" opacity="0.5"/><circle cx="20" cy="20" r="1.5" fill="FG" opacity="0.5"/><circle cx="24" cy="22" r="1.5" fill="FG" opacity="0.5"/>` },

        '🍞': { c: 'brown', i:
            `<path d="M8 18c0-4 5-8 12-8s12 4 12 8v6a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M12 18v8M20 16v10M28 18v8" stroke="FG" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>` },

        // ── Produce / Vegetables ────────────────────────────────────────────
        '🌽': { c: 'yellow', i:
            `<path d="M16 8c-2 0-4 4-4 12s2 12 4 12h8c2 0 4-4 4-12s-2-12-4-12z" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M16 12v16M20 10v20M24 12v16" stroke="FG" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
             <path d="M18 8c-2-4 2-6 4-4" stroke="FG" stroke-width="1.5" stroke-linecap="round" fill="none"/>` },

        '🍅': { c: 'red', i:
            `<circle cx="20" cy="21" r="10" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M15 12c2-4 8-4 10 0" stroke="FG" stroke-width="2" stroke-linecap="round" fill="none"/>
             <path d="M20 11v3" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '🥕': { c: 'orange', i:
            `<path d="M24 8L10 28l4 2L28 12z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M16 18l6-6M14 22l6-6" stroke="FG" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
             <path d="M26 10c2-2 4 0 2 2M28 8c2-2 4 0 2 2" stroke="FG" stroke-width="1.5" stroke-linecap="round" fill="none"/>` },

        '🥚': { c: 'cream', i:
            `<ellipse cx="20" cy="21" rx="8" ry="10" fill="none" stroke="FG" stroke-width="2"/>
             <ellipse cx="18" cy="18" rx="3" ry="4" fill="FG" opacity="0.12"/>` },

        '🥦': { c: 'green', i:
            `<circle cx="16" cy="16" r="5" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="24" cy="16" r="5" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="12" r="5" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 21v10M17 22v6M23 22v6" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '🧄': { c: 'warmGray', i:
            `<path d="M20 8c-6 0-10 6-10 12a8 8 0 0 0 8 8h4a8 8 0 0 0 8-8c0-6-4-12-10-12z" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M16 12v10M20 10v12M24 12v10" stroke="FG" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
             <path d="M20 8v-2" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>` },

        '🧈': { c: 'yellow', i:
            `<rect x="10" y="14" width="20" height="12" rx="3" fill="none" stroke="FG" stroke-width="2"/>
             <rect x="14" y="18" width="8" height="6" rx="1" fill="FG" opacity="0.4"/>
             <path d="M10 14l2-4h16l2 4" stroke="FG" stroke-width="2" stroke-linejoin="round"/>` },

        '🥩': { c: 'red', i:
            `<path d="M10 16c0-4 4-6 8-4 4-2 8 0 10 4 2 4 0 8-4 10s-8 0-10-2c-4 0-6-4-4-8z" fill="none" stroke="FG" stroke-width="2"/>
             <ellipse cx="21" cy="19" rx="4" ry="3" fill="none" stroke="FG" stroke-width="1.5"/>` },

        // ── Fruit ───────────────────────────────────────────────────────────
        '🍌': { c: 'yellow', i:
            `<path d="M28 10c-2 4-6 14-16 16" fill="none" stroke="FG" stroke-width="3" stroke-linecap="round"/>
             <path d="M28 10c0 6-4 14-12 18" fill="none" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M28 10c2-2 2-4 0-4" stroke="FG" stroke-width="1.5" stroke-linecap="round" fill="none"/>` },

        '🍎': { c: 'red', i:
            `<path d="M20 10c-6-2-12 4-12 10 0 7 5 12 12 12s12-5 12-12c0-6-6-12-12-10z" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 10V7c2-2 4-2 5 0" stroke="FG" stroke-width="2" stroke-linecap="round" fill="none"/>
             <path d="M17 16a3 4 0 0 0 0 6" stroke="FG" stroke-width="1.2" stroke-linecap="round" fill="none" opacity="0.4"/>` },

        // ── Snacks / Sweets ─────────────────────────────────────────────────
        '🍩': { c: 'brown', i:
            `<circle cx="20" cy="20" r="10" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="20" cy="20" r="4" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M12 16c3-1 5 0 8-1s5-2 8 1" stroke="FG" stroke-width="1.5" fill="none" opacity="0.5"/>` },

        '🍪': { c: 'brown', i:
            `<circle cx="20" cy="20" r="11" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="16" cy="17" r="1.5" fill="FG"/><circle cx="23" cy="15" r="1.3" fill="FG"/>
             <circle cx="18" cy="24" r="1.5" fill="FG"/><circle cx="25" cy="22" r="1.2" fill="FG"/>
             <circle cx="14" cy="22" r="1" fill="FG"/>` },

        '🍫': { c: 'brown', i:
            `<rect x="10" y="12" width="20" height="16" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M10 18h20M10 24h20M17 12v16M24 12v16" stroke="FG" stroke-width="1.5"/>
             <path d="M8 14l4-4h16l4 4" stroke="FG" stroke-width="1.8" stroke-linejoin="round" fill="none"/>` },

        '🍬': { c: 'pink', i:
            `<rect x="13" y="15" width="14" height="10" rx="5" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M13 18l-5-2M13 22l-5 2M27 18l5-2M27 22l5 2" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '🍭': { c: 'pink', i:
            `<circle cx="20" cy="15" r="8" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 23v10" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>
             <path d="M14 11c3 0 3 4 6 4s3-4 6-4" stroke="FG" stroke-width="1.5" fill="none"/>
             <path d="M14 17c3 0 3 4 6 4s3-4 6-4" stroke="FG" stroke-width="1.5" fill="none" opacity="0.5"/>` },

        '🍿': { c: 'yellow', i:
            `<path d="M12 16h16l-2 14H14z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <circle cx="16" cy="13" r="3" fill="none" stroke="FG" stroke-width="1.8"/>
             <circle cx="24" cy="13" r="3" fill="none" stroke="FG" stroke-width="1.8"/>
             <circle cx="20" cy="11" r="3" fill="none" stroke="FG" stroke-width="1.8"/>` },

        '🎂': { c: 'pink', i:
            `<rect x="10" y="18" width="20" height="12" rx="3" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M10 24h20" stroke="FG" stroke-width="1.5"/>
             <path d="M16 18v-4M20 18v-4M24 18v-4" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <circle cx="16" cy="12" r="1.5" fill="FG"/><circle cx="20" cy="12" r="1.5" fill="FG"/><circle cx="24" cy="12" r="1.5" fill="FG"/>` },

        '🧁': { c: 'rose', i:
            `<path d="M14 18h12l-1 12H15z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M12 18c0-4 3-8 8-8s8 4 8 8z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <circle cx="20" cy="8" r="2" fill="FG"/>` },

        // ── Personal Care / Cleaning ────────────────────────────────────────
        '🧴': { c: 'lavender', i:
            `<rect x="14" y="16" width="12" height="14" rx="3" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M17 16v-4h6v4" stroke="FG" stroke-width="2"/>
             <path d="M19 12V9h2v3" stroke="FG" stroke-width="1.8"/>
             <path d="M14 23h12" stroke="FG" stroke-width="1.5"/>` },

        '🧻': { c: 'warmGray', i:
            `<ellipse cx="22" cy="20" rx="4" ry="10" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M22 10H14a4 10 0 0 0 0 20h8" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M14 14h8M14 20h8M14 26h8" stroke="FG" stroke-width="1.2" opacity="0.4"/>` },

        '🧼': { c: 'sky', i:
            `<rect x="10" y="14" width="20" height="14" rx="5" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="15" cy="11" r="2.5" fill="none" stroke="FG" stroke-width="1.5"/>
             <circle cx="21" cy="9" r="2" fill="none" stroke="FG" stroke-width="1.5"/>
             <circle cx="26" cy="12" r="1.5" fill="none" stroke="FG" stroke-width="1.5"/>` },

        '🧽': { c: 'yellow', i:
            `<rect x="10" y="12" width="20" height="16" rx="4" fill="none" stroke="FG" stroke-width="2"/>
             <circle cx="15" cy="18" r="1.2" fill="FG"/><circle cx="20" cy="16" r="1.2" fill="FG"/>
             <circle cx="25" cy="19" r="1.2" fill="FG"/><circle cx="17" cy="23" r="1.2" fill="FG"/>
             <circle cx="23" cy="24" r="1.2" fill="FG"/>` },

        '🪒': { c: 'slate', i:
            `<rect x="18" y="8" width="4" height="20" rx="1" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M14 28h12" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M18 12h4" stroke="FG" stroke-width="1.5"/>` },

        '🪥': { c: 'blue', i:
            `<path d="M10 20h14" stroke="FG" stroke-width="4" stroke-linecap="round"/>
             <rect x="24" y="16" width="8" height="8" rx="2" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M26 18v4M29 18v4" stroke="FG" stroke-width="1.2" stroke-linecap="round"/>` },

        '🫧': { c: 'sky', i:
            `<circle cx="15" cy="15" r="5" fill="none" stroke="FG" stroke-width="1.8"/>
             <circle cx="26" cy="13" r="3.5" fill="none" stroke="FG" stroke-width="1.8"/>
             <circle cx="22" cy="24" r="6" fill="none" stroke="FG" stroke-width="1.8"/>
             <circle cx="12" cy="27" r="2.5" fill="none" stroke="FG" stroke-width="1.5"/>
             <circle cx="30" cy="22" r="2" fill="none" stroke="FG" stroke-width="1.5"/>` },

        // ── Nature / Decorative ─────────────────────────────────────────────
        '🌱': { c: 'green', i:
            `<path d="M20 32v-14" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>
             <path d="M20 18c-8-2-10-8-8-12 4 0 8 4 8 12z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M20 24c6-2 8-6 7-10-3 0-7 3-7 10z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>` },

        '🌵': { c: 'green', i:
            `<path d="M20 8v24" stroke="FG" stroke-width="4" stroke-linecap="round"/>
             <path d="M20 16h-6v8h6" stroke="FG" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
             <path d="M20 20h5v6h-5" stroke="FG" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` },

        '🌸': { c: 'pink', i:
            `<circle cx="20" cy="20" r="3" fill="FG"/>
             <ellipse cx="20" cy="12" rx="3" ry="5" fill="none" stroke="FG" stroke-width="1.8"/>
             <ellipse cx="20" cy="28" rx="3" ry="5" fill="none" stroke="FG" stroke-width="1.8"/>
             <ellipse cx="12" cy="20" rx="5" ry="3" fill="none" stroke="FG" stroke-width="1.8"/>
             <ellipse cx="28" cy="20" rx="5" ry="3" fill="none" stroke="FG" stroke-width="1.8"/>
             <ellipse cx="14.3" cy="14.3" rx="4" ry="3" fill="none" stroke="FG" stroke-width="1.8" transform="rotate(-45 14.3 14.3)"/>` },

        '🌻': { c: 'amber', i:
            `<circle cx="20" cy="18" r="5" fill="FG"/>
             <path d="M20 7v3M20 26v3M11 18h3M26 18h3M13 11l2 2M25 11l-2 2M13 25l2-2M25 25l-2-2" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>
             <path d="M20 26v8" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '🌾': { c: 'amber', i:
            `<path d="M20 32V14" stroke="FG" stroke-width="2" stroke-linecap="round"/>
             <path d="M20 14l-4-6M20 18l-5-4M20 22l-4-3M20 14l4-6M20 18l5-4M20 22l4-3" stroke="FG" stroke-width="1.8" stroke-linecap="round" fill="none"/>
             <circle cx="16" cy="8" r="1.5" fill="FG"/><circle cx="24" cy="8" r="1.5" fill="FG"/>` },

        '🌿': { c: 'emerald', i:
            `<path d="M10 30c2-8 6-14 14-18" stroke="FG" stroke-width="2.5" stroke-linecap="round" fill="none"/>
             <path d="M14 26c0-6 4-10 10-12" stroke="FG" stroke-width="1.5" fill="none" opacity="0.5"/>
             <path d="M12 28l-2 2M18 22l-3 4M22 16l-2 4" stroke="FG" stroke-width="1.5" stroke-linecap="round"/>` },

        '🍀': { c: 'green', i:
            `<path d="M20 20c-4-2-10-2-10 4s6 6 10 4" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 20c2-4 2-10-4-10s-6 6-4 10" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 20c4 2 10 2 10-4s-6-6-10-4" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 20c-2 4-2 10 4 10s6-6 4-10" fill="none" stroke="FG" stroke-width="2"/>
             <path d="M20 20v12" stroke="FG" stroke-width="2" stroke-linecap="round"/>` },

        '🍃': { c: 'emerald', i:
            `<path d="M10 28C14 16 22 8 32 8c0 10-8 18-20 22z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M10 28C18 22 26 14 32 8" stroke="FG" stroke-width="1.5" fill="none"/>
             <path d="M16 24c4-4 8-6 12-8" stroke="FG" stroke-width="1.2" fill="none" opacity="0.4"/>` },

        '🎋': { c: 'green', i:
            `<path d="M20 8v24" stroke="FG" stroke-width="2.5" stroke-linecap="round"/>
             <path d="M20 12l-8 4c4-1 8 0 8 0" fill="none" stroke="FG" stroke-width="1.8" stroke-linejoin="round"/>
             <path d="M20 18l8 4c-4-1-8 0-8 0" fill="none" stroke="FG" stroke-width="1.8" stroke-linejoin="round"/>
             <path d="M20 24l-6 3c3-1 6 0 6 0" fill="none" stroke="FG" stroke-width="1.8" stroke-linejoin="round"/>` },

        '🪴': { c: 'green', i:
            `<path d="M14 28h12l-1-6H15z" fill="none" stroke="FG" stroke-width="2" stroke-linejoin="round"/>
             <path d="M18 22v-4c-4-1-6-4-5-8" stroke="FG" stroke-width="2" stroke-linecap="round" fill="none"/>
             <path d="M22 22v-4c4-1 6-4 5-8" stroke="FG" stroke-width="2" stroke-linecap="round" fill="none"/>
             <path d="M20 18v-6c0-4-3-6-3-6" stroke="FG" stroke-width="2" stroke-linecap="round" fill="none"/>` },
    };


    // =========================================================================
    //  SHARED SVG <defs>  (gradients + filters, one per palette colour)
    // =========================================================================

    let _defsInjected = false;
    let _idCtr = 0;   // counter for unique IDs when defs aren't on page yet

    function injectSharedDefs() {
        if (_defsInjected) return;
        _defsInjected = true;

        let defs = '';
        let darkCss = '';
        for (const [name, col] of Object.entries(P)) {
            // Light-mode gradient (subtle glass)
            defs += `
                <linearGradient id="gm-g-${name}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"   stop-color="${col.bg}" stop-opacity="0.38"/>
                    <stop offset="100%" stop-color="${col.bg}" stop-opacity="0.10"/>
                </linearGradient>`;
            // Dark-mode gradient (stronger glass)
            defs += `
                <linearGradient id="gm-gd-${name}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%"   stop-color="${col.bg}" stop-opacity="0.55"/>
                    <stop offset="100%" stop-color="${col.bg}" stop-opacity="0.22"/>
                </linearGradient>`;
            // Filter (shared)
            defs += `
                <filter id="gm-f-${name}" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="2.5"
                                  flood-color="${col.bg}" flood-opacity="0.30"/>
                </filter>`;
            // Dark-mode CSS: swap fg color + gradient
            darkCss += `body.dark-mode .gm-icon[data-gm-palette="${name}"]{color:${col.fgD}}`;
            darkCss += `body.dark-mode .gm-icon[data-gm-palette="${name}"] .gm-bg{fill:url(#gm-gd-${name})}`;
        }

        // Inject shared SVG defs
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.setAttribute('aria-hidden', 'true');
        svg.style.position = 'absolute';
        svg.style.pointerEvents = 'none';
        svg.id = 'gm-shared-defs';
        svg.innerHTML = `<defs>${defs}</defs>`;
        document.body.insertBefore(svg, document.body.firstChild);

        // Inject dark-mode CSS for per-palette color + gradient swapping
        const style = document.createElement('style');
        style.id = 'gm-dark-mode-css';
        style.textContent = darkCss +
            'body.dark-mode .gm-icon .gm-bg{stroke:rgba(255,255,255,0.22)}' +
            'body.dark-mode .gm-icon .gm-highlight{fill:rgba(255,255,255,0.06)}';
        document.head.appendChild(style);
    }


    // =========================================================================
    //  BUILD SVG STRING
    // =========================================================================

    /**
     * Return an HTML string for the glassmorphic SVG icon.
     * @param {string} emoji — The emoji character to convert
     * @returns {string} — HTML string for the icon, or the original emoji if unknown
     */
    function buildSVG(emoji) {
        // Normalise variant selectors
        const key = emoji.replace(/\uFE0F/g, '');
        const def = ICONS[emoji] || ICONS[key] || ICONS[emoji + '\uFE0F'];
        if (!def) return emoji;                               // unknown → pass through

        const col  = P[def.c] || P.slate;
        const cName = def.c || 'slate';

        let innerContent;

        if (def.i) {
            // Custom icon: use currentColor so CSS can control fg per mode
            innerContent = def.i.replace(/FG/g, 'currentColor');
        } else if (def.t) {
            // Text-fallback: render the emoji inside the SVG as <text>
            innerContent =
                `<text x="20" y="27" font-size="18" text-anchor="middle" fill="currentColor">${def.t}</text>`;
        } else {
            return emoji;
        }

        // Build the full SVG with glass background
        return `<span class="gm-icon" data-gm-palette="${cName}" role="img" aria-label="${emoji}" style="color:${col.fg}">` +
            `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">` +
                // Glass background
                `<rect class="gm-bg" x="2" y="2" width="36" height="36" rx="11" ` +
                    `fill="url(#gm-g-${cName})" ` +
                    `stroke="rgba(255,255,255,0.55)" stroke-width="1" ` +
                    `filter="url(#gm-f-${cName})"/>` +
                // Top highlight (frosted refraction)
                `<rect class="gm-highlight" x="4" y="4" width="32" height="15" rx="9" ` +
                    `fill="rgba(255,255,255,0.18)"/>` +
                // Icon content
                `<g class="gm-icon-path">${innerContent}</g>` +
            `</svg>` +
        `</span>`;
    }


    // =========================================================================
    //  EMOJI REGEX
    //  Matches all emojis we have definitions for + common emoji ranges.
    // =========================================================================

    // Build a regex alternation from all defined emoji keys, sorted longest first
    // so multi-codepoint emojis match before their base characters.
    const _emojiKeys = Object.keys(ICONS)
        .sort((a, b) => b.length - a.length)
        .map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
        .join('|');
    const EMOJI_RE = new RegExp(`(${_emojiKeys})`, 'g');


    // =========================================================================
    //  DOM WALKER  —  Replace emoji characters in text nodes
    // =========================================================================

    const SKIP_TAGS = new Set([
        'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION',
        'CODE', 'PRE', 'SVG', 'CANVAS', 'NOSCRIPT',
    ]);

    const PROCESSED  = 'data-gm-done';
    const SKIP_ATTR  = 'data-no-emoji-svg';   // opt-out attribute for emoji pickers etc.

    /** Check whether el or any ancestor has the skip attribute */
    function isInsideSkipZone(el) {
        let n = el;
        while (n && n !== document.body) {
            if (n.nodeType === 1 && n.hasAttribute && n.hasAttribute(SKIP_ATTR)) return true;
            n = n.parentElement;
        }
        return false;
    }

    /**
     * Walk a subtree and replace emoji text with SVG icons.
     */
    function processNode(root) {
        if (!root) return;
        if (root.nodeType === 1 && root.hasAttribute && root.hasAttribute(PROCESSED)) return;
        if (root.nodeType === 1 && SKIP_TAGS.has(root.tagName)) return;
        if (root.classList && root.classList.contains('gm-icon')) return;
        if (root.nodeType === 1 && isInsideSkipZone(root)) return;

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const p = node.parentElement;
                if (!p) return NodeFilter.FILTER_REJECT;
                if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT;
                if (p.classList && p.classList.contains('gm-icon')) return NodeFilter.FILTER_REJECT;
                if (p.hasAttribute && p.hasAttribute(PROCESSED)) return NodeFilter.FILTER_REJECT;
                if (isInsideSkipZone(p)) return NodeFilter.FILTER_REJECT;
                if (!EMOJI_RE.test(node.textContent)) return NodeFilter.FILTER_REJECT;
                EMOJI_RE.lastIndex = 0;
                return NodeFilter.FILTER_ACCEPT;
            }
        });

        const textNodes = [];
        let n;
        while ((n = walker.nextNode())) textNodes.push(n);

        for (const textNode of textNodes) {
            EMOJI_RE.lastIndex = 0;
            const text = textNode.textContent;
            if (!EMOJI_RE.test(text)) continue;
            EMOJI_RE.lastIndex = 0;

            const html = text.replace(EMOJI_RE, (match) => buildSVG(match));
            if (html === text) continue;

            const wrapper = document.createElement('span');
            wrapper.setAttribute(PROCESSED, '1');
            wrapper.innerHTML = html;
            textNode.parentNode.replaceChild(wrapper, textNode);
        }
    }


    // =========================================================================
    //  MUTATION OBSERVER  —  Auto-replace in dynamically added content
    // =========================================================================

    let _observer = null;
    let _pendingMutations = [];
    let _mutationTimer = null;

    function flushMutations() {
        _mutationTimer = null;
        const nodes = _pendingMutations.splice(0);
        const seen = new Set();
        for (const node of nodes) {
            if (seen.has(node)) continue;
            seen.add(node);
            processNode(node);
        }
    }

    function startObserver() {
        if (_observer) return;
        _observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1 || node.nodeType === 3) {
                        _pendingMutations.push(node.nodeType === 3 ? node.parentElement : node);
                    }
                }
            }
            if (_pendingMutations.length && !_mutationTimer) {
                _mutationTimer = requestAnimationFrame(flushMutations);
            }
        });
        _observer.observe(document.body, { childList: true, subtree: true });
    }


    // =========================================================================
    //  INITIALISE
    // =========================================================================

    function init() {
        injectSharedDefs();
        processNode(document.body);
        startObserver();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }


    // =========================================================================
    //  PUBLIC API
    // =========================================================================

    /**
     * Convert an emoji character to its glassmorphic SVG HTML string.
     * Usage in template literals:  `${emojiSVG('📊')} Sales Performance`
     */
    window.emojiToSVG = buildSVG;

    /**
     * Manually process a DOM subtree for emoji replacement.
     * Useful after programmatically setting innerHTML.
     */
    window.processEmojis = processNode;

})();
