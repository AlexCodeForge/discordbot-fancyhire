-- Crear tabla de templates
CREATE TABLE IF NOT EXISTS announcement_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(256) NOT NULL UNIQUE,
  title VARCHAR(256),
  description TEXT,
  color VARCHAR(7),
  thumbnail_url TEXT,
  image_url TEXT,
  footer_text VARCHAR(256),
  footer_icon_url TEXT,
  author_name VARCHAR(256),
  author_icon_url TEXT,
  url TEXT,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Modificar tabla announcements
ALTER TABLE announcements 
  ADD COLUMN IF NOT EXISTS template_id INTEGER REFERENCES announcement_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discord_message_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS discord_channel_id VARCHAR(20),
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'deleted'));

-- Crear tabla de reacciones
CREATE TABLE IF NOT EXISTS announcement_reactions (
  id SERIAL PRIMARY KEY,
  announcement_id INTEGER NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  emoji VARCHAR(100) NOT NULL,
  user_id VARCHAR(20) NOT NULL,
  user_name VARCHAR(100),
  added_at TIMESTAMP DEFAULT NOW(),
  removed_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_announcement_templates_created_by ON announcement_templates(created_by);
CREATE INDEX idx_announcement_templates_name ON announcement_templates(name);
CREATE INDEX idx_announcements_template_id ON announcements(template_id);
CREATE INDEX idx_announcements_discord_message_id ON announcements(discord_message_id);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcement_reactions_announcement_id ON announcement_reactions(announcement_id);
CREATE INDEX idx_announcement_reactions_user_id ON announcement_reactions(user_id);
CREATE INDEX idx_announcement_reactions_removed_at ON announcement_reactions(removed_at);
