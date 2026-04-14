import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { getSession, destroySession } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete account and all associated data (access_log cascades)
  db.delete(accounts).where(eq(accounts.id, session.accountId)).run();

  await destroySession();

  return NextResponse.json({ success: true });
}
