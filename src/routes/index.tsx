import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  Wind,
  CircleDot,
  Ticket,
  TrendingUp,
  TrendingDown,
  Crown,
  Gift,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  useLoyalty,
  tierGradient,
  tierBadgeClass,
  Reward,
} from "@/lib/loyalty-store";

export const Route = createFileRoute("/")({
  component: CustomerHub,
});

const REWARD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Wind,
  CircleDot,
  Ticket,
};

function CustomerHub() {
  const { customers, activeCustomerId, tiers, ledger, rewards, redeemReward } =
    useLoyalty();
  const customer = customers.find((c) => c.id === activeCustomerId)!;

  const sortedTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);
  const currentIdx = sortedTiers.findIndex((t) => t.name === customer.tier);
  const nextTier = sortedTiers[currentIdx + 1];
  const base = sortedTiers[currentIdx]?.threshold ?? 0;
  const target = nextTier?.threshold ?? customer.points;
  const pct = nextTier
    ? Math.min(100, Math.round(((customer.points - base) / (target - base)) * 100))
    : 100;

  const customerLedger = ledger.filter((l) => l.customerId === customer.id);

  const handleRedeem = (reward: Reward) => {
    if (customer.points < reward.cost) {
      toast.error("Not enough points", {
        description: `You need ${reward.cost - customer.points} more points.`,
      });
      return;
    }
    const ok = redeemReward(customer.id, reward);
    if (ok) {
      toast.success(`${reward.name} redeemed!`, {
        description: `-${reward.cost} pts deducted from your balance.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-br p-6 sm:p-8 shadow-lg",
          tierGradient(customer.tier),
        )}
      >
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-black/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-90">
              <Crown className="h-4 w-4" />
              {customer.tier} Member
            </div>
            <div className="mt-2 text-3xl font-bold sm:text-4xl">{customer.name}</div>
            <div className="mt-1 text-sm opacity-90">{customer.email}</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs uppercase tracking-widest opacity-90">Point Balance</div>
            <div className="mt-1 text-5xl font-bold tabular-nums">
              {customer.points.toLocaleString()}
            </div>
            <div className="mt-1 text-xs opacity-90">Active points · Valid 12 months</div>
          </div>
        </div>

        <div className="relative mt-6">
          {nextTier ? (
            <>
              <div className="flex items-center justify-between text-xs opacity-90">
                <span>{customer.tier}</span>
                <span>
                  {target - customer.points} pts to {nextTier.name}
                </span>
                <span>{nextTier.name}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/20">
                <div
                  className="h-full bg-white/90 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-xs opacity-90">
              You've reached the top tier. Enjoy exclusive Gold perks.
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Rewards Marketplace</h2>
            <span className="text-xs text-muted-foreground">
              {rewards.length} perks available
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rewards.map((r) => {
              const Icon = REWARD_ICONS[r.icon] ?? Gift;
              const affordable = customer.points >= r.cost;
              return (
                <Card key={r.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="mt-4 text-sm font-semibold">{r.name}</div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" /> {r.cost} pts
                    </div>
                    <Button
                      size="sm"
                      className="mt-4 w-full"
                      disabled={!affordable}
                      onClick={() => handleRedeem(r)}
                    >
                      {affordable ? "Redeem" : "Not enough points"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Point Ledger</h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {customerLedger.length === 0 && (
                  <li className="p-6 text-sm text-muted-foreground">No activity yet.</li>
                )}
                {customerLedger.map((l) => (
                  <li key={l.id} className="flex items-center gap-3 p-4">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full",
                        l.type === "Earned"
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-rose-500/10 text-rose-600",
                      )}
                    >
                      {l.type === "Earned" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{l.description}</div>
                      <div className="text-xs text-muted-foreground">{l.date}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          l.delta > 0 ? "text-emerald-600" : "text-rose-600",
                        )}
                      >
                        {l.delta > 0 ? "+" : ""}
                        {l.delta}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{l.type}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-xs font-medium text-muted-foreground">Your tier perks</div>
              <Badge className={cn("mt-2 border", tierBadgeClass(customer.tier))}>
                {customer.tier}
              </Badge>
              <p className="mt-2 text-sm text-foreground">
                {tiers.find((t) => t.name === customer.tier)?.perks}
              </p>
              <div className="mt-3 text-xs text-muted-foreground">
                Earning rate ×{tiers.find((t) => t.name === customer.tier)?.multiplier}
              </div>
              {nextTier && (
                <div className="mt-3">
                  <Progress value={pct} className="h-1.5" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}