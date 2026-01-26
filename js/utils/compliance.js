/**
 * Compliance Calculator
 * 
 * Implements the 12-week sliding window compliance algorithm
 * for Microsoft's return-to-office policy.
 */

import { 
    getWeeksInYear, 
    parseISODateString, 
    getWeekStart, 
    toISODateString,
    formatDateRange 
} from './date-utils.js';

/**
 * Calculate weekly attendance from selected dates
 * @param {number} year 
 * @param {string[]} selectedDates - Array of ISO date strings
 * @returns {Map<string, number>} Map of week start date to attendance count
 */
export function calculateWeeklyAttendance(year, selectedDates) {
    const weeklyAttendance = new Map();
    const selectedSet = new Set(selectedDates);
    
    // Get all weeks in the year
    const weeks = getWeeksInYear(year);
    
    for (const week of weeks) {
        const weekStartKey = toISODateString(week.start);
        let count = 0;
        
        // Count weekdays (Mon-Fri) in this week that are selected
        const current = new Date(week.start);
        for (let i = 0; i < 5; i++) { // Monday to Friday
            const dateStr = toISODateString(current);
            if (selectedSet.has(dateStr)) {
                count++;
            }
            current.setDate(current.getDate() + 1);
        }
        
        weeklyAttendance.set(weekStartKey, count);
    }
    
    return weeklyAttendance;
}

/**
 * Round a number according to RTO policy rules
 * >= 0.5 rounds up, < 0.5 rounds down
 * @param {number} value 
 * @returns {number}
 */
export function policyRound(value) {
    const decimal = value - Math.floor(value);
    return decimal >= 0.5 ? Math.ceil(value) : Math.floor(value);
}

/**
 * Calculate the average for a 12-week window using best 8 of 12 rule
 * @param {number[]} weeklyValues - Array of 12 weekly attendance values
 * @returns {{average: number, rounded: number, best8: number[]}}
 */
export function calculateWindowResult(weeklyValues) {
    if (weeklyValues.length !== 12) {
        throw new Error(`Expected 12 weeks, got ${weeklyValues.length}`);
    }
    
    // Sort descending to get best weeks first
    const sorted = [...weeklyValues].sort((a, b) => b - a);
    
    // Take best 8 weeks
    const best8 = sorted.slice(0, 8);
    
    // Calculate average
    const sum = best8.reduce((acc, val) => acc + val, 0);
    const average = sum / 8;
    
    // Apply policy rounding
    const rounded = policyRound(average);
    
    return { average, rounded, best8 };
}

/**
 * Calculate compliance for all 12-week sliding windows in a year
 * @param {number} year 
 * @param {string[]} selectedDates - Array of ISO date strings
 * @param {number} requiredDays - Org requirement (days per week)
 * @returns {ComplianceResult}
 */
export function calculateCompliance(year, selectedDates, requiredDays) {
    const weeklyAttendance = calculateWeeklyAttendance(year, selectedDates);
    const weeks = getWeeksInYear(year);
    const weekKeys = weeks.map(w => toISODateString(w.start));
    
    const windows = [];
    const nonCompliantWindows = [];
    
    // Calculate each 12-week sliding window
    const totalWeeks = weekKeys.length;
    const numWindows = totalWeeks - 11; // Number of complete 12-week windows
    
    for (let i = 0; i < numWindows; i++) {
        const windowWeeks = weekKeys.slice(i, i + 12);
        const weeklyValues = windowWeeks.map(key => weeklyAttendance.get(key) || 0);
        
        const { average, rounded, best8 } = calculateWindowResult(weeklyValues);
        const isCompliant = rounded >= requiredDays;
        
        const startWeek = weeks[i];
        const endWeek = weeks[i + 11];
        
        const windowResult = {
            windowIndex: i + 1,
            startDate: toISODateString(startWeek.start),
            endDate: toISODateString(endWeek.end),
            startWeekNumber: startWeek.weekNumber,
            endWeekNumber: endWeek.weekNumber,
            weeklyValues,
            best8Weeks: best8,
            average,
            rounded,
            isCompliant,
            requiredDays
        };
        
        windows.push(windowResult);
        
        if (!isCompliant) {
            nonCompliantWindows.push(windowResult);
        }
    }
    
    return {
        year,
        requiredDays,
        totalWindows: windows.length,
        isCompliant: nonCompliantWindows.length === 0,
        windows,
        nonCompliantWindows,
        stats: calculateStats(selectedDates, weeklyAttendance, year)
    };
}

/**
 * Calculate summary statistics
 * @param {string[]} selectedDates 
 * @param {Map<string, number>} weeklyAttendance 
 * @param {number} year 
 * @returns {object}
 */
function calculateStats(selectedDates, weeklyAttendance, year) {
    const totalOfficeDays = selectedDates.filter(d => d.startsWith(String(year))).length;
    const weeklyValues = Array.from(weeklyAttendance.values());
    const totalWeeks = weeklyValues.length;
    const avgPerWeek = totalWeeks > 0 ? totalOfficeDays / totalWeeks : 0;
    
    return {
        totalOfficeDays,
        totalWeeks,
        averagePerWeek: Math.round(avgPerWeek * 10) / 10
    };
}

/**
 * Format a window result for display
 * @param {object} window 
 * @returns {object}
 */
export function formatWindowForDisplay(window) {
    const startDate = parseISODateString(window.startDate);
    const endDate = parseISODateString(window.endDate);
    
    return {
        dateRange: formatDateRange(startDate, endDate),
        weekRange: `Weeks ${window.startWeekNumber}-${window.endWeekNumber}`,
        average: window.average.toFixed(2),
        rounded: window.rounded,
        required: window.requiredDays,
        isCompliant: window.isCompliant,
        deficit: window.isCompliant ? 0 : window.requiredDays - window.rounded
    };
}

/**
 * @typedef {Object} WindowResult
 * @property {number} windowIndex - 1-based index of the window
 * @property {string} startDate - ISO date string
 * @property {string} endDate - ISO date string
 * @property {number} startWeekNumber - ISO week number
 * @property {number} endWeekNumber - ISO week number
 * @property {number[]} weeklyValues - Attendance for each of 12 weeks
 * @property {number[]} best8Weeks - Best 8 week values (sorted)
 * @property {number} average - Average of best 8 weeks
 * @property {number} rounded - Rounded result
 * @property {boolean} isCompliant - Whether window meets requirement
 * @property {number} requiredDays - The org requirement
 */

/**
 * @typedef {Object} ComplianceResult
 * @property {number} year
 * @property {number} requiredDays
 * @property {number} totalWindows
 * @property {boolean} isCompliant - Overall compliance
 * @property {WindowResult[]} windows - All window results
 * @property {WindowResult[]} nonCompliantWindows - Only failing windows
 * @property {object} stats - Summary statistics
 */
