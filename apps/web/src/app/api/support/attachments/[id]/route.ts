import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { supportAttachments, supportMessages, supportTickets } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { ApiError, withApi } from "@/server/http/errors";
import { isSupportAdmin } from "@/features/support/server/access";
import { readPrivateFile } from "@/server/files/storage";

export const GET = withApi(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const { user } = await requireUser();
    const { id } = await context.params;
    const [record] = await db
      .select({ attachment: supportAttachments, ticket: supportTickets, message: supportMessages })
      .from(supportAttachments)
      .innerJoin(supportMessages, eq(supportMessages.id, supportAttachments.messageId))
      .innerJoin(supportTickets, eq(supportTickets.id, supportMessages.ticketId))
      .where(eq(supportAttachments.id, id))
      .limit(1);
    if (
      !record ||
      (record.ticket.userId !== user.id && !isSupportAdmin(user.systemRole)) ||
      (record.message.internal && !isSupportAdmin(user.systemRole)) ||
      record.attachment.scanStatus !== "CLEAN"
    )
      throw new ApiError(404, "SUPPORT_ATTACHMENT_NOT_FOUND", "Attachment was not found.");
    const bytes = await readPrivateFile(record.attachment.storageKey);
    return new Response(bytes, {
      headers: {
        "Content-Type": record.attachment.contentType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(record.attachment.originalName)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
);
