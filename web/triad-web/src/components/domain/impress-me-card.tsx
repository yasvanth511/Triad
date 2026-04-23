import type { ReactNode } from "react";
import { Clock3, Sparkles } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { impressMeStatusCopy } from "@/lib/theme";
import type { ImpressMeSignal } from "@/lib/types";

export function ImpressMeCard({
  signal,
  role,
  cta,
}: {
  signal: ImpressMeSignal;
  role: "sender" | "receiver";
  cta?: ReactNode;
}) {
  const otherName = role === "receiver" ? signal.senderUsername : signal.receiverUsername;
  const otherPhoto = role === "receiver" ? signal.senderPhotoUrl : signal.receiverPhotoUrl;
  const hoursRemaining = Math.max(
    0,
    Math.floor(
      (new Date(signal.expiresAt).getTime() - new Date(signal.createdAt).getTime()) / 3_600_000,
    ),
  );

  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-3">
        <Avatar src={otherPhoto} alt={otherName} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">{otherName}</h3>
            <Badge tone={signal.flow === "PreMatch" ? "secondary" : "accent"}>
              {signal.flow === "PreMatch" ? "Pre-match" : "Post-match"}
            </Badge>
          </div>
          <p className="text-sm font-medium text-[var(--color-muted-ink)]">
            {impressMeStatusCopy(signal.status)}
          </p>
        </div>
        {signal.status !== "Expired" && signal.status !== "Accepted" && signal.status !== "Declined" ? (
          <Badge tone={hoursRemaining < 6 ? "red" : "muted"}>
            <Clock3 className="size-3" />
            {hoursRemaining}h
          </Badge>
        ) : null}
      </div>

      <div className="rounded-[22px] bg-[color:rgba(124,77,255,0.07)] p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)]">
          <Sparkles className="size-4" />
          <span>{signal.prompt.category}</span>
        </div>
        <p className="text-sm leading-6 text-[var(--color-ink)]">{signal.prompt.promptText}</p>
      </div>

      {signal.response && role === "sender" ? (
        <div className="rounded-[22px] bg-[color:rgba(219,38,119,0.07)] p-4">
          <p className="mb-2 text-sm font-semibold text-[var(--color-secondary)]">Their answer</p>
          <p className="text-sm leading-6 text-[var(--color-ink)]">{signal.response.textContent}</p>
        </div>
      ) : null}

      {cta}
    </Card>
  );
}
