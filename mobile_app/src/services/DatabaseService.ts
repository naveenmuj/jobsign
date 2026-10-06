import * as SQLite from 'expo-sqlite';
import { Quote, LineItem, ChangeOrder, OutboxItem } from '../types';

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
        job_description TEXT,
        status TEXT NOT NULL,
        subtotal_cents INTEGER NOT NULL,
        tax_rate_basis_points INTEGER DEFAULT 825,
        tax_amount_cents INTEGER DEFAULT 0,
        total_amount_cents INTEGER NOT NULL,
        notes TEXT,
        photo_uri TEXT,
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

      CREATE TABLE IF NOT EXISTS change_orders (
        id TEXT PRIMARY KEY NOT NULL,
        quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        order_number INTEGER NOT NULL,
        reason TEXT NOT NULL,
        added_total_cents INTEGER NOT NULL,
        signature_svg TEXT NOT NULL,
        signature_timestamp INTEGER NOT NULL,
        pdf_sha256_hash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS offline_outbox (
        id TEXT PRIMARY KEY NOT NULL,
        quote_id TEXT NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
        client_name TEXT NOT NULL,
        recipient_contact TEXT NOT NULL,
        channel TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
      CREATE INDEX IF NOT EXISTS idx_line_items_quote_id ON line_items(quote_id);
      CREATE INDEX IF NOT EXISTS idx_change_orders_quote_id ON change_orders(quote_id);
      CREATE INDEX IF NOT EXISTS idx_outbox_status ON offline_outbox(status);
    `);
  }

  public static async getAllQuotes(): Promise<Quote[]> {
    const db = await this.getDB();
    const rows = await db.getAllAsync<any>('SELECT * FROM quotes ORDER BY created_at DESC');

    const quotes: Quote[] = [];
    for (const r of rows) {
      const items = await db.getAllAsync<any>(
        'SELECT * FROM line_items WHERE quote_id = ?',
        [r.id]
      );
      const cos = await db.getAllAsync<any>(
        'SELECT * FROM change_orders WHERE quote_id = ? ORDER BY order_number ASC',
        [r.id]
      );

      quotes.push({
        id: r.id,
        quoteNumber: r.quote_number,
        clientName: r.client_name,
        clientPhone: r.client_phone,
        clientEmail: r.client_email,
        clientAddress: r.client_address,
        jobDescription: r.job_description,
        status: r.status,
        subtotalCents: r.subtotal_cents,
        taxRateBasisPoints: r.tax_rate_basis_points,
        taxAmountCents: r.tax_amount_cents,
        totalAmountCents: r.total_amount_cents,
        notes: r.notes,
        photoUri: r.photo_uri,
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
        changeOrders: cos.map((c) => ({
          id: c.id,
          quoteId: c.quote_id,
          orderNumber: c.order_number,
          reason: c.reason,
          addedItems: [],
          addedTotalCents: c.added_total_cents,
          signatureSvg: c.signature_svg,
          signatureTimestamp: c.signature_timestamp,
          pdfSha256Hash: c.pdf_sha256_hash,
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
          job_description, status, subtotal_cents, tax_rate_basis_points, tax_amount_cents,
          total_amount_cents, notes, photo_uri, signature_svg, signature_timestamp,
          signature_gps_lat, signature_gps_lng, pdf_sha256_hash, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quote.id,
          quote.quoteNumber,
          quote.clientName,
          quote.clientPhone || null,
          quote.clientEmail || null,
          quote.clientAddress || null,
          quote.jobDescription || null,
          quote.status,
          quote.subtotalCents,
          quote.taxRateBasisPoints,
          quote.taxAmountCents,
          quote.totalAmountCents,
          quote.notes || null,
          quote.photoUri || null,
          quote.signatureSvg || null,
          quote.signatureTimestamp || null,
          quote.signatureGpsLat || null,
          quote.signatureGpsLng || null,
          quote.pdfSha256Hash || null,
          quote.createdAt,
          quote.updatedAt,
        ]
      );

      // Refresh line items
      await db.runAsync('DELETE FROM line_items WHERE quote_id = ?', [quote.id]);
      for (const item of quote.lineItems) {
        await db.runAsync(
          `INSERT INTO line_items (id, quote_id, description, unit_price_cents, quantity, total_cents)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [item.id, quote.id, item.description, item.unitPriceCents, item.quantity, item.totalCents]
        );
      }

      // Refresh change orders if present
      if (quote.changeOrders && quote.changeOrders.length > 0) {
        await db.runAsync('DELETE FROM change_orders WHERE quote_id = ?', [quote.id]);
        for (const co of quote.changeOrders) {
          await db.runAsync(
            `INSERT INTO change_orders (id, quote_id, order_number, reason, added_total_cents, signature_svg, signature_timestamp, pdf_sha256_hash)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [co.id, co.quoteId, co.orderNumber, co.reason, co.addedTotalCents, co.signatureSvg, co.signatureTimestamp, co.pdfSha256Hash]
          );
        }
      }
    });
  }

  public static async saveOutboxItem(item: OutboxItem): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      `INSERT OR REPLACE INTO offline_outbox (
        id, quote_id, client_name, recipient_contact, channel, created_at, status, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.quoteId,
        item.clientName,
        item.recipientContact,
        item.channel,
        item.createdAt,
        item.status,
        item.errorMessage || null,
      ]
    );
  }

  public static async getAllOutboxItems(): Promise<OutboxItem[]> {
    const db = await this.getDB();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM offline_outbox ORDER BY created_at DESC'
    );
    return rows.map((r) => ({
      id: r.id,
      quoteId: r.quote_id,
      clientName: r.client_name,
      recipientContact: r.recipient_contact,
      channel: r.channel,
      createdAt: r.created_at,
      status: r.status,
      errorMessage: r.error_message || undefined,
    }));
  }

  public static async updateOutboxStatus(
    id: string,
    status: 'PENDING' | 'SENT' | 'FAILED',
    errorMessage?: string
  ): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      'UPDATE offline_outbox SET status = ?, error_message = ? WHERE id = ?',
      [status, errorMessage || null, id]
    );
  }

  public static async deleteOutboxItem(id: string): Promise<void> {
    const db = await this.getDB();
    await db.runAsync('DELETE FROM offline_outbox WHERE id = ?', [id]);
  }
}
