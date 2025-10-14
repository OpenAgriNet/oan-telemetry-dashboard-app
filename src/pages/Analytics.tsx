
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDailyMetrics } from "@/services/api";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import TrendChart from "@/components/dashboard/TrendChart";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const Analytics = () => {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days default
    to: new Date(),
  });

  const { data: dailyMetrics = [], isLoading } = useQuery({
    queryKey: ["dailyMetrics"],
    queryFn: fetchDailyMetrics,
  });

  // Filter data based on date range
  const filteredMetrics = dailyMetrics.filter((metric) => {
    const metricDate = new Date(metric.date);
    const from = dateRange.from || new Date(0);
    const to = dateRange.to || new Date(8640000000000000); // Max date
    return metricDate >= from && metricDate <= to;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <p>Loading analytics data...</p>
        </div>
      ) : (
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">User Metrics</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="devices">Device Usage</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            <TabsContent value="users">
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <TrendChart
                  title="Daily Users"
                  description="Unique user logins per day"
                  data={filteredMetrics.map((metric) => ({
                    ...metric,
                    uniqueLogins: metric.uniqueLogins || 0,
                  }))}
                  dataKey="uniqueLogins"
                  type="line"
                />
                <TrendChart
                  title="User Growth"
                  description="Cumulative user count"
                  data={filteredMetrics.map((metric, index, array) => ({
                    ...metric,
                    cumulativeUsers: array
                      .slice(0, index + 1)
                      .reduce((sum, item) => sum + item.uniqueLogins, 0),
                  }))}
                  dataKey="cumulativeUsers"
                  type="area"
                />
              </div>
            </TabsContent>
            <TabsContent value="questions">
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <TrendChart
                  title="Questions Per Day"
                  description="Total questions asked daily"
                  data={filteredMetrics.map((metric) => ({
                    ...metric,
                    questionsAsked: metric.questionsAsked || 0,
                  }))}
                  dataKey="questionsAsked"
                  type="bar"
                />
                <TrendChart
                  title="Questions Per User"
                  description="Average questions per user"
                  data={filteredMetrics.map((metric) => ({
                    ...metric,
                    questionsPerUser:
                      metric.uniqueLogins > 0
                        ? +(
                            metric.questionsAsked / metric.uniqueLogins
                          ).toFixed(2)
                        : 0,
                  }))}
                  dataKey="questionsPerUser"
                  type="line"
                />
              </div>
            </TabsContent>
            <TabsContent value="devices">
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <TrendChart
                  title="Mobile vs Desktop Users"
                  description="Daily users by device type"
                  data={filteredMetrics.map((metric) => ({
                    date: metric.date,
                    Mobile: metric.mobileUsers,
                    Desktop: metric.desktopUsers,
                  }))}
                  dataKey="Mobile"
                  type="bar"
                  color="#8b5cf6"
                />
                <TrendChart
                  title="Desktop Users"
                  description="Daily desktop users"
                  data={filteredMetrics.map((metric) => ({
                    ...metric,
                    desktopUsers: metric.desktopUsers || 0,
                  }))}
                  dataKey="desktopUsers"
                  type="line"
                  color="#38bdf8"
                />
              </div>
            </TabsContent>
            <TabsContent value="engagement">
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <TrendChart
                  title="Reactions"
                  description="Daily reactions collected"
                  data={filteredMetrics.map((metric) => ({
                    ...metric,
                    reactionsCollected: metric.reactionsCollected || 0,
                  }))}
                  dataKey="reactionsCollected"
                  type="area"
                  color="#ec4899"
                />
                <TrendChart
                  title="Voice Inputs"
                  description="Daily voice commands"
                  data={filteredMetrics.map((metric) => ({
                    ...metric,
                    voiceInputs: metric.voiceInputs || 0,
                  }))}
                  dataKey="voiceInputs"
                  type="line"
                  color="#f97316"
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
};

export default Analytics;
