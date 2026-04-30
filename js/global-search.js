/**
 * RUKYA PRO - Глобальный поиск и Командная панель (Ctrl+K)
 * Enterprise-уровень поиска по всей базе данных
 */

class GlobalSearch {
  constructor() {
    this.searchIndex = new Map();
    this.isOpen = false;
    this.results = [];
    this.selectedIndex = 0;
    this.debounceTimer = null;
    
    this.init();
  }

  init() {
    // Создаем UI глобального поиска
    this.createSearchUI();
    
    // Глобальная горячая клавиша Ctrl+K / Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Индексируем данные при загрузке
    this.reindex();
  }

  createSearchUI() {
    const html = `
      <div id="global-search-overlay" class="search-overlay hidden">
        <div class="search-modal">
          <div class="search-header">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input 
              type="text" 
              id="global-search-input" 
              placeholder="Поиск пациентов, планов, диагнозов... (Ctrl+K)"
              autocomplete="off"
              autofocus
            />
            <kbd class="search-shortcut">ESC</kbd>
          </div>
          
          <div class="search-tabs">
            <button class="search-tab active" data-type="all">Все</button>
            <button class="search-tab" data-type="patients">Пациенты</button>
            <button class="search-tab" data-type="plans">Планы</button>
            <button class="search-tab" data-type="diagnoses">Диагнозы</button>
            <button class="search-tab" data-type="certificates">Заключения</button>
          </div>
          
          <div class="search-results" id="search-results">
            <div class="search-loading">
              <div class="dot-loader"></div>
              <span>Поиск...</span>
            </div>
          </div>
          
          <div class="search-footer">
            <div class="search-hints">
              <span><kbd>↑↓</kbd> Навигация</span>
              <span><kbd>Enter</kbd> Открыть</span>
              <span><kbd>Ctrl+K</kbd> Закрыть</span>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    
    // Элементы
    this.overlay = document.getElementById('global-search-overlay');
    this.input = document.getElementById('global-search-input');
    this.resultsContainer = document.getElementById('search-results');
    this.tabs = this.overlay.querySelectorAll('.search-tab');
    
    // Обработчики событий
    this.input.addEventListener('input', (e) => this.handleInput(e.target.value));
    
    this.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentType = tab.dataset.type;
        this.handleInput(this.input.value);
      });
    });
    
    // Навигация клавиатурой
    this.overlay.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.results.length - 1);
        this.updateSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        this.updateSelection();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (this.results[this.selectedIndex]) {
          this.selectResult(this.results[this.selectedIndex]);
        }
      }
    });
    
    // Клик вне модального окна закрывает его
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }

  async reindex() {
    console.log('[Search] Переиндексация базы данных...');
    this.searchIndex.clear();
    
    try {
      // Индексация пациентов
      const patients = await window.db?.getAll('patients') || [];
      patients.forEach(patient => {
        if (!patient.deletedAt) {
          this.indexItem({
            id: patient.id,
            type: 'patient',
            title: patient.name,
            subtitle: `${patient.age} лет, ${patient.city || 'Город не указан'}`,
            tags: [patient.diagnosis?.type || 'Без диагноза', ...(patient.tags || [])],
            url: `#/patients?id=${patient.id}`,
            data: patient
          });
        }
      });
      
      // Индексация планов
      const plans = await window.db?.getAll('plans') || [];
      plans.forEach(plan => {
        if (!plan.deletedAt) {
          const patient = plans.find(p => p.id === plan.patientId);
          this.indexItem({
            id: plan.id,
            type: 'plan',
            title: `План: ${patient?.name || 'Неизвестный пациент'}`,
            subtitle: `${plan.duration} дней, ${plan.status}`,
            tags: [plan.programName || 'Без программы'],
            url: `#/plans?id=${plan.id}`,
            data: plan
          });
        }
      });
      
      // Индексация заключений
      const certificates = await window.db?.getAll('certificates') || [];
      certificates.forEach(cert => {
        if (!cert.deletedAt) {
          this.indexItem({
            id: cert.id,
            type: 'certificate',
            title: `Заключение: ${cert.patientName}`,
            subtitle: `От ${new Date(cert.date).toLocaleDateString()}`,
            tags: [cert.diagnosis || 'Без диагноза'],
            url: `#/certificates?id=${cert.id}`,
            data: cert
          });
        }
      });
      
      console.log(`[Search] Проиндексировано ${this.searchIndex.size} записей`);
    } catch (error) {
      console.error('[Search] Ошибка индексации:', error);
    }
  }

  indexItem(item) {
    const key = `${item.type}:${item.id}`;
    this.searchIndex.set(key, item);
    
    // Индексируем по ключевым словам
    const keywords = [
      item.title,
      item.subtitle,
      ...(item.tags || [])
    ].join(' ').toLowerCase().split(/\s+/);
    
    keywords.forEach(keyword => {
      if (keyword.length > 2) {
        if (!this.keywordIndex) this.keywordIndex = new Map();
        if (!this.keywordIndex.has(keyword)) {
          this.keywordIndex.set(keyword, []);
        }
        this.keywordIndex.get(keyword).push(key);
      }
    });
  }

  handleInput(query) {
    clearTimeout(this.debounceTimer);
    
    if (!query.trim()) {
      this.results = [];
      this.renderResults();
      return;
    }
    
    this.debounceTimer = setTimeout(() => {
      this.search(query);
    }, 150);
  }

  search(query) {
    const normalizedQuery = query.toLowerCase().trim();
    const words = normalizedQuery.split(/\s+/);
    const scores = new Map();
    
    // Поиск по точным совпадениям в индексе ключевых слов
    words.forEach(word => {
      if (this.keywordIndex?.has(word)) {
        this.keywordIndex.get(word).forEach(key => {
          scores.set(key, (scores.get(key) || 0) + 1);
        });
      }
    });
    
    // Полнотекстовый поиск по всем элементам
    this.searchIndex.forEach((item, key) => {
      const searchText = `${item.title} ${item.subtitle} ${item.tags.join(' ')}`.toLowerCase();
      
      let score = 0;
      
      // Точное совпадение
      if (searchText.includes(normalizedQuery)) {
        score += 10;
      }
      
      // Совпадение по словам
      words.forEach(word => {
        if (searchText.includes(word)) {
          score += 3;
        }
        
        // Начало слова
        if (item.title.toLowerCase().startsWith(word)) {
          score += 5;
        }
      });
      
      // Бонус за тип
      if (this.currentType !== 'all' && item.type === this.currentType) {
        score += 2;
      }
      
      if (score > 0) {
        scores.set(key, score);
      }
    });
    
    // Сортировка по релевантности
    this.results = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([key]) => this.searchIndex.get(key));
    
    this.selectedIndex = 0;
    this.renderResults();
  }

  renderResults() {
    if (this.results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="search-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="M21 21l-4.35-4.35"></path>
          </svg>
          <p>Ничего не найдено</p>
          <small>Попробуйте изменить запрос</small>
        </div>
      `;
      return;
    }
    
    this.resultsContainer.innerHTML = `
      <ul class="search-list">
        ${this.results.map((item, index) => `
          <li class="search-item ${index === this.selectedIndex ? 'selected' : ''}" 
              data-index="${index}"
              data-id="${item.id}"
              data-type="${item.type}">
            <div class="search-item-icon">
              ${this.getTypeIcon(item.type)}
            </div>
            <div class="search-item-content">
              <div class="search-item-title">${this.highlightMatch(item.title)}</div>
              <div class="search-item-subtitle">${item.subtitle}</div>
              ${item.tags.length > 0 ? `
                <div class="search-item-tags">
                  ${item.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
              ` : ''}
            </div>
            <div class="search-item-action">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"></path>
              </svg>
            </div>
          </li>
        `).join('')}
      </ul>
    `;
    
    // Добавляем обработчики кликов
    this.resultsContainer.querySelectorAll('.search-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.selectResult(this.results[index]);
      });
    });
  }

  updateSelection() {
    this.resultsContainer.querySelectorAll('.search-item').forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
    });
    
    // Прокрутка к выбранному элементу
    const selected = this.resultsContainer.querySelector('.search-item.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }

  selectResult(result) {
    this.close();
    
    // Навигация по URL
    if (result.url) {
      if (window.router) {
        window.router.navigate(result.url.replace('#', ''));
      } else {
        window.location.hash = result.url;
      }
    }
    
    // Событие выбора
    document.dispatchEvent(new CustomEvent('search-result-selected', { detail: result }));
  }

  getTypeIcon(type) {
    const icons = {
      patient: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
      plan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
      diagnosis: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>',
      certificate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-6"></path><path d="M9 15l3 3 3-3"></path></svg>'
    };
    return icons[type] || icons.patient;
  }

  highlightMatch(text) {
    const query = this.input.value.toLowerCase().trim();
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.overlay.classList.remove('hidden');
    this.input.value = '';
    this.input.focus();
    this.results = [];
    this.selectedIndex = 0;
    this.renderResults();
    
    // Переиндексация при открытии (если данные изменились)
    this.reindex();
  }

  close() {
    this.isOpen = false;
    this.overlay.classList.add('hidden');
    this.input.blur();
  }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
  window.globalSearch = new GlobalSearch();
});

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GlobalSearch;
}
