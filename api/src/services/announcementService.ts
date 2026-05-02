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
}
