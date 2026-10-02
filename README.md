# SooterMandi - Thread Market Rate Tracking App

Live hourly thread rate updates for Faisalabad thread market (Sooter Mandi). A B2B application connecting thread sellers, brokers, and loom owners with real-time rate information.

## Project Overview

**Problem:** Loom owners currently have to call brokers → brokers call thread agencies → slow rate updates.

**Solution:** Centralized rate dashboard with hourly updates via field brokers, real-time notifications, historical reports, and client activity tracking.

## Architecture

```
Frontend (Next.js/React)           Backend (Laravel)           Database (MySQL)
├─ Client Dashboard               ├─ Rate APIs                ├─ rates
├─ Admin Panel                    ├─ Agency APIs              ├─ agencies
├─ Reports                        ├─ Client APIs              ├─ threads
├─ Activity Logs                  ├─ Auth APIs                ├─ clients
└─ Mobile Responsive              └─ WebSockets (Real-time)   ├─ activity_logs
                                                              └─ notifications
```

## Tech Stack

- **Frontend:** Next.js 14, React 18, TailwindCSS
- **Backend:** Laravel 11, Laravel Echo (WebSockets)
- **Database:** MySQL 8.0
- **Real-time:** Pusher/Soketi (WebSockets for rate updates)
- **Notifications:** Firebase Cloud Messaging (FCM), Email

## Project Structure

```
sooter-mandi/
├── backend/              # Laravel API
│   ├── app/
│   ├── database/migrations/
│   ├── routes/
│   └── .env.example
├── frontend/             # Next.js Web App
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── public/
├── docs/                 # Documentation
│   ├── DATABASE.md
│   ├── API.md
│   └── SETUP.md
└── README.md
```

## Key Features

### For Clients (Loom Owners)
- ✅ Real-time thread rate dashboard
- ✅ Filter by agency, thread type, packaging
- ✅ Rate history & trend reports
- ✅ Selective notifications (choose which threads to follow)
- ✅ CSV report export
- ✅ Activity/usage tracking

### For Admin/Broker
- ✅ Update rates hourly
- ✅ Manage agencies and thread catalog
- ✅ View client activity logs
- ✅ Bulk rate updates
- ✅ Client analytics

### Data Tracked

**Threads:**
- Type (Cotton, Polyester, Silk, etc.)
- Color
- Current rate (₨)
- Packaging (Carton/Bag)
- Weight (lbs/kg)
- Godown address
- Agency

**Clients:**
- Name, Email, Phone
- City, Organization (optional)
- Subscription preferences
- Action logs (what they viewed, when)

## Development Workflow

1. **Design/Initial Setup** (`design/initial-setup` branch)
   - Project structure, database schema, documentation

2. **Backend** (`backend/api` branch)
   - Laravel API with all endpoints
   - Database migrations
   - WebSocket setup

3. **Frontend** (`frontend/web` branch)
   - Next.js setup with React components
   - Pages for client dashboard, admin panel, reports
   - Real-time rate updates

Each branch will be reviewed before moving to the next phase.

## Getting Started

See individual README files in `/backend` and `/frontend` directories for setup instructions.

## API Endpoints

See `/docs/API.md` for complete API documentation.

## Database Schema

See `/docs/DATABASE.md` for database schema and relationships.

## Project Status

See [`PROGRESS.md`](PROGRESS.md) — what is built, what is broken, and what is
next. `ROADMAP.md` holds the original phase plan.

Short version: the rate board works end to end. **Notifications do not** — rows
queue up in the database and nothing sends them. See Phase 9 in the roadmap.

## Deployment

See `/docs/DEPLOYMENT.md` for server requirements, environment setup, the deploy
sequence, and the security gaps that must be closed before going public.

---

**Status:** 🔨 In Development  
**Branches:** `design/initial-setup` → `backend/api` → `frontend/web`
