import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))] text-white shadow-[0_18px_35px_rgba(119,86,223,0.28)] hover:opacity-95",
  secondary:
    "bg-white/80 text-[var(--color-ink)] shadow-[0_10px_24px_rgba(52,28,90,0.12)] hover:bg-white",
  ghost: "bg-transparent text-[var(--color-muted-ink)] hover:bg-white/60",
  outline:
    "border border-white/70 bg-white/50 text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:bg-white/80",
  danger:
    "bg-[var(--color-secondary)] text-white shadow-[0_16px_32px_rgba(219,38,119,0.22)] hover:opacity-95",
};

const sizeClass: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-60",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
