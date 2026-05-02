import { Router } from 'express';
import { ForumThreadModel } from '../models/ForumThread';
import { ThreadMessageModel } from '../models/ThreadMessage';
import { ForumService } from '../services/forumService';
import { ChannelModel } from '../../channels/models/Channel';
import { Logger } from '../../../shared/utils/Logger';

const router = Router();

router.post('/threads/sync', async (req, res, next) => {
  try {
    const {
      discord_thread_id,
      discord_channel_id,
      name,
      owner_id,
      owner_name,
      archived,
      locked,
      message_count,
      member_count,
      start_message_id,
    } = req.body;

    if (!discord_thread_id || !discord_channel_id || !name) {
      return res.status(400).json({
        error: 'discord_thread_id, discord_channel_id y name son requeridos',
      });
    }

    const channel = await ChannelModel.getByDiscordId(discord_channel_id);
    if (!channel) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    const thread = await ForumThreadModel.upsert({
      discord_thread_id,
      channel_id: channel.id,
      name,
      owner_id: owner_id || 'unknown',
      owner_name: owner_name || 'Unknown',
      archived: archived || false,
      locked: locked || false,
      message_count: message_count || 0,
      member_count: member_count || 0,
      start_message_id: start_message_id || null,
    });

    Logger.info('Thread sincronizado', { discord_thread_id }, req);
    res.json(thread);
  } catch (error) {
    next(error);
  }
});

router.get('/threads/:channelId', async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const channelIdNum = parseInt(channelId, 10);

    if (isNaN(channelIdNum)) {
      return res.status(400).json({ error: 'channelId inválido' });
    }

    const threads = await ForumThreadModel.getByChannel(channelIdNum);
    Logger.info('Threads listados', { channelId: channelIdNum, count: threads.length }, req);
    res.json(threads);
  } catch (error) {
    next(error);
  }
});

router.get('/threads/:threadId/messages', async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const { limit } = req.query;
    const threadIdNum = parseInt(threadId, 10);
    const limitNum = limit ? parseInt(limit as string, 10) : 100;

    if (isNaN(threadIdNum)) {
      return res.status(400).json({ error: 'threadId inválido' });
    }

    const messages = await ThreadMessageModel.getByThread(threadIdNum, limitNum);
    Logger.info('Mensajes de thread listados', { threadId: threadIdNum, count: messages.length }, req);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

router.post('/threads/create', async (req, res, next) => {
  try {
    const { channelId, name, content, appliedTags, embedData, imageUrl } = req.body;

    if (!channelId || !name || !content) {
      return res.status(400).json({
        error: 'channelId, name y content son requeridos',
      });
    }

    const channel = await ChannelModel.getById(parseInt(channelId, 10));
    if (!channel) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    const discord_thread_id = await ForumService.createThread(
      channel.discord_channel_id,
      name,
      content,
      {
        appliedTags,
        embedData,
        imageUrl,
      }
    );

    Logger.info('Thread creado vía API', { name, discord_thread_id }, req);
    res.json({ discord_thread_id });
  } catch (error) {
    next(error);
  }
});

router.post('/threads/messages/incoming', async (req, res, next) => {
  try {
    const {
      discord_thread_id,
      discord_message_id,
      author_id,
      author_name,
      author_avatar,
      content,
      mentions,
      sent_at,
    } = req.body;

    if (!discord_thread_id || !discord_message_id || !content) {
      return res.status(400).json({
        error: 'discord_thread_id, discord_message_id y content son requeridos',
      });
    }

    const thread = await ForumThreadModel.getByDiscordThreadId(discord_thread_id);
    if (!thread) {
      return res.status(404).json({ error: 'Thread no encontrado' });
    }

    const exists = await ThreadMessageModel.exists(discord_message_id);
    if (exists) {
      // Si es el mensaje inicial (starter message), actualizarlo con el contenido correcto
      const isStarterMessage = thread.start_message_id === discord_message_id;
      if (isStarterMessage) {
        await ThreadMessageModel.update(discord_message_id, content);
        Logger.info('Mensaje inicial actualizado', { discord_message_id }, req);
        return res.status(200).json({ message: 'Mensaje inicial actualizado' });
      }
      return res.status(200).json({ message: 'Mensaje ya registrado' });
    }

    const message = await ThreadMessageModel.create({
      thread_id: thread.id,
      discord_message_id,
      author_id,
      author_name,
      author_avatar,
      content,
      mentions: mentions || [],
      sent_at: sent_at ? new Date(sent_at) : null,
    });

    Logger.info('Mensaje de thread registrado', { discord_message_id }, req);
    res.json(message);
  } catch (error) {
    next(error);
  }
});

router.post('/threads/messages/send', async (req, res, next) => {
  try {
    const { threadId, content, mentions } = req.body;

    if (!threadId || !content) {
      return res.status(400).json({
        error: 'threadId y content son requeridos',
      });
    }

    const thread = await ForumThreadModel.getById(parseInt(threadId, 10));
    if (!thread) {
      return res.status(404).json({ error: 'Thread no encontrado' });
    }

    const discord_message_id = await ForumService.sendThreadMessage(
      thread.discord_thread_id,
      content,
      mentions
    );

    Logger.info('Mensaje enviado a thread', { threadId, discord_message_id }, req);
    res.json({ discord_message_id });
  } catch (error) {
    next(error);
  }
});

router.patch('/threads/:threadId', async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const { name, content } = req.body;
    const threadIdNum = parseInt(threadId, 10);

    if (isNaN(threadIdNum)) {
      return res.status(400).json({ error: 'threadId inválido' });
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name es requerido' });
    }

    const thread = await ForumThreadModel.getById(threadIdNum);
    if (!thread) {
      return res.status(404).json({ error: 'Thread no encontrado' });
    }

    await ForumService.updateThread(
      thread.discord_thread_id,
      name.trim(),
      thread.start_message_id || undefined,
      content
    );

    Logger.info('Thread actualizado', { threadId: threadIdNum, name: name.trim() }, req);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/threads/:threadId', async (req, res, next) => {
  try {
    const { threadId } = req.params;
    const threadIdNum = parseInt(threadId, 10);

    if (isNaN(threadIdNum)) {
      return res.status(400).json({ error: 'threadId inválido' });
    }

    const thread = await ForumThreadModel.getById(threadIdNum);
    if (!thread) {
      return res.status(404).json({ error: 'Thread no encontrado' });
    }

    await ForumService.deleteThread(thread.discord_thread_id);
    await ForumThreadModel.delete(threadIdNum);

    Logger.info('Thread eliminado de Discord y BD', { threadId: threadIdNum, discord_thread_id: thread.discord_thread_id }, req);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/threads/force-sync', async (req, res, next) => {
  try {
    const { ForumService } = await import('../services/forumService');
    
    // Llamar al bot para forzar sincronización
    await axios.post('http://127.0.0.1:3005/force-sync-threads');
    
    Logger.info('Sincronización forzada de threads iniciada', {}, req);
    res.json({ success: true, message: 'Sincronización iniciada' });
  } catch (error) {
    next(error);
  }
});

router.post('/threads/cleanup', async (req, res, next) => {
  try {
    const { discord_channel_id, valid_thread_ids } = req.body;

    if (!discord_channel_id || !Array.isArray(valid_thread_ids)) {
      return res.status(400).json({ error: 'discord_channel_id y valid_thread_ids son requeridos' });
    }

    const channel = await ChannelModel.getByDiscordId(discord_channel_id);
    if (!channel) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }

    const allThreads = await ForumThreadModel.getByChannel(channel.id);
    let deletedCount = 0;

    for (const thread of allThreads) {
      if (!valid_thread_ids.includes(thread.discord_thread_id)) {
        await ForumThreadModel.delete(thread.id);
        deletedCount++;
        Logger.info('Thread eliminado en limpieza', { 
          threadId: thread.id, 
          discord_thread_id: thread.discord_thread_id 
        }, req);
      }
    }

    Logger.info('Limpieza de threads completada', { 
      channelId: channel.id, 
      deletedCount 
    }, req);
    
    res.json({ success: true, deletedCount });
  } catch (error) {
    next(error);
  }
});

router.delete('/threads/discord/:discordThreadId', async (req, res, next) => {
  try {
    const { discordThreadId } = req.params;

    await ForumThreadModel.deleteByDiscordId(discordThreadId);

    Logger.info('Thread eliminado de BD por evento Discord', { discord_thread_id: discordThreadId }, req);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/threads/messages/:messageId', async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { threadId } = req.body;

    if (!threadId) {
      return res.status(400).json({ error: 'threadId es requerido' });
    }

    const thread = await ForumThreadModel.getById(parseInt(threadId, 10));
    if (!thread) {
      return res.status(404).json({ error: 'Thread no encontrado' });
    }

    await ForumService.deleteThreadMessage(thread.discord_thread_id, messageId);
    await ThreadMessageModel.softDelete(messageId);

    Logger.info('Mensaje de thread eliminado', { messageId, threadId }, req);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
