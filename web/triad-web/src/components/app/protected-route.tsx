"use client";

import { useRouter } from "next/navigation";
import { useEffect, type PropsWithChildren } from "react";

import { Card } from "@/components/ui/card";
import { useSession } from "@/components/providers/session-provider";

export function ProtectedRoute({ children }: PropsWithChildren) {
  const router = useRouter();
  const { phase, isHydrated } = useSession();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (phase === "signedOut") {
      router.replace("/auth");
    }
  }, [isHydrated, phase, router]);

  if (!isHydrated || phase === "loading") {
    return (
      <div className="screen-wrap py-10">
        <Card className="max-w-md">
          <p className="text-sm font-medium text-[var(--color-muted-ink)]">
            Loading your Triad session...
          </p>
        </Card>
      </div>
    );
  }

  if (phase === "signedOut") {
    return null;
  }

  return children;
}
