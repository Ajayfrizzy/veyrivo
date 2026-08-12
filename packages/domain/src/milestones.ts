export const MILESTONE_STATUSES = [
  "PENDING",
  "ACTIVE",
  "PROOF_SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUESTED",
  "APPROVED",
  "RELEASE_PENDING",
  "RELEASED",
  "DISPUTED",
  "SECURITY_HOLD",
  "REFUND_PENDING",
  "REFUNDED",
  "CANCELLED",
  "FAILED",
] as const;

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export interface MilestoneDraft {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string;
  amount: number;
  dueDate: string;
  evidence: string;
}
