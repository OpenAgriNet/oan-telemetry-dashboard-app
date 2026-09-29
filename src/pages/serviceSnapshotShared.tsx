import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Database } from "lucide-react";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { buildDateRangeParams } from "@/lib/utils";
import { fetchServiceSnapshot, type ServiceSnapshotMetrics, type ServiceSnapshotProvider, type ServiceSnapshotService } from "@/services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

export function providerSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function formatLatency(value: number | null) {
  if (value === null) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 2)} s`;
  return `${Math.round(value)} ms`;
}

export function Rate({ value, kind = "success" }: { value: number; kind?: "success" | "failure" }) {
  const className = kind === "success"
    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : value > 0
      ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
      : "border-muted-foreground/20 bg-muted text-muted-foreground";

  return <Badge variant="outline" className={className}>{value.toFixed(2)}%</Badge>;
}

export function useServiceSnapshot() {
  const { dateRange } = useDateFilter();
  const dateParams = useMemo(
    () => buildDateRangeParams(dateRange, { includeDefaultStart: false }),
    [dateRange]
  );

  return useQuery({
    queryKey: ["service-snapshot", dateParams.startDate, dateParams.endDate],
    queryFn: () => fetchServiceSnapshot(dateParams),
    enabled: Boolean(dateParams.startDate && dateParams.endDate),
    staleTime: 60_000,
  });
}

export function providerMetrics(provider: ServiceSnapshotProvider) {
  const totals = provider.services.reduce(
    (current, service) => ({
      requests: current.requests + service.metrics.requests,
      successfulRequests: current.successfulRequests + service.metrics.successfulRequests,
      failedRequests: current.failedRequests + service.metrics.failedRequests,
      apiRequests: current.apiRequests + service.apiRequests,
    }),
    { requests: 0, successfulRequests: 0, failedRequests: 0, apiRequests: 0 }
  );

  return {
    ...totals,
    successPercentage: totals.requests ? (totals.successfulRequests / totals.requests) * 100 : 0,
    failurePercentage: totals.requests ? (totals.failedRequests / totals.requests) * 100 : 0,
  };
}

export function SnapshotState({
  isLoading,
  isError,
  warning,
  isEmpty,
}: {
  isLoading: boolean;
  isError: boolean;
  warning?: string;
  isEmpty?: boolean;
}) {
  return (
    <>
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Service performance could not be loaded</AlertTitle>
          <AlertDescription>Please try again. If the issue continues, contact the dashboard administrator.</AlertDescription>
        </Alert>
      )}
      {warning && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>External telemetry is not available yet</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}
      {isLoading && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Loading service telemetry…</CardContent></Card>
      )}
      {isEmpty && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Database className="h-9 w-9 text-muted-foreground" />
            <div className="font-medium">No service telemetry for this date range</div>
            <p className="max-w-md text-sm text-muted-foreground">Choose another date range.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export function findService(provider: ServiceSnapshotProvider | undefined, serviceKey: string | undefined): ServiceSnapshotService | undefined {
  return provider?.services.find((service) => service.key === serviceKey);
}
