import { asc, eq } from "drizzle-orm";
import { audit } from "@/server/audit";
import { requireUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { notifications, operations, profiles, proposalMessages } from "@/server/db/schema";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { requireProposalParticipant } from "@/features/marketplace/server/access";
import { proposalMessageInputSchema } from "@/features/marketplace/server/schemas";

export const GET = withApi(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const { user } = await requireUser();
    await requireProposalParticipant(id, user.id);
    const messages = await db
      .select({
        id: proposalMessages.id,
        senderUserId: proposalMessages.senderUserId,
        senderName: profiles.displayName,
        body: proposalMessages.body,
        editedAt: proposalMessages.editedAt,
        createdAt: proposalMessages.createdAt,
      })
      .from(proposalMessages)
      .innerJoin(profiles, eq(proposalMessages.senderUserId, profiles.userId))
      .where(eq(proposalMessages.proposalId, id))
      .orderBy(asc(proposalMessages.createdAt));
    return Response.json({ data: messages });
  },
);

export const POST = withApi(
  async (request: Request, context: { params: Promise<{ id: string }> }) => {
    assertSameOrigin(request);
    const { id } = await context.params;
    const { user } = await requireUser();
    const record = await requireProposalParticipant(id, user.id);
    if (record.proposal.status !== "SUBMITTED")
      throw new ApiError(409, "THREAD_CLOSED", "This pre-hire clarification thread is closed.");
    const suppliedKey = request.headers.get("idempotency-key");
    if (!suppliedKey || suppliedKey.length > 100)
      throw new ApiError(
        400,
        "IDEMPOTENCY_KEY_REQUIRED",
        "Provide a valid Idempotency-Key header.",
      );
    const idempotencyKey = `proposal-message:${user.id}:${suppliedKey}`;
    const [prior] = await db
      .select()
      .from(operations)
      .where(eq(operations.idempotencyKey, idempotencyKey))
      .limit(1);
    const priorMessageId =
      prior?.metadata && typeof prior.metadata === "object" && "messageId" in prior.metadata
        ? String(prior.metadata.messageId)
        : null;
    if (priorMessageId) {
      const [existing] = await db
        .select()
        .from(proposalMessages)
        .where(eq(proposalMessages.id, priorMessageId))
        .limit(1);
      if (existing) return Response.json({ data: existing, idempotentReplay: true });
    }
    const input = proposalMessageInputSchema.parse(await request.json());
    const recipientUserId =
      user.id === record.listing.clientUserId
        ? record.proposal.workerUserId
        : record.listing.clientUserId;
    const message = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(proposalMessages)
        .values({ proposalId: id, senderUserId: user.id, body: input.body })
        .returning();
      await tx.insert(notifications).values({
        userId: recipientUserId,
        type: "PROPOSAL_MESSAGE",
        title: "New proposal clarification",
        body: `A participant sent a message about ${record.listing.title}.`,
        href: `/discover/${record.listing.id}`,
      });
      await tx.insert(operations).values({
        initiatedBy: user.id,
        type: "SEND_PROPOSAL_MESSAGE",
        idempotencyKey,
        status: "CONFIRMED",
        metadata: { messageId: created.id, proposalId: id },
      });
      return created;
    });
    await audit(request, {
      actorUserId: user.id,
      action: "proposal.message_sent",
      entityType: "proposal_message",
      entityId: message.id,
      metadata: { proposalId: id },
    });
    return Response.json({ data: message }, { status: 201 });
  },
);
