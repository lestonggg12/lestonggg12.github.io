/**
 * dark-mode.js — Early-load theme initialiser (IIFE).
 *
 * Loaded in the <head> BEFORE other scripts so the dark-mode class is
 * applied to <html> before first paint, preventing a white flash.
 *
 * Exposes:
 *   window.toggleDarkMode() — called by settings.js when the user
 *   switches the theme toggle.
 */
(function() {
    'use strict';
    
    // 1. Apply saved theme immediately (prevents white flash on dark mode)
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-mode');
        document.body?.classList.add('dark-mode');
    }

    // 2. Global Toggle Function (Called by Settings)
    window.toggleDarkMode = function() {
        const isDark = document.body.classList.toggle('dark-mode');
        document.documentElement.classList.toggle('dark-mode');
        const theme = isDark ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
        console.log(`🌓 Theme switched to: ${theme}`);
        return isDark;
    };

    console.log('✓ Dark mode engine initialized (No floating moon)');
})();