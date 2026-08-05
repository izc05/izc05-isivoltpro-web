import { readFile } from 'node:fs/promises';

const migration = (name) => new URL(`../supabase/migrations/${name}`, import.meta.url);

const [foundation, hardening, routes, admin, publicGuard, privilegedMfa] = await Promise.all([
  readFile(migration('20260805220000_platform_identity_foundation.sql'), 'utf8'),
  readFile(migration('20260805221000_platform_identity_hardening.sql'), 'utf8'),
  readFile(migration('20260805222000_platform_single_origin_routes.sql'), 'utf8'),
  readFile(migration('20260805223000_platform_admin_workflows.sql'), 'utf8'),
  readFile(migration('20260805224000_platform_public_request_guard.sql'), 'utf8'),
  readFile(migration('20260805225000_platform_enforce_privileged_mfa.sql'), 'utf8'),
]);

const requiredTables = [
  'platform_profiles',
  'platform_organizations',
  'platform_memberships',
  'platform_applications',
  'platform_app_permissions',
  'platform_app_consents',
  'platform_access_requests',
  'platform_invitations',
  'platform_audit_log',
];

const errors = [];

for (const table of requiredTables) {
  if (!foundation.includes(`create table if not exists public.${table}`)) {
    errors.push(`Falta la tabla ${table}.`);
  }
  if (!foundation.includes(`alter table public.${table} enable row level security`)) {
    errors.push(`Falta activar RLS en ${table}.`);
  }
}

const requiredFunctions = [
  ['platform_is_owner', `${foundation}\n${privilegedMfa}`],
  ['platform_is_org_admin', `${foundation}\n${privilegedMfa}`],
  ['platform_has_app_entitlement', foundation],
  ['platform_can_launch_app', `${foundation}\n${hardening}`],
  ['platform_my_applications', foundation],
  ['platform_finalize_approved_access', admin],
  ['platform_review_access_request', admin],
  ['platform_consume_access_request_limit', publicGuard],
  ['platform_requires_mfa', privilegedMfa],
];

for (const [functionName, source] of requiredFunctions) {
  if (!source.includes(`function public.${functionName}`)) {
    errors.push(`Falta la función ${functionName}.`);
  }
}

for (const appCode of ['ot', 'preinspecciones_bt', 'herramientas_qr']) {
  if (!foundation.includes(`'${appCode}'`)) {
    errors.push(`Falta la aplicación ${appCode} en el catálogo inicial.`);
  }
}

const hardeningChecks = [
  ['privilegios de perfil', hardening, 'grant update (display_name, phone, locale)'],
  ['MFA/AAL base', hardening, 'platform_current_aal_rank'],
  ['consentimiento vigente', hardening, 'platform_app_consents'],
  ['revocación pública', hardening, 'revoke all on table public.platform_profiles from anon, authenticated'],
  ['MFA privilegiado', privilegedMfa, 'platform_current_aal_rank() >= 2'],
  ['solicitudes solo por servidor', publicGuard, 'revoke insert on table public.platform_access_requests from anon, authenticated'],
  ['RPC administrativas solo servidor', admin, 'to service_role'],
];

for (const [label, source, marker] of hardeningChecks) {
  if (!source.includes(marker)) errors.push(`Falta el control de ${label}.`);
}

for (const route of [
  'https://app.isivoltpro.com/ot/',
  'https://app.isivoltpro.com/preinspecciones/',
  'https://app.isivoltpro.com/herramientas/',
]) {
  if (!routes.includes(route)) errors.push(`Falta la ruta privada ${route}.`);
}

const allMigrations = [foundation, hardening, routes, admin, publicGuard, privilegedMfa].join('\n');
if (/service[_-]?role\s*=|supabase_service_role_key\s*=|eyJ[a-zA-Z0-9_-]{20,}/i.test(allMigrations)) {
  errors.push('Se detectó un posible secreto o token incrustado en las migraciones.');
}

if (errors.length > 0) {
  console.error('Validación de identidad central fallida:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Identidad central: RLS, MFA, administración, solicitudes y rutas verificados.');
