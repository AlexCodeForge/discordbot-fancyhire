import axios, { AxiosError } from 'axios';
import { Channel } from '../types/Channel';
import { ChannelMessage, CreateChannelData } from '../types/ChannelMessage';
import { Lead, LeadHistory } from '../types/Lead';

const API_BASE = import.meta.env.DEV ? '' : '';
const API_URL = `${API_BASE}/api/leads`;
const MESSAGES_URL = `${API_BASE}/api/messages`;
const CHANNELS_URL = `${API_BASE}/api/channels`;
const DISCORD_URL = `${API_BASE}/api/discord`;

export interface DiscordMember {
  id: string;
  username: string;
  tag: string;
  display_name: string;
  avatar: string | null;
  joined_at: string | null;
  created_at: string;
  roles: Array<{ id: string; name: string; color: string; position: number }>;
  permissions: Record<string, boolean>;
}

function handleApiError(err: unknown, context: string): never {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ message?: string; error?: string }>;
    const msg =
      ax.response?.data?.message ??
      ax.response?.data?.error ??
      ax.message ??
      context;
    throw new Error(`${context}: ${msg}`);
  }
  throw err;
}

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  async getAllLeads(): Promise<Lead[]> {
    const response = await axios.get(API_URL);
    return response.data;
  },

  async getLeadById(id: number): Promise<Lead> {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  async createLead(data: Partial<Lead>): Promise<Lead> {
    const response = await axios.post(API_URL, data);
    return response.data;
  },

  async updateLead(id: number, data: Partial<Lead>): Promise<Lead> {
    const response = await axios.patch(`${API_URL}/${id}`, data);
    return response.data;
  },

  async deleteLead(id: number): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  },

  async getLeadHistory(id: number): Promise<LeadHistory[]> {
    const response = await axios.get(`${API_URL}/${id}/history`);
    return response.data;
  },

  async reorderLead(id: number, stage: string, order: number): Promise<Lead> {
    const response = await axios.post(`${API_URL}/${id}/reorder`, { stage, order });
    return response.data;
  },

  async getMessages(leadId: number): Promise<any[]> {
    const response = await axios.get(`${MESSAGES_URL}/${leadId}`);
    return response.data;
  },

  async sendMessage(leadId: number, content: string, senderName: string): Promise<any> {
    const response = await axios.post(`${MESSAGES_URL}/${leadId}/send`, {
      content,
      sender_name: senderName
    });
    return response.data;
  },

  async markMessagesRead(leadId: number): Promise<void> {
    await axios.patch(`${MESSAGES_URL}/${leadId}/mark-read`);
  },

  async getUnreadCount(leadId: number): Promise<number> {
    const response = await axios.get(`${MESSAGES_URL}/${leadId}/unread`);
    return response.data.count;
  },

  async getChannels(): Promise<Channel[]> {
    try {
      const response = await axios.get<Channel[]>(CHANNELS_URL);
      return response.data;
    } catch (err) {
      handleApiError(err, 'getChannels');
    }
  },

  async getMembers(): Promise<DiscordMember[]> {
    const response = await axios.get<DiscordMember[]>(`${DISCORD_URL}/members`);
    return response.data;
  },

  async createChannel(data: CreateChannelData): Promise<Channel> {
    try {
      const body: {
        name: string;
        type?: string;
        topic?: string;
        parent_id?: string;
      } = { name: data.name };
      if (data.type !== undefined) body.type = data.type;
      if (data.topic !== undefined) body.topic = data.topic;
      if (data.parentId !== undefined) body.parent_id = data.parentId;
      const response = await axios.post<Channel>(`${CHANNELS_URL}/create`, body);
      return response.data;
    } catch (err) {
      handleApiError(err, 'createChannel');
    }
  },

  async deleteChannel(discordChannelId: string): Promise<void> {
    try {
      const id = encodeURIComponent(discordChannelId);
      await axios.delete(`${CHANNELS_URL}/${id}/delete`);
    } catch (err) {
      handleApiError(err, 'deleteChannel');
    }
  },

  async getChannelMessages(channelId: number, limit?: number): Promise<ChannelMessage[]> {
    try {
      const response = await axios.get<ChannelMessage[]>(
        `${CHANNELS_URL}/${channelId}/messages`,
        limit !== undefined ? { params: { limit } } : {}
      );
      return response.data;
    } catch (err) {
      handleApiError(err, 'getChannelMessages');
    }
  },

  async sendChannelMessage(
    channelId: number,
    content: string,
    mentions: string[]
  ): Promise<ChannelMessage> {
    try {
      const response = await axios.post<ChannelMessage>(
        `${CHANNELS_URL}/${channelId}/messages/send`,
        { content, mentions }
      );
      return response.data;
    } catch (err) {
      handleApiError(err, 'sendChannelMessage');
    }
  },

  async deleteChannelMessage(channelId: number, discordMessageId: string): Promise<void> {
    try {
      const mid = encodeURIComponent(discordMessageId);
      await axios.delete(`${CHANNELS_URL}/${channelId}/messages/${mid}`);
    } catch (err) {
      handleApiError(err, 'deleteChannelMessage');
    }
  },
};
