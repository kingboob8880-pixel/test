/**
 * RUKYA PRO — Настройки
 * Ash-Shifa · Абу Мухаммад
 */

const Settings = {
  async render() {
    const container = document.getElementById('page-container');
    
    // Load current settings
    const settings = await storage.getAll(STORES.SETTINGS);
    const settingsMap = {};
    settings.forEach(s => settingsMap[s.key] = s.value);
    
    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 800px; margin: 0 auto;">
        <div class="card">
          <h2 class="card-title">API настройки</h2>
          <div class="form-group">
            <label class="form-label">DeepSeek API ключ</label>
            <input type="password" id="deepseekApiKey" class="form-control" 
                   value="${settingsMap.deepseekApiKey || ''}" 
                   placeholder="sk-...">
            <small class="text-muted">Необходим для AI-диагностики</small>
          </div>
          <button class="btn btn-primary" onclick="Settings.saveApiKey()">
            💾 Сохранить ключ
          </button>
        </div>
        
        <div class="card" style="margin-top: var(--spacing-xl);">
          <h2 class="card-title">Оформление</h2>
          
          <div class="form-group">
            <label class="form-label">Тема оформления</label>
            <select id="themeSelect" class="form-control" onchange="Settings.changeTheme(this.value)">
              <option value="classic-gold" ${settingsMap.theme === 'classic-gold' ? 'selected' : ''}>Classic Gold 🏆</option>
              <option value="emerald" ${settingsMap.theme === 'emerald' ? 'selected' : ''}>Emerald 💚</option>
              <option value="night" ${settingsMap.theme === 'night' ? 'selected' : ''}>Night 🌙</option>
              <option value="royal" ${settingsMap.theme === 'royal' ? 'selected' : ''}>Royal 👑</option>
              <option value="desert" ${settingsMap.theme === 'desert' ? 'selected' : ''}>Desert 🏜️</option>
              <option value="pearl" ${settingsMap.theme === 'pearl' ? 'selected' : ''}>Pearl 🔮</option>
              <option value="marine" ${settingsMap.theme === 'marine' ? 'selected' : ''}>Marine 🌊</option>
              <option value="sage" ${settingsMap.theme === 'sage' ? 'selected' : ''}>Sage 🌿</option>
              <option value="sky" ${settingsMap.theme === 'sky' ? 'selected' : ''}>Sky ☁️</option>
              <option value="obsidian" ${settingsMap.theme === 'obsidian' ? 'selected' : ''}>Obsidian ⚫</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Плотность интерфейса</label>
            <div class="flex gap-md">
              <button class="btn ${settingsMap.density !== 'compact' ? 'btn-primary' : 'btn-secondary'}" 
                      onclick="Settings.setDensity('comfort')">Comfort</button>
              <button class="btn ${settingsMap.density === 'compact' ? 'btn-primary' : 'btn-secondary'}" 
                      onclick="Settings.setDensity('compact')">Compact</button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Размер шрифта</label>
            <div class="flex gap-sm items-center">
              <button class="btn btn-sm btn-secondary" onclick="Settings.setFontSize('xs')">A−</button>
              <span id="fontSizeDisplay">${settingsMap.fontSize || 'base'}</span>
              <button class="btn btn-sm btn-secondary" onclick="Settings.setFontSize('xl')">A+</button>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" id="highContrast" ${settingsMap.highContrast ? 'checked' : ''} 
                     onchange="Settings.setHighContrast(this.checked)">
              <span>Высокий контраст</span>
            </label>
          </div>
        </div>
        
        <div class="card" style="margin-top: var(--spacing-xl);">
          <h2 class="card-title">Профиль</h2>
          <div class="form-group">
            <label class="form-label">Имя лекаря (для заключений)</label>
            <input type="text" id="healerName" class="form-control" 
                   value="${settingsMap.healerName || 'Абу Мухаммад'}" 
                   placeholder="Ваше имя">
          </div>
          <button class="btn btn-primary" onclick="Settings.saveHealerName()">
            💾 Сохранить
          </button>
        </div>
        
        <div class="card" style="margin-top: var(--spacing-xl);">
          <h2 class="card-title">Данные</h2>
          <div class="flex gap-md" style="flex-wrap: wrap;">
            <button class="btn btn-secondary" onclick="Settings.exportData()">
              📤 Экспорт базы
            </button>
            <button class="btn btn-secondary" onclick="document.getElementById('importFile').click()">
              📥 Импорт базы
            </button>
            <input type="file" id="importFile" style="display: none;" accept=".json" 
                   onchange="Settings.importData(this)">
            <button class="btn btn-danger" onclick="Settings.clearAllData()">
              🗑️ Очистить всё
            </button>
          </div>
        </div>
        
        <div class="card" style="margin-top: var(--spacing-xl);">
          <h2 class="card-title">О приложении</h2>
          <p><strong>RUKYA PRO</strong> v1.0.0</p>
          <p class="text-muted">Ash-Shifa · Абу Мухаммад</p>
          <p class="text-muted">Профессиональная PWA-система для специалистов по рукье</p>
        </div>
      </div>
    `;
  },
  
  async saveApiKey() {
    const apiKey = document.getElementById('deepseekApiKey').value.trim();
    if (!apiKey) {
      App.showError('Введите API ключ');
      return;
    }
    
    try {
      await storage.put(STORES.SETTINGS, { key: 'deepseekApiKey', value: apiKey });
      App.showSuccess('API ключ сохранён');
    } catch (error) {
      App.showError('Ошибка сохранения');
    }
  },
  
  async changeTheme(theme) {
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme}`);
    
    try {
      await storage.put(STORES.SETTINGS, { key: 'theme', value: theme });
      App.showSuccess('Тема применена');
    } catch (error) {
      console.error('Theme save error:', error);
    }
  },
  
  async setDensity(density) {
    document.body.className = document.body.className.replace(/density-\w+/g, '');
    document.body.classList.add(`density-${density}`);
    
    try {
      await storage.put(STORES.SETTINGS, { key: 'density', value: density });
      App.showSuccess('Плотность изменена');
    } catch (error) {
      console.error('Density save error:', error);
    }
  },
  
  async setFontSize(size) {
    const sizes = ['xs', 'sm', 'base', 'lg', 'xl'];
    const currentIndex = sizes.indexOf(document.body.className.match(/font-size-(\w+)/)?.[1] || 'base');
    const newIndex = size === 'xl' ? Math.min(sizes.length - 1, currentIndex + 1) : Math.max(0, currentIndex - 1);
    const newSize = sizes[newIndex];
    
    document.body.className = document.body.className.replace(/font-size-\w+/g, '');
    document.body.classList.add(`font-size-${newSize}`);
    
    document.getElementById('fontSizeDisplay').textContent = newSize;
    
    try {
      await storage.put(STORES.SETTINGS, { key: 'fontSize', value: newSize });
    } catch (error) {
      console.error('Font size save error:', error);
    }
  },
  
  async setHighContrast(enabled) {
    if (enabled) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    try {
      await storage.put(STORES.SETTINGS, { key: 'highContrast', value: enabled });
    } catch (error) {
      console.error('High contrast save error:', error);
    }
  },
  
  async saveHealerName() {
    const name = document.getElementById('healerName').value.trim();
    if (!name) {
      App.showError('Введите имя');
      return;
    }
    
    try {
      await storage.put(STORES.SETTINGS, { key: 'healerName', value: name });
      document.getElementById('healerNameDisplay').textContent = name;
      App.showSuccess('Имя сохранено');
    } catch (error) {
      App.showError('Ошибка сохранения');
    }
  },
  
  async exportData() {
    try {
      App.showLoading('Экспорт данных...');
      const data = await storage.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rukya-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      App.showSuccess('Данные экспортированы');
    } catch (error) {
      App.showError('Ошибка экспорта');
    } finally {
      App.hideLoading();
    }
  },
  
  async importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    try {
      App.showLoading('Импорт данных...');
      const text = await Utils.readFileAsText(file);
      const data = JSON.parse(text);
      await storage.importAll(data);
      App.showSuccess('Данные импортированы');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      App.showError('Ошибка импорта: ' + error.message);
    } finally {
      App.hideLoading();
    }
  },
  
  async clearAllData() {
    if (!await App.confirm('Все данные будут безвозвратно удалены. Продолжить?', 'Очистка базы')) {
      return;
    }
    
    try {
      await storage.clearAll();
      App.showSuccess('База очищена');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      App.showError('Ошибка очистки');
    }
  }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Settings;
}
