import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://proofpay:proofpay_local@127.0.0.1:5433/proofpay",
  },
  strict: true,
  verbose: true,
});
