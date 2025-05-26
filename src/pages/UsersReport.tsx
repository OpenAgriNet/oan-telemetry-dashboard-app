import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchUsers, 
  fetchUserStats,
  fetchSessions,
  fetchFeedback,
  type UserPaginationParams,
  type PaginationParams,
  type UserStatsResponse
} from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useDateFilter } from "@/contexts/DateFilterContext";
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
import { 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Users, 
  MessageSquare, 
  Activity,
  ThumbsUp,
  ThumbsDown,
  TrendingUp ,
  Download 
} from "lucide-react";
import TablePagination from "@/components/TablePagination";
import { exportToCSV, formatUtcDateWithPMCorrection, formatUTCToIST } from "@/lib/utils";
import { fetchAllPages } from "@/services/api";
// Add these types near the top of the file
type SortDirection = 'asc' | 'desc' | null;
type SortConfig = {
  key: string;
  direction: SortDirection;
};

const UsersReport = () => {
  const { dateRange } = useDateFilter();
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
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

  const handleResetFilters = () => {
    setSelectedUser("all");
    setSearchQuery("");
    setPage(1);
  };

  // Add new state for sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'username',
    direction: 'asc'
  });

  // Add sorting function
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Helper to check if a column is backend-sortable
  const isBackendSortable = (key: string) => {
    // Only username is backend-sortable in current API
    return key === 'username';
  };

  // Fetch user statistics - Using fallback approach since /users/stats might be broken
  const { data: userStats, isLoading: isLoadingStats, error: statsError } = useQuery({
    queryKey: ['user-stats-fallback', dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: async () => {
      console.log('Calculating user stats from existing endpoints...');
      
      try {
        const statsParams: PaginationParams = {};

        // Add date range filter
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
        // Calculate stats from other endpoints
        console.log('Using fallback calculation...');
        
        // Get users data to calculate user stats
        const usersResponse = await fetchUsers({ 
          limit: 10000, // Large limit to get all users
          ...statsParams 
        });
        
        // Get sessions data for session count
        const sessionsResponse = await fetchSessions({ 
          limit: 10000, 
          ...statsParams 
        });
        
        // Get feedback data for satisfaction metrics
        const feedbackResponse = await fetchFeedback({ 
          limit: 10000, 
          ...statsParams 
        });

        // Calculate statistics
        const totalUsers = usersResponse.total;
        const totalSessions = sessionsResponse.total;
        const totalQuestions = usersResponse.data.reduce((sum, user) => sum + (user.totalQuestions || 0), 0);
        const totalFeedback = feedbackResponse.total;
        const totalLikes = feedbackResponse.data.filter(fb => fb.rating === 'like').length;
        const totalDislikes = feedbackResponse.data.filter(fb => fb.rating === 'dislike').length;

        const calculatedStats = {
          totalUsers,
          totalSessions,
          totalQuestions,
          totalFeedback,
          totalLikes,
          totalDislikes,
          avgSessionDuration: 0, // Can't calculate without session duration data
          dailyActivity: [] // Would need more complex calculation
        };

        console.log('Calculated user stats:', calculatedStats);
        return calculatedStats;
        
      } catch (error) {
        console.error('Failed to calculate user stats:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // Reduce cache time for debugging
    retry: 2,
    retryDelay: 1000,
  });

  // Set default values if stats are loading or errored
  const finalUserStats = userStats || {
    totalUsers: 0,
    totalSessions: 0,
    totalQuestions: 0,
    totalFeedback: 0,
    totalLikes: 0,
    totalDislikes: 0,
    avgSessionDuration: 0,
    dailyActivity: []
  };

  // Log stats error if any
  if (statsError) {
    console.error('User stats error:', statsError);
  }

  // Fetch users with server-side pagination and filtering
  const {
    data: usersResponse = { data: [], total: 0, totalPages: 0 },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "users",
      searchQuery,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      selectedUser,
      page,
      pageSize,
      sortConfig.key,
      sortConfig.direction
    ],
    queryFn: async () => {
      const params: UserPaginationParams = {
        page,
        limit: pageSize,
      };
      if (isBackendSortable(sortConfig.key)) {
        params.sortKey = sortConfig.key;
        params.sortDirection = sortConfig.direction;
      }

      // Add search filter
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
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

      const result = await fetchUsers(params);
      let filteredData = result.data;
      if (selectedUser !== 'all') {
        filteredData = result.data.filter(user => 
          user.username === selectedUser || user.id === selectedUser
        );
      }

      // Client-side sorting for non-backend-sortable columns
      if (!isBackendSortable(sortConfig.key)) {
        filteredData = [...filteredData].sort((a, b) => {
          let aValue = a[sortConfig.key] ?? 0;
          let bValue = b[sortConfig.key] ?? 0;
          // For latestSession, parse as date
          if (sortConfig.key === 'latestSession' || sortConfig.key === 'lastActivity') {
            aValue = new Date(String(aValue)).getTime();
            bValue = new Date(String(bValue)).getTime();
          }
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }

      return {
        ...result,
        data: filteredData,
        total: selectedUser !== 'all' ? filteredData.length : result.total,
        totalPages: selectedUser !== 'all' ? Math.ceil(filteredData.length / pageSize) : result.totalPages
      };
    },
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch all users for the filter dropdown
  const { data: allUsersResponse = { data: [] }, isLoading: isLoadingAllUsers } = useQuery({
    queryKey: ["all-users-for-filter"],
    queryFn: () => fetchUsers({ limit: 1000 } as UserPaginationParams),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const allUsers = allUsersResponse.data;
  const paginatedUsers = usersResponse.data;

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleApplyFilters = () => {
    refetch();
  };

  // Update sort indicator component
  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return ' ↕';
  };

  const handleSessionClick = (sessionId: string) => {
    console.log('Session ID:', sessionId);
    const SessionId = sessionId;
    // Add your logic here to handlne the session click
    navigate(`/sessions/${SessionId}`);
  };

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Users Report</h1>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Error loading users data</p>
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
        <h1 className="text-2xl font-bold tracking-tight">Users Report</h1>
        <div className="flex gap-2">
          <Button onClick={handleApplyFilters} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">{finalUserStats.totalUsers}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {dateRange.from || dateRange.to ? "Filtered period" : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">{finalUserStats.totalSessions}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isLoadingStats ? (
                <span className="h-4 w-16 bg-muted animate-pulse rounded inline-block" />
              ) : finalUserStats.totalUsers > 0 
                ? `${Math.round(finalUserStats.totalSessions / finalUserStats.totalUsers)} avg per user`
                : "No data"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">{finalUserStats.totalQuestions}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {isLoadingStats ? (
                <span className="h-4 w-16 bg-muted animate-pulse rounded inline-block" />
              ) : finalUserStats.totalSessions > 0 
                ? `${Math.round(finalUserStats.totalQuestions / finalUserStats.totalSessions)} avg per session`
                : "No data"
              }
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
            <div className="flex gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by username..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  maxLength={1000}
                />
              </div>
              <Button onClick={async () => {
                // Build params for all filters
                const params: UserPaginationParams = {};
                if (searchQuery.trim()) params.search = searchQuery.trim();
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
                const allUsers = await fetchAllPages(fetchUsers, params);
                // Client-side user filter if needed
                const filtered = (selectedUser !== "all"
                  ? allUsers.filter(user => user.username === selectedUser || user.id === selectedUser)
                  : allUsers
                ).map(user => ({
                  ...user,
                  latestSession: formatUTCToIST(user.latestSession || user.lastActivity || "")
                }));
                exportToCSV(filtered, [
                  { key: 'username', header: 'Username' },
                  { key: 'sessions', header: 'Sessions' },
                  { key: 'totalQuestions', header: 'Questions' },
                  { key: 'feedbackCount', header: 'Feedback' },
                  { key: 'likes', header: 'Likes' },
                  { key: 'dislikes', header: 'Dislikes' },
                  { key: 'latestSession', header: 'Latest Activity' },
                ], 'users_report.csv');
              }} disabled={isLoading} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download as CSV
              </Button>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg border">
              <p className="text-sm font-medium">
                Total Users: {usersResponse.total || 0}
                {usersResponse.total > 0 && (
                  <span className="text-muted-foreground ml-2">
                    (Page {page} of {usersResponse.totalPages})
                  </span>
                )}
              </p>
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
                <p className="text-muted-foreground font-medium mb-2">No users found</p>
                <p className="text-sm text-muted-foreground/80 mb-4">
                  {(searchQuery || selectedUser !== 'all' || dateRange.from || dateRange.to) 
                    ? 'Try adjusting your filters to see more results.'
                    : 'No users are available in the database.'
                  }
                </p>
                {(searchQuery || selectedUser !== 'all' || dateRange.from || dateRange.to) && (
                  <Button variant="outline" onClick={handleResetFilters} size="sm">
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No users match your current filters</p>
                <Button variant="outline" onClick={handleResetFilters} size="sm" className="mt-2">
                  Clear filters
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('username')}
                    >
                      Username{<SortIndicator columnKey="username" />}
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('sessions')}
                    >
                      Sessions{<SortIndicator columnKey="sessions" />}
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('totalQuestions')}
                    >
                      Questions{<SortIndicator columnKey="totalQuestions" />}
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('feedbackCount')}
                    >
                      Feedback{<SortIndicator columnKey="feedbackCount" />}
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('latestSession')}
                    >
                      Latest Activity{<SortIndicator columnKey="latestSession" />}
                    </TableHead>
                    <TableHead 
                      className="text-right cursor-pointer hover:bg-muted/50"
                    >
                      Latest Session
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user, idx) => (
                    <TableRow key={user.id || idx} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                          {user.username}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
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
                                <span className="text-xs">{user.likes || 0}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ThumbsDown className="h-3 w-3 text-red-500" />
                                <span className="text-xs">{user.dislikes || 0}</span>
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">No feedback</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatUTCToIST(user.latestSession || user.lastActivity || "")}</TableCell>
                      <TableCell>
                      <button
                          onClick={() => handleSessionClick(user.sessionId)}
                          className="text-primary hover:underline"
                        >
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                            {user.sessionId?.substring(0, 8)}...
                          </code>
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {paginatedUsers.length > 0 && usersResponse.totalPages > 1 && (
              <TablePagination 
                currentPage={page}
                totalPages={usersResponse.totalPages}
                onPageChange={setPage}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersReport;
