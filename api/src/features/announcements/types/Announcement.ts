export interface AnnouncementEmbed {
  title?: string;
  description?: string;
  color?: string;
  url?: string;
  thumbnail_url?: string;
  image_url?: string;
  footer_text?: string;
  footer_icon_url?: string;
  author_name?: string;
  author_icon_url?: string;
}

export interface Announcement extends AnnouncementEmbed {
  id: number;
  created_by: string;
  created_at: Date;
  template_id?: number;
  discord_message_id?: string;
  discord_channel_id?: string;
  sent_at?: Date;
  status: 'draft' | 'sent' | 'deleted';
}

export interface SendAnnouncementRequest {
  channelId: string;
  embedData: AnnouncementEmbed;
}

export interface AnnouncementTemplate extends AnnouncementEmbed {
  id: number;
  name: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTemplateRequest {
  name: string;
  embedData: AnnouncementEmbed;
}

export interface ReactionStats {
  emoji: string;
  count: number;
  users: Array<{
    user_id: string;
    user_name: string;
    added_at: Date;
  }>;
}

export interface AnnouncementWithStats extends Announcement {
  reactions: ReactionStats[];
}

export interface AnnouncementReaction {
  id: number;
  announcement_id: number;
  emoji: string;
  user_id: string;
  user_name: string;
  added_at: Date;
  removed_at?: Date;
}
