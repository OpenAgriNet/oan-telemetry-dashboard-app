
import React, { useState } from "react";
import { Link } from "react-router-dom";
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
import { MessageSquare, ThumbsUp, Search } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import sessions from "@/data/sessions.json";
import users from "@/data/users.json";

const feedbackData = [
  {
    id: "fb1",
    sessionId: "ses001",
    userId: "user1",
    questionText: "How do I improve my presentation skills?",
    feedback: "Very helpful response",
    rating: 5,
    timestamp: "2025-04-28T09:01:45Z",
  },
  {
    id: "fb2",
    sessionId: "ses002",
    userId: "user2",
    questionText: "What are effective time management techniques?",
    feedback: "Clear and practical advice",
    rating: 4,
    timestamp: "2025-04-28T10:15:30Z",
  },
];

const Feedback = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const filteredFeedback = feedbackData.filter((feedback) => {
    const matchesSearch = feedback.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.feedback.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUser = selectedUser === "all" || feedback.userId === selectedUser;
    
    const matchesDate = !dateRange.from || !dateRange.to || (
      new Date(feedback.timestamp) >= dateRange.from &&
      new Date(feedback.timestamp) <= dateRange.to
    );

    return matchesSearch && matchesUser && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">User Feedback</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredFeedback.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(filteredFeedback.reduce((acc, fb) => acc + fb.rating, 0) / filteredFeedback.length || 0).toFixed(1)}
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
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:w-1/3">
                <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback.map((feedback) => {
                  const user = users.find(u => u.id === feedback.userId);
                  return (
                    <TableRow key={feedback.id}>
                      <TableCell>
                        {format(new Date(feedback.timestamp), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{user?.name || "Unknown"}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {feedback.questionText}
                      </TableCell>
                      <TableCell>{feedback.rating}/5</TableCell>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Feedback;
