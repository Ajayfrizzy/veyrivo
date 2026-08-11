import { inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { profiles, users } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { requireRole } from "@/server/auth/authorization";
import { withApi } from "@/server/http/errors";
import { eq } from "drizzle-orm";

export const GET = withApi(async () => {
  const { user } = await requireUser();
  requireRole(user.systemRole, ["SUPPORT", "SUPER_ADMIN"]);
  const records = await db
    .select({ id: users.id, email: users.email, displayName: profiles.displayName })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(inArray(users.systemRole, ["SUPPORT", "SUPER_ADMIN"]));
  return Response.json({ data: records, currentUserId: user.id });
});
