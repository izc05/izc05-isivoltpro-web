export type PlatformSession = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
};

export type PlatformApplication = {
  application_code: string;
  application_name: string;
  launch_url: string;
  application_status: 'disabled' | 'beta' | 'active' | 'maintenance';
  role_code: string;
  permission_status: 'pending' | 'active' | 'suspended' | 'revoked';
  consent_required: boolean;
  can_launch: boolean;
  organization_id: string;
  organization_name: string;
};

export type ApplicationDisclosure = {
  code: string;
  name: string;
  description: string;
  launch_url: string;
  status: string;
  min_aal: 'aal1' | 'aal2';
  privacy_version: string;
  data_use_summary: string;
  data_categories: string[];
};

export type AccessRequestPayload = {
  email: string;
  full_name: string;
  phone?: string;
  company_name?: string;
  job_title?: string;
  requested_applications: string[];
  purpose: string;
  privacy_accepted_at: string;
  privacy_version: string;
  website?: string;
  form_started_at: number;
};

export type AccessRequestRecord = {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  company_name?: string | null;
  job_title?: string | null;
  requested_applications: string[];
  purpose: string;
  privacy_accepted_at: string;
  privacy_version: string;
  status: 'pending' | 'needs_information' | 'approved' | 'rejected' | 'cancelled';
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
};

const apiUrl = (import.meta.env.PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';
const sessionKey = 'isivoltpro:platform-session:v1';

export class PlatformClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 0, code?: string) {
    super(message);
    this.name = 'PlatformClientError';
    this.status = status;
    this.code = code;
  }
}

export const withBase = (path: string): string => {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\/+/, '')}`;
};

export const isPlatformConfigured = (): boolean => Boolean(apiUrl && anonKey);

function assertConfigured(): void {
  if (!isPlatformConfigured()) {
    throw new PlatformClientError(
      'El portal todavía no está conectado al servidor de identidad.',
      503,
      'PLATFORM_NOT_CONFIGURED',
    );
  }
}

function parseResponseError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const candidate = payload as Record<string, unknown>;
  for (const key of ['msg', 'message', 'error_description', 'error']) {
    const value = candidate[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return fallback;
}

function parseResponseCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const candidate = payload as Record<string, unknown>;
  for (const key of ['code', 'error_code', 'error']) {
    const value = candidate[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  assertConfigured();
  const headers = new Headers(init.headers);
  headers.set('apikey', anonKey);
  headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers,
      credentials: 'omit',
      cache: 'no-store',
    });
  } catch {
    throw new PlatformClientError(
      'No se ha podido conectar con el servidor. Revisa la conexión e inténtalo de nuevo.',
      0,
      'NETWORK_ERROR',
    );
  }

  const text = await response.text();
  const payload = text ? safelyParseJson(text) : null;
  if (!response.ok) {
    throw new PlatformClientError(
      parseResponseError(payload, `El servidor ha rechazado la operación (${response.status}).`),
      response.status,
      parseResponseCode(payload),
    );
  }
  return payload as T;
}

function safelyParseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeSession(session: Omit<PlatformSession, 'expires_at'> & { expires_at?: number }): PlatformSession {
  return {
    ...session,
    expires_at: session.expires_at ?? Math.floor(Date.now() / 1000) + session.expires_in,
  };
}

export function storeSession(session: PlatformSession): void {
  window.sessionStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearStoredSession(): void {
  window.sessionStorage.removeItem(sessionKey);
}

export function getStoredSession(): PlatformSession | null {
  const raw = window.sessionStorage.getItem(sessionKey);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as PlatformSession;
    if (!session.access_token || !session.refresh_token || !session.user?.id) {
      clearStoredSession();
      return null;
    }
    return session;
  } catch {
    clearStoredSession();
    return null;
  }
}

export async function signInWithPassword(email: string, password: string): Promise<PlatformSession> {
  const session = normalizeSession(await request<PlatformSession>(
    '/auth/v1/token?grant_type=password',
    {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    },
  ));
  storeSession(session);
  return session;
}

export async function refreshSession(session = getStoredSession()): Promise<PlatformSession> {
  if (!session) throw new PlatformClientError('La sesión ha caducado.', 401, 'NO_SESSION');
  const refreshed = normalizeSession(await request<PlatformSession>(
    '/auth/v1/token?grant_type=refresh_token',
    {
      method: 'POST',
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    },
  ));
  storeSession(refreshed);
  return refreshed;
}

export async function requireSession(): Promise<PlatformSession> {
  const session = getStoredSession();
  if (!session) throw new PlatformClientError('Debes iniciar sesión.', 401, 'NO_SESSION');
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at - now < 90) return refreshSession(session);
  return session;
}

export async function signOut(): Promise<void> {
  const session = getStoredSession();
  try {
    if (session) {
      await request<unknown>('/auth/v1/logout', { method: 'POST' }, session.access_token);
    }
  } finally {
    clearStoredSession();
  }
}

export async function sendRecoveryEmail(email: string): Promise<void> {
  const redirectTo = new URL(withBase('portal/restablecer/'), window.location.origin).toString();
  await request<unknown>(
    `/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    },
  );
}

export async function createRecoverySessionFromUrl(): Promise<PlatformSession> {
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = fragment.get('access_token') || '';
  const refreshToken = fragment.get('refresh_token') || '';
  const expiresIn = Number(fragment.get('expires_in') || '3600');
  const tokenType = fragment.get('token_type') || 'bearer';
  const flowType = fragment.get('type');

  if (!accessToken || !refreshToken || flowType !== 'recovery') {
    throw new PlatformClientError(
      'El enlace de recuperación no es válido o ha caducado.',
      401,
      'INVALID_RECOVERY_LINK',
    );
  }

  const user = await request<PlatformSession['user']>('/auth/v1/user', {}, accessToken);
  const session = normalizeSession({
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: expiresIn,
    token_type: tokenType,
    user,
  });
  storeSession(session);
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return session;
}

export async function updateCurrentPassword(password: string): Promise<void> {
  const session = await requireSession();
  await request<unknown>(
    '/auth/v1/user',
    { method: 'PUT', body: JSON.stringify({ password }) },
    session.access_token,
  );
}

export async function getCurrentUser(): Promise<PlatformSession['user']> {
  const session = await requireSession();
  return request<PlatformSession['user']>('/auth/v1/user', {}, session.access_token);
}

export async function getMyApplications(): Promise<PlatformApplication[]> {
  const session = await requireSession();
  return request<PlatformApplication[]>(
    '/rest/v1/rpc/platform_my_applications',
    { method: 'POST', body: '{}' },
    session.access_token,
  );
}

export async function isPlatformOwner(): Promise<boolean> {
  const session = await requireSession();
  return request<boolean>(
    '/rest/v1/rpc/platform_is_owner',
    { method: 'POST', body: '{}' },
    session.access_token,
  );
}

export async function getApplicationDisclosure(code: string): Promise<ApplicationDisclosure> {
  const session = await requireSession();
  const rows = await request<ApplicationDisclosure[]>(
    `/rest/v1/platform_applications?code=eq.${encodeURIComponent(code)}&select=code,name,description,launch_url,status,min_aal,privacy_version,data_use_summary,data_categories`,
    {},
    session.access_token,
  );
  if (!rows[0]) throw new PlatformClientError('La aplicación solicitada no existe.', 404, 'APP_NOT_FOUND');
  return rows[0];
}

export async function acceptApplicationConsent(
  applicationCode: string,
  privacyVersion: string,
): Promise<void> {
  const session = await requireSession();
  await request<unknown>(
    '/rest/v1/platform_app_consents',
    {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        user_id: session.user.id,
        application_code: applicationCode,
        privacy_version: privacyVersion,
        accepted_at: new Date().toISOString(),
        revoked_at: null,
        metadata: { source: 'portal_web', locale: document.documentElement.lang || 'es' },
      }),
    },
    session.access_token,
  );
}

export async function submitAccessRequest(payload: AccessRequestPayload): Promise<void> {
  try {
    await request<unknown>(
      '/functions/v1/platform-access-request',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  } catch (error) {
    if (error instanceof PlatformClientError && error.status === 400) {
      throw new PlatformClientError(
        'Revisa los datos de la solicitud y vuelve a intentarlo.',
        400,
        error.code,
      );
    }
    throw error;
  }
}

export async function getPendingAccessRequests(): Promise<AccessRequestRecord[]> {
  const session = await requireSession();
  return request<AccessRequestRecord[]>(
    '/rest/v1/platform_access_requests?status=in.(pending,needs_information)&select=id,email,full_name,phone,company_name,job_title,requested_applications,purpose,privacy_accepted_at,privacy_version,status,review_notes,created_at,updated_at&order=created_at.asc',
    {},
    session.access_token,
  );
}

export function describeClientError(error: unknown): string {
  if (error instanceof PlatformClientError) {
    if (error.status === 400 || error.status === 401) {
      return error.message.startsWith('Revisa los datos')
        ? error.message
        : 'El correo o la contraseña no son correctos, o la cuenta todavía no está activa.';
    }
    if (error.status === 403) return 'No tienes permiso para realizar esta operación.';
    if (error.status === 409) return 'Ya existe una solicitud pendiente para este correo.';
    return error.message;
  }
  return 'Se ha producido un error inesperado. Inténtalo de nuevo.';
}
