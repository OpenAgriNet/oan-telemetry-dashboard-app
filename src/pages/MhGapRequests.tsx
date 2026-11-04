import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import TablePagination from "@/components/TablePagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { useScopedPage } from "@/hooks/useScopedPage";
import { buildDateRangeParams } from "@/lib/utils";
import { useMhGap, useMhGapCalls } from "./mhGapShared";
import { formatNumber, SnapshotState } from "./serviceSnapshotShared";

const MhGapRequests = () => {
  const { serviceKey = "" } = useParams();
  const location = useLocation();
  const { dateRange } = useDateFilter();
  const params = useMemo(() => buildDateRangeParams(dateRange, { includeDefaultStart: false }), [dateRange]);
  const [page, setPage] = useScopedPage(JSON.stringify([params.startDate, params.endDate, serviceKey]));
  const gap = useMhGap();
  const calls = useMhGapCalls(serviceKey, page);
  const service = gap.data?.services.find(item => item.key === serviceKey);
  const data = calls.data?.data;
  const pagination = calls.data?.pagination;
  const returnTo = `${location.pathname}${location.search}`;

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3 text-muted-foreground">
          <Link to="/service-snapshot/provider/mh-vistaar"><ArrowLeft className="mr-2 h-4 w-4" />MH Vistaar services</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{service?.name || "Service"} · Chatbot requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Requests sent by the chatbot to BAP during the telemetry gap, within the selected date range. Open a request to see its captured payload and response.</p>
      </div>

      <SnapshotState isLoading={calls.isLoading} isError={calls.isError} />

      {data && (
        <>
          <p className="text-sm text-muted-foreground">{formatNumber(pagination?.total || 0)} chatbot requests</p>
          {data.calls.length ? (
            <Card className="border-border/80">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Chatbot request</TableHead><TableHead>Captured at</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.calls.map(call => (
                      <TableRow key={call.id}>
                        <TableCell><code className="break-all text-xs">{call.method || "CALL"} {call.endpoint}</code></TableCell>
                        <TableCell className="whitespace-nowrap">{call.event_time ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(call.event_time)) : "—"}</TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/individual-apis/${call.id}?returnTo=${encodeURIComponent(returnTo)}`}>View payload &amp; response</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : <Card><CardContent className="py-12 text-center text-muted-foreground">No chatbot requests for this service in the selected date range.</CardContent></Card>}
          {pagination && pagination.totalPages > 1 && <TablePagination currentPage={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />}
        </>
      )}
    </div>
  );
};

export default MhGapRequests;
