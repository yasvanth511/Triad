import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-12 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] outline-none transition-colors placeholder:text-[var(--color-muted-ink)] hover:border-slate-300 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[color:rgba(119,86,223,0.16)]",
          className,
        )}
        {...props}
      />
    );
  },
);
