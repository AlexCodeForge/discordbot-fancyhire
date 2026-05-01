---
name: Gestión Roles Discord
overview: Agregar página completa de gestión de roles de Discord con creación, edición, eliminación, permisos detallados, jerarquía visual y contador de miembros por rol.
todos:
  - id: bot-endpoints
    content: "Agregar endpoints HTTP en bot: create-role, PATCH/DELETE/PUT roles, members-count"
    status: pending
  - id: api-routes
    content: Crear rutas proxy en api/src/routes/discord.ts para gestión de roles
    status: pending
  - id: discord-service
    content: Extender web/src/services/discord.ts con métodos CRUD de roles
    status: pending
  - id: roles-page
    content: Crear página RolesPage.tsx con lista, filtros y acciones
    status: pending
  - id: role-modal
    content: Crear RoleModal.tsx para crear/editar con permisos detallados
    status: pending
  - id: hierarchy-component
    content: Crear RoleHierarchy.tsx para visualizar y reordenar posiciones
    status: pending
  - id: navigation
    content: Agregar 'Roles Discord' al menú en Layout.tsx y ruta en App.tsx
    status: pending
  - id: error-handling
    content: Implementar manejo de errores de jerarquía y permisos en todos los niveles
    status: pending
isProject: false
---

# Plan: Sistema de Gestión de Roles Discord

## Contexto

Actualmente el CRM solo permite asignar/remover roles existentes a miembros. Se agregará una página completa para gestionar los roles en sí: crearlos, editarlos, eliminarlos, configurar permisos detallados, reordenar jerarquía y ver estadísticas.

## Arquitectura del Sistema

```mermaid
flowchart TB
    subgraph Frontend
        RolesPage[Página Roles Discord]
        RolesList[Lista de Roles]
        CreateModal[Modal Crear Rol]
        EditModal[Modal Editar Rol]
        PermissionsUI[UI Permisos Detallados]
        HierarchyView[Vista Jerarquía]
    end
    
    subgraph API
        RolesRoutes[/api/discord/roles]
        ProxyToBot[Proxy a Bot HTTP]
    end
    
    subgraph Bot
        RoleManager[RoleManager HTTP Server]
        DiscordAPI[Discord.js API]
    end
    
    RolesPage --> RolesList
    RolesPage --> CreateModal
    RolesPage --> EditModal
    RolesPage --> PermissionsUI
    RolesPage --> HierarchyView
    
    RolesList --> RolesRoutes
    CreateModal --> RolesRoutes
    EditModal --> RolesRoutes
    HierarchyView --> RolesRoutes
    
    RolesRoutes --> ProxyToBot
    ProxyToBot --> RoleManager
    RoleManager --> DiscordAPI
```

## Cambios por Componente

### 1. Bot - Endpoints HTTP para Roles

**Archivo:** [`bot/src/index.ts`](bot/src/index.ts)

Agregar nuevos endpoints al servidor HTTP existente (puerto 3005):

**POST /create-role**
- Crear nuevo rol con propiedades básicas y permisos
- Validar permiso `ManageRoles` del bot
- Validar jerarquía (no crear roles por encima del bot)
- Retornar ID del rol creado

**PATCH /roles/:roleId**
- Editar nombre, color y permisos de un rol existente
- Validar que el rol esté por debajo del bot en jerarquía
- Usar `role.edit()` y `role.setPermissions()`

**DELETE /roles/:roleId**
- Eliminar rol por ID
- Validar que el rol esté por debajo del bot
- Usar `role.delete()`

**PUT /roles/:roleId/position**
- Cambiar posición de un rol en la jerarquía
- Usar `guild.roles.setPosition()`
- Validar límites de jerarquía

**GET /roles/:roleId/members-count**
- Contar cuántos miembros tienen un rol específico
- Consultar `role.members.size`

**Permisos a manejar:**

```typescript
PermissionsBitField.Flags = {
  Administrator,
  ManageGuild,
  ManageRoles,
  ManageChannels,
  KickMembers,
  BanMembers,
  ViewChannel,
  SendMessages,
  ManageMessages,
  MentionEveryone,
  ManageNicknames,
  ManageEmojisAndStickers,
  ModerateMembers
}
```

### 2. API - Rutas Proxy

**Archivo:** [`api/src/routes/discord.ts`](api/src/routes/discord.ts)

Agregar endpoints que hagan proxy al bot:

```typescript
// POST /api/discord/roles - Crear rol
router.post('/roles', async (req, res) => {
  const { guildId, name, color, permissions } = req.body;
  // Validar input
  // Proxy a BOT_URL/create-role
});

// PATCH /api/discord/roles/:roleId - Editar rol
router.patch('/roles/:roleId', async (req, res) => {
  const { guildId, name, color, permissions } = req.body;
  // Proxy a BOT_URL/roles/:roleId
});

// DELETE /api/discord/roles/:roleId - Eliminar rol
router.delete('/roles/:roleId', async (req, res) => {
  const { guildId } = req.body;
  // Proxy a BOT_URL/roles/:roleId
});

// PUT /api/discord/roles/:roleId/position - Reordenar
router.put('/roles/:roleId/position', async (req, res) => {
  const { guildId, position } = req.body;
  // Proxy a BOT_URL/roles/:roleId/position
});

// GET /api/discord/roles/:roleId/members-count
router.get('/roles/:roleId/members-count', async (req, res) => {
  // Proxy a BOT_URL/roles/:roleId/members-count
});
```

Usar Logger para todos los endpoints.

### 3. Frontend - Servicio API

**Archivo:** [`web/src/services/discord.ts`](web/src/services/discord.ts)

Extender interface `GuildRole`:

```typescript
export interface GuildRoleDetailed extends GuildRole {
  permissions: {
    administrator: boolean;
    manageGuild: boolean;
    manageRoles: boolean;
    manageChannels: boolean;
    kickMembers: boolean;
    banMembers: boolean;
    viewChannel: boolean;
    sendMessages: boolean;
    manageMessages: boolean;
    mentionEveryone: boolean;
    manageNicknames: boolean;
    manageEmojisAndStickers: boolean;
    moderateMembers: boolean;
  };
  membersCount?: number;
  hoist?: boolean;
  mentionable?: boolean;
  managed?: boolean;
}
```

Agregar métodos:

```typescript
async createRole(guildId, roleData): Promise<GuildRoleDetailed>
async updateRole(roleId, guildId, roleData): Promise<GuildRoleDetailed>
async deleteRole(roleId, guildId): Promise<void>
async updateRolePosition(roleId, guildId, position): Promise<void>
async getRoleMembersCount(roleId): Promise<number>
async getGuildRolesDetailed(guildId): Promise<GuildRoleDetailed[]>
```

### 4. Frontend - Nueva Página

**Archivo nuevo:** `web/src/pages/RolesPage.tsx`

**Estructura:**
- Header con selector de servidor y botón "Crear Rol"
- Lista de roles ordenada por jerarquía (position descendente)
- Cada rol muestra:
  - Badge con color y nombre
  - Position en jerarquía
  - Contador de miembros
  - Badges de permisos clave (Admin, Manage Server, Manage Roles)
  - Botones: Editar, Eliminar, Subir, Bajar
- Indicadores visuales:
  - Roles gestionados (managed) no editables
  - Rol del bot destacado
  - Límite de jerarquía del bot

**Estados:**
- Lista de roles
- Servidor seleccionado
- Modal crear/editar abierto
- Loading states

### 5. Frontend - Modal Crear/Editar Rol

**Archivo nuevo:** `web/src/components/RoleModal.tsx`

**Campos:**
- Nombre del rol (input text)
- Color (color picker + preset colors)
- Sección de permisos con checkboxes agrupados:
  - Administrativos (Administrator, Manage Server, Manage Roles)
  - Moderación (Kick, Ban, Manage Messages, Moderate Members)
  - Generales (View Channel, Send Messages, Mention Everyone)
  - Gestión (Manage Channels, Manage Nicknames, Manage Emojis)

**Validaciones:**
- Nombre requerido (1-100 caracteres)
- Color válido (hex)
- No permitir otorgar permisos que el bot no tiene

### 6. Frontend - Componente Jerarquía

**Archivo nuevo:** `web/src/components/RoleHierarchy.tsx`

Lista visual de roles ordenados por position. Cada item tiene:
- Número de posición
- Badge del rol
- Contador de miembros
- Botones: ↑ ↓ (subir/bajar)

**Indicadores:**
- Línea divisoria donde está el rol del bot
- Roles por encima del bot en gris (no editables)
- Roles gestionados con badge "Managed"

### 7. Frontend - Layout

**Archivo:** [`web/src/components/Layout.tsx`](web/src/components/Layout.tsx)

Agregar nuevo item al array `navItems`:

```typescript
{
  name: 'Roles Discord',
  path: '/roles',
  icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
}
```

### 8. Frontend - Router

**Archivo:** `web/src/App.tsx` (o donde estén las rutas)

Agregar ruta:

```typescript
<Route path="/roles" element={<RolesPage />} />
```

## Flujos de Usuario

### Crear Rol

1. Usuario selecciona servidor en dropdown
2. Click "Crear Rol"
3. Modal se abre con formulario vacío
4. Ingresa nombre, selecciona color, marca permisos
5. Click "Crear"
6. POST /api/discord/roles
7. API valida y hace proxy al bot
8. Bot llama `guild.roles.create({ name, color, permissions })`
9. Respuesta con rol creado
10. Lista se recarga mostrando nuevo rol

### Editar Rol

1. Usuario click "Editar" en un rol
2. Modal se abre con datos del rol
3. Modifica campos
4. Click "Guardar"
5. PATCH /api/discord/roles/:roleId
6. Bot llama `role.edit()` y `role.setPermissions()`
7. Lista se actualiza

### Eliminar Rol

1. Usuario click "Eliminar"
2. Confirmación: "¿Eliminar rol X? Esta acción no se puede deshacer"
3. DELETE /api/discord/roles/:roleId
4. Bot llama `role.delete()`
5. Rol desaparece de la lista

### Reordenar Jerarquía

1. Usuario click "↑" o "↓" en un rol
2. PUT /api/discord/roles/:roleId/position con nueva posición
3. Bot llama `guild.roles.setPosition(role, newPosition)`
4. Lista se reordena automáticamente

## Consideraciones de Seguridad

1. **Validación de jerarquía:** Bot no puede crear/editar roles por encima de su posición
2. **Permisos del bot:** Validar que el bot tenga `ManageRoles`
3. **Roles gestionados:** No permitir editar/eliminar roles managed (integrations, boosts)
4. **Permisos restringidos:** No permitir otorgar permisos que el bot no tiene
5. **Validación de input:** Sanitizar nombres, validar colores hex

## Manejo de Errores

**Frontend:**
- Mostrar mensajes claros: "El bot no tiene permiso Manage Roles"
- "Este rol está por encima del bot. Sube el rol del bot en Discord"
- "No puedes editar roles gestionados por integraciones"

**Backend:**
- Capturar errores de Discord API
- Loggear con Logger
- Retornar mensajes descriptivos

## Testing Manual

1. Crear rol básico sin permisos
2. Crear rol con permisos Administrator
3. Editar nombre y color de rol existente
4. Editar permisos de un rol
5. Intentar editar rol por encima del bot (debe fallar)
6. Eliminar rol sin miembros
7. Intentar eliminar rol con miembros (verificar comportamiento)
8. Reordenar roles (subir/bajar posiciones)
9. Verificar contador de miembros por rol
10. Intentar crear rol sin permiso ManageRoles en el bot (debe fallar)

## Diseño UI

Seguir [`DESIGN.md`](.cursor/DESIGN.md):
- Usar `bmw-card` para contenedores
- `bmw-btn-primary` para crear
- `bmw-btn-secondary` para editar
- `bmw-btn-text` con color rojo para eliminar
- Color pickers con presets de Discord
- Checkboxes agrupados visualmente
- Jerarquía con líneas divisorias claras
