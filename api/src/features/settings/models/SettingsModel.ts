import { pool } from '../../../shared/database/database';

export interface Setting {
  key: string;
  value: string | null;
  updated_at: Date;
}

export class SettingsModel {
  static async getAll(): Promise<Setting[]> {
    const result = await pool.query('SELECT * FROM settings ORDER BY key ASC');
    return result.rows;
  }

  static async get(key: string): Promise<Setting | null> {
    const result = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);
    return result.rows[0] || null;
  }

  static async update(key: string, value: string | null): Promise<Setting> {
    const result = await pool.query(
      `INSERT INTO settings (key, value) 
       VALUES ($1, $2) 
       ON CONFLICT (key) 
       DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP 
       RETURNING *`,
      [key, value]
    );
    return result.rows[0];
  }

  static async delete(key: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM settings WHERE key = $1', [key]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
