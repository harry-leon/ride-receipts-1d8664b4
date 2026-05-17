import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Crown, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { nextTierInfo, usePortal } from "@/lib/portal-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const TIER_GRADIENT: Record<string, string> = {
  Bronze: "from-amber-700 via-amber-500 to-orange-400",
  Silver: "from-slate-500 via-slate-400 to-zinc-300",
  Gold: "from-yellow-500 via-amber-400 to-yellow-300",
  Platinum: "from-indigo-500 via-violet-500 to-fuchsia-400",
};

function ProfilePage() {
  const { profile, updateProfile } = usePortal();
  const [name, setName] = React.useState(profile?.name ?? "");
  const [phone, setPhone] = React.useState(profile?.phone ?? "");
  const [countryCode, setCountryCode] = React.useState(profile?.countryCode ?? "+84");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
      setCountryCode(profile.countryCode);
    }
  }, [profile]);

  if (!profile) {
    return (
      <div className="p-10 text-center text-muted-foreground">No profile loaded.</div>
    );
  }

  const tierInfo = nextTierInfo(profile.points, profile.tier);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name cannot be empty");
    if (!/^\d{8,11}$/.test(phone.trim())) return toast.error("Phone must be 8–11 digits");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    updateProfile({ name: name.trim(), phone: phone.trim(), countryCode });
    setSaving(false);
    toast.success("Profile updated");
  };

  return (
    <div className="px-4 py-8 md:p-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage personal details and track your loyalty progress.
        </p>

        {/* Tier card */}
        <div className={cn(
          "relative mt-6 overflow-hidden rounded-2xl bg-gradient-to-br p-6 text-white shadow-lg",
          TIER_GRADIENT[profile.tier] ?? TIER_GRADIENT.Silver,
        )}>
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-black/10 blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] opacity-80">
                <Crown className="h-3.5 w-3.5" /> Membership
              </div>
              <div className="mt-2 text-2xl font-semibold drop-shadow-sm">{profile.tier} Member</div>
              <div className="mt-1 text-sm opacity-90">{profile.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider opacity-80">Points</div>
              <div className="text-3xl font-bold tabular-nums drop-shadow-sm">{profile.points}</div>
            </div>
          </div>

          <div className="relative mt-6">
            {tierInfo.next ? (
              <>
                <div className="flex items-center justify-between text-xs opacity-90 mb-2">
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {tierInfo.needed} pts to <span className="font-semibold">{tierInfo.next}</span>
                  </span>
                  <span>{profile.points} / {tierInfo.target}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/25">
                  <div
                    className="h-full rounded-full bg-white transition-all duration-700"
                    style={{ width: `${tierInfo.pct}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                <Sparkles className="h-3.5 w-3.5" /> Top tier unlocked
              </div>
            )}
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={handleSave} className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="p-6">
            <h2 className="text-sm font-semibold tracking-tight">Personal information</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Update your name and contact number.</p>

            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pname" className="mb-1.5 block">Full name</Label>
                <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pphone" className="mb-1.5 block">Phone</Label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="+84">+84</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+65">+65</option>
                  </select>
                  <Input
                    id="pphone"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-border bg-accent/20 p-5 flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}