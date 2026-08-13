-- Los perfiles privilegiados solo administran con una sesión AAL2.

create or replace function public.platform_has_owner_role()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.platform_profiles profile
    where profile.user_id = auth.uid()
      and profile.platform_role = 'owner'
      and profile.account_status = 'active'
  );
$$;

create or replace function public.platform_requires_mfa()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.platform_has_owner_role() or exists (
    select 1
    from public.platform_memberships membership
    join public.platform_profiles profile on profile.user_id = membership.user_id
    join public.platform_organizations organization on organization.id = membership.organization_id
    where membership.user_id = auth.uid()
      and membership.status = 'active'
      and membership.global_role in ('owner', 'admin')
      and profile.account_status = 'active'
      and organization.status = 'active'
  );
$$;

create or replace function public.platform_is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.platform_has_owner_role()
    and public.platform_current_aal_rank() >= 2;
$$;

create or replace function public.platform_is_org_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.platform_is_owner() or (
    public.platform_current_aal_rank() >= 2
    and exists (
      select 1
      from public.platform_memberships membership
      join public.platform_profiles profile on profile.user_id = membership.user_id
      join public.platform_organizations organization on organization.id = membership.organization_id
      where membership.organization_id = target_organization_id
        and membership.user_id = auth.uid()
        and membership.status = 'active'
        and membership.global_role in ('owner', 'admin')
        and profile.account_status = 'active'
        and organization.status = 'active'
    )
  );
$$;

drop policy if exists platform_profiles_select_self_or_admin
  on public.platform_profiles;

create policy platform_profiles_select_self_or_admin
on public.platform_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.platform_is_owner()
  or exists (
    select 1
    from public.platform_memberships target
    where target.user_id = platform_profiles.user_id
      and public.platform_is_org_admin(target.organization_id)
  )
);

revoke all on function public.platform_has_owner_role() from public;
revoke all on function public.platform_requires_mfa() from public;
revoke all on function public.platform_is_owner() from public;
revoke all on function public.platform_is_org_admin(uuid) from public;

grant execute on function public.platform_has_owner_role() to authenticated;
grant execute on function public.platform_requires_mfa() to authenticated;
grant execute on function public.platform_is_owner() to authenticated;
grant execute on function public.platform_is_org_admin(uuid) to authenticated;

comment on function public.platform_requires_mfa() is
  'Indica si la cuenta tiene un rol privilegiado que obliga a completar MFA antes de administrar.';
