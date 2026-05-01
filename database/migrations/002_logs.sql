-- Migration: System Logs Table
-- Description: Tabla para almacenar logs del sistema con soporte para diferentes niveles y contexto

CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  level VARCHAR(20) NOT NULL CHECK (level IN ('error', 'warning', 'info', 'debug')),
  message TEXT NOT NULL,
  context JSONB,
  stack_trace TEXT,
  user_id VARCHAR(100),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar performance de consultas
CREATE INDEX idx_logs_level ON system_logs(level);
CREATE INDEX idx_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_logs_user_id ON system_logs(user_id) WHERE user_id IS NOT NULL;

-- Comentarios para documentación
COMMENT ON TABLE system_logs IS 'Registro centralizado de eventos y errores del sistema';
COMMENT ON COLUMN system_logs.level IS 'Nivel del log: error, warning, info, debug';
COMMENT ON COLUMN system_logs.context IS 'Datos adicionales en formato JSON';
COMMENT ON COLUMN system_logs.stack_trace IS 'Stack trace del error (solo para errores)';
