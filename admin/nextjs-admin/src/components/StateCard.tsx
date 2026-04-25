interface Props {
  title: string;
  body: string;
}

export default function StateCard({ title, body }: Props) {
  return (
    <article className="admin-card p-5">
      <h3 className="m-0 text-base font-semibold text-[var(--color-ink)]">{title}</h3>
      <p className="mt-2 mb-0 text-sm leading-6 text-[var(--color-muted-ink)]">{body}</p>
    </article>
  );
}
