import { eq, sql } from "drizzle-orm";
import { db, sqlClient } from "./index";
import { hashPassword } from "../auth/password";
import {
  identityVerifications,
  jobListings,
  jobs,
  milestones,
  profiles,
  proposalMilestones,
  proposals,
  users,
  wallets,
} from "./schema";

async function main() {
  const passwordHash = await hashPassword("VeyrivoDemo!2026");
  const demoUsers = [
    { email: "client@veyrivo.local", displayName: "Alex Morgan", role: "USER" as const },
    { email: "worker@veyrivo.local", displayName: "Maya Chen", role: "USER" as const },
    { email: "admin@veyrivo.local", displayName: "Jordan Okafor", role: "DISPUTE_ADMIN" as const },
    { email: "support@veyrivo.local", displayName: "Amara Support", role: "SUPPORT" as const },
  ];

  for (const item of demoUsers) {
    const [found] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${item.email}`)
      .limit(1);
    const [user] = found
      ? await db
          .update(users)
          .set({
            passwordHash,
            status: "ACTIVE",
            systemRole: item.role,
            emailVerifiedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, found.id))
          .returning()
      : await db
          .insert(users)
          .values({
            email: item.email,
            passwordHash,
            emailVerifiedAt: new Date(),
            status: "ACTIVE",
            systemRole: item.role,
          })
          .returning();
    await db
      .insert(profiles)
      .values({
        userId: user.id,
        displayName: item.displayName,
        headline:
          item.role === "USER" ? "Product and digital delivery specialist" : "Veyrivo operations",
        bio: "Experienced professional delivering clear, verifiable outcomes through milestone-based work.",
        countryCode: "NG",
      })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          displayName: item.displayName,
          headline:
            item.role === "USER" ? "Product and digital delivery specialist" : "Veyrivo operations",
          bio: "Experienced professional delivering clear, verifiable outcomes through milestone-based work.",
          updatedAt: new Date(),
        },
      });
    const [existingIdentity] = await db
      .select()
      .from(identityVerifications)
      .where(eq(identityVerifications.userId, user.id))
      .limit(1);
    if (!existingIdentity)
      await db.insert(identityVerifications).values({
        userId: user.id,
        tier: 1,
        provider: "sandbox",
        providerReference: `seed:${user.id}`,
        status: "VERIFIED",
        countryCode: "NG",
        riskLevel: "LOW",
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 86_400_000),
      });
  }

  const [client] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = 'client@veyrivo.local'`)
    .limit(1);
  const [worker] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = 'worker@veyrivo.local'`)
    .limit(1);
  const [existingJob] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.reference, "PP-DEMO-1048"))
    .limit(1);
  if (!existingJob) {
    const [wallet] = await db
      .insert(wallets)
      .values({
        userId: worker.id,
        network: "testnet",
        address: "ckt1qseedworkerpayout000000000000000000000000000000000000",
        purpose: "PAYOUT",
        status: "VERIFIED",
        isDefaultPayout: true,
        verifiedAt: new Date(),
      })
      .returning();
    const [job] = await db
      .insert(jobs)
      .values({
        reference: "PP-DEMO-1048",
        clientUserId: client.id,
        workerUserId: worker.id,
        workerEmail: worker.email,
        title: "Checkout experience redesign",
        description:
          "Design and validate a clearer checkout flow with responsive production-ready screens.",
        subtotal: 150_000_000_000n,
        clientFee: 4_500_000_000n,
        networkReserve: 20_000_000n,
        status: "IN_PROGRESS",
        fundedAt: new Date(),
        acceptedAt: new Date(),
        acceptanceExpiresAt: new Date(Date.now() + 7 * 86_400_000),
      })
      .returning();
    await db.insert(milestones).values([
      {
        jobId: job.id,
        sequence: 1,
        title: "Research and wireframes",
        description: "Map the flow and provide validated wireframes.",
        amount: 50_000_000_000n,
        dueAt: new Date(Date.now() + 7 * 86_400_000),
        evidenceRequirements: "Wireframes and research summary",
        status: "ACTIVE",
      },
      {
        jobId: job.id,
        sequence: 2,
        title: "High-fidelity screens",
        description: "Create responsive desktop and mobile screens.",
        amount: 65_000_000_000n,
        dueAt: new Date(Date.now() + 14 * 86_400_000),
        evidenceRequirements: "Figma link and exported screens",
      },
      {
        jobId: job.id,
        sequence: 3,
        title: "Handoff and revisions",
        description: "Resolve feedback and provide implementation notes.",
        amount: 35_000_000_000n,
        dueAt: new Date(Date.now() + 21 * 86_400_000),
        evidenceRequirements: "Final design link and handoff notes",
      },
    ]);
    void wallet;
  }

  const [existingListing] = await db
    .select()
    .from(jobListings)
    .where(eq(jobListings.title, "Build a responsive analytics dashboard"))
    .limit(1);
  if (!existingListing) {
    const [listing] = await db
      .insert(jobListings)
      .values({
        clientUserId: client.id,
        title: "Build a responsive analytics dashboard",
        description:
          "Design and implement a responsive operations dashboard with accessible charts, filters, empty states, and a documented component handoff.",
        category: "DEVELOPMENT",
        skills: ["react", "typescript", "data visualization"],
        budgetMin: 120_000_000_000n,
        budgetMax: 180_000_000_000n,
        proposalDeadline: new Date(Date.now() + 10 * 86_400_000),
        status: "OPEN",
        publishedAt: new Date(),
      })
      .returning();
    const [proposal] = await db
      .insert(proposals)
      .values({
        listingId: listing.id,
        workerUserId: worker.id,
        coverLetter:
          "I will build the dashboard as an accessible component system, validate the responsive states, and provide a concise implementation handoff with tested interactions.",
        totalBid: 150_000_000_000n,
        estimatedDurationDays: 21,
      })
      .returning();
    await db.insert(proposalMilestones).values([
      {
        proposalId: proposal.id,
        sequence: 1,
        title: "Dashboard foundation",
        description: "Responsive shell, navigation, tokens, and data contracts.",
        amount: 60_000_000_000n,
        evidenceRequirements: "Preview URL and source commit",
        deliveryDays: 7,
      },
      {
        proposalId: proposal.id,
        sequence: 2,
        title: "Charts and filters",
        description: "Accessible charts, filters, loading states, and empty states.",
        amount: 60_000_000_000n,
        evidenceRequirements: "Preview URL and interaction recording",
        deliveryDays: 14,
      },
      {
        proposalId: proposal.id,
        sequence: 3,
        title: "Testing and handoff",
        description: "Responsive verification, fixes, and implementation documentation.",
        amount: 30_000_000_000n,
        evidenceRequirements: "Test report and handoff document",
        deliveryDays: 21,
      },
    ]);
    await db.insert(jobListings).values([
      {
        clientUserId: client.id,
        title: "Create a fintech onboarding content system",
        description:
          "Develop concise onboarding copy, validation guidance, and reusable content patterns for a financial product across web and mobile.",
        category: "WRITING",
        skills: ["ux writing", "fintech", "content design"],
        budgetMin: 45_000_000_000n,
        budgetMax: 80_000_000_000n,
        proposalDeadline: new Date(Date.now() + 6 * 86_400_000),
        status: "OPEN",
        publishedAt: new Date(Date.now() - 86_400_000),
      },
      {
        clientUserId: client.id,
        title: "Research merchant payout workflows",
        description:
          "Interview representative merchants and synthesize operational pain points, opportunity areas, and a prioritized service blueprint.",
        category: "DESIGN",
        skills: ["ux research", "service design"],
        budgetMin: 90_000_000_000n,
        budgetMax: 130_000_000_000n,
        proposalDeadline: new Date(Date.now() - 86_400_000),
        status: "CLOSED",
        publishedAt: new Date(Date.now() - 12 * 86_400_000),
        closedAt: new Date(),
      },
    ]);
  }

  console.log("Seed complete. Demo password: VeyrivoDemo!2026");
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sqlClient.end();
  });
