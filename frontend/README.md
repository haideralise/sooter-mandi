# SooterMandi - Frontend

Next.js 14 + React 18 web application for thread market rate tracking and management.

## Features

- ✅ Real-time thread rate dashboard
- ✅ Rate history & trend reports
- ✅ Agency & thread filtering
- ✅ Subscription management
- ✅ Activity logging
- ✅ CSV export for reports
- ✅ Mobile-responsive design
- ✅ Real-time WebSocket updates via Pusher
- ✅ Role-based UI (Client, Broker, Admin)
- ✅ Dark mode support (ready)

## Tech Stack

- **Framework:** Next.js 14
- **UI Library:** React 18
- **Styling:** Tailwind CSS 3.3
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Charts:** Recharts
- **Real-time:** Pusher JS
- **Notifications:** React Hot Toast
- **Animations:** Framer Motion

## Installation

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```

3. **Configure environment variables:**
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   NEXT_PUBLIC_PUSHER_KEY=local
   NEXT_PUBLIC_PUSHER_CLUSTER=mt1
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

   App will be available at: `http://localhost:3000`

## Directory Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   └── dashboard/       # Main dashboard
│   ├── components/          # React components
│   │   ├── providers.tsx    # App providers
│   │   ├── header.tsx       # Header component
│   │   └── ...
│   ├── lib/                 # Utilities & API
│   │   └── api-client.ts    # API client
│   ├── store/               # Zustand stores
│   │   └── auth-store.ts    # Auth state
│   ├── types/               # TypeScript types
│   └── styles/              # Global styles
├── public/                  # Static assets
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind config
└── next.config.js           # Next.js config
```

## Key Pages

### `/login`
User login page. Authenticates client, broker, or admin accounts.

### `/register`
New user registration with email, phone, organization details.

### `/dashboard`
Main dashboard showing:
- Latest thread rates
- Agency & type filters
- Rate cards with trends
- Subscription status

### `/reports`
Historical rate reports and trends:
- Rate history by thread
- Agency summary reports
- CSV export functionality

### `/settings`
User preferences:
- Notification settings
- Subscription management
- Profile settings

## API Integration

The frontend communicates with the backend API at `NEXT_PUBLIC_API_URL`.

### Authentication Flow

1. User registers or logs in
2. Backend returns JWT token
3. Token stored in localStorage
4. Token sent with all requests via `Authorization: Bearer {token}`
5. Automatic logout on 401 Unauthorized

### API Client

Located at `src/lib/api-client.ts`:

```typescript
import { apiClient } from '@/lib/api-client';

// Get rates
const { data } = await apiClient.getRates();

// Update rate (broker only)
await apiClient.updateRate({ thread_id: 5, price_pkr: 850 });

// Get subscriptions
const { data } = await apiClient.getSubscriptions();
```

## State Management

Using Zustand for global state:

```typescript
import { useAuthStore } from '@/store/auth-store';

export function Component() {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  
  return <div>...</div>;
}
```

## Real-time Updates

WebSocket connection via Pusher for live rate updates:

```typescript
const pusher = new Pusher(NEXT_PUBLIC_PUSHER_KEY, {
  cluster: NEXT_PUBLIC_PUSHER_CLUSTER,
});

const channel = pusher.subscribe('rates');
channel.bind('rate-updated', (data) => {
  console.log('Rate updated:', data);
  // Update UI
});
```

## Components

### RateCard
Displays a single rate with:
- Thread name & agency
- Current price
- Price change & percentage
- Timestamp
- Subscription indicator

### RateChart
Displays historical rate trend:
- Line chart with prices over time
- High/Low/Average statistics
- Date range selection

### FilterBar
Filter options for:
- Thread type (Cotton, Polyester, Silk)
- Agency selection
- Date range

## Development

### Run development server
```bash
npm run dev
```

### Build for production
```bash
npm run build
npm start
```

### Type checking
```bash
npm run type-check
```

### Code formatting
```bash
npm run lint
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_PUSHER_KEY` | Pusher API key | `local` |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher cluster | `mt1` |

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual

```bash
npm run build
npm start
```

## Mobile Responsiveness

The app is designed mobile-first:
- Responsive grid layouts
- Touch-friendly buttons (min 48px)
- Optimized for phone, tablet, desktop
- Safe area insets for notch devices

## Performance

- Next.js Image optimization
- Code splitting & lazy loading
- API response caching (via Axios)
- State normalization with Zustand
- Minimal bundle size

## Error Handling

- API errors shown as toast notifications
- Form validation with error messages
- Network error retry logic
- Graceful fallbacks

## Testing

Ready for integration with testing libraries:
- Jest for unit tests
- React Testing Library for component tests
- Cypress/Playwright for E2E tests

## Troubleshooting

### "API connection failed"
- Check `NEXT_PUBLIC_API_URL` environment variable
- Ensure backend is running
- Check CORS configuration

### "Login not working"
- Verify token is being saved to localStorage
- Check browser console for errors
- Ensure backend auth endpoints are working

### "Real-time updates not showing"
- Verify Pusher credentials
- Check Pusher subscription in browser console
- Ensure WebSocket connection is established

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/name`
4. Submit pull request

## Support

For issues or questions, refer to:
- `/docs/API.md` - API documentation
- Next.js docs: https://nextjs.org/docs
- Tailwind docs: https://tailwindcss.com/docs
- React docs: https://react.dev

---

**Status:** 🔨 In Development  
**Latest Update:** 2026-10-01
