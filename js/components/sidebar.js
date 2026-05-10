/**
 * Sidebar Panel Component
 * 
 * Displays:
 * - Current settings (default days, required days)
 * - Compliance status
 * - Sliding windows (selectable)
 * - Selected window details
 */

import { store } from '../state/store.js';
import { WEEKDAY_ABBRS, MONTH_NAMES, getHolidaysInRange } from '../utils/date-utils.js';
import { formatWindowForDisplay } from '../utils/compliance.js';

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
        const { defaultOfficeDays, requiredDays, complianceResults, selectedWindowIndex } = state;
        
        // Format default days for display
        const daysDisplay = defaultOfficeDays
            .map(d => WEEKDAY_ABBRS[d])
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
                    <button class="btn btn-secondary btn-sm reset-btn" id="resetBtn">
                        Reset & Reconfigure
                    </button>
                </section>
                
                <!-- Compliance Section -->
                <section class="sidebar-section">
                    <h3 class="sidebar-section-title">Compliance Status</h3>
                    ${this._renderComplianceStatus(complianceResults)}
                </section>
                
                <!-- Selected Window Details -->
                ${this._renderSelectedWindowDetails(complianceResults, selectedWindowIndex)}
                
                <!-- Sliding Windows List -->
                ${this._renderSlidingWindows(complianceResults, selectedWindowIndex)}
                
                <!-- Company Holidays Section -->
                ${this._renderHolidays()}
            </div>
        `;
        
        // Setup reset button listener
        this._setupEventListeners();
    }
    
    _setupEventListeners() {
        const resetBtn = this.querySelector('#resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset? All your selections will be lost.')) {
                    store.reset();
                    this.dispatchEvent(new CustomEvent('reset-requested', {
                        bubbles: true,
                        composed: true
                    }));
                }
            });
        }
        
        // Window selection listeners
        this.querySelectorAll('.window-item[data-index]').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index, 10);
                const currentIndex = store.get('selectedWindowIndex');
                // Toggle selection
                if (currentIndex === index) {
                    store.clearWindowSelection();
                } else {
                    store.selectWindow(index);
                }
            });
        });
        
        // Clear selection button
        const clearBtn = this.querySelector('#clearWindowSelection');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                store.clearWindowSelection();
            });
        }
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
    
    _renderSlidingWindows(results, selectedIndex) {
        if (!results || !results.windows || results.windows.length === 0) {
            return '';
        }
        
        const windows = results.windows;
        
        return `
            <section class="sidebar-section">
                <h3 class="sidebar-section-title">Sliding Windows (${windows.length})</h3>
                <p class="form-hint">Click a window to see details and highlight on calendar</p>
                <div class="windows-list">
                    ${windows.map((w, idx) => this._renderWindowItem(w, idx, selectedIndex)).join('')}
                </div>
            </section>
        `;
    }
    
    _renderWindowItem(window, index, selectedIndex) {
        const formatted = formatWindowForDisplay(window);
        const isSelected = index === selectedIndex;
        const statusClass = window.isCompliant ? 'compliant' : 'non-compliant';
        const selectedClass = isSelected ? 'selected' : '';
        
        return `
            <div class="window-item ${statusClass} ${selectedClass}" data-index="${index}">
                <div class="window-header">
                    <span class="window-dates">${formatted.weekRange}</span>
                    <span class="window-status-icon">${window.isCompliant ? '✓' : '✗'}</span>
                </div>
                <div class="window-details">${formatted.dateRange}</div>
                <div class="window-result">
                    <span>Avg: ${formatted.average} → ${formatted.rounded}</span>
                    <span class="result-value ${statusClass}">Req: ${formatted.required}</span>
                </div>
            </div>
        `;
    }
    
    _renderSelectedWindowDetails(results, selectedIndex) {
        if (!results || selectedIndex === null || selectedIndex === undefined) {
            return '';
        }
        
        const window = results.windows[selectedIndex];
        if (!window) return '';
        
        const formatted = formatWindowForDisplay(window);
        const statusClass = window.isCompliant ? 'compliant' : 'non-compliant';
        
        return `
            <section class="sidebar-section window-details-section">
                <div class="window-details-header">
                    <h3 class="sidebar-section-title">Window Details</h3>
                    <button class="btn btn-sm btn-ghost" id="clearWindowSelection" title="Clear selection">✕</button>
                </div>
                <div class="selected-window-card ${statusClass}">
                    <div class="window-detail-row">
                        <span class="detail-label">Date Range</span>
                        <span class="detail-value">${formatted.dateRange}</span>
                    </div>
                    <div class="window-detail-row">
                        <span class="detail-label">Weeks</span>
                        <span class="detail-value">${formatted.weekRange}</span>
                    </div>
                    <div class="window-detail-row">
                        <span class="detail-label">Status</span>
                        <span class="detail-value status-badge ${statusClass}">
                            ${window.isCompliant ? '✓ Compliant' : '✗ Non-Compliant'}
                        </span>
                    </div>
                    <div class="window-detail-row">
                        <span class="detail-label">Best 8 Avg</span>
                        <span class="detail-value">${formatted.average} → ${formatted.rounded} days/week</span>
                    </div>
                    <div class="window-detail-row">
                        <span class="detail-label">Required</span>
                        <span class="detail-value">${formatted.required} days/week</span>
                    </div>
                    ${!window.isCompliant ? `
                    <div class="window-detail-row">
                        <span class="detail-label">Deficit</span>
                        <span class="detail-value deficit">${formatted.deficit} day(s)/week short</span>
                    </div>
                    ` : ''}
                    <div class="weekly-breakdown">
                        <span class="detail-label">Weekly Breakdown (12 weeks):</span>
                        <div class="weekly-values">
                            ${this._renderWeeklyValues(window)}
                        </div>
                        <span class="form-hint">Highlighted values are counted in "best 8"</span>
                    </div>
                </div>
            </section>
        `;
    }
    
    _renderWeeklyValues(window) {
        // Find which indices are in the best 8 (top 8 values)
        const indexed = window.weeklyValues.map((v, i) => ({ value: v, index: i }));
        const sorted = [...indexed].sort((a, b) => b.value - a.value);
        const best8Indices = new Set(sorted.slice(0, 8).map(x => x.index));
        
        return window.weeklyValues.map((v, i) => {
            const isBest8 = best8Indices.has(i);
            return `<span class="week-value ${isBest8 ? 'best8' : ''}" title="Week ${i + 1}">${v}</span>`;
        }).join('');
    }
    
    _renderHolidays() {
        const state = store.getState();
        const holidays = getHolidaysInRange(state.displayRange.months).map(({ dateStr, name }) => {
            const [year, month, day] = dateStr.split('-').map(Number);
            const monthName = MONTH_NAMES[month - 1].slice(0, 3);
            return { dateStr, name, display: `${monthName} ${day}, ${year}` };
        });
        
        return `
            <section class="sidebar-section">
                <h3 class="sidebar-section-title">Company Holidays</h3>
                <div class="holidays-list">
                    ${holidays.map(h => `
                        <div class="holiday-item">
                            <span class="holiday-date">${h.display}</span>
                            <span class="holiday-name">${h.name}</span>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }
}

customElements.define('sidebar-panel', SidebarPanel);
