import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Bell, CheckCircle2, MapPin, RefreshCw, Tag, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useTelemetryState } from "@/contexts/TelemetryStateContext";
import { buildDateRangeParams, formatUTCToIST } from "@/lib/utils";
import {
  fetchNotificationSummary,
  fetchNotifications,
  type NotificationEventGroup,
  type NotificationTelemetryEvent,
  type NotificationTelemetrySession,
} from "@/services/api";
import TablePagination from "@/components/TablePagination";
import DownloadCsvButton from "@/components/DownloadCsvButton";
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

type SortBy = "event_time" | "status_code";
type SortOrder = "asc" | "desc";

const EVENT_GROUP_LABELS: Record<NotificationEventGroup, string> = {
  location: "Location",
  notification_api: "Notification API",
  notification_actions: "Notification Actions",
  notification_feedback: "Notification Feedback",
  sessions: "Sessions",
};

const PAGE_SIZE = 10;

function formatEventName(eventName: string) {
  return eventName
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCompactId(value?: string) {
  if (!value) return "-";
  return value.length <= 8 ? value : `${value.slice(0, 6)}...`;
}

function statusLabel(row: NotificationTelemetryEvent) {
  if (row.status_code == null) return "-";
  return String(row.status_code);
}

function getStatusVariant(row: NotificationTelemetryEvent): "default" | "secondary" | "destructive" | "outline" {
  if (row.status_code == null) return "outline";
  return row.status_code === 200 ? "secondary" : "destructive";
}

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) return null;
  return order === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
}

function numberValue(value: string | number | undefined) {
  return Number(value || 0);
}

function numberCell(value: string | number | undefined) {
  return Number(value || 0).toLocaleString();
}

type SummaryCard = {
  label: string;
  value: number;
  icon: typeof Bell;
};

function getLocationSource(eventName: string) {
  if (eventName === "location_allowed" || eventName === "location_denied") {
    return "Custom Prompt";
  }

  if (eventName === "location_browser_allowed" || eventName === "location_browser_never_allow") {
    return "Browser Permission";
  }

  return "-";
}

const NotificationTelemetry = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRange } = useDateFilter();
  const { selectedStateId } = useTelemetryState();

  const eventGroup = (searchParams.get("eventGroup") || "notification_api") as NotificationEventGroup;
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const sortBy = (searchParams.get("sortBy") || "event_time") as SortBy;
  const sortOrder = (searchParams.get("sortOrder") || "desc") as SortOrder;

  const dateParams = useMemo(() => buildDateRangeParams(dateRange, {
    includeDefaultStart: false,
  }), [dateRange]);

  const queryParams = useMemo(() => ({
    ...dateParams,
    page,
    limit: PAGE_SIZE,
    eventGroup,
    sortBy,
    sortOrder,
  }), [dateParams, eventGroup, page, sortBy, sortOrder]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "notification-telemetry",
      selectedStateId,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      eventGroup,
      page,
      sortBy,
      sortOrder,
    ],
    enabled: !!selectedStateId,
    queryFn: () => fetchNotifications(queryParams),
    staleTime: 60 * 1000,
  });

  const { data: summary } = useQuery({
    queryKey: [
      "notification-telemetry-summary",
      selectedStateId,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    enabled: !!selectedStateId,
    queryFn: () => fetchNotificationSummary(dateParams),
    staleTime: 60 * 1000,
  });

  const rows = data?.data || [];
  const totalPages = data?.totalPages || 1;
  const totalRecords = data?.total || 0;
  const isSessionView = eventGroup === "sessions";

  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      next.set(key, value);
    });
    setSearchParams(next);
  };

  const handleEventGroupChange = (nextEventGroup: string) => {
    updateParams({
      eventGroup: nextEventGroup,
      page: "1",
    });
  };

  const handleSort = (nextSortBy: SortBy) => {
    const nextOrder = sortBy === nextSortBy && sortOrder === "desc" ? "asc" : "desc";
    updateParams({
      sortBy: nextSortBy,
      sortOrder: nextOrder,
      page: "1",
    });
  };

  const handlePageChange = (nextPage: number) => {
    updateParams({ page: String(nextPage) });
  };

  const cards: SummaryCard[] = useMemo(() => {
    switch (eventGroup) {
      case "location":
        return [
          { label: "Location Prompt Allowed", value: numberValue(summary?.location_prompt_allowed), icon: MapPin },
          { label: "Location Prompt Denied", value: numberValue(summary?.location_prompt_denied), icon: XCircle },
          { label: "Browser Location Allowed", value: numberValue(summary?.location_browser_allowed), icon: MapPin },
          { label: "Browser Location Denied", value: numberValue(summary?.location_browser_denied), icon: XCircle },
        ];
      case "notification_api":
        return [
          { label: "Notification API Success", value: numberValue(summary?.notification_api_success), icon: CheckCircle2 },
          { label: "API Calls", value: numberValue(summary?.notification_api_calls), icon: Bell },
          { label: "Total Notifications Returned", value: numberValue(summary?.total_notifications_returned), icon: Bell },
        ];
      case "notification_actions":
        return [
          { label: "Notification Bell", value: numberValue(summary?.notification_bell), icon: Bell },
          { label: "Notification Opens", value: numberValue(summary?.notification_opens), icon: Bell },
          { label: "Mark All Read", value: numberValue(summary?.mark_all_read), icon: CheckCircle2 },
        ];
      case "notification_feedback":
        return [
          { label: "Positive Feedback", value: numberValue(summary?.feedback_yes), icon: ThumbsUp },
          { label: "Negative Feedback", value: numberValue(summary?.feedback_no), icon: ThumbsDown },
          { label: "Negative Feedback Submitted", value: numberValue(summary?.negative_feedback_submitted), icon: ThumbsDown },
          ...(summary?.category_counts || []).map((category) => ({
            label: category.category_type,
            value: numberValue(category.count),
            icon: Tag,
          })),
        ];
      case "sessions":
        return [
          { label: "Total Sessions", value: numberValue(summary?.total_sessions), icon: Bell },
          { label: "Total Notifications Returned", value: numberValue(summary?.total_notifications_returned), icon: Bell },
          { label: "Total Bell Clicks", value: numberValue(summary?.notification_bell), icon: Bell },
          { label: "Total Notification Opens", value: numberValue(summary?.notification_opens), icon: Bell },
          { label: "Total Likes", value: numberValue(summary?.feedback_yes), icon: ThumbsUp },
          { label: "Total Dislikes", value: numberValue(summary?.feedback_no), icon: ThumbsDown },
        ];
      default:
        return [];
    }
  }, [eventGroup, summary]);

  const showStatusColumns = eventGroup === "notification_api";
  const showLocationColumns = eventGroup === "location";
  const showActionColumns = eventGroup === "notification_actions";
  const showFeedbackColumns = eventGroup === "notification_feedback";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notification</h1>
            <p className="text-sm text-muted-foreground">
              Location, notification API, notification actions, and feedback telemetry
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <DownloadCsvButton
            moduleName="notifications"
            filters={{
              eventGroup,
              sortBy,
              sortOrder,
            }}
            disabled={isLoading}
          />
          <div className="w-full md:w-72">
          <Select value={eventGroup} onValueChange={handleEventGroupChange}>
            <SelectTrigger>
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_GROUP_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>
      </div>

      <div className={eventGroup === "location" ? "grid gap-4 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold">{card.value.toLocaleString()}</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon size={17} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {EVENT_GROUP_LABELS[eventGroup]}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {data?.total ? `${data.total.toLocaleString()} records` : ""}
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-12 bg-muted/30 rounded-lg">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {isSessionView ? "Loading notification sessions..." : "Loading notification telemetry..."}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">
              {isSessionView
                ? "Unable to load notification sessions right now."
                : "Unable to load notification telemetry right now."}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              {isSessionView
                ? "No notification sessions available for the selected global date range."
                : "No notification telemetry available for the selected global date range."}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-md border">
                <Table className={isSessionView ? "min-w-[1180px]" : showFeedbackColumns ? "min-w-[1500px]" : undefined}>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">
                        <Button variant="ghost" className="h-auto p-0 font-semibold" onClick={() => handleSort("event_time")}>
                          {isSessionView ? "Session Time" : "Time"}
                          <SortIcon active={sortBy === "event_time"} order={sortOrder} />
                        </Button>
                      </TableHead>
                      <TableHead className="whitespace-nowrap">Fingerprint ID</TableHead>
                      <TableHead className="whitespace-nowrap">SID</TableHead>
                      {isSessionView ? (
                        <>
                          <TableHead className="whitespace-nowrap text-right">Total Notifications Returned</TableHead>
                          <TableHead className="whitespace-nowrap text-right">Bell Clicks</TableHead>
                          <TableHead className="whitespace-nowrap text-right">Notification Opens</TableHead>
                          <TableHead className="whitespace-nowrap text-right">Like</TableHead>
                          <TableHead className="whitespace-nowrap text-right">Dislike</TableHead>
                          <TableHead className="whitespace-nowrap text-right">Negative Feedback Submitted</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Category</TableHead>
                          <TableHead>Event</TableHead>
                        </>
                      )}
                      {showStatusColumns && (
                        <>
                          <TableHead>
                            <Button variant="ghost" className="h-auto p-0 font-semibold" onClick={() => handleSort("status_code")}>
                              Status
                              <SortIcon active={sortBy === "status_code"} order={sortOrder} />
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">Response Count</TableHead>
                        </>
                      )}
                      {showLocationColumns && (
                        <>
                          <TableHead>Source</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Reason</TableHead>
                        </>
                      )}
                      {showActionColumns && (
                        <TableHead>Notification ID</TableHead>
                      )}
                      {showFeedbackColumns && (
                        <>
                          <TableHead>Notification ID</TableHead>
                          <TableHead>Message Type</TableHead>
                          <TableHead>Category Type</TableHead>
                          <TableHead>Notification Description</TableHead>
                          <TableHead>Feedback Type</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Feedback</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isSessionView
                      ? rows.map((row) => {
                          const sessionRow = row as unknown as NotificationTelemetrySession;
                          return (
                            <TableRow key={sessionRow.sid}>
                              <TableCell className="whitespace-nowrap">
                                {sessionRow.session_time ? formatUTCToIST(sessionRow.session_time, "MMM dd, yyyy hh:mm a") : "-"}
                              </TableCell>
                              <TableCell className="max-w-[120px] font-mono text-xs" title={sessionRow.fingerprint_id || ""}>
                                {formatCompactId(sessionRow.fingerprint_id)}
                              </TableCell>
                              <TableCell className="max-w-[120px] font-mono text-xs" title={sessionRow.sid || ""}>
                                {formatCompactId(sessionRow.sid)}
                              </TableCell>
                              <TableCell className="text-right">{numberCell(sessionRow.total_notifications_returned)}</TableCell>
                              <TableCell className="text-right">{numberCell(sessionRow.bell_clicks)}</TableCell>
                              <TableCell className="text-right">{numberCell(sessionRow.notification_opens)}</TableCell>
                              <TableCell className="text-right">{numberCell(sessionRow.like_count)}</TableCell>
                              <TableCell className="text-right">{numberCell(sessionRow.dislike_count)}</TableCell>
                              <TableCell className="text-right">{numberCell(sessionRow.negative_feedback_submitted)}</TableCell>
                            </TableRow>
                          );
                        })
                      : rows.map((row) => (
                          <TableRow
                            key={row.id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/notifications/${row.id}`)}
                          >
                            <TableCell className="whitespace-nowrap">
                              {row.event_time ? formatUTCToIST(row.event_time, "MMM dd, yyyy hh:mm a") : "-"}
                            </TableCell>
                            <TableCell className="max-w-[120px] font-mono text-xs" title={row.fingerprint_id || ""}>
                              {formatCompactId(row.fingerprint_id)}
                            </TableCell>
                            <TableCell className="max-w-[120px] font-mono text-xs" title={row.sid || ""}>
                              {formatCompactId(row.sid)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{formatEventName(row.category)}</Badge>
                            </TableCell>
                            <TableCell className="font-medium whitespace-nowrap">
                              {formatEventName(row.event_name)}
                            </TableCell>
                            {showStatusColumns && (
                              <>
                                <TableCell>
                                  <Badge variant={getStatusVariant(row)}>{statusLabel(row)}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.response_count ?? "-"}
                                </TableCell>
                              </>
                            )}
                            {showLocationColumns && (
                              <>
                                <TableCell>{getLocationSource(row.event_name)}</TableCell>
                                <TableCell>{row.action || "-"}</TableCell>
                                <TableCell>{row.reason || "-"}</TableCell>
                              </>
                            )}
                            {showActionColumns && (
                              <TableCell className="max-w-[160px] truncate font-mono text-xs">
                                {row.notification_id || "-"}
                              </TableCell>
                            )}
                            {showFeedbackColumns && (
                              <>
                                <TableCell className="max-w-[160px] truncate font-mono text-xs">
                                  {row.notification_id || "-"}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {row.message_type || "-"}
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                  {row.category_type || "-"}
                                </TableCell>
                                <TableCell className="max-w-[280px] truncate" title={row.notification_description || ""}>
                                  {row.notification_description || "-"}
                                </TableCell>
                                <TableCell>{formatEventName(row.event_name)}</TableCell>
                                <TableCell>{row.reason || "-"}</TableCell>
                                <TableCell className="max-w-[260px] truncate">
                                  {row.feedback || "-"}
                                </TableCell>
                              </>
                            )}
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {((page - 1) * PAGE_SIZE + 1).toLocaleString()}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(page * PAGE_SIZE, totalRecords).toLocaleString()}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {totalRecords.toLocaleString()}
                  </span>{" "}
                  {isSessionView ? "notification sessions" : "notification records"}
                </p>
                <TablePagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationTelemetry;
