import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/server/db";
import { profiles, supportTickets, users } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { requireRole } from "@/server/auth/authorization";
import { withApi } from "@/server/http/errors";
import { serialize } from "@/server/serialize";
import { ticketCategory, ticketPriority, ticketStatus } from "@/features/support/server/schemas";

export const GET = withApi(async (request: Request) => {
  const { user } = await requireUser(); requireRole(user.systemRole, ["SUPPORT", "SUPER_ADMIN"]);
  const params = new URL(request.url).searchParams; const clauses: SQL[] = [];
  const status = ticketStatus.safeParse(params.get("status")); if (status.success) clauses.push(eq(supportTickets.status, status.data));
  const priority = ticketPriority.safeParse(params.get("priority")); if (priority.success) clauses.push(eq(supportTickets.priority, priority.data));
  const category = ticketCategory.safeParse(params.get("category")); if (category.success) clauses.push(eq(supportTickets.category, category.data));
  const assignedTo = params.get("assignedTo"); if (assignedTo) clauses.push(eq(supportTickets.assignedTo, assignedTo));
  const query = params.get("q")?.trim(); if (query) clauses.push(or(ilike(supportTickets.reference, `%${query}%`), ilike(supportTickets.subject, `%${query}%`), ilike(users.email, `%${query}%`))!);
  const records = await db.select({ ticket: supportTickets, customerEmail: users.email, customerName: profiles.displayName })
    .from(supportTickets).innerJoin(users, eq(users.id, supportTickets.userId)).leftJoin(profiles, eq(profiles.userId, users.id))
    .where(clauses.length ? and(...clauses) : undefined).orderBy(desc(supportTickets.lastMessageAt)).limit(200);
  return Response.json({ data: serialize(records) });
});

