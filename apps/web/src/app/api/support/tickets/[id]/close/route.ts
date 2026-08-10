import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { supportTicketEvents, supportTickets } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { requireOwnedTicket } from "@/features/support/server/access";

export const POST = withApi(async (request: Request, context: RouteContext<"/api/support/tickets/[id]/close">) => {
  assertSameOrigin(request); const { user } = await requireUser(); const { id } = await context.params; await requireOwnedTicket(id, user.id);
  await db.transaction(async tx => { await tx.update(supportTickets).set({ status: "CLOSED", closedAt: new Date(), updatedAt: new Date() }).where(eq(supportTickets.id, id)); await tx.insert(supportTicketEvents).values({ ticketId: id, actorUserId: user.id, type: "CLOSED_BY_USER" }); });
  return Response.json({ data: { id, status: "CLOSED" } });
});
