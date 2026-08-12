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

  it("uses worker submission timing for on-time milestones", () => {
    const dueAt = new Date("2026-01-10T00:00:00Z");
    const summary = calculateReputation({
      completedJobs: [
        { id: "job-1", clientUserId: "client-a" },
        { id: "job-2", clientUserId: "client-a" },
        { id: "job-3", clientUserId: "client-b" },
      ],
      releasedMilestones: [
        { dueAt, submittedAt: new Date("2026-01-09T00:00:00Z") },
        { dueAt, submittedAt: new Date("2026-01-10T00:00:00Z") },
        { dueAt, submittedAt: new Date("2026-01-11T00:00:00Z") },
      ],
      ratings: [5, 4],
      identityVerified: true,
    });
    expect(summary).toMatchObject({
      averageRating: 4.5,
      reviewCount: 2,
      completedJobs: 3,
      completedMilestones: 3,
      onTimeRate: 67,
      repeatClients: 1,
      verifiedWorkCount: 3,
      identityVerified: true,
    });
  });

  it("excludes released milestones that have no submission timestamp", () => {
    const dueAt = new Date("2026-01-10T00:00:00Z");
    const summary = calculateReputation({
      completedJobs: [],
      releasedMilestones: [
        { dueAt, submittedAt: new Date("2026-01-09T00:00:00Z") },
        { dueAt, submittedAt: null },
      ],
      ratings: [],
      identityVerified: false,
    });
    expect(summary.completedMilestones).toBe(2);
    expect(summary.onTimeRate).toBe(100);

    expect(
      calculateReputation({
        completedJobs: [],
        releasedMilestones: [{ dueAt, submittedAt: null }],
        ratings: [],
        identityVerified: false,
      }).onTimeRate,
    ).toBeNull();
  });

  it("is not changed by later milestone updates", () => {
    const milestone = {
      dueAt: new Date("2026-01-10T00:00:00Z"),
      submittedAt: new Date("2026-01-09T00:00:00Z"),
      updatedAt: new Date("2026-01-09T00:00:00Z"),
    };
    const reputation = () =>
      calculateReputation({
        completedJobs: [],
        releasedMilestones: [milestone],
        ratings: [],
        identityVerified: false,
      }).onTimeRate;

    expect(reputation()).toBe(100);
    milestone.updatedAt = new Date("2026-02-01T00:00:00Z");
    expect(reputation()).toBe(100);
  });

  it("validates rating range and comment length", () => {
    expect(reviewInputSchema.parse({ rating: 5, comment: "Clear delivery." }).rating).toBe(5);
    expect(() => reviewInputSchema.parse({ rating: 0 })).toThrow();
  });
});
