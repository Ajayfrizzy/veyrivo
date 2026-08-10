import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { milestones } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { requireJobParticipant } from "@/features/jobs/server/access";
import { withApi } from "@/server/http/errors";
import { serialize } from "@/server/serialize";

export const GET = withApi(async (_request: Request, context: RouteContext<"/api/jobs/[id]">) => { const { id } = await context.params; const { user } = await requireUser(); const access = await requireJobParticipant(id, user.id); const items = await db.select().from(milestones).where(eq(milestones.jobId, id)).orderBy(asc(milestones.sequence)); return Response.json({ data: serialize({ ...access, milestones: items }) }); });
