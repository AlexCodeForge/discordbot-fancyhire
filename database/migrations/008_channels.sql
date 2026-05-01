-- Tablas para el sistema de gestión de canales Discord (metadatos y mensajes)
CREATE TABLE IF NOT EXISTS channels (
  id SERIAL PRIMARY KEY,
  discord_channel_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  position INTEGER DEFAULT 0,
  parent_id VARCHAR(255),
  topic TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS channel_messages (
  id SERIAL PRIMARY KEY,
  channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
  discord_message_id VARCHAR(255) UNIQUE NOT NULL,
  author_id VARCHAR(255) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_avatar VARCHAR(500),
  content TEXT NOT NULL,
  mentions TEXT[],
  sent_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_channels_position ON channels(position);
CREATE INDEX idx_channel_messages_channel_id ON channel_messages(channel_id);
CREATE INDEX idx_channel_messages_sent_at ON channel_messages(sent_at DESC);
