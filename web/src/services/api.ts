import axios, { AxiosError } from 'axios';
import { Channel } from '../types/Channel';
import { ChannelMessage, CreateChannelData } from '../types/ChannelMessage';
import { Lead, LeadHistory } from '../types/Lead';
import { ForumThread, ThreadMessage } from '../types/ForumThread';
import { Conversation, ConversationFilters } from '../types/Conversation';

const API_BASE = import.meta.env.DEV ? '' : '';
const API_URL = `${API_BASE}/api/leads`;
const MESSAGES_URL = `${API_BASE}/api/messages`;
const CONVERSATIONS_URL = `${API_BASE}/api/conversations`;
const CHANNELS_URL = `${API_BASE}/api/channels`;
const DISCORD_URL = `${API_BASE}/api/discord`;
const TICKETS_URL = `${API_BASE}/api/tickets`;

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

  async getConversations(filters?: ConversationFilters): Promise<Conversation[]> {
    const params = new URLSearchParams();
    
    if (filters?.unread) params.append('unread', 'true');
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);

    const response = await axios.get(`${CONVERSATIONS_URL}?${params.toString()}`);
    return response.data;
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

  async createChannel(data: CreateChannelData): Promise<{ discord_channel_id: string }> {
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
      
      const response = await axios.post<{ discord_channel_id: string }>(`${CHANNELS_URL}/create`, body);
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

  async createTicket(leadId: number, createdBy: string): Promise<any> {
    try {
      const response = await axios.post(`${TICKETS_URL}/create`, {
        lead_id: leadId,
        created_by: createdBy
      });
      return response.data;
    } catch (err) {
      handleApiError(err, 'createTicket');
    }
  },

  async getTickets(leadId: number): Promise<any[]> {
    try {
      const response = await axios.get(`${TICKETS_URL}/lead/${leadId}`);
      return response.data;
    } catch (err) {
      handleApiError(err, 'getTickets');
    }
  },

  async getTicketMessages(ticketId: number, limit: number = 100): Promise<any[]> {
    try {
      const response = await axios.get(`${TICKETS_URL}/${ticketId}/messages?limit=${limit}`);
      return response.data;
    } catch (err) {
      handleApiError(err, 'getTicketMessages');
    }
  },

  async getTicketMessagesByChannelId(discordChannelId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${TICKETS_URL}/channel/${discordChannelId}/messages`);
      return response.data;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return [];
      }
      handleApiError(err, 'getTicketMessagesByChannelId');
    }
  },

  async closeTicket(ticketId: number, closedBy: string, notes?: string): Promise<any> {
    try {
      const response = await axios.post(`${TICKETS_URL}/${ticketId}/close`, {
        closed_by: closedBy,
        resolution_notes: notes,
        delete_channel: false
      });
      return response.data;
    } catch (err) {
      handleApiError(err, 'closeTicket');
    }
  },

  async transferTicket(ticketId: number, newUserId: string): Promise<void> {
    try {
      await axios.post(`${TICKETS_URL}/${ticketId}/transfer`, {
        new_user_id: newUserId
      });
    } catch (err) {
      handleApiError(err, 'transferTicket');
    }
  },

  async deleteTicketChannel(ticketId: number): Promise<void> {
    try {
      await axios.delete(`${TICKETS_URL}/${ticketId}/channel`);
    } catch (err) {
      handleApiError(err, 'deleteTicketChannel');
    }
  },

  async moveChannels(channelIds: number[], targetCategoryId: string | null): Promise<void> {
    try {
      await axios.patch(`${CHANNELS_URL}/move`, { channelIds, targetCategoryId });
    } catch (err) {
      handleApiError(err, 'moveChannels');
    }
  },

  async checkTicketChannelExists(ticketId: number): Promise<boolean> {
    try {
      const response = await axios.get<{ exists: boolean }>(`${TICKETS_URL}/${ticketId}/channel-exists`);
      return response.data.exists;
    } catch (err) {
      handleApiError(err, 'checkTicketChannelExists');
    }
  },

  async getTicketMetrics(): Promise<any> {
    try {
      const response = await axios.get(`${TICKETS_URL}/metrics/stats`);
      return response.data;
    } catch (err) {
      handleApiError(err, 'getTicketMetrics');
    }
  },

  async getAnnouncementTemplates(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE}/api/announcements/templates`);
      return response.data;
    } catch (err) {
      handleApiError(err, 'getAnnouncementTemplates');
    }
  },

  async createAnnouncementTemplate(data: { name: string; embedData: any }): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE}/api/announcements/templates`, data);
      return response.data;
    } catch (err) {
      handleApiError(err, 'createAnnouncementTemplate');
    }
  },

  async updateAnnouncementTemplate(id: number, embedData: any): Promise<any> {
    try {
      const response = await axios.put(`${API_BASE}/api/announcements/templates/${id}`, embedData);
      return response.data;
    } catch (err) {
      handleApiError(err, 'updateAnnouncementTemplate');
    }
  },

  async deleteAnnouncementTemplate(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/api/announcements/templates/${id}`);
    } catch (err) {
      handleApiError(err, 'deleteAnnouncementTemplate');
    }
  },

  async getAnnouncements(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE}/api/announcements`);
      return response.data;
    } catch (err) {
      handleApiError(err, 'getAnnouncements');
    }
  },

  async getAnnouncementWithStats(id: number): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE}/api/announcements/${id}/stats`);
      return response.data;
    } catch (err) {
      handleApiError(err, 'getAnnouncementWithStats');
    }
  },

  async deleteAnnouncement(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/api/announcements/${id}`);
    } catch (err) {
      handleApiError(err, 'deleteAnnouncement');
    }
  },

  async editAnnouncementEmbed(id: number, embedData: any): Promise<void> {
    try {
      const announcement = await axios.get(`${API_BASE}/api/announcements/${id}`);
      const { discord_channel_id, discord_message_id } = announcement.data;
      
      if (!discord_channel_id || !discord_message_id) {
        throw new Error('Anuncio no enviado o ya eliminado');
      }

      await axios.patch(`${API_BASE}/api/announcements/${id}`, embedData);
    } catch (err) {
      handleApiError(err, 'editAnnouncementEmbed');
    }
  },

  async getAnnouncementCategories(): Promise<any[]> {
    try {
      const response = await axios.get(`${API_BASE}/api/announcements/categories`);
      return response.data;
    } catch (err) {
      handleApiError(err, 'getAnnouncementCategories');
    }
  },

  async createAnnouncementCategory(data: { name: string; color?: string; description?: string }): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE}/api/announcements/categories`, data);
      return response.data;
    } catch (err) {
      handleApiError(err, 'createAnnouncementCategory');
    }
  },

  async updateAnnouncementCategory(id: number, data: { name: string; color?: string; description?: string }): Promise<any> {
    try {
      const response = await axios.put(`${API_BASE}/api/announcements/categories/${id}`, data);
      return response.data;
    } catch (err) {
      handleApiError(err, 'updateAnnouncementCategory');
    }
  },

  async deleteAnnouncementCategory(id: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/api/announcements/categories/${id}`);
    } catch (err) {
      handleApiError(err, 'deleteAnnouncementCategory');
    }
  },

  async getForumThreads(channelId: number): Promise<ForumThread[]> {
    try {
      const response = await axios.get(`${API_BASE}/api/forum/threads/${channelId}`);
      return response.data;
    } catch (err) {
      handleApiError(err, 'getForumThreads');
    }
  },

  async getThreadMessages(threadId: number, limit?: number): Promise<ThreadMessage[]> {
    try {
      const url = limit
        ? `${API_BASE}/api/forum/threads/${threadId}/messages?limit=${limit}`
        : `${API_BASE}/api/forum/threads/${threadId}/messages`;
      const response = await axios.get(url);
      return response.data;
    } catch (err) {
      handleApiError(err, 'getThreadMessages');
    }
  },

  async createForumThread(
    channelId: number,
    name: string,
    content: string,
    options?: {
      embedData?: { title?: string; description?: string; color?: string; image_url?: string; thumbnail_url?: string; url?: string; author_name?: string; author_icon_url?: string; footer_text?: string; footer_icon_url?: string };
      imageUrl?: string;
    }
  ): Promise<void> {
    try {
      await axios.post(`${API_BASE}/api/forum/threads/create`, {
        channelId,
        name,
        content,
        embedData: options?.embedData,
        imageUrl: options?.imageUrl,
      });
    } catch (err) {
      handleApiError(err, 'createForumThread');
    }
  },

  async sendThreadMessage(threadId: number, content: string, mentions?: string[]): Promise<ThreadMessage> {
    try {
      const response = await axios.post(`${API_BASE}/api/forum/threads/messages/send`, {
        threadId,
        content,
        mentions: mentions || []
      });
      return response.data;
    } catch (err) {
      handleApiError(err, 'sendThreadMessage');
    }
  },

  async updateThread(threadId: number, name: string, content?: string): Promise<void> {
    try {
      await axios.patch(`${API_BASE}/api/forum/threads/${threadId}`, {
        name,
        content,
      });
    } catch (err) {
      handleApiError(err, 'updateThread');
    }
  },

  async deleteThread(threadId: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/api/forum/threads/${threadId}`);
    } catch (err) {
      handleApiError(err, 'deleteThread');
    }
  },

  async deleteThreadMessage(threadId: number, discordMessageId: string): Promise<void> {
    try {
      await axios.delete(`${API_BASE}/api/forum/threads/messages/${discordMessageId}`, {
        data: { threadId }
      });
    } catch (err) {
      handleApiError(err, 'deleteThreadMessage');
    }
  },

  async getAllAutoMessages() {
    try {
      const response = await axios.get(`${API_BASE}/api/auto-messages`);
      return response.data;
    } catch (err) {
      handleApiError(err, 'getAllAutoMessages');
    }
  },

  async getAutoMessageByType(type: string) {
    try {
      const response = await axios.get(`${API_BASE}/api/auto-messages/${type}`);
      return response.data;
    } catch (err) {
      handleApiError(err, 'getAutoMessageByType');
    }
  },

  async updateAutoMessage(type: string, data: { content?: string; is_enabled?: boolean; description?: string }) {
    try {
      const response = await axios.put(`${API_BASE}/api/auto-messages/${type}`, data);
      return response.data;
    } catch (err) {
      handleApiError(err, 'updateAutoMessage');
    }
  },

  async previewAutoMessage(type: string, variables: Record<string, string | number>) {
    try {
      const response = await axios.post(`${API_BASE}/api/auto-messages/${type}/preview`, variables);
      return response.data;
    } catch (err) {
      handleApiError(err, 'previewAutoMessage');
    }
  },

  async resetAutoMessage(type: string) {
    try {
      const response = await axios.post(`${API_BASE}/api/auto-messages/${type}/reset`);
      return response.data;
    } catch (err) {
      handleApiError(err, 'resetAutoMessage');
    }
  },
};
