import { db } from "@/server/db";
import { jobListings } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { serialize } from "@/server/serialize";
import { listingInputSchema, listingQuerySchema } from "@/features/marketplace/server/schemas";
import { listPublicListings } from "@/features/marketplace/server/queries";
import { audit } from "@/server/audit";

export const GET = withApi(async (request: Request) => {
  const url = new URL(request.url);
  const input = listingQuerySchema.parse(Object.fromEntries(url.searchParams));
  const result = await listPublicListings(input);
  const data = result.data.map(({ listing, client, proposalCount }) => {
    const { clientUserId: _clientUserId, awardedJobId: _awardedJobId, ...publicListing } = listing;
    void _clientUserId;
    void _awardedJobId;
    return { listing: publicListing, client, proposalCount: Number(proposalCount) };
  });
  return Response.json({ data: serialize(data), nextCursor: result.nextCursor });
});

export const POST = withApi(async (request: Request) => {
  assertSameOrigin(request);
  const { user } = await requireUser();
  const input = listingInputSchema.parse(await request.json());
  const [listing] = await db
    .insert(jobListings)
    .values({
      ...input,
      budgetMin: BigInt(input.budgetMin),
      budgetMax: BigInt(input.budgetMax),
      clientUserId: user.id,
    })
    .returning();
  await audit(request, {
    actorUserId: user.id,
    action: "listing.created",
    entityType: "job_listing",
    entityId: listing.id,
  });
  return Response.json({ data: serialize(listing) }, { status: 201 });
});
