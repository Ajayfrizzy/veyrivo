import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { identityVerifications } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";

export const POST = withApi(async (request: Request) => {
  assertSameOrigin(request);
  if (process.env.IDENTITY_PROVIDER !== "sandbox" && process.env.NODE_ENV === "production")
    throw new ApiError(404, "NOT_FOUND", "Not found.");
  const { user } = await requireUser();
  const { verificationId, outcome } = z
    .object({ verificationId: z.string().uuid(), outcome: z.enum(["VERIFIED", "REJECTED"]) })
    .parse(await request.json());
  const [updated] = await db
    .update(identityVerifications)
    .set({
      status: outcome,
      verifiedAt: outcome === "VERIFIED" ? new Date() : null,
      expiresAt: outcome === "VERIFIED" ? new Date(Date.now() + 365 * 86_400_000) : null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(identityVerifications.id, verificationId), eq(identityVerifications.userId, user.id)),
    )
    .returning();
  if (!updated)
    throw new ApiError(404, "IDENTITY_VERIFICATION_NOT_FOUND", "Verification was not found.");
  return Response.json({ data: updated });
});
