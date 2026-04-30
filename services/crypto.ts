/**
 * RUKYA PRO - Enterprise Crypto Service
 * Шифрование данных на клиенте (AES-GCM)
 */

import { EncryptedData } from '../types';

export class CryptoService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly TAG_LENGTH = 128;

  private key: CryptoKey | null = null;
  private salt: string | null = null;

  /**
   * Инициализация сервиса с паролем пользователя
   */
  async initialize(password: string, salt?: string): Promise<void> {
    this.salt = salt || this.generateSalt();
    
    // Derive key from password using PBKDF2
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    this.key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode(this.salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Шифрование строки
   */
  async encrypt(plainText: string): Promise<EncryptedData> {
    if (!this.key) throw new Error('Crypto service not initialized');

    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);

    const encrypted = await crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv, tagLength: this.TAG_LENGTH },
      this.key,
      data
    );

    return {
      iv: this.arrayBufferToBase64(iv),
      data: this.arrayBufferToBase64(encrypted),
      authTag: '' // В AES-GCM тег включен в encrypted данные
    };
  }

  /**
   * Расшифровка строки
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    if (!this.key) throw new Error('Crypto service not initialized');

    const iv = this.base64ToArrayBuffer(encryptedData.iv);
    const data = this.base64ToArrayBuffer(encryptedData.data);

    const decrypted = await crypto.subtle.decrypt(
      { name: this.ALGORITHM, iv, tagLength: this.TAG_LENGTH },
      this.key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Шифрование объекта Patient (чувствительные поля)
   */
  async encryptPatientFields(patient: any): Promise<any> {
    if (!this.key) return patient;

    const sensitiveFields = ['firstName', 'lastName', 'phone', 'city', 'complaints'];
    const encryptedPatient = { ...patient };

    for (const field of sensitiveFields) {
      if (patient[field]) {
        const encrypted = await this.encrypt(patient[field]);
        encryptedPatient[field] = `ENC:${JSON.stringify(encrypted)}`;
        encryptedPatient[`__encrypted__${field}`] = true;
      }
    }

    return encryptedPatient;
  }

  /**
   * Расшифровка объекта Patient
   */
  async decryptPatientFields(patient: any): Promise<any> {
    if (!this.key) return patient;

    const decryptedPatient = { ...patient };
    const sensitiveFields = ['firstName', 'lastName', 'phone', 'city', 'complaints'];

    for (const field of sensitiveFields) {
      if (patient[`__encrypted__${field}`] && patient[field]?.startsWith('ENC:')) {
        try {
          const encryptedJson = patient[field].substring(4);
          const encryptedData = JSON.parse(encryptedJson);
          decryptedPatient[field] = await this.decrypt(encryptedData);
          delete decryptedPatient[`__encrypted__${field}`];
        } catch (e) {
          console.error(`Failed to decrypt field ${field}`, e);
        }
      }
    }

    return decryptedPatient;
  }

  /**
   * Генерация соли
   */
  private generateSalt(): string {
    const array = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Конвертация ArrayBuffer в Base64
   */
  private arrayBufferToBase64(buffer: ArrayBufferLike): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Конвертация Base64 в ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Проверка доступности Crypto API
   */
  static isSupported(): boolean {
    return !!(crypto && crypto.subtle);
  }
}

// Singleton instance
export const cryptoService = new CryptoService();
