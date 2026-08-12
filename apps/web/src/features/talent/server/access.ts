import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { portfolioItems } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
export { canModifyPortfolio } from "./authorization";

export async function requirePortfolioOwner(itemId: string, userId: string) {
  const [item] = await db
    .select()
    .from(portfolioItems)
    .where(and(eq(portfolioItems.id, itemId), eq(portfolioItems.userId, userId)))
    .limit(1);
  if (!item) throw new ApiError(404, "PORTFOLIO_ITEM_NOT_FOUND", "Portfolio item was not found.");
  return item;
}
