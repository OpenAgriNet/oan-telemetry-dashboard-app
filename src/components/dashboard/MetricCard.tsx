
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
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <p className="mt-1 text-sm text-muted-foreground">
          {title}
          {trend && (
            <span className={`ml-2 ${getTrendColor()}`}>
              {getTrendArrow()} {Math.abs(trend)}%
            </span>
          )}
        </p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
