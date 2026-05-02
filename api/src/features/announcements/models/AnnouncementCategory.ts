import { pool } from '../../../shared/database/database';
import { Logger } from '../../../shared/utils/Logger';

export interface AnnouncementCategory {
  id: number;
  name: string;
  color?: string;
  description?: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export class AnnouncementCategoryModel {
  static async create(name: string, color: string | undefined, description: string | undefined, createdBy: string): Promise<AnnouncementCategory> {
    try {
      const result = await pool.query(
        `INSERT INTO announcement_categories (name, color, description, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [name, color || null, description || null, createdBy]
      );

      Logger.info('Announcement category created', { categoryId: result.rows[0].id, name, createdBy });
      return result.rows[0];
    } catch (error) {
      Logger.error('Error creating announcement category', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async getAll(): Promise<AnnouncementCategory[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM announcement_categories ORDER BY name ASC'
      );
      return result.rows;
    } catch (error) {
      Logger.error('Error fetching announcement categories', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async getById(id: number): Promise<AnnouncementCategory | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM announcement_categories WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      Logger.error('Error fetching announcement category by id', { id, error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async update(id: number, name: string, color: string | undefined, description: string | undefined): Promise<AnnouncementCategory | null> {
    try {
      const result = await pool.query(
        `UPDATE announcement_categories 
         SET name = $1, color = $2, description = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [name, color || null, description || null, id]
      );

      if (result.rows[0]) {
        Logger.info('Announcement category updated', { categoryId: id });
      }
      return result.rows[0] || null;
    } catch (error) {
      Logger.error('Error updating announcement category', { id, error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        'DELETE FROM announcement_categories WHERE id = $1',
        [id]
      );

      const deleted = result.rowCount !== null && result.rowCount > 0;
      if (deleted) {
        Logger.info('Announcement category deleted', { categoryId: id });
      }
      return deleted;
    } catch (error) {
      Logger.error('Error deleting announcement category', { id, error: (error as Error).message }, error as Error);
      throw error;
    }
  }
}
