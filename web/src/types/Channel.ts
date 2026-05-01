export interface Channel {
  id: number;
  discord_channel_id: string;
  name: string;
  type: string;
  position: number;
  parent_id: string | null;
  topic: string | null;
  created_at: string;
  updated_at: string;
}
