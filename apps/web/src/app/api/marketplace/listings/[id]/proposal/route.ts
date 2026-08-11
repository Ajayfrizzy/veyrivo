import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { jobListings, notifications, proposalMilestones, proposals } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { serialize } from "@/server/serialize";
import {
  assertListingAcceptsProposals,
  requireProposalEligibility,
} from "@/features/marketplace/server/access";
import { proposalInputSchema } from "@/features/marketplace/server/schemas";
import { audit } from "@/server/audit";

async function owned(listingId: string, userId: string) {
  const [record] = await db
    .select({ proposal: proposals, listing: jobListings })
    .from(proposals)
    .innerJoin(jobListings, eq(proposals.listingId, jobListings.id))
    .where(and(eq(proposals.listingId, listingId), eq(proposals.workerUserId, userId)))
    .limit(1);
  if (!record) throw new ApiError(404, "PROPOSAL_NOT_FOUND", "Proposal was not found.");
  return record;
}

export const GET = withApi(
  async (_request: Request, context: RouteContext<"/api/marketplace/listings/[id]/proposal">) => {
    const { id } = await context.params;
    const { user } = await requireUser();
    const record = await owned(id, user.id);
    const milestones = await db
      .select()
      .from(proposalMilestones)
      .where(eq(proposalMilestones.proposalId, record.proposal.id))
      .orderBy(asc(proposalMilestones.sequence));
    return Response.json({ data: serialize({ ...record.proposal, milestones }) });
  },
);

export const PATCH = withApi(
  async (request: Request, context: RouteContext<"/api/marketplace/listings/[id]/proposal">) => {
    assertSameOrigin(request);
    const { id } = await context.params;
    const { user } = await requireUser();
    await requireProposalEligibility(user.id, user.emailVerifiedAt);
    const record = await owned(id, user.id);
    assertListingAcceptsProposals(record.listing);
    if (record.proposal.status !== "SUBMITTED")
      throw new ApiError(409, "PROPOSAL_STATE_CONFLICT", "This proposal can no longer be edited.");
    const input = proposalInputSchema.parse(await request.json());
    if (
      BigInt(input.totalBid) < record.listing.budgetMin ||
      BigInt(input.totalBid) > record.listing.budgetMax
    )
      throw new ApiError(400, "BID_OUTSIDE_BUDGET", "The bid must be within the listing budget.");
    await db.transaction(async (tx) => {
      await tx
        .update(proposals)
        .set({
          coverLetter: input.coverLetter,
          totalBid: BigInt(input.totalBid),
          estimatedDurationDays: input.estimatedDurationDays,
          updatedAt: new Date(),
        })
        .where(eq(proposals.id, record.proposal.id));
      await tx
        .delete(proposalMilestones)
        .where(eq(proposalMilestones.proposalId, record.proposal.id));
      await tx.insert(proposalMilestones).values(
        input.milestones.map((item, index) => ({
          ...item,
          amount: BigInt(item.amount),
          proposalId: record.proposal.id,
          sequence: index + 1,
        })),
      );
    });
    await audit(request, {
      actorUserId: user.id,
      action: "proposal.updated",
      entityType: "proposal",
      entityId: record.proposal.id,
    });
    return Response.json({ data: { id: record.proposal.id, updated: true } });
  },
);

export const DELETE = withApi(
  async (request: Request, context: RouteContext<"/api/marketplace/listings/[id]/proposal">) => {
    assertSameOrigin(request);
    const { id } = await context.params;
    const { user } = await requireUser();
    const record = await owned(id, user.id);
    assertListingAcceptsProposals(record.listing);
    if (record.proposal.status !== "SUBMITTED")
      throw new ApiError(
        409,
        "PROPOSAL_STATE_CONFLICT",
        "This proposal can no longer be withdrawn.",
      );
    await db.transaction(async (tx) => {
      await tx
        .update(proposals)
        .set({ status: "WITHDRAWN", withdrawnAt: new Date(), updatedAt: new Date() })
        .where(eq(proposals.id, record.proposal.id));
      await tx.insert(notifications).values({
        userId: record.listing.clientUserId,
        type: "PROPOSAL_WITHDRAWN",
        title: "Proposal withdrawn",
        body: `A worker withdrew a proposal for ${record.listing.title}.`,
        href: `/discover/${id}`,
      });
    });
    await audit(request, {
      actorUserId: user.id,
      action: "proposal.withdrawn",
      entityType: "proposal",
      entityId: record.proposal.id,
    });
    return Response.json({ data: { id: record.proposal.id, status: "WITHDRAWN" } });
  },
);
