import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const requiredOutput = [
  'dist/portal/index.html',
  'dist/portal/apps/index.html',
  'dist/portal/solicitar-acceso/index.html',
  'dist/portal/recuperar/index.html',
  'dist/portal/restablecer/index.html',
  'dist/portal/privacidad/index.html',
  'dist/portal/admin/index.html',
];

const requiredSource = [
  'src/lib/platformClient.ts',
  'src/lib/platformAdminClient.ts',
  'src/layouts/PortalLayout.astro',
  'src/styles/portal.css',
  'supabase/functions/platform-admin/index.ts',
  'supabase/functions/platform-access-request/index.ts',
  'supabase/migrations/20260805223000_platform_admin_workflows.sql',
  'supabase/migrations/20260805224000_platform_public_request_guard.sql',
];

const errors = [];

for (const path of [...requiredOutput, ...requiredSource]) {
  try {
    await access(resolve(path));
  } catch {
    errors.push(`Falta ${path}.`);
  }
}

const client = await readFile('src/lib/platformClient.ts', 'utf8');
const adminClient = await readFile('src/lib/platformAdminClient.ts', 'utf8');
const adminFunction = await readFile('supabase/functions/platform-admin/index.ts', 'utf8');
const requestFunction = await readFile('supabase/functions/platform-access-request/index.ts', 'utf8');
const workflowMigration = await readFile(
  'supabase/migrations/20260805223000_platform_admin_workflows.sql',
  'utf8',
);
const requestGuardMigration = await readFile(
  'supabase/migrations/20260805224000_platform_public_request_guard.sql',
  'utf8',
);
const envExample = await readFile('.env.example', 'utf8');

const clientChecks = [
  ['sesión temporal', 'window.sessionStorage.setItem'],
  ['inicio de sesión', '/auth/v1/token?grant_type=password'],
  ['recuperación', '/auth/v1/recover'],
  ['permisos centrales', '/rest/v1/rpc/platform_my_applications'],
  ['consentimiento', '/rest/v1/platform_app_consents'],
  ['solicitud protegida', '/functions/v1/platform-access-request'],
];
for (const [label, marker] of clientChecks) {
  if (!client.includes(marker)) errors.push(`Falta el flujo de ${label} en el cliente.`);
}

if (client.includes("request<unknown>(\n    '/rest/v1/platform_access_requests'")) {
  errors.push('El navegador todavía puede intentar insertar solicitudes directamente en PostgREST.');
}

if (!adminClient.includes('/functions/v1/platform-admin')) {
  errors.push('El cliente administrativo no invoca la función protegida.');
}
if (!adminClient.includes('Authorization')) {
  errors.push('El cliente administrativo no transmite la sesión del usuario.');
}

const adminFunctionChecks = [
  ['validación de propietario', "rpc('platform_is_owner')"],
  ['clave de servidor por entorno', "Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')"],
  ['invitación administrativa', 'inviteUserByEmail'],
  ['orígenes permitidos', 'PLATFORM_ALLOWED_ORIGINS'],
  ['operación transaccional', "rpc('platform_finalize_approved_access'"],
];
for (const [label, marker] of adminFunctionChecks) {
  if (!adminFunction.includes(marker)) errors.push(`Falta ${label} en platform-admin.`);
}

const publicFunctionChecks = [
  ['salt de hash', 'PLATFORM_IP_HASH_SALT'],
  ['hash SHA-256', "crypto.subtle.digest('SHA-256'"],
  ['límite por IP y correo', "rpc('platform_consume_access_request_limit'"],
  ['campo trampa', 'website'],
  ['tiempo mínimo de formulario', 'elapsed < 2500'],
  ['respuesta neutra', 'La solicitud se ha recibido para revisión.'],
];
for (const [label, marker] of publicFunctionChecks) {
  if (!requestFunction.includes(marker)) errors.push(`Falta ${label} en platform-access-request.`);
}

for (const marker of [
  'platform_finalize_approved_access',
  'platform_review_access_request',
  'grant execute on function',
  'to service_role',
]) {
  if (!workflowMigration.includes(marker)) errors.push(`Falta ${marker} en la migración administrativa.`);
}

for (const marker of [
  'drop policy if exists platform_access_requests_insert_public',
  'revoke insert on table public.platform_access_requests from anon, authenticated',
  'platform_access_request_limits',
  'platform_consume_access_request_limit',
  'to service_role',
]) {
  if (!requestGuardMigration.includes(marker)) errors.push(`Falta ${marker} en la protección pública.`);
}

if (!envExample.includes('PUBLIC_SUPABASE_URL=') || !envExample.includes('PUBLIC_SUPABASE_ANON_KEY=')) {
  errors.push('Faltan las variables públicas documentadas.');
}

const browserSources = `${client}\n${adminClient}`;
if (/SERVICE_ROLE|service_role_key|SUPABASE_SECRET|sb_secret_/i.test(browserSources)) {
  errors.push('Se detectó una referencia a una clave privilegiada en código de navegador.');
}

const allSource = `${browserSources}\n${adminFunction}\n${requestFunction}\n${workflowMigration}\n${requestGuardMigration}\n${envExample}`;
if (/eyJ[a-zA-Z0-9_-]{30,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/.test(allSource)) {
  errors.push('Se detectó un posible JWT incrustado en el repositorio.');
}

if (errors.length > 0) {
  console.error('Validación del portal fallida:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Portal: rutas, sesión, permisos, administración y solicitudes protegidas verificados.');
