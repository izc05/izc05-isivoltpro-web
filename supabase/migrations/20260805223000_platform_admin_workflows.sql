-- Flujos administrativos invocados exclusivamente desde una Edge Function con service_role.

create or replace function public.platform_finalize_approved_access(
  p_request_id uuid,
  p_auth_user_id uuid,
  p_actor_user_id uuid,
  p_organization_id uuid,
  p_organization_name text,
  p_organization_slug text,
  p_global_role text,
  p_permissions jsonb,
  p_invitation_status text default 'sent'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  request_row public.platform_access_requests%rowtype;
  organization_row public.platform_organizations%rowtype;
  membership_row public.platform_memberships%rowtype;
  permission_item jsonb;
  permission_count integer := 0;
begin
  if not exists (
    select 1
    from public.platform_profiles actor
    where actor.user_id = p_actor_user_id
      and actor.platform_role = 'owner'
      and actor.account_status = 'active'
  ) then
    raise exception 'PLATFORM_OWNER_REQUIRED' using errcode = '42501';
  end if;

  if p_global_role not in ('owner', 'admin', 'coordinator', 'member', 'read_only') then
    raise exception 'INVALID_GLOBAL_ROLE' using errcode = '22023';
  end if;

  if p_invitation_status not in ('sent', 'accepted') then
    raise exception 'INVALID_INVITATION_STATUS' using errcode = '22023';
  end if;

  if jsonb_typeof(p_permissions) <> 'array' or jsonb_array_length(p_permissions) = 0 then
    raise exception 'AT_LEAST_ONE_PERMISSION_REQUIRED' using errcode = '22023';
  end if;

  select *
  into request_row
  from public.platform_access_requests request
  where request.id = p_request_id
  for update;

  if not found then
    raise exception 'ACCESS_REQUEST_NOT_FOUND' using errcode = 'P0002';
  end if;

  if request_row.status not in ('pending', 'needs_information', 'approved') then
    raise exception 'ACCESS_REQUEST_NOT_APPROVABLE' using errcode = '22023';
  end if;

  insert into public.platform_profiles (
    user_id,
    display_name,
    phone,
    platform_role,
    account_status,
    approved_by,
    approved_at,
    suspended_at
  ) values (
    p_auth_user_id,
    request_row.full_name,
    request_row.phone,
    'user',
    'active',
    p_actor_user_id,
    now(),
    null
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    phone = coalesce(excluded.phone, public.platform_profiles.phone),
    account_status = 'active',
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at,
    suspended_at = null,
    updated_at = now();

  if p_organization_id is null then
    if nullif(trim(p_organization_name), '') is null
      or nullif(trim(p_organization_slug), '') is null then
      raise exception 'ORGANIZATION_DATA_REQUIRED' using errcode = '22023';
    end if;

    insert into public.platform_organizations (
      name,
      slug,
      status,
      created_by
    ) values (
      trim(p_organization_name),
      lower(trim(p_organization_slug)),
      'active',
      p_actor_user_id
    )
    on conflict (slug) do update set
      name = excluded.name,
      status = 'active',
      updated_at = now()
    returning * into organization_row;
  else
    select *
    into organization_row
    from public.platform_organizations organization
    where organization.id = p_organization_id
    for update;

    if not found then
      raise exception 'ORGANIZATION_NOT_FOUND' using errcode = 'P0002';
    end if;

    if organization_row.status <> 'active' then
      raise exception 'ORGANIZATION_NOT_ACTIVE' using errcode = '22023';
    end if;
  end if;

  insert into public.platform_memberships (
    organization_id,
    user_id,
    global_role,
    status,
    approved_by,
    approved_at,
    suspended_at
  ) values (
    organization_row.id,
    p_auth_user_id,
    p_global_role,
    'active',
    p_actor_user_id,
    now(),
    null
  )
  on conflict (organization_id, user_id) do update set
    global_role = excluded.global_role,
    status = 'active',
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at,
    suspended_at = null,
    updated_at = now()
  returning * into membership_row;

  for permission_item in select value from jsonb_array_elements(p_permissions)
  loop
    if nullif(permission_item ->> 'application_code', '') is null
      or nullif(permission_item ->> 'role_code', '') is null then
      raise exception 'INVALID_PERMISSION' using errcode = '22023';
    end if;

    if not exists (
      select 1
      from public.platform_applications application
      where application.code = permission_item ->> 'application_code'
        and application.status <> 'disabled'
    ) then
      raise exception 'APPLICATION_NOT_AVAILABLE: %', permission_item ->> 'application_code'
        using errcode = '22023';
    end if;

    insert into public.platform_app_permissions (
      membership_id,
      application_code,
      role_code,
      capabilities,
      status,
      expires_at,
      granted_by,
      granted_at
    ) values (
      membership_row.id,
      permission_item ->> 'application_code',
      permission_item ->> 'role_code',
      coalesce(permission_item -> 'capabilities', '{}'::jsonb),
      'active',
      case
        when nullif(permission_item ->> 'expires_at', '') is null then null
        else (permission_item ->> 'expires_at')::timestamptz
      end,
      p_actor_user_id,
      now()
    )
    on conflict (membership_id, application_code) do update set
      role_code = excluded.role_code,
      capabilities = excluded.capabilities,
      status = 'active',
      expires_at = excluded.expires_at,
      granted_by = excluded.granted_by,
      granted_at = excluded.granted_at,
      updated_at = now();

    permission_count := permission_count + 1;
  end loop;

  update public.platform_access_requests
  set status = 'approved',
      reviewed_by = p_actor_user_id,
      reviewed_at = now(),
      review_notes = null,
      updated_at = now()
  where id = p_request_id;

  insert into public.platform_invitations (
    email,
    organization_id,
    access_request_id,
    invited_by,
    auth_user_id,
    status,
    expires_at,
    sent_at,
    accepted_at
  ) values (
    request_row.email,
    organization_row.id,
    request_row.id,
    p_actor_user_id,
    p_auth_user_id,
    p_invitation_status,
    now() + interval '7 days',
    now(),
    case when p_invitation_status = 'accepted' then now() else null end
  );

  insert into public.platform_audit_log (
    actor_user_id,
    organization_id,
    target_user_id,
    event_type,
    outcome,
    metadata
  ) values (
    p_actor_user_id,
    organization_row.id,
    p_auth_user_id,
    'ACCESS_REQUEST_APPROVED',
    'success',
    jsonb_build_object(
      'request_id', p_request_id,
      'membership_id', membership_row.id,
      'permissions', p_permissions,
      'invitation_status', p_invitation_status
    )
  );

  return jsonb_build_object(
    'request_id', p_request_id,
    'user_id', p_auth_user_id,
    'organization_id', organization_row.id,
    'membership_id', membership_row.id,
    'permission_count', permission_count,
    'invitation_status', p_invitation_status
  );
end;
$$;

create or replace function public.platform_review_access_request(
  p_request_id uuid,
  p_actor_user_id uuid,
  p_status text,
  p_notes text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  request_row public.platform_access_requests%rowtype;
begin
  if not exists (
    select 1
    from public.platform_profiles actor
    where actor.user_id = p_actor_user_id
      and actor.platform_role = 'owner'
      and actor.account_status = 'active'
  ) then
    raise exception 'PLATFORM_OWNER_REQUIRED' using errcode = '42501';
  end if;

  if p_status not in ('needs_information', 'rejected', 'cancelled') then
    raise exception 'INVALID_REVIEW_STATUS' using errcode = '22023';
  end if;

  if p_status in ('needs_information', 'rejected') and nullif(trim(p_notes), '') is null then
    raise exception 'REVIEW_NOTES_REQUIRED' using errcode = '22023';
  end if;

  update public.platform_access_requests
  set status = p_status,
      review_notes = nullif(trim(p_notes), ''),
      reviewed_by = p_actor_user_id,
      reviewed_at = now(),
      updated_at = now()
  where id = p_request_id
    and status in ('pending', 'needs_information')
  returning * into request_row;

  if not found then
    raise exception 'ACCESS_REQUEST_NOT_REVIEWABLE' using errcode = 'P0002';
  end if;

  insert into public.platform_audit_log (
    actor_user_id,
    event_type,
    outcome,
    metadata
  ) values (
    p_actor_user_id,
    'ACCESS_REQUEST_REVIEWED',
    'success',
    jsonb_build_object(
      'request_id', request_row.id,
      'status', p_status,
      'notes', nullif(trim(p_notes), '')
    )
  );

  return jsonb_build_object('request_id', request_row.id, 'status', request_row.status);
end;
$$;

revoke all on function public.platform_finalize_approved_access(uuid, uuid, uuid, uuid, text, text, text, jsonb, text) from public;
revoke all on function public.platform_review_access_request(uuid, uuid, text, text) from public;

grant execute on function public.platform_finalize_approved_access(uuid, uuid, uuid, uuid, text, text, text, jsonb, text) to service_role;
grant execute on function public.platform_review_access_request(uuid, uuid, text, text) to service_role;

comment on function public.platform_finalize_approved_access(uuid, uuid, uuid, uuid, text, text, text, jsonb, text) is
  'Finaliza perfil, organización, membresía, permisos, invitación, solicitud y auditoría en una transacción. Solo service_role.';
