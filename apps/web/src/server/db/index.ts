import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://proofpay:proofpay_local@127.0.0.1:5433/proofpay";

const globalDatabase = globalThis as typeof globalThis & { proofPaySql?: ReturnType<typeof postgres> };
const client = globalDatabase.proofPaySql ?? postgres(databaseUrl, { max: process.env.NODE_ENV === "production" ? 10 : 3, prepare: false });

if (process.env.NODE_ENV !== "production") globalDatabase.proofPaySql = client;

export const db = drizzle(client, { schema });
export const sqlClient = client;
export { schema };
