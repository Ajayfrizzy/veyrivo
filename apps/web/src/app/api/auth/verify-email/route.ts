import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { users, verificationTokens } from "@/server/db/schema";
import { withApi, ApiError } from "@/server/http/errors";
import { assertSameOrigin, sha256 } from "@/server/http/security";
import { z } from "zod";

export const POST = withApi(async (request: Request) => {
  assertSameOrigin(request);
  const { token } = z.object({ token: z.string().min(20) }).parse(await request.json());
  const [record] = await db.select().from(verificationTokens).where(and(eq(verificationTokens.tokenHash, sha256(token)), eq(verificationTokens.purpose, "VERIFY_EMAIL"), isNull(verificationTokens.consumedAt), gt(verificationTokens.expiresAt, new Date()))).limit(1);
  if (!record) throw new ApiError(400, "VERIFICATION_TOKEN_INVALID", "The verification link is invalid or expired.");
  await db.transaction(async tx => { await tx.update(verificationTokens).set({ consumedAt: new Date() }).where(eq(verificationTokens.id, record.id)); await tx.update(users).set({ emailVerifiedAt: new Date(), status: "ACTIVE", updatedAt: new Date() }).where(eq(users.id, record.userId)); });
  return Response.json({ data: { verified: true } });
});
