import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { fetchUiEventById } from "@/services/api";
import { formatUTCToIST } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function JsonBlock({ value }: { value: unknown }) {
  const formatted = useMemo(() => {
    if (value == null) return "{}";
    return JSON.stringify(value, null, 2);
  }, [value]);

  return (
    <pre className="max-h-[520px] overflow-auto rounded-lg bg-muted p-4 text-xs leading-relaxed text-foreground">
      {formatted}
    </pre>
  );
}

function SummaryItem({ label, value }: { label: string; value?: string | number | boolean | null }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value === undefined || value === null || value === "" ? "-" : String(value)}</p>
    </div>
  );
}

const ChatUiEventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ["chat-ui-event", eventId],
    queryFn: () => fetchUiEventById(eventId || ""),
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12 bg-muted/30 rounded-lg">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Loading UI event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-destructive font-medium">Unable to load UI event details.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/ui-events")}>
            Back to UI Events
          </Button>
        </CardContent>
      </Card>
    );
  }

  const status = event.status_code != null
    ? `${event.status_code}${event.success === false ? " Failed" : ""}`
    : event.success == null
      ? "-"
      : event.success
        ? "Success"
        : "Failed";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/ui-events")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">UI Event Details</h1>
          <p className="text-sm text-muted-foreground">
            {event.event_name} · {event.category}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            Event Summary
            <Badge variant="outline">{event.category}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-3">
            <SummaryItem label="Event Name" value={event.event_name} />
            <SummaryItem label="Time" value={event.event_time ? formatUTCToIST(event.event_time, "MMM dd, yyyy hh:mm a") : "-"} />
            <SummaryItem label="Status" value={status} />
            <SummaryItem label="Fingerprint ID" value={event.fingerprint_id} />
            <SummaryItem label="SID" value={event.sid} />
            <SummaryItem label="Notification ID" value={event.notification_id} />
            <SummaryItem label="Reason" value={event.reason} />
            <SummaryItem label="Feedback" value={event.feedback} />
            <SummaryItem label="Response Count" value={event.response_count} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <JsonBlock value={event.metadata || {}} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Full Response</CardTitle>
        </CardHeader>
        <CardContent>
          <JsonBlock value={event.response || {}} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Source Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-3">
            <SummaryItem label="Source Log ID" value={event.source_log_id} />
            <SummaryItem label="Source Event Index" value={event.source_event_index} />
            <SummaryItem label="Raw ETS" value={event.ets} />
            <SummaryItem label="Channel" value={event.channel} />
            <SummaryItem label="EID" value={event.eid} />
            <SummaryItem label="Created At" value={event.created_at ? formatUTCToIST(event.created_at, "MMM dd, yyyy hh:mm a") : "-"} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatUiEventDetails;
