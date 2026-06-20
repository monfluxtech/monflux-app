#!/bin/sh
echo "Running database migration..."
# timeout 30s — ne bloque pas le démarrage si la DB est lente
timeout 30 node src/db/migrate.js || echo "⚠️  migrate.js skipped (timeout or error) — server will apply its own migrations"
echo "Starting server..."
exec node src/server.js
