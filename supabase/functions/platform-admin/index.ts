import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

type PermissionInput = {
  application_code: string;
  role_code: string;
  capabilities?: Record<string, unknown>;
  expires_at?: string | null;
};

type ApprovePayload = {
  action: 'approve_request';
  request_id: string;
  organization_id?: string | null;
  organization_name?: string;
  organization_slug?: string;
  global_role: 'owner' | 'admin' | 'coordinator' | 'member' | 'read_only';
  permissions: PermissionInput[];
};

type ReviewPayload = {
  action: 'review_request';
  request_id: string;
  status: 'needs_information' | 'rejected' | 'cancelled';
  notes?: string;
};

type RequestPayload = ApprovePayload | ReviewPayload;

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const publicPortalUrl = (Deno.env.get('PLATFORM_PUBLIC_PORTAL_URL') || 'https://app.isivoltpro.com')
  .replace(/\/+$/, '');
const allowedOrigins = new Set(
  (Deno.env.get('PLATFORM_ALLOWED_ORIGINS') || 'https://app.isivoltpro.com')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

function responseHeaders(origin: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type';
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Vary'] = 'Origin';
  }
  return headers;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders(origin),
  });
}

function assertEnvironment(): void {
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    throw new Error('SERVER_NOT_CONFIGURED');
  }
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeSlug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function validatePermissions(value: unknown): PermissionInput[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 20) {
    throw new Error('INVALID_PERMISSIONS');
  }

  const seen = new Set<string>();
  return value.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('INVALID_PERMISSION');
    const candidate = item as Record<string, unknown>;
    const applicationCode = String(candidate.application_code || '').trim();
    const roleCode = String(candidate.role_code || '').trim();
    if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(applicationCode)
      || !/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(roleCode)
      || seen.has(applicationCode)) {
      throw new Error('INVALID_PERMISSION');
    }
    seen.add(applicationCode);

    const expiresAt = candidate.expires_at == null || candidate.expires_at === ''
      ? null
      : String(candidate.expires_at);
    if (expiresAt && Number.isNaN(Date.parse(expiresAt))) throw new Error('INVALID_EXPIRY');

    return {
      application_code: applicationCode,
      role_code: roleCode,
      capabilities: candidate.capabilities && typeof candidate.capabilities === 'object'
        ? candidate.capabilities as Record<string, unknown>
        : {},
      expires_at: expiresAt,
    };
  });
}

async function findUserByEmail(
  admin: SupabaseClient,
  email: string,
): Promise<User | null> {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 25; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (match) return match;
    if (data.users.length < 100) return null;
  }
  throw new Error('USER_DIRECTORY_LIMIT_REACHED');
}

async function validateOwner(req: Request): Promise<{ actor: User; userClient: SupabaseClient }> {
  const authorization = req.headers.get('Authorization') || '';
  if (!authorization.startsWith('Bearer ')) throw new Error('AUTH_REQUIRED');

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) throw new Error('AUTH_INVALID');

  const { data: owner, error: ownerError } = await userClient.rpc('platform_is_owner');
  if (ownerError) throw ownerError;
  if (owner !== true) throw new Error('PLATFORM_OWNER_REQUIRED');

  return { actor: userData.user, userClient };
}

async function approveRequest(
  payload: ApprovePayload,
  actor: User,
  admin: SupabaseClient,
): Promise<Record<string, unknown>> {
  if (!isUuid(payload.request_id)) throw new Error('INVALID_REQUEST_ID');
  if (payload.organization_id != null && !isUuid(payload.organization_id)) {
    throw new Error('INVALID_ORGANIZATION_ID');
  }
  if (!['owner', 'admin', 'coordinator', 'member', 'read_only'].includes(payload.global_role)) {
    throw new Error('INVALID_GLOBAL_ROLE');
  }

  const permissions = validatePermissions(payload.permissions);
  const { data: requestRow, error: requestError } = await admin
    .from('platform_access_requests')
    .select('id,email,full_name,phone,status')
    .eq('id', payload.request_id)
    .maybeSingle();
  if (requestError) throw requestError;
  if (!requestRow) throw new Error('ACCESS_REQUEST_NOT_FOUND');
  if (!['pending', 'needs_information', 'approved'].includes(requestRow.status)) {
    throw new Error('ACCESS_REQUEST_NOT_APPROVABLE');
  }

  let authUser = await findUserByEmail(admin, requestRow.email);
  let invitationStatus: 'sent' | 'accepted' = 'accepted';

  if (!authUser) {
    const { data: invitation, error: invitationError } = await admin.auth.admin.inviteUserByEmail(
      requestRow.email,
      {
        redirectTo: `${publicPortalUrl}/portal/restablecer/`,
        data: {
          display_name: requestRow.full_name,
          phone: requestRow.phone || undefined,
          invited_from: 'platform_access_request',
        },
      },
    );
    if (invitationError || !invitation.user) {
      throw invitationError || new Error('INVITATION_FAILED');
    }
    authUser = invitation.user;
    invitationStatus = 'sent';
  }

  const organizationName = String(payload.organization_name || '').trim();
  const organizationSlug = normalizeSlug(
    String(payload.organization_slug || organizationName || '').trim(),
  );

  const { data, error } = await admin.rpc('platform_finalize_approved_access', {
    p_request_id: payload.request_id,
    p_auth_user_id: authUser.id,
    p_actor_user_id: actor.id,
    p_organization_id: payload.organization_id || null,
    p_organization_name: organizationName,
    p_organization_slug: organizationSlug,
    p_global_role: payload.global_role,
    p_permissions: permissions,
    p_invitation_status: invitationStatus,
  });
  if (error) throw error;

  return {
    action: 'approve_request',
    result: data,
    invitation_sent: invitationStatus === 'sent',
  };
}

async function reviewRequest(
  payload: ReviewPayload,
  actor: User,
  admin: SupabaseClient,
): Promise<Record<string, unknown>> {
  if (!isUuid(payload.request_id)) throw new Error('INVALID_REQUEST_ID');
  if (!['needs_information', 'rejected', 'cancelled'].includes(payload.status)) {
    throw new Error('INVALID_REVIEW_STATUS');
  }
  const notes = String(payload.notes || '').trim().slice(0, 2000);
  if (['needs_information', 'rejected'].includes(payload.status) && !notes) {
    throw new Error('REVIEW_NOTES_REQUIRED');
  }

  const { data, error } = await admin.rpc('platform_review_access_request', {
    p_request_id: payload.request_id,
    p_actor_user_id: actor.id,
    p_status: payload.status,
    p_notes: notes,
  });
  if (error) throw error;
  return { action: 'review_request', result: data };
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    if (origin && !allowedOrigins.has(origin)) {
      return jsonResponse({ error: 'ORIGIN_NOT_ALLOWED' }, 403, null);
    }
    return new Response(null, { status: 204, headers: responseHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'METHOD_NOT_ALLOWED' }, 405, origin);
  }
  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse({ error: 'ORIGIN_NOT_ALLOWED' }, 403, null);
  }

  try {
    assertEnvironment();
    const { actor } = await validateOwner(req);
    const payload = await req.json() as RequestPayload;
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const result = payload.action === 'approve_request'
      ? await approveRequest(payload, actor, admin)
      : payload.action === 'review_request'
        ? await reviewRequest(payload, actor, admin)
        : (() => { throw new Error('INVALID_ACTION'); })();

    return jsonResponse({ ok: true, ...result }, 200, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    const status = message.includes('AUTH_') ? 401
      : message.includes('OWNER_REQUIRED') || message.includes('ORIGIN_') ? 403
        : message.includes('NOT_FOUND') ? 404
          : message.includes('INVALID_') || message.includes('REQUIRED') || message.includes('APPROVABLE') ? 400
            : 500;

    console.error(JSON.stringify({
      event: 'platform_admin_error',
      status,
      code: message,
    }));

    return jsonResponse(
      { ok: false, error: status === 500 ? 'SERVER_ERROR' : message },
      status,
      origin,
    );
  }
});
