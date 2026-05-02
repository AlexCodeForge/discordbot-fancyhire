import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import leadsRouter from './routes/leads';
import authRouter from './routes/auth';
import logsRouter from './routes/logs';
import systemRouter from './routes/system';
import discordRouter from './routes/discord';
import botRouter from './routes/bot';
import messagesRouter from './routes/messages';
import channelsRouter from './routes/channels';
import channelMessagesRouter from './routes/channelMessages';
import ticketsRouter from './routes/tickets';
import announcementsRouter from './routes/announcements';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

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
    const { DiscordMemberModel } = await import('./models/DiscordMemberModel');
    await DiscordMemberModel.upsert(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sincronizando miembro:', error);
    res.status(500).json({ error: 'Error al sincronizar miembro' });
  }
});

app.get('/api/announcements/by-message/:messageId', async (req, res) => {
  try {
    const { AnnouncementModel } = await import('./models/Announcement');
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
    const { AnnouncementReactionModel } = await import('./models/AnnouncementReaction');
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
    const { TicketMessageModel } = await import('./models/TicketMessage');
    const { TicketModel } = await import('./models/Ticket');
    
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

app.use('/api/leads', authMiddleware, leadsRouter);
app.use('/api/messages', authMiddleware, messagesRouter);
app.use('/api/channels', authMiddleware, channelMessagesRouter);
app.use('/api/channels', authMiddleware, channelsRouter);
app.use('/api/logs', authMiddleware, logsRouter);
app.use('/api/system', authMiddleware, systemRouter);
app.use('/api/discord', authMiddleware, discordRouter);
app.use('/api/tickets', authMiddleware, ticketsRouter);
app.use('/api/announcements', authMiddleware, announcementsRouter);

app.use(errorHandler);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`API corriendo en localhost:${PORT}`);
});
