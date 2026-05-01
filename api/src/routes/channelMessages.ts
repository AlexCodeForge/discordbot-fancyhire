import { Router } from 'express';
import { ChannelModel } from '../models/Channel';
import { ChannelMessageModel } from '../models/ChannelMessage';
import { ChannelService } from '../services/channelService';
import { Logger } from '../utils/Logger';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const MESSAGE_LIST_LIMIT = 100;

router.get('/messages/check/:discordMessageId', async (req, res, next) => {
  try {
    const { discordMessageId } = req.params;
    const exists = await ChannelMessageModel.exists(discordMessageId);
    res.json({ exists });
  } catch (error) {
    next(error);
  }
});

router.post('/messages/incoming', async (req, res, next) => {
  try {
    const {
      discord_channel_id,
      discord_message_id,
      author_id,
      author_name,
      author_avatar,
      content,
      mentions,
      sent_at,
    } = req.body;

    if (!discord_channel_id || !discord_message_id || !author_id || !content) {
      return res.status(400).json({
        error:
          'discord_channel_id, discord_message_id, author_id y content son requeridos',
      });
    }

    if (!author_name) {
      return res.status(400).json({ error: 'author_name es requerido' });
    }

    const channel = await ChannelModel.getByDiscordId(discord_channel_id);

    if (!channel) {
      Logger.warning(
        'Mensaje de canal entrante sin canal en BD',
        { discord_channel_id },
        req
      );
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    const message = await ChannelMessageModel.create({
      channel_id: channel.id,
      discord_message_id,
      author_id,
      author_name,
      author_avatar,
      content,
      mentions: Array.isArray(mentions) ? mentions : [],
      sent_at: sent_at ? new Date(sent_at) : null,
    });

    Logger.info(
      'Mensaje de canal entrante guardado',
      { channelId: channel.id, messageId: message.id, discord_message_id },
      req
    );

    res.json(message);
  } catch (error) {
    next(error);
  }
});

router.patch('/messages/:discordMessageId/delete', async (req, res, next) => {
  try {
    const { discordMessageId } = req.params;

    await ChannelMessageModel.softDelete(discordMessageId);

    Logger.info('Mensaje de canal marcado eliminado (webhook)', { discordMessageId }, req);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.patch('/messages/:discordMessageId', async (req, res, next) => {
  try {
    const { discordMessageId } = req.params;
    const { content } = req.body;

    if (content === undefined || content === null) {
      return res.status(400).json({ error: 'content es requerido' });
    }

    await ChannelMessageModel.update(discordMessageId, String(content));

    Logger.info('Mensaje de canal actualizado (webhook)', { discordMessageId }, req);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/:channelId/messages/send', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const channelId = parseInt(req.params.channelId, 10);

    if (Number.isNaN(channelId)) {
      return res.status(400).json({ error: 'channelId inválido' });
    }

    const { content, mentions } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'content es requerido' });
    }

    const channel = await ChannelModel.getById(channelId);

    if (!channel) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    const mentionList = Array.isArray(mentions) ? mentions : [];

    const discordMessageId = await ChannelService.sendMessage(
      channel.discord_channel_id,
      content,
      mentionList
    );

    const message = await ChannelMessageModel.create({
      channel_id: channelId,
      discord_message_id: discordMessageId,
      author_id: req.user?.username || 'admin',
      author_name: req.user?.username || 'Admin',
      content,
      mentions: mentionList,
    });

    Logger.info(
      'Mensaje de canal enviado',
      { channelId, messageId: message.id, discordMessageId },
      req
    );

    res.json({ ...message, discord_message_id: discordMessageId });
  } catch (error) {
    next(error);
  }
});

router.delete(
  '/:channelId/messages/:discordMessageId',
  authMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const channelId = parseInt(req.params.channelId, 10);
      const { discordMessageId } = req.params;

      if (Number.isNaN(channelId)) {
        return res.status(400).json({ error: 'channelId inválido' });
      }

      const channel = await ChannelModel.getById(channelId);

      if (!channel) {
        return res.status(404).json({ error: 'Canal no encontrado' });
      }

      await ChannelService.deleteMessage(channel.discord_channel_id, discordMessageId);
      await ChannelMessageModel.softDelete(discordMessageId);

      Logger.info(
        'Mensaje de canal eliminado vía API',
        { channelId, discordMessageId },
        req
      );

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:channelId/messages', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const channelId = parseInt(req.params.channelId, 10);

    if (Number.isNaN(channelId)) {
      return res.status(400).json({ error: 'channelId inválido' });
    }

    const channel = await ChannelModel.getById(channelId);

    if (!channel) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    const limitRaw = req.query.limit ? parseInt(String(req.query.limit), 10) : MESSAGE_LIST_LIMIT;
    const limit = Math.min(
      Number.isNaN(limitRaw) ? MESSAGE_LIST_LIMIT : limitRaw,
      MESSAGE_LIST_LIMIT
    );

    const messages = await ChannelMessageModel.getByChannel(channelId, limit);

    Logger.info('Mensajes de canal listados', { channelId, count: messages.length }, req);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

export default router;
