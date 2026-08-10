import { getCurrentUser } from "@/server/auth/session";
import { withApi } from "@/server/http/errors";

export const GET = withApi(async () => {
  const current = await getCurrentUser();
  if (!current) return Response.json({ data: null });
  const user = { ...current.user, passwordHash: undefined };
  return Response.json({ data: { user, profile: current.profile } });
});
