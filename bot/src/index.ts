import { Client, GatewayIntentBits, Events, GuildMember } from 'discord.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { config } from './config';

const BOT_STATUS_FILE = path.join(__dirname, '../../api/.bot-status.json');
const MEMBERS_CACHE_FILE = path.join(__dirname, '../../api/.discord-members-cache.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
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

const updateMembersCache = async () => {
  try {
    const guilds = client.guilds.cache;
    const allMembers: any[] = [];

    for (const [, guild] of guilds) {
      const members = await guild.members.fetch();
      members.forEach((member) => {
        if (!member.user.bot) {
          allMembers.push({
            id: member.id,
            username: member.user.username,
            tag: member.user.tag,
            displayName: member.displayName,
            avatar: member.user.avatar,
            joinedAt: member.joinedAt?.toISOString() || null,
          });
        }
      });
    }

    const cache = {
      members: allMembers,
      lastUpdate: new Date().toISOString(),
    };

    fs.writeFileSync(MEMBERS_CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`Cache actualizado: ${allMembers.length} miembros`);
  } catch (error) {
    console.error('Error actualizando cache de miembros:', error);
  }
};

client.once(Events.ClientReady, async (c) => {
  console.log(`Bot conectado como ${c.user.tag}`);
  console.log(`Monitoreando ${c.guilds.cache.size} servidor(es)`);
  
  updateBotStatus(true, c.user.tag);
  
  await updateMembersCache();
  
  setInterval(() => {
    updateBotStatus(true, c.user.tag);
  }, 60000);
  
  setInterval(() => {
    updateMembersCache();
  }, 300000);
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
      const adminChannel = await client.channels.fetch(config.adminChannelId);
      if (adminChannel?.isTextBased()) {
        await adminChannel.send(
          `🆕 **Nuevo lead capturado automáticamente**\n` +
          `👤 **Usuario:** ${member.user.tag}\n` +
          `🆔 **ID:** ${member.id}\n` +
          `📅 **Fecha:** ${new Date().toLocaleString('es-ES')}\n` +
          `✅ Lead guardado en el CRM con ID: ${response.data.id}`
        );
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
        if (adminChannel?.isTextBased()) {
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
