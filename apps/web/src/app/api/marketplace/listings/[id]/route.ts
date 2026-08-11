import { and, count, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { jobListings, notifications, proposals } from "@/server/db/schema";
import { getCurrentUser, requireUser } from "@/server/auth/session";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { serialize } from "@/server/serialize";
import { requireListingOwner } from "@/features/marketplace/server/access";
import { getPublicListing } from "@/features/marketplace/server/queries";
import { listingUpdateSchema } from "@/features/marketplace/server/schemas";
import { audit } from "@/server/audit";

export const GET = withApi(
  async (_request: Request, context: RouteContext<"/api/marketplace/listings/[id]">) => {
    const { id } = await context.params;
    const record = await getPublicListing(id);
    const current = await getCurrentUser();
    if (
      !record ||
      (["DRAFT", "CANCELLED"].includes(record.listing.status) &&
        record.listing.clientUserId !== current?.user.id)
    )
      throw new ApiError(404, "LISTING_NOT_FOUND", "Listing was not found.");
    const { clientUserId: _clientUserId, awardedJobId: _awardedJobId, ...listing } = record.listing;
    void _clientUserId;
    void _awardedJobId;
    return Response.json({
      data: serialize({
        listing,
        client: record.client,
        proposalCount: Number(record.proposalCount),
      }),
    });
  },
);

export const PATCH = withApi(
  async (request: Request, context: RouteContext<"/api/marketplace/listings/[id]">) => {
    assertSameOrigin(request);
    const { id } = await context.params;
    const { user } = await requireUser();
    const listing = await requireListingOwner(id, user.id);
    const input = listingUpdateSchema.parse(await request.json());
    if (["AWARDED", "CANCELLED"].includes(listing.status))
      throw new ApiError(409, "LISTING_STATE_CONFLICT", "This listing can no longer be edited.");
    const [{ value }] = await db
      .select({ value: count() })
      .from(proposals)
      .where(eq(proposals.listingId, id));
    if (value > 0 && (input.budgetMin || input.budgetMax || input.proposalDeadline))
      throw new ApiError(
        409,
        "COMMERCIAL_TERMS_LOCKED",
        "Budget and deadline are locked after the first proposal.",
      );
    const nextMin = input.budgetMin ? BigInt(input.budgetMin) : listing.budgetMin;
    const nextMax = input.budgetMax ? BigInt(input.budgetMax) : listing.budgetMax;
    if (nextMax < nextMin)
      throw new ApiError(400, "BUDGET_INVALID", "Maximum budget must be at least the minimum.");
    const values = {
      ...input,
      budgetMin: input.budgetMin ? BigInt(input.budgetMin) : undefined,
      budgetMax: input.budgetMax ? BigInt(input.budgetMax) : undefined,
      updatedAt: new Date(),
    };
    const [updated] = await db
      .update(jobListings)
      .set(values)
      .where(and(eq(jobListings.id, id), eq(jobListings.clientUserId, user.id)))
      .returning();
    if (input.description && input.description !== listing.description) {
      const workers = await db
        .select({ userId: proposals.workerUserId })
        .from(proposals)
        .where(and(eq(proposals.listingId, id), eq(proposals.status, "SUBMITTED")));
      if (workers.length)
        await db.insert(notifications).values(
          workers.map((worker) => ({
            userId: worker.userId,
            type: "LISTING_UPDATED",
            title: "Listing updated",
            body: `The description for ${listing.title} was updated. Review it before changing your proposal.`,
            href: `/discover/${id}`,
          })),
        );
    }
    await audit(request, {
      actorUserId: user.id,
      action: "listing.updated",
      entityType: "job_listing",
      entityId: id,
    });
    return Response.json({ data: serialize(updated) });
  },
);
