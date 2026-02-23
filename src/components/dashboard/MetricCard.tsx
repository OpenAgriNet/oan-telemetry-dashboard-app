
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: number;
  trendDirection?: "up" | "down" | "neutral";
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  trendDirection,
}) => {
  const getTrendColor = () => {
    if (!trendDirection) return "text-muted-foreground";
    return trendDirection === "up"
      ? "text-green-500"
      : trendDirection === "down"
      ? "text-red-500"
      : "text-muted-foreground";
  };

  const getTrendArrow = () => {
    if (!trendDirection) return null;
    return trendDirection === "up"
      ? "↑"
      : trendDirection === "down"
      ? "↓"
      : "→";
  };

  return (
    <Card className="card-gradient overflow-hidden">
      {/* DESKTOP LAYOUT */}
      {/* DESKTOP LAYOUT */}
      <div className="hidden sm:flex flex-col p-6">
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
          {icon}
        </div>
        <div className="text-3xl font-bold tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div className="mt-1 text-sm font-medium text-muted-foreground">
          {title}
          {trend && (
            <span className={`ml-2 ${getTrendColor()}`}>
              {getTrendArrow()} {Math.abs(trend)}%
            </span>
          )}
        </div>
        {description && (
          <div className="mt-1 text-xs text-muted-foreground">
            {description}
          </div>
        )}
      </div>

      {/* MOBILE LAYOUT */}
      <div className="flex sm:hidden flex-row items-center p-3 gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-lg font-bold truncate">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </h3>
            {trend && (
              <span className={`text-xs ${getTrendColor()} whitespace-nowrap`}>
                {getTrendArrow()} {Math.abs(trend)}%
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-[10px] text-muted-foreground truncate leading-tight">
              {description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MetricCard;
