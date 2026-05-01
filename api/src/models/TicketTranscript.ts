import { pool } from './database';
import { Logger } from '../utils/Logger';

export interface TicketTranscript {
  id: number;
  ticket_id: number;
  pdf_url: string;
  message_count: number;
  duration_minutes: number | null;
  participants: string[];
  generated_at: Date;
}

export interface TicketTranscriptData {
  ticket_id: number;
  pdf_url: string;
  message_count: number;
  duration_minutes?: number | null;
  participants?: string[];
}

export class TicketTranscriptModel {
  static async create(data: TicketTranscriptData): Promise<TicketTranscript> {
    const {
      ticket_id,
      pdf_url,
      message_count,
      duration_minutes = null,
      participants = [],
    } = data;

    try {
      const result = await pool.query(
        `INSERT INTO ticket_transcripts 
         (ticket_id, pdf_url, message_count, duration_minutes, participants)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [ticket_id, pdf_url, message_count, duration_minutes, participants]
      );

      Logger.info('Ticket transcript created', { ticketId: ticket_id, pdfUrl: pdf_url });
      return result.rows[0];
    } catch (error) {
      Logger.error('Error creating ticket transcript', { ticket_id }, error as Error);
      throw error;
    }
  }

  static async getByTicketId(ticketId: number): Promise<TicketTranscript | null> {
    const result = await pool.query(
      'SELECT * FROM ticket_transcripts WHERE ticket_id = $1',
      [ticketId]
    );
    return result.rows[0] || null;
  }

  static async getAll(): Promise<TicketTranscript[]> {
    const result = await pool.query(
      'SELECT * FROM ticket_transcripts ORDER BY generated_at DESC'
    );
    return result.rows;
  }
}
