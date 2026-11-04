import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_CONFIG } from "@/config/environment";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { buildDateRangeParams } from "@/lib/utils";
import type { IndividualApiCall } from "@/services/api";

export type ReconstructedService = { key: string; name: string; description: string; candidateCalls: number; mhResponsesObserved: number };
type GapData = { totals: { mappedCandidateCalls: number }; services: ReconstructedService[] };

export function useMhGap(enabled = true) {
  const { dateRange } = useDateFilter();
  const params = useMemo(() => buildDateRangeParams(dateRange, { includeDefaultStart: false }), [dateRange]);
  return useQuery({
    queryKey: ["mh-gap-reconstruction", params.startDate, params.endDate],
    enabled: enabled && Boolean(params.startDate && params.endDate),
    queryFn: async () => {
      const search = new URLSearchParams({ startDate: String(params.startDate), endDate: String(params.endDate) });
      const response = await fetch(`${API_CONFIG.SERVER_URL}/service-snapshot/mh-gap-reconstruction?${search}`);
      if (!response.ok) throw new Error("Unable to load MH reconstruction");
      const result = await response.json();
      return result.data as GapData;
    }, staleTime: 60_000,
  });
}

type GapCalls = {
  data: { calls: Pick<IndividualApiCall, "id" | "endpoint" | "method" | "event_time" | "outcome" | "duration_ms">[] };
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export function useMhGapCalls(serviceKey: string, page: number) {
  const { dateRange } = useDateFilter();
  const params = useMemo(() => buildDateRangeParams(dateRange, { includeDefaultStart: false }), [dateRange]);
  return useQuery({
    queryKey: ["mh-gap-calls", params.startDate, params.endDate, serviceKey, page],
    enabled: Boolean(serviceKey && params.startDate && params.endDate),
    queryFn: async () => {
      const search = new URLSearchParams({
        startDate: String(params.startDate), endDate: String(params.endDate), serviceKey, page: String(page),
      });
      const response = await fetch(`${API_CONFIG.SERVER_URL}/service-snapshot/mh-gap-reconstruction/calls?${search}`);
      if (!response.ok) throw new Error("Unable to load chatbot requests");
      const result = await response.json();
      if (!result.success) throw new Error(result.error || "Unable to load chatbot requests");
      return result as GapCalls;
    },
    staleTime: 30_000,
  });
}
