import axios from 'axios';
import { AnnouncementEmbed } from '../types/Announcement';
import { Logger } from '../utils/Logger';

const BOT_URL = process.env.BOT_URL || 'http://127.0.0.1:3005';

export class AnnouncementService {
  static async sendEmbed(channelId: string, embedData: AnnouncementEmbed): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      Logger.info('Sending embed to Discord channel', { channelId, embedTitle: embedData.title });

      const response = await axios.post(`${BOT_URL}/send-embed`, {
        channelId,
        embedData
      }, {
        timeout: 10000
      });

      if (response.data.success) {
        Logger.info('Embed sent successfully', { channelId, messageId: response.data.messageId });
        return { success: true, messageId: response.data.messageId };
      } else {
        Logger.warning('Embed send failed', { channelId, error: response.data.error });
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error('Error sending embed to bot', { channelId, error: errorMessage }, error as Error);
      return { success: false, error: errorMessage };
    }
  }

  static async editEmbed(channelId: string, messageId: string, embedData: AnnouncementEmbed): Promise<{ success: boolean; error?: string }> {
    try {
      Logger.info('Editing embed in Discord channel', { channelId, messageId, embedTitle: embedData.title });

      const response = await axios.patch(`${BOT_URL}/edit-embed`, {
        channelId,
        messageId,
        embedData
      }, {
        timeout: 10000
      });

      if (response.data.success) {
        Logger.info('Embed edited successfully', { channelId, messageId });
        return { success: true };
      } else {
        Logger.warning('Embed edit failed', { channelId, messageId, error: response.data.error });
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error('Error editing embed in bot', { channelId, messageId, error: errorMessage }, error as Error);
      return { success: false, error: errorMessage };
    }
  }

  static async deleteMessage(channelId: string, messageId: string): Promise<{ success: boolean; error?: string }> {
    try {
      Logger.info('Deleting message from Discord channel', { channelId, messageId });

      const response = await axios.delete(`${BOT_URL}/delete-channel-message`, {
        data: { channelId, messageId },
        timeout: 10000
      });

      if (response.data.success) {
        Logger.info('Message deleted successfully', { channelId, messageId });
        return { success: true };
      } else {
        Logger.warning('Message delete failed', { channelId, messageId, error: response.data.error });
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Logger.error('Error deleting message in bot', { channelId, messageId, error: errorMessage }, error as Error);
      return { success: false, error: errorMessage };
    }
  }
}
