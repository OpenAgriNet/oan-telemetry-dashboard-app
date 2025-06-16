import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getStatusColor, getStatusFromUptime } from '@/services/statusApi';
import type { TrendDataPoint } from '@/services/statusApi';

interface ExtendedTrendDataPoint extends TrendDataPoint {
  isBeforeMonitoring?: boolean;
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
  // Generate blocks based on actual monitoring period
  const generateMonitoringBlocks = (count: number = 30) => {
    const blocks = [];
    const now = new Date();
    const serviceStart = serviceCreatedAt ? new Date(serviceCreatedAt) : null;
    
    // Generate 30 days going backwards from today
    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Check if this date is before service monitoring started
      const isBeforeMonitoring = serviceStart && date < serviceStart;
      const isMonitoringDay = serviceStart && date >= serviceStart;
      
             const status: 'operational' | 'degraded' | 'outage' = isBeforeMonitoring ? 'operational' : currentStatus;
       
       blocks.push({
         date: date.toISOString().split('T')[0],
         uptimePercentage: isBeforeMonitoring ? 0 : (isMonitoringDay ? currentUptime : 0),
         avgResponseTime: 0,
         status,
         isBeforeMonitoring
       });
    }
    
    return blocks;
  };

  // Use trends data or fallback to monitoring blocks
  const displayData = trends.length > 0 ? trends : generateMonitoringBlocks();
  
  // Ensure we have exactly 30 blocks (pad or trim as needed)
  const normalizedData = displayData.slice(-30).concat(
    Array.from({ length: Math.max(0, 30 - displayData.length) }, () => ({
      date: '',
      uptimePercentage: 0,
      avgResponseTime: 0,
      status: 'operational' as const
    }))
  ).slice(0, 30);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No data';
    const date = new Date(dateString);
    // Use IST timezone for display
    return date.toLocaleDateString('en-IN', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
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
    } else if (isLoading || !dataPoint.date) {
      color = 'bg-gray-300';
    } else if (dataPoint.isBeforeMonitoring) {
      color = 'bg-gray-200';
    } else if (dataPoint.uptimePercentage === 0) {
      color = 'bg-blue-400';
    } else {
      // Enhanced color scheme - same height, different colors
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
    if (dataPoint.isBeforeMonitoring) return `${formatDate(dataPoint.date)} - Before monitoring started`;
    if (dataPoint.uptimePercentage === 0) return `${formatDate(dataPoint.date)} - No data for this day`;
    
    return (
      <div className="text-sm">
        <div className="font-medium">{formatDate(dataPoint.date)}</div>
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