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
  }
};
