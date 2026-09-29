import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Activity, ArrowLeft, CheckCircle2, Clock3, Code2, Copy, Server, TriangleAlert, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchIndividualApiCall } from "@/services/api";
import { formatLatency } from "./serviceSnapshotShared";

function payloadText(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return JSON.stringify(value, null, 2);
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function JsonPanel({ title, value, emptyText }: { title: string; value: unknown; emptyText: string }) {
  const text = payloadText(value);
  const copy = async () => { if (text) await navigator.clipboard.writeText(text); };
  return <Card className="overflow-hidden border-border/80"><CardHeader className="flex flex-row items-center justify-between space-y-0 border-b py-4"><div><CardTitle className="text-base">{title}</CardTitle></div>{text && <Button variant="ghost" size="icon" onClick={copy} aria-label={`Copy ${title.toLowerCase()}`}><Copy className="h-4 w-4" /></Button>}</CardHeader><CardContent className="p-0">{text ? <pre className="max-h-[480px] overflow-auto whitespace-pre-wrap break-all bg-muted/30 p-4 text-xs leading-5 text-foreground">{text}</pre> : <div className="p-6 text-sm text-muted-foreground">{emptyText}</div>}</CardContent></Card>;
}

function formatTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "medium" }).format(date);
}

const IndividualApiCallDetail = () => {
  const { id } = useParams();
  const query = useQuery({ queryKey: ["individual-api-call", id], queryFn: () => fetchIndividualApiCall(id || ""), enabled: Boolean(id) });
  const call = query.data;
  const isSuccess = call?.outcome === "success";
  const isFailure = call?.outcome === "failure";
  const StatusIcon = isSuccess ? CheckCircle2 : isFailure ? XCircle : TriangleAlert;

  if (query.isLoading) return <Card><CardContent className="py-12 text-center text-muted-foreground">Loading API call details…</CardContent></Card>;
  if (query.isError || !call) return <Card><CardContent className="py-12 text-center"><div className="font-medium">API call details could not be loaded</div><Link to="/individual-apis" className="mt-3 inline-block text-sm text-primary hover:underline">Back to Individual APIs</Link></CardContent></Card>;

  return <div className="space-y-6">
    <div>
      <Link to="/individual-apis" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Individual APIs</Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0"><div className="mb-3 flex flex-wrap items-center gap-2"><Badge variant="outline" className="font-mono">{call.method || "CALL"}</Badge><Badge variant="secondary">{call.layer || "Unspecified layer"}</Badge><Badge variant="outline" className={isSuccess ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : isFailure ? "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"}><StatusIcon className="mr-1 h-3.5 w-3.5" />{isSuccess ? "Success" : isFailure ? "Failed" : call.outcome || "Unknown"}</Badge></div><h1 className="break-all font-mono text-xl font-bold tracking-tight sm:text-2xl">{call.endpoint}</h1><p className="mt-2 text-sm text-muted-foreground">{call.service || "Unspecified service"} · {call.event_name}</p></div>
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/80"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />Duration</div><div className="mt-1 text-lg font-semibold">{formatLatency(call.duration_ms)}</div></CardContent></Card>
      <Card className="border-border/80"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Activity className="h-3.5 w-3.5" />HTTP status</div><div className="mt-1 text-lg font-semibold">{call.http_status ?? "—"}</div></CardContent></Card>
      <Card className="border-border/80"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Server className="h-3.5 w-3.5" />Dependency</div><div className="mt-1 truncate text-lg font-semibold" title={call.dependency || ""}>{call.dependency || "—"}</div></CardContent></Card>
      <Card className="border-border/80"><CardContent className="p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Code2 className="h-3.5 w-3.5" />Captured at</div><div className="mt-1 text-sm font-semibold">{formatTime(call.event_time)}</div></CardContent></Card>
    </div>

    <Card className="border-border/80"><CardHeader className="pb-3"><CardTitle className="text-base">Call context</CardTitle></CardHeader><CardContent className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 xl:grid-cols-3"><div><div className="text-muted-foreground">Trace ID</div><div className="mt-1 break-all font-mono text-xs">{call.trace_id || "—"}</div></div><div><div className="text-muted-foreground">Transaction ID</div><div className="mt-1 break-all font-mono text-xs">{call.transaction_id || "—"}</div></div><div><div className="text-muted-foreground">HTTP call ID</div><div className="mt-1 break-all font-mono text-xs">{call.http_call_id || "—"}</div></div><div><div className="text-muted-foreground">Request started</div><div className="mt-1">{formatTime(call.request_started_at)}</div></div><div><div className="text-muted-foreground">Response received</div><div className="mt-1">{formatTime(call.response_received_at)}</div></div><div><div className="text-muted-foreground">Response status</div><div className="mt-1">{call.response_status || "—"}</div></div></CardContent></Card>

    <div className="grid gap-5 xl:grid-cols-2"><JsonPanel title="Request payload" value={call.request_payload} emptyText="No request payload was captured for this API call." /><JsonPanel title="Response payload" value={call.response_payload} emptyText="No response payload was captured for this API call." /></div>
    {call.error_payload !== null && <JsonPanel title="Error payload" value={call.error_payload} emptyText="No error payload was captured for this API call." />}
  </div>;
};

export default IndividualApiCallDetail;
