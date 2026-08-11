import { revokeCurrentSession } from "@/server/auth/session";
import { withApi } from "@/server/http/errors";
import { assertSameOrigin } from "@/server/http/security";

export const POST = withApi(async (request: Request) => {
  assertSameOrigin(request);
  await revokeCurrentSession();
  return new Response(null, { status: 204 });
});
