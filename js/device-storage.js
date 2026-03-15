/**
 * device-storage.js — Hybrid Storage Layer
 *
 * Desktop (Chrome/Edge):  File System Access API → user's chosen folder
 * Tablet/Mobile:          OPFS (Origin Private File System) → zero permission prompts, ever
 * Fallback:               localStorage
 */

class DeviceStorageManager {
  constructor() {
    this.dirHandle   = null;
    this.opfsRoot    = null;   // OPFS root directory handle
    this.storageMode = 'localStorage'; // 'device' | 'opfs' | 'localStorage'
    this.fileHandles = {};
    this.data = {
      categories: [], products: [], sales: [], sales_history: [],
      debtors: [], payment_history: [], settings: {},
      periodTotals: {}, accumulatedTotals: {}
    };

    // File System Access API (desktop)
    this.isSupported      = 'showDirectoryPicker' in window;
    // OPFS — works on all modern browsers including tablet Chrome/Safari
    this.isOPFSSupported  = 'storage' in navigator && 'getDirectory' in navigator.storage;

    this.dbName    = 'DeviceStorageHandles';
    this.storeName = 'fileHandles';
    this.initialized   = false;
    this._savedHandle  = null;
    this._initPromise  = null;

    this.initIndexedDB();

    console.log(`📁 File System API: ${this.isSupported ? '✅' : '❌'} | OPFS: ${this.isOPFSSupported ? '✅' : '❌'}`);

    // Register early reconnect listener for desktop File System API
    if (this.isSupported) {
      this._setupEarlyReconnectListener();
    }
  }

  // =========================================================================
  //  IndexedDB FOR PERSISTENT FILE HANDLES (desktop only)
  // =========================================================================

  async initIndexedDB() {
    if (!this.isSupported) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror       = () => reject(request.error);
      request.onsuccess     = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async saveHandleToIDB(dirHandle) {
    if (!this.isSupported) return;
    try {
      const db    = await this.initIndexedDB();
      const tx    = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.put({ id: 'jorams-data-dir', handle: dirHandle, savedAt: new Date().toISOString() });
    } catch (err) { console.error('Failed to save handle to IDB:', err); }
  }

  async getHandleFromIDB() {
    if (!this.isSupported) return null;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onsuccess = () => {
        const db    = request.result;
        const tx    = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const query = store.get('jorams-data-dir');
        query.onsuccess = () => resolve(query.result?.handle || null);
        query.onerror   = () => reject(query.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // =========================================================================
  //  INITIALIZATION — auto-picks best storage for device
  // =========================================================================

  async init() {
    if (this._initPromise) return this._initPromise;
    if (this.initialized)  return true;
    this._initPromise = this._doInit();
    const result      = await this._initPromise;
    this._initPromise = null;
    return result;
  }

  async _doInit() {
    const usesOPFS      = localStorage.getItem('useOPFS') === 'true';
    const usesFolder    = localStorage.getItem('deviceStorageConnected') === 'true';

    // ── OPFS (tablet/mobile) ─────────────────────────────────────────────────
    if (usesOPFS && this.isOPFSSupported) {
      try {
        const root = await navigator.storage.getDirectory();
        this.opfsRoot    = root;
        this.storageMode = 'opfs';
        await this._loadAllFromOPFS();
        this.initialized = true;
        console.log('✅ OPFS initialized');
        return true;
      } catch (err) {
        console.error('OPFS failed — staying on OPFS, data may be empty:', err);
        // Still mark as OPFS so saves go there — don't fall to localStorage
        this.storageMode = 'opfs';
        this.initialized = true;
        return true;
      }
    }

    // ── Desktop File System API ───────────────────────────────────────────────
    if (this.isSupported) {
      try {
        const dirHandle = await this.getHandleFromIDB();
        if (dirHandle) {
          this._savedHandle    = dirHandle;
          const permission     = await dirHandle.queryPermission({ mode: 'readwrite' });

          if (permission === 'granted') {
            if (this._cancelReconnect) this._cancelReconnect();
            this.dirHandle   = dirHandle;
            this.storageMode = 'device';
            await this.loadAllFromDevice();
            this.initialized = true;
            console.log('✅ Device File System initialized');
            return true;
          } else {
            // Need gesture — load localStorage temporarily so app isn't blank,
            // but DO NOT mark as localStorage mode — saves will go to device once reconnected
            this.loadFromLocalStorage();
            if (this._activateReconnect) this._activateReconnect(dirHandle);
            return true;
          }
        }
      } catch (err) {
        console.warn('File System init failed:', err);
      }
    }

    // ── OPFS available but not yet chosen ────────────────────────────────────
    if (this.isOPFSSupported && !usesOPFS && !usesFolder) {
      // Not configured yet — use localStorage until user chooses storage
      console.log('📦 No storage configured yet — using localStorage');
      return this.loadFromLocalStorage();
    }

    // ── Last resort localStorage ──────────────────────────────────────────────
    console.log('📦 Using localStorage fallback');
    return this.loadFromLocalStorage();
  }

  // =========================================================================
  //  OPFS FILE I/O
  // =========================================================================

  async _readOPFS(filename) {
    try {
      const fh      = await this.opfsRoot.getFileHandle(filename, { create: false });
      const file    = await fh.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (err) {
      if (err.name !== 'NotFoundError') console.error(`OPFS read ${filename}:`, err);
      return null;
    }
  }

  async _writeOPFS(filename, data) {
    try {
      const fh       = await this.opfsRoot.getFileHandle(filename, { create: true });
      const writable = await fh.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (err) {
      console.error(`OPFS write ${filename}:`, err);
      return false;
    }
  }

  async _loadAllFromOPFS() {
    console.log('📂 Loading all data from OPFS...');
    this.data.categories        = await this._readOPFS('categories.json')        || [];
    this.data.products          = await this._readOPFS('products.json')          || [];
    this.data.sales             = await this._readOPFS('sales.json')             || [];
    this.data.sales_history     = await this._readOPFS('sales_history.json')     || [];
    this.data.debtors           = await this._readOPFS('debtors.json')           || [];
    this.data.payment_history   = await this._readOPFS('payment_history.json')   || [];
    this.data.settings          = await this._readOPFS('settings.json')          || this.defaultSettings();
    this.data.periodTotals      = await this._readOPFS('periodTotals.json')      || this.getEmptyPeriodTotals();
    this.data.accumulatedTotals = await this._readOPFS('accumulatedTotals.json') || { revenue: 0, profit: 0 };
    console.log('✅ OPFS data loaded');
  }

  async _saveAllToOPFS() {
    if (!this.opfsRoot) return false;
    try {
      await Promise.all([
        this._writeOPFS('categories.json',        this.data.categories),
        this._writeOPFS('products.json',           this.data.products),
        this._writeOPFS('sales.json',              this.data.sales),
        this._writeOPFS('sales_history.json',      this.data.sales_history),
        this._writeOPFS('debtors.json',            this.data.debtors),
        this._writeOPFS('payment_history.json',    this.data.payment_history),
        this._writeOPFS('settings.json',           this.data.settings),
        this._writeOPFS('periodTotals.json',       this.data.periodTotals),
        this._writeOPFS('accumulatedTotals.json',  this.data.accumulatedTotals),
      ]);
      return true;
    } catch (err) {
      console.error('OPFS saveAll error:', err);
      return false;
    }
  }

  async _saveKeyToOPFS(key) {
    if (!this.opfsRoot) return false;
    const fileMap = {
      categories: 'categories.json', products: 'products.json',
      sales: 'sales.json', sales_history: 'sales_history.json',
      debtors: 'debtors.json', payment_history: 'payment_history.json',
      settings: 'settings.json', periodTotals: 'periodTotals.json',
      accumulatedTotals: 'accumulatedTotals.json'
    };
    const filename = fileMap[key];
    if (!filename) return false;
    return await this._writeOPFS(filename, this.data[key]);
  }

  // =========================================================================
  //  OPFS PUBLIC API — enable OPFS from Settings
  // =========================================================================

  async enableOPFS() {
    if (!this.isOPFSSupported) return false;
    try {
      this.opfsRoot = await navigator.storage.getDirectory();
      // Copy whatever data is currently in memory (from localStorage) to OPFS
      await this._saveAllToOPFS();
      this.storageMode = 'opfs';
      this.initialized = true;
      localStorage.setItem('useOPFS', 'true');
      localStorage.removeItem('storagePromptDismissed');
      console.log('✅ OPFS enabled and data migrated');
      return true;
    } catch (err) {
      console.error('enableOPFS error:', err);
      return false;
    }
  }

  // =========================================================================
  //  UNIFIED SAVE ROUTER
  // =========================================================================

  async saveToDevice(key) {
    if (this.storageMode === 'opfs') {
      // Auto-init opfsRoot if not set yet
      if (!this.opfsRoot) {
        try { this.opfsRoot = await navigator.storage.getDirectory(); } catch(e) {}
      }
      return await this._saveKeyToOPFS(key);
    }
    if (this.storageMode === 'device') {
      if (!this.isSupported || !this.dirHandle) return false;
      const fileMap = {
        categories: 'categories.json', products: 'products.json',
        sales: 'sales.json', sales_history: 'sales_history.json',
        debtors: 'debtors.json', payment_history: 'payment_history.json',
        settings: 'settings.json', periodTotals: 'periodTotals.json',
        accumulatedTotals: 'accumulatedTotals.json'
      };
      const filename = fileMap[key];
      if (!filename) return false;
      return await this.writeFile(filename, this.data[key]);
    }
    // localStorage — mirror via saveToLocalStorage below
    this.saveToLocalStorage();
    return true;
  }

  async saveAllToDevice() {
    if (this.storageMode === 'opfs')   return await this._saveAllToOPFS();
    if (this.storageMode === 'device') {
      if (!this.isSupported || !this.dirHandle) return false;
      try {
        await Promise.all([
          this.writeFile('categories.json',        this.data.categories),
          this.writeFile('products.json',           this.data.products),
          this.writeFile('sales.json',              this.data.sales),
          this.writeFile('sales_history.json',      this.data.sales_history),
          this.writeFile('debtors.json',            this.data.debtors),
          this.writeFile('payment_history.json',    this.data.payment_history),
          this.writeFile('settings.json',           this.data.settings),
          this.writeFile('periodTotals.json',       this.data.periodTotals),
          this.writeFile('accumulatedTotals.json',  this.data.accumulatedTotals),
        ]);
        return true;
      } catch (err) { console.error('saveAllToDevice error:', err); return false; }
    }
    this.saveToLocalStorage();
    return true;
  }

  // =========================================================================
  //  DESKTOP FILE SYSTEM ACCESS API — file I/O
  // =========================================================================

  async getFileHandle(filename, create = true) {
    try { return await this.dirHandle.getFileHandle(filename, { create }); }
    catch (err) { console.error(`Error getting file handle for ${filename}:`, err); return null; }
  }

  async readFile(filename) {
    try {
      const fh      = await this.getFileHandle(filename, false);
      if (!fh) return null;
      const file    = await fh.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (err) {
      if (err.name !== 'NotFoundError') console.error(`Error reading ${filename}:`, err);
      return null;
    }
  }

  async writeFile(filename, data) {
    try {
      const fh       = await this.getFileHandle(filename, true);
      if (!fh) throw new Error('Could not get file handle');
      const writable = await fh.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (err) { console.error(`Error writing ${filename}:`, err); return false; }
  }

  async loadAllFromDevice() {
    console.log('📂 Loading from device folder...');
    this.data.categories        = await this.readFile('categories.json')        || [];
    this.data.products          = await this.readFile('products.json')          || [];
    this.data.sales             = await this.readFile('sales.json')             || [];
    this.data.sales_history     = await this.readFile('sales_history.json')     || [];
    this.data.debtors           = await this.readFile('debtors.json')           || [];
    this.data.payment_history   = await this.readFile('payment_history.json')   || [];
    this.data.settings          = await this.readFile('settings.json')          || this.defaultSettings();
    this.data.periodTotals      = await this.readFile('periodTotals.json')      || this.getEmptyPeriodTotals();
    this.data.accumulatedTotals = await this.readFile('accumulatedTotals.json') || { revenue: 0, profit: 0 };
    console.log('✅ Device data loaded');
  }

  // =========================================================================
  //  EARLY RECONNECT LISTENER (desktop File System API only)
  // =========================================================================

  _setupEarlyReconnectListener() {
    const events = ['touchend', 'pointerup', 'click'];
    let fired            = false;
    let activeHandle     = null;
    let gestureAvailable = false;

    const doPermission = (handle) => {
      const permPromise = handle.requestPermission({ mode: 'readwrite' });
      fired = true;
      events.forEach(evt => document.removeEventListener(evt, handler, true));

      permPromise.then(async (permission) => {
        if (permission === 'granted') {
          this.dirHandle    = handle;
          this._savedHandle = handle;
          this.storageMode  = 'device';
          await this.loadAllFromDevice();
          this.initialized  = true;
          console.log('✅ Device Storage silently reconnected');
          this._updateBadge(handle.name);
          this._refreshActivePage();
        } else {
          fired = false;
          events.forEach(evt => document.addEventListener(evt, handler, true));
        }
      }).catch(err => {
        if (err.name !== 'AbortError') console.error('Reconnect error:', err);
        fired = false;
        events.forEach(evt => document.addEventListener(evt, handler, true));
      });
    };

    this._activateReconnect = (handle) => {
      activeHandle = handle;
      if (gestureAvailable && !fired) {
        gestureAvailable = false;
        doPermission(handle);
      }
    };

    this._cancelReconnect = () => {
      activeHandle = null;
      events.forEach(evt => document.removeEventListener(evt, handler, true));
    };

    const handler = (e) => {
      if (fired) return;
      if (!activeHandle) { gestureAvailable = true; return; }
      doPermission(activeHandle);
    };

    events.forEach(evt => document.addEventListener(evt, handler, true));
  }

  _updateBadge(name) {
    const badge = document.querySelector('.offline-badge');
    if (badge) {
      badge.textContent      = `✓ ${this.storageMode === 'opfs' ? 'App Storage' : 'Device Storage'}: ${name}`;
      badge.style.background = 'linear-gradient(135deg,#15803d,#166534)';
    }
  }

  async _refreshActivePage() {
    const page = document.querySelector('.page.active-page');
    if (!page) return;
    const id = page.id;
    if (id === 'profitPage'    && typeof renderProfit           === 'function') await renderProfit();
    if (id === 'inventoryPage' && typeof window.renderInventory === 'function') await window.renderInventory();
    if (id === 'pricePage'     && typeof window.renderPriceList === 'function') await window.renderPriceList();
    if (id === 'debtPage'      && typeof window.renderDebtors   === 'function') await window.renderDebtors();
    if (id === 'calendarPage'  && typeof renderCalendar         === 'function') await renderCalendar();
    if (id === 'settingsPage'  && typeof window.renderSettings  === 'function') await window.renderSettings();
  }

  // =========================================================================
  //  RECONNECT / REQUEST ACCESS (desktop)
  // =========================================================================

  async reconnectDirectory() {
    if (!this.isSupported) return false;
    try {
      const dirHandle = this._savedHandle || await this.getHandleFromIDB();
      if (!dirHandle) return false;
      const permission = await dirHandle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') return false;
      this.dirHandle   = dirHandle;
      this.storageMode = 'device';
      await this.loadAllFromDevice();
      this.initialized = true;
      console.log('✅ Device Storage reconnected');
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Reconnect error:', err);
      return false;
    }
  }

  async requestDirectoryAccess() {
    if (!this.isSupported) return false;
    try {
      const dirHandle = await window.showDirectoryPicker({
        id: 'jorams-data-folder', mode: 'readwrite', startIn: 'documents'
      });
      await this.saveHandleToIDB(dirHandle);
      this._savedHandle = dirHandle;
      this.dirHandle    = dirHandle;
      this.storageMode  = 'device';

      const existingProducts = await this.readFile('products.json');
      if (!existingProducts || existingProducts.length === 0) {
        this.loadFromLocalStorage();
        await this.saveAllToDevice();
      } else {
        await this.loadAllFromDevice();
      }

      this.initialized = true;
      localStorage.setItem('deviceStorageConnected', 'true');
      console.log('✅ Directory access granted: ' + dirHandle.name);
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Directory access error:', err);
      return false;
    }
  }

  // =========================================================================
  //  localStorage FALLBACK
  // =========================================================================

  loadFromLocalStorage() {
    const prefix = 'jorams_sari_sari_';
    const load   = (key, fallback) => {
      try { const raw = localStorage.getItem(prefix + key); return raw ? JSON.parse(raw) : fallback; }
      catch (e) { return fallback; }
    };
    this.data.categories        = load('categories',        []);
    this.data.products          = load('products',          []);
    this.data.sales             = load('sales',             []);
    this.data.sales_history     = load('sales_history',     []);
    this.data.debtors           = load('debtors',           []);
    this.data.payment_history   = load('payment_history',   []);
    this.data.settings          = load('settings',          this.defaultSettings());
    this.data.periodTotals      = load('periodTotals',      this.getEmptyPeriodTotals());
    this.data.accumulatedTotals = load('accumulatedTotals', { revenue: 0, profit: 0 });
    this.initialized = true;
    return true;
  }

  saveToLocalStorage() {
    const prefix = 'jorams_sari_sari_';
    const save   = (key, value) => {
      try { localStorage.setItem(prefix + key, JSON.stringify(value)); }
      catch (e) { console.error('localStorage save error:', key, e); }
    };
    save('categories', this.data.categories); save('products', this.data.products);
    save('sales', this.data.sales); save('sales_history', this.data.sales_history);
    save('debtors', this.data.debtors); save('payment_history', this.data.payment_history);
    save('settings', this.data.settings); save('periodTotals', this.data.periodTotals);
    save('accumulatedTotals', this.data.accumulatedTotals);
  }

  // =========================================================================
  //  DEFAULT VALUES
  // =========================================================================

  defaultSettings() {
    return { profitMargin: 20, lowStockLimit: 5, theme: 'light', debtSurcharge: 0, changeHistory: [] };
  }

  getEmptyPeriodTotals() {
    const e = { revenue: 0, profit: 0, sales_count: 0, has_data: false };
    return { today: {...e}, yesterday: {...e}, last_week: {...e}, last_month: {...e}, last_year: {...e} };
  }

  // =========================================================================
  //  CATEGORIES API
  // =========================================================================

  async getCategories() {
    if (!this.initialized) await this.init();
    return Promise.resolve(this.data.categories);
  }

  async addCategory(categoryData) {
    if (!this.initialized) await this.init();
    const newCat = { id: categoryData.id || Date.now().toString(), ...categoryData, created_at: new Date().toISOString() };
    this.data.categories.push(newCat);
    await this.saveToDevice('categories');
    return Promise.resolve(newCat);
  }

  async updateCategory(categoryId, updates) {
    if (!this.initialized) await this.init();
    const idx = this.data.categories.findIndex(c => c.id === categoryId);
    if (idx >= 0) {
      this.data.categories[idx] = { ...this.data.categories[idx], ...updates, updated_at: new Date().toISOString() };
      await this.saveToDevice('categories');
      return Promise.resolve(this.data.categories[idx]);
    }
    throw new Error(`Category ${categoryId} not found`);
  }

  async deleteCategory(categoryId, reassignToId = null, deleteProducts = false) {
    if (!this.initialized) await this.init();
    this.data.categories = this.data.categories.filter(c => c.id !== categoryId);
    if (deleteProducts) {
      this.data.products = this.data.products.filter(p => p.category !== categoryId && p.category_id !== categoryId);
    } else if (reassignToId) {
      this.data.products = this.data.products.map(p =>
        (p.category === categoryId || p.category_id === categoryId)
          ? { ...p, category: reassignToId, category_id: reassignToId } : p
      );
    }
    await Promise.all([this.saveToDevice('categories'), this.saveToDevice('products')]);
    return Promise.resolve(true);
  }

  // =========================================================================
  //  PRODUCTS API
  // =========================================================================

  async getProducts() {
    if (!this.initialized) await this.init();
    return Promise.resolve(this.data.products);
  }

  async addProduct(productData) {
    if (!this.initialized) await this.init();
    const newProduct = {
      id: Date.now().toString(), ...productData,
      quantity: parseFloat(productData.quantity || 0),
      cost:     parseFloat(productData.cost     || 0),
      price:    parseFloat(productData.price    || 0),
      created_at: new Date().toISOString()
    };
    this.data.products.push(newProduct);
    await this.saveToDevice('products');
    return Promise.resolve(newProduct);
  }

  async updateProduct(productId, updates) {
    if (!this.initialized) await this.init();
    const idx = this.data.products.findIndex(p => p.id === productId);
    if (idx >= 0) {
      this.data.products[idx] = {
        ...this.data.products[idx], ...updates,
        quantity: updates.quantity !== undefined ? parseFloat(updates.quantity) : this.data.products[idx].quantity,
        cost:     updates.cost     !== undefined ? parseFloat(updates.cost)     : this.data.products[idx].cost,
        price:    updates.price    !== undefined ? parseFloat(updates.price)    : this.data.products[idx].price,
        updated_at: new Date().toISOString()
      };
      await this.saveToDevice('products');
      return Promise.resolve(this.data.products[idx]);
    }
    throw new Error(`Product ${productId} not found`);
  }

  async deleteProduct(productId) {
    if (!this.initialized) await this.init();
    this.data.products = this.data.products.filter(p => p.id !== productId);
    await this.saveToDevice('products');
    return Promise.resolve(true);
  }

  // =========================================================================
  //  SALES API
  // =========================================================================

  async getSales() {
    if (!this.initialized) await this.init();
    return Promise.resolve(this.data.sales);
  }

  async addSale(saleData) {
    if (!this.initialized) await this.init();
    const newSale = {
      id: Date.now().toString(), date: new Date().toISOString(), ...saleData,
      total: parseFloat(saleData.total || 0), profit: parseFloat(saleData.profit || 0),
      items: Array.isArray(saleData.items) ? saleData.items : []
    };
    this.data.sales.push(newSale);
    this.data.sales_history.push(JSON.parse(JSON.stringify(newSale)));
    await Promise.all([this.saveToDevice('sales'), this.saveToDevice('sales_history')]);
    this.updatePeriodTotals();
    return Promise.resolve(newSale);
  }

  async saveSales(salesData) {
    if (!this.initialized) await this.init();
    this.data.sales = salesData;
    await this.saveToDevice('sales');
    this.updatePeriodTotals();
    return Promise.resolve(true);
  }

  async clearAllSales() {
    if (!this.initialized) await this.init();
    this.data.sales = [];
    this.data.periodTotals = this.getEmptyPeriodTotals();
    await Promise.all([this.saveToDevice('sales'), this.saveToDevice('periodTotals')]);
    return Promise.resolve(true);
  }

  // =========================================================================
  //  PERIOD TOTALS
  // =========================================================================

  updatePeriodTotals() {
    const sales = this.data.sales_history;
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow       = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const yesterday      = new Date(today); yesterday.setDate(today.getDate() - 1);
    const thisWeekSun    = new Date(today); thisWeekSun.setDate(today.getDate() - today.getDay());
    const lastWeekSun    = new Date(thisWeekSun); lastWeekSun.setDate(thisWeekSun.getDate() - 7);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd   = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastYearStart  = new Date(today.getFullYear() - 1, 0, 1);
    const lastYearEnd    = new Date(today.getFullYear(), 0, 1);

    const filter = (s, e) => sales.filter(x => { const d = new Date(x.date); return d >= s && d < e; });
    const stats  = list  => ({
      revenue: list.reduce((s, x) => s + parseFloat(x.total  || 0), 0),
      profit:  list.reduce((s, x) => s + parseFloat(x.profit || 0), 0),
      sales_count: list.length, has_data: list.length > 0
    });

    const stored = this.data.periodTotals || {};
    const ft = stats(filter(today, tomorrow)), fy = stats(filter(yesterday, today));
    const fw = stats(filter(lastWeekSun, thisWeekSun));
    const fm = stats(filter(lastMonthStart, lastMonthEnd));
    const fr = stats(filter(lastYearStart, lastYearEnd));

    this.data.periodTotals = {
      today: ft, yesterday: fy,
      last_week:  fw.has_data ? fw : (stored.last_week?.has_data  ? stored.last_week  : fw),
      last_month: fm.has_data ? fm : (stored.last_month?.has_data ? stored.last_month : fm),
      last_year:  fr.has_data ? fr : (stored.last_year?.has_data  ? stored.last_year  : fr),
    };
    this.saveToDevice('periodTotals');
  }

  async getPeriodTotals() {
    if (!this.initialized) await this.init();
    if (this._skipRecalc) { this._skipRecalc = false; return Promise.resolve(this.data.periodTotals); }
    this.updatePeriodTotals();
    return Promise.resolve(this.data.periodTotals);
  }

  async updatePeriods() { return Promise.resolve(this.updatePeriodTotals()); }

  // =========================================================================
  //  CALENDAR API
  // =========================================================================

  async getCalendarData(year, month) {
    if (!this.initialized) await this.init();
    const calendarData = {}; const paidDebtDates = new Set(); const mi = month - 1;
    this.data.sales_history.forEach(sale => {
      const d = new Date(sale.date);
      if (d.getFullYear() === year && d.getMonth() === mi) {
        const ds = d.toISOString().split('T')[0];
        if (!calendarData[ds]) calendarData[ds] = { revenue: 0, profit: 0, sales: [], payments: [] };
        calendarData[ds].revenue += parseFloat(sale.total || 0);
        calendarData[ds].profit  += parseFloat(sale.profit || 0);
        calendarData[ds].sales.push(sale);
      }
    });
    this.data.payment_history.forEach(p => {
      const d = new Date(p.date_paid);
      if (d.getFullYear() === year && d.getMonth() === mi) {
        const ds = d.toISOString().split('T')[0];
        if (!calendarData[ds]) calendarData[ds] = { revenue: 0, profit: 0, sales: [], payments: [] };
        calendarData[ds].payments.push(p); paidDebtDates.add(ds);
      }
    });
    const summaryArray = Object.entries(calendarData).map(([date, data]) => ({
      date, total_revenue: data.revenue, total_profit: data.profit,
      transaction_count: data.sales.length, payment_count: data.payments.length
    }));
    return Promise.resolve({ summaries: summaryArray, paid_debt_dates: Array.from(paidDebtDates) });
  }

  async getDateDetails(dateStr) {
    if (!this.initialized) await this.init();
    const dateSales    = this.data.sales_history.filter(s => s.date.split('T')[0] === dateStr);
    const datePayments = this.data.payment_history.filter(p => p.date_paid.split('T')[0] === dateStr);
    const productMap   = {};
    dateSales.forEach(sale => {
      (Array.isArray(sale.items) ? sale.items : []).forEach(item => {
        const name = item.product_name || item.name || 'Unknown';
        const qty  = parseFloat(item.quantity || 0);
        const cost = parseFloat(item.cost || item.cost_price || 0);
        const prc  = parseFloat(item.price || item.selling_price || 0);
        if (!productMap[name]) productMap[name] = { name, quantity: 0, profit: 0 };
        productMap[name].quantity += qty; productMap[name].profit += (prc - cost) * qty;
      });
    });
    const psl = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);
    return Promise.resolve({
      date: dateStr, sales: dateSales, payments: datePayments,
      total_revenue:     dateSales.reduce((s, x) => s + parseFloat(x.total  || 0), 0),
      total_profit:      dateSales.reduce((s, x) => s + parseFloat(x.profit || 0), 0),
      transaction_count: dateSales.length,
      best_seller_by_quantity: psl[0]?.name || 'N/A', best_seller_quantity: psl[0]?.quantity || 0,
      best_seller_by_profit:   psl[0]?.name || 'N/A', best_seller_profit: psl[0]?.profit || 0,
      products_sold_list: psl,
      debts_paid: datePayments.map(d => ({
        id: d.id, customer_name: d.customer_name || d.name || 'Unknown',
        total_amount: parseFloat(d.total_amount || 0), original_total: parseFloat(d.original_total || 0),
        surcharge_percent: parseFloat(d.surcharge_percent || 0), surcharge_amount: parseFloat(d.surcharge_amount || 0),
        date_borrowed: d.date || d.date_borrowed || '', items: Array.isArray(d.items) ? d.items : []
      }))
    });
  }

  // =========================================================================
  //  DEBTORS API
  // =========================================================================

  async getDebtors() {
    if (!this.initialized) await this.init();
    return Promise.resolve(this.data.debtors);
  }

  async addDebtor(debtorData) {
    if (!this.initialized) await this.init();
    const existingIdx = this.data.debtors.findIndex(d =>
      !d.paid && (d.name || '').toLowerCase() === (debtorData.name || '').toLowerCase()
    );
    if (existingIdx >= 0) {
      const e = this.data.debtors[existingIdx];
      this.data.debtors[existingIdx] = {
        ...e, items: [...(e.items || []), ...(debtorData.items || [])],
        original_total:   parseFloat((parseFloat(e.original_total  || 0) + parseFloat(debtorData.original_total  || 0)).toFixed(2)),
        surcharge_amount: parseFloat((parseFloat(e.surcharge_amount || 0) + parseFloat(debtorData.surcharge_amount || 0)).toFixed(2)),
        total_debt:       parseFloat((parseFloat(e.total_debt       || 0) + parseFloat(debtorData.total_debt       || 0)).toFixed(2)),
        updated_at: new Date().toISOString()
      };
      await this.saveToDevice('debtors');
      return Promise.resolve({ debtor: this.data.debtors[existingIdx], merged: true });
    }
    const newDebtor = {
      id: Date.now().toString(), ...debtorData, date: new Date().toISOString(),
      total_debt:        parseFloat(debtorData.total_debt      || debtorData.original_total || 0),
      original_total:    parseFloat(debtorData.original_total  || debtorData.total_debt     || 0),
      surcharge_percent: parseFloat(debtorData.surcharge_percent || 0),
      surcharge_amount:  parseFloat(debtorData.surcharge_amount  || 0),
      paid: false, items: Array.isArray(debtorData.items) ? debtorData.items : []
    };
    this.data.debtors.push(newDebtor);
    await this.saveToDevice('debtors');
    return Promise.resolve({ debtor: newDebtor, merged: false });
  }

  async updateDebtor(debtorId, updates) {
    if (!this.initialized) await this.init();
    const idx = this.data.debtors.findIndex(d => d.id === debtorId);
    if (idx >= 0) {
      this.data.debtors[idx] = {
        ...this.data.debtors[idx], ...updates,
        total_debt:       updates.total_debt       !== undefined ? parseFloat(updates.total_debt)       : this.data.debtors[idx].total_debt,
        surcharge_amount: updates.surcharge_amount !== undefined ? parseFloat(updates.surcharge_amount) : this.data.debtors[idx].surcharge_amount
      };
      if (updates.paid) this.archivePayment(this.data.debtors[idx]);
      await Promise.all([this.saveToDevice('debtors'), this.saveToDevice('payment_history')]);
      return Promise.resolve(this.data.debtors[idx]);
    }
    throw new Error(`Debtor ${debtorId} not found`);
  }

  async deleteDebtor(debtorId) {
    if (!this.initialized) await this.init();
    this.data.debtors = this.data.debtors.filter(d => d.id !== debtorId);
    await this.saveToDevice('debtors');
    return Promise.resolve(true);
  }

  async clearPaidDebtors() {
    if (!this.initialized) await this.init();
    this.data.debtors = this.data.debtors.filter(d => !d.paid);
    await this.saveToDevice('debtors');
    return Promise.resolve(true);
  }

  archivePayment(debtor) {
    if (!debtor.paid) return;
    const entry = {
      id: debtor.id, customer_name: debtor.name || 'Unknown',
      total_amount: parseFloat(debtor.total_debt || 0), original_total: parseFloat(debtor.original_total || 0),
      surcharge_percent: parseFloat(debtor.surcharge_percent || 0), surcharge_amount: parseFloat(debtor.surcharge_amount || 0),
      date_borrowed: debtor.date || debtor.date_borrowed || '',
      date_paid: debtor.date_paid || new Date().toISOString(), items: debtor.items || []
    };
    if (!this.data.payment_history.find(h => h.id === entry.id)) this.data.payment_history.push(entry);
  }

  async autoCleanupPaidDebtors() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.data.debtors = this.data.debtors.filter(d => !d.paid || !d.date_paid || new Date(d.date_paid) > sevenDaysAgo);
    await this.saveToDevice('debtors');
    return Promise.resolve(true);
  }

  async cleanupPaymentHistory() {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    this.data.payment_history = this.data.payment_history.filter(p => new Date(p.date_paid) > oneYearAgo);
    await this.saveToDevice('payment_history');
    return Promise.resolve(true);
  }

  // =========================================================================
  //  ACCUMULATED TOTALS
  // =========================================================================

  async getAccumulatedTotals() {
    if (!this.initialized) await this.init();
    return Promise.resolve(this.data.accumulatedTotals || { revenue: 0, profit: 0 });
  }

  async updateAccumulatedTotals(updates) {
    if (!this.initialized) await this.init();
    const current = this.data.accumulatedTotals || { revenue: 0, profit: 0 };
    const updated = {
      ...current, ...updates,
      revenue: parseFloat(updates.revenue !== undefined ? updates.revenue : current.revenue),
      profit:  parseFloat(updates.profit  !== undefined ? updates.profit  : current.profit)
    };
    this.data.accumulatedTotals = updated;
    await this.saveToDevice('accumulatedTotals');
    return Promise.resolve(updated);
  }

  // =========================================================================
  //  SETTINGS API
  // =========================================================================

  async getSettings() {
    if (!this.initialized) await this.init();
    const settings = this.data.settings || this.defaultSettings();
    window.storeSettings = settings; window.CURRENT_SETTINGS = settings;
    return Promise.resolve(settings);
  }

  async saveSettings(settingsData) {
    if (!this.initialized) await this.init();
    const current = this.data.settings || this.defaultSettings();
    const updated = {
      ...current, ...settingsData,
      profitMargin:  parseFloat(settingsData.profitMargin  !== undefined ? settingsData.profitMargin  : current.profitMargin  || 25),
      lowStockLimit: parseFloat(settingsData.lowStockLimit !== undefined ? settingsData.lowStockLimit : current.lowStockLimit || 10),
      debtSurcharge: parseFloat(settingsData.debtSurcharge !== undefined ? settingsData.debtSurcharge : current.debtSurcharge || 0)
    };
    this.data.settings = updated;
    await this.saveToDevice('settings');
    window.storeSettings = updated; window.CURRENT_SETTINGS = updated;
    localStorage.setItem('cached_settings', JSON.stringify(updated));
    return Promise.resolve(updated);
  }

  // =========================================================================
  //  CLEANUP API
  // =========================================================================

  async cleanupOldTransactions(daysToKeep) {
    const days = typeof daysToKeep === 'number' ? daysToKeep : 1;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const savedTotals = JSON.parse(JSON.stringify(this.data.periodTotals));
    this.data.sales = this.data.sales.filter(s => new Date(s.date) > cutoff);
    this.data.periodTotals = savedTotals;
    await Promise.all([this.saveToDevice('sales'), this.saveToDevice('periodTotals')]);
    return Promise.resolve(true);
  }

  async cleanupCalendarHistory() {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    this.data.sales_history   = this.data.sales_history.filter(s => new Date(s.date)      > oneYearAgo);
    this.data.payment_history = this.data.payment_history.filter(p => new Date(p.date_paid) > oneYearAgo);
    await Promise.all([this.saveToDevice('sales_history'), this.saveToDevice('payment_history')]);
    return Promise.resolve(true);
  }

  async cleanupOldRecords() { return Promise.resolve(true); }

  async runAllCleanups() {
    await this.autoCleanupPaidDebtors();
    await this.cleanupOldTransactions(1);
    await this.cleanupCalendarHistory();
    return Promise.resolve(true);
  }

  scheduleAutoCleanup() { /* manual only */ }
}

// ═══════════════════════════════════════════════════════════════════════════
//  GLOBAL INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

const DB = new DeviceStorageManager();
window.DB = DB;

if (typeof module !== 'undefined' && module.exports) module.exports = DB;

console.log('✅ Device Storage module loaded');

document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();

  // Update badge based on storage mode
  const badge = document.querySelector('.offline-badge');
  if (badge) {
    if (DB.storageMode === 'opfs') {
      badge.textContent      = '✓ App Storage (No permissions needed)';
      badge.style.background = 'linear-gradient(135deg,#15803d,#166534)';
    } else if (DB.storageMode === 'device' && DB.dirHandle) {
      badge.textContent      = '✓ Device Storage: ' + DB.dirHandle.name;
      badge.style.background = 'linear-gradient(135deg,#15803d,#166534)';
    }
  }

  DB.scheduleAutoCleanup();
});