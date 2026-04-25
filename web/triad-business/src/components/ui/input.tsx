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
  "w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-sm text-[var(--color-ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] outline-none transition-colors placeholder:text-[var(--color-muted-ink)] hover:border-slate-300 focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[color:rgba(119,86,223,0.16)]";

const inputHeight = "h-12";

export function Input({ label, error, className, ...rest }: InputProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-semibold text-[var(--color-muted-ink)]">{label}</span>}
      <input
        {...rest}
        className={clsx(baseClass, inputHeight, error && "border-rose-400 focus:border-rose-500 focus:ring-rose-200", className)}
      />
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}

export function Textarea({ label, error, className, ...rest }: TextareaProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-semibold text-[var(--color-muted-ink)]">{label}</span>}
      <textarea
        {...rest}
        className={clsx(
          baseClass,
          "min-h-28 resize-none py-3",
          error && "border-rose-400 focus:border-rose-500 focus:ring-rose-200",
          className,
        )}
      />
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
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
      {label && <span className="text-sm font-semibold text-[var(--color-muted-ink)]">{label}</span>}
      <select
        {...rest}
        className={clsx(baseClass, inputHeight, error && "border-rose-400 focus:border-rose-500 focus:ring-rose-200", className)}
      >
        {children}
      </select>
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
    </label>
  );
}
