import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingMetricCardProps {
  icon: React.ReactNode;
}

const LoadingMetricCard: React.FC<LoadingMetricCardProps> = ({ icon }) => {
  return (
    <Card className="card-gradient overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
    </Card>
  );
};

export default LoadingMetricCard;
