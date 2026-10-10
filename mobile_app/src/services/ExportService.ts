import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Quote, ContractorProfile } from '../types';
import { AlertService } from './AlertService';
import { RegionPaymentService } from './RegionPaymentService';

export class ExportService {
  /**
   * Escapes a single CSV cell according to RFC 4180 specifications.
   */
  private static escapeCell(value: string | number | undefined | null): string {
    if (value === undefined || value === null) return '""';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }

  /**
   * Generates a comprehensive CSV spreadsheet and opens the native share sheet.
   */
  public static async exportQuotesToCSV(
    quotes: Quote[],
    profile: ContractorProfile
  ): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      if (!quotes || quotes.length === 0) {
        AlertService.alert({
          title: 'No Records to Export',
          message: 'Create at least one estimate or invoice before exporting bookkeeping data.',
          type: 'INFO',
        });
        return { success: false, error: 'NO_QUOTES' };
      }

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
        'Audit Verification Seal (SHA-256)',
      ];

      const rows: string[] = [headers.map((h) => this.escapeCell(h)).join(',')];

      for (const q of quotes) {
        const curSymbol = q.currencySymbol || profile?.currencySymbol || '$';
        const isPaid = q.status === 'PAID';
        const depositCents = q.depositAmountCents || 0;
        const totalCents = q.totalAmountCents;
        const balanceDueCents = isPaid ? 0 : Math.max(0, totalCents - depositCents);

        const createdDate = new Date(q.createdAt).toISOString().split('T')[0];
        const dueDate = q.dueDateTimestamp
          ? new Date(q.dueDateTimestamp).toISOString().split('T')[0]
          : q.paymentTerms || 'Due on Receipt';

        const paidDate = q.signatureTimestamp && isPaid
          ? new Date(q.signatureTimestamp).toISOString().split('T')[0]
          : '';

        const row = [
          `#${q.quoteNumber}`,
          q.documentType || 'ESTIMATE',
          q.status,
          createdDate,
          dueDate,
          q.paymentTerms || 'Due on Receipt',
          q.placeOfSupply || 'Intra-State',
          q.clientName,
          q.clientPhone || '',
          q.clientEmail || '',
          q.clientAddress || '',
          q.jobDescription || '',
          curSymbol,
          (q.subtotalCents / 100).toFixed(2),
          q.taxLabel || 'Tax',
          (q.taxRateBasisPoints / 100).toFixed(2),
          (q.taxAmountCents / 100).toFixed(2),
          (totalCents / 100).toFixed(2),
          (depositCents / 100).toFixed(2),
          (balanceDueCents / 100).toFixed(2),
          paidDate,
          q.pdfSha256Hash || 'UNSEALED',
        ];

        rows.push(row.map((cell) => this.escapeCell(cell)).join(','));
      }

      const csvContent = rows.join('\r\n');
      const filename = `JobSign_Bookkeeping_${Date.now()}.csv`;
      const filePath = `${(FileSystem as any).cacheDirectory || ''}${filename}`;

      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Accounting & Tax Data (CSV / Excel)',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        AlertService.alert({
          title: 'Export Saved',
          message: `CSV report saved locally at: ${filename}`,
          type: 'SUCCESS',
        });
      }

      return { success: true, filePath };
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      AlertService.alert({
        title: 'Export Failed',
        message: err?.message || 'Unable to generate CSV report on this device.',
        type: 'DANGER',
      });
      return { success: false, error: err?.message };
    }
  }
}
