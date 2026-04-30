/**
 * RUKYA PRO — Основное приложение
 * Ash-Shifa · Абу Мухаммад
 */

const App = {
  version: '1.0.0',
  
  async init() {
    try {
      // Initialize storage
      await storage.ready;
      
      // Load settings
      await this.loadSettings();
      
      // Setup UI handlers
      this.setupUIHandlers();
      
      // Register routes
      this.registerRoutes();
      
      // Show loading state
      this.hideLoading();
      
      // Toast notification system
      window.showToast = (message, type = 'info') => this.showToast(message, type);
      window.showModal = (content) => this.showModal(content);
      window.hideModal = () => this.hideModal();
      
      console.log('RUKYA PRO initialized', this.version);
    } catch (error) {
      console.error('App initialization error:', error);
      this.showError('Ошибка инициализации приложения');
    }
  },
  
  // Load user settings
  async loadSettings() {
    try {
      const settings = await storage.getAll(STORES.SETTINGS);
      const settingsMap = {};
      settings.forEach(s => settingsMap[s.key] = s.value);
      
      // Apply theme
      if (settingsMap.theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${settingsMap.theme}`);
      }
      
      // Apply density
      if (settingsMap.density) {
        document.body.className = document.body.className.replace(/density-\w+/g, '');
        document.body.classList.add(`density-${settingsMap.density}`);
      }
      
      // Apply font size
      if (settingsMap.fontSize) {
        document.body.classList.add(`font-size-${settingsMap.fontSize}`);
      }
      
      // Apply healer name
      if (settingsMap.healerName) {
        document.getElementById('healerNameDisplay').textContent = settingsMap.healerName;
      }
      
      // Apply high contrast
      if (settingsMap.highContrast) {
        document.body.classList.add('high-contrast');
      }
    } catch (error) {
      console.warn('Settings load error:', error);
    }
  },
  
  // Setup UI event handlers
  setupUIHandlers() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }
    
    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
    
    // Close sidebar on mobile when clicking outside
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 1024) {
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });
    
    // Theme toggle
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        this.showThemeSelector();
      });
    }
    
    // Global search
    const globalSearchBtn = document.getElementById('globalSearchBtn');
    const searchModal = document.getElementById('search-modal');
    const searchCloseBtn = document.getElementById('searchCloseBtn');
    const globalSearchInput = document.getElementById('globalSearchInput');
    
    if (globalSearchBtn && searchModal) {
      globalSearchBtn.addEventListener('click', () => {
        searchModal.classList.add('active');
        setTimeout(() => globalSearchInput?.focus(), 100);
      });
    }
    
    if (searchCloseBtn && searchModal) {
      searchCloseBtn.addEventListener('click', () => {
        searchModal.classList.remove('active');
      });
    }
    
    // Close search modal on backdrop click
    searchModal?.querySelector('.modal-backdrop')?.addEventListener('click', () => {
      searchModal.classList.remove('active');
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+K for search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchModal?.classList.add('active');
        setTimeout(() => globalSearchInput?.focus(), 100);
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        searchModal?.classList.remove('active');
        this.hideModal();
      }
    });
    
    // Search input handler
    if (globalSearchInput) {
      globalSearchInput.addEventListener('input', Utils.debounce(async (e) => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
          await this.performSearch(query);
        }
      }, 300));
    }
  },
  
  // Register all routes
  registerRoutes() {
    router.on('dashboard', () => Dashboard.render());
    router.on('newcase', () => NewCase.render());
    router.on('patients', () => Patients.render());
    router.on('patient', (params) => PatientDetail.render(params.id));
    router.on('monitor', (params) => PatientMonitor.render(params.id));
    router.on('plans', () => PlansStub.render());
    router.on('groups', () => GroupsStub.render());
    router.on('certificates', () => CertificatesStub.render());
    router.on('calendar', () => CalendarStub.render());
    router.on('library', () => LibraryStub.render());
    router.on('import', () => ImportStub.render());
    router.on('settings', () => Settings.render());
  },
  
  // Toast notifications
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      toast.style.animation = 'fadeIn 0.25s reverse';
      setTimeout(() => toast.remove(), 250);
    }, 4000);
  },
  
  showError(message) {
    this.showToast(message, 'error');
  },
  
  showSuccess(message) {
    this.showToast(message, 'success');
  },
  
  // Modal system
  showModal(content) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
      <div class="modal-backdrop" onclick="App.hideModal()"></div>
      <div class="modal animate-slide-up">
        ${content}
      </div>
    `;
    container.classList.add('active');
  },
  
  hideModal() {
    const container = document.getElementById('modal-container');
    container.classList.remove('active');
    setTimeout(() => {
      container.innerHTML = '';
    }, 250);
  },
  
  // Theme selector
  showThemeSelector() {
    const themes = [
      { id: 'classic-gold', name: 'Classic Gold', icon: '🏆' },
      { id: 'emerald', name: 'Emerald', icon: '💚' },
      { id: 'night', name: 'Night', icon: '🌙' },
      { id: 'royal', name: 'Royal', icon: '👑' },
      { id: 'desert', name: 'Desert', icon: '🏜️' },
      { id: 'pearl', name: 'Pearl', icon: '🔮' },
      { id: 'marine', name: 'Marine', icon: '🌊' },
      { id: 'sage', name: 'Sage', icon: '🌿' },
      { id: 'sky', name: 'Sky', icon: '☁️' },
      { id: 'obsidian', name: 'Obsidian', icon: '⚫' }
    ];
    
    const content = `
      <div class="modal-header">
        <h3 class="modal-title">Выберите тему</h3>
        <button class="modal-close" onclick="App.hideModal()">×</button>
      </div>
      <div class="modal-body">
        <div class="grid grid-3">
          ${themes.map(theme => `
            <button class="btn btn-secondary" onclick="App.setTheme('${theme.id}')" 
                    style="flex-direction: column; gap: 8px; padding: 16px;">
              <span style="font-size: 32px;">${theme.icon}</span>
              <span>${theme.name}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    
    this.showModal(content);
  },
  
  async setTheme(themeId) {
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeId}`);
    
    try {
      await storage.put(STORES.SETTINGS, { key: 'theme', value: themeId });
      this.showSuccess('Тема применена');
    } catch (error) {
      console.error('Theme save error:', error);
    }
    
    this.hideModal();
  },
  
  // Global search
  async performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    
    try {
      const [patients, plans, certificates] = await Promise.all([
        storage.getAll(STORES.PATIENTS),
        storage.getAll(STORES.PLANS),
        storage.getAll(STORES.CERTIFICATES)
      ]);
      
      const results = [];
      
      // Search patients
      patients
        .filter(p => !p.deletedAt && Utils.searchMatch(p.name, query))
        .slice(0, 5)
        .forEach(p => {
          results.push({
            type: 'patient',
            title: p.name,
            subtitle: p.diagnosis?.diagnosis_ru || 'Без диагноза',
            route: `#/patient?id=${p.id}`
          });
        });
      
      // Search plans
      plans
        .filter(p => Utils.searchMatch(p.patientName, query))
        .slice(0, 5)
        .forEach(p => {
          results.push({
            type: 'plan',
            title: `План: ${p.patientName}`,
            subtitle: `${p.daysCompleted}/${p.durationDays} дней`,
            route: `#/plans`
          });
        });
      
      // Render results
      if (results.length > 0) {
        resultsContainer.innerHTML = results.map(r => `
          <div class="search-result-item" onclick="window.location.hash='${r.route}'; App.hideModal();">
            <span style="font-size: 24px;">
              ${r.type === 'patient' ? '👤' : r.type === 'plan' ? '📋' : '📜'}
            </span>
            <div>
              <div style="font-weight: 500;">${r.title}</div>
              <div style="font-size: 13px; color: var(--text-muted);">${r.subtitle}</div>
            </div>
          </div>
        `).join('');
      } else {
        resultsContainer.innerHTML = `
          <div style="padding: 20px; text-align: center; color: var(--text-muted);">
            Ничего не найдено
          </div>
        `;
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  },
  
  // Loading overlay
  showLoading(text = 'Загрузка...') {
    const overlay = document.getElementById('loading-overlay');
    overlay.querySelector('.loading-text').textContent = text;
    overlay.classList.add('active');
  },
  
  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    overlay.classList.remove('active');
  },
  
  // Confirm dialog
  async confirm(message, title = 'Подтверждение') {
    return new Promise((resolve) => {
      const content = `
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="App.hideModal(); arguments[0](false)">Отмена</button>
          <button class="btn btn-danger" onclick="App.hideModal(); arguments[0](true)">Удалить</button>
        </div>
      `;
      
      this.showModal(content);
      
      // Override buttons
      setTimeout(() => {
        const buttons = document.querySelectorAll('.modal-footer button');
        buttons[0].onclick = () => { this.hideModal(); resolve(false); };
        buttons[1].onclick = () => { this.hideModal(); resolve(true); };
      }, 0);
    });
  }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
