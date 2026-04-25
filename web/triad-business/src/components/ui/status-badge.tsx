import type { BusinessEventStatus, BusinessOfferStatus, BusinessVerificationStatus, ChallengeStatus } from "@/lib/types";

type Status =
  | BusinessVerificationStatus
  | BusinessEventStatus
  | BusinessOfferStatus
  | ChallengeStatus;

const labelMap: Record<string, string> = {
  PendingApproval: "Pending Approval",
  NotSelected: "Not Selected",
  FreeItem: "Free Item",
};

export function StatusBadge({ status }: { status: Status | string | null | undefined }) {
  if (!status || typeof status !== "string") return null;
  const cssClass = `status-${status.toLowerCase()}`;
  const label = labelMap[status] ?? status;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[0.73rem] font-semibold ${cssClass}`}>
      {label}
    </span>
  );
}
