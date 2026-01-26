/**
 * RTO Planner - Main Application Entry Point
 * 
 * Orchestrates the application flow:
 * 1. Setup phase - collect user preferences
 * 2. Planning phase - calendar view with compliance checking
 */

import { store } from './state/store.js';
import { generateDefaultOfficeDates } from './utils/date-utils.js';
import { calculateCompliance } from './utils/compliance.js';

// Import all components
import './components/setup-form.js';
import './components/calendar-view.js';
import './components/sidebar.js';
import './components/action-bar.js';

class RTOPlannerApp {
    constructor() {
        this.setupSection = document.getElementById('setupSection');
        this.plannerSection = document.getElementById('plannerSection');
        this.yearBadge = document.getElementById('yearBadge');
        
        this._initialize();
    }
    
    _initialize() {
        // Update year badge
        const state = store.getState();
        this.yearBadge.textContent = state.year;
        
        // Check if setup is already complete (from storage)
        if (state.setupComplete && state.confirmedDates.length > 0) {
            this._showPlanner();
        } else {
            this._showSetup();
        }
        
        // Listen for setup completion
        document.addEventListener('setup-complete', (e) => {
            this._handleSetupComplete(e.detail);
        });
        
        // Listen for confirmation events (for logging/debugging)
        document.addEventListener('changes-confirmed', (e) => {
            console.log('Changes confirmed:', e.detail);
        });
    }
    
    _showSetup() {
        this.setupSection.classList.remove('hidden');
        this.plannerSection.classList.add('hidden');
    }
    
    _showPlanner() {
        this.setupSection.classList.add('hidden');
        this.plannerSection.classList.remove('hidden');
    }
    
    _handleSetupComplete({ defaultOfficeDays, requiredDays }) {
        const state = store.getState();
        const year = state.year;
        
        // Generate default office dates for the year
        const defaultDates = generateDefaultOfficeDates(year, defaultOfficeDays);
        
        // Calculate initial compliance
        const complianceResults = calculateCompliance(year, defaultDates, requiredDays);
        
        // Update store with all setup data
        store.setState({
            setupComplete: true,
            defaultOfficeDays,
            requiredDays,
            confirmedDates: defaultDates,
            pendingDates: defaultDates,
            complianceResults
        });
        
        // Switch to planner view
        this._showPlanner();
        
        console.log('Setup complete:', {
            defaultOfficeDays,
            requiredDays,
            totalDefaultDates: defaultDates.length,
            isCompliant: complianceResults.isCompliant
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new RTOPlannerApp();
});
