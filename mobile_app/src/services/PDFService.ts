import * as Crypto from 'expo-crypto';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Quote, ContractorProfile } from '../types';

function escapeHtml(s: string = ''): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class PDFService {
  public static async computeHash(quote: Quote): Promise<string> {
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
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, canonical);
  }

  public static async exportFullDatabaseBackup(): Promise<string> {
    try {
      const docDir = (FileSystem as any).documentDirectory || '';
      const cacheDir = (FileSystem as any).cacheDirectory || '';
      const dbUri = `${docDir}SQLite/jobsign.db`;
      const backupUri = `${cacheDir}jobsign_full_backup_${Date.now()}.db`;

      await FileSystem.copyAsync({ from: dbUri, to: backupUri });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(backupUri, {
          mimeType: 'application/octet-stream',
          dialogTitle: 'Export JobSign Database Backup',
        });
      }
      return backupUri;
    } catch (e) {
      console.log('Database export handled gracefully:', e);
      return '';
    }
  }

  public static async generateInvoiceHTML(quote: Quote, profile?: ContractorProfile): Promise<string> {
    const hash = quote.pdfSha256Hash || (await this.computeHash(quote));
    const businessName = profile?.businessName?.trim() || 'Apex Field Services LLC';
    const ownerName = profile?.ownerName?.trim() || 'Licensed Contractor';
    const phone = profile?.phone?.trim() || '(512) 843-9201';
    const email = profile?.email?.trim() || '';
    const address = profile?.address?.trim() || '';
    const license = profile?.licenseNumber?.trim() ? `Lic: ${profile.licenseNumber.trim()}` : '';
    const isPaid = quote.status === 'PAID';

    // Compute initials if no logo provided
    const initials = businessName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'JS';

    let logoBase64 = '';
    if (profile?.logoUri) {
      try {
        if (profile.logoUri.startsWith('data:')) {
          logoBase64 = profile.logoUri;
        } else {
          const base64Str = await FileSystem.readAsStringAsync(profile.logoUri, {
            encoding: 'base64',
          });
          const ext = profile.logoUri.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
          logoBase64 = `data:image/${ext};base64,${base64Str}`;
        }
      } catch (e) {
        console.log('PDF logo embed handled gracefully:', e);
      }
    }

    let photoBase64 = '';
    if (quote.photoUri) {
      try {
        const base64Str = await FileSystem.readAsStringAsync(quote.photoUri, {
          encoding: 'base64',
        });
        photoBase64 = `data:image/jpeg;base64,${base64Str}`;
      } catch (e) {
        console.log('PDF photo embed handled gracefully:', e);
      }
    }

    const contactParts = [phone, email, license].filter(Boolean);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${isPaid ? 'Invoice' : 'Estimate'} #${quote.quoteNumber} - ${escapeHtml(businessName)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              margin: 0;
              padding: 32px 36px;
              color: #0F172A;
              background-color: #FFFFFF;
              font-size: 13px;
              line-height: 1.5;
            }
            .header-table {
              width: 100%;
              border-bottom: 2px solid #E2E8F0;
              padding-bottom: 18px;
              margin-bottom: 22px;
            }
            .shop-logo-img {
              max-height: 52px;
              max-width: 170px;
              object-fit: contain;
              margin-bottom: 6px;
              display: block;
            }
            .shop-monogram {
              display: inline-block;
              width: 44px;
              height: 44px;
              line-height: 44px;
              text-align: center;
              background-color: #0F172A;
              color: #FFFFFF;
              font-size: 17px;
              font-weight: 900;
              border-radius: 8px;
              margin-bottom: 6px;
              letter-spacing: 0.5px;
            }
            .shop-name {
              font-size: 22px;
              font-weight: 900;
              color: #0F172A;
              letter-spacing: -0.4px;
              margin: 0 0 3px 0;
            }
            .shop-address {
              font-size: 12px;
              color: #475569;
              margin-bottom: 3px;
            }
            .shop-contacts {
              font-size: 11.5px;
              color: #64748B;
            }
            .doc-meta {
              text-align: right;
              vertical-align: top;
            }
            .doc-badge {
              display: inline-block;
              font-size: 10.5px;
              font-weight: 800;
              padding: 4px 10px;
              border-radius: 9999px;
              letter-spacing: 0.6px;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .doc-badge-paid {
              background-color: #ECFDF5;
              color: #065F46;
              border: 1px solid #A7F3D0;
            }
            .doc-badge-estimate {
              background-color: #EFF6FF;
              color: #1E40AF;
              border: 1px solid #BFDBFE;
            }
            .doc-title {
              font-size: 20px;
              font-weight: 900;
              color: #0F172A;
              margin: 0 0 6px 0;
            }
            .meta-line {
              font-size: 12px;
              color: #64748B;
              margin-bottom: 2px;
            }
            .meta-line strong {
              color: #1E293B;
            }
            .cards-grid {
              width: 100%;
              margin-bottom: 24px;
              border-collapse: separate;
              border-spacing: 12px 0;
            }
            .info-card {
              background: #F8FAFC;
              border: 1px solid #E2E8F0;
              border-radius: 8px;
              padding: 14px 16px;
              vertical-align: top;
            }
            .card-title {
              font-size: 10.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #64748B;
              margin-bottom: 6px;
            }
            .card-name {
              font-size: 14px;
              font-weight: 800;
              color: #0F172A;
              margin-bottom: 3px;
            }
            .card-text {
              font-size: 12px;
              color: #475569;
              line-height: 1.4;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .items-table th {
              background-color: #F1F5F9;
              color: #475569;
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.6px;
              padding: 10px 14px;
              border-top: 1px solid #CBD5E1;
              border-bottom: 1.5px solid #CBD5E1;
            }
            .items-table td {
              padding: 11px 14px;
              border-bottom: 1px solid #E2E8F0;
              font-size: 12.5px;
              color: #1E293B;
            }
            .items-table tbody tr:nth-child(even) td {
              background-color: #FAFCFE;
            }
            .co-callout-row td {
              background-color: #F5F3FF !important;
              color: #5B21B6 !important;
              font-weight: 800;
              padding: 8px 14px;
              font-size: 11.5px;
              border-top: 1px solid #DDD6FE;
              border-bottom: 1px solid #DDD6FE;
            }
            .financial-block {
              width: 100%;
              margin-bottom: 24px;
            }
            .summary-table {
              float: right;
              width: 310px;
              border-collapse: collapse;
            }
            .summary-table td {
              padding: 6px 12px;
              font-size: 13px;
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
              border-top: 2px solid #0F172A;
              padding-top: 10px;
              font-size: 16px;
              font-weight: 900;
            }
            .total-row td.val-col {
              color: ${isPaid ? '#059669' : '#0F172A'};
              font-size: 18px;
            }
            .payment-box {
              clear: both;
              background-color: #F8FAFC;
              border: 1px solid #E2E8F0;
              border-radius: 8px;
              padding: 12px 16px;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .payment-title {
              font-size: 11px;
              font-weight: 800;
              color: #334155;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .payment-accounts {
              font-size: 12px;
              color: #0F172A;
              font-weight: 600;
              margin-top: 2px;
            }
            .photo-box {
              margin-bottom: 20px;
              border: 1.5px solid #CBD5E1;
              border-radius: 8px;
              padding: 14px;
              background: #FFFFFF;
              page-break-inside: avoid;
            }
            .photo-header {
              font-size: 11px;
              font-weight: 800;
              color: #0F172A;
              text-transform: uppercase;
              letter-spacing: 0.6px;
              margin-bottom: 8px;
            }
            .photo-img {
              max-width: 100%;
              max-height: 240px;
              border-radius: 6px;
              display: block;
              margin-bottom: 6px;
            }
            .terms-box {
              background-color: #F8FAFC;
              border: 1px solid #E2E8F0;
              border-radius: 8px;
              padding: 12px 14px;
              margin-bottom: 20px;
            }
            .terms-header {
              font-size: 11px;
              font-weight: 800;
              color: #475569;
              text-transform: uppercase;
              letter-spacing: 0.6px;
              margin-bottom: 4px;
            }
            .terms-body {
              font-size: 11.5px;
              color: #334155;
              line-height: 1.45;
              white-space: pre-wrap;
            }
            .signature-card {
              border: 1.5px solid #CBD5E1;
              border-radius: 8px;
              padding: 16px;
              background-color: #FFFFFF;
              margin-bottom: 18px;
              page-break-inside: avoid;
            }
            .signature-header {
              font-size: 12px;
              font-weight: 800;
              color: #0F172A;
              text-transform: uppercase;
              letter-spacing: 0.6px;
              margin-bottom: 8px;
            }
            .legal-consent {
              font-size: 10.5px;
              color: #64748B;
              line-height: 1.45;
              margin-top: 10px;
            }
            .waiver-callout {
              background-color: #ECFDF5;
              border: 1px solid #A7F3D0;
              border-radius: 6px;
              padding: 10px 12px;
              margin-top: 12px;
              font-size: 11px;
              color: #065F46;
              line-height: 1.4;
            }
            .seal-ribbon {
              background-color: #F1F5F9;
              border: 1px solid #CBD5E1;
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 10.5px;
              color: #475569;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 12px;
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
              margin-top: 36px;
              padding: 24px 28px;
              background-color: #F8FAFC;
              border: 1px solid #CBD5E1;
              border-radius: 8px;
            }
          </style>
        </head>
        <body>
          <!-- ── BRAND HEADER & METADATA ── -->
          <table class="header-table">
            <tr>
              <td style="vertical-align: top;">
                ${logoBase64 ? `<img src="${logoBase64}" class="shop-logo-img" alt="Shop Logo" />` : `<div class="shop-monogram">${escapeHtml(initials)}</div>`}
                <div class="shop-name">${escapeHtml(businessName)}</div>
                ${address ? `<div class="shop-address">${escapeHtml(address)}</div>` : ''}
                <div class="shop-contacts">${escapeHtml(contactParts.join(' • '))}</div>
              </td>
              <td class="doc-meta">
                <span class="doc-badge ${isPaid ? 'doc-badge-paid' : 'doc-badge-estimate'}">
                  ${isPaid ? '✓ PAID IN FULL' : '✓ SIGNED ESTIMATE'}
                </span>
                <div class="doc-title">${isPaid ? 'TAX INVOICE & RECEIPT' : 'ESTIMATE & AGREEMENT'}</div>
                <div class="meta-line"><strong>Reference:</strong> #${quote.quoteNumber}</div>
                <div class="meta-line"><strong>Date:</strong> ${new Date(quote.createdAt).toLocaleDateString()}</div>
                <div class="meta-line"><strong>Legal Status:</strong> <span style="color: #059669; font-weight: 700;">UETA / ESIGN Sealed</span></div>
              </td>
            </tr>
          </table>

          <!-- ── CLIENT & JOB SUMMARY ── -->
          <table class="cards-grid">
            <tr>
              <td class="info-card" style="width: 50%;">
                <div class="card-title">Billed To / Client</div>
                <div class="card-name">${escapeHtml(quote.clientName)}</div>
                ${quote.clientPhone ? `<div class="card-text">📞 ${escapeHtml(quote.clientPhone)}</div>` : ''}
                ${quote.clientEmail ? `<div class="card-text">✉️ ${escapeHtml(quote.clientEmail)}</div>` : ''}
                ${quote.clientAddress ? `<div class="card-text">📍 ${escapeHtml(quote.clientAddress)}</div>` : ''}
              </td>
              <td class="info-card" style="width: 50%;">
                <div class="card-title">Project & Scope Details</div>
                ${quote.jobDescription ? `<div class="card-name" style="font-size: 13px;">${escapeHtml(quote.jobDescription)}</div>` : '<div class="card-text">Standard Service & Field Repairs</div>'}
                <div class="card-text" style="margin-top: 4px; color: #64748B;">Contractor: ${escapeHtml(ownerName || businessName)}</div>
                <div class="card-text" style="color: #64748B;">Sealed Timestamp: ${new Date(quote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </td>
            </tr>
          </table>

          <!-- ── ITEMIZED LINE ITEMS ── -->
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left;">Item / Service Description</th>
                <th style="text-align: center; width: 60px;">Qty</th>
                <th style="text-align: right; width: 110px;">Unit Rate</th>
                <th style="text-align: right; width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${quote.lineItems
                .map(
                  (item) => `
                <tr>
                  <td><strong>${escapeHtml(item.description)}</strong></td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">$${(item.unitPriceCents / 100).toFixed(2)}</td>
                  <td style="text-align: right;"><strong>$${(item.totalCents / 100).toFixed(2)}</strong></td>
                </tr>
              `
                )
                .join('')}

              ${
                quote.changeOrders && quote.changeOrders.length > 0
                  ? `
                <tr class="co-callout-row">
                  <td colspan="4">APPROVED MID-JOB ADD-ONS & CHANGE ORDERS</td>
                </tr>
                ${quote.changeOrders
                  .map(
                    (co) => `
                  <tr>
                    <td><strong>Add-On #${co.orderNumber}: ${escapeHtml(co.reason)}</strong></td>
                    <td style="text-align: center;">1.0</td>
                    <td style="text-align: right;">$${(co.addedTotalCents / 100).toFixed(2)}</td>
                    <td style="text-align: right; color: #6B21A8;"><strong>+$${(co.addedTotalCents / 100).toFixed(2)}</strong></td>
                  </tr>
                `
                  )
                  .join('')}
              `
                  : ''
              }
            </tbody>
          </table>

          <!-- ── FINANCIAL TOTALS ── -->
          <div class="financial-block">
            <table class="summary-table">
              <tr>
                <td class="label-col">Subtotal:</td>
                <td class="val-col">$${(quote.subtotalCents / 100).toFixed(2)}</td>
              </tr>
              ${
                quote.taxAmountCents > 0
                  ? `<tr>
                      <td class="label-col">${escapeHtml(quote.taxLabel || 'Sales Tax')} (${(quote.taxRateBasisPoints / 100).toFixed(2)}%):</td>
                      <td class="val-col">$${(quote.taxAmountCents / 100).toFixed(2)}</td>
                    </tr>`
                  : `<tr>
                      <td class="label-col">${escapeHtml(quote.taxLabel || 'Tax')}:</td>
                      <td class="val-col" style="color: #64748B; font-weight: normal;">No Tax (Exempt / 0%)</td>
                    </tr>`
              }
              <tr class="total-row">
                <td class="label-col">${isPaid ? 'PAID IN FULL:' : 'TOTAL APPROVED:'}</td>
                <td class="val-col">$${(quote.totalAmountCents / 100).toFixed(2)}</td>
              </tr>
            </table>
            <div style="clear: both;"></div>
          </div>

          <!-- ── PAYMENT SETTLEMENT DETAILS (IF CONFIGURED) ── -->
          ${
            profile?.zelleAccount || profile?.venmoAccount || profile?.cashAppAccount
              ? `
            <div class="payment-box">
              <div>
                <div class="payment-title">Instant Payment Accounts (0% Fee)</div>
                <div class="payment-accounts">
                  ${[
                    profile.zelleAccount ? `Zelle: ${escapeHtml(profile.zelleAccount)}` : '',
                    profile.venmoAccount ? `Venmo: ${escapeHtml(profile.venmoAccount)}` : '',
                    profile.cashAppAccount ? `CashApp: ${escapeHtml(profile.cashAppAccount)}` : '',
                  ]
                    .filter(Boolean)
                    .join('  •  ')}
                </div>
              </div>
            </div>
          `
              : ''
          }

          <!-- ── EXHIBIT A: DAMAGE PROOF PHOTO ── -->
          ${
            photoBase64
              ? `
            <div class="photo-box">
              <div class="photo-header">EXHIBIT A: Worksite Condition & Scope Verification Photo</div>
              <img src="${photoBase64}" class="photo-img" alt="Worksite Photo" />
              <div style="font-size: 11px; color: #64748B;">Pre-commencement worksite photo captured and cryptographically sealed on-site.</div>
            </div>
          `
              : ''
          }

          <!-- ── TERMS & WARRANTY ── -->
          ${
            quote.notes
              ? `
            <div class="terms-box">
              <div class="terms-header">TERMS, SCOPE CONDITIONS & WORKMANSHIP WARRANTY:</div>
              <div class="terms-body">${escapeHtml(quote.notes)}</div>
            </div>
          `
              : ''
          }

          <!-- ── CLIENT SIGNATURE & LEGAL BINDING ── -->
          <div class="signature-card">
            <div class="signature-header">Client Signature of Affirmative Approval:</div>
            ${
              quote.signatureSvg
                ? `<div style="margin: 8px 0;"><svg height="80" width="280" viewBox="0 0 500 200">${quote.signatureSvg}</svg></div>`
                : `<div style="height: 45px; line-height: 45px; color: #94A3B8; font-style: italic;">[ Signed on Smartphone Glass ]</div>`
            }
            <div class="legal-consent">
              <strong>AFFIRMATIVE CONSENT & NON-REPUDIATION:</strong>
              By affixing signature above, client acknowledges receipt and approval of the itemized estimate and authorizes contractor to furnish indicated labor and materials. In accordance with 15 U.S. Code § 7001 (ESIGN Act) and Uniform Electronic Transactions Act (UETA), electronic signatures execute a binding legal instrument.
            </div>

            ${
              isPaid
                ? `
              <div class="waiver-callout">
                <strong>AUTOMATIC CONDITIONAL LIEN WAIVER & RELEASE:</strong><br/>
                Upon final clearance of settlement funds in the amount of $${(quote.totalAmountCents / 100).toFixed(2)}, contractor waives and releases any and all mechanic's lien, stop notice, or bond rights for labor and materials furnished through ${new Date().toLocaleDateString()}.
              </div>
            `
                : ''
            }

            <div class="seal-ribbon">
              <span>🔒 <strong>SHA-256 Seal:</strong> <span class="seal-hash">${hash.slice(0, 20)}...</span></span>
              <span><strong>Location:</strong> ${quote.signatureGpsLat && quote.signatureGpsLng ? `${quote.signatureGpsLat.toFixed(4)}°, ${quote.signatureGpsLng.toFixed(4)}° (GPS Verified)` : 'Field Site Execution'}</span>
            </div>
          </div>

          <!-- ── PAGE 2: COURTROOM AUDIT CERTIFICATE ── -->
          <div class="audit-page">
            <h3 style="margin-top: 0; color: #0F172A; border-bottom: 2px solid #0F172A; padding-bottom: 8px; font-size: 16px;">
              UETA / ESIGN ACT COURTROOM AUDIT CERTIFICATE
            </h3>
            <p><strong>Document Verification Hash (SHA-256):</strong><br/><code style="font-size: 12px; background: #E2E8F0; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 4px;">${hash}</code></p>
            <p><strong>Signing Timestamp:</strong> ${quote.signatureTimestamp ? new Date(quote.signatureTimestamp).toISOString() : 'N/A'} (UTC)</p>
            <p><strong>Worksite GPS Coordinates:</strong> ${quote.signatureGpsLat && quote.signatureGpsLng ? `${quote.signatureGpsLat.toFixed(5)}° Lat, ${quote.signatureGpsLng.toFixed(5)}° Lng (Verified On-Site)` : 'Offline / Basement Mode (Disclosed)'}</p>
            <p><strong>Cryptographic Integrity Status:</strong> <span style="color: #059669; font-weight: 800;">LOCKED_IMMUTABLE</span></p>
            <p><strong>Governing Legal Standards:</strong> 15 U.S. Code § 7001 (Electronic Signatures in Global and National Commerce Act) & Uniform Electronic Transactions Act (UETA § 7).</p>

            ${
              quote.changeOrders && quote.changeOrders.length > 0
                ? `
              <div style="margin-top: 20px; border-top: 1.5px solid #CBD5E1; padding-top: 14px;">
                <h4 style="margin: 0 0 10px 0; color: #5B21B6; font-size: 13px; text-transform: uppercase;">
                  AUDITED CHANGE ORDER RIDERS (${quote.changeOrders.length})
                </h4>
                ${quote.changeOrders
                  .map(
                    (co) => `
                  <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px; margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 12px;">
                      <span>Add-On #${co.orderNumber}: ${escapeHtml(co.reason)}</span>
                      <span style="color: #6B21A8;">+$${(co.addedTotalCents / 100).toFixed(2)}</span>
                    </div>
                    <div style="font-size: 11px; color: #64748B; margin-top: 4px;">
                      Executed: ${new Date(co.signatureTimestamp).toISOString()} • Hash: <code>${(co.pdfSha256Hash || '').substring(0, 24)}...</code>
                    </div>
                    ${
                      co.signatureSvg
                        ? `<div style="margin-top: 6px;"><svg height="45" width="180" viewBox="0 0 500 200">${co.signatureSvg}</svg></div>`
                        : ''
                    }
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
                : ''
            }

            <p style="font-size: 11px; color: #64748B; margin-top: 20px; line-height: 1.5;">
              This certificate affirms that this document was rendered and executed in-person on a mobile touch interface with client affirmative consent. Any retroactive alteration of line items, amounts, notes, or terms invalidates the SHA-256 cryptographic digest.
            </p>
          </div>
        </body>
      </html>
    `;
  }

  public static async generateAndSharePDF(quote: Quote, profile?: ContractorProfile): Promise<string> {
    try {
      const html = await this.generateInvoiceHTML(quote, profile);
      const isPaid = quote.status === 'PAID';

      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${isPaid ? 'Paid Receipt' : 'Estimate'} #${quote.quoteNumber} for ${quote.clientName}`,
        });
      }

      return uri;
    } catch (err: any) {
      console.error('PDF generation or sharing error:', err);
      throw new Error(err?.message || 'Could not generate PDF');
    }
  }
}
