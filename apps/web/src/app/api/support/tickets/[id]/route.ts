import { requireUser } from "@/server/auth/session";
import { withApi } from "@/server/http/errors";
import { requireOwnedTicket } from "@/features/support/server/access";
import { ticketDetail } from "@/features/support/server/queries";
import { serialize } from "@/server/serialize";

export const GET = withApi(
  async (_request: Request, context: RouteContext<"/api/support/tickets/[id]">) => {
    const { user } = await requireUser();
    const { id } = await context.params;
    await requireOwnedTicket(id, user.id);
    return Response.json({ data: serialize(await ticketDetail(id, false)) });
  },
);
