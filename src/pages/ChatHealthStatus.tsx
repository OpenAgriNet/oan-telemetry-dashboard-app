import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchLatestStatus,
  fetchHealthHistory,
  type HealthCheckRecord,
  type LatestStatusData,
} from "@/services/chatHealthApi";
import { cn } from "@/lib/utils";
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Mic,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const REFETCH_INTERVAL = 60_000; // auto-refresh every 60s
const HISTORY_LIMIT = 200;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status?: string) {
  switch (status) {
    case "up":
      return "text-emerald-500";
    case "degraded":
      return "text-amber-500";
    case "down":
      return "text-red-500";
    default:
      return "text-muted-foreground";
  }
}

function statusBg(status?: string) {
  switch (status) {
    case "up":
      return "bg-emerald-500";
    case "degraded":
      return "bg-amber-500";
    case "down":
      return "bg-red-500";
    default:
      return "bg-muted";
  }
}

function statusBgLight(status?: string) {
  switch (status) {
    case "up":
      return "bg-emerald-500/10";
    case "degraded":
      return "bg-amber-500/10";
    case "down":
      return "bg-red-500/10";
    default:
      return "bg-muted";
  }
}

function statusIcon(status?: string, size = 20) {
  switch (status) {
    case "up":
      return <CheckCircle2 size={size} className="text-emerald-500" />;
    case "degraded":
      return <AlertTriangle size={size} className="text-amber-500" />;
    case "down":
      return <XCircle size={size} className="text-red-500" />;
    default:
      return <Clock size={size} className="text-muted-foreground" />;
  }
}

function statusLabel(status?: string) {
  switch (status) {
    case "up":
      return "Operational";
    case "degraded":
      return "Degraded";
    case "down":
      return "Down";
    default:
      return "Unknown";
  }
}

function overallStatus(chat?: string | null, voice?: string | null): string {
  if (chat === "down" || voice === "down") return "down";
  if (chat === "degraded" || voice === "degraded") return "degraded";
  if (chat === "up" && voice === "up") return "up";
  if (chat === "up" || voice === "up") return "up";
  return "unknown";
}

function overallBanner(status: string) {
  switch (status) {
    case "up":
      return {
        bg: "bg-emerald-500/10 border-emerald-500/20",
        text: "All Systems Operational",
        icon: <CheckCircle2 size={24} className="text-emerald-500" />,
      };
    case "degraded":
      return {
        bg: "bg-amber-500/10 border-amber-500/20",
        text: "Partial System Degradation",
        icon: <AlertTriangle size={24} className="text-amber-500" />,
      };
    case "down":
      return {
        bg: "bg-red-500/10 border-red-500/20",
        text: "System Outage Detected",
        icon: <XCircle size={24} className="text-red-500" />,
      };
    default:
      return {
        bg: "bg-muted border-border",
        text: "Status Unknown",
        icon: <Clock size={24} className="text-muted-foreground" />,
      };
  }
}

function formatTime(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function relativeTime(iso?: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Group history into 15-min slots for uptime bar ───────────────────────────

interface TimeSlot {
  time: Date;
  status: "up" | "degraded" | "down" | "no-data";
  checks: HealthCheckRecord[];
}

function buildTimeSlots(
  records: HealthCheckRecord[],
  hours: number
): TimeSlot[] {
  const now = new Date();
  const slotMinutes = 15;
  const totalSlots = Math.floor((hours * 60) / slotMinutes);
  const slots: TimeSlot[] = [];

  for (let i = totalSlots - 1; i >= 0; i--) {
    const slotEnd = new Date(now.getTime() - i * slotMinutes * 60000);
    const slotStart = new Date(slotEnd.getTime() - slotMinutes * 60000);

    const slotChecks = records.filter((r) => {
      const t = new Date(r.checked_at).getTime();
      return t >= slotStart.getTime() && t < slotEnd.getTime();
    });

    let status: TimeSlot["status"] = "no-data";
    if (slotChecks.length > 0) {
      const hasDown = slotChecks.some((c) => c.status === "down");
      const hasDegraded = slotChecks.some((c) => c.status === "degraded");
      if (hasDown) status = "down";
      else if (hasDegraded) status = "degraded";
      else status = "up";
    }

    slots.push({ time: slotEnd, status, checks: slotChecks });
  }

  return slots;
}

// ─── Main Component ──────────────────────────────────────────────────────────

const ChatHealthStatusPage: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ["chat-health-status"],
    queryFn: fetchLatestStatus,
    refetchInterval: REFETCH_INTERVAL,
  });

  const historyQuery = useQuery({
    queryKey: ["chat-health-history"],
    queryFn: () => fetchHealthHistory(HISTORY_LIMIT),
    refetchInterval: REFETCH_INTERVAL,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([statusQuery.refetch(), historyQuery.refetch()]);
    setTimeout(() => setIsRefreshing(false), 500);
  }, [statusQuery, historyQuery]);

  // Split history by api_type
  const { chatHistory, voiceHistory } = useMemo(() => {
    const all = historyQuery.data?.data || [];
    return {
      chatHistory: all.filter((r) => r.api_type === "chat"),
      voiceHistory: all.filter((r) => r.api_type === "voice"),
    };
  }, [historyQuery.data]);

  const chatSlots = useMemo(() => buildTimeSlots(chatHistory, 24), [chatHistory]);
  const voiceSlots = useMemo(() => buildTimeSlots(voiceHistory, 24), [voiceHistory]);

  const chatLatest = statusQuery.data?.data?.chat;
  const voiceLatest = statusQuery.data?.data?.voice;
  const overall = overallStatus(chatLatest?.status, voiceLatest?.status);
  const banner = overallBanner(overall);

  const isLoading = statusQuery.isLoading || historyQuery.isLoading;

  // Compute uptime percentages
  const uptimePercent = (slots: TimeSlot[]) => {
    const withData = slots.filter((s) => s.status !== "no-data");
    if (withData.length === 0) return null;
    const up = withData.filter((s) => s.status === "up").length;
    return ((up / withData.length) * 100).toFixed(2);
  };

  return (
    <div className="h-screen overflow-y-auto bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity size={24} className="text-primary" />
              <div>
                <h1 className="text-lg font-semibold leading-tight">
                  Bharat-VISTAAR
                </h1>
                <p className="text-xs text-muted-foreground">System Status</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={cn(isRefreshing && "animate-spin")}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Overall banner */}
        <div
          className={cn(
            "rounded-lg border p-4 flex items-center gap-3",
            banner.bg
          )}
        >
          {banner.icon}
          <div className="flex-1">
            <p className="font-semibold">{banner.text}</p>
            {statusQuery.dataUpdatedAt && (
              <p className="text-xs text-muted-foreground">
                Last checked:{" "}
                {formatTime(
                  chatLatest?.checkedAt || voiceLatest?.checkedAt
                )}{" "}
                ({relativeTime(chatLatest?.checkedAt || voiceLatest?.checkedAt)})
              </p>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        )}

        {/* Service cards */}
        {!isLoading && (
          <div className="space-y-4">
            <ServiceCard
              label="Chat API"
              description="Text-based conversational AI"
              icon={<MessageSquare size={20} />}
              latest={chatLatest}
              slots={chatSlots}
              uptimePercent={uptimePercent(chatSlots)}
              records={chatHistory}
              expanded={expandedService === "chat"}
              onToggle={() =>
                setExpandedService(
                  expandedService === "chat" ? null : "chat"
                )
              }
            />
            <ServiceCard
              label="Voice API"
              description="Voice-based conversational AI"
              icon={<Mic size={20} />}
              latest={voiceLatest}
              slots={voiceSlots}
              uptimePercent={uptimePercent(voiceSlots)}
              records={voiceHistory}
              expanded={expandedService === "voice"}
              onToggle={() =>
                setExpandedService(
                  expandedService === "voice" ? null : "voice"
                )
              }
            />
          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-border pt-6 pb-8 text-center text-xs text-muted-foreground">
          <p>
            Health checks run every 15 minutes &middot; Powered by Bharat-VISTAAR
          </p>
        </footer>
      </main>
    </div>
  );
};

// ─── ServiceCard ──────────────────────────────────────────────────────────────

interface ServiceCardProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  latest: LatestStatusData | null | undefined;
  slots: TimeSlot[];
  uptimePercent: string | null;
  records: HealthCheckRecord[];
  expanded: boolean;
  onToggle: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  label,
  description,
  icon,
  latest,
  slots,
  uptimePercent,
  records,
  expanded,
  onToggle,
}) => {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              statusBgLight(latest?.status)
            )}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{label}</h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  statusBgLight(latest?.status),
                  statusColor(latest?.status)
                )}
              >
                {statusIcon(latest?.status, 12)}
                {statusLabel(latest?.status)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {latest?.responseTime != null && (
            <div className="hidden sm:block text-right">
              <p className="text-xs text-muted-foreground">Response</p>
              <p className="text-sm font-mono font-medium">
                {latest.responseTime}ms
              </p>
            </div>
          )}
          {uptimePercent != null && (
            <div className="hidden sm:block text-right">
              <p className="text-xs text-muted-foreground">Uptime (24h)</p>
              <p className="text-sm font-mono font-medium">{uptimePercent}%</p>
            </div>
          )}
          {expanded ? (
            <ChevronUp size={18} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={18} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Uptime bar – always visible */}
      <div className="px-4 pb-3 sm:px-5">
        <UptimeBar slots={slots} />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>24 hours ago</span>
          <span>Now</span>
        </div>
      </div>

      {/* Expandable details */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 sm:px-5 space-y-4">
          {/* Latest check summary */}
          {latest && (
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Status Code</p>
                <p className="font-mono font-medium">
                  {latest.statusCode ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Response Time</p>
                <p className="font-mono font-medium">
                  {latest.responseTime}ms
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Checked</p>
                <p className="font-medium">{relativeTime(latest.checkedAt)}</p>
              </div>
            </div>
          )}
          {latest?.errorMessage && (
            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-600 dark:text-red-400">
              <p className="font-medium text-xs mb-1">Error</p>
              <p className="text-xs font-mono break-all">
                {latest.errorMessage}
              </p>
            </div>
          )}

          {/* Recent checks table */}
          <div>
            <h4 className="text-sm font-semibold mb-2">
              Recent Checks ({records.length})
            </h4>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Time</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-left font-medium">Code</th>
                    <th className="px-3 py-2 text-left font-medium">Response</th>
                  </tr>
                </thead>
                <tbody>
                  {records.slice(0, 30).map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-border hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-3 py-2 whitespace-nowrap font-mono">
                        {new Date(r.checked_at).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                            statusBgLight(r.status),
                            statusColor(r.status)
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              statusBg(r.status)
                            )}
                          />
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {r.status_code ?? "—"}
                      </td>
                      <td className="px-3 py-2 font-mono">
                        {r.response_time}ms
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-muted-foreground"
                      >
                        No health check records yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── UptimeBar ────────────────────────────────────────────────────────────────

interface UptimeBarProps {
  slots: TimeSlot[];
}

const UptimeBar: React.FC<UptimeBarProps> = ({ slots }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="relative">
      <div className="flex gap-[1px] sm:gap-[2px]">
        {slots.map((slot, idx) => (
          <div
            key={idx}
            className="relative group flex-1"
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div
              className={cn(
                "h-7 sm:h-8 rounded-[2px] transition-all cursor-pointer",
                slot.status === "up" && "bg-emerald-500 hover:bg-emerald-400",
                slot.status === "degraded" && "bg-amber-500 hover:bg-amber-400",
                slot.status === "down" && "bg-red-500 hover:bg-red-400",
                slot.status === "no-data" && "bg-muted hover:bg-muted-foreground/20"
              )}
            />
            {/* Tooltip */}
            {hoveredIdx === idx && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none">
                <div className="rounded-md bg-popover border border-border shadow-lg px-3 py-2 text-xs whitespace-nowrap">
                  <p className="font-medium">
                    {slot.time.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className={cn("font-semibold", statusColor(slot.status))}>
                    {slot.status === "no-data"
                      ? "No data"
                      : statusLabel(slot.status)}
                  </p>
                  {slot.checks.length > 0 && (
                    <p className="text-muted-foreground">
                      {slot.checks.length} check
                      {slot.checks.length > 1 ? "s" : ""} &middot;{" "}
                      {Math.round(
                        slot.checks.reduce(
                          (a, c) => a + c.response_time,
                          0
                        ) / slot.checks.length
                      )}
                      ms avg
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHealthStatusPage;
