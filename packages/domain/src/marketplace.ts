export const JOB_CATEGORIES = [
  "DESIGN", "DEVELOPMENT", "WRITING", "MARKETING", "DATA", "ADMIN", "OTHER",
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];
export type JobListingStatus = "DRAFT" | "OPEN" | "CLOSED" | "AWARDED" | "CANCELLED";
export type ProposalStatus = "SUBMITTED" | "WITHDRAWN" | "REJECTED" | "ACCEPTED";
export type MarketplaceSort = "newest" | "budget";

export interface ListingFilters {
  query?: string;
  category?: JobCategory;
  skill?: string;
  minBudget?: string;
  maxBudget?: string;
  deadlineBefore?: string;
  sort?: MarketplaceSort;
  cursor?: string;
}

export interface PublicClientProfile {
  displayName: string;
  headline: string | null;
  countryCode: string | null;
}

export interface JobListingSummary {
  id: string;
  title: string;
  category: JobCategory;
  skills: string[];
  budgetMin: string;
  budgetMax: string;
  asset: string;
  proposalDeadline: string;
  publishedAt: string;
  proposalCount: number;
  client: PublicClientProfile;
}

export interface ProposalMilestoneInput {
  title: string;
  description: string;
  amount: string;
  evidenceRequirements: string;
  deliveryDays: number;
}
