# SooterMandi - API Documentation

Base URL: `https://api.sootermandi.local` (Development: `http://localhost:8000/api`)

## Authentication

All endpoints except login/register require Bearer token in Authorization header:

```
Authorization: Bearer {token}
```

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per authenticated user

---

## Endpoints

### Authentication

#### POST `/auth/register`
Register a new client account.

**Request:**
```json
{
  "name": "Muhammad Ali",
  "email": "ali@example.com",
  "phone": "+92-300-1234567",
  "city": "Faisalabad",
  "organization_name": "Ali Textile Mills" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "client_id": 1,
    "name": "Muhammad Ali",
    "email": "ali@example.com",
    "token": "eyJhbGciOiJIUzI1NiI..."
  }
}
```

---

#### POST `/auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "ali@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiI...",
    "client": { "id": 1, "name": "Muhammad Ali" }
  }
}
```

---

### Rates API

#### GET `/rates`
Get all current rates with filters.

**Query Parameters:**
- `agency_id` - Filter by agency (optional)
- `thread_type` - Filter by type: Cotton, Polyester, Silk (optional)
- `color` - Filter by color (optional)
- `limit` - Results per page (default: 50, max: 200)
- `page` - Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "thread_id": 5,
      "thread_name": "Cotton Thread - White",
      "agency_id": 1,
      "agency_name": "Faisalabad Mills",
      "price_pkr": 850,
      "previous_price": 825,
      "change": 25,
      "change_percent": 3.03,
      "packaging": "Bag",
      "weight": "1kg",
      "updated_at": "2026-10-01T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "per_page": 50,
    "current_page": 1,
    "last_page": 3
  }
}
```

---

#### GET `/rates/:thread_id/history`
Get rate history for a specific thread.

**Query Parameters:**
- `hours` - Last N hours (default: 24)
- `days` - Last N days (optional, overrides hours)

**Response:**
```json
{
  "success": true,
  "data": {
    "thread_id": 5,
    "thread_name": "Cotton Thread - White",
    "agency": "Faisalabad Mills",
    "history": [
      {
        "price_pkr": 850,
        "timestamp": "2026-10-01T14:30:00Z"
      },
      {
        "price_pkr": 840,
        "timestamp": "2026-10-01T12:30:00Z"
      }
    ],
    "statistics": {
      "current": 850,
      "high": 875,
      "low": 820,
      "average": 843,
      "change": 30,
      "change_percent": 3.66
    }
  }
}
```

---

#### POST `/rates/update` (Broker Only)
Update rate for a thread.

**Request:**
```json
{
  "thread_id": 5,
  "price_pkr": 860,
  "godown_address": "Industrial Area, Faisalabad",
  "notes": "Slight increase due to market demand"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rate updated successfully",
  "data": {
    "id": 1,
    "thread_id": 5,
    "price_pkr": 860,
    "previous_price": 850,
    "change": 10,
    "change_percent": 1.18,
    "updated_at": "2026-10-01T14:45:00Z"
  }
}
```

Triggers notifications to subscribed clients automatically.

---

### Agencies API

#### GET `/agencies`
Get all agencies.

**Query Parameters:**
- `city` - Filter by city (optional)
- `active_only` - true/false (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Faisalabad Mills",
      "city": "Faisalabad",
      "contact_phone": "+92-300-1234567",
      "contact_email": "contact@faisalabadmills.com",
      "thread_count": 12,
      "created_at": "2026-09-15T00:00:00Z"
    }
  ]
}
```

---

#### POST `/agencies` (Admin Only)
Create new agency.

**Request:**
```json
{
  "name": "New Textile Mill",
  "city": "Lahore",
  "godown_address": "Gulberg, Lahore",
  "contact_phone": "+92-300-7654321",
  "contact_email": "info@newtextile.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 4,
    "name": "New Textile Mill",
    "city": "Lahore"
  }
}
```

---

### Threads API

#### GET `/threads`
Get all threads in catalog.

**Query Parameters:**
- `agency_id` - Filter by agency
- `type` - Filter by type
- `active_only` - true/false (default: true)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "agency_id": 1,
      "agency_name": "Faisalabad Mills",
      "type": "Cotton",
      "color": "White",
      "packaging_type": "Bag",
      "weight": "1kg",
      "current_price": 850,
      "last_updated": "2026-10-01T14:30:00Z"
    }
  ]
}
```

---

#### POST `/threads` (Admin Only)
Add new thread to catalog.

**Request:**
```json
{
  "agency_id": 1,
  "type": "Cotton",
  "color": "Blue",
  "packaging_type": "Carton",
  "weight_value": 500,
  "weight_unit": "g"
}
```

---

### Client Subscriptions

#### GET `/subscriptions`
Get current user's subscriptions.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "thread_id": 5,
      "thread_name": "Cotton Thread - White",
      "agency_id": 1,
      "agency_name": "Faisalabad Mills",
      "notification_type": "all",
      "created_at": "2026-09-20T00:00:00Z"
    }
  ]
}
```

---

#### POST `/subscriptions`
Subscribe to rate updates for a thread.

**Request:**
```json
{
  "thread_id": 5,
  "agency_id": 1,
  "notification_type": "all" // or "email" or "push"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscribed successfully"
}
```

---

#### DELETE `/subscriptions/:subscription_id`
Unsubscribe from a thread's rate updates.

**Response:**
```json
{
  "success": true,
  "message": "Unsubscribed successfully"
}
```

---

### Reports API

#### GET `/reports/agency-summary`
Get rate summary by agency.

**Query Parameters:**
- `days` - Last N days (default: 1)
- `agency_id` - Specific agency (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "agency_id": 1,
      "agency_name": "Faisalabad Mills",
      "threads": [
        {
          "thread_name": "Cotton - White",
          "current_price": 850,
          "change": 25,
          "change_percent": 3.03,
          "trend": "up"
        }
      ]
    }
  ]
}
```

---

#### GET `/reports/rate-history`
Export rate history as CSV data.

**Query Parameters:**
- `start_date` - Format: YYYY-MM-DD
- `end_date` - Format: YYYY-MM-DD
- `agency_id` - Optional
- `thread_id` - Optional

**Response:** CSV data with columns:
- Agency, Thread Type, Color, Date, Time, Price, Change, Change %

---

### Activity Logs API (Admin Only)

#### GET `/activity-logs`
Get client activity logs.

**Query Parameters:**
- `client_id` - Filter by client
- `action_type` - viewed_rate, viewed_report, etc.
- `days` - Last N days (default: 7)
- `limit` - Results per page (default: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "client_id": 5,
      "client_name": "Muhammad Ali",
      "action_type": "viewed_rate",
      "action_details": "Cotton Thread - White",
      "timestamp": "2026-10-01T14:30:00Z",
      "ip_address": "192.168.1.1"
    }
  ]
}
```

---

#### GET `/activity-logs/export`
Export activity logs as CSV.

**Query Parameters:**
- `start_date` - YYYY-MM-DD
- `end_date` - YYYY-MM-DD
- `client_id` - Optional

**Response:** CSV data with activity records

---

### Notifications API

#### GET `/notifications`
Get pending notifications queue (Admin only).

**Query Parameters:**
- `status` - pending, sent, failed (default: pending)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "client_id": 5,
      "client_name": "Muhammad Ali",
      "thread_name": "Cotton - White",
      "old_price": 850,
      "new_price": 875,
      "notification_type": "all",
      "status": "pending",
      "created_at": "2026-10-01T14:30:00Z"
    }
  ]
}
```

---

## WebSocket Events

Real-time rate updates via WebSocket (Pusher/Soketi).

**Connection:**
```javascript
const channel = pusher.subscribe('rates');
channel.bind('rate-updated', (data) => {
  console.log('Rate updated:', data);
});
```

**Event: `rate-updated`**
```json
{
  "thread_id": 5,
  "thread_name": "Cotton Thread - White",
  "agency_id": 1,
  "agency_name": "Faisalabad Mills",
  "old_price": 850,
  "new_price": 875,
  "change": 25,
  "change_percent": 2.94,
  "timestamp": "2026-10-01T14:30:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request parameters",
  "details": { "price_pkr": "Price must be a number" }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Token is missing or invalid"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You don't have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Not found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error
