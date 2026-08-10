import { ApiError } from "../http/errors";

export function requireRole(role: string, allowed: string[]) {
  if (!allowed.includes(role)) throw new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action.");
}
