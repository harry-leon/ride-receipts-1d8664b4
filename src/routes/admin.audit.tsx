import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, ArrowDownRight, ArrowRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useLoyalty, TierName, tierBadgeClass } from "@/lib/loyalty-store";

export const Route = createFileRoute("/admin/audit")({
  component: AuditPage,
});

const TIER_ORDER: Record<TierName, number> = { Bronze: 0, Silver: 1, Gold: 2 };
type Filter = "All" | "Upgrades" | "Downgrades";

function AuditPage() {
  const { audit } = useLoyalty();
  const [filter, setFilter] = React.useState<Filter>("All");

  const filtered = audit.filter((a) => {
    const diff = TIER_ORDER[a.newTier] - TIER_ORDER[a.previousTier];
    if (filter === "Upgrades") return diff > 0;
    if (filter === "Downgrades") return diff < 0;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tier Audit & Evolution Log</h1>
          <p className="text-sm text-muted-foreground">
            Read-only timeline of every membership change across the system.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
          {(["All", "Upgrades", "Downgrades"] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date / Time</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Movement</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead className="text-right">Authorized By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => {
                const diff = TIER_ORDER[a.newTier] - TIER_ORDER[a.previousTier];
                const isUp = diff > 0;
                const isDown = diff < 0;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {a.date}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{a.customerName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("border text-[10px]", tierBadgeClass(a.previousTier))}>
                          {a.previousTier}
                        </Badge>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge className={cn("border text-[10px]", tierBadgeClass(a.newTier))}>
                          {a.newTier}
                        </Badge>
                        {isUp && <ArrowUpRight className="h-4 w-4 text-emerald-600" />}
                        {isDown && <ArrowDownRight className="h-4 w-4 text-rose-600" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {a.trigger}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {a.authorizedBy}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                    <History className="mx-auto mb-2 h-5 w-5 opacity-50" />
                    No matching entries.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}