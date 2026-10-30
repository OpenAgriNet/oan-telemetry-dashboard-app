import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useKeycloak } from "@react-keycloak/web";
import { toast } from "sonner";
import { AlertCircle, Mail, Plus, Send, Settings, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchDailyReportSettings,
  saveDailyReportSettings,
  sendDailyReportTest,
  type DailyReportSettings,
} from "@/services/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  enabled: boolean;
  recipients: string[];
}

function toForm(settings: DailyReportSettings): FormState {
  return { enabled: settings.enabled, recipients: settings.recipients };
}

function describeSchedule(cron: string): string {
  return cron === "0 21 * * *" ? "Every day at 9:00 PM" : `Cron "${cron}"`;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ReportSettings = () => {
  const { keycloak } = useKeycloak();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [newRecipient, setNewRecipient] = useState("");
  const [testTo, setTestTo] = useState(
    String((keycloak.tokenParsed as { email?: string } | undefined)?.email || ""),
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ["daily-report-settings"],
    queryFn: fetchDailyReportSettings,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data && form === null) setForm(toForm(data));
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: saveDailyReportSettings,
    onSuccess: (saved) => {
      queryClient.setQueryData(["daily-report-settings"], saved);
      setForm(toForm(saved));
      toast.success("Report settings saved");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const testMutation = useMutation({
    mutationFn: sendDailyReportTest,
    onSuccess: (result) => toast.success(`Test report sent to ${result.to}`),
    onError: (err: Error) => toast.error(err.message),
  });

  if (error) {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
          <AlertCircle size={16} />
          {error instanceof Error ? error.message : "Failed to load report settings"}
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data || !form) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  const update = (patch: Partial<FormState>) => setForm({ ...form, ...patch });

  const addRecipient = () => {
    const email = newRecipient.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (form.recipients.includes(email)) {
      toast.error("That address is already in the list");
      return;
    }
    update({ recipients: [...form.recipients, email] });
    setNewRecipient("");
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(toForm(data));
  const isOn = data.schedule.allowedOnServer && form.enabled;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Settings size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Report settings</h1>
          <p className="text-sm text-muted-foreground">
            Turn the daily health report email on or off and choose who receives it.
            Only super admins can see and change this page.
          </p>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Daily report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              {data.reports.map((r) => (
                <div key={r.key} className="font-medium">
                  {r.subject}
                </div>
              ))}
              <div className="text-muted-foreground">
                {describeSchedule(data.schedule.cron)} IST, covering the previous 24 hours
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Label htmlFor="report-enabled" className="text-sm">
                {isOn ? "On" : "Off"}
              </Label>
              <Switch
                id="report-enabled"
                checked={isOn}
                disabled={!data.schedule.allowedOnServer}
                onCheckedChange={(checked) => update({ enabled: checked })}
                aria-label="Send the daily report"
              />
            </div>
          </div>
          {!data.schedule.allowedOnServer ? (
            <p className="text-xs text-muted-foreground">
              Email isn't set up on this server, so no report is sent from here. You can
              still manage recipients.
            </p>
          ) : form.enabled !== data.enabled ? (
            <p className="text-xs text-muted-foreground">
              Click "Save settings" to {form.enabled ? "turn the report on" : "turn the report off"}.
            </p>
          ) : !form.enabled ? (
            <p className="text-xs text-muted-foreground">
              The daily email is off. Turn it on and save to start sending at 9 PM.
            </p>
          ) : null}
          <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <Mail size={14} className="shrink-0" />
            {data.smtp.problem ? (
              <span className="text-destructive">{data.smtp.problem}.</span>
            ) : (
              <span>
                Sends from {data.smtp.from} via {data.smtp.host} (set on the server)
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recipients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.smtp.problem && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {data.smtp.problem}. You can still add recipients, but no
                email will be sent until the server's SMTP settings are added.
              </AlertDescription>
            </Alert>
          )}
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              addRecipient();
            }}
          >
            <Input
              type="email"
              placeholder="name@example.com"
              value={newRecipient}
              onChange={(e) => setNewRecipient(e.target.value)}
              aria-label="Recipient email"
            />
            <Button type="submit" variant="outline" className="gap-1">
              <Plus size={16} /> Add
            </Button>
          </form>

          {form.recipients.length > 0 ? (
            <ul className="divide-y divide-border rounded-md border border-border/60">
              {form.recipients.map((email) => (
                <li key={email} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <Mail size={14} className="shrink-0 text-muted-foreground" />
                    <span className="truncate">{email}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    aria-label={`Remove ${email}`}
                    onClick={() =>
                      update({ recipients: form.recipients.filter((r) => r !== email) })
                    }
                  >
                    <X size={14} />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {data.envRecipients.length > 0
                ? `No recipients saved here, so the server default is used: ${data.envRecipients.join(", ")}`
                : "No recipients yet. The report won't be sent until you add at least one."}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {data.updatedAt
            ? `Last saved ${formatDateTime(data.updatedAt)}${data.updatedBy ? ` by ${data.updatedBy}` : ""}`
            : "Not saved yet"}
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || saveMutation.isPending}
            onClick={() => setForm(toForm(data))}
          >
            Discard
          </Button>
          <Button
            type="button"
            disabled={!isDirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate(form)}
          >
            {saveMutation.isPending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Send a test</CardTitle>
          <p className="text-xs text-muted-foreground">
            Sends today's report now to this one address, even while the daily switch is
            off. It doesn't affect the 9 PM send. Needs email set up on this server.
          </p>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (!EMAIL_RE.test(testTo.trim())) {
                toast.error("Enter a valid email address");
                return;
              }
              testMutation.mutate(testTo.trim());
            }}
          >
            <Input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              aria-label="Test email address"
            />
            <Button
              type="submit"
              className="gap-1"
              disabled={testMutation.isPending || Boolean(data.smtp.problem)}
            >
              <Send size={16} />
              {testMutation.isPending ? "Sending…" : "Send test report"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent scheduled sends</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentRuns.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No scheduled sends yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Sent at / error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentRuns.map((run) => (
                    <TableRow key={`${run.report_key}-${run.report_date}`}>
                      <TableCell className="whitespace-nowrap">{run.report_date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            run.status === "sent"
                              ? "default"
                              : run.status === "failed"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {run.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{run.recipients || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {run.status === "failed"
                          ? run.error_message
                          : formatDateTime(run.sent_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportSettings;
