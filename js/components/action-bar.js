/**
 * Action Bar Component
 * 
 * Provides Confirm and Cancel buttons for pending changes.
 * Shows count of pending changes.
 */

import { store } from '../state/store.js';
import { calculateCompliance } from '../utils/compliance.js';

export class ActionBar extends HTMLElement {
    constructor() {
        super();
        this._unsubscribe = null;
    }
    
    connectedCallback() {
        this._render();
        this._setupEventListeners();
        
        // Subscribe to store updates
        this._unsubscribe = store.subscribe(() => {
            this._updateState();
        });
    }
    
    disconnectedCallback() {
        if (this._unsubscribe) {
            this._unsubscribe();
        }
    }
    
    _render() {
        this.innerHTML = `
            <div class="action-bar-content">
                <div class="pending-indicator hidden" id="pendingIndicator">
                    <span class="pending-count" id="pendingCount">0</span>
                    <span>changes pending</span>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-secondary" id="cancelBtn" disabled>
                        Cancel
                    </button>
                    <button class="btn btn-primary" id="confirmBtn" disabled>
                        Confirm Changes
                    </button>
                </div>
            </div>
        `;
        
        this._updateState();
    }
    
    _setupEventListeners() {
        this.addEventListener('click', (e) => {
            if (e.target.id === 'confirmBtn') {
                this._handleConfirm();
            } else if (e.target.id === 'cancelBtn') {
                this._handleCancel();
            }
        });
    }
    
    _updateState() {
        const hasPending = store.hasPendingChanges();
        const changes = store.getPendingChanges();
        
        const confirmBtn = this.querySelector('#confirmBtn');
        const cancelBtn = this.querySelector('#cancelBtn');
        const indicator = this.querySelector('#pendingIndicator');
        const countEl = this.querySelector('#pendingCount');
        
        if (confirmBtn) confirmBtn.disabled = !hasPending;
        if (cancelBtn) cancelBtn.disabled = !hasPending;
        
        if (indicator) {
            indicator.classList.toggle('hidden', !hasPending);
        }
        
        if (countEl) {
            countEl.textContent = changes.total;
        }
    }
    
    _handleConfirm() {
        const state = store.getState();
        
        // Apply pending changes to confirmed
        const newConfirmedDates = [...state.pendingDates];
        
        // Calculate compliance with new dates
        const complianceResults = calculateCompliance(
            state.year,
            newConfirmedDates,
            state.requiredDays
        );
        
        // Update store
        store.setState({
            confirmedDates: newConfirmedDates,
            pendingDates: newConfirmedDates,
            complianceResults
        });
        
        // Dispatch event for any listeners
        this.dispatchEvent(new CustomEvent('changes-confirmed', {
            bubbles: true,
            composed: true,
            detail: { complianceResults }
        }));
    }
    
    _handleCancel() {
        const state = store.getState();
        
        // Revert pending to match confirmed
        store.setState({
            pendingDates: [...state.confirmedDates]
        });
        
        // Dispatch event
        this.dispatchEvent(new CustomEvent('changes-cancelled', {
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define('action-bar', ActionBar);
