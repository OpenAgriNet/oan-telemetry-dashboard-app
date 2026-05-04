import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppWindowMac, Smartphone } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useTelemetryState } from "@/contexts/TelemetryStateContext";
import { buildDateRangeParams, formatUTCToIST } from "@/lib/utils";
import { fetchAppDownloads } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TablePagination from "@/components/TablePagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DailyDownloadsRow = {
  date: string;
  androidInstalls: number;
  androidVersions: string[];
  iosInstalls: number;
  iosVersions: string[];
  totalInstalls: number;
  lastUpdated: string | null;
};

const formatDateRangeLabel = (from?: Date, to?: Date) => {
  if (!from && !to) {
    return "Selected range";
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });

  if (from && to) {
    return `${formatter.format(from)} - ${formatter.format(to)}`;
  }

  return formatter.format(from || to || new Date());
};

const AppDownloads = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { dateRange } = useDateFilter();
  const { selectedStateId } = useTelemetryState();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 10;

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
  };

  const { data = [], isLoading, error } = useQuery({
    queryKey: [
      "app-downloads",
      selectedStateId,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    enabled:
      selectedStateId === "bharat-vistaar" &&
      dateRange.from !== undefined &&
      dateRange.to !== undefined,
    queryFn: () => {
      const params = buildDateRangeParams(dateRange, {
        includeDefaultStart: false,
      });
      return fetchAppDownloads(params);
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const groupedData = useMemo<DailyDownloadsRow[]>(() => {
    const grouped = new Map<string, DailyDownloadsRow>();

    data.forEach((item) => {
      const row = grouped.get(item.date) || {
        date: item.date,
        androidInstalls: 0,
        androidVersions: [],
        iosInstalls: 0,
        iosVersions: [],
        totalInstalls: 0,
        lastUpdated: null,
      };

      if (item.platform === "android") {
        row.androidInstalls += item.installs;
        if (!row.androidVersions.includes(item.version)) {
          row.androidVersions.push(item.version);
        }
      } else {
        row.iosInstalls += item.installs;
        if (!row.iosVersions.includes(item.version)) {
          row.iosVersions.push(item.version);
        }
      }

      row.totalInstalls += item.installs;
      if (!row.lastUpdated || new Date(item.updatedAt) > new Date(row.lastUpdated)) {
        row.lastUpdated = item.updatedAt;
      }

      grouped.set(item.date, row);
    });

    return Array.from(grouped.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [data]);

  const summary = useMemo(() => {
    const androidInstalls = groupedData.reduce(
      (sum, row) => sum + row.androidInstalls,
      0,
    );
    const iosInstalls = groupedData.reduce((sum, row) => sum + row.iosInstalls, 0);
    const totalInstalls = androidInstalls + iosInstalls;

    return {
      androidInstalls,
      iosInstalls,
      totalInstalls,
      androidPercent: totalInstalls
        ? Math.round((androidInstalls / totalInstalls) * 100)
        : 0,
      iosPercent: totalInstalls ? Math.round((iosInstalls / totalInstalls) * 100) : 0,
    };
  }, [groupedData]);

  const rangeLabel = formatDateRangeLabel(dateRange.from, dateRange.to);
  const totalPages = Math.max(1, Math.ceil(groupedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return groupedData.slice(startIndex, startIndex + pageSize);
  }, [groupedData, page, pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {/* <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Download size={18} />
        </div> */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">App Install Metrics</h1>
          <p className="text-sm text-muted-foreground">
              Daily app installs by platform and version
          </p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Loading app downloads...
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-destructive">
            Unable to load app downloads right now.
          </CardContent>
        </Card>
      ) : groupedData.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No app download data available for the selected date range.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base uppercase tracking-wide text-muted-foreground">
                  Total Installs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {summary.totalInstalls.toLocaleString()}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{rangeLabel}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide text-muted-foreground">
                  <Smartphone size={16} />
                  Android
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {summary.androidInstalls.toLocaleString()}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {summary.androidPercent}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base uppercase tracking-wide text-muted-foreground">
                  <AppWindowMac size={16} />
                  iOS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {summary.iosInstalls.toLocaleString()}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {summary.iosPercent}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Platform & Version Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Android</TableHead>
                      <TableHead>iOS</TableHead>
                      <TableHead className="text-right">Total Installs</TableHead>
                      <TableHead className="text-right">Updated At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="font-medium">{row.date}</TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {row.androidInstalls.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {row.androidVersions.length > 0
                              ? `v${row.androidVersions.join(" + v")}`
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {row.iosInstalls.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {row.iosVersions.length > 0
                              ? `v${row.iosVersions.join(" + v")}`
                              : "-"}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {row.totalInstalls.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {row.lastUpdated
                            ? formatUTCToIST(row.lastUpdated, "MMM dd, yyyy hh:mm a")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex justify-end">
                <TablePagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AppDownloads;
