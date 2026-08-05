import { readFile } from 'node:fs/promises';

const foundationPath = new URL(
  '../supabase/migrations/20260805220000_platform_identity_foundation.sql',
  import.meta.url,
);
const hardeningPath = new URL(
  '../supabase/migrations/20260805221000_platform_identity_hardening.sql',
  import.meta.url,
);
const routesPath = new URL(
  '../supabase/migrations/20260805222000_platform_single_origin_routes.sql',
  import.meta.url,
);

const [foundation, hardening, routes] = await Promise.all([
  readFile(foundationPath, 'utf8'),
  readFile(hardeningPath, 'utf8'),
  readFile(routesPath, 'utf8'),
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
  'platform_is_owner',
  'platform_is_org_admin',
  'platform_has_app_entitlement',
  'platform_can_launch_app',
  'platform_my_applications',
];

for (const functionName of requiredFunctions) {
  if (!foundation.includes(`function public.${functionName}`)
    && !hardening.includes(`function public.${functionName}`)) {
    errors.push(`Falta la función ${functionName}.`);
  }
}

for (const appCode of ['ot', 'preinspecciones_bt', 'herramientas_qr']) {
  if (!foundation.includes(`'${appCode}'`)) {
    errors.push(`Falta la aplicación ${appCode} en el catálogo inicial.`);
  }
}

const hardeningChecks = [
  ['privilegios de perfil', 'grant update (display_name, phone, locale)'],
  ['MFA/AAL', 'platform_current_aal_rank'],
  ['consentimiento vigente', 'platform_app_consents'],
  ['revocación pública', 'revoke all on table public.platform_profiles from anon, authenticated'],
];

for (const [label, marker] of hardeningChecks) {
  if (!hardening.includes(marker)) {
    errors.push(`Falta el control de ${label}.`);
  }
}

for (const route of [
  'https://app.isivoltpro.com/ot/',
  'https://app.isivoltpro.com/preinspecciones/',
  'https://app.isivoltpro.com/herramientas/',
]) {
  if (!routes.includes(route)) {
    errors.push(`Falta la ruta privada ${route}.`);
  }
}

if (/service[_-]?role\s*=|supabase_service_role_key\s*=|eyJ[a-zA-Z0-9_-]{20,}/i.test(
  `${foundation}\n${hardening}\n${routes}`,
)) {
  errors.push('Se detectó un posible secreto o token incrustado en las migraciones.');
}

if (errors.length > 0) {
  console.error('Validación de identidad central fallida:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Identidad central: estructura, RLS, MFA, consentimiento y rutas verificados.');
