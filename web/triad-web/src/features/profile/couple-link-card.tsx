"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  createCouple,
  getCoupleStatus,
  joinCouple,
  leaveCouple,
} from "@/lib/api/services";
import type { CoupleStatus } from "@/lib/types";

export function CoupleLinkCard() {
  const { token, refreshProfile } = useSession();
  const [statusState, setStatusState] = useState<
    { kind: "loading" } | { kind: "loaded"; status: CoupleStatus | null }
  >({ kind: "loading" });
  const [isMutating, setIsMutating] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [didCopy, setDidCopy] = useState(false);

  const status = statusState.kind === "loaded" ? statusState.status : null;
  const isLoading = statusState.kind === "loading";

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    getCoupleStatus(token)
      .then((result) => {
        if (!cancelled) {
          setStatusState({ kind: "loaded", status: result });
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          toast.error(error.message || "Could not load couple status.");
          setStatusState({ kind: "loaded", status: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleCreate() {
    if (!token || isMutating) {
      return;
    }

    setIsMutating(true);
    try {
      const response = await createCouple(token);
      setStatusState({
        kind: "loaded",
        status: {
          coupleId: response.coupleId,
          inviteCode: response.inviteCode,
          isComplete: false,
          partnerName: null,
          partnerUserId: null,
        },
      });
      await refreshProfile();
      toast.success("Invite code generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate invite code.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = joinCode.trim().toUpperCase();

    if (!token || !trimmed || isMutating) {
      return;
    }

    setIsMutating(true);
    try {
      await joinCouple(token, trimmed);
      const fresh = await getCoupleStatus(token);
      setStatusState({ kind: "loaded", status: fresh });
      setJoinCode("");
      await refreshProfile();
      toast.success("Linked with your partner.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not link the account.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleLeave() {
    if (!token || isMutating) {
      return;
    }

    const prompt = status?.isComplete
      ? "Unlink your partner? You'll appear as single again."
      : "Cancel this invite? The code will stop working.";

    if (!window.confirm(prompt)) {
      return;
    }

    setIsMutating(true);
    try {
      await leaveCouple(token);
      setStatusState({
        kind: "loaded",
        status: {
          coupleId: null,
          inviteCode: null,
          isComplete: false,
          partnerName: null,
          partnerUserId: null,
        },
      });
      await refreshProfile();
      toast.success(status?.isComplete ? "Partner unlinked." : "Invite cancelled.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not unlink.");
    } finally {
      setIsMutating(false);
    }
  }

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setDidCopy(true);
      setTimeout(() => setDidCopy(false), 1800);
    } catch {
      toast.error("Could not copy. Select the code manually.");
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-ink)]">Couple</h3>
          <p className="text-sm text-[var(--color-muted-ink)]">{headerSubtitle(status)}</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-[var(--color-muted-ink)]">Loading couple status…</p>
      ) : status?.isComplete ? (
        <LinkedState partnerName={status.partnerName} isMutating={isMutating} onUnlink={handleLeave} />
      ) : status?.coupleId && status.inviteCode ? (
        <WaitingState
          code={status.inviteCode}
          didCopy={didCopy}
          isMutating={isMutating}
          onCopy={() => copyCode(status.inviteCode!)}
          onCancel={handleLeave}
        />
      ) : (
        <UnlinkedState
          joinCode={joinCode}
          setJoinCode={setJoinCode}
          isMutating={isMutating}
          onCreate={handleCreate}
          onJoin={handleJoin}
        />
      )}
    </Card>
  );
}

function headerSubtitle(status: CoupleStatus | null) {
  if (!status) {
    return "Link your account with your partner to appear as a couple.";
  }
  if (status.isComplete) {
    return "You're linked with your partner.";
  }
  if (status.coupleId) {
    return "Share your invite code so your partner can join.";
  }
  return "Generate a code to invite your partner, or enter theirs.";
}

function UnlinkedState({
  joinCode,
  setJoinCode,
  isMutating,
  onCreate,
  onJoin,
}: {
  joinCode: string;
  setJoinCode: (value: string) => void;
  isMutating: boolean;
  onCreate: () => void;
  onJoin: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="space-y-4">
      <Button type="button" onClick={onCreate} disabled={isMutating} className="w-full">
        {isMutating ? "Working…" : "Generate Invite Code"}
      </Button>

      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-ink)]">
        <span className="h-px flex-1 bg-white/60" />
        or
        <span className="h-px flex-1 bg-white/60" />
      </div>

      <form onSubmit={onJoin} className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-ink)]">
          Enter Your Partner&apos;s Code
        </label>
        <div className="flex gap-2">
          <Input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder="e.g. A2B4K7P9"
            autoCapitalize="characters"
            autoCorrect="off"
            className="font-mono tracking-widest uppercase"
            maxLength={20}
          />
          <Button type="submit" variant="secondary" disabled={isMutating || !joinCode.trim()}>
            Link
          </Button>
        </div>
      </form>
    </div>
  );
}

function WaitingState({
  code,
  didCopy,
  isMutating,
  onCopy,
  onCancel,
}: {
  code: string;
  didCopy: boolean;
  isMutating: boolean;
  onCopy: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[var(--color-accent)]/10 p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-ink)]">
          Your Invite Code
        </p>
        <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em] text-[var(--color-ink)]">
          {code}
        </p>
      </div>

      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCopy}>
          {didCopy ? "Copied" : "Copy Code"}
        </Button>
        <Button type="button" variant="danger" className="flex-1" onClick={onCancel} disabled={isMutating}>
          Cancel Invite
        </Button>
      </div>

      <p className="text-xs text-[var(--color-muted-ink)]">
        Waiting for your partner to enter this code. Refresh after they join to see the link.
      </p>
    </div>
  );
}

function LinkedState({
  partnerName,
  isMutating,
  onUnlink,
}: {
  partnerName: string | null;
  isMutating: boolean;
  onUnlink: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-secondary)]/10 p-4">
        <div className="flex size-11 items-center justify-center rounded-full bg-[var(--color-secondary)]/20 text-[var(--color-secondary)]">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-5">
            <path d="M8 3a5 5 0 00-5 5c0 6 9 11 9 11s9-5 9-11a5 5 0 00-9-3 5 5 0 00-4-2z" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-ink)]">
            Linked with
          </p>
          <p className="text-base font-semibold text-[var(--color-ink)]">
            {partnerName || "Your partner"}
          </p>
        </div>
      </div>

      <Button type="button" variant="danger" onClick={onUnlink} disabled={isMutating} className="w-full">
        {isMutating ? "Working…" : "Unlink Partner"}
      </Button>
    </div>
  );
}
