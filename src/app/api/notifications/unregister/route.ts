import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { getSession } from "@/lib/session";
import { eq } from "drizzle-orm";

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  db.update(accounts)
    .set({ apnsToken: null })
    .where(eq(accounts.id, session.accountId))
    .run();

  return NextResponse.json({ success: true });
}
