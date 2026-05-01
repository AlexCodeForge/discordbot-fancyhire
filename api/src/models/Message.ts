import { pool } from './database';

export interface Message {
  id: number;
  lead_id: number;
  discord_message_id?: string;
  content: string;
  sender_type: 'admin' | 'user';
  sender_name?: string;
  sent_at: Date;
  read_at?: Date;
  error?: string;
}

export interface MessageData {
  lead_id: number;
  discord_message_id?: string;
  content: string;
  sender_type: 'admin' | 'user';
  sender_name?: string;
}

export class MessageModel {
  static async create(data: MessageData): Promise<Message> {
    const { lead_id, discord_message_id, content, sender_type, sender_name } = data;

    const result = await pool.query(
      `INSERT INTO messages (lead_id, discord_message_id, content, sender_type, sender_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [lead_id, discord_message_id, content, sender_type, sender_name]
    );

    return result.rows[0];
  }

  static async getByLeadId(leadId: number, limit = 100): Promise<Message[]> {
    const result = await pool.query(
      'SELECT * FROM messages WHERE lead_id = $1 ORDER BY sent_at ASC LIMIT $2',
      [leadId, limit]
    );
    return result.rows;
  }

  static async getUnreadCount(leadId: number): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE lead_id = $1 AND sender_type = $2 AND read_at IS NULL',
      [leadId, 'user']
    );
    return parseInt(result.rows[0].count);
  }

  static async markAsRead(leadId: number): Promise<void> {
    await pool.query(
      'UPDATE messages SET read_at = NOW() WHERE lead_id = $1 AND sender_type = $2 AND read_at IS NULL',
      [leadId, 'user']
    );
  }

  static async updateDiscordId(messageId: number, discordMessageId: string): Promise<void> {
    await pool.query(
      'UPDATE messages SET discord_message_id = $1 WHERE id = $2',
      [discordMessageId, messageId]
    );
  }

  static async markError(messageId: number, error: string): Promise<void> {
    await pool.query(
      'UPDATE messages SET error = $1 WHERE id = $2',
      [error, messageId]
    );
  }

  static async getByDiscordId(discordId: string): Promise<Lead | null> {
    const result = await pool.query('SELECT * FROM leads WHERE discord_id = $1', [discordId]);
    return result.rows[0] || null;
  }

  static async existsByDiscordMessageId(discordMessageId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT EXISTS(SELECT 1 FROM messages WHERE discord_message_id = $1) as exists',
      [discordMessageId]
    );
    return result.rows[0].exists;
  }

  static async getLatestDiscordMessageId(leadId: number): Promise<string | null> {
    const result = await pool.query(
      `SELECT discord_message_id FROM messages 
       WHERE lead_id = $1 AND discord_message_id IS NOT NULL 
       ORDER BY sent_at DESC LIMIT 1`,
      [leadId]
    );
    return result.rows[0]?.discord_message_id || null;
  }
}

interface Lead {
  id: number;
  discord_id?: string;
}
