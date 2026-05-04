import { Router } from 'express';
import { MessageModel } from '../models/Message';
import { LeadModel } from '../models/Lead';
import { BotService } from '../../discord/services/botService';
import { Logger } from '../../../shared/utils/Logger';

const router = Router();

router.get('/check/:discordMessageId', async (req, res, next) => {
  try {
    const { discordMessageId } = req.params;
    const exists = await MessageModel.existsByDiscordMessageId(discordMessageId);
    res.json({ exists });
  } catch (error) {
    next(error);
  }
});

router.post('/incoming', async (req, res, next) => {
  try {
    const { discord_id, content, discord_message_id, sender_name } = req.body;

    if (!discord_id || !content) {
      return res.status(400).json({ error: 'discord_id y content son requeridos' });
    }

    const lead = await MessageModel.getByDiscordId(discord_id);
    
    if (!lead) {
      Logger.warning('DM recibido de usuario sin lead asociado', { discord_id }, req);
      return res.status(404).json({ error: 'Lead no encontrado para este discord_id' });
    }

    const message = await MessageModel.create({
      lead_id: lead.id,
      discord_message_id,
      content,
      sender_type: 'user',
      sender_name
    });

    Logger.info('Mensaje DM entrante guardado', { 
      leadId: lead.id, 
      messageId: message.id,
      sender: sender_name 
    }, req);

    res.json(message);
  } catch (error) {
    next(error);
  }
});

router.get('/:leadId', async (req, res, next) => {
  try {
    const leadId = parseInt(req.params.leadId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const messages = await MessageModel.getByLeadId(leadId, limit);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

router.post('/:leadId/send', async (req, res, next) => {
  try {
    const leadId = parseInt(req.params.leadId);
    const { content, sender_name } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content es requerido' });
    }

    const lead = await LeadModel.getById(leadId);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead no encontrado' });
    }

    if (!lead.discord_id) {
      return res.status(400).json({ error: 'Este lead no tiene discord_id asociado' });
    }

    const message = await MessageModel.create({
      lead_id: leadId,
      content,
      sender_type: 'admin',
      sender_name: sender_name || 'Admin'
    });

    try {
      const discordMessageId = await BotService.sendDM(lead.discord_id, content);
      await MessageModel.updateDiscordId(message.id, discordMessageId);
      
      Logger.info('Mensaje enviado via DM', { 
        leadId, 
        messageId: message.id,
        discordMessageId 
      }, req);
      
      res.json({ ...message, discord_message_id: discordMessageId });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      await MessageModel.markError(message.id, errorMsg);
      
      Logger.error('Error al enviar DM', { 
        leadId, 
        messageId: message.id,
        error: errorMsg 
      }, undefined, req);
      
      return res.status(500).json({ 
        error: 'Error al enviar DM', 
        message: errorMsg,
        messageId: message.id
      });
    }
  } catch (error) {
    next(error);
  }
});

router.get('/:leadId/unread', async (req, res, next) => {
  try {
    const leadId = parseInt(req.params.leadId);
    const count = await MessageModel.getUnreadCount(leadId);
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

router.patch('/:leadId/mark-read', async (req, res, next) => {
  try {
    const leadId = parseInt(req.params.leadId);
    await MessageModel.markAsRead(leadId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
