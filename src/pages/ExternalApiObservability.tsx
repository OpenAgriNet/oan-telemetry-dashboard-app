import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useTelemetryState } from "@/contexts/TelemetryStateContext";
import { buildDateRangeParams } from "@/lib/utils";
import {
  fetchProviderTelemetry,
  type ProviderTelemetryLog,
} from "@/services/api";

type SortKey = "latencyMs" | "timestamp";
type SortOrder = "asc" | "desc";

const PAGE_SIZE = 10;

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function EventBadge({ name }: { name: string }) {
  const label = name
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const variantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    error: "destructive",
    ext_api_call: "outline",
    flow_start: "secondary",
    flow_end: "secondary",
    beckn_inbound: "default",
    beckn_outbound: "default",
    internal_step: "outline",
  };

  return <Badge variant={variantMap[name] ?? "outline"}>{label}</Badge>;
}

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) return null;
  return order === "asc" ? (
    <ChevronUp className="ml-1 inline h-3 w-3" />
  ) : (
    <ChevronDown className="ml-1 inline h-3 w-3" />
  );
}

const CARD_META = [
  {
    label: "Total API Calls",
    icon: Globe,
    colorClass: "bg-blue-500/10 text-blue-500",
    key: "totalCalls" as const,
  },
  {
    label: "Total Success",
    icon: CheckCircle2,
    colorClass: "bg-green-500/10 text-green-600",
    key: "totalSuccess" as const,
  },
  {
    label: "Total Errors",
    icon: AlertTriangle,
    colorClass: "bg-red-500/10 text-red-500",
    key: "totalErrors" as const,
  },
  {
    label: "Max Latency (ms)",
    icon: Clock,
    colorClass: "bg-amber-500/10 text-amber-500",
    key: "maxLatencyMs" as const,
  },
];

const ExternalApiObservability = () => {
  const navigate = useNavigate();
  const { dateRange } = useDateFilter();
  const { selectedStateId } = useTelemetryState();
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the date filter changes
  useMemo(() => {
    setPage(1);
  }, [dateRange]);

  const {
    data: providerTelemetry,
    isLoading,
    isFetching,
    error: telemetryError,
    refetch: refetchTelemetry,
  } = useQuery({
    queryKey: [
      "provider-telemetry",
      selectedStateId,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      page,
    ],
    queryFn: () => {
      const dateParams = buildDateRangeParams(dateRange);
      return fetchProviderTelemetry({
        page,
        limit: PAGE_SIZE,
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      });
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const summary = providerTelemetry?.summary;
  // Every row in the log table below is one API/flow-step call, so the cards
  // are driven off the same per-row counts (totalEvents = table's total
  // record count; successCount + errorEventCount === totalEvents).
  const totalCalls = summary?.totalEvents ?? 0;
  const totalSuccess = summary?.successCount ?? 0;
  const totalErrors = summary?.errorEventCount ?? 0;
  const maxLatencyMs = summary?.maxLatencyMs ?? 0;

  const logsResponse = providerTelemetry?.logs ?? { data: [], total: 0, totalPages: 0 };
  const logs = logsResponse.data;
  const totalLogs = logsResponse.total;
  const totalPages = logsResponse.totalPages;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Sort within the current page (matches the pattern used elsewhere in the
  // app for server-paginated tables).
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      let av: number | string;
      let bv: number | string;

      if (sortKey === "latencyMs") {
        av = a.latencyMs ?? 0;
        bv = b.latencyMs ?? 0;
      } else {
        av = a.eventTimestamp;
        bv = b.eventTimestamp;
      }

      if (av < bv) return sortOrder === "asc" ? -1 : 1;
      if (av > bv) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [logs, sortKey, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Activity size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            External API Observability
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor outbound API calls, latency, and error rates across external
            services
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARD_META.map((card) => {
          const Icon = card.icon;
          const valueMap = { totalCalls, totalSuccess, totalErrors, maxLatencyMs };
          const value = valueMap[card.key];
          return (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {card.label}
                    </p>
                    {isLoading ? (
                      <div className="mt-1 h-8 w-16 bg-muted animate-pulse rounded" />
                    ) : (
                      <p className="mt-1 text-2xl font-bold">
                        {value.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${card.colorClass}`}
                  >
                    <Icon size={17} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Unified Logs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">API Call Logs</CardTitle>
          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {totalLogs.toLocaleString()} records
              {(dateRange.from || dateRange.to) && (
                <span className="ml-1 text-xs">(filtered)</span>
              )}
            </p>
            <Button
              onClick={() => refetchTelemetry()}
              disabled={isFetching}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {telemetryError ? (
            <div className="py-10 text-center text-sm text-destructive">
              Error loading API call logs. Please try again.
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center p-12 bg-muted/30">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Loading API call logs...</p>
              </div>
            </div>
          ) : sortedLogs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No API call logs found for the selected date range.
            </div>
          ) : (
            <div className="space-y-4">
              {/* ── Desktop / Tablet table (md+) ── */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">SL</TableHead>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Service Name</TableHead>
                      <TableHead className="hidden lg:table-cell">Request Type</TableHead>
                      <TableHead className="hidden lg:table-cell">Endpoint</TableHead>
                      <TableHead className="text-center">Success</TableHead>
                      <TableHead className="text-center">Error</TableHead>
                      <TableHead className="text-center">
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold"
                          onClick={() => handleSort("latencyMs")}
                        >
                          Latency (ms)
                          <SortIcon active={sortKey === "latencyMs"} order={sortOrder} />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          className="h-auto p-0 font-semibold"
                          onClick={() => handleSort("timestamp")}
                        >
                          Timestamp
                          <SortIcon active={sortKey === "timestamp"} order={sortOrder} />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLogs.map((row: ProviderTelemetryLog, index) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          navigate(`/external-api/flow/${encodeURIComponent(row.questionId)}`)
                        }
                      >
                        <TableCell className="text-muted-foreground">
                          {(page - 1) * PAGE_SIZE + index + 1}
                        </TableCell>
                        <TableCell>
                          <EventBadge name={row.eventName} />
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.serviceName}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {row.requestType || "—"}
                        </TableCell>
                        <TableCell
                          className="hidden lg:table-cell max-w-[200px] truncate font-mono text-xs text-muted-foreground"
                          title={row.endpointUrl || undefined}
                        >
                          {row.endpointUrl || "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.success === true ? (
                            <CheckCircle2 size={16} className="mx-auto text-green-500" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center" title={row.errorMessage || undefined}>
                          {row.success === false || row.errorMessage ? (
                            <AlertTriangle size={16} className="mx-auto text-red-500" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.latencyMs !== null ? (
                            <span
                              className={
                                row.latencyMs > 2000
                                  ? "font-medium text-red-500"
                                  : row.latencyMs > 800
                                  ? "font-medium text-amber-500"
                                  : "text-foreground"
                              }
                            >
                              {row.latencyMs.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatTimestamp(row.eventTimestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile card layout (< md) ── */}
              <div className="md:hidden space-y-3">
                {sortedLogs.map((row: ProviderTelemetryLog, index) => (
                  <div
                    key={row.id}
                    className="rounded-md border p-4 space-y-3 cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      navigate(`/external-api/flow/${encodeURIComponent(row.questionId)}`)
                    }
                  >
                    {/* Row header */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-medium">
                        #{(page - 1) * PAGE_SIZE + index + 1}
                      </span>
                      <EventBadge name={row.eventName} />
                    </div>

                    {/* Service + Request Type */}
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-sm">{row.serviceName}</span>
                      <span className="text-xs text-muted-foreground">
                        {row.requestType || "—"}
                      </span>
                    </div>

                    {/* Endpoint */}
                    {row.endpointUrl && (
                      <p
                        className="font-mono text-xs text-muted-foreground truncate"
                        title={row.endpointUrl}
                      >
                        {row.endpointUrl}
                      </p>
                    )}

                    {/* Status + Latency + Timestamp */}
                    <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                      <div className="flex items-center gap-3">
                        {row.success === true ? (
                          <span className="flex items-center gap-1 text-green-500">
                            <CheckCircle2 size={13} /> Success
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500">
                            <AlertTriangle size={13} /> Error
                          </span>
                        )}
                        {row.latencyMs !== null && (
                          <span
                            className={
                              row.latencyMs > 2000
                                ? "font-medium text-red-500"
                                : row.latencyMs > 800
                                ? "font-medium text-amber-500"
                                : "text-foreground"
                            }
                          >
                            {row.latencyMs.toLocaleString()} ms
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {formatTimestamp(row.eventTimestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {((page - 1) * PAGE_SIZE + 1).toLocaleString()}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(page * PAGE_SIZE, totalLogs).toLocaleString()}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {totalLogs.toLocaleString()}
                  </span>{" "}
                  records
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExternalApiObservability;
