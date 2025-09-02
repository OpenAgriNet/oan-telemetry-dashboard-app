import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { addMinutes, format as formatDateFnsInternal, addHours } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Unified date range utility for consistent API parameter building
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface DateRangeOptions {
  // Whether to include a default start date when no dates are provided
  includeDefaultStart?: boolean;
  // Default start date to use (defaults to '2020-01-01')
  defaultStartDate?: string;
  // Additional parameters to include (like granularity)
  additionalParams?: Record<string, string | undefined>;
}

/**
 * Build date range params. Previous implementation tried to normalise to IST which
 * resulted in startDate appearing as previous day (e.g. Aug 27 -> Aug 26 18:30:00Z).
 * For API expectations that treat the incoming ISO strictly by its UTC calendar day,
 * we now default to sending the exact selected calendar day boundaries in UTC
 * (00:00:00.000Z to 23:59:59.999Z) so the network tab shows the same dates picked.
 *
 * If you still need IST aligned windows you can pass alignToIST: true.
 */
export function buildDateRangeParams(
  dateRange: { from?: Date; to?: Date },
  options: DateRangeOptions & { alignToIST?: boolean } = {}
): DateRangeParams & Record<string, string | undefined> {
  const params: DateRangeParams & Record<string, string | undefined> = {};

  const {
    includeDefaultStart = false,
    defaultStartDate = '2020-01-01',
    additionalParams = {},
    alignToIST = false
  } = options;

  const buildBoundary = (
    base: Date,
    end: boolean
  ) => {
    const year = base.getFullYear();
    const month = base.getMonth();
    const day = base.getDate();
    if (alignToIST) {
      // Recreate old behaviour (IST window converted to UTC)
      const istString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${end ? '23:59:59.999' : '00:00:00.000'}+05:30`;
      return new Date(istString).toISOString();
    }
    // Pure UTC boundaries
    const utcDate = new Date(Date.UTC(year, month, day, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0));
    return utcDate.toISOString();
  };

  if (dateRange.from) {
    params.startDate = buildBoundary(new Date(dateRange.from), false);
  } else if (includeDefaultStart) {
    params.startDate = buildBoundary(new Date(defaultStartDate), false);
  }

  if (dateRange.to) {
    params.endDate = buildBoundary(new Date(dateRange.to), true);
  } else if (dateRange.from) {
    params.endDate = buildBoundary(new Date(dateRange.from), true);
  }

  return { ...params, ...additionalParams };
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

/**
 * Format a date/timestamp for chart X-axis display in IST
 * @param tickItem The date string, timestamp, or hour number from chart data
 * @param isHourly Whether this is hourly data (uses hour numbers)
 * @returns Formatted string for X-axis display
 */
export function formatChartXAxisToIST(tickItem: string | number, isHourly: boolean = false): string {
  if (tickItem === null || tickItem === undefined) return "";

  try {
    // Convert to string if it's a number
    const tickStr = String(tickItem);
    
    // If it's a number (hour), format it as hour display in IST
    if (isHourly && (typeof tickItem === 'number' || /^\d+$/.test(tickStr))) {
      const utcHour = parseInt(tickStr);
      // Convert UTC hour to IST hour (UTC+5:30)
      let istHour = (utcHour + 5.5) % 24;
      const minutes = istHour % 1 === 0.5 ? 30 : 0;
      istHour = Math.floor(istHour);
      
      // Convert to 12-hour format
      const period = istHour >= 12 ? 'PM' : 'AM';
      const displayHour = istHour === 0 ? 12 : istHour > 12 ? istHour - 12 : istHour;
      
      return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`;
    }
    
    // Check if this is a timestamp (hourly data) with date string
    if (tickStr.includes('T') || tickStr.includes(' ')) {
      // This is likely an ISO timestamp or has hour information
      return formatUTCToIST(tickStr, "MMM dd");
    }
    
    // For daily data, try to format as date
    if (!isHourly) {
      return formatUTCToIST(tickStr, "MMM dd");
    }
    
    return tickStr;
  } catch (error) {
    console.error('Error formatting X axis tick:', error, tickItem);
    return String(tickItem);
  }
}

/**
 * Format tooltip date/time information for charts in IST
 * @param data The data object from chart tooltip
 * @param label The label from chart
 * @param isHourly Whether this is hourly data
 * @returns Object with formatted label and timestamp info
 */
export function formatChartTooltipToIST(
  data: Record<string, unknown>, 
  label: string | number,
  isHourly: boolean = false
): { formattedLabel: string; timestampInfo: string } {
  let formattedLabel = String(label);
  let timestampInfo = '';
  
  try {
    // Check if we have timestamp data
    if (data.timestamp) {
      const date = new Date(parseInt(String(data.timestamp)));
      // For hourly view keep time, for daily omit time
      timestampInfo = isHourly
        ? formatInTimeZone(date, 'Asia/Kolkata', "MMM dd, yyyy hh:mm a")
        : formatInTimeZone(date, 'Asia/Kolkata', "MMM dd, yyyy");
    } else if (data.date) {
      // Try to parse the date string and convert to IST
      const dateStr = String(data.date);
      timestampInfo = isHourly
        ? formatUTCToIST(dateStr, "MMM dd, yyyy hh:mm a")
        : formatUTCToIST(dateStr, "MMM dd, yyyy");
    }
    
    // For hourly data, show the hour more clearly
    if (isHourly && typeof label === 'number') {
      // Convert UTC hour to IST hour (UTC+5:30)
      const utcHour = label;
      let istHour = (utcHour + 5.5) % 24;
      const minutes = istHour % 1 === 0.5 ? 30 : 0;
      istHour = Math.floor(istHour);
      
      // Convert to 12-hour format
      const period = istHour >= 12 ? 'PM' : 'AM';
      const displayHour = istHour === 0 ? 12 : istHour > 12 ? istHour - 12 : istHour;
      
      formattedLabel = `${displayHour}:${minutes.toString().padStart(2, '0')} ${period} IST`;
      
      // If we have a date context, add it in IST
      if (data.date && !String(data.date).includes('Hour')) {
        const baseDate = parseAsUTC(String(data.date));
        // Create the UTC timestamp for this hour
        baseDate.setUTCHours(utcHour, 0, 0, 0);
        // Format it properly to IST
        timestampInfo = formatInTimeZone(baseDate, 'Asia/Kolkata', "MMM dd, yyyy hh:mm a");
      }
    } else if (!isHourly && data.date) {
      // For daily data, format the label as well (date only)
      formattedLabel = formatUTCToIST(String(data.date), "MMM dd, yyyy");
      // Avoid duplicate line showing same date twice – we already put date in formattedLabel
      // so clear timestampInfo for daily to hide second line
      timestampInfo = '';
    }
  } catch (error) {
    console.warn('Error formatting tooltip timestamp:', error);
  }
  
  return { formattedLabel, timestampInfo };
}
