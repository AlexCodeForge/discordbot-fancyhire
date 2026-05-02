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
  created_at: string;
  template_id?: number;
  category_id?: number;
  discord_message_id?: string;
  discord_channel_id?: string;
  sent_at?: string;
  status: 'draft' | 'sent' | 'deleted';
}

export interface AnnouncementCategory {
  id: number;
  name: string;
  color?: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementTemplate extends AnnouncementEmbed {
  id: number;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ReactionStats {
  emoji: string;
  count: number;
  users: Array<{
    user_id: string;
    user_name: string;
    added_at: string;
  }>;
}

export interface AnnouncementWithStats extends Announcement {
  reactions: ReactionStats[];
}
