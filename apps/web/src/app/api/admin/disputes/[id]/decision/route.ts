import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { disputeDecisions, disputes, milestones, operations } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { requireRole } from "@/server/auth/authorization";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";

const schema = z
  .object({
    workerShareBps: z.number().int().min(0).max(10000),
    clientRefundBps: z.number().int().min(0).max(10000),
    rationale: z.string().trim().min(30).max(5000),
    approvedBy: z.string().uuid().optional(),
  })
  .refine(
    (value) => value.workerShareBps + value.clientRefundBps === 10000,
    "The payment and refund shares must total 100%.",
  );
export const POST = withApi(
  async (request: Request, context: RouteContext<"/api/admin/disputes/[id]/decision">) => {
    assertSameOrigin(request);
    const { user } = await requireUser();
    requireRole(user.systemRole, ["DISPUTE_ADMIN", "SUPER_ADMIN"]);
    const { id } = await context.params;
    const input = schema.parse(await request.json());
    const [dispute] = await db.select().from(disputes).where(eq(disputes.id, id)).limit(1);
    if (!dispute || ["RESOLVED", "CLOSED"].includes(dispute.status))
      throw new ApiError(
        409,
        "DISPUTE_STATE_INVALID",
        "The dispute is not available for a decision.",
      );
    if (input.approvedBy === user.id)
      throw new ApiError(
        400,
        "SECOND_APPROVER_INVALID",
        "The second approver must be a different administrator.",
      );
    await db.transaction(async (tx) => {
      await tx.insert(disputeDecisions).values({
        disputeId: id,
        decidedBy: user.id,
        approvedBy: input.approvedBy,
        workerShareBps: input.workerShareBps,
        clientRefundBps: input.clientRefundBps,
        rationale: input.rationale,
      });
      await tx
        .update(disputes)
        .set({ status: "RESOLVED", resolvedAt: new Date(), updatedAt: new Date() })
        .where(eq(disputes.id, id));
      if (dispute.milestoneId)
        await tx
          .update(milestones)
          .set({ status: "SECURITY_HOLD", updatedAt: new Date() })
          .where(eq(milestones.id, dispute.milestoneId));
      await tx.insert(operations).values({
        jobId: dispute.jobId,
        milestoneId: dispute.milestoneId,
        initiatedBy: user.id,
        type: "DISPUTE_SETTLEMENT",
        idempotencyKey: `dispute-settlement:${id}`,
        status: "PENDING",
        metadata: input,
      });
    });
    return Response.json({
      data: { disputeId: id, status: "RESOLVED", settlementStatus: "PENDING" },
    });
  },
);
