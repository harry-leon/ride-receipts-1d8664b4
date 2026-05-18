import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Tag, Power } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useLoyalty, TierName, tierBadgeClass } from "@/lib/loyalty-store";

export const Route = createFileRoute("/admin/promotions")({
  component: PromotionsPage,
});

const ALL_TIERS: TierName[] = ["Bronze", "Silver", "Gold"];

function PromotionsPage() {
  const { promotions, addPromotion, togglePromotion } = useLoyalty();

  const [code, setCode] = React.useState("");
  const [discountType, setDiscountType] = React.useState<"Percentage" | "Flat">("Percentage");
  const [amount, setAmount] = React.useState(10);
  const [tiers, setTiers] = React.useState<TierName[]>(["Gold"]);

  const toggleTier = (t: TierName) =>
    setTiers((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("Promo code is required");
    if (amount <= 0) return toast.error("Discount amount must be > 0");
    if (tiers.length === 0) return toast.error("Select at least one target tier");

    addPromotion({
      code: code.toUpperCase().replace(/\s+/g, ""),
      discountType,
      amount,
      tiers,
      active: true,
    });
    toast.success(`Promotion ${code.toUpperCase()} launched`, {
      description: `Targeting ${tiers.join(", ")}`,
    });
    setCode("");
    setAmount(10);
    setTiers(["Gold"]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Promotion & Tier Targeting</h1>
        <p className="text-sm text-muted-foreground">
          Launch tier-exclusive promotions. Active campaigns apply automatically at checkout.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Plus className="h-4 w-4" /> Create campaign
            </div>
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Promo Code</Label>
                <Input
                  placeholder="GOLDVIP25"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Discount Type</Label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "Percentage" | "Flat")}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="Percentage">Percentage %</option>
                    <option value="Flat">Flat $</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Tiers</Label>
                <div className="space-y-2 rounded-md border border-border p-3">
                  {ALL_TIERS.map((t) => (
                    <label key={t} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={tiers.includes(t)}
                        onCheckedChange={() => toggleTier(t)}
                      />
                      <Badge className={cn("border", tierBadgeClass(t))}>{t}</Badge>
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full">
                Launch Promotion
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Tag className="h-4 w-4" /> Active Promotions
              </div>
              <span className="text-xs text-muted-foreground">
                {promotions.filter((p) => p.active).length} live
              </span>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Tiers</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs font-semibold">{p.code}</TableCell>
                    <TableCell className="text-sm">
                      {p.discountType === "Percentage" ? `${p.amount}%` : `$${p.amount}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.tiers.map((t) => (
                          <Badge key={t} className={cn("border text-[10px]", tierBadgeClass(t))}>
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={cn(
                            "text-xs",
                            p.active ? "text-emerald-600" : "text-muted-foreground",
                          )}
                        >
                          {p.active ? "Active" : "Paused"}
                        </span>
                        <Switch
                          checked={p.active}
                          onCheckedChange={() => togglePromotion(p.id)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {promotions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                      <Power className="mx-auto mb-2 h-5 w-5 opacity-50" />
                      No promotions yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}