
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="mt-1 text-xs text-muted-foreground flex items-center">
            {trend && (
              <span className={`mr-1 ${getTrendColor()}`}>
                {getTrendArrow()} {Math.abs(trend)}%
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
