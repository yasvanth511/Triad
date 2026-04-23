import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const tones = {
  accent: "bg-[color:rgba(119,86,223,0.12)] text-[var(--color-accent)]",
  secondary: "bg-[color:rgba(219,38,119,0.12)] text-[var(--color-secondary)]",
  blue: "bg-sky-500/12 text-sky-700",
  red: "bg-rose-500/12 text-rose-700",
  muted: "bg-slate-500/10 text-slate-600",
  green: "bg-emerald-500/12 text-emerald-700",
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: keyof typeof tones;
}

export function Badge({ className, tone = "muted", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.73rem] font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
