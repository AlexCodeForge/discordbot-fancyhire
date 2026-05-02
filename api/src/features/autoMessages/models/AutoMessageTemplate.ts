import { pool } from '../../../shared/database/database';
import { Logger } from '../../../shared/utils/Logger';

export interface AutoMessageTemplate {
  id: number;
  message_type: string;
  content: string;
  is_enabled: boolean;
  description: string | null;
  available_variables: string[];
  created_at: Date;
  updated_at: Date;
}

export interface UpdateTemplateData {
  content?: string;
  is_enabled?: boolean;
  description?: string;
}

export class AutoMessageTemplateModel {
  static async getAll(): Promise<AutoMessageTemplate[]> {
    try {
      const result = await pool.query(
        'SELECT * FROM auto_message_templates ORDER BY message_type ASC'
      );
      return result.rows;
    } catch (error) {
      Logger.error('Error fetching auto message templates', { error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async getByType(messageType: string): Promise<AutoMessageTemplate | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM auto_message_templates WHERE message_type = $1',
        [messageType]
      );
      return result.rows[0] || null;
    } catch (error) {
      Logger.error('Error fetching auto message template by type', { messageType, error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async update(messageType: string, data: UpdateTemplateData): Promise<AutoMessageTemplate | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.content !== undefined) {
        fields.push(`content = $${paramIndex++}`);
        values.push(data.content);
      }

      if (data.is_enabled !== undefined) {
        fields.push(`is_enabled = $${paramIndex++}`);
        values.push(data.is_enabled);
      }

      if (data.description !== undefined) {
        fields.push(`description = $${paramIndex++}`);
        values.push(data.description);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      fields.push(`updated_at = NOW()`);
      values.push(messageType);

      const result = await pool.query(
        `UPDATE auto_message_templates 
         SET ${fields.join(', ')}
         WHERE message_type = $${paramIndex}
         RETURNING *`,
        values
      );

      if (result.rows[0]) {
        Logger.info('Auto message template updated', { messageType, fields: Object.keys(data) });
      }

      return result.rows[0] || null;
    } catch (error) {
      Logger.error('Error updating auto message template', { messageType, error: (error as Error).message }, error as Error);
      throw error;
    }
  }

  static async resetToDefault(messageType: string): Promise<AutoMessageTemplate | null> {
    try {
      // This would require storing default values, for now we just fetch the current value
      const result = await pool.query(
        'SELECT * FROM auto_message_templates WHERE message_type = $1',
        [messageType]
      );

      if (result.rows[0]) {
        Logger.info('Auto message template reset requested', { messageType });
      }

      return result.rows[0] || null;
    } catch (error) {
      Logger.error('Error resetting auto message template', { messageType, error: (error as Error).message }, error as Error);
      throw error;
    }
  }
}
