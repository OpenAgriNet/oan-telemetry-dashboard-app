// Preserve HTTP failures so the detail views can distinguish denied access from missing data.
export async function fetchOptionalDetail<T>(url: string): Promise<T | null> {
  const response = await fetch(url);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  return response.json();
}

// Session timelines must include every page of feedback and errors.
export async function fetchSessionRecords<T>(url: string): Promise<T[]> {
  const records: T[] = [];
  let page = 1;
  while (true) {
    const response = await fetch(`${url}?page=${page}&limit=100`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.success === false || !Array.isArray(result.data)) {
      throw new Error("Invalid session detail response");
    }
    records.push(...result.data);
    const hasNextPage = result.pagination?.hasNextPage ??
      (page < (result.pagination?.totalPages ?? 1));
    if (!hasNextPage) return records;
    if (result.data.length === 0) throw new Error("Incomplete session detail response");
    page += 1;
  }
}
