import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchCalls,
  fetchCallsStats,
  type PaginationParams,
  type Call,
} from "@/services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { buildDateRangeParams } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Phone,
  MessageSquare,
  Activity,
  Clock,
  RotateCcw,
} from "lucide-react";
import TablePagination from "@/components/TablePagination";

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatDatetime(dt: string | null): string {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dt;
  }
}

function formatDataAvailableUpto(dt: string | null): string {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dt;
  }
}

const CallsReport = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRange } = useDateFilter();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 20;

  const [searchQuery, setSearchQuery] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "start_datetime",
    direction: "desc",
  });

  const resetPage = () => {
    const p = new URLSearchParams(searchParams);
    p.set("page", "1");
    setSearchParams(p);
  };

  const handlePageChange = (newPage: number) => {
    const p = new URLSearchParams(searchParams);
    p.set("page", newPage.toString());
    setSearchParams(p);
  };

  const handleSearch = () => {
    setSearchQuery(pendingSearch);
    resetPage();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setPendingSearch("");
    const p = new URLSearchParams();
    p.set("page", "1");
    setSearchParams(p);
  };

  const handleSort = (key: string) => {
    setSortConfig((cur) => ({
      key,
      direction: cur.key === key && cur.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key === columnKey) {
      return <span>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</span>;
    }
    return <span> ↕</span>;
  };

  // ── Fetch calls list ──
  const dateParams = buildDateRangeParams(dateRange);
  const {
    data: callsReport = { data: [], total: 0, totalPages: 0, page: 1, pageSize: 20 },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "calls",
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      searchQuery,
      page,
      pageSize,
      sortConfig.key,
      sortConfig.direction,
    ],
    queryFn: async () => {
      const params: PaginationParams = {
        page,
        limit: pageSize,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction as "asc" | "desc",
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (dateParams.startDate) params.startDate = dateParams.startDate;
      if (dateParams.endDate) params.endDate = dateParams.endDate;
      return fetchCalls(params);
    },
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  // ── Fetch stats ──
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: [
      "calls-stats",
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    queryFn: () => {
      const p: PaginationParams = {};
      if (dateParams.startDate) p.startDate = dateParams.startDate;
      if (dateParams.endDate) p.endDate = dateParams.endDate;
      return fetchCallsStats(p);
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const { data: latestCallReport } = useQuery({
    queryKey: [
      "calls-latest",
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    queryFn: async () => {
      const p: PaginationParams = {
        page: 1,
        limit: 1,
        sortBy: "start_datetime",
        sortOrder: "desc",
      };
      if (dateParams.startDate) p.startDate = dateParams.startDate;
      if (dateParams.endDate) p.endDate = dateParams.endDate;
      return fetchCalls(p);
    },
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const latestCallTimestamp =
    latestCallReport?.data?.[0]?.startDatetime ||
    latestCallReport?.data?.[0]?.endDatetime ||
    null;

  const handleCallClick = (interactionId: string) => {
    navigate(`/calls/${interactionId}`);
  };

  // ── Error state ──
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Call Logs</h1>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">
              Error loading calls data
            </p>
            <p className="text-destructive/80 text-sm mb-4">{error.message}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Call Logs</h1>
        <Button
          onClick={() => refetch()}
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800/50 dark:bg-blue-950/30 dark:text-blue-300">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p>
          This data is updated once a day and is not live. The information shown here may not reflect the most recent activity.{" "}
          {latestCallTimestamp
            ? `Data available only up to ${formatDataAvailableUpto(latestCallTimestamp)}.`
            : "Latest available call log date is currently unavailable."}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Call Logs</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">
                {(stats?.totalCalls ?? 0).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {dateRange.from || dateRange.to ? "Filtered period" : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">
                {(stats?.totalQuestions ?? 0).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              User messages across all calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Interactions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">
                {(stats?.totalInteractions ?? 0).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              All messages (user + assistant)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">
                {formatDuration(stats?.avgDuration ?? null)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Average call duration
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Call Logs</CardTitle>
          <CardDescription>
            Voice agent calls with questions and interaction counts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by user ID, end reason..."
                  className="pl-8"
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  maxLength={1000}
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  variant="outline"
                  size="icon"
                  title="Search"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleResetFilters}
                  variant="outline"
                  size="icon"
                  title="Reset Search"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Table content */}
            {isLoading ? (
              <div className="flex justify-center items-center p-12 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Loading call logs...
                  </p>
                </div>
              </div>
            ) : callsReport.total === 0 ? (
              <div className="text-center py-12">
                <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-2">
                  No call logs found
                </p>
                <p className="text-sm text-muted-foreground/80 mb-4">
                  {searchQuery || dateRange.from || dateRange.to
                    ? "Try adjusting your filters to see more results."
                    : "No call logs are available in the database."}
                </p>
                {(searchQuery || dateRange.from || dateRange.to) && (
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    size="sm"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("duration_in_seconds")}
                      >
                        Duration
                        <SortIndicator columnKey="duration_in_seconds" />
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("questions_count")}
                      >
                        Questions
                        <SortIndicator columnKey="questions_count" />
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("total_interactions")}
                      >
                        Interactions
                        <SortIndicator columnKey="total_interactions" />
                      </TableHead>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("start_datetime")}
                      >
                        Start Time
                        <SortIndicator columnKey="start_datetime" />
                      </TableHead>
                      <TableHead>End Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callsReport.data.map((call: Call, idx: number) => (
                      <TableRow
                        key={call.interactionId || idx}
                        className="hover:bg-muted/30 cursor-pointer"
                        onClick={() => handleCallClick(call.interactionId)}
                      >
                        <TableCell className="font-medium">
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                            {call.userId ? `${call.userId.substring(0, 8)}...` : "—"}
                          </code>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatDuration(call.durationInSeconds)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium">
                            {call.questionsCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                            {call.totalInteractions}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {formatDatetime(call.startDatetime)}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {call.endReason || "—"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {callsReport.data.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {((page - 1) * pageSize + 1).toLocaleString()}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground">
                    {Math.min(
                      page * pageSize,
                      callsReport.total
                    ).toLocaleString()}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {callsReport.total.toLocaleString()}
                  </span>{" "}
                  call logs
                </p>
                <TablePagination
                  currentPage={page}
                  totalPages={callsReport.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallsReport;
