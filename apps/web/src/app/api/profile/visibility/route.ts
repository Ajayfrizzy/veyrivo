import { eq } from "drizzle-orm";
import { audit } from "@/server/audit";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { profiles } from "@/server/db/schema";
import { assertProfileCanBePublished } from "@/features/talent/server/publication";
import { profileVisibilitySchema } from "@/features/talent/server/schemas";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";

export const PATCH = withApi(async (request: Request) => {
  assertSameOrigin(request);
  const { user } = await requireUser();
  const input = profileVisibilitySchema.parse(await request.json());
  const [storedProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .limit(1);
  if (!storedProfile)
    throw new ApiError(404, "PROFILE_NOT_FOUND", "Your professional profile was not found.");
  if (input.isPublic) assertProfileCanBePublished(storedProfile);

  const [profile] = await db
    .update(profiles)
    .set({ isPublic: input.isPublic, updatedAt: new Date() })
    .where(eq(profiles.userId, user.id))
    .returning();
  await audit(request, {
    actorUserId: user.id,
    action: input.isPublic ? "profile.published" : "profile.made_private",
    entityType: "profile",
    entityId: user.id,
  });
  return Response.json({ data: profile });
});
