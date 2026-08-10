import type { AgreementStatus } from "./agreements";
import type { MilestoneStatus } from "./milestones";

export type JobRole = "CLIENT" | "WORKER";

export interface JobSummary {
  id: string;
  title: string;
  counterparty: string;
  role: JobRole;
  status: AgreementStatus;
  displayStatus: AgreementStatus | MilestoneStatus;
  asset: string;
  total: number;
  released: number;
  milestoneProgress: string;
  nextAction: string;
  updatedAt: string;
}
