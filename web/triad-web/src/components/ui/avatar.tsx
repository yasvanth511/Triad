"use client";

import { useState } from "react";
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

  if (!resolved) {
    return <AvatarFallback className={className} />;
  }

  return (
    <div
      className={cn(
        "relative size-12 overflow-hidden rounded-full bg-[color:rgba(119,86,223,0.12)]",
        className,
      )}
    >
      <AvatarImage key={resolved} src={resolved} alt={alt} />
    </div>
  );
}

function AvatarImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-[var(--color-accent)]">
        <UserRound className="size-5" />
      </div>
    );
  }

  return (
    // Plain <img> on purpose: Next.js <Image> with `unoptimized` still adds
    // srcset/sizes that can trigger cross-origin checks against /uploads.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="absolute inset-0 size-full object-cover"
    />
  );
}

function AvatarFallback({ className }: { className?: string }) {
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
