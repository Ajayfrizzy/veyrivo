import { db } from "./db";
import { auditLogs } from "./db/schema";
import { clientIpHash } from "./http/security";

export async function audit(
  request: Request,
  input: {
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await db.insert(auditLogs).values({
    ...input,
    actorUserId: input.actorUserId ?? null,
    entityId: input.entityId ?? null,
    ipHash: clientIpHash(request),
    metadata: input.metadata ?? {},
  });
}
