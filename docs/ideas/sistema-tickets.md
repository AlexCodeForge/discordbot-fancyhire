# Sistema de Tickets

## Concepto
Canales privados temporales por cada lead para conversaciones organizadas con historial completo y transcripciones guardadas.

## Funcionamiento

### Creación
- **Manual:** Botón "Abrir Ticket" desde el Kanban web o comando `/ticket` en Discord
- **Automática:** Detección de keywords en mensajes públicos (presupuesto, contratar, consulta)
- Canal creado: `ticket-{username}-{numero}`
- Permisos: Lead + Admins + Usuario asignado

### Durante el Ticket
- Conversación en tiempo real Discord
- Todos los mensajes sincronizados con la DB
- Archivos y media compartibles
- Botones de acción:
  - Cerrar ticket
  - Escalar a supervisor
  - Transferir a otro vendedor
  - Marcar como resuelto
- Panel lateral con contexto del lead (etapa, notas, compras previas)

### Cierre
- Genera transcripción completa (PDF/HTML)
- Guarda en DB vinculada al lead
- Archiva canal (solo admins pueden ver)
- Actualiza automáticamente etapa del lead según resultado
- Solicita rating opcional al lead (1-5 estrellas)

## Integración CRM

### Vista Web
- Botón "Abrir Ticket" en cada lead card
- Badge de notificación cuando hay mensajes nuevos
- Mensajes del ticket visibles en timeline del lead
- Lista completa de tickets (abiertos/cerrados/archivados)

### Vista Discord
- Canal categoría "TICKETS" con tickets activos
- Categoría "ARCHIVO" para tickets cerrados
- Comandos slash: `/ticket create`, `/ticket close`, `/ticket transfer`

## Métricas
- Tiempo promedio de resolución
- Mensajes por ticket
- Tasa de satisfacción (ratings)
- Tickets por vendedor
- Horarios de mayor actividad

## Ventajas vs DMs
- Colaboración multi-admin
- Historial organizado y buscable
- Contexto completo del lead visible
- Imagen profesional
- Transcripciones permanentes
- Seguimiento de métricas

## Base de Datos
Nueva tabla `tickets`:
- Relación con `leads`
- Estado: abierto, cerrado, archivado
- Timestamps de creación y cierre
- Usuario que creó y cerró
- Rating de satisfacción
- Canal de Discord asociado

Nueva tabla `ticket_transcripts`:
- Contenido HTML/texto completo
- URL del archivo PDF generado
- Metadata (duración, mensajes totales, participantes)
