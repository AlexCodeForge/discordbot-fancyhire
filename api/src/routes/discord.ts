import { Router, Request, Response } from 'express';
import { DiscordMemberModel } from '../models/DiscordMemberModel';
import { Logger } from '../utils/Logger';

const router = Router();

router.get('/members', async (req: Request, res: Response) => {
  try {
    const members = await DiscordMemberModel.getAll();
    res.json(members);
  } catch (error) {
    Logger.error('Error obteniendo miembros de Discord', error, req);
    res.status(500).json({ error: 'Error al obtener miembros del servidor' });
  }
});

router.get('/members/stats', async (req: Request, res: Response) => {
  try {
    const stats = await DiscordMemberModel.getStats();
    res.json(stats);
  } catch (error) {
    Logger.error('Error obteniendo estadísticas de miembros', error, req);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/roles', async (req: Request, res: Response) => {
  try {
    const roles = await DiscordMemberModel.getRoles();
    res.json(roles);
  } catch (error) {
    Logger.error('Error obteniendo roles de Discord', error, req);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
});

router.delete('/members/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await DiscordMemberModel.delete(id);
    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Miembro no encontrado' });
    }
  } catch (error) {
    Logger.error('Error eliminando miembro de Discord', error, req);
    res.status(500).json({ error: 'Error al eliminar miembro' });
  }
});

router.get('/guilds', async (req: Request, res: Response) => {
  try {
    const axios = await import('axios');
    const response = await axios.default.get(`${process.env.BOT_URL}/guilds`);
    res.json(response.data);
  } catch (error) {
    Logger.error('Error obteniendo servidores', error, req);
    res.status(500).json({ error: 'Error al obtener servidores' });
  }
});

router.get('/guilds/:guildId/roles', async (req: Request, res: Response) => {
  try {
    const { guildId } = req.params;
    const axios = await import('axios');
    const response = await axios.default.get(`${process.env.BOT_URL}/guilds/${guildId}/roles`);
    res.json(response.data);
  } catch (error) {
    Logger.error('Error obteniendo roles del servidor', error, req);
    res.status(500).json({ error: 'Error al obtener roles del servidor' });
  }
});

router.post('/members/:memberId/roles', async (req: Request, res: Response) => {
  try {
    const { memberId } = req.params;
    const { guildId, roleIds } = req.body;
    
    if (!guildId || !roleIds) {
      return res.status(400).json({ error: 'guildId y roleIds son requeridos' });
    }
    
    const axios = await import('axios');
    const response = await axios.default.post(`${process.env.BOT_URL}/update-roles`, {
      memberId,
      guildId,
      roleIds
    });
    
    res.json(response.data);
  } catch (error) {
    Logger.error('Error actualizando roles del miembro', error, req);
    res.status(500).json({ error: 'Error al actualizar roles' });
  }
});

export default router;
