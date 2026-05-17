import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Filter, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Transaction, fmtMoney, useWashStore } from "@/lib/wash-store";
import { PageHeader, TierBadge } from "@/components/shared";

export const Route = createFileRoute("/history")({
  component: HistoryPage,
});

function HistoryPage() {
  const { transactions } = useWashStore();
  const [search, setSearch] = React.useState("");
  const [tierFilter, setTierFilter] = React.useState("all");
  const [active, setActive] = React.useState<Transaction | null>(null);

  const filtered = transactions.filter((t) => {
    const matchPlate = t.plate.toLowerCase().includes(search.trim().toLowerCase());
    const matchTier = tierFilter === "all" || t.customer.tier === tierFilter;
    return matchPlate && matchTier;
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <PageHeader
        title="Transaction History"
        subtitle="Audit log of every completed wash session."
      />

      <div className="mt-6 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border bg-accent/20">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by license plate"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="Gold">Gold</SelectItem>
                <SelectItem value="Silver">Silver</SelectItem>
                <SelectItem value="Guest">Guest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center text-muted-foreground">
            <Inbox className="h-10 w-10 mb-3 opacity-50" />
            <div className="text-sm">
              {transactions.length === 0
                ? "No transactions yet — complete a checkout to log one."
                : "No transactions match your filters."}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>Date</Th>
                  <Th>Transaction</Th>
                  <Th>Customer</Th>
                  <Th>Plate</Th>
                  <Th className="text-right">Final</Th>
                  <Th className="text-right">Points</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setActive(t)}
                    className="cursor-pointer hover:bg-accent/30 transition-colors"
                  >
                    <Td>{new Date(t.date).toLocaleString()}</Td>
                    <Td className="font-mono text-xs">{t.id}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span>{t.customer.name}</span>
                        <TierBadge tier={t.customer.tier} />
                      </div>
                    </Td>
                    <Td className="font-mono">{t.plate}</Td>
                    <Td className="text-right font-semibold">{fmtMoney(t.finalAmount)}</Td>
                    <Td className="text-right text-emerald-700">+{t.pointsEarned}</Td>
                    <Td>
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                        Completed
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>Receipt {active.id}</SheetTitle>
                <SheetDescription>
                  {new Date(active.date).toLocaleString()} · {active.paymentMethod}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{active.customer.name}</span>
                    <TierBadge tier={active.customer.tier} />
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {active.vehicleType} · <span className="font-mono">{active.plate}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-2">Services</div>
                  <div className="space-y-1.5">
                    {active.services.map((s) => (
                      <div key={s.id} className="flex justify-between">
                        <span>{s.name}</span>
                        <span>{fmtMoney(s.price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border pt-3 space-y-1.5">
                  <Line label="Subtotal" value={fmtMoney(active.subtotal)} />
                  {active.tierDiscount > 0 && (
                    <Line label="Tier discount" value={`−${fmtMoney(active.tierDiscount)}`} emerald />
                  )}
                  {active.promoDiscount > 0 && (
                    <Line
                      label={`Promo ${active.promoCode}`}
                      value={`−${fmtMoney(active.promoDiscount)}`}
                      emerald
                    />
                  )}
                  {active.pointsValue > 0 && (
                    <Line
                      label={`Points (${active.pointsRedeemed})`}
                      value={`−${fmtMoney(active.pointsValue)}`}
                      emerald
                    />
                  )}
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-semibold">Total paid</span>
                  <span className="font-bold text-lg">{fmtMoney(active.finalAmount)}</span>
                </div>
                <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-emerald-800 text-xs">
                  Earned <strong>+{active.pointsEarned} pts</strong> on this transaction.
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-left font-medium ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function Line({ label, value, emerald }: { label: string; value: string; emerald?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={emerald ? "text-emerald-700 font-medium" : "font-medium"}>{value}</span>
    </div>
  );
}