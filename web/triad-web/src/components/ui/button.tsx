import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))] text-white shadow-[0_18px_35px_rgba(119,86,223,0.28)] hover:opacity-95",
  secondary:
    "bg-white/80 text-[var(--color-ink)] shadow-[0_10px_24px_rgba(52,28,90,0.12)] hover:bg-white",
  ghost: "bg-transparent text-[var(--color-muted-ink)] hover:bg-white/50",
  outline:
    "border border-white/70 bg-white/50 text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:bg-white/80",
  danger:
    "bg-[var(--color-secondary)] text-white shadow-[0_16px_32px_rgba(219,38,119,0.22)] hover:opacity-95",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "size-11",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
