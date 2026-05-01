import { ChannelType, Client, GuildChannel } from 'discord.js';
import axios from 'axios';
import { config } from '../config';
import { syncChannelMessages } from './channelMessageSync';

const SYNCABLE_TYPES = new Set<ChannelType>([
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.GuildForum,
  ChannelType.GuildCategory,
]);

function getChannelTopic(channel: GuildChannel): string | null {
  if (!('topic' in channel)) return null;
  const t = (channel as { topic?: string | null }).topic;
  return typeof t === 'string' ? t : null;
}

export function isSyncableChannelType(type: ChannelType): boolean {
  return SYNCABLE_TYPES.has(type);
}

export function buildChannelSyncPayload(channel: GuildChannel) {
  const position = 'position' in channel ? channel.position : 0;
  return {
    discord_channel_id: channel.id,
    name: channel.name,
    type: channel.type,
    position,
    parent_id: channel.parentId ?? null,
    topic: getChannelTopic(channel),
  };
}

export async function syncAllChannels(client: Client): Promise<void> {
  try {
    const channelIds: string[] = [];
    
    console.log('[DEBUG] Iniciando syncAllChannels...');
    
    for (const [, guild] of client.guilds.cache) {
      for (const [, channel] of guild.channels.cache) {
        if (!isSyncableChannelType(channel.type)) continue;

        const payload = buildChannelSyncPayload(channel as GuildChannel);
        await axios.post(`${config.apiUrl}/api/channels/sync`, payload);
        channelIds.push(channel.id);
      }
    }
    console.log('Canales sincronizados con la API');
    
    console.log(`[DEBUG] channelIds.length: ${channelIds.length}`);
    
    // Sincronizar mensajes de cada canal
    console.log(`Sincronizando mensajes de ${channelIds.length} canales...`);
    for (const channelId of channelIds) {
      console.log(`[DEBUG] Sincronizando canal ${channelId}...`);
      await syncChannelMessages(client, channelId);
    }
    console.log('Mensajes de canales sincronizados');
  } catch (error) {
    console.error('Error en syncAllChannels:', error);
  }
}
