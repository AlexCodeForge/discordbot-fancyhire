import { pool } from '../../../shared/database/database';

export interface ForumThread {
  id: number;
  discord_thread_id: string;
  channel_id: number;
  name: string;
  owner_id: string;
  owner_name: string;
  archived: boolean;
  locked: boolean;
  message_count: number;
  member_count: number;
  start_message_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ThreadData {
  discord_thread_id: string;
  channel_id: number;
  name: string;
  owner_id: string;
  owner_name: string;
  archived?: boolean;
  locked?: boolean;
  message_count?: number;
  member_count?: number;
  start_message_id?: string | null;
}

export class ForumThreadModel {
  static async getByChannel(channelId: number): Promise<ForumThread[]> {
    const result = await pool.query(
      `SELECT * FROM forum_threads
       WHERE channel_id = $1
       ORDER BY created_at DESC`,
      [channelId]
    );
    return result.rows;
  }

  static async getById(id: number): Promise<ForumThread | null> {
    const result = await pool.query(
      `SELECT * FROM forum_threads WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async getByDiscordThreadId(discordThreadId: string): Promise<ForumThread | null> {
    const result = await pool.query(
      `SELECT * FROM forum_threads WHERE discord_thread_id = $1`,
      [discordThreadId]
    );
    return result.rows[0] || null;
  }

  static async upsert(data: ThreadData): Promise<ForumThread> {
    const {
      discord_thread_id,
      channel_id,
      name,
      owner_id,
      owner_name,
      archived = false,
      locked = false,
      message_count = 0,
      member_count = 0,
      start_message_id = null,
    } = data;

    const result = await pool.query(
      `INSERT INTO forum_threads (
         discord_thread_id, channel_id, name, owner_id, owner_name,
         archived, locked, message_count, member_count, start_message_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (discord_thread_id)
       DO UPDATE SET
         name = EXCLUDED.name,
         archived = EXCLUDED.archived,
         locked = EXCLUDED.locked,
         message_count = EXCLUDED.message_count,
         member_count = EXCLUDED.member_count,
         start_message_id = COALESCE(EXCLUDED.start_message_id, forum_threads.start_message_id),
         updated_at = NOW()
       RETURNING *`,
      [
        discord_thread_id,
        channel_id,
        name,
        owner_id,
        owner_name,
        archived,
        locked,
        message_count,
        member_count,
        start_message_id,
      ]
    );

    return result.rows[0];
  }

  static async updateArchived(threadId: number, archived: boolean): Promise<void> {
    await pool.query(
      `UPDATE forum_threads
       SET archived = $1, updated_at = NOW()
       WHERE id = $2`,
      [archived, threadId]
    );
  }

  static async exists(discordThreadId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT EXISTS(
         SELECT 1 FROM forum_threads WHERE discord_thread_id = $1
       ) AS exists`,
      [discordThreadId]
    );
    return result.rows[0].exists;
  }

  static async delete(threadId: number): Promise<void> {
    await pool.query(
      `DELETE FROM forum_threads WHERE id = $1`,
      [threadId]
    );
  }

  static async deleteByDiscordId(discordThreadId: string): Promise<void> {
    await pool.query(
      `DELETE FROM forum_threads WHERE discord_thread_id = $1`,
      [discordThreadId]
    );
  }
}
