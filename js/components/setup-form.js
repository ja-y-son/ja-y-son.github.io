/**
 * Setup Form Component
 * 
 * Collects initial user preferences:
 * - Which days of the week they typically come to office
 * - How many days per week their org requires
 */

import { WEEKDAY_NAMES, WEEKDAY_ABBRS } from '../utils/date-utils.js';

const template = document.createElement('template');
template.innerHTML = `
    <div class="setup-card">
        <h2 class="setup-title">Plan Your Return to Office</h2>
        <p class="setup-subtitle">
            Set up your typical office schedule and organization requirements to start planning.
        </p>
        
        <form class="setup-form" id="setupForm">
            <div class="form-group">
                <label class="form-label">Which days do you typically come to the office?</label>
                <div class="day-checkbox-group" id="dayCheckboxGroup">
                    <!-- Days will be rendered here -->
                </div>
                <p class="form-hint">Select the days you normally plan to be in the office.</p>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="requiredDays">
                    How many days per week does your org require?
                </label>
                <div class="required-days-input">
                    <input 
                        type="number" 
                        id="requiredDays" 
                        class="number-input" 
                        min="1" 
                        max="5" 
                        value="3"
                        required
                    >
                    <span class="input-suffix">days per week</span>
                </div>
                <p class="form-hint">This is the minimum average required by your organization.</p>
            </div>
            
            <button type="submit" class="btn btn-primary btn-lg setup-submit">
                Start Planning
            </button>
        </form>
    </div>
`;

export class SetupForm extends HTMLElement {
    constructor() {
        super();
        this._selectedDays = new Set([1, 2, 3]); // Default: Tue, Wed, Thu
    }
    
    connectedCallback() {
        this.appendChild(template.content.cloneNode(true));
        this._renderDayCheckboxes();
        this._setupEventListeners();
    }
    
    disconnectedCallback() {
        // Cleanup if needed
    }
    
    _renderDayCheckboxes() {
        const container = this.querySelector('#dayCheckboxGroup');
        container.innerHTML = '';
        
        // Only show Monday-Friday (indices 0-4)
        for (let i = 0; i < 5; i++) {
            const isChecked = this._selectedDays.has(i);
            const dayEl = document.createElement('label');
            dayEl.className = `day-checkbox${isChecked ? ' checked' : ''}`;
            dayEl.innerHTML = `
                <input type="checkbox" name="day" value="${i}" ${isChecked ? 'checked' : ''}>
                <span class="day-abbr">${WEEKDAY_ABBRS[i]}</span>
                <span class="day-full">${WEEKDAY_NAMES[i]}</span>
            `;
            container.appendChild(dayEl);
        }
    }
    
    _setupEventListeners() {
        const form = this.querySelector('#setupForm');
        const checkboxGroup = this.querySelector('#dayCheckboxGroup');
        
        // Handle checkbox changes
        checkboxGroup.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const day = parseInt(e.target.value, 10);
                const label = e.target.closest('.day-checkbox');
                
                if (e.target.checked) {
                    this._selectedDays.add(day);
                    label.classList.add('checked');
                } else {
                    this._selectedDays.delete(day);
                    label.classList.remove('checked');
                }
            }
        });
        
        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const requiredDays = parseInt(this.querySelector('#requiredDays').value, 10);
            const defaultOfficeDays = Array.from(this._selectedDays).sort((a, b) => a - b);
            
            // Validate
            if (defaultOfficeDays.length === 0) {
                alert('Please select at least one day of the week.');
                return;
            }
            
            if (requiredDays < 1 || requiredDays > 5) {
                alert('Required days must be between 1 and 5.');
                return;
            }
            
            // Dispatch custom event
            this.dispatchEvent(new CustomEvent('setup-complete', {
                bubbles: true,
                composed: true,
                detail: {
                    defaultOfficeDays,
                    requiredDays
                }
            }));
        });
    }
}

customElements.define('setup-form', SetupForm);
