interface Props {
  label: string;
  value: string | number;
  description: string;
}

export default function MetricCard({ label, value, description }: Props) {
  return (
    <article className="bg-white border border-[#d9e0ec] rounded-[18px] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <h3 className="m-0 text-base font-semibold">{label}</h3>
      <p className="mt-1.5 mb-0 text-[28px] font-bold text-[#1d4ed8] leading-tight">{value}</p>
      <p className="mt-2 mb-0 text-sm text-[#667085]">{description}</p>
    </article>
  );
}
