
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

// Mock function to get session events - replace with actual API call later
const getSessionEvents = async (sessionId: string) => {
  // Mock timeline data - replace with actual API data
  return [
    { type: "Login", timestamp: "2025-04-28T09:00:00Z" },
    { type: "Asked Question Voice", timestamp: "2025-04-28T09:01:00Z" },
    { type: "Voice Clip", timestamp: "2025-04-28T09:01:05Z" },
    { type: "Transcribe Data from Voice", timestamp: "2025-04-28T09:01:10Z" },
    { type: "Translation Data", timestamp: "2025-04-28T09:01:15Z" },
    { type: "Answer From AI", timestamp: "2025-04-28T09:01:30Z" },
    { type: "User Reaction", timestamp: "2025-04-28T09:01:45Z" },
    { type: "Suggested Questions", timestamp: "2025-04-28T09:02:00Z" },
    { type: "Asked Next Questions", timestamp: "2025-04-28T09:02:15Z" },
  ];
};

const SessionDetails = () => {
  const { sessionId } = useParams();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["sessionEvents", sessionId],
    queryFn: () => getSessionEvents(sessionId || ""),
    enabled: !!sessionId,
  });

  if (isLoading) {
    return <div>Loading session details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Session Details: {sessionId}
        </h1>
      </div>

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
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">{event.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(event.timestamp), "MMM dd, yyyy HH:mm:ss")}
                  </p>
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
