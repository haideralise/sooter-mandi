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
- ✅ JWT authentication via Laravel Sanctum

## Tech Stack

- **Framework:** Laravel 11
- **Database:** MySQL 8.0
- **Authentication:** Laravel Sanctum (JWT)
- **Real-time:** Pusher/Soketi WebSockets
- **Testing:** Pest PHP
- **Code Quality:** Laravel Pint

## Installation

### Prerequisites

- PHP 8.2+
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
   mysql -u root -p
   CREATE DATABASE sooter_mandi;
   EXIT;
   ```

5. **Run migrations:**
   ```bash
   php artisan migrate
   ```

6. **Start development server:**
   ```bash
   php artisan serve
   ```

   API will be available at: `http://localhost:8000/api/v1`

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

## Directory Structure

```
backend/
├── app/
│   ├── Http/
│   │   └── Controllers/Api/     # API controllers
│   ├── Models/                  # Eloquent models
│   └── Traits/                  # Shared functionality
├── database/
│   └── migrations/              # Database schema
├── routes/
│   └── api.php                  # API routes
├── composer.json                # Dependencies
└── .env.example                 # Environment template
```

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

### Register
```bash
POST /api/v1/auth/register
{
  "name": "User Name",
  "email": "user@example.com",
  "phone": "+92-300-1234567",
  "city": "Faisalabad",
  "organization_name": "Company"
}
```

### Login
```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

Response includes `token` for API requests.

## Real-time Updates

### WebSocket Events

Connect to Pusher/Soketi channel:

```javascript
const channel = pusher.subscribe('rates');
channel.bind('rate-updated', (data) => {
  console.log('Rate updated:', data);
  // {
  //   thread_id: 5,
  //   thread_name: "Cotton - White",
  //   old_price: 850,
  //   new_price: 875,
  //   change: 25,
  //   change_percent: 2.94,
  //   timestamp: "2026-10-01T14:30:00Z"
  // }
});
```

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

BROADCAST_DRIVER=pusher
PUSHER_APP_ID=local
PUSHER_APP_KEY=local
PUSHER_APP_SECRET=local

JWT_SECRET=your_jwt_secret
```

## Deployment

### Production Checklist

1. Set `APP_ENV=production`
2. Set `APP_DEBUG=false`
3. Configure proper database credentials
4. Set up proper JWT secret
5. Configure Pusher for production
6. Run migrations: `php artisan migrate --force`
7. Cache config: `php artisan config:cache`
8. Cache routes: `php artisan route:cache`

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
- Verify `JWT_SECRET` is set in `.env`
- Check token expiration
- Ensure `Authorization` header is correct

## Support

For issues or questions, refer to:
- `/docs/API.md` - Complete API documentation
- `/docs/DATABASE.md` - Database schema details
- Laravel documentation: https://laravel.com/docs

---

**Status:** 🔨 In Development  
**Latest Update:** 2026-10-01
