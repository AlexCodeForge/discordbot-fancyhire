import { Router, Request, Response } from 'express';
import { pool } from '../shared/database/database';
import fs from 'fs';
import path from 'path';

const router = Router();

const BOT_STATUS_FILE = path.join(__dirname, '../../.bot-status.json');

interface BotStatus {
  connected: boolean;
  username?: string;
  lastUpdate: string;
}

router.get('/status', async (req: Request, res: Response) => {
  const status = {
    api: true,
    database: false,
    leadsCount: 0,
    bot: false,
    botUsername: null as string | null,
  };

  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM leads');
    status.database = true;
    status.leadsCount = parseInt(result.rows[0].count);
  } catch (error) {
    console.error('Error verificando base de datos:', error);
  }

  try {
    if (fs.existsSync(BOT_STATUS_FILE)) {
      const botStatusData = fs.readFileSync(BOT_STATUS_FILE, 'utf-8');
      const botStatus: BotStatus = JSON.parse(botStatusData);
      
      const lastUpdate = new Date(botStatus.lastUpdate);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;
      
      if (diffMinutes < 2 && botStatus.connected) {
        status.bot = true;
        status.botUsername = botStatus.username || null;
      }
    }
  } catch (error) {
    console.error('Error leyendo estado del bot:', error);
  }

  res.json(status);
});

export default router;
