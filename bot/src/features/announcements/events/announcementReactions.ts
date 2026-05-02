import { Client, MessageReaction, User, PartialMessageReaction, PartialUser } from 'discord.js';
import axios from 'axios';
import { config } from '../../../config';

async function getAnnouncementByMessageId(messageId: string): Promise<number | null> {
  try {
    const response = await axios.get(`${config.apiUrl}/api/announcements/by-message/${messageId}`);
    return response.data.announcementId;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching announcement by message ID:', error);
    return null;
  }
}

async function handleReactionAdd(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
  try {
    if (user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Error fetching reaction:', error);
        return;
      }
    }

    const announcementId = await getAnnouncementByMessageId(reaction.message.id);
    
    if (!announcementId) {
      return;
    }

    const emoji = reaction.emoji.name || reaction.emoji.toString();
    
    await axios.post(`${config.apiUrl}/api/announcements/reactions/bot`, {
      announcementId,
      emoji,
      userId: user.id,
      userName: user.username || 'unknown',
      action: 'add'
    });

    console.log(`Reaction added: ${emoji} by ${user.username} on announcement ${announcementId}`);
  } catch (error) {
    console.error('Error handling reaction add:', error);
  }
}

async function handleReactionRemove(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
  try {
    if (user.bot) return;

    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch (error) {
        console.error('Error fetching reaction:', error);
        return;
      }
    }

    const announcementId = await getAnnouncementByMessageId(reaction.message.id);
    
    if (!announcementId) {
      return;
    }

    const emoji = reaction.emoji.name || reaction.emoji.toString();
    
    await axios.post(`${config.apiUrl}/api/announcements/reactions/bot`, {
      announcementId,
      emoji,
      userId: user.id,
      userName: user.username || 'unknown',
      action: 'remove'
    });

    console.log(`Reaction removed: ${emoji} by ${user.username} on announcement ${announcementId}`);
  } catch (error) {
    console.error('Error handling reaction remove:', error);
  }
}

export function setupAnnouncementReactionListeners(client: Client) {
  client.on('messageReactionAdd', handleReactionAdd);
  client.on('messageReactionRemove', handleReactionRemove);
  console.log('Announcement reaction listeners initialized');
}
