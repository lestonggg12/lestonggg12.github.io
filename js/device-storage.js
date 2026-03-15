/**
 * device-storage.js — File System Access API Storage Layer
 */

class DeviceStorageManager {
  constructor() {
    this.dirHandle = null;
    this.fileHandles = {};
    this.data = {
      categories: [],
      products: [],
      sales: [],
      sales_history: [],
      debtors: [],
      payment_history: [],
      settings: {},
      periodTotals: {},
      accumulatedTotals: {}
    };
    this.isSupported = 'showDirectoryPicker' in window;
    this.dbName = 'DeviceStorageHandles';
    this.storeName = 'fileHandles';
    this.initialized = false;
    this._savedHandle = null;
    this._initPromise = null; 
    this.initIndexedDB();

    if (!this.isSupported) {
      console.warn('⚠️ File System Access API not supported. Using localStorage fallback.');
    } else {
      console.log('✅ Device Storage API supported. Will use device file system.');
    }
  }

  // =========================================================================
  //  IndexedDB FOR PERSISTENT FILE HANDLES
  // =========================================================================

  async initIndexedDB() {
    if (!this.isSupported) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
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
      const db = await this.initIndexedDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.put({ id: 'jorams-data-dir', handle: dirHandle, savedAt: new Date().toISOString() });
      console.log('💾 Directory handle saved to IndexedDB');
    } catch (err) {
      console.error('Failed to save handle to IDB:', err);
    }
  }

  async getHandleFromIDB() {
    if (!this.isSupported) return null;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const query = store.get('jorams-data-dir');
        query.onsuccess = () => resolve(query.result?.handle || null);
        query.onerror = () => reject(query.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // =========================================================================
  //  INITIALIZATION
  // =========================================================================

  async init() {
  // Prevent multiple simultaneous init calls
  if (this._initPromise) return this._initPromise;
  if (this.initialized) return true;

  this._initPromise = this._doInit();
  const result = await this._initPromise;
  this._initPromise = null;
  return result;
}

async _doInit() {
    if (!this.isSupported) {
        console.warn('⚠️ Using localStorage fallback');
        return this.loadFromLocalStorage();
    }

    try {
        const dirHandle = await this.getHandleFromIDB();

        if (!dirHandle) {
            console.log('📦 No saved directory — using localStorage fallback');
            return this.loadFromLocalStorage();
        }

        this._savedHandle = dirHandle;
        const permission = await dirHandle.queryPermission({ mode: 'readwrite' });

        if (permission === 'granted') {
            // Already have permission — load immediately
            this.dirHandle = dirHandle;
            await this.loadAllFromDevice();
            this.initialized = true;
            console.log('✅ Device Storage initialized');
            return true;
        } else {
            // Permission needs re-grant — load from localStorage first
            // then silently reconnect on first user gesture
            await this.loadFromLocalStorage();
            this._scheduleAutoReconnect(dirHandle);
            return true;
        }

    } catch (err) {
        console.error('Device storage init error:', err);
        return this.loadFromLocalStorage();
    }
}

_scheduleAutoReconnect(dirHandle) {
    // Silently reconnect on the very first user interaction
    // No banner, no prompt — completely invisible to the user
    const events = ['click', 'touchstart', 'keydown', 'pointerdown'];
    
    const reconnect = async (e) => {
        // Remove all listeners immediately so this only fires once
        events.forEach(evt => document.removeEventListener(evt, reconnect, true));
        
        try {
            const permission = await dirHandle.requestPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
                this.dirHandle = dirHandle;
                this._savedHandle = dirHandle;
                await this.loadAllFromDevice();
                this.initialized = true;
                console.log('✅ Device Storage silently reconnected on first gesture');
                
                // Update the badge silently
                const badge = document.querySelector('.offline-badge');
                if (badge) {
                    badge.textContent = '✓ Device Storage: ' + dirHandle.name;
                    badge.style.background = 'linear-gradient(135deg,#15803d,#166534)';
                }

                // Refresh whichever page is currently visible
                const activePage = document.querySelector('.page.active-page');
                if (activePage) {
                    const pageId = activePage.id;
                    if (pageId === 'profitPage'    && typeof renderProfit    === 'function') await renderProfit();
                    if (pageId === 'inventoryPage' && typeof window.renderInventory === 'function') await window.renderInventory();
                    if (pageId === 'pricePage'     && typeof window.renderPriceList === 'function') await window.renderPriceList();
                    if (pageId === 'debtPage'      && typeof window.renderDebtors   === 'function') await window.renderDebtors();
                    if (pageId === 'calendarPage'  && typeof renderCalendar  === 'function') await renderCalendar();
                    if (pageId === 'settingsPage'  && typeof window.renderSettings  === 'function') await window.renderSettings();
                }
            } else {
                console.warn('⚠️ Permission denied on reconnect attempt');
            }
        } catch (err) {
            if (err.name !== 'AbortError') console.error('Silent reconnect error:', err);
        }
    };

    // Use capture phase so it fires before anything else handles the event
    events.forEach(evt => document.addEventListener(evt, reconnect, true));
    console.log('⏳ Waiting for first user gesture to silently reconnect device storage...');
}

  // =========================================================================
  //  RECONNECT — call from a button tap (user gesture required)
  //  Uses the saved handle, so user does NOT see a folder picker again.
  // =========================================================================

  async reconnectDirectory() {
    if (!this.isSupported) return false;

    try {
      const dirHandle = this._savedHandle || await this.getHandleFromIDB();
      if (!dirHandle) return false;

      // requestPermission shows a small browser permission prompt (not a folder picker)
      const permission = await dirHandle.requestPermission({ mode: 'readwrite' });
      if (permission !== 'granted') return false;

      this.dirHandle = dirHandle;
      await this.loadAllFromDevice();
      this.initialized = true;
      console.log('✅ Device Storage reconnected');
      return true;

    } catch (err) {
      if (err.name !== 'AbortError') console.error('Reconnect error:', err);
      return false;
    }
  }

  // =========================================================================
  //  FIRST-TIME FOLDER SELECTION — call from a button tap only
  // =========================================================================

  async requestDirectoryAccess() {
    if (!this.isSupported) return false;

    try {
      const dirHandle = await window.showDirectoryPicker({
        id: 'jorams-data-folder',
        mode: 'readwrite',
        startIn: 'documents'
      });

      await this.saveHandleToIDB(dirHandle);
      this._savedHandle = dirHandle;
      this.dirHandle = dirHandle;

      // Migrate localStorage data to device files (first time only)
      const existingProducts = await this.readFile('products.json');
      if (!existingProducts || existingProducts.length === 0) {
        console.log('🔄 Migrating localStorage data to device...');
        this.loadFromLocalStorage();
        await this.saveAllToDevice();
        console.log('✅ Migration complete');
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
  //  FILE I/O OPERATIONS
  // =========================================================================

  async getFileHandle(filename, create = true) {
    try {
      return await this.dirHandle.getFileHandle(filename, { create });
    } catch (err) {
      console.error(`Error getting file handle for ${filename}:`, err);
      return null;
    }
  }

  async readFile(filename) {
    try {
      const fileHandle = await this.getFileHandle(filename, false);
      if (!fileHandle) return null;
      const file = await fileHandle.getFile();
      const content = await file.text();
      return JSON.parse(content);
    } catch (err) {
      if (err.name !== 'NotFoundError') console.error(`Error reading ${filename}:`, err);
      return null;
    }
  }

  async writeFile(filename, data) {
    try {
      const fileHandle = await this.getFileHandle(filename, true);
      if (!fileHandle) throw new Error('Could not get file handle');
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      return true;
    } catch (err) {
      console.error(`Error writing ${filename}:`, err);
      return false;
    }
  }

  // =========================================================================
  //  LOAD / SAVE ALL DATA
  // =========================================================================

  async loadAllFromDevice() {
    console.log('📂 Loading all data from device...');
    this.data.categories        = await this.readFile('categories.json') || [];
    this.data.products          = await this.readFile('products.json') || [];
    this.data.sales             = await this.readFile('sales.json') || [];
    this.data.sales_history     = await this.readFile('sales_history.json') || [];
    this.data.debtors           = await this.readFile('debtors.json') || [];
    this.data.payment_history   = await this.readFile('payment_history.json') || [];
    this.data.settings          = await this.readFile('settings.json') || this.defaultSettings();
    this.data.periodTotals      = await this.readFile('periodTotals.json') || this.getEmptyPeriodTotals();
    this.data.accumulatedTotals = await this.readFile('accumulatedTotals.json') || { revenue: 0, profit: 0 };
    console.log('✅ All data loaded from device');
  }

  async saveAllToDevice() {
    if (!this.isSupported || !this.dirHandle) return false;
    try {
      await Promise.all([
        this.writeFile('categories.json',       this.data.categories),
        this.writeFile('products.json',         this.data.products),
        this.writeFile('sales.json',            this.data.sales),
        this.writeFile('sales_history.json',    this.data.sales_history),
        this.writeFile('debtors.json',          this.data.debtors),
        this.writeFile('payment_history.json',  this.data.payment_history),
        this.writeFile('settings.json',         this.data.settings),
        this.writeFile('periodTotals.json',     this.data.periodTotals),
        this.writeFile('accumulatedTotals.json',this.data.accumulatedTotals)
      ]);
      return true;
    } catch (err) {
      console.error('Error saving to device:', err);
      return false;
    }
  }

  async saveToDevice(key) {
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

  // =========================================================================
  //  FALLBACK: localStorage
  // =========================================================================

  loadFromLocalStorage() {
    console.log('📦 Loading from localStorage (fallback)');
    const prefix = 'jorams_sari_sari_';
    const load = (key, fallback) => {
      try {
        const raw = localStorage.getItem(prefix + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) { return fallback; }
    };
    this.data.categories        = load('categories', []);
    this.data.products          = load('products', []);
    this.data.sales             = load('sales', []);
    this.data.sales_history     = load('sales_history', []);
    this.data.debtors           = load('debtors', []);
    this.data.payment_history   = load('payment_history', []);
    this.data.settings          = load('settings', this.defaultSettings());
    this.data.periodTotals      = load('periodTotals', this.getEmptyPeriodTotals());
    this.data.accumulatedTotals = load('accumulatedTotals', { revenue: 0, profit: 0 });
    this.initialized = true;
    return true;
  }

  saveToLocalStorage() {
    const prefix = 'jorams_sari_sari_';
    const save = (key, value) => {
      try { localStorage.setItem(prefix + key, JSON.stringify(value)); }
      catch (e) { console.error('localStorage save error:', key, e); }
    };
    save('categories', this.data.categories);
    save('products', this.data.products);
    save('sales', this.data.sales);
    save('sales_history', this.data.sales_history);
    save('debtors', this.data.debtors);
    save('payment_history', this.data.payment_history);
    save('settings', this.data.settings);
    save('periodTotals', this.data.periodTotals);
    save('accumulatedTotals', this.data.accumulatedTotals);
  }

  // =========================================================================
  //  DEFAULT VALUES
  // =========================================================================

  defaultSettings() {
    return { profitMargin: 20, lowStockLimit: 5, theme: 'light', debtSurcharge: 0, changeHistory: [] };
  }

  getEmptyPeriodTotals() {
    const empty = { revenue: 0, profit: 0, sales_count: 0, has_data: false };
    return {
      today: { ...empty }, yesterday: { ...empty }, last_week: { ...empty },
      last_month: { ...empty }, last_year: { ...empty }
    };
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
      this.data.products = this.data.products.map(p => {
        if (p.category === categoryId || p.category_id === categoryId) {
          return { ...p, category: reassignToId, category_id: reassignToId };
        }
        return p;
      });
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
      cost: parseFloat(productData.cost || 0),
      price: parseFloat(productData.price || 0),
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
        cost: updates.cost !== undefined ? parseFloat(updates.cost) : this.data.products[idx].cost,
        price: updates.price !== undefined ? parseFloat(updates.price) : this.data.products[idx].price,
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
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const dayOfWeek = today.getDay();
    const thisWeekSunday = new Date(today); thisWeekSunday.setDate(today.getDate() - dayOfWeek);
    const lastWeekSunday = new Date(thisWeekSunday); lastWeekSunday.setDate(thisWeekSunday.getDate() - 7);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(today.getFullYear(), 0, 1);

    const filterSalesByDate = (start, end) => sales.filter(s => { const d = new Date(s.date); return d >= start && d < end; });
    const calculateStats = (list) => ({
      revenue: list.reduce((sum, s) => sum + parseFloat(s.total || 0), 0),
      profit: list.reduce((sum, s) => sum + parseFloat(s.profit || 0), 0),
      sales_count: list.length, has_data: list.length > 0
    });

const stored = this.data.periodTotals || {};

    const freshToday     = calculateStats(filterSalesByDate(today,          tomorrow));
    const freshYesterday = calculateStats(filterSalesByDate(yesterday,      today));
    const freshWeek      = calculateStats(filterSalesByDate(lastWeekSunday, thisWeekSunday));
    const freshMonth     = calculateStats(filterSalesByDate(lastMonthStart, lastMonthEnd));
    const freshYear      = calculateStats(filterSalesByDate(lastYearStart,  lastYearEnd));

    this.data.periodTotals = {
      // Today & yesterday: always use fresh (these dates can't be calendar-cleared safely)
      today:      freshToday,
      yesterday:  freshYesterday,
      // Older periods: if fresh is empty but stored has real data, keep stored
      // This protects last_week/month/year from being wiped by calendar clears
      last_week:  freshWeek.has_data  ? freshWeek  : (stored.last_week?.has_data  ? stored.last_week  : freshWeek),
      last_month: freshMonth.has_data ? freshMonth : (stored.last_month?.has_data ? stored.last_month : freshMonth),
      last_year:  freshYear.has_data  ? freshYear  : (stored.last_year?.has_data  ? stored.last_year  : freshYear),
    };
    this.saveToDevice('periodTotals');
  }

  async getPeriodTotals() {
    if (!this.initialized) await this.init();
    if (this._skipRecalc) {
      this._skipRecalc = false;
      return Promise.resolve(this.data.periodTotals);
    }
    this.updatePeriodTotals();
    return Promise.resolve(this.data.periodTotals);
  }

  async updatePeriods() { return Promise.resolve(this.updatePeriodTotals()); }

  // =========================================================================
  //  CALENDAR API
  // =========================================================================

  async getCalendarData(year, month) {
    if (!this.initialized) await this.init();
    const sales = this.data.sales_history;
    const payments = this.data.payment_history;
    const calendarData = {};
    const paidDebtDates = new Set();
    const monthIndex = month - 1;

    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      if (saleDate.getFullYear() === year && saleDate.getMonth() === monthIndex) {
        const dateStr = saleDate.toISOString().split('T')[0];
        if (!calendarData[dateStr]) calendarData[dateStr] = { revenue: 0, profit: 0, sales: [], payments: [] };
        calendarData[dateStr].revenue += parseFloat(sale.total || 0);
        calendarData[dateStr].profit += parseFloat(sale.profit || 0);
        calendarData[dateStr].sales.push(sale);
      }
    });

    payments.forEach(p => {
      const paidDate = new Date(p.date_paid);
      if (paidDate.getFullYear() === year && paidDate.getMonth() === monthIndex) {
        const dateStr = paidDate.toISOString().split('T')[0];
        if (!calendarData[dateStr]) calendarData[dateStr] = { revenue: 0, profit: 0, sales: [], payments: [] };
        calendarData[dateStr].payments.push(p);
        paidDebtDates.add(dateStr);
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
    const sales = this.data.sales_history;
    const payments = this.data.payment_history;
    const dateSales = sales.filter(s => s.date.split('T')[0] === dateStr);
    const datePayments = payments.filter(p => p.date_paid.split('T')[0] === dateStr);
    const totalRevenue = dateSales.reduce((sum, s) => sum + parseFloat(s.total || 0), 0);
    const totalProfit = dateSales.reduce((sum, s) => sum + parseFloat(s.profit || 0), 0);

    const productMap = {};
    dateSales.forEach(sale => {
      (Array.isArray(sale.items) ? sale.items : []).forEach(item => {
        const name = item.product_name || item.name || 'Unknown';
        const qty = parseFloat(item.quantity || 0);
        const cost = parseFloat(item.cost || item.cost_price || 0);
        const price = parseFloat(item.price || item.selling_price || 0);
        if (!productMap[name]) productMap[name] = { name, quantity: 0, profit: 0 };
        productMap[name].quantity += qty;
        productMap[name].profit += (price - cost) * qty;
      });
    });

    const productsSoldList = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);
    const bestByQty = productsSoldList[0] || null;
    const bestByProfit = productsSoldList.length > 0 ? [...productsSoldList].sort((a, b) => b.profit - a.profit)[0] : null;

    const debtsPaid = datePayments.map(d => ({
      id: d.id, customer_name: d.customer_name || d.name || 'Unknown',
      total_amount: parseFloat(d.total_amount || 0), original_total: parseFloat(d.original_total || 0),
      surcharge_percent: parseFloat(d.surcharge_percent || 0), surcharge_amount: parseFloat(d.surcharge_amount || 0),
      date_borrowed: d.date || d.date_borrowed || '', items: Array.isArray(d.items) ? d.items : []
    }));

    return Promise.resolve({
      date: dateStr, sales: dateSales, payments: datePayments,
      total_revenue: totalRevenue, total_profit: totalProfit, transaction_count: dateSales.length,
      best_seller_by_quantity: bestByQty ? bestByQty.name : 'N/A', best_seller_quantity: bestByQty ? bestByQty.quantity : 0,
      best_seller_by_profit: bestByProfit ? bestByProfit.name : 'N/A', best_seller_profit: bestByProfit ? bestByProfit.profit : 0,
      products_sold_list: productsSoldList, debts_paid: debtsPaid
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
      const existing = this.data.debtors[existingIdx];
      const mergedDebtor = {
        ...existing, items: [...(existing.items || []), ...(debtorData.items || [])],
        original_total: parseFloat((parseFloat(existing.original_total || 0) + parseFloat(debtorData.original_total || 0)).toFixed(2)),
        surcharge_amount: parseFloat((parseFloat(existing.surcharge_amount || 0) + parseFloat(debtorData.surcharge_amount || 0)).toFixed(2)),
        total_debt: parseFloat((parseFloat(existing.total_debt || 0) + parseFloat(debtorData.total_debt || 0)).toFixed(2)),
        updated_at: new Date().toISOString()
      };
      this.data.debtors[existingIdx] = mergedDebtor;
      await this.saveToDevice('debtors');
      return Promise.resolve({ debtor: mergedDebtor, merged: true });
    }
    const newDebtor = {
      id: Date.now().toString(), ...debtorData, date: new Date().toISOString(),
      total_debt: parseFloat(debtorData.total_debt || debtorData.original_total || 0),
      original_total: parseFloat(debtorData.original_total || debtorData.total_debt || 0),
      surcharge_percent: parseFloat(debtorData.surcharge_percent || 0),
      surcharge_amount: parseFloat(debtorData.surcharge_amount || 0),
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
        total_debt: updates.total_debt !== undefined ? parseFloat(updates.total_debt) : this.data.debtors[idx].total_debt,
        surcharge_amount: updates.surcharge_amount !== undefined ? parseFloat(updates.surcharge_amount) : this.data.debtors[idx].surcharge_amount
      };
      if (updates.paid || (this.data.debtors[idx].paid && !updates.hasOwnProperty('paid'))) {
        this.archivePayment(this.data.debtors[idx]);
      }
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
    if (!this.isSupported || !this.dirHandle) return Promise.resolve(true);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.data.debtors = this.data.debtors.filter(d => {
      if (!d.paid || !d.date_paid) return true;
      return new Date(d.date_paid) > sevenDaysAgo;
    });
    await this.saveToDevice('debtors');
    return Promise.resolve(true);
  }

  async cleanupPaymentHistory() {
    if (!this.isSupported || !this.dirHandle) return Promise.resolve(true);
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
      profit: parseFloat(updates.profit !== undefined ? updates.profit : current.profit)
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
    window.storeSettings = settings;
    window.CURRENT_SETTINGS = settings;
    return Promise.resolve(settings);
  }

  async saveSettings(settingsData) {
    if (!this.initialized) await this.init();
    const current = this.data.settings || this.defaultSettings();
    const updated = {
      ...current, ...settingsData,
      profitMargin: parseFloat(settingsData.profitMargin !== undefined ? settingsData.profitMargin : current.profitMargin || 25),
      lowStockLimit: parseFloat(settingsData.lowStockLimit !== undefined ? settingsData.lowStockLimit : current.lowStockLimit || 10),
      debtSurcharge: parseFloat(settingsData.debtSurcharge !== undefined ? settingsData.debtSurcharge : current.debtSurcharge || 0)
    };
    this.data.settings = updated;
    await this.saveToDevice('settings');
    window.storeSettings = updated;
    window.CURRENT_SETTINGS = updated;
    localStorage.setItem('cached_settings', JSON.stringify(updated));
    return Promise.resolve(updated);
  }

  // =========================================================================
  //  CLEANUP API
  // =========================================================================

 async cleanupOldTransactions(daysToKeep) {
    if (!this.isSupported || !this.dirHandle) return Promise.resolve(true);
    const days = typeof daysToKeep === 'number' ? daysToKeep : 1;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // ✅ Snapshot ALL period totals before touching sales
    const savedTotals = JSON.parse(JSON.stringify(this.data.periodTotals));

    // Delete old transactions (for performance/storage only)
    this.data.sales = this.data.sales.filter(s => new Date(s.date) > cutoff);

    // ✅ Restore ALL period totals exactly as they were — nothing changes
    this.data.periodTotals = savedTotals;

    await Promise.all([
      this.saveToDevice('sales'),
      this.saveToDevice('periodTotals')
    ]);
    return Promise.resolve(true);
  }

  async cleanupCalendarHistory() {
    if (!this.isSupported || !this.dirHandle) return Promise.resolve(true);
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    this.data.sales_history = this.data.sales_history.filter(s => new Date(s.date) > oneYearAgo);
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

   scheduleAutoCleanup() {
    // Auto-cleanup disabled — all deletion is manual only
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  GLOBAL INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

const DB = new DeviceStorageManager();
window.DB = DB;

if (typeof module !== 'undefined' && module.exports) module.exports = DB;

console.log('✅ Device Storage module loaded');
console.log(`📁 Storage: ${DB.isSupported ? '✅ File System API' : '⚠️ localStorage (fallback)'}`);

document.addEventListener('DOMContentLoaded', async () => {
  await DB.init();
  DB.scheduleAutoCleanup();
});