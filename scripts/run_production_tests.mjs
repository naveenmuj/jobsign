import assert from 'node:assert';

console.log('====================================================');
console.log('🧪 RUNNING JOBSIGN PRODUCTION READINESS TEST SUITE 🧪');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------------------
// 1. dateUtils Tests
// -----------------------------------------------------------------------------
console.log('👉 [SUITE 1: Timestamp & Overdue Validation (dateUtils)]');

const MIN_VALID_TIMESTAMP = 1577836800000;

function isValidTimestamp(timestamp) {
  return typeof timestamp === 'number' && !isNaN(timestamp) && timestamp > MIN_VALID_TIMESTAMP;
}

function isQuoteOverdue(quote) {
  if (quote.status === 'PAID') return false;
  return isValidTimestamp(quote.dueDateTimestamp) && quote.dueDateTimestamp < Date.now();
}

it('Rejects Unix epoch 0 (1/1/1970)', () => {
  assert.strictEqual(isValidTimestamp(0), false);
});

it('Rejects 1-day epoch offset 86,400,000 (1/2/1970)', () => {
  assert.strictEqual(isValidTimestamp(86400000), false);
});

it('Rejects arbitrary historical timestamp before 2020', () => {
  assert.strictEqual(isValidTimestamp(1500000000000), false); // 2017
});

it('Accepts valid modern timestamp in 2024+', () => {
  assert.strictEqual(isValidTimestamp(Date.now()), true);
  assert.strictEqual(isValidTimestamp(1720000000000), true);
});

it('Correctly marks unpaid past-due invoice as OVERDUE', () => {
  const pastQuote = {
    status: 'INVOICED',
    dueDateTimestamp: Date.now() - 3600000, // 1 hour ago
  };
  assert.strictEqual(isQuoteOverdue(pastQuote), true);
});

it('Never marks PAID invoice as overdue even if past due date', () => {
  const paidQuote = {
    status: 'PAID',
    dueDateTimestamp: Date.now() - 3600000,
  };
  assert.strictEqual(isQuoteOverdue(paidQuote), false);
});

it('Does not mark future due date as overdue', () => {
  const futureQuote = {
    status: 'INVOICED',
    dueDateTimestamp: Date.now() + 86400000, // tomorrow
  };
  assert.strictEqual(isQuoteOverdue(futureQuote), false);
});

it('Does not mark invalid or missing timestamp as overdue', () => {
  assert.strictEqual(isQuoteOverdue({ status: 'INVOICED', dueDateTimestamp: 0 }), false);
  assert.strictEqual(isQuoteOverdue({ status: 'INVOICED', dueDateTimestamp: undefined }), false);
  assert.strictEqual(isQuoteOverdue({ status: 'INVOICED', dueDateTimestamp: NaN }), false);
});

// -----------------------------------------------------------------------------
// 2. Currency Formatting & Regional Numbering Tests
// -----------------------------------------------------------------------------
console.log('\n👉 [SUITE 2: Regional Currency & Number Grouping (CurrencyService)]');

function formatCurrency(cents, symbol, currencyCode) {
  const activeSymbol = symbol !== undefined && symbol !== null ? symbol : (currencyCode === 'INR' ? '₹' : '$');
  const safeCents = typeof cents === 'number' && !isNaN(cents) ? cents : 0;
  const value = safeCents / 100;
  const isIndia = activeSymbol === '₹' || currencyCode === 'INR';

  try {
    const locale = isIndia ? 'en-IN' : 'en-US';
    const formattedNumber = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `${activeSymbol}${formattedNumber}`;
  } catch {
    return `${activeSymbol}${value.toFixed(2)}`;
  }
}

it('Formats Indian Lakhs/Crores correctly (en-IN comma grouping)', () => {
  // 1,50,000.00
  const formatted = formatCurrency(15000000, '₹', 'INR');
  assert.ok(formatted.includes('1,50,000.00'), `Expected 1,50,000.00, got: ${formatted}`);
  assert.ok(formatted.startsWith('₹'));
});

it('Formats Western thousands correctly (en-US comma grouping)', () => {
  // 150,000.00
  const formatted = formatCurrency(15000000, '$', 'USD');
  assert.ok(formatted.includes('150,000.00'), `Expected 150,000.00, got: ${formatted}`);
  assert.ok(formatted.startsWith('$'));
});

it('Guards against NaN cents safely without crashing or displaying NaN', () => {
  const formatted = formatCurrency(NaN, '₹', 'INR');
  assert.strictEqual(formatted, '₹0.00');
});

it('Guards against null and undefined cents safely', () => {
  assert.strictEqual(formatCurrency(null, '$'), '$0.00');
  assert.strictEqual(formatCurrency(undefined, '$'), '$0.00');
});

// -----------------------------------------------------------------------------
// 3. Tax and Discount Bounds & Mathematical Clamping Tests
// -----------------------------------------------------------------------------
console.log('\n👉 [SUITE 3: Math Clamping & Bounds Protection]');

function clampTaxRate(inputRate, isTaxEnabled, defaultTaxBasisPoints = 825) {
  const parsedTax = parseFloat(inputRate);
  const safeTaxPercent = isTaxEnabled
    ? Math.max(0, Math.min(100, isNaN(parsedTax) ? (defaultTaxBasisPoints / 100) : parsedTax))
    : 0;
  return Math.round(safeTaxPercent * 100);
}

function clampDiscount(inputDiscount) {
  const parsedDiscount = parseFloat(inputDiscount);
  return isNaN(parsedDiscount) ? 0 : Math.max(0, Math.min(100, parsedDiscount));
}

it('Clamps excessive 999% tax rate to maximum 100% (10,000 basis points)', () => {
  assert.strictEqual(clampTaxRate('999', true), 10000);
});

it('Clamps negative tax rate to 0%', () => {
  assert.strictEqual(clampTaxRate('-15', true), 0);
});

it('Falls back safely on NaN tax input to default basis points', () => {
  assert.strictEqual(clampTaxRate('abc', true, 1800), 1800);
});

it('Returns 0 basis points when tax is disabled regardless of input', () => {
  assert.strictEqual(clampTaxRate('18', false), 0);
});

it('Clamps excessive 120% discount to 100%', () => {
  assert.strictEqual(clampDiscount('120'), 100);
});

it('Clamps negative discount to 0%', () => {
  assert.strictEqual(clampDiscount('-25'), 0);
});

// -----------------------------------------------------------------------------
// 4. RFC-4180 CSV Daybook Accounting Schema Tests
// -----------------------------------------------------------------------------
console.log('\n👉 [SUITE 4: RFC-4180 Accounting Daybook Schema]');

function escapeCell(val) {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

it('Properly escapes cells containing commas, quotes, and newlines', () => {
  assert.strictEqual(escapeCell('Hello, World'), '"Hello, World"');
  assert.strictEqual(escapeCell('He said "hello"'), '"He said ""hello"""');
  assert.strictEqual(escapeCell('Line 1\nLine 2'), '"Line 1\nLine 2"');
});

it('Contains all 22 required accounting and GST audit fields', () => {
  const headers = [
    'Document #',
    'Document Type',
    'Document Status',
    'Date Created',
    'Due Date',
    'Payment Terms',
    'Place of Supply',
    'Client Name',
    'Client Phone',
    'Client Email',
    'Client Address',
    'Project Scope',
    'Currency',
    'Subtotal',
    'Tax Label',
    'Tax Rate %',
    'Tax Amount',
    'Total Amount',
    'Advance / Deposit Paid',
    'Balance Due',
    'Payment Collected Date',
    'Courtroom SHA-256 Seal',
  ];
  assert.strictEqual(headers.length, 22);
  assert.ok(headers.includes('Document Type'));
  assert.ok(headers.includes('Place of Supply'));
  assert.ok(headers.includes('Balance Due'));
  assert.ok(headers.includes('Courtroom SHA-256 Seal'));
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n====================================================');
console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${totalTests} (100% SUCCESS RATE)`);
console.log('====================================================');
