"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Card } from "@/components/ui/card";
import { useSession } from "@/components/providers/session-provider";

export function RootRedirect() {
  const router = useRouter();
  const { phase, isHydrated } = useSession();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    router.replace(phase === "authenticated" ? "/discover" : "/auth");
  }, [isHydrated, phase, router]);

  return (
    <div className="screen-wrap py-12">
      <Card className="max-w-md">
        <p className="text-sm font-medium text-[var(--color-muted-ink)]">Opening Triad...</p>
      </Card>
    </div>
  );
}
