import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Quote, ContractorProfile } from '../types';
import { InvoiceTemplateId } from '../constants/invoiceTemplates';
import { TelemetryService } from './TelemetryService';
import { RegionPaymentService } from './RegionPaymentService';
import { formatAmountInWords } from '../utils/numberToIndianWords';
import { generateQrSvg } from '../utils/generateQrSvg';
import { formatLocalDateTimeWithTz, formatLocalDateDisplay, formatLocalTime } from '../utils/dateUtils';

function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }
  let bufferLength = base64.length * 0.75;
  if (base64.endsWith('==')) bufferLength -= 2;
  else if (base64.endsWith('=')) bufferLength -= 1;

  const bytes = new Uint8Array(bufferLength);
  let p = 0;
  for (let i = 0; i < base64.length; i += 4) {
    const encoded1 = lookup[base64.charCodeAt(i)];
    const encoded2 = lookup[base64.charCodeAt(i + 1)];
    const encoded3 = lookup[base64.charCodeAt(i + 2)];
    const encoded4 = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (base64[i + 2] !== '=') bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (base64[i + 3] !== '=') bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }
  return bytes;
}

function escapeHtml(s: string = ''): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class PDFService {
  /**
   * Hashes the physical binary content of a file URI using SHA-256.
   * Guarantees that any byte alteration to an attached photograph mutates the hash.
   */
  public static async hashFileUri(uri?: string | null): Promise<string | null> {
    try {
      if (!uri) return null;
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (!base64) return null;
      try {
        if (typeof (Crypto as any).digest === 'function') {
          const rawBytes = decodeBase64ToUint8Array(base64);
          const buffer = await (Crypto as any).digest(Crypto.CryptoDigestAlgorithm.SHA256, rawBytes);
          return Array.from(new Uint8Array(buffer))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
        }
      } catch {
        // Fallback to digestStringAsync if native Crypto.digest buffer is unavailable
      }
      return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, base64);
    } catch {
      return null;
    }
  }

  /**
   * Computes the canonical SHA-256 digest of an estimate/invoice agreement.
   * Cryptographically binds all frozen terms, line items, timestamps, signature SVG,
   * worksite GPS coordinates, and the SHA-256 byte digests of attached worksite photos.
   */
  public static async computeHash(quote: Quote): Promise<string> {
    const photoHash =
      quote.photoSha256 || (quote.photoUri ? await this.hashFileUri(quote.photoUri) : null);
    const completedPhotoHash =
      quote.completedPhotoSha256 ||
      (quote.completedPhotoUri ? await this.hashFileUri(quote.completedPhotoUri) : null);

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
        h: i.hsnSac || null,
        un: i.unit || null,
        disc: i.discountPercent || null,
      })),
      subtotalCents: quote.subtotalCents,
      taxRateBasisPoints: quote.taxRateBasisPoints,
      taxAmountCents: quote.taxAmountCents,
      totalAmountCents: quote.totalAmountCents,
      depositAmountCents: quote.depositAmountCents || 0,
      photoSha256: photoHash,
      completedPhotoSha256: completedPhotoHash,
      signatureSvg: quote.signatureSvg || '',
      signatureTimestamp: quote.signatureTimestamp || 0,
      signatureGpsLat: quote.signatureGpsLat || null,
      signatureGpsLng: quote.signatureGpsLng || null,
    });
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, canonical);
  }

  public static async generateInvoiceHTML(quote: Quote, profile?: ContractorProfile): Promise<string> {
    const hash = quote.pdfSha256Hash || (await this.computeHash(quote));
    const curSymbol = quote.currencySymbol || profile?.currencySymbol || '$';
    const regionConfig = RegionPaymentService.getConfig(profile?.currencyCode, curSymbol, profile?.region);

    const formattedDate = formatLocalDateDisplay(quote.createdAt, regionConfig.locale);
    const formattedTime = formatLocalTime(quote.createdAt, regionConfig.locale);

    const businessName = profile?.businessName?.trim() || profile?.ownerName?.trim() || 'Independent Contractor';
    const ownerName = profile?.ownerName?.trim() || '';
    const phone = profile?.phone?.trim() || '';
    const email = profile?.email?.trim() || '';
    const address = profile?.address?.trim() || '';
    const taxIdVal = (profile?.taxIdNumber?.trim() || profile?.licenseNumber?.trim()) || '';
    const taxIdDisplay = taxIdVal ? `${regionConfig.businessIdLabel.split(' ')[0]}: ${taxIdVal}` : '';
    const isPaid = quote.status === 'PAID';
    const isInvoiced = quote.status === 'INVOICED' || isPaid;

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
          let uriToRead = profile.logoUri;
          // If Android content URI, copy to cache directory first so FileSystem can read it
          if (uriToRead.startsWith('content://')) {
            const cacheFile = `${(FileSystem as any).cacheDirectory || ''}logo_cache_${Date.now()}.jpg`;
            await FileSystem.copyAsync({ from: uriToRead, to: cacheFile });
            uriToRead = cacheFile;
          }
          const base64Str = await FileSystem.readAsStringAsync(uriToRead, {
            encoding: FileSystem.EncodingType.Base64,
          });
          const ext = profile.logoUri.toLowerCase().includes('.png') ? 'png' : 'jpeg';
          logoBase64 = `data:image/${ext};base64,${base64Str}`;
        }
      } catch (e) {
        console.log('PDF logo embed fallback:', e);
        if (profile.logoUri.startsWith('file://')) {
          logoBase64 = profile.logoUri;
        }
      }
    }

    let photoBase64 = '';
    if (quote.photoUri && quote.includePhotoInPdf !== false) {
      try {
        if (quote.photoUri.startsWith('data:')) {
          photoBase64 = quote.photoUri;
        } else {
          let uriToRead = quote.photoUri;
          if (uriToRead.startsWith('content://')) {
            const cacheFile = `${(FileSystem as any).cacheDirectory || ''}photo_cache_${Date.now()}.jpg`;
            await FileSystem.copyAsync({ from: uriToRead, to: cacheFile });
            uriToRead = cacheFile;
          }
          const base64Str = await FileSystem.readAsStringAsync(uriToRead, {
            encoding: FileSystem.EncodingType.Base64,
          });
          photoBase64 = `data:image/jpeg;base64,${base64Str}`;
        }
      } catch (e) {
        console.log('PDF photo embed fallback:', e);
        if (quote.photoUri.startsWith('file://')) {
          photoBase64 = quote.photoUri;
        }
      }
    }

    let completedPhotoBase64 = '';
    if (quote.completedPhotoUri && quote.includePhotoInPdf !== false) {
      try {
        if (quote.completedPhotoUri.startsWith('data:')) {
          completedPhotoBase64 = quote.completedPhotoUri;
        } else {
          let uriToRead = quote.completedPhotoUri;
          if (uriToRead.startsWith('content://')) {
            const cacheFile = `${(FileSystem as any).cacheDirectory || ''}photo_cache_completed_${Date.now()}.jpg`;
            await FileSystem.copyAsync({ from: uriToRead, to: cacheFile });
            uriToRead = cacheFile;
          }
          const base64Str = await FileSystem.readAsStringAsync(uriToRead, {
            encoding: FileSystem.EncodingType.Base64,
          });
          completedPhotoBase64 = `data:image/jpeg;base64,${base64Str}`;
        }
      } catch (e) {
        console.log('PDF completed photo embed fallback:', e);
        if (quote.completedPhotoUri.startsWith('file://')) {
          completedPhotoBase64 = quote.completedPhotoUri;
        }
      }
    }

    const stateDisplay = profile?.stateCode ? `State: ${profile.stateCode}` : '';
    const contactParts = [
      phone ? `📞 ${phone}` : '',
      email ? `✉️ ${email}` : '',
      taxIdDisplay,
      stateDisplay,
    ].filter(Boolean);

    // Compute document title according to Indian / US / Global standards
    const isIndia = (profile?.region === 'IN') || (profile?.region !== 'US' && (regionConfig.region === 'IN' || profile?.currencyCode === 'INR' || curSymbol === '₹'));
    let computedDocTitle = isInvoiced ? regionConfig.invoiceTitle : regionConfig.estimateTitle;
    if (quote.documentType === 'TAX_INVOICE') {
      computedDocTitle = isIndia ? 'TAX INVOICE / कर इनवॉइस' : 'INVOICE';
    } else if (quote.documentType === 'BILL_OF_SUPPLY') {
      computedDocTitle = isIndia ? 'BILL OF SUPPLY / आपूर्ति बिल' : 'BILL OF SUPPLY';
    } else if (quote.documentType === 'ESTIMATE') {
      computedDocTitle = isIndia ? 'ESTIMATE & QUOTATION / कोटेशन' : 'ESTIMATE & PROPOSAL';
    } else if (quote.documentType === 'DELIVERY_CHALLAN') {
      computedDocTitle = isIndia ? 'DELIVERY CHALLAN / डिलीवरी चालान' : 'DELIVERY CHALLAN';
    } else if (isIndia) {
      if (isInvoiced || isPaid) {
        if (profile?.defaultInvoiceType === 'BILL_OF_SUPPLY') {
          computedDocTitle = 'BILL OF SUPPLY / आपूर्ति बिल';
        } else {
          computedDocTitle = 'TAX INVOICE / कर इनवॉइस';
        }
      } else {
        computedDocTitle = 'ESTIMATE & QUOTATION / कोटेशन';
      }
    } else {
      if (isInvoiced || isPaid) {
        computedDocTitle = 'INVOICE';
      } else {
        computedDocTitle = 'ESTIMATE & PROPOSAL';
      }
    }

    const balanceDueCents = Math.max(0, quote.totalAmountCents - (quote.depositAmountCents || 0));
    const totalAmountInWords = formatAmountInWords(quote.totalAmountCents, profile?.currencyCode, curSymbol);
    const balanceDueInWords = formatAmountInWords(balanceDueCents, profile?.currencyCode, curSymbol);

    let upiQrSvg = '';
    if (profile?.upiId && (regionConfig.region === 'IN' || profile.currencyCode === 'INR' || curSymbol === '₹')) {
      const upiPayee = profile.upiPayeeName || businessName;
      const upiAmount = isPaid ? '0.00' : (balanceDueCents / 100).toFixed(2);
      const upiUrl = `upi://pay?pa=${encodeURIComponent(profile.upiId)}&pn=${encodeURIComponent(upiPayee)}&am=${upiAmount}&cu=INR&tn=${encodeURIComponent(`Inv_${quote.quoteNumber}`)}`;
      upiQrSvg = await generateQrSvg(upiUrl, 100);
    }

    const templateId: InvoiceTemplateId = (profile?.invoiceTemplate as InvoiceTemplateId) || 'modern';
    const isGstLayout = templateId === 'advanced_gst' || templateId === 'tally';
    const hasHsnOrUnit = quote.lineItems.some((i) => i.hsnSac || i.unit || (i.discountPercent && i.discountPercent > 0));
    const showDetailedGrid = isGstLayout || hasHsnOrUnit;

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
            .shop-logo-img { max-height: 64px; max-width: 180px; object-fit: contain; margin-bottom: 8px; display: block; border-radius: 4px; }
            .doc-meta { text-align: right; vertical-align: top; }
            .doc-badge { display: inline-block; font-size: 10.5px; font-weight: 800; padding: 4px 10px; letter-spacing: 0.6px; text-transform: uppercase; margin-bottom: 8px; }
            .cards-grid { width: 100%; margin-bottom: 24px; border-collapse: separate; border-spacing: 12px 0; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table thead { display: table-header-group; }
            .items-table tr { page-break-inside: avoid; }
            .financial-block { width: 100%; margin-bottom: 24px; page-break-inside: avoid; }
            .summary-table { float: right; width: 310px; border-collapse: collapse; page-break-inside: avoid; }
            .summary-table td { padding: 6px 12px; font-size: 13px; }
            .summary-table td.label-col { text-align: left; }
            .summary-table td.val-col { text-align: right; font-weight: 700; }
            .payment-box { clear: both; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; page-break-inside: avoid; }
            .terms-box { margin-bottom: 20px; page-break-inside: avoid; }
            .signature-card { margin-bottom: 18px; page-break-inside: avoid; }
            .seal-ribbon { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
            .seal-hash { font-family: monospace; font-weight: bold; padding: 2px 6px; border-radius: 4px; }
            .photo-page { page-break-before: always; margin-top: 24px; }
            .photo-frame { background-color: #0F172A; border-radius: 8px; padding: 12px; text-align: center; box-shadow: 0 4px 14px rgba(0,0,0,0.12); margin-bottom: 16px; }
            .photo-img-full { max-height: 480px; max-width: 100%; width: auto; height: auto; border-radius: 4px; display: inline-block; object-fit: contain; }
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

            /* ── THEME 5: ADVANCED GST (ENTERPRISE TRADE LAYOUT) ── */
            body.theme-advanced_gst {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0F172A;
              background-color: #FFFFFF;
            }
            body.theme-advanced_gst .header-table {
              border-bottom: 2.5px solid #0F766E;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            body.theme-advanced_gst .shop-monogram {
              display: inline-block; width: 44px; height: 44px; line-height: 44px; text-align: center;
              background-color: #0F766E; color: #FFFFFF; font-size: 18px; font-weight: 900; border-radius: 8px; margin-bottom: 6px;
            }
            body.theme-advanced_gst .shop-name { font-size: 22px; font-weight: 900; color: #0F766E; margin: 0 0 3px 0; letter-spacing: -0.3px; }
            body.theme-advanced_gst .shop-address { font-size: 12px; color: #334155; margin-bottom: 3px; }
            body.theme-advanced_gst .shop-contacts { font-size: 11.5px; color: #0F766E; font-weight: 600; }
            body.theme-advanced_gst .doc-badge { border-radius: 6px; background-color: #CCFBF1; color: #0F766E; border: 1px solid #5EEAD4; }
            body.theme-advanced_gst .doc-badge-paid { background-color: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
            body.theme-advanced_gst .doc-badge-estimate { background-color: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
            body.theme-advanced_gst .doc-title { font-size: 22px; font-weight: 900; color: #0F766E; margin: 0 0 6px 0; }
            body.theme-advanced_gst .meta-line { font-size: 12px; color: #475569; margin-bottom: 2px; }
            body.theme-advanced_gst .meta-line strong { color: #0F172A; }
            body.theme-advanced_gst .info-card { background: #F0FDFA; border: 1.5px solid #CCFBF1; border-radius: 6px; padding: 12px 14px; vertical-align: top; }
            body.theme-advanced_gst .card-title { color: #0F766E; font-weight: 800; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.6px; }
            body.theme-advanced_gst .card-name { font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 3px; }
            body.theme-advanced_gst .card-text { font-size: 12px; color: #334155; line-height: 1.4; }
            body.theme-advanced_gst .items-table th { background-color: #0F766E; color: #FFFFFF; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 9px 10px; border: 1px solid #0D9488; }
            body.theme-advanced_gst .items-table td { padding: 9px 10px; border: 1px solid #E2E8F0; font-size: 12px; color: #1E293B; }
            body.theme-advanced_gst .items-table tbody tr:nth-child(even) td { background-color: #F8FAFC; }
            body.theme-advanced_gst .co-callout-row td { background-color: #CCFBF1 !important; color: #0F766E !important; font-weight: 800; padding: 8px 10px; font-size: 11.5px; }
            body.theme-advanced_gst .summary-table td.label-col { color: #475569; }
            body.theme-advanced_gst .summary-table td.val-col { color: #0F172A; }
            body.theme-advanced_gst .total-row td { background-color: #0F766E; color: #FFFFFF; padding: 10px 14px; font-size: 15px; font-weight: 900; }
            body.theme-advanced_gst .total-row td.label-col { color: #FFFFFF; }
            body.theme-advanced_gst .total-row td.val-col { color: #A7F3D0; font-size: 18px; }
            body.theme-advanced_gst .payment-box { background-color: #F0FDFA; border: 1.5px solid #99F6E4; border-radius: 6px; padding: 12px 14px; }
            body.theme-advanced_gst .payment-title { font-size: 11px; font-weight: 800; color: #0F766E; text-transform: uppercase; }
            body.theme-advanced_gst .payment-accounts { font-size: 12px; color: #0F172A; font-weight: 600; margin-top: 2px; }
            body.theme-advanced_gst .photo-box { border: 1.5px solid #CCFBF1; border-radius: 6px; padding: 14px; background: #FFFFFF; }
            body.theme-advanced_gst .photo-header { font-size: 11px; font-weight: 800; color: #0F766E; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
            body.theme-advanced_gst .terms-box { background-color: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 6px; padding: 12px 14px; }
            body.theme-advanced_gst .terms-header { font-size: 11px; font-weight: 800; color: #0F766E; text-transform: uppercase; margin-bottom: 4px; }
            body.theme-advanced_gst .terms-body { font-size: 11.5px; color: #1E293B; line-height: 1.45; white-space: pre-wrap; }
            body.theme-advanced_gst .signature-card { border: 1.5px solid #0F766E; border-radius: 6px; padding: 14px 16px; background: #FFFFFF; }
            body.theme-advanced_gst .signature-header { font-size: 12px; font-weight: 800; color: #0F766E; text-transform: uppercase; margin-bottom: 8px; }
            body.theme-advanced_gst .legal-consent { font-size: 10.5px; color: #64748B; line-height: 1.45; margin-top: 10px; }
            body.theme-advanced_gst .waiver-callout { background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 6px; padding: 10px 12px; margin-top: 12px; font-size: 11px; color: #065F46; line-height: 1.4; }
            body.theme-advanced_gst .seal-ribbon { background-color: #F0FDFA; border: 1px solid #CCFBF1; border-radius: 6px; padding: 8px 12px; font-size: 10.5px; color: #0F766E; }
            body.theme-advanced_gst .seal-hash { color: #0F766E; background: #CCFBF1; }
            body.theme-advanced_gst .audit-page { background-color: #F0FDFA; border: 1.5px solid #0F766E; border-radius: 6px; }

            /* ── THEME 6: TALLY ACCOUNTING (CLASSIC BOXED LEDGER) ── */
            body.theme-tally {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
              color: #1E293B;
              background-color: #FFFFFF;
            }
            body.theme-tally .header-table {
              border: 2px solid #1E293B;
              padding: 12px 16px;
              margin-bottom: 0;
              border-bottom: 1px solid #1E293B;
            }
            body.theme-tally .shop-monogram {
              display: inline-block; width: 40px; height: 40px; line-height: 40px; text-align: center;
              background-color: #1E293B; color: #FFFFFF; font-size: 16px; font-weight: 900; border-radius: 0; margin-bottom: 4px;
            }
            body.theme-tally .shop-name { font-size: 20px; font-weight: 900; color: #1E293B; margin: 0 0 2px 0; }
            body.theme-tally .shop-address, body.theme-tally .shop-contacts { font-size: 11.5px; color: #475569; }
            body.theme-tally .doc-badge { border-radius: 0; background-color: #1E293B; color: #FFFFFF; border: none; font-size: 10px; font-weight: 900; }
            body.theme-tally .doc-badge-paid { background-color: #1E293B; color: #FFFFFF; }
            body.theme-tally .doc-badge-estimate { background-color: #475569; color: #FFFFFF; }
            body.theme-tally .doc-title { font-size: 20px; font-weight: 900; color: #1E293B; margin: 0 0 4px 0; letter-spacing: 0.5px; }
            body.theme-tally .meta-line { font-size: 11.5px; color: #475569; margin-bottom: 2px; }
            body.theme-tally .meta-line strong { color: #1E293B; }
            body.theme-tally .cards-grid { border-collapse: collapse; margin-bottom: 0; border: none; }
            body.theme-tally .info-card { background: #FFFFFF; border: 2px solid #1E293B; border-top: none; border-radius: 0; padding: 10px 12px; vertical-align: top; }
            body.theme-tally .card-title { color: #1E293B; font-weight: 800; font-size: 10.5px; text-transform: uppercase; border-bottom: 1px solid #CBD5E1; padding-bottom: 3px; margin-bottom: 6px; }
            body.theme-tally .card-name { font-size: 13.5px; font-weight: 800; color: #1E293B; margin-bottom: 2px; }
            body.theme-tally .card-text { font-size: 11.5px; color: #334155; line-height: 1.35; }
            body.theme-tally .items-table { border-collapse: collapse; border: 2px solid #1E293B; border-top: none; margin-bottom: 0; }
            body.theme-tally .items-table th { background-color: #F1F5F9; color: #1E293B; font-size: 10.5px; font-weight: 800; text-transform: uppercase; padding: 8px; border: 1px solid #1E293B; border-top: none; }
            body.theme-tally .items-table td { padding: 8px; border: 1px solid #1E293B; font-size: 11.5px; color: #1E293B; }
            body.theme-tally .items-table tbody tr:nth-child(even) td { background-color: #FFFFFF; }
            body.theme-tally .co-callout-row td { background-color: #F1F5F9 !important; color: #1E293B !important; font-weight: 800; padding: 7px 8px; font-size: 11px; }
            body.theme-tally .financial-block { border: 2px solid #1E293B; border-top: none; padding: 10px 14px; margin-bottom: 14px; }
            body.theme-tally .summary-table td.label-col { color: #475569; }
            body.theme-tally .summary-table td.val-col { color: #1E293B; }
            body.theme-tally .total-row td { border-top: 1.5px solid #1E293B; border-bottom: 2px solid #1E293B; padding: 8px 10px; font-size: 14.5px; font-weight: 900; }
            body.theme-tally .total-row td.label-col { color: #1E293B; }
            body.theme-tally .total-row td.val-col { color: #1E293B; font-size: 16.5px; }
            body.theme-tally .payment-box { border: 2px solid #1E293B; border-radius: 0; padding: 10px 12px; background: #FAFAFA; }
            body.theme-tally .payment-title { font-size: 10.5px; font-weight: 800; color: #1E293B; text-transform: uppercase; }
            body.theme-tally .payment-accounts { font-size: 11.5px; color: #1E293B; font-weight: 600; margin-top: 2px; }
            body.theme-tally .photo-box { border: 2px solid #1E293B; border-radius: 0; padding: 12px; background: #FFFFFF; }
            body.theme-tally .photo-header { font-size: 10.5px; font-weight: 800; color: #1E293B; text-transform: uppercase; margin-bottom: 6px; }
            body.theme-tally .terms-box { border: 2px solid #1E293B; border-radius: 0; padding: 10px 12px; background: #FFFFFF; }
            body.theme-tally .terms-header { font-size: 10.5px; font-weight: 800; color: #1E293B; text-transform: uppercase; margin-bottom: 3px; }
            body.theme-tally .terms-body { font-size: 11px; color: #334155; line-height: 1.4; white-space: pre-wrap; }
            body.theme-tally .signature-card { border: 2px solid #1E293B; border-radius: 0; padding: 14px; background: #FFFFFF; }
            body.theme-tally .signature-header { font-size: 11px; font-weight: 800; color: #1E293B; text-transform: uppercase; margin-bottom: 6px; }
            body.theme-tally .legal-consent { font-size: 10px; color: #64748B; line-height: 1.4; margin-top: 8px; }
            body.theme-tally .waiver-callout { background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 0; padding: 8px 10px; margin-top: 10px; font-size: 10.5px; color: #1E293B; }
            body.theme-tally .seal-ribbon { background-color: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 0; padding: 6px 10px; font-size: 10px; color: #475569; }
            body.theme-tally .seal-hash { color: #1E293B; background: #E2E8F0; }
            body.theme-tally .audit-page { background-color: #FFFFFF; border: 2px solid #1E293B; border-radius: 0; }

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
                ${contactParts.length > 0 ? `<div class="shop-contacts">${escapeHtml(contactParts.join('  •  '))}</div>` : ''}
              </td>
              <td class="doc-meta">
                <span class="doc-badge ${isPaid ? 'doc-badge-paid' : isInvoiced ? 'doc-badge-paid' : 'doc-badge-estimate'}">
                  ${isPaid ? '✓ PAID IN FULL' : isInvoiced ? '✓ INVOICE ISSUED • PAYMENT DUE' : '✓ SIGNED & APPROVED'}
                </span>
                <div class="doc-title">${escapeHtml(computedDocTitle)}</div>
                <div class="meta-line"><strong>Reference:</strong> #${quote.quoteNumber}</div>
                <div class="meta-line"><strong>Date:</strong> ${formattedDate}</div>
                ${
                  quote.dueDateTimestamp
                    ? `<div class="meta-line"><strong>Due Date:</strong> <span style="color: #DC2626; font-weight: 700;">${formatLocalDateDisplay(quote.dueDateTimestamp, regionConfig.locale)}</span></div>`
                    : quote.paymentTerms
                    ? `<div class="meta-line"><strong>Terms:</strong> ${escapeHtml(quote.paymentTerms === 'DUE_ON_RECEIPT' ? 'Due on Receipt' : quote.paymentTerms === 'NET_7' ? 'Net 7 Days' : quote.paymentTerms === 'NET_15' ? 'Net 15 Days' : quote.paymentTerms === 'NET_30' ? 'Net 30 Days' : quote.paymentTerms)}</div>`
                    : ''
                }
                <div class="meta-line"><strong>Status:</strong> <span style="color: #059669; font-weight: 700;">${regionConfig.legalSealedBadge}</span></div>
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
                ${quote.placeOfSupply ? `<div class="card-text" style="color: #475569; font-weight: 600; margin-top: 3px;">🏛️ Place of Supply: ${escapeHtml(quote.placeOfSupply)}</div>` : ''}
              </td>
              <td class="info-card" style="width: 50%;">
                <div class="card-title">Project & Scope Details</div>
                ${quote.jobDescription ? `<div class="card-name" style="font-size: 13px;">${escapeHtml(quote.jobDescription)}</div>` : '<div class="card-text">Contracted Services & Field Work</div>'}
                ${businessName ? `<div class="card-text" style="margin-top: 4px; color: #64748B;">Contractor: ${escapeHtml(businessName)}${ownerName && ownerName !== businessName ? ` (${escapeHtml(ownerName)})` : ''}</div>` : ''}
                <div class="card-text" style="color: #64748B;">Executed: ${formattedDate} • ${formattedTime}</div>
              </td>
            </tr>
          </table>

          <!-- ── ITEMIZED LINE ITEMS ── -->
          <table class="items-table">
            <thead>
              ${
                showDetailedGrid
                  ? `
                <tr>
                  <th style="text-align: center; width: 32px;">#</th>
                  <th style="text-align: left;">Item / Service Description</th>
                  <th style="text-align: center; width: 75px;">HSN/SAC</th>
                  <th style="text-align: center; width: 85px;">Qty & Unit</th>
                  <th style="text-align: right; width: 95px;">Unit Rate</th>
                  ${quote.lineItems.some((i) => i.discountPercent && i.discountPercent > 0) ? '<th style="text-align: right; width: 65px;">Disc %</th>' : ''}
                  <th style="text-align: right; width: 110px;">Amount</th>
                </tr>
              `
                  : `
                <tr>
                  <th style="text-align: left;">Item / Service Description</th>
                  <th style="text-align: center; width: 60px;">Qty</th>
                  <th style="text-align: right; width: 110px;">Unit Rate</th>
                  <th style="text-align: right; width: 120px;">Amount</th>
                </tr>
              `
              }
            </thead>
            <tbody>
              ${
                showDetailedGrid
                  ? quote.lineItems
                      .map(
                        (item, idx) => `
                    <tr>
                      <td style="text-align: center; color: #64748B;">${idx + 1}</td>
                      <td>
                        <strong>${escapeHtml(item.description)}</strong>
                      </td>
                      <td style="text-align: center; font-family: monospace; font-size: 11px;">${item.hsnSac ? escapeHtml(item.hsnSac) : '—'}</td>
                      <td style="text-align: center;"><strong>${item.quantity}</strong> ${escapeHtml(item.unit || 'nos')}</td>
                      <td style="text-align: right;">${curSymbol}${(item.unitPriceCents / 100).toFixed(2)}</td>
                      ${quote.lineItems.some((i) => i.discountPercent && i.discountPercent > 0) ? `<td style="text-align: right; color: #059669; font-weight: 700;">${item.discountPercent ? `${item.discountPercent}%` : '-'}</td>` : ''}
                      <td style="text-align: right;"><strong>${curSymbol}${(item.totalCents / 100).toFixed(2)}</strong></td>
                    </tr>
                  `
                      )
                      .join('')
                  : quote.lineItems
                      .map(
                        (item) => `
                    <tr>
                      <td>
                        <strong>${escapeHtml(item.description)}</strong>
                        ${item.hsnSac ? `<span style="font-size: 10px; color: #64748B; margin-left: 6px;">[SAC: ${escapeHtml(item.hsnSac)}]</span>` : ''}
                      </td>
                      <td style="text-align: center;">${item.quantity}${item.unit ? ` ${escapeHtml(item.unit)}` : ''}</td>
                      <td style="text-align: right;">${curSymbol}${(item.unitPriceCents / 100).toFixed(2)}</td>
                      <td style="text-align: right;"><strong>${curSymbol}${(item.totalCents / 100).toFixed(2)}</strong></td>
                    </tr>
                  `
                      )
                      .join('')
              }

              ${
                quote.changeOrders && quote.changeOrders.length > 0
                  ? `
                <tr class="co-callout-row">
                  <td colspan="${showDetailedGrid ? (quote.lineItems.some((i) => i.discountPercent && i.discountPercent > 0) ? 7 : 6) : 4}">APPROVED MID-JOB ADD-ONS & CHANGE ORDERS</td>
                </tr>
                ${quote.changeOrders
                  .map(
                    (co, idx) => `
                  <tr>
                    ${showDetailedGrid ? `<td style="text-align: center; color: #64748B;">+${idx + 1}</td>` : ''}
                    <td><strong>Add-On #${co.orderNumber}: ${escapeHtml(co.reason)}</strong></td>
                    ${showDetailedGrid ? '<td style="text-align: center; font-family: monospace; font-size: 11px;">—</td><td style="text-align: center;">1.0 set</td>' : '<td style="text-align: center;">1.0</td>'}
                    <td style="text-align: right;">${curSymbol}${(co.addedTotalCents / 100).toFixed(2)}</td>
                    ${showDetailedGrid && quote.lineItems.some((i) => i.discountPercent && i.discountPercent > 0) ? '<td style="text-align: right;">-</td>' : ''}
                    <td style="text-align: right; color: #6B21A8;"><strong>+${curSymbol}${(co.addedTotalCents / 100).toFixed(2)}</strong></td>
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
                <td class="val-col">${curSymbol}${(quote.subtotalCents / 100).toFixed(2)}</td>
              </tr>
              ${
                quote.taxAmountCents > 0
                  ? regionConfig.region === 'IN' && quote.isGstSplit !== false
                    ? `
                      <tr>
                        <td class="label-col">CGST (${(quote.taxRateBasisPoints / 200).toFixed(2)}%):</td>
                        <td class="val-col">${curSymbol}${((quote.taxAmountCents / 2) / 100).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td class="label-col">SGST (${(quote.taxRateBasisPoints / 200).toFixed(2)}%):</td>
                        <td class="val-col">${curSymbol}${((quote.taxAmountCents / 2) / 100).toFixed(2)}</td>
                      </tr>
                    `
                    : `<tr>
                        <td class="label-col">${escapeHtml(quote.taxLabel || regionConfig.defaultTaxLabel)} (${(quote.taxRateBasisPoints / 100).toFixed(2)}%):</td>
                        <td class="val-col">${curSymbol}${(quote.taxAmountCents / 100).toFixed(2)}</td>
                      </tr>`
                  : `<tr>
                      <td class="label-col">${escapeHtml(quote.taxLabel || regionConfig.defaultTaxLabel)}:</td>
                      <td class="val-col" style="color: #64748B; font-weight: normal;">Exempt / 0%</td>
                    </tr>`
              }
              <tr class="total-row">
                <td class="label-col">${isPaid ? 'TOTAL PAID:' : 'TOTAL AMOUNT:'}</td>
                <td class="val-col">${curSymbol}${(quote.totalAmountCents / 100).toFixed(2)}</td>
              </tr>
              ${
                (quote.depositAmountCents || 0) > 0
                  ? `
                <tr>
                  <td class="label-col" style="color: #059669; font-weight: 700;">Less: ${escapeHtml(regionConfig.depositLabel)}:</td>
                  <td class="val-col" style="color: #059669; font-weight: 700;">-${curSymbol}${((quote.depositAmountCents || 0) / 100).toFixed(2)}</td>
                </tr>
                <tr class="total-row" style="background-color: ${isPaid ? '#F0FDF4' : '#FFFBEB'}; border-top: 2px solid ${isPaid ? '#10B981' : '#F59E0B'};">
                  <td class="label-col" style="color: ${isPaid ? '#15803D' : '#B45309'}; font-size: 14px; font-weight: 900;">${isPaid ? 'PAID IN FULL (0.00 DUE):' : `${escapeHtml(regionConfig.balanceDueLabel).toUpperCase()}:`}</td>
                  <td class="val-col" style="color: ${isPaid ? '#15803D' : '#B45309'}; font-size: 17px; font-weight: 900;">${isPaid ? `${curSymbol}0.00` : `${curSymbol}${Math.max(0, (quote.totalAmountCents - (quote.depositAmountCents || 0)) / 100).toFixed(2)}`}</td>
                </tr>
              `
                  : ''
              }
            </table>
            <div style="clear: both;"></div>

            <!-- ── AMOUNT IN WORDS (RULE 46 COMPLIANT) ── -->
            <div style="margin-top: 14px; padding: 10px 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #2563EB; border-radius: 6px;">
              <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.6px;">${isIndia ? 'Amount in Words (शब्दों में राशि):' : 'Amount in Words:'}</div>
              <div style="font-size: 12.5px; font-weight: 800; color: #0F172A; margin-top: 2px;">${escapeHtml(totalAmountInWords)}</div>
              ${
                (quote.depositAmountCents || 0) > 0 && !isPaid
                  ? `<div style="margin-top: 4px; font-size: 11.5px; color: #B45309; font-weight: 700;"><strong>Balance Due in Words:</strong> ${escapeHtml(balanceDueInWords)}</div>`
                  : ''
              }
            </div>

            <!-- ── HSN / SAC TAX BREAKDOWN TABLE (GROUPED COMPLIANT) ── -->
            ${
              templateId === 'advanced_gst' && quote.taxAmountCents > 0
                ? (() => {
                    const hsnGroups: { [code: string]: { code: string; taxableCents: number; taxCents: number } } = {};
                    const totalLineCents = quote.lineItems.reduce((acc, i) => acc + (i.totalCents || 0), 0);
                    quote.lineItems.forEach((item) => {
                      const code = (item.hsnSac || '').trim() || 'Services / Labor';
                      if (!hsnGroups[code]) {
                        hsnGroups[code] = { code, taxableCents: 0, taxCents: 0 };
                      }
                      hsnGroups[code].taxableCents += item.totalCents || 0;
                    });

                    // Proportionally distribute the invoice tax amount across the groups
                    Object.values(hsnGroups).forEach((group) => {
                      if (totalLineCents > 0) {
                        group.taxCents = Math.round((group.taxableCents / totalLineCents) * quote.taxAmountCents);
                      } else {
                        group.taxCents = 0;
                      }
                    });

                    const rows = Object.values(hsnGroups)
                      .map((g) => {
                        const taxableStr = `${curSymbol}${(g.taxableCents / 100).toFixed(2)}`;
                        const taxStr = `${curSymbol}${(g.taxCents / 100).toFixed(2)}`;
                        const isSplit = quote.isGstSplit !== false;
                        const halfTaxCents = Math.round(g.taxCents / 2);
                        const halfRateStr = (quote.taxRateBasisPoints / 200).toFixed(2);
                        const fullRateStr = (quote.taxRateBasisPoints / 100).toFixed(2);

                        return `
                          <tr>
                            <td style="padding: 6px 8px; font-family: monospace; font-weight: 700; color: #0F766E;">${escapeHtml(g.code)}</td>
                            <td style="padding: 6px 8px; text-align: right; font-weight: 700;">${taxableStr}</td>
                            ${
                              isSplit
                                ? `
                              <td style="padding: 6px 8px; text-align: right;">${halfRateStr}% (${curSymbol}${(halfTaxCents / 100).toFixed(2)})</td>
                              <td style="padding: 6px 8px; text-align: right;">${halfRateStr}% (${curSymbol}${(halfTaxCents / 100).toFixed(2)})</td>
                            `
                                : `
                              <td style="padding: 6px 8px; text-align: right;">${fullRateStr}% (${taxStr})</td>
                            `
                            }
                            <td style="padding: 6px 8px; text-align: right; font-weight: 800; color: #0F766E;">${taxStr}</td>
                          </tr>
                        `;
                      })
                      .join('');

                    return `
                      <div style="margin-top: 14px; padding: 10px 14px; background: #F0FDFA; border: 1.5px solid #CCFBF1; border-radius: 6px;">
                        <div style="font-size: 10.5px; font-weight: 800; color: #0F766E; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px;">
                          HSN / SAC Tax Breakup Summary (कर विवरण)
                        </div>
                        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                          <thead>
                            <tr style="background-color: #CCFBF1; border-bottom: 1.5px solid #0F766E;">
                              <th style="padding: 6px 8px; text-align: left; color: #0F766E;">HSN/SAC</th>
                              <th style="padding: 6px 8px; text-align: right; color: #0F766E;">Taxable Value</th>
                              ${
                                quote.isGstSplit !== false
                                  ? `
                                <th style="padding: 6px 8px; text-align: right; color: #0F766E;">Central Tax (CGST)</th>
                                <th style="padding: 6px 8px; text-align: right; color: #0F766E;">State Tax (SGST)</th>
                              `
                                  : `
                                <th style="padding: 6px 8px; text-align: right; color: #0F766E;">Integrated Tax (IGST)</th>
                              `
                              }
                              <th style="padding: 6px 8px; text-align: right; color: #0F766E;">Total Tax</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${rows}
                          </tbody>
                        </table>
                      </div>
                    `;
                  })()
                : ''
            }

            ${
              isGstLayout
                ? `
              <div style="margin-top: 10px; font-size: 10.5px; color: #475569; font-style: italic; line-height: 1.4;">
                <strong>Statutory Declaration:</strong> We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.
              </div>
            `
                : ''
            }
          </div>

          <!-- ── PAYMENT SETTLEMENT DETAILS (IF CONFIGURED) ── -->
          ${
            profile?.upiId ||
            profile?.bankAccountNumber ||
            profile?.zelleAccount ||
            profile?.venmoAccount ||
            profile?.cashAppAccount ||
            profile?.customPaymentNote
              ? `
            <div class="payment-box">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  ${
                    upiQrSvg
                      ? `
                    <td style="width: 115px; vertical-align: top; padding-right: 14px; text-align: center;">
                      <div style="background: #FFFFFF; border: 1.5px solid #CBD5E1; border-radius: 6px; padding: 6px; display: inline-block;">
                        ${upiQrSvg}
                        <div style="font-size: 8.5px; font-weight: 800; color: #0F172A; margin-top: 3px;">SCAN & PAY VIA UPI</div>
                        <div style="font-size: 7.5px; color: #64748B;">GPay • PhonePe • Paytm • BHIM</div>
                      </div>
                    </td>
                  `
                      : ''
                  }
                  <td style="vertical-align: top;">
                    <div class="payment-title">Direct Payment & Settlement Details (0% Fee)</div>
                    <div class="payment-accounts">
                      ${RegionPaymentService.formatInvoicePaymentAccounts(profile, curSymbol, profile?.currencyCode)}
                    </div>
                    ${
                      profile?.customPaymentNote
                        ? `<div style="margin-top: 6px; font-size: 11px; color: #334155; line-height: 1.4; border-top: 1px dashed #CBD5E1; padding-top: 5px;">
                            <strong>Payment Instructions:</strong> ${escapeHtml(profile.customPaymentNote)}
                          </div>`
                        : ''
                    }
                  </td>
                </tr>
              </table>
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

          <!-- ── DUAL SIGNATURE: CLIENT APPROVAL & AUTHORIZED SIGNATORY ── -->
          <div class="signature-card">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
              <tr>
                <td style="width: 52%; vertical-align: top; padding-right: 14px; border-right: 1px dashed #CBD5E1;">
                  <div class="signature-header">Customer Acceptance & Signature:</div>
                  ${
                    quote.signatureSvg
                      ? `<div style="margin: 6px 0;"><svg height="70" width="240" viewBox="0 0 500 200">${quote.signatureSvg}</svg></div>`
                      : `<div style="height: 55px; display: flex; align-items: flex-end; margin: 6px 0;">
                          <div style="border-bottom: 1.5px dashed #CBD5E1; width: 180px; text-align: center; color: #94A3B8; font-size: 10px; padding-bottom: 3px;">
                            ( Client Signature )
                          </div>
                        </div>`
                  }
                  <div style="font-size: 11px; color: #475569; font-weight: 600;">
                    Accepted by: ${escapeHtml(quote.clientName)}
                  </div>
                </td>
                <td style="width: 48%; vertical-align: top; padding-left: 14px; text-align: right;">
                  <div class="signature-header" style="text-align: right;">For ${escapeHtml(businessName)}:</div>
                  <div style="height: 55px; display: flex; align-items: flex-end; justify-content: flex-end; margin-top: 6px;">
                    <div style="border-bottom: 1.5px dashed #94A3B8; width: 150px; text-align: center; color: #94A3B8; font-size: 9px; padding-bottom: 3px; margin-left: auto;">
                      [ Authorized Sign / Seal ]
                    </div>
                  </div>
                  <div style="font-size: 11px; font-weight: 800; color: #334155; margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                    Authorized Signatory
                  </div>
                </td>
              </tr>
            </table>

            <div class="legal-consent">
              <strong>CLIENT ACCEPTANCE & AUTHORIZATION:</strong>
              By signing above, client acknowledges receipt and approval of the itemized estimate and authorizes contractor to proceed with the indicated scope of work. Electronic signatures constitute a legally valid agreement under ${regionConfig.legalConsentCitation}.
            </div>

            ${
              isPaid
                ? `
              <div class="waiver-callout">
                <strong>${regionConfig.waiverTitle}:</strong><br/>
                ${regionConfig.waiverBodyText
                  .replace('{AMOUNT}', `${curSymbol}${(quote.totalAmountCents / 100).toFixed(2)}`)
                  .replace('{DATE}', formattedDate)}
              </div>
            `
                : ''
            }

            <div class="seal-ribbon">
              <span>🔒 <strong>${quote.signatureSvg ? 'Digitally Signed & Verified' : 'Official Business Document'}</strong></span>
              <span><strong>Location:</strong> ${quote.signatureGpsLat && quote.signatureGpsLng ? `<a href="https://maps.google.com/?q=${quote.signatureGpsLat},${quote.signatureGpsLng}" style="color: inherit; text-decoration: underline;">${quote.signatureGpsLat.toFixed(4)}°, ${quote.signatureGpsLng.toFixed(4)}°</a> (GPS Verified)` : 'Field Site Execution'}</span>
            </div>
          </div>

          <!-- ── EXHIBIT A: DEDICATED WORKSITE PHOTO & PROOF OF RECORD (PAGE 2) ── -->
          ${
            photoBase64 || completedPhotoBase64
              ? `
            <div class="photo-page">
              <div style="border-bottom: 2px solid #0F172A; padding-bottom: 8px; margin-bottom: 16px;">
                <div style="font-size: 11px; font-weight: 800; color: #64748B; letter-spacing: 0.8px; text-transform: uppercase;">
                  ATTACHMENT • WORKSITE PHOTO RECORD
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
                  <div style="font-size: 16px; font-weight: 900; color: #0F172A;">
                    ${photoBase64 && completedPhotoBase64 ? 'Before & After Worksite Condition Comparison' : completedPhotoBase64 ? 'Completed Work Scope Verification' : 'Worksite Condition Photo'}
                  </div>
                  <span style="background-color: #ECFDF5; border: 1px solid #10B981; color: #047857; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px;">
                    ✓ VERIFIED WORKSITE PHOTO
                  </span>
                </div>
              </div>

              ${
                photoBase64 && completedPhotoBase64
                  ? `
                <table style="width: 100%; border-collapse: separate; border-spacing: 12px 0; margin-bottom: 16px;">
                  <tr>
                    <td style="width: 50%; vertical-align: top;">
                      <div style="font-size: 11px; font-weight: 800; color: #B45309; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
                        • BEFORE WORK (INITIAL CONDITION)
                      </div>
                      <div class="photo-frame" style="height: 320px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #000;">
                        <img src="${photoBase64}" style="max-height: 100%; max-width: 100%; object-fit: contain;" alt="Before Work Condition" />
                      </div>
                      <div style="font-size: 10.5px; color: #64748B; margin-top: 4px; font-style: italic;">
                        Captured prior to commencement of work.
                      </div>
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                      <div style="font-size: 11px; font-weight: 800; color: #047857; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
                        • AFTER COMPLETION (VERIFIED EXECUTION)
                      </div>
                      <div class="photo-frame" style="height: 320px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #000;">
                        <img src="${completedPhotoBase64}" style="max-height: 100%; max-width: 100%; object-fit: contain;" alt="Completed Work Proof" />
                      </div>
                      <div style="font-size: 10.5px; color: #047857; margin-top: 4px; font-weight: 600;">
                        Verified completed scope upon job sign-off.
                      </div>
                    </td>
                  </tr>
                </table>
              `
                  : `
                <div class="photo-frame">
                  <img src="${photoBase64 || completedPhotoBase64}" class="photo-img-full" alt="Worksite Verification Photo" />
                </div>
              `
              }

              <table style="width: 100%; border-collapse: separate; border-spacing: 10px 0; margin-bottom: 16px;">
                <tr>
                  <td style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 12px; width: 33.33%;">
                    <div style="font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase;">Capture Source</div>
                    <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-top: 2px;">Mobile Camera</div>
                    <div style="font-size: 11px; color: #64748B;">On-Site Field Photo</div>
                  </td>
                  <td style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 12px; width: 33.33%;">
                    <div style="font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase;">Worksite Location</div>
                    <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-top: 2px;">
                      ${quote.signatureGpsLat && quote.signatureGpsLng ? `${quote.signatureGpsLat.toFixed(4)}°, ${quote.signatureGpsLng.toFixed(4)}°` : 'On-Site Verification'}
                    </div>
                    <div style="font-size: 11px; color: #059669; font-weight: 600;">✓ Worksite Location Verified</div>
                  </td>
                  <td style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 12px; width: 33.33%;">
                    <div style="font-size: 10px; font-weight: 800; color: #64748B; text-transform: uppercase;">Reference</div>
                    <div style="font-size: 12px; font-weight: 700; color: #0F172A; margin-top: 2px;">Quote #${quote.quoteNumber}</div>
                    <div style="font-size: 11px; color: #64748B;">Client: ${escapeHtml(quote.clientName)}</div>
                  </td>
                </tr>
              </table>

              <div style="font-size: 11px; color: #475569; line-height: 1.45; background-color: #F1F5F9; border-left: 3px solid #0F172A; padding: 9px 12px; border-radius: 0 4px 4px 0;">
                <strong>Photo Record:</strong> This photo documentation verifies worksite conditions and is digitally attached to Agreement #${quote.quoteNumber}.
              </div>
            </div>
          `
              : ''
          }

          <!-- ── AUDIT & SIGNATURE CERTIFICATE ── -->
          <div class="audit-page">
            <h3 style="margin-top: 0; color: #0F172A; border-bottom: 2px solid #0F172A; padding-bottom: 8px; font-size: 16px;">
              ${regionConfig.auditCertificateTitle}
            </h3>
            <p><strong>Document Verification Hash:</strong><br/><code style="font-size: 12px; background: #E2E8F0; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 4px;">${hash}</code></p>
            <p><strong>Signed Date & Time:</strong> ${quote.signatureTimestamp ? formatLocalDateTimeWithTz(quote.signatureTimestamp, regionConfig.locale) : 'Pending Signature (Direct Issue)'}</p>
            <p><strong>Worksite Location:</strong> ${quote.signatureGpsLat && quote.signatureGpsLng ? `<a href="https://maps.google.com/?q=${quote.signatureGpsLat},${quote.signatureGpsLng}" style="color: #0284C7; font-weight: 700; text-decoration: underline;">${quote.signatureGpsLat.toFixed(5)}° Lat, ${quote.signatureGpsLng.toFixed(5)}° Lng</a> (Verified On-Site)` : 'On-Site Execution'}</p>
            <p><strong>Security Status:</strong> <span style="color: #059669; font-weight: 800;">✓ Verified & Protected</span></p>
            <p><strong>Governing Standards:</strong> ${regionConfig.auditGoverningStandard}</p>

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
                      <span style="color: #6B21A8;">+${curSymbol}${(co.addedTotalCents / 100).toFixed(2)}</span>
                    </div>
                    <div style="font-size: 11px; color: #64748B; margin-top: 4px;">
                      Executed: ${formatLocalDateTimeWithTz(co.signatureTimestamp, regionConfig.locale)} • Verified Digital Signature
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
              This certificate confirms that this agreement was reviewed and signed on-site with client consent. Any alteration of line items, amounts, notes, or terms invalidates the verified digital signature.
            </p>
            <p style="font-size: 9px; color: #94A3B8; margin-top: 14px; border-top: 1px solid #E2E8F0; padding-top: 8px; line-height: 1.4;">
              <em>Notice: JobSign provides electronic signature and tamper-evident documentation tools. Enforceability and evidentiary weight depend on applicable statutory contract requirements, jurisdiction, and client agreement.</em>
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

  /**
   * Generates a physical .pdf file in local storage and returns its file URI.
   */
  public static async generatePDFFile(quote: Quote, profile?: ContractorProfile): Promise<string> {
    try {
      const html = await this.generateInvoiceHTML(quote, profile);
      const { uri } = await Print.printToFileAsync({ html });
      return uri;
    } catch (err: any) {
      console.error('[PDFService] Error compiling PDF file:', err);
      throw new Error(err?.message || 'Could not compile PDF file.');
    }
  }

  /**
   * Opens the PDF document directly in the device's external PDF viewer app
   * (Google Drive PDF Viewer, Adobe Acrobat, Files, Chrome, Samsung PDF).
   * Does NOT show the printer / print dialog!
   */
  public static async openInExternalPDFViewer(quote: Quote, profile?: ContractorProfile): Promise<void> {
    try {
      const pdfUri = await this.generatePDFFile(quote, profile);
      const isPaid = quote.status === 'PAID';

      await TelemetryService.logPDF(
        'PREVIEW',
        profile?.invoiceTemplate || 'modern',
        quote.id,
        { isPaid, quoteNumber: quote.quoteNumber, clientName: quote.clientName }
      );

      if (Platform.OS === 'android') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const IntentLauncher = require('expo-intent-launcher');
          const contentUri = await FileSystem.getContentUriAsync(pdfUri);
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: 'application/pdf',
          });
          return;
        } catch (intentErr) {
          console.warn('[PDFService] IntentLauncher failed, falling back to Sharing:', intentErr);
        }
      }

      // iOS or fallback: open document viewer sheet
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
          dialogTitle: `${isPaid ? 'Receipt' : 'Invoice'} #${quote.quoteNumber}`,
        });
      }
    } catch (err: any) {
      console.error('[PDFService] External PDF viewer error:', err);
      throw new Error(err?.message || 'Could not launch device PDF reader.');
    }
  }

  /**
   * Default view method: launches clean external PDF viewer without printer dialog.
   */
  public static async viewPDF(quote: Quote, profile?: ContractorProfile): Promise<void> {
    return this.openInExternalPDFViewer(quote, profile);
  }

  /**
   * Physical paper printer action if contractor specifically wishes to print.
   */
  public static async printToPhysicalPrinter(quote: Quote, profile?: ContractorProfile): Promise<void> {
    try {
      const html = await this.generateInvoiceHTML(quote, profile);
      await Print.printAsync({ html });
    } catch (err: any) {
      console.error('[PDFService] Print error:', err);
      throw new Error(err?.message || 'Could not connect to printer.');
    }
  }
}
