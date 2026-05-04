import { Request, Response, NextFunction } from 'express';
import { pool } from '../../../shared/database/database';
import { Logger } from '../../../shared/utils/Logger';

export interface Conversation {
  lead: {
    id: number;
    name: string;
    email?: string;
    discord_id: string;
    discord_tag?: string;
    status: string;
    avatar?: string;
  };
  lastMessage: {
    content: string;
    sentAt: string;
    senderType: 'user' | 'admin';
  };
  unreadCount: number;
  totalMessages: number;
}

export class ConversationController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        unread,
        status,
        search,
        sortBy = 'last_message',
        dateFrom,
        dateTo,
      } = req.query;

      let whereConditions = ['l.discord_id IS NOT NULL'];
      const queryParams: any[] = [];
      let paramCount = 0;

      if (status && status !== 'all') {
        paramCount++;
        whereConditions.push(`l.stage = $${paramCount}`);
        queryParams.push(status);
      }

      if (search) {
        paramCount++;
        whereConditions.push(`(l.name ILIKE $${paramCount} OR l.contact_discord ILIKE $${paramCount})`);
        queryParams.push(`%${search}%`);
      }

      if (dateFrom) {
        paramCount++;
        whereConditions.push(`m.sent_at >= $${paramCount}`);
        queryParams.push(dateFrom);
      }

      if (dateTo) {
        paramCount++;
        whereConditions.push(`m.sent_at <= $${paramCount}`);
        queryParams.push(dateTo);
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      let havingClause = '';
      if (unread === 'true') {
        havingClause = 'HAVING COUNT(CASE WHEN m.sender_type=\'user\' AND m.read_at IS NULL THEN 1 END) > 0';
      }

      let orderByClause = 'ORDER BY last_message_at DESC';
      if (sortBy === 'unread_count') {
        orderByClause = 'ORDER BY unread_count DESC, last_message_at DESC';
      } else if (sortBy === 'name') {
        orderByClause = 'ORDER BY l.name ASC';
      }

      const query = `
        SELECT 
          l.id,
          l.name,
          l.contact_discord as email,
          l.discord_id,
          l.discord_tag,
          l.stage as status,
          dm.avatar,
          dm.username,
          MAX(m.sent_at) as last_message_at,
          COUNT(CASE WHEN m.sender_type='user' AND m.read_at IS NULL THEN 1 END) as unread_count,
          COUNT(m.id) as total_messages,
          (
            SELECT content 
            FROM messages 
            WHERE lead_id = l.id 
            ORDER BY sent_at DESC 
            LIMIT 1
          ) as last_message_content,
          (
            SELECT sender_type 
            FROM messages 
            WHERE lead_id = l.id 
            ORDER BY sent_at DESC 
            LIMIT 1
          ) as last_sender_type
        FROM leads l
        INNER JOIN messages m ON m.lead_id = l.id
        LEFT JOIN discord_members dm ON dm.id = l.discord_id
        ${whereClause}
        GROUP BY l.id, l.name, l.contact_discord, l.discord_id, l.discord_tag, l.stage, dm.avatar, dm.username
        ${havingClause}
        ${orderByClause}
      `;

      const result = await pool.query(query, queryParams);

      const conversations: Conversation[] = result.rows.map((row: any) => ({
        lead: {
          id: row.id,
          name: row.name,
          email: row.email,
          contact_discord: row.email,
          discord_id: row.discord_id,
          discord_tag: row.discord_tag,
          status: row.status,
          stage: row.status,
          avatar: row.avatar,
          username: row.username,
        },
        lastMessage: {
          content: row.last_message_content,
          sentAt: row.last_message_at,
          senderType: row.last_sender_type,
        },
        unreadCount: parseInt(row.unread_count),
        totalMessages: parseInt(row.total_messages),
      }));

      Logger.info('Conversaciones obtenidas', { 
        total: conversations.length,
        filters: { unread, status, search, sortBy }
      }, req);

      res.json(conversations);
    } catch (error) {
      Logger.error('Error obteniendo conversaciones', { error }, undefined, req);
      next(error);
    }
  }
}
