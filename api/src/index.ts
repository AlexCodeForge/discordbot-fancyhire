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
app.use('/api/messages', messagesRouter);
app.use('/api/channels', channelMessagesRouter);
app.use('/api/channels', channelsRouter);

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
app.use('/api/logs', authMiddleware, logsRouter);
app.use('/api/system', authMiddleware, systemRouter);
app.use('/api/discord', authMiddleware, discordRouter);
app.use('/api/tickets', authMiddleware, ticketsRouter);

app.use(errorHandler);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`API corriendo en localhost:${PORT}`);
});
