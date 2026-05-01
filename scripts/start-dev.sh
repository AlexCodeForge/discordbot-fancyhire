#!/bin/bash

echo "==================================="
echo "  CRM Discord - Iniciando Sistema  "
echo "==================================="
echo ""

echo "[1/4] Limpiando procesos anteriores..."
pkill -f "tsx watch" 2>/dev/null
sleep 2

echo "[2/4] Iniciando API en puerto 3002..."
cd /home/discordbot/code/api
npm run dev > /tmp/crm-api.log 2>&1 &
API_PID=$!
sleep 3

echo "[3/4] Iniciando Bot de Discord en puerto 3005..."
cd /home/discordbot/code/bot
npm run dev > /tmp/crm-bot.log 2>&1 &
BOT_PID=$!
sleep 3

echo "[4/4] Iniciando Web App en puerto 3003..."
cd /home/discordbot/code/web
npm run dev > /tmp/crm-web.log 2>&1 &
WEB_PID=$!
sleep 2

echo ""
echo "==================================="
echo "   Servicios Activos"
echo "==================================="
echo "  API REST:     http://localhost:3002"
echo "  Bot Discord:  http://localhost:3005"
echo "  Web App:      http://localhost:3003"
echo "  Público:      https://discordbot.alexcodeforge.com"
echo ""
echo "  Logs:"
echo "    API: tail -f /tmp/crm-api.log"
echo "    Bot: tail -f /tmp/crm-bot.log"
echo "    Web: tail -f /tmp/crm-web.log"
echo ""
echo "==================================="
echo ""
echo "Presiona Ctrl+C para detener todos los servicios"

trap "echo '' && echo 'Deteniendo servicios...' && kill $API_PID $BOT_PID $WEB_PID 2>/dev/null && echo 'Servicios detenidos.' && exit 0" EXIT INT TERM

wait
