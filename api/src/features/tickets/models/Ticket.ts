import { pool } from '../../../shared/database/database';
import { Logger } from '../../../shared/utils/Logger';

export interface Ticket {
  id: number;
  lead_id: number;
  discord_channel_id: string;
  status: 'open' | 'closed' | 'archived';
  created_by: string;
  closed_by?: string;
  created_at: Date;
  closed_at?: Date;
  resolution_notes?: string;
}

export interface TicketData {
  lead_id: number;
  discord_channel_id: string;
  created_by: string;
  status?: 'open' | 'closed' | 'archived';
}

export interface TicketMetrics {
  total_tickets: number;
  open_tickets: number;
  closed_tickets: number;
  archived_tickets: number;
  avg_resolution_minutes: number;
  tickets_by_status: { status: string; count: number }[];
}

export class TicketModel {
  static async getAll(): Promise<Ticket[]> {
    const result = await pool.query(
      'SELECT * FROM tickets ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async getById(id: number): Promise<Ticket | null> {
    const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async getByLeadId(leadId: number): Promise<Ticket[]> {
    const result = await pool.query(
      'SELECT * FROM tickets WHERE lead_id = $1 ORDER BY created_at DESC',
      [leadId]
    );
    return result.rows;
  }

  static async getByChannelId(channelId: string): Promise<Ticket | null> {
    const result = await pool.query(
      'SELECT * FROM tickets WHERE discord_channel_id = $1',
      [channelId]
    );
    return result.rows[0] || null;
  }

  static async create(data: TicketData): Promise<Ticket> {
    const { lead_id, discord_channel_id, created_by, status = 'open' } = data;

    try {
      const result = await pool.query(
        `INSERT INTO tickets (lead_id, discord_channel_id, status, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [lead_id, discord_channel_id, status, created_by]
      );

      Logger.info('Ticket created', { ticketId: result.rows[0].id, leadId: lead_id });
      return result.rows[0];
    } catch (error) {
      Logger.error('Error creating ticket', { lead_id, discord_channel_id }, error as Error);
      throw error;
    }
  }

  static async updateStatus(
    id: number,
    status: 'open' | 'closed' | 'archived'
  ): Promise<Ticket | null> {
    const result = await pool.query(
      `UPDATE tickets SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows[0]) {
      Logger.info('Ticket status updated', { ticketId: id, status });
    }

    return result.rows[0] || null;
  }

  static async close(
    id: number,
    closedBy: string,
    notes?: string
  ): Promise<Ticket | null> {
    try {
      const result = await pool.query(
        `UPDATE tickets 
         SET status = 'closed', closed_at = NOW(), closed_by = $1, resolution_notes = $2
         WHERE id = $3 
         RETURNING *`,
        [closedBy, notes, id]
      );

      if (result.rows[0]) {
        Logger.info('Ticket closed', { ticketId: id, closedBy });
      }

      return result.rows[0] || null;
    } catch (error) {
      Logger.error('Error closing ticket', { ticketId: id }, error as Error);
      throw error;
    }
  }

  static async getOpenTicketByLeadId(leadId: number): Promise<Ticket | null> {
    const result = await pool.query(
      `SELECT * FROM tickets 
       WHERE lead_id = $1 AND status = 'open' 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [leadId]
    );
    return result.rows[0] || null;
  }

  static async getMetrics(): Promise<TicketMetrics> {
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM tickets');
    const openResult = await pool.query(
      "SELECT COUNT(*) as count FROM tickets WHERE status = 'open'"
    );
    const closedResult = await pool.query(
      "SELECT COUNT(*) as count FROM tickets WHERE status = 'closed'"
    );
    const archivedResult = await pool.query(
      "SELECT COUNT(*) as count FROM tickets WHERE status = 'archived'"
    );

    const avgResolutionResult = await pool.query(
      `SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 60) as avg_minutes
       FROM tickets 
       WHERE closed_at IS NOT NULL`
    );

    const byStatusResult = await pool.query(
      `SELECT status, COUNT(*) as count 
       FROM tickets 
       GROUP BY status 
       ORDER BY count DESC`
    );

    return {
      total_tickets: parseInt(totalResult.rows[0].count),
      open_tickets: parseInt(openResult.rows[0].count),
      closed_tickets: parseInt(closedResult.rows[0].count),
      archived_tickets: parseInt(archivedResult.rows[0].count),
      avg_resolution_minutes: parseFloat(avgResolutionResult.rows[0].avg_minutes || '0'),
      tickets_by_status: byStatusResult.rows.map((row) => ({
        status: row.status,
        count: parseInt(row.count),
      })),
    };
  }
}
