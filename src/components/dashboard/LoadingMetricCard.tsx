import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingMetricCardProps {
  icon: React.ReactNode;
}

const LoadingMetricCard: React.FC<LoadingMetricCardProps> = ({ icon }) => {
  return (
    <Card className="card-gradient overflow-hidden">
      {/* DESKTOP LAYOUT */}
      {/* DESKTOP LAYOUT */}
      <div className="hidden sm:flex flex-col p-6">
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <Skeleton className="h-9 w-24 mb-2" />
        <Skeleton className="h-5 w-20 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* MOBILE LAYOUT */}
      <div className="flex sm:hidden flex-row items-center p-3 gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    </Card>
  );
};

export default LoadingMetricCard;
