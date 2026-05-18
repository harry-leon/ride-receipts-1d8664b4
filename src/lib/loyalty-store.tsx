import * as React from "react";

export type TierName = "Bronze" | "Silver" | "Gold";

export interface TierRule {
  name: TierName;
  threshold: number;
  multiplier: number;
  perks: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  points: number;
  tier: TierName;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  icon: string;
}

export interface LedgerEntry {
  id: string;
  customerId: string;
  date: string;
  type: "Earned" | "Spent";
  delta: number;
  description: string;
}

export interface Promotion {
  id: string;
  code: string;
  discountType: "Percentage" | "Flat";
  amount: number;
  tiers: TierName[];
  active: boolean;
}

export interface AuditEntry {
  id: string;
  date: string;
  customerName: string;
  previousTier: TierName;
  newTier: TierName;
  trigger: "System Auto-Upgrade" | "System Auto-Downgrade" | "Points Expired" | "Admin Override";
  authorizedBy: string;
}

const DEFAULT_TIERS: TierRule[] = [
  { name: "Bronze", threshold: 0, multiplier: 1.0, perks: "Welcome perks. Birthday wash voucher." },
  { name: "Silver", threshold: 300, multiplier: 1.2, perks: "1.2x points. Priority booking." },
  { name: "Gold", threshold: 1000, multiplier: 1.5, perks: "1.5x points. Free monthly interior detail." },
];

const DEFAULT_REWARDS: Reward[] = [
  { id: "r1", name: "Free Interior Scent", cost: 50, icon: "Wind" },
  { id: "r2", name: "Free Tire Shine", cost: 100, icon: "CircleDot" },
  { id: "r3", name: "$10 Wash Voucher", cost: 200, icon: "Ticket" },
];

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: "c1", name: "Alex Johnson", email: "alex@example.com", points: 320, tier: "Silver" },
  { id: "c2", name: "Sophia Martinez", email: "sophia@example.com", points: 1200, tier: "Gold" },
];

const DEFAULT_LEDGER: LedgerEntry[] = [
  { id: "l1", customerId: "c1", date: "2026-05-10", type: "Earned", delta: 50, description: "Premium Wash" },
  { id: "l2", customerId: "c1", date: "2026-05-04", type: "Spent", delta: -100, description: "Redeemed Tire Shine" },
  { id: "l3", customerId: "c1", date: "2026-04-28", type: "Earned", delta: 120, description: "Deluxe Detail" },
  { id: "l4", customerId: "c2", date: "2026-05-12", type: "Earned", delta: 200, description: "Full Detail Package" },
  { id: "l5", customerId: "c2", date: "2026-05-01", type: "Spent", delta: -200, description: "Redeemed $10 Voucher" },
];

const DEFAULT_PROMOTIONS: Promotion[] = [
  { id: "p1", code: "GOLDVIP25", discountType: "Percentage", amount: 25, tiers: ["Gold"], active: true },
  { id: "p2", code: "SILVER10", discountType: "Percentage", amount: 10, tiers: ["Silver", "Gold"], active: true },
  { id: "p3", code: "WELCOME5", discountType: "Flat", amount: 5, tiers: ["Bronze"], active: false },
];

const DEFAULT_AUDIT: AuditEntry[] = [
  { id: "a1", date: "2026-05-12 09:14", customerName: "Sophia Martinez", previousTier: "Silver", newTier: "Gold", trigger: "System Auto-Upgrade", authorizedBy: "system" },
  { id: "a2", date: "2026-04-22 16:42", customerName: "Alex Johnson", previousTier: "Bronze", newTier: "Silver", trigger: "System Auto-Upgrade", authorizedBy: "system" },
  { id: "a3", date: "2026-03-30 11:05", customerName: "Marcus Lee", previousTier: "Silver", newTier: "Bronze", trigger: "Points Expired", authorizedBy: "system" },
  { id: "a4", date: "2026-03-12 14:20", customerName: "Priya Patel", previousTier: "Bronze", newTier: "Gold", trigger: "Admin Override", authorizedBy: "admin@shinepass" },
];

interface Ctx {
  tiers: TierRule[];
  customers: Customer[];
  rewards: Reward[];
  ledger: LedgerEntry[];
  promotions: Promotion[];
  audit: AuditEntry[];
  activeCustomerId: string;
  setActiveCustomerId: (id: string) => void;
  updateTiers: (next: TierRule[]) => void;
  redeemReward: (customerId: string, reward: Reward) => boolean;
  addPromotion: (p: Omit<Promotion, "id">) => void;
  togglePromotion: (id: string) => void;
  computeTier: (points: number) => TierName;
}

const LoyaltyCtx = React.createContext<Ctx | null>(null);

function tierFor(points: number, tiers: TierRule[]): TierName {
  const sorted = [...tiers].sort((a, b) => b.threshold - a.threshold);
  for (const t of sorted) if (points >= t.threshold) return t.name;
  return "Bronze";
}

export function LoyaltyStoreProvider({ children }: { children: React.ReactNode }) {
  const [tiers, setTiers] = React.useState<TierRule[]>(DEFAULT_TIERS);
  const [customers, setCustomers] = React.useState<Customer[]>(DEFAULT_CUSTOMERS);
  const [rewards] = React.useState<Reward[]>(DEFAULT_REWARDS);
  const [ledger, setLedger] = React.useState<LedgerEntry[]>(DEFAULT_LEDGER);
  const [promotions, setPromotions] = React.useState<Promotion[]>(DEFAULT_PROMOTIONS);
  const [audit, setAudit] = React.useState<AuditEntry[]>(DEFAULT_AUDIT);
  const [activeCustomerId, setActiveCustomerId] = React.useState("c1");

  const computeTier = React.useCallback((points: number) => tierFor(points, tiers), [tiers]);

  const updateTiers = (next: TierRule[]) => {
    setTiers(next);
    // Re-evaluate customer tiers and log audit
    setCustomers((prev) =>
      prev.map((c) => {
        const newTier = tierFor(c.points, next);
        if (newTier !== c.tier) {
          setAudit((a) => [
            {
              id: `a${Date.now()}-${c.id}`,
              date: new Date().toISOString().slice(0, 16).replace("T", " "),
              customerName: c.name,
              previousTier: c.tier,
              newTier,
              trigger: "Admin Override",
              authorizedBy: "admin@shinepass",
            },
            ...a,
          ]);
        }
        return { ...c, tier: newTier };
      }),
    );
  };

  const redeemReward: Ctx["redeemReward"] = (customerId, reward) => {
    const c = customers.find((x) => x.id === customerId);
    if (!c || c.points < reward.cost) return false;
    const newPoints = c.points - reward.cost;
    const newTier = tierFor(newPoints, tiers);
    setCustomers((prev) =>
      prev.map((x) => (x.id === customerId ? { ...x, points: newPoints, tier: newTier } : x)),
    );
    setLedger((prev) => [
      {
        id: `l${Date.now()}`,
        customerId,
        date: new Date().toISOString().slice(0, 10),
        type: "Spent",
        delta: -reward.cost,
        description: `Redeemed ${reward.name}`,
      },
      ...prev,
    ]);
    if (newTier !== c.tier) {
      setAudit((a) => [
        {
          id: `a${Date.now()}`,
          date: new Date().toISOString().slice(0, 16).replace("T", " "),
          customerName: c.name,
          previousTier: c.tier,
          newTier,
          trigger: "System Auto-Downgrade",
          authorizedBy: "system",
        },
        ...a,
      ]);
    }
    return true;
  };

  const addPromotion: Ctx["addPromotion"] = (p) =>
    setPromotions((prev) => [{ ...p, id: `p${Date.now()}` }, ...prev]);

  const togglePromotion: Ctx["togglePromotion"] = (id) =>
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p)));

  return (
    <LoyaltyCtx.Provider
      value={{
        tiers,
        customers,
        rewards,
        ledger,
        promotions,
        audit,
        activeCustomerId,
        setActiveCustomerId,
        updateTiers,
        redeemReward,
        addPromotion,
        togglePromotion,
        computeTier,
      }}
    >
      {children}
    </LoyaltyCtx.Provider>
  );
}

export function useLoyalty() {
  const ctx = React.useContext(LoyaltyCtx);
  if (!ctx) throw new Error("useLoyalty must be inside LoyaltyStoreProvider");
  return ctx;
}

export function tierGradient(tier: TierName) {
  switch (tier) {
    case "Gold":
      return "from-amber-400 via-yellow-500 to-amber-600 text-amber-50";
    case "Silver":
      return "from-slate-300 via-zinc-400 to-slate-500 text-slate-50";
    case "Bronze":
    default:
      return "from-orange-700 via-amber-800 to-orange-900 text-amber-50";
  }
}

export function tierBadgeClass(tier: TierName) {
  switch (tier) {
    case "Gold":
      return "bg-gradient-to-r from-amber-400 to-yellow-600 text-amber-50 border-amber-500/40";
    case "Silver":
      return "bg-gradient-to-r from-slate-300 to-zinc-500 text-slate-50 border-slate-400/40";
    case "Bronze":
    default:
      return "bg-gradient-to-r from-orange-600 to-amber-800 text-amber-50 border-amber-700/40";
  }
}