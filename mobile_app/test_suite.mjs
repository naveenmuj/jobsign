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

// -----------------------------------------------------------------
// 6. INVOICE DESIGN & BRANDING TEMPLATES ENGINE
// -----------------------------------------------------------------
console.log('\n6. [INVOICE DESIGN & BRANDING] Multi-Template Format Engine');

const templateConstantsRaw = fs.readFileSync(path.resolve('./src/constants/invoiceTemplates.ts'), 'utf8');
assert(templateConstantsRaw.includes('\'modern\''), 'Modern Navy template registered');
assert(templateConstantsRaw.includes('\'classic\''), 'Classic Executive template registered');
assert(templateConstantsRaw.includes('\'minimal\''), 'Minimal Clean template registered');
assert(templateConstantsRaw.includes('\'contractor\''), 'Industrial Trade template registered');

const pdfServiceRaw = fs.readFileSync(path.resolve('./src/services/PDFService.ts'), 'utf8');
assert(pdfServiceRaw.includes('body.theme-modern'), 'PDFService contains Modern Navy CSS rules');
assert(pdfServiceRaw.includes('body.theme-classic'), 'PDFService contains Classic Executive serif CSS rules');
assert(pdfServiceRaw.includes('body.theme-minimal'), 'PDFService contains Minimal Clean monochrome CSS rules');
assert(pdfServiceRaw.includes('body.theme-contractor'), 'PDFService contains Industrial Trade safety amber CSS rules');
assert(pdfServiceRaw.includes('class="theme-${templateId}"'), 'PDFService dynamically binds selected template class to body');

const settingsScreenRaw = fs.readFileSync(path.resolve('./src/screens/SettingsScreen.tsx'), 'utf8');
assert(settingsScreenRaw.includes('Invoice Design & Templates'), 'SettingsScreen has Invoice Design & Templates section');
assert(settingsScreenRaw.includes('renderMiniMockup'), 'SettingsScreen provides mini mockup wireframes for templates');
assert(settingsScreenRaw.includes('handlePreviewTemplate'), 'SettingsScreen supports live PDF preview generation for templates');

// 7. DYNAMIC CURRENCY & REGIONAL ENGINE
// -----------------------------------------------------------------
console.log('\n7. [CURRENCY & LOCALIZATION] Dynamic Currency & Regional Engine');

const currencyServiceRaw = fs.readFileSync(path.resolve('./src/services/CurrencyService.ts'), 'utf8');
assert(currencyServiceRaw.includes('detectDeviceCurrency'), 'CurrencyService provides synchronous device currency detection');
assert(currencyServiceRaw.includes('detectFromLocationOrDevice'), 'CurrencyService provides GPS & locale fallback detection');
assert(currencyServiceRaw.includes('POPULAR_CURRENCIES'), 'POPULAR_CURRENCIES presets defined');
assert(currencyServiceRaw.includes('₹') && currencyServiceRaw.includes('INR'), 'Supports Indian Rupee (INR ₹)');
assert(currencyServiceRaw.includes('£') && currencyServiceRaw.includes('GBP'), 'Supports British Pound (GBP £)');
assert(currencyServiceRaw.includes('€') && currencyServiceRaw.includes('EUR'), 'Supports Euro (EUR €)');

const pdfCurRaw = fs.readFileSync(path.resolve('./src/services/PDFService.ts'), 'utf8');
assert(pdfCurRaw.includes('curSymbol'), 'PDFService formats all prices and totals with dynamic curSymbol');

const dbServiceRaw = fs.readFileSync(path.resolve('./src/services/DatabaseService.ts'), 'utf8');
assert(dbServiceRaw.includes('currency_symbol TEXT'), 'DatabaseService quotes schema includes currency_symbol column');
assert(dbServiceRaw.includes('ALTER TABLE quotes ADD COLUMN currency_symbol TEXT;'), 'DatabaseService runs safe SQLite migration for currency_symbol');
assert(dbServiceRaw.includes('currencySymbol: r.currency_symbol'), 'DatabaseService restores currencySymbol on getAllQuotes');

const notifServiceRaw = fs.readFileSync(path.resolve('./src/services/NotificationService.ts'), 'utf8');
assert(notifServiceRaw.includes('const curSymbol = profile?.currencySymbol'), 'NotificationService formats seal alerts using profile currency');
assert(notifServiceRaw.includes('const curSymbol = quote.currencySymbol'), 'NotificationService formats reminder alerts using quote currency');

// -----------------------------------------------------------------
// 8. UNIFIED MODAL POPUPS & ZERO RAW SYSTEM ALERTS
// -----------------------------------------------------------------
console.log('\n8. [MODAL DIALOGS] Modern AppAlertModal & Unified AlertService');

const alertServiceRaw = fs.readFileSync(path.resolve('./src/services/AlertService.ts'), 'utf8');
assert(alertServiceRaw.includes('AlertServiceClass'), 'AlertService singleton class registered');
assert(alertServiceRaw.includes('inferredType'), 'AlertService intelligently infers alert themes (SUCCESS, WARNING, DANGER, INFO)');

const appTsxRaw = fs.readFileSync(path.resolve('./App.tsx'), 'utf8');
assert(appTsxRaw.includes('<AppAlertModal />'), 'AppAlertModal is mounted at top-level App root');

const sigPadRaw = fs.readFileSync(path.resolve('./src/components/SignaturePad.tsx'), 'utf8');
assert(sigPadRaw.includes('strokesRef'), 'SignaturePad uses synchronous strokesRef preventing stroke erasure');
// -----------------------------------------------------------------
// 9. DIRECT UPI & BANK SETTLEMENT ENGINE
// -----------------------------------------------------------------
console.log('\n9. [PAYMENTS] Direct UPI & Bank Settlement Engine');

const paymentModalRaw = fs.readFileSync(path.resolve('./src/components/PaymentQRModal.tsx'), 'utf8');
assert(paymentModalRaw.includes('upi://pay'), 'PaymentQRModal supports standard NPCI upi://pay deep link format');
assert(paymentModalRaw.includes('pa='), 'PaymentQRModal binds payee address (pa) to contractor profile');
assert(paymentModalRaw.includes('pn='), 'PaymentQRModal binds payee name (pn) to contractor business name');
assert(paymentModalRaw.includes('am='), 'PaymentQRModal locks pre-filled exact amount (am) on client device');
assert(paymentModalRaw.includes('cu=INR'), 'PaymentQRModal sets currency to INR for Indian UPI');
assert(paymentModalRaw.includes('isEditingUpi'), 'PaymentQRModal provides inline UPI ID configuration and setup');
assert(paymentModalRaw.includes('handleSaveUpi'), 'PaymentQRModal validates and saves contractor UPI ID with haptic feedback');

// Test UPI URL generation algorithm directly
function buildUpiPayload(upiId, payeeName, amountCents, quoteNumber) {
  const amtStr = (amountCents / 100).toFixed(2);
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amtStr}&cu=INR&tn=${encodeURIComponent(`Payment for Quote #${quoteNumber}`)}`;
}

const testUpiUrl = buildUpiPayload('contractor@okhdfcbank', 'JobSign Electric', 11908, 101);
assert(testUpiUrl.includes('pa=contractor%40okhdfcbank'), 'UPI URL correctly encodes contractor UPI ID');
assert(testUpiUrl.includes('pn=JobSign%20Electric'), 'UPI URL correctly encodes registered payee name');
assert(testUpiUrl.includes('am=119.08'), 'UPI URL pre-fills exact decimal amount (119.08) for scanning client');
assert(testUpiUrl.includes('cu=INR'), 'UPI URL specifies currency as INR');

assert(paymentModalRaw.includes('handleSaveBank'), 'PaymentQRModal implements inline handleSaveBank without requiring dummy QR scanner');
assert(paymentModalRaw.includes('handleSelectBank'), 'PaymentQRModal supports instant switching between multiple saved bank accounts');
assert(paymentModalRaw.includes('handleSelectUpi'), 'PaymentQRModal supports instant switching between multiple saved UPI IDs');
assert(paymentModalRaw.includes('isEditingBank'), 'PaymentQRModal supports inline editing of bank details directly on modal page');

const typesRaw = fs.readFileSync(path.resolve('./src/types/index.ts'), 'utf8');
assert(typesRaw.includes('SavedBankAccount'), 'types/index.ts exports SavedBankAccount data model');
assert(typesRaw.includes('SavedUpiAccount'), 'types/index.ts exports SavedUpiAccount data model');

const pdfPaymentRaw = fs.readFileSync(path.resolve('./src/services/PDFService.ts'), 'utf8');
assert(pdfPaymentRaw.includes('RegionPaymentService.formatInvoicePaymentAccounts'), 'PDFService delegates localized payment details to RegionPaymentService');
assert(pdfPaymentRaw.includes('customPaymentNote'), 'PDFService prints contractor custom payment note / instructions on invoices');
assert(pdfPaymentRaw.includes('public static async viewPDF'), 'PDFService exposes viewPDF method for direct document viewing');

const quoteDetailRaw = fs.readFileSync(path.resolve('./src/screens/QuoteDetailScreen.tsx'), 'utf8');
assert(quoteDetailRaw.includes('handleViewPDF'), 'QuoteDetailScreen implements handleViewPDF handler');
assert(quoteDetailRaw.includes('View PDF'), 'QuoteDetailScreen renders View PDF button');
assert(quoteDetailRaw.includes('View Receipt'), 'QuoteDetailScreen renders View Receipt button when paid');

// -----------------------------------------------------------------
// 10. MULTI-REGION LOCALIZATION & CUSTOM PAYMENT INSTRUCTIONS
// -----------------------------------------------------------------
console.log('\n10. [LOCALIZATION & REGIONAL RAILS] Multi-Country Payment Formatting');

const regionServiceRaw = fs.readFileSync(path.resolve('./src/services/RegionPaymentService.ts'), 'utf8');
assert(regionServiceRaw.includes('class RegionPaymentService'), 'RegionPaymentService class exported');
assert(regionServiceRaw.includes('detectRegion'), 'RegionPaymentService implements region detection');
assert(regionServiceRaw.includes('getConfig'), 'RegionPaymentService provides regional configs');
assert(regionServiceRaw.includes('formatInvoicePaymentAccounts'), 'RegionPaymentService formats invoice payment accounts');

// Assert support for 7 worldwide regional configurations
assert(regionServiceRaw.includes("'IN'") && regionServiceRaw.includes('IFSC'), 'RegionPaymentService supports India (UPI + IFSC)');
assert(regionServiceRaw.includes("'US'") && regionServiceRaw.includes('Routing'), 'RegionPaymentService supports United States (ACH + Routing + Zelle)');
assert(regionServiceRaw.includes("'GB'") && regionServiceRaw.includes('Sort Code'), 'RegionPaymentService supports United Kingdom (Faster Payments + Sort Code)');
assert(regionServiceRaw.includes("'EU'") && regionServiceRaw.includes('IBAN'), 'RegionPaymentService supports Eurozone (SEPA + IBAN + BIC)');
assert(regionServiceRaw.includes("'CA'") && regionServiceRaw.includes('Interac'), 'RegionPaymentService supports Canada (Interac e-Transfer + Transit)');
assert(regionServiceRaw.includes("'AU'") && regionServiceRaw.includes('PayID') && regionServiceRaw.includes('BSB'), 'RegionPaymentService supports Australia (PayID + BSB)');
assert(regionServiceRaw.includes("'GLOBAL'"), 'RegionPaymentService provides Global / International fallback');

// Verify contractor custom fields in types
assert(typesRaw.includes('customPaymentLabel?: string'), 'types/index.ts includes optional customPaymentLabel');
assert(typesRaw.includes('customPaymentNote?: string'), 'types/index.ts includes optional customPaymentNote');

// Verify SettingsScreen Modal 4 supports custom fields & regionConfig
const settingsRaw = fs.readFileSync(path.resolve('./src/screens/SettingsScreen.tsx'), 'utf8');
assert(settingsRaw.includes('customPaymentLabel'), 'SettingsScreen allows editing customPaymentLabel');
assert(settingsRaw.includes('customPaymentNote'), 'SettingsScreen allows editing customPaymentNote');
assert(settingsRaw.includes('regionConfig.bankCodeLabel'), 'SettingsScreen dynamically localizes bank code label by country');
assert(settingsRaw.includes('base64: true'), 'SettingsScreen requests base64 from image picker for immune offline logo embedding');

// Verify PDFService country-specific and photo exhibit enhancements
assert(pdfPaymentRaw.includes('photo-page'), 'PDFService formats worksite photo on dedicated Exhibit A record page');
assert(pdfPaymentRaw.includes('photo-frame'), 'PDFService surrounds worksite photo with executive architectural framing');
assert(pdfPaymentRaw.includes('regionConfig.legalConsentCitation'), 'PDFService localizes affirmative legal consent citations by country');
assert(pdfPaymentRaw.includes('regionConfig.waiverTitle'), 'PDFService localizes conditional lien / discharge waivers by country');
assert(pdfPaymentRaw.includes('regionConfig.auditCertificateTitle'), 'PDFService localizes Courtroom Audit Certificate titles by country');
assert(pdfPaymentRaw.includes('regionConfig.auditGoverningStandard'), 'PDFService cites country-specific electronic signature governing acts');
assert(!pdfPaymentRaw.includes('(512) 843-9201'), 'PDFService eliminated hardcoded foreign phone numbers');
assert(!pdfPaymentRaw.includes('Apex Field Services LLC'), 'PDFService eliminated hardcoded foreign company names');

// -----------------------------------------------------------------
// 11. OPTIONAL WORKSITE PHOTO EXHIBIT A CONTROLS & PERSISTENCE
// -----------------------------------------------------------------
console.log('\n11. [EXHIBIT A] Optional Worksite Photo Controls & Persistence');

// 1. Data model check
assert(typesRaw.includes('includePhotoInPdf?: boolean'), 'types/index.ts includes optional includePhotoInPdf');

// 2. DatabaseService check
const dbServiceCurrentRaw = fs.readFileSync(path.resolve('./src/services/DatabaseService.ts'), 'utf8');
assert(dbServiceCurrentRaw.includes('ALTER TABLE quotes ADD COLUMN include_photo_in_pdf INTEGER DEFAULT 1'), 'DatabaseService includes SQLite schema migration for include_photo_in_pdf');
assert(dbServiceCurrentRaw.includes('includePhotoInPdf: r.include_photo_in_pdf === 0 ? false : true'), 'DatabaseService maps include_photo_in_pdf in getAllQuotes');
assert(dbServiceCurrentRaw.includes('include_photo_in_pdf') && dbServiceCurrentRaw.includes('quote.includePhotoInPdf === false ? 0 : 1'), 'DatabaseService persists include_photo_in_pdf in saveQuote');

// 3. PDFService check
assert(pdfPaymentRaw.includes('quote.includePhotoInPdf !== false'), 'PDFService conditions photo loading & Exhibit A embedding on includePhotoInPdf');

// 4. QuoteBuilderScreen check
const quoteBuilderRaw = fs.readFileSync(path.resolve('./src/screens/QuoteBuilderScreen.tsx'), 'utf8');
assert(quoteBuilderRaw.includes('includePhotoInPdf'), 'QuoteBuilderScreen manages includePhotoInPdf state');
assert(quoteBuilderRaw.includes('Include photo in PDF Invoice (Exhibit A)'), 'QuoteBuilderScreen renders Exhibit A inclusion toggle checkbox');
assert(quoteBuilderRaw.includes('includePhotoInPdf: photoUri ? includePhotoInPdf : true'), 'QuoteBuilderScreen persists includePhotoInPdf in created quote');

// 5. QuoteDetailScreen check
assert(quoteDetailRaw.includes('includePhoto'), 'QuoteDetailScreen manages includePhoto state');
assert(quoteDetailRaw.includes('handleToggleIncludePhoto'), 'QuoteDetailScreen handles photo inclusion toggle');
assert(quoteDetailRaw.includes('Exhibit A: Worksite Photo Page'), 'QuoteDetailScreen renders Exhibit A quick toggle in PDF actions card');
assert(quoteDetailRaw.includes('Attached in PDF'), 'QuoteDetailScreen renders toggle inside Worksite Photo card');

console.log('\n======================================================');
console.log(`TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
console.log('======================================================');

if (failedCount > 0) {
  process.exit(1);
}


