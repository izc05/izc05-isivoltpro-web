-- IsiVoltPro · Identidad central y autorización por aplicación
-- Fase 1: esquema, permisos, consentimiento y auditoría.
-- Esta migración no activa todavía el portal ni altera las aplicaciones existentes.

create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.platform_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.platform_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  phone text,
  locale text not null default 'es-ES',
  platform_role text not null default 'user'
    check (platform_role in ('owner', 'user')),
  account_status text not null default 'pending'
    check (account_status in ('pending', 'active', 'suspended', 'closed')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'active'
    check (status in ('pending', 'active', 'suspended', 'closed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.platform_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  global_role text not null default 'member'
    check (global_role in ('owner', 'admin', 'coordinator', 'member', 'read_only')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'revoked')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.platform_applications (
  code text primary key
    check (code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  launch_url text not null,
  status text not null default 'beta'
    check (status in ('disabled', 'beta', 'active', 'maintenance')),
  min_aal text not null default 'aal1'
    check (min_aal in ('aal1', 'aal2')),
  privacy_version text not null default '1.0',
  data_use_summary text not null default '',
  data_categories jsonb not null default '[]'::jsonb
    check (jsonb_typeof(data_categories) = 'array'),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_app_permissions (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.platform_memberships(id) on delete cascade,
  application_code text not null references public.platform_applications(code) on delete cascade,
  role_code text not null
    check (role_code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  capabilities jsonb not null default '{}'::jsonb
    check (jsonb_typeof(capabilities) = 'object'),
  status text not null default 'active'
    check (status in ('pending', 'active', 'suspended', 'revoked')),
  expires_at timestamptz,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (membership_id, application_code)
);

create table if not exists public.platform_app_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_code text not null references public.platform_applications(code) on delete cascade,
  privacy_version text not null,
  accepted_at timestamptz not null default now(),
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  unique (user_id, application_code, privacy_version)
);

create table if not exists public.platform_access_requests (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  full_name text not null,
  phone text,
  company_name text,
  job_title text,
  requested_applications jsonb not null default '[]'::jsonb
    check (jsonb_typeof(requested_applications) = 'array'),
  purpose text not null default '',
  privacy_accepted_at timestamptz not null,
  privacy_version text not null default '1.0',
  status text not null default 'pending'
    check (status in ('pending', 'needs_information', 'approved', 'rejected', 'cancelled')),
  review_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists platform_access_requests_one_pending_email
  on public.platform_access_requests (lower(email::text))
  where status in ('pending', 'needs_information');

create table if not exists public.platform_invitations (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  organization_id uuid references public.platform_organizations(id) on delete cascade,
  access_request_id uuid references public.platform_access_requests(id) on delete set null,
  invited_by uuid not null references auth.users(id) on delete restrict,
  auth_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz not null,
  sent_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.platform_organizations(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  application_code text references public.platform_applications(code) on delete set null,
  event_type text not null,
  outcome text not null default 'success'
    check (outcome in ('success', 'denied', 'error')),
  ip_address inet,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists platform_memberships_user_idx
  on public.platform_memberships (user_id, status);
create index if not exists platform_memberships_org_idx
  on public.platform_memberships (organization_id, status);
create index if not exists platform_permissions_membership_idx
  on public.platform_app_permissions (membership_id, status);
create index if not exists platform_audit_org_created_idx
  on public.platform_audit_log (organization_id, created_at desc);
create index if not exists platform_audit_actor_created_idx
  on public.platform_audit_log (actor_user_id, created_at desc);

create trigger platform_profiles_updated_at
before update on public.platform_profiles
for each row execute function public.platform_set_updated_at();

create trigger platform_organizations_updated_at
before update on public.platform_organizations
for each row execute function public.platform_set_updated_at();

create trigger platform_memberships_updated_at
before update on public.platform_memberships
for each row execute function public.platform_set_updated_at();

create trigger platform_applications_updated_at
before update on public.platform_applications
for each row execute function public.platform_set_updated_at();

create trigger platform_app_permissions_updated_at
before update on public.platform_app_permissions
for each row execute function public.platform_set_updated_at();

create trigger platform_access_requests_updated_at
before update on public.platform_access_requests
for each row execute function public.platform_set_updated_at();

create trigger platform_invitations_updated_at
before update on public.platform_invitations
for each row execute function public.platform_set_updated_at();

create or replace function public.platform_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.platform_profiles (
    user_id,
    display_name,
    phone,
    account_status
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'pending'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger platform_on_auth_user_created
after insert on auth.users
for each row execute function public.platform_handle_new_auth_user();

create or replace function public.platform_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.platform_profiles p
    where p.user_id = auth.uid()
      and p.platform_role = 'owner'
      and p.account_status = 'active'
  );
$$;

create or replace function public.platform_is_org_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.platform_is_owner() or exists (
    select 1
    from public.platform_memberships m
    join public.platform_profiles p on p.user_id = m.user_id
    join public.platform_organizations o on o.id = m.organization_id
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.global_role in ('owner', 'admin')
      and p.account_status = 'active'
      and o.status = 'active'
  );
$$;

create or replace function public.platform_has_app_entitlement(target_application_code text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.platform_is_owner() or exists (
    select 1
    from public.platform_app_permissions permission
    join public.platform_memberships membership on membership.id = permission.membership_id
    join public.platform_profiles profile on profile.user_id = membership.user_id
    join public.platform_organizations organization on organization.id = membership.organization_id
    join public.platform_applications application on application.code = permission.application_code
    where membership.user_id = auth.uid()
      and permission.application_code = target_application_code
      and permission.status = 'active'
      and (permission.expires_at is null or permission.expires_at > now())
      and membership.status = 'active'
      and profile.account_status = 'active'
      and organization.status = 'active'
      and application.status in ('beta', 'active')
  );
$$;

create or replace function public.platform_can_launch_app(target_application_code text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.platform_is_owner() or (
    public.platform_has_app_entitlement(target_application_code)
    and exists (
      select 1
      from public.platform_applications application
      join public.platform_app_consents consent
        on consent.application_code = application.code
       and consent.user_id = auth.uid()
       and consent.privacy_version = application.privacy_version
       and consent.revoked_at is null
      where application.code = target_application_code
    )
  );
$$;

create or replace function public.platform_my_applications()
returns table (
  application_code text,
  application_name text,
  launch_url text,
  application_status text,
  role_code text,
  permission_status text,
  consent_required boolean,
  can_launch boolean,
  organization_id uuid,
  organization_name text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    application.code,
    application.name,
    application.launch_url,
    application.status,
    permission.role_code,
    permission.status,
    not exists (
      select 1
      from public.platform_app_consents consent
      where consent.user_id = auth.uid()
        and consent.application_code = application.code
        and consent.privacy_version = application.privacy_version
        and consent.revoked_at is null
    ) as consent_required,
    public.platform_can_launch_app(application.code) as can_launch,
    organization.id,
    organization.name
  from public.platform_app_permissions permission
  join public.platform_memberships membership on membership.id = permission.membership_id
  join public.platform_organizations organization on organization.id = membership.organization_id
  join public.platform_applications application on application.code = permission.application_code
  join public.platform_profiles profile on profile.user_id = membership.user_id
  where membership.user_id = auth.uid()
    and membership.status <> 'revoked'
    and profile.account_status <> 'closed'
  order by application.sort_order, application.name;
$$;

alter table public.platform_profiles enable row level security;
alter table public.platform_organizations enable row level security;
alter table public.platform_memberships enable row level security;
alter table public.platform_applications enable row level security;
alter table public.platform_app_permissions enable row level security;
alter table public.platform_app_consents enable row level security;
alter table public.platform_access_requests enable row level security;
alter table public.platform_invitations enable row level security;
alter table public.platform_audit_log enable row level security;

create policy platform_profiles_select_self_or_admin
on public.platform_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.platform_is_owner()
  or exists (
    select 1
    from public.platform_memberships mine
    join public.platform_memberships target
      on target.organization_id = mine.organization_id
    where mine.user_id = auth.uid()
      and mine.status = 'active'
      and mine.global_role in ('owner', 'admin')
      and target.user_id = platform_profiles.user_id
  )
);

create policy platform_profiles_update_self
on public.platform_profiles
for update
to authenticated
using (user_id = auth.uid() and account_status <> 'closed')
with check (
  user_id = auth.uid()
  and platform_role = (select p.platform_role from public.platform_profiles p where p.user_id = auth.uid())
  and account_status = (select p.account_status from public.platform_profiles p where p.user_id = auth.uid())
);

create policy platform_organizations_select_member
on public.platform_organizations
for select
to authenticated
using (
  public.platform_is_owner()
  or exists (
    select 1
    from public.platform_memberships membership
    where membership.organization_id = platform_organizations.id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
  )
);

create policy platform_organizations_update_admin
on public.platform_organizations
for update
to authenticated
using (public.platform_is_org_admin(id))
with check (public.platform_is_org_admin(id));

create policy platform_memberships_select_self_or_admin
on public.platform_memberships
for select
to authenticated
using (
  user_id = auth.uid()
  or public.platform_is_org_admin(organization_id)
);

create policy platform_applications_select_authenticated
on public.platform_applications
for select
to authenticated
using (status <> 'disabled');

create policy platform_permissions_select_self_or_admin
on public.platform_app_permissions
for select
to authenticated
using (
  exists (
    select 1
    from public.platform_memberships membership
    where membership.id = platform_app_permissions.membership_id
      and (
        membership.user_id = auth.uid()
        or public.platform_is_org_admin(membership.organization_id)
      )
  )
);

create policy platform_consents_select_self
on public.platform_app_consents
for select
to authenticated
using (user_id = auth.uid() or public.platform_is_owner());

create policy platform_consents_insert_self
on public.platform_app_consents
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.platform_has_app_entitlement(application_code)
  and privacy_version = (
    select application.privacy_version
    from public.platform_applications application
    where application.code = application_code
  )
);

create policy platform_consents_update_self
on public.platform_app_consents
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy platform_access_requests_insert_public
on public.platform_access_requests
for insert
to anon, authenticated
with check (
  status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and privacy_accepted_at is not null
  and length(trim(full_name)) between 2 and 160
  and length(trim(email::text)) between 5 and 320
);

create policy platform_access_requests_select_owner
on public.platform_access_requests
for select
to authenticated
using (public.platform_is_owner());

create policy platform_invitations_select_owner_or_org_admin
on public.platform_invitations
for select
to authenticated
using (
  public.platform_is_owner()
  or (organization_id is not null and public.platform_is_org_admin(organization_id))
  or auth_user_id = auth.uid()
);

create policy platform_audit_select_owner_or_org_admin
on public.platform_audit_log
for select
to authenticated
using (
  public.platform_is_owner()
  or (organization_id is not null and public.platform_is_org_admin(organization_id))
  or actor_user_id = auth.uid()
);

revoke all on function public.platform_is_owner() from public;
revoke all on function public.platform_is_org_admin(uuid) from public;
revoke all on function public.platform_has_app_entitlement(text) from public;
revoke all on function public.platform_can_launch_app(text) from public;
revoke all on function public.platform_my_applications() from public;

grant execute on function public.platform_is_owner() to authenticated;
grant execute on function public.platform_is_org_admin(uuid) to authenticated;
grant execute on function public.platform_has_app_entitlement(text) to authenticated;
grant execute on function public.platform_can_launch_app(text) to authenticated;
grant execute on function public.platform_my_applications() to authenticated;

insert into public.platform_applications (
  code,
  name,
  description,
  launch_url,
  status,
  min_aal,
  privacy_version,
  data_use_summary,
  data_categories,
  sort_order
) values
  (
    'ot',
    'IsiVoltPro OT',
    'Gestión de clientes, instalaciones, técnicos y órdenes de trabajo.',
    'https://ot.isivoltpro.com/',
    'active',
    'aal1',
    '1.0',
    'Usa datos de perfil, empresa, actividad técnica, órdenes, fotografías, firmas y auditoría para prestar el servicio de mantenimiento.',
    '["perfil","empresa","actividad_tecnica","ordenes_trabajo","fotografias","firmas","auditoria"]'::jsonb,
    10
  ),
  (
    'preinspecciones_bt',
    'Preinspecciones BT',
    'Preinspecciones eléctricas, checklist, evidencias, informes y cierre presencial.',
    'https://bt.isivoltpro.com/',
    'beta',
    'aal1',
    '1.0',
    'Usa datos de perfil, empresa, inspecciones, ubicación de cierre, fotografías, firmas, documentos y auditoría.',
    '["perfil","empresa","inspecciones","ubicacion_cierre","fotografias","firmas","documentos","auditoria"]'::jsonb,
    20
  ),
  (
    'herramientas_qr',
    'Herramientas QR/NFC',
    'Inventario, técnicos, préstamos, devoluciones, QR, NFC y fotografías.',
    'https://qr.isivoltpro.com/',
    'beta',
    'aal1',
    '1.0',
    'Usa datos de perfil, empresa, inventario, asignaciones, fotografías, QR, NFC e historial de movimientos.',
    '["perfil","empresa","inventario","asignaciones","fotografias","qr_nfc","historial"]'::jsonb,
    30
  )
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  launch_url = excluded.launch_url,
  status = excluded.status,
  data_use_summary = excluded.data_use_summary,
  data_categories = excluded.data_categories,
  sort_order = excluded.sort_order,
  updated_at = now();

comment on table public.platform_access_requests is
  'Solicitudes públicas. La aprobación y la invitación se realizan exclusivamente desde una función de servidor con service_role.';
comment on table public.platform_app_permissions is
  'Autorización por organización y aplicación. Tener cuenta no concede acceso automático a ninguna aplicación.';
comment on function public.platform_can_launch_app(text) is
  'Comprueba cuenta, organización, permiso, caducidad, estado de aplicación y consentimiento de privacidad vigente.';
