/**
 * RUKYA PRO — Маршрутизация
 * Ash-Shifa · Абу Мухаммад
 */

class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.init();
  }
  
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }
  
  // Register route handler
  on(route, handler) {
    this.routes[route] = handler;
  }
  
  // Navigate to route
  navigate(route, params = {}) {
    const hash = route.startsWith('#') ? route : `#${route}`;
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString()
      : '';
    window.location.hash = hash + queryString;
  }
  
  // Get current route params
  getParams() {
    const hash = window.location.hash.slice(1);
    const [path, queryString] = hash.split('?');
    const params = {};
    
    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }
    }
    
    return params;
  }
  
  // Handle route change
  async handleRoute() {
    const hash = window.location.hash.slice(1) || 'dashboard';
    const [route, queryString] = hash.split('?');
    const params = this.getParams();
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.dataset.route === route) {
        item.classList.add('active');
      }
    });
    
    // Update page title
    const titles = {
      'dashboard': 'Сегодня',
      'newcase': 'Новый приём',
      'patients': 'Пациенты',
      'plans': 'Планы лечения',
      'groups': 'Группы',
      'certificates': 'Заключения',
      'calendar': 'Календарь',
      'library': 'Библиотека',
      'import': 'Импорт',
      'settings': 'Настройки',
      'patient': 'Карточка пациента'
    };
    
    const title = titles[route] || 'RUKYA PRO';
    document.getElementById('pageTitle').textContent = title;
    
    // Call route handler
    const handler = this.routes[route];
    if (handler) {
      try {
        await handler(params);
      } catch (error) {
        console.error(`Route ${route} error:`, error);
        App.showError('Ошибка загрузки страницы');
      }
    } else {
      // Default to dashboard
      this.navigate('dashboard');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
  }
}

// Singleton instance
const router = new Router();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Router, router };
}
