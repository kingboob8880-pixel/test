/**
 * RUKYA PRO - Utils
 * Вспомогательные функции для Enterprise версии
 */

import { ID, Timestamp, Patient, TreatmentPlan, SymptomStatus } from '../types';

/**
 * Генерация уникального ID
 */
export function generateId(prefix: string = ''): ID {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Форматирование даты
 */
export function formatDate(timestamp: Timestamp, locale: string = 'ru-RU'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(timestamp));
}

/**
 * Форматирование относительного времени ("2 часа назад")
 */
export function formatRelativeTime(timestamp: Timestamp): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  if (hours < 24) return `${hours} ч. назад`;
  if (days < 7) return `${days} дн. назад`;
  
  return formatDate(timestamp);
}

/**
 * Расчет прогресса лечения в процентах
 */
export function calculateTreatmentProgress(plan: TreatmentPlan): number {
  if (plan.completedDays <= 0) return 0;
  if (plan.durationDays <= 0) return 100;
  
  const progress = (plan.completedDays / plan.durationDays) * 100;
  return Math.min(100, Math.round(progress));
}

/**
 * Определение статуса симптома для отображения
 */
export function getSymptomStatusLabel(status: SymptomStatus): string {
  switch (status) {
    case 'active': return 'Активен';
    case 'improved': return 'Улучшилось';
    case 'inactive': return 'Не активен';
    default: return 'Неизвестно';
  }
}

/**
 * Получение иконки для симптома
 */
export function getSymptomIcon(symptomId: string): string {
  const icons: Record<string, string> = {
    nightmares: '😱',
    chest_pain: '💔',
    headache: '🤕',
    fear_panic: '😨',
    irritability: '😠',
    waswasa: '🌀',
    weakness: '😫',
    appetite_loss: '🍽️',
    insomnia: '😴',
    prayer_difficulty: '🕌',
    quran_reaction: '📖',
    voice_change: '🎤',
    back_pain: '🦴',
    stomach_pain: '🤢',
    cold_limbs: '🥶'
  };
  
  return icons[symptomId] || '📋';
}

/**
 * Глубокое клонирование объекта
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce функция
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle функция
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Проверка на пустой объект
 */
export function isEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string') return obj.trim() === '';
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

/**
 * Безопасное получение вложенного свойства
 */
export function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => {
    return acc && acc[part] !== undefined ? acc[part] : undefined;
  }, obj);
}

/**
 * Группировка массива по ключу
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Сортировка массива пациентов по статусу и дате
 */
export function sortPatients(patients: Patient[]): Patient[] {
  const statusOrder: Record<string, number> = {
    active: 0,
    paused: 1,
    completed: 2,
    archived: 3
  };
  
  return [...patients].sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    
    return b.updatedAt - a.updatedAt;
  });
}

/**
 * Поиск пациента по запросу
 */
export function searchPatients(patients: Patient[], query: string): Patient[] {
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) return patients;
  
  return patients.filter(patient => {
    const searchableFields = [
      patient.firstName,
      patient.lastName || '',
      patient.city || '',
      patient.complaints
    ].join(' ').toLowerCase();
    
    return searchableFields.includes(lowerQuery);
  });
}

/**
 * Расчет статистики симптомов
 */
export function calculateSymptomStats(symptoms: Array<{ status: SymptomStatus }>): {
  active: number;
  improved: number;
  inactive: number;
  improvementRate: number;
} {
  const stats = {
    active: 0,
    improved: 0,
    inactive: 0
  };
  
  symptoms.forEach(s => {
    stats[s.status] = (stats[s.status] || 0) + 1;
  });
  
  const total = symptoms.length;
  const improvementRate = total > 0 
    ? Math.round((stats.improved / total) * 100) 
    : 0;
  
  return { ...stats, improvementRate };
}

/**
 * Экспорт в CSV
 */
export function exportToCSV(data: any[], filename: string): void {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(field => {
        const value = row[field];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${Date.now()}.csv`;
  link.click();
}

/**
 * Импорт из JSON файла
 */
export async function importFromJSON(): Promise<any> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('Файл не выбран'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          resolve(data);
        } catch (err) {
          reject(new Error('Ошибка парсинга JSON'));
        }
      };
      reader.onerror = () => reject(new Error('Ошибка чтения файла'));
      reader.readAsText(file);
    };
    
    input.click();
  });
}

/**
 * Проверка поддержки PWA
 */
export function isPWASupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Установка плохого цвета по тяжести
 */
export function getSeverityColor(severity: number): string {
  if (severity <= 2) return '#22c55e'; // green
  if (severity <= 3) return '#eab308'; // yellow
  if (severity <= 4) return '#f97316'; // orange
  return '#ef4444'; // red
}
