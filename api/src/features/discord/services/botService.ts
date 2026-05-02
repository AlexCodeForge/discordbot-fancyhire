import axios from 'axios';
import { Logger } from '../../../shared/utils/Logger';

const BOT_URL = process.env.BOT_URL || 'http://127.0.0.1:3005';

export class BotService {
  static async sendDM(discordId: string, content: string): Promise<string> {
    console.log(`[BotService] Intentando enviar DM a ${discordId} via ${BOT_URL}`);
    
    try {
      const response = await axios.post(`${BOT_URL}/send-dm`, {
        discordId,
        content
      }, {
        timeout: 10000
      });
      
      console.log(`[BotService] DM enviado exitosamente. Message ID: ${response.data.discord_message_id}`);
      return response.data.discord_message_id;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message || 'Error al enviar DM';
        console.error(`[BotService] Error enviando DM:`, errorMsg);
        throw new Error(errorMsg);
      }
      console.error(`[BotService] Error desconocido:`, error);
      throw error;
    }
  }

  static async createTicket(leadName: string, leadDiscordId: string, assignedTo?: string): Promise<{ channel_id: string }> {
    Logger.info('Creating ticket channel', { leadName, leadDiscordId });
    
    try {
      const response = await axios.post(`${BOT_URL}/create-ticket`, {
        leadName,
        leadDiscordId,
        assignedTo
      }, {
        timeout: 10000
      });
      
      Logger.info('Ticket channel created', { channelId: response.data.channel_id });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message || 'Error creating ticket';
        Logger.error('Error creating ticket channel', { leadName }, new Error(errorMsg));
        throw new Error(errorMsg);
      }
      Logger.error('Unknown error creating ticket', { leadName }, error as Error);
      throw error;
    }
  }

  static async closeTicket(channelId: string): Promise<void> {
    Logger.info('Closing ticket channel', { channelId });
    
    try {
      await axios.post(`${BOT_URL}/close-ticket`, {
        channelId
      }, {
        timeout: 10000
      });
      
      Logger.info('Ticket channel closed', { channelId });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message || 'Error closing ticket';
        Logger.error('Error closing ticket channel', { channelId }, new Error(errorMsg));
        throw new Error(errorMsg);
      }
      Logger.error('Unknown error closing ticket', { channelId }, error as Error);
      throw error;
    }
  }

  static async transferTicket(channelId: string, newUserId: string, oldUserId?: string): Promise<void> {
    Logger.info('Transferring ticket', { channelId, newUserId, oldUserId });
    
    try {
      await axios.post(`${BOT_URL}/transfer-ticket`, {
        channelId,
        newUserId,
        oldUserId
      }, {
        timeout: 10000
      });
      
      Logger.info('Ticket transferred', { channelId, newUserId });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message || 'Error transferring ticket';
        Logger.error('Error transferring ticket', { channelId }, new Error(errorMsg));
        throw new Error(errorMsg);
      }
      Logger.error('Unknown error transferring ticket', { channelId }, error as Error);
      throw error;
    }
  }

  static async checkChannelExists(channelId: string): Promise<boolean> {
    Logger.info('Checking if channel exists', { channelId });
    
    try {
      const response = await axios.get<{ exists: boolean }>(`${BOT_URL}/check-channel/${channelId}`, {
        timeout: 10000
      });
      
      Logger.info('Channel existence checked', { channelId, exists: response.data.exists });
      return response.data.exists;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message || 'Error checking channel';
        Logger.error('Error checking channel', { channelId }, new Error(errorMsg));
        return false;
      }
      Logger.error('Unknown error checking channel', { channelId }, error as Error);
      return false;
    }
  }

  static async deleteTicketChannel(channelId: string): Promise<void> {
    Logger.info('Deleting ticket channel', { channelId });
    
    try {
      await axios.delete(`${BOT_URL}/delete-ticket-channel/${channelId}`, {
        timeout: 10000
      });
      
      Logger.info('Ticket channel deleted', { channelId });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data?.message || error.message || 'Error deleting ticket channel';
        Logger.error('Error deleting ticket channel', { channelId }, new Error(errorMsg));
        throw new Error(errorMsg);
      }
      Logger.error('Unknown error deleting ticket channel', { channelId }, error as Error);
      throw error;
    }
  }
}
