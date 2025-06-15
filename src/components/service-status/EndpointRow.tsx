import React from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink, Clock, TrendingUp, Loader2, Info } from 'lucide-react';
import StatusBadge from './StatusBadge';
import MiniGrid from './MiniGrid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { EndpointStats, TrendDataPoint, LatestStatusUpdate } from '@/services/statusApi';

interface EndpointRowProps {
  endpoint: EndpointStats;
  trends?: TrendDataPoint[];
  trendsLoading?: boolean;
  trendsError?: Error | null;
  latestUpdate?: LatestStatusUpdate;
  className?: string;
  inactive?: boolean;
}

const EndpointRow: React.FC<EndpointRowProps> = ({
  endpoint,
  trends = [],
  trendsLoading = false,
  trendsError = null,
  latestUpdate,
  className,
  inactive = false
}) => {
  // Use latest update if available, otherwise use endpoint's latest status
  const currentStatus = latestUpdate?.status || endpoint.latestStatus?.status || endpoint.status;
  const currentResponseTime = latestUpdate?.responseTime || endpoint.latestStatus?.responseTime || endpoint.avgResponseTime;

  const formatResponseTime = (responseTime: number) => {
    return `${(responseTime || 0).toFixed(0)}ms`;
  };

  const formatUptime = (uptime: number) => {
    return `${(uptime || 0).toFixed(2)}%`;
  };

  const formatLastChecked = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-4 py-3 px-4 border-b border-muted transition-opacity",
        inactive && "opacity-50",
        className
      )}
    >
      {/* Status Badge */}
      <div className="flex-shrink-0">
        <StatusBadge 
          status={currentStatus} 
          size="sm" 
          showText={false}
        />
      </div>

      {/* Endpoint Name and URL */}
      <div className="flex-shrink-0 min-w-0 w-48">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-sm truncate">
            {endpoint.name || 'Unknown Service'}
          </h3>
          {endpoint.url && (
            <a
              href={endpoint.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={`Open ${endpoint.name}`}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {endpoint.url || 'No URL provided'}
        </div>
        {inactive && (
          <div className="text-xs text-amber-600 dark:text-amber-400">
            Monitoring paused
          </div>
        )}
      </div>

      {/* 30-day Status Grid */}
      <div className="flex-1 min-w-0">
        <MiniGrid 
          trends={trends}
          isLoading={trendsLoading}
          error={trendsError}
          className="justify-center"
          currentStatus={currentStatus}
          currentUptime={endpoint.uptimePercentage}
          serviceCreatedAt={endpoint.createdAt} // When monitoring started
        />
      </div>

      {/* Uptime Percentage */}
      <div className="flex-shrink-0 text-right w-20">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <div className="text-sm font-medium flex items-center justify-end gap-1">
                  {formatUptime(endpoint.uptimePercentage || 0)}
                  {endpoint.failedChecks && endpoint.failedChecks > 0 && (
                    <Info className="h-3 w-3 text-orange-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {endpoint.totalChecks 
                    ? `${endpoint.totalChecks} check${endpoint.totalChecks !== 1 ? 's' : ''}`
                    : 'uptime'
                  }
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="text-sm">
                <div className="font-medium">Uptime: {formatUptime(endpoint.uptimePercentage || 0)}</div>
                <div>Total checks: {endpoint.totalChecks || 0}</div>
                <div>Successful: {endpoint.successfulChecks || 0}</div>
                <div>Failed: {endpoint.failedChecks || 0}</div>
                {endpoint.failedChecks === 0 && endpoint.totalChecks && endpoint.totalChecks > 0 ? (
                  <div className="text-xs text-green-400 mt-1">
                    ✓ No downtime recorded
                  </div>
                ) : endpoint.failedChecks && endpoint.failedChecks > 0 ? (
                  <div className="text-xs text-orange-400 mt-1">
                    ⚠ {endpoint.failedChecks} failed check{endpoint.failedChecks > 1 ? 's' : ''} recorded
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground mt-1">
                    Monitoring in progress...
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Average Response Time */}
      <div className="flex-shrink-0 text-right w-20">
        <div className="flex items-center justify-end gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm font-medium">
            {formatResponseTime(currentResponseTime || 0)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          avg response
        </div>
      </div>

      {/* Last Checked */}
      <div className="flex-shrink-0 text-right w-24">
        <div className="text-xs text-muted-foreground">
          {formatLastChecked(latestUpdate?.timestamp || endpoint.lastChecked || new Date().toISOString())}
        </div>
        <div className="text-xs text-muted-foreground">
          last checked
        </div>
      </div>

      {/* Loading indicator for trends */}
      {trendsLoading && (
        <div className="flex-shrink-0">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default EndpointRow; 