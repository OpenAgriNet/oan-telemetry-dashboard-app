import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getStatusColor, getStatusFromUptime } from '@/services/statusApi';
import type { TrendDataPoint } from '@/services/statusApi';

interface ExtendedTrendDataPoint extends TrendDataPoint {
  isBeforeMonitoring?: boolean;
  hasData?: boolean;
}

interface MiniGridProps {
  trends: TrendDataPoint[];
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
  currentStatus?: 'operational' | 'degraded' | 'outage';
  currentUptime?: number;
  serviceCreatedAt?: string; // When the service monitoring started
}

const MiniGrid: React.FC<MiniGridProps> = ({ 
  trends, 
  isLoading = false, 
  error = null, 
  className,
  currentStatus = 'operational',
  currentUptime = 100,
  serviceCreatedAt
}) => {
  
  // Use the actual trends data
  const actualTrends = trends;
  
  // Generate exactly 30 days going backwards from today (IST timezone)
  const generateLast30Days = () => {
    const blocks: ExtendedTrendDataPoint[] = [];
    const now = new Date();
    
    // Generate 30 days going backwards from today
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Create date key in the same format as backend: YYYY-MM-DD
      const dateKey = date.toISOString().slice(0, 10);
      
      // Check if we have trend data for this date
      const trendData = actualTrends.find(trend => {
        if (!trend.date) return false;
        // Extract date part from the trend data (handles both ISO strings and date-only strings)
        const trendDateKey = new Date(trend.date).toISOString().slice(0, 10);
        return trendDateKey === dateKey;
      });
      
      if (trendData) {
        // We have actual data for this day
        const position = 29 - i;
        blocks.push({
          ...trendData,
          hasData: true,
          isBeforeMonitoring: false
        });
      } else {
        // No data for this day - show as "no data"
        blocks.push({
          date: date.toISOString(),
          uptimePercentage: 0,
          avgResponseTime: 0,
          status: 'operational',
          hasData: false,
          isBeforeMonitoring: false
        });
      }
    }
    
    return blocks;
  };

  // Always use the 30-day generated data
  const normalizedData = generateLast30Days();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No data';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatUptime = (uptime: number) => {
    return `${(uptime || 0).toFixed(2)}%`;
  };

  const formatResponseTime = (responseTime: number) => {
    return `${(responseTime || 0).toFixed(0)}ms`;
  };

  const getBlockStyles = (dataPoint: ExtendedTrendDataPoint, isLoading: boolean, error: Error | null) => {
    let color = 'bg-gray-300';
    const height = 'h-6'; // Same height for all bars
    
    if (error) {
      color = 'bg-gray-400';
    } else if (isLoading) {
      color = 'bg-gray-300 animate-pulse';
    } else if (!dataPoint.hasData) {
      // No data available - show as white/light grey
      color = 'bg-gray-200 border border-gray-300';
    } else {
      // We have actual data - use uptime-based colors
      if (dataPoint.uptimePercentage === 100) {
        color = 'bg-emerald-500';
      } else if (dataPoint.uptimePercentage >= 99) {
        color = 'bg-green-400';
      } else if (dataPoint.uptimePercentage >= 95) {
        color = 'bg-yellow-400';
      } else if (dataPoint.uptimePercentage >= 90) {
        color = 'bg-amber-400';
      } else if (dataPoint.uptimePercentage >= 80) {
        color = 'bg-orange-500';
      } else {
        color = 'bg-red-500';
      }
    }
    
    return { color, height };
  };

  const getTooltipContent = (dataPoint: ExtendedTrendDataPoint, isLoading: boolean, error: Error | null) => {
    if (error) return 'History unavailable';
    if (isLoading) return 'Loading...';
    if (!dataPoint.date) return 'No data available';
    
    const formattedDate = formatDate(dataPoint.date);
    
    if (!dataPoint.hasData) {
      return (
        <div className="text-sm">
          <div className="font-medium">{formattedDate}</div>
          <div className="text-gray-400">No data available</div>
        </div>
      );
    }
    
    return (
      <div className="text-sm">
        <div className="font-medium">{formattedDate}</div>
        <div>Uptime: {formatUptime(dataPoint.uptimePercentage)}</div>
        <div>Avg Response: {formatResponseTime(dataPoint.avgResponseTime)}</div>
        <div className="capitalize">Status: {dataPoint.status}</div>
      </div>
    );
  };

  return (
    <div className={cn("flex items-end gap-[3px] h-8", className)}>
      <TooltipProvider>
        {normalizedData.map((dataPoint, index) => {
          const { color, height } = getBlockStyles(dataPoint, isLoading, error);
          return (
            <Tooltip key={`${dataPoint.date}-${index}`} delayDuration={0}>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "w-2 rounded-sm transition-all duration-200 hover:scale-110 hover:opacity-80",
                    color,
                    height
                  )}
                  aria-label={`Status for ${dataPoint.date || 'unknown date'}`}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                {getTooltipContent(dataPoint, isLoading, error)}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
};

export default MiniGrid;