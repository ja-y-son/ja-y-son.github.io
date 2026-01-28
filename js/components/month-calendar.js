/**
 * Month Calendar Component
 * 
 * Displays a single month with all its days.
 */

import { 
    MONTH_NAMES, 
    DAY_ABBRS, 
    getMonthCalendarGrid, 
    toISODateString,
    isWeekend 
} from '../utils/date-utils.js';
import './day-cell.js';

export class MonthCalendar extends HTMLElement {
    static get observedAttributes() {
        return ['year', 'month'];
    }
    
    constructor() {
        super();
        this._confirmedDates = new Set();
        this._pendingDates = new Set();
    }
    
    connectedCallback() {
        this._render();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this.isConnected) {
            this._render();
        }
    }
    
    get year() {
        return parseInt(this.getAttribute('year'), 10);
    }
    
    set year(value) {
        this.setAttribute('year', value);
    }
    
    get month() {
        return parseInt(this.getAttribute('month'), 10);
    }
    
    set month(value) {
        this.setAttribute('month', value);
    }
    
    /**
     * Update the dates displayed in this month
     * @param {Set<string>} confirmedDates 
     * @param {Set<string>} pendingDates 
     */
    updateDates(confirmedDates, pendingDates) {
        this._confirmedDates = confirmedDates;
        this._pendingDates = pendingDates;
        this._updateDayCells();
    }
    
    _render() {
        const year = this.year;
        const month = this.month;
        
        if (isNaN(year) || isNaN(month)) return;
        
        const monthName = MONTH_NAMES[month];
        const grid = getMonthCalendarGrid(year, month);
        
        this.innerHTML = `
            <div class="month-calendar">
                <div class="month-header">${monthName} ${year}</div>
                <div class="weekday-headers">
                    ${DAY_ABBRS.map((day, i) => `
                        <div class="weekday-header${i === 0 || i === 6 ? ' weekend' : ''}">${day}</div>
                    `).join('')}
                </div>
                <div class="days-grid" id="daysGrid">
                    ${grid.map(date => this._renderDayCell(date)).join('')}
                </div>
            </div>
        `;
        
        this._updateDayCells();
    }
    
    _renderDayCell(date) {
        if (!date) {
            return '<day-cell></day-cell>';
        }
        
        const dateStr = toISODateString(date);
        return `<day-cell date="${dateStr}"></day-cell>`;
    }
    
    _updateDayCells() {
        const cells = this.querySelectorAll('day-cell[date]');
        
        cells.forEach(cell => {
            const dateStr = cell.date;
            if (!dateStr) return;
            
            const date = new Date(dateStr + 'T00:00:00');
            if (isWeekend(date)) return;
            
            const isConfirmed = this._confirmedDates.has(dateStr);
            const isPending = this._pendingDates.has(dateStr);
            
            // Reset states
            cell.selected = false;
            cell.pendingAdd = false;
            cell.pendingRemove = false;
            
            if (isConfirmed && isPending) {
                // No change - show as selected
                cell.selected = true;
            } else if (isConfirmed && !isPending) {
                // Being removed
                cell.pendingRemove = true;
            } else if (!isConfirmed && isPending) {
                // Being added
                cell.pendingAdd = true;
            }
            // else: not selected, not pending - default state
        });
    }
}

customElements.define('month-calendar', MonthCalendar);
