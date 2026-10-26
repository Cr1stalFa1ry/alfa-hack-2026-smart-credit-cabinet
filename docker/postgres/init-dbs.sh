#!/bin/bash
set -e

echo "=== Initializing PostgreSQL Databases ==="

# 1. Create databases if they do not exist
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE "SmartKabinet"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'SmartKabinet')\gexec
    SELECT 'CREATE DATABASE "SyntheticDb"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'SyntheticDb')\gexec
EOSQL

# 2. Populate SmartKabinet
if [ -f /docker-init-sql/01-smartkabinet-db.sql ]; then
    echo "=== Loading SmartKabinet database dump ==="
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d "SmartKabinet" -f /docker-init-sql/01-smartkabinet-db.sql
fi

# 3. Populate SyntheticDb
if [ -f /docker-init-sql/02-synthetic-db.sql ]; then
    echo "=== Loading SyntheticDb database dump ==="
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" -d "SyntheticDb" -f /docker-init-sql/02-synthetic-db.sql
fi

echo "=== PostgreSQL Initialization Finished Successfully ==="
