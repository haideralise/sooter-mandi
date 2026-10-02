# SooterMandi — Deployment Guide

Everything required to get the Laravel API and the Next.js app running on a
server. Commands below were verified against this codebase; where something is
**not** implemented yet it is called out explicitly rather than glossed over.

---

## 1. Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| PHP | **8.2 – 8.4** | **Not 8.5.** See [PHP version](#php-version) below — this is not a preference, it corrupts API responses. |
| Composer | 2.x | |
| MySQL | 8.0+ | Verified against 8.0.40 and 9.6. |
| Node.js | **≥ 18.17** | Required by Next 14. No `engines` field is declared in `package.json`, so nothing enforces this for you. |
| Web server | nginx or Apache | Document root must be `backend/public`, never `backend/`. |

PHP extensions: the standard Laravel set — `bcmath`, `ctype`, `curl`, `dom`,
`fileinfo`, `json`, `mbstring`, `openssl`, `pcre`, `pdo`, `pdo_mysql`,
`tokenizer`, `xml`.

### PHP version

Laravel 11 is not deprecation-clean on PHP 8.5. The framework's own
`config/database.php` references `PDO::MYSQL_ATTR_SSL_CA`, deprecated in 8.5.
These notices fire **while config loads, before Laravel installs its error
handler**, so with `display_errors=On` they are written into the response body
*ahead of the JSON* and lock in a `200` status — a failed login returns `200`
with HTML prepended, and the frontend's `JSON.parse` throws.

Run on PHP 8.2–8.4. If you must use 8.5, you also need `display_errors=Off` in
`php.ini`, which you should set in production regardless.

---

## 2. Backend (Laravel API)

### 2.1 Install

```bash
cd backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
```

`--no-dev` matters: `laravel/sail`, `pint` and `collision` are dev-only.

### 2.2 Environment

Edit `.env`. The values that must change from the template:

```ini
APP_NAME="SooterMandi"
APP_ENV=production
APP_DEBUG=false                      # never true in production — leaks stack traces
APP_KEY=                             # set by key:generate, must not be empty
APP_URL=https://api.sootermandi.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sooter_mandi
DB_USERNAME=sooter
DB_PASSWORD=<strong password>
DB_SOCKET=                           # leave EMPTY unless MySQL has no TCP listener

LOG_CHANNEL=stack
LOG_LEVEL=warning                    # debug is noisy and can log request data

CACHE_STORE=file                     # or redis
QUEUE_CONNECTION=database            # NOT sync — see 2.6
SESSION_DRIVER=file

BROADCAST_CONNECTION=pusher          # log is a local-dev placeholder
PUSHER_APP_ID=<real>
PUSHER_APP_KEY=<real>
PUSHER_APP_SECRET=<real>
PUSHER_APP_CLUSTER=<real>

SANCTUM_STATEFUL_DOMAINS=sootermandi.com
```

> **`DB_SOCKET` must be empty** unless you know you need it. When set, PDO uses
> the unix socket and **ignores `DB_HOST` and `DB_PORT` entirely** — a silent
> way to connect to the wrong database server.

#### The `.env.<APP_ENV>` trap

Laravel loads **`.env.<APP_ENV>` instead of `.env`** when `APP_ENV` exists as a
real environment variable. With `APP_ENV=production`, a file named
`.env.production` sitting next to `.env` wins and `.env` is never read.

This has already bitten this project once: an `.env.local` file silently
overrode `.env` under `php artisan serve`, serving a stale `APP_KEY` and
pointing at the wrong database. Keep exactly one env file on the server.

`.gitignore` excludes `backend/.env*` except `.env.example`, so none of these
are ever committed.

#### Unused keys

`JWT_SECRET` and `JWT_ALGORITHM` in `.env.example` are **dead config**. Auth uses
Laravel Sanctum, which issues opaque bearer tokens, not JWTs. Nothing reads them.

### 2.3 Database

```bash
mysql -u root -p -e "CREATE DATABASE sooter_mandi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
php artisan migrate --force
```

`--force` is required; without it Laravel refuses to migrate in production.

12 migrations run: the 8 domain tables plus `personal_access_tokens` (Sanctum),
`password_reset_tokens`, the cache tables and the queue tables.

> ### Do NOT run `db:seed` in production
>
> The seeders create working accounts with the password `password`, including an
> **admin**: `admin@sootermandi.local`. Seeding a public server hands anyone
> full admin access. Seeders are for local development only.
>
> Create the first real admin manually instead:
>
> ```bash
> php artisan tinker
> >>> App\Models\User::create([
> ...   'name' => 'Admin', 'email' => 'you@example.com',
> ...   'password' => 'a-strong-password',   // the 'hashed' cast bcrypts this
> ...   'role' => 'admin', 'is_active' => true,
> ... ]);
> ```

### 2.4 Permissions

```bash
chown -R www-data:www-data backend/storage backend/bootstrap/cache
chmod -R 775 backend/storage backend/bootstrap/cache
```

Both directories must be writable by the web server user or every request 500s.

### 2.5 Optimise

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

All three are verified working on this codebase — no `env()` calls exist outside
`config/`, so `config:cache` is safe, and route caching succeeds despite the
closure-based `/api/health` route.

Re-run these on **every deploy**, after pulling new code. To undo:
`php artisan optimize:clear`.

### 2.6 Queue worker — required

`QUEUE_CONNECTION=sync` runs `NotifySubscribedClients` **inline on the HTTP
request**, so every rate update blocks while notification rows are written. Set
`QUEUE_CONNECTION=database` and run a worker under a process supervisor:

```ini
# /etc/supervisor/conf.d/sootermandi-worker.conf
[program:sootermandi-worker]
command=php /var/www/sootermandi/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
user=www-data
autostart=true
autorestart=true
numprocs=1
redirect_stderr=true
stdout_logfile=/var/log/sootermandi-worker.log
stopwaitsecs=3600
```

Restart the worker on every deploy (`php artisan queue:restart`) — workers hold
old code in memory.

### 2.7 Scheduler

No scheduled tasks are defined (`routes/console.php` contains only `inspire`),
so no cron entry is needed today. If you add any, the standard entry is:

```cron
* * * * * cd /var/www/sootermandi/backend && php artisan schedule:run >> /dev/null 2>&1
```

### 2.8 nginx

```nginx
server {
    listen 443 ssl http2;
    server_name api.sootermandi.com;

    root /var/www/sootermandi/backend/public;   # public/, not the project root
    index index.php;

    ssl_certificate     /etc/letsencrypt/live/api.sootermandi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.sootermandi.com/privkey.pem;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* { deny all; }   # blocks .env, .git
}
```

---

## 3. Frontend (Next.js)

### 3.1 Build

```bash
cd frontend
npm ci
NEXT_PUBLIC_API_URL=https://api.sootermandi.com/api/v1 npm run build
npm start                      # serves on :3000
```

### 3.2 `NEXT_PUBLIC_*` is baked in at build time

This is the single easiest thing to get wrong. `NEXT_PUBLIC_API_URL` is
**inlined into the JavaScript bundle during `npm run build`** — it is not read
at runtime. Verified: the current build has `localhost:8000` embedded in
`.next/static/chunks/`.

Consequences:
- Setting the variable only in your process manager does **nothing**.
- You must rebuild to change the API URL. You cannot reuse a build across
  environments.
- Never put a secret in a `NEXT_PUBLIC_*` variable — it ships to every browser.

### 3.3 Fully static output

All 12 routes compile as static (`○ (Static)`) — the app is entirely
client-rendered and fetches everything from the API in the browser. So you can
either run `npm start` behind a reverse proxy, or host the output on any static
host / CDN. There is no server-side data fetching to worry about.

### 3.4 Process manager

```bash
pm2 start npm --name sootermandi-web -- start
pm2 save && pm2 startup
```

### 3.5 nginx

```nginx
server {
    listen 443 ssl http2;
    server_name sootermandi.com;

    ssl_certificate     /etc/letsencrypt/live/sootermandi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sootermandi.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Security — must fix before going public

These are **known gaps in the current code**, not generic advice. Each one is
real today.

### 4.1 CORS is wide open

No `config/cors.php` exists, so the framework default applies:
`'allowed_origins' => ['*']`. Any website can call your API. Publish the config
and lock it down:

```bash
php artisan config:publish cors
```

```php
// config/cors.php
'allowed_origins' => ['https://sootermandi.com'],
```

### 4.2 No rate limiting

`docs/API.md` documents 100 req/min and 1000 req/hr. **No throttle middleware is
applied to any route.** Add it in `routes/api.php`:

```php
Route::middleware(['auth:sanctum', 'throttle:100,1'])->group(function () { ... });
```

Throttle the login route separately — it is unauthenticated and brute-forceable:

```php
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
```

### 4.3 API tokens never expire

`config/sanctum.php` has `'expiration' => null`. A leaked token is valid
forever. Either set an expiry (minutes) and publish the config, or accept this
deliberately:

```php
'expiration' => 60 * 24 * 7,   // 7 days
```

Expired tokens are pruned by `sanctum:prune-expired`, which needs a schedule entry.

### 4.4 Checklist

- [ ] `APP_DEBUG=false` and `APP_ENV=production`
- [ ] `APP_KEY` generated, and **never rotated** without re-issuing all tokens
- [ ] HTTPS enforced on both hosts
- [ ] MySQL user scoped to `sooter_mandi` only — not `root`
- [ ] `backend/.env` not web-reachable (the nginx dotfile rule above)
- [ ] Seeders **not** run
- [ ] CORS restricted (4.1)
- [ ] Rate limiting added (4.2)

---

## 5. Not implemented yet

Deploying today gives you a working rate-tracking app, but these advertised
features do not function:

| Feature | State |
|---------|-------|
| **Notification delivery** | `NotifySubscribedClients` writes rows to `notifications` with `status=pending`. **Nothing sends them.** No mail or FCM worker exists. Clients will never actually be emailed or pushed to. |
| **Real-time rate updates** | The backend broadcasts `RateUpdated` correctly on the public `rates` channel, but the frontend has **no Pusher listener**. Dashboards do not live-update; users must refresh. |
| **Password reset** | The `password_reset_tokens` table exists. No endpoints are implemented. |
| **Automated tests** | `backend/tests/` is empty and `pestphp/pest` is not a dependency. Nothing is verified by CI. |

---

## 6. Deploy sequence

```bash
cd /var/www/sootermandi
php backend/artisan down                      # maintenance mode

git pull origin main

cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan queue:restart                     # workers hold stale code

cd ../frontend
npm ci
NEXT_PUBLIC_API_URL=https://api.sootermandi.com/api/v1 npm run build
pm2 restart sootermandi-web

cd ..
php backend/artisan up
```

### Verify

```bash
curl https://api.sootermandi.com/up                 # 200, Laravel health check
curl https://api.sootermandi.com/api/health         # {"status":"ok"}
```

The `Content-Type` on `/api/health` must be `application/json`. If HTML or a PHP
notice appears before the JSON, you are on PHP 8.5 with `display_errors` on —
see [PHP version](#php-version).

Then confirm in a browser: log in, load the dashboard, and check that a broker
can publish a rate.

### Rollback

```bash
git reset --hard <previous-sha>
cd backend && composer install --no-dev --optimize-autoloader
php artisan optimize:clear && php artisan config:cache && php artisan route:cache && php artisan view:cache
php artisan migrate:rollback --step=1          # only if the deploy added migrations
cd ../frontend && npm ci && NEXT_PUBLIC_API_URL=... npm run build && pm2 restart sootermandi-web
```

Review what `migrate:rollback` will drop before running it — every `down()`
method in this project is a `dropIfExists`, so rolling back **destroys the
table and its data**.

---

## 7. Troubleshooting

| Symptom | Cause |
|---------|-------|
| HTML/deprecation text before the JSON; `401`s arriving as `200` | PHP 8.5 with `display_errors=On`. Use PHP 8.2–8.4. |
| `Command "migrate" is not defined` | `config/app.php` has a `providers` key. In Laravel 11 it **replaces** the defaults and drops `ConsoleSupportServiceProvider`. Remove it. |
| Config changes have no effect | A `.env.<APP_ENV>` file is overriding `.env` (§2.2), or stale `config:cache`. |
| `500` on every request | `storage/` or `bootstrap/cache/` not writable (§2.4). |
| `Unsupported cipher or incorrect key length` | `APP_KEY` empty or truncated — often from the wrong env file being loaded. |
| DB connects to the wrong server | `DB_SOCKET` is set, so `DB_HOST`/`DB_PORT` are ignored (§2.2). |
| Frontend calls `localhost:8000` in production | `NEXT_PUBLIC_API_URL` was not set **at build time** (§3.2). Rebuild. |
| CORS errors in the browser | `SANCTUM_STATEFUL_DOMAINS` / `config/cors.php` do not include the frontend origin. |
| Rate updates 500 | `BROADCAST_CONNECTION=pusher` with placeholder credentials. With `QUEUE_CONNECTION=sync` the broadcast runs inline and fails the request. |

---

**Last updated:** 2026-10-02
