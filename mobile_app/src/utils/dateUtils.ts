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
