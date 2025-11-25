import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Search,
  RefreshCw,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDateFilter } from "@/contexts/DateFilterContext";
import {
  fetchFeedback,
  fetchUsers,
  type PaginationParams,
  type UserPaginationParams,
} from "@/services/api";
import TablePagination from "@/components/TablePagination";
import { buildDateRangeParams } from "@/lib/utils";

const FeedbackPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRange } = useDateFilter();

  // Get pagination state from URL params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 10;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "date",
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

  const [pendingSearch, setPendingSearch] = useState("");
  const handleSearchChange = (value: string) => {
    setPendingSearch(value);
  };

  const handleSearch = () => {
    setSearchTerm(pendingSearch);
    resetPage();
  };

  const handleUserChange = (value: string) => {
    setSelectedUser(value);
    resetPage();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setPendingSearch("");
    setSelectedUser("all");
    const newParams = new URLSearchParams();
    newParams.set("page", "1");
    setSearchParams(newParams);
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

  // Fetch users for the filter dropdown
  // const { data: usersResponse = { data: [] }, isLoading: isLoadingUsers } =
  //   useQuery({
  //     queryKey: ["users-for-feedback-filter"],
  //     queryFn: () => fetchUsers({ limit: 1000 } as UserPaginationParams),
  //     staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  //   });

  // Fetch feedback with server-side pagination and filtering
  const {
    data: feedbackResponse = { data: [], total: 0, totalPages: 0, totalLikes: 0, totalDislikes: 0 },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "feedback",
      page,
      pageSize,
      searchTerm,
      selectedUser,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      sortConfig.key,
      sortConfig.direction,
    ],
    enabled: dateRange.from !== undefined && dateRange.to !== undefined,
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

      console.log("Fetching feedback with params:", params);
      const result = await fetchFeedback(params);

      // Client-side sorting
      const sortedData = [...result.data].sort((a, b) => {
        let aValue = a[sortConfig.key] ?? "";
        let bValue = b[sortConfig.key] ?? "";
        if (sortConfig.key === "date") {
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
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const feedbackStats = {
    totalFeedback: feedbackResponse.total,
    totalLikes: feedbackResponse.totalLikes ?? 0,
    totalDislikes: feedbackResponse.totalDislikes ?? 0,
  };
  const isLoadingStats = isLoading;

  // const users = usersResponse.data;

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
            <p className="text-destructive font-medium mb-2">
              Error loading feedback data
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
        <h1 className="text-2xl font-bold tracking-tight">User Feedback</h1>
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
              Total Feedback
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">
                {feedbackStats.totalFeedback}
              </div>
            )}
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
            {isLoadingStats ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {feedbackStats.totalLikes}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {isLoadingStats ? (
                <span className="h-4 w-16 bg-muted animate-pulse rounded inline-block" />
              ) : feedbackStats.totalFeedback > 0 ? (
                `${Math.round(
                  (feedbackStats.totalLikes / feedbackStats.totalFeedback) * 100
                )}% positive`
              ) : (
                "No data"
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Dislikes
            </CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold text-red-600">
                {feedbackStats.totalDislikes}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {isLoadingStats ? (
                <span className="h-4 w-16 bg-muted animate-pulse rounded inline-block" />
              ) : feedbackStats.totalFeedback > 0 ? (
                `${Math.round(
                  (feedbackStats.totalDislikes / feedbackStats.totalFeedback) *
                    100
                )}% negative`
              ) : (
                "No data"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>
            User feedback across all sessions with advanced filtering
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search questions, feedback or users..."
                  value={pendingSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="pl-8"
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
                    Loading feedback data...
                  </p>
                </div>
              </div>
            ) : feedbackResponse.total === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-2">
                  No feedback found
                </p>
                <p className="text-sm text-muted-foreground/80 mb-4">
                  {searchTerm ||
                  selectedUser !== "all" ||
                  dateRange.from ||
                  dateRange.to
                    ? "Try adjusting your filters to see more results."
                    : "No feedback is available in the database."}
                </p>
                {(searchTerm ||
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
            ) : feedbackResponse.data.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No feedback matches your current filters
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
                      onClick={() => handleSort("date")}
                    >
                      Date
                      <SortIndicator columnKey="date" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("user")}
                    >
                      User
                      <SortIndicator columnKey="user" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("question")}
                    >
                      Question
                      <SortIndicator columnKey="question" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("answer")}
                    >
                      Answer
                      <SortIndicator columnKey="answer" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("rating")}
                    >
                      Rating
                      <SortIndicator columnKey="rating" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("feedback")}
                    >
                      Feedback
                      <SortIndicator columnKey="feedback" />
                    </TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackResponse.data.map((feedback, index) => (
                    <TableRow
                      key={`${feedback.id}-${index}`}
                      className="hover:bg-muted/30"
                    >
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
                            <span className="text-xs text-red-700">
                              Dislike
                            </span>
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

            {feedbackResponse.data.length > 0 &&
              feedbackResponse.totalPages > 1 && (
                <TablePagination
                  currentPage={page}
                  totalPages={feedbackResponse.totalPages}
                  onPageChange={handlePageChange}
                />
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackPage;
