import { Lead, LeadStage } from './Lead';

export interface ConversationLead {
  id: number;
  name: string;
  email?: string;
  discord_id: string;
  discord_tag?: string;
  status: LeadStage;
  avatar?: string | null;
  username?: string;
  contact_discord?: string;
  service_interest?: string;
  stage: LeadStage;
  assigned_to?: string;
  notes?: string;
  source?: 'auto' | 'manual';
  display_order?: number;
  created_at?: string;
  updated_at?: string;
  unread_count?: number;
  has_open_ticket?: boolean;
}

export interface Conversation {
  lead: ConversationLead;
  lastMessage: {
    content: string;
    sentAt: string;
    senderType: 'user' | 'admin';
  };
  unreadCount: number;
  totalMessages: number;
}

export interface ConversationFilters {
  unread?: boolean;
  status?: string;
  search?: string;
  sortBy?: 'last_message' | 'unread_count' | 'name';
  dateFrom?: string;
  dateTo?: string;
}
