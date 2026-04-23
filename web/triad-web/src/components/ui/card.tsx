import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/65 bg-white/72 p-5 shadow-[0_22px_48px_rgba(52,28,90,0.10)] backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}
