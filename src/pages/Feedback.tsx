import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ThumbsUp, ThumbsDown, Search, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { 
  fetchFeedback, 
  fetchFeedbackStats, 
  fetchUsers, 
  type PaginationParams, 
  type UserPaginationParams,
  fetchAllPages
} from "@/services/api";
import { Download } from "lucide-react";
import TablePagination from "@/components/TablePagination";
import { exportToCSV } from "@/lib/utils";

const FeedbackPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const { dateRange } = useDateFilter();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Reset page when filters change
  const resetPage = () => setPage(1);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  const handleUserChange = (value: string) => {
    setSelectedUser(value);
    resetPage();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedUser("all");
    setPage(1);
  };

  // Fetch users for the filter dropdown
  const { data: usersResponse = { data: [] }, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users-for-feedback-filter"],
    queryFn: () => fetchUsers({ limit: 1000 } as UserPaginationParams),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch feedback statistics
  const { data: feedbackStats = { totalFeedback: 0, totalLikes: 0, totalDislikes: 0 } } = useQuery({
    queryKey: ['feedback-stats', dateRange.from?.toISOString(), dateRange.to?.toISOString()],
    queryFn: async () => {
      const statsParams: PaginationParams = {};

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

      return fetchFeedbackStats(statsParams);
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  // Fetch feedback with server-side pagination and filtering
  const { 
    data: feedbackResponse = { data: [], total: 0, totalPages: 0 }, 
    isLoading,
    error,
    refetch 
  } = useQuery({
    queryKey: [
      'feedback', 
      page, 
      pageSize, 
      searchTerm, 
      selectedUser, 
      dateRange.from?.toISOString(), 
      dateRange.to?.toISOString()
    ],
    queryFn: async () => {
      const params: PaginationParams = {
        page,
        limit: pageSize,
      };

      // Add search filter
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
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

      console.log('Fetching feedback with params:', params);
      const result = await fetchFeedback(params);
      
      // Apply user filter client-side if needed (since API might not support user filtering directly)
      let filteredData = result.data;
      if (selectedUser !== "all") {
        filteredData = result.data.filter(feedback => 
          feedback.userId === selectedUser || feedback.user === selectedUser
        );
      }

      return {
        ...result,
        data: filteredData,
        total: selectedUser !== "all" ? filteredData.length : result.total,
        totalPages: selectedUser !== "all" ? Math.ceil(filteredData.length / pageSize) : result.totalPages
      };
    },
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const users = usersResponse.data;

  const handleApplyFilters = () => {
    refetch();
  };

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">User Feedback</h1>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Error loading feedback data</p>
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
        <h1 className="text-2xl font-bold tracking-tight">User Feedback</h1>
        <div className="flex gap-2">
          <Button onClick={handleApplyFilters} disabled={isLoading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={async () => {
            // Build params for all filters
            const params: PaginationParams = {};
            if (searchTerm.trim()) params.search = searchTerm.trim();
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
            const allFeedback = await fetchAllPages(fetchFeedback, params);
            // Client-side user filter if needed
            const filtered = selectedUser !== "all"
              ? allFeedback.filter(fb => fb.userId === selectedUser || fb.user === selectedUser)
              : allFeedback;
            exportToCSV(filtered, [
              { key: 'date', header: 'Date' },
              { key: 'user', header: 'User' },
              { key: 'question', header: 'Question' },
              { key: 'answer', header: 'Answer' },
              { key: 'rating', header: 'Rating' },
              { key: 'feedback', header: 'Feedback' },
              { key: 'sessionId', header: 'Session ID' },
            ], 'feedback_report.csv');
          }} disabled={isLoading} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download as CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">
              {dateRange.from || dateRange.to ? "Filtered period" : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{feedbackStats.totalLikes}</div>
            <p className="text-xs text-muted-foreground">
              {feedbackStats.totalFeedback > 0 
                ? `${Math.round((feedbackStats.totalLikes / feedbackStats.totalFeedback) * 100)}% positive`
                : "No data"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dislikes</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{feedbackStats.totalDislikes}</div>
            <p className="text-xs text-muted-foreground">
              {feedbackStats.totalFeedback > 0 
                ? `${Math.round((feedbackStats.totalDislikes / feedbackStats.totalFeedback) * 100)}% negative`
                : "No data"
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>User feedback across all sessions with advanced filtering</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search questions or feedback..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8"
                  maxLength={1000}
                />
              </div>
              {/* <Button onClick={handleApplyFilters} disabled={isLoading}>
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
              </Button> */}
            </div>

            <div className="bg-muted/50 p-3 rounded-lg border">
              <p className="text-sm font-medium">
                Total Results: {feedbackResponse.total || 0}
                {feedbackResponse.total > 0 && (
                  <span className="text-muted-foreground ml-2">
                    (Page {page} of {feedbackResponse.totalPages})
                  </span>
                )}
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-12 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading feedback data...</p>
                </div>
              </div>
            ) : feedbackResponse.total === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-2">No feedback found</p>
                <p className="text-sm text-muted-foreground/80 mb-4">
                  {(searchTerm || selectedUser !== 'all' || dateRange.from || dateRange.to) 
                    ? 'Try adjusting your filters to see more results.'
                    : 'No feedback is available in the database.'
                  }
                </p>
                {(searchTerm || selectedUser !== 'all' || dateRange.from || dateRange.to) && (
                  <Button variant="outline" onClick={handleResetFilters} size="sm">
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : feedbackResponse.data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No feedback matches your current filters</p>
                <Button variant="outline" onClick={handleResetFilters} size="sm" className="mt-2">
                  Clear filters
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackResponse.data.map((feedback, index) => (
                    <TableRow key={`${feedback.id}-${index}`} className="hover:bg-muted/30">
                      <TableCell>
                        {format(new Date(feedback.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                          {feedback.user || feedback.userId || "Unknown"}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate" title={feedback.question}>
                          {feedback.question}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate" title={feedback.answer}>
                          {feedback.answer}
                        </div>
                      </TableCell>
                      <TableCell>
                        {feedback.rating === "like" ? (
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-green-700">Like</span>
                          </div>
                        ) : feedback.rating === "dislike" ? (
                          <div className="flex items-center gap-1">
                            <ThumbsDown className="h-4 w-4 text-red-500" />
                            <span className="text-xs text-red-700">Dislike</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                            {feedback.rating}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="truncate" title={feedback.feedback}>
                          {feedback.feedback}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/feedback/${feedback.id}`}
                          className="text-primary hover:underline"
                        >
                          View Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {feedbackResponse.data.length > 0 && feedbackResponse.totalPages > 1 && (
              <TablePagination
                currentPage={page}
                totalPages={feedbackResponse.totalPages}
                onPageChange={setPage}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackPage;
