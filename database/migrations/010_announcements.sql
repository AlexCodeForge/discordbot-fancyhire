CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
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
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX idx_announcements_created_by ON announcements(created_by);
