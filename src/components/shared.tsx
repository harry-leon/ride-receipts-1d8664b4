import { Badge } from "@/components/ui/badge";

export function TierBadge({ tier }: { tier: "Gold" | "Silver" | "Guest" }) {
  if (tier === "Gold")
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200">
        Gold
      </Badge>
    );
  if (tier === "Silver")
    return (
      <Badge className="bg-slate-200 text-slate-800 hover:bg-slate-200 border-slate-300">
        Silver
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Guest
    </Badge>
  );
}

export function PageHeader({
  step,
  title,
  subtitle,
}: {
  step?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      {step && (
        <div className="text-xs font-semibold uppercase tracking-wider text-primary">{step}</div>
      )}
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}