# Configuración Discord Bot - Guía Rápida

## 1. Crear Aplicación en Discord

1. Ir a https://discord.com/developers/applications
2. Click en "New Application"
3. Nombre: `CRM Leads Bot` (o el que prefieras)
4. Click "Create"

## 2. Crear Bot y Obtener Token

1. En el menú lateral, ir a **Bot**
2. Click "Reset Token" (o "Add Bot" si es primera vez)
3. **COPIAR EL TOKEN** (solo se muestra una vez)
4. Pegarlo en `/home/discordbot/code/bot/.env`:
   ```
   DISCORD_TOKEN=tu_token_aqui
   ```

## 3. Habilitar Intents Privilegiados

En la misma página **Bot**, bajar a **Privileged Gateway Intents**:

- **SERVER MEMBERS INTENT** (requerido para detectar nuevos miembros)
- **MESSAGE CONTENT INTENT** (opcional, por si agregas comandos)

Click "Save Changes"

## 4. Invitar Bot al Servidor

1. En el menú lateral, ir a **Installation**
2. En **Installation Contexts**, marcar:
   - Guild Install
3. En **Default Install Settings** → **Guild Install**:
   - Scopes: `bot`
   - Permisos mínimos requeridos:
     - Send Messages
     - Send Messages in Threads
     - Embed Links
4. Copiar el **Install Link** generado
5. Abrir el link en el navegador
6. Seleccionar tu servidor Discord
7. Click "Authorize"

## 5. Obtener IDs (Servidor y Canal Admin)

### Habilitar Developer Mode en Discord:
1. En Discord, abrir **User Settings**
2. Ir a **Advanced**
3. Activar **Developer Mode**

### Obtener Server ID:
1. Click derecho en el nombre del servidor
2. Click "Copy Server ID"
3. Pegarlo en algún lugar temporal

### Obtener Admin Channel ID:
1. Click derecho en el canal donde quieres notificaciones
2. Click "Copy Channel ID"
3. Pegarlo en `/home/discordbot/code/bot/.env`:
   ```
   ADMIN_CHANNEL_ID=id_del_canal
   ```

## 6. Verificar Configuración Final

Tu archivo `/home/discordbot/code/bot/.env` debe verse así:

```env
DISCORD_TOKEN=MTIzNDU2Nzg5MDEyMzQ1Njc4OQ.GhIJkL.MnOpQrStUvWxYz01...
API_URL=http://localhost:3001
ADMIN_CHANNEL_ID=1234567890123456789
```

## 7. Probar el Bot

```bash
cd /home/discordbot/code
npm run dev:bot
```

Si ves `Bot conectado como [nombre]#1234`, está funcionando correctamente.

---

**Links de Referencia:**
- Developer Portal: https://discord.com/developers/applications
- Documentación oficial: https://discord.com/developers/docs/intro
- Guía de bots: https://discord.com/developers/docs/topics/gateway

**Nota:** El bot detectará automáticamente cuando alguien se una al servidor y creará un lead en el CRM.
