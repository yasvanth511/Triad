import { clsx } from "clsx";
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const baseClass =
  "w-full border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 bg-white/70 text-[var(--color-ink)] placeholder:text-[var(--color-muted-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 focus:border-[var(--color-accent)] transition-all";

export function Input({ label, error, className, ...rest }: InputProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>}
      <input {...rest} className={clsx(baseClass, error && "border-red-400", className)} />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}

export function Textarea({ label, error, className, ...rest }: TextareaProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>}
      <textarea
        {...rest}
        className={clsx(baseClass, "resize-none min-h-24", error && "border-red-400", className)}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}

export function Select({
  label,
  error,
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>}
      <select {...rest} className={clsx(baseClass, error && "border-red-400", className)}>
        {children}
      </select>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  );
}
