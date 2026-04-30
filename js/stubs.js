/**
 * RUKYA PRO — Заглушки для будущих модулей
 * Ash-Shifa · Абу Мухаммад
 */

// Plans Stub
const PlansStub = {
  async render() {
    document.getElementById('page-container').innerHTML = `
      <div class="animate-fade-in">
        <div class="card" style="text-align: center; padding: 60px;">
          <p style="font-size: 48px; margin-bottom: 16px;">📋</p>
          <h2 style="margin-bottom: var(--spacing-md);">Планы лечения</h2>
          <p class="text-muted" style="margin-bottom: var(--spacing-lg);">Модуль в разработке</p>
          <button class="btn btn-primary" onclick="router.navigate('patients')">Перейти к пациентам</button>
        </div>
      </div>
    `;
  }
};

// Groups Stub
const GroupsStub = {
  async render() {
    document.getElementById('page-container').innerHTML = `
      <div class="animate-fade-in">
        <div class="card" style="text-align: center; padding: 60px;">
          <p style="font-size: 48px; margin-bottom: 16px;">📁</p>
          <h2 style="margin-bottom: var(--spacing-md);">Группы пациентов</h2>
          <p class="text-muted" style="margin-bottom: var(--spacing-lg);">Модуль в разработке</p>
          <button class="btn btn-primary" onclick="router.navigate('patients')">Перейти к пациентам</button>
        </div>
      </div>
    `;
  }
};

// Certificates Stub
const CertificatesStub = {
  async render() {
    document.getElementById('page-container').innerHTML = `
      <div class="animate-fade-in">
        <div class="card" style="text-align: center; padding: 60px;">
          <p style="font-size: 48px; margin-bottom: 16px;">📜</p>
          <h2 style="margin-bottom: var(--spacing-md);">Заключения</h2>
          <p class="text-muted" style="margin-bottom: var(--spacing-lg);">Модуль в разработке</p>
        </div>
      </div>
    `;
  }
};

// Calendar Stub
const CalendarStub = {
  async render() {
    document.getElementById('page-container').innerHTML = `
      <div class="animate-fade-in">
        <div class="card" style="text-align: center; padding: 60px;">
          <p style="font-size: 48px; margin-bottom: 16px;">📅</p>
          <h2 style="margin-bottom: var(--spacing-md);">Календарь</h2>
          <p class="text-muted" style="margin-bottom: var(--spacing-lg);">Модуль в разработке</p>
        </div>
      </div>
    `;
  }
};

// Library Stub
const LibraryStub = {
  async render() {
    document.getElementById('page-container').innerHTML = `
      <div class="animate-fade-in">
        <div class="card" style="text-align: center; padding: 60px;">
          <p style="font-size: 48px; margin-bottom: 16px;">📚</p>
          <h2 style="margin-bottom: var(--spacing-md);">Библиотека программ</h2>
          <p class="text-muted" style="margin-bottom: var(--spacing-lg);">Модуль в разработке</p>
        </div>
      </div>
    `;
  }
};

// Import Stub
const ImportStub = {
  async render() {
    document.getElementById('page-container').innerHTML = `
      <div class="animate-fade-in">
        <div class="card" style="text-align: center; padding: 60px;">
          <p style="font-size: 48px; margin-bottom: 16px;">📥</p>
          <h2 style="margin-bottom: var(--spacing-md);">Импорт данных</h2>
          <p class="text-muted" style="margin-bottom: var(--spacing-lg);">Модуль в разработке</p>
        </div>
      </div>
    `;
  }
};

// Export stubs
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PlansStub, GroupsStub, CertificatesStub, CalendarStub, LibraryStub, ImportStub };
}
