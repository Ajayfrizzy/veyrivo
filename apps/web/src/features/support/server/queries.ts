import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db";
import {
  profiles,
  supportAttachments,
  supportMessages,
  supportTicketEvents,
  supportTickets,
  users,
} from "@/server/db/schema";

export async function ticketDetail(ticketId: string, includeInternal: boolean) {
  const [record] = await db
    .select({
      ticket: supportTickets,
      customerEmail: users.email,
      customerName: profiles.displayName,
    })
    .from(supportTickets)
    .innerJoin(users, eq(users.id, supportTickets.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(supportTickets.id, ticketId))
    .limit(1);
  if (!record) return null;
  const messages = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.ticketId, ticketId))
    .orderBy(asc(supportMessages.createdAt));
  const visibleMessages = includeInternal
    ? messages
    : messages.filter((message) => !message.internal);
  const attachments = visibleMessages.length
    ? await db
        .select()
        .from(supportAttachments)
        .where(
          inArray(
            supportAttachments.messageId,
            visibleMessages.map((message) => message.id),
          ),
        )
    : [];
  const events = includeInternal
    ? await db
        .select()
        .from(supportTicketEvents)
        .where(eq(supportTicketEvents.ticketId, ticketId))
        .orderBy(desc(supportTicketEvents.createdAt))
    : [];
  return { ...record, messages: visibleMessages, attachments, events };
}
