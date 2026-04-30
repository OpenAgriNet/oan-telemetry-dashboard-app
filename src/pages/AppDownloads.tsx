import { useQuery } from "@tanstack/react-query";
import { Download, Smartphone } from "lucide-react";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useTelemetryState } from "@/contexts/TelemetryStateContext";
import { buildDateRangeParams } from "@/lib/utils";
import { fetchAppDownloads } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AppDownloads = () => {
  const { dateRange } = useDateFilter();
  const { selectedStateId } = useTelemetryState();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Download size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">App Downloads</h1>
          <p className="text-sm text-muted-foreground">
            Daily installs for Bharat Vistaar across iOS and Android.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone size={18} />
            Daily Install Counts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading app downloads...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-destructive">
              Unable to load app downloads right now.
            </div>
          ) : data.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No app download data available for the selected date range.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead className="text-right">Installs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => (
                    <TableRow key={`${row.date}-${row.platform}-${row.version}`}>
                      <TableCell className="font-medium">{row.date}</TableCell>
                      <TableCell className="capitalize">{row.platform}</TableCell>
                      <TableCell>{row.version}</TableCell>
                      <TableCell className="text-right">
                        {row.installs.toLocaleString()}
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

export default AppDownloads;
