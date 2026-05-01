---
name: Menciones y detalles usuarios canales
overview: Integrar autocompletado de menciones con @ en el chat de canales y agregar botón para ver detalles completos de los usuarios
todos:
  - id: replace-textarea-with-mention-input
    content: Reemplazar textarea por MemberMentionInput en ChannelChat.tsx y adaptar handlers
    status: completed
  - id: add-view-button-messages
    content: Agregar botón Ver con icono de ojo en cada mensaje del chat
    status: completed
  - id: add-member-details-modal
    content: Crear modal de detalles de usuario copiando estructura de Members.tsx
    status: completed
  - id: load-members-state
    content: Agregar estado y efecto para cargar lista de miembros desde API
    status: completed
isProject: false
---

# Plan: Menciones y Detalles de Usuarios en Canales

## Situación Actual

El chat de canales ([web/src/components/ChannelChat.tsx](web/src/components/ChannelChat.tsx)) actualmente:
- Usa un `<textarea>` simple para escribir mensajes
- Ya soporta menciones en formato `<@userId>` pero sin autocompletado
- No tiene forma de ver detalles de los usuarios que escriben mensajes

Ya existe:
- [web/src/components/MemberMentionInput.tsx](web/src/components/MemberMentionInput.tsx) - componente con autocompletado de menciones
- [web/src/pages/Members.tsx](web/src/pages/Members.tsx) - modal con detalles de usuario (líneas 442-759)
- API `getMembers()` para obtener información de miembros

## Cambios a Implementar

### 1. Reemplazar textarea por MemberMentionInput

**Archivo:** [web/src/components/ChannelChat.tsx](web/src/components/ChannelChat.tsx)

Líneas 284-317 contienen el área de entrada de mensajes con un `<textarea>` simple.

**Cambios:**
- Importar `MemberMentionInput` desde `../components/MemberMentionInput`
- Reemplazar el `<textarea>` y su contenedor por `<MemberMentionInput>`
- Adaptar los handlers:
  - `onChange` ya recibe `(value, mentions)` directamente
  - Eliminar `extractMentionIds` del `handleSend` (ya viene en onChange)
  - Eliminar `handleKeyDown` (MemberMentionInput ya maneja Enter)
- Ajustar el layout del botón "Enviar" para que quede bien con el nuevo input

### 2. Agregar botón "Ver" en mensajes

**Archivo:** [web/src/components/ChannelChat.tsx](web/src/components/ChannelChat.tsx)

Líneas 184-270 renderizan cada mensaje.

**Cambios:**
- Agregar estado `viewingMember` (DiscordMember | null)
- Agregar estado `members` (DiscordMember[]) y cargar con `api.getMembers()`
- En cada mensaje (línea 186-269), agregar botón "Ver" junto al botón de eliminar:
  - Icono de ojo (ya existe en Members.tsx línea 385-388)
  - Al hacer click, buscar el miembro por `msg.author_id` y setear `viewingMember`
  - Mostrar con hover similar al botón eliminar

**Agregar modal de detalles:**
- Copiar estructura del modal de Members.tsx (líneas 442-759)
- Importar componentes necesarios:
  - `MemberAvatar` desde `../components/MemberAvatar`
  - `RoleBadge` desde `../components/RoleBadge`
  - `DiscordMember` type desde `../services/api` o `../services/discord`
- Adaptar el modal para usar `viewingMember` como estado local
- Reutilizar las funciones de formato de fechas de Members.tsx

## Estructura del Código

```typescript
// ChannelChat.tsx - nuevas importaciones
import { MemberMentionInput } from './MemberMentionInput';
import { MemberAvatar } from './MemberAvatar';
import { RoleBadge } from './RoleBadge';
import { api, DiscordMember } from '../services/api';

// Nuevos estados
const [viewingMember, setViewingMember] = useState<DiscordMember | null>(null);
const [members, setMembers] = useState<DiscordMember[]>([]);
const [mentions, setMentions] = useState<string[]>([]);

// Cargar miembros al montar
useEffect(() => {
  api.getMembers().then(setMembers).catch(() => setMembers([]));
}, []);

// handleSend simplificado (mentions ya viene del MemberMentionInput)
const handleSendMessage = async () => {
  await onSendMessage(draft, mentions);
  setDraft('');
  setMentions([]);
};

// Handler para ver detalles
const handleViewMember = (authorId: string) => {
  const member = members.find(m => m.id === authorId);
  if (member) setViewingMember(member);
};
```

## Componentes a Reutilizar

- `MemberMentionInput` (ya existe, completo)
- `MemberAvatar` (ya existe)
- `RoleBadge` (ya existe)
- Modal de detalles de Members.tsx (copiar y adaptar)

## Resultado Final

1. Al escribir `@` en el chat de canales, aparecerá dropdown con miembros del servidor
2. Al seleccionar un miembro, se insertará `<@userId>` en el texto
3. Cada mensaje tendrá un botón de "ojo" que abre modal con detalles del usuario:
   - Avatar, nombre, username, tag
   - Roles con badges de colores
   - Permisos (administrator, manage server, etc.)
   - Fechas de ingreso y creación de cuenta
