import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { jobListings, profiles, proposals } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";

export async function requireListingOwner(listingId: string, userId: string) {
  const [listing] = await db
    .select()
    .from(jobListings)
    .where(and(eq(jobListings.id, listingId), eq(jobListings.clientUserId, userId)))
    .limit(1);
  if (!listing) throw new ApiError(404, "LISTING_NOT_FOUND", "Listing was not found.");
  return listing;
}

export async function requireProposalOwner(proposalId: string, userId: string) {
  const [record] = await db
    .select({ proposal: proposals, listing: jobListings })
    .from(proposals)
    .innerJoin(jobListings, eq(proposals.listingId, jobListings.id))
    .where(and(eq(proposals.id, proposalId), eq(proposals.workerUserId, userId)))
    .limit(1);
  if (!record) throw new ApiError(404, "PROPOSAL_NOT_FOUND", "Proposal was not found.");
  return record;
}

export async function requireProposalEligibility(userId: string, emailVerifiedAt: Date | null) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!emailVerifiedAt)
    throw new ApiError(
      403,
      "EMAIL_VERIFICATION_REQUIRED",
      "Verify your email before submitting a proposal.",
    );
  if (!profile?.displayName.trim() || !profile.headline?.trim() || !profile.bio?.trim())
    throw new ApiError(
      403,
      "PROFILE_INCOMPLETE",
      "Add a display name, headline, and bio before submitting a proposal.",
    );
  return profile;
}

export function assertListingAcceptsProposals(listing: typeof jobListings.$inferSelect) {
  if (listing.status !== "OPEN" || listing.proposalDeadline <= new Date())
    throw new ApiError(409, "LISTING_CLOSED", "This listing is no longer accepting proposals.");
}
