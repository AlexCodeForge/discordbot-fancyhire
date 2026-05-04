import { Router } from 'express';
import { SettingsModel } from '../models/SettingsModel';
import { Logger } from '../../../shared/utils/Logger';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const settings = await SettingsModel.getAll();
    res.json(settings);
  } catch (error) {
    Logger.error('Error fetching settings', error, req);
    res.status(500).json({ error: 'Error al obtener configuraciones' });
  }
});

router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await SettingsModel.get(key);
    
    if (!setting) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    
    res.json(setting);
  } catch (error) {
    Logger.error('Error fetching setting', error, req);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

router.patch('/', async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Key es requerido' });
    }
    
    const setting = await SettingsModel.update(key, value);
    Logger.info(`Setting updated: ${key}`, req);
    
    res.json(setting);
  } catch (error) {
    Logger.error('Error updating setting', error, req);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

export default router;
