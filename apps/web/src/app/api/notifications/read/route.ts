import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/server/db";
import { notifications } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";

export const POST = withApi(async (request: Request) => { assertSameOrigin(request); const { user } = await requireUser(); await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))); return Response.json({ data: { success: true } }); });

