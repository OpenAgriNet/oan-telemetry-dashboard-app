import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Bell, RefreshCw } from "lucide-react";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useTelemetryState } from "@/contexts/TelemetryStateContext";
import { buildDateRangeParams, formatUTCToIST } from "@/lib/utils";
import {
  fetchUiEvents,
  type UiEventCategory,
  type UiInteractionEvent,
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

const CATEGORY_LABELS: Record<UiEventCategory, string> = {
  all: "All",
  location: "Location",
  notification: "Notification",
  notification_feedback: "Notification Feedback",
};

const PAGE_SIZE = 10;

function formatEventName(eventName: string) {
  return eventName
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusLabel(row: UiInteractionEvent) {
  if (row.status_code == null && row.success == null) return "-";
  if (row.status_code != null) {
    return `${row.status_code}${row.success === false ? " Failed" : ""}`;
  }
  return row.success ? "Success" : "Failed";
}

function getStatusVariant(row: UiInteractionEvent): "default" | "secondary" | "destructive" | "outline" {
  if (row.success === false) return "destructive";
  if (row.success === true) return "secondary";
  return "outline";
}

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) return null;
  return order === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
}

const ChatUiEvents = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRange } = useDateFilter();
  const { selectedStateId } = useTelemetryState();

  const category = (searchParams.get("category") || "all") as UiEventCategory;
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const sortBy = (searchParams.get("sortBy") || "event_time") as SortBy;
  const sortOrder = (searchParams.get("sortOrder") || "desc") as SortOrder;

  const queryParams = useMemo(() => {
    const dateParams = buildDateRangeParams(dateRange, {
      includeDefaultStart: false,
    });

    return {
      ...dateParams,
      page,
      limit: PAGE_SIZE,
      category,
      sortBy,
      sortOrder,
    };
  }, [category, dateRange, page, sortBy, sortOrder]);

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "chat-ui-events",
      selectedStateId,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      category,
      page,
      sortBy,
      sortOrder,
    ],
    enabled: !!selectedStateId,
    queryFn: () => fetchUiEvents(queryParams),
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

  const handleCategoryChange = (nextCategory: string) => {
    updateParams({
      category: nextCategory,
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

  const showNotificationColumns = category === "all" || category === "notification" || category === "notification_feedback";
  const showStatusColumns = category === "all" || category === "notification";
  const showActionColumn = category === "all" || category === "location";
  const showReasonColumn = category === "all" || category === "location" || category === "notification_feedback";
  const showFeedbackColumn = category === "all" || category === "notification_feedback";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell size={18} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chat UI Events</h1>
            <p className="text-sm text-muted-foreground">
              Location, notification, and notification feedback interactions
            </p>
          </div>
        </div>

        <div className="w-full md:w-64">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {CATEGORY_LABELS[category]} Events
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
                <p className="text-muted-foreground">Loading UI events...</p>
              </div>
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">
              Unable to load UI events right now.
            </div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No UI events available for the selected global date range.
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
                      {showNotificationColumns && <TableHead>Notification ID</TableHead>}
                      {showStatusColumns && (
                        <TableHead>
                          <Button variant="ghost" className="h-auto p-0 font-semibold" onClick={() => handleSort("status_code")}>
                            Status
                            <SortIcon active={sortBy === "status_code"} order={sortOrder} />
                          </Button>
                        </TableHead>
                      )}
                      {showActionColumn && <TableHead>Action</TableHead>}
                      {showReasonColumn && <TableHead>Reason</TableHead>}
                      {showFeedbackColumn && <TableHead>Feedback</TableHead>}
                      {showStatusColumns && <TableHead className="text-right">Response Count</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/ui-events/${row.id}`)}
                      >
                        <TableCell className="whitespace-nowrap">
                          {row.event_time ? formatUTCToIST(row.event_time, "MMM dd, yyyy hh:mm a") : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{CATEGORY_LABELS[row.category]}</Badge>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatEventName(row.event_name)}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate font-mono text-xs">
                          {row.fingerprint_id || "-"}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate font-mono text-xs">
                          {row.sid || "-"}
                        </TableCell>
                        {showNotificationColumns && (
                          <TableCell className="max-w-[180px] truncate font-mono text-xs">
                            {row.notification_id || "-"}
                          </TableCell>
                        )}
                        {showStatusColumns && (
                          <TableCell>
                            <Badge variant={getStatusVariant(row)}>{statusLabel(row)}</Badge>
                          </TableCell>
                        )}
                        {showActionColumn && <TableCell>{row.action || "-"}</TableCell>}
                        {showReasonColumn && <TableCell>{row.reason || "-"}</TableCell>}
                        {showFeedbackColumn && (
                          <TableCell className="max-w-[260px] truncate">
                            {row.feedback || "-"}
                          </TableCell>
                        )}
                        {showStatusColumns && (
                          <TableCell className="text-right">
                            {row.response_count ?? "-"}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {rows.length > 0 && (
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
                    UI events
                  </p>
                  <TablePagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatUiEvents;
