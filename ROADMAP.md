# SooterMandi Development Roadmap

**Project:** Live Thread Market Rate Tracking App  
**Status:** 🔨 In Active Development  
**Last Updated:** 2026-10-01

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

### ❌ MISSING

**Critical (MVP):**
- [ ] **AuthController** - register, login, logout, me endpoints
  - Location: `backend/app/Http/Controllers/Api/AuthController.php`
  - Tasks:
    - [x] Scaffold created
    - [ ] register() - Client registration with validation
    - [ ] login() - JWT token generation via Sanctum
    - [ ] logout() - Token revocation
    - [ ] me() - Current user info
    - [ ] Proper validation rules

- [ ] **ReportController** - Report generation
  - Location: `backend/app/Http/Controllers/Api/ReportController.php`
  - Tasks:
    - [ ] agencySummary() - Rates by agency
    - [ ] rateHistory() - Rate trends for export
    - [ ] Statistics calculation

- [ ] **Middleware:**
  - [ ] BrokerMiddleware - Check if user is broker/admin
  - [ ] AdminMiddleware - Check if user is admin only
  - [ ] Attach to routes

- [ ] **Validation:**
  - [ ] Form request classes for each endpoint
  - [ ] Custom validation rules
  - [ ] Proper error responses

- [ ] **Events & Jobs:**
  - [ ] RateUpdated event for broadcasting
  - [ ] NotifySubscribedClients job
  - [ ] Queue configuration

- [ ] **Exceptions:**
  - [ ] Custom exception handlers
  - [ ] Proper HTTP status codes
  - [ ] Error message standardization

**Important (Phase 2):**
- [ ] Seeders for demo data
  - [ ] AgencySeeder (3-5 agencies)
  - [ ] ThreadSeeder (10-15 threads)
  - [ ] UserSeeder (admin + broker accounts)
  - [ ] ClientSeeder (sample clients)
  - [ ] RateSeeder (initial rates)

- [ ] API testing (Pest PHP)
  - [ ] Auth tests (register, login, logout)
  - [ ] Rate endpoints tests
  - [ ] Authorization tests
  - [ ] Validation tests

- [ ] Documentation updates
  - [ ] API endpoint examples in docs/API.md
  - [ ] Setup guide in backend/README.md
  - [ ] Database seeding instructions

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

- [x] 8 migration files created
- [x] Table relationships defined
- [x] Indexes for performance
- [x] Foreign key constraints
- [x] Data types properly configured

### ⏳ IN PROGRESS

Nothing in this phase

### ❌ MISSING

- [ ] Data seeders (see Phase 2)
- [ ] Test data generation
- [ ] Database backup strategy

---

## 🔐 Phase 5: Authentication & Security

### ✅ COMPLETED

- [x] Database schema for users & clients
- [x] Password field design
- [x] JWT token structure planning

### ⏳ IN PROGRESS

Nothing in this phase

### ❌ MISSING

**Critical:**
- [ ] AuthController implementation
- [ ] Password hashing (bcrypt)
- [ ] Token generation & validation
- [ ] Refresh token logic
- [ ] Email verification (optional)
- [ ] Password reset flow

**Security:**
- [ ] Rate limiting middleware
- [ ] CORS configuration
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF token handling

---

## 📊 Phase 6: Real-time Features

### ✅ COMPLETED

- [x] WebSocket planning in documentation
- [x] Pusher/Soketi in package.json
- [x] Channel structure designed

### ⏳ IN PROGRESS

Nothing in this phase

### ❌ MISSING

**Backend:**
- [ ] Broadcasting setup in Laravel
- [ ] RateUpdated event
- [ ] WebSocket connection
- [ ] Channel authorization

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
│   ├── Http/Controllers/Api/ (5 controllers) ✅
│   │   ├── RateController.php ✅
│   │   ├── AgencyController.php ✅
│   │   ├── ThreadController.php ✅
│   │   ├── ClientSubscriptionController.php ✅
│   │   ├── ActivityLogController.php ✅
│   │   ├── AuthController.php ❌ MISSING
│   │   └── ReportController.php ❌ MISSING
│   ├── Http/Middleware/ ❌ MISSING
│   └── Traits/ApiResponse.php ✅
├── database/
│   ├── migrations/ (8 files) ✅
│   └── seeders/ ❌ MISSING
├── routes/api.php ✅
├── composer.json ✅
└── .env.example ✅
```

### Frontend Complete ✅
```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx ✅
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

### Clone & Setup
```bash
git clone https://github.com/haideralise/sooter-mandi.git
cd sooter-mandi

# Backend
cd backend
cp .env.example .env
composer install
php artisan key:generate
# Update DB credentials in .env
php artisan migrate
php artisan serve

# Frontend (new terminal)
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

### Verification Checklist
- [ ] Backend runs on http://localhost:8000
- [ ] Frontend runs on http://localhost:3000
- [ ] Database tables created
- [ ] Login page loads
- [ ] Dashboard page loads

### First Tasks (Priority)
1. **Implement AuthController** - Without this, nothing works
2. **Add Middleware** - Protect admin endpoints
3. **Create Seeders** - Test data for development
4. **Build Register Form** - Let users create accounts
5. **Connect Rate API** - Fetch & display actual data

---

## 📊 Progress Tracking

### Overall Completion: ~30%
```
├── Setup & Documentation: 100% ✅
├── Backend Structure: 70% 
│   ├── Models & Migrations: 100% ✅
│   ├── Controllers: 60% (Auth & Reports missing)
│   └── Authentication: 0% ❌
├── Frontend Structure: 60%
│   ├── Setup & Config: 100% ✅
│   ├── Pages: 50% (Register missing)
│   ├── Components: 0% ❌
│   └── Real-time: 0% ❌
└── Testing: 0% ❌
```

---

## 📝 Notes

- **MVP Focus:** Get login/registration working first, then rates displaying
- **Testing:** Use database transactions for test isolation
- **Deployment:** All `.env.example` files should not contain secrets
- **Git:** Create separate branches for each major feature (e.g., `feature/auth`, `feature/real-time`)
- **Documentation:** Update docs/API.md as endpoints are implemented

---

## 🎯 Success Criteria for MVP

- [ ] Users can register & login
- [ ] Dashboard displays thread rates from API
- [ ] Brokers can update rates
- [ ] Clients see updated rates instantly
- [ ] Subscriptions work for notifications
- [ ] Admin can view activity logs
- [ ] CSV export works for reports

---

## 📞 Need Help?

- **Backend Questions:** Check `backend/README.md`
- **Frontend Questions:** Check `frontend/README.md`
- **API Spec:** Check `docs/API.md`
- **Database:** Check `docs/DATABASE.md`
- **Branches:** Each branch has focused scope

---

**Last Updated:** 2026-10-01  
**Next Review:** After AuthController implementation
