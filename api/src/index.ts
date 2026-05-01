import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import leadsRouter from './routes/leads';
import authRouter from './routes/auth';
import logsRouter from './routes/logs';
import systemRouter from './routes/system';
import discordRouter from './routes/discord';
import botRouter from './routes/bot';
import messagesRouter from './routes/messages';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/bot', botRouter);
app.use('/api/messages', messagesRouter);

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

app.use('/api/leads', authMiddleware, leadsRouter);
app.use('/api/logs', authMiddleware, logsRouter);
app.use('/api/system', authMiddleware, systemRouter);
app.use('/api/discord', authMiddleware, discordRouter);

app.use(errorHandler);

app.listen(PORT, '127.0.0.1', () => {
  console.log(`API corriendo en localhost:${PORT}`);
});
