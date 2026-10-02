# SooterMandi — Progress

**Living status document.** `ROADMAP.md` is the original plan; this file is what
is actually true today. If the two disagree, this one wins.

**Last updated:** 2026-10-02
**Branch:** `feature/mvp-auth-and-role-dashboards`

---

## Where the project stands

The app works end to end as a **rate board**: brokers publish rates, clients see
them, admins manage the catalog, and reports export. Everything in that sentence
has been exercised in a browser against a real database.

It does **not** work as a **notification product**. Nothing is ever delivered to
anyone — see [Blocking the core idea](#blocking-the-core-idea). That is the gap
between "demoable" and "useful".

| Area | State |
|------|-------|
| Backend API | Working — 27 routes, all verified over HTTP |
| Database | Working — 12 migrations, 6 seeders, `migrate:fresh --seed` clean |
| Auth & roles | Working — Sanctum tokens, admin/broker middleware enforced |
| Frontend | Working — 11 pages, role-aware nav, mobile menu |
| Real-time | **Backend only** — broadcasts correctly, no frontend listener |
| Notifications | **Not delivered** — rows queue up, nothing sends them |
| Tests | **None** |

---

## Done

### Backend — made it run at all

The API could not start before this work. `config/app.php` declared a
hand-written `providers` array, which in Laravel 11 *replaces*
`ServiceProvider::defaultProviders()` instead of extending it. The list omitted
`ConsoleSupportServiceProvider`, so `migrate`, `make:*`, `key:generate`,
`db:seed` and `serve` did not exist — artisan listed 5 commands total.

- [x] Removed `providers` / `aliases` from `config/app.php`; added `bootstrap/providers.php`
- [x] Added `app/Http/Controllers/Controller.php` — every controller extends it, so nothing resolved
- [x] Added `public/index.php` and the `storage/framework/*` directories
- [x] Created `.env` (Laravel reads `.env`, never `.env.local`) and a real `APP_KEY`
- [x] Registered the `admin` / `broker` middleware aliases `routes/api.php` already referenced
- [x] Kept `validateCsrfTokens(except: api/*)` — `statefulApi()` pulls session + CSRF into API routes for any request with a stateful `Origin`
- [x] Renamed `BROADCAST_DRIVER`→`BROADCAST_CONNECTION`, `CACHE_DRIVER`→`CACHE_STORE` (Laravel 11 names; the old keys were silently ignored)

### Backend — database

- [x] 4 framework migrations added: `personal_access_tokens` (Sanctum could not issue a token without it), `password_reset_tokens`, cache tables, queue tables
- [x] 6 seeders: 4 agencies, 20 threads, 120 rates, 2 clients, 2 staff users
- [x] `migrate:fresh --seed` verified clean, forward and rollback

### Backend — features

- [x] **AuthController** — register, login, logout, me. Resolves `clients` then `users`; `logout` revokes only the current token
- [x] **ReportController** — agency summary, and a streamed date-range CSV export
- [x] **AdminMiddleware / BrokerMiddleware** — 403 JSON
- [x] **RateUpdated event** — public `rates` channel, `rate-updated` alias
- [x] **NotifySubscribedClients job** — one row per subscriber, deduped so a client following both a thread and its agency is notified once
- [x] `HasApiTokens` + `'password' => 'hashed'` on `User` and `Client`

### Backend — bugs fixed in pre-existing code

| Bug | Impact |
|-----|--------|
| `paginatedResponse()` given a `Collection` in 4 controllers | `/rates`, `/agencies`, `/threads`, `/subscriptions` all returned 500 |
| 8 `$this->authorize()` calls with no gate or policy defined | Every admin route would have thrown; `'isAdmin\|isBroker'` isn't valid syntax either |
| `GET /rates` returned full history, not current rate per thread | Dashboard rendered one card per historical data point |
| `Undefined array key` on omitted `nullable` fields | `POST /rates/update` and `POST /subscriptions` fatal'd |
| `active_only=false` ignored | A query string carries `"false"` as a *string*, truthy in PHP — deactivated agencies/threads could never be listed again, so deactivation was irreversible |
| `is_active` not returned by list endpoints | Admin UI couldn't show status or offer reactivate |
| Activity-log CSV dropped the final day | A bare `Y-m-d` end date coerces to `00:00:00`; single-day exports returned nothing. Now streamed via `fputcsv` so quotes don't corrupt rows |

### Frontend — auth actually works now

Login succeeded but always bounced back to `/login`.

- [x] `auth-store` read `data.user`, but the API returns `client` for clients and `user` for staff — so `user` was `undefined` and `localStorage` held the literal string `"undefined"`
- [x] Added `isInitialized`. Redirects keyed off `isAuthenticated`, which is `false` on every cold load before `checkAuth` resolves, so `/dashboard` bounced every time
- [x] `api-client.register()` never sent a password field — signup always 422'd
- [x] The 401 interceptor fired on the login request itself, wiping the error before it rendered
- [x] `lib/api-error.ts` — the API returns `{error, details}` from the ApiResponse trait and `{message, errors}` from Laravel validation; reading only `message` turned every controller failure into a generic "Login failed"

### Frontend — pages

| Page | Route | Client | Broker | Admin |
|------|-------|:------:|:------:|:-----:|
| Live rates + filters | `/dashboard` | ✅ | ✅ | ✅ |
| Rate trends chart | `/reports` | ✅ | ✅ | ✅ |
| Subscriptions | `/settings` | ✅ | — | — |
| Update rate | `/broker/rates` | — | ✅ | ✅ |
| Agencies CRUD | `/admin/agencies` | — | — | ✅ |
| Thread catalog CRUD | `/admin/threads` | — | — | ✅ |
| Agency summary + CSV | `/admin/reports` | — | — | ✅ |
| Client activity + CSV | `/admin/activity-logs` | — | — | ✅ |
| Login / Register / Root redirect | `/login`, `/register`, `/` | ✅ | ✅ | ✅ |

- [x] `components/Header.tsx` filters nav by role; `components/AuthGate.tsx` re-enforces on direct URL entry (a broker visiting `/admin/agencies` lands on `/dashboard`). The API middleware remains the real boundary
- [x] Mobile hamburger menu — closes on navigation and Escape, locks background scroll, `aria-expanded` / `aria-controls`
- [x] Moved `viewport` out of the metadata export (Next 14 warned every render) and stopped disabling pinch-zoom
- [x] Dashboard filters load real agencies and thread types instead of hardcoded names that didn't exist in the data

### Tooling & docs

- [x] `dev.sh` — pins PHP 8.3 for artisan and fails fast when MySQL is down
- [x] `docs/DEPLOYMENT.md` — requirements, env, deploy sequence, rollback, security gaps
- [x] `.gitignore` widened to `backend/.env*` — a renamed env file holding the real DB password was about to be committed
- [x] `backend/README.md` setup and troubleshooting rewritten

---

## Blocking the core idea

The product is pitched on "clients get notified when rates change". That does
not happen, and four separate things are missing for it:

- [ ] **Nothing sends the notifications.** `NotifySubscribedClients` writes rows
      with `status='pending'`. No code reads them — `markAsSent()` and
      `markAsFailed()` are never called. Rows accumulate forever.
- [ ] **No device tokens.** No table, column or endpoint stores an FCM/APNs
      token, so a phone cannot be addressed at all. The `FIREBASE_*` keys in
      `.env.example` are aspirational; no Firebase code exists.
- [ ] **No mobile app and no PWA.** `frontend/public` does not exist — no
      manifest, no service worker. Web push needs both, plus a permission
      prompt, and on iOS only works for home-screen-installed PWAs (16.4+).
- [ ] **Email is a no-op.** `MAIL_MAILER=log` writes to a file. No Mailable or
      `->notify()` call exists anywhere.

So `notification_type: All | Email | Push` is a stored preference nothing honors.

### Product decisions worth making before building the above

- [ ] **Channel choice.** Push-to-web-app is the weakest channel for Faisalabad
      loom owners. SMS and WhatsApp need no install, no permission prompt and no
      smartphone. Building FCM first risks shipping a channel nobody receives.
- [ ] **Phone as identity.** `phone` is collected and uniquely indexed, but login
      is `email` + password. Phone + OTP is the natural login here, and OTP
      doubles as the verification needed before you can SMS anyone. Today anyone
      can register with someone else's number.
- [ ] **Notification volume.** Hourly updates × every subscribed thread = an
      alert every hour, per thread. No threshold ("only if it moves >2%"), no
      quiet hours, no digest. `client_subscriptions` has no column for any of
      this. This is how an app gets muted in week one.
- [ ] **Urdu.** The UI is English-only. Decide early — it affects every string.
- [ ] **Rate trust.** Brokers type rates in with no verification or dispute path.
      `updated_by` is captured but never surfaced; clients can't see who set a
      price or how stale it is.

---

## To do

### Before production

- [ ] **CORS is wide open** — no `config/cors.php`, so the framework default
      `allowed_origins: ['*']` applies. Any site can call the API
- [ ] **No rate limiting anywhere**, despite `docs/API.md` advertising 100/min
      and 1000/hr. The login route is unauthenticated and brute-forceable
- [ ] **Sanctum tokens never expire** (`expiration => null`)
- [ ] **Queue** — `QUEUE_CONNECTION=sync` runs the notify job inline on the request
- [ ] Seeders must never run in production — they create an admin with the
      password `password`

### Correctness

- [ ] Form request classes + an exception handler so errors match the
      `ApiResponse` shape (validation/auth failures use Laravel's default shape)
- [ ] `client_subscriptions` unique index on `(client_id, thread_id, agency_id)`
      does not constrain agency-wide rows — MySQL treats NULLs as distinct
- [ ] Custom `notifications` table collides with Laravel's `Notifiable` trait;
      `Client::notifications()` overrides the trait's `morphMany`
- [ ] `ClientSubscriptionController::index` calls `->subscriptions()` on
      `auth()->user()`, which breaks for staff tokens
- [ ] `APP_TIMEZONE` is UTC while the market is Asia/Karachi (UTC+5) — a broker's
      "today" and the app's "today" diverge after 7pm PKT, affecting CSV exports
- [ ] `Rate::scopeLatest` / `ActivityLog::scopeLatest` / `Notification::scopeLatest`
      are dead code — `Builder::latest()` wins resolution
- [ ] Remove unused `JWT_SECRET` / `JWT_ALGORITHM` from `.env.example` — Sanctum
      issues opaque tokens, not JWTs

### Features not started

- [ ] Password reset — table exists, no endpoints
- [ ] Frontend Pusher listener + real credentials (backend side is done)
- [ ] `routes/channels.php` — only needed if private per-client channels are added
- [ ] Custom `not-found.tsx` / `error.tsx` (Next's defaults are in use)
- [ ] Admin: user management (create brokers through the UI)

### Testing — nothing exists

- [ ] `backend/tests/` is empty and `pestphp/pest` is not even a dependency,
      despite `composer.json` referencing its plugin in `allow-plugins`
- [ ] `database/factories/` is empty — needed before feature tests are practical
- [ ] No frontend test setup
- [ ] No CI

### Documentation

- [ ] `docs/API.md` is out of date — register now requires `password` +
      `password_confirmation`, and the login response includes `role`
- [x] `docs/DEPLOYMENT.md`
- [x] `backend/README.md` setup + troubleshooting

---

## Verified, not assumed

Everything marked done was exercised, not just written:

- `migrate:fresh --seed` run repeatedly from a clean database
- All 27 routes resolve; auth, pagination, role enforcement (403/200/201), rate
  history, agency summary and both CSV exports checked over HTTP **with a
  browser-style `Origin` header** — curl without one misses the CSRF path entirely
- Full browser walkthrough per role: login, dashboard, filters, rate publish,
  subscribe/unsubscribe, agency create → deactivate → reactivate, CSV downloads
- Rate publish confirmed in MySQL to queue 2 subscriber rows and emit the broadcast
- Mobile nav verified at a real 390px viewport, including Escape and
  close-on-navigate, plus a horizontal-overflow sweep of all 7 inner pages
- `tsc --noEmit` clean; production `next build` succeeds (12 static routes)
- `config:cache` + `route:cache` verified safe on this codebase
