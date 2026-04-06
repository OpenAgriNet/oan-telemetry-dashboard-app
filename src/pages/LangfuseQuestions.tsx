import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronRight, RefreshCw, TreePine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { buildDateRangeParams } from "@/lib/utils";
import {
  fetchLangfuseQuestionsTree,
  type LangfuseCategoryNode,
  type LangfuseQuestionTreeDay,
} from "@/services/api";

const formatLabel = (value: string): string =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");

const formatDay = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const LangfuseQuestions = () => {
  const { dateRange } = useDateFilter();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleNode = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const {
    data = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: [
      "langfuse-questions-tree",
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    queryFn: async () => {
      const dateParams = buildDateRangeParams(dateRange);
      return fetchLangfuseQuestionsTree({
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      });
    },
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const totalDays = data.length;
  const totals = useMemo(() => {
    return data.reduce(
      (acc, day) => {
        acc.total += day.totalQuestions;
        acc.agri += day.questionsAgri;
        acc.nonAgri += day.questionsNonAgri;
        return acc;
      },
      { total: 0, agri: 0, nonAgri: 0 }
    );
  }, [data]);

  const renderCategoryTree = (
    categories: LangfuseCategoryNode[],
    parentKey: string
  ) => {
    if (!categories.length) {
      return (
        <div className="ml-8 text-sm text-muted-foreground py-1">
          No category/tool mapping available.
        </div>
      );
    }

    return categories.map((category) => {
      const categoryKey = `${parentKey}:category:${category.categoryKey}`;
      const isCategoryOpen = !!expanded[categoryKey];
      return (
        <div key={categoryKey} className="ml-4">
          <button
            type="button"
            className="flex items-center gap-2 py-1 text-sm hover:text-primary"
            onClick={() => toggleNode(categoryKey)}
          >
            <ChevronRight
              className={`h-4 w-4 transition-transform ${isCategoryOpen ? "rotate-90" : ""}`}
            />
            <span className="font-medium">{formatLabel(category.categoryKey)}</span>
            <span className="text-muted-foreground">({category.count})</span>
          </button>

          {isCategoryOpen && (
            <div className="ml-8 py-1 space-y-1">
              {category.tools.length ? (
                category.tools.map((tool) => (
                  <div
                    key={`${categoryKey}:tool:${tool.toolName}`}
                    className="text-sm text-muted-foreground"
                  >
                    {tool.toolName}: <span className="font-medium">{tool.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">No tool calls found.</div>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  const renderDayNode = (day: LangfuseQuestionTreeDay) => {
    const dayKey = `day:${day.reportDate}`;
    const agriKey = `${dayKey}:agri`;
    const nonAgriKey = `${dayKey}:non-agri`;
    const isDayOpen = !!expanded[dayKey];
    const isAgriOpen = !!expanded[agriKey];
    const isNonAgriOpen = !!expanded[nonAgriKey];

    return (
      <div key={dayKey} className="border rounded-lg p-3">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 text-left"
          onClick={() => toggleNode(dayKey)}
        >
          <div className="flex items-center gap-2">
            <ChevronRight
              className={`h-4 w-4 transition-transform ${isDayOpen ? "rotate-90" : ""}`}
            />
            <span className="font-semibold">{formatDay(day.reportDate)}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: <span className="font-medium text-foreground">{day.totalQuestions}</span>
          </div>
        </button>

        {isDayOpen && (
          <div className="mt-3 space-y-2">
            <div className="text-sm text-muted-foreground">
              Agri: <span className="font-medium text-foreground">{day.questionsAgri}</span> | Non-Agri:{" "}
              <span className="font-medium text-foreground">{day.questionsNonAgri}</span>
            </div>

            <div className="ml-2">
              <button
                type="button"
                className="flex items-center gap-2 py-1 text-sm hover:text-primary"
                onClick={() => toggleNode(agriKey)}
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${isAgriOpen ? "rotate-90" : ""}`}
                />
                <span className="font-medium">Agri Questions</span>
                <span className="text-muted-foreground">({day.questionsAgri})</span>
              </button>
              {isAgriOpen && renderCategoryTree(day.agri.categories, agriKey)}
            </div>

            <div className="ml-2">
              <button
                type="button"
                className="flex items-center gap-2 py-1 text-sm hover:text-primary"
                onClick={() => toggleNode(nonAgriKey)}
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${isNonAgriOpen ? "rotate-90" : ""}`}
                />
                <span className="font-medium">Non-Agri Questions</span>
                <span className="text-muted-foreground">({day.questionsNonAgri})</span>
              </button>
              {isNonAgriOpen && renderCategoryTree(day.nonAgri.categories, nonAgriKey)}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Langfuse Questions</h1>
        <Button onClick={() => refetch()} variant="outline" disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Days</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalDays}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totals.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Agri Questions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totals.agri}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Non-Agri Questions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totals.nonAgri}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            Category and Tool Call Tree
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading Langfuse question tree...</div>
          ) : error ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>
                {error instanceof Error
                  ? error.message
                  : "No data fetched due to an error."}
              </span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No Langfuse data found for the selected date range.
            </div>
          ) : (
            <div className="space-y-3">{data.map(renderDayNode)}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LangfuseQuestions;
