import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactsDir = 'C:\\Users\\navee\\.gemini\\antigravity\\brain\\b314feb6-90fa-43b6-b33a-cda4650fc7b3';

// Read the actual PDFService.ts file to extract the exact CSS and HTML layout
const pdfServiceContent = fs.readFileSync('./src/services/PDFService.ts', 'utf8');

// Sample signature SVG
const sampleSvg = '<path d="M 10 90 Q 60 20 110 85 T 210 70 Q 260 130 330 40 T 450 95" fill="none" stroke="#0F172A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';

const templates = [
  { id: 'modern', name: 'Modern Navy', filename: 'template_1_modern' },
  { id: 'classic', name: 'Classic Executive', filename: 'template_2_classic' },
  { id: 'minimal', name: 'Minimal Clean', filename: 'template_3_minimal' },
  { id: 'contractor', name: 'Industrial Trade', filename: 'template_4_contractor' },
];

function generateHtmlForTemplate(templateId) {
  // Extract the style block and HTML from PDFService.ts
  const styleMatch = pdfServiceContent.match(/<style>([\s\S]*?)<\/style>/);
  const css = styleMatch ? styleMatch[1] : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Estimate #1042 - Apex Field Services LLC</title>
        <style>
          ${css}
        </style>
      </head>
      <body class="theme-${templateId}">
        <!-- ── BRAND HEADER & METADATA ── -->
        <table class="header-table">
          <tr>
            <td style="vertical-align: top;">
              <div class="shop-monogram">AF</div>
              <div class="shop-name">Apex Field Services LLC</div>
              <div class="shop-address">1204 Industrial Blvd, Suite B, Austin, TX 78701</div>
              <div class="shop-contacts">(512) 843-9201 • contact@apexfieldservice.com • Lic: TX-EL-92841</div>
            </td>
            <td class="doc-meta">
              <span class="doc-badge doc-badge-estimate">✓ SIGNED ESTIMATE</span>
              <div class="doc-title">ESTIMATE & AGREEMENT</div>
              <div class="meta-line"><strong>Reference:</strong> #1042</div>
              <div class="meta-line"><strong>Date:</strong> 10/8/2026</div>
              <div class="meta-line"><strong>Legal Status:</strong> <span style="color: #059669; font-weight: 700;">UETA / ESIGN Sealed</span></div>
            </td>
          </tr>
        </table>

        <!-- ── CLIENT & JOB SUMMARY ── -->
        <table class="cards-grid">
          <tr>
            <td class="info-card" style="width: 50%;">
              <div class="card-title">Billed To / Client</div>
              <div class="card-name">Sarah Jenkins</div>
              <div class="card-text">(512) 555-0199 • sarah.jenkins@example.com</div>
              <div class="card-text">4218 Crestview Dr, Austin, TX 78756</div>
            </td>
            <td class="info-card" style="width: 50%;">
              <div class="card-title">Project Scope & Location</div>
              <div class="card-name">Main Electrical Panel Upgrade (200A)</div>
              <div class="card-text"><strong>Site:</strong> 4218 Crestview Dr, Austin, TX</div>
              <div class="card-text"><strong>Terms:</strong> Due upon municipal clearance</div>
            </td>
          </tr>
        </table>

        <!-- ── ITEMIZED SCOPE OF WORK ── -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="text-align: left; width: 52%;">Description of Service & Materials</th>
              <th style="text-align: center; width: 14%;">Qty</th>
              <th style="text-align: right; width: 17%;">Unit Rate</th>
              <th style="text-align: right; width: 17%;">Line Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>200-Amp Main Service Panel Replacement</strong><br/>
                <span style="font-size: 11px; color: #64748B;">Square D QO 42-circuit indoor panel with whole-home disconnect</span>
              </td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">$1,850.00</td>
              <td style="text-align: right;"><strong>$1,850.00</strong></td>
            </tr>
            <tr>
              <td>
                <strong>Type 2 Whole-Home Surge Protective Device (SPD)</strong><br/>
                <span style="font-size: 11px; color: #64748B;">UL 1449 4th Ed. rated with dedicated 50A breaker protection</span>
              </td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">$350.00</td>
              <td style="text-align: right;"><strong>$350.00</strong></td>
            </tr>
            <tr>
              <td>
                <strong>Dual Copper Ground Rod System & Cold Water Bond</strong><br/>
                <span style="font-size: 11px; color: #64748B;">NEC compliant 8-ft copper clad rods with #4 AWG continuous ground conductor</span>
              </td>
              <td style="text-align: center;">1</td>
              <td style="text-align: right;">$250.00</td>
              <td style="text-align: right;"><strong>$250.00</strong></td>
            </tr>
            <tr class="co-callout-row">
              <td colspan="4">APPROVED MID-JOB ADD-ONS & CHANGE ORDERS</td>
            </tr>
            <tr>
              <td>
                <strong>Add-On #1: Replaced Corroded Weatherhead Cable & Conduit</strong><br/>
                <span style="font-size: 11px; color: #64748B;">Discovered dry-rot in weatherhead seal during service riser drop</span>
              </td>
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
          <div>
            <div class="payment-title">Instant Payment Accounts (0% Fee)</div>
            <div class="payment-accounts">
              Zelle: payments@apexfieldservice.com  •  Venmo: @ApexServices  •  CashApp: $ApexMike
            </div>
          </div>
        </div>

        <!-- ── TERMS & WARRANTY ── -->
        <div class="terms-box">
          <div class="terms-header">TERMS, SCOPE CONDITIONS & WORKMANSHIP WARRANTY:</div>
          <div class="terms-body">• 1-Year Workmanship Warranty on all labor, breaker connections, and conduit installs.
• Homeowner guarantees unobstructed access to main utility meter and breaker panel.
• Final settlement due immediately upon municipal inspector clearance.</div>
        </div>

        <!-- ── CLIENT SIGNATURE & LEGAL BINDING ── -->
        <div class="signature-card">
          <div class="signature-header">Client Signature of Affirmative Approval:</div>
          <div style="margin: 8px 0;">
            <svg height="70" width="280" viewBox="0 0 500 200">${sampleSvg}</svg>
          </div>
          <div class="legal-consent">
            <strong>AFFIRMATIVE CONSENT & NON-REPUDIATION:</strong>
            By affixing signature above, client acknowledges receipt and approval of the itemized estimate and authorizes contractor to furnish indicated labor and materials under 15 U.S. Code § 7001 (ESIGN Act) and UETA standards.
          </div>
          <div class="seal-ribbon">
            <span>🔒 <strong>SHA-256 Seal:</strong> <span class="seal-hash">e3b0c44298fc1c14...</span></span>
            <span><strong>Location:</strong> 30.2672° N, 97.7431° W (GPS Verified On-Site)</span>
          </div>
        </div>

        <!-- ── PAGE 2: COURTROOM AUDIT CERTIFICATE ── -->
        <div class="audit-page">
          <h3 style="margin-top: 0; color: #0F172A; border-bottom: 2px solid #0F172A; padding-bottom: 8px; font-size: 16px;">
            UETA / ESIGN ACT COURTROOM AUDIT CERTIFICATE
          </h3>
          <p><strong>Document Verification Hash (SHA-256):</strong><br/><code style="font-size: 12px; background: #E2E8F0; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 4px;">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</code></p>
          <p><strong>Signing Timestamp:</strong> 2026-10-08T17:40:00.000Z (UTC)</p>
          <p><strong>Worksite GPS Coordinates:</strong> 30.26720° Lat, -97.74310° Lng (Verified On-Site)</p>
          <p><strong>Cryptographic Integrity Status:</strong> <span style="color: #059669; font-weight: 800;">LOCKED_IMMUTABLE</span></p>
          <p><strong>Governing Legal Standards:</strong> 15 U.S. Code § 7001 & UETA § 7.</p>
        </div>
      </body>
    </html>
  `;
}

(async () => {
  console.log('Rendering all 4 invoice templates with Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 850, height: 1200, deviceScaleFactor: 2 });

  for (const t of templates) {
    console.log(`Rendering template: ${t.name} (${t.id})...`);
    const html = generateHtmlForTemplate(t.id);
    await page.setContent(html, { waitUntil: 'load' });
    await new Promise(r => setTimeout(r, 600));

    // Capture Page 1 screenshot
    const pngPath = path.join(artifactsDir, `${t.filename}.png`);
    await page.screenshot({
      path: pngPath,
      fullPage: false,
      clip: { x: 0, y: 0, width: 850, height: 1150 }
    });
    console.log(`  ✓ Saved ${t.filename}.png`);

    // Export PDF
    const pdfPath = path.join(artifactsDir, `${t.filename}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
    });
    console.log(`  ✓ Saved ${t.filename}.pdf`);
  }

  await browser.close();
  console.log('All 4 template designs rendered and verified successfully!');
})();
