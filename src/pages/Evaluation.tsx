import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertTriangle, CalendarDays, CheckCircle2, Filter, Gauge, MessageSquareText, RefreshCw, Rows3, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchEvaluationItems, fetchEvaluationRuns, fetchEvaluationSummary, syncEvaluationRun } from "@/features/evaluations/api";
import { toast } from "sonner";
import { METRICS } from "@/features/evaluations/metrics";

const numericScore = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const score = (value: unknown) => {
  const parsed = numericScore(value);
  return parsed === null ? "N/A" : `${parsed.toFixed(2)} / 5`;
};
const statusVariant = (status: string) => status === "complete" ? "default" : status === "failed" ? "destructive" : "secondary";

export default function Evaluation() {
  const queryClient = useQueryClient();
  const [runId, setRunId] = useState("");
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [selectionSource, setSelectionSource] = useState("");
  const [agristackRequired, setAgristackRequired] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [targetLang, setTargetLang] = useState("");
  const [servingModel, setServingModel] = useState("");
  const [applicationRelease, setApplicationRelease] = useState("");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const runs = useQuery({ queryKey: ["evaluation-runs"], queryFn: fetchEvaluationRuns });
  useEffect(() => { if (!runId && runs.data?.length) setRunId(runs.data[0].run_id); }, [runId, runs.data]);
  const summary = useQuery({
    queryKey: ["evaluation-summary", runId], queryFn: () => fetchEvaluationSummary(runId), enabled: Boolean(runId),
  });
  const items = useQuery({
    queryKey: ["evaluation-items", runId, page, category, selectionSource, agristackRequired, feedbackType, targetLang, servingModel, applicationRelease, criticalOnly],
    queryFn: () => fetchEvaluationItems(runId, {
      page, limit: 20, category: category || undefined, selectionSource: selectionSource || undefined,
      agristackRequired: agristackRequired || undefined, feedbackType: feedbackType || undefined,
      targetLang: targetLang || undefined, servingModel: servingModel || undefined,
      applicationRelease: applicationRelease || undefined, criticalOnly,
    }),
    enabled: Boolean(runId),
  });
  const syncRun = useMutation({
    mutationFn: () => syncEvaluationRun(runId),
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["evaluation-runs"] }),
        queryClient.invalidateQueries({ queryKey: ["evaluation-summary", runId] }),
        queryClient.invalidateQueries({ queryKey: ["evaluation-items", runId] }),
      ]);
      toast.success(`Synced ${result.synced} evaluations from Langfuse`);
    },
    onError: () => toast.error("Langfuse synchronization failed"),
  });
  const radarData = useMemo(() => METRICS.map(([key, label]) => ({
    metric: label,
    score: numericScore(summary.data?.metric_averages[key]) ?? 0,
  })), [summary.data]);
  const rankedMetrics = useMemo(() => [...radarData].sort((a, b) => b.score - a.score), [radarData]);
  const strongestMetrics = rankedMetrics.slice(0, 3);
  const attentionMetrics = rankedMetrics.slice(-3).reverse();

  if (runs.isLoading) return <div className="py-20 text-center text-muted-foreground">Loading evaluation runs…</div>;
  if (runs.isError) return <div className="py-20 text-center text-destructive">Unable to load evaluations.</div>;
  if (!runs.data?.length) return <div className="py-20 text-center"><h1 className="text-2xl font-semibold">Evaluation</h1><p className="mt-2 text-muted-foreground">No evaluation runs are available yet.</p></div>;

  const data = summary.data;
  const passRate = data?.evaluated_count ? (data.passed_count / data.evaluated_count) * 100 : 0;
  const statCards = data ? [
    { Icon: MessageSquareText, label: "Feedback selected", value: data.run.feedback_selected_count.toLocaleString(), accent: "from-blue-500 to-cyan-400", icon: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    { Icon: Rows3, label: "Evaluated conversations", value: data.evaluated_count.toLocaleString(), accent: "from-cyan-500 to-emerald-400", icon: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
    { Icon: CheckCircle2, label: "Pass rate", value: `${passRate.toFixed(1)}%`, accent: "from-emerald-500 to-lime-400", icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { Icon: AlertTriangle, label: "Critical failures", value: data.critical_failure_count.toLocaleString(), accent: "from-amber-500 to-rose-500", icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  ] : [];
  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-fuchsia-500/5 p-5 shadow-sm sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl"><Badge variant="outline" className="mb-3 border-primary/30 bg-background/60 text-primary"><Sparkles className="mr-1 h-3 w-3" />Continuous Evaluation</Badge><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Production Evaluation</h1></div>
        <label className="grid min-w-0 gap-2 text-sm font-medium lg:min-w-[360px]">Evaluation run
        <select className="h-11 w-full rounded-xl border border-border/70 bg-background/80 px-3 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" value={runId} onChange={(event) => { setRunId(event.target.value); setPage(1); }}>
          {runs.data.map((run) => <option key={run.run_id} value={run.run_id}>{run.run_id} · {run.status}</option>)}
        </select>
      </label>
      </div>
      {data && <div className="relative mt-6 flex flex-wrap items-center gap-3 border-t border-border/60 pt-4"><Badge variant={statusVariant(data.run.status)} className="capitalize">{data.run.status}</Badge>{data.run.score_source === "langfuse" && <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400">Langfuse scores</Badge>}<span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4 text-primary" />{new Date(data.run.window_start).toLocaleString()} – {new Date(data.run.window_end).toLocaleString()}</span><div className="ml-auto flex items-center gap-3"><span className="hidden text-xs text-muted-foreground sm:block">{data.run.last_synced_at ? `Synced ${new Date(data.run.last_synced_at).toLocaleString()}` : `Judge: ${data.run.judge_model}`}</span><Button size="sm" variant="outline" disabled={syncRun.isPending} onClick={() => syncRun.mutate()}><RefreshCw className={`mr-2 h-4 w-4 ${syncRun.isPending ? "animate-spin" : ""}`} />Refresh from Langfuse</Button></div></div>}
    </section>

    {data && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ Icon, label, value, accent, icon }) => <Card key={label} className="group relative overflow-hidden border-border/70 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"><div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} /><CardContent className="p-5 pt-6"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p></div><div className={`rounded-xl p-2.5 ${icon}`}><Icon className="h-5 w-5" /></div></div></CardContent></Card>)}
      </div>
      {data.run.unmatched_feedback_count > 0 && <div className="flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300"><span className="rounded-full bg-amber-500/15 p-2"><AlertTriangle className="h-4 w-4" /></span>{data.run.unmatched_feedback_count} feedback record(s) could not be matched to a trace.</div>}
      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader className="border-b border-border/60 bg-primary/[0.03] pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />18-metric overview</CardTitle><p className="mt-1 text-sm text-muted-foreground">Aggregate quality profile across the selected run</p></div><Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">0–5 score</Badge></div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="h-[390px] sm:h-[430px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData} outerRadius="66%" margin={{ top: 22, right: 56, bottom: 22, left: 56 }}>
              <defs><linearGradient id="evaluationRadarFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.65} /><stop offset="100%" stopColor="#ec4899" stopOpacity={0.18} /></linearGradient></defs>
              <PolarGrid gridType="polygon" stroke="hsl(var(--border))" strokeOpacity={0.8} />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} tickLine={false} />
              <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} axisLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} / 5`, "Score"]} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "10px", boxShadow: "0 10px 30px rgba(0,0,0,.18)" }} labelStyle={{ color: "hsl(var(--popover-foreground))", fontWeight: 600 }} itemStyle={{ color: "hsl(var(--primary))" }} />
              <Radar dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#evaluationRadarFill)" fillOpacity={1} dot={{ r: 3, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 1.5 }} domain={[0, 5]} />
            </RadarChart></ResponsiveContainer></div>
            <div className="grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-4 w-4" />Strongest</div><div className="flex flex-wrap gap-2">{strongestMetrics.map((entry) => <Badge key={entry.metric} variant="outline" className="bg-background/70">{entry.metric} · {entry.score.toFixed(2)}</Badge>)}</div></div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"><div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400"><TrendingDown className="h-4 w-4" />Needs attention</div><div className="flex flex-wrap gap-2">{attentionMetrics.map((entry) => <Badge key={entry.metric} variant="outline" className="bg-background/70">{entry.metric} · {entry.score.toFixed(2)}</Badge>)}</div></div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-b from-card to-primary/[0.03]"><CardHeader className="border-b border-border/60 bg-primary/[0.03]"><CardTitle className="flex items-center gap-2"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Gauge className="h-5 w-5" /></span>Dimension averages</CardTitle><p className="text-sm text-muted-foreground">Quality scores grouped by evaluation dimension</p></CardHeader><CardContent className="space-y-4 p-5">{[
          ["Process fidelity", data.process_fidelity], ["Factual grounding", data.factual_grounding], ["Response usefulness", data.response_usefulness], ["Marathi quality", data.marathi_quality], ["Overall", data.overall_average],
        ].map(([label, value], index) => {
          const parsedValue = numericScore(value) ?? 0;
          const isOverall = index === 4;
          return <div key={String(label)} className={isOverall ? "rounded-xl border border-primary/20 bg-primary/5 p-4" : "rounded-xl border border-border/60 bg-background/40 p-4"}><div className="flex items-center justify-between gap-3 text-sm"><span className={isOverall ? "font-semibold" : "font-medium"}>{String(label)}</span><Badge variant="outline" className={isOverall ? "border-primary/30 bg-primary/10 text-primary" : "bg-background"}>{score(value)}</Badge></div><div className="mt-3 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-primary to-fuchsia-500 transition-all" style={{ width: `${Math.max(0, Math.min(100, (parsedValue / 5) * 100))}%` }} /></div></div>;
        })}</CardContent></Card>
      </div>
    </>}

    <Card className="overflow-hidden border-primary/20"><CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/[0.06] to-transparent"><div className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-2.5 text-primary"><Rows3 className="h-5 w-5" /></span><div><CardTitle>Evaluated conversations</CardTitle><p className="mt-1 text-sm text-muted-foreground">Inspect individual conversations and narrow results using run metadata.</p></div></div></CardHeader><CardContent className="p-0">
      <div className="m-4 rounded-xl border border-border/70 bg-muted/20 p-4 sm:m-6"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Filter className="h-4 w-4 text-primary" />Refine results</div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Input placeholder="Exact category (for example Weather Forecast)" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }} />
        <select className="h-10 rounded-md border bg-background px-3" value={selectionSource} onChange={(event) => { setSelectionSource(event.target.value); setPage(1); }}><option value="">Feedback and random</option><option value="feedback">Feedback selected</option><option value="random">Random selected</option></select>
        <select className="h-10 rounded-md border bg-background px-3" value={agristackRequired} onChange={(event) => { setAgristackRequired(event.target.value); setPage(1); }}><option value="">Agristack: all</option><option value="Yes">Agristack required</option><option value="No">Agristack not required</option></select>
        <select className="h-10 rounded-md border bg-background px-3" value={feedbackType} onChange={(event) => { setFeedbackType(event.target.value); setPage(1); }}><option value="">Feedback type: all</option><option value="like">Likes</option><option value="dislike">Dislikes</option></select>
        <Input placeholder="Language code" value={targetLang} onChange={(event) => { setTargetLang(event.target.value); setPage(1); }} />
        <Input placeholder="Serving model" value={servingModel} onChange={(event) => { setServingModel(event.target.value); setPage(1); }} />
        <Input placeholder="Application release" value={applicationRelease} onChange={(event) => { setApplicationRelease(event.target.value); setPage(1); }} />
        <label className="flex h-10 items-center justify-between rounded-md border bg-background px-3 text-sm"><span>Critical only</span><Switch checked={criticalOnly} onCheckedChange={(checked) => { setCriticalOnly(checked); setPage(1); }} /></label>
      </div></div>
      <div className="overflow-x-auto border-y border-border/60"><Table><TableHeader className="bg-muted/30"><TableRow><TableHead className="pl-6">Question</TableHead><TableHead>Category</TableHead><TableHead>Selection</TableHead><TableHead>Model</TableHead><TableHead>Score</TableHead><TableHead className="pr-6">Status</TableHead></TableRow></TableHeader><TableBody>
        {items.data?.data.map((item) => <TableRow key={item.id} className="transition-colors hover:bg-primary/[0.035]"><TableCell className="max-w-[480px] py-4 pl-6"><Link className="line-clamp-2 font-medium leading-relaxed transition-colors hover:text-primary hover:underline" title={item.question} to={`/evaluation/${encodeURIComponent(runId)}/${item.id}`}>{item.question}</Link></TableCell><TableCell><Badge variant="outline" className="bg-background">{item.category}</Badge></TableCell><TableCell><Badge variant="outline" className={item.selection_source === "feedback" ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400" : "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"}>{item.selection_source}</Badge>{item.feedback_count > 0 && <span className="ml-1 text-xs text-muted-foreground">×{item.feedback_count}</span>}</TableCell><TableCell><code className="rounded bg-muted px-2 py-1 text-xs">{item.serving_model || "Unknown"}</code></TableCell><TableCell><strong>{score(item.overall_average)}</strong></TableCell><TableCell className="pr-6"><Badge variant={item.overall_pass ? "secondary" : "destructive"} className={item.overall_pass ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400" : ""}>{item.overall_pass ? "Pass" : "Critical"}</Badge></TableCell></TableRow>)}
        {!items.isLoading && !items.data?.data.length && <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No evaluations match these filters.</TableCell></TableRow>}
      </TableBody></Table></div>
      <div className="flex flex-col gap-3 p-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6"><span className="text-muted-foreground"><strong className="text-foreground">{items.data?.pagination.total || 0}</strong> evaluations</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span className="rounded-md bg-muted px-3 py-1.5 text-xs font-medium">Page {page} of {items.data?.pagination.totalPages || 1}</span><Button variant="outline" size="sm" disabled={page >= (items.data?.pagination.totalPages || 1)} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>
    </CardContent></Card>
  </div>;
}
