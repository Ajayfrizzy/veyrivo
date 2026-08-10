export const FEE_POLICY_VERSION = "2026-07-v1";
export const CLIENT_FEE_BPS = 300n;
export const WORKER_FEE_BPS = 200n;
export const BPS_DENOMINATOR = 10_000n;
export const MIN_NETWORK_RESERVE = 20_000_000n;
export const NETWORK_RESERVE_BPS = 1n;

const ceilDiv = (value: bigint, divisor: bigint) =>
  (value + divisor - 1n) / divisor;

export function parseSmallestUnit(value: string) {
  if (!/^[1-9][0-9]*$/.test(value))
    throw new Error(
      "Amount must be a positive integer in the asset's smallest unit.",
    );
  return BigInt(value);
}

export function calculateFees(subtotal: bigint) {
  if (subtotal <= 0n) throw new Error("Subtotal must be positive.");
  const clientFee = ceilDiv(subtotal * CLIENT_FEE_BPS, BPS_DENOMINATOR);
  const workerFee = (subtotal * WORKER_FEE_BPS) / BPS_DENOMINATOR;
  const calculatedReserve = ceilDiv(
    subtotal * NETWORK_RESERVE_BPS,
    BPS_DENOMINATOR,
  );
  const networkReserve =
    calculatedReserve > MIN_NETWORK_RESERVE
      ? calculatedReserve
      : MIN_NETWORK_RESERVE;
  return {
    subtotal,
    clientFee,
    workerFee,
    networkReserve,
    totalFunding: subtotal + clientFee + networkReserve,
    workerNet: subtotal - workerFee,
    clientFeeBps: Number(CLIENT_FEE_BPS),
    workerFeeBps: Number(WORKER_FEE_BPS),
    policyVersion: FEE_POLICY_VERSION,
  };
}

export const serializeFees = (fees: ReturnType<typeof calculateFees>) =>
  Object.fromEntries(
    Object.entries(fees).map(([key, value]) => [
      key,
      typeof value === "bigint" ? value.toString() : value,
    ]),
  );
