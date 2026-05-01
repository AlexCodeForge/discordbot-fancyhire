export interface ChannelMessage {
  id: number;
  channel_id: number;
  discord_message_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  mentions: string[];
  sent_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export interface CreateChannelData {
  name: string;
  type?: string;
  topic?: string;
  parentId?: string;
}
