import { randomUUID } from "node:crypto";

export type IdentityStart = {
  reference: string;
  redirectUrl?: string;
  status: "PENDING" | "VERIFIED";
};
export interface IdentityProvider {
  start(input: { userId: string; email: string; countryCode: string }): Promise<IdentityStart>;
}

class SandboxIdentityProvider implements IdentityProvider {
  async start(input: {
    userId: string;
    email: string;
    countryCode: string;
  }): Promise<IdentityStart> {
    return {
      reference: `sandbox_${randomUUID()}`,
      redirectUrl: `/identity/sandbox?country=${input.countryCode}`,
      status: "PENDING",
    };
  }
}

export const identityProvider: IdentityProvider = new SandboxIdentityProvider();
