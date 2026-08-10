import { and, eq, isNull, lte } from "drizzle-orm";
import { db } from "@/server/db";
import { securityHolds, wallets } from "@/server/db/schema";
import { ApiError, withApi } from "@/server/http/errors";

export const POST = withApi(async (request: Request) => {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) throw new ApiError(401, "CRON_UNAUTHORIZED", "A valid cron credential is required.");
  const holds = await db.select().from(securityHolds).where(and(eq(securityHolds.type, "PAYOUT_WALLET_CHANGE"), isNull(securityHolds.releasedAt), lte(securityHolds.expiresAt, new Date())));
  let released = 0;
  for (const hold of holds) await db.transaction(async tx => { const walletId = hold.reason.split(" ").at(-1); if (!walletId) return; await tx.update(wallets).set({ isDefaultPayout: false, updatedAt: new Date() }).where(eq(wallets.userId, hold.userId)); await tx.update(wallets).set({ status: "VERIFIED", isDefaultPayout: true, updatedAt: new Date() }).where(and(eq(wallets.id, walletId), eq(wallets.userId, hold.userId), eq(wallets.status, "LOCKED"))); await tx.update(securityHolds).set({ releasedAt: new Date() }).where(eq(securityHolds.id, hold.id)); released++; });
  return Response.json({ data: { released } });
});
