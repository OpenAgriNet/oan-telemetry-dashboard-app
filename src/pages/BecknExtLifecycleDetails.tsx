import { useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Globe,
  Network,
  Play,
  RefreshCw,
  Square,
  XCircle,
} from "lucide-react";
import {
  fetchBecknExtLifecycle,
  type BecknExtLifecycle,
  type BecknExtLifecycleStep,
} from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/25",
  POST: "bg-violet-500/15 text-violet-700 dark:text-violet-300 ring-violet-500/25",
  PUT: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/25",
  PATCH: "bg-orange-500/15 text-orange-700 dark:text-orange-300 ring-orange-500/25",
  DELETE: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/25",
};

const STEP_THEME: Record<
  string,
  { ring: string; bg: string; line: string; accent: string; glow: string }
> = {
  flow_start: {
    ring: "border-sky-500 text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
    line: "from-sky-500/60 to-sky-500/10",
    accent: "border-l-sky-500",
    glow: "from-sky-500/10",
  },
  ext_api: {
    ring: "border-violet-500 text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    line: "from-violet-500/60 to-violet-500/10",
    accent: "border-l-violet-500",
    glow: "from-violet-500/10",
  },
  beckn_network: {
    ring: "border-amber-500 text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    line: "from-amber-500/60 to-amber-500/10",
    accent: "border-l-amber-500",
    glow: "from-amber-500/10",
  },
  flow_end: {
    ring: "border-emerald-500 text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    line: "from-emerald-500/60 to-emerald-500/10",
    accent: "border-l-emerald-500",
    glow: "from-emerald-500/10",
  },
};

const STEP_ICON = {
  flow_start: Play,
  ext_api: Globe,
  beckn_network: Network,
  flow_end: Square,
} as const;

function formatPayload(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  try {
    if (typeof value === "string") {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function useCaseLabel(name: string | null | undefined): string {
  if (!name) return "External API";
  return name
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

/** Beckn BAP paths like /mobility/search → /search */
function formatBecknDisplayPath(path: string | null | undefined): string {
  if (!path) return "";
  const raw = path.trim();
  if (!raw) return "";

  let pathname = raw;
  try {
    if (/^https?:\/\//i.test(raw)) {
      pathname = new URL(raw).pathname;
    }
  } catch {
    pathname = raw;
  }

  pathname = pathname.split("?")[0].split("#")[0];
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length >= 2) {
    return `/${segments[segments.length - 1]}`;
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

function MethodChip({ method }: { method: string | null | undefined }) {
  if (!method) return null;
  const upper = method.toUpperCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold tracking-wide ring-1 ring-inset",
        METHOD_STYLES[upper] ?? "bg-muted text-muted-foreground ring-border",
      )}
    >
      {upper}
    </span>
  );
}

function LatencyBadge({ ms }: { ms: number | null | undefined }) {
  if (ms == null) return null;
  const tone =
    ms > 2000
      ? "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400"
      : ms > 800
        ? "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300"
        : "bg-muted/80 text-muted-foreground ring-border/60";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums ring-1 ring-inset",
        tone,
      )}
    >
      <Clock size={12} />
      {ms.toLocaleString()} ms
    </span>
  );
}

function StatusPill({ ok }: { ok: boolean | null }) {
  if (ok === true) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-500/25 dark:text-emerald-300">
        <CheckCircle2 size={13} />
        Success
      </span>
    );
  }
  if (ok === false) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-500/25 dark:text-rose-300">
        <XCircle size={13} />
        Failed
      </span>
    );
  }
  return null;
}

function MetaChip({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/80 px-2.5 py-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-xs font-medium text-foreground break-all",
          mono && "font-mono text-[11px]",
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function CollapsibleJson({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const formatted = useMemo(() => formatPayload(value), [value]);

  if (!formatted) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-border/60 bg-background/60">
      <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/30 px-3 py-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span>{label}</span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-[10px]"
          onClick={handleCopy}
        >
          <Copy size={12} className="mr-1" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      {open && (
        <pre className="max-h-[32rem] overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-relaxed text-foreground">
          {formatted}
        </pre>
      )}
    </div>
  );
}

function StepProgressStrip({ steps }: { steps: BecknExtLifecycleStep[] }) {
  return (
    <div className="flex w-full items-center gap-2 py-1">
      {steps.map((step, i) => {
        const theme = STEP_THEME[step.type] ?? STEP_THEME.ext_api;
        const failed = step.success === false;
        const ok = step.success === true;
        return (
          <div key={`${step.type}-${i}`} className="contents">
            <div
              className={cn(
                "min-w-0 flex-1 rounded-lg border px-3 py-2 text-center transition-colors",
                failed
                  ? "border-rose-500/40 bg-rose-500/5"
                  : ok
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : cn("border-border/60", theme.bg),
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Step {i + 1}
              </p>
              <p className="mt-0.5 truncate text-xs font-medium">{step.label}</p>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight
                size={14}
                className="hidden shrink-0 text-muted-foreground/50 sm:block"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TimelineStep({
  step,
  index,
  isLast,
}: {
  step: BecknExtLifecycleStep;
  index: number;
  isLast: boolean;
}) {
  const theme = STEP_THEME[step.type] ?? STEP_THEME.ext_api;
  const Icon = STEP_ICON[step.type as keyof typeof STEP_ICON] ?? Globe;
  const failed = step.success === false;
  const meta = step.meta || {};
  const hasPayloads =
    step.requestPayload != null || step.responsePayload != null;

  const metaItems =
    step.type === "flow_start"
      ? [
          { label: "Session", value: meta.sessionId as string, mono: true },
          { label: "Use case", value: meta.serviceName as string },
          { label: "Route", value: meta.routeName as string },
          { label: "Beckn action", value: meta.becknAction as string },
          { label: "Domain", value: meta.becknDomain as string },
          {
            label: "Request path",
            value: formatBecknDisplayPath(meta.requestPath as string),
            mono: true,
          },
        ].filter((i) => i.value)
      : [];

  return (
    <div className="relative flex gap-4">
      <div className="flex w-10 shrink-0 flex-col items-center">
        <div
          className={cn(
            "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-sm",
            failed
              ? "border-rose-500 bg-rose-500/10 text-rose-600"
              : cn(theme.ring, theme.bg),
          )}
        >
          <Icon size={16} strokeWidth={2} />
        </div>
        {!isLast && (
          <div
            className={cn(
              "mt-2 w-0.5 flex-1 min-h-[2rem] rounded-full bg-gradient-to-b",
              theme.line,
            )}
          />
        )}
      </div>

      <div className={cn("min-w-0 flex-1", !isLast && "pb-8")}>
        <div
          className={cn(
            "group relative overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md",
            "border-l-[3px]",
            failed ? "border-l-rose-500" : theme.accent,
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br to-transparent opacity-80",
              theme.glow,
            )}
          />

          <div className="relative border-b border-border/40 bg-muted/20 px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {index + 1}
                  </span>
                  <h3 className="text-sm font-semibold tracking-tight">
                    {step.label}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill ok={step.success} />
                <MethodChip method={step.method} />
                {step.httpStatus != null && (
                  <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
                    {step.httpStatus}
                  </span>
                )}
                <LatencyBadge ms={step.latencyMs} />
              </div>
            </div>

            {step.endpointUrl && (
              <p
                className="mt-2 truncate rounded-md bg-background/70 px-2 py-1 font-mono text-[11px] text-muted-foreground"
                title={step.endpointUrl}
              >
                {step.type === "beckn_network"
                  ? formatBecknDisplayPath(step.endpointUrl)
                  : step.endpointUrl}
              </p>
            )}
          </div>

          <div className="relative space-y-3 px-4 py-3">
            {metaItems.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {metaItems.map((item) => (
                  <MetaChip
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    mono={item.mono}
                  />
                ))}
              </div>
            )}

            {step.type === "flow_end" && meta.flowStatus != null && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="font-normal">
                  Status: {String(meta.flowStatus)}
                </Badge>
                {meta.durationMs != null && (
                  <Badge variant="secondary" className="tabular-nums font-normal">
                    Total {Number(meta.durationMs).toLocaleString()} ms
                  </Badge>
                )}
              </div>
            )}

            {step.errorMessage && (
              <div className="flex gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span className="break-all text-xs">{step.errorMessage}</span>
              </div>
            )}

            {hasPayloads && (
              <div className="grid min-w-0 gap-2 lg:grid-cols-2">
                <CollapsibleJson label="Request" value={step.requestPayload} />
                <CollapsibleJson label="Response" value={step.responsePayload} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const BecknExtLifecycleDetails = () => {
  const { questionId } = useParams();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("sessionId") || undefined;
  const navigate = useNavigate();

  const {
    data: lifecycle,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["beckn-ext-lifecycle", questionId, sessionId],
    queryFn: () =>
      fetchBecknExtLifecycle({
        questionId: questionId || "",
        sessionId,
      }),
    enabled: !!questionId,
    retry: 1,
    staleTime: 30 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-20">
        <RefreshCw className="h-8 w-8 animate-spin text-primary/70" />
        <p className="text-sm text-muted-foreground">Loading API flow…</p>
      </div>
    );
  }

  if (error || !lifecycle) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="max-w-md space-y-1 px-4">
          <p className="font-semibold">Unable to load flow details</p>
          <p className="text-sm text-muted-foreground">
            {(error as Error)?.message || "Please try again."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/external-api")}
          >
            Back to list
          </Button>
        </div>
      </div>
    );
  }

  return <LifecycleView lifecycle={lifecycle} onRefresh={() => refetch()} isFetching={isFetching} onBack={() => navigate("/external-api")} />;
};

function LifecycleView({
  lifecycle,
  onRefresh,
  isFetching,
  onBack,
}: {
  lifecycle: BecknExtLifecycle;
  onRefresh: () => void;
  isFetching: boolean;
  onBack: () => void;
}) {
  const overallOk = lifecycle.summary?.overallSuccess;
  const steps = lifecycle.steps;
  const extStep = steps.find((s) => s.type === "ext_api");
  const becknStep = steps.find((s) => s.type === "beckn_network");

  return (
    <div className="w-full space-y-5">
      {/* Header */}
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm">
        <div
          className={cn(
            "h-1 w-full bg-gradient-to-r",
            overallOk
              ? "from-emerald-500 via-green-400 to-teal-400"
              : "from-rose-500 via-red-400 to-orange-400",
          )}
        />
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={onBack}
            >
              <ArrowLeft size={16} />
            </Button>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <Activity size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight">
                {useCaseLabel(lifecycle.serviceName)}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                API lifecycle trace
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={overallOk ? "secondary" : "destructive"}>
                  {overallOk ? "Overall success" : "Overall failed"}
                </Badge>
                {lifecycle.summary?.durationMs != null && (
                  <Badge variant="outline" className="tabular-nums font-normal">
                    {lifecycle.summary.durationMs.toLocaleString()} ms total
                  </Badge>
                )}
                {becknStep?.latencyMs != null && (
                  <Badge variant="outline" className="font-normal">
                    Beckn {becknStep.latencyMs.toLocaleString()} ms
                  </Badge>
                )}
                {extStep?.latencyMs != null && (
                  <Badge variant="outline" className="font-normal">
                    Ext {extStep.latencyMs.toLocaleString()} ms
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isFetching}
            className="shrink-0"
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Step strip */}
      <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm backdrop-blur-sm">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Flow overview
        </p>
        <StepProgressStrip steps={steps} />
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-border/60 bg-card/50 p-4 shadow-sm sm:p-6">
        <p className="mb-5 text-sm font-semibold">Step-by-step trace</p>
        {steps.map((step, index) => (
          <TimelineStep
            key={`${step.type}-${index}`}
            step={step}
            index={index}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>

      {(lifecycle.summary?.startEtsIst || lifecycle.summary?.endEtsIst) && (
        <p className="text-center text-xs text-muted-foreground">
          {lifecycle.summary.startEtsIst}
          {lifecycle.summary.endEtsIst
            ? ` → ${lifecycle.summary.endEtsIst}`
            : ""}
        </p>
      )}
    </div>
  );
}

export default BecknExtLifecycleDetails;