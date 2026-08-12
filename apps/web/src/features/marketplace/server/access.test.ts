import { describe, expect, it } from "vitest";
import { canAccessProposalThread, canShortlistProposal } from "./authorization";
import { proposalMessageInputSchema, shortlistInputSchema } from "./schemas";

describe("proposal access rules", () => {
  it("allows only the listing client and proposal worker into a clarification thread", () => {
    expect(canAccessProposalThread("client", "worker", "client")).toBe(true);
    expect(canAccessProposalThread("client", "worker", "worker")).toBe(true);
    expect(canAccessProposalThread("client", "worker", "other")).toBe(false);
  });

  it("allows only the client to shortlist a submitted proposal", () => {
    expect(canShortlistProposal("client", "client", "SUBMITTED")).toBe(true);
    expect(canShortlistProposal("client", "worker", "SUBMITTED")).toBe(false);
    expect(canShortlistProposal("client", "client", "REJECTED")).toBe(false);
  });

  it("validates shortlist and message payloads", () => {
    expect(shortlistInputSchema.parse({ shortlisted: true })).toEqual({ shortlisted: true });
    expect(
      proposalMessageInputSchema.parse({ body: "  Can we clarify the review timing?  " }).body,
    ).toBe("Can we clarify the review timing?");
    expect(() => proposalMessageInputSchema.parse({ body: "x".repeat(2001) })).toThrow();
  });
});
