import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchUsers,
  type UserPaginationParams,
  type UserStatsResponse,
} from "@/services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useStats } from "@/contexts/StatsContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Removed unused Select components
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
  ThumbsUp,
  ThumbsDown,
  UserPlus,
  UserCheck,
  RotateCcw,
} from "lucide-react";
import TablePagination from "@/components/TablePagination";
import { formatUTCToIST, buildDateRangeParams, formatLocal } from "@/lib/utils";
// Add these types near the top of the file
type SortDirection = "asc" | "desc" | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

const UsersReport = () => {
  const { dateRange } = useDateFilter();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get pagination state from URL params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 10;

  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  const [pendingSearch, setPendingSearch] = useState<string>("");
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

  // Add new state for sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "last_activity",
    direction: "desc",
  });

  // Add sorting function
  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };
  console.log("Sort Config:", sortConfig);

  // Helper to check if a column is backend-sortable
  const isBackendSortable = (key: string) => {
    // Only username is backend-sortable in current API
    // const backendSortableKeys = ["username", "sessions", "totalQuestions", "feedbackCount"];
    // if(backendSortableKeys.includes(key)){
    //   return key;
    // }
    // return null;
    return key === "username";
  };

  // Removed stats query and summary cards

  // Fetch users with server-side pagination and filtering
  const {
    data: usersResponse = { data: [], total: 0, totalPages: 0 },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "users",
      // Only include debounced search in key
      searchQuery,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      selectedUser,
      page,
      pageSize,
      sortConfig.key,
      sortConfig.direction,
      // Only include backend-sortable sort in key to avoid refetches on client-only sorts
      isBackendSortable(sortConfig.key) ? sortConfig.key : "client-sort",
      isBackendSortable(sortConfig.key)
        ? sortConfig.direction
        : "client-direction",
    ],
    enabled: dateRange.from !== undefined && dateRange.to !== undefined,
    queryFn: async () => {
      const params: UserPaginationParams = {
        page,
        limit: pageSize,
      };
      // if (isBackendSortable(sortConfig.key)) {
      //   params.sortKey = sortConfig.key;
      //   params.sortDirection = sortConfig.direction;
      // }

       if (sortConfig.key) {
        params.sortBy = sortConfig.key;
        params.sortOrder = sortConfig.direction as "asc" | "desc";
      }   

      // Add search filter
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add date range filter using unified utility
      const dateParams = buildDateRangeParams(dateRange);
      if (dateParams.startDate) params.startDate = dateParams.startDate;
      if (dateParams.endDate) params.endDate = dateParams.endDate;
    console.log(params)
      const result = await fetchUsers(params);
      let filteredData = result.data;
      if (selectedUser !== "all") {
        filteredData = result.data.filter(
          (user) => user.username === selectedUser || user.id === selectedUser,
        );
      }

      // Client-side sorting for non-backend-sortable columns
      if (!isBackendSortable(sortConfig.key)) {
        filteredData = [...filteredData].sort((a, b) => {
          let aValue = a[sortConfig.key] ?? 0;
          let bValue = b[sortConfig.key] ?? 0;
          // For latestSession, parse as date
          if (
            sortConfig.key === "latestSession" ||
            sortConfig.key === "lastActivity"
          ) {
            aValue = new Date(String(aValue)).getTime();
            bValue = new Date(String(bValue)).getTime();
          }
          if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        });
      }

      return {
        ...result,
        data: filteredData,
        total: selectedUser !== "all" ? filteredData.length : result.total,
        totalPages:
          selectedUser !== "all"
            ? Math.ceil(filteredData.length / pageSize)
            : result.totalPages,
      };
    },
    refetchOnWindowFocus: false,
    // Keep old page data while fetching the next
    // placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    // Don't refetch immediately on mount if we already have data
    refetchOnMount: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Use centralized stats from StatsContext - no redundant API call!
  const { stats, isLoading: isStatsLoading, error: statsError } = useStats();
  console.log(stats)

  // Extract stats with fallbacks
  const totalUsers = stats?.totalUsers ?? 0;
  const totalNewUsers = stats?.totalNewUsers ?? 0;
  
  // Removed unused all-users-for-filter query to prevent extra API call on init
  const paginatedUsers = usersResponse.data;

  const handleApplyFilters = () => {
    refetch();
  };

  // Update sort indicator component
  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === "asc" ? " ↑" : " ↓";
    }
    return " ↕";
  };

  const handleSessionClick = (sessionId: string) => {
    console.log("Session ID:", sessionId);
    const SessionId = sessionId;
    // Add your logic here to handlne the session click
    navigate(`/sessions/${SessionId}`);
  };

  // Show error state
  if (error || statsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Users Report</h1>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">
              Error loading users data
            </p>
            <p className="text-destructive/80 text-sm mb-4">
              {(error || statsError)?.message}
            </p>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
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

      {/* User Stats Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Unique Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                totalUsers.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              unique devices in selected period
            </p>
          </CardContent>
        </Card>

           <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                totalNewUsers.toLocaleString() || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
            first-time active users
            </p>
          </CardContent>
        </Card>

          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returning Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                (totalUsers-totalNewUsers).toLocaleString() || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              active users with prior activity
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Activity</CardTitle>
          {/* <CardDescription>User accounts with advanced filtering and search</CardDescription> */}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search based on username..."
                  className="pl-8"
                  value={pendingSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
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

            {isLoading ? (
              <div className="flex justify-center items-center p-12 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading users data...</p>
                </div>
              </div>
            ) : usersResponse.total === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-2">
                  No users found
                </p>
                <p className="text-sm text-muted-foreground/80 mb-4">
                  {searchQuery ||
                  selectedUser !== "all" ||
                  dateRange.from ||
                  dateRange.to
                    ? "Try adjusting your filters to see more results."
                    : "No users are available in the database."}
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
            ) : paginatedUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No users match your current filters
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
                      onClick={() => handleSort("user_id")}
                    >
                      Username
                      {<SortIndicator columnKey="user_id" />}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      // onClick={() => handleSort("session_count")}
                    >
                      Sessions
                      {/* {<SortIndicator columnKey="session_count" />} */}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      // onClick={() => handleSort("total_questions")}
                    >
                      Questions
                      {/* {<SortIndicator columnKey="total_questions" />} */}
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("feedback_count")}
                    >
                      Feedback
                      {<SortIndicator columnKey="feedback_count" />}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("last_activity")}
                    >
                      Latest Activity
                      {<SortIndicator columnKey="last_activity" />}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      // onClick={() => handleSort("latest_session")}
                    >
                      Latest Session
                      {/* {<SortIndicator columnKey="latest_session" />} */}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user, idx) => (
                    <TableRow
                      key={user.id || idx}
                      className="hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                          {user.username?.substring(0, 6)}...
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium">
                          {user.sessions || user.totalSessions || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                          {user.totalQuestions || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(user.feedbackCount || 0) > 0 ? (
                            <>
                              <div className="flex items-center gap-1">
                                <ThumbsUp className="h-3 w-3 text-green-500" />
                                <span className="text-xs">
                                  {user.likes || 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ThumbsDown className="h-3 w-3 text-red-500" />
                                <span className="text-xs">
                                  {user.dislikes || 0}
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No feedback
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatUTCToIST(
                          user.latestSession || user.lastActivity || "",
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleSessionClick(user.sessionId)}
                          className="hover:underline"
                        >
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                            {user.sessionId?.substring(0, 6)}...
                          </code>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {paginatedUsers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Showing{" "}
                  <span className="font-medium text-foreground">{((page - 1) * pageSize + 1).toLocaleString()}</span>
                  {" "}to{" "}
                  <span className="font-medium text-foreground">{Math.min(page * pageSize, usersResponse.total).toLocaleString()}</span>
                  {" "}of{" "}
                  <span className="font-medium text-foreground">{usersResponse.total.toLocaleString()}</span> users
                </p>
                <TablePagination
                  currentPage={page}
                  totalPages={usersResponse.totalPages}
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

export default UsersReport;
