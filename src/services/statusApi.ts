// Watchtower Status Dashboard API
import { WATCHTOWER_CONFIG } from '@/config/environment';

const WATCHTOWER_BASE_URL = WATCHTOWER_CONFIG.BASE_URL;
const JWT_TOKEN = WATCHTOWER_CONFIG.JWT_TOKEN;

// Types
export interface SystemStats {
  totalEndpoints: number;
  operationalCount: number;
  degradedCount: number;
  outageCount: number;
  overallUptimePercentage: number;
  status: 'operational' | 'degraded' | 'outage';
  message: string;
}

export interface EndpointStats {
  id: string;
  name: string;
  url: string;
  type: 'ui' | 'api';
  tags: string[];
  status: 'operational' | 'degraded' | 'outage';
  uptimePercentage: number;
  avgResponseTime: number;
  lastChecked: string;
  latestStatus: {
    status: 'operational' | 'degraded' | 'outage';
    responseTime: number;
    timestamp: string;
  };
  // Additional metadata for debugging and display
  totalChecks?: number;
  successfulChecks?: number;
  failedChecks?: number;
  createdAt?: string; // When the endpoint was created/monitoring started
}

export interface DashboardResponse {
  endpoints: EndpointStats[];
  systemStats: SystemStats;
  period: string;
  lastUpdated: string;
}

export interface TrendDataPoint {
  date: string;
  uptimePercentage: number;
  avgResponseTime: number;
  status: 'operational' | 'degraded' | 'outage';
}

export interface TrendsResponse {
  endpointId: string;
  trends: TrendDataPoint[];
  resolution: 'hour' | 'day' | 'week';
  startDate: string;
  endDate: string;
}

export interface LatestStatusUpdate {
  endpointId: string;
  status: 'operational' | 'degraded' | 'outage';
  responseTime: number;
  timestamp: string;
}

export interface LatestResponse {
  updates: LatestStatusUpdate[];
  timestamp: string;
}

// Utility function to create headers with JWT
const createHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  
  if (JWT_TOKEN) {
    headers['Authorization'] = `Bearer ${JWT_TOKEN}`;
  }
  
  return headers;
};

// API Functions
export const fetchSystemStats = async (): Promise<SystemStats> => {
  try {
    const response = await fetch(`${WATCHTOWER_BASE_URL}/stats/system`, {
      headers: createHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    console.log('System stats API response:', result);
    
    // Map the actual API response to our SystemStats interface
    const data = result.data;
    const statusDist = data.statusDistribution || {};
    const totalEndpoints = data.endpoints?.total || 0;
    const upCount = statusDist.up || 0;
    const downCount = statusDist.down || 0;
    const degradedCount = statusDist.degraded || 0;
    
    // Calculate overall uptime percentage based on operational endpoints
    const uptime = totalEndpoints > 0 ? (upCount / totalEndpoints) * 100 : 0;
    
    // Determine overall status
    let status: 'operational' | 'degraded' | 'outage' = 'operational';
    let message = "All systems operational";
    
    if (downCount > 0) {
      status = 'outage';
      message = `${downCount} service${downCount > 1 ? 's' : ''} experiencing outages`;
    } else if (degradedCount > 0) {
      status = 'degraded';
      message = `${degradedCount} service${degradedCount > 1 ? 's' : ''} degraded`;
    }
    
    return {
      totalEndpoints,
      operationalCount: upCount,
      degradedCount,
      outageCount: downCount,
      overallUptimePercentage: uptime,
      status,
      message
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    // Return fallback data
    return {
      totalEndpoints: 0,
      operationalCount: 0,
      degradedCount: 0,
      outageCount: 0,
      overallUptimePercentage: 0,
      status: 'outage',
      message: 'Unable to fetch system status'
    };
  }
};

export const fetchDashboardStats = async (period: string = '30d'): Promise<DashboardResponse> => {
  try {
    const response = await fetch(`${WATCHTOWER_BASE_URL}/stats/dashboard?period=${period}`, {
      headers: createHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    console.log('Dashboard API response:', result);
    
    // Map the actual API response to our DashboardResponse interface
    const data = result.data;
    const overview = data.overview || {};
    const endpointsData = data.endpoints || [];
    
    // Map endpoints to our EndpointStats interface
    const endpoints: EndpointStats[] = endpointsData.map((item: {
      endpoint?: Record<string, unknown>;
      stats?: Record<string, unknown>;
      latestStatus?: Record<string, unknown>;
    }) => {
      const endpoint = item.endpoint || {};
      const stats = item.stats || {};
      const latestStatus = item.latestStatus || {};
      
      // Map status from API format to our format
      const mapStatus = (status: string): 'operational' | 'degraded' | 'outage' => {
        switch (status?.toLowerCase()) {
          case 'up':
            return 'operational';
          case 'down':
            return 'outage';
          case 'degraded':
            return 'degraded';
          default:
            return 'outage';
        }
      };
      
      // Calculate meaningful uptime based on actual check data
      const totalChecks = Number(stats.total_checks || 0);
      const successfulChecks = Number(stats.successful_checks || 0);
      const failedChecks = Number(stats.failed_checks || 0);
      const uptimePercentage = Number(stats.uptime_percentage || 0);
      
      // New logic: Show green if no failures, regardless of data amount
      let displayUptime = uptimePercentage;
      if (totalChecks === 0) {
        displayUptime = 0; // No data at all
      } else if (failedChecks === 0) {
        displayUptime = 100; // No failures = 100% uptime (green)
      }
      // If there are failures, use the actual calculated uptime percentage
      
      const endpointData = {
        id: String(endpoint.id || ''),
        name: String(endpoint.name || 'Unknown Service'),
        url: String(endpoint.url || ''),
        type: endpoint.type === 'ui' ? 'ui' : 'api',
        tags: Array.isArray(endpoint.tags) ? endpoint.tags as string[] : [],
        status: mapStatus(String(latestStatus.status || '')),
        uptimePercentage: displayUptime,
        avgResponseTime: Number(stats.average_response_time || 0),
        lastChecked: String(latestStatus.checked_at || new Date().toISOString()),
        latestStatus: {
          status: mapStatus(String(latestStatus.status || '')),
          responseTime: Number(latestStatus.response_time || 0),
          timestamp: String(latestStatus.checked_at || new Date().toISOString())
        },
        // Add metadata for debugging
        totalChecks,
        successfulChecks,
        failedChecks: Number(stats.failed_checks || 0),
        createdAt: String(endpoint.created_at || '')
      };
      
      return endpointData;
    });
    
    // Calculate more realistic system stats based on actual endpoint data
    const totalEndpoints = overview.totalEndpoints || 0;
    const upEndpoints = overview.upEndpoints || 0;
    const downEndpoints = overview.downEndpoints || 0;
    const degradedEndpoints = overview.degradedEndpoints || 0;
    
    // Check if we have limited monitoring data
    const hasLimitedData = endpoints.some(ep => (ep.totalChecks || 0) < 10);
    const overallUptime = overview.overallUptime || 0;
    
    // Adjust message based on data availability
    let message = "All systems operational";
    let status: 'operational' | 'degraded' | 'outage' = 'operational';
    
    if (downEndpoints > 0) {
      status = 'outage';
      message = `${downEndpoints} service${downEndpoints > 1 ? 's' : ''} experiencing outages`;
    } else if (degradedEndpoints > 0) {
      status = 'degraded';
      message = `${degradedEndpoints} service${degradedEndpoints > 1 ? 's' : ''} degraded`;
    } else if (hasLimitedData) {
      message = "All systems operational (limited monitoring data)";
    }
    
    const systemStats: SystemStats = {
      totalEndpoints,
      operationalCount: upEndpoints,
      degradedCount: degradedEndpoints,
      outageCount: downEndpoints,
      overallUptimePercentage: overallUptime,
      status,
      message
    };
    
    const dashboardResponse = {
      endpoints,
      systemStats,
      period,
      lastUpdated: result.timestamp || new Date().toISOString()
    };
    
    console.log('Mapped dashboard response:', dashboardResponse);
    return dashboardResponse;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return fallback data
    return {
      endpoints: [],
      systemStats: {
        totalEndpoints: 0,
        operationalCount: 0,
        degradedCount: 0,
        outageCount: 0,
        overallUptimePercentage: 0,
        status: 'outage',
        message: 'Unable to fetch dashboard data'
      },
      period,
      lastUpdated: new Date().toISOString()
    };
  }
};

export const fetchEndpointTrends = async (
  endpointId: string,
  resolution: 'hour' | 'day' | 'week' = 'day',
  period: string = '30d'
): Promise<TrendsResponse> => {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const params = new URLSearchParams({
      resolution,
      start_date: startDate.toISOString(),
      end_date: now.toISOString()
    });
    
    const response = await fetch(`${WATCHTOWER_BASE_URL}/stats/endpoints/${endpointId}/trends?${params}`, {
      headers: createHeaders(),
    });
    if (!response.ok) {
      // Log the error but don't throw for 500 errors since trends are optional
      console.warn(`Trends API failed for endpoint ${endpointId}: ${response.status}`);
      return {
        endpointId,
        trends: [],
        resolution,
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      };
    }
    const result = await response.json();
    console.log(`Trends API response for ${endpointId}:`, result);
    
    // Map the actual API response structure
    if (result.success && result.data) {
      const data = result.data;
      const trends = Array.isArray(data.trends) ? data.trends : [];
      
      // Map trends data to our format
      const mappedTrends: TrendDataPoint[] = trends.map((trend: Record<string, unknown>) => {
        const uptimePercentage = Number(trend.uptimePercentage || 0);
        return {
          date: String(trend.timestamp || ''),
          uptimePercentage,
          avgResponseTime: Number(trend.avgResponseTime || 0),
          status: uptimePercentage >= 99 ? 'operational' : 
                  uptimePercentage >= 90 ? 'degraded' : 'outage'
        };
      });
      
      return {
        endpointId,
        trends: mappedTrends,
        resolution: data.resolution || resolution,
        startDate: data.periodStart || startDate.toISOString().split('T')[0],
        endDate: data.periodEnd || now.toISOString().split('T')[0]
      };
    }
    
    // If no data or empty trends, return empty response
    return {
      endpointId,
      trends: [],
      resolution,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0]
    };
  } catch (error) {
    // Silent error handling for trends - they're optional
    console.warn(`Error fetching trends for endpoint ${endpointId}:`, error);
    
    // Return empty trends on error - UI will show fallback display
    return {
      endpointId,
      trends: [],
      resolution,
      startDate: '',
      endDate: ''
    };
  }
};

export const fetchLatestStatus = async (): Promise<LatestResponse> => {
  try {
    const response = await fetch(`${WATCHTOWER_BASE_URL}/stats/latest`, {
      headers: createHeaders(),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    
    // Map the actual API response to our LatestResponse interface
    const data = result.data || {};
    const updates: LatestStatusUpdate[] = data.updates || [];
    
    // The updates are already in the correct format from our backend
    const mappedUpdates: LatestStatusUpdate[] = updates.map((update: {
      endpointId: string;
      status: string;
      responseTime: number;
      timestamp: string;
    }) => ({
      endpointId: update.endpointId,
      status: update.status as 'operational' | 'degraded' | 'outage',
      responseTime: update.responseTime,
      timestamp: update.timestamp
    }));
    
    return {
      updates: mappedUpdates,
      timestamp: data.timestamp || result.timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching latest status:', error);
    // Return fallback data
    return {
      updates: [],
      timestamp: new Date().toISOString()
    };
  }
};

// Utility functions
export const getStatusColor = (uptime: number): string => {
  if (uptime === 100) return 'bg-emerald-500'; // Perfect uptime - bright green
  if (uptime >= 95) return 'bg-yellow-400';    // Good uptime - bright yellow  
  if (uptime >= 80) return 'bg-orange-500';    // Some issues - orange
  return 'bg-red-500';                         // Critical downtime - red
};

export const getStatusFromUptime = (uptime: number): 'operational' | 'degraded' | 'outage' => {
  if (uptime === 100) return 'operational';    // Perfect uptime
  if (uptime >= 95) return 'degraded';         // Some issues but mostly working
  return 'outage';                             // Significant problems
};

// Mock endpoint IDs for development (as suggested in the plan)
export const MOCK_ENDPOINT_IDS = {
  ui: [
    "65497255-79a9-42a2-bf65-191f6e0a843c",
    "bb43a450-c1bc-4ca3-984c-ef52ab04a9c1"
  ],
  api: [
    "36f2f989-a7e4-4934-843c-aaaa1111bbbb",
    "cd2705f3-f67a-4af3-9c11-cccc2222dddd",
    "e67c5bea-1386-4ec9-b123-eeee3333ffff"
  ]
}; 