export type PillType =
  | 'account'
  | 'online'
  | 'verification'
  | 'availability'
  | 'moderation'
  | 'profile';

function pillVariant(value: string, type: PillType): 'success' | 'danger' | 'neutral' {
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
  return 'neutral';
}

const VARIANT_CLASSES = {
  success: 'bg-[#dcfce7] text-[#166534]',
  danger: 'bg-[#fee2e2] text-[#991b1b]',
  neutral: 'bg-[#e2e8f0] text-[#334155]',
};

interface Props {
  value: string;
  type: PillType;
}

export default function StatusPill({ value, type }: Props) {
  const variant = pillVariant(value, type);
  return (
    <span
      className={`inline-flex items-center rounded-full px-[10px] py-[5px] text-xs font-semibold capitalize whitespace-nowrap ${VARIANT_CLASSES[variant]}`}
    >
      {value}
    </span>
  );
}
