import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchQuestionsGraph,
  fetchSessionsGraph,
  fetchFeedbackGraph,
  fetchUsersGraph,
  type PaginationParams,
  fetchDevicesGraph,
} from "@/services/api";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useStats } from "@/contexts/StatsContext";
import MetricCard from "@/components/dashboard/MetricCard";
import LoadingMetricCard from "@/components/dashboard/LoadingMetricCard";
import TrendChart from "@/components/dashboard/TrendChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  MessageSquare,
  Activity,
  ThumbsUp,
  BarChart,
  LineChart,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatUTCToIST, buildDateRangeParams } from "@/lib/utils";

const Dashboard = () => {
  const { dateRange } = useDateFilter();

  const [currentTab, setCurrentTab] = useState<
    "users" | "questions" | "sessions" | "feedback"
  >("users");

  // State to track chart type (line or bar)
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  // State to track time granularity (daily or hourly)
  const [timeGranularity, setTimeGranularity] = useState<"daily" | "hourly">(
    "daily",
  );

  // Helper function to build API params using unified date range utility
  const buildApiParams = (): {
    startDate?: string;
    endDate?: string;
    granularity?: string;
  } => {
    const params = buildDateRangeParams(dateRange, {
      additionalParams: {
        granularity: timeGranularity,
      },
    });
    return params;
  };

  // Use centralized stats from StatsContext - shared across all pages!
  const { stats: dashboardStats, isLoading: isLoadingDashboardStats } =
    useStats();

  // Extract individual stats from unified response
  const questionStats = dashboardStats
    ? { totalQuestions: dashboardStats.totalQuestions }
    : undefined;
  const sessionStats = dashboardStats
    ? { totalSessions: dashboardStats.totalSessions }
    : undefined;
  const feedbackStats = dashboardStats
    ? {
        totalFeedback: dashboardStats.totalFeedback,
        totalLikes: dashboardStats.totalLikes,
        totalDislikes: dashboardStats.totalDislikes,
      }
    : undefined;
  const userStats = dashboardStats
    ? { totalUsers: dashboardStats.totalUsers, }
    : undefined;

  const isLoadingQuestionStats = isLoadingDashboardStats;
  const isLoadingSessionStats = isLoadingDashboardStats;
  const isLoadingFeedbackStats = isLoadingDashboardStats;
  const isLoadingUserStats = isLoadingDashboardStats;

  // Fetch questions graph data for time-series visualization
  const { data: questionsGraphData, isLoading: isLoadingQuestionsGraph } =
    useQuery({
      queryKey: [
        "questions-graph",
        dateRange.from?.toISOString(),
        dateRange.to?.toISOString(),
        timeGranularity,
      ],
      enabled:
        dateRange.from !== undefined &&
        dateRange.to !== undefined &&
        currentTab === "questions",
      queryFn: () => {
        const params = buildDateRangeParams(dateRange, {
          includeDefaultStart: false,
          additionalParams: {
            granularity: timeGranularity,
          },
        });
        return fetchQuestionsGraph(params);
      },
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    });

  // Fetch sessions graph data for time-series visualization
  const { data: sessionsGraphData, isLoading: isLoadingSessionsGraph } =
    useQuery({
      queryKey: [
        "sessions-graph",
        dateRange.from?.toISOString(),
        dateRange.to?.toISOString(),
        timeGranularity,
      ],
      enabled:
        dateRange.from !== undefined &&
        dateRange.to !== undefined &&
        currentTab === "sessions",
      queryFn: () => {
        const params = buildDateRangeParams(dateRange, {
          includeDefaultStart: false,
          additionalParams: {
            granularity: timeGranularity,
          },
        });
        return fetchSessionsGraph(params);
      },
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    });

  // Fetch users graph data for time-series visualization
  const { data: usersGraphData, isLoading: isLoadingUsersGraph } = useQuery({
    queryKey: [
      "users-graph",
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      timeGranularity,
    ],
    enabled: dateRange.from !== undefined && dateRange.to !== undefined,
    queryFn: () => {
      const params = buildDateRangeParams(dateRange, {
        includeDefaultStart: false,
        additionalParams: {
          granularity: timeGranularity,
        },
      });
      return fetchDevicesGraph(params);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Fetch feedback graph data for time-series visualization
  const { data: feedbackGraphData, isLoading: isLoadingFeedbackGraph } =
    useQuery({
      queryKey: [
        "feedback-graph",
        dateRange.from?.toISOString(),
        dateRange.to?.toISOString(),
        timeGranularity,
      ],
      enabled:
        dateRange.from !== undefined &&
        dateRange.to !== undefined &&
        currentTab === "feedback",
      queryFn: () => {
        const params = buildDateRangeParams(dateRange, {
          includeDefaultStart: false,
          additionalParams: {
            granularity: timeGranularity,
          },
        });
        return fetchFeedbackGraph(params);
      },
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    });

  const isLoading =
    isLoadingQuestionStats ||
    isLoadingSessionStats ||
    isLoadingUserStats ||
    isLoadingFeedbackStats;

  // Helper function to get the appropriate x-axis key based on granularity
  const getXAxisKey = () => {
    return timeGranularity === "daily" ? "date" : "hour";
  };

  // Helper function to transform hourly data if needed
  const transformHourlyData = (
    data: Array<{
      hour?: number;
      date?: string;
      timestamp?: number;
      [key: string]: unknown;
    }>,
  ) => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((item) => ({
      ...item,
      // For hourly data, ensure we have a proper hour field
      hour:
        item.hour !== undefined
          ? item.hour
          : typeof item.date === "string" && item.date.includes(" ")
            ? parseInt(item.date.split(" ")[1]?.split(":")[0] || "0")
            : 0,
      // Keep date as is for x-axis labeling
      date: item.date || `Hour ${item.hour || 0}`,
    }));
  };

  // Helper function to add total unique users to the data
  const transformUsersData = (
    data: Array<{
      newUsers?: number;
      returningUsers?: number;
      [key: string]: unknown;
    }>,
  ) => {
    if (!data || !Array.isArray(data)) return [];

    return data.map((item) => ({
      ...item,
      // totalUniqueUsers: (item.newUsersCount || 0) + (item.returningUsersCount || 0),
    }));
  };

  console.log("questions graph", questionsGraphData);
  console.log("sessions graph", sessionsGraphData);
  console.log("feedback graph", feedbackGraphData);
  console.log("users graph", usersGraphData);
  console.log("dashboard stats", dashboardStats);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {isLoadingUserStats ||
        isLoadingQuestionStats ||
        isLoadingSessionStats ||
        isLoadingFeedbackStats ? (
          <>
            <LoadingMetricCard icon={<User size={16} />} />
            <LoadingMetricCard icon={<MessageSquare size={16} />} />
            <LoadingMetricCard icon={<MessageSquare size={16} />} />
            <LoadingMetricCard icon={<ThumbsUp size={16} />} />
          </>
        ) : (
          <>
            <MetricCard
              title="Devices"
              value={userStats?.totalUsers || 0}
              icon={<User size={16} />}
              description="Count of unique devices"
            />
            <MetricCard
              title="Sessions"
              value={sessionStats?.totalSessions || 0}
              icon={<MessageSquare size={16} />}
              description="Total session activity"
            />
            <MetricCard
              title="Questions"
              value={questionStats?.totalQuestions || 0}
              icon={<MessageSquare size={16} />}
              description="Total questions submitted"
            />
            <MetricCard
              title="Feedback"
              value={feedbackStats?.totalFeedback || 0}
              icon={<ThumbsUp size={16} />}
              description={`${
                feedbackStats?.totalLikes && feedbackStats?.totalFeedback
                  ? (
                      (feedbackStats.totalLikes / feedbackStats.totalFeedback) *
                      100
                    ).toFixed(1)
                  : 0
              }% Positive feedback rate`}
            />
          </>
        )}
      </div>

      <Card className="card-gradient">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
          <CardTitle className="text-lg">Chart Options</CardTitle>
          <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto">
            {/* <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Data:</span>
              <ToggleGroup
                type="single"
                value={timeGranularity}
                onValueChange={(value) =>
                  value && setTimeGranularity(value as "daily" | "hourly")
                }
              >
                <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
              </ToggleGroup>
            </div> */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Chart:</span>
              <ToggleGroup
                type="single"
                value={chartType}
                onValueChange={(value) =>
                  value && setChartType(value as "line" | "bar")
                }
              >
                <ToggleGroupItem value="line">
                  <LineChart size={16} className="mr-1" /> Line
                </ToggleGroupItem>
                <ToggleGroupItem value="bar">
                  <BarChart size={16} className="mr-1" /> Bar
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        <Tabs
          value={currentTab}
          onValueChange={(value) => setCurrentTab(value as typeof currentTab)}
        >
          <TabsList className="w-full flex-wrap h-auto justify-start sm:w-auto">
            <TabsTrigger value="users">Devices</TabsTrigger> 
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

           <TabsContent value="users">
            <TrendChart
              title="Device Activity"
              description={`${
                timeGranularity === "daily" ? "Daily" : "Hourly"
              } new vs returning vs total devices`}
              data={
                timeGranularity === "daily"
                  ? transformUsersData(usersGraphData?.data || [])
                  : transformUsersData(
                      transformHourlyData(usersGraphData?.data || []),
                    )
              }
              isLoading={isLoadingUsersGraph}
              dataKey={[
                {
                  dataKey: "newUsersCount",
                  color: "#3b82f6",
                  name: "New Devices",
                  strokeDasharray: "5 5",
                  fillOpacity: 0.3,
                },
                {
                  dataKey: "returningUsersCount",
                  color: "#10b981",
                  name: "Returning Devices",
                  strokeDasharray: "5 5",
                  fillOpacity: 0.3,
                },
                {
                  dataKey: "uniqueUsersCount",
                  color: "hsl(var(--foreground))",
                  name: "Total Active Devices",
                  fillOpacity: 1,
                },
              ]}
              type={chartType}
              xAxisKey={getXAxisKey()}
            />
          </TabsContent>
          <TabsContent value="questions">
            <div className="space-y-4">
              <TrendChart
                title="Questions Asked Over Time"
                description={`${
                  timeGranularity === "daily" ? "Daily" : "Hourly"
                } questions count`}
                data={questionsGraphData?.data || []}
                dataKey="questionsCount"
                isLoading={isLoadingQuestionsGraph}
                type={chartType}
                color="hsl(var(--primary))"
                xAxisKey={getXAxisKey()}
              />
            </div>
          </TabsContent>
          <TabsContent value="sessions">
            <div className="space-y-4">
              <TrendChart
                title="Session Activity Over Time"
                description={`${
                  timeGranularity === "daily" ? "Daily" : "Hourly"
                } sessions count`}
                data={sessionsGraphData?.data || []}
                dataKey="sessionsCount"
                type={chartType}
                color="#10b981"
                isLoading={isLoadingSessionsGraph}
                xAxisKey={getXAxisKey()}
              />
            </div>
          </TabsContent>
          <TabsContent value="feedback">
            <div className="space-y-4">
              <TrendChart
                title="Feedback Activity Over Time"
                description={`${
                  timeGranularity === "daily" ? "Daily" : "Hourly"
                } likes and dislikes`}
                data={feedbackGraphData?.data || []}
                dataKey={[
                  {
                    dataKey: "likesCount",
                    color: "#10b981",
                    name: "Likes",
                  },
                  {
                    dataKey: "dislikesCount",
                    color: "#ef4444",
                    name: "Dislikes",
                  },
                ]}
                type={chartType}
                isLoading={isLoadingFeedbackGraph}
                xAxisKey={getXAxisKey()}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
