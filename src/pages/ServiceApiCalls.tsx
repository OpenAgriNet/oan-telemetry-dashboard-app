import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowLeft, CheckCircle2, TriangleAlert, XCircle } from "lucide-react";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { buildDateRangeParams } from "@/lib/utils";
import { fetchServiceApiCalls } from "@/services/api";
import { SnapshotState, findService, formatLatency, formatNumber, providerSlug, useServiceSnapshot } from "./serviceSnapshotShared";

function formatEventTime(value: string | null) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Time unavailable"
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function displayEndpoint(value: string | null) {
  if (!value) return "Endpoint unavailable";
  try {
    const url = new URL(value);
    return `${url.pathname}${url.search}`;
  } catch {
    return value;
  }
}

function outcomeStyle(outcome: string | null) {
  if (outcome === "success") return { label: "Success", icon: CheckCircle2, className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" };
  if (outcome === "failure") return { label: "Failed", icon: XCircle, className: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300" };
  return { label: outcome || "Unknown", icon: TriangleAlert, className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" };
}

const ServiceApiCalls = () => {
  const { providerName: providerSlugParam, serviceKey: serviceKeyParam, apiKey: apiKeyParam } = useParams();
  const location = useLocation();
  const serviceKey = serviceKeyParam ? decodeURIComponent(serviceKeyParam) : "";
  const apiKey = apiKeyParam ? decodeURIComponent(apiKeyParam) : "";
  const snapshotQuery = useServiceSnapshot();
  const provider = snapshotQuery.data?.data.providers.find((item) => providerSlug(item.name) === providerSlugParam);
  const service = findService(provider, serviceKey);
  const api = service?.apis.find((item) => item.key === apiKey);
  const { dateRange } = useDateFilter();
  const dateParams = useMemo(() => buildDateRangeParams(dateRange, { includeDefaultStart: false }), [dateRange]);
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState<"" | "success" | "failure">("");
  const callsQuery = useQuery({
    queryKey: ["service-api-calls", dateParams.startDate, dateParams.endDate, api?.sourceService, api?.endpoint, api?.method, api?.kind, api?.scopeCategories, page, outcome],
    queryFn: () => fetchServiceApiCalls({
      ...dateParams,
      page,
      outcome: outcome || undefined,
      sourceService: api!.sourceService!,
      endpoint: api!.endpoint!,
      method: api!.method,
      kind: api!.kind,
      categories: api!.scopeCategories,
    }),
    enabled: Boolean(api?.sourceService && api?.endpoint && dateParams.startDate && dateParams.endDate),
    staleTime: 30_000,
  });
  const servicePath = `/service-snapshot/provider/${provider ? providerSlug(provider.name) : providerSlugParam || ""}/service/${encodeURIComponent(serviceKey)}`;
  const returnTo = `${location.pathname}${location.search}`;
  const data = callsQuery.data?.data;
  const pagination = callsQuery.data?.pagination;

  const selectOutcome = (value: "" | "success" | "failure") => { setOutcome(value); setPage(1); };

  return (
    <div className="space-y-6">
      <div>
        <Link to={servicePath} className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{service?.name || "Service APIs"}</Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2"><Badge variant="outline" className="font-mono">{api?.method || "CALL"}</Badge><Badge variant="secondary">Individual API calls</Badge></div>
            <h1 className="break-all font-mono text-xl font-bold tracking-tight sm:text-2xl">{api?.endpoint || "API calls"}</h1>
            {api && <p className="mt-2 text-sm text-muted-foreground">{api.name} · {service?.name}</p>}
          </div>
        </div>
      </div>

      <SnapshotState
        isLoading={snapshotQuery.isLoading || callsQuery.isLoading}
        isError={snapshotQuery.isError || callsQuery.isError}
        warning={callsQuery.data?.warning}
        isEmpty={Boolean(snapshotQuery.data?.data.providers.length && !api)}
      />

      {api && data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-border/80 bg-gradient-to-br from-primary/10 via-background to-background"><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">Captured API calls</div><div className="mt-1 text-2xl font-bold">{formatNumber(data.summary.total)}</div></CardContent></Card>
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background"><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">Successful</div><div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(data.summary.successful)}</div></CardContent></Card>
            <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-background to-background"><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">Failed</div><div className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-300">{formatNumber(data.summary.failed)}</div></CardContent></Card>
          </div>

          <div className="flex items-center gap-2">
            {([ ["", "All"], ["success", "Success"], ["failure", "Failure"] ] as const).map(([value, label]) => (
              <Button key={value || "all"} size="sm" variant={outcome === value ? "default" : "outline"} onClick={() => selectOutcome(value)}>{label}</Button>
            ))}
          </div>

          {data.calls.length > 0 ? (
            <Card className="border-border/80">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-[1120px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Method</TableHead>
                        <TableHead>Layer</TableHead>
                        <TableHead className="min-w-[300px]">Endpoint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="whitespace-nowrap">Captured at</TableHead>
                        <TableHead className="whitespace-nowrap">Duration</TableHead>
                        <TableHead className="whitespace-nowrap">HTTP status</TableHead>
                        <TableHead>Dependency</TableHead>
                        <TableHead className="whitespace-nowrap text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.calls.map((call) => {
                        const status = outcomeStyle(call.outcome);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={call.id}>
                            <TableCell><Badge variant="outline" className="font-mono text-xs">{call.method || "CALL"}</Badge></TableCell>
                            <TableCell><Badge variant="secondary" className="whitespace-nowrap font-normal">{call.layer || "Unspecified layer"}</Badge></TableCell>
                            <TableCell><code className="break-all text-xs font-semibold text-foreground">{displayEndpoint(call.endpoint)}</code></TableCell>
                            <TableCell><Badge variant="outline" className={`whitespace-nowrap ${status.className}`}><StatusIcon className="mr-1 h-3.5 w-3.5" />{status.label}</Badge></TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatEventTime(call.event_time)}</TableCell>
                            <TableCell className="whitespace-nowrap font-medium">{formatLatency(call.duration_ms)}</TableCell>
                            <TableCell className="whitespace-nowrap">{call.http_status !== null ? `HTTP ${call.http_status}` : "—"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{call.dependency || "—"}</TableCell>
                            <TableCell className="whitespace-nowrap text-right">
                              <Button asChild size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
                                <Link to={`/individual-apis/${call.id}?returnTo=${encodeURIComponent(returnTo)}`}>View details</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-12 text-center"><Activity className="mx-auto mb-3 h-9 w-9 text-muted-foreground" /><div className="font-medium">No API calls match this outcome</div><p className="mt-1 text-sm text-muted-foreground">Choose All, Success, or Failure to view captured calls.</p></CardContent></Card>
          )}
          {pagination && pagination.totalPages > 1 && <TablePagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
};

export default ServiceApiCalls;
