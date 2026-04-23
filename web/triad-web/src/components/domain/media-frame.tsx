import Image from "next/image";
import { ImageOff, Images } from "lucide-react";

import { resolveMediaUrl } from "@/lib/config";
import { cn } from "@/lib/utils";

export function MediaFrame({
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
      <div className={cn("relative h-full w-full overflow-hidden rounded-[24px]", className)}>
        <Image alt={alt} src={resolved} fill unoptimized className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-56 w-full items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,rgba(124,77,255,0.14),rgba(219,38,119,0.12))] text-[var(--color-muted-ink)]",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-2 text-sm font-medium">
        {src === undefined ? <Images className="size-8" /> : <ImageOff className="size-8" />}
        <span>Media preview</span>
      </div>
    </div>
  );
}
