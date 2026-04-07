import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ChevronRight,
  RefreshCw,
  TreePine,
} from "lucide-react";
import ReactFlow, {
  Background,
  Controls,
  type Edge,
  type Node,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { buildDateRangeParams } from "@/lib/utils";
import {
  fetchLangfuseQuestionsTree,
  type LangfuseQuestionTreeDay,
  type LangfuseCategoryNode,
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
  const [openDayKey, setOpenDayKey] = useState<string | null>(null);

  const toggleDay = (key: string) => {
    setOpenDayKey((current) => (current === key ? null : key));
  };

  const { data = [], isLoading, error, refetch, isFetching } = useQuery({
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
    enabled: !!dateRange.from && !!dateRange.to,
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
      { total: 0, agri: 0, nonAgri: 0 },
    );
  }, [data]);

  const buildFlowForDay = (
    day: LangfuseQuestionTreeDay,
    dayKey: string,
  ): { nodes: Node[]; edges: Edge[] } => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const levelGapX = 260;
    const levelGapY = 110;

    // ROOT
    const rootId = `${dayKey}-root`;
    nodes.push({
      id: rootId,
      position: { x: 0, y: 0 },
      // data: { label: formatDay(day.reportDate) },
      // data: { label: `Total Questions (${day.totalQuestions})` },
      data: {
        label: (
          <div className="hover-node">
            Total Questions ({day.totalQuestions})
          </div>
        ),
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      style: {
        padding: "8px 18px",
        borderRadius: 999,
        border: "1px solid hsl(var(--border))",
        background: "hsl(var(--background))",
        fontWeight: 700,
        color: "#fff",
        whiteSpace: "normal",
        wordBreak: "break-word",
        maxWidth: "180px",
        textAlign: "center",
        width: "fit-content",
        minWidth: "80px",
      },
    });

    // LEVEL 1
    const agriId = `${dayKey}-agri`;
    const nonAgriId = `${dayKey}-nonagri`;

    nodes.push(
      {
        id: agriId,
        position: { x: levelGapX, y: -70 },
        data: { label: `Agri Related Questions (${day.questionsAgri})` },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          padding: "8px 16px",
          borderRadius: 999,
          border: "1px solid rgba(16,185,129,0.7)",
          background: "rgba(15,23,42,0.95)",
          color: "#fff",
          whiteSpace: "normal",
          wordBreak: "break-word",
          maxWidth: "180px",
          textAlign: "center",
          width: "fit-content",
          minWidth: "80px",
        },
      },
      {
        id: nonAgriId,
        position: { x: levelGapX, y: 70 },
        data: { label: `Non-Agri Related Questions (${day.questionsNonAgri})` },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          padding: "8px 16px",
          borderRadius: 999,
          border: "1px solid rgba(59,130,246,0.7)",
          background: "rgba(15,23,42,0.95)",
          color: "#fff",
          whiteSpace: "normal",
          wordBreak: "break-word",
          maxWidth: "180px",
          textAlign: "center",
          width: "fit-content",
          minWidth: "80px",
        },
      },
    );

    edges.push(
      { id: `${rootId}-a`, source: rootId, target: agriId },
      { id: `${rootId}-n`, source: rootId, target: nonAgriId },
    );

    const addBranch = (
      parentId: string,
      categories: LangfuseCategoryNode[],
      startY: number,
    ) => {
      // categories.forEach((cat, i) => {
      //   const catId = `${parentId}-cat-${i}`;
      //   const y = startY + i * levelGapY;

      let currentY = startY;

      categories.forEach((cat, i) => {
        const catId = `${parentId}-cat-${i}`;

        const toolCount = cat.tools?.length || 0;

        // height needed for this category block
        const blockHeight = Math.max(levelGapY, toolCount * 65);

        const y = currentY;

        currentY += blockHeight; // 👈 KEY FIX (accumulating)

        // CATEGORY
        nodes.push({
          id: catId,
          position: { x: levelGapX * 2, y },
          data: {
            label: `${formatLabel(cat.categoryKey)} (${cat.count})`,
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          style: {
            padding: "6px 12px",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.7)",
            background: "rgba(15,23,42,0.9)",
            color: "#fff",
            whiteSpace: "normal",
            wordBreak: "break-word",
            maxWidth: "180px",
            textAlign: "center",
            width: "fit-content",
            minWidth: "80px",
          },
        });

        edges.push({
          id: `${parentId}-${catId}`,
          source: parentId,
          target: catId,
        });

        // TOOLS
        (cat.tools || []).forEach((tool, tIndex) => {
          const toolId = `${catId}-tool-${tIndex}`;

          nodes.push({
            id: toolId,
            position: {
              x: levelGapX * 3,
              y: y + tIndex * 65,
            },
            data: {
              label: `${tool.toolName} (${tool.count})`,
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            style: {
              padding: "5px 10px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.6)",
              background: "rgba(15,23,42,0.85)",
              fontSize: "10px",
              color: "#fff",
              whiteSpace: "normal",
              wordBreak: "break-word",
              maxWidth: "180px",
              textAlign: "center",
              width: "fit-content",
              minWidth: "80px",
            },
          });

          edges.push({
            id: `${catId}-${toolId}`,
            source: catId,
            target: toolId,
          });
        });
      });
    };

    addBranch(agriId, day.agri.categories, -200);
    addBranch(nonAgriId, day.nonAgri.categories, 200);

    return { nodes, edges };
  };

  const renderDayNode = (day: LangfuseQuestionTreeDay) => {
    const key = `day:${day.reportDate}`;
    const open = openDayKey === key;
    const { nodes, edges } = buildFlowForDay(day, key);

    return (
      <div key={key} className="border rounded-xl overflow-hidden">
        <button
          className="w-full flex justify-between p-3"
          onClick={() => toggleDay(key)}
        >
          <div className="flex items-center gap-2">
            <ChevronRight className={open ? "rotate-90" : ""} />
            {formatDay(day.reportDate)}
          </div>
        </button>

        {open && (
          <div className="h-[600px] w-full overflow-x-auto">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              nodesDraggable={false}
              zoomOnScroll={true}
              panOnDrag={true}
              proOptions={{ hideAttribution: true }}
            >
              <Controls position="top-right" showInteractive={false} />
              <Background gap={20} size={1} />
            </ReactFlow>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* <div className="flex justify-between">
        <h1 className="text-xl font-bold">Langfuse Toolcall</h1>
        <Button onClick={refetch} disabled={isFetching}>
          <RefreshCw className={isFetching ? "animate-spin" : ""} /> */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Langfuse Toolcall</h1>
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
            <CardTitle className="text-sm font-medium">
              Total Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {totals.total}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Agri Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {totals.agri}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Non-Agri Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {totals.nonAgri}
          </CardContent>
        </Card>
      </div>


      {isLoading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error</div>
      ) : (
        data.map(renderDayNode)
      )}
    </div>
  );
};

export default LangfuseQuestions;