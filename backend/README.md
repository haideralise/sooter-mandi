# SooterMandi - Backend API

Laravel 11 REST API for thread market rate tracking and management.

## Features

- ✅ Rate management (update, view history, trends)
- ✅ Agency management (add, edit, list)
- ✅ Thread catalog management
- ✅ Real-time notifications (WebSocket via Pusher/Soketi)
- ✅ Client subscriptions and preferences
- ✅ Activity logging and auditing
- ✅ CSV export for reports
- ✅ Role-based access control (Admin, Broker, Client)
- ✅ Token authentication via Laravel Sanctum (opaque bearer tokens, not JWT)

## Tech Stack

- **Framework:** Laravel 11
- **Database:** MySQL 8.0
- **Authentication:** Laravel Sanctum (personal access tokens)
- **Real-time:** Pusher/Soketi WebSockets
- **Testing:** Pest PHP
- **Code Quality:** Laravel Pint

## Installation

### Prerequisites

- PHP 8.2 – 8.4 (Laravel 11 is not deprecation-clean on PHP 8.5; see Troubleshooting)
- Composer
- MySQL 8.0+
- Node.js 18+ (for WebSocket server)

### Setup

1. **Install dependencies:**
   ```bash
   cd backend
   composer install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Generate app key:**
   ```bash
   php artisan key:generate
   ```

4. **Create database:**
   ```bash
   mysql -u root -p -e "CREATE DATABASE sooter_mandi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

   If your MySQL does not listen on TCP (common on macOS), set `DB_SOCKET` in `.env`
   to the socket path, e.g. `DB_SOCKET=/tmp/mysql.sock`.

5. **Run migrations and seed demo data:**
   ```bash
   php artisan migrate --seed
   ```

   Seeded accounts (all with password `password`):

   | Role   | Email                       |
   |--------|-----------------------------|
   | admin  | admin@sootermandi.local     |
   | broker | broker@sootermandi.local    |
   | client | loom.owner@example.com      |
   | client | weaver@example.com          |

6. **Start development server:**
   ```bash
   php artisan serve
   ```

   API will be available at: `http://localhost:8000/api/v1`

### Day-to-day (this machine)

From the repo root, `./dev.sh` wraps all of the above and pins PHP 8.3 so the
deprecation problem below cannot bite:

```bash
./dev.sh check       # verify PHP 8.3 + MySQL are up
./dev.sh backend     # terminal 1  -> http://localhost:8000
./dev.sh frontend    # terminal 2  -> http://localhost:3000
./dev.sh fresh       # reset + reseed the database
```

MAMP must be running first — it provides the MySQL on port 8889 that both
Laravel and MAMP's phpMyAdmin use.

## Database Schema

See `/docs/DATABASE.md` for complete schema details.

### Tables

- `users` - Admin/Broker accounts
- `clients` - End users (loom owners)
- `agencies` - Thread selling mills
- `threads` - Thread product catalog
- `rates` - Historical rate records
- `client_subscriptions` - Rate update subscriptions
- `activity_logs` - Client action tracking
- `notifications` - Notification queue
- `personal_access_tokens` - Sanctum API tokens
- `password_reset_tokens`, `cache`, `cache_locks`, `jobs`, `job_batches`, `failed_jobs` - framework support tables

## API Endpoints

See `/docs/API.md` for complete endpoint documentation.

### Authentication

All endpoints except `/auth/register` and `/auth/login` require Bearer token:

```
Authorization: Bearer {token}
```

### Key Endpoints

#### Rates
- `GET /rates` - List all rates
- `GET /rates/{id}/history` - Get rate history for a thread
- `POST /rates/update` - Update rate (broker only)

#### Agencies
- `GET /agencies` - List agencies
- `POST /agencies` - Create agency (admin only)
- `PUT /agencies/{id}` - Update agency (admin only)

#### Threads
- `GET /threads` - List threads
- `GET /threads/{id}` - Get thread details
- `POST /threads` - Create thread (admin only)

#### Subscriptions
- `GET /subscriptions` - Get user's subscriptions
- `POST /subscriptions` - Subscribe to rates
- `DELETE /subscriptions/{id}` - Unsubscribe

#### Activity Logs (Admin only)
- `GET /activity-logs` - View activity logs
- `GET /activity-logs/export` - Export logs as CSV

#### Reports (Admin only)
- `GET /reports/agency-summary` - Current rate + trend per thread, grouped by agency
- `GET /reports/rate-history` - Rate history over a date range, streamed as CSV

## Authorization

Role checks are enforced by route middleware, not by gates or policies:

| Alias    | Class                                   | Allows         |
|----------|-----------------------------------------|----------------|
| `admin`  | `App\Http\Middleware\AdminMiddleware`   | admin only     |
| `broker` | `App\Http\Middleware\BrokerMiddleware`  | broker + admin |

Both are registered in `bootstrap/app.php` and return a `403` JSON body when the
check fails. Do not add `$this->authorize(...)` calls to the controllers — no
gates or policies are defined for this app.

## Directory Structure

```
backend/
├── app/
│   ├── Events/
│   │   └── RateUpdated.php      # Broadcast on rate change
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Controller.php   # Base controller
│   │   │   └── Api/             # API controllers
│   │   └── Middleware/          # admin / broker role gates
│   ├── Jobs/
│   │   └── NotifySubscribedClients.php
│   ├── Models/                  # Eloquent models
│   ├── Providers/               # AppServiceProvider
│   └── Traits/                  # Shared functionality
├── bootstrap/
│   ├── app.php                  # Routing, middleware aliases
│   └── providers.php            # App service providers
├── config/                      # Only overrides; rest merged from framework
├── database/
│   ├── migrations/              # Database schema
│   └── seeders/                 # Demo data
├── public/index.php             # HTTP entry point
├── routes/
│   └── api.php                  # API routes
├── composer.json                # Dependencies
└── .env.example                 # Environment template
```

> `config/app.php` deliberately contains **no** `providers` or `aliases` key — see
> Troubleshooting for why adding them breaks Artisan.

## Models

### Agency
```php
$agency->threads();              // Get all threads
$agency->rates();               // Get all rates
$agency->getCurrentRates();     // Get latest rates
```

### Thread
```php
$thread->agency();              // Get agency
$thread->rates();               // Get all rates
$thread->getLatestRate();       // Get current rate
$thread->getCurrentPrice();     // Get current price
$thread->getPriceHistory(24);   // Get 24-hour history
```

### Rate
```php
$rate->thread;                  // Get thread
$rate->agency;                  // Get agency
$rate->getChangeAttribute();    // Get price change
$rate->getChangePercentAttribute(); // Get percentage change
```

### Client
```php
$client->subscriptions();       // Get subscriptions
$client->activityLogs();        // Get activity logs
$client->getSubscribedThreads(); // Get subscribed threads
$client->logActivity(...);      // Log user action
```

## Authentication

Clients (`clients` table) and staff (`users` table) are separate account types.
Both authenticate through the same endpoints and both receive Sanctum tokens.

### Register
Clients only. `password_confirmation` is required.

```bash
POST /api/v1/auth/register
{
  "name": "User Name",
  "email": "user@example.com",
  "phone": "03001234567",
  "password": "secret123",
  "password_confirmation": "secret123",
  "city": "Faisalabad",
  "organization_name": "Company"
}
```

### Login
Looks the email up in `clients` first, then `users`. Pass `"as": "client"` or
`"as": "staff"` to pin the lookup if the same email exists in both tables.

```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

Response includes `token` for API requests, plus `role` (`client`, `broker` or
`admin`) so the frontend knows which UI to render.

### Logout
`POST /api/v1/auth/logout` revokes only the token used for that request, so other
devices stay signed in.

## Real-time Updates

`POST /rates/update` broadcasts `App\Events\RateUpdated` on the public `rates`
channel as `rate-updated`, and dispatches `App\Jobs\NotifySubscribedClients`,
which writes one pending row to `notifications` per subscribed client.

A client subscribed to both a specific thread and that thread's whole agency is
notified **once**, preferring the thread-level subscription.

### Local development

Set `BROADCAST_CONNECTION=log` in `.env`. `PUSHER_APP_*=local` are placeholders,
not a real Pusher app — with `QUEUE_CONNECTION=sync` the broadcast runs inline, so
pointing at `pusher` without real credentials makes every rate update fail. The
`log` driver writes the payload to `storage/logs/laravel.log` instead, which is
enough to develop against. Switch to `pusher` once you have real credentials.

### WebSocket Events

```javascript
const channel = pusher.subscribe('rates');
channel.bind('rate-updated', (data) => {
  console.log('Rate updated:', data);
  // {
  //   rate_id: 121,
  //   thread_id: 1,
  //   thread_name: "Cotton - White",
  //   agency_id: 1,
  //   agency_name: "Faisalabad Cotton Mills",
  //   packaging: "Carton",
  //   old_price: "1000.00",
  //   new_price: "1500.00",
  //   change: 500,
  //   change_percent: 50,
  //   timestamp: "2026-10-01T21:43:25+00:00"
  // }
});
```

Note that `old_price` / `new_price` arrive as **strings** (Eloquent `decimal:2`
casts), while `change` / `change_percent` are numbers.

## Development

### Run Tests
```bash
php artisan test
```

### Code Formatting
```bash
php artisan pint
```

### Create Seeder
```bash
php artisan make:seeder AgencySeeder
```

### Generate API Documentation
```bash
php artisan route:list
```

## Environment Variables

Key variables in `.env`:

```
APP_URL=http://localhost:8000
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=sooter_mandi
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=local
PUSHER_APP_KEY=local
PUSHER_APP_SECRET=local
```

Note: Laravel 11 renamed some env keys. Use `BROADCAST_CONNECTION` (not
`BROADCAST_DRIVER`) and `CACHE_STORE` (not `CACHE_DRIVER`) — the old names are
silently ignored.

## Deployment

### Production Checklist

1. Set `APP_ENV=production`
2. Set `APP_DEBUG=false`
3. Configure proper database credentials
4. Configure Pusher for production
5. Run migrations: `php artisan migrate --force`
6. Cache config: `php artisan config:cache`
7. Cache routes: `php artisan route:cache`

### Docker

```dockerfile
FROM php:8.2-fpm
RUN docker-php-ext-install pdo pdo_mysql
COPY . /app
WORKDIR /app
RUN composer install --no-dev
```

## Troubleshooting

### Database connection error
- Check `.env` database credentials
- Ensure MySQL is running
- Verify database exists

### Migration errors
- Clear migration cache: `php artisan migrate:reset`
- Check migration files for syntax errors
- Ensure foreign key references exist

### Authentication failures
- Check the token has not been revoked (`personal_access_tokens` table)
- Ensure the `Authorization: Bearer {token}` header is present
- Ensure `Accept: application/json` is sent so errors come back as JSON

### `Command "migrate" is not defined`
`config/app.php` must NOT declare a `providers` array. Laravel 11 resolves core
providers from `ServiceProvider::defaultProviders()` merged with
`bootstrap/providers.php`; a hand-written `providers` list overrides that and
silently drops `ConsoleSupportServiceProvider`, which is what registers
`migrate`, `make:*`, `key:generate` and friends.

### `Deprecated: Constant PDO::MYSQL_ATTR_SSL_CA ...` in API responses
Laravel 11 is not deprecation-clean on PHP 8.5, and these notices are emitted
while config loads — before Laravel's error handler is installed. With
`display_errors=On` they get written into the response body ahead of the JSON
and lock in a 200 status code. Run the project on PHP 8.2–8.4:

```bash
/opt/homebrew/opt/php@8.3/bin/php artisan serve
```

## Support

For issues or questions, refer to:
- `/docs/API.md` - Complete API documentation
- `/docs/DATABASE.md` - Database schema details
- Laravel documentation: https://laravel.com/docs

---

**Status:** 🔨 In Development  
**Latest Update:** 2026-10-01
