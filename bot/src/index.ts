import { Client, GatewayIntentBits, Events, GuildMember, Partials, ChannelType, DMChannel, Message } from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { config } from './config';

const BOT_STATUS_FILE = path.join(__dirname, '../../api/.bot-status.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
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

client.once(Events.ClientReady, async (c) => {
  console.log(`Bot conectado como ${c.user.tag}`);
  console.log(`Monitoreando ${c.guilds.cache.size} servidor(es)`);
  
  updateBotStatus(true, c.user.tag);
  
  await syncMembersToDatabase();
  
  console.log('Sincronizando mensajes perdidos...');
  await syncAllDMs();
  
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
          await adminChannel.send(
            `🆕 **Nuevo lead capturado automáticamente**\n` +
            `👤 **Usuario:** ${member.user.tag}\n` +
            `🆔 **ID:** ${member.id}\n` +
            `📅 **Fecha:** ${new Date().toLocaleString('es-ES')}\n` +
            `✅ Lead guardado en el CRM con ID: ${response.data.id}`
          );
        }
      } catch (channelError) {
        console.error('Error al notificar en canal admin:', channelError);
      }
    }

    try {
      await member.send(
        `¡Bienvenido/a al servidor! 👋\n\n` +
        `Gracias por unirte. Pronto nos pondremos en contacto contigo para conocer tus necesidades.\n\n` +
        `Si tienes alguna pregunta, no dudes en contactarnos.`
      );
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
          await adminChannel.send(
            `⚠️ **Error al capturar lead**\n` +
            `Usuario: ${member.user.tag}\n` +
            `Error: ${error instanceof Error ? error.message : 'Error desconocido'}`
          );
        }
      } catch (notifyError) {
        console.error('Error al notificar error en canal admin:', notifyError);
      }
    }
  }
});

client.on(Events.GuildMemberUpdate, async (oldMember: GuildMember, newMember: GuildMember) => {
  if (newMember.user.bot) return;
  console.log(`Miembro actualizado: ${newMember.user.tag}`);
  await syncMemberToDatabase(newMember);
});

client.on(Events.GuildMemberRemove, async (member: GuildMember) => {
  if (member.user.bot) return;
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
  if (message.author.bot) return;
  if (message.channel.type !== ChannelType.DM) return;
  
  console.log(`DM recibido de ${message.author.tag}: ${message.content}`);
  
  try {
    await axios.post(`${config.apiUrl}/api/messages/incoming`, {
      discord_id: message.author.id,
      content: message.content,
      discord_message_id: message.id,
      sender_name: message.author.tag
    });
    console.log(`Mensaje de ${message.author.tag} guardado en BD`);
  } catch (error) {
    console.error('Error al guardar mensaje DM:', error);
  }
});

import express from 'express';

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

const botHttpServer = express();
botHttpServer.use(express.json());

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
