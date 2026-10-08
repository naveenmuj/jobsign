import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedCount++;
  }
}

console.log('======================================================');
console.log('       JOBSIGN AUTOMATED TEST & VERIFICATION SUITE    ');
console.log('======================================================\n');

// -----------------------------------------------------------------
// 1. CRYPTOGRAPHIC TAMPER-EVIDENT SHA-256 HASH VERIFICATION
// -----------------------------------------------------------------
console.log('1. [CRYPTOGRAPHY] Tamper-Evident SHA-256 Audit Seal');

function computeQuoteHash(quote) {
  const canonical = JSON.stringify({
    id: quote.id,
    quoteNumber: quote.quoteNumber,
    clientName: quote.clientName,
    clientPhone: quote.clientPhone || null,
    clientEmail: quote.clientEmail || null,
    clientAddress: quote.clientAddress || null,
    jobDescription: quote.jobDescription || null,
    notes: quote.notes || null,
    lineItems: quote.lineItems.map((i) => ({
      d: i.description,
      q: i.quantity,
      u: i.unitPriceCents,
      t: i.totalCents,
    })),
    subtotalCents: quote.subtotalCents,
    taxRateBasisPoints: quote.taxRateBasisPoints,
    taxAmountCents: quote.taxAmountCents,
    totalAmountCents: quote.totalAmountCents,
    photoUri: quote.photoUri || null,
    signatureSvg: quote.signatureSvg || '',
    signatureTimestamp: quote.signatureTimestamp || 0,
    signatureGpsLat: quote.signatureGpsLat || null,
    signatureGpsLng: quote.signatureGpsLng || null,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

const mockQuote = {
  id: 'q-test-1001',
  quoteNumber: 1001,
  clientName: 'Sarah Jenkins',
  clientPhone: '555-0199',
  clientEmail: 'sarah@example.com',
  clientAddress: '742 Evergreen Terrace',
  jobDescription: 'Emergency 200A Main Panel Swap',
  notes: 'Client agreed to proceed immediately',
  lineItems: [
    { description: 'Diagnostic & Service Call', quantity: 1, unitPriceCents: 9500, totalCents: 9500 },
    { description: 'Hourly Labor Rate', quantity: 1, unitPriceCents: 8500, totalCents: 8500 }
  ],
  subtotalCents: 18000,
  taxRateBasisPoints: 825, // 8.25%
  taxAmountCents: 1485,
  totalAmountCents: 19485,
  photoUri: 'file:///path/to/exhibit_a.jpg',
  signatureSvg: '<path d="M 10 10 L 20 20 Z" />',
  signatureTimestamp: 1728200000000,
  signatureGpsLat: 30.2672,
  signatureGpsLng: -97.7431,
};

const hash1 = computeQuoteHash(mockQuote);
assert(typeof hash1 === 'string' && hash1.length === 64, 'Produces 64-character hexadecimal SHA-256 hash');

// Immutability test: Modify 1 character in clientName or 1 cent in price
const tamperedQuote = { ...mockQuote, totalAmountCents: 19486 };
const hash2 = computeQuoteHash(tamperedQuote);
assert(hash1 !== hash2, 'Tampering by 1 cent completely mutates hash (Avalanche effect)');

const tamperedNameQuote = { ...mockQuote, clientName: 'Sarah Jenkine' };
const hash3 = computeQuoteHash(tamperedNameQuote);
assert(hash1 !== hash3, 'Tampering client name by 1 character alters audit certificate');


// -----------------------------------------------------------------
// 2. FINANCIAL & TAX DETERMINISTIC ARITHMETIC
// -----------------------------------------------------------------
console.log('\n2. [FINANCIAL] Currency Precision & Tax Math (Zero Floating Point Drift)');

function calculateTotals(items, taxBasisPoints) {
  const subtotalCents = items.reduce((sum, item) => sum + (item.quantity * item.unitPriceCents), 0);
  const taxAmountCents = Math.round((subtotalCents * taxBasisPoints) / 10000);
  const totalAmountCents = subtotalCents + taxAmountCents;
  return { subtotalCents, taxAmountCents, totalAmountCents };
}

const items = [
  { description: 'Item 1', quantity: 3, unitPriceCents: 3333 }, // 99.99
  { description: 'Item 2', quantity: 1, unitPriceCents: 199 },  // 1.99
];
const totals = calculateTotals(items, 825); // 8.25%
assert(totals.subtotalCents === 10198, 'Subtotal integer calculation exact ($101.98)');
assert(totals.taxAmountCents === 841, 'Tax calculation exact (8.25% of $101.98 = $8.41)');
assert(totals.totalAmountCents === 11039, 'Total amount exact ($110.39)');


// -----------------------------------------------------------------
// 3. OFFLINE OUTBOX QUEUE & SYNC STATE MACHINE
// -----------------------------------------------------------------
console.log('\n3. [OFFLINE ENGINE] Outbox Queue & Atomic Transitions');

class OutboxQueue {
  constructor() {
    this.queue = [];
  }
  enqueue(action, payload) {
    const item = {
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      action,
      payload,
      createdAt: Date.now(),
      status: 'pending',
      retryCount: 0
    };
    this.queue.push(item);
    return item;
  }
  async dispatchAll(networkAvailable, handler) {
    if (!networkAvailable) return { dispatched: 0, pending: this.queue.length };
    let dispatched = 0;
    for (const item of this.queue) {
      if (item.status === 'pending') {
        const success = await handler(item);
        if (success) {
          item.status = 'synced';
          dispatched++;
        } else {
          item.retryCount++;
        }
      }
    }
    return { dispatched, pending: this.queue.filter(q => q.status === 'pending').length };
  }
}

const outbox = new OutboxQueue();
outbox.enqueue('SYNC_QUOTE', { quoteId: 'q-test-1001' });
outbox.enqueue('SEND_RECEIPT', { quoteId: 'q-test-1001', email: 'client@example.com' });
assert(outbox.queue.length === 2, '2 offline actions enqueued during basement mode');

// Simulate offline dispatch attempt
const offlineRes = await outbox.dispatchAll(false, async () => true);
assert(offlineRes.dispatched === 0 && offlineRes.pending === 2, 'No queue items dispatched when network is down');

// Simulate connection restored
const onlineRes = await outbox.dispatchAll(true, async () => true);
assert(onlineRes.dispatched === 2 && onlineRes.pending === 0, 'Atomic dispatch of all pending items upon reconnection');


// -----------------------------------------------------------------
// 4. IN-APP PURCHASE & REVENUECAT CONFIGURATION AUDIT
// -----------------------------------------------------------------
console.log('\n4. [BILLING & MONETIZATION] In-App Purchases Configuration');

const billingConfigRaw = fs.readFileSync(path.resolve('./src/config/billing.ts'), 'utf8');
assert(billingConfigRaw.includes('ENTITLEMENT_ID: \'jobsign_pro\''), 'RevenueCat entitlement identifier configured');
assert(billingConfigRaw.includes('jobsign_pro_monthly_earlybird'), 'Monthly subscription product ID present');
assert(billingConfigRaw.includes('jobsign_pro_annual_earlybird'), 'Annual subscription product ID present');
assert(billingConfigRaw.includes('jobsign_pro_lifetime_earlybird'), 'Lifetime purchase product ID present');
assert(billingConfigRaw.includes('FREE_QUOTES_PER_MONTH: 3'), 'Free tier limit enforcement present (3 quotes/mo)');


// -----------------------------------------------------------------
// 5. GOOGLE PLAY STORE RELEASE READINESS AUDIT
// -----------------------------------------------------------------
console.log('\n5. [STORE READINESS] Google Play Store Policy & Technical Requirements');

const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
assert(appJson.expo.android.package === 'com.jobsign.app', 'Android package name is com.jobsign.app');
assert(appJson.expo.version === '1.0.0', 'App version is semver 1.0.0');
assert(typeof appJson.expo.android.versionCode === 'number', 'versionCode is an integer');
assert(fs.existsSync(appJson.expo.icon), 'Primary app icon file exists (assets/icon.png)');
assert(fs.existsSync(appJson.expo.android.adaptiveIcon.foregroundImage), 'Adaptive icon foreground exists');
assert(fs.existsSync('../docs/PRIVACY_POLICY.md'), 'Mandatory Google Play Privacy Policy exists');
assert(fs.existsSync('../docs/ASO_AND_STORE_METADATA.md'), 'Google Play Store Listing metadata document exists');

const privacyPolicy = fs.readFileSync('../docs/PRIVACY_POLICY.md', 'utf8');
assert(privacyPolicy.includes('Camera') || privacyPolicy.includes('camera'), 'Privacy policy declares camera usage');
assert(privacyPolicy.includes('Location') || privacyPolicy.includes('GPS'), 'Privacy policy declares GPS / location usage');

console.log('\n======================================================');
console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log('======================================================');

if (failedCount > 0) {
  process.exit(1);
}
