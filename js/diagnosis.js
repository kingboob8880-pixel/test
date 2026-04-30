/**
 * RUKYA PRO — Движок диагностики
 * Ash-Shifa · Абу Мухаммад
 */

const Diagnosis = {
  // База знаний (загружается из data/)
  knowledgeBase: null,
  
  async init() {
    this.knowledgeBase = await this.loadKnowledgeBase();
  },
  
  async loadKnowledgeBase() {
    const files = [
      'illnesses', 'organs', 'attributes', 'templates', 
      'programs', 'blocks', 'actions', 'matrix', 'verses'
    ];
    
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
  
  // Локальная диагностика (без интернета)
  async localDiagnose(complaints, surveyAnswers) {
    const diagnosis = {
      illnesses: [],
      organs: [],
      jinn: null,
      ayn: false,
      houseAffected: false,
      severity: 1,
      priority: 'sihr',
      confidence: 0.5
    };
    
    // Анализ жалоб по ключевым словам
    const complaintLower = complaints.toLowerCase();
    
    // Определение типа недуга
    if (complaintLower.includes('разлад') || complaintLower.includes('ссор') || complaintLower.includes('конфликт')) {
      diagnosis.illnesses.push({ id: 'sihr_tafriq', name_ru: 'Сихр разлада' });
      diagnosis.priority = 'sihr_tafriq';
    }
    
    if (complaintLower.includes('привязанн') || complaintLower.includes('навязчив')) {
      diagnosis.illnesses.push({ id: 'sihr_mahabba', name_ru: 'Сихр привязанности' });
    }
    
    if (complaintLower.includes('джинн') || complaintLower.includes('касание') || complaintLower.includes('масс')) {
      diagnosis.illnesses.push({ id: 'massas_jinn', name_ru: 'Касание джинна' });
      diagnosis.jinn = { type: 'marid', location: 'heart' };
    }
    
    if (complaintLower.includes('сглаз') || complaintLower.includes('айн')) {
      diagnosis.ayn = true;
      diagnosis.illnesses.push({ id: 'ayn_hasida', name_ru: 'Сглаз' });
    }
    
    if (complaintLower.includes('дом') || complaintLower.includes('квартир') || complaintLower.includes('жилищ')) {
      diagnosis.houseAffected = true;
    }
    
    if (complaintLower.includes('васвас') || complaintLower.includes('сомнен') || complaintLower.includes('навязчив')) {
      diagnosis.illnesses.push({ id: 'waswasa_dini', name_ru: 'Васваса' });
    }
    
    // Если ничего не найдено - скрытый сихр по умолчанию
    if (diagnosis.illnesses.length === 0) {
      diagnosis.illnesses.push({ id: 'sihr_mahfi', name_ru: 'Скрытый сихр' });
    }
    
    // Определение органов по ответам опросника
    if (surveyAnswers) {
      if (surveyAnswers.chest_pain || surveyAnswers.heart_palpitations) {
        diagnosis.organs.push({ id: 'sadr', name_ru: 'Грудь' });
      }
      if (surveyAnswers.headache || surveyAnswers.dizziness) {
        diagnosis.organs.push({ id: 'ras', name_ru: 'Голова' });
      }
      if (surveyAnswers.heart_pain || surveyAnswers.anxiety) {
        diagnosis.organs.push({ id: 'qalb', name_ru: 'Сердце' });
      }
      if (surveyAnswers.abdomen_pain) {
        diagnosis.organs.push({ id: 'batn', name_ru: 'Живот' });
      }
    }
    
    // Если органы не определены - добавляем сердце по умолчанию
    if (diagnosis.organs.length === 0) {
      diagnosis.organs.push({ id: 'qalb', name_ru: 'Сердце' });
    }
    
    // Расчет тяжести на основе количества симптомов
    const symptomCount = Object.values(surveyAnswers || {}).filter(v => v).length;
    diagnosis.severity = Math.min(5, Math.max(1, Math.ceil(symptomCount / 5)));
    
    // Уверенность в диагнозе
    diagnosis.confidence = Math.min(0.95, 0.5 + (symptomCount * 0.05));
    
    // Обоснование
    diagnosis.reasoning = `Диагноз поставлен на основе анализа ${symptomCount} симптомов.`;
    
    return diagnosis;
  },
  
  // AI-диагностика через DeepSeek API
  async aiDiagnose(complaints, apiKey) {
    if (!apiKey) {
      throw new Error('API ключ не настроен');
    }
    
    const prompt = `Ты — эксперт по диагностике духовных недугов в исламской традиции (рукья). Проанализируй жалобы пациента и предоставь структурированный диагноз в формате JSON.

Жалобы пациента:
${complaints}

Верни ТОЛЬКО JSON в следующем формате:
{
  "illnesses": [{"id": "sihr_mahfi", "name_ru": "Скрытый сихр"}],
  "organs": [{"id": "qalb", "name_ru": "Сердце"}],
  "jinn": {"type": "marid", "location": "heart"} | null,
  "ayn": boolean,
  "houseAffected": boolean,
  "severity": 1-5,
  "priority": "sihr" | "jinn" | "ayn",
  "confidence": 0.0-1.0,
  "reasoning": "строка с обоснованием"
}

Типы недугов: sihr_mahfi, sihr_tafriq, sihr_mahabba, massas_jinn, ayn_hasida, waswasa_dini
Органы: qalb (сердце), sadr (грудь), ras (голова), batn (живот), jasad (тело)`;

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Ты эксперт по диагностике духовных недугов. Отвечай только JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Извлекаем JSON из ответа
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Не удалось распарсить JSON ответа');
    } catch (error) {
      console.error('AI diagnosis error:', error);
      // Fallback to local diagnosis
      return this.localDiagnose(complaints, {});
    }
  },
  
  // Валидация диагноза
  validate(diagnosis) {
    const validIllnesses = Object.keys(this.knowledgeBase?.illnesses || {});
    const validOrgans = Object.keys(this.knowledgeBase?.organs || {});
    
    // Нормализация
    if (!diagnosis.illnesses) diagnosis.illnesses = [];
    if (!diagnosis.organs) diagnosis.organs = [];
    if (!diagnosis.severity) diagnosis.severity = 1;
    if (!diagnosis.confidence) diagnosis.confidence = 0.5;
    
    // Проверка типов недугов
    diagnosis.illnesses = diagnosis.illnesses.filter(i => 
      validIllnesses.includes(i.id) || i.id.startsWith('sihr_') || i.id.startsWith('massas_') || i.id.startsWith('ayn_')
    );
    
    // Проверка органов
    diagnosis.organs = diagnosis.organs.filter(o => 
      validOrgans.includes(o.id) || ['qalb', 'sadr', 'ras', 'batn', 'jasad'].includes(o.id)
    );
    
    // Ограничение тяжести
    diagnosis.severity = Math.min(5, Math.max(1, diagnosis.severity));
    
    // Ограничение уверенности
    diagnosis.confidence = Math.min(1, Math.max(0, diagnosis.confidence));
    
    return diagnosis;
  },
  
  // Подбор программы лечения по диагнозу
  recommendPrograms(diagnosis) {
    const programs = this.knowledgeBase?.programs || {};
    const recommendations = [];
    
    for (const [id, program] of Object.entries(programs)) {
      let score = 0;
      const reasons = [];
      
      // Совпадение по типу недуга
      if (program.indications?.some(i => diagnosis.illnesses.some(di => di.id === i))) {
        score += 50;
        reasons.push('Соответствует типу недуга');
      }
      
      // Совпадение по органам
      if (program.organs?.some(o => diagnosis.organs.some(do2 => do2.id === o))) {
        score += 20;
        reasons.push('Затронутые органы совпадают');
      }
      
      // Учет дома
      if (diagnosis.houseAffected && program.includesHomeBlock) {
        score += 15;
        reasons.push('Включает чистку дома');
      }
      
      // Учет джинна
      if (diagnosis.jinn && program.indications?.includes('massas_jinn')) {
        score += 25;
        reasons.push('Эффективна против джиннов');
      }
      
      // Учет сглаза
      if (diagnosis.ayn && program.indications?.includes('ayn_hasida')) {
        score += 20;
        reasons.push('Эффективна против сглаза');
      }
      
      if (score > 0) {
        recommendations.push({
          programId: id,
          programName: program.name_ru || id,
          score: Math.min(100, score),
          reasons
        });
      }
    }
    
    // Сортировка по score
    recommendations.sort((a, b) => b.score - a.score);
    
    return recommendations.slice(0, 5);
  }
};

// Initialize on load
Diagnosis.init();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Diagnosis;
}
