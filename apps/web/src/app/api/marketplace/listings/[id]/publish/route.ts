import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { jobListings } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { serialize } from "@/server/serialize";
import { requireListingOwner } from "@/features/marketplace/server/access";
import { audit } from "@/server/audit";

export const POST = withApi(
  async (request: Request, context: RouteContext<"/api/marketplace/listings/[id]/publish">) => {
    assertSameOrigin(request);
    const { id } = await context.params;
    const { user } = await requireUser();
    const listing = await requireListingOwner(id, user.id);
    if (listing.status !== "DRAFT" || listing.proposalDeadline <= new Date())
      throw new ApiError(409, "LISTING_STATE_CONFLICT", "Only a current draft can be published.");
    const [updated] = await db
      .update(jobListings)
      .set({ status: "OPEN", publishedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(jobListings.id, id), eq(jobListings.status, "DRAFT")))
      .returning();
    await audit(request, {
      actorUserId: user.id,
      action: "listing.published",
      entityType: "job_listing",
      entityId: id,
    });
    return Response.json({ data: serialize(updated) });
  },
);
