
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  User,
  MessageSquare,
  ThumbsUp,
  Mic,
  Smartphone,
  Computer,
} from "lucide-react";

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

  // Filter data based on date range
  const filteredMetrics = dailyMetrics.filter((metric) => {
    const metricDate = new Date(metric.date);
    const from = dateRange.from || new Date(0);
    const to = dateRange.to || new Date(8640000000000000); // Max date
    return metricDate >= from && metricDate <= to;
  });

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

  // Calculate device split data for the pie chart
  const totalMobileUsers = filteredMetrics.reduce(
    (sum, metric) => sum + metric.mobileUsers,
    0
  );
  const totalDesktopUsers = filteredMetrics.reduce(
    (sum, metric) => sum + metric.desktopUsers,
    0
  );
  const deviceData = [
    { name: "Mobile", value: totalMobileUsers },
    { name: "Desktop", value: totalDesktopUsers },
  ];

  const deviceColors = ["#8b5cf6", "#38bdf8"]; // Purple for Mobile, Blue for Desktop

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
        <div className="flex items-center gap-2">
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
        </div>
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

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-4">
          <Tabs defaultValue="users">
            <TabsList>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="reactions">Reactions</TabsTrigger>
            </TabsList>
            <TabsContent value="users">
              <TrendChart
                title="User Activity"
                description="Daily unique logins"
                data={filteredMetrics}
                dataKey="uniqueLogins"
                type="area"
              />
            </TabsContent>
            <TabsContent value="questions">
              <TrendChart
                title="Questions Asked"
                description="Daily questions count"
                data={filteredMetrics}
                dataKey="questionsAsked"
                type="bar"
                color="hsl(var(--primary))"
              />
            </TabsContent>
            <TabsContent value="reactions">
              <TrendChart
                title="Reactions Collected"
                description="Daily reactions count"
                data={filteredMetrics}
                dataKey="reactionsCollected"
                type="line"
                color="#ec4899"
              />
            </TabsContent>
          </Tabs>
        </div>
        {/* <div className="lg:col-span-1">
          <Card className="card-gradient h-full">
            <CardHeader>
              <CardTitle>Device Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {deviceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={deviceColors[index % deviceColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-4">
                  <div className="flex items-center">
                    <span
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: deviceColors[0] }}
                    ></span>
                    <span className="text-sm flex items-center">
                      <Smartphone className="h-4 w-4 mr-1" /> Mobile
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: deviceColors[1] }}
                    ></span>
                    <span className="text-sm flex items-center">
                      <Computer className="h-4 w-4 mr-1" /> Desktop
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;
