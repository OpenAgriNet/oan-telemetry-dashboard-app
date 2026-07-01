import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  PhoneCall,
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
import mockData from "@/data/externalApiLogs.json";

type SortKey = "id" | "latencyMs" | "timestamp";
type SortOrder = "asc" | "desc";

type LogEntry = (typeof mockData.logs)[number];

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
    api_error: "destructive",
    api_call: "outline",
    api_response: "secondary",
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

function deriveStats(logs: LogEntry[]) {
  const totalCalls = logs.length;
  const totalSuccess = logs.filter((l) => l.status === "success").length;
  const totalErrors = logs.filter((l) => l.status === "error").length;
  const maxLatencyMs = logs.reduce((max, l) => Math.max(max, l.latencyMs), 0);

  // Per-service breakdown
  const serviceMap: Record<
    string,
    { useCaseLabel: string; totalCalls: number; success: number; errors: number }
  > = {};
  for (const log of logs) {
    if (!serviceMap[log.serviceName]) {
      serviceMap[log.serviceName] = {
        useCaseLabel: log.requestType,
        totalCalls: 0,
        success: 0,
        errors: 0,
      };
    }
    serviceMap[log.serviceName].totalCalls += 1;
    if (log.status === "success") serviceMap[log.serviceName].success += 1;
    else serviceMap[log.serviceName].errors += 1;
  }

  const callsPerService = Object.entries(serviceMap).map(([name, data]) => ({
    serviceName: name,
    ...data,
  }));

  return { totalCalls, totalSuccess, totalErrors, maxLatencyMs, callsPerService };
}

const ExternalApiObservability = () => {
  const { dateRange } = useDateFilter();
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the date filter changes
  useMemo(() => {
    setPage(1);
  }, [dateRange]);

  // Filter mock logs based on global date range
  const filteredLogs = useMemo<LogEntry[]>(() => {
    const { from, to } = dateRange;
    if (!from && !to) return mockData.logs as LogEntry[];

    return (mockData.logs as LogEntry[]).filter((log) => {
      const ts = new Date(log.timestamp);
      // Set 'to' to end of the selected day for inclusive matching
      const toEndOfDay = to ? new Date(new Date(to).setHours(23, 59, 59, 999)) : undefined;
      if (from && ts < from) return false;
      if (toEndOfDay && ts > toEndOfDay) return false;
      return true;
    });
  }, [dateRange]);

  const { totalCalls, totalSuccess, totalErrors, maxLatencyMs, callsPerService } =
    useMemo(() => deriveStats(filteredLogs), [filteredLogs]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const sorted = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let av: number | string;
      let bv: number | string;

      if (sortKey === "id") {
        av = a.id;
        bv = b.id;
      } else if (sortKey === "latencyMs") {
        av = a.latencyMs;
        bv = b.latencyMs;
      } else {
        av = a.timestamp;
        bv = b.timestamp;
      }

      if (av < bv) return sortOrder === "asc" ? -1 : 1;
      if (av > bv) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [sortKey, sortOrder]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
                    <p className="mt-1 text-2xl font-bold">
                      {value.toLocaleString()}
                    </p>
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

      {/* Calls per Service */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PhoneCall size={16} className="text-muted-foreground" />
            <CardTitle className="text-lg">Calls per Use Case / Service</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Name</TableHead>
                  <TableHead>Use Case</TableHead>
                  <TableHead className="text-right">Total Calls</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead className="text-right">Error Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {callsPerService.map((row) => {
                  const errorRate =
                    row.totalCalls > 0
                      ? ((row.errors / row.totalCalls) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <TableRow key={row.serviceName}>
                      <TableCell className="font-medium">
                        {row.serviceName}
                      </TableCell>
                      <TableCell>{row.useCaseLabel}</TableCell>
                      <TableCell className="text-right">
                        {row.totalCalls.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {row.success.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        {row.errors.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            Number(errorRate) > 20
                              ? "destructive"
                              : Number(errorRate) > 5
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {errorRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">API Call Logs</CardTitle>
          <p className="text-sm text-muted-foreground">
            {filteredLogs.length.toLocaleString()} records
            {(dateRange.from || dateRange.to) && (
              <span className="ml-1 text-xs text-muted-foreground">(filtered)</span>
            )}
          </p>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No API call logs found for the selected date range.
            </div>
          ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-md border">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold"
                        onClick={() => handleSort("id")}
                      >
                        SL
                        <SortIcon active={sortKey === "id"} order={sortOrder} />
                      </Button>
                    </TableHead>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Request Type</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold"
                        onClick={() => handleSort("latencyMs")}
                      >
                        Latency (ms)
                        <SortIcon
                          active={sortKey === "latencyMs"}
                          order={sortOrder}
                        />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold"
                        onClick={() => handleSort("timestamp")}
                      >
                        Timestamp
                        <SortIcon
                          active={sortKey === "timestamp"}
                          order={sortOrder}
                        />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-muted-foreground">
                        {(page - 1) * PAGE_SIZE + index + 1}
                      </TableCell>
                      <TableCell>
                        <EventBadge name={row.eventName} />
                      </TableCell>
                      <TableCell>{row.requestType}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatTimestamp(row.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                  {Math.min(page * PAGE_SIZE, sorted.length).toLocaleString()}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {sorted.length.toLocaleString()}
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
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
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
