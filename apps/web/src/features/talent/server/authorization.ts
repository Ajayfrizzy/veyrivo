export function canModifyPortfolio(ownerUserId: string, actorUserId: string) {
  return ownerUserId === actorUserId;
}
