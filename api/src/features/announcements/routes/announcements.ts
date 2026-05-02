import { Router } from 'express';
import { AnnouncementModel } from '../models/Announcement';
import { AnnouncementTemplateModel } from '../models/AnnouncementTemplate';
import { AnnouncementReactionModel } from '../models/AnnouncementReaction';
import { AnnouncementCategoryModel } from '../models/AnnouncementCategory';
import { AnnouncementService } from '../services/announcementService';
import { Logger } from '../../../shared/utils/Logger';
import { pool } from '../../../shared/database/database';

const router = Router();

router.get('/templates', async (req, res, next) => {
  try {
    const templates = await AnnouncementTemplateModel.getAll();
    res.json(templates);
  } catch (error) {
    Logger.error('Error fetching announcement templates', { error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.post('/templates', async (req, res, next) => {
  try {
    const { name, embedData } = req.body;
    const createdBy = (req as any).user?.username || 'unknown';

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const template = await AnnouncementTemplateModel.create(name, embedData, createdBy);
    Logger.info('Announcement template created', { templateId: template.id, name, createdBy }, req);
    res.status(201).json(template);
  } catch (error) {
    Logger.error('Error creating announcement template', { error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.put('/templates/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const embedData = req.body;

    const template = await AnnouncementTemplateModel.update(id, embedData);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    Logger.info('Announcement template updated', { templateId: id }, req);
    res.json(template);
  } catch (error) {
    Logger.error('Error updating announcement template', { id: req.params.id, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.delete('/templates/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await AnnouncementTemplateModel.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Template not found' });
    }

    Logger.info('Announcement template deleted', { templateId: id }, req);
    res.json({ success: true });
  } catch (error) {
    Logger.error('Error deleting announcement template', { id: req.params.id, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await AnnouncementCategoryModel.getAll();
    res.json(categories);
  } catch (error) {
    Logger.error('Error fetching announcement categories', { error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.post('/categories', async (req, res, next) => {
  try {
    const { name, color, description } = req.body;
    const createdBy = (req as any).user?.username || 'unknown';

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const category = await AnnouncementCategoryModel.create(name, color, description, createdBy);
    Logger.info('Announcement category created', { categoryId: category.id, name, createdBy }, req);
    res.status(201).json(category);
  } catch (error) {
    Logger.error('Error creating announcement category', { error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.put('/categories/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { name, color, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const category = await AnnouncementCategoryModel.update(id, name, color, description);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    Logger.info('Announcement category updated', { categoryId: id }, req);
    res.json(category);
  } catch (error) {
    Logger.error('Error updating announcement category', { id: req.params.id, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.delete('/categories/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await AnnouncementCategoryModel.delete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }

    Logger.info('Announcement category deleted', { categoryId: id }, req);
    res.json({ success: true });
  } catch (error) {
    Logger.error('Error deleting announcement category', { id: req.params.id, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.post('/reactions', async (req, res, next) => {
  try {
    const { announcementId, emoji, userId, userName, action } = req.body;

    if (!announcementId || !emoji || !userId || !action) {
      return res.status(400).json({ error: 'announcementId, emoji, userId, and action are required' });
    }

    if (action === 'add') {
      const reaction = await AnnouncementReactionModel.addReaction(announcementId, emoji, userId, userName);
      res.status(201).json(reaction);
    } else if (action === 'remove') {
      await AnnouncementReactionModel.removeReaction(announcementId, emoji, userId);
      res.json({ success: true });
    } else {
      return res.status(400).json({ error: 'Invalid action. Must be "add" or "remove"' });
    }
  } catch (error) {
    Logger.error('Error handling reaction', { error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { embedData, templateId, categoryId } = req.body;
    const createdBy = (req as any).user?.username || 'unknown';
    
    const result = await pool.query(
      `INSERT INTO announcements 
       (title, description, color, thumbnail_url, image_url, footer_text, 
        footer_icon_url, author_name, author_icon_url, url, created_by, template_id, category_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft')
       RETURNING *`,
      [
        embedData.title || null,
        embedData.description || null,
        embedData.color || null,
        embedData.thumbnail_url || null,
        embedData.image_url || null,
        embedData.footer_text || null,
        embedData.footer_icon_url || null,
        embedData.author_name || null,
        embedData.author_icon_url || null,
        embedData.url || null,
        createdBy,
        templateId || null,
        categoryId || null
      ]
    );
    
    Logger.info('Announcement created', { announcementId: result.rows[0].id, createdBy }, req);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    Logger.error('Error creating announcement', { error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const announcements = await AnnouncementModel.getAll();
    res.json(announcements);
  } catch (error) {
    Logger.error('Error fetching announcements', { error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const announcement = await AnnouncementModel.getById(id);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (error) {
    Logger.error('Error fetching announcement by id', { id: req.params.id, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const embedData = req.body;

    const currentAnnouncement = await AnnouncementModel.getById(id);
    if (!currentAnnouncement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Actualizar en la base de datos (sin restricción de status)
    const result = await pool.query(
      `UPDATE announcements 
       SET title = $1, description = $2, color = $3, thumbnail_url = $4, 
           image_url = $5, footer_text = $6, footer_icon_url = $7, 
           author_name = $8, author_icon_url = $9, url = $10, category_id = $11
       WHERE id = $12
       RETURNING *`,
      [
        embedData.title || null,
        embedData.description || null,
        embedData.color || null,
        embedData.thumbnail_url || null,
        embedData.image_url || null,
        embedData.footer_text || null,
        embedData.footer_icon_url || null,
        embedData.author_name || null,
        embedData.author_icon_url || null,
        embedData.url || null,
        embedData.categoryId !== undefined ? embedData.categoryId : null,
        id
      ]
    );

    Logger.info('Announcement updated', { announcementId: id }, req);
    res.json(result.rows[0]);
  } catch (error) {
    Logger.error('Error updating announcement', { id: req.params.id, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    
    const announcement = await AnnouncementModel.getById(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (announcement.discord_message_id && announcement.discord_channel_id) {
      const deleteResult = await AnnouncementService.deleteMessage(
        announcement.discord_channel_id,
        announcement.discord_message_id
      );
      
      if (!deleteResult.success) {
        Logger.warning('Failed to delete Discord message', { announcementId: id, error: deleteResult.error }, req);
      }
    }

    await AnnouncementModel.softDelete(id);
    Logger.info('Announcement deleted', { announcementId: id }, req);
    res.json({ success: true });
  } catch (error) {
    Logger.error('Error deleting announcement', { id: req.params.id, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.get('/:id/stats', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const announcementWithStats = await AnnouncementModel.getWithStats(id);

    if (!announcementWithStats) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json(announcementWithStats);
  } catch (error) {
    Logger.error('Error fetching announcement stats', { id: req.params.id, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

router.post('/:id/send', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { channelId } = req.body;

    if (!channelId) {
      return res.status(400).json({ error: 'channelId is required' });
    }

    const announcement = await AnnouncementModel.getById(id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    const result = await AnnouncementService.sendEmbed(channelId, {
      title: announcement.title || undefined,
      description: announcement.description || undefined,
      color: announcement.color || undefined,
      url: announcement.url || undefined,
      thumbnail_url: announcement.thumbnail_url || undefined,
      image_url: announcement.image_url || undefined,
      footer_text: announcement.footer_text || undefined,
      footer_icon_url: announcement.footer_icon_url || undefined,
      author_name: announcement.author_name || undefined,
      author_icon_url: announcement.author_icon_url || undefined
    });

    if (result.success && result.messageId) {
      await AnnouncementModel.markAsSent(id, result.messageId, channelId);
      Logger.info('Announcement sent successfully', { announcementId: id, channelId, messageId: result.messageId }, req);
      res.json(result);
    } else {
      Logger.warning('Announcement send failed', { announcementId: id, channelId, error: result.error }, req);
      res.status(500).json(result);
    }
  } catch (error) {
    Logger.error('Error sending announcement', { id: req.params.id, error: (error as Error).message }, error as Error, req);
    next(error);
  }
});

export default router;
