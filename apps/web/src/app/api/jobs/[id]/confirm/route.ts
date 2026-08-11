import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { jobs, operations } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { calculateFees } from "@/features/payments/server/fee-engine";
import { audit } from "@/server/audit";

export const POST = withApi(
  async (request: Request, context: RouteContext<"/api/jobs/[id]/confirm">) => {
    assertSameOrigin(request);
    const { id } = await context.params;
    const { user } = await requireUser();
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.clientUserId, user.id)))
      .limit(1);
    if (!job) throw new ApiError(404, "JOB_NOT_FOUND", "Job was not found.");
    if (job.status !== "DRAFT" || !job.workerUserId)
      throw new ApiError(
        409,
        "JOB_STATE_CONFLICT",
        "Only an awarded agreement draft can be confirmed.",
      );
    const fees = calculateFees(job.subtotal);
    await db.transaction(async (tx) => {
      await tx
        .update(jobs)
        .set({
          status: "INVITED",
          clientFee: fees.clientFee,
          workerFeeBps: fees.workerFeeBps,
          networkReserve: fees.networkReserve,
          updatedAt: new Date(),
        })
        .where(and(eq(jobs.id, id), eq(jobs.status, "DRAFT")));
      await tx
        .insert(operations)
        .values({
          jobId: id,
          initiatedBy: user.id,
          type: "CONFIRM_DRAFT",
          idempotencyKey: `confirm-draft:${id}`,
          status: "CONFIRMED",
        })
        .onConflictDoNothing();
    });
    await audit(request, {
      actorUserId: user.id,
      action: "job.draft_confirmed",
      entityType: "job",
      entityId: id,
    });
    return Response.json({ data: { jobId: id, status: "INVITED" } });
  },
);
