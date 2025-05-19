import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSessions, fetchUsers } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { generateSessionReport } from "@/services/api";
import DateRangePicker from "@/components/dashboard/DateRangePicker";

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
      page,
      pageSize
    ],
    queryFn: () =>
      fetchSessions({
        page,
        pageSize,
        username: selectedUser === "all" ? undefined : selectedUser,
        startDate: dateRange.from?.toISOString(),
        endDate: dateRange.to?.toISOString()
      }),
  });

  const users = usersResponse.data;

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

  const filteredReport = sessionReport.data.filter((session) => {
    if (selectedUser !== "all" && session.username !== selectedUser) {
      return false;
    }
    
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return session.sessionId.toLowerCase().includes(searchLower);
  });

  // Calculate pagination for filtered report
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedSessions = filteredReport.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredReport.length / pageSize);

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
                <SelectItem key={user.username } value={user.username}>
                  {user.username}
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
                      <button
                        onClick={() => handleSessionClick(session.sessionId)}
                        className="text-primary hover:underline"
                      >
                        {session.sessionId}
                      </button>
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
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default SessionsReport;
