import { pool } from '../../../shared/database/database';
import { AnnouncementTemplate, AnnouncementEmbed } from '../types/Announcement';
import { Logger } from '../../../shared/utils/Logger';

export class AnnouncementTemplateModel {
  static async create(name: string, embedData: AnnouncementEmbed, createdBy: string): Promise<AnnouncementTemplate> {
    try {
      const result = await pool.query(
        `INSERT INTO announcement_templates 
         (name, title, description, color, thumbnail_url, image_url, footer_text, 
          footer_icon_url, author_name, author_icon_url, url, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          name,
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

      Logger.info('Announcement template created', { templateId: result.rows[0].id, name, createdBy });
      return result.rows[0];
    } catch (error) {
      Logger.error('Error creating announcement template', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async getAll(): Promise<AnnouncementTemplate[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM announcement_templates ORDER BY name ASC'
      );
      return result.rows;
    } catch (error) {
      Logger.error('Error fetching announcement templates', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async getById(id: number): Promise<AnnouncementTemplate | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM announcement_templates WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      Logger.error('Error fetching announcement template by id', { id, error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async update(id: number, embedData: AnnouncementEmbed): Promise<AnnouncementTemplate | null> {
    try {
      const result = await pool.query(
        `UPDATE announcement_templates 
         SET title = $1, description = $2, color = $3, thumbnail_url = $4, 
             image_url = $5, footer_text = $6, footer_icon_url = $7, 
             author_name = $8, author_icon_url = $9, url = $10, updated_at = NOW()
         WHERE id = $11
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
          id
        ]
      );

      if (result.rows[0]) {
        Logger.info('Announcement template updated', { templateId: id });
      }
      return result.rows[0] || null;
    } catch (error) {
      Logger.error('Error updating announcement template', { id, error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM announcement_templates WHERE id = $1',
        [id]
      );

      const deleted = result.rowCount !== null && result.rowCount > 0;
      if (deleted) {
        Logger.info('Announcement template deleted', { templateId: id });
      }
      return deleted;
    } catch (error) {
      Logger.error('Error deleting announcement template', { id, error: (error as Error).message }, error as Error);
      throw error;
    }
  }
}
