import { Link } from "react-router-dom";
import { useMhGap } from "./mhGapShared";
import { ArrowUpRight, Network, ServerCog } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Rate, SnapshotState, formatNumber, providerMetrics, providerSlug, useServiceSnapshot } from "./serviceSnapshotShared";

const ServiceSnapshot = () => {
  const snapshotQuery = useServiceSnapshot();
  const snapshot = snapshotQuery.data?.data;
  const gap = useMhGap();
  const gapCount = gap.data?.totals.mappedCandidateCalls || 0;
  const providers = snapshot ? [...snapshot.providers] : [];
  if (gapCount && !providers.some(p => providerSlug(p.name) === "mh-vistaar")) {
    providers.push({ name: "MH Vistaar", services: [] });
  }
  const mhExistingKeys = new Set(providers.find(p => providerSlug(p.name) === "mh-vistaar")?.services.map(s => s.key) || []);
  const extraServices = gap.data?.services.filter(s => !mhExistingKeys.has(s.key)).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <ServerCog className="h-6 w-6 text-primary" /> Service Performance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a provider to explore its services and API health.
          </p>
        </div>
        <Link
          to="/individual-apis"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-primary/35 bg-primary/5 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Network className="h-4 w-4" /> Individual APIs <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {gapCount > 0 && <p className="text-sm text-muted-foreground">MH request totals include reconstructed BAP calls for 2–4 November 2026.</p>}
      {gap.isError && <p role="alert" className="text-sm text-destructive">MH historical reconstruction could not be loaded; provider counts exclude reconstructed calls.</p>}
      <SnapshotState
        isLoading={snapshotQuery.isLoading}
        isError={snapshotQuery.isError}
        warning={snapshotQuery.data?.warning}
        isEmpty={Boolean(snapshot && !providers.length && !gap.isLoading)}
      />

      {snapshot && providers.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/80"><CardHeader className="pb-2"><CardDescription>Providers</CardDescription><CardTitle>{providers.length}</CardTitle></CardHeader></Card>
            <Card className="border-border/80"><CardHeader className="pb-2"><CardDescription>Services</CardDescription><CardTitle>{snapshot.summary.serviceCount + extraServices}</CardTitle></CardHeader></Card>
            <Card className="border-border/80"><CardHeader className="pb-2"><CardDescription>Service requests</CardDescription><CardTitle>{formatNumber(snapshot.summary.serviceRequests + gapCount)}</CardTitle></CardHeader></Card>
            <Card className="border-border/80"><CardHeader className="pb-2"><CardDescription>API requests</CardDescription><CardTitle>{formatNumber(snapshot.summary.apiRequests)}</CardTitle></CardHeader></Card>
          </div>

          <Card className="border-border/80">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Providers</CardTitle>
              <CardDescription>Select a provider to view its services and APIs.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Service requests</TableHead>
                      <TableHead>Success %</TableHead>
                      <TableHead>API requests</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((provider) => {
                      const metrics = providerMetrics(provider);
                      const isMh = providerSlug(provider.name) === "mh-vistaar";
                      const reconstructed = isMh ? gapCount : 0;
                      const extra = isMh ? extraServices : 0;
                      const providerPath = `/service-snapshot/provider/${providerSlug(provider.name)}`;

                      return (
                        <TableRow key={provider.name}>
                          <TableCell className="font-semibold">{provider.name}</TableCell>
                          <TableCell>{provider.services.length + extra}</TableCell>
                          <TableCell className="font-semibold">{formatNumber(metrics.requests + reconstructed)}</TableCell>
                          <TableCell><Rate value={metrics.successPercentage} requests={metrics.requests} /></TableCell>
                          <TableCell className="font-semibold">{formatNumber(metrics.apiRequests)}</TableCell>
                          <TableCell className="text-right">
                            <Link to={providerPath} className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                              View services
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

export default ServiceSnapshot;
