/**
 * Advanced Diagnosis Engine for RUKYA PRO
 * Расширенный движок диагностики с матрицей соответствий и анализом жалоб
 * Версия 2.0 - Абу Мухаммад
 */

class AdvancedDiagnosis {
  constructor() {
    this.complaintCorpus = null;
    this.matrix = null;
    this.illnesses = null;
    this.organs = null;
    this.attributes = null;
    this.loaded = false;
  }

  async loadKnowledgeBase() {
    if (this.loaded) return true;
    
    try {
      const [corpus, matrix, illnesses, organs, attributes] = await Promise.all([
        fetch('data/complaint-corpus.json').then(r => r.json()),
        fetch('data/matrix.json').then(r => r.json()),
        fetch('data/illnesses.json').then(r => r.json()),
        fetch('data/organs.json').then(r => r.json()),
        fetch('data/attributes.json').then(r => r.json())
      ]);
      
      this.complaintCorpus = corpus;
      this.matrix = matrix;
      this.illnesses = illnesses;
      this.organs = organs;
      this.attributes = attributes;
      this.loaded = true;
      
      console.log('[Diagnosis] Knowledge base loaded successfully');
      return true;
    } catch (error) {
      console.error('[Diagnosis] Failed to load knowledge base:', error);
      return false;
    }
  }

  analyzeComplaints(text, surveyData = {}) {
    if (!text || typeof text !== 'string') {
      return { categories: {}, matches: [], severity: 1 };
    }

    const normalizedText = text.toLowerCase();
    const categories = {};
    const matches = [];
    let severityScore = 0;

    if (this.complaintCorpus?.categories) {
      for (const [catKey, category] of Object.entries(this.complaintCorpus.categories)) {
        const keywords = category.keywords || [];
        const phrases = category.phrases || [];
        
        let categoryScore = 0;
        const foundKeywords = [];
        const foundPhrases = [];

        for (const keyword of keywords) {
          if (normalizedText.includes(keyword.toLowerCase())) {
            foundKeywords.push(keyword);
            categoryScore += 1;
          }
        }

        for (const phrase of phrases) {
          if (normalizedText.includes(phrase.toLowerCase())) {
            foundPhrases.push(phrase);
            categoryScore += 2;
          }
        }

        if (categoryScore > 0) {
          categories[catKey] = {
            score: categoryScore,
            keywords: foundKeywords,
            phrases: foundPhrases,
            name: category.name
          };
          matches.push({ category: catKey, score: categoryScore });
          severityScore += categoryScore;
        }
      }
    }

    if (surveyData && typeof surveyData === 'object') {
      for (const [key, value] of Object.entries(surveyData)) {
        if (value === true) {
          const mappedCategory = this.mapSurveyToCategory(key);
          if (mappedCategory) {
            if (!categories[mappedCategory]) {
              categories[mappedCategory] = { score: 0, keywords: [], phrases: [], name: mappedCategory };
            }
            categories[mappedCategory].score += 3;
            severityScore += 3;
          }
        }
      }
    }

    const severity = Math.min(5, Math.max(1, Math.round(severityScore / 10)));
    return { categories, matches, severity, rawScore: severityScore };
  }

  mapSurveyToCategory(questionKey) {
    const mapping = {
      'chest_pain': 'heart_chest', 'chest_pressure': 'heart_chest', 'heart_pain': 'heart_chest',
      'headache': 'head_mind', 'confusion': 'head_mind', 'forgetfulness': 'head_mind',
      'family_conflict': 'family_relations', 'spouse_avoidance': 'family_relations',
      'house_noises': 'house_symptoms', 'shadows_seen': 'house_symptoms',
      'obsessive_thoughts': 'obsessions', 'prayer_doubts': 'obsessions',
      'evil_eye_suspect': 'evil_eye', 'after_praise': 'evil_eye',
      'nightmares': 'sleep_dreams', 'sleep_paralysis': 'sleep_dreams',
      'back_pain': 'pain_localization', 'stomach_burning': 'pain_localization',
      'lazy_prayer': 'spiritual_state', 'quran_difficulty': 'spiritual_state',
      'vomiting_quran': 'physical_reactions', 'yawning_ruqya': 'physical_reactions'
    };
    return mapping[questionKey] || null;
  }

  determineIllnesses(categories, severity) {
    const illnesses = [];
    const patterns = this.complaintCorpus?.combination_patterns || [];

    for (const pattern of patterns) {
      const patternParts = pattern.pattern.split(' + ');
      const allMatch = patternParts.every(part => categories[part]?.score > 0);
      
      if (allMatch) {
        illnesses.push({
          type: pattern.indication,
          confidence: pattern.confidence,
          source: 'pattern',
          description: pattern.description
        });
      }
    }

    const sortedCategories = Object.entries(categories).sort((a, b) => b[1].score - a[1].score);

    for (const [catKey, catData] of sortedCategories.slice(0, 3)) {
      const suggestedIllness = this.suggestIllnessFromCategory(catKey, catData.score);
      if (suggestedIllness && !illnesses.find(i => i.type === suggestedIllness.type)) {
        illnesses.push(suggestedIllness);
      }
    }

    for (const illness of illnesses) {
      if (severity >= 4) {
        illness.confidence = Math.min(1.0, illness.confidence + 0.1);
      }
    }

    return illnesses.sort((a, b) => b.confidence - a.confidence);
  }

  suggestIllnessFromCategory(category, score) {
    const suggestions = {
      'heart_chest': { type: 'sihr_mahfi', confidence: 0.6, source: 'category' },
      'family_relations': { type: 'sihr_tafriq', confidence: 0.75, source: 'category' },
      'house_symptoms': { type: 'sihr_bayt', confidence: 0.7, source: 'category' },
      'obsessions': { type: 'waswasa_dini', confidence: 0.85, source: 'category' },
      'evil_eye': { type: 'ayn_hasida', confidence: 0.8, source: 'category' },
      'sleep_dreams': { type: 'massas_jinn', confidence: 0.65, source: 'category' },
      'pain_localization': { type: 'massas_jinn', confidence: 0.7, source: 'category' },
      'spiritual_state': { type: 'waswasa_dini', confidence: 0.6, source: 'category' },
      'physical_reactions': { type: 'massas_jinn', confidence: 0.75, source: 'category' },
      'head_mind': { type: 'ayn_hasida', confidence: 0.55, source: 'category' }
    };

    const suggestion = suggestions[category];
    if (suggestion) {
      const adjustedConfidence = Math.min(0.95, suggestion.confidence + (score / 100));
      return { ...suggestion, confidence: adjustedConfidence };
    }
    return null;
  }

  getMatrixMapping(illnessType) {
    if (!this.matrix?.mappings) return null;
    return this.matrix.mappings.find(m => m.illness === illnessType) || null;
  }

  determineOrgans(illnesses, categories) {
    const organsSet = new Set();

    for (const illness of illnesses) {
      const mapping = this.getMatrixMapping(illness.type);
      if (mapping?.organs) {
        mapping.organs.forEach(o => organsSet.add(o));
      }
    }

    if (categories['head_mind']?.score > 0) organsSet.add('ras');
    if (categories['heart_chest']?.score > 0) { organsSet.add('qalb'); organsSet.add('sadr'); }
    if (categories['pain_localization']?.score > 0) {
      const painCats = categories['pain_localization'];
      if (painCats?.keywords?.some(k => k.includes('спина'))) organsSet.add('zahr');
      if (painCats?.keywords?.some(k => k.includes('живот'))) organsSet.add('batn');
    }

    return Array.from(organsSet);
  }

  selectAttributes(illnesses, organs) {
    const attributesSet = new Set();

    for (const illness of illnesses) {
      const mapping = this.getMatrixMapping(illness.type);
      if (mapping?.attributes) {
        mapping.attributes.forEach(a => attributesSet.add(a));
      }
    }

    if (this.matrix?.organ_attribute_synergy) {
      for (const organ of organs) {
        const synergyAttrs = this.matrix.organ_attribute_synergy[organ] || [];
        synergyAttrs.slice(0, 2).forEach(a => attributesSet.add(a));
      }
    }

    return Array.from(attributesSet).slice(0, 6);
  }

  async performDiagnosis(complaints, surveyData = {}) {
    await this.loadKnowledgeBase();

    const complaintAnalysis = this.analyzeComplaints(complaints, surveyData);
    const illnesses = this.determineIllnesses(complaintAnalysis.categories, complaintAnalysis.severity);
    const organs = this.determineOrgans(illnesses, complaintAnalysis.categories);
    const attributes = this.selectAttributes(illnesses, organs);

    const hasJinn = illnesses.some(i => i.type === 'massas_jinn' || (complaintAnalysis.categories['physical_reactions']?.score > 5));
    const hasAyn = illnesses.some(i => i.type === 'ayn_hasida' || complaintAnalysis.categories['evil_eye']?.score > 3);
    const houseAffected = complaintAnalysis.categories['house_symptoms']?.score > 3 || illnesses.some(i => i.type === 'sihr_bayt');

    let treatmentPriority = 'standard';
    if (hasJinn && illnesses.some(i => i.type.startsWith('sihr'))) treatmentPriority = 'jinn_first';
    else if (hasAyn && illnesses.some(i => i.type === 'waswasa_dini')) treatmentPriority = 'ayn_first';

    const avgConfidence = illnesses.length > 0 ? illnesses.reduce((sum, i) => sum + i.confidence, 0) / illnesses.length : 0.5;
    const confidenceStars = Math.round(avgConfidence * 5);

    const evidence = [];
    for (const [catKey, catData] of Object.entries(complaintAnalysis.categories)) {
      if (catData.score > 2) {
        evidence.push(`Симптомы категории "${catData.name}": ${catData.keywords.join(', ')}`);
      }
    }

    const differentialHypotheses = illnesses.slice(1, 3).map(i => ({
      type: i.type, probability: i.confidence * 0.8, note: 'Альтернативный диагноз'
    }));

    const warnings = [];
    if (treatmentPriority === 'jinn_first') warnings.push('⚠️ Сначала изгнать джинна, затем лечить сихр');
    if (treatmentPriority === 'ayn_first') warnings.push('⚠️ Сначала смыть сглаз, затем лечить васвасу');
    if (houseAffected) warnings.push('🏠 Требуется чистка помещения');

    const diagnosis = {
      types: illnesses.map(i => i.type),
      organs, attributes,
      severity: complaintAnalysis.severity,
      jinn: { present: hasJinn, type: hasJinn ? 'marid' : null, location: hasJinn ? organs[0] || 'batn' : null },
      ayn: { present: hasAyn },
      house: { affected: houseAffected },
      treatmentPriority,
      confidence: avgConfidence,
      confidenceStars,
      evidence,
      differentialHypotheses,
      warnings,
      healerNotes: this.generateHealerNotes(illnesses, complaintAnalysis),
      recommendedDuration: this.calculateDuration(complaintAnalysis.severity, illnesses)
    };

    return { diagnosis, analysis: complaintAnalysis, timestamp: new Date().toISOString() };
  }

  generateHealerNotes(illnesses, analysis) {
    const notes = [];
    if (illnesses.some(i => i.type === 'sihr_tafriq')) notes.push('💔 Обратите внимание на состояние супругов');
    if (illnesses.some(i => i.type === 'waswasa_dini')) notes.push('📿 Объяснить природу васвасы');
    if (analysis.severity >= 4) notes.push('⚡ Тяжёлое состояние, нужен ежедневный контроль');
    if (analysis.categories['sleep_dreams']?.score > 5) notes.push('😴 Добавить защиту спальни');
    return notes;
  }

  calculateDuration(severity, illnesses) {
    const baseDuration = { 1: 7, 2: 14, 3: 21, 4: 30, 5: 45 };
    let duration = baseDuration[severity] || 14;
    for (const illness of illnesses) {
      const mapping = this.getMatrixMapping(illness.type);
      if (mapping?.severity_multiplier) duration = Math.round(duration * mapping.severity_multiplier);
    }
    return Math.min(120, Math.max(7, duration));
  }

  validate(diagnosis) {
    if (!diagnosis) return { valid: false, errors: ['Диагноз отсутствует'], warnings: [], diagnosis: null };
    const errors = [], warnings = [];

    if (!diagnosis.types || !Array.isArray(diagnosis.types) || diagnosis.types.length === 0) {
      errors.push('Не указаны типы недугов');
    }
    if (!diagnosis.organs || !Array.isArray(diagnosis.organs)) {
      diagnosis.organs = ['qalb'];
      warnings.push('Органы не указаны');
    }
    if (!diagnosis.severity || diagnosis.severity < 1 || diagnosis.severity > 5) {
      diagnosis.severity = 2;
      warnings.push('Тяжесть вне диапазона');
    }
    if (!diagnosis.attributes || diagnosis.attributes.length === 0) {
      if (diagnosis.types[0]) {
        const mapping = this.getMatrixMapping(diagnosis.types[0]);
        if (mapping?.attributes) diagnosis.attributes = mapping.attributes.slice(0, 3);
      }
      if (!diagnosis.attributes || diagnosis.attributes.length === 0) {
        diagnosis.attributes = ['al-Shafi', 'al-Rahman'];
        warnings.push('Атрибуты не указаны');
      }
    }

    return { valid: errors.length === 0, errors, warnings, diagnosis };
  }

  compareDiagnoses(oldDiagnosis, newDiagnosis) {
    const changes = { added: [], removed: [], changed: [] };
    if (!oldDiagnosis || !newDiagnosis) return changes;

    const oldTypes = new Set(oldDiagnosis.types || []);
    const newTypes = new Set(newDiagnosis.types || []);

    for (const type of newTypes) if (!oldTypes.has(type)) changes.added.push({ field: 'type', value: type });
    for (const type of oldTypes) if (!newTypes.has(type)) changes.removed.push({ field: 'type', value: type });
    if (oldDiagnosis.severity !== newDiagnosis.severity) {
      changes.changed.push({ field: 'severity', from: oldDiagnosis.severity, to: newDiagnosis.severity });
    }

    return changes;
  }
}

if (typeof window !== 'undefined') window.AdvancedDiagnosis = AdvancedDiagnosis;
if (typeof module !== 'undefined' && module.exports) module.exports = AdvancedDiagnosis;
