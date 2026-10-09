import * as SQLite from 'expo-sqlite';
import { Quote, LineItem, ChangeOrder, OutboxItem, BehaviorLogEntry } from '../types';

export class DatabaseService {
  private static dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

  public static async getDB(): Promise<SQLite.SQLiteDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = (async () => {
        const db = await SQLite.openDatabaseAsync('jobsign.db');
        await this.initSchema(db);
        return db;
      })();
    }
    return this.dbPromise;
  }

  private static async initSchema(db: SQLite.SQLiteDatabase) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;

      CREATE TABLE IF NOT EXISTS quotes (
        id TEXT PRIMARY KEY NOT NULL,
        quote_number INTEGER UNIQUE NOT NULL,
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
        tax_label TEXT,
        currency_symbol TEXT,
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
        pdf_sha256_hash TEXT NOT NULL,
        added_items_json TEXT
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

      CREATE TABLE IF NOT EXISTS user_behavior_logs (
        id TEXT PRIMARY KEY NOT NULL,
        session_id TEXT NOT NULL,
        category TEXT NOT NULL,
        action TEXT NOT NULL,
        screen_name TEXT,
        payload_json TEXT,
        timestamp INTEGER NOT NULL,
        synced INTEGER NOT NULL DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
      CREATE INDEX IF NOT EXISTS idx_quotes_number ON quotes(quote_number);
      CREATE INDEX IF NOT EXISTS idx_line_items_quote_id ON line_items(quote_id);
      CREATE INDEX IF NOT EXISTS idx_change_orders_quote_id ON change_orders(quote_id);
      CREATE INDEX IF NOT EXISTS idx_outbox_status ON offline_outbox(status);
      CREATE INDEX IF NOT EXISTS idx_behavior_timestamp ON user_behavior_logs(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_behavior_synced ON user_behavior_logs(synced);
    `);

    try {
      await db.execAsync('ALTER TABLE quotes ADD COLUMN tax_label TEXT;');
    } catch {
      // Column already exists or freshly created
    }

    try {
      await db.execAsync('ALTER TABLE quotes ADD COLUMN currency_symbol TEXT;');
    } catch {
      // Column already exists or freshly created
    }

    try {
      await db.execAsync('ALTER TABLE quotes ADD COLUMN include_photo_in_pdf INTEGER DEFAULT 1;');
    } catch {
      // Column already exists or freshly created
    }

    try {
      await db.execAsync('ALTER TABLE quotes ADD COLUMN completed_photo_uri TEXT;');
    } catch {
      // Column already exists or freshly created
    }

    try {
      await db.execAsync('ALTER TABLE quotes ADD COLUMN invoice_issued_timestamp INTEGER;');
    } catch {
      // Column already exists or freshly created
    }

    try {
      await db.execAsync('ALTER TABLE quotes ADD COLUMN deposit_amount_cents INTEGER DEFAULT 0;');
    } catch {
      // Column already exists or freshly created
    }

    try {
      await db.execAsync('ALTER TABLE quotes ADD COLUMN payment_terms TEXT;');
    } catch {
      // Column already exists or freshly created
    }

    try {
      await db.execAsync('ALTER TABLE quotes ADD COLUMN due_date_timestamp INTEGER;');
    } catch {
      // Column already exists or freshly created
    }

    try {
      await db.execAsync('ALTER TABLE quotes ADD COLUMN document_type TEXT;');
    } catch {
      // Column already exists or freshly created
    }

    try {
      await db.execAsync('ALTER TABLE quotes ADD COLUMN place_of_supply TEXT;');
    } catch {
      // Column already exists or freshly created
    }

    try {
      await db.execAsync('ALTER TABLE quotes ADD COLUMN is_gst_split INTEGER DEFAULT 1;');
    } catch {
      // Column already exists or freshly created
    }
  }

  public static async getNextQuoteNumber(): Promise<number> {
    const db = await this.getDB();
    const row = await db.getFirstAsync<{ max_num: number | null }>(
      'SELECT MAX(quote_number) as max_num FROM quotes'
    );
    return ((row?.max_num || 1000) as number) + 1;
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
        taxLabel: r.tax_label || undefined,
        currencySymbol: r.currency_symbol || undefined,
        includePhotoInPdf: r.include_photo_in_pdf === 0 ? false : true,
        completedPhotoUri: r.completed_photo_uri || undefined,
        invoiceIssuedTimestamp: r.invoice_issued_timestamp || undefined,
        depositAmountCents: r.deposit_amount_cents || 0,
        paymentTerms: r.payment_terms || undefined,
        dueDateTimestamp: r.due_date_timestamp || undefined,
        documentType: r.document_type || undefined,
        placeOfSupply: r.place_of_supply || undefined,
        isGstSplit: r.is_gst_split === 0 ? false : true,
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
          addedItems: c.added_items_json ? JSON.parse(c.added_items_json) : [],
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
          signature_gps_lat, signature_gps_lng, pdf_sha256_hash, created_at, updated_at,
          tax_label, currency_symbol, include_photo_in_pdf, completed_photo_uri, invoice_issued_timestamp,
          deposit_amount_cents, payment_terms, due_date_timestamp, document_type, place_of_supply, is_gst_split
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          quote.taxLabel || null,
          quote.currencySymbol || null,
          quote.includePhotoInPdf === false ? 0 : 1,
          quote.completedPhotoUri || null,
          quote.invoiceIssuedTimestamp || null,
          quote.depositAmountCents || 0,
          quote.paymentTerms || null,
          quote.dueDateTimestamp || null,
          quote.documentType || null,
          quote.placeOfSupply || null,
          quote.isGstSplit === false ? 0 : 1,
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
            `INSERT INTO change_orders (id, quote_id, order_number, reason, added_total_cents, signature_svg, signature_timestamp, pdf_sha256_hash, added_items_json)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              co.id,
              co.quoteId,
              co.orderNumber,
              co.reason,
              co.addedTotalCents,
              co.signatureSvg,
              co.signatureTimestamp,
              co.pdfSha256Hash,
              JSON.stringify(co.addedItems || []),
            ]
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

  public static async deleteQuote(id: string): Promise<void> {
    const db = await this.getDB();
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM line_items WHERE quote_id = ?', [id]);
      await db.runAsync('DELETE FROM change_orders WHERE quote_id = ?', [id]);
      await db.runAsync('DELETE FROM quotes WHERE id = ?', [id]);
    });
  }

  // ---- TELEMETRY & BEHAVIOR LOG METHODS ----

  public static async saveBehaviorLog(entry: BehaviorLogEntry): Promise<void> {
    const db = await this.getDB();
    await db.runAsync(
      `INSERT INTO user_behavior_logs (id, session_id, category, action, screen_name, payload_json, timestamp, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.sessionId,
        entry.category,
        entry.action,
        entry.screenName || null,
        entry.payloadJson || null,
        entry.timestamp,
        entry.synced ? 1 : 0,
      ]
    );
  }

  public static async getBehaviorLogs(limit: number = 200, offset: number = 0): Promise<BehaviorLogEntry[]> {
    const db = await this.getDB();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM user_behavior_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      category: r.category,
      action: r.action,
      screenName: r.screen_name || undefined,
      payloadJson: r.payload_json || undefined,
      timestamp: r.timestamp,
      synced: r.synced === 1,
    }));
  }

  public static async getUnsyncedBehaviorLogs(limit: number = 100): Promise<BehaviorLogEntry[]> {
    const db = await this.getDB();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM user_behavior_logs WHERE synced = 0 ORDER BY timestamp ASC LIMIT ?',
      [limit]
    );
    return rows.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      category: r.category,
      action: r.action,
      screenName: r.screen_name || undefined,
      payloadJson: r.payload_json || undefined,
      timestamp: r.timestamp,
      synced: false,
    }));
  }

  public static async markBehaviorLogsSynced(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const db = await this.getDB();
    const placeholders = ids.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE user_behavior_logs SET synced = 1 WHERE id IN (${placeholders})`,
      ids
    );
  }

  public static async clearBehaviorLogs(): Promise<void> {
    const db = await this.getDB();
    await db.runAsync('DELETE FROM user_behavior_logs');
  }

  public static async getBehaviorLogsCount(): Promise<number> {
    const db = await this.getDB();
    const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM user_behavior_logs');
    return row?.count || 0;
  }
}
