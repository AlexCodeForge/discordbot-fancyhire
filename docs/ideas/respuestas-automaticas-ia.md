# Respuestas Automáticas con IA

## Concepto
Bot responde automáticamente mensajes de leads usando IA cuando tiene suficiente confianza, escalando a humano cuando sea necesario.

## Funcionamiento

### Flujo Principal
1. Usuario envía DM en Discord
2. Bot analiza mensaje con contexto del lead (historial, etapa, notas)
3. IA decide: responder automáticamente o escalar a humano
4. Si responde: genera respuesta personalizada y envía
5. Si escala: notifica en CRM para atención humana

### Análisis de Contexto
- Historial completo de conversaciones previas
- Etapa actual del lead en el kanban
- Tags y categorización del lead
- Horario laboral y disponibilidad
- Configuración de temas permitidos

### Decisión de Respuesta
- Umbral de confianza mínimo (ej: 80%)
- Lista blanca de temas FAQ permitidos
- Blacklist de temas que siempre escalan
- Ventana horaria (solo en horario laboral)
- Override manual por lead específico

### Generación de Respuesta
- Tono consistente con la marca
- Personalización según historial del lead
- Respuestas naturales, no robóticas
- Incluye llamadas a acción cuando corresponde
- Menciona disponibilidad humana si es necesario

## Configuración

### Por Lead
- Toggle on/off de respuestas automáticas
- Temas específicos permitidos/bloqueados
- Nivel de confianza requerido personalizado

### Global
- Horario de operación
- Lista de FAQ entrenable
- Templates de respuesta base
- Configuración de proveedor IA (OpenAI, Anthropic, local)

## Integración CRM

### Panel de Control IA
- Dashboard con métricas de respuestas automáticas
- Tasa de auto-respuesta vs escalado
- Precisión y feedback de usuarios
- Configuración global de IA

### Vista por Lead
- Indicador visual de mensajes auto-respondidos
- Opción de desactivar IA para lead específico
- Feedback sobre calidad de respuestas
- Botón "tomar control" para intervenir manualmente

### Notificaciones
- Alerta cuando IA escala a humano
- Notificación de respuestas con baja confianza
- Resumen diario de actividad IA

## Casos de Uso Permitidos

### Auto-respuesta Segura
- Preguntas frecuentes (horarios, servicios, precios públicos)
- Confirmación de recepción de mensaje
- Agendamiento de llamadas
- Envío de recursos (links, documentos)
- Seguimiento de status de proceso

### Escalado Obligatorio
- Negociación de precios personalizados
- Quejas o reclamos
- Solicitudes urgentes
- Temas técnicos complejos
- Mensajes emocionales negativos

## Base de Datos

Nueva tabla `ai_interactions`:
- Relación con `leads` y `messages`
- Decisión tomada (auto-respond, escalate)
- Nivel de confianza
- Tema detectado
- Feedback del usuario si existe
- Tiempo de respuesta

Nueva columna en `leads`:
- `ai_enabled` (boolean)
- `ai_confidence_threshold` (decimal)

Nueva tabla `ai_training_data`:
- Pares pregunta-respuesta aprobadas
- Feedback histórico para mejorar
- Templates de respuesta exitosos

## Métricas

### Operacionales
- Porcentaje de mensajes auto-respondidos
- Tasa de escalado a humano
- Tiempo de respuesta promedio
- Ahorro de tiempo del equipo

### Calidad
- Satisfacción del usuario con respuestas IA
- Tasa de corrección humana necesaria
- Precisión de clasificación de temas
- Feedback positivo vs negativo

## Consideraciones

### Costos
- OpenAI GPT-4: ~$0.03 por conversación
- OpenAI GPT-3.5: ~$0.002 por conversación
- Alternativa local: costo inicial de setup, gratis después

### Seguridad
- No compartir información sensible automáticamente
- Validación de identidad antes de datos personales
- Logs completos de decisiones IA
- Override humano siempre disponible

### Experiencia Usuario
- Transparencia: indicar cuando es bot
- Opción de solicitar humano en cualquier momento
- No fingir ser humano
- Transición suave bot-humano
