import { Client, Message } from 'discord.js';
import axios from 'axios';
import { config } from '../config';

export function buildChannelIncomingPayload(message: Message) {
  return {
    discord_message_id: message.id,
    discord_channel_id: message.channelId,
    author_id: message.author.id,
    author_name: message.author.tag,
    author_avatar: message.author.displayAvatarURL(),
    content: message.content,
    mentions: [...message.mentions.users.keys()],
  };
}

export async function syncChannelMessages(client: Client, channelId: string): Promise<void> {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) return;
    if (!('messages' in channel)) return;

    const fetched = await channel.messages.fetch({ limit: 50 });
    const sorted = Array.from(fetched.values()).sort(
      (a, b) => a.createdTimestamp - b.createdTimestamp
    );

    for (const msg of sorted) {
      if (msg.author.bot) continue;

      try {
        const existsResponse = await axios.get(
          `${config.apiUrl}/api/channels/messages/check/${msg.id}`
        );

        if (!existsResponse.data.exists) {
          await axios.post(
            `${config.apiUrl}/api/channels/messages/incoming`,
            buildChannelIncomingPayload(msg)
          );
        }
      } catch (err) {
        console.error(`Error sincronizando mensaje de canal ${msg.id}:`, err);
      }
    }
  } catch (error) {
    console.error(`Error en syncChannelMessages para ${channelId}:`, error);
  }
}
