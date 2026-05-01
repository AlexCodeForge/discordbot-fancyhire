import { pool } from './database';

export interface Lead {
  id: number;
  name: string;
  discord_id?: string;
  discord_tag?: string;
  contact_discord: string;
  service_interest?: string;
  stage: 'nuevo' | 'contactado' | 'propuesta_enviada' | 'negociacion' | 'ganado' | 'perdido';
  assigned_to?: string;
  notes?: string;
  source: 'auto' | 'manual';
  created_at: Date;
  updated_at: Date;
}

export interface LeadHistory {
  id: number;
  lead_id: number;
  action: string;
  previous_value?: string;
  new_value?: string;
  changed_by?: string;
  created_at: Date;
}

export class LeadModel {
  static async getAll(): Promise<Lead[]> {
    const result = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    return result.rows;
  }

  static async getById(id: number): Promise<Lead | null> {
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async create(data: Partial<Lead>): Promise<Lead> {
    const {
      name,
      discord_id,
      discord_tag,
      contact_discord,
      service_interest,
      stage = 'nuevo',
      assigned_to,
      notes,
      source = 'manual',
    } = data;

    const result = await pool.query(
      `INSERT INTO leads (name, discord_id, discord_tag, contact_discord, service_interest, stage, assigned_to, notes, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, discord_id, discord_tag, contact_discord, service_interest, stage, assigned_to, notes, source]
    );

    return result.rows[0];
  }

  static async update(id: number, data: Partial<Lead>, changed_by?: string): Promise<Lead | null> {
    const lead = await this.getById(id);
    if (!lead) return null;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;

        if (lead[key as keyof Lead] !== value) {
          this.addHistory(id, `${key}_changed`, String(lead[key as keyof Lead]), String(value), changed_by);
        }
      }
    });

    if (updates.length === 0) return lead;

    values.push(id);
    const result = await pool.query(
      `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id: number): Promise<boolean> {
    const result = await pool.query('DELETE FROM leads WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  static async getHistory(leadId: number): Promise<LeadHistory[]> {
    const result = await pool.query(
      'SELECT * FROM lead_history WHERE lead_id = $1 ORDER BY created_at DESC',
      [leadId]
    );
    return result.rows;
  }

  static async addHistory(
    leadId: number,
    action: string,
    previousValue?: string,
    newValue?: string,
    changedBy?: string
  ): Promise<void> {
    await pool.query(
      `INSERT INTO lead_history (lead_id, action, previous_value, new_value, changed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [leadId, action, previousValue, newValue, changedBy]
    );
  }
}
