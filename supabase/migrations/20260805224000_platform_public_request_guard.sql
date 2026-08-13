-- Las solicitudes públicas dejan de insertarse directamente mediante PostgREST.
-- Solo la Edge Function platform-access-request, ejecutada con service_role,
-- puede validar, limitar y persistir una solicitud.

drop policy if exists platform_access_requests_insert_public
  on public.platform_access_requests;

revoke insert on table public.platform_access_requests from anon, authenticated;

create table if not exists public.platform_access_request_limits (
  key_hash text primary key,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  last_request_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.platform_access_request_limits enable row level security;
revoke all on table public.platform_access_request_limits from anon, authenticated;

create trigger platform_access_request_limits_updated_at
before update on public.platform_access_request_limits
for each row execute function public.platform_set_updated_at();

create index if not exists platform_access_request_limits_expiry_idx
  on public.platform_access_request_limits (expires_at);

create or replace function public.platform_consume_access_request_limit(
  p_key_hash text,
  p_max_requests integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_row public.platform_access_request_limits%rowtype;
  now_value timestamptz := clock_timestamp();
  window_interval interval;
begin
  if nullif(trim(p_key_hash), '') is null
    or p_max_requests < 1
    or p_max_requests > 100
    or p_window_seconds < 60
    or p_window_seconds > 604800 then
    raise exception 'INVALID_RATE_LIMIT_ARGUMENTS' using errcode = '22023';
  end if;

  window_interval := make_interval(secs => p_window_seconds);

  insert into public.platform_access_request_limits (
    key_hash,
    window_started_at,
    request_count,
    last_request_at,
    expires_at
  ) values (
    p_key_hash,
    now_value,
    1,
    now_value,
    now_value + window_interval
  )
  on conflict (key_hash) do update set
    window_started_at = case
      when public.platform_access_request_limits.expires_at <= now_value
        then now_value
      else public.platform_access_request_limits.window_started_at
    end,
    request_count = case
      when public.platform_access_request_limits.expires_at <= now_value
        then 1
      else public.platform_access_request_limits.request_count + 1
    end,
    last_request_at = now_value,
    expires_at = case
      when public.platform_access_request_limits.expires_at <= now_value
        then now_value + window_interval
      else public.platform_access_request_limits.expires_at
    end,
    updated_at = now_value
  returning * into current_row;

  return query select
    current_row.request_count <= p_max_requests,
    greatest(p_max_requests - current_row.request_count, 0),
    case
      when current_row.request_count <= p_max_requests then 0
      else greatest(ceil(extract(epoch from (current_row.expires_at - now_value)))::integer, 1)
    end;
end;
$$;

revoke all on function public.platform_consume_access_request_limit(text, integer, integer)
  from public;
grant execute on function public.platform_consume_access_request_limit(text, integer, integer)
  to service_role;

comment on table public.platform_access_request_limits is
  'Contadores con claves hash y caducidad. No almacena direcciones IP ni correos en claro.';
