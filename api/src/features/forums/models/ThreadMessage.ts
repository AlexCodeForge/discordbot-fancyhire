import { pool } from '../../../shared/database/database';

export interface ThreadMessage {
  id: number;
  thread_id: number;
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

export interface ThreadMessageData {
  thread_id: number;
  discord_message_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string | null;
  content: string;
  mentions?: string[];
  sent_at?: Date | null;
}

export class ThreadMessageModel {
  static async getByThread(
    threadId: number,
    limit: number = 100
  ): Promise<ThreadMessage[]> {
    const result = await pool.query(
      `SELECT * FROM thread_messages
       WHERE thread_id = $1
       ORDER BY sent_at DESC
       LIMIT $2`,
      [threadId, limit]
    );
    return result.rows;
  }

  static async create(data: ThreadMessageData): Promise<ThreadMessage> {
    const {
      thread_id,
      discord_message_id,
      author_id,
      author_name,
      author_avatar = null,
      content,
      mentions = [],
      sent_at = null,
    } = data;

    const result = await pool.query(
      `INSERT INTO thread_messages (
         thread_id, discord_message_id, author_id, author_name, author_avatar,
         content, mentions, sent_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, NOW()))
       RETURNING *`,
      [
        thread_id,
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
         SELECT 1 FROM thread_messages WHERE discord_message_id = $1
       ) AS exists`,
      [discordMessageId]
    );
    return result.rows[0].exists;
  }

  static async update(discordMessageId: string, content: string): Promise<void> {
    await pool.query(
      `UPDATE thread_messages
       SET content = $1, edited_at = NOW()
       WHERE discord_message_id = $2`,
      [content, discordMessageId]
    );
  }

  static async softDelete(discordMessageId: string): Promise<void> {
    await pool.query(
      `UPDATE thread_messages SET deleted_at = NOW() WHERE discord_message_id = $1`,
      [discordMessageId]
    );
  }
}
