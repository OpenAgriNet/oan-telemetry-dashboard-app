import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ServerCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Rate, SnapshotState, formatLatency, formatNumber, providerMetrics, providerSlug, useServiceSnapshot } from "./serviceSnapshotShared";

const ServiceSnapshotProvider = () => {
  const { providerName: providerSlugParam } = useParams();
  const snapshotQuery = useServiceSnapshot();
  const provider = snapshotQuery.data?.data.providers.find((item) => providerSlug(item.name) === providerSlugParam);
  const providerName = provider?.name || "Provider";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
          <Link to="/service-snapshot"><ArrowLeft className="mr-2 h-4 w-4" />All providers</Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><ServerCog className="h-4 w-4" /> Service Performance / Provider</div>
            <h1 className="text-2xl font-bold tracking-tight">{providerName || "Provider"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Select a service to see its API-level health and latency.</p>
          </div>
        </div>
      </div>

      <SnapshotState
        isLoading={snapshotQuery.isLoading}
        isError={snapshotQuery.isError}
        warning={snapshotQuery.data?.warning}
        isEmpty={Boolean(snapshotQuery.data?.data.providers.length && !provider)}
      />

      {provider && (() => {
        const metrics = providerMetrics(provider);
        return (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/80"><CardHeader className="pb-2"><CardDescription>Observed services</CardDescription><CardTitle>{provider.services.length}</CardTitle></CardHeader></Card>
              <Card className="border-border/80"><CardHeader className="pb-2"><CardDescription>Service requests</CardDescription><CardTitle>{formatNumber(metrics.requests)}</CardTitle></CardHeader></Card>
              <Card className="border-border/80"><CardHeader className="pb-2"><CardDescription>Success rate</CardDescription><CardTitle><Rate value={metrics.successPercentage} /></CardTitle></CardHeader></Card>
              <Card className="border-border/80"><CardHeader className="pb-2"><CardDescription>API requests</CardDescription><CardTitle>{formatNumber(metrics.apiRequests)}</CardTitle></CardHeader></Card>
            </div>

            <Card className="border-border/80">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Services</CardTitle>
                <CardDescription>{provider.services.length} services available.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="min-w-[900px] table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[16%]">Service</TableHead>
                        <TableHead className="w-[28%]">What is the service</TableHead>
                        <TableHead className="w-[13%]">Service requests</TableHead>
                        <TableHead className="w-[10%]">Success %</TableHead>
                        <TableHead className="w-[10%]">P90 latency</TableHead>
                        <TableHead className="w-[7%]">APIs</TableHead>
                        <TableHead className="w-[16%] whitespace-nowrap text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {provider.services.map((service) => (
                        <TableRow key={service.key}>
                          <TableCell className="font-semibold">{service.name}</TableCell>
                          <TableCell className="text-muted-foreground">{service.description}</TableCell>
                          <TableCell className="font-semibold">{formatNumber(service.metrics.requests)}</TableCell>
                          <TableCell><Rate value={service.metrics.successPercentage} /></TableCell>
                          <TableCell className="whitespace-nowrap font-medium">{formatLatency(service.metrics.p90LatencyMs)}</TableCell>
                          <TableCell><Badge variant="secondary">{service.apis.length}</Badge></TableCell>
                          <TableCell className="whitespace-nowrap text-right">
                            <Link
                              to={`/service-snapshot/provider/${providerSlug(provider.name)}/service/${encodeURIComponent(service.key)}`}
                              className="inline-flex text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >View APIs</Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        );
      })()}
    </div>
  );
};

export default ServiceSnapshotProvider;
