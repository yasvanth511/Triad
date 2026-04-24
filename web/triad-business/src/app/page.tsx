"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";

export default function RootPage() {
  const router = useRouter();
  const { phase } = useSession();

  useEffect(() => {
    if (phase === "loading") return;
    if (phase === "authenticated") router.replace("/dashboard");
    else router.replace("/login");
  }, [phase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
