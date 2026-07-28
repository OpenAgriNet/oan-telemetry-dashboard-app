export type RunStatus = "running" | "complete" | "partial" | "failed";

export interface JudgeModel { id: string; label: string }
export type JudgeProvider = "openai" | "vllm" | "cerebras" | "openai_compatible";
export interface JudgeEndpoint {
  id: string; name: string; provider_type: JudgeProvider; base_url: string; default_model: string;
  enabled: boolean; has_api_key: boolean; created_by: string | null; created_at: string; updated_at: string;
}
export interface EvaluationSchedule {
  id: string; name: string; judge_endpoint_id: string; endpoint_name: string; default_model: string;
  population_limit: number; sampling_mode: "percent" | "count"; sampling_value: number | string;
  target_languages: string[];
  daily_hour_ist: number; enabled: boolean; last_started_on: string | null; last_run_id: string | null; last_error: string | null;
}
export interface StartedEvaluationRun { run_id: string; status: string; selected: number; completed: number; failed: number }

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
  requested_by: string | null;
  error: string | null;
  target_languages: string[];
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
