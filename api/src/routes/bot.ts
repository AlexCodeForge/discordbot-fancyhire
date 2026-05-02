import { Router } from 'express';
import { LeadModel } from '../models/Lead';
import { AnnouncementService } from '../services/announcementService';
import { Logger } from '../utils/Logger';
import { pool } from '../models/database';

const router = Router();

router.post('/webhook/lead', async (req, res, next) => {
  try {
    const { discord_id } = req.body;
    
    if (discord_id) {
      const existingLead = await pool.query(
        'SELECT * FROM leads WHERE discord_id = $1',
        [discord_id]
      );
      
      if (existingLead.rows.length > 0) {
        Logger.info('Lead ya existe, omitiendo creación', { discordId: discord_id, leadId: existingLead.rows[0].id });
        return res.status(200).json({ 
          message: 'Lead ya existe', 
          lead: existingLead.rows[0] 
        });
      }
    }
    
    const lead = await LeadModel.create(req.body);
    Logger.info('Lead creado por bot', { leadId: lead.id, discordId: lead.discord_id });
    res.status(201).json(lead);
  } catch (error) {
    Logger.error('Error creando lead desde bot', { error: error instanceof Error ? error.message : 'Unknown' });
    next(error);
  }
});

router.patch('/edit-announcement', async (req, res, next) => {
  try {
    const { channelId, messageId, embedData } = req.body;

    if (!channelId || !messageId || !embedData) {
      return res.status(400).json({ error: 'channelId, messageId, and embedData are required' });
    }

    const result = await AnnouncementService.editEmbed(channelId, messageId, embedData);
    
    if (result.success) {
      Logger.info('Announcement edited in Discord', { channelId, messageId });
      res.json(result);
    } else {
      Logger.warning('Failed to edit announcement in Discord', { channelId, messageId, error: result.error });
      res.status(500).json(result);
    }
  } catch (error) {
    Logger.error('Error editing announcement', { error: error instanceof Error ? error.message : 'Unknown' });
    next(error);
  }
});

export default router;
