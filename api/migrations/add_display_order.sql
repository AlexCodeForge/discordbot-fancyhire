-- Agregar columna display_order a la tabla leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Inicializar el orden basado en created_at para cada stage
WITH ranked_leads AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY stage ORDER BY created_at DESC) as row_num
  FROM leads
)
UPDATE leads
SET display_order = ranked_leads.row_num
FROM ranked_leads
WHERE leads.id = ranked_leads.id;

-- Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_leads_stage_order ON leads(stage, display_order);
