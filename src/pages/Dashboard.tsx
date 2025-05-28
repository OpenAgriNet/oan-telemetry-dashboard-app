import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchQuestionStats,
  fetchQuestionsGraph,
  fetchSessionStats,
  fetchComprehensiveFeedbackStats,
  fetchDashboardStats,
  type PaginationParams,
} from "@/services/api";
import { useDateFilter } from "@/contexts/DateFilterContext";
import MetricCard from "@/components/dashboard/MetricCard";
import TrendChart from "@/components/dashboard/TrendChart";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  MessageSquare,
  ThumbsUp,
  BarChart,
  LineChart,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const Dashboard = () => {
  const { dateRange } = useDateFilter();
  
  // State to track chart type (line or bar)
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  
  // State to track time granularity (daily or hourly)
  const [timeGranularity, setTimeGranularity] = useState<"daily" | "hourly">("daily");

  // Helper function to build API params
  const buildApiParams = (): { startDate?: string; endDate?: string; granularity?: string } => {
    const params: { startDate?: string; endDate?: string; granularity?: string } = {};
    if (dateRange.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      params.startDate = fromDate.toISOString();
    }
    if (dateRange.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      params.endDate = toDate.toISOString();
    }
    params.granularity = timeGranularity;
    return params;
  };

  // Fetch comprehensive dashboard statistics
  const {
    data: dashboardStats,
    isLoading: isLoadingDashboardStats,
  } = useQuery({
    queryKey: ["dashboard-stats", dateRange.from?.toISOString(), dateRange.to?.toISOString(), timeGranularity],
    queryFn: () => fetchDashboardStats(buildApiParams()),
  });

  // Fetch question statistics
  const {
    data: questionStats,
    isLoading: isLoadingQuestionStats,
  } = useQuery({
    queryKey: ["question-stats", dateRange.from?.toISOString(), dateRange.to?.toISOString(), timeGranularity],
    queryFn: () => fetchQuestionStats(buildApiParams()),
  });

  // Fetch questions graph data for time-series visualization
  const {
    data: questionsGraphData,
    isLoading: isLoadingQuestionsGraph,
  } = useQuery({
    queryKey: ["questions-graph", dateRange.from?.toISOString(), dateRange.to?.toISOString(), timeGranularity],
    queryFn: () => fetchQuestionsGraph(buildApiParams()),
  });

  // Fetch session statistics
  const {
    data: sessionStats,
    isLoading: isLoadingSessionStats,
  } = useQuery({
    queryKey: ["session-stats", dateRange.from?.toISOString(), dateRange.to?.toISOString(), timeGranularity],
    queryFn: () => fetchSessionStats(buildApiParams()),
  });

  // Fetch comprehensive feedback statistics
  const {
    data: feedbackStats,
    isLoading: isLoadingFeedbackStats,
  } = useQuery({
    queryKey: ["comprehensive-feedback-stats", dateRange.from?.toISOString(), dateRange.to?.toISOString(), timeGranularity],
    queryFn: () => fetchComprehensiveFeedbackStats(buildApiParams()),
  });

  const isLoading = isLoadingDashboardStats || isLoadingQuestionStats || isLoadingQuestionsGraph || isLoadingSessionStats || isLoadingFeedbackStats;

  // Helper function to get the appropriate x-axis key based on granularity
  const getXAxisKey = () => {
    return timeGranularity === 'daily' ? 'date' : 'hour';
  };

  // Helper function to transform hourly data if needed
  const transformHourlyData = (data: Array<{ hour?: number; date?: string; timestamp?: string; [key: string]: unknown }>) => {
    if (!data || !Array.isArray(data)) return [];
    
    if (timeGranularity === 'hourly') {
      // If we have hourly distribution data, transform it to the expected format
      return data.map(item => ({
        ...item,
        hour: item.hour || item.date || item.timestamp,
      }));
    }
    
    return data;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Unique Users"
          value={dashboardStats?.totalUsers || questionStats?.uniqueUsers || sessionStats?.uniqueUsers || 0}
          icon={<User size={16} />}
          description="Total unique users"
        />
        <MetricCard
          title="Total Sessions"
          value={dashboardStats?.totalSessions || sessionStats?.totalSessions || 0}
          icon={<MessageSquare size={16} />}
          description="Total user sessions"
        />
        <MetricCard
          title="Questions Asked"
          value={dashboardStats?.totalQuestions || questionStats?.totalQuestions || 0}
          icon={<MessageSquare size={16} />}
          description="Total questions"
        />
        <MetricCard
          title="Feedback Collected"
          value={dashboardStats?.totalFeedback || feedbackStats?.totalFeedback || 0}
          icon={<ThumbsUp size={16} />}
          description={`${((dashboardStats?.satisfactionRate || feedbackStats?.satisfactionRate || 0)).toFixed(1)}% satisfaction rate`}
        />
      </div>

      <Card className="card-gradient">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Chart Options</CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Data:</span>
              <ToggleGroup type="single" value={timeGranularity} onValueChange={(value) => value && setTimeGranularity(value as "daily" | "hourly")}>
                <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
                <ToggleGroupItem value="hourly">Hourly</ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Chart:</span>
              <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as "line" | "bar")}>
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
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <TrendChart
              title="User Activity"
              description={`${timeGranularity === 'daily' ? 'Daily' : 'Hourly'} unique users`}
              data={timeGranularity === 'daily' 
                ? (dashboardStats?.recentTrends || sessionStats?.dailyActivity || questionStats?.dailyActivity || [])
                : transformHourlyData(questionStats?.hourlyDistribution || [])
              }
              dataKey={timeGranularity === 'daily' ? 'uniqueUsersCount' : 'questionsCount'}
              type={chartType}
              xAxisKey={getXAxisKey()}
            />
          </TabsContent>
          <TabsContent value="questions">
            <div className="space-y-4">
              <TrendChart
                title="Questions Asked Over Time"
                description={`${timeGranularity === 'daily' ? 'Daily' : 'Hourly'} questions count - Powered by Questions Graph API`}
                data={timeGranularity === 'daily' 
                  ? (questionsGraphData?.data || questionStats?.dailyActivity || [])
                  : transformHourlyData(questionStats?.hourlyDistribution || [])
                }
                dataKey="questionsCount"
                type={chartType}
                color="hsl(var(--primary))"
                xAxisKey={getXAxisKey()}
              />
              
              {/* Questions Graph Metadata Card */}
              {questionsGraphData && (
                <Card className="card-gradient">
                  <CardHeader>
                    <CardTitle>Questions Graph Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Data Points</p>
                        <p className="text-2xl font-bold">{questionsGraphData.metadata.totalDataPoints}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Avg Questions/Period</p>
                        <p className="text-2xl font-bold">{questionsGraphData.metadata.summary.avgQuestionsPerPeriod}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Peak Activity</p>
                        <p className="text-lg font-bold">{questionsGraphData.metadata.summary.peakActivity.questionsCount} questions</p>
                        <p className="text-xs text-muted-foreground">on {questionsGraphData.metadata.summary.peakActivity.date}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Date Range</p>
                        <p className="text-sm font-medium">
                          {questionsGraphData.metadata.dateRange.start} to {questionsGraphData.metadata.dateRange.end}
                        </p>
                        <p className="text-xs text-muted-foreground">Granularity: {questionsGraphData.metadata.granularity}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          <TabsContent value="sessions">
            <TrendChart
              title="Session Activity"
              description={`${timeGranularity === 'daily' ? 'Daily' : 'Hourly'} sessions count`}
              data={timeGranularity === 'daily' 
                ? (sessionStats?.dailyActivity || [])
                : transformHourlyData(sessionStats?.dailyActivity || [])
              }
              dataKey="sessionsCount"
              type={chartType}
              color="#10b981"
              xAxisKey={getXAxisKey()}
            />
          </TabsContent>
          <TabsContent value="feedback">
            <TrendChart
              title="Feedback Activity"
              description={`${timeGranularity === 'daily' ? 'Daily' : 'Hourly'} feedback count`}
              data={timeGranularity === 'daily' 
                ? (feedbackStats?.dailyActivity || [])
                : transformHourlyData(feedbackStats?.dailyActivity || [])
              }
              dataKey="feedbackCount"
              type={chartType}
              color="#ec4899"
              xAxisKey={getXAxisKey()}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
