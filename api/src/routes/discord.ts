import { Router, Request, Response } from 'express';
import { DiscordMemberModel } from '../models/DiscordMemberModel';
import { Logger } from '../utils/Logger';

const router = Router();

router.get('/members', async (req: Request, res: Response) => {
  try {
    const members = await DiscordMemberModel.getAll();
    res.json(members);
  } catch (error) {
    Logger.error(
      'Error obteniendo miembros de Discord',
      {},
      error instanceof Error ? error : new Error(String(error)),
      req
    );
    res.status(500).json({ error: 'Error al obtener miembros del servidor' });
  }
});

router.get('/members/stats', async (req: Request, res: Response) => {
  try {
    const stats = await DiscordMemberModel.getStats();
    res.json(stats);
  } catch (error) {
    Logger.error(
      'Error obteniendo estadísticas de miembros',
      {},
      error instanceof Error ? error : new Error(String(error)),
      req
    );
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/roles', async (req: Request, res: Response) => {
  try {
    const roles = await DiscordMemberModel.getRoles();
    res.json(roles);
  } catch (error) {
    Logger.error(
      'Error obteniendo roles de Discord',
      {},
      error instanceof Error ? error : new Error(String(error)),
      req
    );
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
    Logger.error(
      'Error eliminando miembro de Discord',
      {},
      error instanceof Error ? error : new Error(String(error)),
      req
    );
    res.status(500).json({ error: 'Error al eliminar miembro' });
  }
});

router.get('/guilds', async (req: Request, res: Response) => {
  try {
    const axios = await import('axios');
    const response = await axios.default.get(`${process.env.BOT_URL}/guilds`);
    res.json(response.data);
  } catch (error) {
    Logger.error(
      'Error obteniendo servidores',
      {},
      error instanceof Error ? error : new Error(String(error)),
      req
    );
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
    Logger.error(
      'Error obteniendo roles del servidor',
      {},
      error instanceof Error ? error : new Error(String(error)),
      req
    );
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
    Logger.error(
      'Error actualizando roles del miembro',
      {},
      error instanceof Error ? error : new Error(String(error)),
      req
    );
    res.status(500).json({ error: 'Error al actualizar roles' });
  }
});

router.post('/roles', async (req: Request, res: Response) => {
  try {
    const { guildId, name, color, permissions, hoist, mentionable } = req.body;
    
    if (!guildId || !name) {
      return res.status(400).json({ error: 'guildId and name are required' });
    }
    
    Logger.info('Creando rol en Discord', { guildId, name }, req);
    
    const axios = await import('axios');
    const response = await axios.default.post(`${process.env.BOT_URL}/create-role`, {
      guildId,
      name,
      color,
      permissions,
      hoist,
      mentionable
    });
    
    Logger.info('Rol creado exitosamente', { roleId: response.data.role?.id }, req);
    res.json(response.data);
  } catch (error: any) {
    Logger.error(
      'Error creando rol',
      { guildId: req.body.guildId },
      error instanceof Error ? error : new Error(String(error)),
      req
    );
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || 'Error al crear rol',
      message: error.response?.data?.message || error.message
    });
  }
});

router.patch('/roles/:roleId', async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { guildId, name, color, permissions, hoist, mentionable } = req.body;
    
    if (!guildId) {
      return res.status(400).json({ error: 'guildId is required' });
    }
    
    Logger.info('Actualizando rol en Discord', { roleId, guildId }, req);
    
    const axios = await import('axios');
    const response = await axios.default.patch(`${process.env.BOT_URL}/roles/${roleId}`, {
      guildId,
      name,
      color,
      permissions,
      hoist,
      mentionable
    });
    
    Logger.info('Rol actualizado exitosamente', { roleId }, req);
    res.json(response.data);
  } catch (error: any) {
    Logger.error(
      'Error actualizando rol',
      { roleId: req.params.roleId },
      error instanceof Error ? error : new Error(String(error)),
      req
    );
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || 'Error al actualizar rol',
      message: error.response?.data?.message || error.message
    });
  }
});

router.delete('/roles/:roleId', async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { guildId } = req.body;
    
    if (!guildId) {
      return res.status(400).json({ error: 'guildId is required' });
    }
    
    Logger.info('Eliminando rol en Discord', { roleId, guildId }, req);
    
    const axios = await import('axios');
    const response = await axios.default.delete(`${process.env.BOT_URL}/roles/${roleId}`, {
      data: { guildId }
    });
    
    Logger.info('Rol eliminado exitosamente', { roleId }, req);
    res.json(response.data);
  } catch (error: any) {
    Logger.error(
      'Error eliminando rol',
      { roleId: req.params.roleId },
      error instanceof Error ? error : new Error(String(error)),
      req
    );
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || 'Error al eliminar rol',
      message: error.response?.data?.message || error.message
    });
  }
});

router.put('/roles/:roleId/position', async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { guildId, position } = req.body;
    
    if (!guildId || position === undefined) {
      return res.status(400).json({ error: 'guildId and position are required' });
    }
    
    Logger.info('Reordenando rol en Discord', { roleId, guildId, position }, req);
    
    const axios = await import('axios');
    const response = await axios.default.put(`${process.env.BOT_URL}/roles/${roleId}/position`, {
      guildId,
      position
    });
    
    Logger.info('Rol reordenado exitosamente', { roleId, position }, req);
    res.json(response.data);
  } catch (error: any) {
    Logger.error(
      'Error reordenando rol',
      { roleId: req.params.roleId },
      error instanceof Error ? error : new Error(String(error)),
      req
    );
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || 'Error al reordenar rol',
      message: error.response?.data?.message || error.message
    });
  }
});

router.get('/roles/:roleId/members-count', async (req: Request, res: Response) => {
  try {
    const { roleId } = req.params;
    const { guildId } = req.query;
    
    if (!guildId) {
      return res.status(400).json({ error: 'guildId is required' });
    }
    
    const axios = await import('axios');
    const response = await axios.default.get(
      `${process.env.BOT_URL}/roles/${roleId}/members-count?guildId=${guildId}`
    );
    
    res.json(response.data);
  } catch (error: any) {
    Logger.error(
      'Error obteniendo contador de miembros del rol',
      { roleId: req.params.roleId },
      error instanceof Error ? error : new Error(String(error)),
      req
    );
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || 'Error al obtener contador',
      message: error.response?.data?.message || error.message
    });
  }
});

export default router;
