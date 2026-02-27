import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useDateFilter } from "@/contexts/DateFilterContext";
import {
  fetchCallsStats,
  fetchDashboardStats,
  type PaginationParams,
} from "@/services/api";
import { buildDateRangeParams } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  AlertCircle,
  Calendar,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";


import { Phone } from "lucide-react";

type ContributionBarProps = {
  chatValue: number;
  callValue: number;
};

const ContributionBar = ({ chatValue, callValue }: ContributionBarProps) => {
  const total = chatValue + callValue;
  const chatPct = total > 0 ? (chatValue / total) * 100 : 50;
  const callPct = total > 0 ? (callValue / total) * 100 : 50;

  return (
    <div className="mt-4">
      <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted flex shadow-sm border border-muted-foreground/10">
        {/* Left (Chat) segment */}
        {chatPct > 0 && (
          <div
            className={`h-full bg-blue-500 transition-all duration-300 hover:brightness-110 cursor-default relative ${chatPct === 100 ? 'rounded-full' : 'rounded-l-full'}`}
            style={{ width: `${chatPct}%` }}
            title={`Chat: ${chatValue.toLocaleString()} (${chatPct.toFixed(1)}%)`}
          >
            {chatPct > 8 && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-white/90 pointer-events-none select-none">
                <MessageSquare className="h-3 w-3 mr-1 text-white/80" />
              </span>
            )}
          </div>
        )}

        {/* Right (Calls) segment */}
        {callPct > 0 && (
          <div
            className={`h-full bg-emerald-500 transition-all duration-300 hover:brightness-110 cursor-default relative ${callPct === 100 ? 'rounded-full' : 'rounded-r-full'}`}
            style={{ width: `${callPct}%` }}
            title={`Calls: ${callValue.toLocaleString()} (${callPct.toFixed(1)}%)`}
          >
            {callPct > 8 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-white/90 pointer-events-none select-none">
                <Phone className="h-3 w-3 mr-1 text-white/80" />
              </span>
            )}
          </div>
        )}

        {/* Tooltip overlays for small segments */}
        {chatPct <= 8 && chatPct > 0 && (
          <div className="absolute left-0 top-0 h-full flex items-center">
            <div className="ml-1 flex items-center gap-1 text-xs text-blue-900/80 bg-blue-100/80 px-2 py-0.5 rounded shadow">
              <MessageSquare className="h-3 w-3 mr-1 text-blue-700/80" />
            </div>
          </div>
        )}
        {callPct <= 8 && callPct > 0 && (
          <div className="absolute right-0 top-0 h-full flex items-center">
            <div className="mr-1 flex items-center gap-1 text-xs text-emerald-900/80 bg-emerald-100/80 px-2 py-0.5 rounded shadow">
              <Phone className="h-3 w-3 mr-1 text-emerald-700/80" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center">
            <MessageSquare className="h-3 w-3 text-white" />
          </span>
          <div className="flex flex-col">
            <span className="font-medium leading-none">Chat</span>
            <span className="text-xs text-blue-200 leading-none">{chatValue.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="font-medium leading-none">Calls</span>
            <span className="text-xs text-emerald-200 leading-none">{callValue.toLocaleString()}</span>
          </div>
          <span className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center">
            <Phone className="h-3 w-3 text-white" />
          </span>
        </div>
      </div>
    </div>
  );
};

const CombinedDashboard = () => {
  const { dateRange } = useDateFilter();

  const dateParams = buildDateRangeParams(dateRange, {
    includeDefaultStart: false,
  });

  const buildParams = (): PaginationParams => {
    const params: PaginationParams = {};
    if (dateParams.startDate) params.startDate = dateParams.startDate;
    if (dateParams.endDate) params.endDate = dateParams.endDate;
    return params;
  };

  const {
    data: chatStats,
    isLoading: isLoadingChatStats,
    isError: isChatStatsError,
    error: chatStatsError,
    refetch: refetchChatStats,
  } = useQuery({
    queryKey: [
      "combined-chat-stats",
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    queryFn: () => fetchDashboardStats(buildParams()),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const {
    data: callStats,
    isLoading: isLoadingCallStats,
    isError: isCallStatsError,
    error: callStatsError,
    refetch: refetchCallStats,
  } = useQuery({
    queryKey: [
      "combined-call-stats",
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    queryFn: () => fetchCallsStats(buildParams()),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const isLoading = isLoadingChatStats || isLoadingCallStats;
  const hasError = isChatStatsError || isCallStatsError;

  const chatUsers = chatStats?.totalUsers ?? 0;
  const chatSessions = chatStats?.totalSessions ?? 0;
  const chatQuestions = chatStats?.totalQuestions ?? 0;

  const callUsers = callStats?.totalUsers ?? 0;
  const callSessions = callStats?.totalCalls ?? 0;
  const callQuestions = callStats?.totalQuestions ?? 0;
  const callInteractions = callStats?.totalInteractions ?? 0;
  const chatInteractions = chatQuestions * 2;

  const combinedUsers = chatUsers + callUsers;
  const combinedSessions = chatSessions + callSessions;
  const combinedQuestions = chatQuestions + callQuestions;
  const combinedInteractions = chatInteractions + callInteractions;

  const handleRefresh = () => {
    void refetchChatStats();
    void refetchCallStats();
  };

  if (hasError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Unified Metrics</h1>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <div className="flex justify-center items-center p-8 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">
              Error loading unified dashboard data
            </p>
            <p className="text-destructive/80 text-sm">
              {(chatStatsError as Error)?.message ||
                (callStatsError as Error)?.message ||
                "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Unified Metrics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Combined chat + call telemetry snapshot
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="min-h-[180px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-12 w-32 bg-muted animate-pulse rounded mb-3" />
            ) : (
              <div className="text-4xl sm:text-5xl font-extrabold leading-none">
                {combinedUsers.toLocaleString()}
              </div>
            )}
            <ContributionBar chatValue={chatUsers} callValue={callUsers} />
          </CardContent>
        </Card>

        <Card className="min-h-[180px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-12 w-32 bg-muted animate-pulse rounded mb-3" />
            ) : (
              <div className="text-4xl sm:text-5xl font-extrabold leading-none">
                {combinedSessions.toLocaleString()}
              </div>
            )}
            <ContributionBar
              chatValue={chatSessions}
              callValue={callSessions}
            />
          </CardContent>
        </Card>

        <Card className="min-h-[180px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-12 w-32 bg-muted animate-pulse rounded mb-3" />
            ) : (
              <div className="text-4xl sm:text-5xl font-extrabold leading-none">
                {combinedQuestions.toLocaleString()}
              </div>
            )}
            <ContributionBar
              chatValue={chatQuestions}
              callValue={callQuestions}
            />
          </CardContent>
        </Card>

        <Card className="min-h-[180px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-12 w-32 bg-muted animate-pulse rounded mb-3" />
            ) : (
              <div className="text-4xl sm:text-5xl font-extrabold leading-none">
                {combinedInteractions.toLocaleString()}
              </div>
            )}
            <ContributionBar
              chatValue={chatInteractions}
              callValue={callInteractions}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CombinedDashboard;
