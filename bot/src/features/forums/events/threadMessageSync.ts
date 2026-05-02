import { Client, Message } from 'discord.js';
import axios from 'axios';
import { config } from '../../../config';

export async function syncThreadMessages(client: Client, threadId: string): Promise<void> {
  try {
    const thread = await client.channels.fetch(threadId);
    
    if (!thread || !thread.isThread()) {
      console.error(`Canal ${threadId} no es un thread`);
      return;
    }

    console.log(`Sincronizando mensajes del thread: ${thread.name}`);

    const messages = await thread.messages.fetch({ limit: 100 });
    
    let starterMessageId: string | null = null;
    try {
      const starterMessage = await thread.fetchStarterMessage();
      if (starterMessage) {
        starterMessageId = starterMessage.id;
      }
    } catch (err) {
      console.error(`No se pudo obtener starter message del thread ${threadId}`);
    }
    
    for (const [, message] of messages) {
      const isStarterMessage = message.id === starterMessageId;
      
      if (message.author.bot && !isStarterMessage) continue;

      // Para el mensaje inicial, capturar contenido completo incluyendo embeds
      let fullContent = message.content;
      if (isStarterMessage && message.embeds.length > 0) {
        const embed = message.embeds[0];
        const embedParts = [];
        
        if (embed.title) embedParts.push(`**${embed.title}**`);
        if (embed.description) embedParts.push(embed.description);
        if (embed.url) embedParts.push(`Link: ${embed.url}`);
        if (embed.image?.url) embedParts.push(`[Imagen: ${embed.image.url}]`);
        
        if (embedParts.length > 0) {
          fullContent = embedParts.join('\n\n');
        }
      }

      const payload = {
        discord_thread_id: threadId,
        discord_message_id: message.id,
        author_id: message.author.id,
        author_name: message.author.tag,
        author_avatar: message.author.displayAvatarURL(),
        content: fullContent || 'Sin contenido',
        mentions: message.mentions.users.map(u => u.id),
        sent_at: message.createdAt.toISOString()
      };

      try {
        await axios.post(`${config.apiUrl}/api/forum/threads/messages/incoming`, payload);
      } catch (err) {
        console.error(`Error sincronizando mensaje ${message.id}:`, err);
      }
    }

    console.log(`Mensajes del thread ${thread.name} sincronizados`);
  } catch (error) {
    console.error(`Error en syncThreadMessages para ${threadId}:`, error);
  }
}
