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

const QuestionsReport = () => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
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
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      searchQuery,
      page,
      pageSize
    ],
    queryFn: async () => {
      return generateQuestionsReport(
        { page, pageSize },
        selectedUser !== 'all' ? selectedUser : undefined,
        selectedSession !== 'all' ? selectedSession : undefined,
        dateRange.from?.toISOString(),
        dateRange.to?.toISOString(),
        searchQuery
      );
    }
  });

  const users = usersResponse.data;
  const sessions = sessionsResponse.data;

  const filteredSessions = sessions.filter(
    (session) => !selectedUser || session.username === selectedUser
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM dd, yyyy hh:mm a");
  };

  const handleApplyFilters = () => {
    refetch();
  };

  const handleResetFilters = () => {
    setSelectedUser("");
    setSelectedSession("");
    setDateRange({ from: undefined, to: undefined });
    setSearchQuery("");
  };

  React.useEffect(() => {
    setSelectedSession("");
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
                  value={user.username || `user-${user.id}`}
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
                <SelectItem key={session.sessionId || `session-${session.sessionId}`} value={session.sessionId || `session-${session.sessionId}`}>
                  {session.sessionId || `Session ${session.sessionId}`}
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
                <TableHead>User ID</TableHead>
                <TableHead>Session ID</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Date Asked</TableHead>
                <TableHead>Voice</TableHead>
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
                    <TableCell>{question.channel}</TableCell>
                    <TableCell>{formatDate(question.dateAsked)}</TableCell>
                    <TableCell>
                      {question.hasVoiceInput ? (
                        <Mic className="h-4 w-4 text-primary" />
                      ) : null}
                    </TableCell>
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
