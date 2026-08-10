import { db } from "@/server/db";
import { notifications } from "@/server/db/schema";

export async function notify(userId: string, type: string, title: string, body: string, href: string) {
  await db.insert(notifications).values({ userId, type, title, body, href });
}
