---
name: Indicador Ticket Abierto Kanban
overview: Añadir un indicador visual en las tarjetas del kanban que muestre si un lead tiene un ticket abierto en Discord.
todos:
  - id: backend-query
    content: Modificar query en LeadModel.getAll() para incluir has_open_ticket con EXISTS subquery
    status: pending
  - id: backend-interface
    content: "Añadir has_open_ticket?: boolean a interface Lead en API"
    status: pending
  - id: frontend-interface
    content: "Añadir has_open_ticket?: boolean a interface Lead en web/src/types"
    status: pending
  - id: frontend-badge
    content: Añadir badge visual TICKET en LeadCard cuando has_open_ticket sea true
    status: pending
isProject: false
---

# Indicador de Ticket Abierto en Kanban

## Resumen

Modificar el sistema para que cada tarjeta de lead en el kanban muestre un indicador visual cuando el lead tiene un ticket abierto (status = 'open'). El indicador será un badge similar al que existe para mensajes no leídos y el tag "AUTO".

## Cambios en Backend

### 1. Modificar consulta de leads

**Archivo:** [`api/src/features/leads/models/Lead.ts`](api/src/features/leads/models/Lead.ts)

Modificar la query en `LeadModel.getAll()` (líneas 32-46) para incluir un LEFT JOIN con la tabla `tickets`:

```sql
SELECT 
  l.*,
  COALESCE(
    (SELECT COUNT(*) 
     FROM messages m 
     WHERE m.lead_id = l.id 
     AND m.sender_type = 'user' 
     AND m.read_at IS NULL),
    0
  ) as unread_count,
  EXISTS(
    SELECT 1 
    FROM tickets t 
    WHERE t.lead_id = l.id 
    AND t.status = 'open'
  ) as has_open_ticket
FROM leads l 
ORDER BY l.stage, l.display_order ASC
```

La subquery `EXISTS` retorna un boolean que indica si hay al menos un ticket abierto para ese lead.

### 2. Actualizar interfaces TypeScript

**API - Archivo:** [`api/src/features/leads/models/Lead.ts`](api/src/features/leads/models/Lead.ts)

Añadir el campo en la interfaz `Lead` (líneas 3-18):

```typescript
export interface Lead {
  id: number;
  name: string;
  discord_id?: string;
  discord_tag?: string;
  contact_discord: string;
  service_interest?: string;
  stage: 'nuevo' | 'contactado' | 'propuesta_enviada' | 'negociacion' | 'ganado' | 'perdido';
  assigned_to?: string;
  notes?: string;
  source: 'auto' | 'manual';
  display_order: number;
  created_at: Date;
  updated_at: Date;
  unread_count?: number;
  has_open_ticket?: boolean;  // NUEVO CAMPO
}
```

**Frontend - Archivo:** [`web/src/types/Lead.ts`](web/src/types/Lead.ts)

Añadir el mismo campo en la interfaz `Lead` del frontend (líneas 3-18):

```typescript
export interface Lead {
  id: number;
  name: string;
  discord_id?: string;
  discord_tag?: string;
  contact_discord: string;
  service_interest?: string;
  stage: LeadStage;
  assigned_to?: string;
  notes?: string;
  source: 'auto' | 'manual';
  display_order: number;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  has_open_ticket?: boolean;  // NUEVO CAMPO
}
```

## Cambios en Frontend

### 3. Añadir badge en LeadCard

**Archivo:** [`web/src/components/leads/LeadCard.tsx`](web/src/components/leads/LeadCard.tsx)

Añadir el indicador visual después del badge de mensajes no leídos (aproximadamente después de la línea 117). El badge debe:

- Aparecer solo cuando `lead.has_open_ticket === true`
- Mostrar un icono o texto "TICKET"
- Usar colores del sistema BMW (similar al badge AUTO)
- Posicionarse junto a los otros badges existentes

Diseño propuesto:

```tsx
{lead.has_open_ticket && (
  <span className="bmw-body-sm" style={{ 
    fontSize: '10px',
    fontWeight: 700,
    backgroundColor: 'var(--bmw-primary)',
    color: 'var(--bmw-on-primary)',
    padding: '2px 6px',
    borderRadius: '0'
  }}>TICKET</span>
)}
```

Posicionarlo en el `div` que contiene el nombre y badges (línea 97-127), específicamente después del badge "AUTO" existente.

## Esquema de datos existente

**Relación:** `tickets.lead_id` → `leads.id` (ON DELETE CASCADE)

**Estados de ticket:**
- `open` - Ticket activo (queremos detectar este)
- `closed` - Ticket cerrado
- `archived` - Ticket archivado

**Query efectiva:** Solo tickets con `status = 'open'` activarán el indicador.

## Flujo de datos

```
1. Usuario carga kanban → App.tsx llama api.getAllLeads()
2. API ejecuta LeadModel.getAll() con nueva query
3. Query incluye EXISTS(tickets con status='open')
4. API retorna leads con campo has_open_ticket: boolean
5. LeadCard renderiza badge si has_open_ticket === true
```

## Comportamiento esperado

- Lead sin ticket: No muestra badge
- Lead con ticket cerrado: No muestra badge
- Lead con ticket abierto: Muestra badge "TICKET"
- Lead con múltiples tickets (uno abierto): Muestra badge "TICKET"
- Badge se actualiza automáticamente cada 30 segundos (refresh interval existente en App.tsx línea 40-44)

## Consideraciones de diseño

Seguir especificaciones de [`.cursor/DESIGN.md`](.cursor/DESIGN.md):

- Usar variables CSS BMW (`--bmw-primary`, `--bmw-on-primary`)
- Mantener consistencia visual con badge "AUTO" existente
- Sin bordes redondeados (`borderRadius: '0'`)
- Tipografía: `bmw-body-sm` con `fontSize: '10px'` y `fontWeight: 700`
