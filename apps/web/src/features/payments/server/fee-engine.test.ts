import { describe, expect, it } from "vitest";
import { calculateFees, parseSmallestUnit } from "./fee-engine";

describe("fee engine", () => {
  it("calculates configured client and worker fees using integers", () => {
    const fees = calculateFees(10_000_000_000n);
    expect(fees.clientFee).toBe(300_000_000n);
    expect(fees.workerFee).toBe(200_000_000n);
    expect(fees.workerNet).toBe(9_800_000_000n);
    expect(fees.totalFunding).toBe(10_320_000_000n);
  });

  it("uses the minimum network reserve for small jobs", () => expect(calculateFees(100_000_000n).networkReserve).toBe(20_000_000n));
  it("rejects decimals, zero, negatives, and leading zeroes", () => ["1.2", "0", "-1", "01"].forEach(value => expect(() => parseSmallestUnit(value)).toThrow()));
});
