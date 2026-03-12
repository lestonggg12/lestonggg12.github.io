/**
 * loading.js — Neo-Glassmorphic Full-Screen Loading Overlay
 *
 * Shows a full-screen glassmorphic loading overlay on EVERY API call,
 * blocking all user interaction until the request completes.
 *
 * Features:
 *   - Full-screen blocking overlay with animated gradient background
 *   - Glass-card spinner with conic-gradient ring
 *   - Connection speed indicator (Fast / Slow / Very Slow)
 *   - Offline banner
 *   - Dark mode support
 *
 * No dependencies. Pure vanilla JS.
 */

(function () {
    'use strict';

    // =========================================================================
    //  CONFIG
    // =========================================================================

    const CFG = {
        fastThreshold:   500,
        slowThreshold:   1500,
        minShowTime:     300,
        hideDelay:       600,
        pillHideDelay:   3000,
    };

    // =========================================================================
    //  STATE
    // =========================================================================

    let activeRequests = 0;
    let pillTimer      = null;
    let startTime      = null;

    // =========================================================================
    //  INJECT STYLES
    // =========================================================================

    (function injectStyles() {
        if (document.getElementById('neo-loading-styles')) return;

        const style = document.createElement('style');
        style.id    = 'neo-loading-styles';
        style.textContent = `

            /* -- FULL-SCREEN OVERLAY -- */
            #neoLoadingOverlay {
                position: fixed;
                inset: 0;
                z-index: 1000000;
                display: flex;
                justify-content: center;
                align-items: center;
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                            visibility 0s linear 0.35s;

                /* Animated gradient backdrop */
                background: linear-gradient(
                    135deg,
                    rgba(45, 80, 56, 0.70),
                    rgba(93, 148, 88, 0.55),
                    rgba(135, 179, 130, 0.45),
                    rgba(210, 235, 200, 0.40)
                );
                background-size: 400% 400%;
                animation: neoOverlayBg 10s ease infinite;
                backdrop-filter: blur(18px) saturate(1.4);
                -webkit-backdrop-filter: blur(18px) saturate(1.4);
            }

            #neoLoadingOverlay.active {
                opacity: 1;
                visibility: visible;
                pointer-events: all;
                transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                            visibility 0s linear 0s;
            }

            @keyframes neoOverlayBg {
                0%   { background-position: 0% 50%; }
                50%  { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }

            /* -- GLASS CARD -- */
            #neoLoadingOverlay .neo-glass-card {
                width: 220px;
                height: 220px;
                border-radius: 36px;
                backdrop-filter: blur(30px) saturate(1.6);
                -webkit-backdrop-filter: blur(30px) saturate(1.6);
                background: rgba(255, 255, 255, 0.13);
                border: 1.5px solid rgba(255, 255, 255, 0.30);
                box-shadow:
                    20px 20px 50px rgba(30, 60, 35, 0.35),
                    -12px -12px 35px rgba(255, 255, 255, 0.18),
                    inset 6px 6px 20px rgba(255, 255, 255, 0.18),
                    inset -6px -6px 20px rgba(0, 0, 0, 0.08);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                gap: 0;
                transform: scale(0.85);
                opacity: 0;
                transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                            opacity 0.3s ease;
            }

            #neoLoadingOverlay.active .neo-glass-card {
                transform: scale(1);
                opacity: 1;
            }

            /* -- SPINNER -- */
            #neoLoadingOverlay .neo-spinner {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: conic-gradient(
                    #2d5a3b,
                    #5d9458,
                    #87B382,
                    #a8e6b0,
                    #2d5a3b
                );
                -webkit-mask: radial-gradient(farthest-side, transparent 62%, #000 63%);
                mask: radial-gradient(farthest-side, transparent 62%, #000 63%);
                animation: neoSpin 1.1s linear infinite;
                box-shadow:
                    0 0 30px rgba(93, 148, 88, 0.50),
                    0 0 60px rgba(135, 179, 130, 0.25);
            }

            @keyframes neoSpin {
                to { transform: rotate(360deg); }
            }

            /* -- TEXT -- */
            #neoLoadingOverlay .neo-loading-text {
                margin-top: 22px;
                letter-spacing: 5px;
                font-size: 13px;
                font-weight: 800;
                text-transform: uppercase;
                color: rgba(255, 255, 255, 0.88);
                text-shadow: 0 1px 6px rgba(0, 0, 0, 0.15);
                font-family: 'Quicksand', 'Segoe UI', sans-serif;
                animation: neoPulseText 2s ease-in-out infinite;
            }

            @keyframes neoPulseText {
                0%, 100% { opacity: 0.88; }
                50%      { opacity: 0.5; }
            }

            /* -- DARK MODE -- */
            body.dark-mode #neoLoadingOverlay {
                background: linear-gradient(
                    135deg,
                    rgba(10, 25, 15, 0.80),
                    rgba(20, 50, 30, 0.70),
                    rgba(30, 60, 40, 0.60),
                    rgba(15, 35, 20, 0.75)
                );
                background-size: 400% 400%;
                animation: neoOverlayBg 10s ease infinite;
            }

            body.dark-mode #neoLoadingOverlay .neo-glass-card {
                background: rgba(20, 40, 25, 0.30);
                border-color: rgba(135, 179, 130, 0.18);
                box-shadow:
                    20px 20px 50px rgba(0, 0, 0, 0.50),
                    -12px -12px 35px rgba(135, 179, 130, 0.08),
                    inset 6px 6px 20px rgba(135, 179, 130, 0.06),
                    inset -6px -6px 20px rgba(0, 0, 0, 0.15);
            }

            body.dark-mode #neoLoadingOverlay .neo-spinner {
                background: conic-gradient(
                    #0d3320,
                    #1b6b3a,
                    #4ade80,
                    #86efac,
                    #0d3320
                );
                box-shadow:
                    0 0 30px rgba(74, 222, 128, 0.35),
                    0 0 60px rgba(74, 222, 128, 0.15);
            }

            body.dark-mode #neoLoadingOverlay .neo-loading-text {
                color: rgba(200, 236, 196, 0.85);
            }

            /* -- CONNECTION SPEED PILL -- */
            #neoSpeedPill {
                position: fixed;
                bottom: 80px;
                right: 16px;
                z-index: 999998;
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 16px;
                border-radius: 999px;
                font-family: 'Quicksand', 'Segoe UI', sans-serif;
                font-size: 13px;
                font-weight: 700;
                white-space: nowrap;
                pointer-events: none;
                opacity: 0;
                transform: translateY(12px) scale(0.92);
                transition: opacity 0.3s cubic-bezier(0.4,0,0.2,1),
                            transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                box-shadow: 0 6px 24px rgba(0,0,0,0.18),
                            0 1px 6px rgba(0,0,0,0.10);
                border: 1px solid rgba(255,255,255,0.18);
            }

            @media (max-width: 768px) {
                #neoSpeedPill {
                    bottom: 72px;
                    left: 50%;
                    right: auto;
                    transform: translateX(-50%) translateY(12px) scale(0.92);
                }
                #neoSpeedPill.visible {
                    transform: translateX(-50%) translateY(0) scale(1) !important;
                }
            }

            #neoSpeedPill.visible {
                opacity: 1;
                transform: translateY(0) scale(1);
            }

            #neoSpeedPill.fast {
                background: rgba(209, 250, 229, 0.92);
                color: #065f46;
                border-color: rgba(52, 211, 153, 0.4);
            }
            #neoSpeedPill.medium {
                background: rgba(254, 243, 199, 0.92);
                color: #78350f;
                border-color: rgba(251, 191, 36, 0.4);
            }
            #neoSpeedPill.slow {
                background: rgba(254, 226, 226, 0.92);
                color: #7f1d1d;
                border-color: rgba(248, 113, 113, 0.4);
            }

            body.dark-mode #neoSpeedPill.fast {
                background: rgba(20, 60, 40, 0.95);
                color: #6ee7b7;
                border-color: rgba(52, 211, 153, 0.25);
            }
            body.dark-mode #neoSpeedPill.medium {
                background: rgba(60, 45, 10, 0.95);
                color: #fcd34d;
                border-color: rgba(251, 191, 36, 0.25);
            }
            body.dark-mode #neoSpeedPill.slow {
                background: rgba(60, 20, 20, 0.95);
                color: #fca5a5;
                border-color: rgba(248, 113, 113, 0.25);
            }

            #neoSpeedPill .pill-dot {
                width: 9px;
                height: 9px;
                border-radius: 50%;
                flex-shrink: 0;
            }
            #neoSpeedPill.fast   .pill-dot { background: #10b981; }
            #neoSpeedPill.medium .pill-dot { background: #f59e0b; }
            #neoSpeedPill.slow   .pill-dot { background: #ef4444; animation: neoPillPulse 0.7s ease-in-out infinite; }

            @keyframes neoPillPulse {
                0%, 100% { transform: scale(1);   opacity: 1; }
                50%      { transform: scale(1.5); opacity: 0.6; }
            }


        `;
        document.head.appendChild(style);
    })();

    // =========================================================================
    //  CREATE DOM ELEMENTS
    // =========================================================================

    function createElements() {
        if (document.getElementById('neoLoadingOverlay')) return;

        // Full-screen overlay
        const overlay = document.createElement('div');
        overlay.id    = 'neoLoadingOverlay';
        overlay.innerHTML =
            '<div class="neo-glass-card">' +
                '<div class="neo-spinner"></div>' +
                '<div class="neo-loading-text">Loading</div>' +
            '</div>';
        document.body.appendChild(overlay);

        // Speed pill
        const pill = document.createElement('div');
        pill.id    = 'neoSpeedPill';
        pill.innerHTML = '<div class="pill-dot"></div><span class="pill-text"></span>';
        document.body.appendChild(pill);


    }

    if (document.body) {
        createElements();
    } else {
        document.addEventListener('DOMContentLoaded', createElements);
    }

    // =========================================================================
    //  OVERLAY CONTROLS
    // =========================================================================

    function overlayShow() {
        const overlay = document.getElementById('neoLoadingOverlay');
        if (overlay) overlay.classList.add('active');
    }

    function overlayHide() {
        const overlay = document.getElementById('neoLoadingOverlay');
        if (!overlay) return;
        overlay.classList.remove('active');
    }

    // =========================================================================
    //  PILL CONTROLS
    // =========================================================================

    function pillShow(state, text) {
        const pill = document.getElementById('neoSpeedPill');
        if (!pill) return;
        clearTimeout(pillTimer);
        pill.className = 'visible ' + state;
        pill.innerHTML = '<div class="pill-dot"></div><span class="pill-text">' + text + '</span>';
    }

    function pillHide() {
        const pill = document.getElementById('neoSpeedPill');
        if (!pill) return;
        pillTimer = setTimeout(function () {
            pill.classList.remove('visible');
        }, CFG.pillHideDelay);
    }

    // =========================================================================
    //  REQUEST TRACKING
    // =========================================================================

    function onRequestStart() {
        activeRequests++;
        if (activeRequests === 1) {
            startTime = Date.now();
            overlayShow();
        }
    }

    function onRequestEnd(durationMs) {
        activeRequests = Math.max(0, activeRequests - 1);
        if (activeRequests > 0) return;

        overlayHide();

        let state, label;
        if (durationMs < CFG.fastThreshold) {
            state = 'fast';
            label = '\uD83D\uDFE2 Fast (' + durationMs + 'ms)';
        } else if (durationMs < CFG.slowThreshold) {
            state = 'medium';
            label = '\uD83D\uDFE1 Slow (' + durationMs + 'ms)';
        } else {
            state = 'slow';
            label = '\uD83D\uDD34 Very Slow (' + (durationMs / 1000).toFixed(1) + 's)';
        }

        pillShow(state, label);
        pillHide();
    }

    function onRequestError(url) {
        activeRequests = Math.max(0, activeRequests - 1);
        if (activeRequests > 0) return;
        overlayHide();
        // Suppress pill for /api/get-settings/
        if (url && url.indexOf('/api/get-settings/') !== -1) return;
        pillShow('slow', '\u26A0\uFE0F Request failed');
        pillHide();
    }

    // =========================================================================
    //  INTERCEPT fetch()
    // =========================================================================

    const _originalFetch = window.fetch;

    window.fetch = function () {
        const args  = arguments;
        const url   = (typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url)) || '';
        const track = url.indexOf('/api/') !== -1 || url.indexOf('/api') === 0;

        if (track) onRequestStart();

        const t0 = Date.now();

        return _originalFetch.apply(this, args).then(
            function (response) {
                if (track) onRequestEnd(Date.now() - t0);
                return response;
            },
            function (error) {
                if (track) onRequestError(url);
                throw error;
            }
        );
    };



    // =========================================================================
    //  EXPOSE MANUAL API
    // =========================================================================

    window.LoadingIndicator = {
        start:  onRequestStart,
        finish: function (ms) { onRequestEnd(ms || 0); },
        error:  onRequestError,
    };

    console.log('loading.js — neo-glassmorphic loading overlay active');

})();
