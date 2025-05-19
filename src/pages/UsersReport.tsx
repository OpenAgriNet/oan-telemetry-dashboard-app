import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { generateUserReport, fetchUsers } from "@/services/api";
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

const UsersReport = () => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: usersResponse = { data: [] }, isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers({ page: 1, pageSize: 1000 }),
  });

  const users = usersResponse.data;

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.id.toLowerCase().includes(searchLower)
    );
  });

  // Calculate pagination for filtered users
  const startIndex = (page - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

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
        <h1 className="text-2xl font-bold tracking-tight">Users Report</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <div>
          <Select
            value={selectedUser}
            onValueChange={setSelectedUser}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
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
            placeholder="Search users..."
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
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <p>Loading users data...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead>Latest Session</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No data found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell className="text-right">
                      {user.sessions}
                    </TableCell>
                    <TableCell>{formatDate(user.latestSession)}</TableCell>
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

export default UsersReport;
