import { and, count, desc, eq, gt, gte, ilike, lte, or, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { jobListings, profiles, proposals } from "@/server/db/schema";
import type { z } from "zod";
import type { listingQuerySchema } from "./schemas";

export async function listPublicListings(input: z.infer<typeof listingQuerySchema>) {
  const conditions = [eq(jobListings.status, "OPEN"), gt(jobListings.proposalDeadline, new Date())];
  if (input.query) conditions.push(or(ilike(jobListings.title, `%${input.query}%`), ilike(jobListings.description, `%${input.query}%`))!);
  if (input.category) conditions.push(eq(jobListings.category, input.category));
  if (input.skill) conditions.push(sql`${jobListings.skills} ? ${input.skill.toLowerCase()}`);
  if (input.minBudget) conditions.push(gte(jobListings.budgetMax, BigInt(input.minBudget)));
  if (input.maxBudget) conditions.push(lte(jobListings.budgetMin, BigInt(input.maxBudget)));
  if (input.deadlineBefore) conditions.push(lte(jobListings.proposalDeadline, input.deadlineBefore));
  if (input.cursor) conditions.push(input.sort === "budget" ? lte(jobListings.budgetMax, BigInt(input.cursor)) : lte(jobListings.publishedAt, new Date(input.cursor)));
  const proposalCounts = db.select({ listingId: proposals.listingId, value: count(proposals.id).as("proposal_count") }).from(proposals).where(eq(proposals.status, "SUBMITTED")).groupBy(proposals.listingId).as("proposal_counts");
  const records = await db.select({ listing: jobListings, client: { displayName: profiles.displayName, headline: profiles.headline, countryCode: profiles.countryCode }, proposalCount: sql<number>`coalesce(${proposalCounts.value}, 0)` }).from(jobListings).innerJoin(profiles, eq(jobListings.clientUserId, profiles.userId)).leftJoin(proposalCounts, eq(jobListings.id, proposalCounts.listingId)).where(and(...conditions)).orderBy(input.sort === "budget" ? desc(jobListings.budgetMax) : desc(jobListings.publishedAt), desc(jobListings.id)).limit(input.limit + 1);
  const hasMore = records.length > input.limit;
  const data = records.slice(0, input.limit);
  const last = data.at(-1);
  return { data, nextCursor: hasMore && last ? (input.sort === "budget" ? last.listing.budgetMax.toString() : last.listing.publishedAt?.toISOString()) : null };
}

export async function getPublicListing(id: string) {
  const proposalCounts = db.select({ listingId: proposals.listingId, value: count(proposals.id).as("proposal_count") }).from(proposals).where(eq(proposals.status, "SUBMITTED")).groupBy(proposals.listingId).as("proposal_counts");
  const [record] = await db.select({ listing: jobListings, client: { displayName: profiles.displayName, headline: profiles.headline, countryCode: profiles.countryCode, bio: profiles.bio }, proposalCount: sql<number>`coalesce(${proposalCounts.value}, 0)` }).from(jobListings).innerJoin(profiles, eq(jobListings.clientUserId, profiles.userId)).leftJoin(proposalCounts, eq(jobListings.id, proposalCounts.listingId)).where(eq(jobListings.id, id)).limit(1);
  return record;
}
