export interface ForumThread {
  id: number;
  discord_thread_id: string;
  channel_id: number;
  name: string;
  owner_id: string;
  owner_name: string;
  archived: boolean;
  locked: boolean;
  message_count: number;
  member_count: number;
  start_message_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ThreadMessage {
  id: number;
  thread_id: number;
  discord_message_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  mentions: string[] | null;
  sent_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}
