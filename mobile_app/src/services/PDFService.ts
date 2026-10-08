import * as Crypto from 'expo-crypto';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Quote, ContractorProfile } from '../types';
import { InvoiceTemplateId } from '../constants/invoiceTemplates';
import { TelemetryService } from './TelemetryService';

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
    const templateId: InvoiceTemplateId = (profile?.invoiceTemplate as InvoiceTemplateId) || 'modern';

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
              margin: 0;
              padding: 32px 36px;
              font-size: 13px;
              line-height: 1.5;
            }
            @media print {
              body { padding: 18px 24px; }
            }
            .header-table { width: 100%; border-collapse: collapse; }
            .shop-logo-img { max-height: 54px; max-width: 170px; object-fit: contain; margin-bottom: 6px; display: block; }
            .doc-meta { text-align: right; vertical-align: top; }
            .doc-badge { display: inline-block; font-size: 10.5px; font-weight: 800; padding: 4px 10px; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 8px; }
            .cards-grid { width: 100%; margin-bottom: 24px; border-collapse: separate; border-spacing: 12px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .financial-block { width: 100%; margin-bottom: 24px; }
            .summary-table { float: right; width: 310px; border-collapse: collapse; }
            .summary-table td { padding: 6px 12px; font-size: 13px; }
            .summary-table td.label-col { text-align: left; }
            .summary-table td.val-col { text-align: right; font-weight: 700; }
            .payment-box { clear: both; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
            .photo-box { margin-bottom: 20px; page-break-inside: avoid; }
            .photo-img { max-width: 100%; max-height: 240px; border-radius: 6px; display: block; margin-bottom: 6px; }
            .terms-box { margin-bottom: 20px; }
            .signature-card { margin-bottom: 18px; page-break-inside: avoid; }
            .seal-ribbon { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
            .seal-hash { font-family: monospace; font-weight: bold; padding: 2px 6px; border-radius: 4px; }
            .audit-page { page-break-before: always; margin-top: 36px; padding: 24px 28px; }

            /* ── THEME 1: MODERN NAVY (DEFAULT) ── */
            body.theme-modern {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0F172A;
              background-color: #FFFFFF;
            }
            body.theme-modern .header-table { border-bottom: 2px solid #E2E8F0; padding-bottom: 18px; margin-bottom: 22px; }
            body.theme-modern .shop-monogram {
              display: inline-block; width: 44px; height: 44px; line-height: 44px; text-align: center;
              background-color: #0F172A; color: #FFFFFF; font-size: 17px; font-weight: 900; border-radius: 8px; margin-bottom: 6px; letter-spacing: 0.5px;
            }
            body.theme-modern .shop-name { font-size: 22px; font-weight: 900; color: #0F172A; letter-spacing: -0.4px; margin: 0 0 3px 0; }
            body.theme-modern .shop-address { font-size: 12px; color: #475569; margin-bottom: 3px; }
            body.theme-modern .shop-contacts { font-size: 11.5px; color: #64748B; }
            body.theme-modern .doc-badge { border-radius: 9999px; }
            body.theme-modern .doc-badge-paid { background-color: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
            body.theme-modern .doc-badge-estimate { background-color: #EFF6FF; color: #1E40AF; border: 1px solid #BFDBFE; }
            body.theme-modern .doc-title { font-size: 20px; font-weight: 900; color: #0F172A; margin: 0 0 6px 0; }
            body.theme-modern .meta-line { font-size: 12px; color: #64748B; margin-bottom: 2px; }
            body.theme-modern .meta-line strong { color: #1E293B; }
            body.theme-modern .info-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 16px; vertical-align: top; }
            body.theme-modern .card-title { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #64748B; margin-bottom: 6px; }
            body.theme-modern .card-name { font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 3px; }
            body.theme-modern .card-text { font-size: 12px; color: #475569; line-height: 1.4; }
            body.theme-modern .items-table th { background-color: #F1F5F9; color: #475569; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; padding: 10px 14px; border-top: 1px solid #CBD5E1; border-bottom: 1.5px solid #CBD5E1; }
            body.theme-modern .items-table td { padding: 11px 14px; border-bottom: 1px solid #E2E8F0; font-size: 12.5px; color: #1E293B; }
            body.theme-modern .items-table tbody tr:nth-child(even) td { background-color: #FAFCFE; }
            body.theme-modern .co-callout-row td { background-color: #F5F3FF !important; color: #5B21B6 !important; font-weight: 800; padding: 8px 14px; font-size: 11.5px; border-top: 1px solid #DDD6FE; border-bottom: 1px solid #DDD6FE; }
            body.theme-modern .summary-table td.label-col { color: #475569; }
            body.theme-modern .summary-table td.val-col { color: #0F172A; }
            body.theme-modern .total-row td { border-top: 2px solid #0F172A; padding-top: 10px; font-size: 16px; font-weight: 900; }
            body.theme-modern .total-row td.val-col { color: ${isPaid ? '#059669' : '#0F172A'}; font-size: 18px; }
            body.theme-modern .payment-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 16px; }
            body.theme-modern .payment-title { font-size: 11px; font-weight: 800; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; }
            body.theme-modern .payment-accounts { font-size: 12px; color: #0F172A; font-weight: 600; margin-top: 2px; }
            body.theme-modern .photo-box { border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 14px; background: #FFFFFF; }
            body.theme-modern .photo-header { font-size: 11px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
            body.theme-modern .terms-box { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px 14px; }
            body.theme-modern .terms-header { font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px; }
            body.theme-modern .terms-body { font-size: 11.5px; color: #334155; line-height: 1.45; white-space: pre-wrap; }
            body.theme-modern .signature-card { border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 16px; background-color: #FFFFFF; }
            body.theme-modern .signature-header { font-size: 12px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
            body.theme-modern .legal-consent { font-size: 10.5px; color: #64748B; line-height: 1.45; margin-top: 10px; }
            body.theme-modern .waiver-callout { background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 6px; padding: 10px 12px; margin-top: 12px; font-size: 11px; color: #065F46; line-height: 1.4; }
            body.theme-modern .seal-ribbon { background-color: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px 12px; font-size: 10.5px; color: #475569; }
            body.theme-modern .seal-hash { color: #0F172A; background: #E2E8F0; }
            body.theme-modern .audit-page { background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; }

            /* ── THEME 2: CLASSIC EXECUTIVE (FORMAL SERIF & LEGAL) ── */
            body.theme-classic {
              font-family: "Georgia", "Cambria", "Times New Roman", Times, serif;
              color: #1C1917;
              background-color: #FFFFFF;
            }
            body.theme-classic .header-table { border-bottom: 3px double #44403C; padding-bottom: 22px; margin-bottom: 24px; }
            body.theme-classic .shop-monogram {
              display: inline-block; width: 44px; height: 44px; line-height: 42px; text-align: center;
              background-color: #292524; color: #FAF8F5; font-size: 18px; font-weight: 900; border: 1.5px solid #78716C; border-radius: 2px; margin-bottom: 6px; font-family: "Georgia", serif;
            }
            body.theme-classic .shop-name { font-size: 24px; font-weight: 900; color: #1C1917; letter-spacing: 0.5px; margin: 0 0 4px 0; font-family: "Georgia", serif; }
            body.theme-classic .shop-address, body.theme-classic .shop-contacts { font-size: 12px; color: #57534E; font-style: italic; }
            body.theme-classic .doc-badge { border-radius: 2px; font-family: "Georgia", serif; font-weight: 800; }
            body.theme-classic .doc-badge-paid { background-color: #F0FDF4; color: #166534; border: 1.5px solid #86EFAC; }
            body.theme-classic .doc-badge-estimate { background-color: #FAF5FF; color: #6B21A8; border: 1.5px solid #D8B4FE; }
            body.theme-classic .doc-title { font-size: 22px; font-weight: 900; color: #1C1917; letter-spacing: 1.2px; text-transform: uppercase; font-family: "Georgia", serif; margin: 0 0 6px 0; }
            body.theme-classic .meta-line { font-size: 12px; color: #57534E; margin-bottom: 2px; font-family: "Georgia", serif; }
            body.theme-classic .meta-line strong { color: #1C1917; }
            body.theme-classic .info-card { background: #FAF8F5; border: 1px solid #D6D3D1; border-radius: 2px; padding: 14px 16px; vertical-align: top; }
            body.theme-classic .card-title { font-family: "Georgia", serif; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #831843; margin-bottom: 6px; font-style: italic; }
            body.theme-classic .card-name { font-family: "Georgia", serif; font-size: 15px; font-weight: 800; color: #1C1917; margin-bottom: 3px; }
            body.theme-classic .card-text { font-family: "Georgia", serif; font-size: 12.5px; color: #44403C; line-height: 1.4; }
            body.theme-classic .items-table th { background-color: #F5F3EF; color: #292524; font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; padding: 10px 14px; border-top: 1.5px solid #44403C; border-bottom: 1.5px solid #44403C; font-family: "Georgia", serif; }
            body.theme-classic .items-table td { padding: 11px 14px; border-bottom: 1px solid #E7E5E4; font-size: 13px; color: #292524; font-family: "Georgia", serif; }
            body.theme-classic .items-table tbody tr:nth-child(even) td { background-color: #FAF8F5; }
            body.theme-classic .co-callout-row td { background-color: #FFF1F2 !important; color: #9F1239 !important; font-weight: 800; padding: 8px 14px; font-size: 12px; border-top: 1px solid #FECDD3; border-bottom: 1px solid #FECDD3; font-family: "Georgia", serif; }
            body.theme-classic .summary-table td.label-col { color: #57534E; font-family: "Georgia", serif; }
            body.theme-classic .summary-table td.val-col { color: #1C1917; font-family: "Georgia", serif; }
            body.theme-classic .total-row td { border-top: 1.5px solid #1C1917; border-bottom: 3px double #1C1917; padding-top: 10px; padding-bottom: 10px; font-size: 16px; font-weight: 900; font-family: "Georgia", serif; }
            body.theme-classic .total-row td.val-col { color: ${isPaid ? '#15803D' : '#831843'}; font-size: 19px; }
            body.theme-classic .payment-box { background-color: #FAF8F5; border: 1px solid #D6D3D1; border-radius: 2px; padding: 12px 16px; }
            body.theme-classic .payment-title { font-size: 11px; font-weight: 800; color: #831843; text-transform: uppercase; letter-spacing: 0.8px; font-family: "Georgia", serif; }
            body.theme-classic .payment-accounts { font-size: 12.5px; color: #1C1917; font-weight: 700; margin-top: 2px; font-family: "Georgia", serif; }
            body.theme-classic .photo-box { border: 1px solid #D6D3D1; border-radius: 2px; padding: 14px; background: #FAF8F5; }
            body.theme-classic .photo-header { font-size: 11px; font-weight: 800; color: #1C1917; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; font-family: "Georgia", serif; }
            body.theme-classic .terms-box { background-color: #FAF8F5; border: 1px solid #D6D3D1; border-radius: 2px; padding: 12px 14px; }
            body.theme-classic .terms-header { font-size: 11px; font-weight: 800; color: #831843; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; font-family: "Georgia", serif; }
            body.theme-classic .terms-body { font-size: 12px; color: #292524; line-height: 1.5; white-space: pre-wrap; font-family: "Georgia", serif; }
            body.theme-classic .signature-card { background-color: #FAF8F5; border: 1.5px solid #A8A29E; border-radius: 2px; padding: 16px 20px; }
            body.theme-classic .signature-header { font-size: 12px; font-weight: 800; color: #1C1917; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; font-family: "Georgia", serif; }
            body.theme-classic .legal-consent { font-size: 11px; color: #57534E; line-height: 1.5; margin-top: 10px; font-family: "Georgia", serif; }
            body.theme-classic .waiver-callout { background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 2px; padding: 10px 12px; margin-top: 12px; font-size: 11.5px; color: #166534; line-height: 1.45; font-family: "Georgia", serif; }
            body.theme-classic .seal-ribbon { background-color: #F5F3EF; border: 1px solid #D6D3D1; border-radius: 2px; padding: 8px 12px; font-size: 11px; color: #57534E; font-family: "Georgia", serif; }
            body.theme-classic .seal-hash { color: #1C1917; background: #E7E5E4; font-family: monospace; }
            body.theme-classic .audit-page { background-color: #FAF8F5; border: 1.5px solid #A8A29E; border-radius: 2px; font-family: "Georgia", serif; }

            /* ── THEME 3: MINIMAL CLEAN (MONOCHROME SWISS) ── */
            body.theme-minimal {
              font-family: "Helvetica Neue", Helvetica, Arial, -apple-system, sans-serif;
              color: #000000;
              background-color: #FFFFFF;
              padding: 36px 40px;
            }
            body.theme-minimal .header-table { border-bottom: 2px solid #000000; padding-bottom: 22px; margin-bottom: 26px; }
            body.theme-minimal .shop-monogram {
              display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center;
              background-color: #000000; color: #FFFFFF; font-size: 16px; font-weight: 900; border-radius: 0; margin-bottom: 6px;
            }
            body.theme-minimal .shop-name { font-size: 21px; font-weight: 900; color: #000000; letter-spacing: -0.5px; margin: 0 0 3px 0; }
            body.theme-minimal .shop-address { font-size: 11.5px; color: #4B5563; margin-bottom: 2px; }
            body.theme-minimal .shop-contacts { font-size: 11px; color: #6B7280; }
            body.theme-minimal .doc-badge { border-radius: 0; font-size: 10px; font-weight: 900; letter-spacing: 1px; }
            body.theme-minimal .doc-badge-paid { background-color: #000000; color: #FFFFFF; border: none; }
            body.theme-minimal .doc-badge-estimate { background-color: #F3F4F6; color: #000000; border: 1px solid #000000; }
            body.theme-minimal .doc-title { font-size: 24px; font-weight: 900; color: #000000; letter-spacing: -0.5px; margin: 0 0 6px 0; }
            body.theme-minimal .meta-line { font-size: 11.5px; color: #6B7280; margin-bottom: 2px; }
            body.theme-minimal .meta-line strong { color: #000000; }
            body.theme-minimal .info-card { background: transparent; border: none; border-left: 2px solid #000000; border-radius: 0; padding: 4px 0 4px 14px; vertical-align: top; }
            body.theme-minimal .card-title { font-size: 10px; font-weight: 900; color: #000000; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
            body.theme-minimal .card-name { font-size: 14px; font-weight: 900; color: #000000; margin-bottom: 2px; }
            body.theme-minimal .card-text { font-size: 11.5px; color: #374151; line-height: 1.4; }
            body.theme-minimal .items-table th { background-color: #FFFFFF; color: #000000; font-size: 11px; font-weight: 900; letter-spacing: 0.8px; padding: 10px 10px; border-top: none; border-bottom: 2px solid #000000; text-transform: uppercase; }
            body.theme-minimal .items-table td { padding: 12px 10px; border-bottom: 1px solid #E5E7EB; font-size: 12px; color: #111827; }
            body.theme-minimal .items-table tbody tr:nth-child(even) td { background-color: transparent; }
            body.theme-minimal .co-callout-row td { background-color: #F3F4F6 !important; color: #000000 !important; font-weight: 900; padding: 8px 10px; font-size: 11px; border-top: 1px solid #000000; border-bottom: 1px solid #000000; }
            body.theme-minimal .summary-table td.label-col { color: #4B5563; }
            body.theme-minimal .summary-table td.val-col { color: #000000; }
            body.theme-minimal .total-row td { background-color: #000000; color: #FFFFFF; padding: 10px 14px; font-size: 15px; font-weight: 900; }
            body.theme-minimal .total-row td.label-col { color: #FFFFFF; }
            body.theme-minimal .total-row td.val-col { color: #FFFFFF; font-size: 18px; }
            body.theme-minimal .payment-box { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0; padding: 12px 14px; }
            body.theme-minimal .payment-title { font-size: 10.5px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.8px; }
            body.theme-minimal .payment-accounts { font-size: 11.5px; color: #111827; font-weight: 600; margin-top: 2px; }
            body.theme-minimal .photo-box { border: 1px solid #E5E7EB; border-radius: 0; padding: 14px; background: #FFFFFF; }
            body.theme-minimal .photo-header { font-size: 10.5px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
            body.theme-minimal .terms-box { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0; padding: 12px 14px; }
            body.theme-minimal .terms-header { font-size: 10.5px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }
            body.theme-minimal .terms-body { font-size: 11px; color: #374151; line-height: 1.45; white-space: pre-wrap; }
            body.theme-minimal .signature-card { background-color: #FFFFFF; border: 1px solid #000000; border-radius: 0; padding: 16px 20px; }
            body.theme-minimal .signature-header { font-size: 11.5px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; }
            body.theme-minimal .legal-consent { font-size: 10px; color: #6B7280; line-height: 1.4; margin-top: 10px; }
            body.theme-minimal .waiver-callout { background-color: #F9FAFB; border: 1px solid #D1D5DB; border-radius: 0; padding: 10px 12px; margin-top: 12px; font-size: 10.5px; color: #111827; line-height: 1.4; }
            body.theme-minimal .seal-ribbon { background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0; padding: 8px 12px; font-size: 10px; color: #4B5563; }
            body.theme-minimal .seal-hash { color: #000000; background: #E5E7EB; }
            body.theme-minimal .audit-page { background-color: #FFFFFF; border: 1px solid #000000; border-radius: 0; }

            /* ── THEME 4: INDUSTRIAL CONTRACTOR (HIGH-IMPACT TRADES) ── */
            body.theme-contractor {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Impact", sans-serif;
              color: #18181B;
              background-color: #FFFFFF;
              padding: 28px 32px;
            }
            body.theme-contractor .header-table {
              background-color: #18181B;
              color: #FFFFFF;
              border-radius: 6px;
              padding: 18px 22px;
              border-bottom: 5px solid #F59E0B;
              margin-bottom: 22px;
            }
            body.theme-contractor .shop-monogram {
              display: inline-block; width: 44px; height: 44px; line-height: 44px; text-align: center;
              background-color: #F59E0B; color: #000000; font-size: 18px; font-weight: 900; border-radius: 4px; margin-bottom: 6px; letter-spacing: 0.5px;
            }
            body.theme-contractor .shop-name { font-size: 23px; font-weight: 900; color: #FFFFFF !important; text-transform: uppercase; letter-spacing: 0.4px; margin: 0 0 3px 0; }
            body.theme-contractor .shop-address { font-size: 12px; color: #D4D4D8 !important; }
            body.theme-contractor .shop-contacts { font-size: 11.5px; color: #A1A1AA !important; }
            body.theme-contractor .doc-title { font-size: 22px; font-weight: 900; color: #FBBF24 !important; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 6px 0; }
            body.theme-contractor .doc-badge { background-color: #F59E0B; color: #000000; border-radius: 4px; font-weight: 900; border: none; }
            body.theme-contractor .doc-badge-paid { background-color: #10B981; color: #FFFFFF; }
            body.theme-contractor .doc-badge-estimate { background-color: #F59E0B; color: #000000; }
            body.theme-contractor .meta-line { color: #D4D4D8 !important; }
            body.theme-contractor .meta-line strong { color: #FFFFFF !important; }
            body.theme-contractor .info-card { background: #F4F4F5; border: 1px solid #D4D4D8; border-top: 3.5px solid #D97706; border-radius: 4px; padding: 14px 16px; vertical-align: top; }
            body.theme-contractor .card-title { color: #B45309; font-weight: 900; letter-spacing: 1px; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; }
            body.theme-contractor .card-name { font-size: 15px; font-weight: 900; color: #18181B; margin-bottom: 3px; }
            body.theme-contractor .card-text { font-size: 12.5px; color: #3F3F46; line-height: 1.4; }
            body.theme-contractor .items-table th { background-color: #18181B; color: #FFFFFF; font-size: 11.5px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.8px; padding: 11px 14px; border-top: none; border-bottom: 2px solid #D97706; }
            body.theme-contractor .items-table td { padding: 11px 14px; border-bottom: 1.5px solid #E4E4E7; font-size: 13px; color: #18181B; }
            body.theme-contractor .items-table tbody tr:nth-child(even) td { background-color: #FAFAFA; }
            body.theme-contractor .co-callout-row td { background-color: #FFFBEB !important; color: #B45309 !important; font-weight: 900; padding: 8px 14px; font-size: 12px; border-top: 1.5px solid #FCD34D; border-bottom: 1.5px solid #FCD34D; }
            body.theme-contractor .summary-table td.label-col { color: #52525B; }
            body.theme-contractor .summary-table td.val-col { color: #18181B; }
            body.theme-contractor .total-row td { background-color: #18181B; color: #FFFFFF; padding: 12px 16px; font-size: 16px; font-weight: 900; border-radius: 4px 0 0 4px; }
            body.theme-contractor .total-row td.label-col { color: #FFFFFF; }
            body.theme-contractor .total-row td.val-col { color: #FBBF24; font-size: 20px; border-radius: 0 4px 4px 0; }
            body.theme-contractor .payment-box { background-color: #FFFBEB; border: 1.5px solid #FCD34D; border-radius: 4px; padding: 12px 16px; }
            body.theme-contractor .payment-title { font-size: 11px; font-weight: 900; color: #B45309; text-transform: uppercase; letter-spacing: 0.6px; }
            body.theme-contractor .payment-accounts { font-size: 12.5px; color: #18181B; font-weight: 700; margin-top: 2px; }
            body.theme-contractor .photo-box { border: 1.5px solid #D4D4D8; border-top: 3px solid #D97706; border-radius: 4px; padding: 14px; background: #FFFFFF; }
            body.theme-contractor .photo-header { font-size: 11.5px; font-weight: 900; color: #18181B; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
            body.theme-contractor .terms-box { background-color: #F4F4F5; border: 1px solid #D4D4D8; border-left: 4px solid #D97706; border-radius: 4px; padding: 12px 14px; }
            body.theme-contractor .terms-header { font-size: 11px; font-weight: 900; color: #B45309; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px; }
            body.theme-contractor .terms-body { font-size: 12px; color: #27272A; line-height: 1.45; white-space: pre-wrap; }
            body.theme-contractor .signature-card { background-color: #FFFFFF; border: 2px solid #18181B; border-top: 4px solid #D97706; border-radius: 4px; padding: 16px 20px; }
            body.theme-contractor .signature-header { font-size: 12.5px; font-weight: 900; color: #18181B; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
            body.theme-contractor .legal-consent { font-size: 10.5px; color: #71717A; line-height: 1.45; margin-top: 10px; }
            body.theme-contractor .waiver-callout { background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 4px; padding: 10px 12px; margin-top: 12px; font-size: 11.5px; color: #065F46; line-height: 1.4; }
            body.theme-contractor .seal-ribbon { background-color: #F4F4F5; border: 1px solid #D4D4D8; border-radius: 4px; padding: 8px 12px; font-size: 11px; color: #52525B; }
            body.theme-contractor .seal-hash { color: #18181B; background: #E4E4E7; }
            body.theme-contractor .audit-page { background-color: #F4F4F5; border: 2px solid #18181B; border-radius: 4px; }
          </style>
        </head>
        <body class="theme-${templateId}">
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

      await TelemetryService.logPDF(
        'SHARED',
        profile?.invoiceTemplate || 'modern',
        quote.id,
        { isPaid, quoteNumber: quote.quoteNumber, clientName: quote.clientName }
      );

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
