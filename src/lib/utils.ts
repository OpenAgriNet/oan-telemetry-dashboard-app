import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { addMinutes, format as formatDateFnsInternal, addHours } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Export an array of objects to CSV and trigger a download.
 * @param data Array of objects to export
 * @param columns Array of { key, header } objects
 * @param filename Name of the CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string = 'export.csv'
) {
  if (!data.length) return;
  const escape = (str: string | number | null | undefined) => `"${String(str ?? '').replace(/"/g, '""')}"`;
  const headers = columns.map(col => escape(col.header)).join(',');
  const rows = data.map(row =>
    columns.map(col => escape(row[col.key] as string | number | null | undefined)).join(',')
  );
  const csv = [headers, ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converts a UTC date string or Date object to a proper UTC Date object.
 * This ensures consistent UTC parsing regardless of input format.
 * @param date UTC date string or Date object
 * @returns Date object representing the UTC time
 */
export function parseAsUTC(date: string | Date): Date {
  if (typeof date === 'string') {
    // Handle different date string formats and ensure they are treated as UTC
    if (date.includes('Z') || date.includes('+') || date.includes('-', 10)) {
      // String already has timezone info
      return new Date(date);
    } else {
      // String without timezone info - treat as UTC by appending 'Z'
      return new Date(date + (date.includes('T') ? 'Z' : 'T00:00:00Z'));
    }
  } else {
    return new Date(date.getTime());
  }
}

/**
 * Converts a UTC date string or Date object to IST (UTC+5:30) and returns a Date object representing that time in IST.
 * NOTE: This function returns a Date object with IST time but still in UTC representation.
 * For proper timezone display, use formatInTimeZone or formatUTCToIST instead.
 * @param date UTC date string or Date object
 * @returns Date object with IST time (but in UTC representation)
 */
export function convertUTCToIST(date: string | Date): Date {
  const utcDate = parseAsUTC(date);
  
  // IST is UTC+5:30 (330 minutes or 19800000 milliseconds ahead of UTC)
  const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
  return istDate;
}

/**
 * Formats a UTC date string to IST with optional PM correction.
 * 
 * @param dateString The UTC date string from the backend (e.g., "2025-01-10T07:16:47" or "2025-01-10T07:16:47Z").
 * @param pmCorrectionHoursAM An array of UTC hours (0-11) that should be shifted by +12 hours to convert AM to PM.
 *                            Example: [7] means if the UTC hour is 7 AM, treat it as 7 PM instead.
 * @param targetTimeZone The IANA timezone string for the output (default: 'Asia/Kolkata' for IST).
 * @param outputFormat The date-fns format string for the output.
 * @returns Formatted date string in the target timezone, or "N/A" if invalid.
 */
export function formatUtcDateWithPMCorrection(
  dateString: string | null | undefined,
  pmCorrectionHoursAM: number[] = [],
  targetTimeZone: string = 'Asia/Kolkata',
  outputFormat: string = "MMM dd, yyyy hh:mm a"
): string {
  if (!dateString) return "N/A";

  try {
    // Parse the date string as UTC
    let utcDate = parseAsUTC(dateString);

    // Check if the date is valid
    if (isNaN(utcDate.getTime())) {
      throw new Error('Invalid date string');
    }

    // Apply PM correction if needed
    const utcHour = utcDate.getUTCHours();
    if (pmCorrectionHoursAM.includes(utcHour)) {
      utcDate = addHours(utcDate, 12);
    }

    // Format the UTC date directly to the target timezone using formatInTimeZone
    // This properly handles the timezone conversion
    return formatInTimeZone(utcDate, targetTimeZone, outputFormat);

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Error formatting date "${dateString}": ${errMessage}`);
    
    // Fallback: try to parse as-is and format
    try {
      const fallbackDate = new Date(dateString);
      if (!isNaN(fallbackDate.getTime())) {
        return formatInTimeZone(fallbackDate, targetTimeZone, outputFormat);
      }
    } catch (fallbackError) {
      console.warn(`Fallback formatting also failed for "${dateString}"`);
    }
    
    return "N/A";
  }
}

/**
 * Simple UTC to IST formatter without PM correction
 * @param dateString UTC date string
 * @param outputFormat Output format (default: "MMM dd, yyyy hh:mm a")
 * @returns Formatted date string in IST
 */
export function formatUTCToIST(
  dateString: string | null | undefined,
  outputFormat: string = "MMM dd, yyyy hh:mm a"
): string {
  return formatUtcDateWithPMCorrection(dateString, [], 'Asia/Kolkata', outputFormat);
}
