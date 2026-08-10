import { desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { notifications } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { withApi } from "@/server/http/errors";
import { serialize } from "@/server/serialize";

export const GET = withApi(async () => { const { user } = await requireUser(); const records = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt)).limit(100); return Response.json({ data: serialize(records) }); });

