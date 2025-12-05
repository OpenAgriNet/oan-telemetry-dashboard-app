import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchQuestions,
  fetchUsers,
  fetchSessions,
  type QuestionPaginationParams,
  type UserPaginationParams,
  type SessionPaginationParams,
  type Question,
} from "@/services/api";
import TablePagination from "@/components/TablePagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Mic,
  Search,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  AlertCircle,
  MessageSquare, RotateCcw,
} from "lucide-react";
import { useDateFilter } from "@/contexts/DateFilterContext";
import {
  formatUtcDateWithPMCorrection,
  formatUTCToIST,
  buildDateRangeParams,
} from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { set } from "date-fns";
const QuestionsReport = () => {
  const { dateRange } = useDateFilter();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get pagination state from URL params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 10;

  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortConfig, setSortConfig] = useState({
    key: "dateAsked",
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
    setSelectedSession("all"); // Reset session when user changes
    resetPage();
  };

  const handleSessionChange = (sessionId: string) => {
    setSelectedSession(sessionId);
    resetPage();
  };

  const [pendingSearch, setPendingSearch] = useState<string>("");
  const handleSearchQueryChange = (query: string) => {
    setPendingSearch(query);
  };

  const handleSearch = () => {
    setSearchQuery(pendingSearch);
    resetPage();
  };

  const handleResetFilters = () => {
    setSelectedUser("all");
    setSelectedSession("all");
    setSearchQuery("");
    setPendingSearch("");
    const newParams = new URLSearchParams();
    newParams.set("page", "1");
    setSearchParams(newParams);
  };
  const handleSessionClick = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };
  const handleQuestionClick = (id: string) => {
    navigate(`/questions/${id}`);
  };

  // Fetch users with search parameter if needed
  // const { data: usersResponse = { data: [] }, isLoading: isLoadingUsers } =
  //   useQuery({
  //     queryKey: ["users-for-filter"],
  //     queryFn: () => fetchUsers({ limit: 1000 } as UserPaginationParams),
  //     staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  //   });

  // Fetch sessions with search parameter based on selected user
  // const {
  //   data: sessionsResponse = { data: [] },
  //   isLoading: isLoadingSessions,
  // } = useQuery({
  //   queryKey: ["sessions-for-filter", selectedUser],
  //   queryFn: () => {
  //     const params: SessionPaginationParams = {
  //       limit: 1000,
  //     };

  //     // Use search parameter to filter sessions by selected user
  //     if (selectedUser !== "all") {
  //       params.search = selectedUser;
  //     }

  //     return fetchSessions(params);
  //   },
  //   staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  // });
console.log("Questions",dateRange)
console.log("Questions from",dateRange.from)
console.log("Questions from ISO",dateRange.from?.toISOString())
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
      pageSize,
      sortConfig.key,
      sortConfig.direction,
    ],
    enabled: dateRange.from !== undefined && dateRange.to !== undefined,
    queryFn: async () => {
      const params: QuestionPaginationParams = {
        page,
        limit: pageSize,
      };

      // Build search terms array for proper search
      const searchTerms: string[] = [];

      // Add user search if selected
      if (selectedUser !== "all") {
        searchTerms.push(selectedUser);
      }

      // Add session search if selected
      if (selectedSession !== "all") {
        searchTerms.push(selectedSession);
      }

      // Add text search if provided
      if (searchQuery.trim()) {
        searchTerms.push(searchQuery.trim());
      }

      // Combine search terms - the backend will OR search across all fields
      if (searchTerms.length > 0) {
        params.search = searchTerms.join(" ");
      }

      // Format dates for API (backend expects ISO strings or Unix timestamps)
      // if (dateRange.from) {
      //   const fromDate = new Date(dateRange.from);
      //   fromDate.setHours(0, 0, 0, 0);
      //   params.startDate = fromDate.toISOString();
      // }

      // if (dateRange.to) {
      //   const toDate = new Date(dateRange.to);
      //   toDate.setHours(23, 59, 59, 999);
      //   params.endDate = toDate.toISOString();
      // } else if (dateRange.from) {
      //   // If only from date is provided, use same day end as to date
      //   const toDate = new Date(dateRange.from);
      //   toDate.setHours(23, 59, 59, 999);
      //   params.endDate = toDate.toISOString();
      // }
       const dateParams = buildDateRangeParams(dateRange);
            if (dateParams.startDate) params.startDate = dateParams.startDate;
            if (dateParams.endDate) params.endDate = dateParams.endDate;

      console.log("Fetching questions with params:", params);

      const response = await fetchQuestions(params);
      console.log("Questions response:", response);

      // Client-side sorting
      const sortedData = [...response.data].sort((a, b) => {
        let aValue = a[sortConfig.key] ?? "";
        let bValue = b[sortConfig.key] ?? "";
        if (sortConfig.key === "dateAsked" || sortConfig.key === "created_at") {
          aValue = new Date(String(aValue)).getTime();
          bValue = new Date(String(bValue)).getTime();
        }
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
      return { ...response, data: sortedData };
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

  const totalQuestions = questionsReport.total;

  // const users = usersResponse.data;
  // const sessions = sessionsResponse.data;

  const handleApplyFilters = () => {
    refetch();
  };

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIndicator = ({ columnKey }: { columnKey: string }) => {
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
          <h1 className="text-2xl font-bold tracking-tight">
            Questions Report
          </h1>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">
              Error loading questions data
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
        <h1 className="text-2xl font-bold tracking-tight">Questions Report</h1>
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

      {/* Question Stats Metric Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Questions
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                totalQuestions.toLocaleString()
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange.from || dateRange.to ? "Filtered period" : "All time"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search based on question & username..."
            className="pl-8"
            value={pendingSearch}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
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
                <TableHead
                  className="w-[400px] cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("question")}
                >
                  Question
                  {/* <SortIndicator columnKey="question" /> */}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("user_id")}
                >
                  User
                  {/* <SortIndicator columnKey="user_id" /> */}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("session_id")}
                >
                  Session ID
                  {/* <SortIndicator columnKey="session_id" /> */}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("dateAsked")}
                >
                  Date Asked
                  {/* <SortIndicator columnKey="dateAsked" /> */}
                </TableHead>
                {/* <TableHead>Channel</TableHead> */}
                {/* <TableHead>Reaction</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionsReport.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="text-center">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground font-medium mb-2">
                        No questions found
                      </p>
                      <p className="text-sm text-muted-foreground/80 mb-4">
                        {searchQuery ||
                        selectedUser !== "all" ||
                        selectedSession !== "all" ||
                        dateRange.from ||
                        dateRange.to
                          ? "Try adjusting your filters to see more results."
                          : "No questions are available in the database."}
                      </p>
                      {(searchQuery ||
                        selectedUser !== "all" ||
                        selectedSession !== "all" ||
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
                  </TableCell>
                </TableRow>
              ) : (
                questionsReport.data.map((question, index) => (
                  <TableRow
                    key={`${
                      question.qid || question.id || "question"
                    }-${index}`}
                    className="hover:bg-muted/30"
                  >
                    <TableCell className="font-medium">
                      <div className="max-w-md">
                        <button
                          className="truncate text-left text-primary hover:underline bg-transparent border-none p-0 m-0 w-full"
                          title={question.question}
                          onClick={() => handleQuestionClick(question.id)}
                          type="button"
                        >
                          {question.question}
                        </button>
                        {question.answer && (
                          <p
                            className="text-sm text-muted-foreground truncate mt-1"
                            title={question.answer}
                          >
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
                      <button
                        onClick={() => handleSessionClick(question.session_id)}
                        className="text-primary hover:underline"
                      >
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                          {question.session_id.substring(0, 8)}...
                        </code>
                      </button>
                    </TableCell>
                    <TableCell>
                      {formatUTCToIST(
                        question.created_at || ""
                      )}
                    </TableCell>
                    {/* <TableCell>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {question.channel || 'N/A'}
                      </span>
                    </TableCell> */}
                    {/* <TableCell>
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
                    </TableCell> */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {questionsReport &&
        questionsReport.data.length > 0 &&
        questionsReport.totalPages > 1 && (
          <TablePagination
            currentPage={page}
            totalPages={questionsReport.totalPages}
            onPageChange={handlePageChange}
          />
        )}
    </div>
  );
};

export default QuestionsReport;
