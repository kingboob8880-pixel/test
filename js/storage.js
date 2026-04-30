/**
 * RUKYA PRO — Хранилище данных (IndexedDB)
 * Ash-Shifa · Абу Мухаммад
 */

// Store names
const STORES = {
  PATIENTS: 'patients',
  PLANS: 'plans',
  CERTIFICATES: 'certificates',
  SETTINGS: 'settings',
  HISTORY: 'history',
  GROUPS: 'groups',
  APPOINTMENTS: 'appointments',
  QUESTIONNAIRES: 'questionnaires'
};

const Storage = {
  dbName: 'RukyaProDB',
  version: 1,
  db: null,
  
  // Promise that resolves when DB is ready
  ready: null,
  
  init() {
    this.ready = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        if (!db.objectStoreNames.contains(STORES.PATIENTS)) {
          const patientStore = db.createObjectStore(STORES.PATIENTS, { keyPath: 'id' });
          patientStore.createIndex('status', 'status', { unique: false });
          patientStore.createIndex('group', 'group', { unique: false });
          patientStore.createIndex('deletedAt', 'deletedAt', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.PLANS)) {
          const planStore = db.createObjectStore(STORES.PLANS, { keyPath: 'id' });
          planStore.createIndex('patientId', 'patientId', { unique: false });
          planStore.createIndex('status', 'status', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.CERTIFICATES)) {
          const certStore = db.createObjectStore(STORES.CERTIFICATES, { keyPath: 'id' });
          certStore.createIndex('patientId', 'patientId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains(STORES.HISTORY)) {
          const historyStore = db.createObjectStore(STORES.HISTORY, { keyPath: 'id' });
          historyStore.createIndex('entityType', 'entityType', { unique: false });
          historyStore.createIndex('entityId', 'entityId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.GROUPS)) {
          db.createObjectStore(STORES.GROUPS, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.APPOINTMENTS)) {
          const apptStore = db.createObjectStore(STORES.APPOINTMENTS, { keyPath: 'id' });
          apptStore.createIndex('patientId', 'patientId', { unique: false });
          apptStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains(STORES.QUESTIONNAIRES)) {
          const qStore = db.createObjectStore(STORES.QUESTIONNAIRES, { keyPath: 'id' });
          qStore.createIndex('patientId', 'patientId', { unique: false });
        }
      };
    });
    
    return this.ready;
  },
  
  // Generic CRUD operations
  async get(storeName, id) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async getAll(storeName) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },
  
  async put(storeName, item) {
    await this.ready;
    
    // Add metadata
    if (!item.id) {
      item.id = Utils.generateId();
    }
    item.updatedAt = new Date().toISOString();
    
    // Log history
    await this.logHistory(storeName, item.id, 'update', item);
    
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(item);
      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  },
  
  async delete(storeName, id) {
    await this.ready;
    
    // Soft delete - mark as deleted instead of removing
    const item = await this.get(storeName, id);
    if (item) {
      item.deletedAt = new Date().toISOString();
      return this.put(storeName, item);
    }
    
    return null;
  },
  
  async hardDelete(storeName, id) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  
  // History logging
  async logHistory(storeName, entityId, action, data) {
    try {
      const historyItem = {
        id: Utils.generateId(),
        entityType: storeName,
        entityId,
        action,
        data: JSON.parse(JSON.stringify(data)), // Deep clone
        timestamp: new Date().toISOString()
      };
      
      const tx = this.db.transaction(STORES.HISTORY, 'readwrite');
      const store = tx.objectStore(STORES.HISTORY);
      store.put(historyItem);
    } catch (error) {
      console.warn('History logging failed:', error);
    }
  },
  
  // Export all data
  async exportAll() {
    await this.ready;
    const data = {};
    
    for (const storeName of Object.values(STORES)) {
      data[storeName] = await this.getAll(storeName);
    }
    
    return data;
  },
  
  // Import all data
  async importAll(data) {
    await this.ready;
    
    for (const [storeName, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        const tx = this.db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        for (const item of items) {
          store.put(item);
        }
      }
    }
  },
  
  // Clear all data
  async clearAll() {
    await this.ready;
    
    for (const storeName of Object.values(STORES)) {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
    }
  }
};

// Initialize storage
const storage = Storage.init();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Storage, storage, STORES };
}
