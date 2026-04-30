/**
 * RUKYA PRO - Система уведомлений (Toast & Push)
 * Enterprise-уровень уведомлений для всех событий системы
 */

class NotificationService {
  constructor() {
    this.toasts = [];
    this.toastContainer = null;
    this.permission = 'default';
    this.maxToasts = 5;
    this.defaultDuration = 4000;
    
    this.init();
  }

  init() {
    this.createToastContainer();
    this.requestPermission();
    
    // Слушаем события системы для автоматических уведомлений
    this.bindSystemEvents();
  }

  createToastContainer() {
    const html = `
      <div id="toast-container" class="toast-container">
        <!-- Toast уведомления будут добавляться сюда -->
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    this.toastContainer = document.getElementById('toast-container');
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('[Notifications] Браузер не поддерживает уведомления');
      return;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        this.permission = permission;
        
        if (permission === 'granted') {
          this.show({
            type: 'success',
            title: 'Уведомления включены',
            message: 'Теперь вы будете получать системные уведомления',
            duration: 3000
          });
        }
      } catch (error) {
        console.error('[Notifications] Ошибка запроса разрешения:', error);
      }
    }
  }

  bindSystemEvents() {
    // Пациенты
    document.addEventListener('patient-created', (e) => {
      this.show({
        type: 'success',
        title: 'Пациент добавлен',
        message: `Пациент ${e.detail?.name || ''} успешно добавлен в базу`,
        icon: 'user-plus',
        action: {
          label: 'Открыть',
          callback: () => {
            if (window.router) {
              window.router.navigate(`patients?id=${e.detail?.id}`);
            }
          }
        }
      });
    });

    document.addEventListener('patient-updated', (e) => {
      this.show({
        type: 'info',
        title: 'Данные обновлены',
        message: `Информация о пациенте обновлена`,
        icon: 'refresh'
      });
    });

    document.addEventListener('patient-deleted', (e) => {
      this.show({
        type: 'warning',
        title: 'Пациент удален',
        message: 'Запись перемещена в корзину',
        icon: 'trash',
        action: {
          label: 'Восстановить',
          callback: () => {
            // Логика восстановления
            console.log('Восстановление пациента:', e.detail?.id);
          }
        }
      });
    });

    // Планы лечения
    document.addEventListener('plan-created', (e) => {
      this.show({
        type: 'success',
        title: 'План лечения создан',
        message: `Курс на ${e.detail?.duration || 0} дней сформирован`,
        icon: 'file-text',
        action: {
          label: 'Просмотр',
          callback: () => {
            if (window.router) {
              window.router.navigate(`plans?id=${e.detail?.id}`);
            }
          }
        }
      });
    });

    document.addEventListener('plan-completed', (e) => {
      this.show({
        type: 'success',
        title: 'Курс завершен',
        message: 'Пациент успешно завершил лечение',
        icon: 'check-circle',
        duration: 5000
      });
    });

    // Диагностика
    document.addEventListener('diagnosis-complete', (e) => {
      const confidence = e.detail?.confidence || 0;
      let type = 'info';
      let title = 'Диагностика завершена';
      
      if (confidence >= 0.8) {
        type = 'success';
        title = 'Высокая уверенность';
      } else if (confidence < 0.5) {
        type = 'warning';
        title = 'Низкая уверенность';
      }
      
      this.show({
        type,
        title,
        message: `Уверенность диагноза: ${(confidence * 100).toFixed(0)}%`,
        icon: 'activity'
      });
    });

    // Ошибки
    document.addEventListener('system-error', (e) => {
      this.show({
        type: 'error',
        title: 'Ошибка',
        message: e.detail?.message || 'Произошла ошибка в системе',
        icon: 'alert-circle',
        duration: 6000,
        sticky: true
      });
    });

    // Синхронизация
    document.addEventListener('sync-complete', (e) => {
      this.show({
        type: 'success',
        title: 'Синхронизация',
        message: 'Данные успешно синхронизированы',
        icon: 'cloud'
      });
    });

    document.addEventListener('sync-error', (e) => {
      this.show({
        type: 'error',
        title: 'Ошибка синхронизации',
        message: 'Не удалось синхронизировать данные',
        icon: 'cloud-off'
      });
    });
  }

  /**
   * Показать toast уведомление
   * @param {Object} options - Параметры уведомления
   */
  show(options = {}) {
    const {
      type = 'info', // success, error, warning, info
      title = '',
      message = '',
      icon = null,
      duration = this.defaultDuration,
      action = null,
      sticky = false,
      onClose = null
    } = options;

    const id = Date.now().toString();
    
    const toast = {
      id,
      type,
      title,
      message,
      icon,
      action,
      sticky,
      onClose,
      createdAt: Date.now()
    };

    this.toasts.push(toast);
    
    // Удаляем старые уведомления если превышен лимит
    if (this.toasts.length > this.maxToasts) {
      const removed = this.toasts.shift();
      this.removeToast(removed.id);
    }

    this.renderToast(toast);

    // Автозакрытие
    if (!sticky && duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }

    return id;
  }

  renderToast(toast) {
    const icons = {
      'success': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      'error': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      'warning': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      'info': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
      'user-plus': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>',
      'refresh': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path></svg>',
      'trash': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path></svg>',
      'file-text': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
      'check-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      'activity': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>',
      'alert-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
      'cloud': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"></path></svg>',
      'cloud-off': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.61 16.95A5 5 0 0018 10h-1.26a8 8 0 00-7.05-6M5 5a8 8 0 004 7h6a5 5 0 015 5"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
    };

    const html = `
      <div class="toast toast-${toast.type}" data-id="${toast.id}">
        <div class="toast-icon">
          ${icons[toast.icon] || icons[toast.type]}
        </div>
        <div class="toast-content">
          ${toast.title ? `<div class="toast-title">${toast.title}</div>` : ''}
          ${toast.message ? `<div class="toast-message">${toast.message}</div>` : ''}
          ${toast.action ? `
            <button class="toast-action" data-action="${toast.id}">
              ${toast.action.label}
            </button>
          ` : ''}
        </div>
        <button class="toast-close" data-close="${toast.id}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        ${!toast.sticky ? '<div class="toast-progress"></div>' : ''}
      </div>
    `;

    this.toastContainer.insertAdjacentHTML('beforeend', html);

    // Анимация появления
    const toastElement = this.toastContainer.querySelector(`[data-id="${toast.id}"]`);
    
    // Обработчики кнопок
    const closeBtn = toastElement.querySelector(`[data-close="${toast.id}"]`);
    closeBtn.addEventListener('click', () => this.removeToast(toast.id));

    if (toast.action) {
      const actionBtn = toastElement.querySelector(`[data-action="${toast.id}"]`);
      actionBtn.addEventListener('click', () => {
        toast.action.callback();
        this.removeToast(toast.id);
      });
    }

    // Прогресс бар для автозакрытия
    if (!toast.sticky) {
      const progress = toastElement.querySelector('.toast-progress');
      progress.style.animationDuration = `${toast.duration}ms`;
    }
  }

  removeToast(id) {
    const toastElement = this.toastContainer.querySelector(`[data-id="${id}"]`);
    
    if (!toastElement) return;

    // Анимация исчезновения
    toastElement.classList.add('toast-hiding');
    
    setTimeout(() => {
      toastElement.remove();
      const index = this.toasts.findIndex(t => t.id === id);
      if (index > -1) {
        const toast = this.toasts[index];
        if (toast.onClose) {
          toast.onClose();
        }
        this.toasts.splice(index, 1);
      }
    }, 300);
  }

  /**
   * Показать push уведомление (браузерное)
   */
  async showPush(options = {}) {
    const {
      title = 'RUKYA PRO',
      body = '',
      icon = '/manifest.json',
      badge = '/manifest.json',
      tag = 'default',
      requireInteraction = false,
      onClick = null
    } = options;

    if (this.permission !== 'granted') {
      console.warn('[Push] Разрешение не получено');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      const notificationOptions = {
        body,
        icon,
        badge,
        tag,
        requireInteraction,
        data: {
          timestamp: Date.now(),
          onClick
        },
        actions: [
          { action: 'open', title: 'Открыть' },
          { action: 'dismiss', title: 'Закрыть' }
        ]
      };

      const notification = await registration.showNotification(title, notificationOptions);
      
      // Обработчик клика (через service worker)
      if (onClick) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'notification-click' && event.data.tag === tag) {
            onClick();
          }
        });
      }
      
      return notification;
    } catch (error) {
      console.error('[Push] Ошибка отправки уведомления:', error);
      return null;
    }
  }

  /**
   * Очистить все уведомления
   */
  clearAll() {
    this.toasts.forEach(toast => this.removeToast(toast.id));
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.getNotifications().then(notifications => {
          notifications.forEach(notification => notification.close());
        });
      });
    }
  }

  /**
   * Успешное уведомление
   */
  success(message, title = 'Успех') {
    return this.show({ type: 'success', title, message });
  }

  /**
   * Ошибка
   */
  error(message, title = 'Ошибка') {
    return this.show({ type: 'error', title, message, sticky: true });
  }

  /**
   * Предупреждение
   */
  warning(message, title = 'Внимание') {
    return this.show({ type: 'warning', title, message });
  }

  /**
   * Информация
   */
  info(message, title = 'Информация') {
    return this.show({ type: 'info', title, message });
  }
}

// Глобальный экземпляр
document.addEventListener('DOMContentLoaded', () => {
  window.notifications = new NotificationService();
});

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotificationService;
}
