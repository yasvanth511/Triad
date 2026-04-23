"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import { Toaster } from "sonner";

import { SessionProvider } from "@/components/providers/session-provider";

export function AppProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 15_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        {children}
        <Toaster
          richColors
          position="top-center"
          toastOptions={{
            classNames: {
              toast:
                "border border-white/60 bg-white/90 text-[var(--color-ink)] shadow-[0_18px_48px_rgba(52,28,90,0.18)] backdrop-blur-xl",
            },
          }}
        />
      </SessionProvider>
    </QueryClientProvider>
  );
}
