/** Eloquent `decimal:2` casts arrive as strings ("1500.00"), so coerce first. */
export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export function formatPrice(value: string | number | null | undefined): string {
  return toNumber(value).toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

export function formatTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString();
}

/** "Cotton - White" -> "Cotton" */
export function threadType(threadName: string): string {
  return threadName.split(' - ')[0]?.trim() ?? threadName;
}

/** YYYY-MM-DD for <input type="date"> and the report endpoints. */
export function isoDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

/** Saves a Blob response (the CSV endpoints) to disk. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Error bodies for blob-typed requests arrive as a Blob, so the usual
 * `error.response.data.message` is unreadable. Pull the text back out.
 */
export async function blobErrorMessage(error: any, fallback: string): Promise<string> {
  const data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      return parsed.error || parsed.message || fallback;
    } catch {
      return fallback;
    }
  }
  return data?.error || data?.message || fallback;
}
