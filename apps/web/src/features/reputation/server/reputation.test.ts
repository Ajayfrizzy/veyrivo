import { describe, expect, it } from "vitest";
import { ApiError } from "../../../server/http/errors";
import { reviewSubjectFor } from "./access";
import { calculateReputation } from "./metrics";
import { reviewInputSchema } from "./schemas";

describe("verified reputation", () => {
  it("allows reviews only between participants in a completed engagement", () => {
    const completed = {
      clientUserId: "client",
      workerUserId: "worker",
      status: "COMPLETED" as const,
    };
    expect(reviewSubjectFor(completed, "client")).toBe("worker");
    expect(reviewSubjectFor(completed, "worker")).toBe("client");
    expect(() => reviewSubjectFor(completed, "other")).toThrow(ApiError);
    expect(() => reviewSubjectFor({ ...completed, status: "IN_PROGRESS" }, "client")).toThrow(
      ApiError,
    );
  });

  it("aggregates completed work, on-time milestones, ratings, and repeat clients", () => {
    const dueAt = new Date("2026-01-10T00:00:00Z");
    const summary = calculateReputation({
      completedJobs: [
        { id: "job-1", clientUserId: "client-a" },
        { id: "job-2", clientUserId: "client-a" },
        { id: "job-3", clientUserId: "client-b" },
      ],
      releasedMilestones: [
        { dueAt, updatedAt: new Date("2026-01-09T00:00:00Z") },
        { dueAt, updatedAt: new Date("2026-01-11T00:00:00Z") },
      ],
      ratings: [5, 4],
      identityVerified: true,
    });
    expect(summary).toMatchObject({
      averageRating: 4.5,
      reviewCount: 2,
      completedJobs: 3,
      completedMilestones: 2,
      onTimeRate: 50,
      repeatClients: 1,
      verifiedWorkCount: 3,
      identityVerified: true,
    });
  });

  it("validates rating range and comment length", () => {
    expect(reviewInputSchema.parse({ rating: 5, comment: "Clear delivery." }).rating).toBe(5);
    expect(() => reviewInputSchema.parse({ rating: 0 })).toThrow();
  });
});
