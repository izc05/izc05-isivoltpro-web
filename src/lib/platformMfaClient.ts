import {
  PlatformClientError,
  requireSession,
  storeSession,
  type PlatformSession,
} from './platformClient';

export type PlatformFactor = {
  id: string;
  friendly_name?: string;
  factor_type: 'totp' | 'phone' | 'webauthn';
  status: 'verified' | 'unverified';
  created_at: string;
  updated_at: string;
};

export type TotpEnrollment = {
  id: string;
  type: 'totp';
  friendly_name?: string;
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
};

export type MfaState = {
  currentLevel: 'aal1' | 'aal2';
  nextLevel: 'aal1' | 'aal2';
  factors: PlatformFactor[];
  verifiedTotp: PlatformFactor[];
};

const apiUrl = (import.meta.env.PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '');
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const encoded = token.split('.')[1];
    if (!encoded) return {};
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(decodeURIComponent(
      Array.from(atob(padded), (character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''),
    )) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function authRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  if (!apiUrl || !anonKey) {
    throw new PlatformClientError('El servidor de identidad no está configurado.', 503);
  }
  const headers = new Headers(init.headers);
  headers.set('apikey', anonKey);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
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
    throw new PlatformClientError('No se ha podido conectar con el servidor MFA.', 0);
  }

  const text = await response.text();
  const body = text ? JSON.parse(text) as Record<string, unknown> : {};
  if (!response.ok) {
    const message = typeof body.msg === 'string'
      ? body.msg
      : typeof body.message === 'string'
        ? body.message
        : typeof body.error === 'string'
          ? body.error
          : `Operación MFA rechazada (${response.status}).`;
    throw new PlatformClientError(message, response.status);
  }
  return body as T;
}

async function rpcRequest<T>(name: string): Promise<T> {
  const session = await requireSession();
  return authRequest<T>(
    `/rest/v1/rpc/${name}`,
    { method: 'POST', body: '{}' },
    session.access_token,
  );
}

export function currentSessionAal(session: PlatformSession): 'aal1' | 'aal2' {
  return decodeJwtPayload(session.access_token).aal === 'aal2' ? 'aal2' : 'aal1';
}

export async function platformRequiresMfa(): Promise<boolean> {
  return rpcRequest<boolean>('platform_requires_mfa');
}

export async function platformHasOwnerRole(): Promise<boolean> {
  return rpcRequest<boolean>('platform_has_owner_role');
}

export async function getMfaState(): Promise<MfaState> {
  const session = await requireSession();
  const user = await authRequest<{ factors?: PlatformFactor[] }>(
    '/auth/v1/user',
    {},
    session.access_token,
  );
  const factors = Array.isArray(user.factors) ? user.factors : [];
  const verifiedTotp = factors.filter(
    (factor) => factor.factor_type === 'totp' && factor.status === 'verified',
  );
  const currentLevel = currentSessionAal(session);
  return {
    currentLevel,
    nextLevel: verifiedTotp.length > 0 ? 'aal2' : currentLevel,
    factors,
    verifiedTotp,
  };
}

export async function removeUnverifiedFactors(): Promise<void> {
  const session = await requireSession();
  const state = await getMfaState();
  for (const factor of state.factors.filter((item) => item.status === 'unverified')) {
    await authRequest<unknown>(
      `/auth/v1/factors/${encodeURIComponent(factor.id)}`,
      { method: 'DELETE' },
      session.access_token,
    );
  }
}

export async function enrollTotpFactor(): Promise<TotpEnrollment> {
  await removeUnverifiedFactors();
  const session = await requireSession();
  const enrollment = await authRequest<TotpEnrollment>(
    '/auth/v1/factors',
    {
      method: 'POST',
      body: JSON.stringify({
        friendly_name: 'IsiVoltPro Authenticator',
        factor_type: 'totp',
        issuer: 'IsiVoltPro',
      }),
    },
    session.access_token,
  );
  return {
    ...enrollment,
    totp: {
      ...enrollment.totp,
      qr_code: enrollment.totp.qr_code.startsWith('data:')
        ? enrollment.totp.qr_code
        : `data:image/svg+xml;utf-8,${encodeURIComponent(enrollment.totp.qr_code)}`,
    },
  };
}

export async function verifyTotpFactor(factorId: string, code: string): Promise<PlatformSession> {
  if (!/^\d{6}$/.test(code)) {
    throw new PlatformClientError('Introduce el código de seis cifras.', 400);
  }
  const session = await requireSession();
  const challenge = await authRequest<{ id: string }>(
    `/auth/v1/factors/${encodeURIComponent(factorId)}/challenge`,
    { method: 'POST', body: JSON.stringify({ factorId }) },
    session.access_token,
  );
  const verified = await authRequest<PlatformSession>(
    `/auth/v1/factors/${encodeURIComponent(factorId)}/verify`,
    {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challenge.id, code }),
    },
    session.access_token,
  );
  const nextSession: PlatformSession = {
    ...verified,
    expires_at: verified.expires_at
      ?? Math.floor(Date.now() / 1000) + verified.expires_in,
  };
  storeSession(nextSession);
  return nextSession;
}
