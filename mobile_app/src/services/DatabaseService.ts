import * as SQLite from 'expo-sqlite';
import { Quote, LineItem } from '../types';

export class DatabaseService {
  private static db: SQLite.SQLiteDatabase | null = null;

  public static async getDB(): Promise<SQLite.SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabaseAsync('jobsign.db');
      await this.initSchema(this.db);
    }
    return this.db;
  }

  private static async initSchema(db: SQLite.SQLiteDatabase) {
    // Enable Write-Ahead Logging (WAL) for maximum speed and concurrent read/writes
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;

      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY NOT NULL,
        quote_number INTEGER NOT NULL,
        client_name TEXT NOT NULL,
        client_phone TEXT,
        client_email TEXT,
        client_address TEXT,
        status TEXT NOT NULL,
        subtotal_cents INTEGER NOT NULL,
        tax_rate_basis_points INTEGER DEFAULT 0,
        tax_amount_cents INTEGER DEFAULT 0,
        total_amount_cents INTEGER NOT NULL,
        notes TEXT,
        signature_svg TEXT,
        signature_timestamp INTEGER,
        signature_gps_lat REAL,
        signature_gps_lng REAL,
        pdf_sha256_hash TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS line_items (
        id TEXT PRIMARY KEY NOT NULL,
        quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        unit_price_cents INTEGER NOT NULL,
        quantity REAL NOT NULL DEFAULT 1.0,
        total_cents INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
      CREATE INDEX IF NOT EXISTS idx_line_items_quote_id ON line_items(quote_id);
    `);
  }

  public static async getAllQuotes(): Promise<Quote[]> {
    const db = await this.getDB();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM quotes ORDER BY created_at DESC'
    );

    const quotes: Quote[] = [];
    for (const r of rows) {
      const items = await db.getAllAsync<any>(
        'SELECT * FROM line_items WHERE quote_id = ?',
        [r.id]
      );
      quotes.push({
        id: r.id,
        quoteNumber: r.quote_number,
        clientName: r.client_name,
        clientPhone: r.client_phone,
        clientEmail: r.client_email,
        clientAddress: r.client_address,
        status: r.status,
        subtotalCents: r.subtotal_cents,
        taxRateBasisPoints: r.tax_rate_basis_points,
        taxAmountCents: r.tax_amount_cents,
        totalAmountCents: r.total_amount_cents,
        notes: r.notes,
        signatureSvg: r.signature_svg,
        signatureTimestamp: r.signature_timestamp,
        signatureGpsLat: r.signature_gps_lat,
        signatureGpsLng: r.signature_gps_lng,
        pdfSha256Hash: r.pdf_sha256_hash,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        lineItems: items.map((i) => ({
          id: i.id,
          description: i.description,
          unitPriceCents: i.unit_price_cents,
          quantity: i.quantity,
          totalCents: i.total_cents,
        })),
      });
    }
    return quotes;
  }

  public static async saveQuote(quote: Quote): Promise<void> {
    const db = await this.getDB();
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `INSERT OR REPLACE INTO quotes (
          id, quote_number, client_name, client_phone, client_email, client_address,
          status, subtotal_cents, tax_rate_basis_points, tax_amount_cents,
          total_amount_cents, notes, signature_svg, signature_timestamp,
          signature_gps_lat, signature_gps_lng, pdf_sha256_hash, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quote.id,
          quote.quoteNumber,
          quote.clientName,
          quote.clientPhone || null,
          quote.clientEmail || null,
          quote.clientAddress || null,
          quote.status,
          quote.subtotalCents,
          quote.taxRateBasisPoints,
          quote.taxAmountCents,
          quote.totalAmountCents,
          quote.notes || null,
          quote.signatureSvg || null,
          quote.signatureTimestamp || null,
          quote.signatureGpsLat || null,
          quote.signatureGpsLng || null,
          quote.pdfSha256Hash || null,
          quote.createdAt,
          quote.updatedAt,
        ]
      );

      // Re-insert line items
      await db.runAsync('DELETE FROM line_items WHERE quote_id = ?', [quote.id]);
      for (const item of quote.lineItems) {
        await db.runAsync(
          `INSERT INTO line_items (id, quote_id, description, unit_price_cents, quantity, total_cents)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [item.id, quote.id, item.description, item.unitPriceCents, item.quantity, item.totalCents]
        );
      }
    });
  }
}
