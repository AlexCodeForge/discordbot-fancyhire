CREATE TABLE IF NOT EXISTS discord_members (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  tag VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  avatar VARCHAR(255),
  joined_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL,
  roles JSONB DEFAULT '[]'::jsonb,
  permissions JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discord_members_username ON discord_members(username);
CREATE INDEX IF NOT EXISTS idx_discord_members_roles ON discord_members USING GIN(roles);
