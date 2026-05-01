---
name: Sistema de Anuncios Discord
overview: Sistema MVP para crear y enviar mensajes embed profesionales a canales de Discord desde el panel web del CRM con vista previa en tiempo real.
todos:
  - id: db-migration
    content: Crear migración de base de datos para tabla announcements
    status: pending
  - id: api-routes
    content: Implementar rutas API, modelo y servicio de anuncios
    status: pending
  - id: bot-endpoint
    content: Agregar endpoint /send-embed al bot HTTP server
    status: pending
  - id: frontend-components
    content: "Crear componentes de UI: editor, preview, selector de canal"
    status: pending
  - id: integration
    content: Integrar página de anuncios en App y probar flujo completo
    status: pending
isProject: false
---

# Sistema de Anuncios con Embeds para Discord

## Arquitectura General

```mermaid
flowchart TD
    Web[Panel Web CRM] -->|Crear embed| API[API REST]
    API -->|Guardar| DB[(PostgreSQL)]
    Web -->|Enviar a canal| API
    API -->|POST /send-embed| Bot[Bot HTTP Server]
    Bot -->|Embed Builder| Discord[Canal Discord]
```

## 1. Base de Datos

Crear nueva tabla `announcements` en [`database/migrations/`](database/migrations/):

```sql
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(256),
  description TEXT,
  color VARCHAR(7),           -- Hex color #000000
  thumbnail_url TEXT,
  image_url TEXT,
  footer_text VARCHAR(256),
  footer_icon_url TEXT,
  author_name VARCHAR(256),
  author_icon_url TEXT,
  url TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 2. Backend API

### Rutas ([`api/src/routes/announcements.ts`](api/src/routes/announcements.ts))

- `POST /api/announcements` - Crear anuncio
- `GET /api/announcements` - Listar anuncios
- `GET /api/announcements/:id` - Obtener anuncio específico
- `POST /api/announcements/:id/send` - Enviar anuncio a canal

**Request body para envío:**
```json
{
  "channelId": "1234567890",
  "embedData": {
    "title": "...",
    "description": "...",
    "color": "#3498db"
  }
}
```

### Modelo ([`api/src/models/Announcement.ts`](api/src/models/Announcement.ts))

CRUD básico para interactuar con la tabla `announcements`.

### Servicio ([`api/src/services/announcementService.ts`](api/src/services/announcementService.ts))

Lógica para enviar embeds al bot:
- Transformar datos del embed al formato de discord.js
- Llamar al endpoint `/send-embed` del bot HTTP server

## 3. Bot de Discord

### Endpoint HTTP ([`bot/src/index.ts`](bot/src/index.ts))

Agregar nuevo endpoint POST `/send-embed`:

```typescript
botHttpServer.post('/send-embed', async (req, res) => {
  const { channelId, embedData } = req.body;
  
  // Validaciones
  // Construir embed con EmbedBuilder
  // Enviar a canal
  // Retornar messageId
});
```

**Implementación:**
- Usar `EmbedBuilder` de discord.js
- Validar que el canal existe y es de texto
- Soportar todos los campos del embed (title, description, color, image, thumbnail, footer, author, url)

## 4. Frontend Web

### Dependencia: embed-visualizer

```bash
npm i embed-visualizer
```

Librería React actualizada (2025) para preview de embeds Discord con soporte completo de markdown.

### Nueva Página: Anuncios ([`web/src/pages/Announcements.tsx`](web/src/pages/Announcements.tsx))

Interfaz principal con:
- Editor de embed (formulario)
- Vista previa en vivo del embed usando `embed-visualizer`
- Selector de canal destino
- Botón "Enviar Anuncio"

### Componente Editor ([`web/src/components/AnnouncementEditor.tsx`](web/src/components/AnnouncementEditor.tsx))

Formulario con campos:
- Título (opcional, max 256 chars)
- Descripción (opcional, max 4096 chars, soporte markdown)
- Color (color picker, hex con preview)
- URL del título (opcional)
- Imagen principal (URL, opcional)
- Thumbnail (URL, opcional)
- Footer texto (opcional, max 256 chars)
- Footer icono (URL, opcional)
- Author nombre (opcional, max 256 chars)
- Author icono (URL, opcional)

### Componente Preview ([`web/src/components/EmbedPreview.tsx`](web/src/components/EmbedPreview.tsx))

Wrapper que usa `EmbedVisualizer` de `embed-visualizer`:

```tsx
import { EmbedVisualizer } from 'embed-visualizer'
import 'embed-visualizer/dist/index.css'

<EmbedVisualizer 
  embed={embedData}
  onError={(e) => console.error(e)}
/>
```

Convierte datos del formulario al formato esperado por la librería.

### Selector de Canal ([`web/src/components/ChannelSelector.tsx`](web/src/components/ChannelSelector.tsx))

Dropdown para seleccionar canal destino:
- Cargar lista de canales desde `/api/channels`
- Mostrar solo canales de texto (type: GuildText, GuildAnnouncement)
- Agrupados por categoría si aplica
- Mostrar icono de canal

### Ruta en App ([`web/src/App.tsx`](web/src/App.tsx))

Agregar ruta `/announcements` protegida con `authMiddleware`.

## 5. Tipos TypeScript

### Backend ([`api/src/types/Announcement.ts`](api/src/types/Announcement.ts))

```typescript
interface AnnouncementEmbed {
  title?: string;
  description?: string;
  color?: string;
  url?: string;
  thumbnail_url?: string;
  image_url?: string;
  footer_text?: string;
  footer_icon_url?: string;
  author_name?: string;
  author_icon_url?: string;
}
```

### Frontend ([`web/src/types/Announcement.ts`](web/src/types/Announcement.ts))

Mismos tipos para mantener consistencia.

## Flujo de Usuario

1. Admin accede a `/announcements`
2. Completa campos del embed en el editor
3. Ve preview en tiempo real mientras escribe
4. Selecciona canal destino
5. Click en "Enviar Anuncio"
6. Sistema guarda en BD y envía al bot
7. Bot envía embed al canal de Discord
8. Confirmación en UI

## Diseño UI

Seguir especificaciones de [`.cursor/DESIGN.md`](.cursor/DESIGN.md):
- Colores BMW: grises corporativos, azul acento
- Tipografía: BMW Type
- Componentes: inputs, buttons, cards según design system
- Layout: grid de 2 columnas (editor | preview)

## Validaciones

- Limites de caracteres Discord (título 256, descripción 4096)
- URLs válidas para imágenes
- Color en formato hex válido (#RRGGBB)
- Canal seleccionado debe existir

## Logging

Usar [`Logger`](api/src/utils/Logger.ts) para:
- Creación de anuncios
- Envío exitoso/fallido
- Errores de validación
