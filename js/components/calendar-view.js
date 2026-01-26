/**
 * Calendar View Component
 * 
 * Container for all 12 month calendars in a scrollable grid.
 */

import { store } from '../state/store.js';
import './month-calendar.js';

export class CalendarView extends HTMLElement {
    constructor() {
        super();
        this._unsubscribe = null;
    }
    
    connectedCallback() {
        this._render();
        this._setupEventListeners();
        
        // Subscribe to store updates
        this._unsubscribe = store.subscribe(() => {
            this._updateMonthCalendars();
        });
        
        // Initial update
        this._updateMonthCalendars();
    }
    
    disconnectedCallback() {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
    }
    
    _render() {
        const state = store.getState();
        const year = state.year;
        
        this.innerHTML = `
            <div class="calendar-legend">
                <div class="legend-item">
                    <div class="legend-swatch selected"></div>
                    <span>Going to office</span>
                </div>
                <div class="legend-item">
                    <div class="legend-swatch unselected"></div>
                    <span>Not going</span>
                </div>
                <div class="legend-item">
                    <div class="legend-swatch pending-add"></div>
                    <span>Adding (pending)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-swatch pending-remove"></div>
                    <span>Removing (pending)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-swatch weekend"></div>
                    <span>Weekend</span>
                </div>
            </div>
            <div class="calendar-grid" id="calendarGrid">
                ${this._renderMonths(year)}
            </div>
        `;
    }
    
    _renderMonths(year) {
        let html = '';
        for (let month = 0; month < 12; month++) {
            html += `<month-calendar year="${year}" month="${month}"></month-calendar>`;
        }
        return html;
    }
    
    _setupEventListeners() {
        // Handle day toggle events from day cells
        this.addEventListener('day-toggle', (e) => {
            const { date } = e.detail;
            this._toggleDate(date);
        });
    }
    
    _toggleDate(dateStr) {
        const state = store.getState();
        const pendingDates = new Set(state.pendingDates);
        
        if (pendingDates.has(dateStr)) {
            pendingDates.delete(dateStr);
        } else {
            pendingDates.add(dateStr);
        }
        
        store.setState({
            pendingDates: Array.from(pendingDates)
        });
    }
    
    _updateMonthCalendars() {
        const state = store.getState();
        const confirmedDates = new Set(state.confirmedDates);
        const pendingDates = new Set(state.pendingDates);
        
        const monthCalendars = this.querySelectorAll('month-calendar');
        monthCalendars.forEach(cal => {
            cal.updateDates(confirmedDates, pendingDates);
        });
    }
}

customElements.define('calendar-view', CalendarView);
