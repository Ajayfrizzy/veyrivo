import { ApiError } from "../../../server/http/errors";

type PublicationProfile = {
  displayName: string;
  headline: string | null;
  primaryRole: string | null;
  bio: string | null;
  skills: string[];
};

export function getMissingPublicationFields(profile: PublicationProfile) {
  const missing: string[] = [];
  if (!profile.displayName.trim()) missing.push("display name");
  if (!profile.headline?.trim() && !profile.primaryRole?.trim())
    missing.push("professional headline or primary role");
  if (!profile.bio?.trim()) missing.push("bio");
  if (!profile.skills.some((skill) => skill.trim())) missing.push("at least one skill");
  return missing;
}

export function assertProfileCanBePublished(profile: PublicationProfile) {
  const missingFields = getMissingPublicationFields(profile);
  if (missingFields.length)
    throw new ApiError(
      422,
      "PROFILE_INCOMPLETE",
      `Complete your profile before publishing. Add: ${missingFields.join(", ")}.`,
      { missingFields },
    );
}
