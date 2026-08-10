import { and, eq, or } from "drizzle-orm";
import { db } from "@/server/db";
import { jobs, milestones } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";

export async function requireJobParticipant(jobId: string, userId: string) {
  const [job] = await db.select().from(jobs).where(and(eq(jobs.id, jobId), or(eq(jobs.clientUserId, userId), eq(jobs.workerUserId, userId)))).limit(1);
  if (!job) throw new ApiError(404, "JOB_NOT_FOUND", "Job was not found.");
  return { job, role: job.clientUserId === userId ? "CLIENT" as const : "WORKER" as const };
}

export async function requireMilestoneParticipant(milestoneId: string, userId: string) {
  const [record] = await db.select({ milestone: milestones, job: jobs }).from(milestones).innerJoin(jobs, eq(jobs.id, milestones.jobId)).where(and(eq(milestones.id, milestoneId), or(eq(jobs.clientUserId, userId), eq(jobs.workerUserId, userId)))).limit(1);
  if (!record) throw new ApiError(404, "MILESTONE_NOT_FOUND", "Milestone was not found.");
  return { ...record, role: record.job.clientUserId === userId ? "CLIENT" as const : "WORKER" as const };
}
