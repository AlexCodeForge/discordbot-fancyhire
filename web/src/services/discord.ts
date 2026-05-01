import axios from 'axios';

export interface DiscordRole {
  id: string;
  name: string;
  color: string;
  position: number;
}

export interface MemberPermissions {
  administrator: boolean;
  manageGuild: boolean;
  manageRoles: boolean;
  manageChannels: boolean;
  kickMembers: boolean;
  banMembers: boolean;
}

export interface DiscordMember {
  id: string;
  username: string;
  tag: string;
  display_name: string;
  avatar: string | null;
  joined_at: string | null;
  created_at: string;
  roles: DiscordRole[];
  permissions: MemberPermissions;
  updated_at?: string;
}

export interface MemberStats {
  total: number;
  topRoles: Array<{ name: string; count: number; color: string }>;
}

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

export interface GuildRole {
  id: string;
  name: string;
  color: string;
  position: number;
  permissions: string;
}

export interface RolePermissions {
  administrator: boolean;
  manageGuild: boolean;
  manageRoles: boolean;
  manageChannels: boolean;
  kickMembers: boolean;
  banMembers: boolean;
  viewChannel: boolean;
  sendMessages: boolean;
  manageMessages: boolean;
  mentionEveryone: boolean;
  manageNicknames: boolean;
  manageEmojisAndStickers: boolean;
  moderateMembers: boolean;
}

export interface GuildRoleDetailed extends GuildRole {
  hoist?: boolean;
  mentionable?: boolean;
  managed?: boolean;
  membersCount?: number;
}

export interface CreateRoleData {
  guildId: string;
  name: string;
  color?: string;
  permissions?: string[];
  hoist?: boolean;
  mentionable?: boolean;
}

export interface UpdateRoleData {
  guildId: string;
  name?: string;
  color?: string;
  permissions?: string[];
  hoist?: boolean;
  mentionable?: boolean;
}

export const discordApi = {
  async getMembers(): Promise<DiscordMember[]> {
    const response = await axios.get('/api/discord/members');
    return response.data;
  },

  async getRoles(): Promise<Array<{ id: string; name: string; color: string }>> {
    const response = await axios.get('/api/discord/roles');
    return response.data;
  },

  async getStats(): Promise<MemberStats> {
    const response = await axios.get('/api/discord/members/stats');
    return response.data;
  },

  async getGuilds(): Promise<Guild[]> {
    const response = await axios.get('/api/discord/guilds');
    return response.data;
  },

  async getGuildRoles(guildId: string): Promise<GuildRole[]> {
    const response = await axios.get(`/api/discord/guilds/${guildId}/roles`);
    return response.data;
  },

  async updateMemberRoles(memberId: string, guildId: string, roleIds: string[]): Promise<void> {
    await axios.post(`/api/discord/members/${memberId}/roles`, {
      guildId,
      roleIds
    });
  },

  async createRole(data: CreateRoleData): Promise<GuildRoleDetailed> {
    const response = await axios.post('/api/discord/roles', data);
    return response.data.role;
  },

  async updateRole(roleId: string, data: UpdateRoleData): Promise<GuildRoleDetailed> {
    const response = await axios.patch(`/api/discord/roles/${roleId}`, data);
    return response.data.role;
  },

  async deleteRole(roleId: string, guildId: string): Promise<void> {
    await axios.delete(`/api/discord/roles/${roleId}`, {
      data: { guildId }
    });
  },

  async updateRolePosition(roleId: string, guildId: string, position: number): Promise<void> {
    await axios.put(`/api/discord/roles/${roleId}/position`, {
      guildId,
      position
    });
  },

  async getRoleMembersCount(roleId: string, guildId: string): Promise<number> {
    const response = await axios.get(`/api/discord/roles/${roleId}/members-count?guildId=${guildId}`);
    return response.data.count;
  }
};
