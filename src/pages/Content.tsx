
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, BarChart, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import contentData from "../data/contentData.json";
import { format } from "date-fns";
import MetricCard from "@/components/dashboard/MetricCard";
import TrendChart from "@/components/dashboard/TrendChart";

const Content: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [activeTab, setActiveTab] = useState<string>("7days");
  const [sourceViewMode, setSourceViewMode] = useState<"chart" | "table">("chart");

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
        <MetricCard 
          title="Total Contents Ingested"
          value={contentData.metrics.totalContentsIngested}
          icon={<FileText size={18} />}
        />
        <MetricCard 
          title="Questions Answered"
          value={contentData.metrics.totalQuestionsAnswered}
          icon={<FileText size={18} />}
        />
        <MetricCard 
          title="Contents Used"
          value={contentData.metrics.totalContentsUsed}
          icon={<FileText size={18} />}
        />
        <MetricCard 
          title="Unused Contents"
          value={contentData.metrics.unusedContents}
          icon={<FileText size={18} />}
        />
      </div>
      
      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <TrendChart
          title="Content Ingestion Trend"
          description="Number of contents added over time"
          data={filteredMetrics}
          dataKey="contentsIngested"
          type="area"
          color="#8884d8"
        />
        
        <TrendChart
          title="Questions Answered Trend"
          description="Number of questions answered using content"
          data={filteredMetrics}
          dataKey="questionsAnswered"
          type="bar"
          color="#82ca9d"
        />
      </div>

      {/* Content Tables - Full row layout */}
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
                  <TableHead>Category</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead className="text-right">Questions</TableHead>
                  <TableHead className="text-right">Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentData.topUsedContents.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell className="font-medium">{content.name}</TableCell>
                    <TableCell>{content.source}</TableCell>
                    <TableCell>{content.category}</TableCell>
                    <TableCell>{content.format}</TableCell>
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
          <CardTitle>Top Least Used Contents</CardTitle>
          <CardDescription>Contents that have been referred to answer questions least frequently</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead className="text-right">Questions</TableHead>
                  <TableHead className="text-right">Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentData.leastUsedContents.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell className="font-medium">{content.name}</TableCell>
                    <TableCell>{content.source}</TableCell>
                    <TableCell>{content.category}</TableCell>
                    <TableCell>{content.format}</TableCell>
                    <TableCell className="text-right">{content.questionsReferred}</TableCell>
                    <TableCell className="text-right">{formatDate(content.uploadedDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Source Utilization Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Source-wise Utilization</CardTitle>
            <CardDescription>Document sources and their utilization metrics</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={sourceViewMode === "chart" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSourceViewMode("chart")}
            >
              <BarChart3 className="h-4 w-4 mr-1" /> Chart
            </Button>
            <Button 
              variant={sourceViewMode === "table" ? "default" : "outline"} 
              size="sm"
              onClick={() => setSourceViewMode("table")}
            >
              <FileText className="h-4 w-4 mr-1" /> Table
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sourceViewMode === "chart" ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={contentData.sourceUtilization}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="source" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar name="Questions Referred" dataKey="questionsReferred" fill="#8884d8" />
                  <Bar name="Documents Count" dataKey="documentsCount" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Documents</TableHead>
                    <TableHead className="text-right">Questions Referred</TableHead>
                    <TableHead className="text-right">Average per Document</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contentData.sourceUtilization.map((source, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{source.source}</TableCell>
                      <TableCell className="text-right">{source.documentsCount}</TableCell>
                      <TableCell className="text-right">{source.questionsReferred}</TableCell>
                      <TableCell className="text-right">
                        {source.documentsCount > 0 
                          ? (source.questionsReferred / source.documentsCount).toFixed(1) 
                          : "0"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Content;
