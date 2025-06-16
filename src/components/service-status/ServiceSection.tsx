import React from 'react';
import { cn } from '@/lib/utils';
import { Server, Globe, Loader2 } from 'lucide-react';
import EndpointRow from './EndpointRow';
import type { EndpointStats, TrendDataPoint, LatestStatusUpdate } from '@/services/statusApi';

interface ServiceSectionProps {
  title: string;
  endpoints: EndpointStats[];
  trendsData?: { [endpointId: string]: TrendDataPoint[] };
  trendsLoading?: { [endpointId: string]: boolean };
  trendsErrors?: { [endpointId: string]: Error | null };
  latestUpdates?: { [endpointId: string]: LatestStatusUpdate };
  type?: 'ui' | 'api';
  className?: string;
}

const ServiceSection: React.FC<ServiceSectionProps> = ({
  title,
  endpoints,
  trendsData = {},
  trendsLoading = {},
  trendsErrors = {},
  latestUpdates = {},
  type,
  className
}) => {
  if (endpoints.length === 0) {
    return null;
  }

  const getSectionIcon = (type?: 'ui' | 'api') => {
    switch (type) {
      case 'ui':
        return <Globe className="h-5 w-5" />;
      case 'api':
        return <Server className="h-5 w-5" />;
      default:
        return <Server className="h-5 w-5" />;
    }
  };

  const getSectionStats = (endpoints: EndpointStats[]) => {
    const operational = endpoints.filter(e => e.status === 'operational').length;
    const degraded = endpoints.filter(e => e.status === 'degraded').length;
    const outage = endpoints.filter(e => e.status === 'outage').length;
    const avgUptime = endpoints.length > 0 
      ? endpoints.reduce((sum, e) => sum + (e.uptimePercentage || 0), 0) / endpoints.length
      : 0;

    return { operational, degraded, outage, avgUptime };
  };

  const stats = getSectionStats(endpoints);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-primary">
            {getSectionIcon(type)}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{title}</h2>
            <div className="text-sm text-muted-foreground">
              {endpoints.length} service{endpoints.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {/* Section Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{stats.operational} operational</span>
          </div>
          {stats.degraded > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span>{stats.degraded} degraded</span>
            </div>
          )}
          {stats.outage > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>{stats.outage} down</span>
            </div>
          )}

        </div>
      </div>

      {/* Section Content */}
      <div className="border rounded-lg bg-background">
        {/* Column Headers */}
        <div className="flex items-center gap-4 py-2 px-4 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
          <div className="flex-shrink-0 w-4">Status</div>
          <div className="flex-shrink-0 w-48 ml-6">Service</div>
          <div className="flex-1 text-center">30-day history</div>
          <div className="flex-shrink-0 text-right w-20">Uptime</div>
          <div className="flex-shrink-0 text-right w-20">Response</div>
          <div className="flex-shrink-0 text-right w-24">Last Check</div>
        </div>

        {/* Endpoint Rows */}
        <div>
          {endpoints.map((endpoint, index) => (
            <EndpointRow
              key={endpoint.id}
              endpoint={endpoint}
              trends={trendsData[endpoint.id]}
              trendsLoading={trendsLoading[endpoint.id]}
              trendsError={trendsErrors[endpoint.id]}
              latestUpdate={latestUpdates[endpoint.id]}
              className={index === endpoints.length - 1 ? "border-b-0" : ""}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServiceSection; 