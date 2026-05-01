-- Tabla principal de leads
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    discord_id VARCHAR(100) UNIQUE,
    discord_tag VARCHAR(100),
    contact_discord VARCHAR(255) NOT NULL,
    service_interest TEXT,
    stage VARCHAR(50) DEFAULT 'nuevo' CHECK (stage IN ('nuevo', 'contactado', 'propuesta_enviada', 'negociacion', 'ganado', 'perdido')),
    assigned_to VARCHAR(100),
    notes TEXT,
    source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('auto', 'manual')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de historial de cambios
CREATE TABLE IF NOT EXISTS lead_history (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_discord_id ON leads(discord_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_history_lead_id ON lead_history(lead_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
