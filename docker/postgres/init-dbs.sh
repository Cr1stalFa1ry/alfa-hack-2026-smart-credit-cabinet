#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE "SmartKabinet"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'SmartKabinet')\gexec
    SELECT 'CREATE DATABASE "SyntheticDb"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'SyntheticDb')\gexec
EOSQL
