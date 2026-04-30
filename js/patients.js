/**
 * RUKYA PRO — Управление пациентами
 * Ash-Shifa · Абу Мухаммад
 */

const Patients = {
  async render() {
    const container = document.getElementById('page-container');
    container.innerHTML = this.renderLoading();
    
    try {
      const [patients, groups] = await Promise.all([
        storage.getAll(STORES.PATIENTS),
        storage.getAll(STORES.GROUPS)
      ]);
      
      // Filter out deleted and archived
      const activePatients = patients.filter(p => !p.deletedAt && !p.archivedAt);
      
      container.innerHTML = `
        <div class="animate-fade-in">
          <!-- Header Actions -->
          <div class="flex justify-between items-center" style="margin-bottom: var(--spacing-xl); flex-wrap: wrap; gap: var(--spacing-md);">
            <div class="flex gap-md" style="flex-wrap: wrap;">
              <input type="text" id="patientSearch" class="form-control" 
                     placeholder="Поиск пациентов..." 
                     oninput="Patients.filterList()">
              <select id="statusFilter" class="form-control" onchange="Patients.filterList()">
                <option value="">Все статусы</option>
                <option value="active">Активные</option>
                <option value="paused">На паузе</option>
                <option value="completed">Завершённые</option>
              </select>
              <select id="groupFilter" class="form-control" onchange="Patients.filterList()">
                <option value="">Все группы</option>
                ${groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}
              </select>
            </div>
            <button class="btn btn-primary" onclick="router.navigate('newcase')">
              ➕ Новый пациент
            </button>
          </div>
          
          <!-- Patients List -->
          <div id="patientsList" class="grid">
            ${this.renderPatientsList(activePatients)}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Patients render error:', error);
      container.innerHTML = '<div class="card"><p class="text-danger">Ошибка загрузки</p></div>';
    }
  },
  
  renderPatientsList(patients) {
    if (patients.length === 0) {
      return `
        <div class="card" style="text-align: center; padding: 60px;">
          <p style="font-size: 48px; margin-bottom: 16px;">👥</p>
          <p class="text-muted">Пациенты не найдены</p>
        </div>
      `;
    }
    
    return patients.map(patient => `
      <div class="patient-card" onclick="router.navigate('patient', {id: '${patient.id}'})">
        <div class="patient-avatar">${patient.name.charAt(0).toUpperCase()}</div>
        <div class="patient-info">
          <h3 class="patient-name">${patient.name}</h3>
          <div class="patient-meta">
            <span class="badge badge-primary">${patient.age} лет</span>
            <span class="badge badge-info">${patient.gender === 'male' ? 'М' : 'Ж'}</span>
            ${patient.city ? `<span class="badge badge-secondary">${patient.city}</span>` : ''}
            ${patient.group ? `<span class="badge badge-warning">${patient.group}</span>` : ''}
          </div>
          <p class="patient-diagnosis">${patient.diagnosis?.diagnosis_ru || 'Диагноз не установлен'}</p>
          <div class="flex gap-sm items-center">
            <span class="badge badge-${patient.status === 'active' ? 'success' : patient.status === 'paused' ? 'warning' : 'secondary'}">
              ${patient.status === 'active' ? 'Активный' : patient.status === 'paused' ? 'Пауза' : 'Завершён'}
            </span>
            ${patient.nextVisit ? `<small class="text-muted">След. визит: ${Utils.formatDate(patient.nextVisit)}</small>` : ''}
          </div>
        </div>
        <div class="patient-actions">
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); router.navigate('patient', {id: '${patient.id}'})">
            Открыть
          </button>
        </div>
      </div>
    `).join('');
  },
  
  renderLoading() {
    return `
      <div class="grid">
        ${Array(3).fill('<div class="patient-card skeleton" style="height: 200px;"></div>').join('')}
      </div>
    `;
  },
  
  filterList() {
    const search = document.getElementById('patientSearch').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const group = document.getElementById('groupFilter').value;
    
    // Re-render with filters would go here
    // For now, simple implementation
  }
};

// Patient Detail View
const PatientDetail = {
  async render(patientId) {
    const container = document.getElementById('page-container');
    container.innerHTML = '<div class="loading-overlay active"><div class="dot-loader"><span></span><span></span><span></span></div></div>';
    
    try {
      const patient = await storage.get(STORES.PATIENTS, patientId);
      if (!patient) {
        container.innerHTML = '<div class="card"><p class="text-danger">Пациент не найден</p></div>';
        return;
      }
      
      const plan = await storage.get(STORES.PLANS, patient.planId);
      
      container.innerHTML = `
        <div class="animate-fade-in">
          <!-- Back Button -->
          <button class="btn btn-secondary btn-sm" onclick="router.navigate('patients')" style="margin-bottom: var(--spacing-lg);">
            ← Назад к списку
          </button>
          
          <!-- Patient Info Card -->
          <div class="card" style="margin-bottom: var(--spacing-xl);">
            <div class="flex gap-lg items-center">
              <div class="patient-avatar" style="width: 100px; height: 100px; font-size: 40px;">
                ${patient.name.charAt(0).toUpperCase()}
              </div>
              <div class="flex-1">
                <h2 style="font-size: var(--font-size-2xl); margin-bottom: var(--spacing-sm);">${patient.name}</h2>
                <div class="flex gap-md" style="flex-wrap: wrap;">
                  <span class="badge badge-primary">${patient.age} лет</span>
                  <span class="badge badge-info">${patient.gender === 'male' ? 'Мужской' : 'Женский'}</span>
                  ${patient.phone ? `<span class="badge badge-secondary">📞 ${patient.phone}</span>` : ''}
                  ${patient.city ? `<span class="badge badge-secondary">📍 ${patient.city}</span>` : ''}
                </div>
              </div>
              <div class="flex gap-sm">
                <button class="btn btn-primary" onclick="PatientDetail.editPatient('${patient.id}')">✏️</button>
                <button class="btn btn-danger" onclick="PatientDetail.deletePatient('${patient.id}')">🗑️</button>
              </div>
            </div>
            
            <div style="margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--border-color);">
              <h3 style="margin-bottom: var(--spacing-md);">Диагноз</h3>
              <div class="flex gap-md" style="flex-wrap: wrap;">
                ${(patient.diagnosis?.illnesses || []).map(i => 
                  `<span class="chip active">${i.name_ru || i.id}</span>`
                ).join('') || '<span class="text-muted">Не установлен</span>'}
              </div>
              ${patient.diagnosis?.severity ? `
                <div style="margin-top: var(--spacing-md);">
                  <strong>Тяжесть:</strong> ${'★'.repeat(patient.diagnosis.severity)}${'☆'.repeat(5 - patient.diagnosis.severity)}
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Treatment Plan -->
          ${plan ? `
            <div class="card" style="margin-bottom: var(--spacing-xl);">
              <div class="card-header">
                <h3 class="card-title">План лечения</h3>
                <span class="badge badge-${plan.status === 'active' ? 'success' : 'warning'}">
                  ${plan.status === 'active' ? 'Активен' : plan.status}
                </span>
              </div>
              <div class="flex gap-lg items-center" style="margin-bottom: var(--spacing-lg);">
                <div style="flex: 1;">
                  <div class="progress" style="height: 12px;">
                    <div class="progress-bar" style="width: ${Math.round((plan.daysCompleted / plan.durationDays) * 100)}%"></div>
                  </div>
                  <small class="text-muted">${plan.daysCompleted}/${plan.durationDays} дней (${Math.round((plan.daysCompleted / plan.durationDays) * 100)}%)</small>
                </div>
                <button class="btn btn-primary" onclick="router.navigate('plans')">
                  📋 Открыть план
                </button>
              </div>
              <div class="flex gap-md" style="margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--border-color);">
                <button class="btn btn-success" onclick="router.navigate('monitor', {id: '${patient.id}'})">
                  📊 Мониторинг
                </button>
                <button class="btn btn-secondary" onclick="PatientDetail.printCard('${patient.id}')">
                  🖨️ Печать карточки
                </button>
              </div>
            </div>
          ` : `
            <div class="card" style="margin-bottom: var(--spacing-xl); text-align: center; padding: 40px;">
              <p class="text-muted" style="margin-bottom: var(--spacing-md);">План лечения не создан</p>
              <button class="btn btn-primary" onclick="router.navigate('newcase')">
                ➕ Создать план
              </button>
            </div>
          `}
          
          <!-- Monitoring & History Tabs -->
          <div class="card">
            <div class="tabs">
              <button class="tab active" onclick="PatientDetail.showTab('monitoring')">Мониторинг</button>
              <button class="tab" onclick="PatientDetail.showTab('sessions')">Сеансы</button>
              <button class="tab" onclick="PatientDetail.showTab('questionnaires')">Анкеты</button>
              <button class="tab" onclick="PatientDetail.showTab('history')">История</button>
            </div>
            <div id="patientTabContent">
              ${this.renderMonitoring(patient)}
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Patient detail render error:', error);
      container.innerHTML = '<div class="card"><p class="text-danger">Ошибка загрузки</p></div>';
    }
  },
  
  renderMonitoring(patient) {
    const symptoms = [
      { id: 'nightmares', label: 'Кошмары', icon: '😱' },
      { id: 'chest_pain', label: 'Боль в груди', icon: '💔' },
      { id: 'headache', label: 'Головная боль', icon: '🤕' },
      { id: 'fear', label: 'Страх/паника', icon: '😨' },
      { id: 'irritation', label: 'Раздражение', icon: '😤' },
      { id: 'waswasa', label: 'Васваса', icon: '🌀' },
      { id: 'weakness', label: 'Слабость', icon: '😫' },
      { id: 'appetite', label: 'Потеря аппетита', icon: '🍽️' },
      { id: 'insomnia', label: 'Бессонница', icon: '🌙' },
      { id: 'prayer_difficulty', label: 'Трудно молиться', icon: '🕌' },
      { id: 'quran_reaction', label: 'Реакция на Коран', icon: '📖' },
      { id: 'voice_change', label: 'Изменение голоса', icon: '🎤' },
      { id: 'back_pain', label: 'Боль в спине', icon: '🦴' },
      { id: 'abdomen_pain', label: 'Боль в животе', icon: '🤢' },
      { id: 'cold_limbs', label: 'Холодные конечности', icon: '🧊' }
    ];
    
    const monitoring = patient.monitoring || {};
    
    return `
      <div class="checkbox-grid">
        ${symptoms.map(s => {
          const status = monitoring[s.id] || 'inactive';
          const statusClass = status === 'active' ? 'active' : status === 'improved' ? 'improved' : '';
          return `
            <label class="checkbox-item symptom-toggle" data-symptom="${s.id}" onclick="PatientDetail.toggleSymptom('${patient.id}', '${s.id}')">
              <span style="font-size: 20px;">${s.icon}</span>
              <span>${s.label}</span>
              <span class="badge badge-${status === 'active' ? 'danger' : status === 'improved' ? 'warning' : 'secondary'}" 
                    style="margin-left: auto;">
                ${status === 'active' ? 'Активно' : status === 'improved' ? 'Улучшилось' : '—'}
              </span>
            </label>
          `;
        }).join('')}
      </div>
    `;
  },
  
  async toggleSymptom(patientId, symptomId) {
    const patient = await storage.get(STORES.PATIENTS, patientId);
    const monitoring = patient.monitoring || {};
    const currentStatus = monitoring[symptomId] || 'inactive';
    
    // Cycle: inactive -> active -> improved -> inactive
    const nextStatus = currentStatus === 'inactive' ? 'active' 
      : currentStatus === 'active' ? 'improved' 
      : 'inactive';
    
    monitoring[symptomId] = nextStatus;
    patient.monitoring = monitoring;
    
    await storage.put(STORES.PATIENTS, patient);
    this.render(patientId); // Re-render
  },
  
  showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    // Tab content switching
    if (tabName === 'monitoring') {
      PatientMonitor.render(this.currentPatientId);
    } else {
      App.showToast(`Вкладка: ${tabName} (в разработке)`);
    }
  },
  
  async editPatient(patientId) {
    App.showToast('Редактирование пациента (в разработке)');
  },
  
  async deletePatient(patientId) {
    if (!await App.confirm('Пациент будет перемещён в корзину. Продолжить?')) {
      return;
    }
    
    try {
      await storage.delete(STORES.PATIENTS, patientId);
      App.showSuccess('Пациент удалён');
      router.navigate('patients');
    } catch (error) {
      App.showError('Ошибка удаления');
    }
  },
  
  async printCard(patientId) {
    const patient = await storage.get(STORES.PATIENTS, patientId);
    const plan = patient.planId ? await storage.get(STORES.PLANS, patient.planId) : null;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Карточка пациента — ${patient.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #333; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; }
          .section { margin-bottom: 30px; }
          .label { font-weight: bold; color: #555; }
          .value { margin-left: 8px; }
          .diagnosis-chip { display: inline-block; padding: 4px 12px; background: #e3f2fd; border-radius: 16px; margin: 4px; }
        </style>
      </head>
      <body>
        <h1>Карточка пациента</h1>
        <div class="section">
          <p><span class="label">Имя:</span> <span class="value">${patient.name}</span></p>
          <p><span class="label">Возраст:</span> <span class="value">${patient.age} лет</span></p>
          <p><span class="label">Пол:</span> <span class="value">${patient.gender === 'male' ? 'Мужской' : 'Женский'}</span></p>
          ${patient.phone ? `<p><span class="label">Телефон:</span> <span class="value">${patient.phone}</span></p>` : ''}
          ${patient.city ? `<p><span class="label">Город:</span> <span class="value">${patient.city}</span></p>` : ''}
        </div>
        
        <div class="section">
          <h2>Диагноз</h2>
          ${(patient.diagnosis?.illnesses || []).map(i => `<span class="diagnosis-chip">${i.name_ru || i.id}</span>`).join('') || '<p>Не установлен</p>'}
          ${patient.diagnosis?.severity ? `<p style="margin-top: 12px;"><span class="label">Тяжесть:</span> ${'★'.repeat(patient.diagnosis.severity)}${'☆'.repeat(5 - patient.diagnosis.severity)}</p>` : ''}
        </div>
        
        ${plan ? `
        <div class="section">
          <h2>План лечения</h2>
          <p><span class="label">Программа:</span> <span class="value">${plan.programId || plan.programName || '—'}</span></p>
          <p><span class="label">Длительность:</span> <span class="value">${plan.durationDays} дней</span></p>
          <p><span class="label">Прогресс:</span> <span class="value">${plan.daysCompleted}/${plan.durationDays} дней</span></p>
          <p><span class="label">Статус:</span> <span class="value">${plan.status === 'active' ? 'Активен' : plan.status}</span></p>
        </div>
        ` : ''}
        
        <div class="section">
          <p style="color: #999; font-size: 12px; margin-top: 40px;">RUKYA PRO · Ash-Shifa · ${new Date().toLocaleDateString('ru-RU')}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Patients, PatientDetail };
}
