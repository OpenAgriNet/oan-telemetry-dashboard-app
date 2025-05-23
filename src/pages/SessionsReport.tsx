import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchSessions, 
  fetchSessionStats,
  fetchUsers, 
  type SessionPaginationParams, 
  type UserPaginationParams,
  type PaginationParams
} from "@/services/api";
import { useNavigate } from "react-router-dom";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
import { format } from "date-fns";
import { Search, RefreshCw, AlertCircle, Users, MessageSquare, Activity } from "lucide-react";
import TablePagination from "@/components/TablePagination";

const SessionsReport = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset page when filters change
  const resetPage = () => setPage(1);

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    resetPage();
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    resetPage();
  };

  const handleDateRangeChange = (newDateRange: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    setDateRange(newDateRange);
    resetPage();
  };

  const handleResetFilters = () => {
    setSelectedUser("all");
    setDateRange({ from: undefined, to: undefined });
    setSearchQuery("");
    setPage(1);
  };

  // Fetch users for the filter dropdown
  const { data: usersResponse = { data: [] }, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-for-sessions-filter"],
    queryFn: () => fetchUsers({ limit: 1000 } as UserPaginationParams),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch session statistics
  const { data: sessionStats = { totalSessions: 0, totalQuestions: 0, totalUsers: 0 } } = useQuery({
    queryKey: ['session-stats', selectedUser, dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: async () => {
      const statsParams: SessionPaginationParams = {
        page: 1,
        limit: 10000, // Large limit to get comprehensive stats
      };

      // Add user filter for stats
      if (selectedUser !== 'all') {
        statsParams.search = selectedUser; // Use search to filter by username
      }

      // Add date range filter for stats
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        statsParams.startDate = fromDate.toISOString();
      }

      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        statsParams.endDate = toDate.toISOString();
      } else if (dateRange.from) {
        const toDate = new Date(dateRange.from);
        toDate.setHours(23, 59, 59, 999);
        statsParams.endDate = toDate.toISOString();
      }

      const result = await fetchSessions(statsParams);
      
      // Calculate statistics from the result
      const totalQuestions = result.data.reduce((sum, session) => sum + session.questionCount, 0);
      const uniqueUsers = new Set(result.data.map(session => session.username)).size;

      return {
        totalSessions: result.total,
        totalQuestions,
        totalUsers: uniqueUsers
      };
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

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
      pageSize
    ],
    queryFn: async () => {
      const params: SessionPaginationParams = {
        page,
        limit: pageSize,
      };

      // Combine user filter and search filter
      let searchTerm = '';
      if (selectedUser !== 'all' && searchQuery.trim()) {
        // If both user and search are selected, prioritize search
        searchTerm = searchQuery.trim();
      } else if (selectedUser !== 'all') {
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
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        params.startDate = fromDate.toISOString();
      }

      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        params.endDate = toDate.toISOString();
      } else if (dateRange.from) {
        const toDate = new Date(dateRange.from);
        toDate.setHours(23, 59, 59, 999);
        params.endDate = toDate.toISOString();
      }

      console.log('Fetching sessions with params:', params);
      const result = await fetchSessions(params);
      
      return result;
    },
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const users = usersResponse.data;

  const handleSessionClick = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return format(date, "MMM dd, yyyy hh:mm a");
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return "N/A";
    }
  };

  const handleApplyFilters = () => {
    refetch();
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
            <p className="text-destructive font-medium mb-2">Error loading sessions data</p>
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
        <Button onClick={handleApplyFilters} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {dateRange.from || dateRange.to ? "Filtered period" : "All time"}
            </p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats.totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              {sessionStats.totalSessions > 0 
                ? `${Math.round(sessionStats.totalQuestions / sessionStats.totalSessions)} avg per session`
                : "No data"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessionStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {sessionStats.totalUsers > 0 && sessionStats.totalSessions > 0
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
          <CardDescription>User sessions with advanced filtering and search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
              <div>
                <Select value={selectedUser} onValueChange={handleUserChange} disabled={isLoadingUsers}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "All Users"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.username || user.id}>
                        {user.username || `User ${user.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <DateRangePicker dateRange={dateRange} setDateRange={handleDateRangeChange} />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by session ID or user..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    maxLength={1000}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Apply Filters
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleResetFilters} disabled={isLoading}>
                Reset Filters
              </Button>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg border">
              <p className="text-sm font-medium">
                Total Sessions: {sessionReport.total || 0}
                {sessionReport.total > 0 && (
                  <span className="text-muted-foreground ml-2">
                    (Page {page} of {sessionReport.totalPages})
                  </span>
                )}
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-12 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading sessions data...</p>
                </div>
              </div>
            ) : sessionReport.total === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-2">No sessions found</p>
                <p className="text-sm text-muted-foreground/80 mb-4">
                  {(searchQuery || selectedUser !== 'all' || dateRange.from || dateRange.to) 
                    ? 'Try adjusting your filters to see more results.'
                    : 'No sessions are available in the database.'
                  }
                </p>
                {(searchQuery || selectedUser !== 'all' || dateRange.from || dateRange.to) && (
                  <Button variant="outline" onClick={handleResetFilters} size="sm">
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : sessionReport.data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No sessions match your current filters</p>
                <Button variant="outline" onClick={handleResetFilters} size="sm" className="mt-2">
                  Clear filters
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-right">Questions</TableHead>
                    <TableHead>Session Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionReport.data.map((session, idx) => (
                    <TableRow key={session.sessionId || idx} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <button
                          onClick={() => handleSessionClick(session.sessionId)}
                          className="text-primary hover:underline"
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
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {session.questionCount}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(session.sessionTime)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {sessionReport.data.length > 0 && sessionReport.totalPages > 1 && (
              <TablePagination 
                currentPage={page}
                totalPages={sessionReport.totalPages}
                onPageChange={setPage}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionsReport;
