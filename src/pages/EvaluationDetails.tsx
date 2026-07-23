import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, ExternalLink, Gauge, MessageSquareText, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addEvaluationComment, fetchEvaluationItem } from "@/features/evaluations/api";
import { DIMENSION_LABELS, metricLabel } from "@/features/evaluations/metrics";
import { LANGFUSE_CONFIG } from "@/config/environment";

const scorePresentation = (value: number | null) => {
  if (value == null) return { label: "Not scored", badge: "border-border bg-muted text-muted-foreground", fill: "bg-muted-foreground/30", glow: "border-border" };
  if (value >= 4.5) return { label: "Excellent", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", fill: "bg-gradient-to-r from-emerald-500 to-lime-400", glow: "border-emerald-500/20 hover:border-emerald-500/40" };
  if (value >= 3.5) return { label: "Strong", badge: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400", fill: "bg-gradient-to-r from-blue-500 to-cyan-400", glow: "border-blue-500/20 hover:border-blue-500/40" };
  if (value >= 2.5) return { label: "Acceptable", badge: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400", fill: "bg-gradient-to-r from-amber-400 to-yellow-300", glow: "border-amber-500/20 hover:border-amber-500/40" };
  if (value >= 1.5) return { label: "Needs work", badge: "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400", fill: "bg-gradient-to-r from-orange-500 to-amber-400", glow: "border-orange-500/20 hover:border-orange-500/40" };
  return { label: "Critical", badge: "border-destructive/30 bg-destructive/10 text-destructive", fill: "bg-gradient-to-r from-red-500 to-rose-500", glow: "border-destructive/30 hover:border-destructive/50" };
};

export default function EvaluationDetails() {
  const { runId = "", itemId = "" } = useParams();
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const item = useQuery({ queryKey: ["evaluation-item", runId, itemId], queryFn: () => fetchEvaluationItem(runId, itemId), enabled: Boolean(runId && itemId) });
  const saveComment = useMutation({
    mutationFn: () => addEvaluationComment(runId, itemId, comment),
    onSuccess: async () => {
      setComment("");
      await queryClient.invalidateQueries({ queryKey: ["evaluation-item", runId, itemId] });
    },
  });
  if (item.isLoading) return <div className="py-20 text-center text-muted-foreground">Loading evaluation…</div>;
  if (!item.data) return <div className="py-20 text-center text-destructive">Evaluation could not be loaded.</div>;
  const data = item.data;
  const langfuseTraceUrl = `${LANGFUSE_CONFIG.BASE_URL.replace(/\/$/, "")}/project/${encodeURIComponent(LANGFUSE_CONFIG.PROJECT_ID)}/traces/${encodeURIComponent(data.trace_id)}`;
  return <div className="space-y-6">
    <Link to="/evaluation" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to Evaluation</Link>
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-fuchsia-500/5 p-6 shadow-sm"><div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" /><div className="relative flex flex-wrap items-start justify-between gap-5"><div><Badge variant="outline" className="mb-3 border-primary/30 bg-background/60 text-primary"><Sparkles className="mr-1 h-3 w-3" />Quality review</Badge><h1 className="text-3xl font-bold">Conversation evaluation</h1><p className="mt-1 text-muted-foreground">{data.run_id} · {new Date(data.evaluated_at).toLocaleString()}</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="bg-background/70">{data.selection_source}</Badge><Badge variant={data.overall_pass ? "secondary" : "destructive"} className={data.overall_pass ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : ""}>{data.overall_pass ? "Pass" : "Critical failure"}</Badge><div className="rounded-xl border border-primary/20 bg-background/70 px-4 py-2 text-right shadow-sm"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Overall score</p><p className="text-xl font-bold text-primary">{data.evaluation.metrics.overall_average == null ? "N/A" : `${Number(data.evaluation.metrics.overall_average).toFixed(2)} / 5`}</p></div></div></div></section>
    <div className="grid gap-4 lg:grid-cols-2"><Card className="overflow-hidden border-blue-500/20"><CardHeader className="border-b border-border/60 bg-blue-500/[0.05]"><CardTitle className="flex items-center gap-2"><span className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400"><MessageSquareText className="h-5 w-5" /></span>Farmer question</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap p-6 leading-relaxed">{data.question}</CardContent></Card><Card className="overflow-hidden border-primary/20"><CardHeader className="border-b border-border/60 bg-primary/[0.05]"><CardTitle className="flex items-center gap-2"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Bot className="h-5 w-5" /></span>Assistant answer</CardTitle></CardHeader><CardContent className="whitespace-pre-wrap p-6 leading-relaxed">{data.answer}</CardContent></Card></div>
    <Card><CardHeader><CardTitle>Judge summary</CardTitle></CardHeader><CardContent><p>{data.evaluation.summary}</p><div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground"><span>Category: {data.category}</span><span>•</span><span>Language: {data.target_lang || "Unknown"}</span><span>•</span><span>Model: {data.serving_model || "Unknown"}</span><span>•</span><span>Agristack: {data.agristack_required}</span></div></CardContent></Card>
    <Card><CardHeader><CardTitle>Evaluator comments</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Textarea className="min-h-20 flex-1" maxLength={2000} placeholder="Add an evaluator comment…" value={comment} onChange={(event) => setComment(event.target.value)} />
        <Button disabled={!comment.trim() || saveComment.isPending} onClick={() => saveComment.mutate()}>{saveComment.isPending ? "Saving…" : "Add comment"}</Button>
      </div>
      {saveComment.isError && <p className="text-sm text-destructive">Comment could not be saved. Please try again.</p>}
      <div className="space-y-3">
        {data.comments?.map((entry) => <div className="rounded-lg border p-3" key={entry.id}><p className="whitespace-pre-wrap text-sm">{entry.comment}</p><p className="mt-2 text-xs text-muted-foreground">{entry.author} · {new Date(entry.created_at).toLocaleString()}</p></div>)}
        {!data.comments?.length && <p className="text-sm text-muted-foreground">No evaluator comments yet.</p>}
      </div>
    </CardContent></Card>
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-muted/20 p-4 text-xs"><span className="mr-1 flex items-center gap-2 font-semibold"><Gauge className="h-4 w-4 text-primary" />Scoring guide</span><Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400">1 Critical</Badge><Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400">2 Needs work</Badge><Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">3 Acceptable</Badge><Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400">4 Strong</Badge><Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">5 Excellent</Badge></div>
    {Object.entries(data.evaluation.dimensions).map(([dimensionKey, dimension]) => {
      const dimensionScore = dimension.average == null ? null : Number(dimension.average);
      const dimensionTone = scorePresentation(dimensionScore);
      return <Card key={dimensionKey} className="overflow-hidden border-primary/20 bg-gradient-to-b from-card to-primary/[0.025]"><CardHeader className="border-b border-border/60 bg-primary/[0.035]"><div className="flex flex-wrap items-center justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><span className="rounded-lg bg-primary/10 p-2 text-primary"><Gauge className="h-5 w-5" /></span>{DIMENSION_LABELS[dimensionKey] || dimensionKey}</CardTitle><p className="mt-2 text-sm text-muted-foreground">Metric-level evidence and quality signals</p></div><div className="min-w-[170px] rounded-xl border border-primary/20 bg-background/70 p-3"><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium text-muted-foreground">Average</span><strong className="text-lg text-primary">{dimensionScore == null ? "N/A" : `${dimensionScore.toFixed(2)} / 5`}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${dimensionTone.fill}`} style={{ width: `${dimensionScore == null ? 0 : Math.max(0, Math.min(100, (dimensionScore / 5) * 100))}%` }} /></div></div></div></CardHeader><CardContent className="grid gap-4 p-5 md:grid-cols-2">{Object.entries(dimension.scores).map(([key, metric]) => {
        const metricScore = metric.score == null ? null : Number(metric.score);
        const tone = scorePresentation(metricScore);
        return <div key={key} className={`group relative overflow-hidden rounded-xl border bg-background/60 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${tone.glow}`}><div className={`absolute inset-x-0 top-0 h-1 ${tone.fill}`} /><div className="flex items-start justify-between gap-3 pt-1"><div><strong>{metricLabel(`${dimensionKey}.${key}`)}</strong><p className="mt-1 text-xs font-medium text-muted-foreground">{tone.label}</p></div><Badge variant="outline" className={tone.badge}>{metricScore ?? "N/A"}<span className="ml-0.5 opacity-60">/5</span></Badge></div><div className="mt-4 grid grid-cols-5 gap-1.5">{[1, 2, 3, 4, 5].map((level) => <div key={level} className={`h-2 rounded-full ${metricScore != null && level <= metricScore ? tone.fill : "bg-muted"}`} />)}</div><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{metric.evidence}</p></div>;
      })}</CardContent></Card>;
    })}
    <Card><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm"><div><div>Trace ID: <code>{data.trace_id}</code></div><div>Session: {data.masked_session_ref || "Unavailable"}</div></div><a href={langfuseTraceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 font-medium text-primary transition hover:border-primary hover:bg-primary/5">Open trace in Langfuse <ExternalLink className="h-3 w-3" /></a></CardContent></Card>
  </div>;
}
