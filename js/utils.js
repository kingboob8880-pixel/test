/**
 * RUKYA PRO — Утилиты
 * Ash-Shifa · Абу Мухаммад
 */

const Utils = {
  // Генерация уникального ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // Форматирование даты
  formatDate(timestamp, options = {}) {
    const date = new Date(timestamp);
    const defaultOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleString('ru-RU', { ...defaultOptions, ...options });
  },

  // Форматирование относительного времени
  formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    if (days < 7) return `${days} дн. назад`;
    return this.formatDate(timestamp);
  },

  // Глубокое копирование объекта
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Debounce функция
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle функция
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Скачивание файла
  downloadFile(filename, content, type = 'application/json') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Чтение файла как текст
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  },

  // Чтение файла как DataURL
  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  // Проверка на пустой объект
  isEmpty(obj) {
    return Object.keys(obj).length === 0;
  },

  // Безопасное получение вложенного свойства
  getNested(obj, path, defaultValue = null) {
    return path.split('.').reduce((acc, part) => {
      return acc && acc[part] !== undefined ? acc[part] : defaultValue;
    }, obj);
  },

  // Группировка массива по ключу
  groupBy(array, keyFn) {
    return array.reduce((result, item) => {
      const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn];
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
      return result;
    }, {});
  },

  // Сортировка массива объектов
  sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return order === 'desc' ? -comparison : comparison;
    });
  },

  // Поиск с учётом регистра
  searchMatch(text, query) {
    if (!query) return true;
    return text.toLowerCase().includes(query.toLowerCase());
  },

  // Обрезка текста
  truncate(text, maxLength = 100, suffix = '...') {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  },

  // Capitalize first letter
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Транслитерация (базовая)
  transliterate(word) {
    const a = {
      "ё":"yo", "а":"a", "б":"b", "в":"v", "г":"g", "д":"d", "е":"e", "ж":"zh",
      "з":"z", "и":"i", "й":"y", "к":"k", "л":"l", "м":"m", "н":"n", "о":"o",
      "п":"p", "р":"r", "с":"s", "т":"t", "у":"u", "ф":"f", "х":"h", "ц":"c",
      "ч":"ch", "ш":"sh", "щ":"sh", "ъ":"", "ы":"y", "ь":"", "э":"e", "ю":"yu",
      "я":"ya"
    };
    return word.toLowerCase().split('').map(char => a[char] || char).join('');
  },

  // Проверка на мобильное устройство
  isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  // Копирование в буфер обмена
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback для старых браузеров
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  },

  // Форматирование числа с разделителями
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  },

  // Процент выполнения
  calculateProgress(current, total) {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  },

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  // Retry с экспоненциальной задержкой
  async retry(fn, retries = 3, delay = 1000) {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) throw error;
      await this.sleep(delay);
      return this.retry(fn, retries - 1, delay * 2);
    }
  }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
