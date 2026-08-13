-- Endurecimiento de privilegios y MFA para la identidad central.

-- Los usuarios solo pueden editar campos de perfil no privilegiados.
drop policy if exists platform_profiles_update_self on public.platform_profiles;

create policy platform_profiles_update_self
on public.platform_profiles
for update
to authenticated
using (user_id = auth.uid() and account_status <> 'closed')
with check (user_id = auth.uid());

-- Los privilegios de columna impiden modificar rol, estado o aprobaciones
-- aunque el cliente intente incluirlos en una actualización.
revoke all on table public.platform_profiles from anon, authenticated;
grant select on table public.platform_profiles to authenticated;
grant update (display_name, phone, locale) on table public.platform_profiles to authenticated;

revoke all on table public.platform_organizations from anon, authenticated;
grant select, update on table public.platform_organizations to authenticated;

revoke all on table public.platform_memberships from anon, authenticated;
grant select on table public.platform_memberships to authenticated;

revoke all on table public.platform_applications from anon, authenticated;
grant select on table public.platform_applications to authenticated;

revoke all on table public.platform_app_permissions from anon, authenticated;
grant select on table public.platform_app_permissions to authenticated;

revoke all on table public.platform_app_consents from anon, authenticated;
grant select, insert on table public.platform_app_consents to authenticated;
grant update (revoked_at, metadata) on table public.platform_app_consents to authenticated;

revoke all on table public.platform_access_requests from anon, authenticated;
grant insert on table public.platform_access_requests to anon, authenticated;
grant select on table public.platform_access_requests to authenticated;

revoke all on table public.platform_invitations from anon, authenticated;
grant select on table public.platform_invitations to authenticated;

revoke all on table public.platform_audit_log from anon, authenticated;
grant select on table public.platform_audit_log to authenticated;

create or replace function public.platform_current_aal_rank()
returns integer
language sql
stable
security invoker
set search_path = public, auth
as $$
  select case coalesce(auth.jwt() ->> 'aal', 'aal1')
    when 'aal2' then 2
    else 1
  end;
$$;

create or replace function public.platform_required_aal_rank(target_application_code text)
returns integer
language sql
stable
security definer
set search_path = public, auth
as $$
  select case application.min_aal
    when 'aal2' then 2
    else 1
  end
  from public.platform_applications application
  where application.code = target_application_code;
$$;

create or replace function public.platform_can_launch_app(target_application_code text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    public.platform_has_app_entitlement(target_application_code)
    and public.platform_current_aal_rank() >= coalesce(
      public.platform_required_aal_rank(target_application_code),
      99
    )
    and exists (
      select 1
      from public.platform_applications application
      join public.platform_app_consents consent
        on consent.application_code = application.code
       and consent.user_id = auth.uid()
       and consent.privacy_version = application.privacy_version
       and consent.revoked_at is null
      where application.code = target_application_code
        and application.status in ('beta', 'active')
    );
$$;

revoke all on function public.platform_current_aal_rank() from public;
revoke all on function public.platform_required_aal_rank(text) from public;
revoke all on function public.platform_can_launch_app(text) from public;

grant execute on function public.platform_current_aal_rank() to authenticated;
grant execute on function public.platform_required_aal_rank(text) to authenticated;
grant execute on function public.platform_can_launch_app(text) to authenticated;

comment on function public.platform_current_aal_rank() is
  'Convierte el nivel AAL de la sesión Supabase en un valor comparable para exigir MFA por aplicación.';
