"use client";

import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { currentUser, partner, signOut } = useSession();

  return (
    <div className="max-w-2xl py-4 space-y-6">
      <div>
        <h1 className="page-title text-[var(--color-ink)]">Settings</h1>
        <p className="text-sm text-[var(--color-muted-ink)] mt-1">
          Basic account details for this MVP portal.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-muted-ink)]">Account</p>
          <p className="font-semibold text-[var(--color-ink)] mt-1">{currentUser?.username}</p>
          {partner?.email && <p className="text-sm text-[var(--color-muted-ink)]">{partner.email}</p>}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-muted-ink)]">Business Status</p>
          <p className="font-semibold text-[var(--color-ink)] mt-1">{partner?.status ?? "Unknown"}</p>
          {partner?.rejectionReason && (
            <p className="text-sm text-red-600 mt-1">{partner.rejectionReason}</p>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-muted-ink)]">Business</p>
          <p className="font-semibold text-[var(--color-ink)] mt-1">
            {partner?.profile?.businessName ?? "Profile not completed"}
          </p>
          {partner?.profile?.category && (
            <p className="text-sm text-[var(--color-muted-ink)]">{partner.profile.category}</p>
          )}
        </div>

        <div className="pt-2">
          <Button variant="danger" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}
