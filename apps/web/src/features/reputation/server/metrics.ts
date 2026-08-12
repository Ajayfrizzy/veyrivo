import type { ReputationSummary } from "./queries";

export function calculateReputation(input: {
  completedJobs: Array<{ id: string; clientUserId: string }>;
  releasedMilestones: Array<{ dueAt: Date; submittedAt: Date | null }>;
  ratings: number[];
  identityVerified: boolean;
}): ReputationSummary {
  const clientCounts = new Map<string, number>();
  for (const job of input.completedJobs)
    clientCounts.set(job.clientUserId, (clientCounts.get(job.clientUserId) ?? 0) + 1);
  const ratingTotal = input.ratings.reduce((sum, rating) => sum + rating, 0);
  const submittedMilestones = input.releasedMilestones.filter(
    (milestone): milestone is { dueAt: Date; submittedAt: Date } => milestone.submittedAt !== null,
  );
  return {
    averageRating: input.ratings.length
      ? Math.round((ratingTotal / input.ratings.length) * 10) / 10
      : null,
    reviewCount: input.ratings.length,
    completedJobs: input.completedJobs.length,
    completedMilestones: input.releasedMilestones.length,
    onTimeRate: submittedMilestones.length
      ? Math.round(
          (submittedMilestones.filter((milestone) => milestone.submittedAt <= milestone.dueAt)
            .length /
            submittedMilestones.length) *
            100,
        )
      : null,
    repeatClients: [...clientCounts.values()].filter((count) => count > 1).length,
    verifiedWorkCount: input.completedJobs.length,
    identityVerified: input.identityVerified,
  };
}
