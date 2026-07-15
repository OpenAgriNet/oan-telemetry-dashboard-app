import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  fetchProviderTelemetryFlow,
  type ProviderTelemetryFlowStep,
} from "@/services/api";
import { formatUTCToIST } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function JsonBlock({ value }: { value: unknown }) {
  const formatted = useMemo(() => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object" && Object.keys(value as object).length === 0) return "{}";
    return JSON.stringify(value, null, 2);
  }, [value]);

  return (
    <pre className="max-h-[420px] overflow-auto rounded-lg bg-muted p-4 text-xs leading-relaxed text-foreground">
      {formatted}
    </pre>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">
        {value === undefined || value === null || value === "" ? "—" : String(value)}
      </p>
    </div>
  );
}

const EVENT_LABELS: Record<string, string> = {
  flow_start: "Flow Start",
  beckn_inbound: "Beckn Inbound",
  ext_api_call: "External API Call",
  internal_step: "Internal Step",
  beckn_outbound: "Beckn Outbound",
  flow_end: "Flow End",
  error: "Error",
};

const EVENT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  error: "destructive",
  ext_api_call: "outline",
  flow_start: "secondary",
  flow_end: "secondary",
  beckn_inbound: "default",
  beckn_outbound: "default",
  internal_step: "outline",
};

function StepCard({ step, index, isLast }: { step: ProviderTelemetryFlowStep; index: number; isLast: boolean }) {
  const isFailed = step.success === false || step.eventName === "error";

  return (
    <div className="relative flex gap-4">
      {/* Timeline rail */}
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
            isFailed
              ? "border-red-500 bg-red-500/10 text-red-500"
              : "border-primary bg-primary/10 text-primary"
          }`}
        >
          {index + 1}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>

      {/* Step content */}
      <Card className="mb-6 flex-1">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={EVENT_VARIANT[step.eventName] ?? "outline"}>
              {EVENT_LABELS[step.eventName] ?? step.eventName}
            </Badge>
            <span className="font-medium">{step.serviceName}</span>
            {step.endpointUrl && (
              <span
                className="max-w-[320px] truncate font-mono text-xs text-muted-foreground"
                title={step.endpointUrl}
              >
                {step.endpointUrl}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {step.httpStatus !== null && (
              <span className="text-muted-foreground">HTTP {step.httpStatus}</span>
            )}
            {step.latencyMs !== null && (
              <span
                className={`flex items-center gap-1 font-medium ${
                  step.latencyMs > 2000
                    ? "text-red-500"
                    : step.latencyMs > 800
                    ? "text-amber-500"
                    : "text-foreground"
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {step.latencyMs.toLocaleString()} ms
              </span>
            )}
            {step.success === true && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {isFailed && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {formatUTCToIST(step.eventTimestamp, "MMM dd, yyyy hh:mm:ss a")}
          </p>

          {step.errorMessage && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {step.errorMessage}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Request Payload
              </p>
              <JsonBlock value={step.requestPayload} />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Response Payload
              </p>
              <JsonBlock value={step.responsePayload} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ProviderTelemetryFlowDetails = () => {
  const { questionId } = useParams();
  const navigate = useNavigate();

  const {
    data: flow,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["provider-telemetry-flow", questionId],
    queryFn: () => fetchProviderTelemetryFlow(questionId || ""),
    enabled: !!questionId,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12 bg-muted/30 rounded-lg">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Loading flow details...</p>
        </div>
      </div>
    );
  }

  if (error || !flow || flow.steps.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-destructive font-medium">
            Unable to load the flow for this question.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
            <Button variant="outline" onClick={() => navigate("/external-api")}>
              Back to External API Observability
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { summary, steps } = flow;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/external-api")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Query Flow Details</h1>
          <p className="text-sm text-muted-foreground">
            Query → AI layer → Beckn network, step by step
          </p>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            Flow Summary
            {summary && (
              <Badge variant={summary.overallSuccess ? "secondary" : "destructive"}>
                {summary.overallSuccess ? "Success" : "Failed"}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 md:grid-cols-4">
            <SummaryItem label="Question ID" value={flow.questionId} />
            <SummaryItem label="Session ID" value={flow.sessionId} />
            <SummaryItem label="Total Steps" value={summary?.totalSteps} />
            <SummaryItem
              label="Total Duration"
              value={summary ? `${summary.totalDurationMs.toLocaleString()} ms` : null}
            />
            <SummaryItem
              label="Started At"
              value={summary ? formatUTCToIST(summary.startedAt, "MMM dd, yyyy hh:mm:ss a") : null}
            />
            <SummaryItem
              label="Completed At"
              value={summary ? formatUTCToIST(summary.completedAt, "MMM dd, yyyy hh:mm:ss a") : null}
            />
            <SummaryItem
              label="Services Involved"
              value={summary?.servicesInvolved.join(", ")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          Flow Timeline
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </h2>
        <div>
          {steps.map((step, index) => (
            <StepCard key={step.id} step={step} index={index} isLast={index === steps.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProviderTelemetryFlowDetails;
