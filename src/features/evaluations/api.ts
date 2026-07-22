import { API_CONFIG } from "@/config/environment";
import type { EvaluationDetail, EvaluationListItem, EvaluationRun, EvaluationSummary } from "./types";

const headers = { "x-telemetry-state": "bharat-vistaar" };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_CONFIG.SERVER_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  if (!response.ok) throw new Error(`Evaluation API failed (${response.status})`);
  const payload = await response.json();
  if (!payload.success) throw new Error(payload.message || "Evaluation API failed");
  return payload;
}

export async function fetchEvaluationRuns(): Promise<EvaluationRun[]> {
  return (await request<{ data: EvaluationRun[] }>("/evaluations/runs")).data;
}

export async function fetchEvaluationSummary(runId: string): Promise<EvaluationSummary> {
  return (await request<{ data: EvaluationSummary }>(`/evaluations/runs/${encodeURIComponent(runId)}/summary`)).data;
}

export async function syncEvaluationRun(runId: string) {
  return (await request<{ data: { run_id: string; status: string; synced: number; failed: number } }>(
    `/evaluations/runs/${encodeURIComponent(runId)}/sync`, { method: "POST" },
  )).data;
}

export interface ItemFilters {
  page: number;
  limit: number;
  category?: string;
  selectionSource?: string;
  agristackRequired?: string;
  feedbackType?: string;
  targetLang?: string;
  servingModel?: string;
  applicationRelease?: string;
  criticalOnly?: boolean;
}

export async function fetchEvaluationItems(runId: string, filters: ItemFilters) {
  const params = new URLSearchParams({ page: String(filters.page), limit: String(filters.limit) });
  if (filters.category) params.set("category", filters.category);
  if (filters.selectionSource) params.set("selection_source", filters.selectionSource);
  if (filters.agristackRequired) params.set("agristack_required", filters.agristackRequired);
  if (filters.feedbackType) params.set("feedback_type", filters.feedbackType);
  if (filters.targetLang) params.set("target_lang", filters.targetLang);
  if (filters.servingModel) params.set("serving_model", filters.servingModel);
  if (filters.applicationRelease) params.set("application_release", filters.applicationRelease);
  if (filters.criticalOnly) params.set("critical_only", "true");
  return request<{ data: EvaluationListItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
    `/evaluations/runs/${encodeURIComponent(runId)}/items?${params}`,
  );
}

export async function fetchEvaluationItem(runId: string, itemId: string): Promise<EvaluationDetail> {
  return (await request<{ data: EvaluationDetail }>(
    `/evaluations/runs/${encodeURIComponent(runId)}/items/${encodeURIComponent(itemId)}`,
  )).data;
}

export async function addEvaluationComment(runId: string, itemId: string, comment: string) {
  return (await request<{ data: { id: string; author: string; comment: string; created_at: string } }>(
    `/evaluations/runs/${encodeURIComponent(runId)}/items/${encodeURIComponent(itemId)}/comments`,
    { method: "POST", body: JSON.stringify({ comment }) },
  )).data;
}
