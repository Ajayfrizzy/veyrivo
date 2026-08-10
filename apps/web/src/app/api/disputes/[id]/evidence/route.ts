import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db";
import { disputeEvidence, disputes, jobs, proofFiles } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { serialize } from "@/server/serialize";

const schema = z.object({ note: z.string().trim().min(10).max(5000), fileId: z.string().uuid().optional() });
export const POST = withApi(async (request: Request, context: RouteContext<"/api/disputes/[id]/evidence">) => {
  assertSameOrigin(request); const { user } = await requireUser(); const { id } = await context.params; const input = schema.parse(await request.json());
  const [record] = await db.select({ dispute: disputes, job: jobs }).from(disputes).innerJoin(jobs, eq(jobs.id, disputes.jobId)).where(eq(disputes.id, id)).limit(1);
  if (!record || ![record.job.clientUserId, record.job.workerUserId].includes(user.id)) throw new ApiError(404, "DISPUTE_NOT_FOUND", "Dispute was not found.");
  if (!['OPEN', 'EVIDENCE_COLLECTION'].includes(record.dispute.status) || record.dispute.evidenceDueAt < new Date()) throw new ApiError(409, "EVIDENCE_WINDOW_CLOSED", "The evidence window has closed.");
  if (input.fileId) { const [file] = await db.select().from(proofFiles).where(eq(proofFiles.id, input.fileId)).limit(1); if (!file) throw new ApiError(400, "FILE_NOT_FOUND", "The evidence file was not found."); }
  const [created] = await db.insert(disputeEvidence).values({ disputeId: id, submittedBy: user.id, note: input.note, fileId: input.fileId }).returning();
  return Response.json({ data: serialize(created) }, { status: 201 });
});
