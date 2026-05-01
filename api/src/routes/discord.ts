import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

const BOT_CACHE_FILE = path.join(__dirname, '../../.discord-members-cache.json');

interface DiscordMember {
  id: string;
  username: string;
  tag: string;
  avatar: string | null;
  joinedAt: string;
}

router.get('/members', async (req: Request, res: Response) => {
  try {
    if (fs.existsSync(BOT_CACHE_FILE)) {
      const cacheData = fs.readFileSync(BOT_CACHE_FILE, 'utf-8');
      const cache = JSON.parse(cacheData);
      
      const lastUpdate = new Date(cache.lastUpdate);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;
      
      if (diffMinutes < 5) {
        return res.json(cache.members);
      }
    }
    
    return res.json([]);
  } catch (error) {
    console.error('Error obteniendo miembros de Discord:', error);
    res.status(500).json({ error: 'Error al obtener miembros del servidor' });
  }
});

export default router;
