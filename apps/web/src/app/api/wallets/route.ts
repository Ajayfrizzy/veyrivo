import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { wallets } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { withApi } from "@/server/http/errors";

export const GET = withApi(async () => { const { user } = await requireUser(); return Response.json({ data: await db.select().from(wallets).where(eq(wallets.userId, user.id)) }); });
