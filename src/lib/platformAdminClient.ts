import { PlatformClientError, requireSession } from './platformClient';

export type AdminPermissionInput = {
  application_code: string;
  role_code: string;
  capabilities?: Record<string, unknown>;
  expires_at?: string | null;
};

export type ApproveAccessInput = {
  request_id: string;
  organization_id?: string | null;
  organization_name?: string;
  organization_slug?: string;
  global_role: 'owner' | 'admin' | 'coordinator' | 'member' | 'read_only';
  permissions: AdminPermissionInput[];
};

const apiUrl = (import.meta.env.PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

async function invokeAdmin(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!apiUrl || !anonKey) {
    throw new PlatformClientError('El servidor administrativo no está configurado.', 503);
  }
  const session = await requireSession();
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/functions/v1/platform-admin`, {
      method: 'POST',
      cache: 'no-store',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new PlatformClientError('No se ha podido conectar con la función administrativa.', 0);
  }

  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || body.ok !== true) {
    throw new PlatformClientError(
      typeof body.error === 'string' ? body.error : 'La operación administrativa ha fallado.',
      response.status,
    );
  }
  return body;
}

export function approveAccessRequest(input: ApproveAccessInput): Promise<Record<string, unknown>> {
  return invokeAdmin({ action: 'approve_request', ...input });
}

export function reviewAccessRequest(
  requestId: string,
  status: 'needs_information' | 'rejected' | 'cancelled',
  notes: string,
): Promise<Record<string, unknown>> {
  return invokeAdmin({
    action: 'review_request',
    request_id: requestId,
    status,
    notes,
  });
}
