import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import leadsRouter from './features/leads/routes/leads';
import authRouter from './features/auth/routes/auth';
import logsRouter from './routes/logs';
import systemRouter from './routes/system';
import discordRouter from './features/discord/routes/discord';
import botRouter from './features/discord/routes/bot';
import messagesRouter from './features/leads/routes/messages';
import conversationsRouter from './features/leads/routes/conversations';
import channelsRouter from './features/channels/routes/channels';
import channelMessagesRouter from './features/channels/routes/channelMessages';
import ticketsRouter from './features/tickets/routes/tickets';
import announcementsRouter from './features/announcements/routes/announcements';
import forumRouter from './features/forums/routes/forum';
import autoMessagesRouter from './features/autoMessages/routes/autoMessages';
import settingsRouter from './features/settings/routes/settings';
import staffRouter from './features/staff/routes/staff';
import { errorHandler } from './shared/middleware/errorHandler';
import { authMiddleware } from './features/auth/middleware/auth';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());
app.use('/transcripts', express.static(path.join(__dirname, '../transcripts')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/bot', botRouter);

app.post('/api/discord/members/sync', async (req, res) => {
  try {
    const { DiscordMemberModel } = await import('./features/discord/models/DiscordMemberModel');
    await DiscordMemberModel.upsert(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sincronizando miembro:', error);
    res.status(500).json({ error: 'Error al sincronizar miembro' });
  }
});

app.get('/api/announcements/by-message/:messageId', async (req, res) => {
  try {
    const { AnnouncementModel } = await import('./features/announcements/models/Announcement');
    const { messageId } = req.params;
    
    const result = await AnnouncementModel.getByMessageId(messageId);
    
    if (!result) {
      return res.status(404).json({ error: 'Anuncio no encontrado' });
    }
    
    res.json({ announcementId: result.id });
  } catch (error) {
    console.error('Error fetching announcement by message ID:', error);
    res.status(500).json({ error: 'Error al buscar anuncio' });
  }
});

app.post('/api/announcements/reactions/bot', async (req, res) => {
  try {
    const { AnnouncementReactionModel } = await import('./features/announcements/models/AnnouncementReaction');
    const { announcementId, emoji, userId, userName, action } = req.body;

    if (!announcementId || !emoji || !userId || !action) {
      return res.status(400).json({ error: 'announcementId, emoji, userId, and action are required' });
    }

    if (action === 'add') {
      const reaction = await AnnouncementReactionModel.addReaction(announcementId, emoji, userId, userName);
      return res.status(201).json(reaction);
    } else if (action === 'remove') {
      await AnnouncementReactionModel.removeReaction(announcementId, emoji, userId);
      return res.json({ success: true });
    } else {
      return res.status(400).json({ error: 'Invalid action. Must be "add" or "remove"' });
    }
  } catch (error) {
    console.error('Error handling bot reaction:', error);
    res.status(500).json({ error: 'Error al procesar reacción' });
  }
});

app.post('/api/tickets/messages/incoming', async (req, res) => {
  try {
    const { TicketMessageModel } = await import('./features/tickets/models/TicketMessage');
    const { TicketModel } = await import('./features/tickets/models/Ticket');
    
    const { discord_channel_id, discord_message_id, author_id, author_name, content, sent_at } = req.body;

    if (!discord_channel_id || !discord_message_id || !author_id || !content) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const ticket = await TicketModel.getByChannelId(discord_channel_id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado para este canal' });
    }

    const exists = await TicketMessageModel.exists(discord_message_id);
    if (exists) {
      return res.status(200).json({ message: 'Mensaje ya registrado' });
    }

    const message = await TicketMessageModel.create({
      ticket_id: ticket.id,
      discord_message_id,
      author_id,
      author_name: author_name || 'Usuario',
      content,
      sent_at: sent_at ? new Date(sent_at) : null,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Error procesando mensaje de ticket:', error);
    res.status(500).json({ error: 'Error al sincronizar mensaje' });
  }
});

// Bot webhooks (sin autenticación)
app.use('/api/messages', messagesRouter);

// Rutas protegidas con autenticación
app.use('/api/leads', authMiddleware, leadsRouter);
app.use('/api/conversations', authMiddleware, conversationsRouter);

// Webhook del bot para sincronizar canales - sin autenticación
app.post('/api/bot/channels/sync', async (req, res, next) => {
  try {
    const {
      discord_channel_id,
      name,
      type,
      position,
      parent_id,
      topic,
    } = req.body;

    if (!discord_channel_id || !name || type === undefined || type === null) {
      return res.status(400).json({
        error: 'discord_channel_id, name y type son requeridos',
      });
    }

    const { ChannelModel } = await import('./features/channels/models/Channel.js');
    const channel = await ChannelModel.upsert({
      discord_channel_id,
      name,
      type: String(type),
      position,
      parent_id,
      topic,
    });

    res.json(channel);
  } catch (error) {
    next(error);
  }
});

// Webhook del bot para eliminar canales - sin autenticación  
app.delete('/api/bot/channels/:channelId', async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { ChannelModel } = await import('./features/channels/models/Channel.js');
    await ChannelModel.delete(channelId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Webhook del bot para limpiar canales obsoletos - sin autenticación
app.post('/api/bot/channels/cleanup', async (req, res, next) => {
  try {
    const { validChannelIds } = req.body;
    
    if (!Array.isArray(validChannelIds)) {
      return res.status(400).json({ error: 'validChannelIds debe ser un array' });
    }

    const { ChannelModel } = await import('./features/channels/models/Channel.js');
    const { pool } = await import('./shared/database/database.js');
    
    // Obtener todos los canales actuales en BD
    const allChannels = await ChannelModel.getAll();
    
    // Identificar canales que ya no existen en Discord
    const obsoleteChannels = allChannels.filter(
      channel => !validChannelIds.includes(channel.discord_channel_id)
    );
    
    // Eliminar canales obsoletos
    let deletedCount = 0;
    for (const channel of obsoleteChannels) {
      try {
        await ChannelModel.delete(channel.discord_channel_id);
        deletedCount++;
        console.log(`Canal obsoleto eliminado: ${channel.name} (${channel.discord_channel_id})`);
      } catch (err) {
        console.error(`Error eliminando canal ${channel.discord_channel_id}:`, err);
      }
    }
    
    res.json({ 
      success: true, 
      deletedCount,
      obsoleteChannels: obsoleteChannels.map(c => ({
        id: c.discord_channel_id,
        name: c.name
      }))
    });
  } catch (error) {
    next(error);
  }
});

// Webhook del bot para verificar mensajes - sin autenticación
app.get('/api/bot/channels/messages/check/:discordMessageId', async (req, res, next) => {
  try {
    const { discordMessageId } = req.params;
    const { ChannelMessageModel } = await import('./features/channels/models/ChannelMessage.js');
    const exists = await ChannelMessageModel.exists(discordMessageId);
    res.json({ exists });
  } catch (error) {
    next(error);
  }
});

// Webhook del bot para mensajes entrantes de canales - sin autenticación
app.post('/api/bot/channels/messages/incoming', async (req, res, next) => {
  try {
    const {
      discord_channel_id,
      discord_message_id,
      author_id,
      author_name,
      author_avatar,
      content,
      mentions,
      sent_at,
    } = req.body;

    if (!discord_channel_id || !discord_message_id || !author_id || !content) {
      return res.status(400).json({
        error: 'discord_channel_id, discord_message_id, author_id y content son requeridos',
      });
    }

    const { ChannelModel } = await import('./features/channels/models/Channel.js');
    const { ChannelMessageModel } = await import('./features/channels/models/ChannelMessage.js');

    const channel = await ChannelModel.getByDiscordId(discord_channel_id);

    if (!channel) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    const message = await ChannelMessageModel.create({
      channel_id: channel.id,
      discord_message_id,
      author_id,
      author_name,
      author_avatar,
      content,
      mentions: Array.isArray(mentions) ? mentions : [],
      sent_at: sent_at ? new Date(sent_at) : null,
    });

    res.json(message);
  } catch (error) {
    next(error);
  }
});

// Webhook del bot para eliminar mensajes - sin autenticación
app.patch('/api/bot/channels/messages/:discordMessageId/delete', async (req, res, next) => {
  try {
    const { discordMessageId } = req.params;
    const { ChannelMessageModel } = await import('./features/channels/models/ChannelMessage.js');
    await ChannelMessageModel.softDelete(discordMessageId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Webhook del bot para actualizar mensajes - sin autenticación
app.patch('/api/bot/channels/messages/:discordMessageId', async (req, res, next) => {
  try {
    const { discordMessageId } = req.params;
    const { content } = req.body;

    if (content === undefined || content === null) {
      return res.status(400).json({ error: 'content es requerido' });
    }

    const { ChannelMessageModel } = await import('./features/channels/models/ChannelMessage.js');
    await ChannelMessageModel.update(discordMessageId, String(content));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

app.use('/api/channels', authMiddleware, channelMessagesRouter);
app.use('/api/channels', authMiddleware, channelsRouter);
app.use('/api/forum', forumRouter);
app.use('/api/logs', authMiddleware, logsRouter);
app.use('/api/system', authMiddleware, systemRouter);
app.use('/api/discord', authMiddleware, discordRouter);
app.use('/api/tickets', authMiddleware, ticketsRouter);
app.use('/api/announcements', authMiddleware, announcementsRouter);
app.use('/api/auto-messages', authMiddleware, autoMessagesRouter);
app.use('/api/settings', authMiddleware, settingsRouter);
app.use('/api/staff', authMiddleware, staffRouter);

app.use(errorHandler);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`API corriendo en localhost:${PORT}`);
});
