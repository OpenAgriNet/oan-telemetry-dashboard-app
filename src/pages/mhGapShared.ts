import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { API_CONFIG } from "@/config/environment";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { buildDateRangeParams } from "@/lib/utils";

export type ReconstructedService = { key: string; name: string; candidateCalls: number; mhResponsesObserved: number };
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
