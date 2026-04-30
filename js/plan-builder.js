/**
 * RUKYA PRO — Конструктор формул плана лечения
 * Ash-Shifa · Абу Мухаммад
 */

const PlanBuilder = {
  knowledgeBase: null,

  async init() {
    this.knowledgeBase = await this.loadKnowledgeBase();
  },

  async loadKnowledgeBase() {
    const files = ['illnesses', 'organs', 'attributes', 'templates', 'blocks', 'actions', 'matrix', 'verses', 'soul_knots_content'];
    const kb = {};
    for (const file of files) {
      try {
        const response = await fetch(`data/${file}.json`);
        kb[file] = await response.json();
      } catch (error) {
        console.warn(`Failed to load ${file}.json`, error);
        kb[file] = {};
      }
    }
    return kb;
  },

  /**
   * Построение полного плана лечения
   * @param {Object} diagnosis - Диагноз пациента
   * @param {String} programId - ID программы лечения
   * @param {Number} durationDays - Длительность курса (дней)
   * @param {String} detailLevel - Уровень детализации: 'short' | 'medium' | 'full'
   * @param {Number} formulaLimit - Лимит формул в плане
   * @param {Boolean} addSoulKnots - Добавить курс духовных зажимов
   * @returns {Object} План лечения
   */
  buildPlan(diagnosis, programId, durationDays, detailLevel = 'medium', formulaLimit = 20, addSoulKnots = false) {
    const programs = this.knowledgeBase.programs || {};
    const program = programs[programId];

    if (!program) {
      throw new Error(`Программа ${programId} не найдена`);
    }

    const plan = {
      id: Utils.generateId(),
      programId,
      programName: program.name_ru,
      durationDays,
      detailLevel,
      formulaLimit,
      addSoulKnots,
      createdAt: new Date().toISOString(),
      sections: {},
      totalFormulas: 0,
      dailySchedule: []
    };

    // Построение секций плана
    const blocks = program.blocks || [];

    // 1. Секция чистки (cleansing)
    if (blocks.includes('cleansing')) {
      plan.sections.cleansing = this.buildCleansingSection(diagnosis, detailLevel);
    }

    // 2. Секция дома (homeBlock)
    if (blocks.includes('homeBlock') || diagnosis.houseAffected) {
      plan.sections.homeBlock = this.buildHomeSection(diagnosis, detailLevel);
    }

    // 3. Секция защиты (defense)
    if (blocks.includes('defense')) {
      plan.sections.defense = this.buildDefenseSection(diagnosis, detailLevel);
    }

    // 4. Секция закрытия (closing)
    if (blocks.includes('closing')) {
      plan.sections.closing = this.buildClosingSection(detailLevel);
    }

    // 5. Секция воды и масла (waterOil)
    if (blocks.includes('waterOil') && detailLevel !== 'short') {
      plan.sections.waterOil = this.buildWaterOilSection(detailLevel);
    }

    // 6. Финальная секция (final)
    if (blocks.includes('final')) {
      plan.sections.final = this.buildFinalSection(detailLevel);
    }

    // 7. Курс духовных зажимов (soulKnots)
    if (addSoulKnots || blocks.includes('soulKnots')) {
      plan.sections.soulKnots = this.buildSoulKnotsSection(detailLevel);
    }

    // 8. Мольбы (dua)
    if (blocks.includes('dua') || detailLevel === 'full') {
      plan.sections.dua = this.buildDuaSection();
    }

    // Подсчёт общего числа формул
    plan.totalFormulas = Object.values(plan.sections).reduce((sum, section) => {
      return sum + (section.formulas ? section.formulas.length : 0);
    }, 0);

    // Применение лимита формул
    if (plan.totalFormulas > formulaLimit) {
      plan = this.applyFormulaLimit(plan, formulaLimit);
    }

    // Генерация ежедневного расписания
    plan.dailySchedule = this.generateDailySchedule(plan, durationDays, detailLevel);

    return plan;
  },

  /**
   * Построение секции чистки
   */
  buildCleansingSection(diagnosis, detailLevel) {
    const formulas = [];
    const illnesses = diagnosis.illnesses || [];
    const organs = diagnosis.organs || [];
    const severity = diagnosis.severity || 1;

    // Базовая рукья (Фатиха, Ихлас, Фаляк, Нас)
    const baseRuqya = [
      { templateId: 'ruqya_fatiha', repeats: this.getRepeats(7, severity, detailLevel) },
      { templateId: 'ruqya_ikhlas', repeats: this.getRepeats(3, severity, detailLevel) },
      { templateId: 'ruqya_falaq', repeats: this.getRepeats(3, severity, detailLevel) },
      { templateId: 'ruqya_nas', repeats: this.getRepeats(3, severity, detailLevel) }
    ];

    formulas.push(...baseRuqya.map(f => this.createFormula(f.templateId, f.repeats)));

    // Прицельная рукья по типу недуга
    for (const illness of illnesses.slice(0, detailLevel === 'short' ? 1 : 3)) {
      const illnessData = this.knowledgeBase.illnesses[illness.id] || {};
      const attribute = this.selectAttribute(illness.id);
      
      for (const organ of organs.slice(0, detailLevel === 'short' ? 1 : 2)) {
        const formula = this.buildTargetedRuqya(illness, organ, attribute, severity, detailLevel);
        if (formula) formulas.push(formula);
      }
    }

    return {
      id: 'cleansing',
      name: 'Чистка',
      nameAr: 'الاستشفاء',
      description: 'Прицельная рукья по типу недуга и органу',
      formulas
    };
  },

  /**
   * Построение секции чистки дома
   */
  buildHomeSection(diagnosis, detailLevel) {
    const formulas = [];
    const severity = diagnosis.severity || 1;

    // Защита дома
    formulas.push(this.createFormula('protection_home', this.getRepeats(3, severity, detailLevel)));

    // Чистка помещения от сихра
    if (diagnosis.illnesses?.some(i => i.id.includes('sihr'))) {
      formulas.push({
        id: Utils.generateId(),
        templateId: 'ruqya_fatiha',
        name: 'Чистка дома — Аль-Фатиха',
        nameAr: 'رقية البيت - الفاتحة',
        description: 'Чтение Аль-Фатиха для чистки жилища',
        repeats: this.getRepeats(7, severity, detailLevel),
        action: 'cleanse_home',
        target: 'house'
      });
    }

    // Чистка от джиннов
    if (diagnosis.jinn) {
      formulas.push({
        id: Utils.generateId(),
        templateId: 'ruqya_nas',
        name: 'Изгнание джиннов из дома',
        nameAr: 'إخراج الجن من البيت',
        description: 'Чтение Ан-Нас для изгнания джиннов',
        repeats: this.getRepeats(11, severity, detailLevel),
        action: 'expel_jinn',
        target: 'house'
      });
    }

    return {
      id: 'homeBlock',
      name: 'Чистка дома',
      nameAr: 'تنقية البيت',
      description: diagnosis.houseAffected ? 'Чистка и защита жилища' : 'Защита дома',
      formulas
    };
  },

  /**
   * Построение секции защиты
   */
  buildDefenseSection(diagnosis, detailLevel) {
    const formulas = [];
    const severity = diagnosis.severity || 1;
    const organs = diagnosis.organs || [];

    // Защита тела (4 слоя)
    formulas.push(this.createFormula('protection_body', this.getRepeats(3, severity, detailLevel)));

    // Защита органов
    for (const organ of organs.slice(0, detailLevel === 'short' ? 1 : 2)) {
      const organData = this.knowledgeBase.organs[organ.id] || {};
      formulas.push({
        id: Utils.generateId(),
        templateId: 'ruqya_ikhlas',
        name: `Защита ${organData.name_ru || organ.id}`,
        nameAr: `الحماية ${organData.name_ar || ''}`,
        description: `Чтение Аль-Ихлас для защиты ${organData.name_ru?.toLowerCase() || 'органа'}`,
        repeats: this.getRepeats(3, severity, detailLevel),
        action: 'protect',
        target: organ.id
      });
    }

    // Если затронут дом — защита дома
    if (diagnosis.houseAffected || detailLevel === 'full') {
      formulas.push(this.createFormula('protection_home', this.getRepeats(3, severity, detailLevel)));
    }

    return {
      id: 'defense',
      name: 'Защита',
      nameAr: 'الحماية',
      description: 'Четырёхслойная защита тела и органов',
      formulas
    };
  },

  /**
   * Построение секции закрытия дверей
   */
  buildClosingSection(detailLevel) {
    const formulas = [];
    const severity = 3; // Средняя тяжесть для закрытия

    formulas.push(this.createFormula('closing_doors', this.getRepeats(1, severity, detailLevel)));

    if (detailLevel !== 'short') {
      // Закрытие дверей органа
      formulas.push({
        id: Utils.generateId(),
        templateId: 'closing_doors',
        name: 'Закрытие дверей органа',
        nameAr: 'إغلاق أبواب العضو',
        description: 'Закрытие всех дверей зла для поражённого органа',
        repeats: this.getRepeats(1, severity, detailLevel),
        action: 'close_doors',
        target: 'organ'
      });
    }

    if (detailLevel === 'full') {
      // Закрытие дверей дома
      formulas.push({
        id: Utils.generateId(),
        templateId: 'closing_doors',
        name: 'Закрытие дверей дома',
        nameAr: 'إغلاق أبواب البيت',
        description: 'Закрытие всех дверей зла для жилища',
        repeats: 1,
        action: 'close_doors',
        target: 'house'
      });
    }

    return {
      id: 'closing',
      name: 'Закрытие дверей',
      nameAr: 'إغلاق الأبواب',
      description: 'Закрытие дверей тела, органа и дома',
      formulas
    };
  },

  /**
   * Построение секции воды и масла
   */
  buildWaterOilSection(detailLevel) {
    const formulas = [];
    const severity = 3;

    // Вода для чистки
    formulas.push(this.createFormula('water_cleansing', this.getRepeats(7, severity, detailLevel)));

    if (detailLevel !== 'short') {
      // Вода для защиты
      formulas.push({
        id: Utils.generateId(),
        templateId: 'water_cleansing',
        name: 'Вода для защиты',
        nameAr: 'ماء للحماية',
        description: 'Заряженная вода для ежедневной защиты',
        repeats: this.getRepeats(3, severity, detailLevel),
        action: 'protect',
        target: 'water'
      });
    }

    if (detailLevel === 'full') {
      // Масло для чистки
      formulas.push(this.createFormula('oil_protection', this.getRepeats(7, severity, detailLevel)));
    }

    return {
      id: 'waterOil',
      name: 'Вода и масло',
      nameAr: 'الماء والزيت',
      description: 'Заряженная вода и масло для чистки и защиты',
      formulas
    };
  },

  /**
   * Построение финальной секции
   */
  buildFinalSection(detailLevel) {
    const formulas = [];
    const severity = 3;

    // Возвращение зла
    formulas.push(this.createFormula('final_return', this.getRepeats(3, severity, detailLevel)));

    if (detailLevel !== 'short') {
      // Недосягаемость
      formulas.push({
        id: Utils.generateId(),
        templateId: 'ruqya_falaq',
        name: 'Недосягаемость',
        nameAr: 'عدم الوصول',
        description: 'Защита от возвращения колдовства',
        repeats: this.getRepeats(7, severity, detailLevel),
        action: 'protect',
        target: 'self'
      });
    }

    if (detailLevel === 'full') {
      // Финальное закрепление
      formulas.push({
        id: Utils.generateId(),
        templateId: 'ruqya_ikhlas',
        name: 'Финальное закрепление',
        nameAr: 'التثبيت النهائي',
        description: 'Закрепление результата лечения',
        repeats: 11,
        action: 'finalize',
        target: 'self'
      });
    }

    return {
      id: 'final',
      name: 'Финал',
      nameAr: 'الخاتمة',
      description: 'Возвращение зла и закрепление исцеления',
      formulas
    };
  },

  /**
   * Построение секции духовных зажимов
   */
  buildSoulKnotsSection(detailLevel) {
    const formulas = [];
    const soulKnotsContent = this.knowledgeBase.soul_knots_content || {};
    const knots = soulKnotsContent.knots || [];

    // Ограничиваем количество зажимов в зависимости от детализации
    const maxKnots = detailLevel === 'short' ? 3 : detailLevel === 'medium' ? 5 : knots.length;

    for (const knot of knots.slice(0, maxKnots)) {
      formulas.push({
        id: Utils.generateId(),
        templateId: knot.templateId || 'ruqya_fatiha',
        name: knot.name_ru || 'Духовный зажим',
        nameAr: knot.name_ar || '',
        description: knot.description || 'Проработка духовного зажима',
        repeats: knot.repeats || 7,
        action: 'loosen_knot',
        target: 'soul'
      });
    }

    return {
      id: 'soulKnots',
      name: 'Духовные зажимы',
      nameAr: 'العقد الروحية',
      description: 'Курс проработки духовных зажимов',
      formulas
    };
  },

  /**
   * Построение секции мольб
   */
  buildDuaSection() {
    const formulas = [];

    formulas.push(this.createFormula('dua_healing', 1));

    formulas.push({
      id: Utils.generateId(),
      templateId: 'dua_healing',
      name: 'Мольба о защите',
      nameAr: 'دعاء الحماية',
      description: 'Мольба о защите от зла',
      repeats: 1,
      action: 'pray',
      target: 'self'
    });

    return {
      id: 'dua',
      name: 'Мольбы',
      nameAr: 'الأدعية',
      description: 'Мольбы об исцелении и защите',
      formulas
    };
  },

  /**
   * Создание формулы из шаблона
   */
  createFormula(templateId, repeats) {
    const templates = this.knowledgeBase.templates || {};
    const template = templates[templateId];

    if (!template) {
      console.warn(`Template ${templateId} not found`);
      return null;
    }

    return {
      id: Utils.generateId(),
      templateId,
      name: template.name_ru,
      nameAr: template.template_ar?.substring(0, 30) + '...',
      description: template.template_ru,
      arabic: template.template_ar,
      translit: template.template_translit,
      russian: template.template_ru,
      repeats,
      action: template.type,
      target: 'general'
    };
  },

  /**
   * Построение прицельной формулы рукьи
   */
  buildTargetedRuqya(illness, organ, attribute, severity, detailLevel) {
    const illnessData = this.knowledgeBase.illnesses[illness.id] || {};
    const organData = this.knowledgeBase.organs[organ.id] || {};
    const attributeData = this.knowledgeBase.attributes[attribute] || {};

    const repeats = this.getRepeats(3, severity, detailLevel);

    return {
      id: Utils.generateId(),
      templateId: 'ruqya_general',
      name: `Рукья: ${illnessData.name_ru || illness.id} — ${organData.name_ru || organ.id}`,
      nameAr: `رقية ${illnessData.name_ar || ''} ${organData.name_ar || ''}`,
      description: `Чтение аята с именем Аллаха "${attributeData.name_ru || attribute}" для исцеления ${organData.name_ru?.toLowerCase() || 'органа'} от ${illnessData.name_ru?.toLowerCase() || 'недуга'}`,
      arabic: `بسم الله الرحمن الرحيم، ${attributeData.arabic || ''} ${organData.accusative_ar || ''} من ${illnessData.name_ar || ''}`,
      translit: `Бисмилляхи р-Рахмани р-Рахим, ${attributeData.translit || ''} ${organData.accusative_translit || organData.name_translit || ''} мин ${illnessData.name_translit || illness.id}`,
      russian: `Во имя Аллаха Милостивого Милосердного, ${attributeData.name_ru || attribute} ${organData.name_ru || organ.id} от ${illnessData.name_ru || illness.id}`,
      repeats,
      action: 'heal',
      target: organ.id,
      illnessType: illness.id
    };
  },

  /**
   * Выбор атрибута Аллаха по типу недуга
   */
  selectAttribute(illnessId) {
    const matrix = this.knowledgeBase.matrix || {};
    
    // Поиск в матрице соответствий
    if (matrix[illnessId]?.attribute) {
      return matrix[illnessId].attribute;
    }

    // Дефолтные атрибуты по типам недугов
    const defaults = {
      'sihr_mahfi': 'ash-Shafi',
      'sihr_tafriq': 'al-Wadud',
      'sihr_mahabba': 'al-Hayy',
      'massas_jinn': 'al-Qahhar',
      'ayn_hasida': 'an-Nur',
      'waswasa_dini': 'al-Hadi'
    };

    return defaults[illnessId] || 'ar-Rahman';
  },

  /**
   * Расчет числа повторов на основе тяжести и детализации
   */
  getRepeats(base, severity, detailLevel) {
    let multiplier = 1;

    // Множитель от тяжести
    multiplier += (severity - 1) * 0.2;

    // Множитель от детализации
    if (detailLevel === 'medium') multiplier *= 1.5;
    if (detailLevel === 'full') multiplier *= 2;

    return Math.round(base * multiplier);
  },

  /**
   * Применение лимита формул
   */
  applyFormulaLimit(plan, limit) {
    let totalUsed = 0;
    const sections = Object.keys(plan.sections);

    // Равномерное распределение лимита по секциям
    const perSection = Math.floor(limit / sections.length);

    for (const sectionId of sections) {
      const section = plan.sections[sectionId];
      if (section.formulas && section.formulas.length > perSection) {
        // Сокращаем секцию, сохраняя приоритетные формулы
        section.formulas = section.formulas.slice(0, perSection);
      }
      totalUsed += section.formulas?.length || 0;
    }

    plan.totalFormulas = totalUsed;
    return plan;
  },

  /**
   * Генерация ежедневного расписания
   */
  generateDailySchedule(plan, durationDays, detailLevel) {
    const schedule = [];
    const sections = Object.values(plan.sections);

    for (let day = 1; day <= durationDays; day++) {
      const dayPlan = {
        day,
        date: null, // Будет установлено при привязке к пациенту
        formulas: [],
        completed: false,
        notes: ''
      };

      // Распределение формул по дням
      // В коротком режиме — только базовые формулы
      // В полном режиме — все формулы

      let formulaIndex = 0;
      for (const section of sections) {
        if (!section.formulas) continue;

        const formulasPerDay = detailLevel === 'short' 
          ? Math.ceil(section.formulas.length / durationDays)
          : detailLevel === 'medium'
            ? Math.ceil(section.formulas.length / (durationDays / 2))
            : section.formulas.length;

        const startIdx = ((day - 1) * formulasPerDay) % section.formulas.length;
        const endIdx = Math.min(startIdx + formulasPerDay, section.formulas.length);

        for (let i = startIdx; i < endIdx; i++) {
          const formula = { ...section.formulas[i], sectionId: section.id, sectionName: section.name };
          dayPlan.formulas.push(formula);
        }
      }

      schedule.push(dayPlan);
    }

    return schedule;
  }
};

// Инициализация
PlanBuilder.init();

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlanBuilder;
}
