export function canModifyPortfolio(ownerUserId: string, actorUserId: string) {
  return ownerUserId === actorUserId;
}

export function canViewTalentProfile(
  isPublic: boolean,
  profileUserId: string,
  actorUserId?: string,
) {
  return isPublic || profileUserId === actorUserId;
}
