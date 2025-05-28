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

interface TrendChartProps {
title: string;
description?: string;
data: Record<string, unknown>[];
dataKey: string;
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
// Format timestamp for hourly data if needed
const formatXAxis = (tickItem: string | number) => {
  if (tickItem === null || tickItem === undefined) return "";

  try {
    // Convert to string if it's a number
    const tickStr = String(tickItem);
    
    // If it's a number (hour), format it as hour display
    if (typeof tickItem === 'number' || /^\d+$/.test(tickStr)) {
      const hour = parseInt(tickStr);
      return `${hour}:00`;
    }
    
    // Check if this is a timestamp (hourly data) with date string
    if (tickStr.includes('T') || tickStr.includes(' ')) {
      // This is likely an ISO timestamp or has hour information
      const date = new Date(tickStr);
      return `${date.getHours()}:00`;
    }
    
    return tickStr;
  } catch (error) {
    console.error('Error formatting X axis tick:', error, tickItem);
    return String(tickItem);
  }
};

// Custom tooltip formatter to show timestamps and values
const CustomTooltip = ({ active, payload, label }: { 
  active?: boolean; 
  payload?: Array<{ 
    payload: Record<string, unknown>; 
    value: unknown; 
    name?: string; 
    color?: string; 
  }>; 
  label?: string | number; 
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    
    // Format the label based on the data type
    let formattedLabel = String(label);
    let timestampInfo = '';
    
    try {
      // Check if we have timestamp data
      if (data.timestamp) {
        const date = new Date(parseInt(String(data.timestamp)));
        timestampInfo = date.toLocaleString();
      } else if (data.date) {
        // Try to parse the date string
        const dateStr = String(data.date);
        if (dateStr.includes('T') || dateStr.includes(' ')) {
          const date = new Date(dateStr);
          timestampInfo = date.toLocaleString();
        } else {
          timestampInfo = dateStr;
        }
      }
      
      // For hourly data, show the hour more clearly
      if (xAxisKey === 'hour' && typeof label === 'number') {
        formattedLabel = `Hour ${label}:00`;
        // If we have a date context, add it
        if (data.date && !String(data.date).includes('Hour')) {
          const baseDate = new Date(String(data.date));
          baseDate.setHours(label, 0, 0, 0);
          timestampInfo = baseDate.toLocaleString();
        }
      }
    } catch (error) {
      console.warn('Error formatting tooltip timestamp:', error);
    }
    
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{formattedLabel}</p>
        {timestampInfo && (
          <p className="text-sm text-muted-foreground mb-2">{timestampInfo}</p>
        )}
        {payload.map((entry, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name || dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Add console logs for debugging
console.log('TrendChart data:', data);
console.log('xAxisKey:', xAxisKey);
console.log('dataKey:', dataKey);

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
<Bar
dataKey={dataKey}
fill={color}
radius={[4, 4, 0, 0]}
/>
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
<Area
type="monotone"
dataKey={dataKey}
stroke={color}
fill={`${color}33`}
/>
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
<Line
type="monotone"
dataKey={dataKey}
stroke={color}
strokeWidth={2}
dot={{ r: 4 }}
activeDot={{ r: 6 }}
/>
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