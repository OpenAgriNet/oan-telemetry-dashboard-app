import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchCallById, type CallDetail, type CallMessage } from "@/services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Phone,
  Clock,
  Globe,
  MessageSquare,
  Activity,
  User,
  Bot,
} from "lucide-react";

function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function formatDatetime(dt: string | null): string {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  } catch {
    return dt;
  }
}

const CallDetails = () => {
  const params = useParams();
  const callId = params["*"]; // splat route captures IDs with slashes
  const navigate = useNavigate();

  const {
    data: callDetail,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["call-detail", callId],
    queryFn: () => fetchCallById(callId!),
    enabled: !!callId,
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/calls")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Call Details</h1>
        </div>
        <div className="flex justify-center items-center p-16 bg-muted/30 rounded-lg">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Loading call details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !callDetail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/calls")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Call Details</h1>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">
              {callDetail === null ? "Call not found" : "Error loading call details"}
            </p>
            <p className="text-destructive/80 text-sm mb-4">
              {error?.message || `No call found with ID: ${callId}`}
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => navigate("/calls")} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Call Logs
              </Button>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { call, messages } = callDetail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/calls")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">
            Call Details
          </h1>
          <p className="text-sm text-muted-foreground font-mono truncate">
            {call.interactionId}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(call.durationInSeconds)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{call.questionsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{call.totalInteractions}</div>
          </CardContent>
        </Card>

      </div>

      {/* Call Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">User ID</p>
              <p className="font-medium font-mono">
                {call.userId || "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Start Time</p>
              <p className="font-medium">{formatDatetime(call.startDatetime)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">End Time</p>
              <p className="font-medium">{formatDatetime(call.endDatetime)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">End Reason</p>
              <p className="font-medium">{call.endReason || "—"}</p>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Conversation Thread */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Conversation ({messages.length} messages)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No messages found for this call</p>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg: CallMessage, idx: number) => (
                <div
                  key={msg.id || idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[85%] ${
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`rounded-lg px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          msg.role === "user"
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground/60"
                        }`}
                      >
                        #{msg.messageOrder}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CallDetails;
