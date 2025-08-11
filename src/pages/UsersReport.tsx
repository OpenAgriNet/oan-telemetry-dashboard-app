import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchUsers, 
  type UserPaginationParams
} from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Download 
} from "lucide-react";
import TablePagination from "@/components/TablePagination";
import { exportToCSV, formatUTCToIST } from "@/lib/utils";
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

  // Debounce search to reduce API calls
  const [pendingSearch, setPendingSearch] = useState<string>("");
  const handleSearchChange = (query: string) => {
    setPendingSearch(query);
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
      // Only include backend-sortable sort in key to avoid refetches on client-only sorts
      isBackendSortable(sortConfig.key) ? sortConfig.key : 'client-sort',
      isBackendSortable(sortConfig.key) ? sortConfig.direction : 'client-direction'
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
    // Keep old page data while fetching the next
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    // Don't refetch immediately on mount if we already have data
    refetchOnMount: false,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Removed unused all-users-for-filter query to prevent extra API call on init
  const paginatedUsers = usersResponse.data;

  // Apply debouncing effect for search input
  React.useEffect(() => {
    const id = setTimeout(() => setSearchQuery(pendingSearch), 350);
    return () => clearTimeout(id);
  }, [pendingSearch]);

  // No-op

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

  {/* Removed summary metrics cards */}

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
                  value={pendingSearch}
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
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort('latestSession')}
                    >
                      Latest Session{<SortIndicator columnKey="latestSession" />}
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
