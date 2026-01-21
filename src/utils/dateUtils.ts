/**
 * Date Utilities for IST (Indian Standard Time) API Integration
 * 
 * IMPORTANT: The backend API interprets ALL date strings as IST times, regardless of the 'Z' suffix.
 * 
 * Examples:
 * - Frontend sends: "2025-12-13T00:00:00.000Z"
 * - Backend interprets: December 13, 2025 at 00:00:00 IST (midnight IST)
 * - NOT as: December 12, 2025 at 18:30:00 UTC
 * 
 * This means when users select a date in the date picker, we can send it as-is
 * with the Z suffix, and the backend will correctly treat it as an IST time.
 */

/**
 * Formats a Date object to ISO string format that the backend interprets as IST.
 * 
 * Since the backend treats all incoming dates as IST regardless of the Z suffix,
 * we can simply use the local date components and format them as ISO strings.
 * 
 * @param date - The Date object to format
 * @returns ISO string that backend will interpret as IST (e.g., "2025-12-13T00:00:00.000Z")
 */
export function formatDateForAPI(date: Date): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error('Invalid date provided to formatDateForAPI');
  }
  
  // Extract the calendar date components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  
  // Return as ISO string - backend interprets this as IST time
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}Z`;
}

/**
 * Creates start of day (00:00:00.000) timestamp for a given date.
 * Backend will interpret this as midnight IST.
 * 
 * @param date - The date (can be Date object or date string like "2025-12-13")
 * @returns ISO string for start of day (e.g., "2025-12-13T00:00:00.000Z")
 */
export function getStartOfDay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided to getStartOfDay');
  }
  
  // Get just the date part (YYYY-MM-DD)
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  // Return midnight - backend interprets as 00:00:00 IST
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

/**
 * Creates end of day (23:59:59.999) timestamp for a given date.
 * Backend will interpret this as 23:59:59.999 IST.
 * 
 * @param date - The date (can be Date object or date string like "2025-12-13")
 * @returns ISO string for end of day (e.g., "2025-12-13T23:59:59.999Z")
 */
export function getEndOfDay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided to getEndOfDay');
  }
  
  // Get just the date part (YYYY-MM-DD)
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  // Return end of day - backend interprets as 23:59:59.999 IST
  return `${year}-${month}-${day}T23:59:59.999Z`;
}

/**
 * Creates a date range for a full day in IST.
 * 
 * @param date - The date (can be Date object or date string like "2025-12-13")
 * @returns Object with startDate and endDate ISO strings
 * 
 * @example
 * const range = getISTDayRange(new Date("2025-12-13"));
 * // Returns:
 * // {
 * //   startDate: "2025-12-13T00:00:00.000Z",  // Backend treats as Dec 13 00:00:00 IST
 * //   endDate: "2025-12-13T23:59:59.999Z"     // Backend treats as Dec 13 23:59:59.999 IST
 * // }
 */
export function getISTDayRange(date: Date | string): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate: getStartOfDay(date),
    endDate: getEndOfDay(date)
  };
}

/**
 * Formats a date range from the date picker for API calls.
 * Handles both single day and multi-day ranges.
 * 
 * @param dateRange - Object with optional from and to Date objects
 * @returns Object with startDate and endDate strings, or empty object if no dates
 * 
 * @example
 * // Single day selection
 * formatDateRangeForAPI({ from: new Date("2025-12-13"), to: undefined })
 * // Returns: { startDate: "2025-12-13T00:00:00.000Z", endDate: "2025-12-13T23:59:59.999Z" }
 * 
 * // Date range selection
 * formatDateRangeForAPI({ from: new Date("2025-12-13"), to: new Date("2025-12-15") })
 * // Returns: { startDate: "2025-12-13T00:00:00.000Z", endDate: "2025-12-15T23:59:59.999Z" }
 */
export function formatDateRangeForAPI(dateRange: {
  from?: Date;
  to?: Date;
}): { startDate?: string; endDate?: string } {
  const result: { startDate?: string; endDate?: string } = {};
  
  if (dateRange.from) {
    result.startDate = getStartOfDay(dateRange.from);
    
    // If no 'to' date, use the same day as end
    if (!dateRange.to) {
      result.endDate = getEndOfDay(dateRange.from);
    }
  }
  
  if (dateRange.to) {
    result.endDate = getEndOfDay(dateRange.to);
  }
  
  return result;
}

/**
 * Simple date formatter - just returns YYYY-MM-DD
 * Backend treats this as midnight IST on that date.
 * 
 * @param date - Date object or date string
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateOnly(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided to formatDateOnly');
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
