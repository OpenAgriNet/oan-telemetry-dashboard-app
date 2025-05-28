
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDailyMetrics,
  fetchUsers,
  fetchSessions,
  fetchQuestions,
} from "@/services/api";
import MetricCard from "@/components/dashboard/MetricCard";
import TrendChart from "@/components/dashboard/TrendChart";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  MessageSquare,
  ThumbsUp,
  Mic,
  BarChart,
  LineChart,
} from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days default
    to: new Date(),
  });

  const [timeRange, setTimeRange] = useState<"7days" | "30days" | "custom">(
    "7days"
  );
  
  // State to track chart type (line or bar)
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  
  // State to track time granularity (daily or hourly)
  const [timeGranularity, setTimeGranularity] = useState<"daily" | "hourly">("daily");

  const {
    data: dailyMetrics = [],
    isLoading: isLoadingMetrics,
    error: metricsError,
  } = useQuery({
    queryKey: ["dailyMetrics"],
    queryFn: fetchDailyMetrics,
  });

  const {
    data: usersResponse,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetchUsers({ page: 1, limit: 1000 }),
  });

  const {
    data: sessionsResponse,
    isLoading: isLoadingSessions,
    error: sessionsError,
  } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => fetchSessions({ page: 1, limit: 1000 }),
  });

  const {
    data: questionsResponse,
    isLoading: isLoadingQuestions,
    error: questionsError,
  } = useQuery({
    queryKey: ["questions"],
    queryFn: () => fetchQuestions({ page: 1, limit: 1000 }),
  });

  // Extract data from paginated responses
  const users = usersResponse?.data || [];
  const sessions = sessionsResponse?.data || [];
  const questions = questionsResponse?.data || [];

  useEffect(() => {
    // Update date range when time range changes
    const today = new Date();
    switch (timeRange) {
      case "7days":
        setDateRange({
          from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          to: today,
        });
        break;
      case "30days":
        setDateRange({
          from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
          to: today,
        });
        break;
      case "custom":
        // Keep existing date range
        break;
    }
  }, [timeRange]);

  // Add current date if it's not in the dataset
  const addCurrentDateMetrics = (metrics) => {
    const today = new Date().toISOString().split('T')[0];
    const hasCurrentDate = metrics.some(metric => metric.date === today);
    
    if (!hasCurrentDate) {
      // Create a current date entry based on average of recent data or default values
      const recentMetrics = metrics.slice(-3);
      const avgMetrics = {
        date: today,
        uniqueLogins: Math.round(recentMetrics.reduce((sum, m) => sum + m.uniqueLogins, 0) / (recentMetrics.length || 1)),
        questionsAsked: Math.round(recentMetrics.reduce((sum, m) => sum + m.questionsAsked, 0) / (recentMetrics.length || 1)),
        reactionsCollected: Math.round(recentMetrics.reduce((sum, m) => sum + m.reactionsCollected, 0) / (recentMetrics.length || 1)),
        voiceInputs: Math.round(recentMetrics.reduce((sum, m) => sum + m.voiceInputs, 0) / (recentMetrics.length || 1)),
        mobileUsers: Math.round(recentMetrics.reduce((sum, m) => sum + (m.mobileUsers || 0), 0) / (recentMetrics.length || 1)),
        desktopUsers: Math.round(recentMetrics.reduce((sum, m) => sum + (m.desktopUsers || 0), 0) / (recentMetrics.length || 1))
      };
      
      console.log("Adding current date metrics:", avgMetrics);
      return [...metrics, avgMetrics];
    }
    
    return metrics;
  };

  // Filter data based on date range
  const processedMetrics = addCurrentDateMetrics(dailyMetrics);
  const filteredMetrics = processedMetrics.filter((metric) => {
    const metricDate = new Date(metric.date);
    const from = dateRange.from || new Date(0);
    const to = dateRange.to ? new Date(dateRange.to.setHours(23, 59, 59, 999)) : new Date(8640000000000000); // Max date with end of day
    
    return metricDate >= from && metricDate <= to;
  });

  // Generate hourly data (mock data based on daily data)
  const generateHourlyData = (metrics) => {
    console.log("Generating hourly data from:", metrics);
    const hourlyData = [];
    
    if (!metrics || metrics.length === 0) {
      console.log("No metrics data to generate hourly data from");
      return [];
    }
    
    metrics.forEach(metric => {
      const baseDate = new Date(metric.date);
      
      // Generate data points for each hour of the day
      for (let hour = 0; hour < 24; hour++) {
        const hourDate = new Date(baseDate);
        hourDate.setHours(hour);
        
        // Create random variations based on the daily values
        const hourlyMultiplier = Math.random() * 0.2 + 0.9; // 0.9 to 1.1
        const hourlyUserMultiplier = Math.random() * 0.3 + 0.85; // 0.85 to 1.15
        
        hourlyData.push({
          date: metric.date,
          timestamp: hourDate.toISOString(),
          uniqueLogins: Math.round(metric.uniqueLogins * hourlyUserMultiplier / 24),
          questionsAsked: Math.round(metric.questionsAsked * hourlyMultiplier / 24),
          reactionsCollected: Math.round(metric.reactionsCollected * hourlyMultiplier / 24),
          voiceInputs: Math.round(metric.voiceInputs * hourlyMultiplier / 24),
          hour
        });
      }
    });
    
    console.log("Generated hourly data:", hourlyData);
    return hourlyData;
  };

  const hourlyMetrics = generateHourlyData(filteredMetrics);
  
  // Select the appropriate dataset based on the selected time granularity
  const displayMetrics = timeGranularity === "daily" ? filteredMetrics : hourlyMetrics;
  
  console.log("Current time granularity:", timeGranularity);
  console.log("Display metrics:", displayMetrics);

  // Calculate summary metrics
  const totalUniqueLogins = filteredMetrics.reduce(
    (sum, metric) => sum + metric.uniqueLogins,
    0
  );
  const totalQuestions = filteredMetrics.reduce(
    (sum, metric) => sum + metric.questionsAsked,
    0
  );
  const totalReactions = filteredMetrics.reduce(
    (sum, metric) => sum + metric.reactionsCollected,
    0
  );
  const totalVoiceInputs = filteredMetrics.reduce(
    (sum, metric) => sum + metric.voiceInputs,
    0
  );

  const isLoading =
    isLoadingMetrics || isLoadingUsers || isLoadingSessions || isLoadingQuestions;
  const error = metricsError || usersError || sessionsError || questionsError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-red-500">
          Error loading dashboard data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        {/* <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          {timeRange === "custom" && (
            <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          )}
        </div> */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Unique Logins"
          value={totalUniqueLogins}
          icon={<User size={16} />}
          description="Total unique users"
        />
        <MetricCard
          title="Questions Asked"
          value={totalQuestions}
          icon={<MessageSquare size={16} />}
          description="Total questions"
        />
        <MetricCard
          title="Reactions Collected"
          value={totalReactions}
          icon={<ThumbsUp size={16} />}
          description="Total reactions"
        />
        <MetricCard
          title="Voice Inputs"
          value={totalVoiceInputs}
          icon={<Mic size={16} />}
          description="Total voice inputs"
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
            <TabsTrigger value="reactions">Reactions</TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <TrendChart
              title="User Activity"
              description={`${timeGranularity === 'daily' ? 'Daily' : 'Hourly'} unique logins`}
              data={displayMetrics}
              dataKey="uniqueLogins"
              type={chartType}
              xAxisKey={timeGranularity === 'daily' ? 'date' : 'timestamp'}
            />
          </TabsContent>
          <TabsContent value="questions">
            <TrendChart
              title="Questions Asked"
              description={`${timeGranularity === 'daily' ? 'Daily' : 'Hourly'} questions count`}
              data={displayMetrics}
              dataKey="questionsAsked"
              type={chartType}
              color="hsl(var(--primary))"
              xAxisKey={timeGranularity === 'daily' ? 'date' : 'timestamp'}
            />
          </TabsContent>
          <TabsContent value="reactions">
            <TrendChart
              title="Reactions Collected"
              description={`${timeGranularity === 'daily' ? 'Daily' : 'Hourly'} reactions count`}
              data={displayMetrics}
              dataKey="reactionsCollected"
              type={chartType}
              color="#ec4899"
              xAxisKey={timeGranularity === 'daily' ? 'date' : 'timestamp'}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
