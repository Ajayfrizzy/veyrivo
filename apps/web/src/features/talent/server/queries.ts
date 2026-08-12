import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { z } from "zod";
import { db } from "@/server/db";
import { portfolioItems, profiles } from "@/server/db/schema";
import { getReputationSummaries, getReputationSummary } from "@/features/reputation/server/queries";
import { toPublicPortfolioItem, toPublicTalentProfile } from "./public-profile";
import type { talentQuerySchema } from "./schemas";

export async function getPublicTalent(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.userId, userId), eq(profiles.isPublic, true)))
    .limit(1);
  if (!profile) return null;
  const [portfolio, reputation] = await Promise.all([
    db
      .select()
      .from(portfolioItems)
      .where(eq(portfolioItems.userId, userId))
      .orderBy(desc(portfolioItems.createdAt)),
    getReputationSummary(userId),
  ]);
  return {
    profile: toPublicTalentProfile(profile),
    portfolio: portfolio.map(toPublicPortfolioItem),
    reputation,
  };
}

export async function listTalent(input: z.infer<typeof talentQuerySchema>) {
  const conditions = [eq(profiles.isPublic, true)];
  if (input.query)
    conditions.push(
      or(
        ilike(profiles.displayName, `%${input.query}%`),
        ilike(profiles.headline, `%${input.query}%`),
        ilike(profiles.primaryRole, `%${input.query}%`),
        sql`${profiles.skills}::text ILIKE ${`%${input.query}%`}`,
      )!,
    );
  if (input.skill) conditions.push(sql`${profiles.skills} ? ${input.skill.toLowerCase()}`);
  if (input.role) conditions.push(ilike(profiles.primaryRole, `%${input.role}%`));
  if (input.category) conditions.push(sql`${profiles.preferredWorkCategories} ? ${input.category}`);
  if (input.availability) conditions.push(eq(profiles.availability, input.availability));

  const profileRows = await db
    .select()
    .from(profiles)
    .where(and(...conditions))
    .orderBy(desc(profiles.updatedAt))
    .limit(100);
  const reputations = await getReputationSummaries(profileRows.map((profile) => profile.userId));
  const portfolioRows = profileRows.length
    ? await db
        .select()
        .from(portfolioItems)
        .where(
          sql`${portfolioItems.userId} in (${sql.join(
            profileRows.map((profile) => sql`${profile.userId}`),
            sql`, `,
          )})`,
        )
        .orderBy(desc(portfolioItems.createdAt))
    : [];
  const portfolioByUser = new Map<string, typeof portfolioRows>();
  for (const item of portfolioRows) {
    const items = portfolioByUser.get(item.userId) ?? [];
    if (items.length < 2) items.push(item);
    portfolioByUser.set(item.userId, items);
  }
  const records = profileRows
    .map((profile) => ({
      profile: toPublicTalentProfile(profile),
      reputation: reputations.get(profile.userId)!,
      portfolioPreview: (portfolioByUser.get(profile.userId) ?? []).map(toPublicPortfolioItem),
    }))
    .filter((record) => record.reputation.completedJobs >= input.minCompletedJobs)
    .sort((left, right) => {
      if (input.sort === "completed")
        return right.reputation.completedJobs - left.reputation.completedJobs;
      if (input.sort === "recent")
        return right.profile.updatedAt.getTime() - left.profile.updatedAt.getTime();
      return (
        (right.reputation.averageRating ?? 0) - (left.reputation.averageRating ?? 0) ||
        right.reputation.completedJobs - left.reputation.completedJobs
      );
    });
  return records.slice(0, input.limit);
}
