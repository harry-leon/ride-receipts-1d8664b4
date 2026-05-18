import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save, Crown, Award, Medal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLoyalty, TierRule, TierName, tierBadgeClass } from "@/lib/loyalty-store";

export const Route = createFileRoute("/admin/tiers")({
  component: TierRulesPage,
});

const TIER_ICONS: Record<TierName, React.ComponentType<{ className?: string }>> = {
  Bronze: Medal,
  Silver: Award,
  Gold: Crown,
};

function TierRulesPage() {
  const { tiers, updateTiers, customers } = useLoyalty();
  const [draft, setDraft] = React.useState<TierRule[]>(tiers);

  React.useEffect(() => setDraft(tiers), [tiers]);

  const update = (i: number, patch: Partial<TierRule>) =>
    setDraft((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const handleSave = () => {
    for (const t of draft) {
      if (t.threshold < 0) return toast.error(`${t.name}: threshold must be ≥ 0`);
      if (t.multiplier <= 0) return toast.error(`${t.name}: multiplier must be > 0`);
      if (!t.perks.trim()) return toast.error(`${t.name}: perks description is required`);
    }
    updateTiers(draft);
    toast.success("Tier rules updated", {
      description: "Customer tiers re-evaluated across the system.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tier Rules Configuration</h1>
          <p className="text-sm text-muted-foreground">
            Adjust thresholds and accrual multipliers. Changes apply instantly to all customers.
          </p>
        </div>
        <Button onClick={handleSave} size="lg">
          <Save className="h-4 w-4" /> Save & Update Rules
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {draft.map((t, i) => {
          const Icon = TIER_ICONS[t.name];
          const memberCount = customers.filter((c) => c.tier === t.name).length;
          return (
            <Card key={t.name} className="overflow-hidden">
              <div className={cn("h-2 w-full bg-gradient-to-r", t.name === "Gold" ? "from-amber-400 to-yellow-600" : t.name === "Silver" ? "from-slate-300 to-zinc-500" : "from-orange-600 to-amber-800")} />
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <Badge className={cn("border", tierBadgeClass(t.name))}>{t.name}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{memberCount} members</div>
                </div>

                <div className="space-y-1.5">
                  <Label>Minimum Point Threshold</Label>
                  <Input
                    type="number"
                    min={0}
                    value={t.threshold}
                    onChange={(e) => update(i, { threshold: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Point Accrual Multiplier</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step={0.1}
                      min={0.1}
                      value={t.multiplier}
                      onChange={(e) => update(i, { multiplier: Number(e.target.value) })}
                    />
                    <span className="text-sm text-muted-foreground">×</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Custom Perks Description</Label>
                  <Textarea
                    rows={3}
                    value={t.perks}
                    onChange={(e) => update(i, { perks: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}