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

  const getBlockColor = (dataPoint: ExtendedTrendDataPoint, isLoading: boolean, error: Error | null) => {
    if (error) return 'bg-gray-400'; // Error state
    if (isLoading || !dataPoint.date) return 'bg-gray-300'; // Loading or no data
    if (dataPoint.isBeforeMonitoring) return 'bg-gray-200'; // Before monitoring started
    if (dataPoint.uptimePercentage === 0) return 'bg-blue-400'; // No data for this day
    return getStatusColor(dataPoint.uptimePercentage);
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
    <div className={cn("flex items-center gap-0.5", className)}>
      <TooltipProvider>
        {normalizedData.map((dataPoint, index) => (
          <Tooltip key={`${dataPoint.date}-${index}`} delayDuration={0}>
            <TooltipTrigger asChild>
              <div 
                className={cn(
                  "w-3 h-3 rounded-sm transition-colors duration-200 hover:scale-110",
                  getBlockColor(dataPoint, isLoading, error)
                )}
                aria-label={`Status for ${dataPoint.date || 'unknown date'}`}
              />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {getTooltipContent(dataPoint, isLoading, error)}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
};

export default MiniGrid; 