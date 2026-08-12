import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { audit } from "@/server/audit";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { jobListings, notifications, proposals } from "@/server/db/schema";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { shortlistInputSchema } from "@/features/marketplace/server/schemas";
import { canShortlistProposal } from "@/features/marketplace/server/access";

export const PATCH = withApi(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    assertSameOrigin(request);
    const { id } = await context.params;
    const { user } = await requireUser();
    const input = shortlistInputSchema.parse(await request.json());
    const [record] = await db
      .select({ proposal: proposals, listing: jobListings })
      .from(proposals)
      .innerJoin(jobListings, eq(proposals.listingId, jobListings.id))
      .where(eq(proposals.id, id))
      .limit(1);
    if (!record || record.listing.clientUserId !== user.id)
      throw new ApiError(404, "PROPOSAL_NOT_FOUND", "Proposal was not found.");
    if (!canShortlistProposal(record.listing.clientUserId, user.id, record.proposal.status))
      throw new ApiError(
        409,
        "PROPOSAL_STATE_CONFLICT",
        "Only submitted proposals can be shortlisted.",
      );
    const now = new Date();
    const [changed] = await db
      .update(proposals)
      .set({
        shortlistedAt: input.shortlisted ? now : null,
        shortlistedBy: input.shortlisted ? user.id : null,
        updatedAt: now,
      })
      .where(
        and(
          eq(proposals.id, id),
          input.shortlisted ? isNull(proposals.shortlistedAt) : isNotNull(proposals.shortlistedAt),
        ),
      )
      .returning();
    if (input.shortlisted && changed)
      await db.insert(notifications).values({
        userId: record.proposal.workerUserId,
        type: "PROPOSAL_SHORTLISTED",
        title: "Proposal shortlisted",
        body: `Your proposal for ${record.listing.title} was shortlisted.`,
        href: `/discover/${record.listing.id}`,
      });
    await audit(request, {
      actorUserId: user.id,
      action: input.shortlisted ? "proposal.shortlisted" : "proposal.shortlist_removed",
      entityType: "proposal",
      entityId: id,
      metadata: { listingId: record.listing.id },
    });
    return Response.json({
      data: {
        id: record.proposal.id,
        shortlistedAt:
          changed?.shortlistedAt ?? (input.shortlisted ? record.proposal.shortlistedAt : null),
        changed: Boolean(changed),
      },
    });
  },
);
