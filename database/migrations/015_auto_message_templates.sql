-- Migration 015: Auto Message Templates
-- Sistema de gestión de mensajes automáticos del bot

CREATE TABLE IF NOT EXISTS auto_message_templates (
  id SERIAL PRIMARY KEY,
  message_type VARCHAR(50) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  available_variables TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice en message_type para búsquedas rápidas
CREATE INDEX idx_auto_message_templates_type ON auto_message_templates(message_type);

-- Insertar templates por defecto con contenido actual del bot
INSERT INTO auto_message_templates (message_type, content, is_enabled, description, available_variables) VALUES
(
  'welcome_dm',
  '¡Bienvenido/a al servidor! 👋

Gracias por unirte. Pronto nos pondremos en contacto contigo para conocer tus necesidades.

Si tienes alguna pregunta, no dudes en contactarnos.',
  true,
  'Mensaje de bienvenida por DM cuando un nuevo miembro se une al servidor',
  ARRAY['username', 'userId', 'serverName']
),
(
  'admin_new_lead',
  '🆕 **Nuevo lead capturado automáticamente**
👤 **Usuario:** {username}
🆔 **ID:** {userId}
📅 **Fecha:** {date}
✅ Lead guardado en el CRM con ID: {leadId}',
  true,
  'Notificación al canal admin cuando se captura un nuevo lead',
  ARRAY['username', 'userId', 'leadId', 'date']
),
(
  'admin_lead_error',
  '⚠️ **Error al capturar lead**
Usuario: {username}
Error: {error}',
  true,
  'Notificación al canal admin cuando falla la captura de un lead',
  ARRAY['username', 'error']
),
(
  'ticket_open',
  'Ticket abierto para **{leadName}**.
Este es un canal privado para gestionar la conversación.',
  true,
  'Mensaje de bienvenida al crear un nuevo canal de ticket',
  ARRAY['leadName', 'leadId']
),
(
  'ticket_close',
  '🔒 Este ticket ha sido cerrado y archivado.',
  true,
  'Mensaje enviado al cerrar y archivar un ticket',
  ARRAY['channelName']
),
(
  'ticket_transfer',
  '🔄 Ticket transferido a <@{newUserId}>',
  true,
  'Mensaje enviado al transferir un ticket a otro usuario',
  ARRAY['newUserId', 'newUserName']
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_auto_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_auto_message_templates_updated_at
BEFORE UPDATE ON auto_message_templates
FOR EACH ROW
EXECUTE FUNCTION update_auto_message_templates_updated_at();
