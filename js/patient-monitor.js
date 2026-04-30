/**
 * RUKYA PRO — Мониторинг пациента
 * Ash-Shifa · Абу Мухаммад
 */

const PatientMonitor = {
  // 15 быстрых знаков для мониторинга
  symptoms: [
    { id: 'nightmares', label: 'Кошмары', icon: '😱', description: 'Страшные сны, кошмары' },
    { id: 'chest_pain', label: 'Боль в груди', icon: '💔', description: 'Давление, боль в грудной клетке' },
    { id: 'headache', label: 'Головная боль', icon: '🤕', description: 'Головные боли, мигрени' },
    { id: 'fear', label: 'Страх/паника', icon: '😨', description: 'Приступы страха, панические атаки' },
    { id: 'irritation', label: 'Раздражение', icon: '😤', description: 'Раздражительность, гнев' },
    { id: 'waswasa', label: 'Васваса', icon: '🌀', description: 'Навязчивые мысли, сомнения' },
    { id: 'weakness', label: 'Слабость', icon: '😫', description: 'Общая слабость, утомляемость' },
    { id: 'appetite', label: 'Потеря аппетита', icon: '🍽️', description: 'Отсутствие аппетита, тошнота' },
    { id: 'insomnia', label: 'Бессонница', icon: '🌙', description: 'Трудности со сном' },
    { id: 'prayer_difficulty', label: 'Трудно молиться', icon: '🕌', description: 'Тяжесть в поклонении' },
    { id: 'quran_reaction', label: 'Реакция на Коран', icon: '📖', description: 'Физическая реакция при чтении' },
    { id: 'voice_change', label: 'Изменение голоса', icon: '🎤', description: 'Изменение тона, хрипота' },
    { id: 'back_pain', label: 'Боль в спине', icon: '🦴', description: 'Боль в спине, особенно между лопаток' },
    { id: 'abdomen_pain', label: 'Боль в животе', icon: '🤢', description: 'Боль, вздутие живота' },
    { id: 'cold_limbs', label: 'Холодные конечности', icon: '🧊', description: 'Холод в руках и ногах' }
  ],

  // Статусы симптома
  statusCycle: ['inactive', 'active', 'improved'],
  statusLabels: {
    inactive: { text: '—', class: 'secondary' },
    active: { text: 'Активно', class: 'danger' },
    improved: { text: 'Улучшилось', class: 'warning' }
  },

  /**
   * Рендер страницы мониторинга
   */
  async render(patientId) {
    const container = document.getElementById('page-container');
    
    try {
      const patient = await storage.get(STORES.PATIENTS, patientId);
      if (!patient) {
        container.innerHTML = '<div class="card"><p class="text-danger">Пациент не найден</p></div>';
        return;
      }

      const plan = patient.planId ? await storage.get(STORES.PLANS, patient.planId) : null;
      const sessions = await this.getSessions(patientId);
      const monitoring = patient.monitoring || {};

      container.innerHTML = `
        <div class="animate-fade-in">
          <!-- Заголовок -->
          <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-xl); flex-wrap: wrap; gap: var(--spacing-md);">
            <div>
              <button class="btn btn-secondary btn-sm" onclick="router.navigate('patient', {id: '${patient.id}'})" style="margin-right: var(--spacing-md);">
                ← Назад
              </button>
              <span style="font-size: var(--font-size-xl); font-weight: 600;">${patient.name}</span>
            </div>
            <div class="flex gap-md">
              <button class="btn btn-primary" onclick="PatientMonitor.addSession('${patient.id}')">
                ➕ Добавить сеанс
              </button>
              <button class="btn btn-secondary" onclick="PatientMonitor.showHistory('${patient.id}')">
                📜 История
              </button>
            </div>
          </div>

          <!-- Прогресс лечения -->
          ${plan ? `
            <div class="card" style="margin-bottom: var(--spacing-xl);">
              <div class="card-header">
                <h3 class="card-title">Прогресс лечения</h3>
                <span class="badge badge-${plan.status === 'active' ? 'success' : 'warning'}">
                  ${plan.status === 'active' ? 'Активен' : plan.status}
                </span>
              </div>
              <div style="margin-top: var(--spacing-lg);">
                <div class="progress" style="height: 16px; margin-bottom: var(--spacing-md);">
                  <div class="progress-bar" style="width: ${Math.round((plan.daysCompleted / plan.durationDays) * 100)}%"></div>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted">День ${plan.daysCompleted} из ${plan.durationDays}</span>
                  <span class="text-muted">${Math.round((plan.daysCompleted / plan.durationDays) * 100)}%</span>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Мониторинг симптомов -->
          <div class="card" style="margin-bottom: var(--spacing-xl);">
            <div class="card-header">
              <h3 class="card-title">Мониторинг симптомов</h3>
              <small class="text-muted">Нажмите на симптом для переключения статуса</small>
            </div>
            <div class="checkbox-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
              ${this.symptoms.map(s => {
                const status = monitoring[s.id] || 'inactive';
                const statusInfo = this.statusLabels[status];
                return `
                  <label class="symptom-card" data-symptom="${s.id}" onclick="PatientMonitor.toggleSymptom('${patient.id}', '${s.id}')">
                    <div class="symptom-icon">${s.icon}</div>
                    <div class="symptom-info">
                      <div class="symptom-name">${s.label}</div>
                      <div class="symptom-desc">${s.description}</div>
                    </div>
                    <span class="badge badge-${statusInfo.class}" style="margin-left: auto;">
                      ${statusInfo.text}
                    </span>
                  </label>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Статистика симптомов -->
          <div class="card" style="margin-bottom: var(--spacing-xl);">
            <div class="card-header">
              <h3 class="card-title">Статистика</h3>
            </div>
            <div class="grid grid-4" style="margin-top: var(--spacing-lg);">
              ${this.getSymptomStats(monitoring)}
            </div>
          </div>

          <!-- Последние сеансы -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Последние сеансы</h3>
              <button class="btn btn-sm btn-primary" onclick="PatientMonitor.addSession('${patient.id}')">
                + Сеанс
              </button>
            </div>
            ${sessions.length > 0 ? `
              <div style="max-height: 400px; overflow-y: auto;">
                ${sessions.slice(0, 5).map(session => `
                  <div class="session-item" onclick="PatientMonitor.viewSession('${patient.id}', '${session.id}')">
                    <div class="session-date">${Utils.formatDate(session.date)}</div>
                    <div class="session-formulas">${session.formulas?.length || 0} формул</div>
                    ${session.notes ? `<div class="session-notes">${session.notes.substring(0, 100)}${session.notes.length > 100 ? '...' : ''}</div>` : ''}
                    ${session.progressDelta ? `<div class="badge badge-success">+${session.progressDelta}%</div>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : `
              <div style="padding: 40px; text-align: center;" class="text-muted">
                <p style="font-size: 48px; margin-bottom: 16px;">📝</p>
                <p>Сеансов ещё не было</p>
                <button class="btn btn-primary" style="margin-top: var(--spacing-md);" onclick="PatientMonitor.addSession('${patient.id}')">
                  Добавить первый сеанс
                </button>
              </div>
            `}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Monitor render error:', error);
      container.innerHTML = '<div class="card"><p class="text-danger">Ошибка загрузки</p></div>';
    }
  },

  /**
   * Переключение статуса симптома
   */
  async toggleSymptom(patientId, symptomId) {
    try {
      const patient = await storage.get(STORES.PATIENTS, patientId);
      const monitoring = patient.monitoring || {};
      const currentStatus = monitoring[symptomId] || 'inactive';

      // Цикл: inactive -> active -> improved -> inactive
      const currentIndex = this.statusCycle.indexOf(currentStatus);
      const nextIndex = (currentIndex + 1) % this.statusCycle.length;
      const nextStatus = this.statusCycle[nextIndex];

      monitoring[symptomId] = nextStatus;
      patient.monitoring = monitoring;
      patient.updatedAt = new Date().toISOString();

      await storage.put(STORES.PATIENTS, patient);
      
      // Перерисовка
      this.render(patientId);

      const statusLabel = this.statusLabels[nextStatus].text;
      const symptom = this.symptoms.find(s => s.id === symptomId);
      App.showToast(`${symptom.label}: ${statusLabel}`);
    } catch (error) {
      App.showError('Ошибка обновления симптома');
      console.error(error);
    }
  },

  /**
   * Получение статистики симптомов
   */
  getSymptomStats(monitoring) {
    const stats = {
      active: 0,
      improved: 0,
      inactive: 0,
      total: this.symptoms.length
    };

    Object.values(monitoring).forEach(status => {
      if (stats[status] !== undefined) stats[status]++;
    });

    stats.inactive = stats.total - stats.active - stats.improved;

    const improvementRate = stats.active + stats.improved > 0 
      ? Math.round((stats.improved / (stats.active + stats.improved)) * 100) 
      : 0;

    return `
      <div class="stat-card">
        <div class="stat-value" style="color: var(--color-danger);">${stats.active}</div>
        <div class="stat-label">Активных</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--color-warning);">${stats.improved}</div>
        <div class="stat-label">Улучшилось</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--color-muted);">${stats.inactive}</div>
        <div class="stat-label">Нет симптома</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: var(--color-success);">${improvementRate}%</div>
        <div class="stat-label">Улучшение</div>
      </div>
    `;
  },

  /**
   * Добавление нового сеанса
   */
  async addSession(patientId) {
    const patient = await storage.get(STORES.PATIENTS, patientId);
    const plan = patient.planId ? await storage.get(STORES.PLANS, patient.planId) : null;

    const modalContent = `
      <div class="form-group">
        <label class="form-label">Дата сеанса</label>
        <input type="date" id="sessionDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
      </div>
      ${plan ? `
        <div class="form-group">
          <label class="form-label">Выполненные формулы</label>
          <div style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px; padding: var(--spacing-md);">
            ${plan.dailySchedule?.[plan.daysCompleted]?.formulas?.map((f, idx) => `
              <label class="checkbox-item" style="margin-bottom: 8px;">
                <input type="checkbox" name="formula" value="${idx}" checked>
                <span>${f.name || f.templateId}</span>
                <small class="text-muted">×${f.repeats}</small>
              </label>
            `).join('') || '<p class="text-muted">Нет формул на сегодня</p>'}
          </div>
        </div>
      ` : ''}
      <div class="form-group">
        <label class="form-label">Заметки</label>
        <textarea id="sessionNotes" class="form-control" rows="4" placeholder="Реакции, наблюдения, рекомендации..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Прогресс (дельта %)</label>
        <input type="number" id="sessionProgress" class="form-control" placeholder="Например: 5" step="1">
        <small class="text-muted">Насколько пациенту стало лучше после сеанса</small>
      </div>
    `;

    App.showModal({
      title: 'Новый сеанс',
      content: modalContent,
      onConfirm: async () => {
        const date = document.getElementById('sessionDate').value;
        const notes = document.getElementById('sessionNotes').value.trim();
        const progressDelta = parseInt(document.getElementById('sessionProgress').value) || 0;
        
        const selectedFormulas = Array.from(document.querySelectorAll('input[name="formula"]:checked'))
          .map(input => parseInt(input.value));

        const session = {
          id: Utils.generateId(),
          patientId,
          date: date || new Date().toISOString(),
          formulas: selectedFormulas,
          notes,
          progressDelta,
          createdAt: new Date().toISOString()
        };

        try {
          // Сохранение сеанса
          let sessions = await this.getSessions(patientId);
          sessions.unshift(session); // Добавляем в начало
          
          // Обновляем историю сеансов в пациенте (до 100 последних)
          patient.sessionHistory = sessions.slice(0, 100);
          patient.updatedAt = new Date().toISOString();
          await storage.put(STORES.PATIENTS, patient);

          // Обновляем прогресс плана
          if (plan) {
            plan.daysCompleted = Math.min(plan.durationDays, plan.daysCompleted + 1);
            if (plan.daysCompleted >= plan.durationDays) {
              plan.status = 'completed';
            }
            await storage.put(STORES.PLANS, plan);
          }

          App.showSuccess('Сеанс сохранён');
          this.render(patientId);
        } catch (error) {
          App.showError('Ошибка сохранения сеанса');
          console.error(error);
        }
      }
    });
  },

  /**
   * Получение истории сеансов
   */
  async getSessions(patientId) {
    try {
      const patient = await storage.get(STORES.PATIENTS, patientId);
      return patient.sessionHistory || [];
    } catch (error) {
      console.error('Get sessions error:', error);
      return [];
    }
  },

  /**
   * Просмотр деталей сеанса
   */
  async viewSession(patientId, sessionId) {
    const sessions = await this.getSessions(patientId);
    const session = sessions.find(s => s.id === sessionId);

    if (!session) {
      App.showError('Сеанс не найден');
      return;
    }

    const patient = await storage.get(STORES.PATIENTS, patientId);
    const plan = patient.planId ? await storage.get(STORES.PLANS, patient.planId) : null;

    const formulasList = session.formulas?.map(idx => {
      const formula = plan?.dailySchedule?.[plan.daysCompleted - session.formulas.indexOf(idx)]?.formulas?.[idx];
      return formula ? `
        <div class="formula-item">
          <strong>${formula.name || formula.templateId}</strong>
          <div class="text-muted">×${formula.repeats} повторов</div>
          ${formula.arabic ? `<div class="arabic-text" style="margin-top: 4px;">${formula.arabic}</div>` : ''}
        </div>
      ` : `<div class="formula-item">Формула #${idx}</div>`;
    }).join('') || '<p class="text-muted">Нет формул</p>';

    App.showModal({
      title: `Сеанс от ${Utils.formatDate(session.date)}`,
      content: `
        <div style="max-height: 500px; overflow-y: auto;">
          <div class="form-group">
            <label class="form-label">Дата</label>
            <p>${Utils.formatDate(session.date)}</p>
          </div>
          <div class="form-group">
            <label class="form-label">Формулы</label>
            <div style="max-height: 300px; overflow-y: auto;">
              ${formulasList}
            </div>
          </div>
          ${session.notes ? `
            <div class="form-group">
              <label class="form-label">Заметки</label>
              <p>${session.notes}</p>
            </div>
          ` : ''}
          ${session.progressDelta ? `
            <div class="form-group">
              <label class="form-label">Прогресс</label>
              <div class="badge badge-success">+${session.progressDelta}%</div>
            </div>
          ` : ''}
        </div>
      `,
      showCancel: false,
      confirmText: 'Закрыть'
    });
  },

  /**
   * Показать историю сеансов
   */
  async showHistory(patientId) {
    const sessions = await this.getSessions(patientId);

    if (sessions.length === 0) {
      App.showToast('История пуста');
      return;
    }

    const historyHtml = sessions.map((session, index) => `
      <div class="history-item" onclick="PatientMonitor.viewSession('${patientId}', '${session.id}')">
        <div class="history-index">${index + 1}</div>
        <div class="history-content">
          <div class="history-date">${Utils.formatDate(session.date)}</div>
          <div class="history-details">
            <span>${session.formulas?.length || 0} формул</span>
            ${session.progressDelta ? `<span class="badge badge-success" style="margin-left: 8px;">+${session.progressDelta}%</span>` : ''}
          </div>
          ${session.notes ? `<div class="history-notes">${session.notes.substring(0, 80)}${session.notes.length > 80 ? '...' : ''}</div>` : ''}
        </div>
      </div>
    `).join('');

    App.showModal({
      title: `История сеансов (${sessions.length})`,
      content: `<div style="max-height: 600px; overflow-y: auto;">${historyHtml}</div>`,
      showCancel: false,
      confirmText: 'Закрыть'
    });
  },

  /**
   * Экспорт мониторинга в PNG
   */
  async exportToPng(patientId) {
    App.showToast('Экспорт в PNG (в разработке)');
    // Здесь будет интеграция с html2canvas
  },

  /**
   * Печать отчёта мониторинга
   */
  async printReport(patientId) {
    const patient = await storage.get(STORES.PATIENTS, patientId);
    const sessions = await this.getSessions(patientId);
    const monitoring = patient.monitoring || {};

    const activeSymptoms = this.symptoms.filter(s => monitoring[s.id] === 'active');
    const improvedSymptoms = this.symptoms.filter(s => monitoring[s.id] === 'improved');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Мониторинг пациента — ${patient.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #333; }
          .section { margin-bottom: 30px; }
          .symptom-list { list-style: none; padding: 0; }
          .symptom-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <h1>Мониторинг пациента</h1>
        <p><strong>Имя:</strong> ${patient.name}</p>
        <p><strong>Дата отчёта:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
        
        <div class="section">
          <h2>Активные симптомы</h2>
          ${activeSymptoms.length > 0 ? `
            <ul class="symptom-list">
              ${activeSymptoms.map(s => `<li>${s.icon} ${s.label}</li>`).join('')}
            </ul>
          ` : '<p>Нет активных симптомов</p>'}
        </div>
        
        <div class="section">
          <h2>Улучшившиеся симптомы</h2>
          ${improvedSymptoms.length > 0 ? `
            <ul class="symptom-list">
              ${improvedSymptoms.map(s => `<li>${s.icon} ${s.label}</li>`).join('')}
            </ul>
          ` : '<p>Пока нет улучшений</p>'}
        </div>
        
        <div class="section">
          <h2>История сеансов (${sessions.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Формулы</th>
                <th>Прогресс</th>
                <th>Заметки</th>
              </tr>
            </thead>
            <tbody>
              ${sessions.slice(0, 20).map(s => `
                <tr>
                  <td>${new Date(s.date).toLocaleDateString('ru-RU')}</td>
                  <td>${s.formulas?.length || 0}</td>
                  <td>${s.progressDelta ? '+' + s.progressDelta + '%' : '—'}</td>
                  <td>${s.notes ? s.notes.substring(0, 50) : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PatientMonitor;
}
