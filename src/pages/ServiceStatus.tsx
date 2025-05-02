
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/service-status/StatusBadge";
import ServiceStatusBar from "@/components/service-status/ServiceStatusBar";
import { Bell, ChevronLeft, ChevronRight, Calendar, Info } from "lucide-react";
import serviceUptimeData from "../data/serviceUptime.json";

// Define the type for the daily status to ensure compatibility
type DailyStatus = {
  date: string;
  status: "operational" | "degraded" | "outage";
};

// Ensure the service data conforms to expected types
interface Service {
  id: string;
  name: string;
  components: number;
  uptime: string;
  status: "operational" | "degraded" | "outage";
  dailyStatus: DailyStatus[];
}

const ServiceStatus = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
  };

  // Type assertion to ensure service status conforms to expected type
  const services = serviceUptimeData.services as unknown as Service[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Service Status</h1>
        <Button 
          variant={isSubscribed ? "outline" : "default"} 
          onClick={handleSubscribe}
          className="flex items-center gap-2"
        >
          <Bell size={18} />
          {isSubscribed ? "Unsubscribe from updates" : "Subscribe to updates"}
        </Button>
      </div>

      <Card className="border-2 border-dashed">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <StatusBadge 
              status={serviceUptimeData.status.overall as "operational" | "degraded" | "outage"} 
              size="lg" 
            />
            <h2 className="text-xl font-medium">{serviceUptimeData.status.message}</h2>
          </div>
          <p className="text-muted-foreground">{serviceUptimeData.status.description}</p>
        </CardContent>
      </Card>

      <div className="space-y-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar size={24} className="text-primary" />
            System status
          </h2>
          <div className="flex items-center text-sm text-muted-foreground">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ChevronLeft size={18} />
              <span className="sr-only">Previous period</span>
            </Button>
            <span className="mx-2">
              {serviceUptimeData.timeRange.from} - {serviceUptimeData.timeRange.to}
            </span>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ChevronRight size={18} />
              <span className="sr-only">Next period</span>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {services.map((service) => (
            <div key={service.id} className="border rounded-lg p-4 bg-background">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <StatusBadge 
                    status={service.status} 
                    size="sm" 
                  />
                  <h3 className="font-medium">{service.name}</h3>
                  <div className="flex items-center gap-1 ml-2">
                    <Info size={14} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {service.components} components
                    </span>
                  </div>
                </div>
                <div className="font-medium text-sm">{service.uptime} uptime</div>
              </div>
              <ServiceStatusBar dailyStatus={service.dailyStatus} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <Button variant="outline" className="flex items-center gap-2">
          <Calendar size={18} />
          View history
        </Button>
      </div>
    </div>
  );
};

export default ServiceStatus;
