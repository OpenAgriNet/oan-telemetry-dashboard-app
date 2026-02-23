import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDevices, type Device } from "@/services/api";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { buildDateRangeParams } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, RefreshCw, RotateCcw, MonitorSmartphone, Users, UserPlus, UserCheck } from "lucide-react";
import TablePagination from "@/components/TablePagination";
import { useStats } from "@/contexts/StatsContext";

// DeviceReport page for /devices endpoint
const DeviceReport = () => {
  const { dateRange } = useDateFilter();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingSearch, setPendingSearch] = useState("");

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
  };

  const handleSearchChange = (query: string) => {
    setPendingSearch(query);
  };

  const handleSearch = () => {
    setSearchQuery(pendingSearch);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setPendingSearch("");
    const newParams = new URLSearchParams();
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const {
    data: devicesResponse = { data: [], total: 0, totalPages: 0 },
    isLoading,
    error,
    refetch,
  } = useQuery<{ data: Device[]; total: number; totalPages: number }>({
    queryKey: [
      "devices",
      searchQuery,
      page,
      pageSize,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    queryFn: async () => {
      const params: {
        page: number;
        limit: number;
        search?: string;
        startDate?: string;
        endDate?: string;
      } = {
        page,
        limit: pageSize,
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      // if (dateRange.from) params.startDate = dateRange.from.toISOString();
      // if (dateRange.to) params.endDate = dateRange.to.toISOString();
      const dateParams = buildDateRangeParams(dateRange);

      if (dateParams.startDate) params.startDate = dateParams.startDate;
      if (dateParams.endDate) params.endDate = dateParams.endDate;
      
      return await fetchDevices(params);
    },
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { stats, isLoading: isStatsLoading, error: statsError } = useStats();

  // Extract stats with fallbacks
  const totalUsers = stats?.totalUsers ?? 0;
  const totalNewUsers = stats?.totalNewUsers ?? 0;
  const totalReturningUsers = stats?.totalReturningUsers ?? 0;

  const paginatedDevices = devicesResponse.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Unique Devices Report</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => refetch()}
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
              Total Unique Devices
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                totalUsers.toLocaleString() || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              unique active devices in selected period
            </p>
          </CardContent>
        </Card>

           <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Devices</CardTitle>
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
              first-time active devices
            </p>
          </CardContent>
        </Card>

          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returning Devices</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isStatsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              ) : (
                totalReturningUsers.toLocaleString() || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              active devices with prior activity
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Device List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by fingerprint ID..."
                  className="pl-8"
                  value={pendingSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
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
                  <p className="text-muted-foreground">
                    Loading devices data...
                  </p>
                </div>
              </div>
            ) : devicesResponse.total === 0 ? (
              <div className="text-center py-12">
                <MonitorSmartphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-2">
                  No devices found
                </p>
                <p className="text-sm text-muted-foreground/80 mb-4">
                  {searchQuery
                    ? "Try adjusting your search to see more results."
                    : "No devices are available in the database."}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    size="sm"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fingerprint ID</TableHead>
                    <TableHead>Browser</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>OS</TableHead>
                    {/* <TableHead>First Seen</TableHead>
                    <TableHead>Last Seen</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDevices.map((device, idx) => (
                    <TableRow key={device.fingerprint_id || idx}>
                      <TableCell>
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                          {device.fingerprint_id}
                        </code>
                      </TableCell>
                      <TableCell>
                        {device.browser_name} {device.browser_version}
                      </TableCell>
                      <TableCell>
                        {device.device_name} {device.device_model}
                      </TableCell>
                      <TableCell>
                        {device.os_name} {device.os_version}
                      </TableCell>
                      {/* <TableCell>{device.first_seen_at}</TableCell>
                      <TableCell>{device.last_seen_at}</TableCell> */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {paginatedDevices.length > 0 && devicesResponse.totalPages > 1 && (
              <TablePagination
                currentPage={page}
                totalPages={devicesResponse.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeviceReport;
