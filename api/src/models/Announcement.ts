import { pool } from './database';
import { Announcement, AnnouncementEmbed } from '../types/Announcement';
import { Logger } from '../utils/Logger';

export class AnnouncementModel {
  static async create(embedData: AnnouncementEmbed, createdBy: string): Promise<Announcement> {
    try {
      const result = await pool.query(
        `INSERT INTO announcements 
         (title, description, color, thumbnail_url, image_url, footer_text, 
          footer_icon_url, author_name, author_icon_url, url, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          embedData.title || null,
          embedData.description || null,
          embedData.color || null,
          embedData.thumbnail_url || null,
          embedData.image_url || null,
          embedData.footer_text || null,
          embedData.footer_icon_url || null,
          embedData.author_name || null,
          embedData.author_icon_url || null,
          embedData.url || null,
          createdBy
        ]
      );

      Logger.info('Announcement created', { announcementId: result.rows[0].id, createdBy });
      return result.rows[0];
    } catch (error) {
      Logger.error('Error creating announcement', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async getAll(): Promise<Announcement[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM announcements ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      Logger.error('Error fetching announcements', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async getById(id: number): Promise<Announcement | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM announcements WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      Logger.error('Error fetching announcement by id', { id, error: (error as Error).message }, error as Error);
      throw error;
    }
  }
}
