/**
 * Converts a financial amount in cents/paise into written Indian English words.
 * Follows official Indian accounting and GST Rule 46 standards:
 * - Lakhs (1,00,000)
 * - Crores (1,00,00,000)
 * - Rupees and Paise
 * 
 * Example:
 * 1180000 cents (₹11,800.00) => "Rupees Eleven Thousand Eight Hundred Only"
 * 14525050 cents (₹1,45,250.50) => "Rupees One Lakh Forty Five Thousand Two Hundred Fifty and Fifty Paise Only"
 */

const ONES: string[] = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS: string[] = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertTwoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  const o = ONES[n % 10];
  return o ? `${t} ${o}` : t;
}

function convertThreeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let res = '';
  if (h > 0) res += `${ONES[h]} Hundred`;
  if (rest > 0) res += (res ? ' ' : '') + convertTwoDigits(rest);
  return res;
}

export function numberToIndianWords(amountCents: number): string {
  if (!amountCents || amountCents <= 0) return 'Rupees Zero Only';

  const rupees = Math.floor(amountCents / 100);
  const paise = Math.round(amountCents % 100);

  if (rupees === 0 && paise === 0) return 'Rupees Zero Only';

  let rem = rupees;
  let words = '';

  const crore = Math.floor(rem / 10000000);
  rem %= 10000000;
  if (crore > 0) {
    words += `${convertThreeDigits(crore)} Crore `;
  }

  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  if (lakh > 0) {
    words += `${convertThreeDigits(lakh)} Lakh `;
  }

  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  if (thousand > 0) {
    words += `${convertThreeDigits(thousand)} Thousand `;
  }

  const hundred = rem;
  if (hundred > 0) {
    words += convertThreeDigits(hundred);
  }

  words = words.trim();
  let result = words ? `Rupees ${words}` : 'Rupees Zero';

  if (paise > 0) {
    result += ` and ${convertTwoDigits(paise)} Paise`;
  }

  return `${result} Only`;
}

/**
 * Universal formatter that selects Indian numbering for INR (₹) or standard Western words for other currencies.
 */
export function formatAmountInWords(amountCents: number, currencyCode?: string, currencySymbol?: string): string {
  const isIndia = currencyCode === 'INR' || currencySymbol === '₹';
  if (isIndia) {
    return numberToIndianWords(amountCents);
  }

  // Western formatting (Millions / Thousands / Dollars / Cents)
  if (!amountCents || amountCents <= 0) return 'Zero Dollars Only';
  const dollars = Math.floor(amountCents / 100);
  const cents = Math.round(amountCents % 100);

  let rem = dollars;
  let words = '';

  const millions = Math.floor(rem / 1000000);
  rem %= 1000000;
  if (millions > 0) words += `${convertThreeDigits(millions)} Million `;

  const thousands = Math.floor(rem / 1000);
  rem %= 1000;
  if (thousands > 0) words += `${convertThreeDigits(thousands)} Thousand `;

  if (rem > 0) words += convertThreeDigits(rem);

  words = words.trim();
  const unit = currencySymbol === '£' ? 'Pounds' : currencySymbol === '€' ? 'Euros' : 'Dollars';
  let result = words ? `${words} ${unit}` : `Zero ${unit}`;
  if (cents > 0) {
    result += ` and ${convertTwoDigits(cents)} Cents`;
  }
  return `${result} Only`;
}
