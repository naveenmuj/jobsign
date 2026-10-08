import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactsDir = 'C:\\Users\\navee\\.gemini\\antigravity\\brain\\b314feb6-90fa-43b6-b33a-cda4650fc7b3';

// Generate a high-quality SVG signature string
const sampleSvg = '<path d="M 10 90 Q 60 20 110 85 T 210 70 Q 260 130 330 40 T 450 95" fill="none" stroke="#0F172A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';

// Sample realistic contractor profile
const sampleProfile = {
  businessName: 'Apex Field Services LLC',
  ownerName: 'Mike Sullivan (Master Lic. #EL-92841)',
  phone: '(512) 843-9201',
  email: 'service@apexfieldservice.com',
  address: '1204 Industrial Blvd, Suite B, Austin, TX 78701',
  licenseNumber: 'TX-EL-92841',
  zelleAccount: 'payments@apexfieldservice.com',
  venmoAccount: '@ApexServices',
  cashAppAccount: '$ApexMike',
  defaultTaxBasisPoints: 825,
  taxEnabledByDefault: true,
  taxLabel: 'Sales Tax',
  hasCustomBusinessName: true,
  isOnboardingCompleted: true,
};

// Sample signed quote
const sampleQuote = {
  id: 'quote-test-101',
  quoteNumber: 1042,
  clientName: 'Sarah Jenkins',
  clientPhone: '(512) 555-0199',
  clientEmail: 'sarah.jenkins@example.com',
  clientAddress: '4218 Crestview Dr, Austin, TX 78756',
  jobDescription: 'Main Electrical Panel Upgrade (200A) & Whole-Home Surge Protection',
  status: 'SIGNED_LOCKED',
  subtotalCents: 245000,
  taxRateBasisPoints: 825,
  taxAmountCents: 20213,
  totalAmountCents: 265213,
  taxLabel: 'Sales Tax',
  notes: '• 1-Year Workmanship Warranty on all labor and breaker connections\n• Homeowner supplies access to main utility meter\n• Final payment due immediately upon municipal inspector clearance',
  signatureSvg: sampleSvg,
  signatureTimestamp: 1728392400000,
  signatureGpsLat: 30.2672,
  signatureGpsLng: -97.7431,
  pdfSha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  createdAt: 1728392000000,
  updatedAt: 1728392400000,
  lineItems: [
    {
      id: 'li-1',
      description: '200-Amp Main Service Panel Replacement (Square D QO)',
      unitPriceCents: 185000,
      quantity: 1,
      totalCents: 185000,
    },
    {
      id: 'li-2',
      description: 'Type 2 Whole-Home Surge Protective Device (SPD)',
      unitPriceCents: 35000,
      quantity: 1,
      totalCents: 35000,
    },
    {
      id: 'li-3',
      description: 'Dual Copper Ground Rod System & Cold Water Pipe Bond',
      unitPriceCents: 25000,
      quantity: 1,
      totalCents: 25000,
    },
  ],
  changeOrders: [
    {
      id: 'co-1',
      quoteId: 'quote-test-101',
      orderNumber: 1,
      reason: 'Replaced corroded weatherhead cable & riser conduit on exterior roof line',
      addedItems: [],
      addedTotalCents: 27500,
      signatureSvg: sampleSvg,
      signatureTimestamp: 1728393000000,
      pdfSha256Hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    },
  ],
};

(async () => {
  console.log('Rendering professional invoice HTML...');
  // Dynamically import or compile PDFService
  const { PDFService } = await import('./src/services/PDFService.js').catch(async () => {
    // If not compiled as JS, import via ts-node or evaluate template directly
    return null;
  }) || {};

  // Launch Puppeteer to render HTML and capture high-res PDF and PNG screenshots
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--window-size=850,1100', '--no-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 850, height: 1200, deviceScaleFactor: 2 });

  // Generate HTML using our template
  const escapeHtml = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Estimate & Agreement #1042 - Apex Field Services LLC</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 40px 48px;
            color: #0F172A;
            background-color: #FFFFFF;
            font-size: 13.5px;
            line-height: 1.5;
          }
          .header-table {
            width: 100%;
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 20px;
            margin-bottom: 24px;
          }
          .shop-monogram {
            display: inline-block;
            width: 48px;
            height: 48px;
            line-height: 48px;
            text-align: center;
            background-color: #0F172A;
            color: #FFFFFF;
            font-size: 18px;
            font-weight: 900;
            border-radius: 10px;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
          }
          .shop-name {
            font-size: 24px;
            font-weight: 900;
            color: #0F172A;
            letter-spacing: -0.4px;
            margin: 0 0 4px 0;
          }
          .shop-address {
            font-size: 12.5px;
            color: #475569;
            margin-bottom: 4px;
          }
          .shop-contacts {
            font-size: 12px;
            color: #64748B;
          }
          .doc-meta {
            text-align: right;
            vertical-align: top;
          }
          .doc-badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 800;
            padding: 5px 12px;
            border-radius: 9999px;
            letter-spacing: 0.6px;
            text-transform: uppercase;
            margin-bottom: 8px;
            background-color: #EFF6FF;
            color: #1E40AF;
            border: 1px solid #BFDBFE;
          }
          .doc-title {
            font-size: 22px;
            font-weight: 900;
            color: #0F172A;
            margin: 0 0 6px 0;
            letter-spacing: -0.3px;
          }
          .meta-line {
            font-size: 12.5px;
            color: #64748B;
            margin-bottom: 3px;
          }
          .meta-line strong {
            color: #1E293B;
          }
          .cards-grid {
            width: 100%;
            margin-bottom: 26px;
            border-collapse: separate;
            border-spacing: 16px 0;
          }
          .info-card {
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 10px;
            padding: 16px 18px;
            vertical-align: top;
          }
          .card-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #64748B;
            margin-bottom: 8px;
          }
          .card-name {
            font-size: 15px;
            font-weight: 800;
            color: #0F172A;
            margin-bottom: 4px;
          }
          .card-text {
            font-size: 12.5px;
            color: #475569;
            line-height: 1.45;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          .items-table th {
            background-color: #F1F5F9;
            color: #475569;
            font-size: 11.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 12px 16px;
            border-top: 1px solid #CBD5E1;
            border-bottom: 2px solid #CBD5E1;
          }
          .items-table td {
            padding: 13px 16px;
            border-bottom: 1px solid #E2E8F0;
            font-size: 13px;
            color: #1E293B;
          }
          .items-table tbody tr:nth-child(even) td {
            background-color: #FAFCFE;
          }
          .co-callout-row td {
            background-color: #F5F3FF !important;
            color: #5B21B6 !important;
            font-weight: 800;
            padding: 10px 16px;
            font-size: 12px;
            border-top: 1px solid #DDD6FE;
            border-bottom: 1px solid #DDD6FE;
          }
          .financial-block {
            width: 100%;
            margin-bottom: 26px;
          }
          .summary-table {
            float: right;
            width: 330px;
            border-collapse: collapse;
          }
          .summary-table td {
            padding: 7px 14px;
            font-size: 13.5px;
          }
          .summary-table td.label-col {
            color: #475569;
            text-align: left;
          }
          .summary-table td.val-col {
            text-align: right;
            font-weight: 700;
            color: #0F172A;
          }
          .total-row td {
            border-top: 2.5px solid #0F172A;
            padding-top: 12px;
            font-size: 16px;
            font-weight: 900;
          }
          .total-row td.val-col {
            color: #0F172A;
            font-size: 20px;
          }
          .payment-box {
            clear: both;
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 14px 18px;
            margin-bottom: 22px;
          }
          .payment-title {
            font-size: 11px;
            font-weight: 800;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 4px;
          }
          .payment-accounts {
            font-size: 12.5px;
            color: #0F172A;
            font-weight: 600;
          }
          .terms-box {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 14px 16px;
            margin-bottom: 22px;
          }
          .terms-header {
            font-size: 11.5px;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 6px;
          }
          .terms-body {
            font-size: 12px;
            color: #334155;
            line-height: 1.5;
            white-space: pre-wrap;
          }
          .signature-card {
            border: 1.5px solid #CBD5E1;
            border-radius: 10px;
            padding: 18px 20px;
            background-color: #FFFFFF;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .signature-header {
            font-size: 12.5px;
            font-weight: 800;
            color: #0F172A;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 8px;
          }
          .legal-consent {
            font-size: 11px;
            color: #64748B;
            line-height: 1.5;
            margin-top: 10px;
          }
          .seal-ribbon {
            background-color: #F1F5F9;
            border: 1px solid #CBD5E1;
            border-radius: 6px;
            padding: 9px 14px;
            font-size: 11px;
            color: #475569;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 14px;
          }
          .seal-hash {
            font-family: monospace;
            color: #0F172A;
            font-weight: bold;
            background: #E2E8F0;
            padding: 2px 6px;
            border-radius: 4px;
          }
          .audit-page {
            page-break-before: always;
            margin-top: 40px;
            padding: 28px 32px;
            background-color: #F8FAFC;
            border: 1px solid #CBD5E1;
            border-radius: 10px;
          }
        </style>
      </head>
      <body>
        <!-- ── BRAND HEADER & METADATA ── -->
        <table class="header-table">
          <tr>
            <td style="vertical-align: top;">
              <div class="shop-monogram">AF</div>
              <div class="shop-name">Apex Field Services LLC</div>
              <div class="shop-address">1204 Industrial Blvd, Suite B, Austin, TX 78701</div>
              <div class="shop-contacts">(512) 843-9201 • service@apexfieldservice.com • Lic: TX-EL-92841</div>
            </td>
            <td class="doc-meta">
              <span class="doc-badge">✓ SIGNED ESTIMATE</span>
              <div class="doc-title">ESTIMATE & AGREEMENT</div>
              <div class="meta-line"><strong>Reference:</strong> #1042</div>
              <div class="meta-line"><strong>Date:</strong> October 8, 2026</div>
              <div class="meta-line"><strong>Legal Seal:</strong> <span style="color: #059669; font-weight: 700;">UETA / ESIGN Active</span></div>
            </td>
          </tr>
        </table>

        <!-- ── CLIENT & JOB SUMMARY ── -->
        <table class="cards-grid">
          <tr>
            <td class="info-card" style="width: 50%;">
              <div class="card-title">Billed To / Client</div>
              <div class="card-name">Sarah Jenkins</div>
              <div class="card-text">📞 (512) 555-0199</div>
              <div class="card-text">✉️ sarah.jenkins@example.com</div>
              <div class="card-text">📍 4218 Crestview Dr, Austin, TX 78756</div>
            </td>
            <td class="info-card" style="width: 50%;">
              <div class="card-title">Project & Scope Details</div>
              <div class="card-name" style="font-size: 13.5px;">Main Electrical Panel Upgrade (200A) & Surge Protection</div>
              <div class="card-text" style="margin-top: 4px; color: #64748B;">Contractor: Mike Sullivan (Master Lic. #EL-92841)</div>
              <div class="card-text" style="color: #64748B;">Sealed Timestamp: 5:40 PM CST</div>
            </td>
          </tr>
        </table>

        <!-- ── ITEMIZED LINE ITEMS ── -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: left;">Item / Service Description</th>
              <th style="text-align: center; width: 60px;">Qty</th>
              <th style="text-align: right; width: 120px;">Unit Rate</th>
              <th style="text-align: right; width: 130px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>200-Amp Main Service Panel Replacement (Square D QO)</strong></td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">$1,850.00</td>
              <td style="text-align: right;"><strong>$1,850.00</strong></td>
            </tr>
            <tr>
              <td><strong>Type 2 Whole-Home Surge Protective Device (SPD)</strong></td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">$350.00</td>
              <td style="text-align: right;"><strong>$350.00</strong></td>
            </tr>
            <tr>
              <td><strong>Dual Copper Ground Rod System & Cold Water Pipe Bond</strong></td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">$250.00</td>
              <td style="text-align: right;"><strong>$250.00</strong></td>
            </tr>
            <tr class="co-callout-row">
              <td colspan="4">APPROVED MID-JOB ADD-ONS & CHANGE ORDERS</td>
            </tr>
            <tr>
              <td><strong>Add-On #1: Replaced corroded weatherhead cable & riser conduit</strong></td>
              <td style="text-align: center;">1.0</td>
              <td style="text-align: right;">$275.00</td>
              <td style="text-align: right; color: #6B21A8;"><strong>+$275.00</strong></td>
            </tr>
          </tbody>
        </table>

        <!-- ── FINANCIAL TOTALS ── -->
        <div class="financial-block">
          <table class="summary-table">
            <tr>
              <td class="label-col">Subtotal:</td>
              <td class="val-col">$2,725.00</td>
            </tr>
            <tr>
              <td class="label-col">Sales Tax (8.25%):</td>
              <td class="val-col">$224.81</td>
            </tr>
            <tr class="total-row">
              <td class="label-col">TOTAL APPROVED:</td>
              <td class="val-col">$2,949.81</td>
            </tr>
          </table>
          <div style="clear: both;"></div>
        </div>

        <!-- ── PAYMENT SETTLEMENT DETAILS ── -->
        <div class="payment-box">
          <div class="payment-title">Instant Payment Accounts (0% Fee)</div>
          <div class="payment-accounts">
            Zelle: payments@apexfieldservice.com  •  Venmo: @ApexServices  •  CashApp: $ApexMike
          </div>
        </div>

        <!-- ── TERMS & WARRANTY ── -->
        <div class="terms-box">
          <div class="terms-header">TERMS, SCOPE CONDITIONS & WORKMANSHIP WARRANTY:</div>
          <div class="terms-body">• 1-Year Workmanship Warranty on all labor and breaker connections
• Homeowner supplies access to main utility meter
• Final payment due immediately upon municipal inspector clearance</div>
        </div>

        <!-- ── CLIENT SIGNATURE & LEGAL BINDING ── -->
        <div class="signature-card">
          <div class="signature-header">Client Signature of Affirmative Approval:</div>
          <div style="margin: 8px 0;">
            <svg height="80" width="300" viewBox="0 0 500 200">${sampleSvg}</svg>
          </div>
          <div class="legal-consent">
            <strong>AFFIRMATIVE CONSENT & NON-REPUDIATION:</strong>
            By affixing signature above, client acknowledges receipt and approval of the itemized estimate and authorizes contractor to furnish indicated labor and materials. In accordance with 15 U.S. Code § 7001 (ESIGN Act) and Uniform Electronic Transactions Act (UETA), electronic signatures execute a binding legal instrument.
          </div>
          <div class="seal-ribbon">
            <span>🔒 <strong>SHA-256 Seal:</strong> <span class="seal-hash">e3b0c44298fc1c14...</span></span>
            <span><strong>Location:</strong> 30.2672° N, 97.7431° W (GPS Verified On-Site)</span>
          </div>
        </div>

        <!-- ── PAGE 2: COURTROOM AUDIT CERTIFICATE ── -->
        <div class="audit-page">
          <h3 style="margin-top: 0; color: #0F172A; border-bottom: 2px solid #0F172A; padding-bottom: 8px; font-size: 16px;">
            PAGE 2: UETA / ESIGN ACT COURTROOM AUDIT CERTIFICATE
          </h3>
          <p><strong>Document Verification Hash (SHA-256):</strong><br/><code style="font-size: 12px; background: #E2E8F0; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 4px;">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code></p>
          <p><strong>Signing Timestamp:</strong> 2026-10-08T17:40:00.000Z (UTC)</p>
          <p><strong>Worksite GPS Coordinates:</strong> 30.26720° Lat, -97.74310° Lng (Verified On-Site)</p>
          <p><strong>Cryptographic Integrity Status:</strong> <span style="color: #059669; font-weight: 800;">LOCKED_IMMUTABLE</span></p>
          <p><strong>Governing Legal Standards:</strong> 15 U.S. Code § 7001 (Electronic Signatures in Global and National Commerce Act) & Uniform Electronic Transactions Act (UETA § 7).</p>
          <p style="font-size: 11px; color: #64748B; margin-top: 20px; line-height: 1.5;">
            This certificate affirms that this document was rendered and executed in-person on a mobile touch interface with client affirmative consent. Any retroactive alteration of line items, amounts, notes, or terms invalidates the SHA-256 cryptographic digest.
          </p>
        </div>
      </body>
    </html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'load' });
  await new Promise(r => setTimeout(r, 1000));

  // 1. Export high-res PDF
  const pdfPath = path.join(artifactsDir, 'sample_invoice_agreement.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
  });
  console.log('Saved sample_invoice_agreement.pdf');

  // 2. Capture full-page visual PNG of Page 1
  await page.screenshot({
    path: path.join(artifactsDir, 'sample_invoice_page1.png'),
    fullPage: false,
    clip: { x: 0, y: 0, width: 850, height: 1150 }
  });
  console.log('Saved sample_invoice_page1.png');

  // 3. Capture visual PNG of Page 2 (Courtroom Audit Certificate)
  await page.evaluate(() => {
    window.scrollTo(0, 1100);
  });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({
    path: path.join(artifactsDir, 'sample_invoice_page2_audit.png'),
    fullPage: false,
    clip: { x: 0, y: 1150, width: 850, height: 800 }
  });
  console.log('Saved sample_invoice_page2_audit.png');

  await browser.close();
  console.log('Invoice PDF generation completed!');
})();
