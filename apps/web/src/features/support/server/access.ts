import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { supportTickets } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";

export const supportRoles = ["SUPPORT", "SUPER_ADMIN"];
export const isSupportAdmin = (role: string) => supportRoles.includes(role);

export async function requireOwnedTicket(ticketId: string, userId: string) {
  const [ticket] = await db.select().from(supportTickets).where(and(eq(supportTickets.id, ticketId), eq(supportTickets.userId, userId))).limit(1);
  if (!ticket) throw new ApiError(404, "SUPPORT_TICKET_NOT_FOUND", "Support ticket was not found.");
  return ticket;
}

export async function requireSupportTicket(ticketId: string) {
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
  if (!ticket) throw new ApiError(404, "SUPPORT_TICKET_NOT_FOUND", "Support ticket was not found.");
  return ticket;
}

