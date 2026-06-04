import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Bell, CheckCircle2, MapPin, RefreshCw, ThumbsDown, ThumbsUp, XCircle } from "lucide-react";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useTelemetryState } from "@/contexts/TelemetryStateContext";
import { buildDateRangeParams, formatUTCToIST } from "@/lib/utils";
import {
  fetchNotificationSummary,
  fetchNotifications,
  type NotificationEventGroup,
  type NotificationTelemetryEvent,
} from "@/services/api";
import TablePagination from "@/components/TablePagination";
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

function getMetadataObject(row: NotificationTelemetryEvent, key: string) {
  const value = row.metadata?.[key];
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function getNotificationPreview(row: NotificationTelemetryEvent) {
  const detail = getMetadataObject(row, "notification_detail");
  if (!detail) return "-";

  const title = detail.title || detail.heading || detail.notification_title || detail.name;
  const body = detail.body || detail.message || detail.description || detail.text || detail.content;
  return [title, body].filter(Boolean).map(String).join(" - ") || row.notification_id || "-";
}

function numberValue(value: string | number | undefined) {
  return Number(value || 0);
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

  const cards = [
    { label: "Location Allowed", value: numberValue(summary?.location_allowed), icon: MapPin },
    { label: "Location Denied", value: numberValue(summary?.location_denied), icon: XCircle },
    { label: "Notification API Success", value: numberValue(summary?.notification_api_success), icon: CheckCircle2 },
    { label: "Notification Panel", value: numberValue(summary?.notification_panel), icon: Bell },
    { label: "Feedback Yes", value: numberValue(summary?.feedback_yes), icon: ThumbsUp },
    { label: "Feedback No", value: numberValue(summary?.feedback_no), icon: ThumbsDown },
  ];

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
                <p className="text-muted-foreground">Loading notification telemetry...</p>
              </div>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">
              Unable to load notification telemetry right now.
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No notification telemetry available for the selected global date range.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" className="h-auto p-0 font-semibold" onClick={() => handleSort("event_time")}>
                          Time
                          <SortIcon active={sortBy === "event_time"} order={sortOrder} />
                        </Button>
                      </TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Fingerprint ID</TableHead>
                      <TableHead>SID</TableHead>
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
                          <TableHead>Action</TableHead>
                          <TableHead>Reason</TableHead>
                        </>
                      )}
                      {showActionColumns && (
                        <>
                          <TableHead>Notification ID</TableHead>
                          <TableHead>Notification Detail</TableHead>
                        </>
                      )}
                      {showFeedbackColumns && (
                        <>
                          <TableHead>Notification ID</TableHead>
                          <TableHead>Feedback Type</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Feedback</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/notifications/${row.id}`)}
                      >
                        <TableCell className="whitespace-nowrap">
                          {row.event_time ? formatUTCToIST(row.event_time, "MMM dd, yyyy hh:mm a") : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{formatEventName(row.category)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatEventName(row.event_name)}
                        </TableCell>
                        <TableCell className="max-w-[120px] font-mono text-xs" title={row.fingerprint_id || ""}>
                          {formatCompactId(row.fingerprint_id)}
                        </TableCell>
                        <TableCell className="max-w-[120px] font-mono text-xs" title={row.sid || ""}>
                          {formatCompactId(row.sid)}
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
                            <TableCell>{row.action || "-"}</TableCell>
                            <TableCell>{row.reason || "-"}</TableCell>
                          </>
                        )}
                        {showActionColumns && (
                          <>
                            <TableCell className="max-w-[160px] truncate font-mono text-xs">
                              {row.notification_id || "-"}
                            </TableCell>
                            <TableCell className="max-w-[320px] truncate">
                              {getNotificationPreview(row)}
                            </TableCell>
                          </>
                        )}
                        {showFeedbackColumns && (
                          <>
                            <TableCell className="max-w-[160px] truncate font-mono text-xs">
                              {row.notification_id || "-"}
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
                  notification records
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
