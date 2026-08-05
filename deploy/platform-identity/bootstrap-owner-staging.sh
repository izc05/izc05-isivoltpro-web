#!/usr/bin/env bash
set -Eeuo pipefail

ENVIRONMENT="${PLATFORM_ENVIRONMENT:-}"
SUPABASE_URL="${SUPABASE_URL:-}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"
OWNER_EMAIL="${PLATFORM_OWNER_EMAIL:-}"
OWNER_NAME="${PLATFORM_OWNER_NAME:-Propietario IsiVoltPro}"
PORTAL_URL="${PLATFORM_PUBLIC_PORTAL_URL:-https://app-staging.isivoltpro.com}"

if [[ "$ENVIRONMENT" != "staging" ]]; then
  echo "ERROR: define PLATFORM_ENVIRONMENT=staging. Este script no admite producción." >&2
  exit 1
fi
for value_name in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY PLATFORM_OWNER_EMAIL; do
  if [[ -z "${!value_name:-}" ]]; then
    echo "ERROR: falta $value_name" >&2
    exit 1
  fi
done
for command in curl jq; do
  command -v "$command" >/dev/null 2>&1 || {
    echo "ERROR: falta $command" >&2
    exit 1
  }
done
if [[ ! "$OWNER_EMAIL" =~ ^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$ ]]; then
  echo "ERROR: PLATFORM_OWNER_EMAIL no parece válido." >&2
  exit 1
fi

API="${SUPABASE_URL%/}"
AUTH_HEADERS=(
  -H "Authorization: Bearer $SERVICE_KEY"
  -H "apikey: $SERVICE_KEY"
  -H 'Content-Type: application/json'
)

read -r -p "Escribe CREAR-PROPIETARIO-STAGING para continuar: " CONFIRMATION
if [[ "$CONFIRMATION" != "CREAR-PROPIETARIO-STAGING" ]]; then
  echo "Cancelado."
  exit 1
fi

OWNER_ID=""
PAGE=1
while (( PAGE <= 25 )); do
  RESPONSE="$(curl -fsS "${AUTH_HEADERS[@]}" \
    "$API/auth/v1/admin/users?page=$PAGE&per_page=100")"
  OWNER_ID="$(jq -r --arg email "${OWNER_EMAIL,,}" \
    '(.users // [])[] | select((.email // "" | ascii_downcase) == $email) | .id' \
    <<<"$RESPONSE" | head -n 1)"
  [[ -n "$OWNER_ID" ]] && break
  COUNT="$(jq '(.users // []) | length' <<<"$RESPONSE")"
  (( COUNT < 100 )) && break
  PAGE=$((PAGE + 1))
done

if [[ -z "$OWNER_ID" ]]; then
  echo "Creando invitación temporal..."
  PAYLOAD="$(jq -n \
    --arg email "$OWNER_EMAIL" \
    --arg name "$OWNER_NAME" \
    '{email:$email,data:{display_name:$name,invited_from:"platform_owner_bootstrap"}}')"
  RESPONSE="$(curl -fsS -X POST "${AUTH_HEADERS[@]}" \
    "$API/auth/v1/invite?redirect_to=$(python3 -c 'import os,urllib.parse; print(urllib.parse.quote(os.environ["PLATFORM_REDIRECT"], safe=""))' \
      PLATFORM_REDIRECT="${PORTAL_URL%/}/portal/restablecer/")" \
    --data "$PAYLOAD")"
  OWNER_ID="$(jq -r '.id // empty' <<<"$RESPONSE")"
  if [[ -z "$OWNER_ID" ]]; then
    echo "ERROR: Auth no devolvió el ID del usuario invitado." >&2
    exit 1
  fi
  echo "Invitación creada. El propietario debe abrir el correo y definir su contraseña."
else
  echo "La cuenta ya existe; se conservará su contraseña y factores actuales."
fi

NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
PROFILE_PAYLOAD="$(jq -n \
  --arg name "$OWNER_NAME" \
  --arg owner_id "$OWNER_ID" \
  --arg now "$NOW" \
  '{display_name:$name,platform_role:"owner",account_status:"active",approved_by:$owner_id,approved_at:$now,suspended_at:null}')"

# El trigger de auth crea el perfil. Se reintenta brevemente por si Auth todavía
# está terminando la transacción del usuario.
for attempt in 1 2 3 4 5; do
  STATUS="$(curl -sS -o /tmp/isivolt-owner-profile-response.json -w '%{http_code}' \
    -X PATCH "${AUTH_HEADERS[@]}" \
    -H 'Prefer: return=representation' \
    "$API/rest/v1/platform_profiles?user_id=eq.$OWNER_ID" \
    --data "$PROFILE_PAYLOAD")"
  if [[ "$STATUS" == "200" ]]; then break; fi
  sleep 1
done
if [[ "$STATUS" != "200" ]]; then
  echo "ERROR: no se pudo activar el perfil propietario (HTTP $STATUS)." >&2
  cat /tmp/isivolt-owner-profile-response.json >&2 || true
  rm -f /tmp/isivolt-owner-profile-response.json
  exit 1
fi
rm -f /tmp/isivolt-owner-profile-response.json

AUDIT_PAYLOAD="$(jq -n \
  --arg actor "$OWNER_ID" \
  --arg now "$NOW" \
  '{actor_user_id:$actor,target_user_id:$actor,event_type:"PLATFORM_OWNER_BOOTSTRAPPED",outcome:"success",metadata:{environment:"staging",created_at:$now}}')"
curl -fsS -X POST "${AUTH_HEADERS[@]}" \
  -H 'Prefer: return=minimal' \
  "$API/rest/v1/platform_audit_log" \
  --data "$AUDIT_PAYLOAD" >/dev/null

printf '\nPropietario de staging preparado.\nCorreo: %s\nID: %s\n' "$OWNER_EMAIL" "$OWNER_ID"
printf 'Paso obligatorio: iniciar sesión y completar TOTP para obtener AAL2.\n'
