import { pool } from '../../../shared/database/database';

export interface Channel {
  id: number;
  discord_channel_id: string;
  name: string;
  type: string;
  position: number;
  parent_id: string | null;
  topic: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChannelData {
  discord_channel_id: string;
  name: string;
  type: string;
  position?: number;
  parent_id?: string | null;
  topic?: string | null;
}

export class ChannelModel {
  static async getAll(): Promise<Channel[]> {
    const result = await pool.query(
      'SELECT * FROM channels ORDER BY position ASC NULLS LAST, id ASC'
    );
    return result.rows;
  }

  static async getById(id: number): Promise<Channel | null> {
    const result = await pool.query('SELECT * FROM channels WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async getByDiscordId(discordId: string): Promise<Channel | null> {
    const result = await pool.query(
      'SELECT * FROM channels WHERE discord_channel_id = $1',
      [discordId]
    );
    return result.rows[0] || null;
  }

  static async upsert(data: ChannelData): Promise<Channel> {
    const {
      discord_channel_id,
      name,
      type,
      position = 0,
      parent_id = null,
      topic = null,
    } = data;

    const result = await pool.query(
      `INSERT INTO channels (discord_channel_id, name, type, position, parent_id, topic)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (discord_channel_id)
       DO UPDATE SET
         name = EXCLUDED.name,
         type = EXCLUDED.type,
         position = EXCLUDED.position,
         parent_id = EXCLUDED.parent_id,
         topic = EXCLUDED.topic,
         updated_at = NOW()
       RETURNING *`,
      [discord_channel_id, name, type, position, parent_id, topic]
    );

    return result.rows[0];
  }

  static async delete(discordChannelId: string): Promise<void> {
    await pool.query('DELETE FROM channels WHERE discord_channel_id = $1', [
      discordChannelId,
    ]);
  }
}
