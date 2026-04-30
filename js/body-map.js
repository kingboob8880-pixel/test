/**
 * RUKYA PRO — Интерактивная карта тела (Body Map)
 * Визуальный выбор органов и зон поражения
 */

class BodyMap {
    constructor(containerId, onSelectCallback) {
        this.container = document.getElementById(containerId);
        this.onSelect = onSelectCallback;
        this.selectedZones = new Set();
        this.mode = 'select'; // 'select' | 'view'
        
        this.zones = [
            { id: 'head', name: 'Голова', key: 'ras', path: 'M12 2C8 2 5 5 5 9c0 2.5 1.5 4.5 3.5 5.5V16c0 1.5 1 2.5 2.5 2.5h2c1.5 0 2.5-1 2.5-2.5v-1.5c2-1 3.5-3 3.5-5.5 0-4-3-7-7-7z', center: {x: 12, y: 8} },
            { id: 'neck', name: 'Шея', key: 'unuq', path: 'M10 15h4v3h-4z', center: {x: 12, y: 16} },
            { id: 'chest', name: 'Грудь', key: 'sadr', path: 'M8 18h8v6H8z', center: {x: 12, y: 21} },
            { id: 'heart', name: 'Сердце', key: 'qalb', path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', center: {x: 12, y: 20}, special: true },
            { id: 'stomach', name: 'Живот', key: 'batn', path: 'M7 24h10v8H7z', center: {x: 12, y: 28} },
            { id: 'back', name: 'Спина', key: 'zahr', path: 'M12 22c-3 0-5-2-5-5V10h10v7c0 3-2 5-5 5z', center: {x: 12, y: 15}, back: true },
            { id: 'arm_l', name: 'Левая рука', key: 'yadayn', path: 'M6 18H4v10h2z M6 18l-2-4', center: {x: 5, y: 20} },
            { id: 'arm_r', name: 'Правая рука', key: 'yadayn', path: 'M18 18h2v10h-2z M18 18l2-4', center: {x: 19, y: 20} },
            { id: 'leg_l', name: 'Левая нога', key: 'rijlayn', path: 'M9 32H7v14h2z', center: {x: 8, y: 39} },
            { id: 'leg_r', name: 'Правая нога', key: 'rijlayn', path: 'M17 32h-2v14h2z', center: {x: 16, y: 39} },
            { id: 'whole_body', name: 'Все тело', key: 'jasad', path: 'M12 2C8 2 5 5 5 9c0 2.5 1.5 4.5 3.5 5.5V16c0 .5-.5 1-1 1H6v2h2v3H6v2h2v4H6v2h12v-2h-2v-4h2v-2h-2v-3h2v-2h-2c-.5 0-1-.5-1-1v-1.5c2-1 3.5-3 3.5-5.5 0-4-3-7-7-7z', center: {x: 12, y: 25}, full: true }
        ];

        this.init();
    }

    init() {
        if (!this.container) return;
        
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute("viewBox", "0 0 24 48");
        svg.setAttribute("class", "body-map-svg");
        
        // Заголовок
        const title = document.createElementNS(svgNS, "title");
        title.textContent = "Карта тела: выберите зону поражения";
        svg.appendChild(title);

        // Отрисовка зон
        this.zones.forEach(zone => {
            const group = document.createElementNS(svgNS, "g");
            group.setAttribute("class", `body-zone ${zone.back ? 'back-zone' : ''} ${zone.special ? 'special-zone' : ''}`);
            group.setAttribute("data-id", zone.id);
            group.setAttribute("data-key", zone.key);
            
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", zone.path);
            path.setAttribute("fill", "currentColor");
            path.setAttribute("stroke", "var(--border-color, #ccc)");
            path.setAttribute("stroke-width", "0.5");
            
            // Tooltip
            const tooltip = document.createElementNS(svgNS, "title");
            tooltip.textContent = zone.name;
            
            group.appendChild(path);
            group.appendChild(tooltip);
            
            // Обработчик клика
            group.addEventListener('click', () => this.handleZoneClick(zone));
            group.addEventListener('mouseenter', () => this.highlightZone(group, true));
            group.addEventListener('mouseleave', () => this.highlightZone(group, false));
            
            svg.appendChild(group);
        });

        this.container.innerHTML = '';
        this.container.appendChild(svg);
        this.updateView();
    }

    handleZoneClick(zone) {
        if (this.mode === 'view') return;

        if (zone.full) {
            // Выбор всего тела сбрасывает остальные
            this.selectedZones.clear();
            this.selectedZones.add(zone.key);
        } else {
            if (this.selectedZones.has(zone.key)) {
                this.selectedZones.delete(zone.key);
            } else {
                // Если выбрано "все тело", убираем его при выборе конкретной зоны
                this.selectedZones.delete('jasad');
                this.selectedZones.add(zone.key);
            }
        }

        this.updateView();
        if (this.onSelect) {
            this.onSelect(Array.from(this.selectedZones));
        }
    }

    highlightZone(element, isHover) {
        const path = element.querySelector('path');
        if (isHover) {
            path.style.opacity = '0.8';
            path.style.filter = 'brightness(1.2)';
        } else {
            path.style.opacity = '1';
            path.style.filter = 'none';
        }
    }

    setSelected(keys) {
        this.selectedZones = new Set(keys);
        this.updateView();
    }

    setMode(mode) {
        this.mode = mode;
        this.container.classList.toggle('view-mode', mode === 'view');
    }

    updateView() {
        const groups = this.container.querySelectorAll('.body-zone');
        groups.forEach(group => {
            const key = group.getAttribute('data-key');
            const path = group.querySelector('path');
            const isSelected = this.selectedZones.has(key);
            
            if (isSelected) {
                group.classList.add('selected');
                path.style.fill = 'var(--primary-color, #d4af37)';
                path.style.stroke = 'var(--text-color, #333)';
                path.style.strokeWidth = '1';
            } else {
                group.classList.remove('selected');
                path.style.fill = 'var(--bg-secondary, #f5f5f5)';
                path.style.stroke = 'var(--border-color, #ccc)';
                path.style.strokeWidth = '0.5';
            }
        });
    }

    getSelectedKeys() {
        return Array.from(this.selectedZones);
    }
}

// Экспорт для использования в других модулях
if (typeof window !== 'undefined') {
    window.BodyMap = BodyMap;
}
