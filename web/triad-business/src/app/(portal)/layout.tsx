"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useSession } from "@/components/providers/session-provider";

export default function PortalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { phase } = useSession();

  useEffect(() => {
    if (phase === "loading") return;
    if (phase === "signedOut") router.replace("/login");
  }, [phase, router]);

  if (phase === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-6 min-h-screen">{children}</main>
    </div>
  );
}
