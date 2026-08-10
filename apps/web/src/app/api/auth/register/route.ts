import { sql } from "drizzle-orm";
import { db } from "@/server/db";
import { profiles, users, verificationTokens } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import { registerSchema } from "@/server/auth/schemas";
import { createSession } from "@/server/auth/session";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin, randomToken, sha256 } from "@/server/http/security";
import { audit } from "@/server/audit";

export const POST = withApi(async (request: Request) => {
  assertSameOrigin(request);
  const input = registerSchema.parse(await request.json());
  const existing = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${input.email}`).limit(1);
  if (existing.length) throw new ApiError(409, "EMAIL_ALREADY_REGISTERED", "An account already uses this email.");
  const passwordHash = await hashPassword(input.password);
  const verificationToken = randomToken();
  const user = await db.transaction(async tx => {
    const [created] = await tx.insert(users).values({ email: input.email, passwordHash }).returning();
    await tx.insert(profiles).values({ userId: created.id, displayName: input.displayName });
    await tx.insert(verificationTokens).values({ userId: created.id, purpose: "VERIFY_EMAIL", tokenHash: sha256(verificationToken), expiresAt: new Date(Date.now() + 24 * 60 * 60_000) });
    return created;
  });
  await createSession(user.id, request);
  await audit(request, { actorUserId: user.id, action: "account.registered", entityType: "user", entityId: user.id });
  return Response.json({ data: { user: { id: user.id, email: user.email, status: user.status }, verificationToken: process.env.NODE_ENV === "production" ? undefined : verificationToken } }, { status: 201 });
});
