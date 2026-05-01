import axios from 'axios';

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
}
