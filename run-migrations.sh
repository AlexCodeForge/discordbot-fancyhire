#!/bin/bash
# Script para ejecutar migraciones de base de datos

cd "$(dirname "$0")"

# Cargar variables de entorno
source api/.env

# Extraer los datos de conexión del DATABASE_URL
DB_USER=$(echo $DATABASE_URL | sed -n 's|.*://\([^:]*\):.*|\1|p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's|.*://[^:]*:\([^@]*\)@.*|\1|p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's|.*/\([^?]*\).*|\1|p')

echo "Ejecutando migraciones..."

# Ejecutar todas las migraciones en orden
for migration in database/migrations/*.sql; do
    echo "Ejecutando: $migration"
    PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME -f "$migration" 2>&1 | grep -v "already exists\|ALTER TABLE"
done

echo "Migraciones completadas"
