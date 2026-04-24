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

export function StatusBadge({ status }: { status: Status | string }) {
  const cssClass = `status-${status.toLowerCase()}`;
  const label = labelMap[status] ?? status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cssClass}`}>
      {label}
    </span>
  );
}
