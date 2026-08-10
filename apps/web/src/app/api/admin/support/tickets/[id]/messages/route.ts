import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { notifications, supportMessages, supportTicketEvents, supportTickets } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { requireRole } from "@/server/auth/authorization";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { requireSupportTicket } from "@/features/support/server/access";
import { createMessageSchema } from "@/features/support/server/schemas";
import { serialize } from "@/server/serialize";

export const POST = withApi(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(request); const { user } = await requireUser(); requireRole(user.systemRole, ["SUPPORT", "SUPER_ADMIN"]); const { id } = await context.params; const ticket = await requireSupportTicket(id); const input = createMessageSchema.parse(await request.json());
  if (ticket.status === "CLOSED") throw new ApiError(409, "SUPPORT_TICKET_CLOSED", "Reopen this ticket before replying.");
  const [message] = await db.transaction(async tx => {
    const [created] = await tx.insert(supportMessages).values({ ticketId: id, senderId: user.id, senderType: input.internal ? "SYSTEM" : "SUPPORT", message: input.message, internal: input.internal }).returning();
    await tx.update(supportTickets).set({ status: input.internal ? ticket.status : "WAITING_FOR_USER", assignedTo: ticket.assignedTo ?? user.id, lastMessageAt: new Date(), updatedAt: new Date() }).where(eq(supportTickets.id, id));
    await tx.insert(supportTicketEvents).values({ ticketId: id, actorUserId: user.id, type: input.internal ? "INTERNAL_NOTE_ADDED" : "SUPPORT_REPLIED" });
    if (!input.internal) await tx.insert(notifications).values({ userId: ticket.userId, type: "SUPPORT_REPLIED", title: `Support replied to ${ticket.reference}`, body: input.message.slice(0, 180), href: `/support/${id}` });
    return [created];
  });
  return Response.json({ data: serialize(message) }, { status: 201 });
});
