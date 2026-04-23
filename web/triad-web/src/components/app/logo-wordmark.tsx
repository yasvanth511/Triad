import { cn } from "@/lib/utils";

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-[linear-gradient(135deg,#2e1d49,#5e2f84)] bg-clip-text font-[family:var(--font-display)] text-4xl font-black tracking-[-0.06em] text-transparent",
        className,
      )}
    >
      Triad
    </span>
  );
}
