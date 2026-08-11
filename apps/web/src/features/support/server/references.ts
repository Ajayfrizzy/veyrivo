import { and, eq, or } from "drizzle-orm";
import { db } from "@/server/db";
import { disputes, jobs, operations } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";

export async function validateOwnedReference(reference: string | undefined, userId: string) {
  if (!reference) return;
  const participant = or(eq(jobs.clientUserId, userId), eq(jobs.workerUserId, userId));
  const [job] = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.reference, reference), participant))
    .limit(1);
  if (job) return;
  const [dispute] = await db
    .select({ id: disputes.id })
    .from(disputes)
    .innerJoin(jobs, eq(jobs.id, disputes.jobId))
    .where(and(eq(disputes.reference, reference), participant))
    .limit(1);
  if (dispute) return;
  const [operation] = await db
    .select({ id: operations.id })
    .from(operations)
    .innerJoin(jobs, eq(jobs.id, operations.jobId))
    .where(and(eq(operations.externalReference, reference), participant))
    .limit(1);
  if (!operation)
    throw new ApiError(
      400,
      "SUPPORT_REFERENCE_INVALID",
      "The reference was not found in your account.",
    );
}
