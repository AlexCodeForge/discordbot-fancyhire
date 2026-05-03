import { Router } from 'express';
import { ChannelModel } from '../models/Channel';
import { ChannelService } from '../services/channelService';
import { Logger } from '../../../shared/utils/Logger';

const router = Router();

function isDiscordSnowflake(value: string): boolean {
  return /^\d{17,20}$/.test(value);
}

router.get('/', async (req, res, next) => {
  try {
    const channels = await ChannelModel.getAllWithTicketInfo();
    Logger.info('Canales listados con info de tickets', { count: channels.length }, req);
    res.json(channels);
  } catch (error) {
    next(error);
  }
});

router.post('/sync', async (req, res, next) => {
  try {
    const {
      discord_channel_id,
      name,
      type,
      position,
      parent_id,
      topic,
    } = req.body;

    if (!discord_channel_id || !name || type === undefined || type === null) {
      return res.status(400).json({
        error: 'discord_channel_id, name y type son requeridos',
      });
    }

    const channel = await ChannelModel.upsert({
      discord_channel_id,
      name,
      type,
      position,
      parent_id,
      topic,
    });

    Logger.info('Canal sincronizado (webhook)', { discord_channel_id }, req);
    res.json(channel);
  } catch (error) {
    next(error);
  }
});

router.delete('/:discordChannelId/delete', async (req, res, next) => {
  try {
    const { discordChannelId } = req.params;

    if (!isDiscordSnowflake(discordChannelId)) {
      return res.status(400).json({ error: 'discordChannelId inválido' });
    }

    await ChannelService.deleteChannel(discordChannelId);
    await ChannelModel.delete(discordChannelId);

    Logger.info('Canal eliminado vía API', { discordChannelId }, req);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:discordChannelId', async (req, res, next) => {
  try {
    const { discordChannelId } = req.params;

    if (!isDiscordSnowflake(discordChannelId)) {
      return res.status(400).json({ error: 'discordChannelId inválido' });
    }

    await ChannelModel.delete(discordChannelId);

    Logger.info('Canal eliminado (webhook)', { discordChannelId }, req);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/create', async (req, res, next) => {
  try {
    const { name, type, topic, parentId, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name es requerido' });
    }

    // Aceptar tanto parentId como parent_id
    const categoryId = parentId || parent_id;

    const discord_channel_id = await ChannelService.createChannel(
      name,
      type,
      topic,
      categoryId
    );

    Logger.info('Canal creado vía API', { name, discord_channel_id, parentId: categoryId }, req);
    res.json({ discord_channel_id });
  } catch (error) {
    next(error);
  }
});

router.patch('/move', async (req, res, next) => {
  try {
    const { channelIds, targetCategoryId } = req.body;

    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return res.status(400).json({ error: 'channelIds debe ser un array no vacío' });
    }

    await ChannelService.moveChannels(channelIds, targetCategoryId);

    Logger.info('Canales movidos vía API', { channelIds, targetCategoryId }, req);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
