interface Props {
  title: string;
  body: string;
}

export default function StateCard({ title, body }: Props) {
  return (
    <article className="bg-[#eef2f8] border border-[#d9e0ec] rounded-[18px] p-5">
      <h3 className="m-0 text-base font-semibold">{title}</h3>
      <p className="mt-2.5 mb-0 text-[#667085]">{body}</p>
    </article>
  );
}
