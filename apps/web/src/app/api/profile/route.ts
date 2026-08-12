import { desc, eq } from "drizzle-orm";
import { audit } from "@/server/audit";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { portfolioItems, profiles } from "@/server/db/schema";
import { withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { profileInputSchema } from "@/features/talent/server/schemas";
import { assertProfileCanBePublished } from "@/features/talent/server/publication";

export const GET = withApi(async () => {
  const { user } = await requireUser();
  const [profile, portfolio] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1),
    db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.userId, user.id))
      .orderBy(desc(portfolioItems.createdAt)),
  ]);
  return Response.json({ data: { profile: profile[0] ?? null, portfolio } });
});

export const PATCH = withApi(async (request: Request) => {
  assertSameOrigin(request);
  const { user } = await requireUser();
  const input = profileInputSchema.parse(await request.json());
  const [storedProfile] = await db
    .select({ isPublic: profiles.isPublic })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);
  if (storedProfile?.isPublic) assertProfileCanBePublished(input);
  const [profile] = await db
    .update(profiles)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(profiles.userId, user.id))
    .returning();
  await audit(request, {
    actorUserId: user.id,
    action: "profile.updated",
    entityType: "profile",
    entityId: user.id,
  });
  return Response.json({ data: profile });
});
