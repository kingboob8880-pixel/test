/**
 * RUKYA PRO - Certificate Generator
 * Генератор заключений и сертификатов о прохождении курса лечения
 * Version: 1.0
 */

class CertificateGenerator {
    constructor() {
        this.templates = {
            standard: this.getStandardTemplate(),
            detailed: this.getDetailedTemplate(),
            minimal: this.getMinimalTemplate()
        };
        
        this.defaultHealerName = 'Абу Мухаммад';
    }

    /**
     * Стандартный шаблон заключения
     */
    getStandardTemplate() {
        return {
            header: {
                title: 'ЗАКЛЮЧЕНИЕ',
                subtitle: 'о прохождении курса духовного лечения (рукья)'
            },
            fields: [
                { key: 'patientName', label: 'Пациент' },
                { key: 'patientAge', label: 'Возраст' },
                { key: 'patientGender', label: 'Пол' },
                { key: 'city', label: 'Город' },
                { key: 'diagnosis', label: 'Диагноз' },
                { key: 'startDate', label: 'Дата начала' },
                { key: 'endDate', label: 'Дата завершения' },
                { key: 'duration', label: 'Длительность курса' },
                { key: 'result', label: 'Результат' }
            ],
            footer: {
                healerSignature: true,
                date: true,
                seal: true
            }
        };
    }

    /**
     * Детальный шаблон с рекомендациями
     */
    getDetailedTemplate() {
        return {
            header: {
                title: 'ЗАКЛЮЧЕНИЕ И РЕКОМЕНДАЦИИ',
                subtitle: 'по итогам полного курса лечения'
            },
            fields: [
                { key: 'patientName', label: 'ФИО пациента' },
                { key: 'patientAge', label: 'Возраст' },
                { key: 'patientGender', label: 'Пол' },
                { key: 'city', label: 'Город/Местоположение' },
                { key: 'diagnosis', label: 'Первоначальный диагноз' },
                { key: 'startDate', label: 'Дата начала лечения' },
                { key: 'endDate', label: 'Дата завершения' },
                { key: 'duration', label: 'Общая длительность' },
                { key: 'sessionsCount', label: 'Количество сеансов' },
                { key: 'programsUsed', label: 'Примененные программы' },
                { key: 'result', label: 'Итоговое состояние' },
                { key: 'recommendations', label: 'Рекомендации' }
            ],
            footer: {
                healerSignature: true,
                date: true,
                seal: true,
                contactInfo: true
            }
        };
    }

    /**
     * Минимальный шаблон (справка)
     */
    getMinimalTemplate() {
        return {
            header: {
                title: 'СПРАВКА',
                subtitle: 'о прохождении лечения'
            },
            fields: [
                { key: 'patientName', label: 'Пациент' },
                { key: 'period', label: 'Период лечения' },
                { key: 'result', label: 'Статус' }
            ],
            footer: {
                healerSignature: true,
                date: true
            }
        };
    }

    /**
     * Создание нового заключения
     */
    create(patientData, planData, options = {}) {
        const {
            templateType = 'standard',
            healerName = this.defaultHealerName,
            customResult = ''
        } = options;

        const template = this.templates[templateType];
        if (!template) throw new Error('Шаблон не найден');

        const certificate = {
            id: 'cert_' + Date.now(),
            patientId: patientData.id,
            planId: planData?.id,
            createdAt: new Date().toISOString(),
            templateType,
            healerName,
            data: {
                patientName: patientData.name || '',
                patientAge: patientData.age || '',
                patientGender: patientData.gender === 'male' ? 'Мужской' : patientData.gender === 'female' ? 'Женский' : '',
                city: patientData.city || '',
                diagnosis: this.formatDiagnosis(planData?.diagnosis),
                startDate: planData?.createdAt ? new Date(planData.createdAt).toLocaleDateString('ru-RU') : '',
                endDate: new Date().toLocaleDateString('ru-RU'),
                duration: planData?.duration ? `${planData.duration} дней` : '',
                sessionsCount: planData?.sessions?.length || 0,
                programsUsed: planData?.programName || '',
                result: customResult || this.generateResultText(planData),
                recommendations: this.generateRecommendations(planData),
                period: planData?.createdAt ? 
                    `${new Date(planData.createdAt).toLocaleDateString('ru-RU')} — ${new Date().toLocaleDateString('ru-RU')}` : ''
            }
        };

        return certificate;
    }

    /**
     * Форматирование диагноза для вывода
     */
    formatDiagnosis(diagnosis) {
        if (!diagnosis) return 'Не указан';
        
        const illnessNames = {
            'sihr_mahfi': 'Скрытый сихр',
            'sihr_tafriq': 'Сихр разлада',
            'sihr_mahabba': 'Сихр привязанности',
            'massas_jinn': 'Касание джинна',
            'ayn_hasida': 'Сглаз',
            'waswasa_dini': 'Васваса',
            'general': 'Общее духовное недомогание'
        };

        const type = diagnosis.type || diagnosis.mainIllness || 'general';
        return illnessNames[type] || type;
    }

    /**
     * Генерация текста результата
     */
    generateResultText(planData) {
        // Простая логика на основе статуса плана
        if (!planData) return 'Лечение завершено';
        
        const progress = planData.progress || 100;
        if (progress >= 90) return 'Значительное улучшение, симптомы устранены';
        if (progress >= 70) return 'Улучшение состояния, положительные результаты';
        if (progress >= 50) return 'Частичное улучшение, требуется продолжение';
        return 'Лечение в процессе';
    }

    /**
     * Генерация рекомендаций
     */
    generateRecommendations(planData) {
        const recs = [
            'Продолжить чтение утренних и вечерних азкаров',
            'Совершать намаз своевременно',
            'Читать Коран ежедневно',
            'Избегать грехов и запретных действий'
        ];

        // Дополнительные рекомендации на основе диагноза
        if (planData?.diagnosis?.homeAffected) {
            recs.push('Продолжить чистку дома чтением Суры Аль-Бакара раз в неделю');
        }

        if (planData?.diagnosis?.type?.includes('waswasa')) {
            recs.push('При появлении васвасы обращаться к Аллаху за защитой');
        }

        return recs.join('; ');
    }

    /**
     * Сохранение заключения в базу
     */
    async save(certificate) {
        if (!window.db) return false;

        try {
            const tx = window.db.transaction('certificates', 'readwrite');
            const store = tx.objectStore('certificates');
            
            return new Promise((resolve) => {
                const request = store.put(certificate);
                request.onsuccess = () => resolve(true);
                request.onerror = () => resolve(false);
            });
        } catch (e) {
            console.error('Ошибка сохранения заключения:', e);
            return false;
        }
    }

    /**
     * Загрузка всех заключений
     */
    async loadAll() {
        if (!window.db) return [];

        try {
            const tx = window.db.transaction('certificates', 'readonly');
            const store = tx.objectStore('certificates');
            
            return new Promise((resolve) => {
                const request = store.getAll();
                request.onsuccess = () => {
                    const results = request.result || [];
                    resolve(results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
                };
                request.onerror = () => resolve([]);
            });
        } catch (e) {
            console.error('Ошибка загрузки заключений:', e);
            return [];
        }
    }

    /**
     * Отрисовка заключения для печати
     */
    render(certificate, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const template = this.templates[certificate.templateType];
        const data = certificate.data;

        let html = `
            <div class="certificate-document" id="certificate-print">
                <div class="certificate-header">
                    <h1>${template.header.title}</h1>
                    <p class="subtitle">${template.header.subtitle}</p>
                </div>
                
                <div class="certificate-body">
                    <table class="certificate-table">
        `;

        template.fields.forEach(field => {
            const value = data[field.key];
            if (value) {
                html += `
                    <tr>
                        <td class="label">${field.label}:</td>
                        <td class="value">${value}</td>
                    </tr>
                `;
            }
        });

        html += `
                    </table>
                </div>
                
                <div class="certificate-footer">
                    <div class="healer-block">
                        <div class="signature-line">
                            <span>Специалист по рукье:</span>
                            <span class="healer-name">${certificate.healerName}</span>
                        </div>
                    </div>
                    
                    <div class="date-block">
                        Дата: ${new Date(certificate.createdAt).toLocaleDateString('ru-RU', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>
                    
                    ${template.footer.seal ? '<div class="seal-placeholder">Печать</div>' : ''}
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    /**
     * Печать заключения
     */
    print(certificate) {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Заключение №${certificate.id}</title>
                <style>
                    @page { margin: 2cm; }
                    body { 
                        font-family: 'Times New Roman', serif; 
                        padding: 40px;
                        line-height: 1.6;
                    }
                    .certificate-document {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .certificate-header {
                        text-align: center;
                        margin-bottom: 40px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                    }
                    h1 {
                        font-size: 24px;
                        margin: 0 0 10px 0;
                        text-transform: uppercase;
                    }
                    .subtitle {
                        font-size: 14px;
                        color: #666;
                        margin: 0;
                    }
                    .certificate-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 30px 0;
                    }
                    .certificate-table tr {
                        border-bottom: 1px solid #eee;
                    }
                    .certificate-table td {
                        padding: 12px 0;
                    }
                    .label {
                        font-weight: bold;
                        width: 200px;
                    }
                    .value {
                        color: #333;
                    }
                    .certificate-footer {
                        margin-top: 60px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }
                    .healer-block {
                        flex: 1;
                    }
                    .signature-line {
                        display: flex;
                        flex-direction: column;
                        gap: 40px;
                    }
                    .healer-name {
                        font-weight: bold;
                        font-size: 16px;
                    }
                    .date-block {
                        margin-right: 20px;
                    }
                    .seal-placeholder {
                        width: 100px;
                        height: 100px;
                        border: 2px dashed #ccc;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #999;
                        font-size: 12px;
                    }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="margin-bottom: 20px;">
                    <button onclick="window.print()" style="padding: 10px 20px; cursor: pointer;">🖨️ Печать</button>
                    <button onclick="window.close()" style="padding: 10px 20px; cursor: pointer;">✕ Закрыть</button>
                </div>
        `);

        // Рендеринг содержимого
        this.render(certificate, 'print-content-temp');
        const tempContainer = document.createElement('div');
        this.render(certificate, 'print-content-temp');
        
        printWindow.document.body.innerHTML += tempContainer.innerHTML;
        
        printWindow.document.write(`
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Автопечать через небольшую задержку
        setTimeout(() => {
            printWindow.print();
        }, 250);
    }

    /**
     * Экспорт заключения в PDF (через печать)
     */
    exportPDF(certificate) {
        this.print(certificate);
    }

    /**
     * Удаление заключения (мягкое)
     */
    async delete(certificateId) {
        if (!window.db) return false;

        try {
            const tx = window.db.transaction('certificates', 'readwrite');
            const store = tx.objectStore('certificates');
            
            // Получаем запись, добавляем deletedAt
            const getReq = store.get(certificateId);
            
            return new Promise((resolve) => {
                getReq.onsuccess = () => {
                    const cert = getReq.result;
                    if (cert) {
                        cert.deletedAt = new Date().toISOString();
                        store.put(cert);
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                };
                getReq.onerror = () => resolve(false);
            });
        } catch (e) {
            console.error('Ошибка удаления заключения:', e);
            return false;
        }
    }
}

// Глобальный экземпляр
window.CertificateGenerator = CertificateGenerator;
