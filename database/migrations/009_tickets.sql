-- Tabla principal de tickets
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  discord_channel_id VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'closed', 'archived')),
  created_by VARCHAR(100) NOT NULL,
  closed_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  resolution_notes TEXT
);

CREATE INDEX idx_tickets_lead_id ON tickets(lead_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_discord_channel ON tickets(discord_channel_id);

-- Mensajes de tickets
CREATE TABLE ticket_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  discord_message_id VARCHAR(100) NOT NULL,
  author_id VARCHAR(100) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- Transcripciones PDF de tickets
CREATE TABLE ticket_transcripts (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  pdf_url TEXT NOT NULL,
  message_count INTEGER NOT NULL,
  duration_minutes INTEGER,
  participants TEXT[],
  generated_at TIMESTAMP DEFAULT NOW()
);
