import { pool } from '../../../shared/database/database';

export interface ChannelMessage {
  id: number;
  channel_id: number;
  discord_message_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  mentions: string[] | null;
  sent_at: Date;
  edited_at: Date | null;
  deleted_at: Date | null;
}

export interface MessageData {
  channel_id: number;
  discord_message_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string | null;
  content: string;
  mentions?: string[];
  sent_at?: Date | null;
}

export class ChannelMessageModel {
  static async getByChannel(
    channelId: number,
    limit: number
  ): Promise<ChannelMessage[]> {
    const result = await pool.query(
      `SELECT * FROM channel_messages
       WHERE channel_id = $1
       ORDER BY sent_at DESC
       LIMIT $2`,
      [channelId, limit]
    );
    return result.rows;
  }

  static async create(data: MessageData): Promise<ChannelMessage> {
    const {
      channel_id,
      discord_message_id,
      author_id,
      author_name,
      author_avatar = null,
      content,
      mentions = [],
      sent_at = null,
    } = data;

    const result = await pool.query(
      `INSERT INTO channel_messages (
         channel_id, discord_message_id, author_id, author_name, author_avatar,
         content, mentions, sent_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, NOW()))
       RETURNING *`,
      [
        channel_id,
        discord_message_id,
        author_id,
        author_name,
        author_avatar,
        content,
        mentions,
        sent_at,
      ]
    );

    return result.rows[0];
  }

  static async exists(discordMessageId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT EXISTS(
         SELECT 1 FROM channel_messages WHERE discord_message_id = $1
       ) AS exists`,
      [discordMessageId]
    );
    return result.rows[0].exists;
  }

  static async update(discordMessageId: string, content: string): Promise<void> {
    await pool.query(
      `UPDATE channel_messages
       SET content = $1, edited_at = NOW()
       WHERE discord_message_id = $2`,
      [content, discordMessageId]
    );
  }

  static async softDelete(discordMessageId: string): Promise<void> {
    await pool.query(
      `UPDATE channel_messages SET deleted_at = NOW() WHERE discord_message_id = $1`,
      [discordMessageId]
    );
  }
}
