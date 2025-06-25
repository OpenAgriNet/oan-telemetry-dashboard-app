import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchQuestionStats,
  fetchQuestionsGraph,
  fetchSessionStats,
  fetchSessionsGraph,
  fetchComprehensiveFeedbackStats,
  fetchFeedbackGraph,
  fetchDashboardStats,
  type PaginationParams,
  fetchUsersGraph,
  fetchUserStats,
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
import { formatUTCToIST } from "@/lib/utils";

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

  // Fetch sessions graph data for time-series visualization
  const {
    data: sessionsGraphData,
    isLoading: isLoadingSessionsGraph,
  } = useQuery({
    queryKey: ["sessions-graph", dateRange.from?.toISOString(), dateRange.to?.toISOString(), timeGranularity],
    queryFn: () => fetchSessionsGraph(buildApiParams()),
    });

  // Fetch users graph data for time-series visualization
  const {
    data: usersGraphData,
    isLoading: isLoadingUsersGraph,
  } = useQuery({
    queryKey: ["users-graph", dateRange.from?.toISOString(), dateRange.to?.toISOString(), timeGranularity],
    queryFn: () => fetchUsersGraph(buildApiParams()),
  });

  // Fetch comprehensive feedback statistics
  const {
    data: feedbackStats,
    isLoading: isLoadingFeedbackStats,
  } = useQuery({
    queryKey: ["comprehensive-feedback-stats", dateRange.from?.toISOString(), dateRange.to?.toISOString(), timeGranularity],
    queryFn: () => fetchComprehensiveFeedbackStats(buildApiParams()),
  });

  // Fetch users statistics
  const {
    data: userStats,
    isLoading: isLoadingUserStats,
  } = useQuery({
    queryKey: ["users-stats", dateRange.from?.toISOString(), dateRange.to?.toISOString(), timeGranularity], 
    queryFn: () => fetchUserStats(buildApiParams()),
  });

  // Fetch feedback graph data for time-series visualization
  const {
    data: feedbackGraphData,
    isLoading: isLoadingFeedbackGraph,
  } = useQuery({
    queryKey: ["feedback-graph", dateRange.from?.toISOString(), dateRange.to?.toISOString(), timeGranularity],
    queryFn: () => fetchFeedbackGraph(buildApiParams()),
  });

  const isLoading = isLoadingDashboardStats || isLoadingQuestionStats || isLoadingQuestionsGraph || isLoadingSessionStats || isLoadingSessionsGraph || isLoadingFeedbackStats || isLoadingFeedbackGraph;

  // Helper function to get the appropriate x-axis key based on granularity
  const getXAxisKey = () => {
    return timeGranularity === 'daily' ? 'date' : 'hour';
  };

  // Helper function to transform hourly data if needed
  const transformHourlyData = (data: Array<{ hour?: number; date?: string; timestamp?: string; [key: string]: unknown }>) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data.map(item => ({
      ...item,
      // For hourly data, ensure we have a proper hour field
      hour: item.hour !== undefined 
        ? item.hour 
        : (typeof item.date === 'string' && item.date.includes(' ') 
          ? parseInt(item.date.split(' ')[1]?.split(':')[0] || '0') 
          : 0),
      // Keep date as is for x-axis labeling
      date: item.date || `Hour ${item.hour || 0}`,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Unique Users"
          value={dashboardStats?.totalUsers || questionStats?.uniqueUsers || sessionStats?.uniqueUsers || userStats?.totalUsers || 0}
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
              description={`${timeGranularity === 'daily' ? 'Daily' : 'Hourly'} unique users (IST)`}
              data={timeGranularity === 'daily' 
                ? (usersGraphData?.data || userStats?.dailyActivity || [])
                : transformHourlyData( usersGraphData?.data || userStats?.dailyActivity || [])
              }
              dataKey="uniqueUsersCount"
              type={chartType}
              color="hsl(var(--primary))" 
              xAxisKey={getXAxisKey()}
            />
          </TabsContent>
          <TabsContent value="questions">
            <div className="space-y-4">
              <TrendChart
                title="Questions Asked Over Time"
                description={`${timeGranularity === 'daily' ? 'Daily' : 'Hourly'} questions count (IST) - Powered by Questions Graph API`}
                data={questionsGraphData?.data || questionStats?.dailyActivity || transformHourlyData(questionStats?.hourlyDistribution || [])}
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
                        <p className="text-xs text-muted-foreground">on {formatUTCToIST(questionsGraphData.metadata.summary.peakActivity.date, "MMM dd, yyyy")}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Date Range (IST)</p>
                        <p className="text-sm font-medium">
                          {formatUTCToIST(questionsGraphData.metadata.dateRange.start, "MMM dd, yyyy")} to {formatUTCToIST(questionsGraphData.metadata.dateRange.end, "MMM dd, yyyy")}
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
            <div className="space-y-4">
              <TrendChart
                title="Session Activity Over Time"
                description={`${timeGranularity === 'daily' ? 'Daily' : 'Hourly'} sessions count (IST) - Powered by Sessions Graph API`}
                data={sessionsGraphData?.data || sessionStats?.dailyActivity || transformHourlyData(sessionStats?.dailyActivity || [])}
                dataKey="sessionsCount"
                type={chartType}
                color="#10b981"
                xAxisKey={getXAxisKey()}
              />
              
              {/* Sessions Graph Metadata Card */}
              {sessionsGraphData && (
                <Card className="card-gradient">
                  <CardHeader>
                    <CardTitle>Sessions Graph Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Data Points</p>
                        <p className="text-2xl font-bold">{sessionsGraphData.metadata.totalDataPoints}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Avg Sessions/Period</p>
                        <p className="text-2xl font-bold">{sessionsGraphData.metadata.summary.avgSessionsPerPeriod}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Peak Activity</p>
                        <p className="text-lg font-bold">{sessionsGraphData.metadata.summary.peakActivity.sessionsCount} sessions</p>
                        <p className="text-xs text-muted-foreground">on {formatUTCToIST(sessionsGraphData.metadata.summary.peakActivity.date, "MMM dd, yyyy")}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Date Range (IST)</p>
                        <p className="text-sm font-medium">
                          {formatUTCToIST(sessionsGraphData.metadata.dateRange.start, "MMM dd, yyyy")} to {formatUTCToIST(sessionsGraphData.metadata.dateRange.end, "MMM dd, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">Granularity: {sessionsGraphData.metadata.granularity}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          <TabsContent value="feedback">
            <div className="space-y-4">
              <TrendChart
                title="Feedback Activity Over Time"
                description={`${timeGranularity === 'daily' ? 'Daily' : 'Hourly'} likes and dislikes (IST) - Powered by Feedback Graph API`}
                data={feedbackGraphData?.data || feedbackStats?.dailyActivity || transformHourlyData(feedbackStats?.dailyActivity || [])}
                dataKey={[
                  { 
                    dataKey: "likesCount", 
                    color: "#10b981", 
                    name: "Likes" 
                  },
                  { 
                    dataKey: "dislikesCount", 
                    color: "#ef4444", 
                    name: "Dislikes" 
                  }
                ]}
                type={chartType}
                xAxisKey={getXAxisKey()}
              />
              
              {/* Feedback Graph Metadata Card */}
              {feedbackGraphData && (
                <Card className="card-gradient">
                  <CardHeader>
                    <CardTitle>Feedback Graph Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Total Data Points</p>
                        <p className="text-2xl font-bold">{feedbackGraphData.metadata.totalDataPoints}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Avg Feedback/Period</p>
                        <p className="text-2xl font-bold">{feedbackGraphData.metadata.summary.avgFeedbackPerPeriod}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
                        <p className="text-lg font-bold">{feedbackGraphData.metadata.summary.overallSatisfactionRate}%</p>
                        <p className="text-xs text-muted-foreground">{feedbackGraphData.metadata.summary.totalLikes} likes / {feedbackGraphData.metadata.summary.totalDislikes} dislikes</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Peak Activity</p>
                        <p className="text-lg font-bold">{feedbackGraphData.metadata.summary.peakActivity.feedbackCount} feedback</p>
                        <p className="text-xs text-muted-foreground">on {formatUTCToIST(feedbackGraphData.metadata.summary.peakActivity.date, "MMM dd, yyyy")}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Date Range (IST)</p>
                        <p className="text-sm font-medium">
                          {formatUTCToIST(feedbackGraphData.metadata.dateRange.start, "MMM dd, yyyy")} to {formatUTCToIST(feedbackGraphData.metadata.dateRange.end, "MMM dd, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">Granularity: {feedbackGraphData.metadata.granularity}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
