/**
 * Company Holidays Configuration
 * 
 * Centralized list of company holidays.
 * Holidays are unchecked by default when generating the schedule,
 * but users can still select them if they plan to go in.
 * 
 * To update holidays:
 * 1. Add/remove entries in the HOLIDAYS object below
 * 2. Each entry: 'YYYY-MM-DD': 'Holiday Name'
 * 3. Rebuild: npm run build
 */

// ================================
// Holiday Definitions by Year
// ================================

/**
 * Company holidays indexed by year
 * Format: { year: { 'YYYY-MM-DD': 'Holiday Name', ... } }
 */
const HOLIDAYS = {
    2026: {
        '2026-01-01': "New Year's Day",
        '2026-01-19': 'Martin Luther King Day',
        '2026-02-16': "Presidents Day",
        '2026-05-25': 'Memorial Day',
        '2026-07-03': 'Independence Day',
        '2026-09-07': 'Labor Day',
        '2026-11-26': 'Thanksgiving Day',
        '2026-11-27': 'Day after Thanksgiving',
        '2026-12-24': 'Christmas Eve',
        '2026-12-25': 'Christmas Day',
    }
};

// ================================
// Holiday API
// ================================

/**
 * Get all holidays for a specific year
 * @param {number} year 
 * @returns {Object<string, string>} Map of ISO date string to holiday name
 */
export function getHolidaysForYear(year) {
    return HOLIDAYS[year] || {};
}

/**
 * Get holiday dates as an array for a specific year
 * @param {number} year 
 * @returns {string[]} Array of ISO date strings
 */
export function getHolidayDates(year) {
    return Object.keys(HOLIDAYS[year] || {});
}

/**
 * Check if a date is a holiday
 * @param {string} isoDateString - Date in 'YYYY-MM-DD' format
 * @returns {boolean}
 */
export function isHoliday(isoDateString) {
    const year = parseInt(isoDateString.slice(0, 4), 10);
    const yearHolidays = HOLIDAYS[year];
    return yearHolidays ? isoDateString in yearHolidays : false;
}

/**
 * Get the name of a holiday
 * @param {string} isoDateString - Date in 'YYYY-MM-DD' format
 * @returns {string|null} Holiday name or null if not a holiday
 */
export function getHolidayName(isoDateString) {
    const year = parseInt(isoDateString.slice(0, 4), 10);
    const yearHolidays = HOLIDAYS[year];
    return yearHolidays ? yearHolidays[isoDateString] || null : null;
}

/**
 * Get all holidays as a flat array with details
 * @param {number} year 
 * @returns {Array<{date: string, name: string}>}
 */
export function getHolidayList(year) {
    const yearHolidays = HOLIDAYS[year] || {};
    return Object.entries(yearHolidays)
        .map(([date, name]) => ({ date, name }))
        .sort((a, b) => a.date.localeCompare(b.date));
}
