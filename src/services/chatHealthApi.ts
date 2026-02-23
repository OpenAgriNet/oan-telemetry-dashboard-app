import { API_CONFIG } from "@/config/environment";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthCheckRecord {
  id: number;
  api_type: "chat" | "voice";
  status: "up" | "degraded" | "down";
  response_time: number;
  status_code: number | null;
  query_sent: string | null;
  response_body: string | null;
  error_message: string | null;
  checked_at: string;
}

export interface LatestStatusData {
  apiType: string;
  status: "up" | "degraded" | "down";
  responseTime: number;
  statusCode: number | null;
  querySent: string | null;
  checkedAt: string;
  errorMessage: string | null;
}

export interface LatestStatusResponse {
  success: boolean;
  data: {
    chat: LatestStatusData | null;
    voice: LatestStatusData | null;
  };
}

export interface HistoryResponse {
  success: boolean;
  count: number;
  data: HealthCheckRecord[];
}

// ─── API base (public, no auth) ──────────────────────────────────────────────

const BASE = API_CONFIG.SERVER_URL.replace(/\/v1\/?$/, "/v1");

export async function fetchLatestStatus(): Promise<LatestStatusResponse> {
  const res = await fetch(`${BASE}/chat-health/status`);
  if (!res.ok) throw new Error(`Status API error: ${res.status}`);
  return res.json();
}

export async function fetchHealthHistory(
  limit = 200,
  type?: "chat" | "voice"
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (type) params.set("type", type);
  const res = await fetch(`${BASE}/chat-health/history?${params}`);
  if (!res.ok) throw new Error(`History API error: ${res.status}`);
  return res.json();
}
