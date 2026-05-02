import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { TicketModel } from '../models/Ticket';
import { TicketMessageModel } from '../models/TicketMessage';
import { TicketTranscriptModel } from '../models/TicketTranscript';
import { LeadModel } from '../../leads/models/Lead';
import { Logger } from '../../../shared/utils/Logger';

export class TranscriptService {
  private static TRANSCRIPTS_DIR = path.join(__dirname, '../../transcripts');

  private static ensureTranscriptsDir(): void {
    if (!fs.existsSync(this.TRANSCRIPTS_DIR)) {
      fs.mkdirSync(this.TRANSCRIPTS_DIR, { recursive: true });
    }
  }

  static async generateTranscript(ticketId: number): Promise<string> {
    try {
      this.ensureTranscriptsDir();

      const ticket = await TicketModel.getById(ticketId);
      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }

      const lead = await LeadModel.getById(ticket.lead_id);
      if (!lead) {
        throw new Error('Lead no encontrado');
      }

      const messages = await TicketMessageModel.getByTicket(ticketId);
      
      const participants = [...new Set(messages.map(m => m.author_name))];
      
      let durationMinutes: number | null = null;
      if (ticket.closed_at) {
        durationMinutes = Math.round(
          (new Date(ticket.closed_at).getTime() - new Date(ticket.created_at).getTime()) / 60000
        );
      }

      const filename = `ticket-${ticketId}-${Date.now()}.pdf`;
      const filepath = path.join(this.TRANSCRIPTS_DIR, filename);
      const pdfUrl = `/transcripts/${filename}`;

      await this.createPDF(filepath, ticket, lead, messages, participants);

      await TicketTranscriptModel.create({
        ticket_id: ticketId,
        pdf_url: pdfUrl,
        message_count: messages.length,
        duration_minutes: durationMinutes,
        participants,
      });

      Logger.info('Transcripción generada', { ticketId, pdfUrl, messageCount: messages.length });

      return pdfUrl;
    } catch (error) {
      Logger.error('Error generando transcripción', { ticketId }, error as Error);
      throw error;
    }
  }

  private static createPDF(
    filepath: string,
    ticket: any,
    lead: any,
    messages: any[],
    participants: string[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        doc.font('Helvetica-Bold').fontSize(24).fillColor('#1c69d4').text('Transcripción de Ticket', { align: 'center' });
        doc.moveDown(1);

        doc.font('Helvetica-Bold').fontSize(14).fillColor('#262626').text('Información del Ticket');
        doc.moveDown(0.5);

        doc.font('Helvetica').fontSize(11).fillColor('#3c3c3c');
        doc.text(`Ticket ID: ${ticket.id}`);
        doc.text(`Lead: ${lead.name}`);
        doc.text(`Canal Discord: ${ticket.discord_channel_id}`);
        doc.text(`Estado: ${ticket.status}`);
        doc.text(`Creado por: ${ticket.created_by}`);
        doc.text(`Fecha de creación: ${new Date(ticket.created_at).toLocaleString('es-ES')}`);
        
        if (ticket.closed_at) {
          doc.text(`Fecha de cierre: ${new Date(ticket.closed_at).toLocaleString('es-ES')}`);
          doc.text(`Cerrado por: ${ticket.closed_by}`);
        }
        
        if (ticket.resolution_notes) {
          doc.text(`Notas de resolución: ${ticket.resolution_notes}`);
        }

        doc.moveDown(1);

        doc.font('Helvetica-Bold').fontSize(14).fillColor('#262626').text('Participantes');
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(11).fillColor('#3c3c3c');
        doc.text(participants.join(', '));

        doc.moveDown(1);

        doc.font('Helvetica-Bold').fontSize(14).fillColor('#262626').text('Estadísticas');
        doc.moveDown(0.5);
        doc.font('Helvetica').fontSize(11).fillColor('#3c3c3c');
        doc.text(`Total de mensajes: ${messages.length}`);
        
        if (ticket.closed_at) {
          const duration = Math.round(
            (new Date(ticket.closed_at).getTime() - new Date(ticket.created_at).getTime()) / 60000
          );
          doc.text(`Duración: ${duration} minutos`);
        }

        doc.moveDown(1.5);

        doc.font('Helvetica-Bold').fontSize(14).fillColor('#262626').text('Mensajes');
        doc.moveDown(0.5);

        doc.strokeColor('#e6e6e6').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        messages.forEach((msg, index) => {
          const timestamp = new Date(msg.sent_at).toLocaleString('es-ES', {
            dateStyle: 'short',
            timeStyle: 'short'
          });

          doc.font('Helvetica-Bold').fontSize(10).fillColor('#1c69d4').text(`${msg.author_name}`, { continued: true });
          doc.font('Helvetica').fontSize(9).fillColor('#6b6b6b').text(` - ${timestamp}`);
          doc.moveDown(0.3);

          doc.font('Helvetica').fontSize(10).fillColor('#3c3c3c').text(msg.content, {
            width: 495,
            align: 'left'
          });
          doc.moveDown(0.8);

          if (index < messages.length - 1) {
            doc.strokeColor('#f7f7f7').lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown(0.8);
          }

          if (doc.y > 700) {
            doc.addPage();
          }
        });

        doc.moveDown(2);
        doc.strokeColor('#e6e6e6').lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(1);

        doc.font('Helvetica').fontSize(9).fillColor('#9a9a9a').text(
          `Generado el ${new Date().toLocaleString('es-ES')} - CRM Discord Bot`,
          { align: 'center' }
        );

        doc.end();

        stream.on('finish', () => {
          resolve();
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
