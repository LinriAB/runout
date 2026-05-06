// RunOut backend — Cloudflare Worker + D1
// Stores per-user personal fields (purchase price, own tags, personal notes)
// complementing Discogs data. Auth via the user's Discogs personal access
// token, verified against /oauth/identity on each request.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { method } = request;

    // Allowlist must include the Capacitor schemes used by the bundled
    // iOS/Android apps, otherwise the preflight fails and fetch throws
    // "Load failed" in WKWebView.
    const ALLOWED_ORIGINS = new Set([
      'https://app.runout.io',
      'https://localhost',     // Android Capacitor (androidScheme: 'https')
      'capacitor://localhost', // iOS Capacitor
    ]);
    const reqOrigin = request.headers.get('Origin') || '';
    const allowOrigin = ALLOWED_ORIGINS.has(reqOrigin)
      ? reqOrigin
      : (env.ALLOWED_ORIGIN || 'https://app.runout.io');

    const corsHeaders = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const json = (body, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    if (url.pathname === '/healthz') return json({ ok: true });

    // --- Auth: Discogs token in Authorization header ---
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Discogs-Token ')
      ? authHeader.slice('Discogs-Token '.length).trim()
      : '';
    if (!token) return json({ error: 'Missing Discogs token' }, 401);

    const user = await resolveUser(token, env);
    if (!user) return json({ error: 'Invalid Discogs token' }, 401);
    const userId = user.id;

    // --- Routes ---
    if (url.pathname === '/api/fields' && method === 'GET') {
      const rows = await env.DB
        .prepare('SELECT release_id, data, updated_at FROM user_fields WHERE user_id = ?')
        .bind(userId)
        .all();
      const out = {};
      for (const row of rows.results || []) {
        const fields = await decrypt(row.data, env.ENC_KEY);
        if (fields) out[row.release_id] = { ...fields, updated_at: row.updated_at };
      }
      return json(out);
    }

    const m = url.pathname.match(/^\/api\/fields\/(\d+)$/);
    if (m) {
      const releaseId = parseInt(m[1], 10);

      if (method === 'GET') {
        const row = await env.DB
          .prepare('SELECT data, updated_at FROM user_fields WHERE user_id = ? AND release_id = ?')
          .bind(userId, releaseId)
          .first();
        if (!row) return json(null, 404);
        const fields = await decrypt(row.data, env.ENC_KEY);
        if (!fields) return json({ error: 'Decryption failed' }, 500);
        return json({ ...fields, updated_at: row.updated_at });
      }

      if (method === 'PUT') {
        let body;
        try { body = await request.json(); }
        catch { return json({ error: 'Invalid JSON' }, 400); }
        // Strip any client-side metadata; keep only whitelisted fields
        const clean = sanitize(body);
        const encrypted = await encrypt(clean, env.ENC_KEY);
        const now = Date.now();
        await env.DB
          .prepare(`
            INSERT INTO user_fields (user_id, release_id, data, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, release_id)
            DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
          `)
          .bind(userId, releaseId, encrypted, now)
          .run();
        return json({ ok: true, updated_at: now });
      }

      if (method === 'DELETE') {
        await env.DB
          .prepare('DELETE FROM user_fields WHERE user_id = ? AND release_id = ?')
          .bind(userId, releaseId)
          .run();
        return json({ ok: true });
      }
    }

    return json({ error: 'Not found' }, 404);
  },
};

// ---------- Helpers ----------

// Whitelist + coerce types so we don't store arbitrary junk
function sanitize(body) {
  const out = {};
  if (body == null || typeof body !== 'object') return out;
  if (typeof body.price === 'number' && isFinite(body.price)) out.price = body.price;
  if (typeof body.currency === 'string') out.currency = body.currency.slice(0, 8);
  if (typeof body.purchase_date === 'string') out.purchase_date = body.purchase_date.slice(0, 32);
  if (typeof body.location === 'string') out.location = body.location.slice(0, 200);
  if (typeof body.notes === 'string') out.notes = body.notes.slice(0, 4000);
  if (Array.isArray(body.tags)) {
    out.tags = body.tags
      .filter(t => typeof t === 'string')
      .map(t => t.trim().slice(0, 64))
      .filter(Boolean)
      .slice(0, 32);
  }
  return out;
}

async function resolveUser(token, env) {
  try {
    const r = await fetch(
      `https://api.discogs.com/oauth/identity?token=${encodeURIComponent(token)}`,
      { headers: { 'User-Agent': env.DISCOGS_USER_AGENT || 'RunOutBackend/1.0' } }
    );
    if (!r.ok) return null;
    const d = await r.json();
    return d && d.id ? { id: d.id, username: d.username } : null;
  } catch {
    return null;
  }
}

async function getKey(hexKey) {
  if (!hexKey || hexKey.length !== 64) throw new Error('ENC_KEY must be 64 hex chars (256 bits)');
  const raw = new Uint8Array(hexKey.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encrypt(obj, hexKey) {
  const key = await getKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(obj));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const combined = new Uint8Array(iv.length + ct.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ct), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(b64, hexKey) {
  try {
    const key = await getKey(hexKey);
    const combined = new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const ct = combined.slice(12);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(pt));
  } catch {
    return null;
  }
}
