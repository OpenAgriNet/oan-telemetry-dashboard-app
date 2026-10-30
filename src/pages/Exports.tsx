import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  downloadExport,
  fetchExports,
  type ExportRecord,
  type ExportStatus,
} from "@/services/api";
import { formatUTCToIST } from "@/lib/utils";
import { useTelemetryState } from "@/contexts/TelemetryStateContext";

const MODULE_LABELS: Record<string, string> = {
  questions: "Questions",
  feedback: "Feedback",
  notifications: "Notifications",
  asr: "ASR",
  tts: "TTS",
  "call-logs": "Call Logs",
};

function getStatusVariant(
  status: ExportStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED":
      return "secondary";
    case "FAILED":
      return "destructive";
    default:
      return "outline";
  }
}

function formatTimestamp(value?: string | null) {
  if (!value) return "-";
  return formatUTCToIST(value);
}

function formatDateRange(record: ExportRecord) {
  if (record.fromDate && record.toDate) {
    return `${record.fromDate} to ${record.toDate}`;
  }
  return "-";
}

const Exports = () => {
  const { selectedStateId } = useTelemetryState();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["exports", selectedStateId],
    queryFn: fetchExports,
    refetchInterval: (query) => {
      const exports = query.state.data || [];
      const hasProcessing = exports.some(
        (item) => item.exportStatus === "PROCESSING",
      );
      return hasProcessing ? 5000 : false;
    },
  });

  const exports = useMemo(() => data || [], [data]);

  const handleDownload = async (exportId: string, fileName?: string | null) => {
    try {
      await downloadExport(exportId, fileName || `export-${exportId}.csv`);
      toast.success("CSV downloaded successfully");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to download export";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and download your CSV export requests.
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
          variant="outline"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading exports...
            </div>
          ) : exports.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No export requests found. Use Download CSV on any supported module
              to start an export.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Exported By</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Requested Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completed Time</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exports.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {record.telemetryStateLabel || record.telemetryState || "-"}
                      </TableCell>
                      <TableCell>
                        {MODULE_LABELS[record.moduleName] || record.moduleName}
                      </TableCell>
                      <TableCell>
                        {record.exportedBy || record.username || "-"}
                      </TableCell>
                      <TableCell>{formatDateRange(record)}</TableCell>
                      <TableCell>{formatTimestamp(record.requestedAt)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(record.exportStatus)}>
                          {record.exportStatus}
                        </Badge>
                        {record.exportStatus === "FAILED" && record.errorMessage ? (
                          <p className="text-xs text-destructive mt-1 max-w-xs truncate">
                            {record.errorMessage}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>{formatTimestamp(record.completedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={record.exportStatus !== "COMPLETED"}
                          onClick={() =>
                            handleDownload(record.id, record.fileName)
                          }
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
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

export default Exports;
