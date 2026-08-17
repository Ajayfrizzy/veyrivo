import { describe, expect, it } from "vitest";
import { createJobSchema } from "./schemas";

const base = {
  title: "Build a reporting dashboard",
  description: "Deliver a complete reporting dashboard with documented acceptance checks.",
  asset: "CKB",
  assetDecimals: 8,
  feeQuoteId: "d8b272c8-cb94-4a03-a953-30bfda18d166",
  milestones: [
    {
      title: "Dashboard delivery",
      description: "Deliver the complete dashboard implementation.",
      acceptanceCriteria: "All agreed reporting views pass review.",
      amount: "100",
      dueAt: new Date(Date.now() + 86_400_000),
      evidenceRequirements: "Preview URL and test report",
    },
  ],
};

describe("direct job creation", () => {
  it("accepts an existing professional by internal user ID", () => {
    const workerUserId = "6bd7a902-4d40-44df-85f8-3c4180c5f163";
    expect(createJobSchema.parse({ ...base, workerUserId }).workerUserId).toBe(workerUserId);
  });

  it("keeps external email invitations as a separate mode", () => {
    expect(createJobSchema.parse({ ...base, workerEmail: "Worker@Example.com" }).workerEmail).toBe(
      "worker@example.com",
    );
  });

  it("rejects missing or ambiguous worker identity", () => {
    expect(() => createJobSchema.parse(base)).toThrow();
    expect(() =>
      createJobSchema.parse({
        ...base,
        workerUserId: "6bd7a902-4d40-44df-85f8-3c4180c5f163",
        workerEmail: "worker@example.com",
      }),
    ).toThrow();
  });
});
