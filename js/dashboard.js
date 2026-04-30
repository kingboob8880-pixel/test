/**
 * RUKYA PRO — Дашборд «Сегодня»
 * Ash-Shifa · Абу Мухаммад
 */

const Dashboard = {
  async render() {
    const container = document.getElementById('page-container');
    container.innerHTML = this.renderLoading();
    
    try {
      // Load data
      const [patients, plans, certificates] = await Promise.all([
        storage.getAll(STORES.PATIENTS),
        storage.getAll(STORES.PLANS),
        storage.getAll(STORES.CERTIFICATES)
      ]);
      
      // Filter active patients
      const activePatients = patients.filter(p => !p.deletedAt && !p.archivedAt && p.status === 'active');
      const pausedPatients = patients.filter(p => !p.deletedAt && !p.archivedAt && p.status === 'paused');
      const completedPatients = patients.filter(p => !p.deletedAt && !p.archivedAt && p.status === 'completed');
      
      // Calculate stats
      const stats = {
        total: activePatients.length + pausedPatients.length,
        active: activePatients.length,
        paused: pausedPatients.length,
        completed: completedPatients.length,
        plans: plans.length,
        certificates: certificates.length
      };
      
      // Get today's appointments
      const today = new Date().toISOString().split('T')[0];
      const appointments = []; // Will be implemented with calendar
      
      container.innerHTML = `
        <div class="animate-fade-in">
          <!-- Stats Grid -->
          <div class="stats-grid">
            ${this.renderStatCard('Всего пациентов', stats.total, '👥', 'primary', 0)}
            ${this.renderStatCard('Активных', stats.active, '✅', 'success', 0)}
            ${this.renderStatCard('На паузе', stats.paused, '⏸️', 'warning', 0)}
            ${this.renderStatCard('Завершённых', stats.completed, '🏁', 'danger', 0)}
            ${this.renderStatCard('Планов', stats.plans, '📋', 'info', 0)}
            ${this.renderStatCard('Заключений', stats.certificates, '📜', 'primary', 0)}
          </div>
          
          <!-- Quick Actions -->
          <div class="card" style="margin-bottom: var(--spacing-xl);">
            <h2 class="card-title">Быстрые действия</h2>
            <div class="flex gap-md" style="margin-top: var(--spacing-md); flex-wrap: wrap;">
              <button class="btn btn-primary" onclick="router.navigate('newcase')">
                ➕ Новый приём
              </button>
              <button class="btn btn-secondary" onclick="router.navigate('patients')">
                👥 Все пациенты
              </button>
              <button class="btn btn-secondary" onclick="router.navigate('plans')">
                📋 Планы лечения
              </button>
              <button class="btn btn-secondary" onclick="router.navigate('calendar')">
                📅 Календарь
              </button>
            </div>
          </div>
          
          <!-- Active Patients Table -->
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Активные пациенты</h2>
              <button class="btn btn-sm btn-outline" onclick="router.navigate('patients')">
                Показать всех →
              </button>
            </div>
            ${activePatients.length > 0 ? `
              <div class="table-container">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Имя</th>
                      <th>Диагноз</th>
                      <th>Прогресс</th>
                      <th>След. визит</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activePatients.slice(0, 10).map(patient => {
                      const plan = plans.find(p => p.patientId === patient.id);
                      const progress = plan ? Math.round((plan.daysCompleted / plan.durationDays) * 100) : 0;
                      return `
                        <tr>
                          <td>
                            <strong>${patient.name}</strong><br>
                            <small class="text-muted">${patient.age} лет, ${patient.city || 'Город не указан'}</small>
                          </td>
                          <td>${patient.diagnosis?.diagnosis_ru || '—'}</td>
                          <td style="width: 150px;">
                            <div class="progress" style="height: 6px;">
                              <div class="progress-bar" style="width: ${progress}%"></div>
                            </div>
                            <small>${progress}%</small>
                          </td>
                          <td>${patient.nextVisit ? Utils.formatDate(patient.nextVisit) : 'Не назначен'}</td>
                          <td>
                            <button class="btn btn-sm btn-primary" onclick="router.navigate('patient', {id: '${patient.id}'})">
                              Открыть
                            </button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            ` : `
              <div style="padding: 40px; text-align: center; color: var(--text-muted);">
                <p style="font-size: 48px; margin-bottom: 16px;">👋</p>
                <p>Нет активных пациентов</p>
                <button class="btn btn-primary" style="margin-top: 16px;" onclick="router.navigate('newcase')">
                  Добавить первого пациента
                </button>
              </div>
            `}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Dashboard render error:', error);
      container.innerHTML = '<div class="card"><p class="text-danger">Ошибка загрузки дашборда</p></div>';
    }
  },
  
  renderStatCard(label, value, icon, type = 'primary', delta = 0) {
    const deltaClass = delta > 0 ? 'up' : delta < 0 ? 'down' : '';
    const deltaSign = delta > 0 ? '↑' : delta < 0 ? '↓' : '';
    
    return `
      <div class="stat-card">
        <div class="stat-icon ${type}">${icon}</div>
        <div class="stat-value" data-count="${value}">${value}</div>
        <div class="stat-label">${label}</div>
        ${delta !== 0 ? `
          <div class="stat-delta ${deltaClass}">
            ${deltaSign} ${Math.abs(delta)}%
          </div>
        ` : ''}
      </div>
    `;
  },
  
  renderLoading() {
    return `
      <div class="stats-grid">
        ${Array(6).fill('<div class="stat-card skeleton" style="height: 150px;"></div>').join('')}
      </div>
      <div class="card skeleton" style="height: 400px;"></div>
    `;
  }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dashboard;
}
