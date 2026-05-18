import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Sparkles, Gift, Settings2, Tags, History, User2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLoyalty } from "@/lib/loyalty-store";

const customerNav = [{ to: "/", label: "Rewards Hub", icon: Gift, exact: true }];
const adminNav = [
  { to: "/admin/tiers", label: "Tier Rules", icon: Settings2 },
  { to: "/admin/promotions", label: "Promotions", icon: Tags },
  { to: "/admin/audit", label: "Audit Log", icon: History },
];

export function LoyaltyShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { customers, activeCustomerId, setActiveCustomerId } = useLoyalty();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Master top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground shadow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">ShinePass</div>
              <div className="text-[11px] text-muted-foreground">Loyalty Suite</div>
            </div>
          </div>

          {/* Master toggle */}
          <div className="ml-2 hidden sm:flex items-center rounded-full border border-border bg-muted p-1">
            <Link
              to="/"
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                !isAdmin
                  ? "bg-card text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Customer Portal
            </Link>
            <Link
              to="/admin/tiers"
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
                isAdmin
                  ? "bg-card text-foreground shadow"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Admin Dashboard
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {!isAdmin ? (
              <div className="flex items-center gap-2">
                <User2 className="h-4 w-4 text-muted-foreground" />
                <select
                  value={activeCustomerId}
                  onChange={(e) => setActiveCustomerId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">admin@shinepass</span>
              </div>
            )}
          </div>
        </div>

        {/* Secondary nav */}
        <div className="border-t border-border bg-card">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6">
            {(isAdmin ? adminNav : customerNav).map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-3 text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}