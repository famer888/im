// 1. 读取时, 如果无值，则返回空数组
// 2. 写入时，如果无文件，则创建文件（如果electron-store自己没有实现的话）
// 3. 写入时，如果值为undefined，则设置空数组

import Store from 'electron-store';

class Storage {
  constructor() {
    this.encryptionKey = 'ocs_storage_encryption_key_randomized';
    this.stores = new Map(); // Map to store multiple instances
  }

  /**
   * Initialize storage singleton
   * @param {string} tableName - table name for specific store instance
   */
  init(tableName = 'default') {
    // Check if store for this tableName already exists
    if (!this.stores.has(tableName)) {
      const storeOptions = {
        name: `ocs-storage-${tableName}`,
        encryptionKey: this.encryptionKey,
        fileExtension: 'json'
      };
      
      // Add cwd if baseDir is set
      if (this.baseDir) {
        storeOptions.cwd = this.baseDir;
      }
      
      const store = new Store(storeOptions);
      this.stores.set(tableName, store);
    }
    
    return this;
  }

  /**
   * Set base directory for storage files
   * @param {string} baseDir - base directory path
   */
  setBase(baseDir) {
    if (!baseDir) {
      console.warn('Storage.setBase: baseDir is required');
      return this;
    }

    // Clear existing stores
    this.stores.clear();
    
    // Store the base directory for new store instances
    this.baseDir = `${baseDir}/storage`;
    
    console.log(`Storage: Base directory set to ${this.baseDir}`);
    return this;
  }

  /**
   * Get value from storage
   * @param {string} tableName - table name (also used as store key)
   * @param {string} key - key within the table, defaults to 'data'
   * @returns {Array} - returns empty array if no value found
   */
  get(tableName, key = 'data') {
    // Initialize store if not exists
    this.init(tableName);
    
    const store = this.stores.get(tableName);
    if (!store) {
      console.warn(`Store '${tableName}' not found`);
      return [];
    }
    
    const value = store.get(key);
    return value !== undefined ? value : [];
  }

  /**
   * Set value to storage
   * @param {string} tableName - table name (also used as store key)
   * @param {*} value - value to store, if undefined then set empty array
   * @param {string} key - key within the table, defaults to 'data'
   */
  set(tableName, value, key = 'data') {
    // Initialize store if not exists
    this.init(tableName);
    
    const store = this.stores.get(tableName);
    if (!store) {
      console.warn(`Store '${tableName}' not found`);
      return;
    }
    
    // If value is undefined, set empty array as default
    const finalValue = value !== undefined ? value : [];
    store.set(key, finalValue);
  }

  /**
   * Delete value from storage
   * @param {string} tableName - table name (also used as store key)
   * @param {string} key - key within the table, defaults to 'data'
   */
  delete(tableName, key = 'data') {
    // Initialize store if not exists
    this.init(tableName);
    
    const store = this.stores.get(tableName);
    if (!store) {
      console.warn(`Store '${tableName}' not found`);
      return;
    }
    
    store.delete(key);
  }

  /**
   * Clear all storage for specific store or all stores
   * @param {string} tableName - table name for specific store instance, if not provided clears all stores
   */
  clear(tableName) {
    if (tableName) {
      // Clear specific store
      const store = this.stores.get(tableName);
      if (!store) {
        console.warn(`Store '${tableName}' not found`);
        return;
      }
      
      store.clear();
    } else {
      // Clear all stores
      for (const [key, store] of this.stores) {
        store.clear();
      }
    }
  }

  register() {
    const { ipcMain } = require('electron');
    
    // 注册ipc通道storage:get
    ipcMain.handle('storage:get', async (event, { tableName, key }) => {
      try {
        const data = this.get(tableName, key);
        return { success: true, data };
      } catch (error) {
        console.error('storage:get error:', error);
        return { success: false, data: [], error: error.message };
      }
    });
    
    // 注册ipc通道storage:set
    ipcMain.handle('storage:set', async (event, { tableName, value, key }) => {
      try {
        this.set(tableName, value, key);
        return { success: true };
      } catch (error) {
        console.error('storage:set error:', error);
        return { success: false, error: error.message };
      }
    });
    
    // 注册ipc通道storage:delete
    ipcMain.handle('storage:delete', async (event, { tableName, key }) => {
      try {
        this.delete(tableName, key);
        return { success: true };
      } catch (error) {
        console.error('storage:delete error:', error);
        return { success: false, error: error.message };
      }
    });
    
    // 注册ipc通道storage:clear
    ipcMain.handle('storage:clear', async (event, { tableName }) => {
      try {
        this.clear(tableName);
        return { success: true };
      } catch (error) {
        console.error('storage:clear error:', error);
        return { success: false, error: error.message };
      }
    });
  }
}

export default new Storage();