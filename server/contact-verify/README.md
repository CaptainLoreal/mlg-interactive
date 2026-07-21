# Contact-form verifier

Small dependency-free Node service that makes the contact-form CAPTCHA real.

## Flow

```
browser ──POST /api/contact──▶ Apache (mod_proxy, .htaccess)
                                  │
                                  ▼
                        127.0.0.1:3005  (this service, pm2: contact-verify)
                                  │  1. verify Turnstile token w/ SECRET key
                                  │  2. on success only:
                                  ▼
                        Power Automate webhook ──▶ Excel + email info@
```

Because verification happens here, a bot can't skip the widget: the Power
Automate URL is no longer in the browser — it lives only in `~/contact-verify/.env`.

## Deployment (server)

Running copy lives **outside** the docroot at `~/contact-verify/` so the 5-minute
`git reset --hard` sync of the site never touches it or the secret.

```sh
# first time
mkdir -p ~/contact-verify
# copy server.js + ecosystem.config.js here, then:
cp .env.example ~/contact-verify/.env && chmod 600 ~/contact-verify/.env   # fill in keys
cd ~/contact-verify && pm2 start ecosystem.config.js && pm2 save
```

Apache route (in the site repo's root `.htaccess`, so it's version-controlled):

```apache
RewriteRule ^api/contact(/.*)?$ http://127.0.0.1:3005/api/contact$1 [P,L]
```

## Endpoints

- `POST /api/contact` — `{ ...answers, turnstileToken }` → verifies, forwards, `{ ok: true }`
- `GET  /api/contact/health` — `{ ok, secretConfigured, webhookConfigured }`

## Config (`~/contact-verify/.env`)

| var | meaning |
|-----|---------|
| `PORT` | listen port (default 3005) |
| `TURNSTILE_SECRET` | Cloudflare secret key; **empty = reject everything** (fail-closed) |
| `POWER_AUTOMATE_URL` | webhook to forward verified submissions to |

After editing `.env`: `pm2 restart contact-verify`.

## Responses

`200 {ok:true}` forwarded · `403 failed-verification` · `400 missing-token`/`bad-json`
· `413 too-large` · `429 rate-limited` (>5/10min per IP) · `502` upstream unreachable.
