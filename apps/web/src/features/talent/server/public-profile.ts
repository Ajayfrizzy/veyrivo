import type { portfolioItems, profiles } from "@/server/db/schema";

export type ProfileRecord = typeof profiles.$inferSelect;

export function toPublicTalentProfile(profile: ProfileRecord) {
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    headline: profile.headline,
    bio: profile.bio,
    primaryRole: profile.primaryRole,
    skills: profile.skills,
    experienceLevel: profile.experienceLevel,
    yearsExperience: profile.yearsExperience,
    languages: profile.languages,
    availability: profile.availability,
    preferredWorkCategories: profile.preferredWorkCategories,
    countryCode: profile.countryCode,
    timezone: profile.timezone,
    githubUrl: profile.githubUrl,
    websiteUrl: profile.websiteUrl,
    linkedinUrl: profile.linkedinUrl,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function toPublicPortfolioItem(item: typeof portfolioItems.$inferSelect) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    projectUrl: item.projectUrl,
    githubUrl: item.githubUrl,
    skills: item.skills,
    projectRole: item.projectRole,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
