import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { identityVerifications } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { identityProvider } from "@/server/identity/provider";
import { withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";

export const GET = withApi(async () => {
  const { user } = await requireUser();
  const [record] = await db
    .select()
    .from(identityVerifications)
    .where(eq(identityVerifications.userId, user.id))
    .orderBy(desc(identityVerifications.createdAt))
    .limit(1);
  return Response.json({ data: record ?? { status: "NOT_STARTED", tier: 0 } });
});
export const POST = withApi(async (request: Request) => {
  assertSameOrigin(request);
  const { user } = await requireUser();
  const { countryCode } = z
    .object({
      countryCode: z
        .string()
        .length(2)
        .transform((value) => value.toUpperCase()),
    })
    .parse(await request.json());
  const started = await identityProvider.start({ userId: user.id, email: user.email, countryCode });
  const [record] = await db
    .insert(identityVerifications)
    .values({
      userId: user.id,
      provider: process.env.IDENTITY_PROVIDER ?? "sandbox",
      providerReference: started.reference,
      status: started.status,
      countryCode,
      riskLevel: "LOW",
    })
    .returning();
  return Response.json({ data: { ...record, redirectUrl: started.redirectUrl } }, { status: 201 });
});
