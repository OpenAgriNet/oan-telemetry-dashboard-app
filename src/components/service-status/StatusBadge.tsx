
import React from "react";
import { cn } from "@/lib/utils";
import { Check, AlertTriangle, XCircle } from "lucide-react";

type StatusType = "operational" | "degraded" | "outage";

interface StatusBadgeProps {
  status: StatusType;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  size = "md",
  showText = true 
}) => {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case "operational":
        return {
          bgColor: "bg-green-100 dark:bg-green-900/20",
          textColor: "text-green-700 dark:text-green-400",
          icon: <Check size={size === "sm" ? 14 : size === "md" ? 18 : 22} />,
          text: "Operational"
        };
      case "degraded":
        return {
          bgColor: "bg-amber-100 dark:bg-amber-900/20",
          textColor: "text-amber-700 dark:text-amber-400",
          icon: <AlertTriangle size={size === "sm" ? 14 : size === "md" ? 18 : 22} />,
          text: "Degraded"
        };
      case "outage":
        return {
          bgColor: "bg-red-100 dark:bg-red-900/20",
          textColor: "text-red-700 dark:text-red-400",
          icon: <XCircle size={size === "sm" ? 14 : size === "md" ? 18 : 22} />,
          text: "Outage"
        };
      default:
        // Fallback for unknown status
        return {
          bgColor: "bg-gray-100 dark:bg-gray-900/20",
          textColor: "text-gray-700 dark:text-gray-400",
          icon: <AlertTriangle size={size === "sm" ? 14 : size === "md" ? 18 : 22} />,
          text: "Unknown"
        };
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = {
    sm: "text-xs py-1 px-4",
    md: "text-sm py-1.5 px-5",
    lg: "text-base py-2 px-6"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 rounded-lg font-medium",
      config.bgColor,
      config.textColor,
      sizeClasses[size]
    )}>
      <span>{config.icon}</span>
      {showText && <span>{config.text}</span>}
    </div>
  );
};

export default StatusBadge;
