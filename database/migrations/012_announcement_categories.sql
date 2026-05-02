-- Crear tabla de categorías de anuncios
CREATE TABLE IF NOT EXISTS announcement_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  color VARCHAR(7),
  description TEXT,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agregar columna de categoría a announcements
ALTER TABLE announcements 
  ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES announcement_categories(id) ON DELETE SET NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_announcements_category_id ON announcements(category_id);
CREATE INDEX IF NOT EXISTS idx_announcement_categories_name ON announcement_categories(name);

-- Insertar categorías por defecto
INSERT INTO announcement_categories (name, color, description, created_by) VALUES
  ('General', '#1c69d4', 'Anuncios generales', 'system'),
  ('Actualizaciones', '#10b981', 'Actualizaciones y cambios', 'system'),
  ('Eventos', '#f59e0b', 'Eventos y actividades', 'system'),
  ('Importante', '#ef4444', 'Anuncios importantes', 'system')
ON CONFLICT (name) DO NOTHING;
