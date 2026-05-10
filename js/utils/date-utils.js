/**
 * Date Utilities
 * 
 * Helper functions for date manipulation, week calculations,
 * and calendar generation.
 */

// Day of week constants (0 = Monday, matching our internal representation for business logic)
export const WEEKDAYS = {
    MONDAY: 0,
    TUESDAY: 1,
    WEDNESDAY: 2,
    THURSDAY: 3,
    FRIDAY: 4,
    SATURDAY: 5,
    SUNDAY: 6
};

// Day names for calendar display (Sunday first)
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Day names for weekday selection (Monday-Friday only, internal index 0-4)
export const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const WEEKDAY_ABBRS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// Month names
export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// RTO Policy enforcement start date
export const POLICY_START_DATE = '2026-01-26';

// Company Holidays (date string -> holiday name)
export const COMPANY_HOLIDAYS = {
    // 2026
    '2026-02-16': "Presidents' Day",
    '2026-05-25': 'Memorial Day',
    '2026-07-03': 'Independence Day',
    '2026-09-07': 'Labor Day',
    '2026-11-26': 'Thanksgiving Day',
    '2026-11-27': 'Day after Thanksgiving',
    '2026-12-24': 'Christmas Eve',
    '2026-12-25': 'Christmas Day',
    // 2027
    '2027-01-01': "New Year's Day",
    '2027-01-18': "Martin Luther King Jr. Day",
    '2027-02-15': "Presidents' Day",
    '2027-05-31': 'Memorial Day',
    '2027-07-05': 'Independence Day (Observed)',
    '2027-09-06': 'Labor Day',
    '2027-11-25': 'Thanksgiving Day',
    '2027-11-26': 'Day after Thanksgiving',
    '2027-12-24': 'Christmas Eve',
    '2027-12-25': 'Christmas Day'
};

/**
 * Check if a date is a company holiday
 * @param {string} isoString 
 * @returns {boolean}
 */
export function isCompanyHoliday(isoString) {
    return isoString in COMPANY_HOLIDAYS;
}

/**
 * Get holiday name for a date
 * @param {string} isoString 
 * @returns {string|null}
 */
export function getHolidayName(isoString) {
    return COMPANY_HOLIDAYS[isoString] || null;
}

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
    
    // Get day of week for first day (Sunday=0 format, which is JS default)
    const firstDayOfWeek = firstDay.getDay();
    
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
 * @param {number} year 
 * @param {number[]} daysOfWeek - Array of weekdays (0=Monday, 4=Friday)
 * @returns {string[]} Array of ISO date strings
 */
export function generateDefaultOfficeDates(year, daysOfWeek) {
    const dates = [];
    const date = new Date(year, 0, 1);
    const daysSet = new Set(daysOfWeek);
    
    while (date.getFullYear() === year) {
        const dateStr = toISODateString(date);
        const weekday = jsDateDayToWeekday(date.getDay());
        // Only include dates from policy start date onwards, excluding company holidays
        if (daysSet.has(weekday) && dateStr >= POLICY_START_DATE && !isCompanyHoliday(dateStr)) {
            dates.push(dateStr);
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
 * Check if a date is before the policy start date
 * @param {string} isoString 
 * @returns {boolean}
 */
export function isBeforePolicyStart(isoString) {
    return isoString < POLICY_START_DATE;
}

/**
 * Compute the rolling display range: 3 months back + 9 months forward from today.
 * @param {Date} [today] - Override for testing; defaults to now
 * @returns {{months: Array<{year: number, month: number}>, startYear: number, endYear: number}}
 */
export function getDisplayRange(today = new Date()) {
    const months = [];
    const start = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 9, 1);
    
    const current = new Date(start);
    while (current < end) {
        months.push({ year: current.getFullYear(), month: current.getMonth() });
        current.setMonth(current.getMonth() + 1);
    }
    
    return {
        months,
        startYear: months[0].year,
        endYear: months[months.length - 1].year
    };
}

/**
 * Get month key string for a year/month pair (e.g. "2026-05")
 * @param {number} year
 * @param {number} month (0-11)
 * @returns {string}
 */
export function toMonthKey(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Get all weeks that overlap a date range (by first/last day of range).
 * Returns weeks from the Monday on or before rangeStart through the week containing rangeEnd.
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {Array<{weekNumber: number, weekYear: number, start: Date, end: Date}>}
 */
export function getWeeksInRange(rangeStart, rangeEnd) {
    const weeks = [];
    let current = getWeekStart(rangeStart);
    const lastFriday = getWeekEnd(rangeEnd);
    
    while (current <= lastFriday) {
        weeks.push({
            weekNumber: getISOWeekNumber(current),
            weekYear: getISOWeekYear(current),
            start: new Date(current),
            end: getWeekEnd(current)
        });
        current.setDate(current.getDate() + 7);
    }
    
    return weeks;
}

/**
 * Generate default office dates for a specific set of months.
 * @param {Array<{year: number, month: number}>} months
 * @param {number[]} daysOfWeek - Array of weekdays (0=Monday, 4=Friday)
 * @returns {string[]} Array of ISO date strings
 */
export function generateDefaultOfficeDatesForMonths(months, daysOfWeek) {
    const dates = [];
    const daysSet = new Set(daysOfWeek);
    
    for (const { year, month } of months) {
        const date = new Date(year, month, 1);
        while (date.getMonth() === month && date.getFullYear() === year) {
            const dateStr = toISODateString(date);
            const weekday = jsDateDayToWeekday(date.getDay());
            if (daysSet.has(weekday) && dateStr >= POLICY_START_DATE && !isCompanyHoliday(dateStr)) {
                dates.push(dateStr);
            }
            date.setDate(date.getDate() + 1);
        }
    }
    
    return dates;
}

/**
 * Get holidays within a display range
 * @param {Array<{year: number, month: number}>} months
 * @returns {Array<{dateStr: string, name: string}>}
 */
export function getHolidaysInRange(months) {
    const monthKeys = new Set(months.map(m => toMonthKey(m.year, m.month)));
    return Object.entries(COMPANY_HOLIDAYS)
        .filter(([dateStr]) => {
            const key = dateStr.substring(0, 7); // "YYYY-MM"
            return monthKeys.has(key);
        })
        .map(([dateStr, name]) => ({ dateStr, name }));
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
