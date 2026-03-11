/*
  ╔══════════════════════════════════════════════════════════════════════════════╗
  ║  cart.js — The shopping cart system for the SariSari Store app             ║
  ║                                                                            ║
  ║  FILE STRUCTURE (6 sections):                                              ║
  ║                                                                            ║
  ║  1. CART OPERATIONS    Modify the cart array (add, remove, update, clear)   ║
  ║  2. CART DISPLAY       Render cart items in the side-panel + overlay logic  ║
  ║  3. CHECKOUT FLOW      Payment method dialog → cash calculator or debt     ║
  ║                        recording → completion with stock decrement         ║
  ║  4. PRODUCT SEARCH     Search bar with debounced input + inline spinner    ║
  ║  5. INITIALISATION     Wire up DOM events on page load                     ║
  ║  6. STYLE INJECTORS    Inject CSS-in-JS for modals and checkout dialogs    ║
  ║                                                                            ║
  ║  STATE:                                                                    ║
  ║  • `cart` array — each item: { id, name, price, cost, quantity }           ║
  ║  • `isCartPanelOpen` boolean — tracks side-panel visibility                ║
  ║                                                                            ║
  ║  DEPENDENCIES:                                                             ║
  ║  • database.js → DB.getProducts(), DB.addSale(), DB.updateProduct(), etc.  ║
  ║  • dialog-system.js → DialogSystem.alert() for user-facing messages        ║
  ╚══════════════════════════════════════════════════════════════════════════════╝
*/

console.log('🔄 Cart.js loaded - Version 10');

// The in-memory cart array. Each entry holds { id, name, price, cost, quantity }.
// Also exposed globally as window.cart so other scripts can read it.
let cart = [];

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 1: CART OPERATIONS
//  Functions that add/remove/update items in the `cart` array.
//  Every function here calls updateCartDisplay() at the end to re-render.
// ─────────────────────────────────────────────────────────────────────────────

window.addToCart = async function(productId) {
    const products = await DB.getProducts();
const product = products.find(p => String(p.id) === String(productId));
    if (!product || product.quantity === 0) {
        await DialogSystem.alert('Product not available!', '⚠️');
        return;
    }

    const existingItem = cart.find(item => String(item.id) === String(productId));
    
    if (existingItem) {
        const qtyInput = document.querySelector(`input[data-cart-id="${productId}"]`);
        if (qtyInput) {
            qtyInput.style.transform = 'scale(1.2)';
            qtyInput.style.transition = 'transform 0.3s ease';
            setTimeout(() => {
                qtyInput.style.transform = 'scale(1)';
                qtyInput.focus();
                qtyInput.select();
            }, 300);
        }
        return;
    }

    cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        cost: product.cost,
        quantity: 1
    });

    updateCartDisplay();
    clearSearch();
    
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.style.transform = 'scale(1.4)';
        setTimeout(() => { cartCount.style.transform = 'scale(1)'; }, 300);
    }
    
    setTimeout(() => {
        const qtyInput = document.querySelector(`input[data-cart-id="${productId}"]`);
        if (qtyInput) { qtyInput.focus(); qtyInput.select(); }
    }, 100);
};

window.removeFromCart = async function(productId) {
    const itemElements = document.querySelectorAll('.neo-cart-item');
    let targetElement = null;
    
    itemElements.forEach(el => {
        const removeBtn = el.querySelector(`[data-product-id="${productId}"]`);
        if (removeBtn) targetElement = el;
    });
    
    if (targetElement) {
        targetElement.style.transform = 'translateX(100%)';
        targetElement.style.opacity = '0';
        targetElement.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            cart = cart.filter(item => String(item.id) !== String(productId));
            updateCartDisplay();
            if (document.getElementById('generalSearch')) handleSearch();
        }, 300);
    } else {
        cart = cart.filter(item => String(item.id) !== String(productId));
        updateCartDisplay();
        if (document.getElementById('generalSearch')) handleSearch();
    }
};

window.updateCartQuantity = async function(productId, change) {
    const item = cart.find(item => String(item.id) === String(productId));
    const products = await DB.getProducts();
    const product = products.find(p => String(p.id) === String(productId));
    if (!item || !product) return;

    const newQty = item.quantity + change;
    
    if (newQty <= 0) { await removeFromCart(productId); return; }

    if (newQty > product.quantity) {
        await DialogSystem.alert(`Not enough stock! Only ${product.quantity} available.`, '⚠️');
        return;
    }

    item.quantity = newQty;
    updateCartDisplay();
    if (document.getElementById('generalSearch')) handleSearch();
};

window.setCartQuantity = async function(productId, quantity) {
    const item = cart.find(item => String(item.id) === String(productId));
    const products = await DB.getProducts();
    const product = products.find(p => String(p.id) === String(productId));
    if (!item || !product) return;

    const qty = parseInt(quantity);
    
    if (isNaN(qty) || qty < 0) {
        await DialogSystem.alert('Invalid quantity!', '⚠️');
        updateCartDisplay();
        return;
    }

    if (qty === 0) { await removeFromCart(productId); return; }

    if (qty > product.quantity) {
        await DialogSystem.alert(`Not enough stock! Only ${product.quantity} available.`, '⚠️');
        item.quantity = product.quantity;
        updateCartDisplay();
        return;
    }

    item.quantity = qty;
    updateCartDisplay();
    if (document.getElementById('generalSearch')) handleSearch();
};

window.clearCart = async function() {
    if (cart.length === 0) return;
    
    const confirmDialog = document.createElement('div');
    confirmDialog.innerHTML = `
        <div class="neo-modal-overlay" style="animation: fadeIn 0.3s ease;">
            <div class="neo-modal neo-clear-confirm" style="animation: slideUp 0.3s ease; background: var(--clear-modal-bg, #fff) !important;">
                <div class="neo-clear-icon">🗑️</div>
                <h2 class="neo-clear-title">Clear All Items?</h2>
                <p class="neo-clear-desc">This will remove all <strong>${cart.length}</strong> item${cart.length > 1 ? 's' : ''} from your cart. This action cannot be undone.</p>
                <div class="neo-clear-buttons">
                    <button id="confirmClear" class="neo-btn-primary neo-btn-danger">Yes, Clear All</button>
                    <button id="cancelClear" class="neo-btn-secondary">Cancel</button>
                </div>
            </div>
        </div>
        <style>
            .neo-clear-confirm {
                max-width: 420px;
                text-align: center;
                background: var(--clear-modal-bg, #fff) !important;
                border: 1px solid var(--clear-modal-border, #e0e0e0) !important;
                color: var(--clear-modal-text, #222);
                box-shadow: 0 8px 32px rgba(0,0,0,0.18);
            }
            .neo-clear-icon {
                width: 80px; height: 80px;
                background: linear-gradient(135deg, #f87171 0%, #dc2626 100%);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 25px; font-size: 40px;
                animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                box-shadow: 0 4px 18px rgba(220,38,38,0.18);
            }
            .neo-clear-title {
                margin: 0 0 15px 0;
                color: var(--clear-modal-title, #222);
                font-size: 1.5rem;
                font-weight: 800; letter-spacing: -0.5px;
            }
            .neo-clear-desc {
                color: var(--clear-modal-desc, #444);
                margin: 0 0 30px 0;
                font-size: 1rem;
                line-height: 1.6;
            }
            .neo-clear-buttons { display: grid; gap: 12px; }
            .neo-btn-danger {
                background: var(--btn-red-bg);
                border: none;
                color: var(--btn-red-text);
            }
            .neo-btn-danger:hover { background: var(--btn-red-hover); }
            .neo-btn-secondary {
                background: var(--btn-green-bg);
                color: var(--btn-green-text);
                border: none;
            }
            .neo-btn-secondary:hover { background: var(--btn-green-hover); }
            @keyframes bounceIn { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
            body.dark-mode .neo-clear-confirm {
                background: #181818 !important;
                border-color: #333 !important;
                color: #f3f3f3;
            }
            body.dark-mode .neo-clear-title { color: #fff; }
            body.dark-mode .neo-clear-desc { color: #cccccc; }
            body.dark-mode .neo-btn-secondary {
                background: #1b2e1f;
                color: #d1fae5;
                border-color: transparent;
            }
        </style>
    `;

    document.body.appendChild(confirmDialog);
    injectCheckoutNeomorphismStyles();

    if (document.body.classList.contains('dark-mode')) {
        const modal = confirmDialog.querySelector('.neo-clear-confirm');
        if (modal) {
            modal.style.background = '#181818';
            modal.style.borderColor = '#333';
            modal.style.color = '#f3f3f3';
        }
        const title = confirmDialog.querySelector('.neo-clear-title');
        if (title) title.style.color = '#fff';
        const desc = confirmDialog.querySelector('.neo-clear-desc');
        if (desc) desc.style.color = '#cccccc';
        const cancelBtn = confirmDialog.querySelector('.neo-btn-secondary');
        if (cancelBtn) {
            cancelBtn.style.background = '#1b2e1f';
            cancelBtn.style.color = '#d1fae5';
            cancelBtn.style.borderColor = '#2d5a35';
        }
    }

    document.getElementById('confirmClear').onclick = () => {
        document.body.removeChild(confirmDialog);
        cart = [];
        updateCartDisplay();
        if (document.getElementById('generalSearch')) handleSearch();
    };
    document.getElementById('cancelClear').onclick = () => { document.body.removeChild(confirmDialog); };
};

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 2: CART DISPLAY & PANEL TOGGLE
//  updateCartDisplay() renders the cart item list + footer buttons.
//  toggleCartPanel() opens/closes the slide-out panel with overlay.
//  injectCartItemStyles() injects the CSS for cart item cards (once).
//  setupCartEventListeners() wires +/- buttons and qty inputs after render.
// ─────────────────────────────────────────────────────────────────────────────

// Builds the entire cart HTML (item cards + clear/checkout buttons)
// and updates the floating badge count. Called after every cart change.
window.updateCartDisplay = function() {
    injectCartItemStyles();

    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.getElementById('cartCount');

    if (cartCount) {
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = itemCount;
        cartCount.style.display = itemCount > 0 ? 'flex' : 'none';
    }

    if (!cartItems || !cartTotal) return;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <div style="font-size:48px; margin-bottom:16px;">🛒</div>
                <div style="font-weight:700; font-size:16px; margin-bottom:8px;">Cart is empty</div>
                <small style="opacity:0.7;">Search and add products above</small>
            </div>`;
        cartTotal.textContent = '0.00';
        return;
    }

    let total = 0;
    const reversedCart = [...cart].reverse();

    let html = '';
    reversedCart.forEach((item, index) => {
        const subtotal = item.price * item.quantity;
        total += subtotal;

        html += `
            <div class="neo-cart-item" style="animation-delay:${index * 0.05}s;">

                <!-- Row 1: Name + Remove -->
                <div class="nci-row nci-header">
                    <span class="nci-name">${item.name}</span>
                    <button class="nci-remove neo-btn-cart-remove" data-product-id="${item.id}" title="Remove item">✕</button>
                </div>

                <!-- Row 2: Unit price -->
                <div class="nci-unit-price">₱${item.price.toFixed(2)} each</div>

                <!-- Row 3: Qty controls + subtotal -->
                <div class="nci-row nci-controls">
                    <div class="nci-qty">
                        <button class="nci-btn-qty neo-btn-qty-minus" data-product-id="${item.id}">−</button>
                        <input type="number" value="${item.quantity}" min="1"
                               class="nci-qty-input neo-qty-input"
                               data-cart-id="${item.id}">
                        <button class="nci-btn-qty neo-btn-qty-plus" data-product-id="${item.id}">+</button>
                    </div>
                    <span class="nci-subtotal neo-subtotal-amount">₱${subtotal.toFixed(2)}</span>
                </div>

            </div>`;
    });

    // Append clear + checkout buttons at the bottom of the cart list
    html += `
        <div class="nci-footer-btns">
            <button class="nci-btn-clear neo-btn-clear-cart" onclick="clearCart()">🗑️ Clear All</button>
            <button class="nci-btn-checkout neo-btn-checkout" onclick="handleCheckout()">💳 Checkout</button>
        </div>`;

    cartItems.innerHTML = html;
    cartTotal.textContent = total.toFixed(2);

    setupCartEventListeners();
    injectCartNeomorphismStyles();
};

// Creates a <style> tag with all CSS for .neo-cart-item cards.
// Runs only once (idempotent via #nci-styles check).
function injectCartItemStyles() {
    if (document.getElementById('nci-styles')) return;
    const s = document.createElement('style');
    s.id = 'nci-styles';
    s.textContent = `

/* ── Cart item card ── */
.neo-cart-item {
    background: #ffffff;
    border: 1.5px solid #e5e7eb;
    border-radius: 16px;
    padding: 14px 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
    animation: slideInRight 0.3s cubic-bezier(0.34,1.56,0.64,1) backwards;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.neo-cart-item:hover {
    box-shadow: 0 6px 18px rgba(0,0,0,0.1);
    border-color: #27AE60;
    transform: translateY(-2px);
}
body.dark-mode .neo-cart-item {
    background: #252b27;
    border: 1.5px solid #344d38;
    box-shadow: 0 2px 10px rgba(0,0,0,0.35);
}
body.dark-mode .neo-cart-item:hover {
    border-color: #4ade80;
    box-shadow: 0 6px 18px rgba(0,0,0,0.5);
}

/* ── Shared row layout ── */
.nci-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
}

/* ── Name + remove row ── */
.nci-header { align-items: flex-start; }

.nci-name {
    font-weight: 700;
    font-size: 15px;
    color: #1f2937;
    flex: 1;
    word-break: break-word;
    line-height: 1.4;
}
body.dark-mode .nci-name { color: #f0fdf4; }

.nci-remove {
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: #fee2e2;
    color: #dc2626;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, transform 0.2s;
    line-height: 1;
}
.nci-remove:hover { background: #fca5a5; transform: rotate(90deg) scale(1.1); }
body.dark-mode .nci-remove { background: #3a2020; color: #fca5a5; }
body.dark-mode .nci-remove:hover { background: #4a2828; color: #fff; }

/* ── Unit price ── */
.nci-unit-price {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
}
body.dark-mode .nci-unit-price { color: #9ca3af; }

/* ── Qty controls row ── */
.nci-controls {
    margin-top: 4px;
}

.nci-qty {
    display: flex;
    align-items: center;
    gap: 6px;
}

.nci-btn-qty {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1.5px solid #d1fae5;
    background: #f0fdf4;
    color: #16a34a;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s, transform 0.12s;
    line-height: 1;
    padding: 0;
}
.nci-btn-qty:hover {
    background: #dcfce7;
    border-color: #86efac;
    transform: scale(1.08);
}
.nci-btn-qty:active { transform: scale(0.94); }
body.dark-mode .nci-btn-qty {
    background: #1a2e1f;
    border-color: #2d5a35;
    color: #4ade80;
}
body.dark-mode .nci-btn-qty:hover {
    background: #22372a;
    border-color: #4ade80;
}

.nci-qty-input {
    width: 54px;
    height: 34px;
    text-align: center;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    color: #1f2937;
    background: #f9fafb;
    padding: 0 4px;
    transition: border-color 0.2s, box-shadow 0.2s;
    -moz-appearance: textfield;
}
.nci-qty-input::-webkit-inner-spin-button,
.nci-qty-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.nci-qty-input:focus {
    outline: none;
    border-color: #27AE60;
    box-shadow: 0 0 0 3px rgba(39,174,96,0.12);
}
body.dark-mode .nci-qty-input {
    background: #1a2320;
    border-color: #344d38;
    color: #e8f5e4;
}
body.dark-mode .nci-qty-input:focus {
    border-color: #4ade80;
    box-shadow: 0 0 0 3px rgba(74,222,128,0.12);
}

/* ── Subtotal ── */
.nci-subtotal {
    font-weight: 800;
    font-size: 17px;
    color: #16a34a;
    letter-spacing: -0.3px;
    flex-shrink: 0;
}
body.dark-mode .nci-subtotal { color: #4ade80; }

/* ── Footer buttons ── */
.nci-footer-btns {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 8px;
    padding: 0 2px 4px 2px;
}

.nci-btn-clear {
    width: 100%;
    padding: 13px;
    border-radius: 12px;
    border: none;
    background: var(--btn-red-bg);
    color: var(--btn-red-text);
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.5px;
    box-shadow: var(--btn-red-shadow);
}
.nci-btn-clear:hover {
    background: var(--btn-red-hover);
    transform: translateY(-2px);
    box-shadow: var(--btn-red-shadow-hover);
}
body.dark-mode .nci-btn-clear {
    background: var(--btn-red-bg);
}
body.dark-mode .nci-btn-clear:hover {
    background: var(--btn-red-hover);
}

.nci-btn-checkout {
    width: 100%;
    padding: 15px;
    border-radius: 12px;
    border: none;
    background: var(--btn-green-bg);
    color: var(--btn-green-text);
    font-weight: 800;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 1px;
    text-transform: uppercase;
    box-shadow: var(--btn-green-shadow);
}
.nci-btn-checkout:hover {
    background: var(--btn-green-hover);
    transform: translateY(-2px);
    box-shadow: var(--btn-green-shadow-hover);
}
body.dark-mode .nci-btn-checkout {
    background: var(--btn-green-bg);
    color: var(--btn-green-text);
}
body.dark-mode .nci-btn-checkout:hover {
    background: var(--btn-green-hover);
    color: var(--btn-green-text);
}

/* ── Empty cart ── */
.empty-cart {
    text-align: center;
    padding: 50px 20px;
    color: #9ca3af;
    background: #f9fafb;
    border-radius: 16px;
    margin: 20px 0;
    border: 2px dashed #e5e7eb;
}
body.dark-mode .empty-cart {
    background: #1a2320;
    color: #6b7280;
    border-color: #2d4a35;
}

/* ── Animations ── */
@keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
@keyframes fadeIn       { from { opacity:0; } to { opacity:1; } }
@keyframes slideUp      { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

/* ── Mobile ── */
@media (max-width: 480px) {
    .neo-cart-item { padding: 12px 12px; border-radius: 14px; }
    .nci-name { font-size: 14px; }
    .nci-btn-qty { width: 30px; height: 30px; font-size: 16px; }
    .nci-qty-input { width: 48px; height: 30px; font-size: 13px; }
    .nci-subtotal { font-size: 15px; }
}
    `;
    document.head.appendChild(s);
}

function setupCartEventListeners() {
    document.querySelectorAll('.neo-btn-qty-minus').forEach(btn => {
        btn.onclick = () => updateCartQuantity(String(btn.dataset.productId), -1);
    });
    document.querySelectorAll('.neo-btn-qty-plus').forEach(btn => {
        btn.onclick = () => updateCartQuantity(String(btn.dataset.productId), 1);
    });
    document.querySelectorAll('.neo-btn-cart-remove').forEach(btn => {
        btn.onclick = () => removeFromCart(String(btn.dataset.productId));
    });
    document.querySelectorAll('.neo-qty-input').forEach(input => {
        input.onchange = () => setCartQuantity(String(input.dataset.cartId), input.value);
    });
}

let isCartPanelOpen = false;
let cartPanelToggling = false;
let lastToggleTime = 0;

window.toggleCartPanel = function() {
    const now = Date.now();
    if (now - lastToggleTime < 350 && lastToggleTime !== 0) return;
    lastToggleTime = now;
    
    if (cartPanelToggling) return;
    cartPanelToggling = true;
    
    const searchPanel = document.getElementById('searchPanel');
    if (!searchPanel) { cartPanelToggling = false; return; }

    if (isCartPanelOpen) {
        searchPanel.classList.remove('open');
        hideCartOverlay();
        document.body.classList.remove('cart-open');
        document.body.style.overflow = '';
        setTimeout(() => { cartPanelToggling = false; }, 400);
        isCartPanelOpen = false;
    } else {
        showCartOverlay();
        document.body.classList.add('cart-open');
        document.body.style.overflow = 'hidden';
        searchPanel.classList.add('open');
        setTimeout(() => {
            const searchInput = document.getElementById('generalSearch');
            if (searchInput) searchInput.focus();
            cartPanelToggling = false;
        }, 50);
        isCartPanelOpen = true;
    }
};

function ensureCartPanelClosed() {
    const searchPanel = document.getElementById('searchPanel');
    if (searchPanel) {
        searchPanel.classList.remove('open');
        isCartPanelOpen = false;
        document.body.classList.remove('cart-open');
        hideCartOverlay();
        document.body.style.overflow = '';
    }
}

let cartOverlay = null;

function createCartOverlay() {
    if (!cartOverlay) {
        cartOverlay = document.createElement('div');
        cartOverlay.id = 'cartOverlay';
        cartOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
            z-index: 9998; display: none; pointer-events: auto; cursor: pointer;
        `;
        cartOverlay.addEventListener('click', function(e) {
            const searchPanel = document.getElementById('searchPanel');
            if (e.target === cartOverlay && isCartPanelOpen && searchPanel) {
                e.preventDefault();
                e.stopPropagation();
                toggleCartPanel();
            }
        }, true);
        document.body.appendChild(cartOverlay);
    }
    return cartOverlay;
}

function showCartOverlay() {
    const overlay = createCartOverlay();
    overlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideCartOverlay() {
    const overlay = document.getElementById('cartOverlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
}

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 3: CHECKOUT FLOW
//  handleCheckout()       → Payment method picker (Cash or Debt)
//  processCheckout()      → Validates stock, then routes to cash calculator
//  showChangeCalculator() → Cash payment modal with change calculation
//  completeSale()         → Records the sale in DB, decrements stock
//  processDebtCheckout()  → Debt modal with customer name + autocomplete
//  completeDebtSale()     → Records debtor + sale, applies surcharge if set
// ─────────────────────────────────────────────────────────────────────────────

// Opens the payment method picker dialog (Cash vs Debt).
// Calculates total and expected profit from the current cart.
window.handleCheckout = async function() {
    if (cart.length === 0) {
        await DialogSystem.alert('Cart is empty! Add products first.', '🛒');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCost = cart.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    const profit = total - totalCost;

    const paymentDialog = document.createElement('div');
    paymentDialog.innerHTML = `
        <div class="neo-modal-overlay" style="animation: fadeIn 0.3s ease;">
            <div class="neo-modal neo-payment-confirm" style="animation: slideUp 0.3s ease;">
                <div class="neo-modal-header">
                    <div style="font-size: 64px; margin-bottom: 15px;">💳</div>
                    <h2>Payment Method</h2>
                    <p>How would you like to pay?</p>
                </div>
                <div class="neo-checkout-amount" style="overflow: hidden !important; margin-bottom: 30px !important; position: relative; z-index: 1; border-radius: 16px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <span>Total Amount:</span>
                        <span style="font-size: 24px; font-weight: 800;">₱${total.toFixed(2)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 1px solid #444;">
                        <span>Expected Profit:</span>
                        <span style="font-size: 18px; font-weight: 700;">₱${profit.toFixed(2)}</span>
                    </div>
                </div>
                <div class="neo-checkout-buttons" style="background: none !important; box-shadow: none !important; position: relative; z-index: 2; display: flex; flex-direction: column; gap: 16px;">
                    <button id="payCash" class="neo-btn-primary neo-btn-success">
                        <span style="font-size: 24px;">💵</span>
                        <span>Cash Payment</span>
                    </button>
                    <button id="payDebt" class="neo-btn-primary neo-btn-warning">
                        <span style="font-size: 24px;">📝</span>
                        <span>Add to Debt List</span>
                    </button>
                </div>
                <button id="cancelCheckout" class="neo-btn-red" style="margin-top: 18px;">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(paymentDialog);
    injectCheckoutNeomorphismStyles();

    document.getElementById('payCash').onclick = () => {
        document.body.removeChild(paymentDialog);
        processCheckout('cash', total, profit);
    };
    document.getElementById('payDebt').onclick = () => {
        document.body.removeChild(paymentDialog);
        processDebtCheckout(total, profit);
    };
    document.getElementById('cancelCheckout').onclick = () => { document.body.removeChild(paymentDialog); };
};

async function processCheckout(paymentMethod, total, profit) {
    try {
        const products = await DB.getProducts();
        for (const item of cart) {
            const product = products.find(p => String(p.id) === String(item.id));
            if (!product || product.quantity < item.quantity) {
                await DialogSystem.alert(`Not enough stock for ${item.name}!\nAvailable: ${product ? product.quantity : 0}`, '⚠️');
                return;
            }
        }
        if (paymentMethod === 'cash') await showChangeCalculator(total, profit, products);
    } catch (error) {
        console.error('Checkout error:', error);
        await DialogSystem.alert('Checkout failed! Please try again.', '❌');
    }
}

async function processDebtCheckout(total, profit) {
    const debtDialog = document.createElement('div');
    debtDialog.innerHTML = `
        <div class="neo-modal-overlay" style="animation: fadeIn 0.3s ease;">
            <div class="neo-modal neo-debt-modal-v2" style="animation: slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1);">

                <!-- Icon + Title -->
                <div class="ndm-header">
                    <div class="ndm-icon-wrap">📝</div>
                    <h2 class="ndm-title">Add to Debt List</h2>
                    <p class="ndm-subtitle">Who is this sale for?</p>
                </div>

                <!-- Amount pill -->
                <div class="ndm-amount-pill">
                    <span class="ndm-amount-label">DEBT AMOUNT</span>
                    <span class="ndm-amount-value">₱${total.toFixed(2)}</span>
                </div>

                <!-- Customer name field with custom autocomplete -->
                <div class="ndm-field-group">
                    <label class="ndm-label">👤 Customer Name</label>
                    <div class="ndm-input-wrap" id="ndmInputWrap">
                        <input
                            type="text"
                            id="debtCustomerName"
                            class="ndm-input"
                            placeholder="Type a name..."
                            autocomplete="off"
                            autocorrect="off"
                            spellcheck="false"
                        />
                        <span class="ndm-input-icon">✏️</span>
                    </div>
                    <!-- Custom suggestions dropdown -->
                    <div class="ndm-suggestions" id="ndmSuggestions" style="display:none;"></div>
                </div>

                <!-- Buttons -->
                <button id="confirmDebt" class="ndm-btn-confirm">
                    <span>📋</span> Add to Debt List
                </button>
                <button id="cancelDebt" class="ndm-btn-cancel">Cancel</button>

            </div>
        </div>

        <style>
        /* ── Modal shell ── */
        .neo-debt-modal-v2 {
            max-width: 420px;
            padding: 36px 28px 28px;
            border-radius: 28px;
            background: #ffffff;
            border: 1.5px solid #e5e7eb;
            box-shadow: 0 24px 60px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08);
        }
        body.dark-mode .neo-debt-modal-v2 {
            background: #1c1e22;
            border-color: #2e3138;
            box-shadow: 0 24px 60px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4);
        }

        /* ── Header ── */
        .ndm-header { text-align: center; margin-bottom: 24px; }
        .ndm-icon-wrap {
            width: 72px; height: 72px;
            margin: 0 auto 14px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6b7280, #4b5563);
            display: flex; align-items: center; justify-content: center;
            font-size: 34px;
            box-shadow: 0 6px 20px rgba(0,0,0,0.18);
        }
        body.dark-mode .ndm-icon-wrap {
            background: linear-gradient(135deg, #374151, #252830);
            box-shadow: 0 6px 20px rgba(0,0,0,0.5);
        }
        .ndm-title {
            margin: 0 0 6px;
            font-size: 1.45rem; font-weight: 900; letter-spacing: -0.3px;
            color: #111827;
        }
        body.dark-mode .ndm-title { color: #f3f4f6; }
        .ndm-subtitle {
            margin: 0; font-size: 13px; color: #6b7280; font-weight: 500;
        }
        body.dark-mode .ndm-subtitle { color: #9ca3af; }

        /* ── Amount pill ── */
        .ndm-amount-pill {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            background: #f9fafb;
            border: 1.5px solid #e5e7eb;
            border-radius: 18px;
            padding: 16px 20px;
            margin-bottom: 24px;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.8);
        }
        body.dark-mode .ndm-amount-pill {
            background: #13151a;
            border-color: #2e3138;
            box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
        }
        .ndm-amount-label {
            font-size: 10px; font-weight: 800;
            letter-spacing: 1.8px; text-transform: uppercase;
            color: #9ca3af;
        }
        body.dark-mode .ndm-amount-label { color: #6b7280; }
        .ndm-amount-value {
            font-size: 2.2rem; font-weight: 900; letter-spacing: -1px;
            color: #111827; line-height: 1;
        }
        body.dark-mode .ndm-amount-value { color: #f9fafb; }

        /* ── Input field ── */
        .ndm-field-group { margin-bottom: 22px; position: relative; }
        .ndm-label {
            display: block; margin-bottom: 8px;
            font-size: 13px; font-weight: 700; color: #374151;
            letter-spacing: 0.2px;
        }
        body.dark-mode .ndm-label { color: #d1d5db; }
        .ndm-input-wrap {
            position: relative; display: flex; align-items: center;
        }
        .ndm-input {
            width: 100%; padding: 14px 44px 14px 16px;
            font-size: 15px; font-weight: 600;
            border: 2px solid #e5e7eb;
            border-radius: 14px;
            background: #ffffff;
            color: #111827;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
            box-sizing: border-box;
        }
        .ndm-input::placeholder { color: #9ca3af; font-weight: 400; }
        .ndm-input:focus {
            border-color: #6b7280;
            box-shadow: 0 0 0 4px rgba(107,114,128,0.12);
        }
        body.dark-mode .ndm-input {
            background: #13151a;
            border-color: #2e3138;
            color: #f3f4f6;
        }
        body.dark-mode .ndm-input:focus {
            border-color: #9ca3af;
            box-shadow: 0 0 0 4px rgba(156,163,175,0.12);
            background: #1c1e22;
        }
        .ndm-input-icon {
            position: absolute; right: 14px;
            font-size: 16px; pointer-events: none; opacity: 0.35;
        }

        /* ── Suggestions dropdown ── */
        .ndm-suggestions {
            position: absolute; top: calc(100% + 6px); left: 0; right: 0;
            background: #fff;
            border: 1.5px solid #e5e7eb;
            border-radius: 14px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
            z-index: 99999;
            overflow: hidden;
            max-height: 180px;
            overflow-y: auto;
        }
        body.dark-mode .ndm-suggestions {
            background: #1c1e22;
            border-color: #2e3138;
            box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        }
        .ndm-suggestion-item {
            padding: 12px 16px;
            font-size: 14px; font-weight: 600;
            color: #111827;
            cursor: pointer;
            display: flex; align-items: center; gap: 10px;
            transition: background 0.15s;
            border-bottom: 1px solid #f3f4f6;
        }
        .ndm-suggestion-item:last-child { border-bottom: none; }
        .ndm-suggestion-item:hover, .ndm-suggestion-item.active { background: #f9fafb; }
        body.dark-mode .ndm-suggestion-item { color: #f3f4f6; border-bottom-color: #2e3138; }
        body.dark-mode .ndm-suggestion-item:hover,
        body.dark-mode .ndm-suggestion-item.active { background: #252830; }
        .ndm-suggestion-avatar {
            width: 28px; height: 28px; border-radius: 50%;
            background: linear-gradient(135deg, #6b7280, #4b5563);
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; font-weight: 800; color: #fff;
            flex-shrink: 0;
        }
        body.dark-mode .ndm-suggestion-avatar {
            background: linear-gradient(135deg, #374151, #252830);
        }

        /* ── Confirm button — green (primary action) ── */
        .ndm-btn-confirm {
            width: 100%; padding: 16px;
            border: none; border-radius: 14px;
            background: linear-gradient(135deg, #27AE60 0%, #1e8449 100%);
            color: #fff; font-size: 15px; font-weight: 800;
            cursor: pointer; letter-spacing: 0.3px;
            display: flex; align-items: center; justify-content: center; gap: 8px;
            box-shadow: 0 6px 20px rgba(39,174,96,0.28);
            transition: transform 0.15s, box-shadow 0.15s;
            margin-bottom: 10px;
        }
        .ndm-btn-confirm:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 28px rgba(39,174,96,0.38);
        }
        .ndm-btn-confirm:active { transform: translateY(0); }
        body.dark-mode .ndm-btn-confirm {
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            color: #052e16;
        }
        body.dark-mode .ndm-btn-confirm:hover { color: #fff; }

        /* ── Cancel button — neutral ── */
        .ndm-btn-cancel {
            width: 100%; padding: 13px;
            border: 1.5px solid #e5e7eb;
            border-radius: 14px;
            background: #f9fafb;
            color: #6b7280; font-size: 14px; font-weight: 700;
            cursor: pointer;
            transition: background 0.15s, transform 0.12s;
        }
        .ndm-btn-cancel:hover {
            background: #f3f4f6;
            transform: translateY(-1px);
        }
        body.dark-mode .ndm-btn-cancel {
            background: #13151a;
            border-color: #2e3138;
            color: #9ca3af;
        }
        body.dark-mode .ndm-btn-cancel:hover { background: #1c1e22; }
        </style>
    `;

    document.body.appendChild(debtDialog);
    injectCheckoutNeomorphismStyles();

    const customerNameInput = document.getElementById('debtCustomerName');
    const suggestionsBox    = document.getElementById('ndmSuggestions');
    customerNameInput.focus();

    // Fetch existing unpaid debtor names for the autocomplete dropdown
    let existingNames = [];
    try {
        const debtors = await DB.getDebtors();
        existingNames = [...new Set(debtors.filter(d => !d.paid).map(d => d.name))];
    } catch (e) { /* ignore errors — autocomplete is optional */ }

    function showSuggestions(query) {
        if (!query) { suggestionsBox.style.display = 'none'; return; }
        const matches = existingNames.filter(n =>
            n.toLowerCase().includes(query.toLowerCase())
        );
        if (matches.length === 0) { suggestionsBox.style.display = 'none'; return; }

        suggestionsBox.innerHTML = matches.map(name => `
            <div class="ndm-suggestion-item" data-name="${name}">
                <div class="ndm-suggestion-avatar">${name.charAt(0).toUpperCase()}</div>
                ${name}
            </div>
        `).join('');
        suggestionsBox.style.display = 'block';

        suggestionsBox.querySelectorAll('.ndm-suggestion-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                customerNameInput.value = item.dataset.name;
                suggestionsBox.style.display = 'none';
            });
        });
    }

    customerNameInput.addEventListener('input',  () => showSuggestions(customerNameInput.value));
    customerNameInput.addEventListener('blur',   () => setTimeout(() => { suggestionsBox.style.display = 'none'; }, 150));
    customerNameInput.addEventListener('focus',  () => showSuggestions(customerNameInput.value));
    customerNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('confirmDebt')?.click();
        if (e.key === 'Escape') suggestionsBox.style.display = 'none';
    });

    // ── Confirm / Cancel ────────────────────────────────────────────────────
    document.getElementById('confirmDebt').onclick = async () => {
        const customerName = customerNameInput.value.trim();
        if (!customerName) {
            customerNameInput.style.borderColor = '#ef4444';
            customerNameInput.style.boxShadow   = '0 0 0 4px rgba(239,68,68,0.15)';
            customerNameInput.placeholder        = '⚠️ Please enter a name';
            customerNameInput.focus();
            setTimeout(() => {
                customerNameInput.style.borderColor = '';
                customerNameInput.style.boxShadow   = '';
                customerNameInput.placeholder        = 'Type a name...';
            }, 1800);
            return;
        }
        document.body.removeChild(debtDialog);
        await completeDebtSale(customerName, total, profit);
    };

    document.getElementById('cancelDebt').onclick = () => {
        document.body.removeChild(debtDialog);
    };
}


async function completeDebtSale(customerName, total, profit) {
    try {
        const products = await DB.getProducts();
        
        for (const item of cart) {
            const product = products.find(p => p.id === item.id);
            if (!product || product.quantity < item.quantity) {
                await DialogSystem.alert(`Not enough stock for ${item.name}!\nAvailable: ${product ? product.quantity : 0}`, '⚠️');
                return;
            }
        }

       for (const item of cart) {
            const product = products.find(p => p.id === item.id);
            if (product) {
                try {
                    await DB.updateProduct(product.id, { ...product, quantity: product.quantity - item.quantity });
                } catch (error) {
                    console.error(`Failed to update product ${product.name}:`, error);
                }
            }
        }

// Also create a Sale record with payment_method='credit' so it shows in sales history
try {
    await DB.addSale({
        date: new Date().toISOString(),
        total: total,
        profit: profit,
        payment_method: 'credit',
        paymentType: 'credit',
        customer_name: customerName,
        items: cart.map(item => ({
            id: item.id,
            product_id: item.id,
            productId: item.id,
            name: item.name,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price || 0,
            selling_price: item.price || 0,
            cost: item.cost || 0,
            cost_price: item.cost || 0
        }))
    });
    console.log(`✅ Sale record created for debt: ${customerName}`);
} catch (error) {
    console.error('Failed to create sale record for debt:', error);
}

const surchargePercent = parseFloat(window.storeSettings?.debtSurcharge || 0);
        const surchargeAmount  = parseFloat(((surchargePercent / 100) * total).toFixed(2));
        const grandTotal       = parseFloat((total + surchargeAmount).toFixed(2));
        const hasSurcharge     = surchargePercent > 0 && surchargeAmount > 0;

        const debtorData = {
            name:              customerName,
            contact:           '',
            items:             cart.map(item => ({
                product_id: item.id, name: item.name,
                price: item.price, cost: item.cost, quantity: item.quantity
            })),
            original_total:    total,
            surcharge_percent: surchargePercent,
            surcharge_amount:  surchargeAmount,
            total_debt:        grandTotal,
            date_borrowed:     new Date().toISOString(),
            paid:              false
        };

        const { debtor: savedDebtor, merged } = await DB.addDebtor(debtorData);

        const successDialog = document.createElement('div');
        successDialog.innerHTML = `
            <div class="neo-modal-overlay" style="animation: fadeIn 0.3s ease;">
                <div class="neo-modal neo-modal-success" style="animation: successPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);">
                    <div class="neo-success-icon">${merged ? '🔄' : '✅'}</div>
                    <h2 class="neo-success-title">${merged ? 'Debt Merged!' : 'Debt Recorded!'}</h2>
                    <div class="neo-success-info">
                        <div class="neo-success-item">
                            <span>👤 Customer:</span>
                            <span class="neo-success-value">${customerName}</span>
                        </div>
                        <div style="border-top: 1px dashed rgba(0,0,0,0.1); margin: 10px 0;"></div>
                        <div class="neo-success-item">
                            <span>🧾 This Purchase:</span>
                            <span class="neo-success-value">₱${grandTotal.toFixed(2)}</span>
                        </div>
                        ${merged ? `
                        <div style="border-top: 1px dashed rgba(0,0,0,0.1); margin: 10px 0;"></div>
                        <div class="neo-success-item">
                            <span>💰 New Total Balance:</span>
                            <span class="neo-success-value neo-grand-total">₱${savedDebtor.total_debt.toFixed(2)}</span>
                        </div>
                        ` : `
                        <div style="border-top: 2px solid rgba(0,0,0,0.1); margin: 10px 0;"></div>
                        <div class="neo-success-item">
                            <span>💰 Total Debt:</span>
                            <span class="neo-success-value neo-grand-total">₱${grandTotal.toFixed(2)}</span>
                        </div>
                        `}
                        <div style="border-top: 1px dashed rgba(0,0,0,0.1); margin: 10px 0;"></div>
                        <div class="neo-success-item">
                            <span>📈 Expected Profit:</span>
                            <span class="neo-success-value neo-success-profit">₱${profit.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="neo-success-badge">${merged ? '🔄 Merged with previous debt' : '📝 Added to Debt List'}</div>
                    <button id="closeSuccess" class="neo-success-btn">Done</button>
                </div>
            </div>
            <style>
                .neo-surcharge-value { color: #D97706 !important; font-weight: 800 !important; }
                body.dark-mode .neo-surcharge-value { color: #FBBF24 !important; }
                .neo-grand-total { font-size: 20px !important; color: #DC2626 !important; font-weight: 900 !important; }
                body.dark-mode .neo-grand-total { color: #f87171 !important; }
                .neo-success-profit { color: #059669 !important; }
                body.dark-mode .neo-success-profit { color: #34d399 !important; }
            </style>
        `;

        document.body.appendChild(successDialog);
        injectCheckoutNeomorphismStyles();
        document.getElementById('closeSuccess').onclick = () => { document.body.removeChild(successDialog); };

        cart = [];
        updateCartDisplay();
        if (document.getElementById('generalSearch')) handleSearch();
        if (typeof renderDebtors === 'function') await renderDebtors();

    } catch (error) {
        console.error('❌ Debt recording error:', error);
        await DialogSystem.alert('Failed to record debt! Please try again.', '❌');
        try {
            const refreshed = await DB.getProducts();
            for (const item of cart) {
                const product = refreshed.find(p => p.id === item.id);
                if (product) await DB.updateProduct(item.id, { ...product, quantity: product.quantity + item.quantity });
            }
        } catch (restoreError) {
            console.error('Failed to restore product quantities:', restoreError);
        }
    }
}

// Cash payment modal: shows total, input for cash received, calculates change,
// includes optional customer name field for tracking who bought what.
async function showChangeCalculator(total, profit, products) {
    const changeDialog = document.createElement('div');
    changeDialog.innerHTML = `
        <div class="neo-modal-overlay" style="animation: fadeIn 0.3s ease;">
            <div class="neo-modal neo-change-modal" style="animation: slideUp 0.3s ease;">
                <div class="neo-modal-header">
                    <div style="font-size: 64px; margin-bottom: 15px;">💵</div>
                    <h2>Cash Payment</h2>
                    <p>Enter amount received</p>
                </div>
                <div class="neo-change-amount">
                    <div style="font-size: 14px; margin-bottom: 8px;">Total Amount</div>
                    <div style="font-size: 36px; font-weight: 800;">₱${total.toFixed(2)}</div>
                </div>
                <div class="neo-form-group">
                    <label>Cash Received:</label>
                    <input type="number" id="cashReceived" placeholder="0.00" class="neo-input-field neo-input-cash" step="0.01" min="0"/>
                </div>
                <div id="changeDisplay" class="neo-change-display" style="display: none;">
                    <div class="neo-change-label">Change to Return:</div>
                    <div id="changeAmount" class="neo-change-amount-value">₱0.00</div>
                </div>
            <!-- Customer name field (optional, for tracking who bought what) -->
                <div class="neo-form-group" style="margin-top: 24px; padding-top: 20px; border-top: 2px dashed #e5e7eb;">
                    <label for="customerName" style="color: #059669; display: flex; align-items: center; gap: 6px; font-weight: 800;">
                        👤 Customer Name
                        <span style="opacity: 0.6; font-weight: 400;">(Optional - for tracking sales)</span>
                    </label>
                    <input 
                        type="text" 
                        id="customerName" 
                        placeholder="Enter name for this sale" 
                        class="neo-input-field" 
                        autocomplete="off"
                        style="
                            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                            border: 2px solid #22c55e;
                            color: #15803d;
                            font-weight: 600;
                            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
                        "
                    />
                </div>
                <button id="confirmCash" class="neo-btn-primary neo-btn-success" disabled style="opacity: 0.5; margin-bottom: 14px;">Complete Sale</button>
                <button id="cancelCash" class="neo-btn-red">Cancel</button>
            </div>
        </div>
    `;

    document.body.appendChild(changeDialog);
    injectCheckoutNeomorphismStyles();

    const cashInput     = document.getElementById('cashReceived');
    const customerInput = document.getElementById('customerName');
    const confirmBtn    = document.getElementById('confirmCash');
    const changeDisplay = document.getElementById('changeDisplay');
    const changeAmount  = document.getElementById('changeAmount');

    setTimeout(() => cashInput.focus(), 100);

    function updateChangeCalc() {
        const received = parseFloat(cashInput.value) || 0;
        const change   = received - total;
        if (received >= total) {
            confirmBtn.disabled = false; confirmBtn.style.opacity = '1'; confirmBtn.style.cursor = 'pointer';
            changeDisplay.style.display = 'block';
            changeAmount.textContent = `₱${change.toFixed(2)}`;
            changeAmount.classList.remove('insufficient');
        } else if (received > 0) {
            confirmBtn.disabled = true; confirmBtn.style.opacity = '0.5'; confirmBtn.style.cursor = 'not-allowed';
            changeDisplay.style.display = 'block';
            changeAmount.textContent = `Insufficient: ₱${Math.abs(change).toFixed(2)} short`;
            changeAmount.classList.add('insufficient');
        } else {
            confirmBtn.disabled = true; confirmBtn.style.opacity = '0.5'; confirmBtn.style.cursor = 'not-allowed';
            changeDisplay.style.display = 'none';
        }
    }

    cashInput.addEventListener('input',  updateChangeCalc);
    cashInput.addEventListener('keyup',  updateChangeCalc);
    cashInput.addEventListener('change', updateChangeCalc);
    cashInput.addEventListener('blur',   updateChangeCalc);

    let saleInProgress = false;
    confirmBtn.onclick = async () => {
        if (saleInProgress) return;
        saleInProgress = true;
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processing...';
        const customerName = (customerInput?.value || '').trim();
        try { 
            document.body.removeChild(changeDialog); 
            await completeSale('cash', total, profit, products, customerName); 
        }
        catch (e) { 
            console.error('Sale error:', e);
            saleInProgress = false; 
        }
    };
    document.getElementById('cancelCash').onclick = () => { document.body.removeChild(changeDialog); };
}


// Final step of a cash sale: saves the sale to DB, decrements product stock,
// shows a success dialog, then clears the cart.
async function completeSale(paymentMethod, total, profit, products, customerName = '') {
    try {
        const normalizedCustomerName = (customerName || '').trim() || 'N/A';
        const saleData = {
            date: new Date().toISOString(),
            total: parseFloat(total.toFixed(2)),
            profit: parseFloat(profit.toFixed(2)),
            payment_method: paymentMethod,
            paymentType: paymentMethod,
            customer_name: normalizedCustomerName,
            items: cart.map(item => ({
                id: item.id,
                product_id: item.id,
                productId: item.id,
                name: item.name,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price || 0,
                selling_price: item.price || 0,
                cost: item.cost || 0,
                cost_price: item.cost || 0
            }))
        };

        await DB.addSale(saleData);

        for (const item of cart) {
            const product = products.find(p => p.id === item.id);
            if (product) {
                try { 
                    await DB.updateProduct(product.id, { ...product, quantity: product.quantity - item.quantity }); 
                } catch (error) { 
                    console.error(`Failed to update product ${product.name}:`, error); 
                }
            }
        }

        // Show a success dialog with sale summary
        const successDialog = document.createElement('div');
        successDialog.innerHTML = `
            <div class="neo-modal-overlay" style="animation: fadeIn 0.3s ease;">
                <div class="neo-modal neo-modal-success" style="animation: successPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);">
                    <div class="neo-success-icon">✅</div>
                    <h2 class="neo-success-title">Sale Complete!</h2>
                    <div class="neo-success-info">
                        <div class="neo-success-item">
                            <span>Total:</span>
                            <span class="neo-success-value">₱${total.toFixed(2)}</span>
                        </div>
                        <div class="neo-success-item">
                            <span>Profit:</span>
                            <span class="neo-success-value neo-success-profit">₱${profit.toFixed(2)}</span>
                        </div>
                        <div class="neo-success-item">
                            <span>Customer:</span>
                            <span class="neo-success-value">👤 ${normalizedCustomerName}</span>
                        </div>
                    </div>
                    <div class="neo-success-badge">💵 Cash Payment</div>
                    <button id="closeSuccess" class="neo-success-btn">Done</button>
                </div>
            </div>
        `;
        document.body.appendChild(successDialog);
        injectCheckoutNeomorphismStyles();
        document.getElementById('closeSuccess').onclick = () => { document.body.removeChild(successDialog); };

        cart = [];
        updateCartDisplay();
        if (document.getElementById('generalSearch')) handleSearch();

    } catch (error) {
        console.error('❌ Sale completion error:', error);
        await DialogSystem.alert('Failed to complete sale! Please try again.', '❌');
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 4: PRODUCT SEARCH
//  injectSearchBar()       → Creates the search input inside the cart panel
//  injectSearchBarStyles() → Injects CSS for the search bar + spinner
//  handleSearch()          → Queries DB.getProducts(), filters, renders results
//  clearSearch()           → Empties input + results
//  setupSearchClearButton()→ Wires the ✕ button on the search field
//
//  Search uses a 400ms debounce — a spinner shows while the user types,
//  then the actual DB query fires 400ms after they stop.
// ─────────────────────────────────────────────────────────────────────────────

// Builds the search bar HTML and inserts it at the top of the cart panel.
// Sets up the debounced input listener with inline spinner.
let _searchDebounceTimer = null;

function injectSearchBar() {
    if (document.getElementById('generalSearch')) return;

    const searchPanel = document.getElementById('searchPanel');
    if (!searchPanel) return;

    const searchResults = document.getElementById('searchResults');

    const wrapper = document.createElement('div');
    wrapper.id = 'cartSearchWrapper';
    wrapper.innerHTML = `
        <div class="cart-search-bar">
            <span class="cart-search-icon">🔍</span>
            <input
                type="text"
                id="generalSearch"
                class="cart-search-input"
                placeholder="Search products..."
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
            />
            <button class="clear-search-btn" id="clearSearchBtn" aria-label="Clear search" style="display:none;">✕</button>
        </div>
    `;

    if (searchResults) {
        searchPanel.insertBefore(wrapper, searchResults);
    } else {
        searchPanel.prepend(wrapper);
    }

    injectSearchBarStyles();

    const input    = document.getElementById('generalSearch');
    const clearBtn = document.getElementById('clearSearchBtn');

    // Live search: fire handleSearch on every keystroke (debounced 150ms)
    input.addEventListener('input', () => {
        const hasText = input.value.trim().length > 0;
        clearBtn.style.display = hasText ? 'flex' : 'none';

        if (!hasText) {
            const searchResults = document.getElementById('searchResults');
            if (searchResults) searchResults.innerHTML = '';
            if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer);
            return;
        }

        // Debounce: wait 150ms after last keystroke before searching
        if (_searchDebounceTimer) clearTimeout(_searchDebounceTimer);
        _searchDebounceTimer = setTimeout(() => handleSearch(), 150);
    });

    clearBtn.addEventListener('click', clearSearch);
}

function injectSearchBarStyles() {
    if (document.getElementById('cart-search-bar-styles')) return;
    const style = document.createElement('style');
    style.id = 'cart-search-bar-styles';
    style.textContent = `
        #cartSearchWrapper {
            padding: 12px 14px 6px 14px;
            background: var(--bg-surface);
            position: sticky;
            top: 0;
            z-index: 10;
            border-bottom: 1px solid var(--border-light);
        }
        .cart-search-bar {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-base, #f4f9f2);
            border: 1.5px solid var(--border-light);
            border-radius: 14px;
            padding: 0 12px;
            box-shadow: inset 0 2px 6px rgba(0,0,0,0.06);
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .cart-search-bar:focus-within {
            border-color: var(--primary-400, #4ade80);
            box-shadow: inset 0 2px 6px rgba(0,0,0,0.06), 0 0 0 3px rgba(34,197,94,0.12);
        }
        body.dark-mode .cart-search-bar {
            background: #1a281a;
            border-color: #344d34;
        }
        .cart-search-icon { font-size: 16px; flex-shrink: 0; pointer-events: none; user-select: none; }
        .cart-search-input {
            flex: 1; height: 46px; border: none; background: transparent;
            font-size: 15px; font-weight: 500; color: var(--text-primary); outline: none; min-width: 0;
        }
        .cart-search-input::placeholder { color: var(--text-tertiary, #aaa); font-weight: 400; }
        body.dark-mode .cart-search-input { color: #e8f5e4; }
        #clearSearchBtn {
            display: none; width: 28px; height: 28px; flex-shrink: 0;
            align-items: center; justify-content: center;
            background: var(--neutral-200, #e5e7eb); border: none; border-radius: 50%;
            font-size: 13px; color: var(--text-secondary); cursor: pointer;
            transition: background 0.15s, transform 0.12s;
        }
        #clearSearchBtn:hover  { background: #fee2e2; color: #dc2626; }
        #clearSearchBtn:active { transform: scale(0.9); }
        body.dark-mode #clearSearchBtn { background: #2a3d2a; color: #a0c8a0; }
        #cartSearchWrapper + #searchResults { padding-top: 8px; }
        /* ── Search Go button (neo-glassmorphic) ── */
        .cart-search-go-btn {
            display: none; flex-shrink: 0;
            padding: 7px 18px; height: 34px;
            border: 1.5px solid rgba(34, 197, 94, 0.35);
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(34,197,94,0.75) 0%, rgba(22,163,74,0.85) 100%);
            backdrop-filter: blur(12px) saturate(1.4);
            -webkit-backdrop-filter: blur(12px) saturate(1.4);
            color: #fff;
            font-size: 13px; font-weight: 700;
            letter-spacing: 0.3px;
            cursor: pointer;
            box-shadow:
                0 2px 8px rgba(34, 197, 94, 0.25),
                inset 0 1px 0 rgba(255,255,255,0.30),
                0 1px 3px rgba(0,0,0,0.08);
            transition: all 0.22s cubic-bezier(.4,0,.2,1);
            white-space: nowrap;
            text-shadow: 0 1px 2px rgba(0,0,0,0.15);
            position: relative;
            overflow: hidden;
        }
        .cart-search-go-btn::before {
            content: '';
            position: absolute; inset: 0;
            border-radius: inherit;
            background: linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%);
            pointer-events: none;
        }
        .cart-search-go-btn:hover {
            background: linear-gradient(135deg, rgba(22,163,74,0.9) 0%, rgba(21,128,61,0.95) 100%);
            box-shadow:
                0 4px 18px rgba(34, 197, 94, 0.40),
                inset 0 1px 0 rgba(255,255,255,0.20),
                0 0 12px rgba(34, 197, 94, 0.20);
            transform: translateY(-1px) scale(1.03);
            border-color: rgba(34, 197, 94, 0.5);
        }
        .cart-search-go-btn:active {
            transform: translateY(0) scale(0.97);
            box-shadow:
                0 1px 4px rgba(34, 197, 94, 0.20),
                inset 0 2px 4px rgba(0,0,0,0.12);
        }
        body.dark-mode .cart-search-go-btn {
            background: linear-gradient(135deg, rgba(21,128,61,0.7) 0%, rgba(22,101,52,0.85) 100%);
            border-color: rgba(34, 197, 94, 0.25);
            color: #dcfce7;
            box-shadow:
                0 2px 10px rgba(21, 128, 61, 0.30),
                inset 0 1px 0 rgba(255,255,255,0.08),
                0 1px 3px rgba(0,0,0,0.25);
        }
        body.dark-mode .cart-search-go-btn::before {
            background: linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 60%);
        }
        body.dark-mode .cart-search-go-btn:hover {
            background: linear-gradient(135deg, rgba(22,101,52,0.9) 0%, rgba(20,83,45,0.95) 100%);
            box-shadow:
                0 4px 20px rgba(21, 128, 61, 0.40),
                inset 0 1px 0 rgba(255,255,255,0.06),
                0 0 14px rgba(34, 197, 94, 0.15);
        }
        /* ── Inline search spinner ── */
        .cart-search-loading {
            display: flex; align-items: center; justify-content: center; gap: 10px;
            padding: 28px 16px; color: var(--text-secondary, #888);
            font-size: 14px; font-weight: 600;
        }
        .cart-search-spinner {
            width: 22px; height: 22px;
            border: 3px solid var(--border-light, #e5e7eb);
            border-top-color: var(--primary-500, #22c55e);
            border-radius: 50%;
            animation: cartSearchSpin 0.7s linear infinite;
        }
        body.dark-mode .cart-search-loading { color: #9ca3af; }
        body.dark-mode .cart-search-spinner { border-color: #374151; border-top-color: #4ade80; }
        @keyframes cartSearchSpin { to { transform: rotate(360deg); } }

        @media (max-width: 480px) {
            #cartSearchWrapper { padding: 10px 10px 4px 10px; }
            .cart-search-input { height: 42px; font-size: 14px; }
        }
            /* ── ENHANCED Customer Name Field Styling ── */
        #customerName {
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%) !important;
            border: 2px solid #22c55e !important;
            color: #15803d !important;
            font-weight: 600 !important;
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15) !important;
        }

        #customerName::placeholder {
            color: #6b7280 !important;
            opacity: 0.7 !important;
        }

        #customerName:focus {
            border-color: #16a34a !important;
            box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.25) !important;
            background: linear-gradient(135deg, #f0fdf4 0%, #bbf7d0 100%) !important;
        }

        body.dark-mode #customerName {
            background: linear-gradient(135deg, #1a3a1f 0%, #0f2e18 100%) !important;
            border-color: #4ade80 !important;
            color: #eaffea !important;
        }

        body.dark-mode #customerName:focus {
            border-color: #22c55e !important;
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2) !important;
        }

        /* ── Form group divider ── */
        .neo-form-group:has(#customerName) {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 2px dashed #e5e7eb;
        }

        body.dark-mode .neo-form-group:has(#customerName) {
            border-top-color: #374151;
        }
    `;
    document.head.appendChild(style);
}

// ── Fuzzy matching score: higher = better match ──
function fuzzyScore(query, target) {
    const q = query.toLowerCase();
    const t = target.toLowerCase();

    // Exact match
    if (t === q) return 1000;
    // Starts with query
    if (t.startsWith(q)) return 900 + (q.length / t.length) * 100;
    // Contains query as substring
    if (t.includes(q)) return 700 + (q.length / t.length) * 100;

    // Subsequence match + character-level similarity
    let qi = 0, consecutive = 0, maxConsecutive = 0, firstMatch = -1;
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) {
            if (firstMatch < 0) firstMatch = ti;
            consecutive++;
            if (consecutive > maxConsecutive) maxConsecutive = consecutive;
            qi++;
        } else {
            consecutive = 0;
        }
    }
    // If all query chars found in order → subsequence match
    if (qi === q.length) {
        return 300 + maxConsecutive * 50 + (q.length / t.length) * 100 - firstMatch * 2;
    }

    // Levenshtein-based similarity for typo tolerance
    const maxLen = Math.max(q.length, t.length);
    if (maxLen === 0) return 0;
    const dist = levenshteinDistance(q, t);
    const similarity = 1 - dist / maxLen;
    // Only return if reasonably similar (> 40%)
    if (similarity > 0.4) return similarity * 200;

    return 0; // No meaningful match
}

function levenshteinDistance(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

window.handleSearch = async function() {
    const searchInput   = document.getElementById('generalSearch');
    const searchResults = document.getElementById('searchResults');
    const clearBtn      = document.getElementById('clearSearchBtn');
    
    if (!searchInput || !searchResults) return;

    const query = searchInput.value.trim();
    if (clearBtn) clearBtn.style.display = query ? 'flex' : 'none';

    if (query === '') { searchResults.innerHTML = ''; return; }

    try {
        const products = await DB.getProducts();

        // Score every in-stock product and filter out non-matches
        const scored = products
            .filter(p => (p.quantity || p.stock || 0) > 0)
            .map(p => ({ product: p, score: fuzzyScore(query, p.name) }))
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score);
        
        if (scored.length === 0) {
            searchResults.innerHTML = `<div style="padding: 20px; text-align: center; color: #999;"><p>😔 No products found for "${query}"</p></div>`;
            return;
        }
        
        let html = '<div class="search-results-list">';
        scored.forEach(({ product }, index) => {
            const inCart      = cart.find(item => item.id === product.id);
            const buttonText  = inCart ? '✓ In Cart' : '+ Add';
            const buttonClass = inCart ? 'btn-in-cart' : 'btn-add-search';
            const price       = product.price || product.selling_price || 0;
            const stock       = product.quantity || product.stock || 0;
            html += `
                <div class="search-result-item" style="padding:15px; border-bottom:1px solid #f0f0f0; display:flex; justify-content:space-between; align-items:center; transition:background 0.2s; animation:fadeInUp 0.3s ease; animation-delay:${index*0.05}s; animation-fill-mode:both;">
                    <div style="flex:1;">
                        <div style="font-weight:700; color:#2C3E50; margin-bottom:5px;">${product.name}</div>
                        <div style="font-size:14px; color:#7F8C8D;">₱${parseFloat(price).toFixed(2)} • Stock: ${stock}</div>
                    </div>
                    <button class="${buttonClass}" onclick="addToCart(${product.id})" style="padding:8px 16px; background:${inCart ? '#27AE60' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:700; font-size:13px; transition:all 0.2s;">${buttonText}</button>
                </div>`;
        });
        html += `</div><style>@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } } .search-result-item:hover { background:#f8f9fa; }</style>`;
        searchResults.innerHTML = html;
        
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = `<div style="padding:20px; text-align:center; color:#E74C3C;"><p>⚠️ Error searching products: ${error.message}</p></div>`;
    }
};

window.clearSearch = function() {
    const searchInput   = document.getElementById('generalSearch');
    const clearBtn      = document.getElementById('clearSearchBtn');
    const searchResults = document.getElementById('searchResults');
    if (searchInput)   { searchInput.value = ''; searchInput.focus(); }
    if (clearBtn)        clearBtn.style.display = 'none';
    if (searchResults)   searchResults.innerHTML = '';
};

function setupSearchClearButton() {
    const searchInput = document.getElementById('generalSearch');
    const clearBtn    = document.getElementById('clearSearchBtn');
    if (searchInput && clearBtn) {
        clearBtn.onclick = clearSearch;
        searchInput.addEventListener('input', function() {
            clearBtn.style.display = this.value ? 'flex' : 'none';
        });
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 5: INITIALISATION
//  Runs once on page load. Inserts the search bar, wires up
//  the floating cart button, and calls updateCartDisplay().
// ─────────────────────────────────────────────────────────────────────────────

let cartInitialized = false;

function initializeCart() {
    if (cartInitialized) return;
    cartInitialized = true;
    
    ensureCartPanelClosed();
    injectSearchBar();
    
    const cartBtn     = document.getElementById('floatingCart');
    const searchPanel = document.getElementById('searchPanel');

    if (cartBtn && searchPanel) {
        cartBtn.onclick = null;
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleCartPanel();
            return false;
        }, false);
    } else {
        console.error('❌ CRITICAL: Cart button or search panel not found!');
        return;
    }

    // Search debounce is handled inside injectSearchBar() — no extra listener needed

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) checkoutBtn.onclick = () => { if (typeof handleCheckout === 'function') handleCheckout(); };

    setupSearchClearButton();
    updateCartDisplay();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCart);
} else {
    initializeCart();
}

// Expose cart globally so other scripts (debtors, profit, etc.) can read it
window.cart = cart;

// ─────────────────────────────────────────────────────────────────────────────
//  SECTION 6: CSS-IN-JS STYLE INJECTORS
//  These functions inject <style> tags for checkout/payment modals.
//  injectCartNeomorphismStyles() → now a no-op (moved to injectCartItemStyles)
//  injectCheckoutNeomorphismStyles() → all modal classes (.neo-modal, etc.)
//  injectDebtNeomorphismStyles() → alias for injectCheckoutNeomorphismStyles
// ─────────────────────────────────────────────────────────────────────────────

// Kept for backward compat — cart item CSS is now in injectCartItemStyles()
function injectCartNeomorphismStyles() {
}

// Injects all .neo-modal-overlay, .neo-btn-*, .neo-form-group, etc. styles.
// Used by checkout, cash payment, debt, and success dialogs.
function injectCheckoutNeomorphismStyles() {
    if (document.getElementById('neo-checkout-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'neo-checkout-styles';
    style.textContent = `
        .neo-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 10000; padding: 16px; overflow-y: auto; }
        body.dark-mode .neo-modal-overlay { background: rgba(0,0,0,0.7); }
        .neo-modal { background: var(--bg-surface, #fff); border-radius: 24px; border: 1px solid var(--border-light, #e5e7eb); padding: 40px 32px; max-width: 500px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto; }
        body.dark-mode .neo-modal { background: #1a1a1a; border-color: #2d2d2d; }
        .neo-modal-smaller { max-width: 450px; }
        .neo-modal-header { text-align: center; margin-bottom: 30px; }
        .neo-modal-header h2 { margin: 0 0 10px 0; color: var(--text-primary, #1f2937); font-size: 1.5rem; font-weight: 800; }
        body.dark-mode .neo-modal-header h2 { color: #f3f4f6; }
        .neo-modal-header p  { color: var(--text-secondary, #6b7280); margin: 0; font-size: 14px; }
        .neo-checkout-amount { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px; padding: 20px; margin-bottom: 30px; }
        body.dark-mode .neo-checkout-amount { background: #1a3a1f; border-color: #2d5a35; color: #dcfce7; }
        .neo-checkout-buttons { display: grid; gap: 12px; margin-bottom: 20px; }
        .neo-btn-primary { width: 100%; padding: 18px 20px; border: none; border-radius: 14px; color: white; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 52px; }
        .neo-btn-primary:hover { transform: translateY(-2px); }
        .neo-btn-success { background: linear-gradient(135deg, #27AE60 0%, #229954 100%); box-shadow: 0 4px 14px rgba(39,174,96,0.3); }
        .neo-btn-success:hover { background: linear-gradient(135deg, #229954 0%, #1e8449 100%); }
        .neo-btn-warning { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); box-shadow: 0 4px 14px rgba(249,115,22,0.3); }
        .neo-btn-warning:hover { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); }
        .neo-btn-red { width: 100%; padding: 14px; border: none; border-radius: 14px; background: #ef4444; color: white; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
        .neo-btn-red:hover { background: #dc2626; transform: translateY(-2px); }
        .neo-btn-secondary { width: 100%; padding: 14px; border-radius: 14px; background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .neo-btn-secondary:hover { background: #fecaca; }
        body.dark-mode .neo-btn-secondary { background: #3a2020; border-color: #4a2828; color: #fca5a5; }
        .neo-form-group { margin-bottom: 20px; }
        .neo-form-group label { display: block; margin-bottom: 8px; font-weight: 700; color: var(--text-primary, #1f2937); font-size: 14px; }
        body.dark-mode .neo-form-group label { color: #d1d5db; }
        .neo-input-field { width: 100%; padding: 14px 16px; font-size: 15px; font-weight: 600; border: 1.5px solid #e5e7eb; border-radius: 12px; background: #fff; color: #1f2937; transition: all 0.2s; box-sizing: border-box; min-height: 48px; }
        .neo-input-field:focus { border-color: #27AE60; box-shadow: 0 0 0 3px rgba(39,174,96,0.1); outline: none; }
        body.dark-mode .neo-input-field { background: #252b27; border-color: #344d38; color: #e8f5e4; }
        body.dark-mode .neo-input-field:focus { border-color: #4ade80; }
        .neo-input-cash { font-size: 24px !important; text-align: center; font-weight: 700 !important; border-radius: 16px !important; }
        .neo-change-amount { background: #f0fdf4; border: 1.5px solid #bbf7d0; border-radius: 16px; padding: 20px; margin-bottom: 20px; text-align: center; color: #16a34a; font-weight: 700; }
        body.dark-mode .neo-change-amount { background: #1a3a1f; border-color: #2d5a35; color: #4ade80; }
        .neo-change-display { background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 20px; }
        body.dark-mode .neo-change-display { background: #3a2f00; border-color: #4a3a00; }
        .neo-change-label { font-size: 14px; color: #92400e; font-weight: 700; margin-bottom: 8px; }
        body.dark-mode .neo-change-label { color: #fde68a; }
        .neo-change-amount-value { font-size: 32px; font-weight: 800; color: #16a34a; }
        body.dark-mode .neo-change-amount-value { color: #4ade80; }
        .neo-change-amount-value.insufficient { color: #dc2626 !important; font-size: 22px; }
        .neo-modal-success { max-width: 440px; text-align: center; padding: 50px 40px; }
        .neo-success-icon { font-size: 64px; margin-bottom: 15px; display: block; }
        .neo-success-title { color: #27AE60; margin: 0 0 20px 0; font-size: 1.8rem; font-weight: 800; }
        body.dark-mode .neo-success-title { color: #4ade80; }
        .neo-success-info { background: #f9fafb; border-radius: 16px; padding: 20px; margin: 20px 0; text-align: left; border: 1px solid #e5e7eb; }
        body.dark-mode .neo-success-info { background: #1f2937; border-color: #374151; }
        .neo-success-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; color: #6b7280; gap: 12px; flex-wrap: wrap; }
        .neo-success-item:last-child { margin-bottom: 0; }
        body.dark-mode .neo-success-item { color: #9ca3af; }
        .neo-success-value { color: #1f2937; font-weight: 700; text-align: right; }
        body.dark-mode .neo-success-value { color: #f3f4f6; }
        .neo-success-badge { background: #dbeafe; color: #1e40af; padding: 12px 16px; border-radius: 20px; margin-bottom: 25px; font-weight: 600; display: inline-block; border: 1px solid #bfdbfe; }
        body.dark-mode .neo-success-badge { background: #1e3a8a; color: #bfdbfe; border-color: #3b82f6; }
        .neo-success-btn { width: 100%; padding: 18px; background: linear-gradient(135deg, #27AE60 0%, #229954 100%); color: white; border: none; border-radius: 14px; font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
        .neo-success-btn:hover { background: linear-gradient(135deg, #229954 0%, #1e8449 100%); transform: translateY(-2px); }
        @keyframes fadeIn    { from{opacity:0}    to{opacity:1} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes successPop { 0%{transform:scale(0.3);opacity:0} 50%{transform:scale(1.05)} 100%{transform:scale(1);opacity:1} }
        @media (max-width: 480px) {
            .neo-modal { padding: 24px 16px; }
            .neo-modal-overlay { padding: 12px; align-items: flex-end; }
            .neo-input-cash { font-size: 18px !important; }
        }
    `;
    document.head.appendChild(style);
}

// Alias — debt modals reuse the same checkout styles
function injectDebtNeomorphismStyles() {
    injectCheckoutNeomorphismStyles();
}