import { count, eq, sum } from "drizzle-orm";
import { db } from "@/server/db";
import { jobs, milestones, proofFiles, proofSubmissions } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { MAX_PROOF_BYTES, MAX_PROOF_FILES, storePrivateFile } from "@/server/files/storage";
import { serialize } from "@/server/serialize";

export const POST = withApi(
  async (request: Request, context: RouteContext<"/api/proofs/[id]/files">) => {
    assertSameOrigin(request);
    const { user } = await requireUser();
    const { id } = await context.params;
    const [proof] = await db
      .select({ proof: proofSubmissions, workerId: jobs.workerUserId })
      .from(proofSubmissions)
      .innerJoin(milestones, eq(milestones.id, proofSubmissions.milestoneId))
      .innerJoin(jobs, eq(jobs.id, milestones.jobId))
      .where(eq(proofSubmissions.id, id))
      .limit(1);
    if (!proof || proof.workerId !== user.id)
      throw new ApiError(404, "PROOF_NOT_FOUND", "Proof was not found.");
    const form = await request.formData();
    const files = form.getAll("files").filter((value): value is File => value instanceof File);
    if (!files.length) throw new ApiError(400, "FILES_REQUIRED", "Add at least one proof file.");
    const [usage] = await db
      .select({ fileCount: count(), bytes: sum(proofFiles.sizeBytes) })
      .from(proofFiles)
      .where(eq(proofFiles.proofSubmissionId, id));
    const existingBytes = Number(usage.bytes ?? 0);
    const incomingBytes = files.reduce((total, file) => total + file.size, 0);
    if (
      Number(usage.fileCount) + files.length > MAX_PROOF_FILES ||
      existingBytes + incomingBytes > MAX_PROOF_BYTES
    )
      throw new ApiError(
        413,
        "PROOF_LIMIT_EXCEEDED",
        "A proof may contain at most 10 files and 100 MB total.",
      );
    const stored = await Promise.all(files.map(storePrivateFile));
    const rows = await db
      .insert(proofFiles)
      .values(
        files.map((file, index) => ({
          proofSubmissionId: id,
          storageKey: stored[index].storageKey,
          originalName: file.name.slice(0, 255),
          contentType: file.type,
          sizeBytes: stored[index].sizeBytes,
          sha256: stored[index].sha256,
          scanStatus: "CLEAN",
        })),
      )
      .returning();
    return Response.json({ data: serialize(rows) }, { status: 201 });
  },
);
