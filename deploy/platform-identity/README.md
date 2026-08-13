# Montaje de identidad central en staging

La instalación se realiza en paralelo. No modifica los dominios, contenedores ni bases de producción durante las primeras pruebas.

## 1. Requisitos

- copia o instancia Supabase separada para staging;
- PostgreSQL/Auth/REST/Functions propios de staging;
- dominio provisional, recomendado `app-staging.isivoltpro.com`;
- correo SMTP de pruebas;
- clave anon de staging;
- `service_role` y salt de hash guardados únicamente en el servidor;
- copia y restauración verificadas.

No se admite utilizar la base de producción como staging cambiando únicamente el esquema `public`: Auth, Storage y auditoría también deben estar aislados.

## 2. Diagnóstico del mini PC

Desde la rama de identidad:

```bash
cd /opt/isivolt-platform/apps/isivoltpro-web
bash deploy/platform-identity/preflight-minipc.sh "$PWD"
```

El script solo consulta. No modifica servicios ni datos.

## 3. Variables sensibles

Crear un archivo fuera del repositorio, por ejemplo:

```text
/etc/isivoltpro/platform-staging.env
```

Permisos:

```bash
sudo install -d -m 0700 /etc/isivoltpro
sudo install -m 0600 /dev/null /etc/isivoltpro/platform-staging.env
```

Contenido orientativo:

```dotenv
PLATFORM_ENVIRONMENT=staging
PUBLIC_SITE_URL=https://app-staging.isivoltpro.com
PUBLIC_SUPABASE_URL=https://app-staging.isivoltpro.com/api
PUBLIC_SUPABASE_ANON_KEY=<clave pública de staging>

SUPABASE_URL=http://127.0.0.1:<puerto-kong-staging>
SUPABASE_SERVICE_ROLE_KEY=<solo servidor>
PLATFORM_DATABASE_URL=postgresql://<usuario>:<clave>@127.0.0.1:<puerto-postgres-staging>/<base>
PLATFORM_IP_HASH_SALT=<mínimo 32 caracteres aleatorios>
PLATFORM_ALLOWED_ORIGINS=https://app-staging.isivoltpro.com
PLATFORM_PUBLIC_PORTAL_URL=https://app-staging.isivoltpro.com
PLATFORM_OWNER_EMAIL=<correo propietario>
PLATFORM_OWNER_NAME=<nombre propietario>
PORTAL_STAGING_PORT=18085
```

Generar el salt sin mostrar otros secretos:

```bash
openssl rand -hex 32
```

## 4. Migraciones

Cargar las variables sin imprimirlas:

```bash
set -a
source /etc/isivoltpro/platform-staging.env
set +a
```

Aplicar únicamente a staging:

```bash
bash deploy/platform-identity/apply-staging-migrations.sh
```

El script:

- exige `PLATFORM_ENVIRONMENT=staging`;
- pide confirmación literal;
- crea una copia `pg_dump` con SHA-256;
- aplica cada migración en transacción;
- controla checksum y evita reaplicar archivos modificados;
- muestra RLS y catálogo al finalizar.

## 5. Edge Functions

Desplegar con la herramienta soportada por el Supabase autohospedado. Configuración:

### `platform-access-request`

- verificación JWT: desactivada, porque es el único formulario público;
- validación propia de origen, datos, honeypot, tiempo y frecuencia;
- secretos: `SUPABASE_SERVICE_ROLE_KEY`, `PLATFORM_IP_HASH_SALT`, `PLATFORM_ALLOWED_ORIGINS`.

### `platform-admin`

- verificación JWT: activada;
- además revalida `platform_is_owner()` con AAL2;
- secretos: `SUPABASE_SERVICE_ROLE_KEY`, `PLATFORM_ALLOWED_ORIGINS`, `PLATFORM_PUBLIC_PORTAL_URL`.

Nunca incluir secretos en el `compose.portal-staging.yml`: el portal solo recibe URL pública y clave anon.

## 6. Propietario inicial

Con las variables cargadas:

```bash
bash deploy/platform-identity/bootstrap-owner-staging.sh
```

El proceso invita o reutiliza la cuenta, activa el perfil `owner` y registra auditoría. Después es obligatorio:

1. abrir la invitación;
2. crear contraseña;
3. iniciar sesión;
4. configurar TOTP;
5. verificar que la sesión pasa a AAL2;
6. confirmar que sin MFA no se abre administración.

## 7. Portal aislado

Construir y arrancar:

```bash
docker compose \
  --env-file /etc/isivoltpro/platform-staging.env \
  -f deploy/platform-identity/compose.portal-staging.yml \
  up -d --build
```

Comprobar:

```bash
docker inspect -f '{{.State.Health.Status}}' isivoltpro-portal-staging
curl -I http://127.0.0.1:18085/portal/
```

## 8. Gateway provisional

El dominio de staging debe:

- enviar `/api/*` al Kong de Supabase staging, eliminando el prefijo `/api`;
- enviar `/portal/*`, `/assets/*` y `/favicon.svg` a `127.0.0.1:18085`;
- no redirigir todavía los dominios de producción;
- eliminar `Authorization`, `Cookie` y `Set-Cookie` de los logs.

La plantilla `deploy/isivolt-gateway/Caddyfile.sso.example` sirve como referencia, pero sus puertos son los previstos para producción y deben adaptarse.

## 9. Pruebas mínimas

1. Solicitud válida crea una sola entrada.
2. Solicitudes repetidas reciben respuesta neutra y no duplican.
3. Honeypot y envío demasiado rápido no persisten.
4. Cuenta no aprobada no abre aplicaciones.
5. Propietario AAL1 es enviado a MFA.
6. Propietario AAL2 abre administración.
7. Aprobación crea/invita usuario, empresa, membresía y permisos.
8. Usuario sin consentimiento no abre el módulo.
9. Usuario suspendido queda bloqueado.
10. Administrador de otra empresa no puede leer solicitudes ni perfiles ajenos.
11. Las claves privilegiadas no aparecen en HTML, JavaScript, logs o imágenes.
12. Restauración de la copia anterior comprobada.

## 10. Prohibiciones antes de producción

- no fusionar la PR mientras staging no supere las pruebas;
- no apuntar `app.isivoltpro.com` al portal de staging;
- no redirigir `ot`, `bt` o `qr`;
- no migrar usuarios reales;
- no desactivar los accesos actuales;
- no reutilizar secretos de staging en producción.
