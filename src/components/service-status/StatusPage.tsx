import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SystemBanner from './SystemBanner';
import ServiceSection from './ServiceSection';
import { useStatusPageData } from '@/hooks/useStatusData';
import type { EndpointStats, TrendDataPoint, LatestStatusUpdate } from '@/services/statusApi';

interface StatusPageProps {
  period?: string;
  className?: string;
}

const StatusPage: React.FC<StatusPageProps> = ({ 
  period = '30d',
  className 
}) => {
  const { 
    systemStats, 
    dashboardStats, 
    latestStatus, 
    trendsQueries,
    isLoading,
    isError,
    error
  } = useStatusPageData(period);

  // Group endpoints by type
  const { uiEndpoints, apiEndpoints } = useMemo(() => {
    const endpoints = dashboardStats.data?.endpoints || [];
    
    const uiEndpoints = endpoints.filter(endpoint => 
      endpoint.type === 'ui' || 
      endpoint.tags?.includes('frontend') ||
      endpoint.tags?.includes('ui')
    );
    
    const apiEndpoints = endpoints.filter(endpoint => 
      endpoint.type === 'api' || 
      endpoint.tags?.includes('backend') ||
      endpoint.tags?.includes('api') ||
      (!endpoint.type && !uiEndpoints.includes(endpoint)) // fallback for untyped endpoints
    );

    return { uiEndpoints, apiEndpoints };
  }, [dashboardStats.data?.endpoints]);

  // Process trends data from parallel queries
  const { trendsData, trendsLoading, trendsErrors } = useMemo(() => {
    const trendsData: { [endpointId: string]: TrendDataPoint[] } = {};
    const trendsLoading: { [endpointId: string]: boolean } = {};
    const trendsErrors: { [endpointId: string]: Error | null } = {};

    trendsQueries.forEach((query, index) => {
      const endpoint = dashboardStats.data?.endpoints[index];
      if (endpoint) {
        trendsData[endpoint.id] = query.data?.trends || [];
        trendsLoading[endpoint.id] = query.isLoading;
        trendsErrors[endpoint.id] = query.error as Error | null;
      }
    });

    return { trendsData, trendsLoading, trendsErrors };
  }, [trendsQueries, dashboardStats.data?.endpoints]);

  // Process latest status updates
  const latestUpdates = useMemo(() => {
    const updates: { [endpointId: string]: LatestStatusUpdate } = {};
    
    latestStatus.data?.updates.forEach(update => {
      updates[update.endpointId] = update;
    });

    return updates;
  }, [latestStatus.data?.updates]);

  const handleRefresh = () => {
    systemStats.refetch();
    dashboardStats.refetch();
    latestStatus.refetch();
    trendsQueries.forEach(query => query.refetch());
  };

  const formatLastUpdated = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Service Status</h1>
          <p className="text-muted-foreground mt-1">
            Real-time monitoring of all system endpoints
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Last updated: {formatLastUpdated(dashboardStats.data?.lastUpdated)}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Banner - Only show during loading */}
      {systemStats.isLoading && (
        <SystemBanner 
          systemStats={systemStats.data}
          isLoading={systemStats.isLoading}
          error={systemStats.error as Error | null}
        />
      )}

      {/* Error State */}
      {isError && !systemStats.data && (
        <div className="text-center py-12">
          <div className="text-lg font-medium text-destructive mb-2">
            Failed to load status data
          </div>
          <div className="text-muted-foreground mb-4">
            {error?.message || 'An unexpected error occurred'}
          </div>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !dashboardStats.data && (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <div className="text-lg font-medium mb-2">Loading status data...</div>
          <div className="text-muted-foreground">
            Fetching real-time information from all endpoints
          </div>
        </div>
      )}

      {/* Service Sections */}
      {dashboardStats.data && (
        <div className="space-y-8">
          {/* UI Services Section */}
          {uiEndpoints.length > 0 && (
            <ServiceSection
              title="Services"
              type="ui"
              endpoints={uiEndpoints}
              trendsData={trendsData}
              trendsLoading={trendsLoading}
              trendsErrors={trendsErrors}
              latestUpdates={latestUpdates}
            />
          )}

          {/* API Services Section */}
          {apiEndpoints.length > 0 && (
            <ServiceSection
              title="API Services"
              type="api"
              endpoints={apiEndpoints}
              trendsData={trendsData}
              trendsLoading={trendsLoading}
              trendsErrors={trendsErrors}
              latestUpdates={latestUpdates}
            />
          )}

          {/* Empty State */}
          {uiEndpoints.length === 0 && apiEndpoints.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <div className="text-lg font-medium mb-2">No services configured</div>
              <div className="text-muted-foreground">
                No endpoints are currently being monitored
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  );
};

export default StatusPage; 