import { pool } from '../../../shared/database/database';
import { Announcement, AnnouncementEmbed, AnnouncementWithStats, ReactionStats } from '../types/Announcement';
import { Logger } from '../../../shared/utils/Logger';

export class AnnouncementModel {
  static async create(embedData: AnnouncementEmbed, createdBy: string, templateId?: number): Promise<Announcement> {
    try {
      const result = await pool.query(
        `INSERT INTO announcements 
         (title, description, color, thumbnail_url, image_url, footer_text, 
          footer_icon_url, author_name, author_icon_url, url, created_by, template_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'draft')
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
          createdBy,
          templateId || null
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
        `SELECT * FROM announcements 
         WHERE status != 'deleted' 
         ORDER BY created_at DESC`
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

  static async getByMessageId(messageId: string): Promise<Announcement | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM announcements WHERE discord_message_id = $1',
        [messageId]
      );
      return result.rows[0] || null;
    } catch (error) {
      Logger.error('Error fetching announcement by message id', { messageId, error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async update(id: number, embedData: AnnouncementEmbed): Promise<Announcement | null> {
    try {
      const result = await pool.query(
        `UPDATE announcements 
         SET title = $1, description = $2, color = $3, thumbnail_url = $4, 
             image_url = $5, footer_text = $6, footer_icon_url = $7, 
             author_name = $8, author_icon_url = $9, url = $10
         WHERE id = $11 AND status = 'draft'
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
        Logger.info('Announcement updated', { announcementId: id });
      }
      return result.rows[0] || null;
    } catch (error) {
      Logger.error('Error updating announcement', { id, error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async markAsSent(id: number, messageId: string, channelId: string): Promise<Announcement | null> {
    try {
      const result = await pool.query(
        `UPDATE announcements 
         SET discord_message_id = $1, discord_channel_id = $2, sent_at = NOW(), status = 'sent'
         WHERE id = $3
         RETURNING *`,
        [messageId, channelId, id]
      );

      if (result.rows[0]) {
        Logger.info('Announcement marked as sent', { announcementId: id, messageId, channelId });
      }
      return result.rows[0] || null;
    } catch (error) {
      Logger.error('Error marking announcement as sent', { id, error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async softDelete(id: number): Promise<boolean> {
    try {
      const result = await pool.query(
        `UPDATE announcements 
         SET status = 'deleted'
         WHERE id = $1`,
        [id]
      );

      const deleted = result.rowCount !== null && result.rowCount > 0;
      if (deleted) {
        Logger.info('Announcement soft deleted', { announcementId: id });
      }
      return deleted;
    } catch (error) {
      Logger.error('Error soft deleting announcement', { id, error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async getWithStats(id: number): Promise<AnnouncementWithStats | null> {
    try {
      const announcementResult = await pool.query(
        'SELECT * FROM announcements WHERE id = $1',
        [id]
      );

      if (!announcementResult.rows[0]) {
        return null;
      }

      const reactionsResult = await pool.query(
        `SELECT emoji, user_id, user_name, added_at
         FROM announcement_reactions
         WHERE announcement_id = $1 AND removed_at IS NULL
         ORDER BY added_at ASC`,
        [id]
      );

      const reactionsByEmoji: { [emoji: string]: ReactionStats } = {};
      
      for (const reaction of reactionsResult.rows) {
        if (!reactionsByEmoji[reaction.emoji]) {
          reactionsByEmoji[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: []
          };
        }
        reactionsByEmoji[reaction.emoji].count++;
        reactionsByEmoji[reaction.emoji].users.push({
          user_id: reaction.user_id,
          user_name: reaction.user_name,
          added_at: reaction.added_at
        });
      }

      const announcement: AnnouncementWithStats = {
        ...announcementResult.rows[0],
        reactions: Object.values(reactionsByEmoji)
      };

      return announcement;
    } catch (error) {
      Logger.error('Error fetching announcement with stats', { id, error: (error as Error).message }, error as Error);
      throw error;
    }
  }
}
