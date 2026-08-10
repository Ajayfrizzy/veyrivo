import { and, eq, gt } from "drizzle-orm";
import { db } from "@/server/db";
import { identityVerifications, jobPayoutDestinations, jobs, milestones, wallets } from "@/server/db/schema";
import { requireUser } from "@/server/auth/session";
import { ApiError, withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";
import { audit } from "@/server/audit";

export const POST = withApi(async (request: Request, context: RouteContext<"/api/jobs/[id]/accept">) => {
  assertSameOrigin(request); const { id } = await context.params; const { user } = await requireUser();
  const [job] = await db.select().from(jobs).where(and(eq(jobs.id, id), eq(jobs.workerUserId, user.id))).limit(1);
  if (!job) throw new ApiError(404, "JOB_NOT_FOUND", "Funded invitation was not found.");
  if (job.status !== "FUNDED_AWAITING_ACCEPTANCE") throw new ApiError(409, "JOB_STATE_CONFLICT", "The job is not ready for acceptance.");
  if (job.acceptanceExpiresAt && job.acceptanceExpiresAt <= new Date()) throw new ApiError(409, "INVITATION_EXPIRED", "This funded invitation has expired.");
  const [identity] = await db.select().from(identityVerifications).where(and(eq(identityVerifications.userId, user.id), eq(identityVerifications.status, "VERIFIED"), gt(identityVerifications.expiresAt, new Date()))).limit(1);
  if (!identity) throw new ApiError(403, "IDENTITY_VERIFICATION_REQUIRED", "Complete identity verification before accepting funded work.");
  const [wallet] = await db.select().from(wallets).where(and(eq(wallets.userId, user.id), eq(wallets.isDefaultPayout, true), eq(wallets.status, "VERIFIED"))).limit(1);
  if (!wallet) throw new ApiError(403, "PAYOUT_WALLET_REQUIRED", "Verify a payout wallet before accepting funded work.");
  await db.transaction(async tx => { await tx.insert(jobPayoutDestinations).values({ jobId: job.id, workerUserId: user.id, walletId: wallet.id, network: wallet.network, address: wallet.address }); await tx.update(jobs).set({ status: "IN_PROGRESS", acceptedAt: new Date(), updatedAt: new Date() }).where(eq(jobs.id, job.id)); const [first] = await tx.select().from(milestones).where(eq(milestones.jobId, job.id)).orderBy(milestones.sequence).limit(1); if (first) await tx.update(milestones).set({ status: "ACTIVE", updatedAt: new Date() }).where(eq(milestones.id, first.id)); });
  await audit(request, { actorUserId: user.id, action: "job.accepted", entityType: "job", entityId: job.id });
  return Response.json({ data: { accepted: true } });
});
