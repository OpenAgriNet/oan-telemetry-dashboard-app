import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ExternalLink, Clock, TrendingUp, Loader2, Info, ChevronDown, ChevronUp } from 'lucide-react';
import StatusBadge from './StatusBadge';
import MiniGrid from './MiniGrid';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { EndpointStats, TrendDataPoint, LatestStatusUpdate } from '@/services/statusApi';

interface EndpointRowProps {
  endpoint: EndpointStats;
  trends?: TrendDataPoint[];
  trendsLoading?: boolean;
  trendsError?: Error | null;
  latestUpdate?: LatestStatusUpdate; // kept for potential future use but not used for response time now
  className?: string;
  inactive?: boolean;
  responseMetricStrategy?: 'auto' | 'latest' | 'average';
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
  const [expanded, setExpanded] = useState(false);

  // Use latest update if available, otherwise use endpoint's latest status
  const currentStatus = latestUpdate?.status || endpoint.latestStatus?.status || endpoint.status;
  // Always use the averaged response time supplied by API mapping.
  const chosenResponseTime: number = endpoint.avgResponseTime || 0;

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
    <>
      {/* ===== MOBILE VIEW ===== */}
      <div 
        className={cn(
          "md:hidden rounded-lg border border-border bg-card shadow-sm overflow-hidden transition-opacity",
          inactive && "opacity-50",
          className
        )}
      >
        {/* Header row */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0">
              <StatusBadge 
                status={currentStatus} 
                size="sm" 
                showText={false}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate text-sm sm:text-base">
                  {endpoint.name || 'Unknown Service'}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {endpoint.url || 'No URL provided'}
              </p>
              {inactive && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  Monitoring paused
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Desktop metrics */}
            <div className="hidden sm:block text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Response</p>
              <p className="text-sm font-mono font-medium">
                {formatResponseTime(chosenResponseTime)}
              </p>
            </div>
            
            <div className="hidden sm:block text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Uptime</p>
              <div className="flex items-center justify-end gap-1">
                <span className="text-sm font-mono font-medium">{formatUptime(endpoint.uptimePercentage || 0)}</span>
                {endpoint.failedChecks && endpoint.failedChecks > 0 ? (
                  <Info className="h-3 w-3 text-orange-500" />
                ) : null}
              </div>
            </div>

            <div className="hidden lg:block text-right w-24">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Last Check</p>
              <p className="text-sm font-medium truncate">
                 {formatLastChecked(latestUpdate?.timestamp || endpoint.lastChecked || new Date().toISOString())}
              </p>
            </div>

            <div className="text-muted-foreground ml-1 sm:ml-2 flex items-center">
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </div>
        </button>

        {/* MiniGrid / Uptime Bar */}
        <div className="px-4 pb-4 sm:px-5">
          <div className="relative">
            <MiniGrid 
              trends={trends}
              isLoading={trendsLoading}
              error={trendsError}
              currentStatus={currentStatus}
              currentUptime={endpoint.uptimePercentage}
              serviceCreatedAt={endpoint.createdAt}
              endpointType={endpoint.type}
              className="w-full"
            />
            {trendsLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-medium text-muted-foreground">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Expandable details */}
        {expanded && (
          <div className="border-t border-border px-4 py-4 sm:px-5 space-y-4 bg-muted/10">
            <div className="grid grid-cols-2 gap-4 sm:hidden">
              <div>
                <p className="text-xs text-muted-foreground">Response Time</p>
                <p className="text-sm font-mono font-medium mt-0.5">{formatResponseTime(chosenResponseTime)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-sm font-mono font-medium">{formatUptime(endpoint.uptimePercentage || 0)}</span>
                  {endpoint.failedChecks && endpoint.failedChecks > 0 && (
                    <Info className="h-3 w-3 text-orange-500" />
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Last Checked</p>
                <p className="text-sm font-medium mt-0.5">{formatLastChecked(latestUpdate?.timestamp || endpoint.lastChecked || new Date().toISOString())}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 sm:pt-0 border-t sm:border-0 border-border">
              {endpoint.url && (
                <a
                  href={endpoint.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit URL
                </a>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-flex items-center gap-1.5 text-sm cursor-help text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                      <span className="font-medium">Check Stats</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="p-3 bg-popover border shadow-md">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Total checks:</span>
                        <span className="font-mono">{endpoint.totalChecks || 0}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-emerald-500">Successful:</span>
                        <span className="font-mono text-emerald-500">{endpoint.successfulChecks || 0}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-red-500">Failed:</span>
                        <span className="font-mono text-red-500">{endpoint.failedChecks || 0}</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>

      {/* ===== DESKTOP VIEW ===== */}
      <div 
        className={cn(
          "hidden md:flex items-center gap-4 py-3 px-4 border-b border-muted transition-opacity bg-background hover:bg-muted/30",
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
            endpointType={endpoint.type}
          />
        </div>

        {/* Uptime Percentage */}
        <div className="flex-shrink-0 text-right w-20">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <div className="text-sm font-medium flex items-center justify-end gap-1">
                    <span>{formatUptime(endpoint.uptimePercentage || 0)}</span>
                    {endpoint.failedChecks && endpoint.failedChecks > 0 ? (
                      <Info className="h-3 w-3 text-orange-500" />
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {endpoint.totalChecks 
                      ? `${endpoint.totalChecks} check${endpoint.totalChecks !== 1 ? 's' : ''}`
                      : 'uptime'
                    }
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs p-3">
                <div className="text-sm space-y-1">
                  <div className="font-medium mb-2">{endpoint.type === 'api' ? 'Coverage' : 'Uptime'}: {formatUptime(endpoint.uptimePercentage || 0)}</div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Total checks:</span>
                    <span className="font-mono">{endpoint.totalChecks || 0}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-emerald-500">Successful:</span>
                    <span className="font-mono text-emerald-500">{endpoint.successfulChecks || 0}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-red-500">Failed:</span>
                    <span className="font-mono text-red-500">{endpoint.failedChecks || 0}</span>
                  </div>
                  {endpoint.failedChecks === 0 && endpoint.totalChecks && endpoint.totalChecks > 0 ? (
                    <div className="text-xs text-green-400 mt-2">
                      ✓ No downtime recorded
                    </div>
                  ) : (endpoint.failedChecks || 0) > 0 ? (
                    <div className="text-xs text-orange-400 mt-2">
                      ⚠ {endpoint.failedChecks} failed check{(endpoint.failedChecks || 0) > 1 ? 's' : ''} recorded
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground mt-2">
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
              {formatResponseTime(chosenResponseTime || 0)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">avg response</div>
        </div>

        {/* Last Checked */}
        <div className="flex-shrink-0 text-right w-24">
          <div className="text-sm font-medium truncate">
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
    </>
  );
};

export default EndpointRow; 