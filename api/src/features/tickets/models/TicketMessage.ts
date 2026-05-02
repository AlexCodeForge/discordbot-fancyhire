import { pool } from '../../../shared/database/database';
import { Logger } from '../../../shared/utils/Logger';

export interface TicketMessage {
  id: number;
  ticket_id: number;
  discord_message_id: string;
  author_id: string;
  author_name: string;
  content: string;
  sent_at: Date;
}

export interface TicketMessageData {
  ticket_id: number;
  discord_message_id: string;
  author_id: string;
  author_name: string;
  content: string;
  sent_at?: Date | null;
}

export class TicketMessageModel {
  static async getByTicket(ticketId: number): Promise<TicketMessage[]> {
    const result = await pool.query(
      `SELECT * FROM ticket_messages
       WHERE ticket_id = $1
       ORDER BY sent_at ASC`,
      [ticketId]
    );
    return result.rows;
  }

  static async create(data: TicketMessageData): Promise<TicketMessage> {
    const {
      ticket_id,
      discord_message_id,
      author_id,
      author_name,
      content,
      sent_at = null,
    } = data;

    try {
      const result = await pool.query(
        `INSERT INTO ticket_messages (
           ticket_id, discord_message_id, author_id, author_name, content, sent_at
         )
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()))
         RETURNING *`,
        [ticket_id, discord_message_id, author_id, author_name, content, sent_at]
      );

      Logger.debug('Ticket message created', { ticketId: ticket_id, messageId: discord_message_id });
      return result.rows[0];
    } catch (error) {
      Logger.error('Error creating ticket message', { ticket_id, discord_message_id }, error as Error);
      throw error;
    }
  }

  static async exists(discordMessageId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT EXISTS(
         SELECT 1 FROM ticket_messages WHERE discord_message_id = $1
       ) AS exists`,
      [discordMessageId]
    );
    return result.rows[0].exists;
  }

  static async getCount(ticketId: number): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM ticket_messages WHERE ticket_id = $1',
      [ticketId]
    );
    return parseInt(result.rows[0].count);
  }
}
