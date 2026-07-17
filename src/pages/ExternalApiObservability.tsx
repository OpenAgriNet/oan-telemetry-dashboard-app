import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  AlertCircle,
  Eye,
  Globe,
  RefreshCw,
  XCircle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, buildDateRangeParams } from "@/lib/utils";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useTelemetryState } from "@/contexts/TelemetryStateContext";
import {
  fetchBecknExtList,
  fetchBecknExtStats,
  type BecknExtLog,
  type BecknExtUseCaseOption,
} from "@/services/api";

type SortKey = "latencyMs" | "timestamp";
type SortOrder = "asc" | "desc";

const PAGE_SIZE = 10;

const COMPACT_USE_CASE_COL = "w-[8rem] max-w-[8rem] px-1";
const COMPACT_METHOD_COL = "w-[4rem] px-1";
const COMPACT_STATUS_COL = "w-[4.25rem] px-1";
const COMPACT_LATENCY_COL = "w-[5.25rem] px-1";
const USE_CASE_CHIP_WIDTH = "w-[7.75rem] max-w-[7.75rem]";

/** Friendly labels for known service_name values */
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

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/25",
  POST: "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/25",
  PUT: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/25",
  PATCH: "bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-orange-500/25",
  DELETE: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/25",
};

function MethodChip({ method }: { method: string | null }) {
  if (!method) {
    return <span className="text-muted-foreground">—</span>;
  }
  const upper = method.toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide ring-1 ring-inset",
        METHOD_STYLES[upper] ??
          "bg-muted text-muted-foreground ring-border",
      )}
    >
      {upper}
    </span>
  );
}

/** Light background + border + text color, cycled by use-case name */
const USE_CASE_CHIP_STYLES = [
  "bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-700",
  "bg-violet-50 text-violet-800 border-violet-300 dark:bg-violet-950/40 dark:text-violet-200 dark:border-violet-700",
  "bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-700",
  "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-700",
  "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-700",
  "bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950/40 dark:text-teal-200 dark:border-teal-700",
  "bg-orange-50 text-orange-900 border-orange-300 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-700",
  "bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-700",
];

function useCaseChipStyle(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return USE_CASE_CHIP_STYLES[hash % USE_CASE_CHIP_STYLES.length];
}

function UseCaseChip({ value }: { value: string }) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }
  const label = formatUseCaseLabel(value);
  return (
    <span
      className={cn(
        "inline-block rounded-lg border text-center",
        USE_CASE_CHIP_WIDTH,
        "px-2 py-1 text-[11px] font-semibold leading-snug",
        "line-clamp-2 break-words",
        useCaseChipStyle(value),
      )}
      title={label}
    >
      {label}
    </span>
  );
}

/**
 * Success column: show HTTP status code with success icon when call succeeded.
 * Error column: show HTTP status code with error icon when call failed.
 */
function StatusCodeCell({
  success,
  statusCode,
  kind,
}: {
  success: boolean | null;
  statusCode: number | null;
  kind: "success" | "error";
}) {
  const code =
    statusCode != null && Number.isFinite(Number(statusCode))
      ? String(statusCode)
      : null;

  if (kind === "success") {
    if (success === true) {
      return (
        <span
          className={cn(
            "inline-flex items-center justify-center gap-1 rounded-md px-2 py-0.5",
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            "ring-1 ring-inset ring-emerald-500/25",
            "font-mono text-xs font-semibold tabular-nums",
          )}
          title={code ? `HTTP ${code}` : "Success"}
        >
          <CheckCircle2 size={13} className="shrink-0" />
          {code ?? "OK"}
        </span>
      );
    }
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  // error column
  if (success === false) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded-md px-2 py-0.5",
          "bg-rose-500/10 text-rose-600 dark:text-rose-400",
          "ring-1 ring-inset ring-rose-500/25",
          "font-mono text-xs font-semibold tabular-nums",
        )}
        title={code ? `HTTP ${code}` : "Error"}
      >
        <XCircle size={13} className="shrink-0" />
        {code ?? "ERR"}
      </span>
    );
  }
  return <span className="text-muted-foreground text-xs">—</span>;
}

function LatencyCell({ ms }: { ms: number | null }) {
  if (ms === null || ms === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  const tone =
    ms > 2000
      ? "text-rose-500 font-semibold"
      : ms > 800
        ? "text-amber-500 font-medium"
        : "text-foreground";
  return <span className={cn("tabular-nums", tone)}>{ms.toLocaleString()}</span>;
}



function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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
    label: "Total External API Calls",
    shortLabel: "API Calls",
    icon: Globe,
    key: "totalExternalApiCalls" as const,
    accent: "blue",
    hint: "All outbound calls in range",
  },
  {
    label: "Total Success",
    shortLabel: "Success",
    icon: CheckCircle2,
    key: "totalSuccess" as const,
    accent: "green",
    hint: "ext_api_success = true",
  },
  {
    label: "Total Errors",
    shortLabel: "Errors",
    icon: AlertTriangle,
    key: "totalErrors" as const,
    accent: "red",
    hint: "ext_api_success = false",
  },
  {
    label: "Max Latency (ms)",
    shortLabel: "Max Latency",
    icon: Clock,
    key: "maxLatencyMs" as const,
    accent: "amber",
    hint: "Slowest response (ms)",
  },
] as const;

const ACCENT_STYLES: Record<
  string,
  {
    bar: string;
    iconWrap: string;
    icon: string;
    glow: string;
    value: string;
    chip: string;
  }
> = {
  blue: {
    bar: "from-blue-500 via-blue-400 to-cyan-400",
    iconWrap:
      "bg-blue-500/15 ring-1 ring-blue-500/25 shadow-[0_0_20px_-4px_rgba(59,130,246,0.45)]",
    icon: "text-blue-500 dark:text-blue-400",
    glow: "from-blue-500/[0.08] via-transparent to-transparent",
    value: "text-foreground",
    chip: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  },
  green: {
    bar: "from-emerald-500 via-green-400 to-lime-400",
    iconWrap:
      "bg-emerald-500/15 ring-1 ring-emerald-500/25 shadow-[0_0_20px_-4px_rgba(16,185,129,0.45)]",
    icon: "text-emerald-600 dark:text-emerald-400",
    glow: "from-emerald-500/[0.08] via-transparent to-transparent",
    value: "text-foreground",
    chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  red: {
    bar: "from-rose-500 via-red-400 to-orange-400",
    iconWrap:
      "bg-rose-500/15 ring-1 ring-rose-500/25 shadow-[0_0_20px_-4px_rgba(244,63,94,0.4)]",
    icon: "text-rose-600 dark:text-rose-400",
    glow: "from-rose-500/[0.08] via-transparent to-transparent",
    value: "text-foreground",
    chip: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  amber: {
    bar: "from-amber-500 via-yellow-400 to-orange-400",
    iconWrap:
      "bg-amber-500/15 ring-1 ring-amber-500/25 shadow-[0_0_20px_-4px_rgba(245,158,11,0.4)]",
    icon: "text-amber-600 dark:text-amber-400",
    glow: "from-amber-500/[0.08] via-transparent to-transparent",
    value: "text-foreground",
    chip: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
};

/** Compact bar colors that cycle for many use cases */
const BAR_COLORS = [
  "bg-blue-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-stone-500",
  "bg-emerald-500",
  "bg-indigo-500",
  "bg-orange-500",
];

const USE_CASE_PREVIEW = 5;

function SummaryMetricCards({
  values,
  loading,
  subtitle,
  successRate,
}: {
  values: {
    totalExternalApiCalls: number;
    totalSuccess: number;
    totalErrors: number;
    maxLatencyMs: number;
  };
  loading: boolean;
  subtitle?: string;
  successRate?: number;
}) {
  const total = values.totalExternalApiCalls;
  const successPct =
    typeof successRate === "number"
      ? successRate
      : total > 0
        ? Math.round((values.totalSuccess / total) * 100)
        : 0;
  const errorPct =
    total > 0 ? Math.round((values.totalErrors / total) * 100) : 0;

  const footerFor = (key: (typeof CARD_META)[number]["key"]) => {
    if (key === "totalSuccess" && total > 0) {
      return `${successPct}% success rate`;
    }
    if (key === "totalErrors" && total > 0) {
      return `${errorPct}% of calls`;
    }
    if (key === "maxLatencyMs") {
      if (values.maxLatencyMs >= 2000) return "Elevated — investigate";
      if (values.maxLatencyMs >= 800) return "Moderate peak";
      return "Within healthy range";
    }
    if (key === "totalExternalApiCalls") {
      return subtitle || "In selected period";
    }
    return subtitle || "In selected period";
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CARD_META.map((card) => {
        const Icon = card.icon;
        const value = values[card.key];
        const styles = ACCENT_STYLES[card.accent];

        return (
          <Card
            key={card.key}
            className={cn(
              "group relative overflow-hidden border-border/50 bg-card/80",
              "shadow-sm backdrop-blur-sm transition-all duration-200",
              "hover:border-border hover:shadow-md hover:-translate-y-0.5",
            )}
          >
            {/* Top accent line */}
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r opacity-90",
                styles.bar,
              )}
            />
            {/* Soft corner glow */}
            <div
              className={cn(
                "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br blur-2xl",
                styles.glow,
              )}
            />

            <CardContent className="relative p-4 pt-5 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="sm:hidden">{card.shortLabel}</span>
                    <span className="hidden sm:inline">{card.label}</span>
                  </p>

                  {loading ? (
                    <div className="mt-2 h-9 w-20 animate-pulse rounded-md bg-muted" />
                  ) : (
                    <p
                      className={cn(
                        "mt-1.5 text-3xl font-bold tracking-tight tabular-nums",
                        styles.value,
                      )}
                    >
                      {value.toLocaleString()}
                    </p>
                  )}

                  {!loading && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                          styles.chip,
                        )}
                      >
                        {footerFor(card.key)}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105",
                    styles.iconWrap,
                  )}
                >
                  <Icon size={20} className={styles.icon} strokeWidth={2} />
                </div>
              </div>

              {/* Mini proportional bar for success / errors */}
              {!loading &&
                total > 0 &&
                (card.key === "totalSuccess" || card.key === "totalErrors") && (
                  <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        card.key === "totalSuccess"
                          ? "bg-emerald-500"
                          : "bg-rose-500",
                      )}
                      style={{
                        width: `${
                          card.key === "totalSuccess" ? successPct : errorPct
                        }%`,
                      }}
                    />
                  </div>
                )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Single compact panel: all use-case counts in a dense list.
 * Shows first N rows + "Show all" so many use cases never blow up the page.
 */
function UseCaseCountList({
  useCases,
  totalCalls,
  loading,
  onSelect,
}: {
  useCases: BecknExtUseCaseOption[];
  totalCalls: number;
  loading: boolean;
  onSelect: (useCase: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
          <div className="space-y-1">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-48 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
        </CardHeader>
        <CardContent className="space-y-2 px-4 pb-4 pt-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <div className="h-4 w-28 bg-muted animate-pulse rounded" />
              <div className="h-1.5 flex-1 bg-muted animate-pulse rounded-full" />
              <div className="h-4 w-8 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!useCases.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          No use-case data in the selected date range.
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...useCases.map((u) => u.count), 1);
  const needsCollapse = useCases.length > USE_CASE_PREVIEW;
  const visible =
    expanded || !needsCollapse
      ? useCases
      : useCases.slice(0, USE_CASE_PREVIEW);
  const hiddenCount = useCases.length - USE_CASE_PREVIEW;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3 px-4">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold">
            Calls by use case
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            From API · click a row to filter
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0 tabular-nums">
          {useCases.length} use case{useCases.length === 1 ? "" : "s"}
        </Badge>
      </CardHeader>

      <CardContent className="px-2 pb-3 pt-0">
        <ul className="max-h-[280px] space-y-0.5 overflow-y-auto pr-1">
          {visible.map((item, index) => {
            const share =
              totalCalls > 0
                ? Math.round((item.count / totalCalls) * 100)
                : 0;
            const barPct = Math.round((item.count / maxCount) * 100);
            const barColor = BAR_COLORS[index % BAR_COLORS.length];

            return (
              <li key={item.useCase}>
                <button
                  type="button"
                  onClick={() => onSelect(item.useCase)}
                  className={cn(
                    "group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left",
                    "transition-colors hover:bg-muted/60",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                >
                  <span
                    className="w-[7.5rem] shrink-0 truncate text-sm font-medium sm:w-36"
                    title={formatUseCaseLabel(item.useCase)}
                  >
                    {formatUseCaseLabel(item.useCase)}
                  </span>

                  <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        barColor,
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>

                  <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="hidden w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:inline">
                    {share}%
                  </span>
                  <ChevronRight
                    size={14}
                    className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </button>
              </li>
            );
          })}
        </ul>

        {needsCollapse && (
          <div className="mt-1 border-t border-border/50 px-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full text-xs text-muted-foreground"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? (
                <>
                  Show less
                  <ChevronUp className="ml-1 h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Show all {useCases.length} ({hiddenCount} more)
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const ExternalApiObservability = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRange } = useDateFilter();
  const { selectedStateId } = useTelemetryState();
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // useCase query param maps to beckn_ext_events.service_name
  const selectedUseCase = searchParams.get("useCase") || "all";
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);

  const updateSearchParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      next.set(key, value);
    });
    setSearchParams(next);
  };

  const handleUseCaseChange = (value: string) => {
    updateSearchParams({
      useCase: value,
      page: "1",
    });
  };

  const handlePageChange = (nextPage: number) => {
    updateSearchParams({ page: String(nextPage) });
  };

  const isFirstDateRender = useRef(true);
  useEffect(() => {
    if (isFirstDateRender.current) {
      isFirstDateRender.current = false;
      return;
    }
    updateSearchParams({ page: "1" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.from?.toISOString(), dateRange.to?.toISOString()]);

  const dateParams = useMemo(
    () => buildDateRangeParams(dateRange),
    [dateRange.from?.toISOString(), dateRange.to?.toISOString()],
  );

  // DateRangePicker sets "last 7 days" in a useEffect after first paint.
  // Wait for that so we don't fire once without dates, then again with dates.
  const isDateRangeReady =
    dateRange.from !== undefined && dateRange.to !== undefined;

  const useCaseFilter =
    selectedUseCase !== "all" ? selectedUseCase : undefined;

  // ── Cards: GET /beckn-ext/stats (filtered by service_name when set) ──
  const {
    data: stats,
    isLoading: statsLoading,
    isFetching: statsFetching,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: [
      "beckn-ext-stats",
      selectedStateId,
      dateParams.startDate,
      dateParams.endDate,
      selectedUseCase,
    ],
    queryFn: () =>
      fetchBecknExtStats({
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
        useCase: useCaseFilter,
      }),
    enabled: isDateRangeReady,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Unfiltered useCases list for dropdown when a single use case is selected
  // (only when filtered — avoids a second stats call on "All")
  const { data: allStats, refetch: refetchAllStats } = useQuery({
    queryKey: [
      "beckn-ext-stats-all-usecases",
      selectedStateId,
      dateParams.startDate,
      dateParams.endDate,
    ],
    queryFn: () =>
      fetchBecknExtStats({
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      }),
    enabled: isDateRangeReady && selectedUseCase !== "all",
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // ── Table: GET /beckn-ext ──
  const {
    data: listResponse,
    isLoading: listLoading,
    isFetching: listFetching,
    error: listError,
    refetch: refetchList,
  } = useQuery({
    queryKey: [
      "beckn-ext-list",
      selectedStateId,
      dateParams.startDate,
      dateParams.endDate,
      selectedUseCase,
      page,
      sortKey,
      sortOrder,
    ],
    queryFn: () =>
      fetchBecknExtList({
        page,
        limit: PAGE_SIZE,
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
        useCase: useCaseFilter,
        // Default: latest first (COALESCE start_ets/created_at DESC on server)
        sortBy: sortKey === "latencyMs" ? "ext_api_latency_ms" : "start_ets",
        sortOrder: sortOrder === "asc" ? "asc" : "desc",
      }),
    enabled: isDateRangeReady,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const cardValues = {
    totalExternalApiCalls: stats?.totalExternalApiCalls ?? 0,
    totalSuccess: stats?.totalSuccess ?? 0,
    totalErrors: stats?.totalErrors ?? 0,
    maxLatencyMs: stats?.maxLatencyMs ?? 0,
  };

  // Dropdown + "All" cards use full useCases list from unfiltered stats response
  const useCasesFromApi: BecknExtUseCaseOption[] = useMemo(() => {
    const source =
      selectedUseCase === "all"
        ? stats?.useCases
        : allStats?.useCases ?? stats?.useCases;
    return (source ?? []).filter((u) => u.useCase);
  }, [selectedUseCase, stats?.useCases, allStats?.useCases]);

  const useCaseOptions = useMemo(() => {
    const fromApi = useCasesFromApi.map((u) => ({
      value: u.useCase,
      label: `${formatUseCaseLabel(u.useCase)} (${u.count.toLocaleString()})`,
    }));

    if (
      selectedUseCase !== "all" &&
      !fromApi.some((o) => o.value === selectedUseCase)
    ) {
      fromApi.push({
        value: selectedUseCase,
        label: formatUseCaseLabel(selectedUseCase),
      });
    }

    return [{ value: "all", label: "All Use Cases" }, ...fromApi];
  }, [useCasesFromApi, selectedUseCase]);

  const logs = listResponse?.data ?? [];
  const totalLogs = listResponse?.total ?? 0;
  const totalPages = listResponse?.totalPages ?? 0;

  const isLoading = !isDateRangeReady || statsLoading || listLoading;
  const isFetching = statsFetching || listFetching;
  const telemetryError = statsError || listError;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder(key === "timestamp" ? "desc" : "asc");
    }
    updateSearchParams({ page: "1" });
  };

  const handleRefresh = () => {
    void refetchStats();
    void refetchAllStats();
    void refetchList();
  };

  // Keep page order from server; only re-sort within page for latency toggle.
  // Timestamp default stays server-side: COALESCE(start_ets, created_at) DESC.
  const sortedLogs = useMemo(() => {
    if (sortKey !== "latencyMs") {
      return logs;
    }
    return [...logs].sort((a, b) => {
      const av = a.extApiLatencyMs ?? 0;
      const bv = b.extApiLatencyMs ?? 0;
      if (av < bv) return sortOrder === "asc" ? -1 : 1;
      if (av > bv) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [logs, sortKey, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => navigate("/external-api/status")}
          >
            <Activity size={14} className="mr-1.5" />
            What&apos;s Down
          </Button>
          <div className="w-full sm:w-72">
            <Select value={selectedUseCase} onValueChange={handleUseCaseChange}>
              <SelectTrigger aria-label="Filter by use case (service_name)">
                <SelectValue placeholder="Filter by use case" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4}>
                {useCaseOptions.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Cards from /beckn-ext/stats response */}
      {selectedUseCase === "all" ? (
        <div className="space-y-5">
          {/* Overall totals strip */}
          <SummaryMetricCards
            values={cardValues}
            loading={isLoading}
            successRate={stats?.successRate}
          />

          {/* Per service_name cards */}
          <UseCaseCountList
            useCases={useCasesFromApi}
            totalCalls={cardValues.totalExternalApiCalls}
            loading={isLoading}
            onSelect={handleUseCaseChange}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-muted-foreground"
              onClick={() => handleUseCaseChange("all")}
            >
              <ArrowLeft size={14} />
              All use cases
            </Button>
            <Badge variant="outline" className="font-normal">
              {formatUseCaseLabel(selectedUseCase)}
              <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                ({selectedUseCase})
              </span>
            </Badge>
          </div>
          <SummaryMetricCards
            values={cardValues}
            loading={isLoading}
            subtitle={formatUseCaseLabel(selectedUseCase)}
            successRate={stats?.successRate}
          />
        </div>
      )}

      {/* API Call Logs */}
      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-border/50 bg-muted/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">API Call Logs</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="tabular-nums font-normal">
              {totalLogs.toLocaleString()} records
              {selectedUseCase !== "all"
                ? ` · ${formatUseCaseLabel(selectedUseCase)}`
                : ""}
            </Badge>
            <Button
              onClick={handleRefresh}
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
        <CardContent className="p-0 sm:p-0">
          {telemetryError ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="max-w-md space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  Unable to load API call logs
                </p>
                <p className="text-sm text-muted-foreground">
                  {(telemetryError as Error)?.message ||
                    "Something went wrong while loading data. Please try again."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
                />
                Try again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center items-center p-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">Loading API call logs...</p>
              </div>
            </div>
          ) : sortedLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No API call logs found
              {selectedUseCase !== "all"
                ? ` for ${formatUseCaseLabel(selectedUseCase)}`
                : ""}{" "}
              for the selected date range.
            </div>
          ) : (
            <div className="space-y-0">
              {/* ── Desktop table ── */}
              <div className="hidden md:block">
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-12 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        SL
                      </TableHead>
                      <TableHead
                        className={cn(
                          COMPACT_USE_CASE_COL,
                          "text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                        )}
                      >
                        Use Case
                      </TableHead>
                      <TableHead
                        className={cn(
                          COMPACT_METHOD_COL,
                          "text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                        )}
                      >
                        Method
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Endpoint
                      </TableHead>
                      <TableHead
                        className={cn(
                          COMPACT_STATUS_COL,
                          "text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                        )}
                      >
                        Success
                      </TableHead>
                      <TableHead
                        className={cn(
                          COMPACT_STATUS_COL,
                          "text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                        )}
                      >
                        Error
                      </TableHead>
                      <TableHead
                        className={cn(
                          COMPACT_LATENCY_COL,
                          "text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                        )}
                      >
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-0.5 hover:text-foreground"
                          onClick={() => handleSort("latencyMs")}
                        >
                          Latency (ms)
                          <SortIcon
                            active={sortKey === "latencyMs"}
                            order={sortOrder}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-0.5 hover:text-foreground"
                          onClick={() => handleSort("timestamp")}
                        >
                          Timestamp
                          <SortIcon
                            active={sortKey === "timestamp"}
                            order={sortOrder}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="w-[110px] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        View Details
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLogs.map((row: BecknExtLog, index) => {
                      const service = row.serviceName || row.useCase || "";
                      return (
                        <TableRow
                          key={
                            row.id ||
                            `${row.sessionId}-${row.questionId}-${index}`
                          }
                          className="border-border/40 transition-colors hover:bg-muted/30"
                        >
                          <TableCell className="text-center text-sm tabular-nums text-muted-foreground">
                            {(page - 1) * PAGE_SIZE + index + 1}
                          </TableCell>
                          <TableCell
                            className={cn(
                              COMPACT_USE_CASE_COL,
                              "align-middle text-center",
                            )}
                          >
                            <div className="flex justify-center">
                              <UseCaseChip value={service} />
                            </div>
                          </TableCell>
                          <TableCell className={cn(COMPACT_METHOD_COL, "text-center")}>
                            <div className="flex justify-center">
                              <MethodChip method={row.extApiMethod} />
                            </div>
                          </TableCell>
                          <TableCell className="max-w-0 text-center">
                            <p
                              className="truncate font-mono text-xs text-muted-foreground"
                              title={row.extApiUrl || undefined}
                            >
                              {row.extApiUrl || "—"}
                            </p>
                          </TableCell>
                          <TableCell className={cn(COMPACT_STATUS_COL, "text-center")}>
                            <div className="flex justify-center">
                              <StatusCodeCell
                                success={row.extApiSuccess}
                                statusCode={row.extApiStatusCode}
                                kind="success"
                              />
                            </div>
                          </TableCell>
                          <TableCell className={cn(COMPACT_STATUS_COL, "text-center")}>
                            <div className="flex justify-center">
                              <StatusCodeCell
                                success={row.extApiSuccess}
                                statusCode={row.extApiStatusCode}
                                kind="error"
                              />
                            </div>
                          </TableCell>
                          <TableCell className={cn(COMPACT_LATENCY_COL, "text-center text-sm")}>
                            <div className="flex justify-center">
                              <LatencyCell ms={row.extApiLatencyMs} />
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-center text-sm text-muted-foreground">
                            {formatTimestamp(row.startEts || row.createdAt)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-1.5 text-xs text-primary hover:text-primary"
                              disabled={!row.questionId}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (row.questionId) {
                                  const qs = row.sessionId
                                    ? `?sessionId=${encodeURIComponent(row.sessionId)}`
                                    : "";
                                  navigate(
                                    `/external-api/flow/${encodeURIComponent(row.questionId)}${qs}`,
                                  );
                                }
                              }}
                            >
                              <Eye size={14} />
                              View
                            </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile cards ── */}
              <div className="space-y-3 p-4 md:hidden">
                {sortedLogs.map((row: BecknExtLog, index) => {
                  const service = row.serviceName || row.useCase || "";
                  return (
                    <div
                      key={
                        row.id ||
                        `${row.sessionId}-${row.questionId}-m-${index}`
                      }
                      className="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          #{(page - 1) * PAGE_SIZE + index + 1}
                        </span>
                        <UseCaseChip value={service} />
                      </div>

                      <div className="flex items-center gap-2">
                        <MethodChip method={row.extApiMethod} />
                        <LatencyCell ms={row.extApiLatencyMs} />
                        <span className="text-xs text-muted-foreground">ms</span>
                      </div>

                      {row.extApiUrl && (
                        <p
                          className="truncate font-mono text-[11px] text-muted-foreground"
                          title={row.extApiUrl}
                        >
                          {row.extApiUrl}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <StatusCodeCell
                            success={row.extApiSuccess}
                            statusCode={row.extApiStatusCode}
                            kind="success"
                          />
                          <StatusCodeCell
                            success={row.extApiSuccess}
                            statusCode={row.extApiStatusCode}
                            kind="error"
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTimestamp(row.startEts || row.createdAt)}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                        disabled={!row.questionId}
                        onClick={() => {
                          if (row.questionId) {
                            const qs = row.sessionId
                              ? `?sessionId=${encodeURIComponent(row.sessionId)}`
                              : "";
                            navigate(
                              `/external-api/flow/${encodeURIComponent(row.questionId)}${qs}`,
                            );
                          }
                        }}
                      >
                        <Eye size={14} />
                        View Details
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 bg-muted/10 px-4 py-3">
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {totalLogs === 0
                      ? 0
                      : ((page - 1) * PAGE_SIZE + 1).toLocaleString()}
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
                    onClick={() => handlePageChange(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    Page {page} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => handlePageChange(page + 1)}
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
