---
name: Identificar canales de tickets
overview: Agregar identificación visual de canales de tickets en la vista de canales, permitiendo filtrado y mejor gestión mediante un JOIN con la tabla tickets.
todos:
  - id: backend-model
    content: Agregar método getAllWithTicketInfo() al modelo Channel con LEFT JOIN
    status: pending
  - id: backend-router
    content: Actualizar endpoint GET /api/channels para usar nuevo método
    status: pending
  - id: frontend-types
    content: Extender interfaz Channel con campos opcionales de ticket
    status: pending
  - id: frontend-visual
    content: Agregar identificación visual (badge/icono) para canales de tickets en sidebar
    status: pending
  - id: frontend-filters
    content: Implementar filtros para mostrar todos/solo tickets/solo canales normales
    status: pending
  - id: frontend-header
    content: Mostrar info de ticket en ChannelHeader cuando corresponda
    status: pending
isProject: false
---

# Identificar Canales de Tickets en Vista de Canales

## Análisis del Sistema Actual

**Estructura de datos:**
- Tabla `channels`: almacena todos los canales sincronizados (texto, foros, categorías)
- Tabla `tickets`: almacena tickets con `discord_channel_id` único
- **Problema:** No hay relación directa entre ambas tablas en el schema

**Flujo actual:**
1. Se crea ticket desde CRM → bot crea canal `ticket-{leadName}-{timestamp}`
2. Canal se registra en `tickets.discord_channel_id`
3. Bot sincroniza canal a tabla `channels` (sin identificar que es ticket)
4. Vista web muestra todos los canales sin distinción

## Solución Propuesta

### Backend Changes

**1. Modificar endpoint GET /api/channels**

Archivo: [`api/src/features/channels/routes/channels.ts`](api/src/features/channels/routes/channels.ts)

Cambiar el handler para hacer LEFT JOIN con tickets:

```sql
SELECT 
  c.*,
  t.id as ticket_id,
  t.lead_id,
  t.status as ticket_status,
  t.created_by as ticket_created_by
FROM channels c
LEFT JOIN tickets t ON c.discord_channel_id = t.discord_channel_id
ORDER BY c.position ASC NULLS LAST, c.id ASC
```

**2. Actualizar modelo Channel**

Archivo: [`api/src/features/channels/models/Channel.ts`](api/src/features/channels/models/Channel.ts)

- Agregar método `getAllWithTicketInfo()` que ejecute el JOIN
- Retornar campos opcionales de ticket si existen

**3. Actualizar tipo de respuesta**

El endpoint debe retornar canales con campos opcionales:
- `ticket_id?: number`
- `lead_id?: number`
- `ticket_status?: 'open' | 'closed' | 'archived'`
- `ticket_created_by?: string`

### Frontend Changes

**1. Actualizar interfaz Channel**

Archivo: [`web/src/types/Channel.ts`](web/src/types/Channel.ts)

Agregar campos opcionales:
```typescript
ticket_id?: number;
lead_id?: number;
ticket_status?: 'open' | 'closed' | 'archived';
ticket_created_by?: string;
```

**2. Identificación visual en ChannelSidebar**

Archivo: [`web/src/components/channels/ChannelSidebar.tsx`](web/src/components/channels/ChannelSidebar.tsx)

- Mostrar badge/icono especial para canales con `ticket_id`
- Usar icono 🎫 o badge "TICKET" junto al nombre
- Aplicar color distintivo (ej: `var(--bmw-accent-secondary)`)
- Mostrar estado del ticket (open/closed/archived) con colores:
  - `open`: verde
  - `closed`: gris
  - `archived`: azul

**3. Filtrado de canales**

Agregar toggle en el header del sidebar para filtrar:
- "Todos los canales"
- "Solo tickets"
- "Solo canales normales"

**4. ChannelHeader con info de ticket**

Archivo: [`web/src/components/channels/ChannelHeader.tsx`](web/src/components/channels/ChannelHeader.tsx)

Si el canal tiene `ticket_id`, mostrar:
- Badge "TICKET" prominente
- Estado del ticket
- Link al lead asociado (si `lead_id` existe)

### Implementación Detallada

**Paso 1: Backend - Modelo**

En `Channel.ts`, agregar:

```typescript
static async getAllWithTicketInfo(): Promise<any[]> {
  const query = `
    SELECT 
      c.*,
      t.id as ticket_id,
      t.lead_id,
      t.status as ticket_status,
      t.created_by as ticket_created_by
    FROM channels c
    LEFT JOIN tickets t ON c.discord_channel_id = t.discord_channel_id
    ORDER BY c.position ASC NULLS LAST, c.id ASC
  `;
  const result = await pool.query(query);
  return result.rows;
}
```

**Paso 2: Backend - Router**

En `channels.ts`, cambiar:

```typescript
router.get('/', async (req: Request, res: Response) => {
  try {
    const channels = await ChannelModel.getAllWithTicketInfo();
    res.json(channels);
  } catch (error) {
    Logger.error('Error fetching channels with ticket info', error, req);
    res.status(500).json({ error: 'Error al obtener los canales' });
  }
});
```

**Paso 3: Frontend - Tipo**

Extender interfaz Channel con campos opcionales de ticket.

**Paso 4: Frontend - Sidebar**

Modificar `ChannelItem` para:
- Detectar `channel.ticket_id`
- Renderizar badge/icono especial
- Aplicar estilos distintivos según `ticket_status`

**Paso 5: Frontend - Filtros**

Agregar selector en header del sidebar:
- State local para filtro seleccionado
- Filtrar `channels` antes de pasarlos a `buildChannelGroups`

## Consideraciones

**Rendimiento:**
- LEFT JOIN es eficiente (tickets.discord_channel_id es UNIQUE)
- No requiere índices adicionales (ya existe en el schema)

**Compatibilidad:**
- Cambio retrocompatible (campos opcionales)
- No requiere migración de base de datos
- Frontend puede manejar canales con o sin ticket_id

**Alternativas descartadas:**
- Agregar columna `is_ticket` a channels: requiere migración y mantener sincronización
- Detección por nombre `ticket-*`: frágil si se renombran canales

## Archivos Afectados

**Backend:**
- [`api/src/features/channels/models/Channel.ts`](api/src/features/channels/models/Channel.ts)
- [`api/src/features/channels/routes/channels.ts`](api/src/features/channels/routes/channels.ts)

**Frontend:**
- [`web/src/types/Channel.ts`](web/src/types/Channel.ts)
- [`web/src/components/channels/ChannelSidebar.tsx`](web/src/components/channels/ChannelSidebar.tsx)
- [`web/src/components/channels/ChannelHeader.tsx`](web/src/components/channels/ChannelHeader.tsx)

## Resultado Final

Los usuarios podrán:
- Identificar visualmente canales de tickets en la lista
- Filtrar entre tickets y canales normales
- Ver el estado del ticket (abierto, cerrado, archivado)
- Acceder rápidamente al lead asociado desde el canal
- Tener mejor control y organización de los tickets