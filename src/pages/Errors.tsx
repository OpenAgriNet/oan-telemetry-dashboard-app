import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import { AlertTriangle, Search, RefreshCw, Bug, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useKeycloak } from "@react-keycloak/web";
import { isSuperAdmin } from "@/utils/roleUtils";
import { buildDateRangeParams } from "@/lib/utils";
import {
  fetchErrors,
  fetchErrorStats,
  type ErrorPaginationParams,
  type PaginationParams,
} from "@/services/api";
import TablePagination from "@/components/TablePagination";

const ErrorsPage = () => {
  const { keycloak } = useKeycloak();
  const [searchTerm, setSearchTerm] = useState("");
  const { dateRange } = useDateFilter();
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "desc",
  });

  // Reset page when filters change
  const resetPage = () => setPage(1);

  const [pendingSearch, setPendingSearch] = useState("");
  const handleSearchChange = (value: string) => {
    setPendingSearch(value);
  };

  const handleSearch = () => {
    setSearchTerm(pendingSearch);
    resetPage();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setPendingSearch("");
    setPage(1);
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

  // Fetch error statistics
  const { data: errorStats = { totalErrors: 0 }, isLoading: isLoadingStats } =
    useQuery({
      queryKey: [
        "error-stats",
        dateRange.from?.toISOString(),
        dateRange.to?.toISOString(),
      ],
      queryFn: async () => {
        const statsParams: PaginationParams = {};

        // Add date range filter using unified utility
        const dateParams = buildDateRangeParams(dateRange);
        if (dateParams.startDate) statsParams.startDate = dateParams.startDate;
        if (dateParams.endDate) statsParams.endDate = dateParams.endDate;

        return fetchErrorStats(statsParams);
      },
      staleTime: 2 * 60 * 1000, // Cache for 2 minutes
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Keep old page data while fetching the next
      placeholderData: (prev) => prev,
      gcTime: 5 * 60 * 1000,
      refetchOnMount: false,
    });

  // Fetch errors with server-side pagination and filtering
  const {
    data: errorsResponse = { data: [], total: 0, totalPages: 0 },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "errors",
      page,
      pageSize,
      searchTerm,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      sortConfig.key,
      sortConfig.direction,
    ],
    queryFn: async () => {
      const params: ErrorPaginationParams = {
        page,
        limit: pageSize,
      };

      // Add search filter
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      // Add date range filter using unified utility
      const dateParams = buildDateRangeParams(dateRange);
      if (dateParams.startDate) params.startDate = dateParams.startDate;
      if (dateParams.endDate) params.endDate = dateParams.endDate;

      console.log("Fetching errors with params:", params);
      const result = await fetchErrors(params);

      // Client-side sorting
      const sortedData = [...result.data].sort((a, b) => {
        let aValue = a[sortConfig.key as keyof typeof a] ?? "";
        let bValue = b[sortConfig.key as keyof typeof b] ?? "";
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
    // placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  // Check if user has super-admin role (after all hooks)
  if (!isSuperAdmin(keycloak)) {
    return (
      <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive font-medium mb-2">Access Denied</p>
          <p className="text-destructive/80 text-sm">
            You don't have permission to access this page. Only super-admin
            users can view errors.
          </p>
        </div>
      </div>
    );
  }

  const handleApplyFilters = () => {
    refetch();
  };

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Error Details</h1>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">
              Error loading error data
            </p>
            <p className="text-destructive/80 text-sm mb-4">
              {(error as Error).message}
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Error Details</h1>
      </div>

      {/* Statistics Card */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? "..." : errorStats.totalErrors.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Total error occurrences recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search Errors</CardTitle>
          <CardDescription>
            Search through error messages, users, sessions, and channels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search based on error message or username..."
                  value={pendingSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="pl-8"
                />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={isLoading} variant="outline" size="icon" title="Search">
              <Search className="h-4 w-4" />
            </Button>
            <Button onClick={handleResetFilters} variant="outline" size="icon" title="Reset Search">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Errors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Error Log ({errorsResponse.total} total)</CardTitle>
          <CardDescription>
            View error occurrences and related information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("date")}
                      >
                        Date
                        {/* {SortIndicator({ columnKey: "date" })} */}
                      </TableHead>
                      <TableHead>Error Message</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorsResponse.data.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No errors found matching your criteria.
                        </TableCell>
                      </TableRow>
                    ) : (
                      errorsResponse.data.map((errorItem) => (
                        <TableRow key={errorItem.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium">
                                {errorItem.date}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {errorItem.time}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-md">
                              <p className="truncate font-medium">
                                {errorItem.errorMessage}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {errorItem.userId ? (
                              <Link
                                to={`/users?search=${errorItem.userId}`}
                                className="hover:underline text-sm"
                              >
                                {errorItem.userId}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {errorItem.sessionId ? (
                              <Link
                                to={`/sessions/${errorItem.sessionId}`}
                                className="hover:underline text-sm"
                              >
                                {errorItem.sessionId.slice(0, 8)}...
                              </Link>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {errorItem.channel ? (
                              <Badge variant="outline" className="text-xs">
                                {errorItem.channel}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                N/A
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Link
                              to={`/errors/${errorItem.id}`}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                            >
                              View Details
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4">
                <TablePagination
                  currentPage={page}
                  totalPages={errorsResponse.totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorsPage;
