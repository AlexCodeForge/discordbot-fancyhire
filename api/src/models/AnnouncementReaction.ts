import { pool } from './database';
import { AnnouncementReaction } from '../types/Announcement';
import { Logger } from '../utils/Logger';

export class AnnouncementReactionModel {
  static async addReaction(
    announcementId: number,
    emoji: string,
    userId: string,
    userName: string
  ): Promise<AnnouncementReaction> {
    try {
      const existingResult = await pool.query(
        `SELECT * FROM announcement_reactions 
         WHERE announcement_id = $1 AND emoji = $2 AND user_id = $3 AND removed_at IS NULL`,
        [announcementId, emoji, userId]
      );

      if (existingResult.rows[0]) {
        return existingResult.rows[0];
      }

      const checkRemovedResult = await pool.query(
        `SELECT * FROM announcement_reactions 
         WHERE announcement_id = $1 AND emoji = $2 AND user_id = $3 AND removed_at IS NOT NULL
         ORDER BY removed_at DESC LIMIT 1`,
        [announcementId, emoji, userId]
      );

      if (checkRemovedResult.rows[0]) {
        const result = await pool.query(
          `UPDATE announcement_reactions 
           SET removed_at = NULL, added_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [checkRemovedResult.rows[0].id]
        );
        Logger.info('Reaction re-added', { announcementId, emoji, userId });
        return result.rows[0];
      }

      const result = await pool.query(
        `INSERT INTO announcement_reactions (announcement_id, emoji, user_id, user_name)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [announcementId, emoji, userId, userName]
      );

      Logger.info('Reaction added', { announcementId, emoji, userId });
      return result.rows[0];
    } catch (error) {
      Logger.error('Error adding reaction', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async removeReaction(
    announcementId: number,
    emoji: string,
    userId: string
  ): Promise<boolean> {
    try {
      const result = await pool.query(
        `UPDATE announcement_reactions 
         SET removed_at = NOW()
         WHERE announcement_id = $1 AND emoji = $2 AND user_id = $3 AND removed_at IS NULL`,
        [announcementId, emoji, userId]
      );

      const removed = result.rowCount !== null && result.rowCount > 0;
      if (removed) {
        Logger.info('Reaction removed', { announcementId, emoji, userId });
      }
      return removed;
    } catch (error) {
      Logger.error('Error removing reaction', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async getByAnnouncementId(announcementId: number): Promise<AnnouncementReaction[]> {
    try {
      const result = await pool.query(
        `SELECT * FROM announcement_reactions 
         WHERE announcement_id = $1 AND removed_at IS NULL
         ORDER BY added_at ASC`,
        [announcementId]
      );
      return result.rows;
    } catch (error) {
      Logger.error('Error fetching reactions', { announcementId, error: (error as Error).message }, error as Error);
      throw error;
    }
  }
}
