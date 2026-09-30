import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowLeft, CheckCircle2, Filter, Search, TriangleAlert, XCircle } from "lucide-react";
import TablePagination from "@/components/TablePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { buildDateRangeParams } from "@/lib/utils";
import { fetchIndividualApiCalls } from "@/services/api";
import { SnapshotState, formatLatency, formatNumber } from "./serviceSnapshotShared";

const PAGE_SIZE = 10;

function formatEventTime(value: string | null) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function outcomeStyle(outcome: string | null) {
  if (outcome === "success") return { label: "Success", icon: CheckCircle2, className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" };
  if (outcome === "failure") return { label: "Failed", icon: XCircle, className: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300" };
  return { label: outcome || "Unknown", icon: TriangleAlert, className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300" };
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

const IndividualApiCalls = () => {
  const { dateRange } = useDateFilter();
  const dateParams = useMemo(() => buildDateRangeParams(dateRange, { includeDefaultStart: false }), [dateRange]);
  const [page, setPage] = useState(1);
  const [outcome, setOutcome] = useState<"" | "success" | "failure">("");
  const [layer, setLayer] = useState("");
  const [service, setService] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const query = useQuery({
    queryKey: ["individual-api-calls", dateParams.startDate, dateParams.endDate, page, outcome, layer, service, search],
    queryFn: () => fetchIndividualApiCalls({ ...dateParams, page, limit: PAGE_SIZE, outcome: outcome || undefined, layer: layer || undefined, service: service || undefined, search: search || undefined }),
    enabled: Boolean(dateParams.startDate && dateParams.endDate),
    staleTime: 30_000,
  });
  const data = query.data?.data;
  const pagination = query.data?.pagination;
  const resetFilters = () => { setOutcome(""); setLayer(""); setService(""); setSearchInput(""); setSearch(""); setPage(1); };
  const applySearch = (event: React.FormEvent) => { event.preventDefault(); setSearch(searchInput.trim()); setPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3 text-muted-foreground">
            <Link to="/service-snapshot"><ArrowLeft className="mr-2 h-4 w-4" />Service Performance</Link>
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Activity className="h-6 w-6 text-primary" /> Individual APIs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every captured external API call, with its own status, timing, and masked payload details.</p>
        </div>
      </div>

      <SnapshotState isLoading={query.isLoading} isError={query.isError} warning={query.data?.warning} isEmpty={false} />

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-border/80 bg-gradient-to-br from-primary/10 via-background to-background"><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">Captured API calls</div><div className="mt-1 text-2xl font-bold">{formatNumber(data.summary.total)}</div></CardContent></Card>
            <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background"><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">Successful</div><div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">{formatNumber(data.summary.successful)}</div></CardContent></Card>
            <Card className="border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-background to-background"><CardContent className="p-4"><div className="text-xs font-medium text-muted-foreground">Failed</div><div className="mt-1 text-2xl font-bold text-rose-700 dark:text-rose-300">{formatNumber(data.summary.failed)}</div></CardContent></Card>
          </div>

          <Card className="border-border/80">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium"><Filter className="h-4 w-4 text-primary" /> Refine calls</div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <form onSubmit={applySearch} className="flex gap-2 xl:col-span-2"><Input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search endpoint, service, method…" /><Button type="submit" size="icon" variant="outline" aria-label="Search"><Search className="h-4 w-4" /></Button></form>
                <select value={outcome} onChange={(event) => { setOutcome(event.target.value as "" | "success" | "failure"); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">All outcomes</option><option value="success">Success</option><option value="failure">Failure</option></select>
                <select value={layer} onChange={(event) => { setLayer(event.target.value); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">All layers</option>{data.filterOptions.layers.map((item) => <option key={item} value={item}>{item}</option>)}</select>
                <select value={service} onChange={(event) => { setService(event.target.value); setPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">All services</option>{data.filterOptions.services.map((item) => <option key={item} value={item}>{item}</option>)}</select>
              </div>
              {(outcome || layer || service || search) && <div className="mt-3"><Button variant="ghost" size="sm" onClick={resetFilters}>Clear filters</Button></div>}
            </CardContent>
          </Card>

          {data.calls.length > 0 ? (
            <Card className="border-border/80">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-[780px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[340px]">Endpoint</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="whitespace-nowrap">Captured at</TableHead>
                        <TableHead className="whitespace-nowrap">Duration</TableHead>
                        <TableHead className="whitespace-nowrap">HTTP status</TableHead>
                        <TableHead className="whitespace-nowrap text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.calls.map((call) => {
                        const status = outcomeStyle(call.outcome);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={call.id}>
                            <TableCell><code className="break-all text-xs font-semibold text-foreground">{call.method || "CALL"} {displayEndpoint(call.endpoint)}</code></TableCell>
                            <TableCell><Badge variant="outline" className={`whitespace-nowrap ${status.className}`}><StatusIcon className="mr-1 h-3.5 w-3.5" />{status.label}</Badge></TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{formatEventTime(call.event_time)}</TableCell>
                            <TableCell className="whitespace-nowrap font-medium">{formatLatency(call.duration_ms)}</TableCell>
                            <TableCell className="whitespace-nowrap">{call.http_status !== null ? `HTTP ${call.http_status}` : "—"}</TableCell>
                            <TableCell className="whitespace-nowrap text-right">
                              <Button asChild size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/5">
                                <Link to={`/individual-apis/${call.id}`}>View details</Link>
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
            <Card><CardContent className="py-12 text-center"><Activity className="mx-auto mb-3 h-9 w-9 text-muted-foreground" /><div className="font-medium">No API calls match these filters</div><p className="mt-1 text-sm text-muted-foreground">Try clearing a filter or choosing a different date range.</p></CardContent></Card>
          )}
          {pagination && pagination.totalPages > 1 && <TablePagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
};

export default IndividualApiCalls;
