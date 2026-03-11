/**
 * dialog-system.js — DialogSystem V5: glassmorphic alert / confirm dialogs.
 *
 * IIFE that exposes `window.DialogSystem` with two async methods:
 *   • DialogSystem.alert(message, icon)    → Promise<void>
 *   • DialogSystem.confirm(message, icon)  → Promise<boolean>
 *
 * Each method creates a blurred-overlay modal, returns a Promise,
 * and cleans up after itself.  Styles are injected once via init().
 *
 * Dependencies: none (self-contained).
 */

(function() {
    if (window.DialogSystem) {
        console.log("ℹ️ DialogSystem already initialized.");
        return;
    }

    const DialogSystem = {
        init() {
            if (document.getElementById('customDialogOverlay')) return;
            
            const overlay = document.createElement('div');
            overlay.id = 'customDialogOverlay';
            overlay.className = 'dialog-overlay';
            document.body.appendChild(overlay);
            
            const style = document.createElement('style');
            style.textContent = `
                .dialog-overlay {
                    position: fixed; 
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0, 0, 0, 0.5); 
                    backdrop-filter: blur(12px);
                    display: none; 
                    justify-content: center; 
                    align-items: center;
                    z-index: 20000; 
                    animation: fadeIn 0.3s ease;
                }
                .dialog-overlay.active { display: flex; }
                
                .dialog-box {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9));
                    backdrop-filter: blur(20px);
                    border-radius: 28px; 
                    padding: 45px 40px 40px;
                    width: 90%; 
                    max-width: 450px;
                    box-shadow: 
                        0 30px 80px rgba(0, 0, 0, 0.25),
                        0 0 0 1px rgba(255, 255, 255, 0.3) inset;
                    animation: scaleSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }

                .dialog-box::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 8px;
                    background: linear-gradient(90deg, 
                        #cbdfbd 0%, 
                        #a8c99c 25%, 
                        #d4e09b 50%, 
                        #f3c291 75%, 
                        #cbdfbd 100%);
                    animation: shimmer 3s linear infinite;
                }

                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                body.dark-mode .dialog-box {
                    background: linear-gradient(135deg, rgba(45, 55, 72, 0.95), rgba(45, 55, 72, 0.9));
                    box-shadow: 
                        0 30px 80px rgba(0, 0, 0, 0.6),
                        0 0 0 1px rgba(255, 255, 255, 0.1) inset;
                }

                .dialog-icon-wrapper {
                    width: 90px;
                    height: 90px;
                    margin: 0 auto 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #cbdfbd 0%, #a8c99c 100%);
                    box-shadow: 
                        0 12px 35px rgba(203, 223, 189, 0.5),
                        0 0 0 8px rgba(203, 223, 189, 0.15);
                    animation: iconBounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s backwards;
                    position: relative;
                }

                .dialog-icon-wrapper::before {
                    content: '';
                    position: absolute;
                    inset: -8px;
                    border-radius: 50%;
                    border: 2px solid transparent;
                    background: linear-gradient(135deg, rgba(203, 223, 189, 0.3), rgba(168, 201, 156, 0.3)) border-box;
                    -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
                    mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    animation: rotate 3s linear infinite;
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @keyframes iconBounceIn {
                    0% { 
                        transform: scale(0) rotate(-180deg); 
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.15) rotate(10deg);
                    }
                    100% { 
                        transform: scale(1) rotate(0deg); 
                        opacity: 1;
                    }
                }

                .dialog-icon { 
                    font-size: 52px;
                    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.15));
                    animation: iconPulse 2s ease-in-out infinite;
                }

                @keyframes iconPulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .dialog-title {
                    font-size: 26px;
                    font-weight: 900;
                    background: linear-gradient(135deg, #2d3748, #5D534A);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin: 0 0 14px 0;
                    letter-spacing: -0.5px;
                    animation: slideDown 0.4s ease 0.2s backwards;
                }

                body.dark-mode .dialog-title {
                    background: linear-gradient(135deg, #f7fafc, #cbd5e0);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .dialog-message { 
                    font-size: 16px;
                    line-height: 1.7; 
                    color: #718096;
                    font-weight: 500;
                    margin-bottom: 35px;
                    animation: slideDown 0.4s ease 0.3s backwards;
                }

                body.dark-mode .dialog-message { 
                    color: #cbd5e0; 
                }

                .dialog-input {
                    width: 100%; 
                    padding: 16px 20px; 
                    border: 2px solid rgba(203, 223, 189, 0.3);
                    border-radius: 14px; 
                    margin-bottom: 28px; 
                    font-size: 17px;
                    font-weight: 600;
                    color: #2d3748;
                    background: rgba(247, 250, 252, 0.8);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-sizing: border-box;
                }

                .dialog-input:focus {
                    outline: none;
                    border-color: #cbdfbd;
                    background: white;
                    transform: translateY(-2px);
                    box-shadow: 
                        0 8px 25px rgba(203, 223, 189, 0.25),
                        0 0 0 4px rgba(203, 223, 189, 0.15);
                }

                body.dark-mode .dialog-input {
                    background: rgba(74, 85, 104, 0.5);
                    color: #f7fafc;
                    border-color: rgba(203, 223, 189, 0.2);
                }

                .dialog-buttons { 
                    display: flex; 
                    flex-direction: column;
                    gap: 14px;
                    animation: slideDown 0.4s ease 0.35s backwards;
                }
                
                .dialog-btn {
                    width: 100%;
                    padding: 18px 28px; 
                    border: none; 
                    border-radius: 16px;
                    font-weight: 800; 
                    font-size: 16px;
                    cursor: pointer; 
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
                    text-transform: none;
                    letter-spacing: -0.2px;
                    position: relative;
                    overflow: hidden;
                }

                .dialog-btn::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.3);
                    transform: translate(-50%, -50%);
                    transition: width 0.6s, height 0.6s;
                }

                .dialog-btn:active::before {
                    width: 300px;
                    height: 300px;
                }

                /* PRIMARY BUTTON — Green Confirm */
                .dialog-btn-primary { 
                    background: var(--btn-green-bg);
                    color: var(--btn-green-text);
                    box-shadow: var(--btn-green-shadow);
                    text-shadow: none;
                }

                .dialog-btn-primary:hover {
                    background: var(--btn-green-hover);
                    transform: translateY(-3px);
                    box-shadow: var(--btn-green-shadow-hover);
                }

                .dialog-btn-primary:active {
                    transform: translateY(-1px);
                }

                /* SECONDARY BUTTON — Red Cancel */
                .dialog-btn-secondary { 
                    background: var(--btn-red-bg) !important;
                    color: var(--btn-red-text) !important;
                    border: none !important;
                    box-shadow: var(--btn-red-shadow) !important;
                }

                .dialog-btn-secondary:hover {
                    background: var(--btn-red-hover) !important;
                    color: var(--btn-red-text) !important;
                    border: none !important;
                    transform: translateY(-3px) !important;
                    box-shadow: var(--btn-red-shadow-hover) !important;
                }

                /* DARK MODE — Secondary Button */
                body.dark-mode .dialog-btn-secondary {
                    background: var(--btn-red-bg) !important;
                    color: var(--btn-red-text) !important;
                    border: none !important;
                    box-shadow: var(--btn-red-shadow) !important;
                }

                body.dark-mode .dialog-btn-secondary:hover {
                    background: var(--btn-red-hover) !important;
                    color: var(--btn-red-text) !important;
                    border: none !important;
                    transform: translateY(-3px) !important;
                    box-shadow: var(--btn-red-shadow-hover) !important;
                }
                
                @keyframes fadeIn { 
                    from { opacity: 0; } 
                    to { opacity: 1; } 
                }

                @keyframes scaleSlideIn { 
                    from { 
                        transform: scale(0.8) translateY(30px); 
                        opacity: 0; 
                    } 
                    to { 
                        transform: scale(1) translateY(0); 
                        opacity: 1; 
                    } 
                }

                /* Floating particles effect */
                .dialog-box::after {
                    content: '';
                    position: absolute;
                    width: 200%;
                    height: 200%;
                    top: -50%;
                    left: -50%;
                    background: 
                        radial-gradient(circle at 20% 30%, rgba(203, 223, 189, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, rgba(168, 201, 156, 0.1) 0%, transparent 50%);
                    animation: float 8s ease-in-out infinite;
                    pointer-events: none;
                }

                @keyframes float {
                    0%, 100% { transform: translate(0, 0) rotate(0deg); }
                    33% { transform: translate(30px, -30px) rotate(120deg); }
                    66% { transform: translate(-20px, 20px) rotate(240deg); }
                }

                @media (max-width: 480px) {
                    .dialog-box {
                        width: 95%;
                        padding: 40px 30px 35px;
                    }

                    .dialog-icon-wrapper {
                        width: 80px;
                        height: 80px;
                    }

                    .dialog-icon {
                        font-size: 46px;
                    }

                    .dialog-title {
                        font-size: 22px;
                    }
                }
            `;
            document.head.appendChild(style);
        },

        _handleClose(result, resolve) {
            if (window.playClickSound) window.playClickSound();
            const overlay = document.getElementById('customDialogOverlay');
            const dialogBox = overlay.querySelector('.dialog-box');
            
            if (dialogBox) {
                dialogBox.style.animation = 'scaleSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
            }
            
            setTimeout(() => {
                overlay.classList.remove('active');
                setTimeout(() => {
                    overlay.innerHTML = '';
                    resolve(result);
                }, 100);
            }, 200);
        },

        alert(message, icon = '✅') {
            return new Promise(resolve => {
                this.init();
                const overlay = document.getElementById('customDialogOverlay');
                overlay.innerHTML = `
                    <div class="dialog-box">
                        <div class="dialog-icon-wrapper">
                            <span class="dialog-icon">${icon}</span>
                        </div>
                        <h3 class="dialog-title">Perfect!</h3>
                        <div class="dialog-message">${message}</div>
                        <div class="dialog-buttons">
                            <button class="dialog-btn dialog-btn-primary" id="dialogOkBtn">Got it!</button>
                        </div>
                    </div>
                `;
                overlay.classList.add('active');
                
                const okBtn = document.getElementById('dialogOkBtn');
                okBtn.onclick = () => this._handleClose(true, resolve);
                
                // Auto-close after 3 seconds for success messages
                setTimeout(() => {
                    if (overlay.classList.contains('active')) {
                        this._handleClose(true, resolve);
                    }
                }, 3000);
            });
        },

        confirm(message, icon = '❓') {
            return new Promise(resolve => {
                this.init();
                const overlay = document.getElementById('customDialogOverlay');
                overlay.innerHTML = `
                    <div class="dialog-box">
                        <div class="dialog-icon-wrapper">
                            <span class="dialog-icon">${icon}</span>
                        </div>
                        <h3 class="dialog-title">Confirm Action</h3>
                        <div class="dialog-message">${message}</div>
                        <div class="dialog-buttons">
                            <button class="dialog-btn dialog-btn-primary" id="dialogConfirmBtn">Confirm</button>
                            <button class="dialog-btn dialog-btn-secondary" id="dialogCancelBtn">Cancel</button>
                        </div>
                    </div>
                `;
                overlay.classList.add('active');
                document.getElementById('dialogConfirmBtn').onclick = () => this._handleClose(true, resolve);
                document.getElementById('dialogCancelBtn').onclick = () => this._handleClose(false, resolve);
            });
        }
    };

    window.DialogSystem = DialogSystem;
    console.log("✅ DialogSystem V5 initialized with RED cancel button styling.");
})();