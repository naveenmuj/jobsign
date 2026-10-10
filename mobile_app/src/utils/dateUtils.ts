/**
 * Date and Timestamp Utilities for JobSign
 * Ensures unified, consistent date validation across all screens, cards, and stores.
 */

// Cutoff timestamp for valid modern business dates: 2020-01-01T00:00:00.000Z (1577836800000 ms)
// Rejects Unix epoch (0 ms / 1970), negative numbers, and legacy corruption.
export const MIN_VALID_TIMESTAMP = 1577836800000;

/**
 * Checks if a timestamp represents a valid modern date.
 */
export function isValidTimestamp(timestamp?: number | null): timestamp is number {
  return typeof timestamp === 'number' && !isNaN(timestamp) && timestamp > MIN_VALID_TIMESTAMP;
}

/**
 * Single source of truth for whether a quote is considered overdue.
 * A quote is overdue if it is NOT paid, has a valid due date, and the end of the due date day has passed.
 */
export function isQuoteOverdue(quote: { status: string; dueDateTimestamp?: number }): boolean {
  if (quote.status === 'PAID') return false;
  if (!isValidTimestamp(quote.dueDateTimestamp)) return false;
  const d = new Date(quote.dueDateTimestamp);
  const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
  return endOfDay < Date.now();
}

/**
 * Formats a timestamp into YYYY-MM-DD using the local device/user timezone (never UTC).
 * Guarantees date records match the user's local calendar day.
 */
export function formatLocalDate(timestamp?: number | null): string {
  if (!isValidTimestamp(timestamp)) return '';
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the local timezone offset string (e.g. "GMT+05:30" or "GMT-04:00").
 */
export function getLocalTimezoneOffset(timestamp: number = Date.now()): string {
  const offsetMinutes = -new Date(timestamp).getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absMin = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absMin / 60)).padStart(2, '0');
  const mins = String(absMin % 60).padStart(2, '0');
  return `GMT${sign}${hours}:${mins}`;
}

/**
 * Formats date and time using local timezone, with localized date, time, and timezone offset indicator.
 * Guarantees timestamps are never printed in forced UTC time.
 */
export function formatLocalDateTimeWithTz(timestamp?: number | null, locale?: string): string {
  if (!isValidTimestamp(timestamp)) return 'Pending Signature (Direct Issue)';
  const d = new Date(timestamp);
  const tzOffset = getLocalTimezoneOffset(timestamp);

  try {
    const formattedDate = d.toLocaleDateString(locale || undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const formattedTime = d.toLocaleTimeString(locale || undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${formattedDate}, ${formattedTime} (${tzOffset})`;
  } catch {
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()} (${tzOffset})`;
  }
}

/**
 * Formats a date using the user's local timezone (never UTC).
 * Example: "Oct 10, 2026"
 */
export function formatLocalDateDisplay(timestamp?: number | null, locale?: string): string {
  if (!isValidTimestamp(timestamp)) return '';
  const d = new Date(timestamp);
  try {
    return d.toLocaleDateString(locale || undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return d.toLocaleDateString();
  }
}

/**
 * Formats a short month + day using the user's local timezone (never UTC).
 * Example: "Oct 10"
 */
export function formatLocalShortDate(timestamp?: number | null, locale?: string): string {
  if (!isValidTimestamp(timestamp)) return '';
  const d = new Date(timestamp);
  try {
    return d.toLocaleDateString(locale || undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return d.toLocaleDateString();
  }
}

/**
 * Formats time using the user's local timezone (never UTC).
 * Example: "11:35 AM"
 */
export function formatLocalTime(timestamp?: number | null, locale?: string): string {
  if (!isValidTimestamp(timestamp)) return '';
  const d = new Date(timestamp);
  try {
    return d.toLocaleTimeString(locale || undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return d.toLocaleTimeString();
  }
}

/**
 * Formats date and time using the user's local timezone (never UTC).
 * Example: "Oct 10, 2026, 11:35 AM"
 */
export function formatLocalDateTime(timestamp?: number | null, locale?: string): string {
  if (!isValidTimestamp(timestamp)) return '';
  const d = new Date(timestamp);
  try {
    return d.toLocaleString(locale || undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  }
}
