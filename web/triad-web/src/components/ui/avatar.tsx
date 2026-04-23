import Image from "next/image";
import { UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/config";

export function Avatar({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const resolved = resolveMediaUrl(src);

  if (resolved) {
    return (
      <div className={cn("relative size-12 overflow-hidden rounded-full", className)}>
        <Image alt={alt} src={resolved} fill unoptimized className="object-cover" sizes="48px" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex size-12 items-center justify-center rounded-full bg-[color:rgba(119,86,223,0.12)] text-[var(--color-accent)]",
        className,
      )}
    >
      <UserRound className="size-5" />
    </div>
  );
}
