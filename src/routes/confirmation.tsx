import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Gift, Printer, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fmtMoney, useWashStore } from "@/lib/wash-store";
import { toast } from "sonner";
import { PageHeader, TierBadge } from "@/components/shared";

export const Route = createFileRoute("/confirmation")({
  component: ConfirmationPage,
});

function ConfirmationPage() {
  const { lastTransaction, customers } = useWashStore();
  const navigate = useNavigate();

  if (!lastTransaction) {
    return (
      <div className="p-10 max-w-xl mx-auto text-center">
        <PageHeader title="No recent transaction" subtitle="Complete a checkout to see the receipt." />
        <Button asChild className="mt-6">
          <Link to="/">Start a new wash <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    );
  }

  const tx = lastTransaction;
  const current =
    tx.customer.id !== "guest" ? customers.find((c) => c.id === tx.customer.id) : null;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto">
      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-2xl animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg animate-in zoom-in duration-500">
            <Check className="h-10 w-10" strokeWidth={3} />
          </div>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mt-6">Payment Successful</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Transaction <span className="font-mono">{tx.id}</span> · paid via {tx.paymentMethod}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5 mt-10">
        <div className="md:col-span-3 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-tight">Receipt</h3>
            <TierBadge tier={tx.customer.tier} />
          </div>
          <div className="text-sm space-y-1 mb-4">
            <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span>{tx.customer.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span>{tx.vehicleType} · <span className="font-mono">{tx.plate}</span></span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(tx.date).toLocaleString()}</span></div>
          </div>
          <div className="border-t border-border pt-4 space-y-1.5 text-sm">
            {tx.services.map((s) => (
              <div key={s.id} className="flex justify-between">
                <span>{s.name}</span>
                <span>{fmtMoney(s.price)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border mt-4 pt-4 space-y-1.5 text-sm">
            <Line label="Subtotal" value={fmtMoney(tx.subtotal)} />
            {tx.tierDiscount > 0 && <Line label={`Tier discount (${tx.customer.discountPct}%)`} value={`−${fmtMoney(tx.tierDiscount)}`} emerald />}
            {tx.promoDiscount > 0 && <Line label={`Promo ${tx.promoCode}`} value={`−${fmtMoney(tx.promoDiscount)}`} emerald />}
            {tx.pointsValue > 0 && <Line label={`Points used (${tx.pointsRedeemed})`} value={`−${fmtMoney(tx.pointsValue)}`} emerald />}
          </div>
          <div className="border-t border-border mt-4 pt-4 flex items-end justify-between">
            <span className="text-sm text-muted-foreground">Final paid</span>
            <span className="text-3xl font-bold tracking-tight">{fmtMoney(tx.finalAmount)}</span>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="rounded-xl bg-gradient-to-br from-primary to-indigo-700 p-6 text-primary-foreground shadow-lg">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-90">
              <Sparkles className="h-3.5 w-3.5" /> Loyalty
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <Gift className="h-6 w-6" />
              <span className="text-4xl font-bold">+{tx.pointsEarned}</span>
              <span className="text-sm opacity-80">pts earned</span>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20 text-sm">
              {tx.customer.id === "guest" ? (
                <span className="opacity-80">Sign up to start earning points!</span>
              ) : (
                <div className="flex justify-between">
                  <span className="opacity-80">New balance</span>
                  <span className="font-semibold">{current?.points ?? 0} pts</span>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              toast.success("Receipt sent to printer");
              if (typeof window !== "undefined") window.print();
            }}
          >
            <Printer className="h-4 w-4" /> Print Receipt
          </Button>
          <Button className="w-full" onClick={() => navigate({ to: "/" })}>
            Back to Dashboard <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/history">View History</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value, emerald }: { label: string; value: string; emerald?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={emerald ? "font-medium text-emerald-700" : "font-medium"}>{value}</span>
    </div>
  );
}