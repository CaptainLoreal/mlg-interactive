'use strict';
/* ─────────────────────────────────────────────────────────────────────────
   MLG contact-form verifier.

   Sits between the public contact form and the Power Automate webhook. The
   browser POSTs the form answers plus a Cloudflare Turnstile token here (same
   origin, proxied by Apache from /api/contact). This service:

     1. Verifies the Turnstile token with Cloudflare using the SECRET key,
        which never leaves the server.
     2. Only on success forwards the answers to the Power Automate webhook.

   This is what makes the CAPTCHA real: a bot can no longer skip the widget by
   POSTing to the webhook directly, because the webhook URL is no longer in the
   browser at all — it lives only in this service's environment.

   Dependency-free on purpose (Node 22 has global fetch): nothing to npm-install,
   nothing to keep patched, starts instantly under pm2.
   ───────────────────────────────────────────────────────────────────────── */

const http = require('http');

const PORT              = parseInt(process.env.PORT || '3005', 10);
const TURNSTILE_SECRET  = process.env.TURNSTILE_SECRET  || '';
const POWER_AUTOMATE_URL = process.env.POWER_AUTOMATE_URL || '';
const MAX_BODY          = 32 * 1024;           // 32 KB is plenty for the form
const SITEVERIFY        = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

if (!TURNSTILE_SECRET)   console.warn('[contact-verify] WARNING: TURNSTILE_SECRET is not set — every submission will be rejected.');
if (!POWER_AUTOMATE_URL) console.warn('[contact-verify] WARNING: POWER_AUTOMATE_URL is not set — nothing will be forwarded.');

/* Tiny per-IP rate limit: 5 submissions / 10 min. In-memory is fine — a single
   process, and a restart simply forgives everyone. Not a security control on
   its own; just blunts a flood. */
const HITS = new Map();
const RL_MAX = 5, RL_WINDOW = 10 * 60 * 1000;
function rateLimited(ip) {
  const now = Date.now();
  const rec = HITS.get(ip) || { n: 0, t: now };
  if (now - rec.t > RL_WINDOW) { rec.n = 0; rec.t = now; }
  rec.n += 1;
  HITS.set(ip, rec);
  if (HITS.size > 5000) for (const [k, v] of HITS) if (now - v.t > RL_WINDOW) HITS.delete(k);
  return rec.n > RL_MAX;
}

function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket.remoteAddress || '';
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

async function verifyTurnstile(token, ip) {
  const form = new URLSearchParams();
  form.set('secret', TURNSTILE_SECRET);
  form.set('response', token);
  if (ip) form.set('remoteip', ip);
  const r = await fetch(SITEVERIFY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
    signal: AbortSignal.timeout(8000),
  });
  return r.json();   // { success, "error-codes": [...], hostname, ... }
}

async function forward(payload) {
  const r = await fetch(POWER_AUTOMATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  return r.status;
}

const server = http.createServer((req, res) => {
  const url = (req.url || '').split('?')[0];

  if (req.method === 'GET' && url === '/api/contact/health') {
    return json(res, 200, {
      ok: true,
      secretConfigured: Boolean(TURNSTILE_SECRET),
      webhookConfigured: Boolean(POWER_AUTOMATE_URL),
    });
  }

  if (req.method !== 'POST' || url !== '/api/contact') {
    return json(res, 404, { ok: false, error: 'not-found' });
  }

  const ip = clientIp(req);
  if (rateLimited(ip)) return json(res, 429, { ok: false, error: 'rate-limited' });

  let size = 0;
  const chunks = [];
  req.on('data', (c) => {
    size += c.length;
    if (size > MAX_BODY) { json(res, 413, { ok: false, error: 'too-large' }); req.destroy(); return; }
    chunks.push(c);
  });
  req.on('end', async () => {
    let payload;
    try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { return json(res, 400, { ok: false, error: 'bad-json' }); }

    const token = payload && (payload.turnstileToken || payload['cf-turnstile-response']);
    if (!token) return json(res, 400, { ok: false, error: 'missing-token' });

    let outcome;
    try { outcome = await verifyTurnstile(token, ip); }
    catch (e) { console.warn('[contact-verify] siteverify error:', e.message); return json(res, 502, { ok: false, error: 'verify-unreachable' }); }

    if (!outcome.success) {
      console.log('[contact-verify] rejected', ip, outcome['error-codes']);
      return json(res, 403, { ok: false, error: 'failed-verification' });
    }

    // Strip the token before forwarding — Power Automate never needs it.
    const clean = { ...payload };
    delete clean.turnstileToken;
    delete clean['cf-turnstile-response'];

    try {
      const status = await forward(clean);
      console.log('[contact-verify] forwarded', ip, '->', status);
      return json(res, 200, { ok: true });
    } catch (e) {
      console.warn('[contact-verify] forward error:', e.message);
      return json(res, 502, { ok: false, error: 'forward-failed' });
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[contact-verify] listening on 127.0.0.1:${PORT}`);
});
