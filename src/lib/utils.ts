import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { addMinutes, format as formatDateFnsInternal, addHours, parseISO } from "date-fns"
import { toZonedTime, formatInTimeZone } from "date-fns-tz"

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
 * Converts a UTC date string or Date object to IST (UTC+5:30) and returns a Date object representing that time in IST.
 * This function is primarily for consistency or if a Date object in the target timezone is specifically needed.
 * For formatting directly, consider using formatInTimeZone where possible.
 * @param date UTC date string or Date object
 * @returns Date object representing the time in IST
 */
export function convertUTCToIST(date: string | Date): Date {
  // Ensure input is a Date object, treating string as UTC
  const utcDate = typeof date === 'string' ? new Date(date) : new Date(date.getTime());

  // Define the target timezone
  const targetTimeZone = 'Asia/Kolkata'; // IST

  // Convert the UTC date to a Date object representing the time in the target timezone
  const istDate = toZonedTime(utcDate, targetTimeZone);

  return istDate;
}

/**
 * Formats an ISO date string, with a potential adjustment for hours that are
 * parsed as AM from the string but are intended by the backend to be PM.
 * Assumes the input dateString without an offset is intended as UTC.
 *
 * @param dateString The ISO-like date string from the backend (e.g., "2025-05-22T07:16:47").
 *                   It's assumed to be UTC if no offset is specified.
 * @param pmCorrectionHoursAM An array of UTC hours (0-11) that, if parsed from the string
 *                            (e.g., 'T07' implies 7 AM UTC), indicate the time should be
 *                            shifted by +12 hours (e.g., to 7 PM UTC).
 *                            Example: [7] for the user's case.
 * @param targetTimeZone The IANA timezone string for the output (e.g., 'Asia/Kolkata').
 * @param outputFormat The date-fns format string for the output.
 * @returns Formatted date string in the targetTimeZone, or "N/A".
 */
export function formatUtcDateWithPMCorrection(
  dateString: string | null | undefined,
  pmCorrectionHoursAM: number[] = [],
  targetTimeZone: string = 'Asia/Kolkata',
  outputFormat: string = "MMM dd, yyyy hh:mm a"
): string {
  if (!dateString) return "N/A";

  try {
    // 1. Parse the ISO string. parseISO correctly handles strings like "2025-05-22T07:16:47"
    //    as 7:16:47 AM UTC.
    let date = parseISO(dateString);

    // 2. Get the hour in UTC from the parsed date.
    const utcHour = date.getUTCHours();

    // 3. If this UTC hour is in the pmCorrectionHoursAM list, add 12 hours to the date.
    //    This effectively shifts an AM time to PM in UTC.
    if (pmCorrectionHoursAM.includes(utcHour)) {
      date = addHours(date, 12);
    }

    // 4. Format the (potentially adjusted) UTC Date object into the target timezone and format.
    return formatInTimeZone(date, targetTimeZone, outputFormat);

  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Error in formatUtcDateWithPMCorrection for dateString "${dateString}" (pmCorrectionHoursAM: [${pmCorrectionHoursAM.join(', ')}]): ${errMessage}`);
    // Fallback: Try to format directly using toZonedTime and date-fns format,
    // which might work if the dateString is in a format they can handle and the primary logic failed.
    try {
      // toZonedTime's parsing behavior for ambiguous strings might differ from parseISO.
      // It might interpret "2025-05-22T07:16:47" as local time if not careful.
      // However, if parseISO failed, this is a last resort.
      const zonedDate = toZonedTime(dateString, targetTimeZone); 
      return formatDateFnsInternal(zonedDate, outputFormat); // Use the aliased format
    } catch (fallbackError) {
      const fallbackErrMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      console.warn(`Fallback formatting failed for dateString "${dateString}": ${fallbackErrMessage}`);
      return "N/A"; // Final fallback
    }
  }
}
