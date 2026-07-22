export type RunStatus = "running" | "complete" | "partial" | "failed";

export interface EvaluationRun {
  run_id: string;
  window_start: string;
  window_end: string;
  status: RunStatus;
  population_count: number;
  random_target: number;
  feedback_selected_count: number;
  random_selected_count: number;
  unmatched_feedback_count: number;
  successful_count: number;
  failed_count: number;
  judge_model: string;
  score_source: string;
  last_synced_at: string | null;
}

export interface EvaluationSummary {
  run: EvaluationRun;
  evaluated_count: number;
  passed_count: number;
  critical_failure_count: number;
  overall_average: number | null;
  process_fidelity: number | null;
  factual_grounding: number | null;
  response_usefulness: number | null;
  marathi_quality: number | null;
  metric_averages: Record<string, number>;
}

export interface EvaluationListItem {
  id: string;
  run_id: string;
  trace_id: string;
  qid: string | null;
  question: string;
  category: string;
  agristack_required: string;
  target_lang: string | null;
  serving_model: string | null;
  application_release: string | null;
  selection_source: "feedback" | "random";
  feedback_types: string[];
  feedback_count: number;
  overall_average: number | null;
  overall_pass: boolean;
  critical_failures: string[];
  evaluated_at: string;
}

export interface MetricScore { score: 1 | 2 | 3 | 4 | 5 | null; evidence: string }
export interface EvaluationDetail extends EvaluationListItem {
  answer: string;
  masked_session_ref: string | null;
  feedback_comment_present: boolean;
  evaluation: {
    summary: string;
    dimensions: Record<string, { average: number | null; scores: Record<string, MetricScore> }>;
    metrics: { overall_average: number | null; overall_pass: boolean; critical_failures: string[] };
  };
  comments: Array<{ id: string; author: string; comment: string; created_at: string }>;
}
