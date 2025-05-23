import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchQuestions,
  fetchUsers,
  fetchSessions,
  type QuestionPaginationParams,
  type UserPaginationParams,
  type SessionPaginationParams
} from "@/services/api";
import TablePagination from "@/components/TablePagination";
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
import { Mic, Search, ThumbsUp, ThumbsDown, RefreshCw, AlertCircle } from "lucide-react";
import DateRangePicker from "@/components/dashboard/DateRangePicker";

// Utility function to adjust dates for IST to UTC conversion
const adjustDateForUTC = (date: Date | undefined): Date | undefined => {
  if (!date) return undefined;
  
  // Create a new date object to avoid mutating the original
  const adjustedDate = new Date(date);
  
  // IST is UTC+5:30, so subtract 5 hours and 30 minutes to get UTC time
  adjustedDate.setHours(adjustedDate.getHours() - 5);
  adjustedDate.setMinutes(adjustedDate.getMinutes() - 30);
  
  return adjustedDate;
};

const QuestionsReport = () => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset page when filters change
  const resetPage = () => setPage(1);

  const handleUserChange = (userId: string) => {
    setSelectedUser(userId);
    setSelectedSession("all"); // Reset session when user changes
    resetPage();
  };

  const handleSessionChange = (sessionId: string) => {
    setSelectedSession(sessionId);
    resetPage();
  };

  const handleDateRangeChange = (newDateRange: {
    from: Date | undefined;
    to: Date | undefined;
  }) => {
    setDateRange(newDateRange);
    resetPage();
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    resetPage();
  };

  const handleResetFilters = () => {
    setSelectedUser("all");
    setSelectedSession("all");
    setDateRange({ from: undefined, to: undefined });
    setSearchQuery("");
    setPage(1);
  };

  // Fetch users with proper pagination
  const { data: usersResponse = { data: [] }, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-for-filter"],
    queryFn: () => fetchUsers({ limit: 1000 } as UserPaginationParams),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch sessions with proper pagination and user filter
  const { data: sessionsResponse = { data: [] }, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["sessions-for-filter", selectedUser],
    queryFn: () => fetchSessions({ 
      limit: 1000,
    } as SessionPaginationParams),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Main questions query with all filters
  const {
    data: questionsReport = { data: [], total: 0, totalPages: 0 },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "questions",
      selectedUser,
      selectedSession,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      searchQuery,
      page,
      pageSize
    ],
    queryFn: async () => {
      const params: QuestionPaginationParams = {
        page,
        limit: pageSize,
      };

      // Add search filter
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add user filter using userId parameter
      if (selectedUser !== 'all') {
        params.userId = selectedUser;
      }

      // Add session filter using sessionId parameter
      if (selectedSession !== 'all') {
        params.sessionId = selectedSession;
      }

      // Format dates for API (backend expects ISO strings or Unix timestamps)
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
        // If only from date is provided, use same day end as to date
        const toDate = new Date(dateRange.from);
        toDate.setHours(23, 59, 59, 999);
        params.endDate = toDate.toISOString();
      }

      console.log('Fetching questions with params:', params);
      
      const response = await fetchQuestions(params);
      console.log('Questions response:', response);
      return response;
    },
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const users = usersResponse.data;
  const sessions = sessionsResponse.data;

  // Filter sessions by selected user (client-side filter as fallback)
  const filteredSessions = sessions.filter(
    (session) => selectedUser === 'all' || session.username === selectedUser || session.userId === selectedUser
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      // Handle both ISO strings and timestamps
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
          <h1 className="text-2xl font-bold tracking-tight">Questions Report</h1>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Error loading questions data</p>
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
        <h1 className="text-2xl font-bold tracking-tight">Questions Report</h1>
        <Button onClick={handleApplyFilters} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Select value={selectedUser} onValueChange={handleUserChange} disabled={isLoadingUsers}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "All Users"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem 
                  key={user.id} 
                  value={user.username || user.id}
                >
                  {user.username || `User ${user.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={selectedSession} onValueChange={handleSessionChange} disabled={isLoadingSessions}>
            <SelectTrigger>
              <SelectValue placeholder={isLoadingSessions ? "Loading sessions..." : "All Sessions"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {filteredSessions.map((session) => (
                <SelectItem key={session.sessionId} value={session.sessionId}>
                  {session.sessionId.substring(0, 8)}...
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
              placeholder="Search questions..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => handleSearchQueryChange(e.target.value)}
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
          Total Questions: {questionsReport.total || 0}
          {questionsReport.total > 0 && (
            <span className="text-muted-foreground ml-2">
              (Page {page} of {questionsReport.totalPages})
            </span>
          )}
        </p>
      </div>

      <div className="border rounded-lg">
        {isLoading ? (
          <div className="flex justify-center items-center p-12 bg-muted/30">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Loading questions data...</p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Question</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Session ID</TableHead>
                <TableHead>Date Asked</TableHead>
                {/* <TableHead>Channel</TableHead> */}
                <TableHead>Reaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionsReport.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="text-center">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium mb-2">No questions found</p>
                      <p className="text-sm text-muted-foreground/80 mb-4">
                        {(searchQuery || selectedUser !== 'all' || selectedSession !== 'all' || dateRange.from || dateRange.to) 
                          ? 'Try adjusting your filters to see more results.'
                          : 'No questions are available in the database.'
                        }
                      </p>
                      {(searchQuery || selectedUser !== 'all' || selectedSession !== 'all' || dateRange.from || dateRange.to) && (
                        <Button variant="outline" onClick={handleResetFilters} size="sm">
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                questionsReport.data.map((question) => (
                  <TableRow key={question.qid || question.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="max-w-md">
                        <p className="truncate" title={question.question}>
                          {question.question}
                        </p>
                        {question.answer && (
                          <p className="text-sm text-muted-foreground truncate mt-1" title={question.answer}>
                            {question.answer}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                        {question.user_id}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                        {question.session_id.substring(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell>{formatDate(question.dateAsked || question.created_at)}</TableCell>
                    {/* <TableCell>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {question.channel || 'N/A'}
                      </span>
                    </TableCell> */}
                    <TableCell>
                      {question.reaction === "thumbs-up" || question.reaction === "like" ? (
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-green-700">Like</span>
                        </div>
                      ) : question.reaction === "thumbs-down" || question.reaction === "dislike" ? (
                        <div className="flex items-center gap-1">
                          <ThumbsDown className="h-4 w-4 text-red-500" />
                          <span className="text-xs text-red-700">Dislike</span>
                        </div>
                      ) : question.reaction ? (
                        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                          {question.reaction}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {questionsReport && questionsReport.data.length > 0 && questionsReport.totalPages > 1 && (
        <TablePagination
          currentPage={page}
          totalPages={questionsReport.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default QuestionsReport;
