import { pool } from '../../../shared/database/database';

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
  display_order: number;
  created_at: Date;
  updated_at: Date;
  unread_count?: number;
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
    const result = await pool.query(`
      SELECT 
        l.*,
        COALESCE(
          (SELECT COUNT(*) 
           FROM messages m 
           WHERE m.lead_id = l.id 
           AND m.sender_type = 'user' 
           AND m.read_at IS NULL),
          0
        ) as unread_count
      FROM leads l 
      ORDER BY l.stage, l.display_order ASC
    `);
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

    // Check if lead with this discord_id already exists
    if (discord_id) {
      const existingLead = await pool.query(
        'SELECT id FROM leads WHERE discord_id = $1',
        [discord_id]
      );
      if (existingLead.rows.length > 0) {
        throw new Error('Ya existe un lead con este usuario de Discord');
      }
    }

    const maxOrderResult = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM leads WHERE stage = $1',
      [stage]
    );
    const displayOrder = maxOrderResult.rows[0].next_order;

    const result = await pool.query(
      `INSERT INTO leads (name, discord_id, discord_tag, contact_discord, service_interest, stage, assigned_to, notes, source, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, discord_id, discord_tag, contact_discord, service_interest, stage, assigned_to, notes, source, displayOrder]
    );

    return result.rows[0];
  }

  static async update(id: number, data: Partial<Lead>, changed_by?: string): Promise<Lead | null> {
    const lead = await this.getById(id);
    if (!lead) return null;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const excludedFields = ['id', 'created_at', 'updated_at', 'changed_by', 'unread_count'];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && !excludedFields.includes(key)) {
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

  static async reorder(leadId: number, newStage: string, newOrder: number): Promise<Lead | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const leadResult = await client.query('SELECT * FROM leads WHERE id = $1', [leadId]);
      const lead = leadResult.rows[0];
      if (!lead) return null;

      const oldStage = lead.stage;
      const oldOrder = lead.display_order;

      if (oldStage === newStage) {
        if (oldOrder < newOrder) {
          await client.query(
            'UPDATE leads SET display_order = display_order - 1 WHERE stage = $1 AND display_order > $2 AND display_order <= $3',
            [newStage, oldOrder, newOrder]
          );
        } else if (oldOrder > newOrder) {
          await client.query(
            'UPDATE leads SET display_order = display_order + 1 WHERE stage = $1 AND display_order >= $2 AND display_order < $3',
            [newStage, newOrder, oldOrder]
          );
        }
      } else {
        await client.query(
          'UPDATE leads SET display_order = display_order - 1 WHERE stage = $1 AND display_order > $2',
          [oldStage, oldOrder]
        );
        await client.query(
          'UPDATE leads SET display_order = display_order + 1 WHERE stage = $1 AND display_order >= $2',
          [newStage, newOrder]
        );
      }

      const result = await client.query(
        'UPDATE leads SET stage = $1, display_order = $2 WHERE id = $3 RETURNING *',
        [newStage, newOrder, leadId]
      );

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
