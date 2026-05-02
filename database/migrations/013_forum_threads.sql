-- Migration 013: Forum Threads Support
-- Adds tables for managing Discord forum channels with threads

-- Table for storing forum threads
CREATE TABLE IF NOT EXISTS forum_threads (
  id SERIAL PRIMARY KEY,
  discord_thread_id VARCHAR(255) UNIQUE NOT NULL,
  channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  owner_id VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255) NOT NULL,
  archived BOOLEAN DEFAULT false,
  locked BOOLEAN DEFAULT false,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_forum_threads_channel_id ON forum_threads(channel_id);
CREATE INDEX idx_forum_threads_archived ON forum_threads(archived);
CREATE INDEX idx_forum_threads_discord_id ON forum_threads(discord_thread_id);

-- Table for storing messages within forum threads
CREATE TABLE IF NOT EXISTS thread_messages (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER REFERENCES forum_threads(id) ON DELETE CASCADE,
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

CREATE INDEX idx_thread_messages_thread_id ON thread_messages(thread_id);
CREATE INDEX idx_thread_messages_sent_at ON thread_messages(sent_at DESC);
CREATE INDEX idx_thread_messages_discord_id ON thread_messages(discord_message_id);
