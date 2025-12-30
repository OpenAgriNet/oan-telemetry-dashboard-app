
import React from "react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type DailyStatus = {
  date: string;
  status: "operational" | "degraded" | "outage";
};

interface ServiceStatusBarProps {
  dailyStatus: DailyStatus[];
  className?: string;
}

const ServiceStatusBar: React.FC<ServiceStatusBarProps> = ({ dailyStatus, className }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-500";
      case "degraded":
        return "bg-amber-500";
      case "outage":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className={cn("flex items-center gap-0.5 w-full", className)}>
      {dailyStatus.map((day, index) => (
        <TooltipProvider key={day.date}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div 
                className={cn(
                  "h-6 flex-1 rounded-sm", 
                  getStatusColor(day.status)
                )}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{formatDate(day.date)}</p>
              <p className="text-xs capitalize">{day.status}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  );
};

export default ServiceStatusBar;
