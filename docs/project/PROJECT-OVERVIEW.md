# CRM Discord Bot - Overview

Sistema CRM automatizado con captura de leads via Discord y gestión Kanban.

## Arquitectura

Monorepo TypeScript con 3 componentes:

### 1. API (Express + PostgreSQL)
- **Puerto:** 3001 (localhost)
- **Base:** `/api`
- **Stack:** Express, PostgreSQL 15, JWT auth, bcrypt
- **Endpoints:**
  - `GET /health` - Health check
  - `POST /api/auth/login` - Autenticación
  - `GET/POST/PATCH/DELETE /api/leads/*` - CRUD leads

### 2. Bot (Discord.js)
- **Función:** Captura automática de leads al unirse usuarios
- **Event:** `GuildMemberAdd` → crea lead + notifica admin + envía DM
- **Integración:** POST a API `/api/leads`

### 3. Web (React + Vite)
- **Puerto:** 5173 (dev)
- **UI:** Kanban drag-and-drop (@dnd-kit)
- **Stack:** React 18, TailwindCSS, Axios
- **Funcionalidades:** Login, Kanban board, CRUD leads

## Base de Datos (PostgreSQL)

**Tablas principales:**

```sql
leads (
  id, name, discord_id, discord_tag, contact_discord,
  service_interest, stage, assigned_to, notes, source,
  created_at, updated_at
)

lead_history (
  id, lead_id, action, previous_value, new_value,
  changed_by, created_at
)
```

**Stages:** nuevo → contactado → propuesta_enviada → negociacion → ganado/perdido

**Source:** auto (bot) | manual (web)

## Estructura de Archivos

```
/api/src/
  ├── index.ts              # Express app
  ├── routes/
  │   ├── auth.ts           # Login/registro
  │   └── leads.ts          # CRUD leads
  ├── middleware/
  │   ├── auth.ts           # JWT verification
  │   └── errorHandler.ts
  └── models/               # DB queries

/bot/src/
  ├── index.ts              # Discord client
  ├── config.ts             # Env config
  └── commands/             # (vacío actualmente)

/web/src/
  ├── App.tsx               # Router principal
  ├── pages/Login.tsx
  ├── components/
  │   ├── KanbanColumn.tsx
  │   ├── LeadCard.tsx
  │   ├── LeadModal.tsx
  │   └── CreateLeadForm.tsx
  ├── services/
  │   ├── api.ts            # Axios client
  │   └── auth.ts           # Auth service
  └── context/AuthContext.tsx

/database/migrations/
  └── 001_init.sql          # Schema inicial

/docs/
  ├── env/                  # Credenciales y server info
  └── project/              # Esta documentación
```

## Variables de Entorno

**API (.env):**
- `PORT=3001`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...`
- `NODE_ENV=development`

**Bot (.env):**
- `DISCORD_TOKEN=...`
- `DISCORD_GUILD_ID=...`
- `DISCORD_ADMIN_CHANNEL_ID=...`
- `API_URL=http://localhost:3001`

**Web (.env):**
- `VITE_API_URL=http://localhost:3001`

## Deployment

**Host:** VPS Contabo (vmi2712388.contaboserver.net / 213.199.33.207)
**OS:** Debian 12
**Reverse Proxy:** Nginx
**Dominio planificado:** discordbot.alexcodeforge.com

**Stack en servidor:**
- PostgreSQL 15 (puerto 5432)
- Nginx (80, 443 con SSL)
- Docker Engine

## Scripts NPM

**Root:**
- `npm run install:all` - Instalar todas las dependencias
- `npm run dev:api` - Correr API en dev
- `npm run dev:bot` - Correr bot en dev
- `npm run dev:web` - Correr web en dev
- `npm run build:all` - Build producción de todo

**Cada workspace (api/bot/web):**
- `npm run dev` - Modo desarrollo con watch
- `npm run build` - Compilar TypeScript
- `npm run start` - Ejecutar versión compilada

## Flujo de Trabajo

1. Usuario se une al servidor Discord
2. Bot detecta evento → crea lead (stage: nuevo, source: auto)
3. Bot notifica en canal admin + envía DM bienvenida
4. Lead aparece en columna "Nuevo" del Kanban web
5. Admin mueve lead por stages hasta ganado/perdido
6. Historial registra todos los cambios en `lead_history`

## Autenticación

- JWT con HttpOnly cookies
- Sesiones gestionadas por `express-session`
- Passwords hasheadas con bcryptjs
- AuthContext en React para estado global
- Middleware `authMiddleware` protege rutas API

## Próximos Pasos

- Configurar Nginx reverse proxy
- Deploy en producción
- Configurar SSL con Let's Encrypt
- Añadir comandos slash de Discord (actualmente no hay)
- Implementar notificaciones en tiempo real (WebSockets)
