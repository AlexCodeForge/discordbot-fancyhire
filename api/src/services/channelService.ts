import axios from 'axios';
import { Logger } from '../utils/Logger';

const BOT_URL = process.env.BOT_URL || 'http://127.0.0.1:3005';

export class ChannelService {
  static async sendMessage(
    channelId: string,
    content: string,
    mentions: string[]
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${BOT_URL}/send-channel-message`,
        { channelId, content, mentions },
        { timeout: 10000 }
      );
      const id =
        response.data?.discord_message_id ??
        response.data?.messageId ??
        response.data?.id;
      if (!id) {
        Logger.error(
          'Respuesta del bot sin id de mensaje (send-channel-message)',
          { channelId, data: response.data }
        );
        throw new Error('Respuesta inválida del bot');
      }
      return String(id);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Error al enviar mensaje al canal';
        Logger.error(
          'Error HTTP enviando mensaje al canal',
          { channelId, status: error.response?.status },
          error instanceof Error ? error : undefined
        );
        throw new Error(msg);
      }
      Logger.error(
        'Error desconocido enviando mensaje al canal',
        { channelId },
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  static async deleteMessage(channelId: string, messageId: string): Promise<void> {
    try {
      await axios.delete(`${BOT_URL}/delete-channel-message`, {
        data: { channelId, messageId },
        timeout: 10000,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Error al eliminar mensaje del canal';
        Logger.error(
          'Error HTTP eliminando mensaje del canal',
          { channelId, messageId, status: error.response?.status },
          error instanceof Error ? error : undefined
        );
        throw new Error(msg);
      }
      Logger.error(
        'Error desconocido eliminando mensaje del canal',
        { channelId, messageId },
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  static async createChannel(
    name: string,
    type?: string,
    topic?: string,
    parentId?: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${BOT_URL}/create-channel`,
        { name, type, topic, parentId },
        { timeout: 15000 }
      );
      const id =
        response.data?.discord_channel_id ??
        response.data?.channelId ??
        response.data?.id;
      if (!id) {
        Logger.error(
          'Respuesta del bot sin id de canal (create-channel)',
          { name, data: response.data }
        );
        throw new Error('Respuesta inválida del bot');
      }
      return String(id);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Error al crear canal';
        Logger.error(
          'Error HTTP creando canal',
          { name, status: error.response?.status },
          error instanceof Error ? error : undefined
        );
        throw new Error(msg);
      }
      Logger.error(
        'Error desconocido creando canal',
        { name },
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  static async deleteChannel(channelId: string): Promise<void> {
    try {
      await axios.delete(`${BOT_URL}/delete-channel`, {
        data: { channelId },
        timeout: 15000,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Error al eliminar canal';
        Logger.error(
          'Error HTTP eliminando canal',
          { channelId, status: error.response?.status },
          error instanceof Error ? error : undefined
        );
        throw new Error(msg);
      }
      Logger.error(
        'Error desconocido eliminando canal',
        { channelId },
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }
}
