/**
 * RUKYA PRO — AI-ассистент и подсказки
 * Умные рекомендации на основе симптомов и контекста
 */

class AIAssistant {
    constructor() {
        this.context = null;
        this.suggestions = [];
        this.isAnalyzing = false;
        
        // База знаний для подсказок
        this.knowledgeBase = this.initKnowledgeBase();
    }

    initKnowledgeBase() {
        return {
            symptoms: {
                'nightmares': {
                    keywords: ['кошмар', 'страшный сон', 'плохой сон', 'видение', 'сновидение'],
                    suggestions: [
                        'Рекомендуется читать аят аль-Курси перед сном',
                        'Прочитать суру Аль-Мульк перед сном',
                        'Сделать рукью воды и выпить перед сном',
                        'Проверить наличие сихра в доме'
                    ],
                    relatedIllness: ['sihr_mahfi', 'massas_jinn']
                },
                'chest_pain': {
                    keywords: ['грудь', 'давит грудь', 'тяжесть в груди', 'боль в груди', 'сжало'],
                    suggestions: [
                        'Прицельная рукья на область груди (садр)',
                        'Использовать имя Аллаха "Аль-Мухаймин" (Хранитель)',
                        'Проверить наличие джинна в груди',
                        'Добавить формулы с атрибутом "Аш-Шафи" (Исцеляющий)'
                    ],
                    relatedOrgans: ['sadr', 'qalb']
                },
                'headache': {
                    keywords: ['голова', 'головная боль', 'мигрень', 'кружится голова', 'тяжесть в голове'],
                    suggestions: [
                        'Читать rukya на голову с именем "Ар-Рахман"',
                        'Проверить васвасу и влияние джинна',
                        'Использовать масло для смазывания головы после чтения',
                        'Добавить аяты о снятии тяжести'
                    ],
                    relatedOrgans: ['ras', 'aql']
                },
                'heart_issues': {
                    keywords: ['сердце', 'болит сердце', 'тревога', 'страх', 'паника', 'беспокойство'],
                    suggestions: [
                        'Прицельная рукья на сердце с именами "Аль-Мумин", "Аль-Мухаймин"',
                        'Лечение от страха (khawf) и печали (huzn)',
                        'Чтение суры Ад-Духа для успокоения',
                        'Проверить наличие махабба (привязанности)'
                    ],
                    relatedOrgans: ['qalb'],
                    relatedIllness: ['waswasa_dini', 'khawf', 'sihr_mahabba']
                },
                'stomach_pain': {
                    keywords: ['живот', 'боль в животе', 'тошнота', 'рвота', 'вздутие', 'колики'],
                    suggestions: [
                        'Джинн часто локализуется в животе',
                        'Читать формулы изгнания с атрибутом "Аль-Джаббар"',
                        'Пить заряженную воду натощак',
                        'Смазывать живот маслом после чтения'
                    ],
                    relatedOrgans: ['batn'],
                    relatedIllness: ['massas_jinn']
                },
                'family_conflict': {
                    keywords: ['ссора', 'конфликт', 'разлад', 'муж', 'жена', 'семья', 'ругань'],
                    suggestions: [
                        'Высокая вероятность сихра тафрик (разлад)',
                        'Необходима чистка дома от колдовства',
                        'Добавить программу "Сихр разлада"',
                        'Проверить наличие предметов сихра в доме'
                    ],
                    relatedIllness: ['sihr_tafriq', 'sihr_bayt']
                },
                'worship_difficulty': {
                    keywords: ['намаз', 'молитва', 'трудно молиться', 'леность', 'сомнение', 'васваса'],
                    suggestions: [
                        'Классические признаки васвасы',
                        'Читать специальную программу от васвасы',
                        'Использовать имена "Аль-Хади" (Ведущий), "Аль-Басыр" (Видящий)',
                        'Увеличить чтение утренних и вечерних азкаров'
                    ],
                    relatedIllness: ['waswasa_dini']
                },
                'eye_reaction': {
                    keywords: ['глаз', 'зевота', 'слезы', 'реакция на коран', 'тяжело слушать'],
                    suggestions: [
                        'Реакция указывает на наличие джинна или сихра',
                        'Продолжать чтение, несмотря на реакцию',
                        'Усилить защиту после чтения',
                        'Записать реакцию в журнал симптомов'
                    ]
                }
            },
            
            illnessPatterns: {
                'sihr_mahfi': {
                    name: 'Скрытый сихр',
                    keySymptoms: ['кошмары', 'перепады настроения', 'необъяснимые боли', 'реакция на Коран'],
                    recommendedPrograms: ['sihr_mahfi_standard', 'cleansing_intensive'],
                    duration: 14,
                    tips: [
                        'Требуется длительная чистка',
                        'Обязательно проверить дом',
                        'Возможно обновление сихра'
                    ]
                },
                'massas_jinn': {
                    name: 'Касание джинна',
                    keySymptoms: ['резкие боли', 'изменение голоса', 'потемнение в глазах', 'локальная боль'],
                    recommendedPrograms: ['jinn_expulsion', 'protection_strong'],
                    duration: 21,
                    tips: [
                        'Джинн может сопротивляться',
                        'Важно закрыть все двери после изгнания',
                        'Требуется защита тела и дома'
                    ]
                },
                'ayn_hasida': {
                    name: 'Сглаз',
                    keySymptoms: ['внезапное ухудшение', 'после похвалы', 'усталость', 'зевок'],
                    recommendedPrograms: ['ayn_cleansing', 'protection_ayn'],
                    duration: 7,
                    tips: [
                        'Лечится быстрее чем сихр',
                        'Избегать излишней похвалы',
                        'Читать защитные дуа'
                    ]
                }
            },

            quickActions: [
                {
                    id: 'add_protection',
                    label: 'Добавить защиту',
                    icon: '🛡️',
                    action: 'add_defense_block'
                },
                {
                    id: 'cleanse_house',
                    label: 'Чистка дома',
                    icon: '🏠',
                    action: 'add_house_cleansing'
                },
                {
                    id: 'water_oil',
                    label: 'Вода и масло',
                    icon: '💧',
                    action: 'add_water_oil'
                },
                {
                    id: 'soul_knots',
                    label: 'Духовные зажимы',
                    icon: '🔗',
                    action: 'add_soul_knots'
                }
            ]
        };
    }

    /**
     * Анализ жалоб и генерация подсказок
     */
    analyzeComplaints(complaintsText, surveyData = {}) {
        this.isAnalyzing = true;
        const text = complaintsText.toLowerCase();
        const suggestions = [];
        const detectedSymptoms = [];
        const probableIllnesses = [];

        // Поиск совпадений по симптомам
        for (const [symptomKey, symptomData] of Object.entries(this.knowledgeBase.symptoms)) {
            const matches = symptomData.keywords.some(keyword => text.includes(keyword));
            if (matches) {
                detectedSymptoms.push(symptomKey);
                suggestions.push(...symptomData.suggestions.slice(0, 2)); // Топ-2 совета
                
                if (symptomData.relatedIllness) {
                    probableIllnesses.push(...symptomData.relatedIllness);
                }
            }
        }

        // Анализ опросника
        if (surveyData) {
            this.analyzeSurvey(surveyData, suggestions, probableIllnesses);
        }

        // Удаление дубликатов
        const uniqueSuggestions = [...new Set(suggestions)];
        const uniqueIllnesses = [...new Set(probableIllnesses)];

        this.isAnalyzing = false;
        
        return {
            symptoms: detectedSymptoms,
            suggestions: uniqueSuggestions.slice(0, 5), // Максимум 5 подсказок
            probableIllnesses: uniqueIllnesses,
            confidence: this.calculateConfidence(detectedSymptoms, surveyData)
        };
    }

    analyzeSurvey(surveyData, suggestions, probableIllnesses) {
        // Анализ групп симптомов
        if (surveyData.heart_chest && surveyData.heart_chest.length > 2) {
            suggestions.push('Множественные симптомы в области груди — рекомендуется прицельная рукья');
            probableIllnesses.push('massas_jinn', 'sihr_mahfi');
        }

        if (surveyData.family && surveyData.family.length > 1) {
            suggestions.push('Признаки разлада в семье — проверить на сихр тафрик');
            probableIllnesses.push('sihr_tafriq');
        }

        if (surveyData.obsessions && surveyData.obsessions.length > 2) {
            suggestions.push('Навязчивые состояния — возможна васваса или влияние джинна');
            probableIllnesses.push('waswasa_dini');
        }

        if (surveyData.house && surveyData.house.length > 0) {
            suggestions.push('Есть признаки в доме — обязательна чистка помещения');
        }
    }

    calculateConfidence(symptoms, surveyData) {
        let score = 0;
        const maxScore = 10;

        score += Math.min(symptoms.length * 2, 6);
        
        if (surveyData) {
            const surveyGroups = Object.values(surveyData).filter(Array.isArray);
            const filledGroups = surveyGroups.filter(g => g.length > 0).length;
            score += Math.min(filledGroups, 4);
        }

        return Math.round((score / maxScore) * 100);
    }

    /**
     * Получить рекомендации по диагнозу
     */
    getRecommendationsForDiagnosis(diagnosis) {
        const recommendations = [];
        
        if (!diagnosis) return recommendations;

        // Рекомендации по типам недугов
        diagnosis.types?.forEach(type => {
            const illnessData = this.knowledgeBase.illnessPatterns[type.key || type.id];
            if (illnessData) {
                recommendations.push({
                    type: 'illness',
                    title: illnessData.name,
                    tips: illnessData.tips,
                    programs: illnessData.recommendedPrograms,
                    duration: illnessData.duration
                });
            }
        });

        // Рекомендации по органам
        diagnosis.organs?.forEach(org => {
            const organName = org.name || org.key;
            recommendations.push({
                type: 'organ',
                title: `Орган: ${organName}`,
                tips: [`Прицельная рукья на ${organName}`, `Использовать соответствующие атрибуты Аллаха`]
            });
        });

        // Рекомендации по тяжести
        if (diagnosis.severity >= 4) {
            recommendations.push({
                type: 'severity',
                title: 'Высокая тяжесть',
                tips: [
                    'Рекомендуется максимальная детализация плана',
                    'Добавить усиленную защиту',
                    'Увеличить длительность курса',
                    'Включить чистку дома'
                ]
            });
        }

        return recommendations;
    }

    /**
     * Быстрые действия
     */
    getQuickActions(context) {
        return this.knowledgeBase.quickActions;
    }

    /**
     * Показать панель подсказок в интерфейсе
     */
    renderSuggestionsPanel(containerId, suggestions) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!suggestions || suggestions.length === 0) {
            container.innerHTML = '<div class="ai-hint-empty">Начните вводить жалобы для получения подсказок</div>';
            return;
        }

        const html = `
            <div class="ai-suggestions-panel">
                <div class="ai-header">
                    <span class="ai-icon">🤖</span>
                    <span class="ai-title">AI-подсказки</span>
                    ${suggestions.confidence ? `<span class="ai-confidence">${suggestions.confidence}% уверенность</span>` : ''}
                </div>
                <div class="ai-suggestions-list">
                    ${suggestions.suggestions.map(s => `
                        <div class="ai-suggestion-item">
                            <span class="ai-bullet">•</span>
                            <span>${s}</span>
                        </div>
                    `).join('')}
                </div>
                ${suggestions.probableIllnesses?.length > 0 ? `
                    <div class="ai-probable-diagnosis">
                        <div class="ai-subtitle">Возможные недуги:</div>
                        <div class="ai-diagnosis-tags">
                            ${suggestions.probableIllnesses.map(ill => `
                                <span class="ai-tag">${this.getIllnessName(ill)}</span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="ai-quick-actions">
                    ${this.getQuickActions().map(action => `
                        <button class="ai-action-btn" data-action="${action.action}">
                            ${action.icon} ${action.label}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;

        container.innerHTML = html;
        
        // Обработчики быстрых действий
        container.querySelectorAll('.ai-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.getAttribute('data-action');
                this.handleQuickAction(action);
            });
        });
    }

    getIllnessName(key) {
        const names = {
            'sihr_mahfi': 'Скрытый сихр',
            'sihr_tafriq': 'Сихр разлада',
            'massas_jinn': 'Касание джинна',
            'ayn_hasida': 'Сглаз',
            'waswasa_dini': 'Васваса'
        };
        return names[key] || key;
    }

    handleQuickAction(action) {
        // Событие для обработки в основном приложении
        const event = new CustomEvent('rukya-ai-action', { detail: { action } });
        document.dispatchEvent(event);
        
        console.log('AI Quick Action:', action);
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.AIAssistant = AIAssistant;
}
