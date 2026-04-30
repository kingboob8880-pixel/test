/**
 * RUKYA PRO — Генератор сообщений для WhatsApp
 * Формирование и отправка планов лечения, напоминаний и рекомендаций
 */

class WhatsAppGenerator {
    constructor() {
        this.templates = {
            plan: this.getPlanTemplate(),
            reminder: this.getReminderTemplate(),
            greeting: this.getGreetingTemplate(),
            completion: this.getCompletionTemplate()
        };
    }

    getPlanTemplate() {
        return `🌿 *RUKYA PRO — План лечения*
        
Ассаляму алейки ва рахматуЛлахи ва баракятуху, *{patientName}*!

Вот ваш индивидуальный план лечения, составленный специалистом по рукье.

📋 *Диагноз:*
{diagnosis}

⏳ *Длительность курса:* {duration} дней
📅 *Дата начала:* {startDate}

━━━━━━━━━━━━━━━━━━━━━

📖 *Ежедневная программа:*

{dailyPlan}

━━━━━━━━━━━━━━━━━━━━━

💧 *Работа с водой и маслом:*
{waterOilInstructions}

🤲 *Важные рекомендации:*
{recommendations}

━━━━━━━━━━━━━━━━━━━━━

❗ *Примечания:*
- Читайте с намерением исцеления от Аллаха
- Соблюдайте адабы (ритуальную чистоту)
- При ухудшении состояния сообщите специалисту

Пусть Аллах дарует вам полное исцеление! 🤲

_Сгенерировано в RUKYA PRO_`;
    }

    getReminderTemplate() {
        return `🌙 *Напоминание о чтении рукьи*

Ассаляму алейки, *{patientName}*!

Это дружеское напоминание о необходимости продолжить курс лечения.

📊 *Ваш прогресс:* {progress}%
📅 *День:* {currentDay} из {totalDays}

Не забывайте читать сегодняшнюю программу:
{todayPlan}

💡 *Совет дня:* {dailyTip}

Да примет Аллах ваши старания! 🤲`;
    }

    getGreetingTemplate() {
        return `🌿 *RUKYA PRO — Добро пожаловать*

Ассаляму алейки ва рахматуЛлахи ва баракятуху, *{patientName}*!

Благодарим вас за обращение к специалисту по рукье.

📝 *Ваши данные приняты:*
• Имя: {patientName}
• Возраст: {age}
• Город: {city}

🔍 *Первичный анализ:*
{initialAnalysis}

📋 *Следующие шаги:*
1. Ожидайте составления детального плана лечения
2. Подготовьтесь к началу курса (очистка дома, намерение)
3. Свяжитесь с нами при возникновении вопросов

БаракАллаху фик! 🤲`;
    }

    getCompletionTemplate() {
        return `✨ *Завершение курса лечения*

Ассаляму алейки ва рахматуЛлахи ва баракятуху, *{patientName}*!

Поздравляем! Вы успешно завершили курс лечения.

📊 *Итоги курса:*
• Длительность: {duration} дней
• Прогресс: {progress}%
• Состояние: {finalState}

📜 *Рекомендации после курса:*
{postCareRecommendations}

🤲 *Мольба благодарности:*
«Альхамду лиЛляхи Рабби ль-алямин»

Пусть Аллах сохранит ваше исцеление и укрепит веру!

_Сертификат о завершении доступен в личном кабинете_`;
    }

    /**
     * Генерация сообщения плана лечения
     */
    generatePlanMessage(patient, plan, settings = {}) {
        const template = this.templates.plan;
        
        // Формирование ежедневной программы (кратко)
        const dailyPlan = this.formatDailyPlan(plan);
        
        // Инструкции по воде и маслу
        const waterOilInstructions = this.formatWaterOilInstructions(plan);
        
        // Рекомендации
        const recommendations = [
            'Читать с тахаратом (малым омовением)',
            'Повернуться в сторону Киблы',
            'Плевать слегка (без слюны) после чтения',
            'Слушать со вниманием и размышлением'
        ].join('\n• ');

        return this.replacePlaceholders(template, {
            patientName: patient.name,
            diagnosis: this.formatDiagnosis(patient.diagnosis),
            duration: plan.duration || 14,
            startDate: new Date().toLocaleDateString('ru-RU'),
            dailyPlan: dailyPlan,
            waterOilInstructions: waterOilInstructions,
            recommendations: recommendations
        });
    }

    /**
     * Генерация напоминания
     */
    generateReminder(patient, plan, currentDay) {
        const template = this.templates.reminder;
        const progress = Math.round((currentDay / plan.duration) * 100);
        
        const todayPlan = this.getTodayPlan(plan, currentDay);
        const tips = [
            'Увеличьте чтение аятов вечером',
            'Пейте заряженную воду перед сном',
            'Избегайте музыки и грехов',
            'Читайте аят аль-Курси после каждого намаза',
            'Делайте дуа своими словами'
        ];
        const dailyTip = tips[currentDay % tips.length];

        return this.replacePlaceholders(template, {
            patientName: patient.name,
            progress: progress,
            currentDay: currentDay,
            totalDays: plan.duration,
            todayPlan: todayPlan,
            dailyTip: dailyTip
        });
    }

    /**
     * Открыть WhatsApp с сообщением
     */
    sendToWhatsApp(phone, message) {
        if (!phone) {
            this.showError('Номер телефона не указан');
            return;
        }

        // Очистка номера (удаление +, -, пробелов, скобок)
        const cleanPhone = phone.replace(/[\+\-\s\(\)]/g, '');
        
        // Кодирование сообщения
        const encodedMessage = encodeURIComponent(message);
        
        // Формирование URL
        const url = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
        
        // Открытие в новой вкладке
        window.open(url, '_blank');
        
        // Логирование
        console.log('WhatsApp отправлено:', phone);
        this.showSuccess('Сообщение подготовлено для отправки');
    }

    /**
     * Копировать сообщение в буфер
     */
    async copyToClipboard(message) {
        try {
            await navigator.clipboard.writeText(message);
            this.showSuccess('Сообщение скопировано в буфер обмена');
        } catch (err) {
            // Fallback для старых браузеров
            const textarea = document.createElement('textarea');
            textarea.value = message;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showSuccess('Сообщение скопировано в буфер обмена');
        }
    }

    /**
     * Показать диалог отправки
     */
    showSendDialog(patient, plan, type = 'plan') {
        const modal = document.createElement('div');
        modal.className = 'whatsapp-modal';
        
        let message = '';
        let title = '';
        
        switch(type) {
            case 'plan':
                message = this.generatePlanMessage(patient, plan);
                title = '📋 Отправить план лечения';
                break;
            case 'reminder':
                const currentDay = prompt('Введите текущий день курса:', '1');
                if (!currentDay) return;
                message = this.generateReminder(patient, plan, parseInt(currentDay));
                title = '🌙 Отправить напоминание';
                break;
            default:
                return;
        }

        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content whatsapp-dialog">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-btn" onclick="this.closest('.whatsapp-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="preview-label">Предпросмотр:</div>
                    <div class="message-preview">${this.formatPreview(message)}</div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-whatsapp" onclick="app.whatsapp.send('${patient.phone}', \`${message.replace(/`/g, '\\`')}\`)">
                            📱 Отправить в WhatsApp
                        </button>
                        <button class="btn btn-secondary" onclick="app.whatsapp.copy(\`${message.replace(/`/g, '\\`')}\`)">
                            📋 Копировать текст
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Вспомогательные методы
    formatDailyPlan(plan) {
        if (!plan || !plan.sections) return 'План формируется...';
        
        let text = '';
        const sections = plan.sections;
        
        if (sections.cleansing) {
            text += `*1. Чистка:*\n`;
            text += `• ${sections.cleansing.length} формул\n`;
        }
        if (sections.defense) {
            text += `*2. Защита:*\n`;
            text += `• ${sections.defense.length} формул\n`;
        }
        if (sections.closing) {
            text += `*3. Закрытие дверей:*\n`;
            text += `• ${sections.closing.length} формул\n`;
        }
        if (sections.waterOil) {
            text += `*4. Вода и масло:*\n`;
            text += `• Зарядить воду и масло\n`;
        }
        
        return text || 'Программа загружается...';
    }

    formatWaterOilInstructions(plan) {
        return `• Воду пить утром натощак и перед сном\n• Маслом смазывать больные места после чтения\n• Хранить в чистом месте`;
    }

    formatDiagnosis(diagnosis) {
        if (!diagnosis) return 'Требуется диагностика';
        const types = diagnosis.types?.map(t => t.name).join(', ') || 'Не определено';
        const severity = diagnosis.severity ? `Тяжесть: ${diagnosis.severity}/5` : '';
        return `${types}\n${severity}`;
    }

    getTodayPlan(plan, day) {
        // Упрощенная логика - вернуть общие инструкции
        return 'Читать основные аяты: Аль-Фатиха, Аль-Бакара, Аят аль-Курси';
    }

    replacePlaceholders(template, data) {
        return Object.keys(data).reduce((result, key) => {
            return result.replace(new RegExp(`\\{${key}\\}`, 'g'), data[key]);
        }, template);
    }

    formatPreview(text) {
        // Преобразование Markdown-подобного форматирования в HTML для превью
        return text
            .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.WhatsAppGenerator = WhatsAppGenerator;
}
