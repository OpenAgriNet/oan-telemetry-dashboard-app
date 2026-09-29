import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Braces, ServerCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Rate, SnapshotState, findService, formatLatency, formatNumber, providerSlug, useServiceSnapshot } from "./serviceSnapshotShared";

const ServiceSnapshotDetail = () => {
  const { providerName: providerSlugParam, serviceKey: serviceKeyParam } = useParams();
  const serviceKey = serviceKeyParam ? decodeURIComponent(serviceKeyParam) : "";
  const snapshotQuery = useServiceSnapshot();
  const provider = snapshotQuery.data?.data.providers.find((item) => providerSlug(item.name) === providerSlugParam);
  const providerName = provider?.name || "Provider";
  const service = findService(provider, serviceKey);
  const providerPath = `/service-snapshot/provider/${provider ? providerSlug(provider.name) : providerSlugParam || ""}`;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
          <Link to={providerPath}><ArrowLeft className="mr-2 h-4 w-4" />{providerName || "Provider services"}</Link>
        </Button>
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground"><ServerCog className="h-4 w-4" /> Service Performance / {providerName} / Service</div>
          <h1 className="text-2xl font-bold tracking-tight">{service?.name || "Service"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{service?.description || "API-level reliability and latency."}</p>
        </div>
      </div>

      <SnapshotState
        isLoading={snapshotQuery.isLoading}
        isError={snapshotQuery.isError}
        warning={snapshotQuery.data?.warning}
        isEmpty={Boolean(snapshotQuery.data?.data.providers.length && !service)}
      />

      {service && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/80"><CardHeader className="pb-2"><CardDescription>Service requests</CardDescription><CardTitle>{formatNumber(service.metrics.requests)}</CardTitle></CardHeader></Card>
            <Card className="border-border/80"><CardHeader className="pb-2"><CardDescription>Success rate</CardDescription><CardTitle><Rate value={service.metrics.successPercentage} /></CardTitle></CardHeader></Card>
            <Card className="border-border/80"><CardHeader className="pb-2"><CardDescription>P90 latency</CardDescription><CardTitle>{formatLatency(service.metrics.p90LatencyMs)}</CardTitle></CardHeader></Card>
            <Card className="border-border/80"><CardHeader className="pb-2"><CardDescription>Max latency</CardDescription><CardTitle>{formatLatency(service.metrics.maxLatencyMs)}</CardTitle></CardHeader></Card>
          </div>

          <Card className="border-border/80">
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"><Braces className="h-4 w-4" /></div>
                <div>
                  <CardTitle className="text-lg">APIs</CardTitle>
                  <CardDescription>{service.apis.length} observed {service.apis.length === 1 ? "API" : "APIs"}. API requests can include retries.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[210px]">API</TableHead>
                      <TableHead className="min-w-[270px]">Endpoint</TableHead>
                      <TableHead>Requests</TableHead>
                      <TableHead>Success %</TableHead>
                      <TableHead>Failure %</TableHead>
                      <TableHead>P90 latency</TableHead>
                      <TableHead>Max latency</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {service.apis.map((api) => (
                      <TableRow key={api.key}>
                        <TableCell>
                          <div className="font-medium">{api.name}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{api.description}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{api.kind === "direct" ? "Direct API" : "Provider operation"}</Badge>
                            <code className="break-all text-xs text-muted-foreground">{api.method || "Not captured"} {api.endpoint || "Not captured"}</code>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">{formatNumber(api.metrics.requests)}</TableCell>
                        <TableCell><Rate value={api.metrics.successPercentage} /></TableCell>
                        <TableCell><Rate value={api.metrics.failurePercentage} kind="failure" /></TableCell>
                        <TableCell className="whitespace-nowrap font-medium">{formatLatency(api.metrics.p90LatencyMs)}</TableCell>
                        <TableCell className="whitespace-nowrap font-medium">{formatLatency(api.metrics.maxLatencyMs)}</TableCell>
                        <TableCell className="text-right">
                          {api.endpoint && api.sourceService ? (
                            <Link
                              to={`/service-snapshot/provider/${providerSlug(provider.name)}/service/${encodeURIComponent(service.key)}/api/${encodeURIComponent(api.key)}`}
                              className="inline-flex whitespace-nowrap items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              View individual API <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          ) : <span className="text-sm text-muted-foreground">Unavailable</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ServiceSnapshotDetail;
