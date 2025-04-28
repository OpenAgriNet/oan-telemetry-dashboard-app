
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  generateQuestionsReport,
  fetchUsers,
  fetchSessions,
} from "@/services/api";
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
import { Mic, Search, ThumbsUp, ThumbsDown } from "lucide-react";

const QuestionsReport = () => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });

  const {
    data: questionsReport = [],
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
    ],
    queryFn: () =>
      generateQuestionsReport(
        selectedUser || undefined,
        selectedSession || undefined,
        dateRange.from?.toISOString(),
        dateRange.to?.toISOString(),
        searchQuery || undefined
      ),
  });

  // Filter sessions based on selected user
  const filteredSessions = sessions.filter(
    (session) => !selectedUser || session.userId === selectedUser
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

  // Reset selected session when user changes
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
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
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

      <div className="border rounded-md">
        {isLoading || isLoadingUsers || isLoadingSessions ? (
          <div className="flex justify-center items-center p-8">
            <p>Loading questions data...</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Question Text</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Session ID</TableHead>
                <TableHead>Date Asked</TableHead>
                <TableHead>Voice</TableHead>
                <TableHead>Reaction</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionsReport.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No data found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                questionsReport.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="font-medium">
                      {question.text}
                    </TableCell>
                    <TableCell>{question.userId}</TableCell>
                    <TableCell>{question.sessionId}</TableCell>
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
    </div>
  );
};

export default QuestionsReport;
