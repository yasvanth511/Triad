import type { HTMLAttributes, TableHTMLAttributes } from 'react';

export const TH =
  'px-4 py-3.5 border-b border-white/60 text-left text-xs font-semibold tracking-[0.08em] uppercase text-[var(--color-muted-ink)]';

export const TD = 'px-4 py-3.5 border-b border-white/55 align-top text-sm text-[var(--color-ink)]';

export const TR_HOVER = 'transition-colors hover:bg-white/45';

export function TableCard({
  children,
  className = '',
  ...rest
}: HTMLAttributes<HTMLElement>) {
  return (
    <article className={`admin-card p-5 ${className}`} {...rest}>
      <div className="overflow-x-auto">{children}</div>
    </article>
  );
}

export function TriadTable({
  className = '',
  ...rest
}: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={`w-full border-collapse ${className}`} {...rest} />;
}

export const ACTION_BTN_PRIMARY =
  'inline-flex h-9 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))] px-3.5 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(119,86,223,0.22)] transition hover:opacity-95';

export const ACTION_BTN_DANGER =
  'inline-flex h-9 items-center justify-center rounded-2xl bg-[var(--color-secondary)] px-3.5 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(219,38,119,0.22)] transition hover:opacity-95';

export const ACTION_BTN_SUCCESS =
  'inline-flex h-9 items-center justify-center rounded-2xl bg-emerald-600 px-3.5 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(16,128,90,0.22)] transition hover:bg-emerald-700';

export const ACTION_BTN_OUTLINE =
  'inline-flex h-9 items-center justify-center rounded-2xl border border-white/70 bg-white/60 px-3.5 text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-white/80';
