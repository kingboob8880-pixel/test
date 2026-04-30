/**
 * RUKYA PRO - Enterprise Audit Service
 * Логирование всех действий для безопасности и отладки
 */

import { AuditLog, AuditAction, ID } from '../types';

export class AuditService {
  private static readonly STORE_NAME = 'audit_logs';
  private static readonly MAX_LOGS = 10000;
  
  private userId: string = 'anonymous';
  private db: IDBDatabase | null = null;

  /**
   * Инициализация хранилища аудита
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RukyaProAudit', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('entityType', 'entityType', { unique: false });
          store.createIndex('action', 'action', { unique: false });
        }
      };
    });
  }

  /**
   * Установка текущего пользователя
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Логирование действия
   */
  async log(
    action: AuditAction,
    entityType: 'patient' | 'plan' | 'settings' | 'user',
    entityId: ID,
    changes?: { field: string; oldValue: any; newValue: any }[]
  ): Promise<void> {
    if (!this.db) await this.initialize();

    const logEntry: AuditLog = {
      id: this.generateId(),
      timestamp: Date.now(),
      userId: this.userId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress: '', // Можно добавить при работе с сервером
      userAgent: navigator.userAgent
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      store.add(logEntry);
      
      transaction.oncomplete = () => {
        this.cleanupOldLogs();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Получение истории по сущности
   */
  async getEntityHistory(entityType: string, entityId: ID): Promise<AuditLog[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('entityType');
      
      const logs: AuditLog[] = [];
      const request = index.openCursor(IDBKeyRange.only(entityType));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          if (cursor.value.entityId === entityId) {
            logs.push(cursor.value);
          }
          cursor.continue();
        } else {
          // Сортировка по времени убыванию
          logs.sort((a, b) => b.timestamp - a.timestamp);
          resolve(logs);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Получение действий пользователя
   */
  async getUserActions(userId: string, limit: number = 100): Promise<AuditLog[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('userId');
      
      const logs: AuditLog[] = [];
      const request = index.openCursor(IDBKeyRange.only(userId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor && logs.length < limit) {
          logs.push(cursor.value);
          cursor.continue();
        } else {
          logs.sort((a, b) => b.timestamp - a.timestamp);
          resolve(logs);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Экспорт логов аудита
   */
  async exportLogs(startDate?: number, endDate?: number): Promise<AuditLog[]> {
    if (!this.db) await this.initialize();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const logs: AuditLog[] = [];
      let lowerBound = 0;
      let upperBound = Date.now();
      
      if (startDate) lowerBound = startDate;
      if (endDate) upperBound = endDate;

      const range = IDBKeyRange.bound(lowerBound, upperBound);
      const request = store.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          logs.push(cursor.value);
          cursor.continue();
        } else {
          logs.sort((a, b) => b.timestamp - a.timestamp);
          resolve(logs);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Очистка старых логов (оставляем последние MAX_LOGS)
   */
  private async cleanupOldLogs(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        const count = countRequest.result;
        if (count > AuditService.MAX_LOGS) {
          const toDelete = count - AuditService.MAX_LOGS;
          const deleteRequest = store.openCursor();
          let deleted = 0;

          deleteRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor && deleted < toDelete) {
              store.delete(cursor.primaryKey);
              deleted++;
              cursor.continue();
            } else {
              resolve();
            }
          };
        } else {
          resolve();
        }
      };
    });
  }

  /**
   * Генерация уникального ID
   */
  private generateId(): ID {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const auditService = new AuditService();
