import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { sessions, users, verificationTokens } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import { resetPasswordSchema } from "@/server/auth/schemas";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin, sha256 } from "@/server/http/security";

export const POST = withApi(async (request: Request) => {
  assertSameOrigin(request);
  const input = resetPasswordSchema.parse(await request.json());
  const [record] = await db.select().from(verificationTokens).where(and(eq(verificationTokens.tokenHash, sha256(input.token)), eq(verificationTokens.purpose, "RESET_PASSWORD"), isNull(verificationTokens.consumedAt), gt(verificationTokens.expiresAt, new Date()))).limit(1);
  if (!record) throw new ApiError(400, "RESET_TOKEN_INVALID", "The password reset link is invalid or expired.");
  const passwordHash = await hashPassword(input.password);
  await db.transaction(async tx => { await tx.update(users).set({ passwordHash, failedLoginCount: 0, lockedUntil: null, updatedAt: new Date() }).where(eq(users.id, record.userId)); await tx.update(verificationTokens).set({ consumedAt: new Date() }).where(eq(verificationTokens.id, record.id)); await tx.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, record.userId)); });
  return Response.json({ data: { reset: true } });
});
