
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, BarChart, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import contentData from "../data/contentData.json";
import { format } from "date-fns";

const Content: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [activeTab, setActiveTab] = useState<string>("7days");

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const getFilteredMetricsByPeriod = () => {
    const today = new Date();
    let filteredData;

    if (dateRange.from && dateRange.to) {
      filteredData = contentData.metrics.byPeriod.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= dateRange.from! && itemDate <= dateRange.to!;
      });
    } else {
      switch (activeTab) {
        case "7days":
          filteredData = contentData.metrics.byPeriod.slice(-7);
          break;
        case "30days":
          filteredData = contentData.metrics.byPeriod.slice(-30);
          break;
        default:
          filteredData = contentData.metrics.byPeriod;
          break;
      }
    }

    return filteredData;
  };

  const filteredMetrics = getFilteredMetricsByPeriod();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Content Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Tabs defaultValue="7days" value={activeTab} onValueChange={setActiveTab} className="mr-4">
            <TabsList>
              <TabsTrigger value="7days">Last 7 Days</TabsTrigger>
              <TabsTrigger value="30days">Last 30 Days</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
          {activeTab === "custom" && (
            <DateRangePicker dateRange={dateRange} setDateRange={setDateRange} />
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contents Ingested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentData.metrics.totalContentsIngested}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Answered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentData.metrics.totalQuestionsAnswered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contents Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentData.metrics.totalContentsUsed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unused Contents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contentData.metrics.unusedContents}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content Ingestion Trend</CardTitle>
            <CardDescription>Number of contents added over time</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredMetrics}>
                  <defs>
                    <linearGradient id="colorIngested" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="contentsIngested" stroke="#8884d8" fillOpacity={1} fill="url(#colorIngested)" name="Contents Ingested" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Questions Answered Trend</CardTitle>
            <CardDescription>Number of questions answered using content</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="questionsAnswered" fill="#82ca9d" name="Questions Answered" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tables */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Most Used Contents</CardTitle>
            <CardDescription>Contents that have been referred to answer questions most frequently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Questions</TableHead>
                    <TableHead className="text-right">Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentData.topUsedContents.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell className="font-medium">{content.name}</TableCell>
                      <TableCell>{content.source}</TableCell>
                      <TableCell className="text-right">{content.questionsReferred}</TableCell>
                      <TableCell className="text-right">{formatDate(content.uploadedDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Least Used Contents</CardTitle>
            <CardDescription>Contents that have been referred to answer questions least frequently</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Questions</TableHead>
                    <TableHead className="text-right">Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentData.leastUsedContents.map((content) => (
                    <TableRow key={content.id}>
                      <TableCell className="font-medium">{content.name}</TableCell>
                      <TableCell>{content.source}</TableCell>
                      <TableCell className="text-right">{content.questionsReferred}</TableCell>
                      <TableCell className="text-right">{formatDate(content.uploadedDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Content;
