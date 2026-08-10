import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { supportAttachments, supportMessages } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { isSupportAdmin, requireSupportTicket } from "@/features/support/server/access";
import { storePrivateFile } from "@/server/files/storage";
import { serialize } from "@/server/serialize";

export const POST = withApi(async (request: Request, context: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(request); const { user } = await requireUser(); const { id } = await context.params; const ticket = await requireSupportTicket(id);
  if (ticket.userId !== user.id && !isSupportAdmin(user.systemRole)) throw new ApiError(404, "SUPPORT_TICKET_NOT_FOUND", "Support ticket was not found.");
  const form = await request.formData(); const file = form.get("file"); const messageId = form.get("messageId");
  if (!(file instanceof File) || typeof messageId !== "string") throw new ApiError(400, "SUPPORT_ATTACHMENT_INVALID", "Provide a file and message ID.");
  const [message] = await db.select().from(supportMessages).where(and(eq(supportMessages.id, messageId), eq(supportMessages.ticketId, id))).limit(1);
  if (!message || message.senderId !== user.id) throw new ApiError(403, "SUPPORT_ATTACHMENT_FORBIDDEN", "Attach files only to your own message.");
  const stored = await storePrivateFile(file);
  const [attachment] = await db.insert(supportAttachments).values({ messageId, ...stored, originalName: file.name, contentType: file.type, scanStatus: "CLEAN" }).returning();
  return Response.json({ data: serialize(attachment) }, { status: 201 });
});
