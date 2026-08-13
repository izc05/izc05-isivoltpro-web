#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MIGRATIONS_DIR="$ROOT/supabase/migrations"
BACKUP_DIR="${PLATFORM_BACKUP_DIR:-/opt/isivolt-platform/backups/platform-identity-staging}"
DATABASE_URL="${PLATFORM_DATABASE_URL:-}"
ENVIRONMENT="${PLATFORM_ENVIRONMENT:-}"

if [[ "$ENVIRONMENT" != "staging" ]]; then
  echo "ERROR: define PLATFORM_ENVIRONMENT=staging. Este script no admite producción." >&2
  exit 1
fi
if [[ -z "$DATABASE_URL" ]]; then
  echo "ERROR: define PLATFORM_DATABASE_URL sin imprimirla en el terminal." >&2
  exit 1
fi
for command in psql pg_dump sha256sum; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "ERROR: falta $command" >&2
    exit 1
  }
done

DB_NAME="$(psql "$DATABASE_URL" -XAtqc 'select current_database()')"
DB_SERVER="$(psql "$DATABASE_URL" -XAtqc "select inet_server_addr()::text || ':' || inet_server_port()::text")"
if [[ -z "$DB_NAME" ]]; then
  echo "ERROR: no se puede consultar la base de staging." >&2
  exit 1
fi

printf 'Base: %s\nServidor: %s\n' "$DB_NAME" "$DB_SERVER"
read -r -p "Escribe APLICAR-STAGING para continuar: " CONFIRMATION
if [[ "$CONFIRMATION" != "APLICAR-STAGING" ]]; then
  echo "Cancelado."
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/platform-staging-before-$STAMP.dump"
MANIFEST_FILE="$BACKUP_DIR/platform-staging-before-$STAMP.sha256"

echo "Creando copia previa..."
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges --file="$BACKUP_FILE"
(
  cd "$BACKUP_DIR"
  sha256sum "$(basename "$BACKUP_FILE")" > "$(basename "$MANIFEST_FILE")"
)

echo "Registrando control de migraciones..."
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
create table if not exists public.platform_schema_migrations (
  filename text primary key,
  checksum text not null,
  applied_at timestamptz not null default now()
);
revoke all on table public.platform_schema_migrations from anon, authenticated;
SQL

mapfile -t FILES < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '2026080522*_platform_*.sql' | sort)
if (( ${#FILES[@]} == 0 )); then
  echo "ERROR: no se localizaron migraciones de identidad." >&2
  exit 1
fi

for FILE in "${FILES[@]}"; do
  NAME="$(basename "$FILE")"
  CHECKSUM="$(sha256sum "$FILE" | awk '{print $1}')"
  EXISTING="$(psql "$DATABASE_URL" -XAt \
    --set=filename="$NAME" \
    -c "select checksum from public.platform_schema_migrations where filename = :'filename'" 2>/dev/null || true)"

  if [[ -n "$EXISTING" ]]; then
    if [[ "$EXISTING" != "$CHECKSUM" ]]; then
      echo "ERROR: $NAME ya fue aplicada con otro checksum." >&2
      exit 1
    fi
    echo "OMITIDA $NAME (ya aplicada)"
    continue
  fi

  echo "APLICANDO $NAME"
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 --single-transaction --file="$FILE"
  psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
    --set=filename="$NAME" --set=checksum="$CHECKSUM" <<'SQL'
insert into public.platform_schema_migrations (filename, checksum)
values (:'filename', :'checksum');
SQL
done

echo "Comprobando RLS y catálogo..."
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename like 'platform_%'
order by tablename;

select code, name, status, min_aal, launch_url
from public.platform_applications
order by sort_order;
SQL

printf '\nMigraciones de staging terminadas.\nCopia: %s\nChecksum: %s\n' "$BACKUP_FILE" "$MANIFEST_FILE"
