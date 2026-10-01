# SooterMandi - Database Schema

## Overview

MySQL database with 8 main tables for thread market rate tracking, client management, and activity logging.

## Tables

### 1. `agencies`
Thread selling agencies/mills in the market.

```sql
CREATE TABLE agencies (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL UNIQUE,
  city VARCHAR(100) NOT NULL,
  godown_address TEXT,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Fields:**
- `id`: Unique agency identifier
- `name`: Agency/mill name (e.g., "Faisalabad Mills")
- `city`: Location (Faisalabad, Lahore, Karachi, etc.)
- `godown_address`: Warehouse address
- `contact_phone`: Agency contact number
- `contact_email`: Agency email
- `is_active`: Soft delete flag

---

### 2. `threads`
Thread product catalog.

```sql
CREATE TABLE threads (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  agency_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(100) NOT NULL,
  color VARCHAR(100) NOT NULL,
  packaging_type ENUM('Carton', 'Bag') DEFAULT 'Carton',
  weight_value DECIMAL(10, 2),
  weight_unit ENUM('lbs', 'kg', 'g') DEFAULT 'lbs',
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_thread (agency_id, type, color, packaging_type)
);
```

**Fields:**
- `agency_id`: Reference to agencies table
- `type`: Cotton, Polyester, Silk, etc.
- `color`: Thread color
- `packaging_type`: Carton or Bag
- `weight_value`: Quantity (1, 500, etc.)
- `weight_unit`: Unit (lbs, kg, g)

---

### 3. `rates`
Historical rate data with timestamps.

```sql
CREATE TABLE rates (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  thread_id BIGINT UNSIGNED NOT NULL,
  agency_id BIGINT UNSIGNED NOT NULL,
  price_pkr DECIMAL(10, 2) NOT NULL,
  previous_price DECIMAL(10, 2),
  updated_by BIGINT UNSIGNED,
  godown_address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_thread_created (thread_id, created_at),
  INDEX idx_agency_created (agency_id, created_at)
);
```

**Fields:**
- `thread_id`: Reference to threads table
- `price_pkr`: Current price in Pakistani Rupees
- `previous_price`: Price from last update (for trend calculation)
- `updated_by`: Broker/admin who updated the rate
- `godown_address`: Physical location of goods
- `notes`: Any notes about the rate update

---

### 4. `clients`
End users who view rates and reports.

```sql
CREATE TABLE clients (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL UNIQUE,
  city VARCHAR(100),
  organization_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone)
);
```

**Fields:**
- `name`: Client name
- `email`: Email for notifications
- `phone`: Phone for SMS notifications
- `city`: Client location
- `organization_name`: Optional (textile mill, trader, etc.)
- `last_login`: Track active users

---

### 5. `client_subscriptions`
Track which threads clients want notifications for.

```sql
CREATE TABLE client_subscriptions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  client_id BIGINT UNSIGNED NOT NULL,
  thread_id BIGINT UNSIGNED,
  agency_id BIGINT UNSIGNED,
  notification_type ENUM('All', 'Email', 'Push') DEFAULT 'All',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE,
  UNIQUE KEY unique_subscription (client_id, thread_id, agency_id)
);
```

**Fields:**
- `client_id`: Reference to clients
- `thread_id`: Specific thread (NULL = all threads)
- `agency_id`: Specific agency (NULL = all agencies)
- `notification_type`: Push, Email, or Both

---

### 6. `activity_logs`
Track all client actions for admin review.

```sql
CREATE TABLE activity_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  client_id BIGINT UNSIGNED NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  action_details TEXT,
  thread_id BIGINT UNSIGNED,
  agency_id BIGINT UNSIGNED,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE SET NULL,
  FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE SET NULL,
  INDEX idx_client_created (client_id, created_at),
  INDEX idx_action_type (action_type)
);
```

**Actions tracked:**
- `viewed_rate` - Viewed a thread's current rate
- `viewed_report` - Viewed historical reports
- `downloaded_report` - Downloaded CSV report
- `changed_subscription` - Modified notification preferences
- `viewed_trend` - Viewed price trends

---

### 7. `users`
Admin/broker accounts for managing rates.

```sql
CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'broker') DEFAULT 'broker',
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);
```

**Roles:**
- `admin`: Full access, manage agencies, users, view all logs
- `broker`: Can only update rates and view client logs

---

### 8. `notifications`
Queue for pending notifications.

```sql
CREATE TABLE notifications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  client_id BIGINT UNSIGNED NOT NULL,
  thread_id BIGINT UNSIGNED NOT NULL,
  rate_change_value DECIMAL(10, 2),
  rate_change_percent DECIMAL(5, 2),
  new_price DECIMAL(10, 2),
  old_price DECIMAL(10, 2),
  notification_type ENUM('email', 'push', 'both') DEFAULT 'both',
  status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_client_status (client_id, status)
);
```

---

## Relationships

```
agencies (1) ──────→ (M) threads
          ├──────→ (M) rates
          └──────→ (M) client_subscriptions

threads  (1) ──────→ (M) rates
       ├──────→ (M) client_subscriptions
       ├──────→ (M) activity_logs
       └──────→ (M) notifications

clients  (1) ──────→ (M) activity_logs
       ├──────→ (M) client_subscriptions
       └──────→ (M) notifications

users    (1) ──────→ (M) rates (updated_by)
```

## Indexes

Key indexes for performance:
- `rates.idx_thread_created` - Fast rate history lookups
- `rates.idx_agency_created` - Fast agency rate queries
- `activity_logs.idx_client_created` - Fast client activity queries
- `activity_logs.idx_action_type` - Filter logs by action type
- `notifications.idx_status` - Find pending notifications
- `clients.idx_email`, `idx_phone` - Quick user lookup

## Queries

### Get latest rates for a thread
```sql
SELECT t.*, a.name as agency, r.price_pkr, r.created_at
FROM threads t
JOIN agencies a ON t.agency_id = a.id
JOIN rates r ON t.id = r.thread_id
WHERE t.is_active = TRUE
ORDER BY r.created_at DESC
LIMIT 1 PER thread_id;
```

### Get rate changes in last hour
```sql
SELECT t.type, t.color, a.name, r.price_pkr, r.previous_price,
       (r.price_pkr - r.previous_price) as change,
       ((r.price_pkr - r.previous_price) / r.previous_price * 100) as change_percent
FROM rates r
JOIN threads t ON r.thread_id = t.id
JOIN agencies a ON r.agency_id = a.id
WHERE r.created_at >= NOW() - INTERVAL 1 HOUR
ORDER BY r.created_at DESC;
```

### Get client activity for auditing
```sql
SELECT c.name, c.email, al.action_type, al.action_details, al.created_at
FROM activity_logs al
JOIN clients c ON al.client_id = c.id
WHERE al.created_at >= DATE(NOW() - INTERVAL 7 DAY)
ORDER BY al.created_at DESC;
```
