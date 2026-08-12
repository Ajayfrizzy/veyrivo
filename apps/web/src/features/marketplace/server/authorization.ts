export function canAccessProposalThread(
  clientUserId: string,
  workerUserId: string,
  actorUserId: string,
) {
  return actorUserId === clientUserId || actorUserId === workerUserId;
}

export function canShortlistProposal(
  clientUserId: string,
  actorUserId: string,
  proposalStatus: string,
) {
  return clientUserId === actorUserId && proposalStatus === "SUBMITTED";
}
