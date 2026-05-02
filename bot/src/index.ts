import {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  GuildMember,
  Message,
  Partials,
  ChannelType,
  DMChannel,
  GuildChannel,
  EmbedBuilder,
} from 'discord.js';
import axios from 'axios';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { config } from './config';
import { syncAllChannels, buildChannelSyncPayload, isSyncableChannelType } from './features/channels/events/channelSync';
import { buildChannelIncomingPayload } from './features/channels/events/channelMessageSync';
import { TicketChannelService } from './features/tickets/services/ticketChannelService';
import { setupAnnouncementReactionListeners } from './features/announcements/events/announcementReactions';
import { syncThreadCreate, syncAllThreads } from './features/forums/events/threadSync';
import { syncThreadMessages } from './features/forums/events/threadMessageSync';
import { MessageTemplateService } from './services/messageTemplateService';

const BOT_STATUS_FILE = path.join(__dirname, '../../api/.bot-status.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

const updateBotStatus = (connected: boolean, username?: string) => {
  try {
    const status = {
      connected,
      username: username || null,
      lastUpdate: new Date().toISOString(),
    };
    fs.writeFileSync(BOT_STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('Error escribiendo estado del bot:', error);
  }
};

const syncMemberToDatabase = async (member: GuildMember) => {
  try {
    const memberData = {
      id: member.id,
      username: member.user.username,
      tag: member.user.tag,
      display_name: member.displayName,
      avatar: member.user.avatar,
      joined_at: member.joinedAt?.toISOString() || null,
      created_at: member.user.createdAt.toISOString(),
      roles: member.roles.cache
        .filter(role => role.id !== member.guild.id)
        .map(role => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          position: role.position
        }))
        .sort((a, b) => b.position - a.position),
      permissions: {
        administrator: member.permissions.has('Administrator'),
        manageGuild: member.permissions.has('ManageGuild'),
        manageRoles: member.permissions.has('ManageRoles'),
        manageChannels: member.permissions.has('ManageChannels'),
        kickMembers: member.permissions.has('KickMembers'),
        banMembers: member.permissions.has('BanMembers')
      }
    };
    
    await axios.post(`${config.apiUrl}/api/discord/members/sync`, memberData);
  } catch (error) {
    console.error(`Error sincronizando miembro ${member.user.tag}:`, error);
  }
};

const syncMembersToDatabase = async () => {
  try {
    const guilds = client.guilds.cache;
    let syncedCount = 0;

    for (const [, guild] of guilds) {
      const members = await guild.members.fetch();
      
      for (const [, member] of members) {
        if (member.user.bot) continue;
        await syncMemberToDatabase(member);
        syncedCount++;
      }
    }

    console.log(`Miembros sincronizados en base de datos: ${syncedCount}`);
  } catch (error) {
    console.error('Error sincronizando miembros:', error);
  }
};

const syncDMChannel = async (channel: DMChannel, discordId: string): Promise<number> => {
  try {
    console.log(`Sincronizando mensajes del DM con ${discordId}...`);
    
    const messages = await channel.messages.fetch({ limit: 100 });
    const sortedMessages = Array.from(messages.values()).sort((a, b) => 
      a.createdTimestamp - b.createdTimestamp
    );
    
    let syncedCount = 0;
    
    for (const msg of sortedMessages) {
      if (msg.author.bot) continue;
      
      try {
        const existsResponse = await axios.get(
          `${config.apiUrl}/api/messages/check/${msg.id}`
        );
        
        if (!existsResponse.data.exists) {
          await axios.post(`${config.apiUrl}/api/messages/incoming`, {
            discord_id: discordId,
            content: msg.content,
            discord_message_id: msg.id,
            sender_name: msg.author.tag
          });
          syncedCount++;
        }
      } catch (error) {
        console.error(`Error sincronizando mensaje ${msg.id}:`, error);
      }
    }
    
    if (syncedCount > 0) {
      console.log(`✓ Sincronizados ${syncedCount} mensajes de ${discordId}`);
    }
    
    return syncedCount;
  } catch (error) {
    console.error(`Error al sincronizar DM con ${discordId}:`, error);
    return 0;
  }
};

const syncTicketChannel = async (channelId: string): Promise<number> => {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased() || !('name' in channel)) {
      return 0;
    }

    const channelName = channel.name ?? '';
    if (!channelName.startsWith('ticket-')) {
      return 0;
    }

    console.log(`[TICKET-SYNC] Sincronizando canal ${channelName}...`);

    let allMessages: Message[] = [];
    let lastMessageId: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const messages: Collection<string, Message> = await channel.messages.fetch({
        limit: 100,
        ...(lastMessageId ? { before: lastMessageId } : {}),
      });
      
      if (messages.size === 0) {
        hasMore = false;
        break;
      }

      allMessages.push(...Array.from(messages.values()));
      lastMessageId = messages.last()?.id;

      if (messages.size < 100) {
        hasMore = false;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
    }

    const sortedMessages = allMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    let syncedCount = 0;

    for (const msg of sortedMessages) {
      if (msg.author.bot && msg.author.id === client.user?.id) {
        continue;
      }

      try {
        await axios.post(`${config.apiUrl}/api/tickets/messages/incoming`, {
          discord_channel_id: channelId,
          discord_message_id: msg.id,
          author_id: msg.author.id,
          author_name: msg.author.tag,
          content: msg.content,
          sent_at: msg.createdAt.toISOString()
        });
        syncedCount++;
      } catch (error: any) {
        if (error.response?.status !== 200 && error.response?.data?.message !== 'Mensaje ya registrado') {
          console.error(`[TICKET-SYNC] Error sincronizando mensaje ${msg.id}:`, error.response?.data || error.message);
        }
      }
    }

    if (syncedCount > 0) {
      console.log(`[TICKET-SYNC] ✓ Sincronizados ${syncedCount} mensajes de ${allMessages.length} totales en ${channelName}`);
    }

    return syncedCount;
  } catch (error) {
    console.error(`[TICKET-SYNC] Error sincronizando canal ${channelId}:`, error);
    return 0;
  }
};

const syncAllDMs = async (): Promise<void> => {
  try {
    console.log('Iniciando sincronización de todos los DMs...');
    
    let membersData: any[] = [];
    
    const guilds = client.guilds.cache;
    for (const [, guild] of guilds) {
      const members = await guild.members.fetch();
      members.forEach((member) => {
        if (!member.user.bot) {
          membersData.push({
            id: member.id,
            username: member.user.username,
            tag: member.user.tag,
          });
        }
      });
    }
    
    let totalSynced = 0;
    
    for (const member of membersData) {
      try {
        const user = await client.users.fetch(member.id);
        const dmChannel = user.dmChannel || await user.createDM();
        
        const synced = await syncDMChannel(dmChannel, member.id);
        totalSynced += synced;
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error sincronizando miembro ${member.id}:`, error);
      }
    }
    
    console.log(`✓ Sincronización completada: ${totalSynced} mensajes nuevos`);
  } catch (error) {
    console.error('Error en sincronización general:', error);
  }
};

const botHttpServer = express();
botHttpServer.use(express.json());

const ticketService = new TicketChannelService(client);

client.once(Events.ClientReady, async (c) => {
  console.log(`Bot conectado como ${c.user.tag}`);
  console.log(`Monitoreando ${c.guilds.cache.size} servidor(es)`);
  
  updateBotStatus(true, c.user.tag);
  
  await syncMembersToDatabase();
  
  console.log('Sincronizando mensajes perdidos...');
  await syncAllDMs();

  await syncAllChannels(client);

  console.log('Sincronizando threads de foros...');
  await syncAllThreads(client);

  console.log('[TICKET-SYNC] Sincronizando tickets existentes...');
  const guilds = client.guilds.cache;
  for (const [, guild] of guilds) {
    const channels = guild.channels.cache.filter(ch => 
      'name' in ch && ch.name.startsWith('ticket-')
    );
    
    for (const [, channel] of channels) {
      await syncTicketChannel(channel.id);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('Ticket service initialized');

  setupAnnouncementReactionListeners(client);

  setInterval(() => {
    updateBotStatus(true, c.user.tag);
  }, 60000);

  setInterval(() => {
    syncMembersToDatabase();
  }, 300000);

  setInterval(() => {
    console.log('Ejecutando sincronización periódica...');
    syncAllDMs();
  }, 600000);

  setInterval(async () => {
    console.log('Sincronizando canales con la API...');
    await syncAllChannels(client);
  }, 600000);
});

client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
  console.log(`Nuevo miembro detectado: ${member.user.tag} (${member.id})`);

  try {
    const leadData = {
      name: member.user.username,
      discord_id: member.id,
      discord_tag: member.user.tag,
      contact_discord: `<@${member.id}>`,
      service_interest: 'Sin especificar - Contacto inicial requerido',
      stage: 'nuevo',
      source: 'auto',
    };

    const response = await axios.post(`${config.apiUrl}/api/bot/webhook/lead`, leadData);
    
    if (response.status === 200 && response.data.message === 'Lead ya existe') {
      console.log(`Lead ya existe para ${member.user.tag}, omitiendo creación`);
      return;
    }
    
    console.log(`Lead creado exitosamente: ID ${response.data.id}`);

    if (config.adminChannelId) {
      try {
        const adminChannel = await client.channels.fetch(config.adminChannelId);
        if (adminChannel?.isTextBased() && 'send' in adminChannel) {
          const message = await MessageTemplateService.getMessageWithFallback('admin_new_lead', {
            username: member.user.tag,
            userId: member.id,
            leadId: response.data.id,
            date: new Date().toLocaleString('es-ES')
          });
          await adminChannel.send(message);
        }
      } catch (channelError) {
        console.error('Error al notificar en canal admin:', channelError);
      }
    }

    try {
      const welcomeMessage = await MessageTemplateService.getMessageWithFallback('welcome_dm', {
        username: member.user.tag,
        userId: member.id,
        serverName: member.guild.name
      });
      await member.send(welcomeMessage);
      console.log(`Mensaje de bienvenida enviado a ${member.user.tag}`);
    } catch (dmError) {
      console.log(`No se pudo enviar DM a ${member.user.tag} (probablemente DMs deshabilitados)`);
    }

  } catch (error) {
    console.error('Error al crear lead:', error);
    
    if (config.adminChannelId) {
      try {
        const adminChannel = await client.channels.fetch(config.adminChannelId);
        if (adminChannel?.isTextBased() && 'send' in adminChannel) {
          const errorMessage = await MessageTemplateService.getMessageWithFallback('admin_lead_error', {
            username: member.user.tag,
            error: error instanceof Error ? error.message : 'Error desconocido'
          });
          await adminChannel.send(errorMessage);
        }
      } catch (notifyError) {
        console.error('Error al notificar error en canal admin:', notifyError);
      }
    }
  }
});

client.on(Events.GuildMemberUpdate, async (_oldMember, newMember) => {
  if (newMember.user.bot) return;
  console.log(`Miembro actualizado: ${newMember.user.tag}`);
  await syncMemberToDatabase(newMember as GuildMember);
});

client.on(Events.GuildMemberRemove, async (member) => {
  if (member.user?.bot) return;
  console.log(`Miembro salió del servidor: ${member.user.tag}`);
  try {
    await axios.delete(`${config.apiUrl}/api/discord/members/${member.id}`);
  } catch (error) {
    console.error(`Error eliminando miembro ${member.user.tag}:`, error);
  }
});

client.on(Events.UserUpdate, async (oldUser, newUser) => {
  if (newUser.bot) return;
  console.log(`Usuario actualizado: ${newUser.tag}`);
  const guilds = client.guilds.cache;
  for (const [, guild] of guilds) {
    const member = guild.members.cache.get(newUser.id);
    if (member) {
      await syncMemberToDatabase(member);
    }
  }
});

client.on(Events.MessageCreate, async (message) => {
  if (message.channel.isThread() && message.channel.parent?.type === ChannelType.GuildForum) {
    let isStarterMessage = false;
    try {
      const starterMessage = await message.channel.fetchStarterMessage();
      isStarterMessage = starterMessage?.id === message.id;
    } catch (err) {
      console.error(`[FORUM] Error verificando starter message: ${err}`);
    }

    if (message.author.bot && !isStarterMessage) return;

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

    console.log(`[FORUM] Mensaje recibido en thread ${message.channel.name} de ${message.author.tag}`);
    try {
      await axios.post(`${config.apiUrl}/api/forum/threads/messages/incoming`, {
        discord_thread_id: message.channel.id,
        discord_message_id: message.id,
        author_id: message.author.id,
        author_name: message.author.tag,
        author_avatar: message.author.displayAvatarURL(),
        content: fullContent || 'Sin contenido',
        mentions: message.mentions.users.map(u => u.id),
        sent_at: message.createdAt.toISOString()
      });
      console.log(`[FORUM] Mensaje de thread guardado en BD: ${message.id}`);
    } catch (error: any) {
      console.error('[FORUM] Error guardando mensaje de thread:', error.response?.data || error.message);
    }
    return;
  }

  if (message.author.bot) return;

  if (message.channel.type === ChannelType.DM) {
    console.log(`DM recibido de ${message.author.tag}: ${message.content}`);

    try {
      await axios.post(`${config.apiUrl}/api/messages/incoming`, {
        discord_id: message.author.id,
        content: message.content,
        discord_message_id: message.id,
        sender_name: message.author.tag,
      });
      console.log(`Mensaje de ${message.author.tag} guardado en BD`);
    } catch (error) {
      console.error('Error al guardar mensaje DM:', error);
    }
    return;
  }

  if (message.guild && message.channel.isTextBased()) {
    const channelName = 'name' in message.channel ? message.channel.name : '';
    
    if (channelName.startsWith('ticket-')) {
      console.log(`[TICKET] Mensaje recibido en ${channelName} de ${message.author.tag}`);
      try {
        const response = await axios.post(`${config.apiUrl}/api/tickets/messages/incoming`, {
          discord_channel_id: message.channel.id,
          discord_message_id: message.id,
          author_id: message.author.id,
          author_name: message.author.tag,
          content: message.content,
          sent_at: message.createdAt.toISOString()
        });
        console.log(`[TICKET] Mensaje guardado en BD: ${message.id}`);
      } catch (error: any) {
        console.error('[TICKET] Error guardando mensaje:', error.response?.data || error.message);
      }
      return;
    }

    try {
      await axios.post(
        `${config.apiUrl}/api/channels/messages/incoming`,
        buildChannelIncomingPayload(message)
      );
      console.log(`Mensaje de canal ${message.channelId} guardado en BD`);
    } catch (error) {
      console.error('Error al guardar mensaje de canal:', error);
    }
  }
});

client.on(Events.ChannelCreate, async (channel) => {
  if (!channel.isDMBased() && 'guild' in channel && channel.guild && isSyncableChannelType(channel.type)) {
    try {
      await axios.post(
        `${config.apiUrl}/api/bot/channels/sync`,
        buildChannelSyncPayload(channel as GuildChannel)
      );
    } catch (error) {
      console.error('Error al sincronizar canal creado:', error);
    }
  }
});

client.on(Events.ChannelDelete, async (channel) => {
  if (channel.isDMBased()) return;
  try {
    await axios.delete(`${config.apiUrl}/api/channels/${channel.id}`);
  } catch (error) {
    console.error('Error al eliminar canal en API:', error);
  }
});

client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
  if (newChannel.isDMBased() || !('guild' in newChannel) || !isSyncableChannelType(newChannel.type)) return;
  
  // Si cambió el parent_id (se movió de categoría) o cambió el nombre, sincronizar
  const oldParent = 'parentId' in oldChannel ? (oldChannel as any).parentId : null;
  const newParent = 'parentId' in newChannel ? (newChannel as any).parentId : null;
  const oldName = 'name' in oldChannel ? oldChannel.name : undefined;

  if (oldName !== newChannel.name || oldParent !== newParent) {
    try {
      await axios.post(
        `${config.apiUrl}/api/bot/channels/sync`,
        buildChannelSyncPayload(newChannel as GuildChannel)
      );
      console.log(`Canal ${newChannel.id} actualizado en API`);
    } catch (error) {
      console.error('Error al sincronizar canal actualizado:', error);
    }
  }
});

client.on(Events.MessageDelete, async (message) => {
  if (!message.guildId) return;
  try {
    await axios.patch(`${config.apiUrl}/api/channels/messages/${message.id}/delete`);
  } catch (error) {
    console.error('Error al marcar mensaje eliminado en API:', error);
  }
});

client.on(Events.MessageUpdate, async (_oldMsg, newMsg) => {
  if (!newMsg.guildId || newMsg.content == null) return;
  try {
    await axios.patch(`${config.apiUrl}/api/channels/messages/${newMsg.id}`, {
      content: newMsg.content,
    });
  } catch (error) {
    console.error('Error al actualizar mensaje en API:', error);
  }
});

client.on(Events.ThreadCreate, async (thread) => {
  if (thread.parent?.type === ChannelType.GuildForum) {
    console.log(`[FORUM] Nuevo thread creado: ${thread.name}`);
    await syncThreadCreate(thread);
    
    // Esperar un momento para que Discord procese el mensaje inicial
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Sincronizar mensajes del thread (incluyendo el mensaje inicial)
    await syncThreadMessages(client, thread.id);
  }
});

client.on(Events.ThreadUpdate, async (oldThread, newThread) => {
  if (newThread.parent?.type === ChannelType.GuildForum) {
    console.log(`[FORUM] Thread actualizado: ${newThread.name}`);
    await syncThreadCreate(newThread);
  }
});

client.on(Events.ThreadDelete, async (thread) => {
  if (thread.parent?.type === ChannelType.GuildForum) {
    console.log(`[FORUM] Thread eliminado desde Discord: ${thread.name} (${thread.id})`);
    try {
      await axios.delete(`${config.apiUrl}/api/forum/threads/discord/${thread.id}`);
      console.log(`[FORUM] Thread eliminado de la BD: ${thread.id}`);
    } catch (error) {
      console.error(`[FORUM] Error eliminando thread de BD:`, error);
    }
  }
});

export async function sendDMToLead(discordId: string, content: string): Promise<string> {
  try {
    const user = await client.users.fetch(discordId);
    const dmChannel = await user.createDM();
    const message = await dmChannel.send(content);
    return message.id;
  } catch (error) {
    console.error(`Error enviando DM a ${discordId}:`, error);
    throw error;
  }
}

function parseChannelTypeInput(type: unknown): ChannelType {
  if (typeof type === 'number') return type as ChannelType;
  if (typeof type === 'string') {
    const t = type.toUpperCase();
    if (t === 'GUILD_TEXT' || t === '0') return ChannelType.GuildText;
    if (t === 'GUILD_FORUM' || t === '15') return ChannelType.GuildForum;
    if (t === 'GUILD_CATEGORY' || t === '4') return ChannelType.GuildCategory;
  }
  return ChannelType.GuildText;
}

botHttpServer.post('/send-dm', async (req, res) => {
  const { discordId, content } = req.body;
  
  if (!discordId || !content) {
    return res.status(400).json({ error: 'discordId y content son requeridos' });
  }
  
  try {
    const messageId = await sendDMToLead(discordId, content);
    res.json({ success: true, discord_message_id: messageId });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error al enviar DM', 
      message: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

botHttpServer.post('/update-roles', async (req, res) => {
  const { memberId, guildId, roleIds } = req.body;
  
  if (!memberId || !guildId || !roleIds) {
    return res.status(400).json({ error: 'memberId, guildId y roleIds son requeridos' });
  }
  
  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(memberId);
    const botMember = guild.members.me;
    
    if (!botMember) {
      return res.status(500).json({ 
        error: 'Error al actualizar roles', 
        message: 'Bot no encontrado en el servidor' 
      });
    }
    
    if (!botMember.permissions.has('ManageRoles')) {
      return res.status(403).json({ 
        error: 'Permisos insuficientes', 
        message: 'El bot no tiene el permiso "Manage Roles"' 
      });
    }
    
    const highestBotRole = botMember.roles.highest;
    const rolesToSet = roleIds.map((id: string) => guild.roles.cache.get(id)).filter((r: any) => r);
    
    for (const role of rolesToSet) {
      if (role.position >= highestBotRole.position) {
        return res.status(403).json({ 
          error: 'Jerarquía de roles', 
          message: `El rol "${role.name}" está por encima del rol del bot. Mueve el rol del bot más arriba en la configuración del servidor.` 
        });
      }
    }
    
    await member.roles.set(roleIds);
    await syncMemberToDatabase(member);
    
    console.log(`Roles actualizados para ${member.user.tag}: ${roleIds.length} roles`);
    res.json({ success: true, message: 'Roles actualizados correctamente' });
  } catch (error) {
    console.error(`Error actualizando roles para ${memberId}:`, error);
    res.status(500).json({ 
      error: 'Error al actualizar roles', 
      message: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

botHttpServer.get('/guilds', async (req, res) => {
  try {
    const guilds = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon
    }));
    res.json(guilds);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener servidores' });
  }
});

botHttpServer.get('/guilds/:guildId/roles', async (req, res) => {
  try {
    const { guildId } = req.params;
    const guild = await client.guilds.fetch(guildId);
    const roles = guild.roles.cache
      .filter(role => role.id !== guild.id)
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.hexColor,
        position: role.position,
        permissions: role.permissions.bitfield.toString()
      }))
      .sort((a, b) => b.position - a.position);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener roles del servidor' });
  }
});

botHttpServer.post('/send-channel-message', async (req, res) => {
  const { channelId, content, mentions } = req.body;

  if (!channelId || content === undefined || content === null) {
    return res.status(400).json({ error: 'channelId y content son requeridos' });
  }

  try {
    const ch = await client.channels.fetch(channelId);
    if (!ch || !('guild' in ch) || !ch.guild || !ch.isTextBased()) {
      return res.status(400).json({ error: 'El canal no admite mensajes de texto' });
    }
    const sent = await ch.send({
      content: String(content),
      allowedMentions: { users: Array.isArray(mentions) ? mentions : [] },
    });

    if ('name' in ch && ch.name.startsWith('ticket-')) {
      try {
        console.log('[TICKET] Sincronizando mensaje enviado desde web:', sent.id);
        const response = await axios.post(`${config.apiUrl}/api/tickets/messages/incoming`, {
          discord_channel_id: channelId,
          discord_message_id: sent.id,
          author_id: client.user!.id,
          author_name: 'Admin CRM',
          content: String(content),
          sent_at: sent.createdAt.toISOString()
        });
        console.log('[TICKET] Mensaje sincronizado correctamente:', response.status);
      } catch (syncError: any) {
        console.error('[TICKET] Error sincronizando mensaje del bot:', syncError.response?.data || syncError.message);
      }
    }

    res.json({ success: true, discord_message_id: sent.id });
  } catch (error) {
    console.error('Error en send-channel-message:', error);
    res.status(500).json({
      error: 'Error al enviar mensaje al canal',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.delete('/delete-channel-message', async (req, res) => {
  const { channelId, messageId } = req.body;

  if (!channelId || !messageId) {
    return res.status(400).json({ error: 'channelId y messageId son requeridos' });
  }

  try {
    const ch = await client.channels.fetch(channelId);
    if (!ch || !('guild' in ch) || !ch.guild || !ch.isTextBased() || !('messages' in ch)) {
      return res.status(400).json({ error: 'Canal inválido' });
    }
    const msg = await ch.messages.fetch(messageId);
    await msg.delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error en delete-channel-message:', error);
    res.status(500).json({
      error: 'Error al eliminar mensaje',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

botHttpServer.post('/send-embed', async (req, res) => {
  const { channelId, embedData } = req.body;

  if (!channelId || !embedData) {
    return res.status(400).json({ error: 'channelId and embedData are required' });
  }

  try {
    const channel = await client.channels.fetch(channelId);
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    if (!channel.isTextBased() || channel.isDMBased()) {
      return res.status(400).json({ error: 'Channel is not a valid text channel' });
    }

    const embed = new EmbedBuilder();

    if (embedData.title) embed.setTitle(embedData.title);
    if (embedData.description) embed.setDescription(embedData.description);
    if (embedData.color) {
      const colorValue = embedData.color.startsWith('#') 
        ? parseInt(embedData.color.substring(1), 16) 
        : parseInt(embedData.color, 16);
      embed.setColor(colorValue);
    }
    if (embedData.url) embed.setURL(embedData.url);
    if (embedData.thumbnail_url) embed.setThumbnail(embedData.thumbnail_url);
    if (embedData.image_url) embed.setImage(embedData.image_url);
    if (embedData.footer_text) {
      embed.setFooter({ 
        text: embedData.footer_text,
        iconURL: embedData.footer_icon_url || undefined
      });
    }
    if (embedData.author_name) {
      embed.setAuthor({ 
        name: embedData.author_name,
        iconURL: embedData.author_icon_url || undefined
      });
    }

    const message = await channel.send({ embeds: [embed] });
    
    console.log(`Embed sent to channel ${channelId}, message ID: ${message.id}`);
    res.json({ success: true, messageId: message.id });
  } catch (error) {
    console.error('Error sending embed:', error);
    res.status(500).json({
      error: 'Error sending embed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.patch('/edit-embed', async (req, res) => {
  const { channelId, messageId, embedData } = req.body;

  if (!channelId || !messageId || !embedData) {
    return res.status(400).json({ error: 'channelId, messageId, and embedData are required' });
  }

  try {
    const channel = await client.channels.fetch(channelId);
    
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    if (!channel.isTextBased() || channel.isDMBased()) {
      return res.status(400).json({ error: 'Channel is not a valid text channel' });
    }

    const message = await (channel as any).messages.fetch(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const embed = new EmbedBuilder();

    if (embedData.title) embed.setTitle(embedData.title);
    if (embedData.description) embed.setDescription(embedData.description);
    if (embedData.color) {
      const colorValue = embedData.color.startsWith('#') 
        ? parseInt(embedData.color.substring(1), 16) 
        : parseInt(embedData.color, 16);
      embed.setColor(colorValue);
    }
    if (embedData.url) embed.setURL(embedData.url);
    if (embedData.thumbnail_url) embed.setThumbnail(embedData.thumbnail_url);
    if (embedData.image_url) embed.setImage(embedData.image_url);
    if (embedData.footer_text) {
      embed.setFooter({ 
        text: embedData.footer_text,
        iconURL: embedData.footer_icon_url || undefined
      });
    }
    if (embedData.author_name) {
      embed.setAuthor({ 
        name: embedData.author_name,
        iconURL: embedData.author_icon_url || undefined
      });
    }

    await message.edit({ embeds: [embed] });
    
    console.log(`Embed edited in channel ${channelId}, message ID: ${messageId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error editing embed:', error);
    res.status(500).json({
      error: 'Error editing embed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.post('/create-channel', async (req, res) => {
  const { name, type, topic, parentId } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name es requerido' });
  }

  const guild = client.guilds.cache.first();
  if (!guild) {
    return res.status(500).json({ error: 'No hay servidor disponible' });
  }

  try {
    const channelType = parseChannelTypeInput(type);
    const created = await guild.channels.create({
      name: name.trim(),
      type: channelType as
        | ChannelType.GuildText
        | ChannelType.GuildForum
        | ChannelType.GuildCategory,
      topic: topic && typeof topic === 'string' ? topic : undefined,
      parent: parentId && typeof parentId === 'string' ? parentId : undefined,
    });
    res.json({ success: true, discord_channel_id: created.id });
  } catch (error) {
    console.error('Error en create-channel:', error);
    res.status(500).json({
      error: 'Error al crear canal',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

botHttpServer.delete('/delete-channel', async (req, res) => {
  const { channelId } = req.body;

  if (!channelId) {
    return res.status(400).json({ error: 'channelId es requerido' });
  }

  try {
    const ch = await client.channels.fetch(channelId);
    if (!ch) {
      return res.status(404).json({ error: 'Canal no encontrado' });
    }
    await ch.delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error en delete-channel:', error);
    res.status(500).json({
      error: 'Error al eliminar canal',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

botHttpServer.post('/move-channels', async (req, res) => {
  const { discordChannelIds, targetCategoryId } = req.body;

  if (!Array.isArray(discordChannelIds) || discordChannelIds.length === 0) {
    return res.status(400).json({ error: 'discordChannelIds debe ser un array no vacío' });
  }

  const guild = client.guilds.cache.first();
  if (!guild) {
    return res.status(500).json({ error: 'No hay servidor disponible' });
  }

  try {
    for (const discordChannelId of discordChannelIds) {
      const discordChannel = await guild.channels.fetch(discordChannelId);
      
      if (discordChannel && 'setParent' in discordChannel) {
        await (discordChannel as any).setParent(targetCategoryId, {
          lockPermissions: false
        });
        console.log(`Canal ${discordChannel.name} movido a categoría ${targetCategoryId || 'sin categoría'}`);
        
        // Sincronizar el cambio con la API inmediatamente
        const payload = {
          discord_channel_id: discordChannel.id,
          name: discordChannel.name,
          type: discordChannel.type,
          position: 'position' in discordChannel ? (discordChannel as any).position : 0,
          parent_id: discordChannel.parentId ?? null,
          topic: 'topic' in discordChannel ? (discordChannel as any).topic : null,
        };
        
        await axios.post(`${config.apiUrl}/api/bot/channels/sync`, payload);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error en move-channels:', error);
    res.status(500).json({
      error: 'Error al mover canales',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
});

botHttpServer.post('/create-ticket', async (req, res) => {
  const { leadName, leadDiscordId, assignedTo } = req.body;

  if (!leadName || !leadDiscordId) {
    return res.status(400).json({ error: 'leadName and leadDiscordId are required' });
  }

  try {
    const result = await ticketService.createTicketChannel(leadName, leadDiscordId, assignedTo);
    res.json(result);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({
      error: 'Error creating ticket',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.post('/close-ticket', async (req, res) => {
  const { channelId } = req.body;

  if (!channelId) {
    return res.status(400).json({ error: 'channelId is required' });
  }

  try {
    await ticketService.closeTicketChannel(channelId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error closing ticket:', error);
    res.status(500).json({
      error: 'Error closing ticket',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.post('/transfer-ticket', async (req, res) => {
  const { channelId, newUserId, oldUserId } = req.body;

  if (!channelId || !newUserId) {
    return res.status(400).json({ error: 'channelId and newUserId are required' });
  }

  try {
    await ticketService.transferTicket(channelId, newUserId, oldUserId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error transferring ticket:', error);
    res.status(500).json({
      error: 'Error transferring ticket',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.get('/check-channel/:channelId', async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    return res.status(400).json({ error: 'channelId is required' });
  }

  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    res.json({ exists: !!channel });
  } catch (error) {
    console.error('Error checking channel:', error);
    res.status(500).json({
      error: 'Error checking channel',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.delete('/delete-ticket-channel/:channelId', async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    return res.status(400).json({ error: 'channelId is required' });
  }

  try {
    await ticketService.deleteChannel(channelId);
    res.json({ success: true, message: 'Ticket channel deleted successfully' });
  } catch (error) {
    console.error('Error deleting ticket channel:', error);
    res.status(500).json({
      error: 'Error deleting ticket channel',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.post('/create-role', async (req, res) => {
  const { guildId, name, color, permissions, hoist, mentionable } = req.body;

  if (!guildId || !name) {
    return res.status(400).json({ error: 'guildId and name are required' });
  }

  try {
    const guild = await client.guilds.fetch(guildId);
    const botMember = guild.members.me;

    if (!botMember) {
      return res.status(500).json({ error: 'Bot not found in guild' });
    }

    if (!botMember.permissions.has('ManageRoles')) {
      return res.status(403).json({ 
        error: 'El bot no tiene el permiso "Manage Roles"' 
      });
    }

    const role = await guild.roles.create({
      name,
      color: color ? parseInt(color.replace('#', ''), 16) : undefined,
      permissions: permissions || [],
      hoist: hoist || false,
      mentionable: mentionable || false,
    });

    console.log(`Rol creado: ${role.name} (${role.id})`);
    res.json({ 
      success: true, 
      role: {
        id: role.id,
        name: role.name,
        color: role.hexColor,
        position: role.position,
        permissions: role.permissions.bitfield.toString(),
        hoist: role.hoist,
        mentionable: role.mentionable,
        managed: role.managed
      }
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      error: 'Error al crear rol',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.patch('/roles/:roleId', async (req, res) => {
  const { roleId } = req.params;
  const { guildId, name, color, permissions, hoist, mentionable } = req.body;

  if (!guildId) {
    return res.status(400).json({ error: 'guildId is required' });
  }

  try {
    const guild = await client.guilds.fetch(guildId);
    const role = guild.roles.cache.get(roleId);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.managed) {
      return res.status(403).json({ 
        error: 'No se pueden editar roles gestionados por integraciones' 
      });
    }

    const botMember = guild.members.me;
    if (!botMember) {
      return res.status(500).json({ error: 'Bot not found in guild' });
    }

    if (!botMember.permissions.has('ManageRoles')) {
      return res.status(403).json({ 
        error: 'El bot no tiene el permiso "Manage Roles"' 
      });
    }

    const highestBotRole = botMember.roles.highest;
    if (role.position > highestBotRole.position) {
      return res.status(403).json({ 
        error: `El rol "${role.name}" está por encima del rol del bot. Mueve el rol del bot más arriba en Discord.` 
      });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = parseInt(color.replace('#', ''), 16);
    if (permissions !== undefined) updateData.permissions = permissions;
    if (hoist !== undefined) updateData.hoist = hoist;
    if (mentionable !== undefined) updateData.mentionable = mentionable;

    await role.edit(updateData);

    console.log(`Rol actualizado: ${role.name} (${role.id})`);
    res.json({ 
      success: true,
      role: {
        id: role.id,
        name: role.name,
        color: role.hexColor,
        position: role.position,
        permissions: role.permissions.bitfield.toString(),
        hoist: role.hoist,
        mentionable: role.mentionable,
        managed: role.managed
      }
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      error: 'Error al actualizar rol',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.delete('/roles/:roleId', async (req, res) => {
  const { roleId } = req.params;
  const { guildId } = req.body;

  if (!guildId) {
    return res.status(400).json({ error: 'guildId is required' });
  }

  try {
    const guild = await client.guilds.fetch(guildId);
    const role = guild.roles.cache.get(roleId);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.managed) {
      return res.status(403).json({ 
        error: 'No se pueden eliminar roles gestionados por integraciones' 
      });
    }

    const botMember = guild.members.me;
    if (!botMember) {
      return res.status(500).json({ error: 'Bot not found in guild' });
    }

    if (!botMember.permissions.has('ManageRoles')) {
      return res.status(403).json({ 
        error: 'El bot no tiene el permiso "Manage Roles"' 
      });
    }

    const highestBotRole = botMember.roles.highest;
    if (role.position > highestBotRole.position) {
      return res.status(403).json({ 
        error: `El rol "${role.name}" está por encima del rol del bot. Mueve el rol del bot más arriba en Discord.` 
      });
    }

    await role.delete();
    console.log(`Rol eliminado: ${role.name} (${role.id})`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      error: 'Error al eliminar rol',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.put('/roles/:roleId/position', async (req, res) => {
  const { roleId } = req.params;
  const { guildId, position } = req.body;

  if (!guildId || position === undefined) {
    return res.status(400).json({ error: 'guildId and position are required' });
  }

  try {
    const guild = await client.guilds.fetch(guildId);
    const role = guild.roles.cache.get(roleId);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.managed) {
      return res.status(403).json({ 
        error: 'No se pueden reordenar roles gestionados por integraciones' 
      });
    }

    const botMember = guild.members.me;
    if (!botMember) {
      return res.status(500).json({ error: 'Bot not found in guild' });
    }

    if (!botMember.permissions.has('ManageRoles')) {
      return res.status(403).json({ 
        error: 'El bot no tiene el permiso "Manage Roles"' 
      });
    }

    const highestBotRole = botMember.roles.highest;
    
    if (role.position > highestBotRole.position) {
      return res.status(403).json({ 
        error: `El rol "${role.name}" está por encima del rol del bot. Mueve el rol del bot más arriba en Discord.` 
      });
    }

    if (position > highestBotRole.position) {
      return res.status(403).json({ 
        error: `No puedes mover un rol por encima del rol del bot. El rol del bot está en posición ${highestBotRole.position}.` 
      });
    }

    await role.setPosition(position);
    console.log(`Rol reordenado: ${role.name} a posición ${position}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error reordering role:', error);
    res.status(500).json({
      error: 'Error al reordenar rol',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.get('/roles/:roleId/members-count', async (req, res) => {
  const { roleId } = req.params;
  const { guildId } = req.query;

  if (!guildId) {
    return res.status(400).json({ error: 'guildId is required' });
  }

  try {
    const guild = await client.guilds.fetch(guildId as string);
    const role = guild.roles.cache.get(roleId);
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ count: role.members.size });
  } catch (error) {
    console.error('Error getting role members count:', error);
    res.status(500).json({
      error: 'Error al obtener contador de miembros',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.post('/create-forum-thread', async (req, res) => {
  const { channelId, name, content, appliedTags, embedData, imageUrl } = req.body;

  if (!channelId || !name || !content) {
    return res.status(400).json({ error: 'channelId, name y content son requeridos' });
  }

  try {
    const channel = await client.channels.fetch(channelId);
    
    if (!channel || channel.type !== ChannelType.GuildForum) {
      return res.status(400).json({ error: 'El canal no es un foro' });
    }

    const messageOptions: any = { content };

    // Agregar embed si se proporciona embedData completo
    if (embedData && embedData.description) {
      const embed = new EmbedBuilder();
      if (embedData.title) embed.setTitle(embedData.title);
      if (embedData.description) embed.setDescription(embedData.description);
      if (embedData.color) {
        const colorValue = embedData.color.startsWith('#') 
          ? parseInt(embedData.color.substring(1), 16) 
          : parseInt(embedData.color, 16);
        embed.setColor(colorValue);
      }
      if (embedData.url) embed.setURL(embedData.url);
      if (embedData.image_url) embed.setImage(embedData.image_url);
      if (embedData.thumbnail_url) embed.setThumbnail(embedData.thumbnail_url);
      if (embedData.footer_text) {
        embed.setFooter({ 
          text: embedData.footer_text,
          iconURL: embedData.footer_icon_url || undefined
        });
      }
      if (embedData.author_name) {
        embed.setAuthor({ 
          name: embedData.author_name,
          iconURL: embedData.author_icon_url || undefined
        });
      }
      
      messageOptions.embeds = [embed];
    }
    // Si no hay embedData pero hay imageUrl, crear embed simple con imagen
    else if (imageUrl && !embedData) {
      const embed = new EmbedBuilder().setImage(imageUrl);
      messageOptions.embeds = [embed];
    }

    const thread = await channel.threads.create({
      name,
      message: messageOptions,
      appliedTags: appliedTags || []
    });

    // Obtener el mensaje inicial (starter message)
    let startMessageId: string | null = null;
    try {
      const starterMessage = await thread.fetchStarterMessage();
      if (starterMessage) {
        startMessageId = starterMessage.id;
      }
    } catch (err) {
      console.error(`No se pudo obtener starter message del thread ${thread.id}`);
    }

    console.log(`[FORUM] Thread creado: ${thread.name} (${thread.id}) con mensaje inicial ${startMessageId}`);
    res.json({ 
      success: true, 
      discord_thread_id: thread.id,
      start_message_id: startMessageId 
    });
  } catch (error) {
    console.error('Error creando thread:', error);
    res.status(500).json({
      error: 'Error al crear thread',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.post('/send-thread-message', async (req, res) => {
  const { threadId, content, mentions } = req.body;

  if (!threadId || !content) {
    return res.status(400).json({ error: 'threadId y content son requeridos' });
  }

  try {
    const thread = await client.channels.fetch(threadId);
    
    if (!thread || !thread.isThread()) {
      return res.status(400).json({ error: 'El canal no es un thread' });
    }

    const message = await thread.send({
      content,
      allowedMentions: { users: Array.isArray(mentions) ? mentions : [] }
    });

    console.log(`[FORUM] Mensaje enviado a thread ${thread.name}: ${message.id}`);
    res.json({ success: true, discord_message_id: message.id });
  } catch (error) {
    console.error('Error enviando mensaje a thread:', error);
    res.status(500).json({
      error: 'Error al enviar mensaje',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.patch('/update-thread', async (req, res) => {
  const { threadId, name, startMessageId, content } = req.body;

  if (!threadId || !name) {
    return res.status(400).json({ error: 'threadId y name son requeridos' });
  }

  try {
    const thread = await client.channels.fetch(threadId);
    
    if (!thread || !thread.isThread()) {
      return res.status(400).json({ error: 'El canal no es un thread' });
    }

    await thread.setName(name);
    
    if (content && startMessageId) {
      try {
        const starterMessage = await thread.messages.fetch(startMessageId);
        if (starterMessage) {
          await starterMessage.edit(content);
        }
      } catch (err) {
        console.error(`[FORUM] No se pudo editar el mensaje inicial: ${err}`);
      }
    }

    console.log(`[FORUM] Thread actualizado: ${thread.name}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando thread:', error);
    res.status(500).json({
      error: 'Error al actualizar thread',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.delete('/delete-thread', async (req, res) => {
  const { threadId } = req.body;

  if (!threadId) {
    return res.status(400).json({ error: 'threadId es requerido' });
  }

  try {
    const thread = await client.channels.fetch(threadId);
    
    if (!thread || !thread.isThread()) {
      return res.status(400).json({ error: 'El canal no es un thread' });
    }

    await thread.delete();
    console.log(`[FORUM] Thread eliminado: ${threadId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando thread:', error);
    res.status(500).json({
      error: 'Error al eliminar thread',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

botHttpServer.post('/force-sync-threads', async (req, res) => {
  try {
    console.log('[FORUM] Sincronización forzada de threads iniciada...');
    await syncAllThreads(client);
    res.json({ success: true, message: 'Sincronización completada' });
  } catch (error) {
    console.error('Error en sincronización forzada:', error);
    res.status(500).json({
      error: 'Error en sincronización',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

const BOT_HTTP_PORT = config.botHttpPort || 3004;
botHttpServer.listen(BOT_HTTP_PORT, '127.0.0.1', () => {
  console.log(`Bot HTTP server escuchando en puerto ${BOT_HTTP_PORT}`);
});

client.on(Events.Error, (error) => {
  console.error('Error del cliente de Discord:', error);
  updateBotStatus(false);
});

process.on('SIGINT', () => {
  console.log('Desconectando bot...');
  updateBotStatus(false);
  process.exit(0);
});

client.login(config.discordToken);
