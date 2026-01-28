/**
 * Day Cell Component
 * 
 * Represents a single day in the calendar.
 * Handles click interactions and visual states.
 */

import { isWeekend, isToday, isBeforePolicyStart, isCompanyHoliday, toISODateString } from '../utils/date-utils.js';

export class DayCell extends HTMLElement {
    static get observedAttributes() {
        return ['date', 'selected', 'pending-add', 'pending-remove', 'disabled'];
    }
    
    constructor() {
        super();
        this._date = null;
    }
    
    connectedCallback() {
        this._render();
        this._setupEventListeners();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this._updateState();
        }
    }
    
    get date() {
        return this.getAttribute('date');
    }
    
    set date(value) {
        if (value) {
            this.setAttribute('date', value);
        } else {
            this.removeAttribute('date');
        }
    }
    
    get selected() {
        return this.hasAttribute('selected');
    }
    
    set selected(value) {
        if (value) {
            this.setAttribute('selected', '');
        } else {
            this.removeAttribute('selected');
        }
    }
    
    get pendingAdd() {
        return this.hasAttribute('pending-add');
    }
    
    set pendingAdd(value) {
        if (value) {
            this.setAttribute('pending-add', '');
        } else {
            this.removeAttribute('pending-add');
        }
    }
    
    get pendingRemove() {
        return this.hasAttribute('pending-remove');
    }
    
    set pendingRemove(value) {
        if (value) {
            this.setAttribute('pending-remove', '');
        } else {
            this.removeAttribute('pending-remove');
        }
    }
    
    get disabled() {
        return this.hasAttribute('disabled');
    }
    
    set disabled(value) {
        if (value) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }
    
    _render() {
        const dateStr = this.date;
        if (!dateStr) {
            this.innerHTML = '<div class="day-cell empty"></div>';
            return;
        }
        
        const date = new Date(dateStr + 'T00:00:00');
        const dayNum = date.getDate();
        
        this.innerHTML = `<div class="day-cell">${dayNum}</div>`;
        this._updateState();
    }
    
    _updateState() {
        const cell = this.querySelector('.day-cell');
        if (!cell || !this.date) return;
        
        const date = new Date(this.date + 'T00:00:00');
        
        // Reset classes
        cell.className = 'day-cell';
        
        // Check if weekend
        if (isWeekend(date)) {
            cell.classList.add('weekend', 'disabled');
            return;
        }
        
        // Check if before policy start date
        if (isBeforePolicyStart(this.date)) {
            cell.classList.add('before-policy', 'disabled');
            return;
        }
        
        // Check if company holiday
        if (isCompanyHoliday(this.date)) {
            cell.classList.add('holiday');
        }
        
        // Check if today
        if (isToday(this.date)) {
            cell.classList.add('today');
        }
        
        // Apply state classes
        if (this.pendingAdd) {
            cell.classList.add('pending-add');
        } else if (this.pendingRemove) {
            cell.classList.add('pending-remove');
        } else if (this.selected) {
            cell.classList.add('selected');
        }
        
        if (this.disabled) {
            cell.classList.add('disabled');
        }
    }
    
    _setupEventListeners() {
        this.addEventListener('click', (e) => {
            const dateStr = this.date;
            if (!dateStr) return;
            
            const date = new Date(dateStr + 'T00:00:00');
            if (isWeekend(date) || isBeforePolicyStart(dateStr) || this.disabled) return;
            
            this.dispatchEvent(new CustomEvent('day-toggle', {
                bubbles: true,
                composed: true,
                detail: { date: dateStr }
            }));
        });
    }
}

customElements.define('day-cell', DayCell);
