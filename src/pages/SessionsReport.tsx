
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { generateSessionReport, fetchUsers } from "@/services/api";
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

const SessionsReport = () => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const {
    data: sessionReport = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "sessionReport",
      selectedUser,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    queryFn: () =>
      generateSessionReport(
        selectedUser || undefined,
        dateRange.from?.toISOString(),
        dateRange.to?.toISOString()
      ),
  });

  // Filter report based on search query
  const filteredReport = sessionReport.filter((session) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return session.sessionId.toLowerCase().includes(searchLower);
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM dd, yyyy hh:mm a");
  };

  const handleApplyFilters = () => {
    refetch();
  };

  const handleResetFilters = () => {
    setSelectedUser("");
    setDateRange({ from: undefined, to: undefined });
    setSearchQuery("");
  };

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
              <SelectItem value="">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
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
                <TableHead>User ID</TableHead>
                <TableHead className="text-right">Questions</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Device</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReport.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No data found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReport.map((session) => (
                  <TableRow key={session.sessionId}>
                    <TableCell className="font-medium">
                      {session.sessionId}
                    </TableCell>
                    <TableCell>{session.userId}</TableCell>
                    <TableCell className="text-right">
                      {session.numQuestions}
                    </TableCell>
                    <TableCell>{formatDate(session.startTime)}</TableCell>
                    <TableCell>{formatDate(session.endTime)}</TableCell>
                    <TableCell className="capitalize">{session.device}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default SessionsReport;
