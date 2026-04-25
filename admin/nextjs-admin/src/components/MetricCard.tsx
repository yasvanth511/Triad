interface Props {
  label: string;
  value: string | number;
  description: string;
}

export default function MetricCard({ label, value, description }: Props) {
  return (
    <article className="admin-card p-5">
      <h3 className="m-0 text-sm font-semibold tracking-[0.04em] uppercase text-[var(--color-muted-ink)]">
        {label}
      </h3>
      <p
        className="mt-2 mb-0 text-[32px] font-bold leading-none bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))] bg-clip-text text-transparent"
      >
        {value}
      </p>
      <p className="mt-3 mb-0 text-sm leading-6 text-[var(--color-muted-ink)]">{description}</p>
    </article>
  );
}
