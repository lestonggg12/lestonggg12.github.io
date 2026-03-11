/**
 * database-offline.js — Pure localStorage-first database
 *
 * All operations use localStorage as the primary store.
 * No API calls — everything is offline-capable.
 *
 * DATA STRUCTURE:
 * - localStorage.jorams_sari_sari_categories        → Category[]
 * - localStorage.jorams_sari_sari_products          → Product[]
 * - localStorage.jorams_sari_sari_sales             → Sale[] (Volatile: 1 day)
 * - localStorage.jorams_sari_sari_debtors           → Debtor[] (Volatile: 7 days for paid)
 * - localStorage.jorams_sari_sari_sales_history     → Sale[] (Calendar: 1 year)
 * - localStorage.jorams_sari_sari_payment_history   → Payment[] (Calendar: 1 year)
 * - localStorage.jorams_sari_sari_periodTotals      → PeriodTotals object
 * - localStorage.jorams_sari_sari_accumulatedTotals → AccumulatedTotals object
 * - localStorage.jorams_sari_sari_settings          → Settings object
 */

const DB = (function () {
    'use strict';

    const version       = '1.0.0';
    const storagePrefix = 'jorams_sari_sari_';

    // =========================================================================
    //  DEFAULTS
    // =========================================================================

    const defaultCategories = [
        { id: 'beverages',           name: 'Beverages',                    icon: '🥤', color: 'linear-gradient(135deg,#e3b04b 0%,#d19a3d 100%)' },
        { id: 'school',              name: 'School Supplies',               icon: '📚', color: 'linear-gradient(135deg,#d48c2e 0%,#ba7a26 100%)' },
        { id: 'snacks',              name: 'Snacks',                        icon: '🍿', color: 'linear-gradient(135deg,#a44a3f 0%,#934635 100%)' },
        { id: 'foods',               name: 'Whole Foods',                   icon: '🍚', color: 'linear-gradient(135deg,#967751 0%,#92784f 100%)' },
        { id: 'bath',                name: 'Bath, Hygiene & Laundry Soaps', icon: '🧼', color: 'linear-gradient(135deg,#f3c291 0%,#e5b382 100%)' },
        { id: 'wholesale_beverages', name: 'Wholesale Beverages',           icon: '📦', color: 'linear-gradient(135deg,#cc8451 0%,#b87545 100%)' },
        { id: 'liquor',              name: 'Hard Liquors',                  icon: '🍺', color: 'linear-gradient(135deg,#e2e8b0 0%,#ced49d 100%)' },
    ];

    const defaultSettings = {
        profitMargin:  20,
        lowStockLimit: 5,
        theme:         'light',
        debtSurcharge: 0,
        changeHistory: []
    };

    // =========================================================================
    //  UTILITY — localStorage helpers
    // =========================================================================

    function save(key, value) {
        try {
            localStorage.setItem(storagePrefix + key, JSON.stringify(value));
        } catch (e) {
            console.error('DB save error:', key, e);
        }
    }

    function load(key, fallback) {
        try {
            const raw = localStorage.getItem(storagePrefix + key);
            return raw !== null ? JSON.parse(raw) : fallback;
        } catch (e) {
            console.error('DB load error:', key, e);
            return fallback;
        }
    }

    function getEmptyPeriodTotals() {
        const empty = { revenue: 0, profit: 0, sales_count: 0, has_data: false };
        return { today: { ...empty }, yesterday: { ...empty }, last_week: { ...empty }, last_month: { ...empty }, last_year: { ...empty } };
    }

    // =========================================================================
    //  INIT
    // =========================================================================

    async function init() {
        // Seed categories if empty
        if (!load('categories', null)) {
            save('categories', defaultCategories);
        }
        // Seed settings if empty
        if (!load('settings', null)) {
            save('settings', defaultSettings);
        }
        // Apply saved theme
        const settings = load('settings', defaultSettings);
        if (settings.theme === 'dark') {
            document.body.classList.add('dark-mode');
        }
        // Seed history (Robust Migration)
        const currentSales = load('sales', []);
        const salesHistory = load('sales_history', []);
        const newInHistory = currentSales.filter(s => !salesHistory.find(h => h.id === s.id));
        if (newInHistory.length > 0) {
            save('sales_history', [...salesHistory, ...newInHistory]);
            console.log(`✅ Migrated ${newInHistory.length} sales to sales_history`);
        }

        const currentDebtors = load('debtors', []);
        const paymentHistory = load('payment_history', []);
        const paidNotArchived = currentDebtors.filter(d => d.paid && !paymentHistory.find(h => h.id === d.id));
        if (paidNotArchived.length > 0) {
            const newPayments = paidNotArchived.map(d => ({
                id:                d.id,
                customer_name:     d.name || 'Unknown',
                total_amount:      parseFloat(d.total_debt || 0),
                original_total:    parseFloat(d.original_total || 0),
                surcharge_percent: parseFloat(d.surcharge_percent || 0),
                surcharge_amount:  parseFloat(d.surcharge_amount || 0),
                date_borrowed:     d.date || d.date_borrowed || '',
                date_paid:         d.date_paid || new Date().toISOString(),
                items:             d.items || []
            }));
            save('payment_history', [...paymentHistory, ...newPayments]);
            console.log(`✅ Migrated ${paidNotArchived.length} paid debtors to payment_history`);
        }

        console.log('✅ DB.init() complete');
        scheduleAutoCleanup();
    }

    // =========================================================================
    //  MIDNIGHT REFRESH SUPPORT
    // =========================================================================

    function setupMidnightRefresh() {
        const now       = new Date();
        const tomorrow  = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow.getTime() - now.getTime();
        setTimeout(() => {
            updatePeriodTotals();
            if (typeof renderProfit === 'function') renderProfit();
            setupMidnightRefresh();
        }, msUntilMidnight);
    }

    // =========================================================================
    //  CATEGORIES API
    // =========================================================================

    async function getCategories() {
        return Promise.resolve(load('categories', defaultCategories));
    }

    async function addCategory(categoryData) {
        const categories = load('categories', defaultCategories);
        const newCat = {
            id: categoryData.id || Date.now().toString(),
            ...categoryData,
            created_at: new Date().toISOString()
        };
        categories.push(newCat);
        save('categories', categories);
        return Promise.resolve(newCat);
    }

    async function updateCategory(categoryId, updates) {
        const categories = load('categories', defaultCategories);
        const idx = categories.findIndex(c => c.id === categoryId);
        if (idx >= 0) {
            categories[idx] = { ...categories[idx], ...updates, updated_at: new Date().toISOString() };
            save('categories', categories);
            return Promise.resolve(categories[idx]);
        }
        throw new Error(`Category ${categoryId} not found`);
    }

    async function deleteCategory(categoryId, reassignToId = null, deleteProducts = false) {
        const categories = load('categories', defaultCategories);
        const filtered = categories.filter(c => c.id !== categoryId);
        save('categories', filtered);
        
        let products = load('products', []);
        if (deleteProducts) {
            products = products.filter(p => (p.category !== categoryId && p.category_id !== categoryId));
            save('products', products);
        } else if (reassignToId) {
            products = products.map(p => {
                if (p.category === categoryId || p.category_id === categoryId) {
                    return { ...p, category: reassignToId, category_id: reassignToId };
                }
                return p;
            });
            save('products', products);
        }
        return Promise.resolve(true);
    }

    // =========================================================================
    //  PRODUCTS API
    // =========================================================================

    async function getProducts() {
        return Promise.resolve(load('products', []));
    }

    async function addProduct(productData) {
        const products = load('products', []);
        const newProduct = {
            id: Date.now().toString(),
            ...productData,
            quantity: parseFloat(productData.quantity || 0),
            cost:     parseFloat(productData.cost     || 0),
            price:    parseFloat(productData.price    || 0),
            created_at: new Date().toISOString()
        };
        products.push(newProduct);
        save('products', products);
        return Promise.resolve(newProduct);
    }

    async function updateProduct(productId, updates) {
        const products = load('products', []);
        const idx = products.findIndex(p => p.id === productId);
        if (idx >= 0) {
            products[idx] = {
                ...products[idx],
                ...updates,
                quantity:   updates.quantity !== undefined ? parseFloat(updates.quantity) : products[idx].quantity,
                cost:       updates.cost     !== undefined ? parseFloat(updates.cost)     : products[idx].cost,
                price:      updates.price    !== undefined ? parseFloat(updates.price)    : products[idx].price,
                updated_at: new Date().toISOString()
            };
            save('products', products);
            return Promise.resolve(products[idx]);
        }
        throw new Error(`Product ${productId} not found`);
    }

    async function deleteProduct(productId) {
        const products = load('products', []);
        save('products', products.filter(p => p.id !== productId));
        return Promise.resolve(true);
    }

    // =========================================================================
    //  SALES API
    // =========================================================================

    async function getSales() {
        return Promise.resolve(load('sales', []));
    }

    async function addSale(saleData) {
        const sales = load('sales', []);
        const newSale = {
            id:     Date.now().toString(),
            date:   new Date().toISOString(),
            ...saleData,
            total:  parseFloat(saleData.total  || 0),
            profit: parseFloat(saleData.profit || 0),
            items:  Array.isArray(saleData.items) ? saleData.items : []
        };
        sales.push(newSale);
        save('sales', sales);

        // ✅ KEY: Save to permanent history for the Calendar
        const history = load('sales_history', []);
        history.push(JSON.parse(JSON.stringify(newSale)));
        save('sales_history', history);

        updatePeriodTotals();
        return Promise.resolve(newSale);
    }

    async function saveSales(salesData) {
        save('sales', salesData);
        updatePeriodTotals();
        return Promise.resolve(true);
    }

    async function clearAllSales() {
        save('sales', []);
        save('periodTotals', getEmptyPeriodTotals());
        return Promise.resolve(true);
    }

    // =========================================================================
    //  PERIOD TOTALS API
    // =========================================================================

    function calculatePeriodTotals() {
        const sales   = load('sales', []);
        const now     = new Date();
        const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // ── Last Week: previous completed week (Sunday → Saturday) ──
        // Find this week's Sunday (start of current week)
        const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
        const thisWeekSunday = new Date(today);
        thisWeekSunday.setDate(today.getDate() - dayOfWeek);
        // Previous week: last Sunday → this Sunday (exclusive)
        const lastWeekSunday = new Date(thisWeekSunday);
        lastWeekSunday.setDate(thisWeekSunday.getDate() - 7);

        // ── Last Month: previous completed calendar month ──
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd   = new Date(today.getFullYear(), today.getMonth(), 1);

        // ── Last Year: previous completed calendar year ──
        const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
        const lastYearEnd   = new Date(today.getFullYear(), 0, 1);

        function filterSalesByDate(start, end) {
            return sales.filter(s => {
                const d = new Date(s.date);
                return d >= start && d < end;
            });
        }

        function calculateStats(list, periodStart, periodEnd) {
            return {
                revenue:      list.reduce((sum, s) => sum + parseFloat(s.total  || 0), 0),
                profit:       list.reduce((sum, s) => sum + parseFloat(s.profit || 0), 0),
                sales_count:  list.length,
                has_data:     list.length > 0,
                period_start: periodStart ? periodStart.toISOString() : undefined,
                period_end:   periodEnd   ? periodEnd.toISOString()   : undefined
            };
        }

        return {
            today:      calculateStats(filterSalesByDate(today,           tomorrow),         today,           tomorrow),
            yesterday:  calculateStats(filterSalesByDate(yesterday,       today),            yesterday,       today),
            last_week:  calculateStats(filterSalesByDate(lastWeekSunday,  thisWeekSunday),   lastWeekSunday,  thisWeekSunday),
            last_month: calculateStats(filterSalesByDate(lastMonthStart,  lastMonthEnd),     lastMonthStart,  lastMonthEnd),
            last_year:  calculateStats(filterSalesByDate(lastYearStart,   lastYearEnd),      lastYearStart,   lastYearEnd)
        };
    }

    async function getPeriodTotals() {
        return Promise.resolve(calculatePeriodTotals());
    }

    function updatePeriodTotals() {
        const totals = calculatePeriodTotals();
        save('periodTotals', totals);
        return totals;
    }

    async function updatePeriods() {
        return Promise.resolve(updatePeriodTotals());
    }

    // =========================================================================
    //  HISTORY HELPERS
    // =========================================================================

    function archivePayment(debtor) {
        if (!debtor.paid) return;
        const history = load('payment_history', []);
        const entry = {
            id:                debtor.id,
            customer_name:     debtor.name || 'Unknown',
            total_amount:      parseFloat(debtor.total_debt || 0),
            original_total:    parseFloat(debtor.original_total || 0),
            surcharge_percent: parseFloat(debtor.surcharge_percent || 0),
            surcharge_amount:  parseFloat(debtor.surcharge_amount || 0),
            date_borrowed:     debtor.date || debtor.date_borrowed || '',
            date_paid:         debtor.date_paid || new Date().toISOString(),
            items:             debtor.items || []
        };
        // Avoid duplicates if multiple updates happen
        if (!history.find(h => h.id === entry.id)) {
            history.push(entry);
            save('payment_history', history);
        }
    }

    // =========================================================================
    //  CALENDAR API
    // =========================================================================

    async function getCalendarData(year, month) {
        const sales   = load('sales_history',   []);
        const payments = load('payment_history', []);
        const calendarData = {};
        const paidDebtDates = new Set();
        const monthIndex = month - 1; 

        sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            if (saleDate.getFullYear() === year && saleDate.getMonth() === monthIndex) {
                const dateStr = saleDate.toISOString().split('T')[0];
                if (!calendarData[dateStr]) {
                    calendarData[dateStr] = { revenue: 0, profit: 0, sales: [], payments: [] };
                }
                calendarData[dateStr].revenue += parseFloat(sale.total  || 0);
                calendarData[dateStr].profit  += parseFloat(sale.profit || 0);
                calendarData[dateStr].sales.push(sale);
            }
        });

        payments.forEach(p => {
            const paidDate = new Date(p.date_paid);
            if (paidDate.getFullYear() === year && paidDate.getMonth() === monthIndex) {
                const dateStr = paidDate.toISOString().split('T')[0];
                if (!calendarData[dateStr]) {
                    calendarData[dateStr] = { revenue: 0, profit: 0, sales: [], payments: [] };
                }
                calendarData[dateStr].payments.push(p);
                paidDebtDates.add(dateStr);
            }
        });

        const summaryArray = Object.entries(calendarData).map(([date, data]) => ({
            date,
            total_revenue:     data.revenue,
            total_profit:      data.profit,
            transaction_count: data.sales.length,
            payment_count:     data.payments.length
        }));

        return Promise.resolve({
            summaries:       summaryArray,
            paid_debt_dates: Array.from(paidDebtDates)
        });
    }

    async function getDateDetails(dateStr) {
        const sales    = load('sales_history',   []);
        const payments = load('payment_history', []);
        const dateSales    = sales.filter(s => s.date.split('T')[0] === dateStr);
        const datePayments = payments.filter(p => p.date_paid.split('T')[0] === dateStr);

        const totalRevenue = dateSales.reduce((sum, s) => sum + parseFloat(s.total  || 0), 0);
        const totalProfit  = dateSales.reduce((sum, s) => sum + parseFloat(s.profit || 0), 0);

        // ── Compute products sold list (aggregate by product name) ──
        const productMap = {};
        dateSales.forEach(sale => {
            const items = Array.isArray(sale.items) ? sale.items : [];
            items.forEach(item => {
                const name = item.product_name || item.name || 'Unknown';
                const qty  = parseFloat(item.quantity || 0);
                const cost = parseFloat(item.cost || item.cost_price || 0);
                const price = parseFloat(item.price || item.selling_price || 0);
                const itemProfit = (price - cost) * qty;
                if (!productMap[name]) {
                    productMap[name] = { name, quantity: 0, profit: 0 };
                }
                productMap[name].quantity += qty;
                productMap[name].profit   += itemProfit;
            });
        });
        const productsSoldList = Object.values(productMap)
            .sort((a, b) => b.quantity - a.quantity);

        // ── Best sellers ──
        const bestByQty    = productsSoldList.length > 0 ? productsSoldList[0] : null;
        const bestByProfit = productsSoldList.length > 0
            ? [...productsSoldList].sort((a, b) => b.profit - a.profit)[0]
            : null;

        // ── Paid debtors (format for calendar modal) ──
        const debtsPaid = datePayments.map(d => ({
            id:                d.id,
            customer_name:     d.customer_name || d.name || 'Unknown',
            total_amount:      parseFloat(d.total_debt || 0),
            original_total:    parseFloat(d.original_total || 0),
            surcharge_percent: parseFloat(d.surcharge_percent || 0),
            surcharge_amount:  parseFloat(d.surcharge_amount || 0),
            date_borrowed:     d.date || d.date_borrowed || '',
            items:             Array.isArray(d.items) ? d.items : []
        }));

        return Promise.resolve({
            date:                       dateStr,
            sales:                      dateSales,
            payments:                   datePayments,
            total_revenue:              totalRevenue,
            total_profit:               totalProfit,
            transaction_count:          dateSales.length,
            best_seller_by_quantity:    bestByQty ? bestByQty.name : 'N/A',
            best_seller_quantity:       bestByQty ? bestByQty.quantity : 0,
            best_seller_by_profit:      bestByProfit ? bestByProfit.name : 'N/A',
            best_seller_profit:         bestByProfit ? bestByProfit.profit : 0,
            products_sold_list:         productsSoldList,
            debts_paid:                 debtsPaid
        });
    }

    // =========================================================================
    //  DEBTORS API
    // =========================================================================

    async function getDebtors() {
        return Promise.resolve(load('debtors', []));
    }

    async function addDebtor(debtorData) {
        const debtors = load('debtors', []);
        
        // Find existing unpaid debtor with the same name
        const existingIdx = debtors.findIndex(d => 
            !d.paid && (d.name || '').toLowerCase() === (debtorData.name || '').toLowerCase()
        );

        if (existingIdx >= 0) {
            const existing = debtors[existingIdx];
            // Merge logic
            const mergedDebtor = {
                ...existing,
                items:             [...(existing.items || []), ...(debtorData.items || [])],
                original_total:    parseFloat((parseFloat(existing.original_total || 0) + parseFloat(debtorData.original_total || 0)).toFixed(2)),
                surcharge_amount:  parseFloat((parseFloat(existing.surcharge_amount || 0) + parseFloat(debtorData.surcharge_amount || 0)).toFixed(2)),
                total_debt:        parseFloat((parseFloat(existing.total_debt || 0) + parseFloat(debtorData.total_debt || 0)).toFixed(2)),
                updated_at:        new Date().toISOString()
            };
            debtors[existingIdx] = mergedDebtor;
            save('debtors', debtors);
            console.log(`✅ Merged debt for: ${debtorData.name}`);
            return Promise.resolve({ debtor: mergedDebtor, merged: true });
        }

        const newDebtor = {
            id: Date.now().toString(),
            ...debtorData,
            date:             new Date().toISOString(),
            total_debt:       parseFloat(debtorData.total_debt    || debtorData.original_total || 0),
            original_total:   parseFloat(debtorData.original_total || debtorData.total_debt    || 0),
            surcharge_percent: parseFloat(debtorData.surcharge_percent || 0),
            surcharge_amount:  parseFloat(debtorData.surcharge_amount  || 0),
            paid:  false,
            items: Array.isArray(debtorData.items) ? debtorData.items : []
        };
        debtors.push(newDebtor);
        save('debtors', debtors);
        return Promise.resolve({ debtor: newDebtor, merged: false });
    }

    async function updateDebtor(debtorId, updates) {
        const debtors = load('debtors', []);
        const idx = debtors.findIndex(d => d.id === debtorId);
        if (idx >= 0) {
            debtors[idx] = {
                ...debtors[idx],
                ...updates,
                total_debt:       updates.total_debt       !== undefined ? parseFloat(updates.total_debt)       : debtors[idx].total_debt,
                surcharge_amount: updates.surcharge_amount !== undefined ? parseFloat(updates.surcharge_amount) : debtors[idx].surcharge_amount
            };
            
            // ✅ KEY: Archive if marked as paid
            if (updates.paid || (debtors[idx].paid && !updates.hasOwnProperty('paid'))) {
                archivePayment(debtors[idx]);
            }

            save('debtors', debtors);
            return Promise.resolve(debtors[idx]);
        }
        throw new Error(`Debtor ${debtorId} not found`);
    }

    async function deleteDebtor(debtorId) {
        const debtors = load('debtors', []);
        save('debtors', debtors.filter(d => d.id !== debtorId));
        return Promise.resolve(true);
    }

    async function clearPaidDebtors() {
        const debtors = load('debtors', []);
        save('debtors', debtors.filter(d => !d.paid));
        return Promise.resolve(true);
    }

    async function autoCleanupPaidDebtors() {
        const debtors      = load('debtors', []);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        save('debtors', debtors.filter(d => {
            if (!d.paid || !d.date_paid) return true;
            return new Date(d.date_paid) > sevenDaysAgo;
        }));
        return Promise.resolve(true);
    }

    // =========================================================================
    //  ACCUMULATED TOTALS API
    // =========================================================================

    async function getAccumulatedTotals() {
        return Promise.resolve(load('accumulatedTotals', { revenue: 0, profit: 0, lastCleared: new Date().toISOString() }));
    }

    async function updateAccumulatedTotals(updates) {
        const current = load('accumulatedTotals', { revenue: 0, profit: 0 });
        const updated = {
            ...current,
            ...updates,
            revenue: parseFloat(updates.revenue !== undefined ? updates.revenue : current.revenue),
            profit:  parseFloat(updates.profit  !== undefined ? updates.profit  : current.profit)
        };
        save('accumulatedTotals', updated);
        return Promise.resolve(updated);
    }

    // =========================================================================
    //  SETTINGS API
    // =========================================================================

    async function getSettings() {
        const settings = load('settings', defaultSettings);
        window.storeSettings    = settings;
        window.CURRENT_SETTINGS = settings;
        return Promise.resolve(settings);
    }

    async function saveSettings(settingsData) {
        const current = load('settings', defaultSettings);
        const updated = {
            ...current,
            ...settingsData,
            profitMargin:  parseFloat(settingsData.profitMargin  !== undefined ? settingsData.profitMargin  : current.profitMargin  || 25),
            lowStockLimit: parseFloat(settingsData.lowStockLimit !== undefined ? settingsData.lowStockLimit : current.lowStockLimit || 10),
            debtSurcharge: parseFloat(settingsData.debtSurcharge !== undefined ? settingsData.debtSurcharge : current.debtSurcharge || 0)
        };
        save('settings', updated);
        window.storeSettings    = updated;
        window.CURRENT_SETTINGS = updated;
        // Also keep cached_settings in sync (used by notifications.js)
        localStorage.setItem('cached_settings', JSON.stringify(updated));
        return Promise.resolve(updated);
    }

    // =========================================================================
    //  CLEANUP API
    // =========================================================================

    async function cleanupOldTransactions(daysToKeep) {
        const days      = typeof daysToKeep === 'number' ? daysToKeep : 1;
        const sales     = load('sales', []);
        const cutoff    = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        save('sales', sales.filter(s => new Date(s.date) > cutoff));
        updatePeriodTotals();
        return Promise.resolve(true);
    }

    async function cleanupCalendarHistory() {
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        
        const sHistory = load('sales_history', []);
        save('sales_history', sHistory.filter(s => new Date(s.date) > oneYearAgo));

        const pHistory = load('payment_history', []);
        save('payment_history', pHistory.filter(p => new Date(p.date_paid) > oneYearAgo));
        
        return Promise.resolve(true);
    }

    async function cleanupOldRecords() {
        return Promise.resolve(true);
    }

    async function runAllCleanups() {
        await autoCleanupPaidDebtors();
        await cleanupOldTransactions(1);
        await cleanupCalendarHistory();
        return Promise.resolve(true);
    }

    function scheduleAutoCleanup() {
        setInterval(runAllCleanups, 24 * 60 * 60 * 1000);
    }

    // =========================================================================
    //  PUBLIC API
    // =========================================================================

    return {
        version,
        init,
        // Categories
        getCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        // Products
        getProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        // Sales
        getSales,
        addSale,
        saveSales,
        clearAllSales,
        // Period totals
        getPeriodTotals,
        updatePeriods,
        // Calendar
        getCalendarData,
        getDateDetails,
        // Debtors
        getDebtors,
        addDebtor,
        updateDebtor,
        deleteDebtor,
        clearPaidDebtors,
        autoCleanupPaidDebtors,
        // Accumulated totals
        getAccumulatedTotals,
        updateAccumulatedTotals,
        // Settings
        getSettings,
        saveSettings,
        // Cleanup
        cleanupOldTransactions,
        cleanupOldRecords,
        runAllCleanups,
        scheduleAutoCleanup
    };

})();

console.log('✅ Offline database module loaded (v' + DB.version + ')');