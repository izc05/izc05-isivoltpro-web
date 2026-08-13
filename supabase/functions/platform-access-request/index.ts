import { createClient } from '@supabase/supabase-js';

type AccessRequestInput = {
  email?: unknown;
  full_name?: unknown;
  phone?: unknown;
  company_name?: unknown;
  job_title?: unknown;
  requested_applications?: unknown;
  purpose?: unknown;
  privacy_accepted_at?: unknown;
  privacy_version?: unknown;
  website?: unknown;
  form_started_at?: unknown;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const hashSalt = Deno.env.get('PLATFORM_IP_HASH_SALT') || '';
const allowedOrigins = new Set(
  (Deno.env.get('PLATFORM_ALLOWED_ORIGINS') || 'https://app.isivoltpro.com')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);
const allowedApplications = new Set(['ot', 'preinspecciones_bt', 'herramientas_qr']);

function headers(origin: string | null): HeadersInit {
  const result: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  };
  if (origin && allowedOrigins.has(origin)) {
    result['Access-Control-Allow-Origin'] = origin;
    result['Access-Control-Allow-Headers'] = 'apikey, content-type';
    result['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    result['Vary'] = 'Origin';
  }
  return result;
}

function respond(origin: string | null, status = 202): Response {
  return new Response(
    JSON.stringify({
      ok: true,
      message: 'La solicitud se ha recibido para revisión.',
    }),
    { status, headers: headers(origin) },
  );
}

function reject(origin: string | null, code: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error: code }), {
    status,
    headers: headers(origin),
  });
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength)
    : '';
}

function clientIp(req: Request): string {
  const candidates = [
    req.headers.get('CF-Connecting-IP'),
    req.headers.get('X-Real-IP'),
    req.headers.get('X-Forwarded-For')?.split(',')[0],
  ];
  return candidates.find((value) => value?.trim())?.trim() || 'unknown';
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function normalizeApplications(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error('INVALID_APPLICATIONS');
  const applications = [...new Set(value.map((item) => cleanText(item, 80)))];
  if (applications.length === 0 || applications.length > allowedApplications.size) {
    throw new Error('INVALID_APPLICATIONS');
  }
  if (applications.some((application) => !allowedApplications.has(application))) {
    throw new Error('INVALID_APPLICATIONS');
  }
  return applications;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    if (origin && !allowedOrigins.has(origin)) return reject(null, 'ORIGIN_NOT_ALLOWED', 403);
    return new Response(null, { status: 204, headers: headers(origin) });
  }
  if (req.method !== 'POST') return reject(origin, 'METHOD_NOT_ALLOWED', 405);
  if (origin && !allowedOrigins.has(origin)) return reject(null, 'ORIGIN_NOT_ALLOWED', 403);
  if (!supabaseUrl || !serviceRoleKey || hashSalt.length < 32) {
    console.error(JSON.stringify({ event: 'access_request_configuration_error' }));
    return reject(origin, 'SERVER_NOT_CONFIGURED', 503);
  }

  try {
    const input = await req.json() as AccessRequestInput;
    const website = cleanText(input.website, 200);
    const startedAt = Number(input.form_started_at || 0);
    const elapsed = Date.now() - startedAt;

    // Respuesta neutra para bots: no se persiste nada y no se revela el control activado.
    if (website || !Number.isFinite(startedAt) || startedAt <= 0 || elapsed < 2500 || elapsed > 86_400_000) {
      return respond(origin);
    }

    const email = cleanText(input.email, 320).toLowerCase();
    const fullName = cleanText(input.full_name, 160);
    const phone = cleanText(input.phone, 40);
    const companyName = cleanText(input.company_name, 180);
    const jobTitle = cleanText(input.job_title, 160);
    const purpose = cleanText(input.purpose, 1200);
    const privacyVersion = cleanText(input.privacy_version, 20);
    const privacyAcceptedAt = cleanText(input.privacy_accepted_at, 40);
    const applications = normalizeApplications(input.requested_applications);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || fullName.length < 2
      || purpose.length < 20
      || privacyVersion !== '1.0'
      || Number.isNaN(Date.parse(privacyAcceptedAt))) {
      return reject(origin, 'INVALID_REQUEST', 400);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const ipHash = await sha256(`ip:${hashSalt}:${clientIp(req)}`);
    const emailHash = await sha256(`email:${hashSalt}:${email}`);

    const limits = [
      { key: `ip-hour:${ipHash}`, max: 3, seconds: 3600 },
      { key: `ip-day:${ipHash}`, max: 8, seconds: 86400 },
      { key: `email-day:${emailHash}`, max: 2, seconds: 86400 },
    ];
    for (const limit of limits) {
      const { data, error } = await admin.rpc('platform_consume_access_request_limit', {
        p_key_hash: limit.key,
        p_max_requests: limit.max,
        p_window_seconds: limit.seconds,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row?.allowed) return respond(origin);
    }

    const { data: existing, error: existingError } = await admin
      .from('platform_access_requests')
      .select('id')
      .ilike('email', email)
      .in('status', ['pending', 'needs_information'])
      .limit(1);
    if (existingError) throw existingError;
    if (existing && existing.length > 0) return respond(origin);

    const { data: requestRow, error: insertError } = await admin
      .from('platform_access_requests')
      .insert({
        email,
        full_name: fullName,
        phone: phone || null,
        company_name: companyName || null,
        job_title: jobTitle || null,
        requested_applications: applications,
        purpose,
        privacy_accepted_at: new Date(privacyAcceptedAt).toISOString(),
        privacy_version: privacyVersion,
        status: 'pending',
      })
      .select('id')
      .single();
    if (insertError) {
      // Mantener respuesta neutra ante carreras con el índice único por correo.
      if (insertError.code === '23505') return respond(origin);
      throw insertError;
    }

    await admin.from('platform_audit_log').insert({
      event_type: 'ACCESS_REQUEST_SUBMITTED',
      outcome: 'success',
      metadata: {
        request_id: requestRow.id,
        requested_applications: applications,
        ip_hash_prefix: ipHash.slice(0, 12),
      },
    });

    return respond(origin);
  } catch (error) {
    const code = error instanceof Error ? error.message : 'SERVER_ERROR';
    console.error(JSON.stringify({ event: 'access_request_error', code }));
    if (code.startsWith('INVALID_')) return reject(origin, code, 400);
    return reject(origin, 'SERVER_ERROR', 500);
  }
});
