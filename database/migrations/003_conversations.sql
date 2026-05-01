-- Tabla de mensajes para conversaciones CRM-Discord
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  discord_message_id VARCHAR(100),
  content TEXT NOT NULL,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('admin', 'user')),
  sender_name VARCHAR(255),
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  error TEXT
);

CREATE INDEX idx_messages_lead_id ON messages(lead_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
