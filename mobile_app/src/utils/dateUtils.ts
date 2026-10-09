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
 * A quote is overdue if it is NOT paid, has a valid due date, and that due date is in the past.
 */
export function isQuoteOverdue(quote: { status: string; dueDateTimestamp?: number }): boolean {
  if (quote.status === 'PAID') return false;
  return isValidTimestamp(quote.dueDateTimestamp) && quote.dueDateTimestamp < Date.now();
}
