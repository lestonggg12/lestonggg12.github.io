/**
 * file-system.js — File System Access API wrapper
 * 
 * FEATURES:
 *  - Request file/directory access from user (with permission dialog)
 *  - Read files (JSON, CSV, TXT)
 *  - Write files with user-granted permissions
 *  - Store file handles in IndexedDB for persistent access (no re-asking)
 *  - Export app data (settings, inventory, sales, debtors)
 *  - Import data from user's device
 *  - Handle errors gracefully for unsupported browsers
 * 
 * DEPENDENCIES:
 *  - database.js (window.DB for app state)
 *  - IndexedDB (for persisting file handles)
 * 
 * BROWSER SUPPORT:
 *  - Chrome 86+, Edge 86+
 *  - Firefox 111+ (limited)
 *  - Safari (experimental in 16.1+)
 *  - Not supported: older browsers → fallback to JSON blob download
 */

class FileSystemManager {
  constructor() {
    this.dbName = 'FileSystemHandles';
    this.storeName = 'fileHandles';
    this.isSupported = 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
    
    if (!this.isSupported) {
      console.warn('⚠️ File System Access API not supported on this browser. Using fallback: JSON blob downloads.');
    }
    
    this.initDB();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. INITIALIZE IndexedDB FOR HANDLE PERSISTENCE
  // ═══════════════════════════════════════════════════════════════════════════
  
  async initDB() {
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

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. FILE PICKER — OPEN
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Let user select a file to read (with persistent access)
   * @param {Object} options - { types: [{ accept: {'application/json': ['.json']} }] }
   * @returns {Promise<{handle, file, content, name}>} File data or null if cancelled
   */
  async openFile(options = {}) {
    if (!this.isSupported) {
      console.warn('File System Access API not supported');
      return this.fallbackOpenFile();
    }

    try {
      const defaultTypes = [
        { accept: { 'application/json': ['.json'] } },
        { accept: { 'text/csv': ['.csv'] } },
        { accept: { 'text/plain': ['.txt'] } }
      ];

      const [fileHandle] = await window.showOpenFilePicker({
        types: options.types || defaultTypes,
        multiple: false
      });

      const file = await fileHandle.getFile();
      const content = await file.text();
      
      // Save handle for future access (no re-asking)
      await this.saveHandle(fileHandle, 'import');
      
      console.log(`✅ File opened: ${file.name}`);
      
      return {
        handle: fileHandle,
        file,
        content,
        name: file.name
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('User cancelled file picker');
      } else {
        console.error('File open error:', err);
      }
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. FILE PICKER — SAVE
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Let user choose where to save a file
   * @param {string} content - File content (JSON/CSV/TXT)
   * @param {string} defaultName - Default filename (e.g., 'inventory-backup.json')
   * @returns {Promise<{handle, written}>} File handle & bytes written, or null if cancelled
   */
  async saveFile(content, defaultName = 'export.json') {
    if (!this.isSupported) {
      console.warn('File System Access API not supported');
      return this.fallbackSaveFile(content, defaultName);
    }

    try {
      const ext = defaultName.split('.').pop();
      const mimeType = this.getMimeType(ext);

      const fileHandle = await window.showSaveFilePicker({
        suggestedName: defaultName,
        types: [
          { 
            description: `${ext.toUpperCase()} Files`,
            accept: { [mimeType]: [`.${ext}`] }
          }
        ]
      });

      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      // Save handle for future access
      await this.saveHandle(fileHandle, 'export');

      console.log(`✅ File saved: ${fileHandle.name}`);
      
      return {
        handle: fileHandle,
        written: content.length,
        name: fileHandle.name
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('User cancelled save dialog');
      } else {
        console.error('File save error:', err);
      }
      return null;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. PERSIST FILE HANDLES (avoid re-asking for permission)
  // ═══════════════════════════════════════════════════════════════════════════
  
  async saveHandle(handle, type = 'export') {
    if (!this.isSupported) return;

    try {
      const db = await this.initDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      store.put({
        id: handle.name,
        handle: handle,
        type: type,
        savedAt: new Date().toISOString()
      });

      console.log(`💾 Handle saved for: ${handle.name}`);
    } catch (err) {
      console.error('Failed to save handle:', err);
    }
  }

  async getHandle(filename) {
    if (!this.isSupported) return null;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const query = store.get(filename);

        query.onsuccess = () => resolve(query.result?.handle || null);
        query.onerror = () => reject(query.error);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. MIME TYPE HELPER
  // ═══════════════════════════════════════════════════════════════════════════
  
  getMimeType(ext) {
    const types = {
      'json': 'application/json',
      'csv': 'text/csv',
      'txt': 'text/plain'
    };
    return types[ext.toLowerCase()] || 'application/octet-stream';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. FALLBACK: JSON BLOB DOWNLOAD (for unsupported browsers)
  // ═══════════════════════════════════════════════════════════════════════════
  
  fallbackSaveFile(content, defaultName) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`✅ File downloaded (fallback): ${defaultName}`);
    
    return {
      handle: null,
      written: content.length,
      name: defaultName,
      fallback: true
    };
  }

  fallbackOpenFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.csv,.txt';

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }

        const content = await file.text();
        resolve({
          handle: null,
          file,
          content,
          name: file.name,
          fallback: true
        });
      };

      input.click();
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. EXPORT APP DATA (convenience method)
  // ═══════════════════════════════════════════════════════════════════════════
  
  /**
   * Export entire app state as JSON
   * @returns {Promise<string>} JSON backup
   */
  async exportAppData() {
    try {
      const settings = await window.DB.getSettings();
      const products = await window.DB.getAllProducts();
      const sales = await window.DB.getAllSales();
      const debtors = await window.DB.getAllDebtors();

      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        appName: 'Joram\'s Sari-Sari Store',
        data: {
          settings,
          products,
          sales,
          debtors
        }
      };

      return JSON.stringify(backup, null, 2);
    } catch (err) {
      console.error('Export error:', err);
      throw new Error('Failed to export app data: ' + err.message);
    }
  }

  /**
   * Import app data from JSON file
   * @param {string} jsonContent - JSON backup content
   * @returns {Promise<{imported, skipped, errors}>} Import results
   */
  async importAppData(jsonContent) {
    try {
      const backup = JSON.parse(jsonContent);
      const results = {
        imported: 0,
        skipped: 0,
        errors: []
      };

      // Validate backup structure
      if (!backup.data) {
        throw new Error('Invalid backup file: missing data object');
      }

      // Import settings
      if (backup.data.settings) {
        try {
          await window.DB.saveSettings(backup.data.settings);
          results.imported++;
        } catch (err) {
          results.errors.push(`Settings: ${err.message}`);
          results.skipped++;
        }
      }

      // Import products (careful: don't overwrite existing)
      if (Array.isArray(backup.data.products)) {
        for (const product of backup.data.products) {
          try {
            // Check if product already exists
            const exists = await window.DB.getProduct(product.id);
            if (!exists) {
              await window.DB.addProduct(product);
              results.imported++;
            } else {
              results.skipped++;
            }
          } catch (err) {
            results.errors.push(`Product ${product.name}: ${err.message}`);
          }
        }
      }

      // Import sales
      if (Array.isArray(backup.data.sales)) {
        for (const sale of backup.data.sales) {
          try {
            await window.DB.addSale(sale);
            results.imported++;
          } catch (err) {
            results.errors.push(`Sale: ${err.message}`);
          }
        }
      }

      // Import debtors
      if (Array.isArray(backup.data.debtors)) {
        for (const debtor of backup.data.debtors) {
          try {
            await window.DB.addDebtor(debtor);
            results.imported++;
          } catch (err) {
            results.errors.push(`Debtor ${debtor.name}: ${err.message}`);
          }
        }
      }

      console.log('✅ Import complete:', results);
      return results;
    } catch (err) {
      console.error('Import error:', err);
      throw new Error('Failed to import app data: ' + err.message);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. QUICK EXPORT TO CSV (for spreadsheet compatibility)
  // ═══════════════════════════════════════════════════════════════════════════
  
  async exportInventoryCSV() {
    try {
      const products = await window.DB.getAllProducts();
      
      let csv = 'ID,Name,Category,Quantity,Cost,Selling Price,Profit Margin\n';
      products.forEach(p => {
        csv += `${p.id},"${p.name}","${p.category}",${p.quantity},${p.costPrice},${p.sellingPrice},${p.profitMargin}\n`;
      });

      return csv;
    } catch (err) {
      console.error('CSV export error:', err);
      throw new Error('Failed to export inventory: ' + err.message);
    }
  }

  async exportSalesCSV() {
    try {
      const sales = await window.DB.getAllSales();
      
      let csv = 'Date,Product,Quantity,Unit Price,Total,Payment Method\n';
      sales.forEach(s => {
        const date = new Date(s.date).toLocaleString();
        csv += `${date},"${s.productName}",${s.quantity},${s.unitPrice},${s.total},"${s.paymentMethod}"\n`;
      });

      return csv;
    } catch (err) {
      console.error('CSV export error:', err);
      throw new Error('Failed to export sales: ' + err.message);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GLOBAL INSTANCE
// ═══════════════════════════════════════════════════════════════════════════

window.FileSystem = new FileSystemManager();

console.log('✅ File System Access API manager loaded');
console.log(`📁 File System Support: ${window.FileSystem.isSupported ? '✅ Native' : '⚠️ Fallback'}`);