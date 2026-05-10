/**
 * Store - State Management with Storage Abstraction
 * 
 * Manages application state with a publish/subscribe pattern.
 * Storage layer is abstracted to allow easy switching between
 * session storage, local storage, or other persistence methods.
 */

// ================================
// Storage Adapters
// ================================

/**
 * Session Storage Adapter (default)
 */
const SessionStorageAdapter = {
    save(key, data) {
        try {
            sessionStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('SessionStorage save error:', e);
            return false;
        }
    },
    
    load(key) {
        try {
            const data = sessionStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('SessionStorage load error:', e);
            return null;
        }
    },
    
    clear(key) {
        try {
            if (key) {
                sessionStorage.removeItem(key);
            } else {
                sessionStorage.clear();
            }
            return true;
        } catch (e) {
            console.error('SessionStorage clear error:', e);
            return false;
        }
    }
};

/**
 * Local Storage Adapter (for future use)
 */
const LocalStorageAdapter = {
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('LocalStorage save error:', e);
            return false;
        }
    },
    
    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('LocalStorage load error:', e);
            return null;
        }
    },
    
    clear(key) {
        try {
            if (key) {
                localStorage.removeItem(key);
            } else {
                localStorage.clear();
            }
            return true;
        } catch (e) {
            console.error('LocalStorage clear error:', e);
            return false;
        }
    }
};

/**
 * In-Memory Storage Adapter (fallback)
 */
const MemoryStorageAdapter = {
    _data: new Map(),
    
    save(key, data) {
        this._data.set(key, JSON.parse(JSON.stringify(data)));
        return true;
    },
    
    load(key) {
        const data = this._data.get(key);
        return data ? JSON.parse(JSON.stringify(data)) : null;
    },
    
    clear(key) {
        if (key) {
            this._data.delete(key);
        } else {
            this._data.clear();
        }
        return true;
    }
};

// ================================
// Store Configuration
// ================================

const STORAGE_KEY = 'rto-planner-state';

// Choose storage adapter here (easy to switch later)
let storageAdapter = SessionStorageAdapter;

/**
 * Set the storage adapter
 * @param {'session' | 'local' | 'memory'} type 
 */
export function setStorageAdapter(type) {
    switch (type) {
        case 'local':
            storageAdapter = LocalStorageAdapter;
            break;
        case 'memory':
            storageAdapter = MemoryStorageAdapter;
            break;
        case 'session':
        default:
            storageAdapter = SessionStorageAdapter;
    }
}

// ================================
// Initial State
// ================================

import { getDisplayRange, toMonthKey, generateDefaultOfficeDatesForMonths } from '../utils/date-utils.js';

const initialState = {
    // Setup phase completed
    setupComplete: false,
    
    // User's typical office days (0 = Monday, 4 = Friday)
    defaultOfficeDays: [],
    
    // Org requirement (days per week)
    requiredDays: 3,
    
    // Rolling display range (computed on load, not persisted)
    displayRange: getDisplayRange(),
    
    // Months that have been populated with defaults (persisted)
    populatedMonths: [],
    
    // Confirmed office attendance dates (array of ISO date strings)
    confirmedDates: [],
    
    // Pending changes (array of ISO date strings)
    pendingDates: [],
    
    // Compliance results
    complianceResults: null,
    
    // Selected sliding window index (null = none selected)
    selectedWindowIndex: null
};

// ================================
// Store Implementation
// ================================

class Store {
    constructor() {
        this._state = { ...initialState };
        this._subscribers = new Set();
        this._loadFromStorage();
    }
    
    /**
     * Get current state (returns a copy)
     */
    getState() {
        return {
            ...this._state,
            confirmedDates: [...this._state.confirmedDates],
            pendingDates: [...this._state.pendingDates],
            defaultOfficeDays: [...this._state.defaultOfficeDays],
            populatedMonths: [...this._state.populatedMonths]
        };
    }
    
    /**
     * Get a specific value from state
     */
    get(key) {
        const value = this._state[key];
        if (Array.isArray(value)) {
            return [...value];
        }
        if (value && typeof value === 'object') {
            return { ...value };
        }
        return value;
    }
    
    /**
     * Update state
     * @param {Partial<typeof initialState>} updates 
     */
    setState(updates) {
        const prevState = this._state;
        this._state = {
            ...this._state,
            ...updates
        };
        
        // Persist to storage
        this._saveToStorage();
        
        // Notify subscribers
        this._notify(prevState);
    }
    
    /**
     * Subscribe to state changes
     * @param {Function} callback 
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this._subscribers.add(callback);
        return () => this._subscribers.delete(callback);
    }
    
    /**
     * Reset state to initial
     */
    reset() {
        this._state = { ...initialState, displayRange: getDisplayRange() };
        storageAdapter.clear(STORAGE_KEY);
        this._notify({});
    }
    
    /**
     * Select a sliding window by index
     * @param {number|null} index - Window index (0-based) or null to deselect
     */
    selectWindow(index) {
        this.setState({ selectedWindowIndex: index });
    }
    
    /**
     * Clear window selection
     */
    clearWindowSelection() {
        this.setState({ selectedWindowIndex: null });
    }
    
    /**
     * Check if there are pending changes
     */
    hasPendingChanges() {
        const confirmed = new Set(this._state.confirmedDates);
        const pending = new Set(this._state.pendingDates);
        
        if (confirmed.size !== pending.size) return true;
        
        for (const date of confirmed) {
            if (!pending.has(date)) return true;
        }
        
        return false;
    }
    
    /**
     * Get pending changes details
     */
    getPendingChanges() {
        const confirmed = new Set(this._state.confirmedDates);
        const pending = new Set(this._state.pendingDates);
        
        const added = [];
        const removed = [];
        
        for (const date of pending) {
            if (!confirmed.has(date)) {
                added.push(date);
            }
        }
        
        for (const date of confirmed) {
            if (!pending.has(date)) {
                removed.push(date);
            }
        }
        
        return { added, removed, total: added.length + removed.length };
    }
    
    // Private methods
    
    _notify(prevState) {
        const currentState = this.getState();
        this._subscribers.forEach(callback => {
            try {
                callback(currentState, prevState);
            } catch (e) {
                console.error('Store subscriber error:', e);
            }
        });
    }
    
    _saveToStorage() {
        const persistedState = {
            setupComplete: this._state.setupComplete,
            defaultOfficeDays: this._state.defaultOfficeDays,
            requiredDays: this._state.requiredDays,
            populatedMonths: this._state.populatedMonths,
            confirmedDates: this._state.confirmedDates
        };
        storageAdapter.save(STORAGE_KEY, persistedState);
    }
    
    _loadFromStorage() {
        const saved = storageAdapter.load(STORAGE_KEY);
        if (!saved) return;
        
        const displayRange = getDisplayRange();
        
        // Migrate from old year-based format
        let populatedMonths = saved.populatedMonths;
        if (!populatedMonths && saved.year) {
            // Convert old format: all months of that year from policy start onward
            populatedMonths = [];
            for (let m = 0; m < 12; m++) {
                populatedMonths.push(toMonthKey(saved.year, m));
            }
        }
        populatedMonths = populatedMonths || [];
        
        let confirmedDates = saved.confirmedDates || [];
        
        // Auto-populate new months that entered the display range
        if (saved.setupComplete && saved.defaultOfficeDays && saved.defaultOfficeDays.length > 0) {
            const populatedSet = new Set(populatedMonths);
            const newMonths = displayRange.months.filter(
                m => !populatedSet.has(toMonthKey(m.year, m.month))
            );
            
            if (newMonths.length > 0) {
                const newDates = generateDefaultOfficeDatesForMonths(newMonths, saved.defaultOfficeDays);
                confirmedDates = [...confirmedDates, ...newDates];
                for (const m of newMonths) {
                    populatedMonths.push(toMonthKey(m.year, m.month));
                }
            }
        }
        
        this._state = {
            ...this._state,
            setupComplete: saved.setupComplete || false,
            defaultOfficeDays: saved.defaultOfficeDays || [],
            requiredDays: saved.requiredDays || 3,
            displayRange,
            populatedMonths,
            confirmedDates,
            pendingDates: [...confirmedDates]
        };
        
        // Re-persist with migrated data
        this._saveToStorage();
    }
}

// Export singleton instance
export const store = new Store();

// Export for debugging
if (typeof window !== 'undefined') {
    window.__RTO_STORE__ = store;
}
