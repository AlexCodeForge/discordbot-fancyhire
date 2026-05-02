-- Agregar campos para el mensaje inicial del thread y reacciones
ALTER TABLE forum_threads 
ADD COLUMN IF NOT EXISTS start_message_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_forum_threads_start_message ON forum_threads(start_message_id);
