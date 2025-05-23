import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
