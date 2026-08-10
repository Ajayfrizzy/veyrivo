import { and, eq, or } from "drizzle-orm";
import { db } from "@/server/db";
import { jobs, milestones, proofFiles, proofSubmissions } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { ApiError, withApi } from "@/server/http/errors";
import { readPrivateFile } from "@/server/files/storage";

export const GET = withApi(async (_request: Request, context: RouteContext<"/api/files/[id]">) => {
  const { user } = await requireUser(); const { id } = await context.params;
  const [record] = await db.select({ file: proofFiles }).from(proofFiles).innerJoin(proofSubmissions, eq(proofSubmissions.id, proofFiles.proofSubmissionId)).innerJoin(milestones, eq(milestones.id, proofSubmissions.milestoneId)).innerJoin(jobs, eq(jobs.id, milestones.jobId)).where(and(eq(proofFiles.id, id), or(eq(jobs.clientUserId, user.id), eq(jobs.workerUserId, user.id)))).limit(1);
  if (!record || record.file.scanStatus !== "CLEAN") throw new ApiError(404, "FILE_NOT_FOUND", "File was not found or is not available.");
  const bytes = await readPrivateFile(record.file.storageKey);
  return new Response(bytes, { headers: { "Content-Type": record.file.contentType, "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(record.file.originalName)}`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
});
