import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystemStats } from '@/services/statusApi';

interface SystemBannerProps {
  systemStats?: SystemStats;
  isLoading?: boolean;
  error?: Error | null;
  className?: string;
}

const SystemBanner: React.FC<SystemBannerProps> = ({ 
  systemStats, 
  isLoading = false, 
  error = null,
  className 
}) => {
  const getStatusConfig = (status: 'operational' | 'degraded' | 'outage') => {
    switch (status) {
      case 'operational':
        return {
          variant: 'default' as const,
          bgColor: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
          textColor: 'text-green-800 dark:text-green-200',
          icon: <Check className="h-5 w-5" />,
        };
      case 'degraded':
        return {
          variant: 'destructive' as const,
          bgColor: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800',
          textColor: 'text-amber-800 dark:text-amber-200',
          icon: <AlertTriangle className="h-5 w-5" />,
        };
      case 'outage':
        return {
          variant: 'destructive' as const,
          bgColor: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200',
          icon: <XCircle className="h-5 w-5" />,
        };
      default:
        // Fallback for unknown status
        return {
          variant: 'destructive' as const,
          bgColor: 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800',
          textColor: 'text-gray-800 dark:text-gray-200',
          icon: <AlertTriangle className="h-5 w-5" />,
        };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Alert className={cn("border-2 border-dashed", className)}>
        <Loader2 className="h-5 w-5 animate-spin" />
        <AlertDescription className="ml-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Checking system status...</span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Error state
  if (error || !systemStats) {
    const config = getStatusConfig('outage');
    return (
      <Alert className={cn("border-2", config.bgColor, className)}>
        <div className="flex items-center gap-3">
          <div className={config.textColor}>
            {config.icon}
          </div>
          <AlertDescription className={config.textColor}>
            <div className="space-y-1">
              <div className="font-medium text-lg">
                Unable to determine system status
              </div>
              <div className="text-sm opacity-90">
                {error?.message || 'Failed to fetch system status. Please try again later.'}
              </div>
            </div>
          </AlertDescription>
        </div>
      </Alert>
    );
  }

  // Ensure we have a valid status, fallback to 'outage' if undefined
  const status = systemStats.status || 'outage';
  const config = getStatusConfig(status);

  return (
    <Alert className={cn("border-2", config.bgColor, className)}>
      <div className="flex items-center gap-3">
        <div className={config.textColor}>
          {config.icon}
        </div>
        <AlertDescription className={config.textColor}>
          <div className="space-y-2">
            <div className="font-medium text-lg">
              {systemStats.message || 'System status unknown'}
            </div>
            <div className="flex items-center gap-6 text-sm opacity-90">
              <div className="flex items-center gap-2">
                <span className="font-medium">Overall Uptime:</span>
                <span>{(systemStats.overallUptimePercentage || 0).toFixed(2)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Services:</span>
                <span>
                  {systemStats.operationalCount || 0} operational, {systemStats.degradedCount || 0} degraded, {systemStats.outageCount || 0} down
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Total Endpoints:</span>
                <span>{systemStats.totalEndpoints || 0}</span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default SystemBanner; 