import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LogIn,
  MessageSquare,
  Mic,
  Languages,
  MessageSquareHeart,
  Smile,
  Volume,
  SmilePlus,
  User,
  MessageCircle,
  Calendar
} from "lucide-react";
import { fetchSessionEvents, fetchSessions, fetchUsers } from "@/services/api";

const SessionDetails = () => {
  const { sessionId } = useParams();

  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["sessionEvents", sessionId],
    queryFn: () => fetchSessionEvents(sessionId || ""),
    enabled: !!sessionId,
  });

  const currentSession = sessions.find(s => s.sessionId === sessionId);
  const user = currentSession ? users.find(u => u.id === currentSession.userId) : null;
  const userStats = user ? getUserStats(user.id, sessions) : null;

  if (isLoading) {
    return <div>Loading session details...</div>;
  }

  // Function to get user stats
  function getUserStats(userId: string, sessions: any[]) {
    const userSessions = sessions.filter(session => session.userId === userId);
    return {
      totalSessions: userSessions.length,
      totalQuestions: userSessions.reduce((acc, session) => acc + session.numQuestions, 0),
      firstSession: userSessions.length > 0 
        ? format(new Date(userSessions[0].startTime), "MMM dd, yyyy")
        : "N/A"
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Session Details: {sessionId}
        </h1>
      </div>

      {user && userStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.name}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">Since {userStats.firstSession}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalQuestions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Event Timeline</CardTitle>
          <CardDescription>
            Chronological sequence of events in this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-4 pt-4 pb-4">
            {events.map((event, index) => (
              <div
                key={`${event.type}-${index}`}
                className="flex items-start gap-4"
              >
                <div className="relative flex h-full items-center">
                  <div className="absolute left-0 h-full w-px bg-border -translate-x-1/2" />
                  <div className="relative h-2 w-2 rounded-full bg-primary" />
                </div>
                <div className="flex flex-1 gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    {event.icon && <event.icon className="h-4 w-4" />}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{event.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(event.timestamp), "HH:mm:ss")}
                      </p>
                    </div>
                    {event.sampleData && (
                      <div className="rounded-md bg-muted p-3 text-sm">
                        {typeof event.sampleData === "string" ? (
                          event.sampleData
                        ) : Array.isArray(event.sampleData) ? (
                          <ul className="list-inside list-disc space-y-1">
                            {event.sampleData.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <pre className="overflow-x-auto">
                            {JSON.stringify(event.sampleData, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                    {event.clip && (
                      <div className="mt-2">
                        <audio
                          controls
                          className="w-full max-w-[300px]"
                          src={event.clip}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionDetails;
