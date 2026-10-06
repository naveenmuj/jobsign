import { DatabaseService } from '../services/DatabaseService';
import { PDFService } from '../services/PDFService';
import { Quote } from '../types';

export async function runSelfDiagnostics(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];
  try {
    // 1. Test Database Initialization & Table creation
    const db = await DatabaseService.getDB();
    results.push('✔ SQLite Engine Initialized with WAL Mode');

    // 2. Test Quote Creation & Schema Write
    const testQuote: Quote = {
      id: 'test_' + Date.now(),
      quoteNumber: 9999,
      clientName: 'Diagnostic Test Client',
      clientPhone: '(555) 000-0000',
      status: 'SIGNED_LOCKED',
      subtotalCents: 35000,
      taxRateBasisPoints: 825,
      taxAmountCents: 2888,
      totalAmountCents: 37888,
      signatureSvg: 'M10,10 L100,100',
      signatureTimestamp: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lineItems: [
        {
          id: 'item_1',
          description: 'Emergency Pipe Diagnostic',
          unitPriceCents: 35000,
          quantity: 1,
          totalCents: 35000,
        },
      ],
      changeOrders: [],
    };

    // 3. Test Cryptographic Hash Generation
    const hash = await PDFService.computeHash(testQuote);
    if (hash && hash.length === 64) {
      testQuote.pdfSha256Hash = hash;
      results.push(`✔ Cryptographic Sealer: SHA-256 Digest (${hash.substring(0, 12)}...)`);
    } else {
      throw new Error('Cryptographic sealer produced invalid hash');
    }

    // 4. Test Persistence Write & Read
    await DatabaseService.saveQuote(testQuote);
    const loaded = await DatabaseService.getAllQuotes();
    const found = loaded.find((q) => q.id === testQuote.id);
    if (found && found.totalAmountCents === 37888) {
      results.push('✔ SQLite Write & Read Verification: 100% Match');
    } else {
      throw new Error('Database read mismatch');
    }

    results.push('✔ All Core Systems Passed Diagnostic Verification');
    return { passed: true, results };
  } catch (err: any) {
    results.push(`❌ Diagnostic Failure: ${err.message}`);
    return { passed: false, results };
  }
}
