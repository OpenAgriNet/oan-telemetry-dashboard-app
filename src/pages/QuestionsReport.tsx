import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  generateQuestionsReport,
  fetchUsers,
  fetchSessions,
  type PaginationParams
} from "@/services/api";
import TablePagination from "@/components/TablePagination";
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
import { Mic, Search, ThumbsUp, ThumbsDown } from "lucide-react";
import DateRangePicker from "@/components/dashboard/DateRangePicker";

// Utility function to adjust dates for IST to UTC conversion
const adjustDateForUTC = (date: Date | undefined): Date | undefined => {
  if (!date) return undefined;
  
  // Create a new date object to avoid mutating the original
  const adjustedDate = new Date(date);
  
  // IST is UTC+5:30, so subtract 5 hours and 30 minutes to get UTC time
  adjustedDate.setHours(adjustedDate.getHours() - 5);
  adjustedDate.setMinutes(adjustedDate.getMinutes() - 30);
  
  return adjustedDate;
};

const QuestionsReport = () => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: usersResponse = { data: [] }, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers({ page: 1, pageSize: 1000 }),
  });

  const { data: sessionsResponse = { data: [] }, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => fetchSessions({ page: 1, pageSize: 1000 }),
  });

  const {
    data: questionsReport = { data: [], total: 0, totalPages: 0 },
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "questionsReport",
      selectedUser,
      selectedSession,
      dateRange.from ? dateRange.from.toISOString() : undefined,
      dateRange.to ? 
        new Date(dateRange.to).toISOString() : 
        dateRange.from ? new Date(dateRange.from).toISOString() : undefined,
      searchQuery,
      page,
      pageSize
    ],
    queryFn: async () => {
      // Apply IST to UTC offset adjustment before sending to API
      const fromDate = dateRange.from ? adjustDateForUTC(new Date(dateRange.from)) : undefined;
      
      let toDate;
      if (dateRange.to) {
        // Set to end of day and adjust for UTC
        const endOfDay = new Date(dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        toDate = adjustDateForUTC(endOfDay);
      } else if (dateRange.from) {
        // If only from date is provided, use same day end as to date
        const endOfDay = new Date(dateRange.from);
        endOfDay.setHours(23, 59, 59, 999);
        toDate = adjustDateForUTC(endOfDay);
      }

      console.log('Requesting with params:', {
        page, 
        pageSize,
        user: selectedUser !== 'all' ? selectedUser : undefined,
        session: selectedSession !== 'all' ? selectedSession : undefined,
        fromDate: fromDate?.toISOString(),
        toDate: toDate?.toISOString(),
        search: searchQuery
      });

      const response = await generateQuestionsReport(
        { page, pageSize },
        selectedUser !== 'all' ? selectedUser : undefined,
        selectedSession !== 'all' ? selectedSession : undefined,
        fromDate ? fromDate.toISOString() : undefined,
        toDate ? toDate.toISOString() : undefined,
        searchQuery
      );
      console.log('Questions report response:', response);
      return response;
    },
    // Don't auto-refetch on window focus to avoid unexpected changes
    refetchOnWindowFocus: false
  });

  const users = usersResponse.data;
  const sessions = sessionsResponse.data;

  const filteredSessions = sessions.filter(
    (session) => selectedUser === 'all' || session.username === selectedUser
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM dd, yyyy hh:mm a");
  };

  const handleApplyFilters = () => {
    setPage(1); // Reset to first page when applying new filters
    refetch();
  };

  const handleResetFilters = () => {
    setSelectedUser("all");
    setSelectedSession("all");
    setDateRange({ from: undefined, to: undefined });
    setSearchQuery("");
    setPage(1);
  };

  React.useEffect(() => {
    setSelectedSession("all");
  }, [selectedUser]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Questions Report</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem 
                  key={user.id} 
                  value={user.username || user.id}
                >
                  {user.username || `User ${user.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger>
              <SelectValue placeholder="All Sessions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {filteredSessions.map((session) => (
                <SelectItem key={session.sessionId} value={session.sessionId}>
                  {session.sessionId}
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
              placeholder="Search questions..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApplyFilters}>Apply Filters</Button>
        <Button variant="outline" onClick={handleResetFilters}>
          Reset Filters
        </Button>
      </div>

      <div className="bg-muted/50 p-3 rounded-md">
        <p className="text-sm font-medium">
          Total Questions: {questionsReport.total || 0}
        </p>
      </div>

      <div className="border rounded-md">
        {isLoading || isLoadingUsers || isLoadingSessions ? (
          <div className="flex justify-center items-center p-8">
            <p>Loading questions data...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Question</TableHead>
                <TableHead>User </TableHead>
                <TableHead>Session ID</TableHead>
                {/* <TableHead>Channel</TableHead> */}
                <TableHead>Date Asked</TableHead>
                {/* <TableHead>Voice</TableHead> */}
                <TableHead>Reaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionsReport.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No data found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                questionsReport.data.map((question) => (
                  <TableRow key={question.qid}>
                    <TableCell className="font-medium">
                      {question.question}
                    </TableCell>
                    <TableCell>{question.user_id}</TableCell>
                    <TableCell>{question.session_id}</TableCell>
                    {/* <TableCell>{question.channel}</TableCell> */}
                    <TableCell>{formatDate(question.dateAsked)}</TableCell>
                    {/* <TableCell>
                      {question.hasVoiceInput ? (
                        <Mic className="h-4 w-4 text-primary" />
                      ) : null}
                    </TableCell> */}
                    <TableCell>
                      {question.reaction === "thumbs-up" ? (
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                      ) : question.reaction === "thumbs-down" ? (
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                      ) : (
                        question.reaction
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {questionsReport && questionsReport.data.length > 0 && (
        <TablePagination
          currentPage={page}
          totalPages={questionsReport.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};

export default QuestionsReport;
