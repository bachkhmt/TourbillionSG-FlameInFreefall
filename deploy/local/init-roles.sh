#!/bin/sh
set -eu
# psql variables quote values as SQL literals, including any password punctuation.
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=1 <<'SQL'
\getenv owner_password OWNER_PASSWORD
\getenv reader_password READER_PASSWORD
\getenv database_name POSTGRES_DB
CREATE ROLE flameguard_owner LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD :'owner_password';
CREATE ROLE flameguard_reader LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD :'reader_password';
ALTER DATABASE :"database_name" OWNER TO flameguard_owner;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO flameguard_reader;
ALTER DEFAULT PRIVILEGES FOR ROLE flameguard_owner IN SCHEMA public GRANT SELECT ON TABLES TO flameguard_reader;
SQL
