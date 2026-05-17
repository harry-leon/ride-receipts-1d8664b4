import * as React from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  QrCode,
  Tag,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  PROMOS,
  Transaction,
  fmtMoney,
  useWashStore,
} from "@/lib/wash-store";
import { toast } from "sonner";
import { PageHeader, TierBadge } from "@/components/shared";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Credit Card", icon: CreditCard },
  { id: "qr", label: "Bank Transfer QR", icon: QrCode },
];

function CheckoutPage() {
  const { draft, commitTransaction, updateCustomerPoints, setDraft } = useWashStore();
  const navigate = useNavigate();

  const [promoInput, setPromoInput] = React.useState("");
  const [appliedPromo, setAppliedPromo] = React.useState<string | null>(null);
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [pointsToRedeem, setPointsToRedeem] = React.useState(0);
  const [payment, setPayment] = React.useState("card");

  if (!draft) {
    return (
      <div className="p-10 max-w-xl mx-auto text-center">
        <PageHeader title="No active session" subtitle="Start a wash session first." />
        <Button asChild className="mt-6">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Start a new wash
          </Link>
        </Button>
      </div>
    );
  }

  const subtotal = draft.services.reduce((s, x) => s + x.price, 0);
  const tierDiscount = +(subtotal * (draft.customer.discountPct / 100)).toFixed(2);

  const promo = appliedPromo ? PROMOS[appliedPromo] : null;
  const afterTier = subtotal - tierDiscount;
  const promoDiscount = promo
    ? promo.type === "pct"
      ? +(afterTier * (promo.value / 100)).toFixed(2)
      : Math.min(promo.value, afterTier)
    : 0;

  const maxRedeemableByPoints = draft.customer.points;
  const afterPromo = Math.max(0, afterTier - promoDiscount);
  const maxRedeemableByPrice = Math.floor(afterPromo * 10);
  const maxRedeem = Math.min(maxRedeemableByPoints, maxRedeemableByPrice);
  const safePoints = Math.min(pointsToRedeem, maxRedeem);
  const pointsValue = safePoints / 10;

  const finalAmount = +Math.max(0, afterPromo - pointsValue).toFixed(2);
  const pointsEarned = Math.floor(finalAmount);

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (PROMOS[code]) {
      setAppliedPromo(code);
      setPromoError(null);
      toast.success(`Promo "${code}" applied — ${PROMOS[code].label}`);
    } else {
      setAppliedPromo(null);
      setPromoError("Invalid promo code");
      toast.error("Invalid promo code");
    }
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError(null);
  };

  const processPayment = () => {
    const tx: Transaction = {
      id: `TX-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      customer: draft.customer,
      vehicleType: draft.vehicleType,
      plate: draft.plate,
      services: draft.services,
      subtotal,
      tierDiscount,
      promoDiscount,
      promoCode: appliedPromo ?? undefined,
      pointsRedeemed: safePoints,
      pointsValue,
      finalAmount,
      pointsEarned,
      paymentMethod: PAYMENT_METHODS.find((p) => p.id === payment)?.label ?? payment,
    };
    commitTransaction(tx);
    if (draft.customer.id !== "guest") {
      const newPoints = draft.customer.points - safePoints + pointsEarned;
      updateCustomerPoints(draft.customer.id, newPoints);
    }
    setDraft(null);
    navigate({ to: "/confirmation" });
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <PageHeader
        step="Step 2 of 3"
        title="Checkout"
        subtitle="Apply discounts, redeem points, and collect payment."
      />

      <div className="grid gap-6 lg:grid-cols-3 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Order Summary">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-sm font-medium">{draft.customer.name}</span>
              <TierBadge tier={draft.customer.tier} />
              <span className="text-xs text-muted-foreground">
                {draft.vehicleType} · <span className="font-mono">{draft.plate}</span>
              </span>
            </div>
            <div className="divide-y divide-border border rounded-lg border-border overflow-hidden">
              {draft.services.map((s) => (
                <div key={s.id} className="flex justify-between px-4 py-3 text-sm">
                  <span>{s.name}</span>
                  <span className="font-medium">{fmtMoney(s.price)}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-3 text-sm bg-accent/30">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{fmtMoney(subtotal)}</span>
              </div>
            </div>
          </Section>

          <Section title="Tier Discount">
            {draft.customer.tier === "Guest" ? (
              <p className="text-sm text-muted-foreground">
                Guest checkout — no member discount applied.
              </p>
            ) : (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>
                    <strong>{draft.customer.tier} Membership</strong> applied · −
                    {draft.customer.discountPct}%
                  </span>
                </div>
                <span className="text-sm font-semibold text-emerald-700">
                  −{fmtMoney(tierDiscount)}
                </span>
              </div>
            )}
          </Section>

          <Section title="Promo Code">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Try WELCOME20 or WASH5"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="pl-9 uppercase"
                  disabled={!!appliedPromo}
                />
              </div>
              {appliedPromo ? (
                <Button variant="outline" onClick={removePromo}>
                  Remove
                </Button>
              ) : (
                <Button onClick={applyPromo}>Apply</Button>
              )}
            </div>
            {appliedPromo && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Code <strong>{appliedPromo}</strong> active — {PROMOS[appliedPromo].label}
              </div>
            )}
            {promoError && (
              <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                {promoError}
              </div>
            )}
          </Section>

          <Section title="Loyalty Points">
            {draft.customer.tier === "Guest" ? (
              <p className="text-sm text-muted-foreground">
                Guests cannot redeem loyalty points.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">
                    Available: <strong className="text-foreground">{draft.customer.points} pts</strong>
                  </span>
                  <span className="text-xs text-muted-foreground">10 pts = $1</span>
                </div>
                <Slider
                  value={[safePoints]}
                  max={Math.max(maxRedeem, 1)}
                  step={10}
                  onValueChange={(v) => setPointsToRedeem(v[0])}
                  disabled={maxRedeem === 0}
                />
                <div className="mt-3 flex items-center gap-3">
                  <Label htmlFor="pts" className="text-sm">
                    Redeem
                  </Label>
                  <Input
                    id="pts"
                    type="number"
                    min={0}
                    max={maxRedeem}
                    step={10}
                    value={safePoints}
                    onChange={(e) => setPointsToRedeem(Number(e.target.value) || 0)}
                    className="w-28"
                  />
                  <span className="text-sm text-muted-foreground">
                    pts → <strong className="text-emerald-700">−{fmtMoney(pointsValue)}</strong>
                  </span>
                </div>
              </>
            )}
          </Section>

          <Section title="Payment Method">
            <div className="grid grid-cols-3 gap-3">
              {PAYMENT_METHODS.map((m) => {
                const active = payment === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayment(m.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                      active
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40 hover:bg-accent/40",
                    )}
                  >
                    <Icon className={cn("h-6 w-6", active ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-sm font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Final Bill
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={fmtMoney(subtotal)} />
              {tierDiscount > 0 && (
                <Row
                  label={`Tier (−${draft.customer.discountPct}%)`}
                  value={`−${fmtMoney(tierDiscount)}`}
                  emerald
                />
              )}
              {promoDiscount > 0 && (
                <Row
                  label={`Promo ${appliedPromo}`}
                  value={`−${fmtMoney(promoDiscount)}`}
                  emerald
                />
              )}
              {pointsValue > 0 && (
                <Row
                  label={`Points (${safePoints} pts)`}
                  value={`−${fmtMoney(pointsValue)}`}
                  emerald
                />
              )}
            </div>
            <div className="mt-4 border-t border-border pt-4 flex items-end justify-between">
              <span className="text-sm text-muted-foreground">Payable</span>
              <span className="text-3xl font-bold tracking-tight">{fmtMoney(finalAmount)}</span>
            </div>
            <Button className="w-full mt-5" size="lg" onClick={processPayment}>
              Process Payment
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button asChild variant="ghost" className="w-full mt-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold tracking-tight mb-4">{title}</h3>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  emerald,
}: {
  label: string;
  value: string;
  emerald?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", emerald && "text-emerald-700")}>{value}</span>
    </div>
  );
}