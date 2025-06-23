# Service Status Components

This directory contains React components for displaying service status information from a Watchtower monitoring API.

## Components

### StatusPage
Main page component that displays the overall system status and individual service monitoring.

**Props:**
- `period?: string` - Time period for stats (default: '30d')
- `className?: string` - Additional CSS classes
- `enableTrends?: boolean` - Enable trends fetching (default: false)

### SystemBanner
Displays overall system health status.

### ServiceSection  
Groups and displays services by type (UI vs API services).

### EndpointRow
Individual service row showing:
- Status badge (operational/degraded/outage)
- Service name and URL
- 30-day status history (MiniGrid)
- Uptime percentage
- Average response time
- Last checked timestamp

### MiniGrid
30-day status visualization using colored blocks. Each block represents one day:
- **Green (emerald-500)**: 100% uptime
- **Light Green (green-400)**: 99%+ uptime  
- **Yellow (yellow-400)**: 95-99% uptime
- **Amber (amber-400)**: 90-95% uptime
- **Orange (orange-500)**: 80-90% uptime
- **Red (red-500)**: <80% uptime
- **Gray (gray-200)**: Before monitoring started
- **Blue (blue-400)**: No data for that day

### StatusBadge
Circular status indicator with optional text.

### ServiceStatusBar
Compact status bar for external use.

## API Integration

The components integrate with the Watchtower monitoring API:

### Working Endpoints
- `GET /stats/system` - System overview
- `GET /stats/dashboard` - Service details and statistics  
- `GET /stats/latest` - Latest status updates

### Trends API Issue
**⚠️ Important:** The trends API endpoints are currently returning 500 errors:
- `GET /stats/endpoints/{id}/trends` - Returns `{"success":false,"error":"Failed to retrieve response time trends"}`

**Solution:** Trends fetching is **disabled by default** to prevent console errors and failed requests. The UI gracefully falls back to:
- Generating placeholder blocks based on service creation date
- Using current status and uptime for color coding
- Showing "No data" tooltips for days without monitoring data

### Enabling Trends (if API gets fixed)
To re-enable trends fetching:

```tsx
<StatusPage enableTrends={true} />
```

Or set the default in `useStatusPageData` hook.

## Data Flow

1. **Dashboard Load**: Fetches system stats and service list
2. **Status Updates**: Polls for latest status changes every 45 seconds
3. **Trends (Optional)**: Fetches 30-day history per endpoint (disabled)
4. **Error Handling**: Graceful fallbacks for all API failures

## Error Handling

- **System/Dashboard Errors**: Shows error message with retry button
- **Trends Errors**: Silent fallback to generated blocks
- **Network Issues**: Automatic retries with exponential backoff

## Usage Example

```tsx
import StatusPage from '@/components/service-status/StatusPage';

// Basic usage (trends disabled)
<StatusPage />

// With custom period
<StatusPage period="7d" />

// Enable trends (if API is working)
<StatusPage enableTrends={true} />
```

## Configuration

API settings are in `src/config/environment.ts`:

```typescript
export const WATCHTOWER_CONFIG = {
  BASE_URL: 'https://proddashbaordvistaar.mahapocra.gov.in/api',
  JWT_TOKEN: 'your-jwt-token'
};
```

## Dependencies

- **TanStack Query**: Data fetching and caching
- **Lucide React**: Icons
- **Tailwind CSS**: Styling
- **Radix UI**: Tooltip component 