import { useQuery, useQueries } from '@tanstack/react-query';
import {
  fetchSystemStats,
  fetchDashboardStats,
  fetchEndpointTrends,
  fetchLatestStatus,
  type SystemStats,
  type DashboardResponse,
  type TrendsResponse,
  type LatestResponse,
  type EndpointStats
} from '@/services/statusApi';

// Query keys
export const statusQueryKeys = {
  all: ['status'] as const,
  system: () => [...statusQueryKeys.all, 'system'] as const,
  dashboard: (period: string) => [...statusQueryKeys.all, 'dashboard', period] as const,
  trends: (endpointId: string, resolution: string, startDate?: string, endDate?: string) => 
    [...statusQueryKeys.all, 'trends', endpointId, resolution, startDate, endDate] as const,
  latest: () => [...statusQueryKeys.all, 'latest'] as const,
};

// Hook for system stats (overall banner)
export const useSystemStats = () => {
  return useQuery({
    queryKey: statusQueryKeys.system(),
    queryFn: fetchSystemStats,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    retry: 3,
  });
};

// Hook for dashboard data (initial table rows)
export const useDashboardStats = (period: string = '30d') => {
  return useQuery({
    queryKey: statusQueryKeys.dashboard(period),
    queryFn: () => fetchDashboardStats(period),
    staleTime: 30 * 1000, // 30 seconds (heavily cached as mentioned in plan)
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    retry: 3,
  });
};

// Hook for endpoint trends (30-day color blocks)
export const useEndpointTrends = (
  endpointId: string,
  resolution: 'hour' | 'day' | 'week' = 'day',
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: statusQueryKeys.trends(endpointId, resolution, startDate, endDate),
    queryFn: () => fetchEndpointTrends(endpointId, resolution, startDate, endDate),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Hook for multiple endpoint trends (parallel fetching)
export const useMultipleEndpointTrends = (
  endpoints: EndpointStats[],
  resolution: 'hour' | 'day' | 'week' = 'day',
  startDate?: string,
  endDate?: string
) => {
  return useQueries({
    queries: endpoints.map((endpoint) => ({
      queryKey: statusQueryKeys.trends(endpoint.id, resolution, startDate, endDate),
      queryFn: () => fetchEndpointTrends(endpoint.id, resolution, startDate, endDate),
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 10 * 60 * 1000, // 10 minutes
      retry: 2,
    })),
  });
};

// Hook for latest status updates (live refresh of colored dots)
export const useLatestStatus = () => {
  return useQuery({
    queryKey: statusQueryKeys.latest(),
    queryFn: fetchLatestStatus,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 45 * 1000, // 45 seconds (lightweight polling as mentioned)
    retry: 3,
  });
};

// Combined hook for the entire status page
export const useStatusPageData = (period: string = '30d') => {
  const systemStats = useSystemStats();
  const dashboardStats = useDashboardStats(period);
  const latestStatus = useLatestStatus();

  // Get trends for all endpoints once dashboard data is loaded
  const trendsQueries = useMultipleEndpointTrends(
    dashboardStats.data?.endpoints || [],
    'day',
    undefined,
    undefined
  );

  return {
    systemStats,
    dashboardStats,
    latestStatus,
    trendsQueries,
    isLoading: systemStats.isLoading || dashboardStats.isLoading,
    isError: systemStats.isError || dashboardStats.isError,
    error: systemStats.error || dashboardStats.error,
  };
}; 