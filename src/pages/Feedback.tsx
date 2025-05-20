import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ThumbsUp, Search } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchFeedback, fetchUsers, type Feedback } from "@/services/api";
import TablePagination from "@/components/TablePagination";
import users from "@/data/users.json";

const FeedbackPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: feedbackResponse = { data: [], total: 0, totalPages: 0 }, isLoading } = useQuery({
    queryKey: ['feedback', page, pageSize],
    queryFn: () => fetchFeedback({ page, pageSize })
  });

  const filteredFeedback = feedbackResponse.data.filter((feedback) => {
    const matchesSearch = feedback.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.feedback.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = selectedUser === "all" || feedback.userId === selectedUser;
    
    const matchesDate = !dateRange.from || !dateRange.to || (
      new Date(feedback.date) >= dateRange.from &&
      new Date(feedback.date) <= dateRange.to
    );

    return matchesSearch && matchesUser && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">User Feedback</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackResponse.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                if (feedbackResponse.data.length === 0) return "0";
                let totalLikes = 0;
                feedbackResponse.data.forEach(fb => {
                  if (fb.rating === "like") totalLikes += 1;
                });
                return totalLikes;
              })()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dislikes</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground rotate-180" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                if (feedbackResponse.data.length === 0) return "0";
                let totalDislikes = 0;
                feedbackResponse.data.forEach(fb => {
                  if (fb.rating === "dislike") totalDislikes += 1;
                });
                return totalDislikes;
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
          <CardDescription>User feedback across all sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex items-center gap-2 md:w-1/3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions or feedback..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="md:w-1/3">
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-1/3">
                <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
              </div>
            </div>

            {isLoading ? (
              <div className="py-8 text-center">Loading feedback data...</div>
            ) : feedbackResponse.data.length === 0 ? (
              <div className="py-8 text-center">No feedback data available</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackResponse.data.map((feedback, index) => {
                    const user = users.find(u => u.id === feedback.userId);
                    return (
                      <TableRow key={`${feedback.id}-${index}`}>
                        <TableCell>
                          {format(new Date(feedback.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>{feedback.user || "Unknown"}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {feedback.question}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {feedback.answer}
                        </TableCell>
                        <TableCell>
                          {feedback.rating === "like" ? "👍" : feedback.rating === "dislike" ? "👎" : feedback.rating}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {feedback.feedback}
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/feedback/${feedback.id}`}
                            className="text-blue-500 hover:underline"
                          >
                            View Details
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            
            <TablePagination
              currentPage={page}
              totalPages={feedbackResponse.totalPages}
              onPageChange={setPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackPage;
