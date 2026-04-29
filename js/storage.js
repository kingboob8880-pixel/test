/**
 * RUKYA PRO — Хранилище данных (IndexedDB)
 * Ash-Shifa · Абу Мухаммад
 */

const DB_NAME = 'RukyaProDB';
const DB_VERSION = 1;

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

class Storage {
  constructor() {
    this.db = null;
    this.ready = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Patients store
        if (!db.objectStoreNames.contains(STORES.PATIENTS)) {
          const patients = db.createObjectStore(STORES.PATIENTS, { keyPath: 'id' });
          patients.createIndex('name', 'name', { unique: false });
          patients.createIndex('status', 'status', { unique: false });
          patients.createIndex('group', 'group', { unique: false });
          patients.createIndex('deletedAt', 'deletedAt', { unique: false });
          patients.createIndex('archivedAt', 'archivedAt', { unique: false });
        }

        // Plans store
        if (!db.objectStoreNames.contains(STORES.PLANS)) {
          const plans = db.createObjectStore(STORES.PLANS, { keyPath: 'id' });
          plans.createIndex('patientId', 'patientId', { unique: false });
          plans.createIndex('status', 'status', { unique: false });
        }

        // Certificates store
        if (!db.objectStoreNames.contains(STORES.CERTIFICATES)) {
          const certs = db.createObjectStore(STORES.CERTIFICATES, { keyPath: 'id' });
          certs.createIndex('patientId', 'patientId', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }

        // History store (audit log)
        if (!db.objectStoreNames.contains(STORES.HISTORY)) {
          const history = db.createObjectStore(STORES.HISTORY, { keyPath: 'id', autoIncrement: true });
          history.createIndex('entityType', 'entityType', { unique: false });
          history.createIndex('entityId', 'entityId', { unique: false });
          history.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Groups store
        if (!db.objectStoreNames.contains(STORES.GROUPS)) {
          db.createObjectStore(STORES.GROUPS, { keyPath: 'id' });
        }

        // Appointments store
        if (!db.objectStoreNames.contains(STORES.APPOINTMENTS)) {
          const appointments = db.createObjectStore(STORES.APPOINTMENTS, { keyPath: 'id' });
          appointments.createIndex('patientId', 'patientId', { unique: false });
          appointments.createIndex('date', 'date', { unique: false });
        }

        // Questionnaires store
        if (!db.objectStoreNames.contains(STORES.QUESTIONNAIRES)) {
          const questionnaires = db.createObjectStore(STORES.QUESTIONNAIRES, { keyPath: 'id' });
          questionnaires.createIndex('patientId', 'patientId', { unique: false });
          questionnaires.createIndex('type', 'type', { unique: false });
        }
      };
    });
  }

  async get(storeName, id) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName, indexName = null, value = null) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      let request;
      if (indexName && value !== null) {
        const index = store.index(indexName);
        request = index.getAll(value);
      } else {
        request = store.getAll();
      }
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName, item) {
    await this.ready;
    return new Promise(async (resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      // Add audit log
      if (item.id) {
        await this.logHistory(storeName, item.id, 'update', item);
      }
      
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, id, soft = true) {
    await this.ready;
    
    if (soft && storeName === STORES.PATIENTS) {
      // Soft delete for patients
      const patient = await this.get(storeName, id);
      if (patient) {
        patient.deletedAt = Date.now();
        return this.put(storeName, patient);
      }
    }
    
    return new Promise(async (resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      // Add audit log
      await this.logHistory(storeName, id, 'delete', null);
      
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async archive(storeName, id) {
    await this.ready;
    const item = await this.get(storeName, id);
    if (item) {
      item.archivedAt = Date.now();
      return this.put(storeName, item);
    }
  }

  async restore(storeName, id) {
    await this.ready;
    const item = await this.get(storeName, id);
    if (item) {
      delete item.deletedAt;
      delete item.archivedAt;
      return this.put(storeName, item);
    }
  }

  async logHistory(entityType, entityId, action, data) {
    try {
      const entry = {
        entityType,
        entityId,
        action,
        data: JSON.parse(JSON.stringify(data)),
        timestamp: Date.now()
      };
      await this.put(STORES.HISTORY, entry);
    } catch (e) {
      console.warn('History logging failed:', e);
    }
  }

  async exportAll() {
    await this.ready;
    const exportData = {};
    for (const store of Object.values(STORES)) {
      exportData[store] = await this.getAll(store);
    }
    return exportData;
  }

  async importAll(data) {
    await this.ready;
    for (const [storeName, items] of Object.entries(data)) {
      if (STORES[storeName.toUpperCase()] && Array.isArray(items)) {
        for (const item of items) {
          await this.put(storeName, item);
        }
      }
    }
  }

  async clearAll() {
    await this.ready;
    for (const store of Object.values(STORES)) {
      await this.clear(store);
    }
  }

  async clear(storeName) {
    await this.ready;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
const storage = new Storage();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Storage, storage, STORES };
}
