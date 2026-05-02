import { Router } from 'express';
import { AnnouncementModel } from '../models/Announcement';
import { AnnouncementService } from '../services/announcementService';
import { Logger } from '../utils/Logger';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const embedData = req.body;
    const createdBy = (req as any).user?.username || 'unknown';
    
    const announcement = await AnnouncementModel.create(embedData, createdBy);
    Logger.info('Announcement created', { announcementId: announcement.id, createdBy }, req);
    res.status(201).json(announcement);
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

    if (result.success) {
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
