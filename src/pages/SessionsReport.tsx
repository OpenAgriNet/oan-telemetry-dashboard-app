import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchSessions,
  fetchBasicSessionStats,
  fetchUsers,
  type SessionPaginationParams,
  type UserPaginationParams,
  type PaginationParams,
} from "@/services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { buildDateRangeParams, formatLocal } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Users,
  MessageSquare,
  Activity,
  RotateCcw,
} from "lucide-react";
import TablePagination from "@/components/TablePagination";
import { formatUtcDateWithPMCorrection, formatUTCToIST } from "@/lib/utils";

const SessionsReport = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRange } = useDateFilter();

  // Get pagination state from URL params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 10;

  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortConfig, setSortConfig] = useState({
    key: "sessionTime",
    direction: "desc",
  });

  // Reset page when filters change
  const resetPage = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
  };

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    resetPage();
  };

  const [pendingSearch, setPendingSearch] = useState("");
  const handleSearchChange = (query: string) => {
    setPendingSearch(query);
  };

  const handleSearch = () => {
    setSearchQuery(pendingSearch);
    resetPage();
  };

  const handleResetFilters = () => {
    setSelectedUser("all");
    setSearchQuery("");
    setPendingSearch("");
    const newParams = new URLSearchParams();
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  // Fetch users for the filter dropdown
  // const { data: usersResponse = { data: [] }, isLoading: isLoadingUsers } =
  //   useQuery({
  //     queryKey: ["users-for-sessions-filter"],
  //     queryFn: () => fetchUsers({ limit: 1000 } as UserPaginationParams),
  //     staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  //   });

  // Fetch sessions with server-side pagination and filtering
  const {
    data: sessionReport = { data: [], total: 0, totalPages: 0 },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "sessions",
      selectedUser,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      searchQuery,
      page,
      pageSize,
      sortConfig.key,
      sortConfig.direction,
    ],
    enabled: dateRange.from !== undefined && dateRange.to !== undefined,
    queryFn: async () => {
      const params: SessionPaginationParams = {
        page,
        limit: pageSize,
      };

      // Combine user filter and search filter
      let searchTerm = "";
      if (selectedUser !== "all" && searchQuery.trim()) {
        // If both user and search are selected, prioritize search
        searchTerm = searchQuery.trim();
      } else if (selectedUser !== "all") {
        // Only user filter
        searchTerm = selectedUser;
      } else if (searchQuery.trim()) {
        // Only search filter
        searchTerm = searchQuery.trim();
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      // Add date range filter
       const dateParams = buildDateRangeParams(dateRange);
            if (dateParams.startDate) params.startDate = dateParams.startDate;
            if (dateParams.endDate) params.endDate = dateParams.endDate;

      console.log("Fetching sessions with params:", params);
      const result = await fetchSessions(params);

      // Client-side sorting
      const sortedData = [...result.data].sort((a, b) => {
        let aValue = a[sortConfig.key] ?? "";
        let bValue = b[sortConfig.key] ?? "";
        if (sortConfig.key === "sessionTime") {
          aValue = new Date(String(aValue)).getTime();
          bValue = new Date(String(bValue)).getTime();
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
      return { ...result, data: sortedData };
    },
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Keep old page data while fetching the next
    // placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const totalSessions = sessionReport.total;

  // const users = usersResponse.data;

  const handleSessionClick = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };

  const handleApplyFilters = () => {
    refetch();
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === "asc" ? " ↑" : " ↓";
    }
    return " ↕";
  };

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Sessions Report</h1>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">
              Error loading sessions data
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Sessions Report</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleApplyFilters}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">
                {totalSessions.toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {dateRange.from || dateRange.to ? "Filtered period" : "All time"}
            </p>
          </CardContent>
        </Card>

        {/*<Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">{sessionStats.totalQuestions}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isLoadingStats ? (
                <span className="h-4 w-16 bg-muted animate-pulse rounded inline-block" />
              ) : sessionStats.totalSessions > 0 
                ? `${Math.round(sessionStats.totalQuestions / sessionStats.totalSessions)} avg per session`
                : "No data"
              }
            </p>
          </CardContent>
        </Card>*/}

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">{sessionStats.totalUsers}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isLoadingStats ? (
                <span className="h-4 w-16 bg-muted animate-pulse rounded inline-block" />
              ) : sessionStats.totalUsers > 0 && sessionStats.totalSessions > 0
                ? `${Math.round(sessionStats.totalSessions / sessionStats.totalUsers)} avg sessions per user`
                : "No data"
              }
            </p>
          </CardContent>
        </Card> */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>
            User sessions with advanced filtering and search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search based on username..."
                  className="pl-8"
                  value={pendingSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  maxLength={1000}
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading} variant="outline" size="icon" title="Search">
                <Search className="h-4 w-4" />
              </Button>
              <Button onClick={handleResetFilters} variant="outline" size="icon" title="Reset Search">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-12 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Loading sessions data...
                  </p>
                </div>
              </div>
            ) : sessionReport.total === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-2">
                  No sessions found
                </p>
                <p className="text-sm text-muted-foreground/80 mb-4">
                  {searchQuery ||
                  selectedUser !== "all" ||
                  dateRange.from ||
                  dateRange.to
                    ? "Try adjusting your filters to see more results."
                    : "No sessions are available in the database."}
                </p>
                {(searchQuery ||
                  selectedUser !== "all" ||
                  dateRange.from ||
                  dateRange.to) && (
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    size="sm"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : sessionReport.data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No sessions match your current filters
                </p>
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  size="sm"
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("sessionId")}
                    >
                      Session ID
                      {/* <SortIndicator columnKey="sessionId" /> */}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("username")}
                    >
                      User
                      {/* <SortIndicator columnKey="username" /> */}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("questionCount")}
                    >
                      Questions
                      {/* <SortIndicator columnKey="questionCount" /> */}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("sessionTime")}
                    >
                      Session Time
                      {/* <SortIndicator columnKey="sessionTime" /> */}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionReport.data
                    .filter((session) => session.questionCount > 0)
                    .map((session, idx) => (
                      <TableRow
                        key={session.sessionId || idx}
                        className="hover:bg-muted/30"
                      >
                        <TableCell className="font-medium">
                          <button
                            onClick={() =>
                              handleSessionClick(session.sessionId)
                            }
                            className="hover:underline"
                          >
                            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                              {session.sessionId.substring(0, 8)}...
                            </code>
                          </button>
                        </TableCell>
                        <TableCell>
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                            {session.username}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium">
                            {session.questionCount}
                          </span>
                        </TableCell>
                        <TableCell>
                          {session.sessionTime || "N/A"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}

            {sessionReport.data.length > 0 && sessionReport.totalPages > 1 && (
              <TablePagination
                currentPage={page}
                totalPages={sessionReport.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionsReport;
