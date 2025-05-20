import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSessions, fetchUsers } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { generateSessionReport } from "@/services/api";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import { API_CONFIG } from "@/config/environment";

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
import { Search } from "lucide-react";
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

  const { data: usersResponse = { data: [] }, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers({ page: 1, pageSize: 1000 }),
  });

  const {
    data: sessionReport = { data: [], total: 0, totalPages: 0 },
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "sessionReport",
      selectedUser,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      searchQuery,
      page,
      pageSize
    ],
    queryFn: async () => {
      const response = await fetch(`${API_CONFIG.SERVER_URL}/sessions`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error('Failed to fetch sessions');
      }

      // Filter sessions based on selected filters
      let filteredSessions = result.data;
      
      if (selectedUser && selectedUser !== 'all') {
        filteredSessions = filteredSessions.filter(session => session.username === selectedUser);
      }
      
      if (dateRange.from || dateRange.to) {
        const from = dateRange.from
          ? new Date(dateRange.from.setHours(0, 0, 0, 0))
          : new Date(0); // earliest possible date
      
        const to = dateRange.to
          ? new Date(dateRange.to.setHours(23, 59, 59, 999))
          : new Date(8640000000000000); // max valid date in JS

        console.log('Date Range Filter:', {
          from: from.toISOString(),
          to: to.toISOString()
        });
      
        filteredSessions = filteredSessions.filter((session) => {
          const sessionDate = new Date(session.sessionTime);
          console.log('Comparing Session:', {
            sessionId: session.sessionId,
            sessionTime: session.sessionTime,
            sessionDate: sessionDate.toISOString(),
            isValid: !isNaN(sessionDate.getTime()),
            isAfterFrom: sessionDate >= from,
            isBeforeTo: sessionDate <= to
          });
          
          return !isNaN(sessionDate.getTime()) && sessionDate >= from && sessionDate <= to;
        });

        console.log('Filtered Sessions Count:', filteredSessions.length);
      }
      
      
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredSessions = filteredSessions.filter(session => 
          session.sessionId.toLowerCase().includes(searchLower)
        );
      }

      // Apply pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedSessions = filteredSessions.slice(start, end);

      return {
        data: paginatedSessions,
        total: filteredSessions.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredSessions.length / pageSize)
      };
    },
  });

  const users = usersResponse.data;

  console.log('Available users:', users);

  const handleSessionClick = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM dd, yyyy hh:mm a");
  };

  const handleApplyFilters = () => {
    refetch();
  };

  const handleResetFilters = () => {
    setSelectedUser("all");
    setDateRange({ from: undefined, to: undefined });
    setSearchQuery("");
  };

  const paginatedSessions = sessionReport.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Sessions Report</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <div>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.username}>
                  {user.username || `User ${user.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by session ID..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={handleApplyFilters}>Apply</Button>
          <Button variant="outline" onClick={handleResetFilters}>
            Reset
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        {isLoading || isLoadingUsers ? (
          <div className="flex justify-center items-center p-8">
            <p>Loading session data...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead >Questions</TableHead>
                <TableHead>Session time</TableHead>
                {/* <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Device</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No data found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSessions.map((session, idx) => (
                  <TableRow key={session.sessionId || idx}>
                    <TableCell className="font-medium">
                      {/* <button
                        onClick={() => handleSessionClick(session.sessionId)}
                        className="text-primary hover:underline"
                      > */}
                        {session.sessionId}
                      {/* </button>
                     */}
                     </TableCell>
                    <TableCell>{session.username}</TableCell>
                    <TableCell className="text-right">
                      {session.questionCount}
                    </TableCell>
                    <TableCell>{formatDate(session.sessionTime)}</TableCell>
                    {/* <TableCell>{formatDate(session.startTime)}</TableCell>
                    <TableCell>{formatDate(session.endTime)}</TableCell> */}
                    {/* <TableCell className="capitalize">{session.device}</TableCell> */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <TablePagination 
        currentPage={page}
        totalPages={sessionReport.totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default SessionsReport;
