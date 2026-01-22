import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/service-status/StatusBadge";
import { RefreshCw, Clock, Zap, Server, Globe } from "lucide-react";
import { fetchSunbirdVAHealth, ServiceHealth, HealthDependency } from "@/services/api";

const HealthMonitor = () => {
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadHealth = async () => {
    try {
      const health = await fetchSunbirdVAHealth();
      setServiceHealth(health);
    } catch (error) {
      console.error("Error loading health:", error);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      await loadHealth();
      setIsLoading(false);
    };
    
    initialLoad();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHealth();
    setIsRefreshing(false);
  };

  const formatUptime = (uptimeSeconds?: number): string => {
    if (!uptimeSeconds) return "Unknown";
    
    const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
    const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatLastChecked = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading health status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Health Monitor</h1>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Service Health Card */}
      {serviceHealth && (
        <Card className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StatusBadge status={serviceHealth.status} size="sm" />
                <div>
                  <CardTitle className="text-lg">{serviceHealth.name}</CardTitle>
                
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Environment</p>
                  <p className="text-sm font-medium">
                    {serviceHealth.health?.app?.environment || "Unknown"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Server size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Version</p>
                  <p className="text-sm font-medium">
                    {serviceHealth.health?.app?.version || "Unknown"}
                  </p>
                </div>
              </div>
              
              {/* <div className="flex items-center gap-2">
                <Clock size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                  <p className="text-sm font-medium">
                    {formatUptime(serviceHealth.health?.app?.uptime_seconds)}
                  </p>
                </div>
              </div> */}
            </div>

            {/* Error Message */}
            {serviceHealth.error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-400">
                      Connection Error
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                      {serviceHealth.error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Dependencies */}
            {serviceHealth.health?.dependencies && Object.keys(serviceHealth.health.dependencies).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Dependencies</h4>
                <div className="grid gap-2">
                  {Object.entries(serviceHealth.health.dependencies).map(([name, dep]: [string, HealthDependency]) => (
                    <div 
                      key={name}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          dep.status === "healthy" ? "bg-green-500" :
                          dep.status === "degraded" ? "bg-amber-500" : "bg-red-500"
                        }`} />
                        <div>
                          <p className="text-sm font-medium capitalize">{name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {dep.latency_ms}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Last Checked */}
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-4 pt-4 border-t">
              <span>Last checked: {formatLastChecked(serviceHealth.lastChecked)}</span>
              <span>Health URL: https://prodaskvistaar.mahapocra.gov.in/api/health</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HealthMonitor; 