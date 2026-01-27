/**
 * Sidebar Panel Component
 * 
 * Displays:
 * - Current settings (default days, required days)
 * - Company holidays
 * - Compliance status
 * - Non-compliant windows details
 * - Statistics
 */

import { store } from '../state/store.js';
import { DAY_ABBRS, MONTH_NAMES } from '../utils/date-utils.js';
import { formatWindowForDisplay } from '../utils/compliance.js';
import { getHolidayList } from '../config/holidays.js';

export class SidebarPanel extends HTMLElement {
    constructor() {
        super();
        this._unsubscribe = null;
    }
    
    connectedCallback() {
        this._render();
        
        // Subscribe to store updates
        this._unsubscribe = store.subscribe(() => {
            this._render();
        });
    }
    
    disconnectedCallback() {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
    }
    
    _render() {
        const state = store.getState();
        const { defaultOfficeDays, requiredDays, complianceResults, year } = state;
        
        // Format default days for display
        const daysDisplay = defaultOfficeDays
            .map(d => DAY_ABBRS[d])
            .join(', ') || 'None selected';
        
        this.innerHTML = `
            <div class="sidebar-content">
                <!-- Settings Section -->
                <section class="sidebar-section">
                    <h3 class="sidebar-section-title">Your Settings</h3>
                    <div class="settings-list">
                        <div class="setting-item">
                            <span class="setting-label">Default Office Days</span>
                            <span class="setting-value">${daysDisplay}</span>
                        </div>
                        <div class="setting-item">
                            <span class="setting-label">Org Requirement</span>
                            <span class="setting-value">${requiredDays} days/week</span>
                        </div>
                    </div>
                </section>
                
                <!-- Holidays Section -->
                ${this._renderHolidays(year)}
                
                <!-- Compliance Section -->
                <section class="sidebar-section">
                    <h3 class="sidebar-section-title">Compliance Status</h3>
                    ${this._renderComplianceStatus(complianceResults)}
                </section>
                
                <!-- Non-Compliant Windows -->
                ${this._renderNonCompliantWindows(complianceResults)}
                
                <!-- Statistics Section -->
                ${this._renderStats(complianceResults)}
            </div>
        `;
    }
    
    _renderComplianceStatus(results) {
        if (!results) {
            return `
                <div class="compliance-status compliant">
                    <span class="compliance-icon">⏳</span>
                    <span class="compliance-text">Calculating...</span>
                </div>
            `;
        }
        
        if (results.isCompliant) {
            return `
                <div class="compliance-status compliant">
                    <span class="compliance-icon">✓</span>
                    <span class="compliance-text">All ${results.totalWindows} windows compliant</span>
                </div>
            `;
        } else {
            return `
                <div class="compliance-status non-compliant">
                    <span class="compliance-icon">✗</span>
                    <span class="compliance-text">${results.nonCompliantWindows.length} of ${results.totalWindows} windows non-compliant</span>
                </div>
            `;
        }
    }
    
    _renderNonCompliantWindows(results) {
        if (!results || results.isCompliant) {
            return '';
        }
        
        const windows = results.nonCompliantWindows.slice(0, 10); // Limit display
        const hasMore = results.nonCompliantWindows.length > 10;
        
        return `
            <section class="sidebar-section">
                <h3 class="sidebar-section-title">Non-Compliant Windows</h3>
                <div class="windows-list">
                    ${windows.map(w => this._renderWindowItem(w)).join('')}
                    ${hasMore ? `<p class="form-hint">...and ${results.nonCompliantWindows.length - 10} more</p>` : ''}
                </div>
            </section>
        `;
    }
    
    _renderWindowItem(window) {
        const formatted = formatWindowForDisplay(window);
        
        return `
            <div class="window-item">
                <div class="window-dates">${formatted.weekRange}</div>
                <div class="window-details">${formatted.dateRange}</div>
                <div class="window-result">
                    <span>Average: ${formatted.average} → ${formatted.rounded}</span>
                    <span class="result-value">Need: ${formatted.required}</span>
                </div>
            </div>
        `;
    }
    
    _renderStats(results) {
        if (!results || !results.stats) {
            return '';
        }
        
        const { totalOfficeDays, totalWeeks, averagePerWeek } = results.stats;
        
        return `
            <section class="sidebar-section">
                <h3 class="sidebar-section-title">Statistics</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${totalOfficeDays}</div>
                        <div class="stat-label">Total Office Days</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${averagePerWeek}</div>
                        <div class="stat-label">Avg Days/Week</div>
                    </div>
                </div>
            </section>
        `;
    }
    
    _renderHolidays(year) {
        const holidays = getHolidayList(year);
        
        if (holidays.length === 0) {
            return '';
        }
        
        const formatHolidayDate = (isoDate) => {
            const [y, m, d] = isoDate.split('-').map(Number);
            const date = new Date(y, m - 1, d);
            const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
            return `${month} ${d}`;
        };
        
        return `
            <section class="sidebar-section holidays-section">
                <h3 class="sidebar-section-title">
                    Company Holidays
                    <span class="holiday-count">${holidays.length}</span>
                </h3>
                <div class="holidays-list">
                    ${holidays.map(h => `
                        <div class="holiday-item">
                            <span class="holiday-date">${formatHolidayDate(h.date)}</span>
                            <span class="holiday-name">${h.name}</span>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }
}

customElements.define('sidebar-panel', SidebarPanel);
