# Status Dashboard Implementation

This directory contains the implementation of the Watchtower status dashboard as specified in the requirements.

## Architecture

The status dashboard follows the planned architecture:

```
<StatusPage>
  <SystemBanner />          // overall up/down status
  <ServiceSection title="UI Services">
      <EndpointRow />       // 2× for UI endpoints
  </ServiceSection>
  <ServiceSection title="API Services">
      <EndpointRow />       // 3× for API endpoints
  </ServiceSection>
</StatusPage>
```

## Components

### StatusPage
- Main orchestrator component
- Handles data fetching and state management
- Groups endpoints by type (UI vs API)
- Provides refresh functionality

### SystemBanner
- Displays overall system status (green/orange/red banner)
- Shows total uptime percentage and service counts
- Uses data from `/api/v1/stats/system`

### ServiceSection
- Groups endpoints by type (UI or API services)
- Shows section-level statistics
- Renders column headers and endpoint rows

### EndpointRow
- Individual endpoint status display
- Shows colored status dot, name, 30-day history, uptime %, response time
- Integrates with MiniGrid for trend visualization

### MiniGrid
- Renders 30 small colored blocks representing daily status
- Uses canvas-like grid with tooltips
- Color algorithm: green (≥99%), orange (≥90%), red (<90%)

## Data Flow

### Initial Load
1. `StatusPage` mounts and triggers data fetching
2. Parallel calls to:
   - `/api/v1/stats/system` (system banner)
   - `/api/v1/stats/dashboard?period=30d` (endpoint list)
3. Once endpoints are loaded, parallel calls to:
   - `/api/v1/stats/endpoints/:id/trends?resolution=day` (for each endpoint)

### Live Updates
- `/api/v1/stats/latest` polled every 45 seconds
- Updates only the colored status dots (lightweight)
- Dashboard data cached for 30 seconds, trends for 5 minutes

## Configuration

### Environment Variables
```bash
VITE_WATCHTOWER_BASE_URL=http://localhost:3000/api/v1
VITE_WATCHTOWER_JWT=your_jwt_token_here
```

### Development Seeds
The `endpointSeeds.json` file contains mock endpoint IDs for development:
- 2 UI endpoints
- 3 API endpoints

## Error Handling

- **Trends call fails**: Shows grey blocks with "history unavailable" tooltip
- **uptime_percentage = 0**: Blue dot with "Just added" label
- **Endpoint inactive**: 50% opacity with "Monitoring paused" annotation
- **Network errors**: Graceful fallbacks with retry logic

## Styling

- Uses Tailwind CSS with shadcn/ui components
- Grid of 30 boxes: `w-3 h-3` squares with `gap-0.5`
- Responsive layout with proper spacing
- Dark/light theme support

## Performance

- React Query handles caching and background revalidation
- Parallel API calls using `useQueries`
- Optimized re-renders with proper memoization
- Lightweight polling for status updates

## Usage

```tsx
import StatusPage from '@/components/service-status/StatusPage';

// Basic usage
<StatusPage />

// With custom period
<StatusPage period="7d" />
```

## API Endpoints

The implementation expects these Watchtower API endpoints:

1. `GET /api/v1/stats/system` - Overall system statistics
2. `GET /api/v1/stats/dashboard?period=30d` - Endpoint list with stats
3. `GET /api/v1/stats/endpoints/:id/trends?resolution=day` - Historical trends
4. `GET /api/v1/stats/latest` - Latest status updates

All endpoints support JWT authentication via `Authorization: Bearer <token>` header. 