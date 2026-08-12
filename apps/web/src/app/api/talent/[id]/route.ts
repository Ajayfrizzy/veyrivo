import { getPublicTalent } from "@/features/talent/server/queries";
import { ApiError, withApi } from "@/server/http/errors";

export const GET = withApi(
  async (_request: Request, context: { params: Promise<{ id: string }> }) => {
    const { id } = await context.params;
    const talent = await getPublicTalent(id);
    if (!talent)
      throw new ApiError(404, "TALENT_NOT_FOUND", "Public talent profile was not found.");
    return Response.json({ data: talent });
  },
);
