import { Router } from 'express';
import axios from 'axios';
import { TicketModel } from '../models/Ticket';
import { TicketMessageModel } from '../models/TicketMessage';
import { LeadModel } from '../../leads/models/Lead';
import { BotService } from '../../discord/services/botService';
import { TranscriptService } from '../services/transcriptService';
import { Logger } from '../../../shared/utils/Logger';

const router = Router();

router.post('/create', async (req, res, next) => {
  try {
    const { lead_id, created_by } = req.body;

    if (!lead_id) {
      return res.status(400).json({ error: 'lead_id es requerido' });
    }

    const lead = await LeadModel.getById(lead_id);
    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    if (!lead.discord_id) {
      return res.status(400).json({ error: 'Lead no tiene discord_id configurado' });
    }

    const existingTicket = await TicketModel.getOpenTicketByLeadId(lead_id);
    if (existingTicket) {
      return res.status(400).json({ 
        error: 'Ya existe un ticket abierto para este lead',
        ticket: existingTicket 
      });
    }

    const { channel_id } = await BotService.createTicket(
      lead.name,
      lead.discord_id,
      lead.assigned_to
    );

    const ticket = await TicketModel.create({
      lead_id,
      discord_channel_id: channel_id,
      created_by: created_by || 'system',
    });

    Logger.info('Ticket creado', { ticketId: ticket.id, leadId: lead_id, channelId: channel_id }, req);

    res.status(201).json(ticket);
  } catch (error) {
    Logger.error('Error creando ticket', { leadId: req.body.lead_id }, error as Error, req);
    next(error);
  }
});

router.get('/lead/:leadId', async (req, res, next) => {
  try {
    const leadId = parseInt(req.params.leadId);
    const tickets = await TicketModel.getByLeadId(leadId);
    res.json(tickets);
  } catch (error) {
    next(error);
  }
});

router.get('/channel/:discordChannelId/messages', async (req, res, next) => {
  try {
    const { discordChannelId } = req.params;
    
    const ticket = await TicketModel.getByChannelId(discordChannelId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado para este canal' });
    }

    const messages = await TicketMessageModel.getByTicket(ticket.id);
    res.json(messages);
  } catch (error) {
    Logger.error('Error obteniendo mensajes de ticket por canal', { discordChannelId: req.params.discordChannelId }, error as Error, req);
    next(error);
  }
});

router.get('/metrics/stats', async (req, res, next) => {
  try {
    const metrics = await TicketModel.getMetrics();
    res.json(metrics);
  } catch (error) {
    Logger.error('Error obteniendo métricas de tickets', {}, error as Error, req);
    next(error);
  }
});

router.get('/:ticketId/messages', async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    
    const ticket = await TicketModel.getById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const messages = await TicketMessageModel.getByTicket(ticketId);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

router.post('/:ticketId/close', async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const { closed_by, resolution_notes, delete_channel } = req.body;

    Logger.info('Cerrando ticket', { ticketId, delete_channel, body: req.body }, req);

    const ticket = await TicketModel.getById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    if (ticket.status === 'closed') {
      return res.status(400).json({ error: 'El ticket ya está cerrado' });
    }

    const closedTicket = await TicketModel.close(
      ticketId,
      closed_by || 'system',
      resolution_notes
    );

    let pdfUrl;
    try {
      pdfUrl = await TranscriptService.generateTranscript(ticketId);
      
      const lead = await LeadModel.getById(ticket.lead_id);
      if (pdfUrl && lead?.discord_id) {
        const pdfFullUrl = `${process.env.PUBLIC_URL || 'https://discordbot.alexcodeforge.com'}${pdfUrl}`;
        await BotService.sendDM(
          lead.discord_id,
          `🎫 **Ticket #${ticketId} cerrado**\n\n` +
          `Gracias por contactarnos. Tu ticket ha sido cerrado.\n\n` +
          `📄 **Transcripción**: ${pdfFullUrl}\n\n` +
          `**Notas de resolución**: ${resolution_notes || 'Sin notas'}`
        );
        Logger.info('PDF enviado por DM', { ticketId, leadId: lead.id, pdfUrl }, req);
      }
    } catch (error) {
      Logger.warning('Error generando o enviando transcripción, continuando con cierre', { ticketId }, req);
    }

    if (delete_channel === true) {
      try {
        Logger.info('Eliminando canal al cerrar ticket', { ticketId, channelId: ticket.discord_channel_id }, req);
        await BotService.deleteTicketChannel(ticket.discord_channel_id);
        Logger.info('Canal eliminado exitosamente', { ticketId, channelId: ticket.discord_channel_id }, req);
      } catch (error) {
        Logger.error('Error eliminando canal', { ticketId }, error as Error, req);
      }
    } else {
      Logger.info('Archivando canal (delete_channel=false)', { ticketId, channelId: ticket.discord_channel_id, delete_channel }, req);
      await BotService.closeTicket(ticket.discord_channel_id);
    }

    Logger.info('Ticket cerrado', { ticketId, closedBy: closed_by, pdfUrl, channelDeleted: delete_channel === true }, req);

    res.json({ ...closedTicket, transcript_url: pdfUrl });
  } catch (error) {
    Logger.error('Error cerrando ticket', { ticketId: req.params.ticketId }, error as Error, req);
    next(error);
  }
});

router.post('/:ticketId/transfer', async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const { new_user_id, old_user_id } = req.body;

    if (!new_user_id) {
      return res.status(400).json({ error: 'new_user_id es requerido' });
    }

    const ticket = await TicketModel.getById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    await BotService.transferTicket(ticket.discord_channel_id, new_user_id, old_user_id);

    Logger.info('Ticket transferido', { ticketId, newUserId: new_user_id }, req);

    res.json({ success: true, message: 'Ticket transferido correctamente' });
  } catch (error) {
    Logger.error('Error transfiriendo ticket', { ticketId: req.params.ticketId }, error as Error, req);
    next(error);
  }
});

router.post('/messages/incoming', async (req, res, next) => {
  res.status(400).json({ error: 'Esta ruta fue movida. El bot debe usar /api/tickets/messages/incoming directamente (sin autenticación)' });
});

router.post('/:ticketId/send-message', async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const { content, discord_channel_id } = req.body;

    if (!content || !discord_channel_id) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const ticket = await TicketModel.getById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const response = await axios.post(`${process.env.BOT_URL || 'http://127.0.0.1:3005'}/send-channel-message`, {
      channelId: discord_channel_id,
      content,
      mentions: []
    });

    Logger.info('Mensaje enviado a ticket', { ticketId, channelId: discord_channel_id }, req);

    res.json({ success: true, message_id: response.data.discord_message_id });
  } catch (error: any) {
    Logger.error('Error enviando mensaje a ticket', { ticketId: req.params.ticketId }, error as Error, req);
    next(error);
  }
});

router.delete('/:ticketId/channel', async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.ticketId);

    const ticket = await TicketModel.getById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    if (ticket.status === 'open') {
      return res.status(400).json({ error: 'No se puede eliminar el canal de un ticket abierto. Cierra el ticket primero.' });
    }

    await BotService.deleteTicketChannel(ticket.discord_channel_id);

    Logger.info('Canal de ticket eliminado', { ticketId, channelId: ticket.discord_channel_id }, req);

    res.json({ success: true, message: 'Canal eliminado correctamente' });
  } catch (error: any) {
    Logger.error('Error eliminando canal de ticket', { ticketId: req.params.ticketId }, error as Error, req);
    next(error);
  }
});

router.get('/:ticketId/channel-exists', async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const ticket = await TicketModel.getById(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const exists = await BotService.checkChannelExists(ticket.discord_channel_id);
    res.json({ exists });
  } catch (error: any) {
    Logger.error('Error verificando canal de ticket', { ticketId: req.params.ticketId }, error as Error, req);
    next(error);
  }
});

router.patch('/channel/:channelId/archive', async (req, res, next) => {
  try {
    const { channelId } = req.params;
    
    const ticket = await TicketModel.updateStatusByChannelId(channelId, 'archived');
    
    if (!ticket) {
      Logger.warning('No se encontró ticket para archivar', { channelId }, req);
      return res.status(404).json({ error: 'Ticket no encontrado para este canal' });
    }
    
    Logger.info('Ticket archivado por eliminación de canal', { ticketId: ticket.id, channelId }, req);
    res.json(ticket);
  } catch (error) {
    Logger.error('Error archivando ticket por canal', { channelId: req.params.channelId }, error as Error, req);
    next(error);
  }
});

router.get('/:ticketId', async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.ticketId);
    const ticket = await TicketModel.getById(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

export default router;
