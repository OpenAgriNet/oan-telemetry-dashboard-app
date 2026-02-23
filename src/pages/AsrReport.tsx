import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  Mic,
  Timer,
  PhoneCall,
  Search,
  RefreshCw,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { fetchAsr, type PaginationParams } from "@/services/api";
import TablePagination from "@/components/TablePagination";
import { buildDateRangeParams } from "@/lib/utils";

const AsrReport = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRange } = useDateFilter();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 10;

  const [pendingSearch, setPendingSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "ets",
    direction: "desc",
  });

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

  const handleSearch = () => {
    setSearchTerm(pendingSearch);
    resetPage();
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setPendingSearch("");
    const newParams = new URLSearchParams();
    newParams.set("page", "1");
    setSearchParams(newParams);
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
      return <>{sortConfig.direction === "asc" ? " ↑" : " ↓"}</>;
    }
    return <> ↕</>;
  };

  const defaultStats = { totalCalls: 0, successCount: 0, successRate: 0, avgLatency: 0 };

  const {
    data: asrResponse = { data: [], total: 0, totalPages: 0, stats: defaultStats },
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "asr",
      page,
      pageSize,
      searchTerm,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      sortConfig.key,
      sortConfig.direction,
    ],
    enabled: dateRange.from !== undefined && dateRange.to !== undefined,
    queryFn: async () => {
      const params: PaginationParams = { page, limit: pageSize };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const dateParams = buildDateRangeParams(dateRange);
      if (dateParams.startDate) params.startDate = dateParams.startDate;
      if (dateParams.endDate) params.endDate = dateParams.endDate;

      if (sortConfig.key) {
        params.sortBy = sortConfig.key;
        params.sortOrder = sortConfig.direction as "asc" | "desc";
      }

      return fetchAsr(params);
    },
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  const stats = asrResponse.stats ?? defaultStats;

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">ASR Details</h1>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Error loading ASR data</p>
            <p className="text-destructive/80 text-sm mb-4">{(error as Error).message}</p>
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
        <h1 className="text-2xl font-bold tracking-tight">ASR Details</h1>
        <Button onClick={() => refetch()} disabled={isLoading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalCalls.toLocaleString()}</div>
            )}
            <p className="text-xs text-muted-foreground">
              {dateRange.from || dateRange.to ? "Filtered period" : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
            ) : (
              <div className="text-2xl font-bold">{stats.avgLatency.toLocaleString()} ms</div>
            )}
            <p className="text-xs text-muted-foreground">Average response latency</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>ASR Records</CardTitle>
          <CardDescription>Automatic Speech Recognition call logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by SID, language, text..."
                  className="pl-8"
                  value={pendingSearch}
                  onChange={(e) => setPendingSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                  maxLength={1000}
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading} variant="outline" size="icon" title="Search">
                <Search className="h-4 w-4" />
              </Button>
              <Button onClick={handleResetFilters} variant="outline" size="icon" title="Reset">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-12 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading ASR data...</p>
                </div>
              </div>
            ) : asrResponse.total === 0 ? (
              <div className="text-center py-12">
                <Mic className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-2">No ASR records found</p>
                <p className="text-sm text-muted-foreground/80 mb-4">
                  {searchTerm || dateRange.from || dateRange.to
                    ? "Try adjusting your filters."
                    : "No ASR records are available."}
                </p>
                {(searchTerm || dateRange.from || dateRange.to) && (
                  <Button variant="outline" onClick={handleResetFilters} size="sm">
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("sid")}
                    >
                      SID <SortIndicator columnKey="sid" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("language")}
                    >
                      Language <SortIndicator columnKey="language" />
                    </TableHead>
                    <TableHead>Text</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50 text-right"
                      onClick={() => handleSort("latencyms")}
                    >
                      Latency (ms) <SortIndicator columnKey="latencyms" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("ets")}
                    >
                      Created At <SortIndicator columnKey="ets" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asrResponse.data.map((row, idx) => (
                    <TableRow key={row.id ?? idx} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                          {row.sid ? String(row.sid).substring(0, 10) + "..." : "—"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium">
                          {row.language || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground" title={row.text || ""}>
                        {row.text ? String(row.text).substring(0, 60) + (String(row.text).length > 60 ? "…" : "") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.latencyMs != null ? Number(row.latencyMs).toLocaleString() : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.createdAt || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {asrResponse.data.length > 0 && asrResponse.totalPages > 1 && (
              <TablePagination
                currentPage={page}
                totalPages={asrResponse.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AsrReport;
