# SooterMandi Development Roadmap

**Project:** Live Thread Market Rate Tracking App  
**Status:** 🔨 In Active Development  
**Last Updated:** 2026-10-02

---

## 📋 Executive Summary

The SooterMandi application is a B2B platform for tracking thread rates in the Faisalabad market. Three branches have been created with foundational code. This roadmap tracks what's been completed and what remains.

**Branches:**
- ✅ `design/initial-setup` - Project documentation & database schema
- ✅ `backend/api` - Laravel 11 API scaffolding
- ✅ `frontend/web` - Next.js 14 web app scaffolding

---

## 🎯 Phase 1: Project Setup & Documentation

### ✅ COMPLETED

- [x] Project README with overview & architecture
- [x] Database schema design (8 tables)
- [x] API documentation with all endpoints
- [x] Tech stack confirmation (Laravel, Next.js, MySQL)
- [x] Directory structure setup
- [x] .gitignore configuration
- [x] Environment templates (.env.example files)

### ⏳ IN PROGRESS

Nothing in this phase

### ❌ MISSING

Nothing in this phase

---

## 🔧 Phase 2: Backend API (Laravel)

### ✅ COMPLETED

**Models & Database:**
- [x] Agency model with relationships
- [x] Thread model with price tracking
- [x] Rate model with history
- [x] Client model for end users
- [x] User model for admin/broker
- [x] ClientSubscription model
- [x] ActivityLog model
- [x] Notification model
- [x] All database migrations (8 tables)
- [x] Model relationships & scopes

**API Structure:**
- [x] RateController with index, show, history, update
- [x] AgencyController with CRUD operations
- [x] ThreadController with CRUD operations
- [x] ClientSubscriptionController for rate subscriptions
- [x] ActivityLogController for audit logs
- [x] API routes configuration (/api/v1/*)
- [x] ApiResponse trait for consistent JSON responses
- [x] Request/response structure design

**Configuration:**
- [x] Composer.json with dependencies
- [x] .env.example with all required variables
- [x] next.config.js setup
- [x] Database connection configuration
- [x] Laravel structure ready

### ⏳ IN PROGRESS

Nothing in this phase

### ✅ COMPLETED (2026-10-02 — backend bootstrap session)

**Bootstrap fixes (the backend did not run at all before these):**
- [x] Removed the hand-written `providers`/`aliases` arrays from `config/app.php`
      — they overrode `ServiceProvider::defaultProviders()` and silently dropped
      `ConsoleSupportServiceProvider`, so `migrate`, `make:*`, `key:generate`,
      `db:seed` and `serve` did not exist
- [x] Added `bootstrap/providers.php`
- [x] Created `.env` (Laravel reads `.env`, not `.env.local`) + real `APP_KEY`
- [x] Added `app/Http/Controllers/Controller.php` (every controller extends it)
- [x] Added `public/index.php` and the `storage/framework/*` directories
- [x] Renamed `BROADCAST_DRIVER` → `BROADCAST_CONNECTION`, `CACHE_DRIVER` →
      `CACHE_STORE` (Laravel 11 names; old ones were silently ignored)
- [x] Documented `DB_SOCKET` for MySQL installs without a TCP listener

**Migrations:**
- [x] `personal_access_tokens` (Sanctum — auth could not issue a token without it)
- [x] `password_reset_tokens` (referenced by `config/auth.php`)
- [x] `cache` / `cache_locks`, `jobs` / `job_batches` / `failed_jobs`
- [x] `migrate:fresh --seed` verified clean

- [x] **AuthController** - register, login, logout, me endpoints
  - Location: `backend/app/Http/Controllers/Api/AuthController.php`
  - [x] register() - Client registration with validation + confirmed password
  - [x] login() - Sanctum token; resolves `clients` then `users`, `as` to pin
  - [x] logout() - Revokes only the current token
  - [x] me() - Current account + role
  - [x] `'password' => 'hashed'` cast + `HasApiTokens` on `User` and `Client`

- [x] **ReportController** - Report generation
  - [x] agencySummary() - Current rate + trend per thread, grouped by agency
  - [x] rateHistory() - Date-range CSV, streamed and chunked

- [x] **Middleware:**
  - [x] BrokerMiddleware - broker + admin
  - [x] AdminMiddleware - admin only
  - [x] Registered as `broker` / `admin` aliases in `bootstrap/app.php`

- [x] **Events & Jobs:**
  - [x] RateUpdated event — public `rates` channel, `rate-updated`
  - [x] NotifySubscribedClients job — one row per subscriber, deduped
  - [x] `BROADCAST_CONNECTION=log` for local dev (no real Pusher app)

**Bug fixes in pre-existing controllers:**
- [x] Removed 8 `$this->authorize('isAdmin', ...)` calls — no gates or policies
      were ever defined, and `'isAdmin|isBroker'` is not valid ability syntax.
      Route middleware covers all of these.
- [x] Fixed `paginatedResponse()` receiving a `Collection` in 4 controllers —
      `$paginator->map()` returns a Collection, which has no `total()`/`items()`,
      so `/rates`, `/agencies`, `/threads`, `/subscriptions` all 500'd
- [x] Fixed `Undefined array key` on omitted `nullable` fields in
      `RateController::update` and `ClientSubscriptionController::store`

- [x] Seeders for demo data
  - [x] AgencySeeder (4 agencies)
  - [x] ThreadSeeder (5 threads × each agency = 20)
  - [x] UserSeeder (admin + broker accounts)
  - [x] ClientSeeder (2 clients + subscriptions)
  - [x] RateSeeder (6 hourly points per thread = 120)

### ❌ MISSING

**Critical (MVP):**
- [ ] **Validation:**
  - [ ] Form request classes for each endpoint
  - [ ] Custom validation rules

- [ ] **Exceptions:**
  - [ ] Custom exception handlers so errors match the `ApiResponse` shape
        (validation/auth failures currently use Laravel's default JSON shape,
        not `{success, error, details}`)

- [ ] **Queue configuration** — `QUEUE_CONNECTION=sync` runs the notify job
      inline on the request. Move to a real queue before production.

- [ ] **Notification delivery** — rows land in `notifications` with
      `status=pending`, but nothing sends them yet (no mail/FCM worker)

**Known issues not yet addressed:**
- [ ] `client_subscriptions` unique index on `(client_id, thread_id, agency_id)`
      does not constrain agency-wide rows — MySQL treats NULLs as distinct
- [ ] Custom `notifications` table collides with Laravel's `Notifiable` trait;
      `Client::notifications()` overrides the trait's `morphMany`
- [ ] `ClientSubscriptionController::index` calls `->subscriptions()` on
      `auth()->user()`, which breaks for staff tokens (no such relation)
- [ ] `APP_TIMEZONE` is UTC while the market is Asia/Karachi (UTC+5), so a
      broker's "today" and the app's "today" diverge after 7pm PKT — this
      affects the date-range CSV export
- [ ] `Rate::scopeLatest` / `ActivityLog::scopeLatest` / `Notification::scopeLatest`
      are dead code — `Builder::latest()` already exists and wins resolution

**Important (Phase 2):**
- [ ] API testing (Pest PHP) — `tests/` is still empty, and `composer.json` does
      not require `pestphp/pest` despite `allow-plugins` referencing it
  - [ ] Auth tests (register, login, logout)
  - [ ] Rate endpoints tests
  - [ ] Authorization tests
  - [ ] Validation tests

- [ ] Documentation updates
  - [ ] API endpoint examples in docs/API.md (register now needs `password` +
        `password_confirmation`; login response now includes `role`)
  - [x] Setup guide in backend/README.md
  - [x] Database seeding instructions

---

## 🎨 Phase 3: Frontend Web App (Next.js)

### ✅ COMPLETED

**Setup & Configuration:**
- [x] Next.js 14 initialization
- [x] TypeScript configuration
- [x] Tailwind CSS setup with custom theme
- [x] PostCSS & Autoprefixer
- [x] Path aliases configured (@/lib, @/components, etc.)
- [x] .env.example with API URL

**State Management:**
- [x] Zustand auth store
- [x] Token management (localStorage)
- [x] User state persistence

**API Integration:**
- [x] API client (Axios) with interceptors
- [x] Auth token injection in requests
- [x] Automatic 401 redirect on unauthorized
- [x] All endpoint methods defined

**Pages:**
- [x] Root layout with providers
- [x] Login page (basic structure)
- [x] Dashboard page (rates listing)
- [x] Component providers (Toast, Auth)

**Styling:**
- [x] Global CSS with Tailwind
- [x] Custom utilities (btn, badge, card)
- [x] Color tokens (primary, success, alert, warning)
- [x] Responsive design foundation
- [x] Dark mode tokens (ready)

**Types:**
- [x] TypeScript interfaces for all entities
- [x] API response types
- [x] Pagination types

### ⏳ IN PROGRESS

Nothing in this phase

### ❌ MISSING

**Critical (MVP):**
- [ ] **Pages:**
  - [ ] /register - Registration form
  - [ ] /dashboard - Complete with rate cards
  - [ ] /reports - Rate history & trends
  - [ ] /settings - Subscription preferences

- [ ] **Components:**
  - [ ] Header/Navigation component
  - [ ] RateCard - Display single rate
  - [ ] RateChart - Recharts integration for trends
  - [ ] FilterBar - Type/Agency filters
  - [ ] LoadingSpinner - Loading state
  - [ ] ErrorMessage - Error display
  - [ ] SubscriptionToggle - Subscribe/unsubscribe

- [ ] **Functionality:**
  - [ ] Login form validation & submission
  - [ ] Register form with validation
  - [ ] Rate fetching from API
  - [ ] Rate filtering by type/agency
  - [ ] Subscription management
  - [ ] CSV export button

- [ ] **Real-time (Pusher):**
  - [ ] Pusher integration setup
  - [ ] WebSocket connection
  - [ ] Listen for rate-updated events
  - [ ] Auto-update rate cards on change
  - [ ] Connection status indicator

**Important (Phase 3):**
- [ ] **Pages (Extended):**
  - [ ] /admin - Admin dashboard
  - [ ] /admin/agencies - Agency management
  - [ ] /admin/activity-logs - Audit logs
  - [ ] 404 page
  - [ ] 500 error page

- [ ] **Hooks:**
  - [ ] useRates() - Fetch & manage rates
  - [ ] useSubscriptions() - Manage subscriptions
  - [ ] usePusher() - Real-time connection
  - [ ] useAsync() - Data fetching
  - [ ] useDebounce() - Search debouncing

- [ ] **Utils:**
  - [ ] formatCurrency() - Price formatting
  - [ ] formatDate() - Date formatting
  - [ ] calculateTrend() - Trend calculation
  - [ ] downloadCSV() - Export functionality

- [ ] **Testing:**
  - [ ] Jest setup
  - [ ] Component tests
  - [ ] Page tests
  - [ ] API client tests

---

## 🗄️ Phase 4: Database & Migrations

### ✅ COMPLETED

- [x] 8 domain migration files created
- [x] 4 framework migration files added (`personal_access_tokens`,
      `password_reset_tokens`, cache tables, queue tables)
- [x] Table relationships defined
- [x] Indexes for performance
- [x] Foreign key constraints
- [x] Data types properly configured
- [x] `migrate` / `migrate:fresh` / `migrate:status` verified working against
      MySQL 9.6 (12/12 migrations, forward and rollback)
- [x] Data seeders — 4 agencies, 20 threads, 120 rates, 2 clients, 2 staff users
- [x] Test data generation via `php artisan migrate:fresh --seed`

### ⏳ IN PROGRESS

Nothing in this phase

### ❌ MISSING

- [ ] Model factories (`database/factories/` is empty — needed for Pest tests)
- [ ] Database backup strategy

---

## 🔐 Phase 5: Authentication & Security

### ✅ COMPLETED

- [x] Database schema for users & clients
- [x] Password field design
- [x] AuthController implementation (register / login / logout / me)
- [x] Password hashing (bcrypt via the `'password' => 'hashed'` cast)
- [x] Token generation & validation (Sanctum `personal_access_tokens`)
- [x] Role-based access control (`admin` / `broker` route middleware)
- [x] SQL injection prevention (Eloquent / query builder bindings throughout)

Note: Sanctum issues **opaque bearer tokens, not JWTs**. The `JWT_SECRET` and
`JWT_ALGORITHM` keys in `.env.example` are unused — ignore them.

### ⏳ IN PROGRESS

Nothing in this phase

### ❌ MISSING

**Critical:**
- [ ] Refresh token logic (Sanctum tokens currently never expire — set
      `sanctum.expiration` or accept long-lived tokens deliberately)
- [ ] Email verification (optional)
- [ ] Password reset flow (the `password_reset_tokens` table exists; no endpoints)

**Security:**
- [ ] Rate limiting middleware — `docs/API.md` promises 100/min and 1000/hr but
      no throttle is applied to any route
- [ ] CORS configuration — currently the framework default (`allowed_origins: *`);
      restrict to the frontend origin before production
- [ ] XSS prevention review on the frontend render path
- [ ] Remove unused `JWT_*` keys from `.env.example`

---

## 📊 Phase 6: Real-time Features

### ✅ COMPLETED

- [x] WebSocket planning in documentation
- [x] Pusher/Soketi in package.json
- [x] Channel structure designed
- [x] Broadcasting setup in Laravel (`BROADCAST_CONNECTION`, `log` for local dev)
- [x] RateUpdated event — public `rates` channel, `rate-updated` alias, payload
      verified in `storage/logs/laravel.log`
- [x] NotifySubscribedClients job writing pending `notifications` rows

### ⏳ IN PROGRESS

Nothing in this phase

### ❌ MISSING

**Backend:**
- [ ] Real Pusher/Soketi credentials (`PUSHER_APP_*` are placeholders, so
      `BROADCAST_CONNECTION` must stay `log` until a real app exists)
- [ ] Channel authorization — not needed while `rates` is public; required if
      per-client private channels are introduced (`routes/channels.php` absent)
- [ ] A worker that actually delivers the pending `notifications` rows

**Frontend:**
- [ ] Pusher client initialization
- [ ] Channel subscription
- [ ] Event listeners
- [ ] UI updates on events
- [ ] Connection status

---

## 📈 Phase 7: Admin & Reporting

### ✅ COMPLETED

- [x] ActivityLog model
- [x] ActivityLogController
- [ ] Report structure planned

### ⏳ IN PROGRESS

Nothing in this phase

### ❌ MISSING

**Backend:**
- [ ] ReportController (generate reports)
- [ ] CSV export functionality
- [ ] Date range filtering
- [ ] Statistics calculation

**Frontend:**
- [ ] Reports page
- [ ] Date picker component
- [ ] CSV download button
- [ ] Report table display

**Admin:**
- [ ] Admin dashboard
- [ ] Agency management UI
- [ ] User management
- [ ] Activity log viewer

---

## 🧪 Phase 8: Testing

### ✅ COMPLETED

Nothing yet

### ⏳ IN PROGRESS

Nothing yet

### ❌ MISSING

**Backend Tests (Pest PHP):**
- [ ] Authentication tests
- [ ] Rate endpoint tests
- [ ] Authorization tests
- [ ] Validation tests
- [ ] Edge case tests

**Frontend Tests:**
- [ ] Component tests
- [ ] Page tests
- [ ] Integration tests
- [ ] API client tests

**E2E Tests:**
- [ ] Login flow
- [ ] Rate viewing
- [ ] Subscription management
- [ ] Admin functions

---

## 📋 Implementation Checklist

### Backend - Phase 2 Priority Order

**1. Authentication (Required First)**
```
backend/app/Http/Controllers/Api/AuthController.php
- [ ] Create class extending Controller
- [ ] register() method - validate & create client
- [ ] login() method - generate token
- [ ] logout() method - revoke token
- [ ] me() method - return current user
```

**2. Middleware**
```
backend/app/Http/Middleware/BrokerMiddleware.php
backend/app/Http/Middleware/AdminMiddleware.php
- [ ] Check user role
- [ ] Return 403 if unauthorized
- [ ] Register in HTTP kernel
- [ ] Apply to routes
```

**3. Report Controller**
```
backend/app/Http/Controllers/Api/ReportController.php
- [ ] agencySummary() - group rates by agency
- [ ] rateHistory() - return CSV data
```

**4. Seeders**
```
database/seeders/
- [ ] AgencySeeder
- [ ] ThreadSeeder
- [ ] UserSeeder
- [ ] ClientSeeder
- [ ] RateSeeder
- [ ] Run: php artisan db:seed
```

**5. Validation & Error Handling**
```
backend/app/Http/Requests/
- [ ] Create form request classes
- [ ] Add validation rules
- [ ] Update controllers to use them
```

### Frontend - Phase 3 Priority Order

**1. Core Pages**
```
frontend/src/app/
- [ ] /register/page.tsx - Registration
- [ ] /dashboard - Enhanced with components
- [ ] /reports/page.tsx - Rate reports
```

**2. Essential Components**
```
frontend/src/components/
- [ ] RateCard.tsx - Display single rate
- [ ] RateChart.tsx - Chart with Recharts
- [ ] Header.tsx - Navigation
- [ ] FilterBar.tsx - Type/Agency filters
```

**3. Hooks**
```
frontend/src/hooks/
- [ ] useRates.ts - Fetch rates
- [ ] useSubscriptions.ts - Manage subs
- [ ] usePusher.ts - Real-time
```

**4. Real-time Integration**
```
frontend/src/lib/
- [ ] pusher-client.ts - Initialize Pusher
- [ ] Subscribe to channels
- [ ] Listen for events
```

**5. Export & Reports**
```
frontend/src/
- [ ] CSV export functionality
- [ ] Date range picker
- [ ] Statistics display
```

---

## 📂 File Structure Status

### Backend Complete ✅
```
backend/
├── app/
│   ├── Models/ (8 models) ✅
│   ├── Events/RateUpdated.php ✅
│   ├── Jobs/NotifySubscribedClients.php ✅
│   ├── Http/Controllers/Controller.php ✅  (base class — was missing)
│   ├── Http/Controllers/Api/ (7 controllers) ✅
│   │   ├── RateController.php ✅
│   │   ├── AgencyController.php ✅
│   │   ├── ThreadController.php ✅
│   │   ├── ClientSubscriptionController.php ✅
│   │   ├── ActivityLogController.php ✅
│   │   ├── AuthController.php ✅
│   │   └── ReportController.php ✅
│   ├── Http/Middleware/ ✅
│   │   ├── AdminMiddleware.php ✅
│   │   └── BrokerMiddleware.php ✅
│   ├── Providers/AppServiceProvider.php ✅
│   └── Traits/ApiResponse.php ✅
├── bootstrap/
│   ├── app.php ✅  (middleware aliases registered)
│   └── providers.php ✅  (was missing)
├── config/ ✅  (app.php must NOT declare `providers`/`aliases`)
├── database/
│   ├── migrations/ (12 files) ✅
│   ├── seeders/ (6 files) ✅
│   └── factories/ ❌ MISSING
├── public/index.php ✅  (was missing)
├── storage/framework/{cache,sessions,views}/ ✅  (were missing)
├── tests/ ❌ EMPTY
├── routes/
│   ├── api.php ✅
│   ├── console.php ✅
│   └── channels.php ❌ MISSING (only needed for private channels)
├── composer.json ✅
├── .env ✅  (gitignored; Laravel reads this, NOT .env.local)
└── .env.example ✅
```

### Frontend Complete ✅
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx ✅
│   │   ├── page.tsx ❌ MISSING  ("/" 404s — no root route)
│   │   ├── login/page.tsx ✅
│   │   ├── register/page.tsx ❌ MISSING
│   │   └── dashboard/page.tsx ✅
│   ├── components/
│   │   ├── providers.tsx ✅
│   │   ├── RateCard.tsx ❌ MISSING
│   │   ├── RateChart.tsx ❌ MISSING
│   │   ├── FilterBar.tsx ❌ MISSING
│   │   └── Header.tsx ❌ MISSING
│   ├── lib/
│   │   ├── api-client.ts ✅
│   │   └── pusher-client.ts ❌ MISSING
│   ├── hooks/ ❌ MISSING
│   ├── store/auth-store.ts ✅
│   ├── types/index.ts ✅
│   └── styles/globals.css ✅
├── package.json ✅
├── tsconfig.json ✅
├── tailwind.config.js ✅
└── .env.example ✅
```

---

## 🚀 Getting Started for Next Developer

### Prerequisites

Use **PHP 8.2 – 8.4**. Laravel 11 is not deprecation-clean on PHP 8.5: notices
fire while config loads, before Laravel installs its error handler, so with
`display_errors=On` they are written into the response body ahead of the JSON and
force a `200` status. See `backend/README.md` → Troubleshooting.

### Clone & Setup
```bash
git clone https://github.com/haideralise/sooter-mandi.git
cd sooter-mandi

# Backend
cd backend
cp .env.example .env
composer install
php artisan key:generate
# Update DB credentials in .env.
# On macOS, if MySQL has no TCP listener, also set DB_SOCKET=/tmp/mysql.sock
mysql -u root -p -e "CREATE DATABASE sooter_mandi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan migrate --seed
php artisan serve

# Frontend (new terminal)
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

Seeded logins (password `password` for all four):
`admin@sootermandi.local`, `broker@sootermandi.local`,
`loom.owner@example.com`, `weaver@example.com`.

### Verification Checklist
- [x] `php artisan migrate:fresh --seed` completes (12 migrations, 5 seeders)
- [x] `php artisan route:list` shows 27 routes
- [x] `curl localhost:8000/api/health` returns `{"status":"ok"}` with
      `Content-Type: application/json`
- [x] Login returns a token; a bad password returns `401`
- [x] `/rates`, `/agencies`, `/threads`, `/subscriptions` return paginated JSON
- [x] Broker can `POST /rates/update`; a client gets `403`
- [ ] Frontend runs on http://localhost:3000
- [ ] Login page submits against the real API
- [ ] Dashboard page renders live rates

### First Tasks (Priority)
1. **Pusher wiring** — the backend broadcasts correctly; the frontend has no
   listener and there are no real Pusher credentials, so rates do not live-update
2. **Notification delivery worker** — rows queue up in `notifications` but
   nothing sends them (no mail/FCM worker)
3. **Form request classes + exception handler** so errors match `ApiResponse`
4. **Rate limiting** — `docs/API.md` promises throttling that does not exist
5. **Pest tests** — `tests/` is empty and `pestphp/pest` is not even required

---

## 📊 Progress Tracking

### Overall Completion: ~55%
```
├── Setup & Documentation: 100% ✅
├── Backend: 85%
│   ├── Bootstrap & config: 100% ✅ (app would not boot before)
│   ├── Models & Migrations: 100% ✅
│   ├── Seeders: 100% ✅
│   ├── Controllers: 100% ✅ (7/7, all verified over HTTP)
│   ├── Authentication: 100% ✅ (Sanctum tokens, role middleware)
│   ├── Events & Jobs: 100% ✅ (broadcast + notification rows)
│   ├── Validation polish: 40% (inline rules, no form requests)
│   └── Rate limiting / CORS hardening: 0% ❌
├── Frontend: 85%
│   ├── Setup & Config: 100% ✅
│   ├── Pages: 100% ✅ (11 pages, role-aware)
│   ├── Shared components: 100% ✅ (Header, AuthGate, PageShell, …)
│   ├── Role-based access: 100% ✅ (nav filtered + direct-URL guard)
│   ├── Charts & CSV export: 100% ✅
│   └── Real-time: 0% ❌ (no Pusher listener)
└── Testing: 0% ❌
```

### Role-specific screens (built 2026-10-02)

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

Navigation is filtered by role in `components/Header.tsx`, and `components/AuthGate.tsx`
enforces it again on direct URL entry (a broker visiting `/admin/agencies` is
redirected to `/dashboard`). This mirrors the `admin` / `broker` route middleware
on the API — the UI guard is convenience, the API remains the real boundary.

---

## 📝 Notes

- **MVP Focus:** Get login/registration working first, then rates displaying
- **Testing:** Use database transactions for test isolation
- **Deployment:** All `.env.example` files should not contain secrets
- **Git:** Create separate branches for each major feature (e.g., `feature/auth`, `feature/real-time`)
- **Documentation:** Update docs/API.md as endpoints are implemented

---

## 🎯 Success Criteria for MVP

- [x] Users can register & login — API side verified (token issued, 401 on bad
      password, 422 on duplicate, logout revokes only the current token)
- [x] Dashboard displays thread rates from API — one card per thread, filterable
      by type and agency
- [x] Brokers can update rates — `POST /rates/update` returns 201; client gets 403
- [ ] Clients see updated rates instantly — event broadcasts correctly, but
      needs real Pusher credentials and a frontend listener
- [x] Subscriptions work for notifications — subscribe/unsubscribe work and the
      job writes `notifications` rows; **delivery is not implemented**
- [x] Admin can view activity logs — 200 for admin, 403 for client
- [x] CSV export works for reports — streamed `text/csv` with correct
      `Content-Disposition`; verified 120 data rows

Remaining for a demoable MVP: real Pusher credentials plus a frontend listener,
and a worker that actually delivers the queued notifications.

---

## 📞 Need Help?

- **Backend Questions:** Check `backend/README.md`
- **Frontend Questions:** Check `frontend/README.md`
- **API Spec:** Check `docs/API.md`
- **Database:** Check `docs/DATABASE.md`
- **Branches:** Each branch has focused scope

---

**Last Updated:** 2026-10-02  
**Next Review:** After the frontend consumes the live API
