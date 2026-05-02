import { Client, ThreadChannel, ChannelType } from 'discord.js';
import axios from 'axios';
import { config } from '../../../config';
import { syncThreadMessages } from './threadMessageSync';

export async function syncThreadCreate(thread: ThreadChannel) {
  if (!thread.parent || thread.parent.type !== ChannelType.GuildForum) return;
  
  try {
    const owner = await thread.fetchOwner();
    
    // Obtener el mensaje inicial del thread (starter message)
    let startMessageId: string | null = null;
    try {
      const starterMessage = await thread.fetchStarterMessage();
      if (starterMessage) {
        startMessageId = starterMessage.id;
      }
    } catch (err) {
      console.error(`No se pudo obtener starter message del thread ${thread.id}`);
    }
    
    const payload = {
      discord_thread_id: thread.id,
      discord_channel_id: thread.parentId,
      name: thread.name,
      owner_id: thread.ownerId || 'unknown',
      owner_name: owner?.user?.tag || 'Unknown',
      archived: thread.archived || false,
      locked: thread.locked || false,
      message_count: thread.messageCount || 0,
      member_count: thread.memberCount || 0,
      start_message_id: startMessageId,
    };
    
    await axios.post(`${config.apiUrl}/api/forum/threads/sync`, payload);
    console.log(`Thread sincronizado: ${thread.name} (${thread.id})`);
  } catch (error) {
    console.error(`Error sincronizando thread ${thread.id}:`, error);
  }
}

export async function syncAllThreads(client: Client): Promise<void> {
  try {
    console.log('Iniciando sincronizacion de threads de foros...');
    
    for (const [, guild] of client.guilds.cache) {
      for (const [, channel] of guild.channels.cache) {
        if (channel.type !== ChannelType.GuildForum) continue;
        
        console.log(`Sincronizando threads del canal foro: ${channel.name}`);
        
        try {
          const validThreadIds = new Set<string>();

          const activeThreads = await channel.threads.fetchActive();
          for (const [, thread] of activeThreads.threads) {
            validThreadIds.add(thread.id);
            await syncThreadCreate(thread);
            await syncThreadMessages(client, thread.id);
          }
          
          const archivedThreads = await channel.threads.fetchArchived();
          for (const [, thread] of archivedThreads.threads) {
            validThreadIds.add(thread.id);
            await syncThreadCreate(thread);
            await syncThreadMessages(client, thread.id);
          }

          // Limpiar threads que ya no existen en Discord
          try {
            await axios.post(`${config.apiUrl}/api/forum/threads/cleanup`, {
              discord_channel_id: channel.id,
              valid_thread_ids: Array.from(validThreadIds)
            });
            console.log(`Limpieza de threads completada para ${channel.name}`);
          } catch (cleanupErr) {
            console.error(`Error en limpieza de threads:`, cleanupErr);
          }
        } catch (err) {
          console.error(`Error obteniendo threads de ${channel.name}:`, err);
        }
      }
    }
    
    console.log('Threads de foros sincronizados');
  } catch (error) {
    console.error('Error en syncAllThreads:', error);
  }
}
