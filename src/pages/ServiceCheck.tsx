import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Activity,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, buildDateRangeParams } from "@/lib/utils";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useTelemetryState } from "@/contexts/TelemetryStateContext";
import {
  fetchServiceCheck,
  type ServiceCheckApi,
  type ServiceCheckService,
} from "@/services/api";

/**
 * Service Check: per-service health of the external APIs the provider calls.
 * Services and API labels come from the backend registry
 * (oan-telemetry-dashboard-service utils/serviceCheckConfig.js), so new
 * services show up here without UI changes.
 */

function successRateClass(rate: number, total: number): string {
  if (total === 0) return "text-muted-foreground";
  if (rate >= 90) return "text-emerald-600";
  if (rate >= 70) return "text-amber-600";
  return "text-red-600";
}

function SummaryTile({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", className)}>
        {value}
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function ApiRow({ api }: { api: ServiceCheckApi }) {
  const errorTypes = api.errorTypes
    .map((e) => `${e.errorType} (${e.count})`)
    .join(", ");

  return (
    <TableRow className={cn(api.total === 0 && "text-muted-foreground")}>
      <TableCell>
        <div className="font-medium">{api.label}</div>
        <div className="font-mono text-[10px] text-muted-foreground">
          {api.apiService}
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">{api.total}</TableCell>
      <TableCell
        className={cn("text-right tabular-nums", api.success > 0 && "text-emerald-600")}
      >
        {api.success}
      </TableCell>
      <TableCell
        className={cn("text-right tabular-nums", api.failed > 0 && "text-red-600")}
      >
        {api.failed}
      </TableCell>
      <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
        {api.rejected} / {api.error}
      </TableCell>
      <TableCell
        className={cn(
          "text-right font-medium tabular-nums",
          successRateClass(api.successRate, api.total),
        )}
      >
        {api.total > 0 ? `${api.successRate}%` : "—"}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {api.avgLatencyMs > 0 ? `${api.avgLatencyMs} ms` : "—"}
      </TableCell>
      <TableCell className="whitespace-nowrap text-xs">
        {api.lastCallAt ?? "—"}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {errorTypes || "—"}
      </TableCell>
    </TableRow>
  );
}

function ServiceCard({ service }: { service: ServiceCheckService }) {
  const { totals } = service;

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="space-y-4 border-b border-border/50 bg-muted/20">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">{service.label}</CardTitle>
          <Badge variant="outline" className="font-mono font-normal">
            {service.id}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryTile
            label="API calls"
            value={totals.total}
            icon={<Activity size={14} />}
          />
          <SummaryTile
            label="Completed"
            value={totals.success}
            icon={<CheckCircle2 size={14} />}
            className={totals.success > 0 ? "text-emerald-600" : undefined}
          />
          <SummaryTile
            label="Failed"
            value={totals.failed}
            hint={`${totals.rejected} rejected · ${totals.error} error`}
            icon={<XCircle size={14} />}
            className={totals.failed > 0 ? "text-red-600" : undefined}
          />
          <SummaryTile
            label="Success rate"
            value={totals.total > 0 ? `${totals.successRate}%` : "—"}
            icon={<ShieldCheck size={14} />}
            className={successRateClass(totals.successRate, totals.total)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>API</TableHead>
                <TableHead className="text-right">Called</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead
                  className="text-right"
                  title="Rejected = API answered but refused (e.g. wrong OTP). Error = timeout, network or HTTP failure."
                >
                  Rejected / Error
                </TableHead>
                <TableHead className="text-right">Success rate</TableHead>
                <TableHead className="text-right">Avg latency</TableHead>
                <TableHead>Last call</TableHead>
                <TableHead>Error types</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {service.apis.map((api) => (
                <ApiRow key={api.apiService} api={api} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

const ServiceCheck = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRange } = useDateFilter();
  const { selectedStateId } = useTelemetryState();
  const selectedService = searchParams.get("service") || "all";

  const dateParams = useMemo(
    () => buildDateRangeParams(dateRange),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateRange.from?.toISOString(), dateRange.to?.toISOString()],
  );
  const isDateRangeReady =
    dateRange.from !== undefined && dateRange.to !== undefined;

  const {
    data: services,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "service-check",
      selectedStateId,
      dateParams.startDate,
      dateParams.endDate,
    ],
    queryFn: () =>
      fetchServiceCheck({
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      }),
    enabled: isDateRangeReady,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const visibleServices = (services ?? []).filter(
    (s) => selectedService === "all" || s.id === selectedService,
  );

  const handleServiceChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("service", value);
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Service Check</h1>
            <p className="text-sm text-muted-foreground">
              How many times each external API was called, and how many
              completed or failed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-full md:w-60">
            <Select value={selectedService} onValueChange={handleServiceChange}>
              <SelectTrigger aria-label="Filter by service">
                <SelectValue placeholder="All services" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                <SelectItem value="all">All services</SelectItem>
                {(services ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={cn(isFetching && "animate-spin")} />
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-destructive/40">
          <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
            <AlertCircle size={16} />
            {error instanceof Error ? error.message : "Failed to load service check"}
          </CardContent>
        </Card>
      ) : isLoading || !isDateRangeReady ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      ) : visibleServices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No services found for this period.
          </CardContent>
        </Card>
      ) : (
        visibleServices.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))
      )}
    </div>
  );
};

export default ServiceCheck;
