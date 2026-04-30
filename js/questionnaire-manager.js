/**
 * RUKYA PRO - Questionnaire Manager
 * Система анкетирования пациентов (первичные и повторные анкеты)
 * Version: 1.0
 */

class QuestionnaireManager {
    constructor() {
        this.templates = {
            primary: this.getPrimaryTemplate(),
            followup: this.getFollowupTemplate()
        };
    }

    /**
     * Шаблон первичной анкеты
     */
    getPrimaryTemplate() {
        return {
            type: 'primary',
            sections: [
                {
                    id: 'general',
                    title: 'Общая информация',
                    questions: [
                        { id: 'age', type: 'number', label: 'Возраст', required: true },
                        { id: 'marital_status', type: 'select', label: 'Семейное положение', options: ['Холост/Не замужем', 'Женат/Замужем', 'Разведен/Разведена', 'Вдовец/Вдова'] },
                        { id: 'children', type: 'number', label: 'Количество детей' },
                        { id: 'occupation', type: 'text', label: 'Род занятий' }
                    ]
                },
                {
                    id: 'religious',
                    title: 'Религиозная практика',
                    questions: [
                        { id: 'prayer_regularity', type: 'select', label: 'Как регулярно совершаете намаз?', options: ['Все 5 раз', '3-4 раза', '1-2 раза', 'Иногда', 'Не совершаю'] },
                        { id: 'quran_reading', type: 'select', label: 'Чтение Корана', options: ['Ежедневно', 'Несколько раз в неделю', 'Раз в неделю', 'Редко', 'Не читаю'] },
                        { id: 'dhikr', type: 'select', label: 'Поминание Аллаха (азкар)', options: ['Регулярно утром и вечером', 'Иногда', 'Редко', 'Не делаю'] }
                    ]
                },
                {
                    id: 'symptoms',
                    title: 'Основные симптомы',
                    questions: [
                        { id: 'main_complaint', type: 'textarea', label: 'Опишите основную жалобу', required: true },
                        { id: 'duration', type: 'text', label: 'Как давно начались симптомы?' },
                        { id: 'triggers', type: 'textarea', label: 'Что усиливает симптомы?' },
                        { id: 'previous_treatment', type: 'textarea', label: 'Предпринимали ли лечение ранее?' }
                    ]
                },
                {
                    id: 'spiritual',
                    title: 'Духовные признаки',
                    questions: [
                        { id: 'nightmares', type: 'checkbox-group', label: 'Кошмары', options: ['Часто', 'Иногда', 'Редко', 'Никогда'] },
                        { id: 'quran_reaction', type: 'select', label: 'Реакция на чтение Корана', options: ['Спокойствие', 'Тревога', 'Плач', 'Физические ощущения', 'Нет реакции'] },
                        { id: 'prayer_difficulty', type: 'select', label: 'Трудности с молитвой', options: ['Да, постоянно', 'Иногда', 'Редко', 'Нет'] }
                    ]
                },
                {
                    id: 'home',
                    title: 'Ситуация в доме',
                    questions: [
                        { id: 'home_atmosphere', type: 'select', label: 'Атмосфера в доме', options: ['Спокойная', 'Напряженная', 'Конфликтная', 'Тяжелая'] },
                        { id: 'family_issues', type: 'textarea', label: 'Проблемы в семье' },
                        { id: 'strange_sounds', type: 'checkbox', label: 'Странные звуки в доме' },
                        { id: 'objects_moving', type: 'checkbox', label: 'Перемещение предметов' }
                    ]
                }
            ]
        };
    }

    /**
     * Шаблон повторной анкеты
     */
    getFollowupTemplate() {
        return {
            type: 'followup',
            sections: [
                {
                    id: 'progress',
                    title: 'Динамика состояния',
                    questions: [
                        { id: 'overall_change', type: 'select', label: 'Общее изменение состояния', options: ['Значительное улучшение', 'Улучшение', 'Без изменений', 'Ухудшение'], required: true },
                        { id: 'improved_symptoms', type: 'textarea', label: 'Какие симптомы улучшились?' },
                        { id: 'worsened_symptoms', type: 'textarea', label: 'Какие симптомы ухудшились?' }
                    ]
                },
                {
                    id: 'treatment',
                    title: 'Соблюдение плана',
                    questions: [
                        { id: 'plan_adherence', type: 'select', label: 'Соблюдение плана лечения', options: ['Полностью', 'Частично (75%)', 'Наполовину (50%)', 'Редко (<25%)', 'Не соблюдал'] },
                        { id: 'difficulties', type: 'textarea', label: 'Трудности при выполнении плана' }
                    ]
                },
                {
                    id: 'new_symptoms',
                    title: 'Новые симптомы',
                    questions: [
                        { id: 'new_signs', type: 'textarea', label: 'Появились ли новые симптомы?' },
                        { id: 'reactions', type: 'textarea', label: 'Реакции во время чтения (выход джинна и т.п.)' }
                    ]
                }
            ]
        };
    }

    /**
     * Создание новой анкеты
     */
    create(patientId, type = 'primary') {
        const template = this.templates[type];
        if (!template) throw new Error('Шаблон не найден');

        return {
            id: 'q_' + Date.now(),
            patientId,
            type,
            createdAt: new Date().toISOString(),
            completed: false,
            answers: {},
            template: JSON.parse(JSON.stringify(template)) // Глубокая копия
        };
    }

    /**
     * Сохранение ответа
     */
    updateAnswer(questionnaire, questionId, value) {
        questionnaire.answers[questionId] = {
            value,
            updatedAt: new Date().toISOString()
        };
        return questionnaire;
    }

    /**
     * Проверка заполненности
     */
    validate(questionnaire) {
        const requiredQuestions = [];
        
        questionnaire.template.sections.forEach(section => {
            section.questions.forEach(q => {
                if (q.required && !questionnaire.answers[q.id]) {
                    requiredQuestions.push(q.label);
                }
            });
        });

        if (requiredQuestions.length > 0) {
            return {
                valid: false,
                message: `Не заполнены обязательные вопросы: ${requiredQuestions.join(', ')}`
            };
        }

        return { valid: true };
    }

    /**
     * Завершение анкеты
     */
    async complete(questionnaire) {
        const validation = this.validate(questionnaire);
        if (!validation.valid) {
            throw new Error(validation.message);
        }

        questionnaire.completed = true;
        questionnaire.completedAt = new Date().toISOString();

        // Сохранение в базу
        await this.save(questionnaire);
        return questionnaire;
    }

    /**
     * Сохранение в IndexedDB
     */
    async save(questionnaire) {
        if (!window.db) return false;

        try {
            const tx = window.db.transaction('questionnaires', 'readwrite');
            const store = tx.objectStore('questionnaires');
            
            return new Promise((resolve) => {
                const request = store.put(questionnaire);
                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            });
        } catch (e) {
            console.error('Ошибка сохранения анкеты:', e);
            return false;
        }
    }

    /**
     * Загрузка анкет пациента
     */
    async loadByPatient(patientId) {
        if (!window.db) return [];

        try {
            const tx = window.db.transaction('questionnaires', 'readonly');
            const store = tx.objectStore('questionnaires');
            const index = store.index('patientId');
            
            return new Promise((resolve) => {
                const request = index.getAll(patientId);
                request.onsuccess = () => {
                    const results = request.result || [];
                    resolve(results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                };
                request.onerror = () => resolve([]);
            });
        } catch (e) {
            console.error('Ошибка загрузки анкет:', e);
            return [];
        }
    }

    /**
     * Сравнение двух анкет
     */
    compare(before, after) {
        if (!before || !after) return null;

        const comparison = {
            beforeId: before.id,
            afterId: after.id,
            changes: []
        };

        // Поиск общих вопросов и сравнение
        const allQuestions = new Set([
            ...Object.keys(before.answers),
            ...Object.keys(after.answers)
        ]);

        allQuestions.forEach(qId => {
            const beforeVal = before.answers[qId]?.value;
            const afterVal = after.answers[qId]?.value;

            if (beforeVal !== afterVal) {
                comparison.changes.push({
                    questionId: qId,
                    before: beforeVal,
                    after: afterVal
                });
            }
        });

        return comparison;
    }

    /**
     * Экспорт анкеты в JSON
     */
    exportJSON(questionnaire) {
        return JSON.stringify(questionnaire, null, 2);
    }

    /**
     * Импорт анкеты из JSON
     */
    importJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.patientId || !data.template) {
                throw new Error('Неверный формат анкеты');
            }
            return data;
        } catch (e) {
            console.error('Ошибка импорта анкеты:', e);
            return null;
        }
    }

    /**
     * Отрисовка формы анкеты
     */
    renderForm(questionnaire, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let html = `<form id="questionnaire-form" class="questionnaire-form">`;

        questionnaire.template.sections.forEach(section => {
            html += `
                <div class="questionnaire-section">
                    <h3>${section.title}</h3>
                    <div class="section-questions">
            `;

            section.questions.forEach(q => {
                const savedValue = questionnaire.answers[q.id]?.value;
                
                html += `<div class="question-item">`;
                html += `<label>${q.label}${q.required ? ' *' : ''}</label>`;

                switch (q.type) {
                    case 'text':
                        html += `<input type="text" name="${q.id}" value="${savedValue || ''}" ${q.required ? 'required' : ''}>`;
                        break;
                    case 'number':
                        html += `<input type="number" name="${q.id}" value="${savedValue || ''}" ${q.required ? 'required' : ''}>`;
                        break;
                    case 'textarea':
                        html += `<textarea name="${q.id}" rows="3" ${q.required ? 'required' : ''}>${savedValue || ''}</textarea>`;
                        break;
                    case 'select':
                        html += `<select name="${q.id}" ${q.required ? 'required' : ''}>`;
                        html += `<option value="">Выбрать...</option>`;
                        q.options.forEach(opt => {
                            const selected = savedValue === opt ? 'selected' : '';
                            html += `<option value="${opt}" ${selected}>${opt}</option>`;
                        });
                        html += `</select>`;
                        break;
                    case 'checkbox':
                        html += `<label class="checkbox-label"><input type="checkbox" name="${q.id}" ${savedValue ? 'checked' : ''}> ${q.label}</label>`;
                        break;
                    case 'checkbox-group':
                        q.options.forEach(opt => {
                            const checked = savedValue === opt ? 'checked' : '';
                            html += `<label class="radio-label"><input type="radio" name="${q.id}" value="${opt}" ${checked}> ${opt}</label>`;
                        });
                        break;
                }

                html += `</div>`;
            });

            html += `</div></div>`;
        });

        html += `
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">Сохранить анкету</button>
                <button type="button" class="btn btn-secondary" onclick="window.questionnaireManager.cancel()">Отмена</button>
            </div>
        </form>`;

        container.innerHTML = html;

        // Обработчик отправки
        document.getElementById('questionnaire-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit(questionnaire);
        });
    }

    /**
     * Обработка отправки формы
     */
    handleSubmit(questionnaire) {
        const form = document.getElementById('questionnaire-form');
        const formData = new FormData(form);

        for (const [key, value] of formData.entries()) {
            this.updateAnswer(questionnaire, key, value);
        }

        this.complete(questionnaire).then(() => {
            showToast('Анкета успешно сохранена', 'success');
            if (typeof onQuestionnaireComplete === 'function') {
                onQuestionnaireComplete(questionnaire);
            }
        }).catch(err => {
            showToast(err.message, 'error');
        });
    }

    /**
     * Отмена
     */
    cancel() {
        // Закрытие модального окна или возврат назад
        const modal = document.querySelector('.modal.active');
        if (modal) modal.classList.remove('active');
    }
}

// Глобальный экземпляр
window.QuestionnaireManager = QuestionnaireManager;
