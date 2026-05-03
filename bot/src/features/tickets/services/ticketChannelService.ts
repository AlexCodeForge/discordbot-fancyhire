import {
  Client,
  ChannelType,
  PermissionFlagsBits,
  CategoryChannel,
  TextChannel,
  OverwriteType,
} from 'discord.js';
import { MessageTemplateService } from '../../../services/messageTemplateService';

export class TicketChannelService {
  private client: Client;
  private TICKETS_CATEGORY_NAME = 'TICKETS';
  private TICKETS_ARCHIVE_CATEGORY_NAME = 'TICKETS-ARCHIVO';

  constructor(client: Client) {
    this.client = client;
  }

  private async getOrCreateCategory(
    guildId: string,
    categoryName: string
  ): Promise<CategoryChannel> {
    const guild = this.client.guilds.cache.get(guildId);
    if (!guild) {
      throw new Error('Servidor no encontrado');
    }

    let category = guild.channels.cache.find(
      (ch) => ch.type === ChannelType.GuildCategory && ch.name === categoryName
    ) as CategoryChannel | undefined;

    if (!category) {
      category = await guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });
      console.log(`Categoría ${categoryName} creada`);
    }

    return category;
  }

  async createTicketChannel(
    leadName: string,
    leadDiscordId: string,
    assignedTo?: string
  ): Promise<{ channel_id: string }> {
    try {
      const guilds = this.client.guilds.cache;
      if (guilds.size === 0) {
        throw new Error('Bot no está en ningún servidor');
      }

      const guild = guilds.first()!;
      
      const category = await this.getOrCreateCategory(guild.id, this.TICKETS_CATEGORY_NAME);

      const ticketNumber = Date.now().toString().slice(-6);
      const channelName = `ticket-${leadName.toLowerCase().replace(/\s+/g, '-')}-${ticketNumber}`;

      const permissionOverwrites: any[] = [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: leadDiscordId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
      ];

      const adminRoles = guild.roles.cache.filter((role) =>
        role.permissions.has(PermissionFlagsBits.Administrator)
      );

      adminRoles.forEach((role) => {
        permissionOverwrites.push({
          id: role.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
          ],
        });
      });

      if (assignedTo) {
        permissionOverwrites.push({
          id: assignedTo,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        });
      }

      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites,
        topic: `Ticket para ${leadName}`,
      });

      const welcomeMessage = await MessageTemplateService.getMessageWithFallback('ticket_open', {
        leadName,
        leadDiscordId
      });
      await channel.send(welcomeMessage);

      console.log(`Canal de ticket creado: ${channel.id} - ${channelName}`);

      return { channel_id: channel.id };
    } catch (error) {
      console.error('Error creando canal de ticket:', error);
      throw error;
    }
  }

  async closeTicketChannel(channelId: string): Promise<void> {
    try {
      const channel = this.client.channels.cache.get(channelId) as TextChannel;
      if (!channel) {
        throw new Error('Canal no encontrado');
      }

      const guild = channel.guild;
      const archiveCategory = await this.getOrCreateCategory(
        guild.id,
        this.TICKETS_ARCHIVE_CATEGORY_NAME
      );

      await channel.setParent(archiveCategory.id, { lockPermissions: false });

      const closeMessage = await MessageTemplateService.getMessageWithFallback('ticket_close', {
        channelName: channel.name
      });
      await channel.send(closeMessage);

      console.log(`Ticket ${channelId} archivado`);
    } catch (error) {
      console.error('Error cerrando canal de ticket:', error);
      throw error;
    }
  }

  async updateChannelPermissions(
    channelId: string,
    userId: string,
    allow: boolean
  ): Promise<void> {
    try {
      const channel = this.client.channels.cache.get(channelId) as TextChannel;
      if (!channel) {
        throw new Error('Canal no encontrado');
      }

      if (allow) {
        await channel.permissionOverwrites.create(userId, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });
      } else {
        await channel.permissionOverwrites.delete(userId);
      }

      console.log(`Permisos actualizados en ${channelId} para usuario ${userId}`);
    } catch (error) {
      console.error('Error actualizando permisos de canal:', error);
      throw error;
    }
  }

  async transferTicket(
    channelId: string,
    newUserId: string,
    oldUserId?: string
  ): Promise<void> {
    try {
      const channel = this.client.channels.cache.get(channelId) as TextChannel;
      if (!channel) {
        throw new Error('Canal no encontrado');
      }

      if (oldUserId) {
        await this.updateChannelPermissions(channelId, oldUserId, false);
      }

      await this.updateChannelPermissions(channelId, newUserId, true);

      const transferMessage = await MessageTemplateService.getMessageWithFallback('ticket_transfer', {
        newUserId,
        newUserName: newUserId
      });
      await channel.send(transferMessage);

      console.log(`Ticket ${channelId} transferido de ${oldUserId} a ${newUserId}`);
    } catch (error) {
      console.error('Error transfiriendo ticket:', error);
      throw error;
    }
  }

  async deleteChannel(channelId: string): Promise<void> {
    try {
      const channel = this.client.channels.cache.get(channelId) as TextChannel;
      if (!channel) {
        throw new Error('Canal no encontrado');
      }

      await channel.delete();

      console.log(`Canal de ticket ${channelId} eliminado permanentemente`);
    } catch (error) {
      console.error('Error eliminando canal de ticket:', error);
      throw error;
    }
  }
}
