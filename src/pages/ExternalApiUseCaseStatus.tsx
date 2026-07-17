import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  HelpCircle,
  Hourglass,
  RefreshCw,
  Search,
  Timer,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildDateRangeParams, cn } from "@/lib/utils";
import { useTelemetryState } from "@/contexts/TelemetryStateContext";
import {
  fetchBecknExtUseCaseHealth,
  type BecknExtUseCaseHealth,
  type BecknExtUseCaseHealthStatus,
} from "@/services/api";

/** Friendly labels for known service_name / use-case values */
const USE_CASE_LABELS: Record<string, string> = {
  pmkisan: "PMKISAN",
  "pmkisan-greviance": "PM-KISAN Grievance",
  "pmkisan-installment-status": "PM-KISAN Installment Status",
  scheme: "Scheme Info",
  mandi: "Mandi",
  imd: "Weather (IMD)",
  advisory: "Advisory",
  pmfby: "PMFBY",
  "pmfby-greviance": "PMFBY Grievance",
  grievance: "Grievance",
  "grievance-agri": "Grievance Agri",
  gfr: "GFR",
  smam: "SMAM",
  sathi: "SATHI Seed",
  shc: "Soil Health Card",
  hasura: "Hasura",
};

function formatUseCaseLabel(value: string): string {
  if (!value) return "—";
  return (
    USE_CASE_LABELS[value] ??
    value
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

/** Compact hours label e.g. "5.2 hrs" or "12 hrs" */
function formatHoursDown(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return "—";
  const hours = ms / (1000 * 60 * 60);
  if (hours < 1) {
    const mins = Math.max(1, Math.floor(ms / 60000));
    return `${mins} min`;
  }
  if (hours < 48) {
    const rounded = hours >= 10 ? Math.round(hours) : Math.round(hours * 10) / 10;
    return `${rounded} hr${rounded === 1 ? "" : "s"}`;
  }
  const days = Math.floor(hours / 24);
  const remH = Math.round(hours % 24);
  return remH > 0 ? `${days}d ${remH}h` : `${days}d`;
}

type StatusFilter = "all" | BecknExtUseCaseHealthStatus;

const STATUS_META: Record<
  BecknExtUseCaseHealthStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    badge: string;
    row: string;
    dot: string;
  }
> = {
  working: {
    label: "Working",
    icon: CheckCircle2,
    badge:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
    row: "hover:bg-emerald-500/[0.03]",
    dot: "bg-emerald-500",
  },
  not_working: {
    label: "Not Working",
    icon: XCircle,
    badge:
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-inset ring-rose-500/30",
    row: "hover:bg-rose-500/[0.04] bg-rose-500/[0.02]",
    dot: "bg-rose-500",
  },
  unknown: {
    label: "Unknown",
    icon: HelpCircle,
    badge: "bg-muted text-muted-foreground ring-1 ring-inset ring-border",
    row: "hover:bg-muted/40",
    dot: "bg-muted-foreground/50",
  },
};

function StatusBadge({ status }: { status: BecknExtUseCaseHealthStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        meta.badge,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      <Icon size={13} className="shrink-0" />
      {meta.label}
    </span>
  );
}

function SuccessRateBadge({ row }: { row: BecknExtUseCaseHealth }) {
  if (row.totalCalls === 0) {
    return (
      <span className="inline-flex rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
        No calls
      </span>
    );
  }

  const rate = row.successRate;
  const tone =
    rate >= 100
      ? "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300"
      : rate >= 90
        ? "bg-amber-500/15 text-amber-700 ring-amber-500/30 dark:text-amber-300"
        : "bg-rose-500/15 text-rose-700 ring-rose-500/30 dark:text-rose-300";
  const label = Number.isInteger(rate) ? rate.toFixed(0) : rate.toFixed(1);

  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-1 text-xs font-semibold tabular-nums ring-1 ring-inset",
        tone,
      )}
      title={`${row.totalSuccess.toLocaleString()} successful calls out of ${row.totalCalls.toLocaleString()} in the past 24 hours`}
    >
      {label}%
    </span>
  );
}

function DownForBadge({
  ms,
  large = false,
}: {
  ms: number;
  large?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 font-semibold text-rose-700 ring-1 ring-inset ring-rose-500/30 dark:text-rose-300",
        large ? "px-3 py-1.5 text-base" : "px-2.5 py-1 text-sm",
      )}
      title="Time since last success (or start of current failure streak)"
    >
      <Hourglass size={large ? 16 : 13} className="shrink-0" />
      {formatHoursDown(ms)}
    </span>
  );
}

function SummaryStrip({
  working,
  notWorking,
  unknown,
  maxDownForMs,
  loading,
  activeFilter,
  onFilter,
}: {
  working: number;
  notWorking: number;
  unknown: number;
  maxDownForMs: number;
  loading: boolean;
  activeFilter: StatusFilter;
  onFilter: (f: StatusFilter) => void;
}) {
  const cards: {
    key: StatusFilter;
    label: string;
    value: string | number;
    icon: typeof CheckCircle2;
    accent: string;
    hint: string;
  }[] = [
    {
      key: "not_working",
      label: "Not Working Now",
      value: notWorking,
      icon: XCircle,
      accent:
        "border-rose-500/30 from-rose-500/10 to-transparent text-rose-700 dark:text-rose-300",
      hint:
        notWorking > 0
          ? `Longest down: ${formatHoursDown(maxDownForMs)}`
          : "All use cases healthy",
    },
    {
      key: "working",
      label: "Working",
      value: working,
      icon: CheckCircle2,
      accent:
        "border-emerald-500/30 from-emerald-500/10 to-transparent text-emerald-700 dark:text-emerald-300",
      hint: "Latest call succeeded",
    },
    {
      key: "unknown",
      label: "Unknown",
      value: unknown,
      icon: HelpCircle,
      accent: "border-border from-muted/40 to-transparent text-muted-foreground",
      hint: "No recorded status",
    },
    {
      key: "all",
      label: "All Use Cases",
      value: working + notWorking + unknown,
      icon: Activity,
      accent: "border-border from-primary/5 to-transparent text-foreground",
      hint: "Known from all telemetry",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const selected = activeFilter === card.key;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onFilter(card.key)}
            className={cn(
              "rounded-xl border bg-gradient-to-br p-4 text-left transition-all",
              "hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              card.accent,
              selected && "ring-2 ring-primary/40 shadow-sm",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                  {card.label}
                </p>
                {loading ? (
                  <div className="mt-2 h-8 w-12 animate-pulse rounded-md bg-muted" />
                ) : (
                  <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight">
                    {card.value}
                  </p>
                )}
                <p className="mt-1.5 text-[11px] opacity-70">{card.hint}</p>
              </div>
              <div className="rounded-lg bg-background/60 p-2 shadow-sm">
                <Icon size={18} />
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** Primary alert list: only not-working use cases with hours down */
function DownNowPanel({
  rows,
  loading,
  onOpenLogs,
}: {
  rows: BecknExtUseCaseHealth[];
  loading: boolean;
  onOpenLogs: (useCase: string) => void;
}) {
  if (loading) return null;

  if (rows.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={18} />
        </div>
        <div>
          <p className="font-semibold text-emerald-800 dark:text-emerald-200">
            All use cases working
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Latest external API call for every known use case succeeded. No
            outages right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-rose-500/30 shadow-sm">
      <CardHeader className="border-b border-rose-500/15 bg-rose-500/[0.06] py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            <div>
              <CardTitle className="text-base text-rose-800 dark:text-rose-200">
                Not working now — {rows.length} use case
                {rows.length === 1 ? "" : "s"}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                How long each has been down (from last success until now)
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
          >
            Sorted: longest down first
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border/60">
          {rows.map((row) => (
            <li key={row.useCase}>
              <button
                type="button"
                onClick={() => onOpenLogs(row.useCase)}
                className="flex w-full flex-col gap-3 px-4 py-3.5 text-left transition-colors hover:bg-rose-500/[0.04] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {formatUseCaseLabel(row.useCase)}
                    </p>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {row.useCase}
                    </span>
                    {row.latestErrorStatusCode != null && (
                      <span className="inline-flex items-center rounded-md bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-rose-600 ring-1 ring-inset ring-rose-500/25 dark:text-rose-400">
                        HTTP {row.latestErrorStatusCode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-600/80 dark:text-rose-400/80">
                      Total time down
                    </p>
                    <DownForBadge ms={row.downForMs} large />
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted-foreground hidden sm:block"
                  />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function UseCaseMobileCard({
  row,
  onOpenLogs,
}: {
  row: BecknExtUseCaseHealth;
  onOpenLogs: () => void;
}) {
  const meta = STATUS_META[row.status];
  return (
    <button
      type="button"
      onClick={onOpenLogs}
      className={cn(
        "w-full rounded-xl border border-border/60 bg-card p-4 text-left shadow-sm transition-all",
        "hover:border-border hover:shadow-md",
        meta.row,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold leading-snug">
            {formatUseCaseLabel(row.useCase)}
          </p>
        </div>
        <StatusBadge status={row.status} />
      </div>

      {row.status === "not_working" && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2">
          <span className="text-xs font-medium text-rose-800 dark:text-rose-200">
            Down for
          </span>
          <DownForBadge ms={row.downForMs} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock size={12} />
          {row.totalErrors.toLocaleString()} errors in 24h
        </span>
        <SuccessRateBadge row={row} />
        <span className="inline-flex items-center gap-0.5 font-medium text-primary">
          View logs <ChevronRight size={14} />
        </span>
      </div>
    </button>
  );
}

const ExternalApiUseCaseStatus = () => {
  const navigate = useNavigate();
  const { selectedStateId } = useTelemetryState();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["beckn-ext-use-case-health", selectedStateId, "last-24-hours"],
    queryFn: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      const window = buildDateRangeParams({ from: start, to: end });
      return fetchBecknExtUseCaseHealth({
        startDate: window.startDate,
        endDate: window.endDate,
      });
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    // Refresh duration labels periodically while page is open
    refetchInterval: 60 * 1000,
  });

  const rows = data?.useCases ?? [];
  const loading = isLoading;
  const downRows = useMemo(
    () =>
      rows
        .filter((r) => r.status === "not_working")
        .sort((a, b) => b.downForMs - a.downForMs),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (statusFilter !== "all" && row.status !== statusFilter) return false;
        if (!q) return true;
        const label = formatUseCaseLabel(row.useCase).toLowerCase();
        return (
          row.useCase.toLowerCase().includes(q) ||
          label.includes(q) ||
          (row.latestUrl || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.totalCalls === 0 && b.totalCalls > 0) return 1;
        if (b.totalCalls === 0 && a.totalCalls > 0) return -1;
        const rateDifference = a.successRate - b.successRate;
        if (rateDifference !== 0) return rateDifference;
        return formatUseCaseLabel(a.useCase).localeCompare(
          formatUseCaseLabel(b.useCase),
        );
      });
  }, [rows, statusFilter, search]);

  const openLogs = (useCase: string) => {
    navigate(`/external-api?useCase=${encodeURIComponent(useCase)}&page=1`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Timer size={18} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                External API Status
              </h1>
              <Badge variant="secondary" className="font-normal">
                Last 24 hours
              </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Compare API success rates over the past 24 hours and see the
              status recorded when each service was last accessed.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/external-api">
              <ExternalLink size={14} className="mr-1.5" />
              API call logs
            </Link>
          </Button>
          <Button
            onClick={() => void refetch()}
            disabled={isFetching}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-1">
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <AlertTriangle size={13} className="text-amber-500" />
          How we calculate
        </span>
        <span>
          <strong className="text-foreground">Not working</strong> = latest
          external API call failed
        </span>
        <span>
          <strong className="text-foreground">Down for</strong> = now − last
          success time (fallback: start of current failure streak)
        </span>
        <span>
          <strong className="text-foreground">Success %</strong> = successful
          calls ÷ total calls over the past 24 hours
        </span>
        <span>
          <strong className="text-foreground">Current status</strong> = result
          of the latest recorded call, even when it is older than 24 hours
        </span>
      </div> */}

      <SummaryStrip
        working={data?.workingCount ?? 0}
        notWorking={data?.notWorkingCount ?? 0}
        unknown={data?.unknownCount ?? 0}
        maxDownForMs={data?.maxDownForMs ?? 0}
        loading={loading}
        activeFilter={statusFilter}
        onFilter={setStatusFilter}
      />

      {!error && (
        <DownNowPanel
          rows={downRows}
          loading={loading}
          onOpenLogs={openLogs}
        />
      )}

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/50 bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">All use cases</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sorted by 24-hour success percentage, lowest first. Click a row
              for filtered logs.
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search use case or URL…"
              className="h-9 pl-9"
              aria-label="Search use cases"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="max-w-md space-y-1">
                <p className="text-sm font-semibold">Unable to load status</p>
                <p className="text-sm text-muted-foreground">
                  {(error as Error)?.message ||
                    "Something went wrong while loading use-case health."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                <RefreshCw
                  className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
                />
                Try again
              </Button>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center p-12">
              <div className="text-center">
                <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">
                  Checking use cases for outages…
                </p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {rows.length === 0
                ? "No external API use cases found."
                : statusFilter === "not_working"
                  ? "No use cases are down right now. Switch filter to All to see everything."
                  : "No use cases match the current filter."}
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {filtered.map((row) => (
                  <UseCaseMobileCard
                    key={row.useCase}
                    row={row}
                    onOpenLogs={() => openLogs(row.useCase)}
                  />
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-10 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        #
                      </TableHead>
                      <TableHead className="min-w-[10rem] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Use Case
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Current Status
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Err Code
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Errors
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Success % (24h)
                      </TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row, idx) => {
                      const meta = STATUS_META[row.status];
                      return (
                        <TableRow
                          key={row.useCase}
                          className={cn(
                            "cursor-pointer border-border/50 transition-colors",
                            meta.row,
                          )}
                          onClick={() => openLogs(row.useCase)}
                        >
                          <TableCell className="text-center text-xs tabular-nums text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <p className="font-semibold leading-snug">
                              {formatUseCaseLabel(row.useCase)}
                            </p>
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusBadge status={row.status} />
                          </TableCell>
                          <TableCell className="text-center">
                            {row.latestErrorStatusCode != null ? (
                              <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-rose-600 ring-1 ring-inset ring-rose-500/25 dark:text-rose-400">
                                {row.latestErrorStatusCode}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            <span
                              className={cn(
                                row.totalErrors > 0 &&
                                  "font-semibold text-rose-600 dark:text-rose-400",
                              )}
                            >
                              {row.totalErrors.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm tabular-nums">
                            <SuccessRateBadge row={row} />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            <ChevronRight size={16} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t border-border/50 px-4 py-2.5 text-xs text-muted-foreground">
                Showing {filtered.length} of {rows.length} use case
                {rows.length === 1 ? "" : "s"}
                {statusFilter !== "all"
                  ? ` · filter: ${STATUS_META[statusFilter].label}`
                  : ""}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExternalApiUseCaseStatus;
