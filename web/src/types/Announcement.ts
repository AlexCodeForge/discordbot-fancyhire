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
}
