import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, BookOpen, Book, Search, FileSearch, ArrowUp, Language, Info } from "lucide-react";
import DateRangePicker from "@/components/dashboard/DateRangePicker";
import contentData from "../data/contentData.json";
import { format } from "date-fns";
import MetricCard from "@/components/dashboard/MetricCard";
import ContentInsights from "@/components/dashboard/ContentInsights";
import { Button } from "@/components/ui/button";

const Content: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [activeTab, setActiveTab] = useState<string>("7days");
  const [showInsights, setShowInsights] = useState<boolean>(false);

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
  
  // Get period text based on active tab
  const getPeriodText = () => {
    if (dateRange.from && dateRange.to) {
      return "in selected date range";
    } else {
      switch (activeTab) {
        case "7days":
          return "last 7 days";
        case "30days":
          return "last 30 days";
        default:
          return "";
      }
    }
  };

  const periodText = getPeriodText();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BookOpen className="text-primary" size={32} /> Content Dashboard
        </h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            className="mr-2 gap-1"
            onClick={() => setShowInsights(!showInsights)}
          >
            <Info size={16} /> {showInsights ? "Hide Insights" : "Show PPT Insights"}
          </Button>
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

      {showInsights && (
        <ContentInsights period={periodText} />
      )}

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title={contentData.metrics.totalContentsIngested.toString()}
          value={`Contents Ingested ${periodText}`}
          icon={<FileText size={24} className="text-primary" />}
        />
        <MetricCard 
          title={contentData.metrics.totalQuestionsAnswered.toString()}
          value={`Questions Answered ${periodText}`}
          icon={<Search size={24} className="text-primary" />}
        />
        <MetricCard 
          title={contentData.metrics.totalContentsUsed.toString()}
          value={`Contents Used ${periodText}`}
          icon={<Book size={24} className="text-primary" />}
        />
        <MetricCard 
          title={contentData.metrics.unusedContents.toString()}
          value={`Unused Contents ${periodText}`}
          icon={<FileSearch size={24} className="text-primary" />}
        />
      </div>

      {/* Source Utilization Section */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Book size={20} className="text-primary" /> Source-wise Utilization
            </CardTitle>
            <CardDescription>Document sources and their utilization metrics</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
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
                    <TableCell className="font-medium flex items-center gap-2">
                      <Book size={16} className="text-muted-foreground" /> {source.source}
                    </TableCell>
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
        </CardContent>
      </Card>
      
      {/* Content Tables */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowUp size={20} className="text-primary" /> Top 10 Most Used Contents
            </CardTitle>
            <CardDescription>Contents that have been referred to answer questions most frequently</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Language size={14} /> Language
                    </div>
                  </TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead className="text-right">Questions</TableHead>
                  <TableHead className="text-right">Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentData.topUsedContents.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText size={16} className="text-muted-foreground" /> {content.name}
                    </TableCell>
                    <TableCell>{content.source}</TableCell>
                    <TableCell>{content.language}</TableCell>
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
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowUp size={20} className="text-primary rotate-180" /> Top Least Used Contents
            </CardTitle>
            <CardDescription>Contents that have been referred to answer questions least frequently</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Language size={14} /> Language
                    </div>
                  </TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead className="text-right">Questions</TableHead>
                  <TableHead className="text-right">Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contentData.leastUsedContents.map((content) => (
                  <TableRow key={content.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText size={16} className="text-muted-foreground" /> {content.name}
                    </TableCell>
                    <TableCell>{content.source}</TableCell>
                    <TableCell>{content.language}</TableCell>
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
    </div>
  );
};

export default Content;
