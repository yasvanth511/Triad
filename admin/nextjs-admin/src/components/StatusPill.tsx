export type PillType =
  | 'account'
  | 'online'
  | 'verification'
  | 'availability'
  | 'moderation'
  | 'profile';

function pillVariant(value: string, type: PillType): 'success' | 'danger' | 'neutral' | 'accent' {
  const n = value.toLowerCase();
  if (type === 'account') return n === 'banned' ? 'danger' : 'success';
  if (type === 'online') return n === 'online' ? 'success' : 'neutral';
  if (type === 'verification') {
    if (n === 'verified') return 'success';
    if (n === 'failed' || n === 'expired') return 'danger';
    return 'neutral';
  }
  if (type === 'availability') return n === 'enabled' ? 'success' : 'neutral';
  if (type === 'moderation') {
    if (n === 'flagged') return 'danger';
    return 'neutral';
  }
  if (type === 'profile') {
    if (n === 'couple') return 'accent';
    return 'neutral';
  }
  return 'neutral';
}

const VARIANT_CLASSES = {
  success: 'bg-emerald-500/12 text-emerald-700',
  danger: 'bg-rose-500/12 text-rose-700',
  neutral: 'bg-slate-500/10 text-slate-600',
  accent: 'bg-[rgba(124,77,255,0.12)] text-[var(--color-accent)]',
};

interface Props {
  value: string;
  type: PillType;
}

export default function StatusPill({ value, type }: Props) {
  const variant = pillVariant(value, type);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.73rem] font-semibold capitalize whitespace-nowrap ${VARIANT_CLASSES[variant]}`}
    >
      {value}
    </span>
  );
}
