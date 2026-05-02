import axios from 'axios';

const BOT_URL = process.env.BOT_URL || 'http://127.0.0.1:3005';

interface EmbedData {
  title?: string;
  description?: string;
  color?: string;
  image_url?: string;
  thumbnail_url?: string;
  url?: string;
  author_name?: string;
  author_icon_url?: string;
  footer_text?: string;
  footer_icon_url?: string;
}

export class ForumService {
  static async createThread(
    channelId: string,
    name: string,
    content: string,
    options?: {
      appliedTags?: string[];
      embedData?: EmbedData;
      imageUrl?: string;
    }
  ): Promise<string> {
    try {
      const response = await axios.post(`${BOT_URL}/create-forum-thread`, {
        channelId,
        name,
        content,
        appliedTags: options?.appliedTags || [],
        embedData: options?.embedData,
        imageUrl: options?.imageUrl,
      });
      return response.data.discord_thread_id;
    } catch (error) {
      console.error('Error creando thread en Discord:', error);
      throw error;
    }
  }

  static async sendThreadMessage(
    threadId: string,
    content: string,
    mentions?: string[]
  ): Promise<string> {
    try {
      const response = await axios.post(`${BOT_URL}/send-thread-message`, {
        threadId,
        content,
        mentions: mentions || [],
      });
      return response.data.discord_message_id;
    } catch (error) {
      console.error('Error enviando mensaje a thread:', error);
      throw error;
    }
  }

  static async updateThread(
    threadId: string,
    name: string,
    startMessageId?: string,
    content?: string
  ): Promise<void> {
    try {
      await axios.patch(`${BOT_URL}/update-thread`, {
        threadId,
        name,
        startMessageId,
        content,
      });
    } catch (error) {
      console.error('Error actualizando thread:', error);
      throw error;
    }
  }

  static async deleteThread(threadId: string): Promise<void> {
    try {
      await axios.delete(`${BOT_URL}/delete-thread`, {
        data: {
          threadId,
        },
      });
    } catch (error) {
      console.error('Error eliminando thread:', error);
      throw error;
    }
  }

  static async deleteThreadMessage(
    threadId: string,
    messageId: string
  ): Promise<void> {
    try {
      await axios.delete(`${BOT_URL}/delete-thread-message`, {
        data: {
          threadId,
          messageId,
        },
      });
    } catch (error) {
      console.error('Error eliminando mensaje de thread:', error);
      throw error;
    }
  }
}
