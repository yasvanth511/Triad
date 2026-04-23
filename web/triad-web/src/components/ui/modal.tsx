"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(24,16,44,0.32)] p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-2xl rounded-[30px] border border-white/70 bg-white/92 p-6 shadow-[0_32px_80px_rgba(52,28,90,0.20)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-[var(--color-ink)]">{title}</h2>
            {description ? (
              <p className="text-sm leading-6 text-[var(--color-muted-ink)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "rounded-full border border-white/60 bg-white/80 px-3 py-1 text-sm font-medium text-[var(--color-muted-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
            )}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
