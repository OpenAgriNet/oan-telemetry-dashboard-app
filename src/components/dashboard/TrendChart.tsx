import React from "react";
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from "@/components/ui/card";
import {
Area,
AreaChart,
Bar,
BarChart,
Line,
LineChart,
ResponsiveContainer,
Tooltip,
XAxis,
YAxis,
} from "recharts";
import { formatChartXAxisToIST, formatChartTooltipToIST } from "@/lib/utils";

interface DataSeriesConfig {
  dataKey: string;
  color?: string;
  name?: string;
  strokeDasharray?: string;
  fillOpacity?: number;
}

interface TrendChartProps {
title: string;
description?: string;
data: Record<string, unknown>[];
dataKey: string | DataSeriesConfig[]; // Support both single and multiple series
type?: "line" | "bar" | "area";
color?: string;
xAxisKey?: string;
}

const TrendChart: React.FC<TrendChartProps> = ({
title,
description,
data,
dataKey,
type = "line",
color = "var(--primary)",
xAxisKey = "date",
}) => {
// Determine if we're dealing with multiple series
const isMultipleSeries = Array.isArray(dataKey);
const seriesConfig: DataSeriesConfig[] = isMultipleSeries 
  ? dataKey as DataSeriesConfig[]
  : [{ dataKey: dataKey as string, color, name: dataKey as string }];

// Format timestamp for hourly data if needed - now using IST
const formatXAxis = (tickItem: string | number) => {
  const isHourly = xAxisKey === 'hour';
  return formatChartXAxisToIST(tickItem, isHourly);
};

// Custom tooltip formatter to show timestamps and values in IST
const CustomTooltip = ({ active, payload, label }: { 
  active?: boolean; 
  payload?: Array<{ 
    payload: Record<string, unknown>; 
    value: unknown; 
    name?: string; 
    color?: string; 
    dataKey?: string;
  }>; 
  label?: string | number; 
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isHourly = xAxisKey === 'hour';
    
    // Use the IST formatting utility
    const { formattedLabel, timestampInfo } = formatChartTooltipToIST(data, label, isHourly);
    
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{formattedLabel}</p>
        {timestampInfo && (
          <p className="text-sm text-muted-foreground mb-2">{timestampInfo} (IST)</p>
        )}
        {payload.map((entry, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name || entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};



  // Check if we have data to display
  const hasData = data && data.length > 0;
  
const renderChart = () => {
    if (!hasData) {
      return (
        <div className="flex items-center justify-center h-60 text-muted-foreground">
          No data available for selected time period
        </div>
      );
    }
    
switch (type) {
case "bar":
return (
<ResponsiveContainer width="100%" height={350}>
<BarChart data={data}>
<XAxis
dataKey={xAxisKey}
stroke="#888888"
fontSize={12}
tickLine={false}
axisLine={false}
tickFormatter={formatXAxis}
interval="preserveStartEnd"
/>
<YAxis
stroke="#888888"
fontSize={12}
tickLine={false}
axisLine={false}
tickFormatter={(value) => `${value}`}
/>
<Tooltip content={<CustomTooltip />} />
{seriesConfig.map((series, index) => (
<Bar
key={series.dataKey}
dataKey={series.dataKey}
fill={series.color || `hsl(${index * 60}, 70%, 50%)`}
fillOpacity={series.fillOpacity !== undefined ? series.fillOpacity : 1}
radius={[4, 4, 0, 0]}
name={series.name || series.dataKey}
/>
))}
</BarChart>
</ResponsiveContainer>
);
case "area":
return (
<ResponsiveContainer width="100%" height={350}>
<AreaChart data={data}>
<XAxis
dataKey={xAxisKey}
stroke="#888888"
fontSize={12}
tickLine={false}
axisLine={false}
tickFormatter={formatXAxis}
interval="preserveStartEnd"
/>
<YAxis
stroke="#888888"
fontSize={12}
tickLine={false}
axisLine={false}
tickFormatter={(value) => `${value}`}
/>
<Tooltip content={<CustomTooltip />} />
{seriesConfig.map((series, index) => (
<Area
key={series.dataKey}
type="monotone"
dataKey={series.dataKey}
stroke={series.color || `hsl(${index * 60}, 70%, 50%)`}
strokeDasharray={series.strokeDasharray}
fill={`${series.color || `hsl(${index * 60}, 70%, 50%)`}33`}
fillOpacity={series.fillOpacity !== undefined ? series.fillOpacity : 0.2}
name={series.name || series.dataKey}
/>
))}
</AreaChart>
</ResponsiveContainer>
);
case "line":
default:
return (
<ResponsiveContainer width="100%" height={350}>
<LineChart data={data}>
<XAxis
dataKey={xAxisKey}
stroke="#888888"
fontSize={12}
tickLine={false}
axisLine={false}
tickFormatter={formatXAxis}
interval="preserveStartEnd"
/>
<YAxis
stroke="#888888"
fontSize={12}
tickLine={false}
axisLine={false}
tickFormatter={(value) => `${value}`}
/>
<Tooltip content={<CustomTooltip />} />
{seriesConfig.map((series, index) => (
<Line
key={series.dataKey}
type="monotone"
dataKey={series.dataKey}
stroke={series.color || `hsl(${index * 60}, 70%, 50%)`}
strokeWidth={2}
strokeDasharray={series.strokeDasharray}
dot={{ r: 4 }}
activeDot={{ r: 6 }}
name={series.name || series.dataKey}
/>
))}
</LineChart>
</ResponsiveContainer>
);
}
};

return (
<Card className="card-gradient">
<CardHeader>
<CardTitle>{title}</CardTitle>
{description && <CardDescription>{description}</CardDescription>}
</CardHeader>
<CardContent>{renderChart()}</CardContent>
</Card>
);
};

export default TrendChart;