/**
 * Date Utilities
 * 
 * Helper functions for date manipulation, week calculations,
 * and calendar generation.
 */

import { isHoliday } from '../config/holidays.js';

// Day of week constants (0 = Monday, matching our internal representation)
export const WEEKDAYS = {
    MONDAY: 0,
    TUESDAY: 1,
    WEDNESDAY: 2,
    THURSDAY: 3,
    FRIDAY: 4,
    SATURDAY: 5,
    SUNDAY: 6
};

// Day names
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const DAY_ABBRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Month names
export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Convert JavaScript Date.getDay() (0=Sunday) to our format (0=Monday)
 */
export function jsDateDayToWeekday(jsDay) {
    return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Convert our weekday (0=Monday) to JavaScript Date.getDay() format (0=Sunday)
 */
export function weekdayToJsDateDay(weekday) {
    return weekday === 6 ? 0 : weekday + 1;
}

/**
 * Check if a date is a weekend
 * @param {Date} date 
 * @returns {boolean}
 */
export function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Check if a date is a weekday (Monday-Friday)
 * @param {Date} date 
 * @returns {boolean}
 */
export function isWeekday(date) {
    return !isWeekend(date);
}

/**
 * Format date as ISO string (YYYY-MM-DD)
 * @param {Date} date 
 * @returns {string}
 */
export function toISODateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse ISO date string to Date object
 * @param {string} isoString 
 * @returns {Date}
 */
export function parseISODateString(isoString) {
    const [year, month, day] = isoString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Get the Monday of the week containing the given date
 * @param {Date} date 
 * @returns {Date}
 */
export function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust to get Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * Get the Friday of the week containing the given date
 * @param {Date} date 
 * @returns {Date}
 */
export function getWeekEnd(date) {
    const monday = getWeekStart(date);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return friday;
}

/**
 * Get ISO week number for a date
 * Week 1 is the week containing the first Thursday of the year
 * @param {Date} date 
 * @returns {number}
 */
export function getISOWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // Sunday = 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Set to nearest Thursday
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNum;
}

/**
 * Get the year of the ISO week (can differ from calendar year at year boundaries)
 * @param {Date} date 
 * @returns {number}
 */
export function getISOWeekYear(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    return d.getUTCFullYear();
}

/**
 * Get the first day of the first week of the year (Monday)
 * This may be in the previous year
 * @param {number} year 
 * @returns {Date}
 */
export function getFirstWeekStart(year) {
    // Find January 4th (always in week 1)
    const jan4 = new Date(year, 0, 4);
    return getWeekStart(jan4);
}

/**
 * Get the last day of the last week of the year (Friday)
 * @param {number} year 
 * @returns {Date}
 */
export function getLastWeekEnd(year) {
    // Find December 28th (always in the last week of the year)
    const dec28 = new Date(year, 11, 28);
    return getWeekEnd(dec28);
}

/**
 * Get all weeks in a year with their start/end dates
 * @param {number} year 
 * @returns {Array<{weekNumber: number, start: Date, end: Date}>}
 */
export function getWeeksInYear(year) {
    const weeks = [];
    let current = getFirstWeekStart(year);
    const lastDay = getLastWeekEnd(year);
    
    while (current <= lastDay) {
        const weekNumber = getISOWeekNumber(current);
        const weekYear = getISOWeekYear(current);
        
        // Only include weeks that belong to the target year
        if (weekYear === year) {
            weeks.push({
                weekNumber,
                start: new Date(current),
                end: getWeekEnd(current)
            });
        }
        
        // Move to next week
        current.setDate(current.getDate() + 7);
    }
    
    return weeks;
}

/**
 * Get number of weeks in a year
 * @param {number} year 
 * @returns {number}
 */
export function getWeekCount(year) {
    // December 28th is always in the last week
    const dec28 = new Date(year, 11, 28);
    return getISOWeekNumber(dec28);
}

/**
 * Get all days in a month
 * @param {number} year 
 * @param {number} month (0-11)
 * @returns {Date[]}
 */
export function getDaysInMonth(year, month) {
    const days = [];
    const date = new Date(year, month, 1);
    
    while (date.getMonth() === month) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }
    
    return days;
}

/**
 * Get calendar grid for a month (includes padding for alignment)
 * @param {number} year 
 * @param {number} month (0-11)
 * @returns {Array<Date | null>} Array of 42 items (6 weeks x 7 days)
 */
export function getMonthCalendarGrid(year, month) {
    const grid = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (convert to Monday=0 format)
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        grid.push(null);
    }
    
    // Add all days of the month
    for (let d = 1; d <= lastDay.getDate(); d++) {
        grid.push(new Date(year, month, d));
    }
    
    // Pad to complete the last week (optional, for consistent grid)
    while (grid.length % 7 !== 0) {
        grid.push(null);
    }
    
    return grid;
}

/**
 * Get all weekday dates in a year
 * @param {number} year 
 * @returns {Date[]}
 */
export function getWeekdaysInYear(year) {
    const weekdays = [];
    const date = new Date(year, 0, 1);
    
    while (date.getFullYear() === year) {
        if (isWeekday(date)) {
            weekdays.push(new Date(date));
        }
        date.setDate(date.getDate() + 1);
    }
    
    return weekdays;
}

/**
 * Generate default office dates for a year based on selected days of week
 * Company holidays are unchecked by default (but still count toward RTO if selected)
 * @param {number} year 
 * @param {number[]} daysOfWeek - Array of weekdays (0=Monday, 4=Friday)
 * @returns {string[]} Array of ISO date strings
 */
export function generateDefaultOfficeDates(year, daysOfWeek) {
    const dates = [];
    const date = new Date(year, 0, 1);
    const daysSet = new Set(daysOfWeek);
    
    while (date.getFullYear() === year) {
        const weekday = jsDateDayToWeekday(date.getDay());
        const isoStr = toISODateString(date);
        // Include if it's a selected weekday AND not a holiday
        if (daysSet.has(weekday) && !isHoliday(isoStr)) {
            dates.push(isoStr);
        }
        date.setDate(date.getDate() + 1);
    }
    
    return dates;
}

/**
 * Check if a date string represents today
 * @param {string} isoString 
 * @returns {boolean}
 */
export function isToday(isoString) {
    return isoString === toISODateString(new Date());
}

/**
 * Format a date range for display
 * @param {Date} start 
 * @param {Date} end 
 * @returns {string}
 */
export function formatDateRange(start, end) {
    const startMonth = MONTH_NAMES[start.getMonth()].slice(0, 3);
    const endMonth = MONTH_NAMES[end.getMonth()].slice(0, 3);
    
    if (start.getFullYear() !== end.getFullYear()) {
        return `${startMonth} ${start.getDate()}, ${start.getFullYear()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    } else if (start.getMonth() !== end.getMonth()) {
        return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    } else {
        return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${end.getFullYear()}`;
    }
}
