import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { users, verificationTokens } from "@/server/db/schema";
import { withApi } from "@/server/http/errors";
import { assertSameOrigin, randomToken, sha256 } from "@/server/http/security";

export const POST = withApi(async (request: Request) => {
  assertSameOrigin(request);
  const { email } = z.object({ email: z.string().email().transform(value => value.toLowerCase()) }).parse(await request.json());
  const [user] = await db.select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  let token: string | undefined;
  if (user) { token = randomToken(); await db.insert(verificationTokens).values({ userId: user.id, purpose: "RESET_PASSWORD", tokenHash: sha256(token), expiresAt: new Date(Date.now() + 60 * 60_000) }); }
  return Response.json({ data: { accepted: true, resetToken: process.env.NODE_ENV === "production" ? undefined : token } });
});
