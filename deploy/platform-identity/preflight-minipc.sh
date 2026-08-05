#!/usr/bin/env bash
set -u

PASS=0
WARN=0
FAIL=0

pass() { printf 'OK   %s\n' "$*"; PASS=$((PASS + 1)); }
warn() { printf 'AVISO %s\n' "$*"; WARN=$((WARN + 1)); }
fail() { printf 'ERROR %s\n' "$*"; FAIL=$((FAIL + 1)); }
section() { printf '\n=== %s ===\n' "$*"; }

ROOT="${1:-$(pwd)}"

section "Repositorio"
if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  pass "Repositorio Git localizado en $ROOT"
  printf 'Rama:   %s\n' "$(git -C "$ROOT" branch --show-current 2>/dev/null || true)"
  printf 'Commit: %s\n' "$(git -C "$ROOT" log -1 --oneline 2>/dev/null || true)"
  if [[ -z "$(git -C "$ROOT" status --porcelain 2>/dev/null)" ]]; then
    pass "Árbol de trabajo limpio"
  else
    warn "Hay cambios locales; no desplegar hasta guardarlos"
    git -C "$ROOT" status --short
  fi
else
  fail "$ROOT no es un repositorio Git"
fi

section "Herramientas"
for command in docker curl openssl; do
  if command -v "$command" >/dev/null 2>&1; then
    pass "$command disponible"
  else
    fail "$command no está instalado"
  fi
done
for command in psql pg_dump; do
  if command -v "$command" >/dev/null 2>&1; then
    pass "$command disponible"
  else
    warn "$command no está instalado en el host; puede ejecutarse desde el contenedor PostgreSQL"
  fi
done

section "Docker"
if docker info >/dev/null 2>&1; then
  pass "Docker responde para el usuario actual"
  docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' \
    | grep -E 'NAMES|isivolt|supabase|kong|postgres|gateway' || true
else
  fail "Docker no responde para el usuario actual"
fi

section "Servicios críticos"
for unit in cloudflared.service isivolt-supabase.service; do
  if systemctl list-unit-files "$unit" >/dev/null 2>&1; then
    state="$(systemctl is-active "$unit" 2>/dev/null || true)"
    enabled="$(systemctl is-enabled "$unit" 2>/dev/null || true)"
    if [[ "$state" == active ]]; then pass "$unit activo ($enabled)"; else warn "$unit: $state ($enabled)"; fi
  else
    warn "$unit no localizado con ese nombre"
  fi
done

section "Puertos esperados"
for port in 54321 54322 8080 8081 8082; do
  if ss -ltn 2>/dev/null | grep -qE "[:.]${port}[[:space:]]"; then
    pass "Puerto $port escuchando"
  else
    warn "Puerto $port no localizado"
  fi
done

section "Supabase local"
if curl -fsS --max-time 5 http://127.0.0.1:54321/auth/v1/health >/dev/null 2>&1; then
  pass "Supabase Auth responde en 54321"
else
  warn "Auth no responde en http://127.0.0.1:54321/auth/v1/health"
fi
if curl -fsS --max-time 5 http://127.0.0.1:54321/rest/v1/ >/dev/null 2>&1; then
  pass "PostgREST responde en 54321"
else
  warn "PostgREST requiere clave o no responde; revisar manualmente"
fi

section "Variables de staging"
for name in PUBLIC_SUPABASE_URL PUBLIC_SUPABASE_ANON_KEY PUBLIC_SITE_URL; do
  if [[ -n "${!name:-}" ]]; then
    pass "$name definida"
  else
    warn "$name no definida en esta sesión"
  fi
done
if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  warn "SUPABASE_SERVICE_ROLE_KEY está cargada en la sesión: no imprimirla ni guardarla en .env público"
else
  pass "La clave service_role no está expuesta en la sesión de despliegue web"
fi

section "Copias y capacidad"
df -h / /opt 2>/dev/null || df -h /
if [[ -d /opt/isivolt-platform/backups ]]; then
  pass "Directorio de copias localizado"
  find /opt/isivolt-platform/backups -maxdepth 2 -type f -printf '%TY-%Tm-%Td %TH:%TM %p\n' 2>/dev/null \
    | sort -r | head -n 10 || true
else
  warn "No existe /opt/isivolt-platform/backups"
fi

section "Resultado"
printf 'Correcto: %d · Avisos: %d · Errores: %d\n' "$PASS" "$WARN" "$FAIL"
if (( FAIL > 0 )); then
  printf 'NO APTO para desplegar. Corrige los errores anteriores.\n'
  exit 1
fi
printf 'Preflight de solo lectura completado. Los avisos deben revisarse antes de staging.\n'
